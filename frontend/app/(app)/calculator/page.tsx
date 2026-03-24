'use client';

import { useMemo, useState } from 'react';
import { Calculator, Percent, ReceiptIndianRupee } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Tabs } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { formatCurrency, GST_RATES } from '@/lib/utils';

const calculatorTabs = [
  { key: 'gst', label: 'GST Calculator' },
  { key: 'margin', label: 'Margin Calculator' },
  { key: 'discount', label: 'Discount Calculator' },
];

export default function CalculatorPage() {
  const [tab, setTab] = useState('gst');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-heading text-lg font-bold">Business Calculator</h2>
          <p className="text-sm text-text3">Quick working for GST, margin, and discount scenarios</p>
        </div>
      </div>

      <Tabs tabs={calculatorTabs} activeTab={tab} onChange={setTab} />

      {tab === 'gst' && <GstCalculator />}
      {tab === 'margin' && <MarginCalculator />}
      {tab === 'discount' && <DiscountCalculator />}
    </div>
  );
}

function GstCalculator() {
  const [amount, setAmount] = useState(0);
  const [rate, setRate] = useState('18');
  const [inclusive, setInclusive] = useState('no');
  const [interState, setInterState] = useState('no');

  const result = useMemo(() => {
    const numericRate = Number(rate) || 0;
    const base = Number(amount) || 0;

    if (base <= 0) {
      return {
        taxable: 0,
        gst: 0,
        cgst: 0,
        sgst: 0,
        igst: 0,
        grandTotal: 0,
      };
    }

    const taxable = inclusive === 'yes' ? base / (1 + numericRate / 100) : base;
    const gst = taxable * (numericRate / 100);
    const grandTotal = inclusive === 'yes' ? base : taxable + gst;

    const isInterState = interState === 'yes';
    const igst = isInterState ? gst : 0;
    const cgst = isInterState ? 0 : gst / 2;
    const sgst = isInterState ? 0 : gst / 2;

    return { taxable, gst, cgst, sgst, igst, grandTotal };
  }, [amount, rate, inclusive, interState]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Card>
        <h3 className="font-heading text-base font-bold mb-4 flex items-center gap-2">
          <ReceiptIndianRupee size={16} /> GST Breakdown
        </h3>
        <div className="space-y-4">
          <Input
            id="amount"
            label="Amount"
            type="number"
            min="0"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(+e.target.value)}
          />
          <Select
            id="rate"
            label="GST Rate"
            options={GST_RATES.map((r) => ({ value: String(r), label: `${r}%` }))}
            value={rate}
            onChange={(e) => setRate(e.target.value)}
          />
          <Select
            id="inclusive"
            label="Amount Includes GST"
            options={[
              { value: 'no', label: 'No (exclusive)' },
              { value: 'yes', label: 'Yes (inclusive)' },
            ]}
            value={inclusive}
            onChange={(e) => setInclusive(e.target.value)}
          />
          <Select
            id="interstate"
            label="Transaction Type"
            options={[
              { value: 'no', label: 'Intra-state (CGST + SGST)' },
              { value: 'yes', label: 'Inter-state (IGST)' },
            ]}
            value={interState}
            onChange={(e) => setInterState(e.target.value)}
          />
        </div>
      </Card>

      <Card>
        <h3 className="font-heading text-base font-bold mb-4">Result</h3>
        <div className="space-y-3 text-sm">
          <ResultRow label="Taxable Amount" value={formatCurrency(result.taxable)} />
          <ResultRow label="GST Amount" value={formatCurrency(result.gst)} />
          <ResultRow label="CGST" value={formatCurrency(result.cgst)} />
          <ResultRow label="SGST" value={formatCurrency(result.sgst)} />
          <ResultRow label="IGST" value={formatCurrency(result.igst)} />
          <div className="pt-3 border-t border-border">
            <ResultRow label="Grand Total" value={formatCurrency(result.grandTotal)} highlight />
          </div>
        </div>
      </Card>
    </div>
  );
}

function MarginCalculator() {
  const [costPrice, setCostPrice] = useState(0);
  const [sellingPrice, setSellingPrice] = useState(0);

  const metrics = useMemo(() => {
    const cp = Number(costPrice) || 0;
    const sp = Number(sellingPrice) || 0;

    if (cp <= 0 || sp <= 0) {
      return { profit: 0, margin: 0, markup: 0, breakEven: 0 };
    }

    const profit = sp - cp;
    const margin = (profit / sp) * 100;
    const markup = (profit / cp) * 100;
    const breakEven = cp;

    return { profit, margin, markup, breakEven };
  }, [costPrice, sellingPrice]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Card>
        <h3 className="font-heading text-base font-bold mb-4 flex items-center gap-2">
          <Percent size={16} /> Margin Inputs
        </h3>
        <div className="space-y-4">
          <Input
            id="costPrice"
            label="Cost Price"
            type="number"
            min="0"
            step="0.01"
            value={costPrice}
            onChange={(e) => setCostPrice(+e.target.value)}
          />
          <Input
            id="sellingPrice"
            label="Selling Price"
            type="number"
            min="0"
            step="0.01"
            value={sellingPrice}
            onChange={(e) => setSellingPrice(+e.target.value)}
          />
        </div>
      </Card>

      <Card>
        <h3 className="font-heading text-base font-bold mb-4">Profitability</h3>
        <div className="space-y-3 text-sm">
          <ResultRow label="Profit" value={formatCurrency(metrics.profit)} highlight={metrics.profit > 0} />
          <ResultRow label="Profit Margin" value={`${metrics.margin.toFixed(2)}%`} />
          <ResultRow label="Markup" value={`${metrics.markup.toFixed(2)}%`} />
          <ResultRow label="Break-even Price" value={formatCurrency(metrics.breakEven)} />
        </div>
      </Card>
    </div>
  );
}

function DiscountCalculator() {
  const [mrp, setMrp] = useState(0);
  const [discountPct, setDiscountPct] = useState(0);
  const [extraDiscount, setExtraDiscount] = useState(0);

  const result = useMemo(() => {
    const base = Number(mrp) || 0;
    const pct = Math.max(0, Number(discountPct) || 0);
    const flat = Math.max(0, Number(extraDiscount) || 0);

    if (base <= 0) {
      return { firstDiscount: 0, secondDiscount: 0, totalDiscount: 0, finalPrice: 0, effectivePct: 0 };
    }

    const firstDiscount = base * (pct / 100);
    const afterFirst = Math.max(0, base - firstDiscount);
    const secondDiscount = Math.min(flat, afterFirst);
    const finalPrice = Math.max(0, afterFirst - secondDiscount);
    const totalDiscount = base - finalPrice;
    const effectivePct = (totalDiscount / base) * 100;

    return { firstDiscount, secondDiscount, totalDiscount, finalPrice, effectivePct };
  }, [mrp, discountPct, extraDiscount]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Card>
        <h3 className="font-heading text-base font-bold mb-4 flex items-center gap-2">
          <Calculator size={16} /> Discount Inputs
        </h3>
        <div className="space-y-4">
          <Input id="mrp" label="MRP" type="number" min="0" step="0.01" value={mrp} onChange={(e) => setMrp(+e.target.value)} />
          <Input
            id="discountPct"
            label="Primary Discount (%)"
            type="number"
            min="0"
            step="0.01"
            value={discountPct}
            onChange={(e) => setDiscountPct(+e.target.value)}
          />
          <Input
            id="extraDiscount"
            label="Additional Flat Discount"
            type="number"
            min="0"
            step="0.01"
            value={extraDiscount}
            onChange={(e) => setExtraDiscount(+e.target.value)}
          />
        </div>
      </Card>

      <Card>
        <h3 className="font-heading text-base font-bold mb-4">Discount Result</h3>
        <div className="space-y-3 text-sm">
          <ResultRow label="Percentage Discount" value={formatCurrency(result.firstDiscount)} />
          <ResultRow label="Flat Discount" value={formatCurrency(result.secondDiscount)} />
          <ResultRow label="Total Discount" value={formatCurrency(result.totalDiscount)} />
          <ResultRow label="Effective Discount" value={`${result.effectivePct.toFixed(2)}%`} />
          <div className="pt-3 border-t border-border">
            <ResultRow label="Final Selling Price" value={formatCurrency(result.finalPrice)} highlight />
          </div>
        </div>
      </Card>
    </div>
  );
}

function ResultRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-text3">{label}</span>
      <span className={highlight ? 'font-semibold text-accent2' : 'font-medium'}>{value}</span>
    </div>
  );
}
