// =======================================================
// DashboardContainer (mobile-first dengan KpiStripMobile)
// =======================================================
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
  Grid,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

import { DataService } from "../../../services/DataService.js";
import { supabase } from "../../../lib/supabase.js";
import { useSettings } from "../../../context/SettingsContext.jsx";
import { fmtIDR, todayStr } from "../../../utils/helpers.js";

// Sections
import HeaderSection from "./sections/HeaderSection.jsx";
import SummaryTiles from "./sections/SummaryTiles.jsx";
import FinancialSummaryCard from "./sections/FinancialSummaryCard.jsx";
import SevenDaysChartCard from "./sections/SevenDaysChartCard.jsx";
import RecentTransactionsTable from "./sections/RecentTransactionsTable.jsx";
import BusinessIntelligenceCard from "./sections/BusinessIntelligenceCard.jsx";
import KpiStrip from "./sections/KpiStrip.jsx";
import KpiStripMobile from "./sections/KpiStripMobile.jsx"; // 🔥 NEW

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

  // Modal
  const [openHist, setOpenHist] = useState(false);
  const [histName, setHistName] = useState("");
  const [histRows, setHistRows] = useState([]);
  const [histLoading, setHistLoading] = useState(false);
  const [histTotalQty, setHistTotalQty] = useState(0);

  const busyRef = useRef(false);
  const idleTimer = useRef(null);

  // Effects (tetap sama...)
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
        } finally {}
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
      } catch (e) {}
    })();
    return () => { alive = false; };
  }, [recent, today, stocks]);

  // 6) Today
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const todaySum = await DataService.getSalesSummary({ from: todayStr(), to: todayStr() });
        if (!alive) return;
        setToday(todaySum || { qty: 0, money: 0 });
      } catch {}
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
        // 🔥 PERBAIKAN: Izinkan scroll vertikal, cegah horizontal
        overflowX: "hidden", // Cegah scroll horizontal page
        overflowY: "auto",   // Izinkan scroll vertikal
        minHeight: "100vh",
        backgroundColor: theme.palette.background.default,
        // Pastikan konten tidak melebihi viewport
        boxSizing: "border-box",
        // Optimasi untuk mobile
        WebkitOverflowScrolling: "touch",
        overscrollBehavior: "contain",
        // 🔥 NEW: Better mobile touch handling
        touchAction: "pan-y",
      }}
    >
      <Stack 
        spacing={{ xs: 2, md: 3 }} 
        sx={{ 
          p: { xs: 1.5, sm: 2, md: 3 },
          width: "100%",
          maxWidth: "100%",
          // Pastikan Stack tidak menyebabkan overflow
          boxSizing: "border-box",
          // Konten akan wrap dengan baik
          minHeight: "fit-content",
          // 🔥 NEW: Prevent any horizontal expansion
          overflow: "hidden",
        }}
      >
        <HeaderSection />

        {err && <ErrorBanner message={err} />}

        {/* 🔥 UPDATED: KPI Strip - Mobile vs Desktop */}
        {isMobile ? (
          <KpiStripMobile
            financialData={financialSummary}
            stockPrediction={stockPrediction}
            businessIntel={businessIntelligence}
            loading={loading || advancedLoading}
          />
        ) : (
          <KpiStrip
            financialData={financialSummary}
            stockPrediction={stockPrediction}
            businessIntel={businessIntelligence}
            loading={loading || advancedLoading}
          />
        )}

        {/* SummaryTiles */}
        <SummaryTiles
          isi={isi}
          kosong={kosong}
          todayQty={today.qty}
          todayMoney={today.money}
          receivablesTotal={piutang}
          loading={loading}
        />

        {/* Grid utama - MOBILE FIRST */}
        <Grid container spacing={{ xs: 2, md: 3 }} sx={{ width: "100%", margin: 0 }}>
          {/* Kolom kiri */}
          <Grid item xs={12} lg={6} sx={{ width: "100%", maxWidth: "100%" }}>
            <Stack spacing={{ xs: 2, md: 3 }} sx={{ width: "100%" }}>
              <FinancialSummaryCard
                omzet={financialSummary.omzet}
                hpp={financialSummary.hpp}
                laba={financialSummary.laba}
                margin={financialSummary.margin}
                transactionCount={financialSummary.transactionCount}
                totalQty={financialSummary.totalQty}
                loading={financialLoading}
              />

              {/* SevenDaysChartCard dengan container yang aman */}
              <Box sx={{ 
                width: "100%", 
                overflow: "visible",
                // 🔥 NEW: Ensure card doesn't cause horizontal scroll
                maxWidth: "100%",
              }}>
                <SevenDaysChartCard loading={loading} />
              </Box>
            </Stack>
          </Grid>

          {/* Kolom kanan */}
          <Grid item xs={12} lg={6} sx={{ width: "100%", maxWidth: "100%" }}>
            <Stack spacing={{ xs: 2, md: 3 }} sx={{ width: "100%" }}>
              {/* Business Intelligence - Accordion untuk mobile */}
              {isMobile ? (
                <Accordion 
                  elevation={1}
                  sx={{
                    '&.MuiAccordion-root': {
                      borderRadius: 2,
                      overflow: 'hidden',
                      width: "100%",
                      // 🔥 NEW: Better mobile styling
                      border: `1px solid ${theme.palette.divider}`,
                    }
                  }}
                >
                  <AccordionSummary 
                    expandIcon={<ExpandMoreIcon />}
                    sx={{
                      minHeight: { xs: 48, sm: 56 },
                      '& .MuiAccordionSummary-content': {
                        my: 1
                      },
                      backgroundColor: theme.palette.background.paper,
                    }}
                  >
                    <Typography variant="subtitle1" fontWeight={700}>
                      Business Intelligence
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails sx={{ p: 0 }}>
                    <BusinessIntelligenceCard 
                      data={businessIntelligence} 
                      loading={advancedLoading} 
                      compact
                    />
                  </AccordionDetails>
                </Accordion>
              ) : (
                <BusinessIntelligenceCard 
                  data={businessIntelligence} 
                  loading={advancedLoading} 
                />
              )}

              {/* Recent Transactions dengan scroll internal yang lebih baik */}
              <Box
                sx={{
                  width: "100%",
                  maxWidth: "100%",
                  // 🔥 IMPROVED: Better scroll container
                  overflowX: "auto",
                  overflowY: "hidden",
                  WebkitOverflowScrolling: "touch",
                  "&::-webkit-scrollbar": { 
                    height: 6,
                    backgroundColor: theme.palette.grey[100],
                  },
                  "&::-webkit-scrollbar-thumb": {
                    backgroundColor: theme.palette.grey[400],
                    borderRadius: 3,
                  },
                  "&::-webkit-scrollbar-thumb:hover": {
                    backgroundColor: theme.palette.grey[600],
                  },
                  scrollbarWidth: "thin",
                  // 🔥 IMPROVED: Better scroll containment
                  overscrollBehaviorX: "contain",
                  overscrollBehaviorY: "none",
                  // Styling
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: 2,
                  p: 1,
                  backgroundColor: theme.palette.background.paper,
                  // 🔥 NEW: Prevent any horizontal expansion
                  boxSizing: "border-box",
                }}
              >
                <RecentTransactionsTable
                  rows={recent}
                  loading={loading}
                  isSmallMobile={isSmallMobile}
                  sx={{ 
                    minWidth: { xs: 600, sm: 720 },
                    width: "100%",
                  }}
                />
              </Box>
            </Stack>
          </Grid>
        </Grid>

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