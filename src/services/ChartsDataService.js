// src/services/ChartsDataService.js
import { supabase } from "../../lib/supabase.js";

export class ChartsDataService {
  
  static async getSevenDaySalesRealtime() {
    try {
      const { data, error } = await supabase
        .from('sales')
        .select('*')
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      
      // Process data untuk 7 hari
      const dailyData = this.processDailyData(data || []);
      return dailyData;
    } catch (error) {
      console.error('Error fetching 7 day sales:', error);
      return [];
    }
  }

  static async getLast4WeeksSales() {
    try {
      const { data, error } = await supabase
        .from('sales')
        .select('*')
        .gte('created_at', new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      
      // Process data untuk 4 minggu
      const weeklyData = this.processWeeklyData(data || []);
      return weeklyData;
    } catch (error) {
      console.error('Error fetching 4 weeks sales:', error);
      return [];
    }
  }

  static async getMonthlyWeeklyBreakdown(year, month) {
    try {
      const startDate = new Date(year, month, 1);
      const endDate = new Date(year, month + 1, 0);
      
      const { data, error } = await supabase
        .from('sales')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      
      // Process data breakdown mingguan
      const weeklyBreakdown = this.processWeeklyBreakdown(data || [], year, month);
      return weeklyBreakdown;
    } catch (error) {
      console.error('Error fetching monthly breakdown:', error);
      return [];
    }
  }

  static async getLast6MonthsSales() {
    try {
      const { data, error } = await supabase
        .from('sales')
        .select('*')
        .gte('created_at', new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      
      // Process data untuk 6 bulan
      const monthlyData = this.processMonthlyData(data || []);
      return monthlyData;
    } catch (error) {
      console.error('Error fetching 6 months sales:', error);
      return [];
    }
  }

  // Helper methods
  static processDailyData(salesData) {
    const dailyMap = new Map();
    
    salesData.forEach(sale => {
      if (sale.status?.toUpperCase() === 'DIBATALKAN') return;
      
      const date = new Date(sale.created_at).toISOString().split('T')[0];
      const qty = Number(sale.qty) || 0;
      const totalValue = Number(sale.total) || 0;
      
      if (dailyMap.has(date)) {
        const existing = dailyMap.get(date);
        dailyMap.set(date, {
          qty: existing.qty + qty,
          totalValue: existing.totalValue + totalValue
        });
      } else {
        dailyMap.set(date, { qty, totalValue });
      }
    });

    // Generate last 7 days
    const result = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const data = dailyMap.get(dateStr) || { qty: 0, totalValue: 0 };
      
      result.push({
        date: dateStr,
        qty: data.qty,
        totalValue: data.totalValue
      });
    }
    
    return result;
  }

  static processWeeklyData(salesData) {
    // Implement weekly data processing
    const weeklyData = [];
    // ... processing logic
    return weeklyData;
  }

  static processWeeklyBreakdown(salesData, year, month) {
    // Implement weekly breakdown processing
    const breakdown = [];
    // ... processing logic
    return breakdown;
  }

  static processMonthlyData(salesData) {
    // Implement monthly data processing
    const monthlyData = [];
    // ... processing logic
    return monthlyData;
  }
}