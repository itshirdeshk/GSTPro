'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Tabs } from '@/components/ui/tabs';
import { Spinner } from '@/components/ui/spinner';
import { StatusBadge } from '@/components/ui/badge';
import { apiGet } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import type { SalesReport, GSTReport, ProfitLossReport, OutstandingReport, QuotationReport } from '@/lib/types';
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
  Legend,
} from 'recharts';

const CHART_COLORS = ['#6c63ff', '#22c55e', '#f59e0b', '#ef4444', '#06b6d4', '#8b5cf6', '#f97316'];

const reportTabs = [
  { key: 'sales', label: 'Sales Report' },
  { key: 'gst', label: 'GST Report' },
  { key: 'pnl', label: 'Profit & Loss' },
  { key: 'quotations', label: 'Quotations' },
  { key: 'outstanding', label: 'Outstanding' },
];

function currentFYDates() {
  const today = new Date();
  const fyStart = today.getMonth() >= 3
    ? new Date(today.getFullYear(), 3, 1)
    : new Date(today.getFullYear() - 1, 3, 1);
  return {
    from: fyStart.toISOString().split('T')[0],
    to: today.toISOString().split('T')[0],
  };
}

function formatMonth(ym: string) {
  const [year, month] = ym.split('-');
  const d = new Date(Number(year), Number(month) - 1, 1);
  return d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
}

export default function ReportsPage() {
  const { from: defaultFrom, to: defaultTo } = currentFYDates();
  const [tab, setTab] = useState('sales');
  const [fromDate, setFromDate] = useState(defaultFrom);
  const [toDate, setToDate] = useState(defaultTo);

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
        {tab !== 'outstanding' && (
          <div className="flex gap-2 ml-auto">
            <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="w-40!" />
            <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="w-40!" />
          </div>
        )}
      </div>

      {tab === 'sales' && <SalesReportView fromDate={fromDate} toDate={toDate} />}
      {tab === 'gst' && <GSTReportView fromDate={fromDate} toDate={toDate} />}
      {tab === 'pnl' && <PnLReportView fromDate={fromDate} toDate={toDate} />}
      {tab === 'quotations' && <QuotationReportView fromDate={fromDate} toDate={toDate} />}
      {tab === 'outstanding' && <OutstandingReportView />}
    </div>
  );
}

function QuotationReportView({ fromDate, toDate }: { fromDate: string; toDate: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ['report-quotations', fromDate, toDate],
    queryFn: () => apiGet<QuotationReport>('/reports/quotations', { fromDate, toDate }),
    enabled: !!fromDate && !!toDate,
  });

  if (isLoading) return <div className="flex justify-center py-16"><Spinner /></div>;

  const { summary, byStatus = [], topCustomers = [], monthlyTrend = [] } = data || {};
  const trendData = monthlyTrend.map((m) => ({ ...m, month: formatMonth(m.month) }));
  const statusData = byStatus.map((item, idx) => ({
    ...item,
    color: CHART_COLORS[idx % CHART_COLORS.length],
  }));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="text-center">
          <p className="text-text3 text-sm mb-1">Quotations</p>
          <p className="font-heading text-2xl font-bold">{summary?.quotationCount || 0}</p>
        </Card>
        <Card className="text-center">
          <p className="text-text3 text-sm mb-1">Total Value</p>
          <p className="font-heading text-2xl font-bold text-accent2">{formatCurrency(summary?.totalValue || 0)}</p>
        </Card>
        <Card className="text-center">
          <p className="text-text3 text-sm mb-1">Acceptance Rate</p>
          <p className="font-heading text-2xl font-bold text-green">{summary?.acceptanceRate || 0}%</p>
        </Card>
        <Card className="text-center">
          <p className="text-text3 text-sm mb-1">Conversion Rate</p>
          <p className="font-heading text-2xl font-bold text-cyan">{summary?.conversionRate || 0}%</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <h3 className="font-heading text-base font-bold mb-4">Status Mix</h3>
          {statusData.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusData} cx="50%" cy="50%" innerRadius={50} outerRadius={90} dataKey="count" nameKey="status" paddingAngle={4}>
                    {statusData.map((entry, idx) => (
                      <Cell key={idx} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: '#1e2130', border: '1px solid #2a2d3e', borderRadius: '8px', color: '#f0f2ff', fontSize: '13px' }}
                  />
                  <Legend formatter={(value) => <span className="text-xs text-text3">{value}</span>} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-text3 text-sm text-center py-12">No quotation data for selected period</p>
          )}
        </Card>

        <Card>
          <h3 className="font-heading text-base font-bold mb-4">Top Customers by Quotation Value</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {topCustomers.length > 0 ? topCustomers.map((customer, idx) => (
              <div key={customer.customerId} className="flex items-center justify-between p-3 bg-bg3 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-accent/20 text-accent text-xs flex items-center justify-center font-bold">{idx + 1}</span>
                  <div>
                    <p className="font-medium text-sm">{customer.customerName}</p>
                    <p className="text-xs text-text3">{customer.quotationCount} quotation{customer.quotationCount !== 1 ? 's' : ''}</p>
                  </div>
                </div>
                <span className="font-bold text-accent2">{formatCurrency(customer.total)}</span>
              </div>
            )) : (
              <p className="text-text3 text-sm text-center py-8">No customer data for selected period</p>
            )}
          </div>
        </Card>
      </div>

      <Card>
        <h3 className="font-heading text-base font-bold mb-4">Monthly Quotation Value Trend</h3>
        {trendData.length > 0 ? (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2d3e" />
                <XAxis dataKey="month" stroke="#606880" fontSize={12} />
                <YAxis stroke="#606880" fontSize={12} tickFormatter={(v) => `₹${v / 1000}k`} />
                <Tooltip
                  contentStyle={{ background: '#1e2130', border: '1px solid #2a2d3e', borderRadius: '8px', color: '#f0f2ff', fontSize: '13px' }}
                  formatter={(value) => [formatCurrency(value as number), 'Value']}
                />
                <Bar dataKey="total" fill="#06b6d4" radius={[6, 6, 0, 0]} name="Value" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="text-text3 text-sm text-center py-8">No monthly data for selected period</p>
        )}
      </Card>
    </div>
  );
}

function SalesReportView({ fromDate, toDate }: { fromDate: string; toDate: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ['report-sales', fromDate, toDate],
    queryFn: () => apiGet<SalesReport>('/reports/sales', { fromDate, toDate }),
    enabled: !!fromDate && !!toDate,
  });

  if (isLoading) return <div className="flex justify-center py-16"><Spinner /></div>;

  const { summary, monthlyTrend = [], topCustomers = [] } = data || {};
  const avgInvoiceValue = summary && summary.invoiceCount > 0
    ? summary.totalRevenue / summary.invoiceCount
    : 0;
  const chartData = monthlyTrend.map((m) => ({ ...m, month: formatMonth(m.month) }));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <p className="text-text3 text-sm mb-1">Total Revenue</p>
          <p className="font-heading text-2xl font-bold text-green">{formatCurrency(summary?.totalRevenue || 0)}</p>
        </Card>
        <Card>
          <p className="text-text3 text-sm mb-1">Total Invoices</p>
          <p className="font-heading text-2xl font-bold">{summary?.invoiceCount || 0}</p>
        </Card>
        <Card>
          <p className="text-text3 text-sm mb-1">Avg Invoice Value</p>
          <p className="font-heading text-2xl font-bold text-accent2">{formatCurrency(avgInvoiceValue)}</p>
        </Card>
        <Card>
          <p className="text-text3 text-sm mb-1">Outstanding</p>
          <p className="font-heading text-2xl font-bold text-red">{formatCurrency(summary?.totalOutstanding || 0)}</p>
        </Card>
      </div>

      <Card>
        <h3 className="font-heading text-base font-bold mb-4">Monthly Revenue Trend</h3>
        {chartData.length > 0 ? (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2d3e" />
                <XAxis dataKey="month" stroke="#606880" fontSize={12} />
                <YAxis stroke="#606880" fontSize={12} tickFormatter={(v) => `₹${v / 1000}k`} />
                <Tooltip
                  contentStyle={{ background: '#1e2130', border: '1px solid #2a2d3e', borderRadius: '8px', color: '#f0f2ff', fontSize: '13px' }}
                  formatter={(value) => [formatCurrency(value as number), 'Revenue']}
                />
                <Bar dataKey="total" fill="#6c63ff" radius={[6, 6, 0, 0]} name="Revenue" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="text-text3 text-sm text-center py-8">No data for selected period</p>
        )}
      </Card>

      {topCustomers.length > 0 && (
        <Card>
          <h3 className="font-heading text-base font-bold mb-4">Top Customers</h3>
          <div className="space-y-2">
            {topCustomers.map((c, idx) => (
              <div key={c.customerId} className="flex items-center justify-between p-3 bg-bg3 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-accent/20 text-accent text-xs flex items-center justify-center font-bold">{idx + 1}</span>
                  <span className="font-medium">{c.customerName}</span>
                  <span className="text-text3 text-xs">{c.invoiceCount} invoices</span>
                </div>
                <span className="font-bold text-green">{formatCurrency(c.total)}</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

function GSTReportView({ fromDate, toDate }: { fromDate: string; toDate: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ['report-gst', fromDate, toDate],
    queryFn: () => apiGet<GSTReport>('/reports/gst', { fromDate, toDate }),
    enabled: !!fromDate && !!toDate,
  });

  if (isLoading) return <div className="flex justify-center py-16"><Spinner /></div>;

  const { summary, byGstRate = [], monthlyTrend = [] } = data || {};
  const pieData = byGstRate.map((r, idx) => ({
    name: `${r.gstRate}% GST`,
    value: r.cgst + r.sgst + r.igst,
    color: CHART_COLORS[idx % CHART_COLORS.length],
    taxableAmount: r.taxableAmount,
  }));
  const trendData = monthlyTrend.map((m) => ({ ...m, month: formatMonth(m.month) }));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="text-center">
          <p className="text-text3 text-sm mb-1">CGST</p>
          <p className="font-heading text-xl font-bold">{formatCurrency(summary?.cgst || 0)}</p>
        </Card>
        <Card className="text-center">
          <p className="text-text3 text-sm mb-1">SGST</p>
          <p className="font-heading text-xl font-bold">{formatCurrency(summary?.sgst || 0)}</p>
        </Card>
        <Card className="text-center">
          <p className="text-text3 text-sm mb-1">IGST</p>
          <p className="font-heading text-xl font-bold">{formatCurrency(summary?.igst || 0)}</p>
        </Card>
        <Card className="text-center">
          <p className="text-text3 text-sm mb-1">Output GST</p>
          <p className="font-heading text-xl font-bold text-accent2">{formatCurrency(summary?.totalOutputGst || 0)}</p>
        </Card>
        <Card className="text-center">
          <p className="text-text3 text-sm mb-1">Input GST (Expenses)</p>
          <p className="font-heading text-xl font-bold text-green">{formatCurrency(summary?.totalInputGst || 0)}</p>
        </Card>
        <Card className="text-center">
          <p className="text-text3 text-sm mb-1">Net GST Liability</p>
          <p className="font-heading text-xl font-bold text-red">{formatCurrency(summary?.netGstLiability || 0)}</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <h3 className="font-heading text-base font-bold mb-4">GST by Rate</h3>
          {pieData.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={4} dataKey="value">
                    {pieData.map((entry, idx) => (
                      <Cell key={idx} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: '#1e2130', border: '1px solid #2a2d3e', borderRadius: '8px', color: '#f0f2ff', fontSize: '13px' }}
                    formatter={(value) => [formatCurrency(value as number), 'Tax']}
                  />
                  <Legend formatter={(value) => <span className="text-xs text-text3">{value}</span>} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-text3 text-sm text-center py-16">No data for selected period</p>
          )}
        </Card>

        <Card>
          <h3 className="font-heading text-base font-bold mb-4">Rate-wise Breakdown</h3>
          <div className="space-y-3">
            {byGstRate.length > 0 ? byGstRate.map((item, idx) => (
              <div key={item.gstRate} className="flex items-center justify-between p-3 bg-bg3 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full" style={{ background: CHART_COLORS[idx % CHART_COLORS.length] }} />
                  <span className="font-medium">{item.gstRate}% GST</span>
                </div>
                <div className="text-right">
                  <p className="font-medium">{formatCurrency(item.cgst + item.sgst + item.igst)}</p>
                  <p className="text-xs text-text3">Taxable: {formatCurrency(item.taxableAmount)}</p>
                </div>
              </div>
            )) : (
              <p className="text-text3 text-sm text-center py-8">No data for selected period</p>
            )}
          </div>
        </Card>
      </div>

      {trendData.length > 0 && (
        <Card>
          <h3 className="font-heading text-base font-bold mb-4">Monthly GST Trend</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2d3e" />
                <XAxis dataKey="month" stroke="#606880" fontSize={12} />
                <YAxis stroke="#606880" fontSize={12} tickFormatter={(v) => `₹${v / 1000}k`} />
                <Tooltip
                  contentStyle={{ background: '#1e2130', border: '1px solid #2a2d3e', borderRadius: '8px', color: '#f0f2ff', fontSize: '13px' }}
                  formatter={(value) => [formatCurrency(value as number)]}
                />
                <Bar dataKey="cgst" fill="#6c63ff" stackId="a" name="CGST" />
                <Bar dataKey="sgst" fill="#22c55e" stackId="a" name="SGST" />
                <Bar dataKey="igst" fill="#f59e0b" stackId="a" name="IGST" radius={[6, 6, 0, 0]} />
                <Legend />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}
    </div>
  );
}

function PnLReportView({ fromDate, toDate }: { fromDate: string; toDate: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ['report-pnl', fromDate, toDate],
    queryFn: () => apiGet<ProfitLossReport>('/reports/profit-loss', { fromDate, toDate }),
    enabled: !!fromDate && !!toDate,
  });

  if (isLoading) return <div className="flex justify-center py-16"><Spinner /></div>;

  const { income, expenses, profitLoss } = data || {};
  const categories = expenses?.byCategory || [];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="text-center">
          <p className="text-text3 text-sm mb-1">Total Income</p>
          <p className="font-heading text-2xl font-bold text-green">{formatCurrency(income?.revenue || 0)}</p>
        </Card>
        <Card className="text-center">
          <p className="text-text3 text-sm mb-1">Total Expenses</p>
          <p className="font-heading text-2xl font-bold text-red">{formatCurrency(expenses?.total || 0)}</p>
        </Card>
        <Card className="text-center">
          <p className="text-text3 text-sm mb-1">Net Profit</p>
          <p className={`font-heading text-2xl font-bold ${profitLoss?.isProfit !== false ? 'text-green' : 'text-red'}`}>
            {formatCurrency(profitLoss?.netProfit || 0)}
          </p>
        </Card>
        <Card className="text-center">
          <p className="text-text3 text-sm mb-1">Profit Margin</p>
          <p className={`font-heading text-2xl font-bold ${profitLoss?.isProfit !== false ? 'text-green' : 'text-red'}`}>
            {profitLoss?.profitMargin?.toFixed(1) ?? '0'}%
          </p>
        </Card>
      </div>

      {categories.length > 0 && (
        <Card>
          <h3 className="font-heading text-base font-bold mb-4">Expenses by Category</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categories} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2d3e" />
                <XAxis type="number" stroke="#606880" fontSize={12} tickFormatter={(v) => `₹${v / 1000}k`} />
                <YAxis dataKey="category" type="category" stroke="#606880" fontSize={11} width={110} />
                <Tooltip
                  contentStyle={{ background: '#1e2130', border: '1px solid #2a2d3e', borderRadius: '8px', color: '#f0f2ff', fontSize: '13px' }}
                  formatter={(value) => [formatCurrency(value as number), 'Amount']}
                />
                <Bar dataKey="amount" fill="#ef4444" radius={[0, 6, 6, 0]} name="Expenses" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <h3 className="font-heading text-base font-bold mb-3">Income Breakdown</h3>
          <div className="space-y-2">
            <div className="flex justify-between p-3 bg-bg3 rounded-lg">
              <span className="text-text3">Taxable Revenue</span>
              <span className="font-medium">{formatCurrency(income?.revenue || 0)}</span>
            </div>
            <div className="flex justify-between p-3 bg-bg3 rounded-lg">
              <span className="text-text3">Total Invoice Amount (incl. tax)</span>
              <span className="font-medium">{formatCurrency(income?.totalInvoiceAmount || 0)}</span>
            </div>
            <div className="flex justify-between p-3 bg-bg3 rounded-lg">
              <span className="text-text3">Discounts Given</span>
              <span className="font-medium text-red">-{formatCurrency(income?.discount || 0)}</span>
            </div>
          </div>
        </Card>
        <Card>
          <h3 className="font-heading text-base font-bold mb-3">Expense Summary</h3>
          <div className="space-y-2">
            <div className="flex justify-between p-3 bg-bg3 rounded-lg">
              <span className="text-text3">Total Expenses</span>
              <span className="font-medium text-red">{formatCurrency(expenses?.total || 0)}</span>
            </div>
            <div className="flex justify-between p-3 bg-bg3 rounded-lg">
              <span className="text-text3">GST on Expenses (Input)</span>
              <span className="font-medium">{formatCurrency(expenses?.gstOnExpenses || 0)}</span>
            </div>
            <div className="flex justify-between p-3 bg-bg3 rounded-lg">
              <span className="text-text3">Expense Count</span>
              <span className="font-medium">{expenses?.count || 0}</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

function OutstandingReportView() {
  const { data, isLoading } = useQuery({
    queryKey: ['report-outstanding'],
    queryFn: () => apiGet<OutstandingReport>('/reports/outstanding'),
  });

  if (isLoading) return <div className="flex justify-center py-16"><Spinner /></div>;

  const { summary, ageing, byCustomer = [], invoices = [] } = data || {};
  const ageingData = ageing
    ? Object.entries(ageing).map(([label, value], idx) => ({
        label,
        value,
        color: CHART_COLORS[idx % CHART_COLORS.length],
      }))
    : [];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="text-center">
          <p className="text-text3 text-sm mb-1">Total Outstanding</p>
          <p className="font-heading text-2xl font-bold text-red">{formatCurrency(summary?.totalOutstanding || 0)}</p>
        </Card>
        <Card className="text-center">
          <p className="text-text3 text-sm mb-1">Invoices</p>
          <p className="font-heading text-2xl font-bold">{summary?.invoiceCount || 0}</p>
        </Card>
        <Card className="text-center">
          <p className="text-text3 text-sm mb-1">Overdue</p>
          <p className="font-heading text-2xl font-bold text-red">{summary?.overdueCount || 0}</p>
        </Card>
        <Card className="text-center">
          <p className="text-text3 text-sm mb-1">Total Collected</p>
          <p className="font-heading text-2xl font-bold text-green">{formatCurrency(summary?.totalPaid || 0)}</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <h3 className="font-heading text-base font-bold mb-4">Ageing Analysis</h3>
          {ageingData.some((a) => a.value > 0) ? (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ageingData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2a2d3e" />
                  <XAxis dataKey="label" stroke="#606880" fontSize={11} />
                  <YAxis stroke="#606880" fontSize={12} tickFormatter={(v) => `₹${v / 1000}k`} />
                  <Tooltip
                    contentStyle={{ background: '#1e2130', border: '1px solid #2a2d3e', borderRadius: '8px', color: '#f0f2ff', fontSize: '13px' }}
                    formatter={(value) => [formatCurrency(value as number), 'Outstanding']}
                  />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {ageingData.map((entry, idx) => (
                      <Cell key={idx} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-text3 text-sm text-center py-12">No outstanding invoices</p>
          )}
        </Card>

        <Card>
          <h3 className="font-heading text-base font-bold mb-4">By Customer</h3>
          <div className="space-y-2 max-h-56 overflow-y-auto">
            {byCustomer.length > 0 ? byCustomer.map((c) => (
              <div key={c.customerId} className="flex items-center justify-between p-3 bg-bg3 rounded-lg">
                <div>
                  <p className="font-medium text-sm">{c.customerName}</p>
                  <p className="text-xs text-text3">{c.invoiceCount} invoice{c.invoiceCount !== 1 ? 's' : ''}</p>
                </div>
                <span className="font-bold text-red">{formatCurrency(c.outstanding)}</span>
              </div>
            )) : (
              <p className="text-text3 text-sm text-center py-8">No outstanding invoices</p>
            )}
          </div>
        </Card>
      </div>

      {invoices.length > 0 && (
        <Card>
          <h3 className="font-heading text-base font-bold mb-4">Invoice List</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-3 text-text3 font-medium">Invoice #</th>
                  <th className="text-left py-2 px-3 text-text3 font-medium">Customer</th>
                  <th className="text-left py-2 px-3 text-text3 font-medium">Due Date</th>
                  <th className="text-right py-2 px-3 text-text3 font-medium">Amount</th>
                  <th className="text-right py-2 px-3 text-text3 font-medium">Outstanding</th>
                  <th className="text-center py-2 px-3 text-text3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr key={inv.id} className="border-b border-border/50 hover:bg-bg3/50 transition-colors">
                    <td className="py-2 px-3 font-medium">{inv.invoiceNumber}</td>
                    <td className="py-2 px-3">{inv.customer.name}</td>
                    <td className={`py-2 px-3 ${inv.isOverdue ? 'text-red' : 'text-text3'}`}>
                      {new Date(inv.dueDate).toLocaleDateString('en-IN')}
                      {inv.isOverdue && <span className="ml-1 text-xs">(Overdue)</span>}
                    </td>
                    <td className="py-2 px-3 text-right">{formatCurrency(inv.totalAmount)}</td>
                    <td className="py-2 px-3 text-right font-bold text-red">{formatCurrency(inv.outstanding)}</td>
                    <td className="py-2 px-3 text-center">
                      <StatusBadge status={inv.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

