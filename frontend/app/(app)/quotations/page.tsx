'use client';

import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, Download, FileDown, Plus, Search, Send, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, StatCard } from '@/components/ui/card';
import { DataTable } from '@/components/ui/data-table';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { Select } from '@/components/ui/select';
import { ComboBox } from '@/components/ui/combobox';
import { Badge } from '@/components/ui/badge';
import { apiDelete, apiGet, apiGetPaginated, apiPost, apiPut } from '@/lib/api';
import { formatCurrency, formatDate, GST_RATES } from '@/lib/utils';
import { useCustomerSearch, useProductSearch } from '@/lib/hooks/use-search';
import type { Quotation, QuotationItem, QuotationStatus } from '@/lib/types';
import toast from 'react-hot-toast';

interface QuotationExportPayload {
  quotation: Quotation;
  filename: string;
  html: string;
}

interface QuotationFormInput {
  customerId: string;
  customerName: string;
  quotationDate: string;
  validUntil: string;
  discount: number;
  terms: string;
  notes: string;
  items: Array<{
    productId?: string;
    description: string;
    hsnCode?: string;
    quantity: number;
    unitPrice: number;
    gstRate: number;
  }>;
}

const statusOptions = [
  { value: '', label: 'All Statuses' },
  { value: 'DRAFT', label: 'Draft' },
  { value: 'SENT', label: 'Sent' },
  { value: 'ACCEPTED', label: 'Accepted' },
  { value: 'DECLINED', label: 'Declined' },
  { value: 'EXPIRED', label: 'Expired' },
  { value: 'CONVERTED', label: 'Converted' },
];

function statusConfig(status: QuotationStatus) {
  const map: Record<QuotationStatus, { label: string; variant: 'gray' | 'cyan' | 'green' | 'red' | 'amber' | 'purple' }> = {
    DRAFT: { label: 'Draft', variant: 'gray' },
    SENT: { label: 'Sent', variant: 'cyan' },
    ACCEPTED: { label: 'Accepted', variant: 'green' },
    DECLINED: { label: 'Declined', variant: 'red' },
    EXPIRED: { label: 'Expired', variant: 'amber' },
    CONVERTED: { label: 'Converted', variant: 'purple' },
  };
  return map[status];
}

function calcLine(item: QuotationItem) {
  const taxable = (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0);
  const tax = taxable * ((Number(item.gstRate) || 0) / 100);
  return { taxable, tax, total: taxable + tax };
}

function calcTotals(items: QuotationFormInput['items'], discount: number) {
  const subtotal = items.reduce((sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0), 0);
  const taxAmount = items.reduce(
    (sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0) * ((Number(item.gstRate) || 0) / 100),
    0
  );
  const safeDiscount = Math.max(0, Number(discount) || 0);
  const totalAmount = Math.max(0, subtotal + taxAmount - safeDiscount);
  return { subtotal, taxAmount, totalAmount };
}

export default function QuotationsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Quotation | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['quotations', page, search, status],
    queryFn: () =>
      apiGetPaginated<Quotation>('/quotations', {
        page,
        limit: 10,
        search: search || undefined,
        status: status || undefined,
      }),
  });

  const quotations = data?.data || [];

  const { data: quoteReport } = useQuery({
    queryKey: ['report-quotations-quick'],
    queryFn: () => {
      const now = new Date();
      const from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      const to = now.toISOString().split('T')[0];
      return apiGet<any>('/reports/quotations', { fromDate: from, toDate: to });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiDelete(`/quotations/${id}`),
    onSuccess: () => {
      toast.success('Quotation deleted');
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
      queryClient.invalidateQueries({ queryKey: ['report-quotations-quick'] });
    },
    onError: () => toast.error('Failed to delete quotation'),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, nextStatus }: { id: string; nextStatus: QuotationStatus }) =>
      apiPost(`/quotations/${id}/status`, { status: nextStatus }),
    onSuccess: () => {
      toast.success('Quotation status updated');
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
      queryClient.invalidateQueries({ queryKey: ['report-quotations-quick'] });
    },
    onError: () => toast.error('Failed to update status'),
  });

  const convertMutation = useMutation({
    mutationFn: (id: string) => apiPost(`/quotations/${id}/convert`),
    onSuccess: () => {
      toast.success('Quotation converted to invoice');
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['report-quotations-quick'] });
    },
    onError: () => toast.error('Failed to convert quotation'),
  });

  const openDocumentWindow = async (quotationId: string, printMode: 'print' | 'pdf') => {
    try {
      const payload = await apiGet<QuotationExportPayload>(`/quotations/${quotationId}/export`);
      const popup = window.open('', '_blank');
      if (!popup) {
        toast.error('Please allow popups to print/export quotation');
        return;
      }
      popup.document.open();
      popup.document.write(payload.html);
      popup.document.close();
      popup.focus();
      setTimeout(() => {
        popup.print();
        if (printMode === 'print') {
          popup.close();
        }
      }, 300);
    } catch {
      toast.error('Failed to open quotation document');
    }
  };

  const exportCsv = () => {
    if (!quotations.length) {
      toast.error('No quotations to export');
      return;
    }

    const rows = quotations.map((q) => {
      const customerName = q.customer?.name || q.customerName || '';
      return [
        q.quotationNumber,
        customerName,
        q.status,
        formatDate(q.quotationDate),
        formatDate(q.validUntil),
        Number(q.totalAmount).toFixed(2),
      ];
    });

    const csv = [
      ['Quotation Number', 'Customer', 'Status', 'Quote Date', 'Valid Until', 'Amount'].join(','),
      ...rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `quotations-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const columns = [
    {
      key: 'quotationNumber',
      header: 'Quotation #',
      render: (q: Quotation) => <span className="font-medium text-accent2">{q.quotationNumber}</span>,
    },
    {
      key: 'customer',
      header: 'Customer',
      render: (q: Quotation) => <span className="text-text2">{q.customer?.name || q.customerName || '—'}</span>,
    },
    {
      key: 'quotationDate',
      header: 'Quote Date',
      render: (q: Quotation) => <span className="text-text3">{formatDate(q.quotationDate)}</span>,
    },
    {
      key: 'validUntil',
      header: 'Valid Until',
      render: (q: Quotation) => <span className="text-text3">{formatDate(q.validUntil)}</span>,
    },
    {
      key: 'totalAmount',
      header: 'Amount',
      className: 'text-right',
      render: (q: Quotation) => <span className="font-medium">{formatCurrency(Number(q.totalAmount || 0))}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      className: 'text-center',
      render: (q: Quotation) => {
        const config = statusConfig(q.status);
        return <Badge variant={config.variant}>{config.label}</Badge>;
      },
    },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (q: Quotation) => (
        <div className="flex items-center justify-end gap-1 flex-wrap">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setEditing(q);
              setModalOpen(true);
            }}
            className="px-2 py-1 text-xs text-accent2 hover:bg-accent/10 rounded transition-colors"
          >
            Edit
          </button>
          {q.status !== 'SENT' && q.status !== 'CONVERTED' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                statusMutation.mutate({ id: q.id, nextStatus: 'SENT' });
              }}
              className="px-2 py-1 text-xs text-cyan hover:bg-cyan/10 rounded transition-colors"
            >
              Sent
            </button>
          )}
          {q.status !== 'CONVERTED' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                convertMutation.mutate(q.id);
              }}
              className="px-2 py-1 text-xs text-green hover:bg-green/10 rounded transition-colors"
            >
              Convert
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              openDocumentWindow(q.id, 'print');
            }}
            className="px-2 py-1 text-xs text-text2 hover:bg-surface rounded transition-colors"
          >
            Print
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              openDocumentWindow(q.id, 'pdf');
            }}
            className="px-2 py-1 text-xs text-text2 hover:bg-surface rounded transition-colors"
          >
            PDF
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (confirm('Delete this quotation?')) {
                deleteMutation.mutate(q.id);
              }
            }}
            className="px-2 py-1 text-xs text-red hover:bg-red/10 rounded transition-colors"
          >
            Delete
          </button>
        </div>
      ),
    },
  ];

  const summary = quoteReport?.summary;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-heading text-lg font-bold">Quotations</h2>
          <p className="text-sm text-text3">Draft proposals and convert them into invoices</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary" icon={<Download size={16} />} size="sm" onClick={exportCsv}>
            Export CSV
          </Button>
          <Button
            icon={<Plus size={16} />}
            size="sm"
            onClick={() => {
              setEditing(null);
              setModalOpen(true);
            }}
          >
            Create Quotation
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard label="Total Quotations" value={String(summary?.quotationCount || 0)} color="accent" icon={<Send size={18} />} />
        <StatCard label="Sent" value={String(summary?.sentCount || 0)} color="cyan" icon={<Send size={18} />} />
        <StatCard label="Accepted" value={String(summary?.acceptedCount || 0)} color="green" icon={<Check size={18} />} />
        <StatCard label="Converted" value={String(summary?.convertedCount || 0)} color="green" icon={<FileDown size={18} />} />
        <StatCard label="Pipeline Value" value={formatCurrency(summary?.totalValue || 0)} color="amber" icon={<Plus size={18} />} />
      </div>

      <Card className="p-4!">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <Input
              placeholder="Search quotation number or customer..."
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
            />
          </div>
        </div>
      </Card>

      <Card className="p-0! overflow-hidden">
        <DataTable<Record<string, unknown>>
          columns={columns as any}
          data={quotations as any}
          keyField="id"
          loading={isLoading}
          emptyMessage="No quotations found. Create your first quotation."
          page={page}
          totalPages={data?.pagination?.totalPages || 1}
          onPageChange={setPage}
        />
      </Card>

      <Modal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditing(null);
        }}
        title={editing ? 'Edit Quotation' : 'Create Quotation'}
        size="lg"
      >
        <QuotationForm
          quotation={editing}
          onSuccess={() => {
            setModalOpen(false);
            setEditing(null);
            queryClient.invalidateQueries({ queryKey: ['quotations'] });
            queryClient.invalidateQueries({ queryKey: ['report-quotations-quick'] });
          }}
        />
      </Modal>
    </div>
  );
}

function QuotationForm({ quotation, onSuccess }: { quotation: Quotation | null; onSuccess: () => void }) {
  const [customerSearch, setCustomerSearch] = useState('');
  const [productSearch, setProductSearch] = useState('');

  const customerOptions = useCustomerSearch(customerSearch);
  const productOptions = useProductSearch(productSearch);

  const [form, setForm] = useState<QuotationFormInput>({
    customerId: quotation?.customerId || '',
    customerName: quotation?.customer?.name || quotation?.customerName || '',
    quotationDate: quotation?.quotationDate?.split('T')[0] || new Date().toISOString().split('T')[0],
    validUntil:
      quotation?.validUntil?.split('T')[0] ||
      new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    discount: Number(quotation?.discount || 0),
    terms: quotation?.terms || '',
    notes: quotation?.notes || '',
    items:
      quotation?.items?.map((item) => ({
        productId: item.productId,
        description: item.description,
        hsnCode: item.hsnCode,
        quantity: Number(item.quantity) || 1,
        unitPrice: Number(item.unitPrice) || 0,
        gstRate: Number(item.gstRate) || 18,
      })) || [
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

  useEffect(() => {
    if (!quotation) {
      return;
    }

    setForm({
      customerId: quotation.customerId,
      customerName: quotation.customer?.name || quotation.customerName || '',
      quotationDate: quotation.quotationDate.split('T')[0],
      validUntil: quotation.validUntil.split('T')[0],
      discount: Number(quotation.discount || 0),
      terms: quotation.terms || '',
      notes: quotation.notes || '',
      items: quotation.items.map((item) => ({
        productId: item.productId,
        description: item.description,
        hsnCode: item.hsnCode,
        quantity: Number(item.quantity) || 1,
        unitPrice: Number(item.unitPrice) || 0,
        gstRate: Number(item.gstRate) || 18,
      })),
    });
  }, [quotation]);

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload = {
        customerId: form.customerId,
        quotationDate: form.quotationDate,
        validUntil: form.validUntil,
        discount: Number(form.discount) || 0,
        terms: form.terms || '',
        notes: form.notes || '',
        items: form.items.map((item) => ({
          productId: item.productId || undefined,
          description: item.description,
          hsnCode: item.hsnCode || undefined,
          quantity: Number(item.quantity) || 1,
          unitPrice: Number(item.unitPrice) || 0,
          gstRate: Number(item.gstRate) || 0,
        })),
      };

      if (quotation) {
        return apiPut(`/quotations/${quotation.id}`, payload);
      }
      return apiPost('/quotations', payload);
    },
    onSuccess: () => {
      toast.success(quotation ? 'Quotation updated' : 'Quotation created');
      onSuccess();
    },
    onError: (err: any) => {
      const message = err?.response?.data?.error || 'Failed to save quotation';
      toast.error(message);
    },
  });

  const totals = useMemo(() => calcTotals(form.items, form.discount), [form.items, form.discount]);

  const updateItem = (idx: number, fieldOrUpdates: string | Record<string, any>, value?: any) => {
    const items = [...form.items];
    if (typeof fieldOrUpdates === 'string') {
      items[idx] = { ...items[idx], [fieldOrUpdates]: value };
    } else {
      items[idx] = { ...items[idx], ...fieldOrUpdates };
    }
    setForm({ ...form, items });
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
    if (form.items.length === 1) {
      return;
    }
    setForm({ ...form, items: form.items.filter((_, i) => i !== idx) });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.customerId) {
      toast.error('Please select a customer');
      return;
    }

    const hasInvalidItems = form.items.some((item) => !item.description || Number(item.quantity) <= 0 || Number(item.unitPrice) < 0);
    if (hasInvalidItems) {
      toast.error('Please fill all required fields in line items');
      return;
    }

    saveMutation.mutate();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 px-1">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <ComboBox
          label="Customer"
          placeholder="Select customer"
          options={customerOptions.options}
          value={form.customerId}
          onChange={(value) => {
            const selected = customerOptions.options.find((opt) => opt.value === value);
            setForm({ ...form, customerId: value, customerName: selected?.label || '' });
          }}
          onSearch={setCustomerSearch}
          onLoadMore={customerOptions.loadMore}
          loading={customerOptions.loading}
          hasMore={customerOptions.hasMore}
          searchPlaceholder="Search customers..."
          required
        />
        <Input
          id="quotationDate"
          label="Quotation Date"
          type="date"
          value={form.quotationDate}
          onChange={(e) => setForm({ ...form, quotationDate: e.target.value })}
          required
        />
        <Input
          id="validUntil"
          label="Valid Until"
          type="date"
          value={form.validUntil}
          onChange={(e) => setForm({ ...form, validUntil: e.target.value })}
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

      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="text-sm font-medium text-text2">Line Items</label>
          <Button type="button" variant="ghost" size="sm" onClick={addItem} icon={<Plus size={14} />}>
            Add Item
          </Button>
        </div>
        <div className="space-y-3">
          {form.items.map((item, idx) => (
            <QuotationLineItem
              key={idx}
              item={item}
              onUpdate={(field, value) => updateItem(idx, field, value)}
              onDelete={() => removeItem(idx)}
              canDelete={form.items.length > 1}
              productOptions={productOptions}
              setProductSearch={setProductSearch}
            />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <div>
          <label htmlFor="terms" className="block text-sm font-medium text-text2 mb-1.5">
            Terms & Conditions
          </label>
          <textarea
            id="terms"
            rows={2}
            maxLength={1000}
            value={form.terms}
            onChange={(e) => setForm({ ...form, terms: e.target.value })}
            className="w-full px-3.5 py-2.5 rounded-lg border bg-bg3 border-border text-text placeholder:text-text3 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all resize-none"
            placeholder="Proposal terms and payment conditions..."
          />
        </div>
        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-text2 mb-1.5">
            Notes
          </label>
          <textarea
            id="notes"
            rows={2}
            maxLength={500}
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            className="w-full px-3.5 py-2.5 rounded-lg border bg-bg3 border-border text-text placeholder:text-text3 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all resize-none"
            placeholder="Additional note for this quotation..."
          />
        </div>
      </div>

      <Card className="p-4!">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
          <div className="flex items-center justify-between sm:block">
            <p className="text-text3">Subtotal</p>
            <p className="font-semibold">{formatCurrency(totals.subtotal)}</p>
          </div>
          <div className="flex items-center justify-between sm:block">
            <p className="text-text3">Tax</p>
            <p className="font-semibold">{formatCurrency(totals.taxAmount)}</p>
          </div>
          <div className="flex items-center justify-between sm:block">
            <p className="text-text3">Grand Total</p>
            <p className="font-semibold text-accent2">{formatCurrency(totals.totalAmount)}</p>
          </div>
        </div>
      </Card>

      <div className="flex justify-end gap-3 pt-2 border-t border-border">
        <Button type="submit" loading={saveMutation.isPending}>
          {quotation ? 'Update Quotation' : 'Create Quotation'}
        </Button>
      </div>
    </form>
  );
}

function QuotationLineItem({
  item,
  canDelete,
  onUpdate,
  onDelete,
  productOptions,
  setProductSearch,
}: {
  item: QuotationFormInput['items'][number];
  canDelete: boolean;
  onUpdate: (fieldOrUpdates: string | Record<string, any>, value?: any) => void;
  onDelete: () => void;
  productOptions: ReturnType<typeof useProductSearch>;
  setProductSearch: (search: string) => void;
}) {
  const asLine = calcLine({
    description: item.description,
    hsnCode: item.hsnCode,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    gstRate: item.gstRate,
  });

  return (
    <div className="p-3 bg-surface rounded-lg border border-border space-y-3">
      <div className="grid grid-cols-12 gap-3">
        <div className="col-span-12 sm:col-span-6">
          <ComboBox
            placeholder="Select product (optional)"
            options={productOptions.options}
            value={item.productId || ''}
            onChange={(productId) => {
              if (!productId) {
                onUpdate({ productId: '' });
                return;
              }

              const selected = productOptions.products?.find((p) => p.id === productId);
              if (!selected) {
                onUpdate({ productId });
                return;
              }

              onUpdate({
                productId,
                description: selected.name,
                hsnCode: selected.hsnCode || '',
                unitPrice: Number(selected.sellingPrice) || 0,
                gstRate: Number(selected.gstRate) || 18,
              });
            }}
            onSearch={setProductSearch}
            onLoadMore={productOptions.loadMore}
            loading={productOptions.loading}
            hasMore={productOptions.hasMore}
            searchPlaceholder="Search products..."
          />
        </div>

        <div className="col-span-12 sm:col-span-6">
          <Input
            placeholder="Description *"
            value={item.description}
            onChange={(e) => onUpdate('description', e.target.value)}
            required
          />
        </div>

        <div className="col-span-6 sm:col-span-3">
          <Input
            placeholder="HSN Code"
            value={item.hsnCode || ''}
            onChange={(e) => onUpdate('hsnCode', e.target.value)}
            maxLength={8}
          />
        </div>

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

        <div className="col-span-6 sm:col-span-3">
          <Select
            options={GST_RATES.map((rate) => ({ label: `${rate}%`, value: String(rate) }))}
            value={String(item.gstRate)}
            onChange={(e) => onUpdate('gstRate', +e.target.value)}
            placeholder="GST"
          />
        </div>

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

      <div className="flex justify-end text-xs text-text3 gap-3">
        <span>Taxable: {formatCurrency(asLine.taxable)}</span>
        <span>GST: {formatCurrency(asLine.tax)}</span>
        <span className="text-text2">Line Total: {formatCurrency(asLine.total)}</span>
      </div>
    </div>
  );
}
