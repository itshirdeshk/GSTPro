'use client';

import { useQuery } from '@tanstack/react-query';
import { StatCard } from '@/components/ui/card';
import { Card } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/badge';
import { apiGet } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { DashboardStats } from '@/lib/types';
import {
  IndianRupee,
  Receipt,
  Clock,
  TrendingDown,
  ScrollText,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

// Mock data for initial render (before API is connected)
const mockStats: DashboardStats = {
  totalRevenue: 1245000,
  gstCollected: 224100,
  pendingPayments: 356000,
  totalExpenses: 89000,
  recentInvoices: [],
  topCustomers: [],
};

const mockChartData = [
  { month: 'Jan', revenue: 85000 },
  { month: 'Feb', revenue: 120000 },
  { month: 'Mar', revenue: 98000 },
  { month: 'Apr', revenue: 165000 },
  { month: 'May', revenue: 210000 },
  { month: 'Jun', revenue: 178000 },
];

const gstBreakdown = [
  { name: 'CGST', value: 45200, color: '#6c63ff' },
  { name: 'SGST', value: 45200, color: '#8b84ff' },
  { name: 'IGST', value: 133700, color: '#06b6d4' },
];

export default function DashboardPage() {
  // Get date range (last 6 months for charts, current month for stats)
  const now = new Date();
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1);
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  // Fetch sales report for stats and trend
  const { data: salesData, isLoading: salesLoading } = useQuery({
    queryKey: ['dashboard-sales'],
    queryFn: () =>
      apiGet<any>('/reports/sales', {
        fromDate: sixMonthsAgo.toISOString().split('T')[0],
        toDate: now.toISOString().split('T')[0],
      }),
  });

  // Fetch GST report
  const { data: gstData, isLoading: gstLoading } = useQuery({
    queryKey: ['dashboard-gst'],
    queryFn: () =>
      apiGet<any>('/reports/gst', {
        fromDate: firstDayOfMonth.toISOString().split('T')[0],
        toDate: now.toISOString().split('T')[0],
      }),
  });

  // Fetch recent invoices
  const { data: invoicesData, isLoading: invoicesLoading } = useQuery({
    queryKey: ['dashboard-invoices'],
    queryFn: () => apiGet<any>('/invoices', { page: 1, limit: 5 }),
  });

  // Fetch expense stats
  const { data: expensesData } = useQuery({
    queryKey: ['dashboard-expenses'],
    queryFn: () =>
      apiGet<any>('/expenses/stats', {
        fromDate: firstDayOfMonth.toISOString().split('T')[0],
        toDate: now.toISOString().split('T')[0],
      }),
  });

  const { data: quotationData } = useQuery({
    queryKey: ['dashboard-quotations'],
    queryFn: () =>
      apiGet<any>('/reports/quotations', {
        fromDate: sixMonthsAgo.toISOString().split('T')[0],
        toDate: now.toISOString().split('T')[0],
      }),
  });

  const isLoading = salesLoading || gstLoading || invoicesLoading;

  // Calculate stats from fetched data
  const totalRevenue = salesData?.summary?.totalRevenue || 0;
  const gstCollected =
    (gstData?.summary?.cgst || 0) +
    (gstData?.summary?.sgst || 0) +
    (gstData?.summary?.igst || 0) ||
    0;
  const pendingPayments = salesData?.summary?.totalOutstanding || 0;
  const totalExpenses = expensesData?.totalExpenses || 0;
  const quotationCount = quotationData?.summary?.quotationCount || 0;

  // Process monthly trend data - format: "2026-02" to "Feb"
  const chartData =
    salesData?.monthlyTrend?.map((m: any) => ({
      month: new Date(m.month + '-01').toLocaleDateString('en', { month: 'short' }),
      revenue: m.total || 0,
    })) || mockChartData;

  // GST breakdown
  const gstBreakdownData = gstData?.summary
    ? [
      { name: 'CGST', value: gstData.summary.cgst || 0, color: '#6c63ff' },
      { name: 'SGST', value: gstData.summary.sgst || 0, color: '#8b84ff' },
      { name: 'IGST', value: gstData.summary.igst || 0, color: '#06b6d4' },
    ]
    : gstBreakdown;

  const recentInvoices = invoicesData || [];

  const s = {
    totalRevenue,
    gstCollected,
    pendingPayments,
    totalExpenses,
  };

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          label="Total Revenue"
          value={formatCurrency(s.totalRevenue)}
          change="12.5% from last month"
          changeType="up"
          icon={<IndianRupee size={20} />}
          color="green"
        />
        <StatCard
          label="GST Collected"
          value={formatCurrency(s.gstCollected)}
          change="8.2% from last month"
          changeType="up"
          icon={<Receipt size={20} />}
          color="cyan"
        />
        <StatCard
          label="Pending Payments"
          value={formatCurrency(s.pendingPayments)}
          change="3 overdue"
          changeType="down"
          icon={<Clock size={20} />}
          color="amber"
        />
        <StatCard
          label="Expenses"
          value={formatCurrency(s.totalExpenses)}
          change="5.3% from last month"
          changeType="up"
          icon={<TrendingDown size={20} />}
          color="red"
        />
        <StatCard
          label="Quotations"
          value={String(quotationCount)}
          change={`${quotationData?.summary?.conversionRate || 0}% converted`}
          changeType="up"
          icon={<ScrollText size={20} />}
          color="accent"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Revenue Chart */}
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading text-base font-bold">Revenue Overview</h2>
            <div className="flex bg-bg3 rounded-lg p-0.5">
              <button className="px-3 py-1 text-xs font-medium rounded-md bg-surface2 text-text">6M</button>
              <button className="px-3 py-1 text-xs font-medium rounded-md text-text3 hover:text-text2">1Y</button>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6c63ff" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6c63ff" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2d3e" />
                <XAxis dataKey="month" stroke="#606880" fontSize={12} />
                <YAxis stroke="#606880" fontSize={12} tickFormatter={(v) => `₹${v / 1000}k`} />
                <Tooltip
                  contentStyle={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-sm)',
                    color: 'var(--text)',
                    fontSize: '12px',
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                  }}
                  itemStyle={{ color: 'var(--text2)' }}
                  formatter={(value) => [formatCurrency(Number(value || 0)), 'Revenue']}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#6c63ff"
                  strokeWidth={2}
                  fill="url(#revenueGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* GST Breakdown */}
        <Card>
          <h2 className="font-heading text-base font-bold mb-4">GST Breakdown</h2>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={gstBreakdownData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {gstBreakdownData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-sm)',
                    color: 'var(--text)',
                    fontSize: '12px',
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                  }}
                  itemStyle={{ color: 'var(--text2)' }}
                  formatter={(value) => formatCurrency(Number(value || 0))}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-col gap-2 mt-2">
            {gstBreakdownData.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: item.color }} />
                  <span className="text-text2">{item.name}</span>
                </div>
                <span className="font-medium">{formatCurrency(item.value)}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Recent Invoices */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-heading text-base font-bold">Recent Invoices</h2>
          <a href="/invoices" className="text-sm text-accent2 hover:underline">View all</a>
        </div>
        {recentInvoices.length === 0 ? (
          <p className="text-text3 text-sm py-4 text-center">No recent invoices. Create your first invoice to get started.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-4 py-2 text-left text-[11px] uppercase tracking-wider text-text3 font-semibold">Invoice #</th>
                  <th className="px-4 py-2 text-left text-[11px] uppercase tracking-wider text-text3 font-semibold">Customer</th>
                  <th className="px-4 py-2 text-left text-[11px] uppercase tracking-wider text-text3 font-semibold">Date</th>
                  <th className="px-4 py-2 text-right text-[11px] uppercase tracking-wider text-text3 font-semibold">Amount</th>
                  <th className="px-4 py-2 text-center text-[11px] uppercase tracking-wider text-text3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentInvoices.map((inv: any) => (
                  <tr key={inv.id} className="border-b border-border/50 hover:bg-surface/50 transition-colors">
                    <td className="px-4 py-3 text-[13px] font-medium">{inv.invoiceNumber}</td>
                    <td className="px-4 py-3 text-[13px] text-text2">{inv.customer?.name}</td>
                    <td className="px-4 py-3 text-[13px] text-text3">{formatDate(inv.invoiceDate)}</td>
                    <td className="px-4 py-3 text-[13px] text-right font-medium">{formatCurrency(Number(inv.totalAmount))}</td>
                    <td className="px-4 py-3 text-center"><StatusBadge status={inv.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
