import React, { useMemo, useEffect, useState } from "react";
import Card from "../ui/Card.jsx";
import StatCard from "../ui/StatCard.jsx";
import { COLORS, HPP } from "../../utils/constants.js";
import { fmtIDR, todayStr } from "../../utils/helpers.js";
import { DataService } from "../../services/DataService.js";
import { supabase } from "../../lib/supabase.js";   // ⬅️ tambah: untuk realtime

const LOW_STOCK_THRESHOLD = 5;

function MiniBarChart({ data }) {
  const max = useMemo(() => Math.max(1, ...data.map((d) => d.qty)), [data]);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 120 }}>
      {data.map((d) => {
        const h = Math.max(6, Math.round((d.qty / max) * 110));
        return (
          <div
            key={d.date}
            title={`${d.date} • ${d.qty} tabung`}
            style={{ width: 20, height: h, background: "#1d4ed8", borderRadius: 6 }}
          />
        );
      })}
    </div>
  );
}

export default function DashboardView({ stocks = {} }) {
  const isi = Number(stocks.ISI || 0),
    kosong = Number(stocks.KOSONG || 0),
    total = isi + kosong;

  const [sum, setSum] = useState({ qty: 0, omzet: 0, laba: 0 });
  const [today, setToday] = useState({ qty: 0, money: 0 });
  const [piutang, setPiutang] = useState(0);
  const [recent, setRecent] = useState([]);
  const [series7, setSeries7] = useState([]);
  const [err, setErr] = useState("");

  // ⬇️ tarik data dashboard (dipanggil saat mount & saat ada event realtime)
  const fetchDashboard = async () => {
    try {
      // Total riwayat (pakai limit agar tidak berat)
      const rows = await DataService.loadSales(500);

      // Laba hanya dari transaksi yang SUDAH DIBAYAR:
      // - method === 'TUNAI' ATAU status === 'LUNAS'
      const paid = (rows || []).filter(
        (r) =>
          String(r.method).toUpperCase() === "TUNAI" ||
          String(r.status || "").toUpperCase() === "LUNAS"
      );

      const qty = rows.reduce((a, b) => a + Number(b.qty || 0), 0);
      const omzet = paid.reduce((a, b) => a + Number(b.total || 0), 0);
      const hpp = paid.reduce((a, b) => a + (Number(b.qty || 0) * HPP), 0);
      const laba = omzet - hpp;

      // Hari ini (biarkan seperti semula)
      const todaySum =
        (await DataService.getSalesSummary?.({
          from: todayStr(),
          to: todayStr(),
        })) || { qty: 0, money: 0 };

      // Piutang & 7 hari & recent
      const totalPiutang = await DataService.getTotalReceivables?.();
      const s7 = await DataService.getSevenDaySales?.();
      const r = await DataService.getRecentSales?.(5);

      setSum({ qty, omzet, laba });
      setToday(todaySum);
      setPiutang(totalPiutang ?? 0);
      setSeries7(Array.isArray(s7) ? s7 : []);
      setRecent(Array.isArray(r) ? r : []);
      setErr("");
    } catch (e) {
      setErr(e.message || "Gagal memuat dashboard");
    }
  };

  useEffect(() => {
    let alive = true;
    fetchDashboard();

    // ⬇️ realtime: refresh jika ada perubahan di sales / stocks
    const ch = supabase
      .channel("dashboard-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "sales" }, () => {
        if (alive) fetchDashboard();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "stocks" }, () => {
        if (alive) fetchDashboard();
      })
      .subscribe();

    return () => {
      try { supabase.removeChannel(ch); } catch {}
      alive = false;
    };
  }, []); // mount once

  return (
    <div className="grid">
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <div>
          <h2 style={{ margin: 0 }}>Dashboard</h2>
          <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: 13 }}>
            Ringkasan stok & penjualan.
          </p>
        </div>
        <div
          style={{
            padding: "6px 10px",
            borderRadius: 999,
            fontSize: 12,
            background: "#f1f5f9",
          }}
        >
          Total Tabung: <b>{total}</b>
        </div>
      </div>

      {err && (
        <div
          style={{
            padding: 12,
            borderRadius: 8,
            border: "1px solid #fecaca",
            background: "#fee2e2",
            color: "#b91c1c",
            marginTop: 8,
          }}
        >
          ⚠️ {err}
        </div>
      )}

      {/* STAT CARDS */}
      <section
        className="grid"
        style={{ gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))" }}
      >
        <StatCard
          title="Stok Isi"
          value={isi}
          subtitle={isi <= LOW_STOCK_THRESHOLD ? "⚠️ Stok menipis" : "Siap jual"}
          color={COLORS.primary}
          icon="🟢"
        />
        <StatCard
          title="Stok Kosong"
          value={kosong}
          subtitle={
            kosong <= LOW_STOCK_THRESHOLD ? "⚠️ Stok menipis" : "Tabung kembali"
          }
          color={COLORS.danger}
          icon="⚪"
        />
        <StatCard
          title="Penjualan Hari Ini"
          value={today.qty}
          subtitle={fmtIDR(today.money)}
          color={COLORS.info}
          icon="🛒"
        />
        <StatCard
          title="Piutang"
          value={fmtIDR(piutang)}
          subtitle="Belum lunas"
          color={COLORS.warning}
          icon="📄"
        />
        <StatCard
          title="Total Terjual (riwayat)"
          value={sum.qty}
          subtitle="Akumulasi data"
          color={COLORS.info}
          icon="🧮"
        />
        <StatCard
          title="Laba (akumulasi)"
          value={fmtIDR(sum.laba)}
          subtitle={`HPP @ ${fmtIDR(HPP)}`}
          color={COLORS.success}
          icon="💰"
        />
      </section>

      {/* RINGKASAN KEUANGAN */}
      <section
        className="grid"
        style={{ gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))" }}
      >
        <Card title="Ringkasan Keuangan">
          <div style={{ display: "grid", gap: 6 }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Omzet (dibayar)</span>
              <b>{fmtIDR(sum.omzet)}</b>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>HPP</span>
              <b>− {fmtIDR(sum.omzet - sum.laba)}</b>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Laba</span>
              <b style={{ color: COLORS.success }}>{fmtIDR(sum.laba)}</b>
            </div>
          </div>
        </Card>
      </section>

      {/* GRAFIK & TRANSAKSI */}
      <section
        className="grid"
        style={{ gridTemplateColumns: "2fr 3fr", gap: 12, marginTop: 12 }}
      >
        <Card title="Penjualan 7 Hari Terakhir">
          {series7.length ? (
            <MiniBarChart data={series7} />
          ) : (
            <div style={{ padding: 8, color: "#64748b" }}>Belum ada data penjualan</div>
          )}
        </Card>

        <Card title="Transaksi Terbaru">
          <div style={{ overflow: "auto" }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Tanggal</th>
                  <th>Pelanggan</th>
                  <th>Qty</th>
                  <th>Metode</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((x) => (
                  <tr key={x.id}>
                    <td>{(x.created_at || "").slice(0, 10)}</td>
                    <td>{x.customer || "PUBLIC"}</td>
                    <td>{x.qty}</td>
                    <td>{x.method}</td>
                    <td>{fmtIDR((Number(x.qty) || 0) * (Number(x.price) || 0))}</td>
                  </tr>
                ))}
                {!recent.length && (
                  <tr>
                    <td colSpan={5} style={{ color: "#64748b" }}>
                      Belum ada transaksi
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </section>
    </div>
  );
}
