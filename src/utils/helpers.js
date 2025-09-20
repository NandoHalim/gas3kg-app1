// src/utils/helpers.js
import { HARD_MAX_DATE } from './constants';

// ====== UTIL TANGGAL ======
export const todayStr = () => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

export const maxAllowedDate = () => {
  const t = todayStr();
  return t > HARD_MAX_DATE ? HARD_MAX_DATE : t;
};

// ====== FORMAT RUPIAH ======
export const fmtIDR = (n) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(Number(n || 0));

// ====== DEBOUNCE (untuk batasi event cepat berulang) ======
export function debounce(fn, delay = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

// ====== FORMAT INVOICE (PLP/YYYY/MM/NNN) ======
/**
 * Membuat format invoice profesional:
 *   PLP/YYYY/MM/NNN
 * - PLP = inisial toko (Pangkalan LPG Putria)
 * - YYYY = Tahun
 * - MM   = Bulan
 * - NNN  = Nomor urut bulanan (3 digit)
 */
export function formatInvoicePLP(dateISO, monthlyIndex = 1) {
  const d = new Date(dateISO || Date.now());
  const yyyy = String(d.getUTCFullYear());
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  const nnn = String(monthlyIndex).padStart(3, '0');
  return `PLP/${yyyy}/${mm}/${nnn}`;
}

/**
 * Fallback penomoran bulanan di FE bila view belum tersedia.
 * rows: array hasil query sales (wajib punya id & created_at).
 * -> mengembalikan array baru dengan properti invoice_display.
 */
export function attachInvoiceDisplayFE(rows = []) {
  const byMonth = new Map();

  rows
    .slice()
    .sort((a, b) => (a.id ?? 0) - (b.id ?? 0)) // urut id naik supaya row_number benar
    .forEach((r) => {
      const key = String(r.created_at || '').slice(0, 7); // 'YYYY-MM'
      if (!byMonth.has(key)) byMonth.set(key, 0);
      const next = byMonth.get(key) + 1;
      byMonth.set(key, next);
      r._invoiceIndexFE = next;
    });

  return rows.map((r) => ({
    ...r,
    invoice_display: formatInvoicePLP(r.created_at, r._invoiceIndexFE || 1),
  }));
}
