import React, { useEffect, useRef, useState } from "react";
import { Box, Stack, useTheme, useMediaQuery, Alert, CircularProgress } from "@mui/material";

// Import services dengan error handling
let DataService;
let supabase;

try {
  const services = require("../../../services/DataService.js");
  DataService = services.DataService;
} catch (error) {
  console.error("Failed to load DataService:", error);
  DataService = null;
}

try {
  const supabaseModule = require("../../../lib/supabase.js");
  supabase = supabaseModule.supabase;
} catch (error) {
  console.error("Failed to load supabase:", error);
  supabase = null;
}

import { useSettings } from "../../../context/SettingsContext.jsx";
import { fmtIDR, todayStr } from "../../../utils/helpers.js";

// Import sections
import HeaderSection from "./sections/HeaderSection.jsx";
import SummaryTiles from "./sections/SummaryTiles.jsx";
import StockConditionCard from "./sections/StockConditionCard.jsx";
import FinancialSummaryCard from "./sections/FinancialSummaryCard.jsx";
import SevenDaysChartCard from "./sections/SevenDaysChartCard.jsx";
import AnalyticsSection from "./sections/AnalyticsSection.jsx";
import RecentTransactionsTable from "./sections/RecentTransactionsTable.jsx";

// Import new sections
import StockPredictionCard from "./sections/StockPredictionCard.jsx";
import BusinessIntelligenceCard from "./sections/BusinessIntelligenceCard.jsx";
import KpiStrip from "./sections/KpiStrip.jsx";

import CustomerHistoryModal from "./modals/CustomerHistoryModal.jsx";
import ErrorBanner from "./ui/ErrorBanner.jsx";

// Helper functions
const startOfDay = (d) => { const x = new Date(d); x.setHours(0,0,0,0); return x; };
const isoDate = (d) => startOfDay(d).toISOString().slice(0,10);

function buildLast7DaysSeries(rows = []) {
  const buckets = new Map();
  rows.forEach(r => {
    const dt = startOfDay(new Date(r.created_at || r.date || Date.now()));
    const key = isoDate(dt);
    const qty = Number(r.qty || 0);
    if (String(r.status || "").toUpperCase() === "DIBATALKAN") return;
    buckets.set(key, (buckets.get(key) || 0) + qty);
  });

  const today = startOfDay(new Date());
  const series = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = isoDate(d);
    series.push({ date: d.toISOString(), qty: buckets.get(key) || 0 });
  }
  return series;
}

// Fallback functions jika DataService tidak tersedia
const fallbackDataService = {
  getDashboardSnapshot: async () => ({
    stocks: { ISI: 0, KOSONG: 0 },
    sevenDays: [],
    receivables: 0,
    recentSales: [],
    _ts: Date.now(),
  }),
  getFinancialSummary: async () => ({
    omzet: 0, hpp: 0, laba: 0, margin: 0, totalQty: 0, transactionCount: 0
  }),
  getSalesHistory: async () => [],
  getStockPrediction: async () => null,
  getCurrentMonthBusinessIntelligence: async () => null,
  getSalesSummary: async () => ({ qty: 0, money: 0 }),
  loadSalesByDateRange: async () => [],
  getTopCustomersPeriod: async () => [],
  getComparisonsSummary: async () => ({}),
};

export default function DashboardContainer({ stocks: stocksFromApp = {} }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmallMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { settings } = useSettings();

  // State management
  const [stocks, setStocks] = useState(stocksFromApp);
  const [series7, setSeries7] = useState([]);
  const [piutang, setPiutang] = useState(0);
  const [recent, setRecent] = useState([]);
  const [financialSummary, setFinancialSummary] = useState({ 
    omzet: 0, hpp: 0, laba: 0, margin: 0, totalQty: 0, transactionCount: 0 
  });
  const [today, setToday] = useState({ qty: 0, money: 0 });
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);
  const [financialLoading, setFinancialLoading] = useState(true);

  // New state for advanced features
  const [stockPrediction, setStockPrediction] = useState(null);
  const [businessIntelligence, setBusinessIntelligence] = useState(null);
  const [advancedLoading, setAdvancedLoading] = useState(true);

  // Analytics state
  const [analytics, setAnalytics] = useState({
    topCustomers: [],
    weekly: null,
    monthly: null,
    yoy: null,
  });
  const [analyticsLoading, setAnalyticsLoading] = useState(true);

  // Service availability state
  const [dataServiceAvailable, setDataServiceAvailable] = useState(!!DataService);
  const [supabaseAvailable, setSupabaseAvailable] = useState(!!supabase);

  // Modal state
  const [openHist, setOpenHist] = useState(false);
  const [histName, setHistName] = useState("");
  const [histRows, setHistRows] = useState([]);
  const [histLoading, setHistLoading] = useState(false);
  const [histTotalQty, setHistTotalQty] = useState(0);

  const busyRef = useRef(false);
  const idleTimer = useRef(null);

  // Gunakan DataService yang tersedia atau fallback
  const currentDataService = DataService || fallbackDataService;

  // 1) Initial snapshot
  useEffect(() => {
    let alive = true;

    if (!dataServiceAvailable) {
      setLoading(false);
      setErr("DataService tidak tersedia. Menggunakan data simulasi.");
      return;
    }

    (async () => {
      try {
        const snap = await currentDataService.getDashboardSnapshot({ revalidate: true });
        if (!alive) return;

        setStocks(snap.stocks || { ISI: 0, KOSONG: 0 });
        setSeries7(snap.sevenDays || []);
        setPiutang(snap.receivables || 0);
        setRecent(snap.recentSales || []);
        setLoading(false);
      } catch (e) {
        if (!alive) return;
        setErr(e.message || "Gagal memuat dashboard");
        setLoading(false);
      }
    })();

    const onSnap = (e) => {
      const d = e?.detail || {};
      setStocks(d.stocks || { ISI: 0, KOSONG: 0 });
      setSeries7(Array.isArray(d.sevenDays) ? d.sevenDays : []);
      setPiutang(Number.isFinite(d.receivables) ? d.receivables : 0);
      setRecent(Array.isArray(d.recentSales) ? d.recentSales : []);
    };
    
    if (dataServiceAvailable) {
      window.addEventListener("dashboard:snapshot", onSnap);
    }

    return () => {
      alive = false;
      if (dataServiceAvailable) {
        window.removeEventListener("dashboard:snapshot", onSnap);
      }
    };
  }, [dataServiceAvailable, currentDataService]);

  // 2) Financial summary
  useEffect(() => {
    let alive = true;
    const calculateFinancialSummary = async () => {
      try {
        setFinancialLoading(true);
        
        const summary = await currentDataService.getFinancialSummary({
          from: '2000-01-01',
          to: todayStr(),
          hppPerUnit: Number(settings.hpp || 0)
        });

        if (!alive) return;
        setFinancialSummary(summary);
        
      } catch (error) {
        console.error('Error calculating financial summary:', error);
        
        try {
          const salesData = await currentDataService.getSalesHistory({
            from: '2000-01-01',
            to: todayStr(),
            method: "ALL",
            status: "ALL",
            limit: 10000
          });

          if (!alive) return;

          const paid = salesData.filter(sale => {
            const method = String(sale.method || '').toUpperCase();
            const status = String(sale.status || '').toUpperCase();

            if (status === 'DIBATALKAN') return false;
            if (method === 'TUNAI') return true;
            if (status === 'LUNAS') return true;
            return false;
          });

          const omzet = paid.reduce((sum, sale) => sum + (Number(sale.total) || 0), 0);
          const totalQty = paid.reduce((sum, sale) => sum + (Number(sale.qty) || 0), 0);
          const hpp = totalQty * Number(settings.hpp || 0);
          const laba = omzet - hpp;
          const margin = omzet > 0 ? Math.round((laba / omzet) * 100) : 0;

          setFinancialSummary({ 
            omzet, hpp, laba, margin, totalQty, transactionCount: paid.length 
          });
          
        } catch (fallbackError) {
          console.error('Fallback calculation also failed:', fallbackError);
          setFinancialSummary({ 
            omzet: 0, hpp: 0, laba: 0, margin: 0, totalQty: 0, transactionCount: 0 
          });
        }
      } finally {
        if (alive) {
          setFinancialLoading(false);
        }
      }
    };

    calculateFinancialSummary();
    
    return () => { alive = false; };
  }, [settings.hpp, currentDataService]);

  // 3) Advanced features data (Stock Prediction & Business Intelligence)
  useEffect(() => {
    let alive = true;

    const loadAdvancedFeatures = async () => {
      try {
        setAdvancedLoading(true);
        
        const [prediction, intelligence] = await Promise.all([
          currentDataService.getStockPrediction(30).catch(error => {
            console.error('Error loading stock prediction:', error);
            return null;
          }),
          currentDataService.getCurrentMonthBusinessIntelligence().catch(error => {
            console.error('Error loading business intelligence:', error);
            return null;
          })
        ]);

        if (!alive) return;

        setStockPrediction(prediction);
        setBusinessIntelligence(intelligence);
        
      } catch (error) {
        console.error('Error loading advanced features:', error);
      } finally {
        if (alive) {
          setAdvancedLoading(false);
        }
      }
    };

    if (dataServiceAvailable) {
      loadAdvancedFeatures();
    } else {
      setAdvancedLoading(false);
    }

    return () => { alive = false; };
  }, [dataServiceAvailable, currentDataService]);

  // 4) Realtime updates
  useEffect(() => {
    if (!supabaseAvailable || !dataServiceAvailable) {
      return;
    }

    const askRevalidate = () => {
      if (busyRef.current) return;
      busyRef.current = true;
      currentDataService.getDashboardSnapshot({ revalidate: true });

      clearTimeout(idleTimer.current);
      idleTimer.current = setTimeout(() => (busyRef.current = false), 1200);
    };

    const ch = supabase
      .channel("dashboard-rt-lite")
      .on("postgres_changes", { event: "*", schema: "public", table: "sales" }, askRevalidate)
      .on("postgres_changes", { event: "*", schema: "public", table: "stocks" }, askRevalidate)
      .subscribe();

    return () => {
      try { supabase.removeChannel(ch); } catch {}
      clearTimeout(idleTimer.current);
    };
  }, [supabaseAvailable, dataServiceAvailable, currentDataService]);

  // 5) 7-day series recomputation
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const from = new Date();
        from.setDate(from.getDate() - 6);
        from.setHours(0,0,0,0);
        const to = new Date();

        const rows = await currentDataService.loadSalesByDateRange?.(
          from.toISOString(),
          to.toISOString()
        ).catch(() => []);

        if (!alive) return;
        const last7 = buildLast7DaysSeries(rows || []);
        setSeries7(last7);
      } catch (e) {
        console.warn("[series7]", e?.message || e);
      }
    })();
    return () => { alive = false; };
  }, [recent, today, stocks, currentDataService]);

  // 6) Analytics data
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setAnalyticsLoading(true);
        const [tops, comps] = await Promise.all([
          currentDataService.getTopCustomersPeriod?.({ period: "this_month", limit: 5, onlyPaid: true }).catch(() => []),
          currentDataService.getComparisonsSummary?.({ onlyPaid: true }).catch(() => ({})),
        ]);

        if (!alive) return;

        // Calculate growth percentages
        const wk = comps?.weekly || null;
        const weeklyGrowthPct = wk && wk.last_week_qty
          ? ((Number(wk.this_week_qty || 0) - Number(wk.last_week_qty || 0)) / Number(wk.last_week_qty)) * 100
          : null;

        const mo = comps?.monthly || null;
        const monthlyGrowthQty = mo && mo.last_month_qty
          ? ((Number(mo.this_month_qty || 0) - Number(mo.last_month_qty || 0)) / Number(mo.last_month_qty)) * 100
          : null;
        const monthlyGrowthOmzet = mo && mo.last_month_value
          ? ((Number(mo.this_month_value || 0) - Number(mo.last_month_value || 0)) / Number(mo.last_month_value)) * 100
          : null;

        const yy = comps?.yoy || null;
        const yoyGrowthQty = yy && yy.last_year_qty
          ? ((Number(yy.this_year_qty || 0) - Number(yy.last_year_qty || 0)) / Number(yy.last_year_qty)) * 100
          : null;
        const yoyGrowthOmzet = yy && yy.last_year_value
          ? ((Number(yy.this_year_value || 0) - Number(yy.last_year_value || 0)) / Number(yy.last_year_value)) * 100
          : null;

        setAnalytics({
          topCustomers: tops || [],
          weekly: wk ? { ...wk, growthPct: weeklyGrowthPct } : null,
          monthly: mo ? {
            ...mo,
            growthPctQty: monthlyGrowthQty,
            growthPctOmzet: monthlyGrowthOmzet,
          } : null,
          yoy: yy ? {
            ...yy,
            growthPctQty: yoyGrowthQty,
            growthPctOmzet: yoyGrowthOmzet,
          } : null,
        });
      } catch (e) {
        console.warn("[Analytics]", e?.message || e);
      } finally {
        setAnalyticsLoading(false);
      }
    })();

    return () => { alive = false; };
  }, [currentDataService]);

  // 7) Today's sales
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const todaySum = await currentDataService.getSalesSummary({ 
          from: todayStr(), 
          to: todayStr() 
        });
        if (!alive) return;
        setToday(todaySum || { qty: 0, money: 0 });
      } catch (error) {
        console.error('Error getting today sales:', error);
      }
    })();
  }, [currentDataService]);

  // Modal handlers
  const openCustomerHistory = async (name) => {
    setHistName(name);
    setOpenHist(true);
    setHistLoading(true);
    try {
      const now = new Date();
      const s = new Date(now.getFullYear(), now.getMonth(), 1);
      s.setHours(0,0,0,0);
      const e = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      e.setHours(23,59,59,999);

      const rows = await currentDataService.getSalesHistory({
        from: s.toISOString(),
        to: e.toISOString(),
        q: name,
        limit: 500,
      });

      const filtered = (rows || []).filter(r => (r.customer || "").toLowerCase().includes((name || "").toLowerCase()));
      setHistRows(filtered);
      const totalQty = filtered.reduce((a,b)=> a + Number(b.qty || 0), 0);
      setHistTotalQty(totalQty);
    } catch (e) {
      setHistRows([]);
      setHistTotalQty(0);
    } finally {
      setHistLoading(false);
    }
  };

  const closeCustomerHistory = () => setOpenHist(false);

  // Derived values
  const isi = Number(stocks?.ISI || 0);
  const kosong = Number(stocks?.KOSONG || 0);

  // Jika DataService tidak tersedia, tampilkan pesan error yang jelas
  if (!dataServiceAvailable) {
    return (
      <Box sx={{ 
        width: '100%',
        minHeight: '100vh',
        backgroundColor: theme.palette.background.default,
        p: 3
      }}>
        <Stack spacing={3}>
          <HeaderSection />
          
          <Alert severity="error" sx={{ mb: 2 }}>
            <strong>DataService Tidak Tersedia</strong>
          </Alert>
          
          <Alert severity="warning">
            Modul DataService gagal dimuat. Hal ini bisa disebabkan oleh:
            <ul>
              <li>File DataService.js tidak ditemukan</li>
              <li>Error dalam kode DataService</li>
              <li>Masalah dalam build process</li>
            </ul>
            Silakan refresh halaman atau hubungi administrator.
          </Alert>

          {/* Tampilkan data simulasi */}
          <SummaryTiles
            isi={isi}
            kosong={kosong}
            todayQty={today.qty}
            todayMoney={fmtIDR(today.money)}
            receivablesTotal={fmtIDR(piutang)}
            loading={false}
          />

          <Box sx={{ 
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr',
            gap: 3
          }}>
            <Stack spacing={3}>
              <StockConditionCard
                isi={isi}
                kosong={kosong}
                loading={false}
              />
              
              <StockPredictionCard
                data={null}
                loading={false}
              />

              <FinancialSummaryCard
                omzet={financialSummary.omzet}
                hpp={financialSummary.hpp}
                laba={financialSummary.laba}
                margin={financialSummary.margin}
                transactionCount={financialSummary.transactionCount}
                totalQty={financialSummary.totalQty}
                loading={false}
              />
            </Stack>

            <Stack spacing={3}>
              <SevenDaysChartCard
                series={series7}
                loading={false}
              />
              
              <AnalyticsSection
                topCustomers={[]}
                weekly={null}
                monthly={null}
                loading={false}
                onOpenCustomerHistory={openCustomerHistory}
                isSmallMobile={isSmallMobile}
              />

              <RecentTransactionsTable
                rows={[]}
                loading={false}
                isSmallMobile={isSmallMobile}
              />
            </Stack>

            <Stack spacing={3}>
              <BusinessIntelligenceCard
                data={null}
                loading={false}
              />
            </Stack>
          </Box>
        </Stack>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      width: '100%',
      overflowX: 'auto',
      minHeight: '100vh',
      backgroundColor: theme.palette.background.default
    }}>
      <Stack spacing={3} sx={{ 
        minWidth: isMobile ? '800px' : 'auto',
        p: isMobile ? 2 : 3,
        width: '100%',
        maxWidth: '100%'
      }}>

        <HeaderSection />

        {err && <ErrorBanner message={err} />}

        {!supabaseAvailable && (
          <Alert severity="warning">
            Koneksi database tidak tersedia. Data mungkin tidak real-time.
          </Alert>
        )}

        {/* KPI Strip - New Component */}
        <Box sx={{ 
          minWidth: isMobile ? '800px' : 'auto',
          width: '100%'
        }}>
          <KpiStrip
            financialData={financialSummary}
            stockPrediction={stockPrediction}
            businessIntel={businessIntelligence}
            loading={loading || advancedLoading}
          />
        </Box>

        <SummaryTiles
          isi={isi}
          kosong={kosong}
          todayQty={today.qty}
          todayMoney={fmtIDR(today.money)}
          receivablesTotal={fmtIDR(piutang)}
          loading={loading}
        />

        {/* Main Content Grid */}
        <Box sx={{ 
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr',
          gap: 3,
          minWidth: isMobile ? '800px' : 'auto',
          width: '100%'
        }}>
          
          {/* Left Column - Stock & Prediction */}
          <Stack spacing={3}>
            <StockConditionCard
              isi={isi}
              kosong={kosong}
              loading={loading}
            />
            
            <StockPredictionCard
              data={stockPrediction}
              loading={advancedLoading}
            />

            <FinancialSummaryCard
              omzet={financialSummary.omzet}
              hpp={financialSummary.hpp}
              laba={financialSummary.laba}
              margin={financialSummary.margin}
              transactionCount={financialSummary.transactionCount}
              totalQty={financialSummary.totalQty}
              loading={financialLoading}
            />
          </Stack>

          {/* Middle Column - Charts & Analytics */}
          <Stack spacing={3}>
            <SevenDaysChartCard
              series={series7}
              loading={loading}
            />
            
            <AnalyticsSection
              topCustomers={analytics.topCustomers}
              weekly={analytics.weekly}
              monthly={analytics.monthly}
              loading={analyticsLoading}
              onOpenCustomerHistory={openCustomerHistory}
              isSmallMobile={isSmallMobile}
            />

            <RecentTransactionsTable
              rows={recent}
              loading={loading}
              isSmallMobile={isSmallMobile}
            />
          </Stack>

          {/* Right Column - Business Intelligence */}
          <Stack spacing={3}>
            <BusinessIntelligenceCard
              data={businessIntelligence}
              loading={advancedLoading}
            />
            
            {/* You can add more components here in the future */}
          </Stack>
        </Box>

        <CustomerHistoryModal
          open={openHist}
          customerName={histName}
          rows={histRows}
          totalQty={histTotalQty}
          loading={histLoading}
          onClose={closeCustomerHistory}
        />

      </Stack>
    </Box>
  );
}