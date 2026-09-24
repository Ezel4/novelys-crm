'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight, Search, Plus } from 'lucide-react';
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from '@/components/ui/table';
import { money, dayLabel } from '@/lib/dashboard';
import { CreateAccountDialog } from './account-form';

type AccountRow = {
  id: string;
  name: string;
  city: string;
  sector: string;
  initials: string;
  color: string;
  orders: number;
  revenue: number;
  next: string;
  due: string | null;
  contactName: string | null;
  contactRole: string | null;
  contactVerified: boolean;
};

export function AccountDirectory({ accounts }: { accounts: AccountRow[] }) {
  const [query, setQuery] = useState('');

  const filtered = accounts.filter((a) =>
    (a.name + ' ' + a.city + ' ' + a.sector + ' ' + (a.contactName || '')).toLowerCase().includes(query.toLowerCase())
  );

  return (
    <section className="panel directory">
      <div className="panel-title">
        <div>
          <h2>
            Votre portefeuille <span className="count">{filtered.length}</span>
          </h2>
        </div>
        <label className="search">
          <Search size={18} />
          <input
            aria-label="Rechercher un compte"
            placeholder="Rechercher un compte, un contact…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <CreateAccountDialog trigger={<button className="primary"><Plus size={18} />Nouveau compte</button>} />
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Entreprise</TableHead>
            <TableHead>Contact recommandé</TableHead>
            <TableHead>Commandes</TableHead>
            <TableHead>Prochaine action</TableHead>
            <TableHead><span className="sr-only">Ouvrir</span></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.map((a) => (
            <TableRow key={a.id}>
              <TableCell>
                <Link href={`/comptes/${a.id}`} className="company-cell">
                  <span className={'company-mark ' + a.color}>{a.initials}</span>
                  <span>
                    <strong>{a.name}</strong>
                    <small>{a.city} · {a.sector}</small>
                  </span>
                </Link>
              </TableCell>
              <TableCell>
                {a.contactName ? (
                  <>
                    <strong>{a.contactName}</strong>
                    <small>{a.contactRole}</small>
                  </>
                ) : (
                  <span className="status warning">À vérifier</span>
                )}
              </TableCell>
              <TableCell>
                {a.orders}
                <small>{money(a.revenue)}</small>
              </TableCell>
              <TableCell>
                {dayLabel(a.due)}
                <small>{a.next}</small>
              </TableCell>
              <TableCell>
                <Link href={`/comptes/${a.id}`} className="circle" aria-label={'Voir ' + a.name} title={'Voir ' + a.name}>
                  <ArrowUpRight />
                </Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {!filtered.length && <div className="empty">Aucun compte trouvé. Essayez un autre nom.</div>}
    </section>
  );
}
