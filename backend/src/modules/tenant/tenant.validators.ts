import { z } from 'zod';

export const updateTenantSchema = z.object({
  businessName: z.string().min(1).max(200).optional(),
  legalName: z.string().max(200).optional(),
  gstin: z.string().length(15).optional(),
  stateCode: z.string().length(2).optional(),
  address: z.string().max(500).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  pincode: z.string().length(6).optional(),
  phone: z.string().max(15).optional(),
  email: z.string().email().optional(),
  pan: z.string().length(10).optional(),
  bankDetails: z
    .object({
      bankName: z.string().optional(),
      accountNumber: z.string().optional(),
      ifscCode: z.string().optional(),
      branchName: z.string().optional(),
    })
    .optional(),
  invoicePrefix: z.string().min(1).max(10).optional(),
  isComposition: z.boolean().optional(),
  logoUrl: z.string().url().optional(),
});

export type UpdateTenantInput = z.infer<typeof updateTenantSchema>;
