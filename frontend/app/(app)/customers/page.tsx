'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { DataTable } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { apiGetPaginated, apiPost, apiPut, apiDelete } from '@/lib/api';
import { formatCurrency, getInitials } from '@/lib/utils';
import type { Customer } from '@/lib/types';
import toast from 'react-hot-toast';

const indianStates = [
  { value: '', label: 'All States' },
  { value: 'Maharashtra', label: 'Maharashtra' },
  { value: 'Karnataka', label: 'Karnataka' },
  { value: 'Delhi', label: 'Delhi' },
  { value: 'Tamil Nadu', label: 'Tamil Nadu' },
  { value: 'Gujarat', label: 'Gujarat' },
  { value: 'Rajasthan', label: 'Rajasthan' },
  { value: 'Haryana', label: 'Haryana' },
  { value: 'Uttar Pradesh', label: 'Uttar Pradesh' },
  { value: 'West Bengal', label: 'West Bengal' },
  { value: 'Telangana', label: 'Telangana' },
];

export default function CustomersPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [state, setState] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['customers', page, search, state],
    queryFn: () =>
      apiGetPaginated<Customer>('/customers', {
        page,
        limit: 10,
        search: search || undefined,
        state: state || undefined,
      }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiDelete(`/customers/${id}`),
    onSuccess: () => {
      toast.success('Customer deleted');
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
    onError: () => toast.error('Failed to delete customer'),
  });

  const columns = [
    {
      key: 'name',
      header: 'Customer',
      render: (c: Customer) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent to-cyan flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {getInitials(c.name)}
          </div>
          <div>
            <p className="font-medium">{c.name}</p>
            <p className="text-xs text-text3">{c.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'gstin',
      header: 'GSTIN',
      render: (c: Customer) => <span className="text-text2 font-mono text-xs">{c.gstin || '—'}</span>,
    },
    {
      key: 'phone',
      header: 'Phone',
      render: (c: Customer) => <span className="text-text3">{c.phone || '—'}</span>,
    },
    {
      key: 'state',
      header: 'State',
      render: (c: Customer) => <span className="text-text3">{c.state || '—'}</span>,
    },
    {
      key: 'outstandingAmount',
      header: 'Outstanding',
      className: 'text-right',
      render: (c: Customer) => (
        <span className={c.outstandingAmount > 0 ? 'text-amber font-medium' : 'text-text3'}>
          {formatCurrency(c.outstandingAmount)}
        </span>
      ),
    },
    {
      key: 'isActive',
      header: 'Status',
      className: 'text-center',
      render: (c: Customer) => (
        <Badge variant={c.isActive ? 'green' : 'gray'}>
          {c.isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (c: Customer) => (
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setEditing(c);
              setModalOpen(true);
            }}
            className="px-2 py-1 text-xs text-accent2 hover:bg-accent/10 rounded transition-colors"
          >
            Edit
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (confirm('Delete this customer?')) deleteMutation.mutate(c.id);
            }}
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
          <h2 className="font-heading text-lg font-bold">Customers</h2>
          <p className="text-sm text-text3">Manage your customer directory</p>
        </div>
        <Button icon={<Plus size={16} />} size="sm" onClick={() => { setEditing(null); setModalOpen(true); }}>
          Add Customer
        </Button>
      </div>

      <Card className="!p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <Input
              placeholder="Search customers..."
              icon={<Search size={16} />}
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <div className="w-full sm:w-48">
            <Select
              options={indianStates}
              value={state}
              onChange={(e) => { setState(e.target.value); setPage(1); }}
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
          emptyMessage="No customers found. Add your first customer!"
          page={page}
          totalPages={data?.pagination?.totalPages || 1}
          onPageChange={setPage}
        />
      </Card>

      <Modal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditing(null); }}
        title={editing ? 'Edit Customer' : 'Add Customer'}
      >
        <CustomerForm
          customer={editing}
          onSuccess={() => {
            setModalOpen(false);
            setEditing(null);
            queryClient.invalidateQueries({ queryKey: ['customers'] });
          }}
        />
      </Modal>
    </div>
  );
}

function CustomerForm({ customer, onSuccess }: { customer: Customer | null; onSuccess: () => void }) {
  const [form, setForm] = useState({
    name: customer?.name || '',
    email: customer?.email || '',
    phone: customer?.phone || '',
    gstin: customer?.gstin || '',
    address: customer?.address || '',
    city: customer?.city || '',
    state: customer?.state || '',
    pincode: customer?.pincode || '',
    creditLimit: customer?.creditLimit || 0,
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (customer) {
        await apiPut(`/customers/${customer.id}`, form);
        toast.success('Customer updated');
      } else {
        await apiPost('/customers', form);
        toast.success('Customer created');
      }
      onSuccess();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to save customer');
    } finally {
      setLoading(false);
    }
  };

  const set = (key: string, value: string | number) => setForm({ ...form, [key]: value });

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input id="name" label="Name" value={form.name} onChange={(e) => set('name', e.target.value)} required />
        <Input id="email" label="Email" type="email" value={form.email} onChange={(e) => set('email', e.target.value)} />
        <Input id="phone" label="Phone" value={form.phone} onChange={(e) => set('phone', e.target.value)} />
        <Input id="gstin" label="GSTIN" value={form.gstin} onChange={(e) => set('gstin', e.target.value)} placeholder="22AAAAA0000A1Z5" />
        <Input id="address" label="Address" value={form.address} onChange={(e) => set('address', e.target.value)} className="sm:col-span-2" />
        <Input id="city" label="City" value={form.city} onChange={(e) => set('city', e.target.value)} />
        <Input id="state" label="State" value={form.state} onChange={(e) => set('state', e.target.value)} />
        <Input id="pincode" label="Pincode" value={form.pincode} onChange={(e) => set('pincode', e.target.value)} />
        <Input id="creditLimit" label="Credit Limit (₹)" type="number" value={form.creditLimit} onChange={(e) => set('creditLimit', +e.target.value)} />
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <Button type="submit" loading={loading}>{customer ? 'Update' : 'Add Customer'}</Button>
      </div>
    </form>
  );
}
