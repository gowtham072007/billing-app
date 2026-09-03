import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  Calendar,
  IndianRupee,
  Receipt,
  Download,
  Printer,
  PieChart as PieIcon,
  RefreshCw,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';
import { api } from '../../api/client';
import { StatCard } from '../../components/common/StatCard';

const COLORS = ['#16a34a', '#0284c7', '#8b5cf6', '#f59e0b', '#ec4899', '#14b8a6', '#64748b'];

export const Reports: React.FC = () => {
  const [dateRange, setDateRange] = useState<'7days' | '30days' | 'custom'>('30days');
  const [startDate, setStartDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState<string>(new Date().toISOString().split('T')[0]);

  const [reportData, setReportData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchReport = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/reports/sales', {
        start_date: startDate,
        end_date: endDate,
      });
      setReportData(res);
    } catch (err) {
      console.error('Failed to load reports:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [startDate, endDate]);

  const handleRangeChange = (range: '7days' | '30days' | 'custom') => {
    setDateRange(range);
    const end = new Date().toISOString().split('T')[0];
    setEndDate(end);

    if (range === '7days') {
      const s = new Date();
      s.setDate(s.getDate() - 7);
      setStartDate(s.toISOString().split('T')[0]);
    } else if (range === '30days') {
      const s = new Date();
      s.setDate(s.getDate() - 30);
      setStartDate(s.toISOString().split('T')[0]);
    }
  };

  const handleExportCSV = () => {
    if (!reportData || !reportData.top_products) return;

    let csv = 'Product Name,SKU,Units Sold,Revenue (INR)\n';
    reportData.top_products.forEach((p: any) => {
      csv += `"${p.product_name}","${p.sku || ''}",${p.units_sold},${p.revenue}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sales_report_${startDate}_to_${endDate}.csv`;
    a.click();
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Sales & Revenue Reports</h1>
          <p className="text-xs text-slate-500 mt-1">
            Financial analytics, category breakdown, product performance, and gross margins
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Date Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold">
          <button
            onClick={() => handleRangeChange('7days')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              dateRange === '7days' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
            }`}
          >
            Last 7 Days
          </button>
          <button
            onClick={() => handleRangeChange('30days')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              dateRange === '30days' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
            }`}
          >
            Last 30 Days
          </button>
          <button
            onClick={() => setDateRange('custom')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              dateRange === 'custom' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
            }`}
          >
            Custom Range
          </button>
        </div>

        {dateRange === 'custom' && (
          <div className="flex items-center gap-2 text-xs">
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-bold"
            />
            <span className="text-slate-400">to</span>
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-bold"
            />
          </div>
        )}
      </div>

      {/* KPI Cards */}
      {reportData && reportData.overall && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          <StatCard
            title="Total Invoices"
            value={reportData.overall.total_bills}
            icon={Receipt}
            iconColor="text-sky-600"
            iconBg="bg-sky-50"
          />
          <StatCard
            title="Total Revenue"
            value={`₹${Number(reportData.overall.total_revenue).toLocaleString('en-IN')}`}
            icon={IndianRupee}
            iconColor="text-emerald-600"
            iconBg="bg-emerald-50"
          />
          <StatCard
            title="Total Discounts"
            value={`₹${Number(reportData.overall.total_discount).toLocaleString('en-IN')}`}
            icon={TrendingUp}
            iconColor="text-rose-600"
            iconBg="bg-rose-50"
          />
          <StatCard
            title="Est. Gross Profit"
            value={`₹${Number(reportData.overall.estimated_profit).toLocaleString('en-IN')}`}
            icon={BarChart3}
            iconColor="text-indigo-600"
            iconBg="bg-indigo-50"
          />
        </div>
      )}

      {/* Charts Grid */}
      {reportData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Daily Revenue Trend */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 mb-1">Daily Revenue in Period</h3>
            <p className="text-xs text-slate-400 mb-4">Total ₹ billed each day</p>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={reportData.daily_trend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="bill_date" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip formatter={(val: any) => [`₹${val}`, 'Daily Revenue']} />
                  <Bar dataKey="daily_revenue" fill="#16a34a" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Sales by Category */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 mb-1">Category Sales Breakdown</h3>
            <p className="text-xs text-slate-400 mb-4">Revenue share across product categories</p>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={reportData.category_sales}
                    dataKey="total_sales"
                    nameKey="category_name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  >
                    {reportData.category_sales.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val: any) => [`₹${val}`, 'Sales']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Top 10 Selling Products Table */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden p-5">
            <h3 className="text-sm font-bold text-slate-900 mb-1">Top Selling Products</h3>
            <p className="text-xs text-slate-400 mb-4">Highest volume items during this period</p>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase">
                  <tr>
                    <th className="py-2.5 px-4">Rank</th>
                    <th className="py-2.5 px-4">Product Name</th>
                    <th className="py-2.5 px-4">SKU</th>
                    <th className="py-2.5 px-4 text-center">Units Sold</th>
                    <th className="py-2.5 px-4 text-right">Total Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {reportData.top_products.map((p: any, idx: number) => (
                    <tr key={idx} className="hover:bg-slate-50/60">
                      <td className="py-3 px-4 font-bold text-slate-400 font-mono">#{idx + 1}</td>
                      <td className="py-3 px-4 font-bold text-slate-900">{p.product_name}</td>
                      <td className="py-3 px-4 font-mono text-slate-500">{p.sku || '—'}</td>
                      <td className="py-3 px-4 text-center font-mono font-bold text-emerald-700">
                        {p.units_sold}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-black text-slate-900">
                        ₹{Number(p.revenue).toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
