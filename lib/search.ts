import { like, or } from 'drizzle-orm';
import { database } from '@/db';
import { accounts, contacts, deals, leads, tasks } from '@/db/schema';

export type SearchResult = { type: 'compte' | 'contact' | 'affaire' | 'lead' | 'tache'; id: string; label: string; sublabel: string; href: string };

export async function globalSearch(query: string): Promise<SearchResult[]> {
  const q = query.trim();
  if (q.length < 2) return [];
  const like_ = `%${q}%`;
  const db = database();

  const [accountRows, contactRows, dealRows, leadRows, taskRows] = await Promise.all([
    db.select().from(accounts).where(or(like(accounts.name, like_), like(accounts.city, like_))).limit(8),
    db.select().from(contacts).where(like(contacts.name, like_)).limit(8),
    db.select().from(deals).where(like(deals.name, like_)).limit(8),
    db.select().from(leads).where(or(like(leads.name, like_), like(leads.company, like_))).limit(8),
    db.select().from(tasks).where(like(tasks.title, like_)).limit(8),
  ]);

  return [
    ...accountRows.map((a) => ({ type: 'compte' as const, id: a.id, label: a.name, sublabel: [a.sector, a.city].filter(Boolean).join(' · '), href: `/comptes/${a.id}` })),
    ...contactRows.map((c) => ({ type: 'contact' as const, id: c.id, label: c.name, sublabel: c.role || 'Contact', href: `/comptes/${c.accountId}` })),
    ...dealRows.map((d) => ({ type: 'affaire' as const, id: d.id, label: d.name, sublabel: d.stage, href: '/affaires' })),
    ...leadRows.map((l) => ({ type: 'lead' as const, id: l.id, label: l.name, sublabel: l.company || 'Lead', href: '/leads' })),
    ...taskRows.map((t) => ({ type: 'tache' as const, id: t.id, label: t.title, sublabel: t.status, href: '/taches' })),
  ];
}
