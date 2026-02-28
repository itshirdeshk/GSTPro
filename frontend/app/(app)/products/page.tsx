'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Card, StatCard } from '@/components/ui/card';
import { DataTable } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { apiGetPaginated, apiPost, apiPut, apiDelete, apiGet } from '@/lib/api';
import { formatCurrency, GST_RATES } from '@/lib/utils';
import type { Product } from '@/lib/types';
import toast from 'react-hot-toast';

export default function ProductsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['products', page, search],
    queryFn: () =>
      apiGetPaginated<Product>('/products', {
        page,
        limit: 10,
        search: search || undefined,
      }),
  });

  const { data: stats } = useQuery({
    queryKey: ['product-stats'],
    queryFn: () => apiGet<{ total: number; inStock: number; lowStock: number; outOfStock: number }>('/products/stats'),
    retry: false,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiDelete(`/products/${id}`),
    onSuccess: () => {
      toast.success('Product deleted');
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });

  const stockStatus = (p: Product) => {
    if (p.stock <= 0) return { label: 'Out of Stock', variant: 'red' as const, dot: 'bg-red' };
    if (p.stock <= p.lowStockThreshold) return { label: 'Low Stock', variant: 'amber' as const, dot: 'bg-amber' };
    return { label: 'In Stock', variant: 'green' as const, dot: 'bg-green' };
  };

  const columns = [
    {
      key: 'name',
      header: 'Product',
      render: (p: Product) => (
        <div>
          <p className="font-medium">{p.name}</p>
          <p className="text-xs text-text3">{p.hsnCode ? `HSN: ${p.hsnCode}` : p.sacCode ? `SAC: ${p.sacCode}` : ''}</p>
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      render: (p: Product) => (
        <Badge variant={p.type === 'GOODS' ? 'cyan' : 'purple'}>
          {p.type === 'GOODS' ? 'Goods' : 'Service'}
        </Badge>
      ),
    },
    {
      key: 'gstRate',
      header: 'GST Rate',
      render: (p: Product) => <span className="text-text2">{p.gstRate}%</span>,
    },
    {
      key: 'sellingPrice',
      header: 'Price',
      className: 'text-right',
      render: (p: Product) => <span className="font-medium">{formatCurrency(p.sellingPrice)}</span>,
    },
    {
      key: 'stock',
      header: 'Stock',
      className: 'text-center',
      render: (p: Product) => {
        const s = stockStatus(p);
        return (
          <div className="flex items-center justify-center gap-2">
            <div className={`w-2 h-2 rounded-full ${s.dot}`} />
            <span className="text-text2">{p.stock}</span>
          </div>
        );
      },
    },
    {
      key: 'status',
      header: 'Status',
      className: 'text-center',
      render: (p: Product) => {
        const s = stockStatus(p);
        return <Badge variant={s.variant}>{s.label}</Badge>;
      },
    },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (p: Product) => (
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); setEditing(p); setModalOpen(true); }}
            className="px-2 py-1 text-xs text-accent2 hover:bg-accent/10 rounded transition-colors"
          >
            Edit
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); if (confirm('Delete?')) deleteMutation.mutate(p.id); }}
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
          <h2 className="font-heading text-lg font-bold">Products</h2>
          <p className="text-sm text-text3">Manage your product catalog</p>
        </div>
        <Button icon={<Plus size={16} />} size="sm" onClick={() => { setEditing(null); setModalOpen(true); }}>
          Add Product
        </Button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Products" value={String(stats?.total || 0)} icon={<Package size={20} />} color="accent" />
        <StatCard label="In Stock" value={String(stats?.inStock || 0)} icon={<Package size={20} />} color="green" />
        <StatCard label="Low Stock" value={String(stats?.lowStock || 0)} icon={<Package size={20} />} color="amber" />
        <StatCard label="Out of Stock" value={String(stats?.outOfStock || 0)} icon={<Package size={20} />} color="red" />
      </div>

      <Card className="!p-4">
        <Input
          placeholder="Search products..."
          icon={<Search size={16} />}
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        />
      </Card>

      <Card className="!p-0 overflow-hidden">
        <DataTable<Record<string, unknown>>
          columns={columns as any}
          data={(data?.data || []) as any}
          keyField="id"
          loading={isLoading}
          emptyMessage="No products found"
          page={page}
          totalPages={data?.pagination?.totalPages || 1}
          onPageChange={setPage}
        />
      </Card>

      <Modal open={modalOpen} onClose={() => { setModalOpen(false); setEditing(null); }} title={editing ? 'Edit Product' : 'Add Product'}>
        <ProductForm product={editing} onSuccess={() => { setModalOpen(false); setEditing(null); queryClient.invalidateQueries({ queryKey: ['products'] }); }} />
      </Modal>
    </div>
  );
}

function ProductForm({ product, onSuccess }: { product: Product | null; onSuccess: () => void }) {
  const [form, setForm] = useState({
    name: product?.name || '',
    description: product?.description || '',
    hsnCode: product?.hsnCode || '',
    sacCode: product?.sacCode || '',
    type: product?.type || 'GOODS',
    sellingPrice: product?.sellingPrice || 0,
    costPrice: product?.costPrice || 0,
    gstRate: product?.gstRate || 18,
    unit: product?.unit || 'NOS',
    stock: product?.stock || 0,
    lowStockThreshold: product?.lowStockThreshold || 10,
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (product) {
        await apiPut(`/products/${product.id}`, form);
        toast.success('Product updated');
      } else {
        await apiPost('/products', form);
        toast.success('Product created');
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
        <Input id="name" label="Product Name" value={form.name} onChange={(e) => set('name', e.target.value)} required />
        <Select
          id="type"
          label="Type"
          options={[{ value: 'GOODS', label: 'Goods' }, { value: 'SERVICE', label: 'Service' }]}
          value={form.type}
          onChange={(e) => set('type', e.target.value)}
        />
        <Input id="hsnCode" label="HSN Code" value={form.hsnCode} onChange={(e) => set('hsnCode', e.target.value)} />
        <Input id="sacCode" label="SAC Code" value={form.sacCode} onChange={(e) => set('sacCode', e.target.value)} />
        <Select
          id="gstRate"
          label="GST Rate"
          options={GST_RATES.map((r) => ({ value: String(r), label: `${r}%` }))}
          value={String(form.gstRate)}
          onChange={(e) => set('gstRate', +e.target.value)}
        />
        <Input id="unit" label="Unit" value={form.unit} onChange={(e) => set('unit', e.target.value)} />
        <Input id="sellingPrice" label="Selling Price (₹)" type="number" value={form.sellingPrice} onChange={(e) => set('sellingPrice', +e.target.value)} required />
        <Input id="costPrice" label="Cost Price (₹)" type="number" value={form.costPrice} onChange={(e) => set('costPrice', +e.target.value)} />
        <Input id="stock" label="Stock Quantity" type="number" value={form.stock} onChange={(e) => set('stock', +e.target.value)} />
        <Input id="lowStockThreshold" label="Low Stock Alert" type="number" value={form.lowStockThreshold} onChange={(e) => set('lowStockThreshold', +e.target.value)} />
      </div>
      <Input id="description" label="Description" value={form.description} onChange={(e) => set('description', e.target.value)} />
      <div className="flex justify-end gap-3 pt-2">
        <Button type="submit" loading={loading}>{product ? 'Update' : 'Add Product'}</Button>
      </div>
    </form>
  );
}
