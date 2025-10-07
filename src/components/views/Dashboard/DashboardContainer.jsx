// =======================================================
// DashboardContainer (tanpa Kondisi Stok & Prediksi Sisa Stok)
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
import AnalyticsSection from "./sections/AnalyticsSection.jsx";
import RecentTransactionsTable from "./sections/RecentTransactionsTable.jsx";
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

  // === state dan hooks tetap sama ===
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

  const [businessIntelligence, setBusinessIntelligence] = useState(null);
  const [advancedLoading, setAdvancedLoading] = useState(true);
  const [analytics, setAnalytics] = useState({
    topCustomers: [],
    weekly: null,
    monthly: null,
    yoy: null,
  });
  const [analyticsLoading, setAnalyticsLoading] = useState(true);

  const [openHist, setOpenHist] = useState(false);
  const [histName, setHistName] = useState("");
  const [histRows, setHistRows] = useState([]);
  const [histLoading, setHistLoading] = useState(false);
  const [histTotalQty, setHistTotalQty] = useState(0);

  const busyRef = useRef(false);
  const idleTimer = useRef(null);

  // === efek useEffect tetap sama seperti sebelumnya ===
  // (getDashboardSnapshot, financial summary, analytics, dll)

  const isi = Number(stocks?.ISI || 0);
  const kosong = Number(stocks?.KOSONG || 0);

  return (
    <Box
      sx={{
        width: "100%",
        maxWidth: "100%",
        overflowX: "hidden",
        minHeight: "100vh",
        backgroundColor: theme.palette.background.default,
      }}
    >
      <Stack spacing={3} sx={{ p: { xs: 2, md: 3 } }}>
        <HeaderSection />
        {err && <ErrorBanner message={err} />}

        {/* KPI dan Ringkasan */}
        <KpiStrip
          financialData={financialSummary}
          businessIntel={businessIntelligence}
          loading={loading || advancedLoading}
        />

        <SummaryTiles
          isi={isi}
          kosong={kosong}
          todayQty={today.qty}
          todayMoney={fmtIDR(today.money)}
          receivablesTotal={fmtIDR(piutang)}
          loading={loading}
        />

        {/* Layout grid utama */}
        <Box
          sx={{
            display: "grid",
            gap: 3,
            gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr 1fr" },
          }}
        >
          {/* Kolom kiri */}
          <Stack spacing={3}>
            {/* ❌ Hapus StockConditionCard & StockPredictionCard */}
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
              onOpenCustomerHistory={setOpenHist}
              isSmallMobile={isSmallMobile}
            />
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
          onClose={() => setOpenHist(false)}
        />
      </Stack>
    </Box>
  );
}
