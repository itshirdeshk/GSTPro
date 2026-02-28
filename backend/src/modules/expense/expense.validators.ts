import { z } from 'zod';

export const createExpenseSchema = z.object({
  category: z.enum([
    'RENT', 'SALARY', 'UTILITIES', 'TRAVEL', 'OFFICE_SUPPLIES',
    'MARKETING', 'PROFESSIONAL_FEES', 'INSURANCE', 'MAINTENANCE', 'OTHER',
  ]),
  description: z.string().min(1, 'Description is required').max(500),
  amount: z.number().positive('Amount must be positive'),
  gstAmount: z.number().min(0).default(0),
  expenseDate: z.string().min(1, 'Expense date is required'),
  paymentMode: z.enum([
    'CASH', 'UPI', 'NEFT', 'RTGS', 'CHEQUE', 'CARD', 'CREDIT_CARD', 'BANK_TRANSFER',
  ]),
  referenceNumber: z.string().max(100).optional().or(z.literal('')),
  vendor: z.string().max(200).optional().or(z.literal('')),
  notes: z.string().max(500).optional().or(z.literal('')),
});

export const updateExpenseSchema = z.object({
  category: z.enum([
    'RENT', 'SALARY', 'UTILITIES', 'TRAVEL', 'OFFICE_SUPPLIES',
    'MARKETING', 'PROFESSIONAL_FEES', 'INSURANCE', 'MAINTENANCE', 'OTHER',
  ]).optional(),
  description: z.string().min(1).max(500).optional(),
  amount: z.number().positive().optional(),
  gstAmount: z.number().min(0).optional(),
  expenseDate: z.string().optional(),
  paymentMode: z.enum([
    'CASH', 'UPI', 'NEFT', 'RTGS', 'CHEQUE', 'CARD', 'CREDIT_CARD', 'BANK_TRANSFER',
  ]).optional(),
  referenceNumber: z.string().max(100).optional().or(z.literal('')),
  vendor: z.string().max(200).optional().or(z.literal('')),
  notes: z.string().max(500).optional().or(z.literal('')),
});

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>;
