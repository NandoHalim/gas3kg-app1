// src/components/views/RiwayatStokSection.jsx
import React, { useEffect, useMemo, useState } from "react";
import { COLORS, MIN_DATE } from "../../utils/constants.js";
import { maxAllowedDate, fmtIDR } from "../../utils/helpers.js";
import { DataService } from "../../services/DataService.js";
import { useToast } from "../../context/ToastContext.jsx";

// MUI Components
import {
  Box,
  Stack,
  Typography,
  Card,
  CardHeader,
  CardContent,
  Grid,
  TextField,
  Button,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  TableSortLabel,
  IconButton,
  CircularProgress,
  Skeleton,
} from "@mui/material";

// Icons
import {
  ExpandMore as ExpandMoreIcon,
  FilterList as FilterListIcon,
  Inventory as InventoryIcon,
} from "@mui/icons-material";

/* =========
   Constants & Styles
   ========= */
const CARD_STYLES = {
  borderRadius: 3,
  boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
  marginBottom: 3
};

const TABLE_STYLES = {
  borderRadius: 2,
  overflow: 'hidden',
  '& .MuiTableHead-root': {
    background: 'linear-gradient(45deg, #f8fafc 30%, #f1f5f9 90%)'
  }
};

const FIELD_PROPS = { fullWidth: true, size: "medium" };
const FIELD_SX = {
  "& .MuiOutlinedInput-root": { 
    borderRadius: 2, 
    minHeight: 48,
    transition: 'all 0.2s ease',
    '&:hover': {
      boxShadow: '0 0 0 3px rgba(37, 99, 235, 0.1)'
    }
  },
  "& input": { paddingTop: 1.25, paddingBottom: 1.25 },
};

const zebra = (i) => (i % 2 ? { background: "#fafafa" } : undefined);

// Badge Component dengan Chip MUI
const StokBadge = ({ code }) => {
  const styles = {
    ISI: { bgcolor: "#e0f2fe", color: "#075985", label: "ISI" },
    KOSONG: { bgcolor: "#fff7ed", color: "#9a3412", label: "KOSONG" }
  };
  
  const style = styles[code] || { bgcolor: "#eef2ff", color: "#3730a3", label: code };
  
  return (
    <Chip
      label={style.label}
      size="small"
      sx={{ 
        bgcolor: style.bgcolor, 
        color: style.color,
        fontWeight: 600,
        fontSize: '0.75rem',
        px: 0.5,
        minWidth: 80
      }}
    />
  );
};

// Summary Badge Component
const SummaryBadge = ({ type, value }) => {
  const styles = {
    masuk: { bgcolor: "#dcfce7", color: "#166534", label: "Total Masuk" },
    keluar: { bgcolor: "#fee2e2", color: "#991b1b", label: "Total Keluar" }
  };
  
  const style = styles[type] || { bgcolor: "#eef2ff", color: "#3730a3", label: type };
  
  return (
    <Chip
      label={`${style.label}: ${value}`}
      variant="outlined"
      sx={{ 
        bgcolor: style.bgcolor, 
        color: style.color,
        fontWeight: 600,
        borderColor: style.color,
        borderWidth: 2
      }}
    />
  );
};

// Empty State Component
function EmptyState({ message, description, icon = "📦" }) {
  return (
    <TableRow>
      <TableCell colSpan={6}>
        <Box textAlign="center" py={6}>
          <Typography variant="h6" color="text.secondary" gutterBottom sx={{ opacity: 0.7 }}>
            {icon} {message}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ opacity: 0.6 }}>
            {description}
          </Typography>
        </Box>
      </TableCell>
    </TableRow>
  );
}

// terjemahkan note teknis jadi "manusiawi"
function humanize(note = "") {
  const n = note.toLowerCase();
  if (n.includes("void") || n.includes("dibatalkan") || n.includes("reason"))
    return "Pembatalan (Void)";
  if (n.includes("jual") || n.includes("terjual") || n.includes("penjualan"))
    return "Penjualan";
  if (n.includes("beli") || n.includes("supplier") || n.includes("agen"))
    return "Pembelian / Dari Agen";
  if (n.includes("tukar kosong") || n.includes("restok isi"))
    return "Restok ISI (tukar kosong)";
  if (n.includes("koreksi") || n.includes("adjust"))
    return "Koreksi Stok";
  return note || "Mutasi Stok";
}

export default function RiwayatStokSection() {
  const toast = useToast();

  // filter
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [jenis, setJenis] = useState("ALL");      // ALL | ISI | KOSONG
  const [mutasi, setMutasi] = useState("ALL");    // ALL | MASUK | KELUAR
  const [keyword, setKeyword] = useState("");     // cari pada keterangan/note

  // data
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  // sorting & pagination
  const [sortKey, setSortKey] = useState("tanggal");
  const [sortDir, setSortDir] = useState("desc");
  const [pageSize, setPageSize] = useState(25);
  const [page, setPage] = useState(1);

  const setSort = (f) =>
    sortKey === f ? setSortDir((d) => (d === "asc" ? "desc" : "asc")) : (setSortKey(f), setSortDir("asc"));

  const load = async () => {
    try {
      setLoading(true);
      const data = await DataService.getStockHistory({
        from: from || undefined,
        to: to || undefined,
        jenis,
        limit: 600,
      });
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      toast?.show?.({ type: "error", message: `❌ ${e.message}` });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    load(); 
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // filter FE: mutasi (masuk/keluar) + keyword
  const filtered = useMemo(() => {
    return rows.filter(r => {
      if (mutasi === "MASUK" && !(r.masuk > 0)) return false;
      if (mutasi === "KELUAR" && !(r.keluar > 0)) return false;
      const kw = keyword.trim().toLowerCase();
      if (kw) {
        const hay = (r.keterangan + " " + (r.raw_note || "")).toLowerCase();
        if (!hay.includes(kw)) return false;
      }
      return true;
    });
  }, [rows, mutasi, keyword]);

  // re-keterangan manusiawi + sorting
  const normalized = useMemo(() => {
    const data = filtered.map(r => ({
      ...r,
      friendly: humanize(r.raw_note || r.keterangan),
    }));

    // Sorting
    const key = sortKey;
    const dir = sortDir === "asc" ? 1 : -1;
    
    return data.sort((a, b) => {
      let va = a[key];
      let vb = b[key];
      
      if (key === "tanggal" || key === "waktu") {
        va = new Date(a.tanggal || a.waktu || "1970-01-01").getTime();
        vb = new Date(b.tanggal || b.waktu || "1970-01-01").getTime();
        return (va - vb) * dir;
      }
      if (["masuk", "keluar", "sisa"].includes(key)) {
        return (Number(va || 0) - Number(vb || 0)) * dir;
      }
      if (key === "friendly") {
        return String(a.friendly || "").localeCompare(String(b.friendly || ""), "id") * dir;
      }
      return String(va || "").localeCompare(String(vb || ""), "id") * dir;
    });
  }, [filtered, sortKey, sortDir]);

  // Pagination
  const pagedData = useMemo(() => {
    const start = (page - 1) * pageSize;
    return normalized.slice(start, start + pageSize);
  }, [normalized, page, pageSize]);

  const totalPages = Math.max(1, Math.ceil(normalized.length / pageSize));

  useEffect(() => setPage(1), [from, to, jenis, mutasi, keyword, pageSize]);

  // summary
  const totalMasuk = normalized.reduce((a, b) => a + Number(b.masuk || 0), 0);
  const totalKeluar = normalized.reduce((a, b) => a + Number(b.keluar || 0), 0);

  // Pagination Component
  const PaginationControls = () => (
    <Stack direction="row" spacing={1} alignItems="center" justifyContent="flex-end" flexWrap="wrap" sx={{ mb: 2 }}>
      <Typography variant="body2" color="text.secondary" sx={{ display: { xs: 'none', sm: 'block' } }}>
        Baris per halaman:
      </Typography>
      <FormControl size="small" sx={{ minWidth: 80 }}>
        <Select
          value={pageSize}
          onChange={(e) => setPageSize(Number(e.target.value))}
          disabled={loading}
        >
          {[10, 25, 50, 100].map((n) => (
            <MenuItem key={n} value={n}>{n}</MenuItem>
          ))}
        </Select>
      </FormControl>
      
      <Typography variant="body2" sx={{ ml: 1, minWidth: 100, textAlign: 'center' }}>
        {`Hal. ${page} dari ${totalPages}`}
      </Typography>
      
      <IconButton 
        disabled={page <= 1 || loading} 
        onClick={() => setPage(1)}
        size="small"
        sx={{ mx: 0.5 }}
      >
        <FirstPageIcon />
      </IconButton>
      <IconButton 
        disabled={page <= 1 || loading} 
        onClick={() => setPage(page - 1)}
        size="small"
        sx={{ mx: 0.5 }}
      >
        <ChevronLeftIcon />
      </IconButton>
      <IconButton 
        disabled={page >= totalPages || loading} 
        onClick={() => setPage(page + 1)}
        size="small"
        sx={{ mx: 0.5 }}
      >
        <ChevronRightIcon />
      </IconButton>
      <IconButton 
        disabled={page >= totalPages || loading} 
        onClick={() => setPage(totalPages)}
        size="small"
        sx={{ mx: 0.5 }}
      >
        <LastPageIcon />
      </IconButton>
    </Stack>
  );

  return (
    <>
      {/* Filter Section */}
      <Card sx={CARD_STYLES}>
        <Accordion defaultExpanded sx={{ boxShadow: 'none', '&:before': { display: 'none' } }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <FilterListIcon color="primary" />
              <Typography fontWeight={600}>Filter Riwayat Stok</Typography>
            </Stack>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  {...FIELD_PROPS}
                  sx={FIELD_SX}
                  label="Dari Tanggal"
                  type="date"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                  inputProps={{ min: MIN_DATE, max: maxAllowedDate() }}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  {...FIELD_PROPS}
                  sx={FIELD_SX}
                  label="Sampai"
                  type="date"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  inputProps={{ min: MIN_DATE, max: maxAllowedDate() }}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={2}>
                <FormControl {...FIELD_PROPS} sx={FIELD_SX}>
                  <InputLabel id="jenis-stok">Jenis Stok</InputLabel>
                  <Select
                    labelId="jenis-stok"
                    label="Jenis Stok"
                    value={jenis}
                    onChange={(e) => setJenis(e.target.value)}
                  >
                    <MenuItem value="ALL">Semua</MenuItem>
                    <MenuItem value="ISI">Isi</MenuItem>
                    <MenuItem value="KOSONG">Kosong</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={2}>
                <FormControl {...FIELD_PROPS} sx={FIELD_SX}>
                  <InputLabel id="jenis-mutasi">Jenis Mutasi</InputLabel>
                  <Select
                    labelId="jenis-mutasi"
                    label="Jenis Mutasi"
                    value={mutasi}
                    onChange={(e) => setMutasi(e.target.value)}
                  >
                    <MenuItem value="ALL">Semua</MenuItem>
                    <MenuItem value="MASUK">Masuk (+)</MenuItem>
                    <MenuItem value="KELUAR">Keluar (−)</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  {...FIELD_PROPS}
                  sx={FIELD_SX}
                  label="Keterangan / Kata Kunci"
                  placeholder="mis: void, penjualan, agen, budi…"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                />
              </Grid>
              <Grid item xs={12}>
                <Stack direction="row" spacing={1} justifyContent="flex-end" flexWrap="wrap">
                  <Button 
                    variant="contained" 
                    onClick={load} 
                    disabled={loading} 
                    startIcon={loading ? <CircularProgress size={16} /> : null}
                  >
                    {loading ? "Memuat…" : "Terapkan Filter"}
                  </Button>
                  <Button
                    variant="outlined"
                    disabled={loading}
                    onClick={() => {
                      setFrom("");
                      setTo("");
                      setJenis("ALL");
                      setMutasi("ALL");
                      setKeyword("");
                      load();
                    }}
                  >
                    Reset
                  </Button>
                </Stack>
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>
      </Card>

      {/* Data Table */}
      <Card sx={CARD_STYLES}>
        <CardHeader
          title={
            <Stack direction="row" alignItems="center" spacing={1}>
              <InventoryIcon color="primary" />
              <Typography variant="h6" fontWeight={600}>
                Riwayat Stok
                {loading && <CircularProgress size={16} sx={{ ml: 1 }} />}
              </Typography>
            </Stack>
          }
          subheader={
            <Typography variant="body2" color="text.secondary">
              {`Menampilkan ${pagedData.length} dari ${normalized.length} data`}
            </Typography>
          }
          action={
            <Stack direction="row" spacing={1}>
              <SummaryBadge type="masuk" value={totalMasuk} />
              <SummaryBadge type="keluar" value={totalKeluar} />
            </Stack>
          }
        />
        <CardContent>
          <PaginationControls />

          <TableContainer component={Paper} sx={TABLE_STYLES}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>
                    <TableSortLabel
                      active={sortKey === "tanggal"}
                      direction={sortDir}
                      onClick={() => setSort("tanggal")}
                    >
                      <b>📅 Tanggal & Waktu</b>
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={sortKey === "code"}
                      direction={sortDir}
                      onClick={() => setSort("code")}
                    >
                      <b>Jenis</b>
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={sortKey === "friendly"}
                      direction={sortDir}
                      onClick={() => setSort("friendly")}
                    >
                      <b>Keterangan</b>
                    </TableSortLabel>
                  </TableCell>
                  <TableCell align="right">
                    <TableSortLabel
                      active={sortKey === "masuk"}
                      direction={sortDir}
                      onClick={() => setSort("masuk")}
                    >
                      <b>Masuk</b>
                    </TableSortLabel>
                  </TableCell>
                  <TableCell align="right">
                    <TableSortLabel
                      active={sortKey === "keluar"}
                      direction={sortDir}
                      onClick={() => setSort("keluar")}
                    >
                      <b>Keluar</b>
                    </TableSortLabel>
                  </TableCell>
                  <TableCell align="right">
                    <TableSortLabel
                      active={sortKey === "sisa"}
                      direction={sortDir}
                      onClick={() => setSort("sisa")}
                    >
                      <b>Sisa Stok</b>
                    </TableSortLabel>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={6}>
                        <Skeleton variant="text" height={40} />
                      </TableCell>
                    </TableRow>
                  ))
                ) : !pagedData.length ? (
                  <EmptyState 
                    message="Tidak ada data stok" 
                    description="Tidak ada data yang ditemukan dengan filter saat ini"
                    icon="📦"
                  />
                ) : (
                  pagedData.map((r, i) => (
                    <TableRow 
                      key={r.id} 
                      hover 
                      sx={{ 
                        ...zebra(i),
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          backgroundColor: '#f8fafc',
                          transform: 'translateY(-1px)'
                        }
                      }}
                    >
                      <TableCell>{r.waktu || r.tanggal}</TableCell>
                      <TableCell>
                        <StokBadge code={r.code} />
                      </TableCell>
                      <TableCell>{r.friendly}</TableCell>
                      <TableCell 
                        align="right" 
                        sx={{ 
                          fontWeight: r.masuk ? 600 : 'normal',
                          color: r.masuk ? "#166534" : undefined 
                        }}
                      >
                        {r.masuk || ""}
                      </TableCell>
                      <TableCell 
                        align="right" 
                        sx={{ 
                          fontWeight: r.keluar ? 600 : 'normal',
                          color: r.keluar ? "#991b1b" : undefined 
                        }}
                      >
                        {r.keluar || ""}
                      </TableCell>
                      <TableCell 
                        align="right" 
                        sx={{ fontWeight: 600 }}
                      >
                        {(r.sisa ?? "") === "" ? "-" : r.sisa}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
            *Kolom "Sisa Stok" muncul otomatis bila view <code>stock_logs_with_balance</code> tersedia.
          </Typography>
        </CardContent>
      </Card>
    </>
  );
}

// Import icons yang diperlukan
import {
  FirstPage as FirstPageIcon,
  LastPage as LastPageIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
} from "@mui/icons-material";