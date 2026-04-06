'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { DataTable } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';
import { ecommerceStats } from '@/lib/mock-data/analytics';
import { formatCurrency, exportToCSV } from '@/lib/utils';
import { ShoppingCart, ArrowLeft, Search, Filter, Download, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function EcommerceOrdersPage() {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = () => {
    setIsExporting(true);
    setTimeout(() => {
      exportToCSV(ecommerceStats.recentOrders, `Ecommerce_Orders_${new Date().toISOString().split('T')[0]}`);
      setIsExporting(false);
    }, 1500);
  };

  const columns = [
    { key: 'id', header: 'Order ID' },
    {
      key: 'platform',
      header: 'Platform',
      render: (item: any) => (
        <span className="font-medium">{item.platform}</span>
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
            <h1 className="text-2xl font-heading font-bold text-text1">All E-commerce Orders</h1>
            <p className="text-sm text-text3">View and manage all your platform orders in one place.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-3 py-1.5 bg-surface border border-border rounded-lg text-sm hover:bg-surface-hover transition-colors">
            <Filter className="w-4 h-4" /> Filter
          </button>
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="flex items-center gap-2 px-4 py-1.5 bg-accent text-white rounded-lg text-sm hover:bg-accent2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-w-[120px] justify-center"
          >
            {isExporting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            {isExporting ? 'Exporting...' : 'Export CSV'}
          </button>
        </div>
      </div>

      <Card>
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text3" />
          <input
            type="text"
            placeholder="Search by Order ID or Platform..."
            className="w-full bg-surface border border-border rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
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
