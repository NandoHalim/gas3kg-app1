// src/services/ChartsDataService.js
import { supabase } from "../api/supabaseClient";

const startOfDay = (d) => { const x = new Date(d); x.setHours(0,0,0,0); return x; };
const endOfDay   = (d) => { const x = new Date(d); x.setHours(23,59,59,999); return x; };
const startOfMonth = (y, m) => startOfDay(new Date(y, m, 1));
const endOfMonth   = (y, m) => endOfDay(new Date(y, m + 1, 0));
const toISO = (d) => new Date(d).toISOString();
const fmtID = (n) => new Intl.NumberFormat('id-ID').format(n);
const fmtDateID = (d) => new Date(d).toLocaleDateString('id-ID', { day:'numeric', month:'short' });

const keepSale = (row) => String(row.status || '').toUpperCase() !== 'DIBATALKAN';
const getTotalValue = (row) => Number(row.total_amount ?? row.total ?? 0) || 0;

async function fetchSalesRange(fromDate, toDate) {
  const { data, error } = await supabase
    .from("sales")
    .select("created_at, qty, total_amount, total, method, status")
    .gte("created_at", toISO(startOfDay(fromDate)))
    .lte("created_at", toISO(endOfDay(toDate)))
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data || []).filter(keepSale);
}

export async function getSevenDaySalesRealtime() {
  const today = new Date();
  const from = new Date(today); from.setDate(from.getDate() - 6);
  const rows = await fetchSalesRange(from, today);
  const map = new Map();
  for (let i=6; i>=0; i--) {
    const d = new Date(today); d.setDate(d.getDate()-i);
    const key = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0,0,0,0).toISOString();
    map.set(key, { date: key, qty: 0 });
  }
  rows.forEach(r => {
    const d = new Date(r.created_at);
    const key = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0,0,0,0).toISOString();
    if (map.has(key)) {
      const obj = map.get(key);
      obj.qty += Number(r.qty) || 0;
    }
  });
  return Array.from(map.values());
}

export async function getLast4WeeksSales() {
  const today = new Date();
  const from = new Date(today); from.setDate(from.getDate() - (7*4 - 1));
  const rows = await fetchSalesRange(from, today);
  const weeks = [];
  for (let w = 3; w >= 0; w--) {
    const end = new Date(today); end.setDate(end.getDate() - (7*w));
    const start = new Date(end); start.setDate(start.getDate() - 6);
    weeks.push({ start: startOfDay(start), end: endOfDay(end) });
  }
  return weeks.map((w, idx) => {
    const seg = rows.filter(r => {
      const t = new Date(r.created_at).getTime();
      return t >= w.start.getTime() && t <= w.end.getTime();
    });
    const qty = seg.reduce((s, r) => s + (Number(r.qty)||0), 0);
    const totalValue = seg.reduce((s, r) => s + getTotalValue(r), 0);
    const label = `M${idx+1}`;
    const dateRange = `${fmtDateID(w.start)} - ${fmtDateID(w.end)}`;
    return { label, value: qty, totalValue, weekNumber: idx+1, dateRange };
  });
}

export async function getMonthlyWeeklyBreakdown(year, month) {
  const mStart = startOfMonth(year, month);
  const mEnd = endOfMonth(year, month);
  const rows = await fetchSalesRange(mStart, mEnd);
  const weeks = [];
  let cursor = new Date(mStart);
  while (cursor <= mEnd) {
    const wStart = startOfDay(cursor);
    const wEnd = endOfDay(new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate()+6));
    weeks.push({ start: wStart, end: (wEnd > mEnd ? mEnd : wEnd) });
    cursor.setDate(cursor.getDate()+7);
  }
  return weeks.map((w, idx) => {
    const seg = rows.filter(r => {
      const t = new Date(r.created_at).getTime();
      return t >= w.start.getTime() && t <= w.end.getTime();
    });
    const qty = seg.reduce((s, r) => s + (Number(r.qty)||0), 0);
    const totalValue = seg.reduce((s, r) => s + getTotalValue(r), 0);
    const label = `M${idx+1}`;
    const dateRange = `${fmtDateID(w.start)} - ${fmtDateID(w.end)}`;
    const tooltip = `M${idx+1} (${dateRange})\nQty: ${qty} tabung\nTotal: Rp ${fmtID(totalValue)}`;
    return { label, value: qty, totalValue, weekNumber: idx+1, dateRange, tooltip };
  });
}

export async function getLast6MonthsSales() {
  const now = new Date();
  const start = startOfMonth(now.getFullYear(), now.getMonth()-5);
  const end = endOfMonth(now.getFullYear(), now.getMonth());
  const rows = await fetchSalesRange(start, end);
  const out = [];
  for (let i = 5; i >= 0; i--) {
    const t = new Date(now.getFullYear(), now.getMonth()-i, 1);
    const bStart = startOfMonth(t.getFullYear(), t.getMonth());
    const bEnd = endOfMonth(t.getFullYear(), t.getMonth());
    const seg = rows.filter(r => {
      const tt = new Date(r.created_at).getTime();
      return tt >= bStart.getTime() && tt <= bEnd.getTime();
    });
    const qty = seg.reduce((s, r) => s + (Number(r.qty)||0), 0);
    const totalValue = seg.reduce((s, r) => s + getTotalValue(r), 0);
    const label = t.toLocaleDateString('id-ID', { month:'short', year:'2-digit' });
    const tooltip = `${label}\nQty: ${qty} tabung\nTotal: Rp ${fmtID(totalValue)}`;
    out.push({ label, value: qty, totalValue, month: t.getMonth()+1, year: t.getFullYear(), tooltip });
  }
  return out;
}

export const ChartsDataService = {
  getSevenDaySalesRealtime,
  getLast4WeeksSales,
  getMonthlyWeeklyBreakdown,
  getLast6MonthsSales,
};
export default ChartsDataService;
