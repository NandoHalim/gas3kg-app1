import React, { useEffect, useMemo, useState } from "react";
import Card from "../ui/Card.jsx";
import Input from "../ui/Input.jsx";
import Button from "../ui/Button.jsx";
import { COLORS } from "../../utils/constants.js";
import { DataService } from "../../services/DataService.js";
import { useToast } from "../../context/ToastContext.jsx";
import { useNavigate } from "react-router-dom";

/* ============ SALAM OTOMATIS ============ */
function getSalam() {
  const h = new Date().getHours();
  if (h >= 5 && h < 11) return "pagi";
  if (h >= 11 && h < 15) return "siang";
  if (h >= 15 && h < 18) return "sore";
  return "malam";
}

/* ============ NORMALISASI NOMOR HP ============ */
function normalizePhone62(raw) {
  let val = String(raw || "").replace(/\D/g, "");
  if (!val.startsWith("62")) {
    val = "62" + val.replace(/^0+/, "");
  }
  return val;
}

/* ============ TEMPLATE PESAN ============ */
const TEMPLATES = [
  {
    key: "stok_ready",
    label: "Stok LPG 3kg Ready",
    text:
      "Selamat {{SALAM}}, {{NAMA}} 👋\n\n" +
      "Kami informasikan bahwa stok LPG 3kg sudah *TERSEDIA* di Pangkalan LPG Putria.\n\n" +
      "⏰ Jam layanan: 07.00 – 21.00 WITA\n" +
      "💰 Harga: Rp 18.000 (ambil langsung) / Rp 20.000 (delivery)\n\n" +
      "Silakan balas pesan ini untuk konfirmasi atau pemesanan.\n" +
      "Terima kasih atas kepercayaan Anda 🙏",
  },
  {
    key: "ingat_hutang",
    label: "Pengingat Hutang",
    text:
      "Selamat {{SALAM}}, {{NAMA}} 👋\n\n" +
      "Kami ingin mengingatkan adanya tagihan pembelian LPG 3kg yang masih *belum lunas*.\n" +
      "Mohon segera melakukan pembayaran. Terima kasih 🙏",
  },
  {
    key: "ucapan_terimakasih",
    label: "Ucapan Terima Kasih",
    text:
      "Selamat {{SALAM}}, {{NAMA}} 👋\n\n" +
      "Terima kasih sudah berbelanja di Pangkalan LPG Putria.\n" +
      "Dukungan Anda sangat berarti bagi kami 🙏",
  },
];

/* ============ KOMPONEN UTAMA ============ */
export default function BroadcastView() {
  const toast = useToast();
  const navigate = useNavigate();

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("ALL"); // ALL | ACTIVE | DEBT
  const [selected, setSelected] = useState(() => new Set());

  const [message, setMessage] = useState(TEMPLATES[0].text);
  const [delaySec, setDelaySec] = useState(12);

  /* === Load pelanggan dari DataService === */
  const load = async () => {
    try {
      setLoading(true);
      const data = await DataService.getCustomers({ q, filter, limit: 500 });
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      toast?.show?.({ type: "error", message: e.message || "Gagal memuat pelanggan" });
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, filter]);

  const computed = useMemo(
    () =>
      rows.map((r) => ({
        ...r,
        phone: normalizePhone62(r.phone || "62"),
        active: r.active !== false,
      })),
    [rows]
  );

  const toggleOne = (id) => {
    setSelected((prev) => {
      const s = new Set(prev);
      if (s.has(id)) s.delete(id);
      else s.add(id);
      return s;
    });
  };
  const toggleAll = () => {
    if (selected.size === computed.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(computed.map((r) => r.id)));
    }
  };

  /* === Kirim Broadcast (mode bertahap) === */
  const sendBroadcast = () => {
    if (!message.trim()) {
      toast?.show?.({ type: "error", message: "Isi pesan tidak boleh kosong" });
      return;
    }
    const targets = computed.filter((r) => selected.has(r.id));
    if (!targets.length) {
      toast?.show?.({ type: "error", message: "Pilih minimal 1 pelanggan" });
      return;
    }

    const salam = getSalam();
    let idx = 0;

    toast?.show?.({
      type: "info",
      message: `Mengirim ke ${targets.length} pelanggan (jeda ${delaySec} detik)...`,
    });

    const interval = setInterval(() => {
      if (idx >= targets.length) {
        clearInterval(interval);
        toast?.show?.({ type: "success", message: "Broadcast selesai" });
        return;
      }

      const t = targets[idx];
      const teks = message
        .replace(/{{NAMA}}/g, t.name || "")
        .replace(/{{SALAM}}/g, salam);

      const url = `https://wa.me/${t.phone}?text=${encodeURIComponent(teks)}`;
      window.open(url, "_blank");

      idx++;
    }, delaySec * 1000);
  };

  return (
    <div className="grid" style={{ gap: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <h1 style={{ margin: 0 }}>Broadcast Pesan</h1>
        <div style={{ marginLeft: "auto" }}>
          <Button onClick={() => navigate("/pelanggan")}>← Kembali</Button>
        </div>
      </div>

      <Card title="Pilih Penerima">
        <div style={{ marginBottom: 8, display: "flex", gap: 8 }}>
          <Input
            placeholder="Cari nama / nomor HP"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            disabled={loading}
          />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            style={{ padding: "10px 12px", borderRadius: 8 }}
            disabled={loading}
          >
            <option value="ALL">Semua</option>
            <option value="ACTIVE">Aktif</option>
            <option value="DEBT">Ada Hutang</option>
          </select>
        </div>
        <div style={{ overflow: "auto", maxHeight: 300 }}>
          <table className="table" style={{ width: "100%" }}>
            <thead>
              <tr>
                <th>
                  <input
                    type="checkbox"
                    checked={selected.size === computed.length && computed.length > 0}
                    onChange={toggleAll}
                  />
                </th>
                <th>Nama</th>
                <th>HP</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {!computed.length && (
                <tr>
                  <td colSpan={4} style={{ color: COLORS.secondary }}>
                    Tidak ada data
                  </td>
                </tr>
              )}
              {computed.map((r) => (
                <tr key={r.id}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selected.has(r.id)}
                      onChange={() => toggleOne(r.id)}
                    />
                  </td>
                  <td>{r.name}</td>
                  <td>{r.phone}</td>
                  <td>{r.active ? "Aktif" : "Nonaktif"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card title="Isi Pesan">
        <div style={{ marginBottom: 8, display: "flex", gap: 6, flexWrap: "wrap" }}>
          {TEMPLATES.map((t) => (
            <Button key={t.key} className="secondary" onClick={() => setMessage(t.text)}>
              {t.label}
            </Button>
          ))}
        </div>
        <textarea
          style={{ width: "100%", minHeight: 160, padding: 10 }}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <div style={{ marginTop: 8, display: "flex", gap: 8, alignItems: "center" }}>
          <label>Jeda (detik)</label>
          <Input
            type="number"
            style={{ width: 80 }}
            value={delaySec}
            onChange={(e) => setDelaySec(Math.max(5, Number(e.target.value) || 10))}
          />
        </div>
      </Card>

      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <Button onClick={sendBroadcast}>Kirim Broadcast</Button>
      </div>
    </div>
  );
}
