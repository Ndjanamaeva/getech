import { z } from 'zod';

export const quoteFormSchema = z.object({
  product_id: z.string().uuid('Produit invalide'),
  quantity: z
    .number({ error: 'La quantité doit être un nombre' })
    .int('La quantité doit être un entier')
    .min(1, 'La quantité doit être d\'au moins 1')
    .max(100000, 'Quantité trop élevée'),
  first_name: z
    .string()
    .min(2, 'Le prénom est requis (2 caractères minimum)')
    .max(80, 'Prénom trop long'),
  last_name: z
    .string()
    .min(2, 'Le nom est requis (2 caractères minimum)')
    .max(80, 'Nom trop long'),
  email: z
    .string()
    .email('Adresse e-mail invalide')
    .optional()
    .or(z.literal('')),
  phone: z
    .string()
    .min(8, 'Numéro de téléphone trop court')
    .max(25, 'Numéro de téléphone trop long')
    .regex(/^[+()\d\s-]+$/, 'Format de téléphone invalide'),
  address: z
    .string()
    .min(5, 'L\'adresse est requise (5 caractères minimum)')
    .max(200, 'Adresse trop longue'),
  city: z
    .string()
    .max(80, 'Ville trop longue')
    .optional()
    .or(z.literal('')),
  country: z.string().min(2, 'Pays requis').max(80),
  message: z
    .string()
    .max(2000, 'Message trop long')
    .optional()
    .or(z.literal('')),
  consent: z.literal(true, {
    error: 'Vous devez accepter le traitement de vos données',
  }),
});

export type QuoteFormValues = z.infer<typeof quoteFormSchema>;

export const productSchema = z.object({
  category_id: z.string().uuid('Catégorie requise'),
  name: z.string().min(2, 'Nom requis').max(200),
  reference: z.string().max(100).optional().or(z.literal('')),
  slug: z.string().min(2, 'Slug requis').max(200).regex(/^[a-z0-9-]+$/, 'Slug invalide (minuscules, chiffres, traits d\'union)'),
  short_description: z.string().max(300).optional().or(z.literal('')),
  long_description: z.string().max(5000).optional().or(z.literal('')),
  image_url: z.string().url('URL d\'image invalide').optional().or(z.literal('')),
  unit_price: z.number().min(0, 'Prix invalide').max(999999999, 'Prix trop élevé'),
  currency: z.string().min(3).max(3).default('XAF'),
  show_public_price: z.boolean().default(false),
  is_active: z.boolean().default(true),
  stock_quantity: z.number().int().min(0, 'Stock invalide'),
  low_stock_threshold: z.number().int().min(0, 'Seuil invalide'),
});

export type ProductFormValues = z.infer<typeof productSchema>;

export const categorySchema = z.object({
  name: z.string().min(2, 'Nom requis').max(200),
  slug: z.string().min(2, 'Slug requis').max(200).regex(/^[a-z0-9-]+$/, 'Slug invalide'),
  description: z.string().max(1000).optional().or(z.literal('')),
  image_url: z.string().url('URL invalide').optional().or(z.literal('')),
  sort_order: z.number().int().min(0).default(0),
  is_active: z.boolean().default(true),
});

export type CategoryFormValues = z.infer<typeof categorySchema>;

export const saleItemSchema = z.object({
  product_id: z.string().uuid(),
  quantity: z.number().int().min(1),
  unit_price: z.number().min(0),
});

export type SaleItemInput = z.infer<typeof saleItemSchema>;

export const saleFormSchema = z.object({
  quote_request_id: z.string().uuid().optional().or(z.literal('')),
  customer_name: z.string().min(2, 'Nom client requis').max(200),
  customer_email: z.string().email('E-mail invalide').optional().or(z.literal('')),
  customer_phone: z.string().max(25).optional().or(z.literal('')),
  items: z.array(saleItemSchema).min(1, 'Au moins un produit est requis'),
});

export type SaleFormValues = z.infer<typeof saleFormSchema>;

export const loginSchema = z.object({
  identifier: z.string().min(1, 'Identifiant requis'),
  password: z.string().min(1, 'Mot de passe requis'),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

export const contactSchema = z.object({
  name: z.string().min(2, 'Nom requis').max(120),
  email: z.string().email('E-mail invalide'),
  message: z.string().min(10, 'Message trop court').max(2000),
});

export type ContactFormValues = z.infer<typeof contactSchema>;
