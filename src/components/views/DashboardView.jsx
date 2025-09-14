import React, { useEffect, useState } from "react";
import Card from "../ui/Card.jsx";
import StatCard from "../ui/StatCard.jsx";
import { COLORS, HPP } from "../../utils/constants.js";
import { fmtIDR, todayStr } from "../../utils/helpers.js";
import { DataService } from "../../services/DataService.js";

export default function DashboardView({ stocks = {} }) {
  const isi = Number(stocks.ISI || 0),
    kosong = Number(stocks.KOSONG || 0),
    total = isi + kosong;

  const [today, setToday] = useState({ qty: 0, money: 0 });
  const [receivables, setReceivables] = useState(0);
  const [recent, setRecent] = useState([]);
  const [chart, setChart] = useState([]);

  useEffect(() => {
    let on = true;
    (async () => {
      try {
        const sum = await DataService.getDailySummary(todayStr(), todayStr());
        const row = sum[0] || { total_qty: 0, omzet: 0 };
        if (on) setToday({ qty: row.total_qty, money: row.omzet });

        const hutang = await DataService.getTotalReceivables();
        if (on) setReceivables(hutang);

        const sales = await DataService.getRecentSales(5);
        if (on) setRecent(sales);

        const seven = await DataService.getSevenDaySales();
        if (on) setChart(seven);
      } catch (e) {
        console.error(e);
      }
    })();
    return () => {
      on = false;
    };
  }, []);

  return (
    <div className="grid">
      {/* Header */}
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

      {/* Stat Cards */}
      <section
        className="grid"
        style={{ gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))" }}
      >
        <StatCard
          title="Stok Isi"
          value={isi}
          subtitle="Siap jual"
          color={COLORS.primary}
          icon="🟢"
        />
        <StatCard
          title="Stok Kosong"
          value={kosong}
          subtitle="Tabung kembali"
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
          value={fmtIDR(receivables)}
          subtitle="Belum lunas"
          color={COLORS.warning}
          icon="📌"
        />
      </section>

      {/* Recent Transactions */}
      <section>
        <Card title="Transaksi Terbaru">
          <table style={{ width: "100%", fontSize: 14 }}>
            <thead>
              <tr style={{ textAlign: "left", borderBottom: "1px solid #e5e7eb" }}>
                <th>Tanggal</th>
                <th>Pelanggan</th>
                <th>Qty</th>
                <th>Metode</th>
              </tr>
            </thead>
            <tbody>
              {recent.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ padding: 8, textAlign: "center" }}>
                    Belum ada transaksi
                  </td>
                </tr>
              )}
              {recent.map((r) => (
                <tr key={r.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td>{(r.created_at || "").slice(0, 10)}</td>
                  <td>{r.customer}</td>
                  <td>{r.qty}</td>
                  <td>{r.method}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </section>
    </div>
  );
}
