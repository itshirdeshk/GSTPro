'use client';

import { StatCard, Card } from '@/components/ui/card';
import { DataTable } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';
import { restaurantStats } from '@/lib/mock-data/analytics';
import { formatCurrency } from '@/lib/utils';
import {
  UtensilsCrossed,
  ReceiptIndianRupee,
  Wallet,
  XCircle,
  TrendingUp,
  Store,
  Bike,
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from 'recharts';

export function RestaurantDashboard() {
  const columns = [
    { key: 'id', header: 'Order ID' },
    {
      key: 'platform',
      header: 'Source',
      render: (item: any) => (
        <div className="flex items-center gap-2">
          {item.platform === 'Swiggy' ? (
            <Bike className="w-3.5 h-3.5 text-[#fc8019]" />
          ) : item.platform === 'Zomato' ? (
            <Bike className="w-3.5 h-3.5 text-[#cb202d]" />
          ) : (
            <Store className="w-3.5 h-3.5 text-text3" />
          )}
          <span>{item.platform}</span>
        </div>
      ),
    },
    { key: 'items', header: 'Items', className: 'max-w-[200px] truncate' },
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
            : item.status === 'Preparing'
            ? 'amber'
            : 'cyan';
        return <Badge variant={variant}>{item.status}</Badge>;
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Daily Order Value"
          value={formatCurrency(restaurantStats.totalDailyOrderValue)}
          change="5.2%"
          changeType="up"
          icon={<UtensilsCrossed className="w-5 h-5" />}
          color="cyan"
        />
        <StatCard
          label="Avg. Order Value (AOV)"
          value={formatCurrency(restaurantStats.averageOrderValue)}
          change="₹15 from yesterday"
          changeType="up"
          icon={<ReceiptIndianRupee className="w-5 h-5" />}
          color="green"
        />
        <StatCard
          label="Commission Paid"
          value={formatCurrency(restaurantStats.commissionPaid)}
          change="8.4%"
          changeType="up"
          icon={<Wallet className="w-5 h-5" />}
          color="amber"
        />
        <StatCard
          label="Cancelled Orders"
          value={String(restaurantStats.cancelledOrders)}
          change="2 less than yesterday"
          changeType="down"
          icon={<XCircle className="w-5 h-5" />}
          color="red"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-heading font-semibold text-lg">Sales Breakdown</h3>
            <div className="flex gap-2">
              <span className="flex items-center gap-1.5 text-xs text-text3 bg-surface-hover px-2 py-1 rounded">
                <div className="w-2 h-2 rounded-full bg-[#fc8019]" /> Swiggy
              </span>
              <span className="flex items-center gap-1.5 text-xs text-text3 bg-surface-hover px-2 py-1 rounded">
                <div className="w-2 h-2 rounded-full bg-[#cb202d]" /> Zomato
              </span>
              <span className="flex items-center gap-1.5 text-xs text-text3 bg-surface-hover px-2 py-1 rounded">
                <div className="w-2 h-2 rounded-full bg-[#6c63ff]" /> Dine-in
              </span>
            </div>
          </div>
          <div className="h-[350px] w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={restaurantStats.platformBreakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={120}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {restaurantStats.platformBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--surface)',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border)',
                    color: 'var(--text)',
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                  }}
                  itemStyle={{ color: 'var(--text2)' }}
                  formatter={(value: any) => formatCurrency(Number(value || 0))}
                />
                <Legend iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="flex flex-col justify-between">
          <div>
            <h3 className="font-heading font-semibold text-lg mb-2">Performance Insight</h3>
            <p className="text-text3 text-sm mb-6">Your online orders are up by 15% this week.</p>
            
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-green/10 flex items-center justify-center shrink-0">
                  <TrendingUp className="w-4 h-4 text-green" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold">Busiest Hour</h4>
                  <p className="text-xs text-text3">7:00 PM - 9:00 PM</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                  <UtensilsCrossed className="w-4 h-4 text-accent2" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold">Top Selling Dish</h4>
                  <p className="text-xs text-text3">Paneer Butter Masala (45 orders)</p>
                </div>
              </div>
            </div>
          </div>
          
          <button className="w-full mt-8 py-2.5 bg-surface-hover hover:bg-surface-hover/80 text-text2 text-sm font-medium rounded-lg transition-colors">
            Download Weekly Report
          </button>
        </Card>
      </div>

      <Card>
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-heading font-semibold text-lg">Today&apos;s Orders</h3>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 text-xs text-green font-medium animate-pulse">
              <div className="w-1.5 h-1.5 rounded-full bg-green" /> Live
            </span>
          </div>
        </div>
        <DataTable
          columns={columns}
          data={restaurantStats.todaysOrders}
          keyField="id"
        />
      </Card>
    </div>
  );
}
