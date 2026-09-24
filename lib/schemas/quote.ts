import { z } from 'zod';

export const quoteStatuses = ['Brouillon', 'Envoyé', 'Accepté', 'Refusé', 'Expiré'] as const;

export const quoteItemSchema = z.object({
  id: z.string(),
  quoteId: z.string(),
  position: z.number().int().nonnegative(),
  label: z.string().min(1).max(200),
  quantity: z.number().positive(),
  unitPrice: z.number().nonnegative(),
  discount: z.number().min(0).max(100),
});

export const quoteItemInputSchema = quoteItemSchema.omit({ id: true, quoteId: true });

export const quoteSchema = z.object({
  id: z.string(),
  number: z.string().min(1).max(30),
  accountId: z.string(),
  dealId: z.string(),
  contactId: z.string().nullable(),
  status: z.enum(quoteStatuses),
  issueDate: z.string(),
  validUntil: z.string().nullable(),
  vatRate: z.number().min(0).max(100),
  notes: z.string().max(2000),
  revision: z.number().int(),
});

export const quoteInputSchema = quoteSchema
  .omit({ id: true, number: true, revision: true })
  .extend({ items: z.array(quoteItemInputSchema).min(1) });

export const quoteUpdateSchema = quoteSchema
  .omit({ number: true })
  .extend({ items: z.array(quoteItemInputSchema).min(1) });

export type Quote = z.infer<typeof quoteSchema>;
export type QuoteItem = z.infer<typeof quoteItemSchema>;
export type QuoteItemInput = z.infer<typeof quoteItemInputSchema>;

/** Ligne HT, remise appliquée. Arrondi au centime pour éviter les dérives de flottants. */
export function lineTotal(item: { quantity: number; unitPrice: number; discount: number }) {
  return Math.round(item.quantity * item.unitPrice * (1 - item.discount / 100) * 100) / 100;
}

/** Totaux d'un devis : HT, TVA, TTC. */
export function quoteTotals(
  items: { quantity: number; unitPrice: number; discount: number }[],
  vatRate: number
) {
  const subtotal = Math.round(items.reduce((sum, i) => sum + lineTotal(i), 0) * 100) / 100;
  const vat = Math.round(subtotal * (vatRate / 100) * 100) / 100;
  return { subtotal, vat, total: Math.round((subtotal + vat) * 100) / 100 };
}

/** Montant au centime près : un devis doit s'additionner exactement, contrairement aux vues de synthèse. */
export const exactMoney = (n: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
