import { z } from 'zod';
import { VALID_GST_RATES } from '../../utils/gst';

export const createProductSchema = z.object({
  name: z.string().min(1, 'Product name is required').max(200),
  type: z.enum(['GOODS', 'SERVICE']).default('GOODS'),
  hsnCode: z.string().min(4).max(8).optional().or(z.literal('')),
  sacCode: z.string().min(4).max(8).optional().or(z.literal('')),
  gstRate: z.number().refine((val) => VALID_GST_RATES.includes(val), {
    message: `GST rate must be one of: ${VALID_GST_RATES.join(', ')}%`,
  }),
  sellingPrice: z.number().min(0, 'Selling price must be non-negative'),
  costPrice: z.number().min(0).optional(),
  unit: z.string().max(20).default('Nos'),
  stock: z.number().int().min(0).default(0),
  lowStockThreshold: z.number().int().min(0).default(10),
  description: z.string().max(500).optional().or(z.literal('')),
});

export const updateProductSchema = createProductSchema.partial();

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
