'use client';

import Link from 'next/link';
import { StatCard, Card } from '@/components/ui/card';
import { DataTable } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';
import { ecommerceStats, ECOMMERCE_PLATFORMS } from '@/lib/mock-data/analytics';
import { formatCurrency } from '@/lib/utils';
import {
  ShoppingBag,
  ArrowUpRight,
  ArrowDownRight,
  RotateCcw,
  CreditCard,
  ExternalLink,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

export function EcommerceDashboard() {
  const columns = [
    { key: 'id', header: 'Order ID' },
    {
      key: 'platform',
      header: 'Platform',
      render: (item: any) => (
        <div className="flex items-center gap-2">
          <span className="font-medium">{item.platform}</span>
        </div>
      ),
    },
    { key: 'date', header: 'Date' },
    {
      key: 'amount',
      header: 'Amount',
      render: (item: any) => formatCurrency(item.amount),
    },
    {
      key: 'status',
      header: 'Status',
      render: (item: any) => {
        const variant =
          item.status === 'Delivered'
            ? 'green'
            : item.status === 'Returned'
            ? 'red'
            : 'amber';
        return <Badge variant={variant}>{item.status}</Badge>;
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Gross Sales"
          value={formatCurrency(ecommerceStats.totalGrossSales)}
          change="12.5%"
          changeType="up"
          icon={<ShoppingBag className="w-5 h-5" />}
          color="accent"
        />
        <StatCard
          label="Net Sales"
          value={formatCurrency(ecommerceStats.netSales)}
          change="8.2%"
          changeType="up"
          icon={<ArrowUpRight className="w-5 h-5" />}
          color="green"
        />
        <StatCard
          label="Returns/Cancellations"
          value={formatCurrency(ecommerceStats.returnsCancellations)}
          change="4.1%"
          changeType="down"
          icon={<RotateCcw className="w-5 h-5" />}
          color="red"
        />
        <StatCard
          label="Platform Fees"
          value={formatCurrency(ecommerceStats.platformFees)}
          change="2.4%"
          changeType="up"
          icon={<CreditCard className="w-5 h-5" />}
          color="amber"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-heading font-semibold text-lg">Sales Trend</h3>
              <p className="text-text3 text-sm">Monthly sales distribution by platform</p>
            </div>
            <select className="bg-surface border border-border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20">
              <option>Last 6 Months</option>
              <option>Last 12 Months</option>
            </select>
          </div>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ecommerceStats.trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#9ca3af', fontSize: 12 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#9ca3af', fontSize: 12 }}
                  tickFormatter={(value) => `₹${value / 1000}k`}
                />
                <Tooltip
                  cursor={{ fill: 'var(--surface-hover)' }}
                  contentStyle={{
                    backgroundColor: 'var(--surface)',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border)',
                    color: 'var(--text)',
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                  }}
                  itemStyle={{ color: 'var(--text2)' }}
                />
                <Legend iconType="circle" />
                <Bar dataKey="Flipkart" stackId="a" fill="#2874f0" radius={[0, 0, 0, 0]} />
                <Bar dataKey="Amazon" stackId="a" fill="#ff9900" radius={[0, 0, 0, 0]} />
                <Bar dataKey="Meesho" stackId="a" fill="#ff47be" radius={[0, 0, 0, 0]} />
                <Bar dataKey="Myntra" stackId="a" fill="#ff3f6c" radius={[0, 0, 0, 0]} />
                <Bar dataKey="Ajio" stackId="a" fill="#2c4152" radius={[0, 0, 0, 0]} />
                <Bar dataKey="Snapdeal" stackId="a" fill="#e40046" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-heading font-semibold text-lg">Platform Split</h3>
            <Link
              href="/analytics/ecommerce/details"
              className="text-accent2 hover:underline text-sm flex items-center gap-1"
            >
              Details <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-4">
            {ECOMMERCE_PLATFORMS.map((platform) => {
              // Calculate a dummy percentage for visual representation
              const total = ecommerceStats.trendData.reduce((acc, curr) => acc + (curr as any)[platform], 0);
              const allTotal = ecommerceStats.trendData.reduce((acc, curr) => {
                return acc + Object.keys(curr).filter(k => k !== 'month').reduce((s, k) => s + (curr as any)[k], 0);
              }, 0);
              const percentage = Math.round((total / allTotal) * 100);

              return (
                <div key={platform} className="space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{platform}</span>
                    <span className="text-text3">{percentage}%</span>
                  </div>
                  <div className="h-2 w-full bg-surface-hover rounded-full overflow-hidden">
                    <div
                      className="h-full bg-accent transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      <Card>
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-heading font-semibold text-lg">Recent Orders</h3>
          <Link
            href="/analytics/ecommerce/orders"
            className="text-accent2 hover:underline text-sm"
          >
            View All
          </Link>
        </div>
        <DataTable
          columns={columns}
          data={ecommerceStats.recentOrders}
          keyField="id"
        />
      </Card>
    </div>
  );
}
