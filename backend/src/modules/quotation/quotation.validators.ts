import { z } from 'zod';

const quotationItemSchema = z.object({
  productId: z.string().uuid().optional(),
  description: z.string().min(1, 'Item description is required'),
  hsnCode: z.string().max(8).optional().or(z.literal('')),
  quantity: z.number().positive('Quantity must be positive'),
  unitPrice: z.number().min(0, 'Unit price must be non-negative'),
  gstRate: z.number().min(0).max(28),
});

export const createQuotationSchema = z.object({
  customerId: z.string().uuid('Invalid customer ID'),
  quotationDate: z.string().min(1, 'Quotation date is required'),
  validUntil: z.string().min(1, 'Valid until date is required'),
  discount: z.number().min(0).default(0),
  terms: z.string().max(1000).optional().or(z.literal('')),
  notes: z.string().max(500).optional().or(z.literal('')),
  items: z.array(quotationItemSchema).min(1, 'At least one item is required'),
});

export const updateQuotationSchema = z.object({
  customerId: z.string().uuid().optional(),
  quotationDate: z.string().optional(),
  validUntil: z.string().optional(),
  discount: z.number().min(0).optional(),
  terms: z.string().max(1000).optional().or(z.literal('')),
  notes: z.string().max(500).optional().or(z.literal('')),
  items: z.array(quotationItemSchema).min(1).optional(),
});

export const updateQuotationStatusSchema = z.object({
  status: z.enum(['DRAFT', 'SENT', 'ACCEPTED', 'DECLINED', 'EXPIRED', 'CONVERTED']),
});

export const quotationListQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  search: z.string().optional(),
  status: z.enum(['DRAFT', 'SENT', 'ACCEPTED', 'DECLINED', 'EXPIRED', 'CONVERTED']).optional(),
  customerId: z.string().uuid().optional(),
  fromDate: z.string().optional(),
  toDate: z.string().optional(),
});

export type CreateQuotationInput = z.infer<typeof createQuotationSchema>;
export type UpdateQuotationInput = z.infer<typeof updateQuotationSchema>;
export type UpdateQuotationStatusInput = z.infer<typeof updateQuotationStatusSchema>;
