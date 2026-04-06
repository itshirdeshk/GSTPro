'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { DataTable } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';
import { reconciliationData } from '@/lib/mock-data/analytics';
import { formatCurrency, exportToCSV } from '@/lib/utils';
import {
  Search,
  Filter,
  Download,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowRightLeft,
  Loader2,
} from 'lucide-react';

export function SalesValidation() {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = () => {
    setIsExporting(true);
    setTimeout(() => {
      exportToCSV(reconciliationData, `Sales_Validation_Report_${new Date().toISOString().split('T')[0]}`);
      setIsExporting(false);
    }, 1500);
  };

  const columns = [
    { key: 'dateRange', header: 'Date Range' },
    {
      key: 'platform',
      header: 'Platform',
      render: (item: any) => (
        <span className="font-medium text-text1">{item.platform}</span>
      ),
    },
    {
      key: 'grossSales',
      header: 'Gross Sales (Platform)',
      render: (item: any) => formatCurrency(item.grossSales),
    },
    {
      key: 'deductions',
      header: 'Deductions (Fees/Tax)',
      render: (item: any) => (
        <span className="text-red">-{formatCurrency(item.deductions)}</span>
      ),
    },
    {
      key: 'expectedPayout',
      header: 'Expected Payout',
      render: (item: any) => (
        <span className="font-semibold">{formatCurrency(item.expectedPayout)}</span>
      ),
    },
    {
      key: 'actualPayout',
      header: 'Actual Settlement',
      render: (item: any) => (
        <span className={item.actualPayout === 0 ? 'text-text3 italic' : 'font-semibold text-green'}>
          {item.actualPayout === 0 ? 'Waiting...' : formatCurrency(item.actualPayout)}
        </span>
      ),
    },
    {
      key: 'discrepancy',
      header: 'Discrepancy',
      render: (item: any) => (
        <span className={item.discrepancy > 0 ? 'text-red font-bold' : 'text-green'}>
          {item.discrepancy > 0 ? `-${formatCurrency(item.discrepancy)}` : 'None'}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (item: any) => {
        let variant: 'green' | 'red' | 'amber' = 'green';
        let Icon = CheckCircle2;
        
        if (item.status === 'Discrepancy') {
          variant = 'red';
          Icon = AlertTriangle;
        } else if (item.status === 'Pending') {
          variant = 'amber';
          Icon = Clock;
        }

        return (
          <div className="flex items-center gap-1.5">
            <Badge variant={variant} className="flex items-center gap-1">
              <Icon className="w-3 h-3" />
              {item.status}
            </Badge>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-heading font-bold text-text1">Sales Validation</h2>
          <p className="text-sm text-text3">Compare platform-reported sales with bank settlements</p>
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
            {isExporting ? 'Exporting...' : 'Export Report'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="flex items-center gap-4 py-4">
          <div className="w-12 h-12 rounded-full bg-green/10 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6 text-green" />
          </div>
          <div>
            <p className="text-xs text-text3 uppercase font-semibold">Matched Transactions</p>
            <p className="text-xl font-bold">142</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4 py-4">
          <div className="w-12 h-12 rounded-full bg-red/10 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-6 h-6 text-red" />
          </div>
          <div>
            <p className="text-xs text-text3 uppercase font-semibold">Discrepancies</p>
            <p className="text-xl font-bold">12</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4 py-4">
          <div className="w-12 h-12 rounded-full bg-amber/10 flex items-center justify-center shrink-0">
            <ArrowRightLeft className="w-6 h-6 text-amber" />
          </div>
          <div>
            <p className="text-xs text-text3 uppercase font-semibold">Pending Settlements</p>
            <p className="text-xl font-bold">28</p>
          </div>
        </Card>
      </div>

      <Card>
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text3" />
          <input
            type="text"
            placeholder="Search by platform or order range..."
            className="w-full bg-surface border border-border rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
        </div>
        <DataTable
          columns={columns}
          data={reconciliationData}
          keyField="id"
        />
      </Card>
      
      <div className="bg-amber/5 border border-amber/20 rounded-xl p-4 flex gap-3">
        <AlertTriangle className="w-5 h-5 text-amber shrink-0" />
        <div className="space-y-1">
          <h4 className="text-sm font-semibold text-amber-800">Why do discrepancies occur?</h4>
          <p className="text-xs text-amber-700 leading-relaxed">
            Common reasons include platform-level deductions (returns, advertising costs), 
            tax collection at source (TCS/TDS), and delayed settlement cycles. 
            Our tool helps you track these to ensure every rupee is accounted for.
          </p>
        </div>
      </div>
    </div>
  );
}
