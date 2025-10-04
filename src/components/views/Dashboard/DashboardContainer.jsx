import React, { useEffect, useRef, useState } from "react";
import { Box, Stack, useTheme, useMediaQuery } from "@mui/material";
import { DataService } from "../../../services/DataService.js";
import { supabase } from "../../../lib/supabase.js";
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

  // Analytics state
  const [analytics, setAnalytics] = useState({
    topCustomers: [],
    weekly: null,
    monthly: null,
    yoy: null,
  });
  const [analyticsLoading, setAnalyticsLoading] = useState(true);

  // Modal state
  const [openHist, setOpenHist] = useState(false);
  const [histName, setHistName] = useState("");
  const [histRows, setHistRows] = useState([]);
  const [histLoading, setHistLoading] = useState(false);
  const [histTotalQty, setHistTotalQty] = useState(0);

  const busyRef = useRef(false);
  const idleTimer = useRef(null);

  // 1) Initial snapshot
  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const snap = await DataService.getDashboardSnapshot({ revalidate: true });
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
    window.addEventListener("dashboard:snapshot", onSnap);

    return () => {
      alive = false;
      window.removeEventListener("dashboard:snapshot", onSnap);
    };
  }, []);

  // 2) Financial summary
  useEffect(() => {
    let alive = true;
    const calculateFinancialSummary = async () => {
      try {
        setFinancialLoading(true);
        
        const summary = await DataService.getFinancialSummary({
          from: '2000-01-01',
          to: todayStr(),
          hppPerUnit: Number(settings.hpp || 0)
        });

        if (!alive) return;
        setFinancialSummary(summary);
        
      } catch (error) {
        console.error('Error calculating financial summary:', error);
        
        try {
          const salesData = await DataService.getSalesHistory({
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
  }, [settings.hpp]);

  // 3) Realtime updates
  useEffect(() => {
    const askRevalidate = () => {
      if (busyRef.current) return;
      busyRef.current = true;
      DataService.getDashboardSnapshot({ revalidate: true });

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
  }, []);

  // 4) 7-day series recomputation
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const from = new Date();
        from.setDate(from.getDate() - 6);
        from.setHours(0,0,0,0);
        const to = new Date();

        const rows = await DataService.loadSalesByDateRange?.(
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
  }, [recent, today, stocks]);

  // 5) Analytics data
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setAnalyticsLoading(true);
        const [tops, comps] = await Promise.all([
          DataService.getTopCustomersPeriod?.({ period: "this_month", limit: 5, onlyPaid: true }).catch(() => []),
          DataService.getComparisonsSummary?.({ onlyPaid: true }).catch(() => ({})),
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
  }, []);

  // 6) Today's sales
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const todaySum = await DataService.getSalesSummary({ 
          from: todayStr(), 
          to: todayStr() 
        });
        if (!alive) return;
        setToday(todaySum || { qty: 0, money: 0 });
      } catch (error) {
        console.error('Error getting today sales:', error);
      }
    })();
  }, []);

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

      const rows = await DataService.getSalesHistory({
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

  // Quick actions handlers
  

  

  

  // Derived values
  const isi = Number(stocks?.ISI || 0);
  const kosong = Number(stocks?.KOSONG || 0);

  return (
    <Box sx={{ 
      width: '100%',
      overflowX: 'auto',
      minHeight: '100vh'
    }}>
      <Stack spacing={3} sx={{ 
        minWidth: isMobile ? '800px' : 'auto',
        p: isMobile ? 2 : 3,
        width: '100%'
      }}>

        <HeaderSection />

        {err && <ErrorBanner message={err} />}

        

        <SummaryTiles
          isi={isi}
          kosong={kosong}
          todayQty={today.qty}
          todayMoney={fmtIDR(today.money)}
          receivablesTotal={fmtIDR(piutang)}
          loading={loading}
        />

        <StockConditionCard
          isi={isi}
          kosong={kosong}
          loading={loading}
        />

        <Box sx={{ minWidth: isMobile ? '800px' : 'auto' }}>
          <FinancialSummaryCard
            omzet={financialSummary.omzet}
            hpp={financialSummary.hpp}
            laba={financialSummary.laba}
            margin={financialSummary.margin}
            transactionCount={financialSummary.transactionCount}
            totalQty={financialSummary.totalQty}
            loading={financialLoading}
          />
        </Box>

        <Box sx={{ minWidth: isMobile ? '800px' : 'auto' }}>
          <SevenDaysChartCard
            series={series7}
            loading={loading}
          />
        </Box>

        <Box sx={{ minWidth: isMobile ? '800px' : 'auto' }}>
          <AnalyticsSection
            topCustomers={analytics.topCustomers}
            weekly={analytics.weekly}
            monthly={analytics.monthly}
            loading={analyticsLoading}
            onOpenCustomerHistory={openCustomerHistory}
            isSmallMobile={isSmallMobile}
          />
        </Box>

        <Box sx={{ minWidth: isMobile ? '1000px' : 'auto' }}>
          <RecentTransactionsTable
            rows={recent}
            loading={loading}
            isSmallMobile={isSmallMobile}
          />
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
