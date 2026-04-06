'use client';

import { Card, StatCard } from '@/components/ui/card';
import { ecommerceStats, ECOMMERCE_PLATFORMS } from '@/lib/mock-data/analytics';
import { formatCurrency } from '@/lib/utils';
import { ShoppingBag, ArrowLeft, TrendingUp, TrendingDown, Info } from 'lucide-react';
import Link from 'next/link';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
} from 'recharts';

export default function EcommercePlatformDetailsPage() {
  const platformData = ECOMMERCE_PLATFORMS.map((platform) => {
    const total = ecommerceStats.trendData.reduce((acc, curr) => acc + (curr as any)[platform], 0);
    const prevMonthTotal = (ecommerceStats.trendData[ecommerceStats.trendData.length - 2] as any)[platform];
    const currentMonthTotal = (ecommerceStats.trendData[ecommerceStats.trendData.length - 1] as any)[platform];
    const growth = ((currentMonthTotal - prevMonthTotal) / prevMonthTotal) * 100;

    return {
      name: platform,
      total,
      growth: growth.toFixed(1),
      isUp: growth >= 0,
      color: platform === 'Flipkart' ? '#2874f0' :
             platform === 'Amazon' ? '#ff9900' :
             platform === 'Meesho' ? '#ff47be' :
             platform === 'Myntra' ? '#ff3f6c' :
             platform === 'Ajio' ? '#2c4152' : '#e40046',
    };
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/analytics"
            className="w-10 h-10 rounded-lg bg-surface border border-border flex items-center justify-center hover:bg-surface-hover transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-text2" />
          </Link>
          <div>
            <h1 className="text-2xl font-heading font-bold text-text1">Platform Performance Details</h1>
            <p className="text-sm text-text3">Detailed analytics for each e-commerce platform.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="lg:col-span-2">
          <h3 className="font-heading font-semibold text-lg mb-6">Cumulative Platform Revenue</h3>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={platformData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'var(--text3)', fontSize: 12 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'var(--text3)', fontSize: 12 }}
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
                  formatter={(value: any) => formatCurrency(Number(value))}
                />
                <Bar dataKey="total" radius={[4, 4, 0, 0]}>
                  {platformData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:col-span-2">
          {platformData.map((platform) => (
            <Card key={platform.name} className="flex flex-col justify-between">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: platform.color }} />
                  <h4 className="font-semibold text-text1">{platform.name}</h4>
                </div>
                <div className={`flex items-center gap-1 text-xs font-medium ${platform.isUp ? 'text-green' : 'text-red'}`}>
                  {platform.isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {platform.growth}%
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-text3 uppercase font-bold tracking-wider">Total Sales</p>
                <p className="text-xl font-bold">{formatCurrency(platform.total)}</p>
              </div>
            </Card>
          ))}
        </div>
      </div>

      <div className="bg-accent/5 border border-accent/20 rounded-xl p-4 flex gap-3">
        <Info className="w-5 h-5 text-accent shrink-0" />
        <div className="space-y-1">
          <h4 className="text-sm font-semibold text-accent-800">Growth Optimization Insight</h4>
          <p className="text-xs text-accent-700 leading-relaxed">
            Your performance on <strong>Flipkart</strong> is leading with a 15% growth this month. 
            Consider increasing inventory for top-selling items on this platform to maintain the momentum.
          </p>
        </div>
      </div>
    </div>
  );
}
