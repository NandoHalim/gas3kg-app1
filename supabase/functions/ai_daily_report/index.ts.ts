// supabase/functions/ai_daily_report/index.ts
// ========================================================
// Supabase Edge Function: Daily AI Insights Scheduler
// ========================================================
// This runs daily via cron to generate an AI insight summary
// and log it into ai_insights_log using RPC `log_ai_insight`.
// ========================================================

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    const safe = (v: any) => (Number.isFinite(Number(v)) ? Number(v) : 0);
    const toISO = (d: Date) => d.toISOString();

    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const startOfMonthLocal = `${yyyy}-${mm}-01T00:00:00.000+08:00`;

    // Get settings (HPP)
    const { data: setRows } = await supabase
      .from("app_settings")
      .select("hpp")
      .limit(1);
    const hppPerUnit = safe(setRows?.[0]?.hpp ?? 0);

    // Financial summary (MTD)
    const { data: fin, error: eFin } = await supabase
      .rpc("get_financial_summary", {
        p_from: startOfMonthLocal,
        p_to: toISO(now),
        p_hpp_per_unit: hppPerUnit,
      })
      .single();
    if (eFin) console.warn("get_financial_summary error:", eFin.message);

    // 7-day sales
    const since7 = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();
    const { data: seven } = await supabase
      .from("sales_summary_daily")
      .select("*")
      .gte("day", since7)
      .order("day", { ascending: true });
    const qtyArr = (seven || []).map((r: any) => safe(r.qty ?? r.net ?? 0));

    // Stocks
    const { data: stocks } = await supabase.from("stocks").select("code, qty");
    const curIsi = safe((stocks || []).find((x: any) => String(x.code).toUpperCase() === "ISI")?.qty ?? 0);

    // Simple linear forecast
    const linearForecast = (y: number[], horizon = 7) => {
      const n = y.length;
      if (n < 3) return Array(horizon).fill(y[n - 1] || 0);
      const t = Array.from({ length: n }, (_, i) => i + 1);
      const sum = (a: number[]) => a.reduce((s, v) => s + v, 0);
      const sumT = sum(t), sumY = sum(y);
      const sumTT = sum(t.map((v) => v * v));
      const sumTY = sum(t.map((v, i) => v * y[i]));
      const denom = n * sumTT - sumT * sumT;
      const b = denom ? (n * sumTY - sumT * sumY) / denom : 0;
      const a = (sumY - b * sumT) / n;
      return Array.from({ length: horizon }, (_, h) => Math.max(0, a + b * (n + h + 1)));
    };

    const salesForecast = linearForecast(qtyArr, 7).map((v) => Math.round(v));
    const avgDaily = qtyArr.length ? qtyArr.reduce((a, b) => a + b, 0) / qtyArr.length : 0;
    const stockForecast = Array.from({ length: 7 }, (_, i) =>
      Math.max(0, Math.round(curIsi - avgDaily * (i + 1))),
    );

    // Days left
    const daysLeft = avgDaily ? Math.ceil(curIsi / avgDaily) : null;

    // Advice
    let advice: any = null;
    if (daysLeft !== null && daysLeft <= 3) {
      advice = {
        level: "warning",
        title: "Risiko kekurangan stok",
        message: `Rata-rata ${Math.round(avgDaily)} tabung/hari, stok ISI ${curIsi}. Usul restock ±${Math.max(0, Math.ceil(avgDaily * 7) - curIsi)} tabung.`,
      };
    } else {
      advice = {
        level: "success",
        title: "Kondisi stabil",
        message: "Penjualan dan margin relatif stabil.",
      };
    }

    // Payload
    const payload = {
      insight: `Omzet MTD Rp${(fin?.omzet || 0).toLocaleString("id-ID")} · Margin ${(fin?.margin || 0).toFixed(1)}% · Estimasi stok ${daysLeft ?? "-"} hari.`,
      advice,
      kpi: {
        omzet: safe(fin?.omzet),
        laba: fin?.laba == null ? null : safe(fin?.laba),
        margin: safe(fin?.margin),
        days_left: daysLeft,
      },
      forecast: { sales_next_7: salesForecast, stock_next_7: stockForecast },
      generated_at: new Date().toISOString(),
    };

    // Log via RPC
    const { error: logErr } = await supabase.rpc("log_ai_insight", {
      p_kind: "daily",
      p_payload: payload as any,
    });
    if (logErr) throw logErr;

    return new Response(JSON.stringify({ ok: true, message: "Insight logged" }), { status: 200 });
  } catch (e) {
    console.error("ai_daily_report error:", e);
    return new Response(JSON.stringify({ ok: false, error: String(e) }), { status: 500 });
  }
});
