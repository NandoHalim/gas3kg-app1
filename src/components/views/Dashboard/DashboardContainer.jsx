// =======================================================
// DashboardContainer dengan Tab Navigation
// =======================================================
import React, { useEffect, useRef, useState } from "react";
import {
  Box,
  Stack,
  Tabs,
  Tab,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Badge,
  useTheme,
  useMediaQuery,
  Paper,
} from "@mui/material";
import {
  Dashboard as DashboardIcon,
  TrendingUp as TrendingUpIcon,
  Analytics as AnalyticsIcon,
  Receipt as ReceiptIcon,
  Assessment as ReportIcon,
  Notifications as NotificationsIcon,
  AccountCircle as AccountCircleIcon,
  Settings as SettingsIcon
} from "@mui/icons-material";

import { DataService } from "../../../services/DataService.js";
import { supabase } from "../../../lib/supabase.js";
import { useSettings } from "../../../context/SettingsContext.jsx";
import { fmtIDR, todayStr } from "../../../utils/helpers.js";

// Sections (tetap sama)
import HeaderSection from "./sections/HeaderSection.jsx";
import SummaryTiles from "./sections/SummaryTiles.jsx";
import FinancialSummaryCard from "./sections/FinancialSummaryCard.jsx";
import SevenDaysChartCard from "./sections/SevenDaysChartCard.jsx";
import RecentTransactionsTable from "./sections/RecentTransactionsTable.jsx";
import BusinessIntelligenceCard from "./sections/BusinessIntelligenceCard.jsx";
import KpiStrip from "./sections/KpiStrip.jsx";

import CustomerHistoryModal from "./modals/CustomerHistoryModal.jsx";
import ErrorBanner from "./ui/ErrorBanner.jsx";

// Helper functions (tetap sama)
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

// Tab Panel Component
function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`dashboard-tabpanel-${index}`}
      aria-labelledby={`dashboard-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ 
          p: { xs: 1, sm: 2, md: 3 },
          width: '100%',
          maxWidth: '100%',
          overflowX: 'hidden'
        }}>
          {children}
        </Box>
      )}
    </div>
  );
}

// Komponen untuk setiap Tab
const OverviewTab = ({ 
  financialSummary, 
  stockPrediction, 
  businessIntelligence, 
  loading, 
  advancedLoading,
  isi,
  kosong,
  today,
  piutang,
  isMobile 
}) => (
  <Stack spacing={isMobile ? 2 : 3}>
    {/* KPI Strip */}
    <Box sx={{ width: "100%" }}>
      <KpiStrip
        financialData={financialSummary}
        stockPrediction={stockPrediction}
        businessIntel={businessIntelligence}
        loading={loading || advancedLoading}
        compact={isMobile}
      />
    </Box>

    {/* Summary Tiles */}
    <Box sx={{ width: "100%" }}>
      <SummaryTiles
        isi={isi}
        kosong={kosong}
        todayQty={today.qty}
        todayMoney={today.money}
        receivablesTotal={piutang}
        loading={loading}
        compact={isMobile}
      />
    </Box>

    {/* Quick Stats Grid */}
    <Box sx={{ 
      display: 'grid', 
      gridTemplateColumns: { 
        xs: '1fr', 
        sm: '1fr 1fr',
        md: '2fr 1fr' 
      }, 
      gap: isMobile ? 2 : 3,
      width: '100%'
    }}>
      {/* Financial Summary */}
      <Paper elevation={2} sx={{ p: isMobile ? 2 : 3, borderRadius: 2 }}>
        <Typography variant="h6" gutterBottom fontWeight={600}>
          Financial Overview
        </Typography>
        <FinancialSummaryCard
          omzet={financialSummary.omzet}
          hpp={financialSummary.hpp}
          laba={financialSummary.laba}
          margin={financialSummary.margin}
          transactionCount={financialSummary.transactionCount}
          totalQty={financialSummary.totalQty}
          loading={loading}
          compact={true}
        />
      </Paper>

      {/* Business Intelligence */}
      <Paper elevation={2} sx={{ p: isMobile ? 2 : 3, borderRadius: 2 }}>
        <Typography variant="h6" gutterBottom fontWeight={600}>
          Business Insights
        </Typography>
        <BusinessIntelligenceCard 
          data={businessIntelligence} 
          loading={advancedLoading} 
          compact={true}
        />
      </Paper>
    </Box>
  </Stack>
);

const FinancialTab = ({ financialSummary, financialLoading, isMobile }) => (
  <Stack spacing={isMobile ? 2 : 3}>
    <Paper elevation={2} sx={{ p: isMobile ? 2 : 3, borderRadius: 2 }}>
      <Typography variant="h5" gutterBottom fontWeight={600} color="primary">
        Detailed Financial Analysis
      </Typography>
      <FinancialSummaryCard
        omzet={financialSummary.omzet}
        hpp={financialSummary.hpp}
        laba={financialSummary.laba}
        margin={financialSummary.margin}
        transactionCount={financialSummary.transactionCount}
        totalQty={financialSummary.totalQty}
        loading={financialLoading}
        showDetails={true}
      />
    </Paper>

    {/* Additional Financial Metrics bisa ditambahkan di sini */}
    <Box sx={{ 
      display: 'grid', 
      gridTemplateColumns: { 
        xs: '1fr', 
        sm: '1fr 1fr' 
      }, 
      gap: isMobile ? 2 : 3 
    }}>
      <Paper elevation={1} sx={{ p: 2, textAlign: 'center' }}>
        <Typography variant="h4" color="primary" fontWeight={700}>
          {fmtIDR(financialSummary.omzet)}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Total Revenue
        </Typography>
      </Paper>
      
      <Paper elevation={1} sx={{ p: 2, textAlign: 'center' }}>
        <Typography variant="h4" color="success.main" fontWeight={700}>
          {financialSummary.margin}%
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Profit Margin
        </Typography>
      </Paper>
    </Box>
  </Stack>
);

const AnalyticsTab = ({ series7, loading, businessIntelligence, advancedLoading, isMobile }) => (
  <Stack spacing={isMobile ? 2 : 3}>
    {/* 7 Days Chart */}
    <Paper elevation={2} sx={{ p: isMobile ? 2 : 3, borderRadius: 2 }}>
      <Typography variant="h5" gutterBottom fontWeight={600}>
        Sales Trend (7 Days)
      </Typography>
      <SevenDaysChartCard 
        loading={loading} 
        compact={isMobile}
      />
    </Paper>

    {/* Business Intelligence */}
    <Paper elevation={2} sx={{ p: isMobile ? 2 : 3, borderRadius: 2 }}>
      <Typography variant="h5" gutterBottom fontWeight={600}>
        Business Intelligence
      </Typography>
      <BusinessIntelligenceCard 
        data={businessIntelligence} 
        loading={advancedLoading} 
        compact={false}
      />
    </Paper>
  </Stack>
);

const TransactionsTab = ({ recent, loading, isSmallMobile, openCustomerHistory }) => (
  <Stack spacing={3}>
    <Paper elevation={2} sx={{ p: { xs: 1, sm: 2, md: 3 }, borderRadius: 2 }}>
      <Typography variant="h5" gutterBottom fontWeight={600}>
        Recent Transactions
      </Typography>
      <Box
        className="table-scroll-container"
        sx={{
          width: "100%",
          overflowX: "auto",
          WebkitOverflowScrolling: "touch",
        }}
      >
        <RecentTransactionsTable
          rows={recent}
          loading={loading}
          isSmallMobile={isSmallMobile}
          onCustomerClick={openCustomerHistory}
          sx={{ 
            minWidth: isSmallMobile ? 500 : 650,
            width: "100%",
          }}
        />
      </Box>
    </Paper>
  </Stack>
);

const ReportsTab = ({ financialSummary, today, isMobile }) => (
  <Stack spacing={isMobile ? 2 : 3}>
    <Paper elevation={2} sx={{ p: isMobile ? 2 : 3, borderRadius: 2 }}>
      <Typography variant="h5" gutterBottom fontWeight={600}>
        Quick Reports
      </Typography>
      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: { 
          xs: '1fr', 
          sm: '1fr 1fr',
          md: '1fr 1fr 1fr' 
        }, 
        gap: 2 
      }}>
        {/* Report Cards */}
        <Paper elevation={1} sx={{ p: 2, textAlign: 'center', bgcolor: 'primary.main', color: 'white' }}>
          <Typography variant="h6">Today's Sales</Typography>
          <Typography variant="h4" fontWeight={700}>
            {fmtIDR(today.money)}
          </Typography>
          <Typography variant="body2">{today.qty} units</Typography>
        </Paper>

        <Paper elevation={1} sx={{ p: 2, textAlign: 'center', bgcolor: 'secondary.main', color: 'white' }}>
          <Typography variant="h6">Total Transactions</Typography>
          <Typography variant="h4" fontWeight={700}>
            {financialSummary.transactionCount}
          </Typography>
          <Typography variant="body2">All time</Typography>
        </Paper>

        <Paper elevation={1} sx={{ p: 2, textAlign: 'center', bgcolor: 'success.main', color: 'white' }}>
          <Typography variant="h6">Profit Margin</Typography>
          <Typography variant="h4" fontWeight={700}>
            {financialSummary.margin}%
          </Typography>
          <Typography variant="body2">Efficiency</Typography>
        </Paper>
      </Box>
    </Paper>

    {/* Export Options */}
    <Paper elevation={1} sx={{ p: 3, textAlign: 'center' }}>
      <Typography variant="h6" gutterBottom>
        Generate Detailed Reports
      </Typography>
      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
        <IconButton color="primary" sx={{ border: 1, p: 2 }}>
          <ReportIcon />
          <Typography variant="body2" sx={{ ml: 1 }}>PDF Report</Typography>
        </IconButton>
        <IconButton color="success" sx={{ border: 1, p: 2 }}>
          <AssessmentIcon />
          <Typography variant="body2" sx={{ ml: 1 }}>Excel Export</Typography>
        </IconButton>
      </Box>
    </Paper>
  </Stack>
);

// Main Component
export default function DashboardContainer({ stocks: stocksFromApp = {} }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const isSmallMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const { settings } = useSettings();

  // State management (tetap sama dengan sebelumnya)
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
  const [stockPrediction, setStockPrediction] = useState(null);
  const [businessIntelligence, setBusinessIntelligence] = useState(null);
  const [advancedLoading, setAdvancedLoading] = useState(true);
  const [openHist, setOpenHist] = useState(false);
  const [histName, setHistName] = useState("");
  const [histRows, setHistRows] = useState([]);
  const [histLoading, setHistLoading] = useState(false);
  const [histTotalQty, setHistTotalQty] = useState(0);

  // Tab state
  const [activeTab, setActiveTab] = useState(0);

  // Effects dan logic lainnya TETAP SAMA seperti kode awal Anda
  // ... (semua useEffect, event handlers, dll tetap sama)

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const tabs = [
    {
      label: 'Overview',
      icon: <DashboardIcon />,
      badge: 0,
      component: (
        <OverviewTab
          financialSummary={financialSummary}
          stockPrediction={stockPrediction}
          businessIntelligence={businessIntelligence}
          loading={loading}
          advancedLoading={advancedLoading}
          isi={Number(stocks?.ISI || 0)}
          kosong={Number(stocks?.KOSONG || 0)}
          today={today}
          piutang={piutang}
          isMobile={isMobile}
        />
      )
    },
    {
      label: 'Financial',
      icon: <TrendingUpIcon />,
      badge: 0,
      component: (
        <FinancialTab
          financialSummary={financialSummary}
          financialLoading={financialLoading}
          isMobile={isMobile}
        />
      )
    },
    {
      label: 'Analytics',
      icon: <AnalyticsIcon />,
      badge: 0,
      component: (
        <AnalyticsTab
          series7={series7}
          loading={loading}
          businessIntelligence={businessIntelligence}
          advancedLoading={advancedLoading}
          isMobile={isMobile}
        />
      )
    },
    {
      label: 'Transactions',
      icon: <ReceiptIcon />,
      badge: recent.length > 0 ? recent.length : 0,
      component: (
        <TransactionsTab
          recent={recent}
          loading={loading}
          isSmallMobile={isSmallMobile}
          openCustomerHistory={openCustomerHistory}
        />
      )
    },
    {
      label: 'Reports',
      icon: <ReportIcon />,
      badge: 0,
      component: (
        <ReportsTab
          financialSummary={financialSummary}
          today={today}
          isMobile={isMobile}
        />
      )
    }
  ];

  // Modal handler (tetap sama)
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

  return (
    <Box sx={{ flexGrow: 1, bgcolor: 'background.default', minHeight: '100vh' }}>
      {/* App Bar dengan Tabs */}
      <AppBar 
        position="static" 
        elevation={0}
        sx={{ 
          bgcolor: 'background.paper',
          color: 'text.primary',
          borderBottom: `1px solid ${theme.palette.divider}`
        }}
      >
        <Toolbar variant={isMobile ? "dense" : "regular"} sx={{ 
          minHeight: { xs: 56, md: 64 },
          px: { xs: 1, sm: 2, md: 3 }
        }}>
          <Typography 
            variant="h6" 
            component="div" 
            sx={{ 
              flexGrow: 0,
              mr: 4,
              display: { xs: 'none', sm: 'block' },
              fontWeight: 700,
              color: theme.palette.primary.main
            }}
          >
            🏠 BUSINESS DASHBOARD
          </Typography>
          
          <Typography 
            variant="h6" 
            component="div" 
            sx={{ 
              flexGrow: 0,
              mr: 4,
              display: { xs: 'block', sm: 'none' },
              fontWeight: 700
            }}
          >
            🏠 DASHBOARD
          </Typography>

          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            variant={isMobile ? "scrollable" : "standard"}
            scrollButtons="auto"
            allowScrollButtonsMobile
            sx={{
              flexGrow: 1,
              '& .MuiTab-root': {
                minHeight: { xs: 48, md: 64 },
                minWidth: { xs: 80, md: 120 },
                fontSize: { xs: '0.7rem', sm: '0.8rem', md: '0.875rem' },
                fontWeight: 600,
                textTransform: 'none',
                '&.Mui-selected': {
                  color: theme.palette.primary.main,
                }
              },
              '& .MuiTabs-indicator': {
                backgroundColor: theme.palette.primary.main,
                height: 3
              }
            }}
          >
            {tabs.map((tab, index) => (
              <Tab
                key={index}
                icon={
                  <Badge 
                    badgeContent={tab.badge} 
                    color="error" 
                    invisible={tab.badge === 0}
                    sx={{ 
                      '& .MuiBadge-badge': {
                        fontSize: '0.6rem',
                        height: 16,
                        minWidth: 16
                      }
                    }}
                  >
                    {tab.icon}
                  </Badge>
                }
                label={isMobile ? '' : tab.label}
                iconPosition="start"
                sx={{
                  minWidth: 'auto',
                  px: { xs: 1, sm: 2, md: 3 }
                }}
              />
            ))}
          </Tabs>

          {/* Action Icons */}
          <Box sx={{ display: 'flex', gap: { xs: 0.5, sm: 1 } }}>
            <IconButton size="small" color="inherit">
              <Badge badgeContent={4} color="error">
                <NotificationsIcon fontSize={isMobile ? "small" : "medium"} />
              </Badge>
            </IconButton>
            <IconButton size="small" color="inherit">
              <SettingsIcon fontSize={isMobile ? "small" : "medium"} />
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Main Content Area */}
      <Box sx={{ width: '100%', maxWidth: '100%', overflowX: 'hidden' }}>
        {err && (
          <Box sx={{ px: { xs: 1, sm: 2, md: 3 }, pt: 2 }}>
            <ErrorBanner message={err} />
          </Box>
        )}

        {/* Tab Content */}
        {tabs.map((tab, index) => (
          <TabPanel key={index} value={activeTab} index={index}>
            {tab.component}
          </TabPanel>
        ))}
      </Box>

      {/* Modal */}
      <CustomerHistoryModal
        open={openHist}
        customerName={histName}
        rows={histRows}
        totalQty={histTotalQty}
        loading={histLoading}
        onClose={closeCustomerHistory}
      />
    </Box>
  );
}