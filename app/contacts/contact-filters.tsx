'use client';

import { useMemo, useState } from 'react';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { ContactCard } from './contact-card';

type Contact = {
  id: string;
  accountId: string;
  name: string;
  role: string;
  email: string;
  status: 'Vérifié' | 'À revérifier' | 'Parti';
  verified: string | null;
  revision: number;
};

const statusFilters = ['Tous', 'Vérifié', 'À revérifier', 'Parti'] as const;

export function ContactFilters({ contacts, accountNameById }: { contacts: Contact[]; accountNameById: Map<string, string> }) {
  const [status, setStatus] = useState<(typeof statusFilters)[number]>('Tous');
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    return contacts.filter((c) => {
      if (status !== 'Tous' && c.status !== status) return false;
      if (query.trim() && !c.name.toLowerCase().includes(query.trim().toLowerCase())) return false;
      return true;
    });
  }, [contacts, status, query]);

  return (
    <section className="panel directory">
      <div className="panel-title">
        <div>
          <h2>
            Tous les contacts <span className="count">{filtered.length}</span>
          </h2>
        </div>
        <div className="filters-row">
          <input
            className="text-filter"
            placeholder="Rechercher un nom…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Rechercher un contact"
          />
          <Select value={status} onValueChange={(v) => setStatus(v as (typeof statusFilters)[number])}>
            <SelectTrigger aria-label="Filtrer par statut" className="pick">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {statusFilters.map((s) => (
                <SelectItem key={s} value={s}>
                  {s === 'Tous' ? 'Tous les statuts' : s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      {filtered.map((c) => (
        <ContactCard key={c.id} contact={c} accountName={accountNameById.get(c.accountId) ?? 'Compte inconnu'} showAccount />
      ))}
      {!filtered.length && <div className="empty">Aucun contact ne correspond à ces filtres.</div>}
    </section>
  );
}
