'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Download, BarChart3, FileText, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Tabs } from '@/components/ui/tabs';
import { apiGet } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import type { SalesReport, GSTReport } from '@/lib/types';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const reportTabs = [
  { key: 'sales', label: 'Sales Report' },
  { key: 'gst', label: 'GST Report' },
  { key: 'pnl', label: 'Profit & Loss' },
];

// Mock data for initial rendering
const mockSales = [
  { month: 'Jan', revenue: 120000, count: 8 },
  { month: 'Feb', revenue: 185000, count: 12 },
  { month: 'Mar', revenue: 145000, count: 10 },
  { month: 'Apr', revenue: 210000, count: 15 },
  { month: 'May', revenue: 178000, count: 11 },
  { month: 'Jun', revenue: 235000, count: 16 },
];

const mockGstByRate = [
  { rate: 5, taxable: 125000, tax: 6250, color: '#22c55e' },
  { rate: 12, taxable: 280000, tax: 33600, color: '#f59e0b' },
  { rate: 18, taxable: 650000, tax: 117000, color: '#6c63ff' },
  { rate: 28, taxable: 180000, tax: 50400, color: '#ef4444' },
];

export default function ReportsPage() {
  const [tab, setTab] = useState('sales');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-heading text-lg font-bold">Reports</h2>
          <p className="text-sm text-text3">Business analytics & tax reports</p>
        </div>
        <Button variant="secondary" icon={<Download size={16} />} size="sm">Export CSV</Button>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <Tabs tabs={reportTabs} activeTab={tab} onChange={setTab} />
        <div className="flex gap-2 ml-auto">
          <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="!w-40" />
          <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="!w-40" />
        </div>
      </div>

      {tab === 'sales' && <SalesReportView fromDate={fromDate} toDate={toDate} />}
      {tab === 'gst' && <GSTReportView fromDate={fromDate} toDate={toDate} />}
      {tab === 'pnl' && <PnLReportView fromDate={fromDate} toDate={toDate} />}
    </div>
  );
}

function SalesReportView({ fromDate, toDate }: { fromDate: string; toDate: string }) {
  const { data } = useQuery({
    queryKey: ['report-sales', fromDate, toDate],
    queryFn: () => apiGet<SalesReport>('/reports/sales', { fromDate: fromDate || undefined, toDate: toDate || undefined }),
    retry: false,
  });

  const sales = data?.monthlySales || mockSales;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <p className="text-text3 text-sm mb-1">Total Revenue</p>
          <p className="font-heading text-2xl font-bold text-green">{formatCurrency(data?.totalRevenue || 1073000)}</p>
        </Card>
        <Card>
          <p className="text-text3 text-sm mb-1">Total Invoices</p>
          <p className="font-heading text-2xl font-bold">{data?.totalInvoices || 72}</p>
        </Card>
        <Card>
          <p className="text-text3 text-sm mb-1">Avg Invoice Value</p>
          <p className="font-heading text-2xl font-bold text-accent2">{formatCurrency(data?.averageInvoiceValue || 14903)}</p>
        </Card>
      </div>

      <Card>
        <h3 className="font-heading text-base font-bold mb-4">Monthly Sales</h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={sales}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2d3e" />
              <XAxis dataKey="month" stroke="#606880" fontSize={12} />
              <YAxis stroke="#606880" fontSize={12} tickFormatter={(v) => `₹${v / 1000}k`} />
              <Tooltip
                contentStyle={{ background: '#1e2130', border: '1px solid #2a2d3e', borderRadius: '8px', color: '#f0f2ff', fontSize: '13px' }}
                formatter={(value) => [formatCurrency(value as number), 'Revenue']}
              />
              <Bar dataKey="revenue" fill="#6c63ff" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}

function GSTReportView({ fromDate, toDate }: { fromDate: string; toDate: string }) {
  const { data } = useQuery({
    queryKey: ['report-gst', fromDate, toDate],
    queryFn: () => apiGet<GSTReport>('/reports/gst', { fromDate: fromDate || undefined, toDate: toDate || undefined }),
    retry: false,
  });

  const byRate = data?.gstByRate || mockGstByRate;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="text-center">
          <p className="text-text3 text-sm mb-1">CGST</p>
          <p className="font-heading text-xl font-bold">{formatCurrency(data?.totalCgst || 58625)}</p>
        </Card>
        <Card className="text-center">
          <p className="text-text3 text-sm mb-1">SGST</p>
          <p className="font-heading text-xl font-bold">{formatCurrency(data?.totalSgst || 58625)}</p>
        </Card>
        <Card className="text-center">
          <p className="text-text3 text-sm mb-1">IGST</p>
          <p className="font-heading text-xl font-bold">{formatCurrency(data?.totalIgst || 90000)}</p>
        </Card>
        <Card className="text-center">
          <p className="text-text3 text-sm mb-1">Total GST</p>
          <p className="font-heading text-xl font-bold text-accent2">{formatCurrency(data?.totalGst || 207250)}</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <h3 className="font-heading text-base font-bold mb-4">GST by Rate</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={byRate} cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={4} dataKey="tax">
                  {byRate.map((entry: any, idx: number) => (
                    <Cell key={idx} fill={entry.color || '#6c63ff'} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: '#1e2130', border: '1px solid #2a2d3e', borderRadius: '8px', color: '#f0f2ff', fontSize: '13px' }}
                  formatter={(value) => formatCurrency(value as number)}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <h3 className="font-heading text-base font-bold mb-4">Rate-wise Breakdown</h3>
          <div className="space-y-3">
            {byRate.map((item: any) => (
              <div key={item.rate} className="flex items-center justify-between p-3 bg-bg3 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full" style={{ background: item.color || '#6c63ff' }} />
                  <span className="font-medium">{item.rate}% GST</span>
                </div>
                <div className="text-right">
                  <p className="font-medium">{formatCurrency(item.tax)}</p>
                  <p className="text-xs text-text3">Taxable: {formatCurrency(item.taxable)}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

function PnLReportView({ fromDate, toDate }: { fromDate: string; toDate: string }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="text-center">
          <p className="text-text3 text-sm mb-1">Total Income</p>
          <p className="font-heading text-2xl font-bold text-green">{formatCurrency(1073000)}</p>
        </Card>
        <Card className="text-center">
          <p className="text-text3 text-sm mb-1">Total Expenses</p>
          <p className="font-heading text-2xl font-bold text-red">{formatCurrency(456000)}</p>
        </Card>
        <Card className="text-center">
          <p className="text-text3 text-sm mb-1">Net Profit</p>
          <p className="font-heading text-2xl font-bold text-accent2">{formatCurrency(617000)}</p>
        </Card>
      </div>

      <Card>
        <h3 className="font-heading text-base font-bold mb-4">Income vs Expenses</h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={[
              { month: 'Jan', income: 120000, expenses: 45000 },
              { month: 'Feb', income: 185000, expenses: 62000 },
              { month: 'Mar', income: 145000, expenses: 55000 },
              { month: 'Apr', income: 210000, expenses: 78000 },
              { month: 'May', income: 178000, expenses: 67000 },
              { month: 'Jun', income: 235000, expenses: 89000 },
            ]}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2d3e" />
              <XAxis dataKey="month" stroke="#606880" fontSize={12} />
              <YAxis stroke="#606880" fontSize={12} tickFormatter={(v) => `₹${v / 1000}k`} />
              <Tooltip
                contentStyle={{ background: '#1e2130', border: '1px solid #2a2d3e', borderRadius: '8px', color: '#f0f2ff', fontSize: '13px' }}
                formatter={(value) => formatCurrency(value as number)}
              />
              <Bar dataKey="income" fill="#22c55e" radius={[6, 6, 0, 0]} name="Income" />
              <Bar dataKey="expenses" fill="#ef4444" radius={[6, 6, 0, 0]} name="Expenses" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}
