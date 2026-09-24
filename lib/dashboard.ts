import type { Account } from './schemas/account';
import type { Contact } from './schemas/contact';
import type { Deal } from './schemas/deal';

export function isoDay(offset = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
}

export const money = (n: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);

export function dayLabel(d: string | null) {
  return d ? new Date(d + 'T12:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : 'À qualifier';
}

export function reasons(account: Account, contacts: Contact[], deal: Deal | null) {
  const r: string[] = [];
  if (!contacts.some((c) => c.status === 'Vérifié')) r.push('Contact à vérifier');
  if (deal) {
    if (!deal.logo) r.push('Logo manquant');
    if (!deal.decisionMaker || !deal.deadline) r.push('Besoin à qualifier');
    if (deal.stage === 'À qualifier') r.push('Statut du devis inconnu');
  }
  if (account.due && account.due <= isoDay()) r.push('Relance à effectuer');
  return r;
}
