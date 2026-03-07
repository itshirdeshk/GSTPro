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
  totalRevenue: number;
  totalInvoices: number;
  averageInvoiceValue: number;
  monthlySales: { month: string; revenue: number; count: number }[];
}

export interface GSTReport {
  totalCgst: number;
  totalSgst: number;
  totalIgst: number;
  totalGst: number;
  gstByRate: { rate: number; taxable: number; tax: number }[];
}

export interface DashboardStats {
  totalRevenue: number;
  gstCollected: number;
  pendingPayments: number;
  totalExpenses: number;
  recentInvoices: Invoice[];
  topCustomers: { customer: Customer; revenue: number }[];
}
