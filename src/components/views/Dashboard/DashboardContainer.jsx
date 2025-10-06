import React, { useEffect, useRef, useState } from "react";
import {
  Box,
  Stack,
  useTheme,
  useMediaQuery,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

import { DataService } from "../../../services/DataService.js";
import { supabase } from "../../../lib/supabase.js";
import { useSettings } from "../../../context/SettingsContext.jsx";
import { fmtIDR, todayStr } from "../../../utils/helpers.js";

// Sections
import HeaderSection from "./sections/HeaderSection.jsx";
import SummaryTiles from "./sections/SummaryTiles.jsx";
// ⛔️ DIHAPUS: import StockConditionCard from "./sections/StockConditionCard.jsx";
import FinancialSummaryCard from "./sections/FinancialSummaryCard.jsx";
import SevenDaysChartCard from "./sections/SevenDaysChartCard.jsx";
import AnalyticsSection from "./sections/AnalyticsSection.jsx";
import RecentTransactionsTable from "./sections/RecentTransactionsTable.jsx";
import StockPredictionCard from "./sections/StockPredictionCard.jsx";
import BusinessIntelligenceCard from "./sections/BusinessIntelligenceCard.jsx";
import KpiStrip from "./sections/KpiStrip.jsx";

import CustomerHistoryModal from "./modals/CustomerHistoryModal.jsx";
import ErrorBanner from "./ui/ErrorBanner.jsx";

// Helpers
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
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const isSmallMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const { settings } = useSettings();

  // State
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

  // Advanced
  const [stockPrediction, setStockPrediction] = useState(null);
  const [businessIntelligence, setBusinessIntelligence] = useState(null);
  const [advancedLoading, setAdvancedLoading] = useState(true);

  // Analytics
  const [analytics, setAnalytics] = useState({
    topCustomers: [],
    weekly: null,
    monthly: null,
    yoy: null,
  });
  const [analyticsLoading, setAnalyticsLoading] = useState(true);

  // Modal
  const [openHist, setOpenHist] = useState(false);
  const [histName, setHistName] = useState("");
  const [histRows, setHistRows] = useState([]);
  const [histLoading, setHistLoading] = useState(false);
  const [histTotalQty, setHistTotalQty] = useState(0);

  const busyRef = useRef(false);
  const idleTimer = useRef(null);

  // 1) Snapshot
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
    const run = async () => {
      try {
        setFinancialLoading(true);
        const summary = await DataService.getFinancialSummary({
          from: "2000-01-01",
          to: todayStr(),
          hppPerUnit: Number(settings.hpp || 0),
        });
        if (!alive) return;
        setFinancialSummary(summary);
      } catch (error) {
        // Fallback manual
        try {
          const salesData = await DataService.getSalesHistory({
            from: "2000-01-01",
            to: todayStr(),
            method: "ALL",
            status: "ALL",
            limit: 10000,
          });
          if (!alive) return;
          const paid = salesData.filter((s) => {
            const m = String(s.method || "").toUpperCase();
            const st = String(s.status || "").toUpperCase();
            if (st === "DIBATALKAN") return false;
            if (m === "TUNAI") return true;
            if (st === "LUNAS") return true;
            return false;
          });
          const omzet = paid.reduce((a, s) => a + (Number(s.total) || 0), 0);
          const totalQty = paid.reduce((a, s) => a + (Number(s.qty) || 0), 0);
          const hpp = totalQty * Number(settings.hpp || 0);
          const laba = omzet - hpp;
          const margin = omzet > 0 ? Math.round((laba / omzet) * 100) : 0;
          setFinancialSummary({ omzet, hpp, laba, margin, totalQty, transactionCount: paid.length });
        } finally {
          /* noop */
        }
      } finally {
        if (alive) setFinancialLoading(false);
      }
    };
    run();
    return () => { alive = false; };
  }, [settings.hpp]);

  // 3) Advanced features
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setAdvancedLoading(true);
        const [prediction, intelligence] = await Promise.all([
          DataService.getStockPrediction(30).catch(() => null),
          DataService.getCurrentMonthBusinessIntelligence().catch(() => null),
        ]);
        if (!alive) return;
        setStockPrediction(prediction);
        setBusinessIntelligence(intelligence);
      } finally {
        if (alive) setAdvancedLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  // 4) Realtime
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

  // 5) 7 days recompute
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const from = new Date(); from.setDate(from.getDate() - 6); from.setHours(0,0,0,0);
        const to = new Date();
        const rows = await DataService.loadSalesByDateRange?.(from.toISOString(), to.toISOString()).catch(() => []);
        if (!alive) return;
        setSeries7(buildLast7DaysSeries(rows || []));
      } catch (e) { /* noop */ }
    })();
    return () => { alive = false; };
  }, [recent, today, stocks]);

  // 6) Analytics
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
          monthly: mo ? { ...mo, growthPctQty: monthlyGrowthQty, growthPctOmzet: monthlyGrowthOmzet } : null,
          yoy: yy ? { ...yy, growthPctQty: yoyGrowthQty, growthPctOmzet: yoyGrowthOmzet } : null,
        });
      } finally {
        setAnalyticsLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  // 7) Today
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const todaySum = await DataService.getSalesSummary({ from: todayStr(), to: todayStr() });
        if (!alive) return;
        setToday(todaySum || { qty: 0, money: 0 });
      } catch { /* noop */ }
    })();
    return () => { alive = false; };
  }, []);

  // Modal handlers
  const openCustomerHistory = async (name) => {
    setHistName(name);
    setOpenHist(true);
    setHistLoading(true);
    try {
      const now = new Date();
      const s = new Date(now.getFullYear(), now.getMonth(), 1); s.setHours(0,0,0,0);
      const e = new Date(now.getFullYear(), now.getMonth() + 1, 0); e.setHours(23,59,59,999);
      const rows = await DataService.getSalesHistory({ from: s.toISOString(), to: e.toISOString(), q: name, limit: 500 });
      const filtered = (rows || []).filter(r => (r.customer || "").toLowerCase().includes((name || "").toLowerCase()));
      setHistRows(filtered);
      setHistTotalQty(filtered.reduce((a,b)=> a + Number(b.qty || 0), 0));
    } finally {
      setHistLoading(false);
    }
  };
  const closeCustomerHistory = () => setOpenHist(false);

  const isi = Number(stocks?.ISI || 0);
  const kosong = Number(stocks?.KOSONG || 0);

  return (
    <Box
      sx={{
        width: "100%",
        maxWidth: "100%",
        overflowX: "hidden", // ⬅️ halaman terkunci dari scroll horizontal
        minHeight: "100vh",
        backgroundColor: theme.palette.background.default,
      }}
    >
      <Stack spacing={3} sx={{ p: { xs: 2, md: 3 } }}>
        <HeaderSection />

        {err && <ErrorBanner message={err} />}

        {/* KPI di paling atas; compact di mobile, lengkap di tablet/desktop */}
        <KpiStrip
          financialData={financialSummary}
          stockPrediction={stockPrediction}
          businessIntel={businessIntelligence}
          loading={loading || advancedLoading}
          // monthlyTarget: bisa dipasang dari pengaturan jika sudah tersedia
        />

        {/* Tiles ringkas (tetap) */}
        <SummaryTiles
          isi={isi}
          kosong={kosong}
          todayQty={today.qty}
          todayMoney={fmtIDR(today.money)}
          receivablesTotal={fmtIDR(piutang)}
          loading={loading}
        />

        {/* Grid utama */}
        <Box
          sx={{
            display: "grid",
            gap: 3,
            gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr 1fr" },
          }}
        >
          {/* Kolom kiri */}
          <Stack spacing={3}>
            {/* ⛔️ Kondisi Stok dihapus */}
            <StockPredictionCard data={stockPrediction} loading={advancedLoading} />
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

          {/* Kolom tengah */}
          <Stack spacing={3}>
            <SevenDaysChartCard series={series7} loading={loading} />
            <AnalyticsSection
              topCustomers={analytics.topCustomers}
              weekly={analytics.weekly}
              monthly={analytics.monthly}
              loading={analyticsLoading}
              onOpenCustomerHistory={openCustomerHistory}
              isSmallMobile={isSmallMobile}
            />
            {/* TABEL: hanya bagian ini yang boleh scroll-x */}
            <Box sx={{ mx: -2, px: 2, overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
              <RecentTransactionsTable rows={recent} loading={loading} isSmallMobile={isSmallMobile} />
            </Box>
          </Stack>

          {/* Kolom kanan */}
          <Stack spacing={3}>
            {isMobile ? (
              <Accordion elevation={0} disableGutters>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="subtitle1" fontWeight={700}>
                    Business Intelligence
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <BusinessIntelligenceCard data={businessIntelligence} loading={advancedLoading} />
                </AccordionDetails>
              </Accordion>
            ) : (
              <BusinessIntelligenceCard data={businessIntelligence} loading={advancedLoading} />
            )}
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
