import { z } from 'zod';

const invoiceItemSchema = z.object({
  productId: z.string().uuid().optional(),
  description: z.string().min(1, 'Item description is required'),
  hsnCode: z.string().max(8).optional().or(z.literal('')),
  quantity: z.number().positive('Quantity must be positive'),
  unitPrice: z.number().min(0, 'Unit price must be non-negative'),
  gstRate: z.number().min(0).max(28),
});

export const createInvoiceSchema = z.object({
  customerId: z.string().uuid('Invalid customer ID'),
  invoiceDate: z.string().min(1, 'Invoice date is required'),
  dueDate: z.string().min(1, 'Due date is required'),
  isReverseCharge: z.boolean().default(false),
  discount: z.number().min(0).default(0),
  terms: z.string().max(1000).optional().or(z.literal('')),
  notes: z.string().max(500).optional().or(z.literal('')),
  templateId: z.number().int().min(1).max(4).default(1),
  items: z.array(invoiceItemSchema).min(1, 'At least one item is required'),
});

export const updateInvoiceSchema = z.object({
  customerId: z.string().uuid().optional(),
  invoiceDate: z.string().optional(),
  dueDate: z.string().optional(),
  isReverseCharge: z.boolean().optional(),
  discount: z.number().min(0).optional(),
  terms: z.string().max(1000).optional().or(z.literal('')),
  notes: z.string().max(500).optional().or(z.literal('')),
  templateId: z.number().int().min(1).max(4).optional(),
  items: z.array(invoiceItemSchema).min(1).optional(),
});

export const cancelInvoiceSchema = z.object({
  reason: z.string().min(1, 'Cancel reason is required').max(500),
});

export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;
export type UpdateInvoiceInput = z.infer<typeof updateInvoiceSchema>;
export type CancelInvoiceInput = z.infer<typeof cancelInvoiceSchema>;
