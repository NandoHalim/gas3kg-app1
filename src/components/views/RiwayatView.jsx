import React, { useEffect, useMemo, useState } from "react";
import Card from "../ui/Card.jsx";
import Input from "../ui/Input.jsx";
import Button from "../ui/Button.jsx";
import { COLORS, MIN_DATE } from "../../utils/constants.js";
import { fmtIDR, maxAllowedDate } from "../../utils/helpers.js";
import { DataService } from "../../services/DataService.js";
import { useToast } from "../../context/ToastContext.jsx";

/* =========================
   UI Helpers (Style & Badge)
   ========================= */
const tableStyles = {
  thead: {
    background: "#f1f5f9",
    borderBottom: "1px solid #e2e8f0",
    position: "sticky",
    top: 0,
    zIndex: 1,
  },
  th: {
    padding: "10px 12px",
    fontWeight: 700,
    fontSize: 13,
    textTransform: "none",
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
  td: { padding: "10px 12px", verticalAlign: "top", borderBottom: "1px solid #f1f5f9" },
};
const zebra = (i) => (i % 2 ? { background: "#fcfcfd" } : {});
const statusStyle = (s) => {
  const v = String(s || "").toUpperCase();
  if (v === "LUNAS") return { bg: "#dcfce7", fg: "#166534", icon: "✅" };
  if (v === "DIBATALKAN") return { bg: "#e5e7eb", fg: "#374151", icon: "⚫" };
  return { bg: "#fee2e2", fg: "#991b1b", icon: "❌" }; // BELUM
};
function SortLabel({ field, label, sortKey, sortDir }) {
  const active = sortKey === field;
  const arrow = active ? (sortDir === "asc" ? "▲" : "▼") : "↕";
  return (
    <span style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>
      {label} <span style={{ fontSize: 11, opacity: 0.7 }}>{arrow}</span>
    </span>
  );
}

/* ==============
   Small Components
   ============== */
function Tabs({ active, onChange }) {
  const items = [
    { k: "trx", label: "Riwayat Transaksi" },
    { k: "stok", label: "Riwayat Stok" },
    { k: "hutang", label: "Riwayat Hutang" },
  ];
  return (
    <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
      {items.map((t) => (
        <Button
          key={t.k}
          className={active === t.k ? "primary" : ""}
          onClick={() => onChange(t.k)}
        >
          {t.label}
        </Button>
      ))}
    </div>
  );
}

function Modal({ open, title, children, onClose }) {
  if (!open) return null;
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,.25)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 50,
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 560,
          background: "#fff",
          borderRadius: 12,
          boxShadow: "0 10px 30px rgba(0,0,0,.15)",
          overflow: "hidden",
        }}
      >
        <div style={{ padding: 14, borderBottom: "1px solid #e5e7eb" }}>
          <b>{title}</b>
        </div>
        <div style={{ padding: 16 }}>{children}</div>
      </div>
    </div>
  );
}

/* ============
   XLSX helper
   ============ */
async function exportXlsx(filename, rows, columns) {
  // columns: [{ header: "Header", key: "field" | (row)=>val }]
  const data = rows.map((r) => {
    const obj = {};
    columns.forEach((c) => {
      obj[c.header] = typeof c.key === "function" ? c.key(r) : r[c.key];
    });
    return obj;
  });
  const XLSX = await import("xlsx");
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Data");
  XLSX.writeFile(wb, filename);
}

/* ==================
   Main Riwayat View
   ================== */
export default function RiwayatView() {
  const toast = useToast();
  const [tab, setTab] = useState("trx"); // 'trx' | 'stok' | 'hutang'

  /* --------------------------------
     Riwayat Transaksi (data & filter)
     -------------------------------- */
  const [fFrom, setFFrom] = useState("");
  const [fTo, setFTo] = useState("");
  const [fMethod, setFMethod] = useState("ALL");
  const [fStatus, setFStatus] = useState("ALL");
  const [q, setQ] = useState("");
  const [trxRows, setTrxRows] = useState([]);
  const [trxLoading, setTrxLoading] = useState(false);

  const [detailSale, setDetailSale] = useState(null);
  const [voidSale, setVoidSale] = useState(null);
  const [voidReason, setVoidReason] = useState("");
  const VOID_REASONS = ["Salah Input Data", "Batal oleh Pelanggan", "Barang Rusak", "Lainnya"];

  const loadTrx = async () => {
    try {
      setTrxLoading(true);
      const rows = await DataService.getSalesHistory({
        from: fFrom || undefined,
        to: fTo || undefined,
        method: fMethod,
        status: fStatus,
        q: q || undefined,
        limit: 800,
      });
      setTrxRows(rows);
    } catch (e) {
      toast?.show?.({ type: "error", message: `❌ ${e.message}` });
    } finally {
      setTrxLoading(false);
    }
  };

  /* --------------------------------
     Sorting & Pagination - Transaksi
     -------------------------------- */
  const [sortKeyTrx, setSortKeyTrx] = useState("created_at");
  const [sortDirTrx, setSortDirTrx] = useState("desc");
  const [pageSizeTrx, setPageSizeTrx] = useState(25);
  const [pageTrx, setPageTrx] = useState(1);

  const setSortTrx = (field) => {
    if (sortKeyTrx === field) setSortDirTrx((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKeyTrx(field);
      setSortDirTrx("asc");
    }
  };

  const sortedTrx = useMemo(() => {
    const key = sortKeyTrx;
    const dir = sortDirTrx === "asc" ? 1 : -1;
    const rows = [...trxRows];
    rows.sort((a, b) => {
      const totalA = Number(a.total ?? (a.qty || 0) * (a.price || 0));
      const totalB = Number(b.total ?? (b.qty || 0) * (b.price || 0));
      const va =
        key === "total" ? totalA : key === "created_at" ? new Date(a.created_at || 0).getTime() : a[key];
      const vb =
        key === "total" ? totalB : key === "created_at" ? new Date(b.created_at || 0).getTime() : b[key];

      if (["qty", "price", "total"].includes(key)) return (Number(va) - Number(vb)) * dir;
      if (key === "created_at") return (va - vb) * dir;
      return String(va || "").localeCompare(String(vb || ""), "id") * dir;
    });
    return rows;
  }, [trxRows, sortKeyTrx, sortDirTrx]);

  const pagedTrx = useMemo(() => {
    const start = (pageTrx - 1) * pageSizeTrx;
    return sortedTrx.slice(start, start + pageSizeTrx);
  }, [sortedTrx, pageTrx, pageSizeTrx]);

  const totalPagesTrx = Math.max(1, Math.ceil(sortedTrx.length / pageSizeTrx));
  useEffect(() => {
    setPageTrx(1);
  }, [fFrom, fTo, fMethod, fStatus, q, pageSizeTrx]);

  /* ------------------------
     Riwayat Stok (data/tab)
     ------------------------ */
  const [sFrom, setSFrom] = useState("");
  const [sTo, setSTo] = useState("");
  const [sJenis, setSJenis] = useState("ALL");
  const [stokRows, setStokRows] = useState([]);
  const [stokLoading, setStokLoading] = useState(false);

  const loadStok = async () => {
    try {
      setStokLoading(true);
      const rows = await DataService.getStockHistory({
        from: sFrom || undefined,
        to: sTo || undefined,
        jenis: sJenis,
        limit: 500,
      });
      setStokRows(rows);
    } catch (e) {
      toast?.show?.({ type: "error", message: `❌ ${e.message}` });
    } finally {
      setStokLoading(false);
    }
  };

  /* -------------------------------
     Sorting & Pagination - Stok
     ------------------------------- */
  const [sortKeyStok, setSortKeyStok] = useState("tanggal"); // 'tanggal'|'code'|'masuk'|'keluar'|'sisa'
  const [sortDirStok, setSortDirStok] = useState("desc");
  const [pageSizeStok, setPageSizeStok] = useState(25);
  const [pageStok, setPageStok] = useState(1);

  const setSortStok = (field) => {
    if (sortKeyStok === field) setSortDirStok((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKeyStok(field);
      setSortDirStok("asc");
    }
  };

  const sortedStok = useMemo(() => {
    const key = sortKeyStok;
    const dir = sortDirStok === "asc" ? 1 : -1;
    const rows = [...stokRows];
    rows.sort((a, b) => {
      let va = a[key];
      let vb = b[key];
      if (key === "tanggal") {
        va = new Date(a.tanggal || "1970-01-01").getTime();
        vb = new Date(b.tanggal || "1970-01-01").getTime();
        return (va - vb) * dir;
      }
      if (["masuk", "keluar", "sisa"].includes(key)) {
        return (Number(va || 0) - Number(vb || 0)) * dir;
      }
      return String(va || "").localeCompare(String(vb || ""), "id") * dir;
    });
    return rows;
  }, [stokRows, sortKeyStok, sortDirStok]);

  const pagedStok = useMemo(() => {
    const start = (pageStok - 1) * pageSizeStok;
    return sortedStok.slice(start, start + pageSizeStok);
  }, [sortedStok, pageStok, pageSizeStok]);

  const totalPagesStok = Math.max(1, Math.ceil(sortedStok.length / pageSizeStok));
  useEffect(() => {
    setPageStok(1);
  }, [sFrom, sTo, sJenis, pageSizeStok]);

  /* -------------------------
     Riwayat Hutang (data/tab)
     ------------------------- */
  const [hNama, setHNama] = useState("");
  const [hQ, setHQ] = useState("");
  const [debts, setDebts] = useState([]);
  const [debtLoading, setDebtLoading] = useState(false);
  const totalHutang = useMemo(() => debts.reduce((a, b) => a + (Number(b.total) || 0), 0), [debts]);

  const loadDebts = async () => {
    try {
      setDebtLoading(true);
      const keyword = [hNama, hQ].filter(Boolean).join(" ").trim();
      const rows = await DataService.getDebts({ query: keyword, limit: 500 });
      setDebts(rows);
    } catch (e) {
      toast?.show?.({ type: "error", message: `❌ ${e.message}` });
    } finally {
      setDebtLoading(false);
    }
  };

  /* ---------------------------------
     Sorting & Pagination - Hutang
     --------------------------------- */
  const [sortKeyHut, setSortKeyHut] = useState("created_at"); // 'created_at'|'customer'|'qty'|'total'
  const [sortDirHut, setSortDirHut] = useState("desc");
  const [pageSizeHut, setPageSizeHut] = useState(25);
  const [pageHut, setPageHut] = useState(1);

  const setSortHut = (field) => {
    if (sortKeyHut === field) setSortDirHut((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKeyHut(field);
      setSortDirHut("asc");
    }
  };

  const sortedHut = useMemo(() => {
    const key = sortKeyHut;
    const dir = sortDirHut === "asc" ? 1 : -1;
    const rows = [...debts];
    rows.sort((a, b) => {
      const va =
        key === "total"
          ? Number(a.total)
          : key === "created_at"
          ? new Date(a.created_at || 0).getTime()
          : a[key];
      const vb =
        key === "total"
          ? Number(b.total)
          : key === "created_at"
          ? new Date(b.created_at || 0).getTime()
          : b[key];

      if (["qty", "total"].includes(key)) return (Number(va) - Number(vb)) * dir;
      if (key === "created_at") return (va - vb) * dir;
      return String(va || "").localeCompare(String(vb || ""), "id") * dir;
    });
    return rows;
  }, [debts, sortKeyHut, sortDirHut]);

  const pagedHut = useMemo(() => {
    const start = (pageHut - 1) * pageSizeHut;
    return sortedHut.slice(start, start + pageSizeHut);
  }, [sortedHut, pageHut, pageSizeHut]);

  const totalPagesHut = Math.max(1, Math.ceil(sortedHut.length / pageSizeHut));
  useEffect(() => {
    setPageHut(1);
  }, [hNama, hQ, pageSizeHut]);

  /* -------------------------
     Initial Load per-tab
     ------------------------- */
  useEffect(() => {
    if (tab === "trx") loadTrx();
    if (tab === "stok") loadStok();
    if (tab === "hutang") loadDebts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  /* -----------
     Void action
     ----------- */
  const submitVoid = async () => {
    if (!voidSale) return;
    try {
      if (!voidReason) {
        toast?.show?.({ type: "error", message: "Pilih/isi alasan dulu." });
        return;
      }
      await DataService.voidSale({ sale_id: voidSale.id, reason: voidReason });
      toast?.show?.({ type: "success", message: "✅ Transaksi dibatalkan (void)." });
      setVoidSale(null);
      setVoidReason("");
      loadTrx(); // refresh tabel
    } catch (e) {
      toast?.show?.({ type: "error", message: `❌ ${e.message}` });
    }
  };

  /* -----------------
     Export Handlers
     ----------------- */
  const handleExportTrx = async () => {
    if (!sortedTrx.length) return toast?.show?.({ type: "info", message: "Tidak ada data untuk diekspor." });
    await exportXlsx("riwayat-transaksi.xlsx", sortedTrx, [
      { header: "Tanggal", key: (r) => String(r.created_at || "").slice(0, 19).replace("T", " ") },
      { header: "Invoice", key: (r) => r.invoice || r.id },
      { header: "Pelanggan", key: "customer" },
      { header: "Qty", key: "qty" },
      { header: "Harga Satuan", key: "price" },
      { header: "Total", key: (r) => r.total ?? (Number(r.qty || 0) * Number(r.price || 0)) },
      { header: "Metode", key: "method" },
      { header: "Status", key: "status" },
      { header: "Catatan", key: "note" },
    ]);
  };

  const handleExportStok = async () => {
    if (!sortedStok.length) return toast?.show?.({ type: "info", message: "Tidak ada data untuk diekspor." });
    await exportXlsx("riwayat-stok.xlsx", sortedStok, [
      { header: "Tanggal", key: "tanggal" },
      { header: "Jenis Stok", key: "code" },
      { header: "Keterangan", key: "keterangan" },
      { header: "Masuk", key: "masuk" },
      { header: "Keluar", key: "keluar" },
      { header: "Sisa", key: "sisa" },
    ]);
  };

  const handleExportHutang = async () => {
    if (!sortedHut.length) return toast?.show?.({ type: "info", message: "Tidak ada data untuk diekspor." });
    await exportXlsx("riwayat-hutang.xlsx", sortedHut, [
      { header: "Tanggal", key: (r) => String(r.created_at || "").slice(0, 10) },
      { header: "Invoice", key: (r) => r.invoice || r.id },
      { header: "Pelanggan", key: "customer" },
      { header: "Qty", key: "qty" },
      { header: "Total Hutang", key: "total" },
      { header: "Catatan", key: "note" },
    ]);
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <h1 style={{ margin: 0 }}>Riwayat</h1>
      </div>

      <Tabs active={tab} onChange={setTab} />

      {/* ----------------- RIWAYAT TRANSAKSI ----------------- */}
      {tab === "trx" && (
        <>
          <Card title="Filter Transaksi">
            <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(210px,1fr))", gap: 12 }}>
              <div>
                <label>Dari Tanggal</label>
                <Input type="date" min={MIN_DATE} max={maxAllowedDate()} value={fFrom} onChange={(e) => setFFrom(e.target.value)} />
              </div>
              <div>
                <label>Sampai</label>
                <Input type="date" min={MIN_DATE} max={maxAllowedDate()} value={fTo} onChange={(e) => setFTo(e.target.value)} />
              </div>
              <div>
                <label>Metode Bayar</label>
                <select
                  value={fMethod}
                  onChange={(e) => setFMethod(e.target.value)}
                  style={{ padding: "10px 12px", border: "1px solid #cbd5e1", borderRadius: 8, width: "100%" }}
                >
                  <option value="ALL">Semua</option>
                  <option value="TUNAI">Tunai</option>
                  <option value="HUTANG">Hutang</option>
                </select>
              </div>
              <div>
                <label>Status Bayar</label>
                <select
                  value={fStatus}
                  onChange={(e) => setFStatus(e.target.value)}
                  style={{ padding: "10px 12px", border: "1px solid #cbd5e1", borderRadius: 8, width: "100%" }}
                >
                  <option value="ALL">Semua</option>
                  <option value="LUNAS">Lunas</option>
                  <option value="BELUM">Belum Lunas</option>
                  <option value="DIBATALKAN">Dibatalkan</option>
                </select>
              </div>
              <div>
                <label>Pencarian (Invoice/Nama)</label>
                <Input placeholder="INV-001 / Ayu" value={q} onChange={(e) => setQ(e.target.value)} />
              </div>

              <div style={{ display: "flex", alignItems: "flex-end", gap: 8 }}>
                <Button onClick={loadTrx} disabled={trxLoading}>{trxLoading ? "Memuat…" : "Terapkan"}</Button>
                <Button
                  className="secondary"
                  onClick={() => {
                    setFFrom("");
                    setFTo("");
                    setFMethod("ALL");
                    setFStatus("ALL");
                    setQ("");
                    loadTrx();
                  }}
                  disabled={trxLoading}
                >
                  Reset
                </Button>
                <Button className="secondary" onClick={handleExportTrx}>📄 Ekspor XLSX</Button>
              </div>
            </div>
          </Card>

          <Card title={`Riwayat Transaksi ${trxLoading ? "(memuat…)" : ""}`}>
            {/* controls */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <div style={{ fontSize: 13, color: "#64748b" }}>
                Menampilkan <b>{pagedTrx.length}</b> dari <b>{sortedTrx.length}</b> data
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <label style={{ fontSize: 13, color: "#64748b" }}>Baris/hal:</label>
                <select
                  value={pageSizeTrx}
                  onChange={(e) => setPageSizeTrx(Number(e.target.value))}
                  style={{ padding: "6px 8px", border: "1px solid #cbd5e1", borderRadius: 8 }}
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <Button className="secondary" disabled={pageTrx <= 1} onClick={() => setPageTrx(1)}>⏮</Button>
                  <Button className="secondary" disabled={pageTrx <= 1} onClick={() => setPageTrx((p) => Math.max(1, p - 1))}>◀</Button>
                  <span style={{ fontSize: 13, color: "#64748b" }}>
                    Hal. <b>{pageTrx}</b> / <b>{totalPagesTrx}</b>
                  </span>
                  <Button className="secondary" disabled={pageTrx >= totalPagesTrx} onClick={() => setPageTrx((p) => Math.min(totalPagesTrx, p + 1))}>▶</Button>
                  <Button className="secondary" disabled={pageTrx >= totalPagesTrx} onClick={() => setPageTrx(totalPagesTrx)}>⏭</Button>
                </div>
              </div>
            </div>

            {/* table */}
            <div style={{ overflow: "auto" }}>
              <table className="table" style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0 }}>
                <thead style={tableStyles.thead}>
                  <tr>
                    <th style={tableStyles.th} onClick={() => setSortTrx("created_at")}>
                      <SortLabel field="created_at" label="Tanggal" sortKey={sortKeyTrx} sortDir={sortDirTrx} />
                    </th>
                    <th style={tableStyles.th} onClick={() => setSortTrx("id")}>
                      <SortLabel field="id" label="No. Invoice" sortKey={sortKeyTrx} sortDir={sortDirTrx} />
                    </th>
                    <th style={tableStyles.th} onClick={() => setSortTrx("customer")}>
                      <SortLabel field="customer" label="Pelanggan" sortKey={sortKeyTrx} sortDir={sortDirTrx} />
                    </th>
                    <th style={tableStyles.th} onClick={() => setSortTrx("qty")}>
                      <SortLabel field="qty" label="Qty" sortKey={sortKeyTrx} sortDir={sortDirTrx} />
                    </th>
                    <th style={tableStyles.th} onClick={() => setSortTrx("total")}>
                      <SortLabel field="total" label="Total" sortKey={sortKeyTrx} sortDir={sortDirTrx} />
                    </th>
                    <th style={tableStyles.th} onClick={() => setSortTrx("method")}>
                      <SortLabel field="method" label="Metode" sortKey={sortKeyTrx} sortDir={sortDirTrx} />
                    </th>
                    <th style={tableStyles.th} onClick={() => setSortTrx("status")}>
                      <SortLabel field="status" label="Status" sortKey={sortKeyTrx} sortDir={sortDirTrx} />
                    </th>
                    <th style={{ ...tableStyles.th, cursor: "default" }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {!pagedTrx.length && !trxLoading && (
                    <tr>
                      <td colSpan={8} style={{ color: COLORS.secondary, ...tableStyles.td }}>
                        Tidak ada data
                      </td>
                    </tr>
                  )}
                  {pagedTrx.map((r, i) => {
                    const canVoid = DataService.canVoidOnClient?.(r, 2);
                    const stat = statusStyle(r.status);
                    const rowDim = (r.status || "").toUpperCase() === "DIBATALKAN" ? { opacity: 0.75 } : {};
                    return (
                      <tr key={r.id} style={{ ...zebra(i), ...rowDim }}>
                        <td style={tableStyles.td}>{String(r.created_at || "").slice(0, 10)}</td>
                        <td style={tableStyles.td}>{r.invoice || r.id}</td>
                        <td style={tableStyles.td}>{r.customer || "PUBLIC"}</td>
                        <td style={tableStyles.td}>{r.qty}</td>
                        <td style={tableStyles.td}>{fmtIDR(r.total ?? (Number(r.qty || 0) * Number(r.price || 0)))}</td>
                        <td style={tableStyles.td}>{r.method}</td>
                        <td style={tableStyles.td}>
                          <span
                            className="badge"
                            style={{
                              background: stat.bg,
                              color: stat.fg,
                              padding: "4px 8px",
                              borderRadius: 999,
                              fontSize: 12,
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 6,
                            }}
                            title={r.status}
                          >
                            <span style={{ fontSize: 12 }}>{stat.icon}</span>
                            {r.status || "-"}
                          </span>
                        </td>
                        <td style={{ whiteSpace: "nowrap", ...tableStyles.td }}>
                          <Button size="sm" className="secondary" title="Detail" onClick={() => setDetailSale(r)}>📋</Button>{" "}
                          <Button size="sm" className="secondary" title="Void" onClick={() => setVoidSale(r)} disabled={!canVoid}>🗑️</Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}

      {/* ----------------- RIWAYAT STOK ----------------- */}
      {tab === "stok" && (
        <>
          <Card title="Filter Riwayat Stok">
            <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(210px,1fr))", gap: 12 }}>
              <div>
                <label>Dari Tanggal</label>
                <Input type="date" min={MIN_DATE} max={maxAllowedDate()} value={sFrom} onChange={(e) => setSFrom(e.target.value)} />
              </div>
              <div>
                <label>Sampai</label>
                <Input type="date" min={MIN_DATE} max={maxAllowedDate()} value={sTo} onChange={(e) => setSTo(e.target.value)} />
              </div>
              <div>
                <label>Jenis Stok</label>
                <select
                  value={sJenis}
                  onChange={(e) => setSJenis(e.target.value)}
                  style={{ padding: "10px 12px", border: "1px solid #cbd5e1", borderRadius: 8, width: "100%" }}
                >
                  <option value="ALL">Semua</option>
                  <option value="ISI">Isi</option>
                  <option value="KOSONG">Kosong</option>
                </select>
              </div>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 8 }}>
                <Button onClick={loadStok} disabled={stokLoading}>{stokLoading ? "Memuat…" : "Terapkan"}</Button>
                <Button
                  className="secondary"
                  onClick={() => {
                    setSFrom("");
                    setSTo("");
                    setSJenis("ALL");
                    loadStok();
                  }}
                  disabled={stokLoading}
                >
                  Reset
                </Button>
                <Button className="secondary" onClick={handleExportStok}>📄 Ekspor XLSX</Button>
              </div>
            </div>
          </Card>

          <Card title={`Riwayat Stok ${stokLoading ? "(memuat…)" : ""}`}>
            {/* controls */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <div style={{ fontSize: 13, color: "#64748b" }}>
                Menampilkan <b>{pagedStok.length}</b> dari <b>{sortedStok.length}</b> data
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <label style={{ fontSize: 13, color: "#64748b" }}>Baris/hal:</label>
                <select
                  value={pageSizeStok}
                  onChange={(e) => setPageSizeStok(Number(e.target.value))}
                  style={{ padding: "6px 8px", border: "1px solid #cbd5e1", borderRadius: 8 }}
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <Button className="secondary" disabled={pageStok <= 1} onClick={() => setPageStok(1)}>⏮</Button>
                  <Button className="secondary" disabled={pageStok <= 1} onClick={() => setPageStok((p) => Math.max(1, p - 1))}>◀</Button>
                  <span style={{ fontSize: 13, color: "#64748b" }}>
                    Hal. <b>{pageStok}</b> / <b>{totalPagesStok}</b>
                  </span>
                  <Button className="secondary" disabled={pageStok >= totalPagesStok} onClick={() => setPageStok((p) => Math.min(totalPagesStok, p + 1))}>▶</Button>
                  <Button className="secondary" disabled={pageStok >= totalPagesStok} onClick={() => setPageStok(totalPagesStok)}>⏭</Button>
                </div>
              </div>
            </div>

            {/* table */}
            <div style={{ overflow: "auto" }}>
              <table className="table" style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0 }}>
                <thead style={tableStyles.thead}>
                  <tr>
                    <th style={tableStyles.th} onClick={() => setSortStok("tanggal")}>
                      <SortLabel field="tanggal" label="Tanggal & Waktu" sortKey={sortKeyStok} sortDir={sortDirStok} />
                    </th>
                    <th style={tableStyles.th} onClick={() => setSortStok("code")}>
                      <SortLabel field="code" label="Jenis Stok" sortKey={sortKeyStok} sortDir={sortDirStok} />
                    </th>
                    <th style={{ ...tableStyles.th, cursor: "default" }}>Keterangan</th>
                    <th style={tableStyles.th} onClick={() => setSortStok("masuk")}>
                      <SortLabel field="masuk" label="Masuk" sortKey={sortKeyStok} sortDir={sortDirStok} />
                    </th>
                    <th style={tableStyles.th} onClick={() => setSortStok("keluar")}>
                      <SortLabel field="keluar" label="Keluar" sortKey={sortKeyStok} sortDir={sortDirStok} />
                    </th>
                    <th style={tableStyles.th} onClick={() => setSortStok("sisa")}>
                      <SortLabel field="sisa" label="Stok Akhir" sortKey={sortKeyStok} sortDir={sortDirStok} />
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {!pagedStok.length && !stokLoading && (
                    <tr>
                      <td colSpan={6} style={{ color: COLORS.secondary, ...tableStyles.td }}>
                        Tidak ada data
                      </td>
                    </tr>
                  )}
                  {pagedStok.map((r, i) => (
                    <tr key={r.id} style={zebra(i)}>
                      <td style={tableStyles.td}>{r.tanggal}</td>
                      <td style={tableStyles.td}>
                        <span className="badge" style={{
                          background: r.code === "ISI" ? "#e0f2fe" : "#fff7ed",
                          color: r.code === "ISI" ? "#075985" : "#9a3412",
                          padding: "4px 8px",
                          borderRadius: 999,
                          fontSize: 12
                        }}>
                          {r.code}
                        </span>
                      </td>
                      <td style={tableStyles.td}>{r.keterangan}</td>
                      <td style={{ ...tableStyles.td, textAlign: "right" }}>{r.masuk || ""}</td>
                      <td style={{ ...tableStyles.td, textAlign: "right" }}>{r.keluar || ""}</td>
                      <td style={{ ...tableStyles.td, textAlign: "right" }}>
                        {(r.sisa ?? "") === "" ? "-" : r.sisa}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 6, marginTop: 10 }}>
              <Button className="secondary" disabled={pageStok <= 1} onClick={() => setPageStok(1)}>⏮</Button>
              <Button className="secondary" disabled={pageStok <= 1} onClick={() => setPageStok((p) => Math.max(1, p - 1))}>◀</Button>
              <span style={{ fontSize: 13, color: "#64748b" }}>
                Hal. <b>{pageStok}</b> / <b>{totalPagesStok}</b>
              </span>
              <Button className="secondary" disabled={pageStok >= totalPagesStok} onClick={() => setPageStok((p) => Math.min(totalPagesStok, p + 1))}>▶</Button>
              <Button className="secondary" disabled={pageStok >= totalPagesStok} onClick={() => setPageStok(totalPagesStok)}>⏭</Button>
            </div>

            <div style={{ marginTop: 8, fontSize: 12, color: COLORS.secondary }}>
              *Kolom “Stok Akhir” muncul otomatis bila view <code>stock_logs_with_balance</code> tersedia.
            </div>
          </Card>
        </>
      )}

      {/* ----------------- RIWAYAT HUTANG ----------------- */}
      {tab === "hutang" && (
        <>
          <Card title="Filter Hutang">
            <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(210px,1fr))", gap: 12 }}>
              <div>
                <label>Nama Pelanggan</label>
                <Input placeholder="Cari nama pelanggan" value={hNama} onChange={(e) => setHNama(e.target.value)} />
              </div>
              <div>
                <label>Pencarian (Invoice/Nama)</label>
                <Input placeholder="INV-001 / Ayu" value={hQ} onChange={(e) => setHQ(e.target.value)} />
              </div>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 8 }}>
                <Button onClick={loadDebts} disabled={debtLoading}>{debtLoading ? "Memuat…" : "Terapkan"}</Button>
                <Button
                  className="secondary"
                  onClick={() => {
                    setHNama("");
                    setHQ("");
                    loadDebts();
                  }}
                  disabled={debtLoading}
                >
                  Reset
                </Button>
                <Button className="secondary" onClick={handleExportHutang}>📄 Ekspor XLSX</Button>
              </div>
            </div>
          </Card>

          <Card title={`Riwayat Hutang — Total Belum Lunas: ${fmtIDR(totalHutang)} ${debtLoading ? "(memuat…)" : ""}`}>
            {/* controls */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <div style={{ fontSize: 13, color: "#64748b" }}>
                Menampilkan <b>{pagedHut.length}</b> dari <b>{sortedHut.length}</b> data
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <label style={{ fontSize: 13, color: "#64748b" }}>Baris/hal:</label>
                <select
                  value={pageSizeHut}
                  onChange={(e) => setPageSizeHut(Number(e.target.value))}
                  style={{ padding: "6px 8px", border: "1px solid #cbd5e1", borderRadius: 8 }}
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <Button className="secondary" disabled={pageHut <= 1} onClick={() => setPageHut(1)}>⏮</Button>
                  <Button className="secondary" disabled={pageHut <= 1} onClick={() => setPageHut((p) => Math.max(1, p - 1))}>◀</Button>
                  <span style={{ fontSize: 13, color: "#64748b" }}>
                    Hal. <b>{pageHut}</b> / <b>{totalPagesHut}</b>
                  </span>
                  <Button className="secondary" disabled={pageHut >= totalPagesHut} onClick={() => setPageHut((p) => Math.min(totalPagesHut, p + 1))}>▶</Button>
                  <Button className="secondary" disabled={pageHut >= totalPagesHut} onClick={() => setPageHut(totalPagesHut)}>⏭</Button>
                </div>
              </div>
            </div>

            {/* table */}
            <div style={{ overflow: "auto" }}>
              <table className="table" style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0 }}>
                <thead style={tableStyles.thead}>
                  <tr>
                    <th style={tableStyles.th} onClick={() => setSortHut("created_at")}>
                      <SortLabel field="created_at" label="Tanggal" sortKey={sortKeyHut} sortDir={sortDirHut} />
                    </th>
                    <th style={tableStyles.th} onClick={() => setSortHut("id")}>
                      <SortLabel field="id" label="No. Invoice" sortKey={sortKeyHut} sortDir={sortDirHut} />
                    </th>
                    <th style={tableStyles.th} onClick={() => setSortHut("customer")}>
                      <SortLabel field="customer" label="Pelanggan" sortKey={sortKeyHut} sortDir={sortDirHut} />
                    </th>
                    <th style={tableStyles.th} onClick={() => setSortHut("qty")}>
                      <SortLabel field="qty" label="Qty" sortKey={sortKeyHut} sortDir={sortDirHut} />
                    </th>
                    <th style={tableStyles.th} onClick={() => setSortHut("total")}>
                      <SortLabel field="total" label="Total Hutang" sortKey={sortKeyHut} sortDir={sortDirHut} />
                    </th>
                    <th style={{ ...tableStyles.th, cursor: "default" }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {!pagedHut.length && !debtLoading && (
                    <tr>
                      <td colSpan={6} style={{ color: COLORS.secondary, ...tableStyles.td }}>
                        Tidak ada hutang
                      </td>
                    </tr>
                  )}
                  {pagedHut.map((d, i) => (
                    <tr key={d.id} style={zebra(i)}>
                      <td style={tableStyles.td}>{String(d.created_at || "").slice(0, 10)}</td>
                      <td style={tableStyles.td}>{d.invoice || d.id}</td>
                      <td style={{ ...tableStyles.td, fontWeight: 600 }}>{d.customer}</td>
                      <td style={tableStyles.td}>{d.qty}</td>
                      <td style={tableStyles.td}>{fmtIDR(d.total)}</td>
                      <td style={{ whiteSpace: "nowrap", ...tableStyles.td }}>
                        <Button
                          size="sm"
                          className="primary"
                          title="Tandai Lunas (buka Transaksi > Bayar Hutang)"
                          onClick={() =>
                            toast?.show?.({
                              type: "info",
                              message: "Buka menu Transaksi > Bayar Hutang untuk melunasi.",
                            })
                          }
                        >
                          💳 Bayar
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}

      {/* ---------- MODAL DETAIL ---------- */}
      <Modal
        open={!!detailSale}
        title={`Detail Transaksi — ${detailSale?.invoice || detailSale?.id || ""}`}
        onClose={() => setDetailSale(null)}
      >
        {detailSale && (
          <div style={{ display: "grid", gap: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Tanggal</span>
              <b>{String(detailSale.created_at || "").slice(0, 16).replace("T", " ")}</b>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Pelanggan</span>
              <b>{detailSale.customer || "PUBLIC"}</b>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Qty</span>
              <b>{detailSale.qty}</b>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Total</span>
              <b>{fmtIDR(detailSale.total || (detailSale.qty || 0) * (detailSale.price || 0))}</b>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Metode</span>
              <b>{detailSale.method}</b>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Status</span>
              <b>{detailSale.status}</b>
            </div>
            {detailSale.note && (
              <div style={{ marginTop: 8, padding: 10, background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8 }}>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>Catatan</div>
                <div style={{ whiteSpace: "pre-wrap" }}>{detailSale.note}</div>
              </div>
            )}
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
              <Button className="secondary" onClick={() => setDetailSale(null)}>Tutup</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ---------- MODAL VOID ---------- */}
      <Modal
        open={!!voidSale}
        title={`Batalkan (Void) — ${voidSale?.invoice || voidSale?.id || ""}`}
        onClose={() => {
          setVoidSale(null);
          setVoidReason("");
        }}
      >
        <div style={{ display: "grid", gap: 10 }}>
          <div style={{ fontSize: 13, color: COLORS.secondary }}>
            Pembatalan akan mengembalikan stok & menandai transaksi asli sebagai <b>DIBATALKAN</b>.
          </div>
          <div>
            <label>Alasan</label>
            <select
              value={voidReason}
              onChange={(e) => setVoidReason(e.target.value)}
              style={{ padding: "10px 12px", border: "1px solid #cbd5e1", borderRadius: 8, width: "100%" }}
            >
              <option value="">— Pilih alasan —</option>
              {VOID_REASONS.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
            <Button
              className="secondary"
              onClick={() => {
                setVoidSale(null);
                setVoidReason("");
              }}
            >
              Batal
            </Button>
            <Button onClick={submitVoid}>Void Sekarang</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
