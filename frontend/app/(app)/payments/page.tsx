'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, IndianRupee, Clock, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Card, StatCard } from '@/components/ui/card';
import { DataTable } from '@/components/ui/data-table';
import { StatusBadge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { apiGetPaginated, apiPost, apiDelete } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { Payment } from '@/lib/types';
import toast from 'react-hot-toast';

const paymentModeOptions = [
  { value: '', label: 'All Modes' },
  { value: 'CASH', label: 'Cash' },
  { value: 'UPI', label: 'UPI' },
  { value: 'BANK_TRANSFER', label: 'Bank Transfer' },
  { value: 'CHEQUE', label: 'Cheque' },
  { value: 'CARD', label: 'Card' },
];

export default function PaymentsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [paymentMode, setPaymentMode] = useState('');
  const [modalOpen, setModalOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['payments', page, search, paymentMode],
    queryFn: () =>
      apiGetPaginated<Payment>('/payments', {
        page,
        limit: 10,
        paymentMode: paymentMode || undefined,
      }),
  });

  const columns = [
    {
      key: 'invoice',
      header: 'Invoice',
      render: (p: Payment) => (
        <span className="font-medium text-accent2">{p.invoice?.invoiceNumber || p.invoiceId}</span>
      ),
    },
    {
      key: 'customer',
      header: 'Customer',
      render: (p: Payment) => <span className="text-text2">{p.invoice?.customer?.name || '—'}</span>,
    },
    {
      key: 'amount',
      header: 'Amount',
      className: 'text-right',
      render: (p: Payment) => <span className="font-medium text-green">{formatCurrency(p.amount)}</span>,
    },
    {
      key: 'paymentDate',
      header: 'Date',
      render: (p: Payment) => <span className="text-text3">{formatDate(p.paymentDate)}</span>,
    },
    {
      key: 'paymentMode',
      header: 'Mode',
      render: (p: Payment) => (
        <span className="text-text2 text-xs font-medium bg-surface2 px-2 py-1 rounded">
          {p.paymentMode.replace('_', ' ')}
        </span>
      ),
    },
    {
      key: 'referenceNumber',
      header: 'Reference',
      render: (p: Payment) => <span className="text-text3 font-mono text-xs">{p.referenceNumber || '—'}</span>,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-heading text-lg font-bold">Payments</h2>
          <p className="text-sm text-text3">Track payment collections</p>
        </div>
        <Button icon={<Plus size={16} />} size="sm" onClick={() => setModalOpen(true)}>
          Record Payment
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Collected" value={formatCurrency(0)} icon={<CheckCircle size={20} />} color="green" />
        <StatCard label="Pending" value={formatCurrency(0)} icon={<Clock size={20} />} color="amber" />
        <StatCard label="Partial" value={formatCurrency(0)} icon={<IndianRupee size={20} />} color="cyan" />
        <StatCard label="Overdue" value={formatCurrency(0)} icon={<AlertCircle size={20} />} color="red" />
      </div>

      <Card className="!p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <Input
              placeholder="Search payments..."
              icon={<Search size={16} />}
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <div className="w-full sm:w-48">
            <Select
              options={paymentModeOptions}
              value={paymentMode}
              onChange={(e) => { setPaymentMode(e.target.value); setPage(1); }}
            />
          </div>
        </div>
      </Card>

      <Card className="!p-0 overflow-hidden">
        <DataTable<Record<string, unknown>>
          columns={columns as any}
          data={(data?.data || []) as any}
          keyField="id"
          loading={isLoading}
          emptyMessage="No payments recorded yet"
          page={page}
          totalPages={data?.pagination?.totalPages || 1}
          onPageChange={setPage}
        />
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Record Payment">
        <PaymentForm onSuccess={() => { setModalOpen(false); queryClient.invalidateQueries({ queryKey: ['payments'] }); }} />
      </Modal>
    </div>
  );
}

function PaymentForm({ onSuccess }: { onSuccess: () => void }) {
  const [form, setForm] = useState({
    invoiceId: '',
    amount: 0,
    paymentDate: new Date().toISOString().split('T')[0],
    paymentMode: 'UPI',
    referenceNumber: '',
    notes: '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await apiPost('/payments', form);
      toast.success('Payment recorded');
      onSuccess();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to record payment');
    } finally {
      setLoading(false);
    }
  };

  const set = (key: string, value: string | number) => setForm({ ...form, [key]: value });

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input id="invoiceId" label="Invoice ID" value={form.invoiceId} onChange={(e) => set('invoiceId', e.target.value)} required />
        <Input id="amount" label="Amount (₹)" type="number" value={form.amount} onChange={(e) => set('amount', +e.target.value)} required />
        <Input id="paymentDate" label="Payment Date" type="date" value={form.paymentDate} onChange={(e) => set('paymentDate', e.target.value)} required />
        <Select
          id="paymentMode"
          label="Payment Mode"
          options={paymentModeOptions.slice(1)}
          value={form.paymentMode}
          onChange={(e) => set('paymentMode', e.target.value)}
        />
        <Input id="referenceNumber" label="Reference Number" value={form.referenceNumber} onChange={(e) => set('referenceNumber', e.target.value)} />
      </div>
      <Input id="notes" label="Notes" value={form.notes} onChange={(e) => set('notes', e.target.value)} />
      <div className="flex justify-end gap-3 pt-2">
        <Button type="submit" loading={loading}>Record Payment</Button>
      </div>
    </form>
  );
}
