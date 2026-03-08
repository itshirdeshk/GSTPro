// ──── Auth ────
export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'ADMIN' | 'STAFF' | 'ACCOUNTANT';
  tenantId: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

// ──── Tenant ────
export interface Tenant {
  id: string;
  businessName: string;
  gstin?: string;
  pan?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  businessType?: string;
  website?: string;
  logo?: string;
  isGstRegistered: boolean;
  isComposition: boolean;
}

// ──── Subscription ────
export type PlanType = 'FREE' | 'BASIC' | 'PRO';
export type SubscriptionStatus = 'ACTIVE' | 'EXPIRED' | 'CANCELLED';

export interface Subscription {
  id: string;
  plan: PlanType;
  status: SubscriptionStatus;
  startDate: string;
  endDate: string;
  maxUsers: number;
  maxCustomers: number;
  maxProducts: number;
  maxInvoicesPerMonth: number;
}

// ──── Customer ────
export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  gstin?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  creditLimit: number;
  outstandingAmount: number;
  isActive: boolean;
  createdAt: string;
}

// ──── Product ────
export interface Product {
  id: string;
  name: string;
  description?: string;
  hsnCode?: string;
  sacCode?: string;
  type: 'GOODS' | 'SERVICE';
  sellingPrice: number;
  costPrice: number;
  gstRate: number;
  unit: string;
  stock: number;
  lowStockThreshold: number;
  isActive: boolean;
  createdAt: string;
}

// ──── Invoice ────
export type InvoiceStatus = 'DRAFT' | 'ISSUED' | 'PARTIALLY_PAID' | 'PAID' | 'CANCELLED';

export interface InvoiceItem {
  id?: string;
  productId?: string; // Optional - can create items without linking to product
  description: string; // Required - item description
  hsnCode?: string;
  quantity: number;
  unitPrice: number;
  discount?: number;
  taxableAmount?: number;
  gstRate: number;
  cgst?: number;
  sgst?: number;
  igst?: number;
  total?: number;
  // Display fields from joined data
  productName?: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  customerId: string;
  customer?: Customer;
  invoiceDate: string;
  dueDate: string;
  status: InvoiceStatus;
  subtotal: number;
  discount?: number; // Invoice-level discount
  totalDiscount: number;
  totalTaxableAmount: number;
  cgst: number;
  sgst: number;
  igst: number;
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  isInterState: boolean;
  isReverseCharge: boolean;
  notes?: string;
  terms?: string;
  templateId?: number; // Invoice template (1-4)
  items: InvoiceItem[];
  payments?: Payment[];
  createdAt: string;
}

// ──── Payment ────
export type PaymentMode = 'CASH' | 'UPI' | 'BANK_TRANSFER' | 'CHEQUE' | 'CARD' | 'OTHER';

export interface Payment {
  id: string;
  invoiceId: string;
  invoice?: Invoice;
  amount: number;
  paymentDate: string;
  paymentMode: PaymentMode;
  referenceNumber?: string;
  notes?: string;
  createdAt: string;
}

// ──── Expense ────
export type ExpenseCategory =
  | 'RENT'
  | 'SALARY'
  | 'UTILITIES'
  | 'OFFICE_SUPPLIES'
  | 'TRAVEL'
  | 'MARKETING'
  | 'PROFESSIONAL_FEES'
  | 'INSURANCE'
  | 'MAINTENANCE'
  | 'OTHER';

export interface Expense {
  id: string;
  description: string;
  amount: number;
  gstAmount: number;
  category: ExpenseCategory;
  expenseDate: string;
  vendor?: string;
  paymentMode: PaymentMode;
  referenceNumber?: string;
  notes?: string;
  receiptUrl?: string;
  createdAt: string;
}

// ──── Reports ────
export interface SalesReport {
  summary: {
    totalRevenue: number;
    totalCollected: number;
    totalOutstanding: number;
    subtotal: number;
    totalCgst: number;
    totalSgst: number;
    totalIgst: number;
    totalDiscount: number;
    invoiceCount: number;
  };
  byStatus: { status: string; total: number; count: number }[];
  topCustomers: { customerId: string; customerName: string; total: number; invoiceCount: number }[];
  monthlyTrend: { month: string; total: number; count: number }[];
}

export interface GSTReport {
  summary: {
    taxableValue: number;
    cgst: number;
    sgst: number;
    igst: number;
    totalOutputGst: number;
    totalInputGst: number;
    netGstLiability: number;
    invoiceCount: number;
  };
  byGstRate: {
    gstRate: number;
    taxableAmount: number;
    cgst: number;
    sgst: number;
    igst: number;
    total: number;
    count: number;
  }[];
  interVsIntra: { type: string; cgst: number; sgst: number; igst: number; total: number; count: number }[];
  monthlyTrend: { month: string; cgst: number; sgst: number; igst: number; total: number }[];
}

export interface ProfitLossReport {
  income: {
    revenue: number;
    totalInvoiceAmount: number;
    discount: number;
  };
  expenses: {
    total: number;
    gstOnExpenses: number;
    count: number;
    byCategory: { category: string; amount: number; count: number }[];
  };
  profitLoss: {
    netProfit: number;
    profitMargin: number;
    isProfit: boolean;
  };
}

export interface OutstandingReport {
  summary: {
    totalOutstanding: number;
    totalInvoiced: number;
    totalPaid: number;
    invoiceCount: number;
    overdueCount: number;
  };
  ageing: {
    current: number;
    '1-30 days': number;
    '31-60 days': number;
    '61-90 days': number;
    '90+ days': number;
  };
  byCustomer: {
    customerId: string;
    customerName: string;
    totalInvoiced: number;
    totalPaid: number;
    outstanding: number;
    invoiceCount: number;
  }[];
  invoices: {
    id: string;
    invoiceNumber: string;
    invoiceDate: string;
    dueDate: string;
    totalAmount: number;
    amountPaid: number;
    outstanding: number;
    status: string;
    isOverdue: boolean;
    customer: { id: string; name: string; gstin: string | null };
  }[];
}

export interface DashboardStats {
  totalRevenue: number;
  gstCollected: number;
  pendingPayments: number;
  totalExpenses: number;
  recentInvoices: Invoice[];
  topCustomers: { customer: Customer; revenue: number }[];
}
