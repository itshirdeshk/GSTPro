'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, FileText, Download, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { DataTable } from '@/components/ui/data-table';
import { StatusBadge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { ComboBox } from '@/components/ui/combobox';
import { apiGetPaginated, apiPost, apiPut, apiDelete } from '@/lib/api';
import { formatCurrency, formatDate, GST_RATES } from '@/lib/utils';
import { useCustomerSearch, useProductSearch } from '@/lib/hooks/use-search';
import type { Invoice, Customer, Product, InvoiceItem } from '@/lib/types';
import toast from 'react-hot-toast';

const statusOptions = [
  { value: '', label: 'All Statuses' },
  { value: 'DRAFT', label: 'Draft' },
  { value: 'ISSUED', label: 'Issued' },
  { value: 'PARTIALLY_PAID', label: 'Partially Paid' },
  { value: 'PAID', label: 'Paid' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

export default function InvoicesPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['invoices', page, search, status],
    queryFn: () =>
      apiGetPaginated<Invoice>('/invoices', {
        page,
        limit: 10,
        search: search || undefined,
        status: status || undefined,
      }),
  });

  const columns = [
    {
      key: 'invoiceNumber',
      header: 'Invoice #',
      render: (inv: Invoice) => (
        <span className="font-medium text-accent2">{inv.invoiceNumber || '—'}</span>
      ),
    },
    {
      key: 'customer',
      header: 'Customer',
      render: (inv: Invoice) => <span className="text-text2">{inv.customer?.name || '—'}</span>,
    },
    {
      key: 'invoiceDate',
      header: 'Date',
      render: (inv: Invoice) => <span className="text-text3">{formatDate(inv.invoiceDate)}</span>,
    },
    {
      key: 'totalAmount',
      header: 'Amount',
      className: 'text-right',
      render: (inv: Invoice) => <span className="font-medium">{formatCurrency(inv.totalAmount)}</span>,
    },
    {
      key: 'totalCgst',
      header: 'GST',
      className: 'text-right',
      render: (inv: Invoice) => (
        <span className="text-text3">
          {formatCurrency(inv.totalCgst + inv.totalSgst + inv.totalIgst)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      className: 'text-center',
      render: (inv: Invoice) => <StatusBadge status={inv.status} />,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-heading text-lg font-bold">Invoices</h2>
          <p className="text-sm text-text3">Manage your sales invoices</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary" icon={<Download size={16} />} size="sm">
            Export CSV
          </Button>
          <Button icon={<Plus size={16} />} size="sm" onClick={() => setModalOpen(true)}>
            Create Invoice
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4!">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <Input
              placeholder="Search invoices..."
              icon={<Search size={16} />}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <div className="w-full sm:w-48">
            <Select
              options={statusOptions}
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              placeholder="All Statuses"
            />
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card className="p-0! overflow-hidden">
        <DataTable<Record<string, unknown>>
          columns={columns as any}
          data={(data?.data || []) as any}
          keyField="id"
          loading={isLoading}
          emptyMessage="No invoices found. Create your first invoice!"
          page={page}
          totalPages={data?.pagination?.totalPages || 1}
          onPageChange={setPage}
        />
      </Card>

      {/* Create Invoice Modal */}
      <Modal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingInvoice(null);
        }}
        title={editingInvoice ? 'Edit Invoice' : 'Create Invoice'}
        size="lg"
      >
        <InvoiceForm
          invoice={editingInvoice}
          onSuccess={() => {
            setModalOpen(false);
            setEditingInvoice(null);
            queryClient.invalidateQueries({ queryKey: ['invoices'] });
          }}
        />
      </Modal>
    </div>
  );
}

function InvoiceForm({ invoice, onSuccess }: { invoice: Invoice | null; onSuccess: () => void }) {
  const queryClient = useQueryClient();
  const [customerSearch, setCustomerSearch] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [form, setForm] = useState({
    customerId: invoice?.customerId || '',
    invoiceDate: invoice?.invoiceDate?.split('T')[0] || new Date().toISOString().split('T')[0],
    dueDate: invoice?.dueDate?.split('T')[0] || '',
    isReverseCharge: invoice?.isReverseCharge || false,
    discount: invoice?.discount || 0,
    terms: invoice?.terms || '',
    notes: invoice?.notes || '',
    templateId: invoice?.templateId || 1,
    items: invoice?.items || [
      {
        productId: '',
        description: '',
        hsnCode: '',
        quantity: 1,
        unitPrice: 0,
        gstRate: 18,
      },
    ],
  });
  const [loading, setLoading] = useState(false);

  // Fetch customers and products - will trigger on mount
  const customerOptions = useCustomerSearch(customerSearch);
  const productOptions = useProductSearch(productSearch);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate items
    const hasInvalidItems = form.items.some(
      (item) => !item.description || item.quantity <= 0 || item.unitPrice < 0
    );
    if (hasInvalidItems) {
      toast.error('Please fill all required fields in line items');
      return;
    }

    setLoading(true);
    try {
      // Clean up items - remove productId if empty (it's optional)
      const payload = {
        ...form,
        items: form.items.map((item: any) => ({
          ...item,
          productId: item.productId || undefined,
          hsnCode: item.hsnCode || undefined,
        })),
      };

      if (invoice) {
        await apiPut(`/invoices/${invoice.id}`, payload);
        toast.success('Invoice updated');
      } else {
        await apiPost('/invoices', payload);
        toast.success('Invoice created');
      }
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      onSuccess();
    } catch (err: any) {
      // Format validation errors if present
      const errorData = err.response?.data;
      if (errorData?.details && typeof errorData.details === 'object') {
        const fieldErrors = Object.entries(errorData.details)
          .map(([field, errors]) => {
            const errorMessages = Array.isArray(errors) ? errors.join(', ') : errors;
            return `${field}: ${errorMessages}`;
          })
          .join('\n');
        toast.error(`Validation failed:\n${fieldErrors}`);
      } else {
        toast.error(errorData?.error || 'Failed to save invoice');
      }
    } finally {
      setLoading(false);
    }
  };

  const addItem = () => {
    setForm({
      ...form,
      items: [
        ...form.items,
        {
          productId: '',
          description: '',
          hsnCode: '',
          quantity: 1,
          unitPrice: 0,
          gstRate: 18,
        },
      ],
    });
  };

  const removeItem = (idx: number) => {
    if (form.items.length > 1) {
      setForm({ ...form, items: form.items.filter((_, i) => i !== idx) });
    }
  };

  const updateItem = (idx: number, field: string | Record<string, any>, value?: any) => {
    const items = [...form.items];
    if (typeof field === 'string') {
      // Single field update
      items[idx] = { ...items[idx], [field]: value };
    } else {
      // Multiple fields update (field is an object of updates)
      items[idx] = { ...items[idx], ...field };
    }
    setForm({ ...form, items });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 px-1">
      {/* Customer and Dates */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <ComboBox
          label="Customer"
          placeholder="Select customer"
          options={customerOptions.options}
          value={form.customerId}
          onChange={(value) => setForm({ ...form, customerId: value })}
          onSearch={setCustomerSearch}
          onLoadMore={customerOptions.loadMore}
          loading={customerOptions.loading}
          hasMore={customerOptions.hasMore}
          searchPlaceholder="Search customers..."
          required
        />
        <Input
          id="invoiceDate"
          label="Invoice Date"
          type="date"
          value={form.invoiceDate}
          onChange={(e) => setForm({ ...form, invoiceDate: e.target.value })}
          required
        />
        <Input
          id="dueDate"
          label="Due Date"
          type="date"
          value={form.dueDate}
          onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
          required
        />
        <Input
          id="discount"
          label="Discount Amount"
          type="number"
          min="0"
          step="0.01"
          value={form.discount}
          onChange={(e) => setForm({ ...form, discount: +e.target.value })}
        />
      </div>

      {/* Checkboxes and Template */}
      <div className="grid grid-cols-2 gap-4">
        <label className="flex items-center gap-2 text-sm text-text2 cursor-pointer">
          <input
            type="checkbox"
            checked={form.isReverseCharge}
            onChange={(e) => setForm({ ...form, isReverseCharge: e.target.checked })}
            className="w-4 h-4 rounded border-border bg-bg3 text-accent focus:ring-2 focus:ring-accent/20"
          />
          Reverse Charge Applicable
        </label>
        <Select
          label="Invoice Template"
          options={[
            { label: 'Template 1', value: '1' },
            { label: 'Template 2', value: '2' },
            { label: 'Template 3', value: '3' },
            { label: 'Template 4', value: '4' },
          ]}
          value={String(form.templateId)}
          onChange={(e) => setForm({ ...form, templateId: +e.target.value })}
        />
      </div>

      {/* Line Items */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="text-sm font-medium text-text2">
            Line Items <span className="text-red">*</span>
          </label>
          <Button type="button" variant="ghost" size="sm" onClick={addItem} icon={<Plus size={14} />}>
            Add Item
          </Button>
        </div>
        <div className="space-y-3">
          {form.items.map((item: any, idx: number) => (
            <InvoiceLineItem
              key={idx}
              item={item}
              canDelete={form.items.length > 1}
              onUpdate={(field, value) => updateItem(idx, field, value)}
              onDelete={() => removeItem(idx)}
              productOptions={productOptions}
              productSearch={productSearch}
              setProductSearch={setProductSearch}
            />
          ))}
        </div>
      </div>

      {/* Terms and Notes */}
      <div className="grid grid-cols-1 gap-4">
        <div>
          <label htmlFor="terms" className="block text-sm font-medium text-text2 mb-1.5">
            Terms & Conditions
          </label>
          <textarea
            id="terms"
            rows={2}
            placeholder="Payment terms and conditions..."
            value={form.terms}
            onChange={(e) => setForm({ ...form, terms: e.target.value })}
            className="w-full px-3.5 py-2.5 rounded-lg border bg-bg3 border-border text-text placeholder:text-text3 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all resize-none"
            maxLength={1000}
          />
        </div>
        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-text2 mb-1.5">
            Notes
          </label>
          <textarea
            id="notes"
            rows={2}
            placeholder="Additional notes..."
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            className="w-full px-3.5 py-2.5 rounded-lg border bg-bg3 border-border text-text placeholder:text-text3 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all resize-none"
            maxLength={500}
          />
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-2 border-t border-border">
        <Button type="submit" loading={loading}>
          {invoice ? 'Update Invoice' : 'Create Invoice'}
        </Button>
      </div>
    </form>
  );
}

function InvoiceLineItem({
  item,
  canDelete,
  onUpdate,
  onDelete,
  productOptions,
  productSearch,
  setProductSearch,
}: {
  item: any;
  canDelete: boolean;
  onUpdate: (fieldOrUpdates: string | Record<string, any>, value?: any) => void;
  onDelete: () => void;
  productOptions: ReturnType<typeof useProductSearch>;
  productSearch: string;
  setProductSearch: (search: string) => void;
}) {

  const handleProductSelect = (productId: string) => {
    if (!productId) {
      // Clear selection
      onUpdate({ productId: '' });
      return;
    }
    
    const product = productOptions.products?.find((p) => p.id === productId);
    if (product) {
      // Batch all updates together to avoid race conditions
      onUpdate({
        productId: productId,
        description: product.name,
        hsnCode: product.hsnCode || '',
        unitPrice: Number(product.sellingPrice),
        gstRate: Number(product.gstRate),
      });
    } else {
      // Product not found in current list, but still set the ID
      onUpdate({ productId: productId });
    }
  };

  return (
    <div className="p-3 bg-surface rounded-lg border border-border space-y-3">
      <div className="grid grid-cols-12 gap-3">
        {/* Product Selection */}
        <div className="col-span-12 sm:col-span-6">
          <ComboBox
            placeholder="Select product (optional)"
            options={productOptions.options}
            value={item.productId}
            onChange={handleProductSelect}
            onSearch={setProductSearch}
            onLoadMore={productOptions.loadMore}
            loading={productOptions.loading}
            hasMore={productOptions.hasMore}
            searchPlaceholder="Search products..."
          />
        </div>

        {/* Description */}
        <div className="col-span-12 sm:col-span-6">
          <Input
            placeholder="Description *"
            value={item.description}
            onChange={(e) => onUpdate('description', e.target.value)}
            required
          />
        </div>

        {/* HSN Code */}
        <div className="col-span-6 sm:col-span-3">
          <Input
            placeholder="HSN Code"
            value={item.hsnCode}
            onChange={(e) => onUpdate('hsnCode', e.target.value)}
            maxLength={8}
          />
        </div>

        {/* Quantity */}
        <div className="col-span-6 sm:col-span-2">
          <Input
            placeholder="Qty *"
            type="number"
            min="1"
            step="0.01"
            value={item.quantity}
            onChange={(e) => onUpdate('quantity', +e.target.value)}
            required
          />
        </div>

        {/* Unit Price */}
        <div className="col-span-6 sm:col-span-3">
          <Input
            placeholder="Unit Price *"
            type="number"
            min="0"
            step="0.01"
            value={item.unitPrice}
            onChange={(e) => onUpdate('unitPrice', +e.target.value)}
            required
          />
        </div>

        {/* GST Rate */}
        <div className="col-span-6 sm:col-span-3">
          <Select
            options={GST_RATES.map((rate) => ({ label: `${rate}%`, value: String(rate) }))}
            value={String(item.gstRate)}
            onChange={(e) => onUpdate('gstRate', +e.target.value)}
            placeholder="GST"
          />
        </div>

        {/* Delete Button */}
        {canDelete && (
          <div className="col-span-12 sm:col-span-1 flex items-end">
            <button
              type="button"
              onClick={onDelete}
              className="w-full h-10 flex items-center justify-center rounded-lg text-red hover:bg-red/10 transition-colors"
              title="Remove item"
            >
              <Trash2 size={16} />
            </button>
          </div>
        )}
      </div>

      {/* Item Subtotal */}
      <div className="flex justify-end text-xs text-text3">
        Subtotal: {formatCurrency((item.quantity || 0) * (item.unitPrice || 0))}
        {item.gstRate > 0 && (
          <span className="ml-2">
            + GST ({item.gstRate}%): {formatCurrency((item.quantity || 0) * (item.unitPrice || 0) * (item.gstRate / 100))}
          </span>
        )}
      </div>
    </div>
  );
}
