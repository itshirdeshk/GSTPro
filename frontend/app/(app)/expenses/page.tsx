'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { DataTable } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { apiGetPaginated, apiPost, apiPut, apiDelete } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { Expense, ExpenseCategory, PaymentMode } from '@/lib/types';
import toast from 'react-hot-toast';

const categoryOptions = [
  { value: '', label: 'All Categories' },
  { value: 'RENT', label: 'Rent' },
  { value: 'SALARY', label: 'Salary' },
  { value: 'UTILITIES', label: 'Utilities' },
  { value: 'OFFICE_SUPPLIES', label: 'Office Supplies' },
  { value: 'TRAVEL', label: 'Travel' },
  { value: 'MARKETING', label: 'Marketing' },
  { value: 'PROFESSIONAL_FEES', label: 'Professional Fees' },
  { value: 'INSURANCE', label: 'Insurance' },
  { value: 'MAINTENANCE', label: 'Maintenance' },
  { value: 'OTHER', label: 'Other' },
];

const categoryColors: Record<string, string> = {
  RENT: 'cyan',
  SALARY: 'green',
  UTILITIES: 'amber',
  OFFICE_SUPPLIES: 'purple',
  TRAVEL: 'red',
  MARKETING: 'cyan',
  PROFESSIONAL_FEES: 'purple',
  INSURANCE: 'amber',
  MAINTENANCE: 'gray',
  OTHER: 'gray',
};

const paymentModes = [
  { value: 'CASH', label: 'Cash' },
  { value: 'UPI', label: 'UPI' },
  { value: 'BANK_TRANSFER', label: 'Bank Transfer' },
  { value: 'CHEQUE', label: 'Cheque' },
  { value: 'CARD', label: 'Card' },
  { value: 'OTHER', label: 'Other' },
];

export default function ExpensesPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['expenses', page, search, category],
    queryFn: () =>
      apiGetPaginated<Expense>('/expenses', {
        page,
        limit: 10,
        search: search || undefined,
        category: category || undefined,
      }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiDelete(`/expenses/${id}`),
    onSuccess: () => {
      toast.success('Expense deleted');
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
    },
  });

  const columns = [
    {
      key: 'expenseDate',
      header: 'Date',
      render: (e: Expense) => <span className="text-text3">{formatDate(e.expenseDate)}</span>,
    },
    {
      key: 'description',
      header: 'Description',
      render: (e: Expense) => (
        <div>
          <p className="font-medium">{e.description}</p>
          {e.vendor && <p className="text-xs text-text3">{e.vendor}</p>}
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Category',
      render: (e: Expense) => (
        <Badge variant={(categoryColors[e.category] || 'gray') as any}>
          {e.category.replace(/_/g, ' ')}
        </Badge>
      ),
    },
    {
      key: 'amount',
      header: 'Amount',
      className: 'text-right',
      render: (e: Expense) => <span className="font-medium">{formatCurrency(e.amount)}</span>,
    },
    {
      key: 'paymentMode',
      header: 'Mode',
      render: (e: Expense) => (
        <span className="text-text2 text-xs font-medium bg-surface2 px-2 py-1 rounded">
          {e.paymentMode.replace('_', ' ')}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (e: Expense) => (
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={(ev) => { ev.stopPropagation(); setEditing(e); setModalOpen(true); }}
            className="px-2 py-1 text-xs text-accent2 hover:bg-accent/10 rounded transition-colors"
          >
            Edit
          </button>
          <button
            onClick={(ev) => { ev.stopPropagation(); if (confirm('Delete?')) deleteMutation.mutate(e.id); }}
            className="px-2 py-1 text-xs text-red hover:bg-red/10 rounded transition-colors"
          >
            Delete
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-heading text-lg font-bold">Expenses</h2>
          <p className="text-sm text-text3">Track your business expenses</p>
        </div>
        <Button icon={<Plus size={16} />} size="sm" onClick={() => { setEditing(null); setModalOpen(true); }}>
          Add Expense
        </Button>
      </div>

      <Card className="p-4!">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <Input
              placeholder="Search expenses..."
              icon={<Search size={16} />}
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <div className="w-full sm:w-56">
            <Select
              options={categoryOptions}
              value={category}
              onChange={(e) => { setCategory(e.target.value); setPage(1); }}
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
          emptyMessage="No expenses recorded yet"
          page={page}
          totalPages={data?.pagination?.totalPages || 1}
          onPageChange={setPage}
        />
      </Card>

      <Modal open={modalOpen} onClose={() => { setModalOpen(false); setEditing(null); }} title={editing ? 'Edit Expense' : 'Add Expense'}>
        <ExpenseForm expense={editing} onSuccess={() => { setModalOpen(false); setEditing(null); queryClient.invalidateQueries({ queryKey: ['expenses'] }); }} />
      </Modal>
    </div>
  );
}

function ExpenseForm({ expense, onSuccess }: { expense: Expense | null; onSuccess: () => void }) {
  const [form, setForm] = useState({
    description: expense?.description || '',
    amount: expense?.amount || 0,
    gstAmount: expense?.gstAmount || 0,
    category: expense?.category || 'OTHER',
    expenseDate: expense?.expenseDate?.split('T')[0] || new Date().toISOString().split('T')[0],
    vendor: expense?.vendor || '',
    paymentMode: expense?.paymentMode || 'UPI',
    referenceNumber: expense?.referenceNumber || '',
    notes: expense?.notes || '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (expense) {
        await apiPut(`/expenses/${expense.id}`, form);
        toast.success('Expense updated');
      } else {
        await apiPost('/expenses', form);
        toast.success('Expense added');
      }
      onSuccess();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to save');
    } finally {
      setLoading(false);
    }
  };

  const set = (key: string, value: string | number) => setForm({ ...form, [key]: value });

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input id="description" label="Description" value={form.description} onChange={(e) => set('description', e.target.value)} required className="sm:col-span-2" />
        <Input id="amount" label="Amount (₹)" type="number" value={form.amount} onChange={(e) => set('amount', +e.target.value)} required />
        <Input id="gstAmount" label="GST Amount (₹)" type="number" value={form.gstAmount} onChange={(e) => set('gstAmount', +e.target.value)} />
        <Select id="category" label="Category" options={categoryOptions.slice(1)} value={form.category} onChange={(e) => set('category', e.target.value)} />
        <Input id="expenseDate" label="Date" type="date" value={form.expenseDate} onChange={(e) => set('expenseDate', e.target.value)} required />
        <Input id="vendor" label="Vendor" value={form.vendor} onChange={(e) => set('vendor', e.target.value)} />
        <Select id="paymentMode" label="Payment Mode" options={paymentModes} value={form.paymentMode} onChange={(e) => set('paymentMode', e.target.value)} />
        <Input id="referenceNumber" label="Reference #" value={form.referenceNumber} onChange={(e) => set('referenceNumber', e.target.value)} />
      </div>
      <Input id="notes" label="Notes" value={form.notes} onChange={(e) => set('notes', e.target.value)} />
      <div className="flex justify-end gap-3 pt-2">
        <Button type="submit" loading={loading}>{expense ? 'Update' : 'Add Expense'}</Button>
      </div>
    </form>
  );
}
