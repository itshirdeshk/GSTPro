import { z } from 'zod';

export const createCustomerSchema = z.object({
  name: z.string().min(1, 'Customer name is required').max(200),
  gstin: z.string().length(15, 'GSTIN must be 15 characters').optional().or(z.literal('')),
  phone: z.string().max(15).optional().or(z.literal('')),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  address: z.string().max(500).optional().or(z.literal('')),
  city: z.string().max(100).optional().or(z.literal('')),
  state: z.string().max(100).optional().or(z.literal('')),
  stateCode: z.string().length(2).optional().or(z.literal('')),
  pincode: z.string().max(6).optional().or(z.literal('')),
  creditLimit: z.number().min(0).optional(),
});

export const updateCustomerSchema = createCustomerSchema.partial();

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;
