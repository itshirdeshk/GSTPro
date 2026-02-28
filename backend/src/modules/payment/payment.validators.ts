import { z } from 'zod';

export const recordPaymentSchema = z.object({
  invoiceId: z.string().uuid('Invalid invoice ID'),
  amount: z.number().positive('Amount must be positive'),
  paymentDate: z.string().min(1, 'Payment date is required'),
  paymentMode: z.enum([
    'CASH', 'UPI', 'NEFT', 'RTGS', 'CHEQUE', 'CARD', 'CREDIT_CARD', 'BANK_TRANSFER',
  ]),
  referenceNumber: z.string().max(100).optional().or(z.literal('')),
  notes: z.string().max(500).optional().or(z.literal('')),
});

export const updatePaymentSchema = z.object({
  amount: z.number().positive().optional(),
  paymentDate: z.string().optional(),
  paymentMode: z.enum([
    'CASH', 'UPI', 'NEFT', 'RTGS', 'CHEQUE', 'CARD', 'CREDIT_CARD', 'BANK_TRANSFER',
  ]).optional(),
  referenceNumber: z.string().max(100).optional().or(z.literal('')),
  notes: z.string().max(500).optional().or(z.literal('')),
});

export type RecordPaymentInput = z.infer<typeof recordPaymentSchema>;
export type UpdatePaymentInput = z.infer<typeof updatePaymentSchema>;
