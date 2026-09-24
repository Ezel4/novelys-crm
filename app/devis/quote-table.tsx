'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowUpDown, ArrowUpRight } from 'lucide-react';
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from '@/components/ui/table';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { money, dayLabel } from '@/lib/dashboard';
import { quoteStatuses } from '@/lib/schemas/quote';

export type QuoteRow = {
  id: string;
  number: string;
  accountId: string;
  accountName: string;
  dealName: string;
  status: (typeof quoteStatuses)[number];
  issueDate: string;
  validUntil: string | null;
  itemCount: number;
  subtotal: number;
  total: number;
};

type SortKey = 'number' | 'issueDate' | 'total';

/** Réutilise les variantes de `.status` déjà définies pour les autres modules. */
function statusTone(status: QuoteRow['status']) {
  if (status === 'Accepté') return 'verified';
  if (status === 'Refusé' || status === 'Expiré') return 'warning';
  return '';
}

export function QuoteTable({ quotes }: { quotes: QuoteRow[] }) {
  const [status, setStatus] = useState<'Tous' | (typeof quoteStatuses)[number]>('Tous');
  const [sortKey, setSortKey] = useState<SortKey>('number');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setSortKey(key);
      setSortDir('asc');
    }
  }

  const filtered = useMemo(() => {
    const rows = quotes.filter((q) => status === 'Tous' || q.status === status);
    const dir = sortDir === 'asc' ? 1 : -1;
    return [...rows].sort((a, b) => {
      if (sortKey === 'total') return (a.total - b.total) * dir;
      return a[sortKey].localeCompare(b[sortKey]) * dir;
    });
  }, [quotes, status, sortKey, sortDir]);

  const totalTtc = useMemo(() => filtered.reduce((sum, q) => sum + q.total, 0), [filtered]);

  return (
    <section className="panel directory">
      <div className="panel-title">
        <div>
          <h2>
            Devis <span className="count">{filtered.length}</span>
          </h2>
          <p>{money(totalTtc)} TTC au total</p>
        </div>
        <div className="filters-row">
          <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
            <SelectTrigger aria-label="Filtrer par statut" className="pick">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Tous">Tous les statuts</SelectItem>
              {quoteStatuses.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="empty">
          <p>Aucun devis pour ce filtre.</p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <button type="button" className="sort-head" onClick={() => toggleSort('number')}>
                  Numéro <ArrowUpDown size={12} />
                </button>
              </TableHead>
              <TableHead>Compte</TableHead>
              <TableHead>Affaire</TableHead>
              <TableHead>
                <button type="button" className="sort-head" onClick={() => toggleSort('issueDate')}>
                  Date <ArrowUpDown size={12} />
                </button>
              </TableHead>
              <TableHead>Validité</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>
                <button type="button" className="sort-head" onClick={() => toggleSort('total')}>
                  Total TTC <ArrowUpDown size={12} />
                </button>
              </TableHead>
              <TableHead><span className="sr-only">Actions</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((q) => (
              <TableRow key={q.id}>
                <TableCell>
                  <Link href={`/devis/${q.id}`}>
                    <strong>{q.number}</strong>
                  </Link>
                  <small>{q.itemCount} ligne{q.itemCount > 1 ? 's' : ''}</small>
                </TableCell>
                <TableCell>
                  <Link href={`/comptes/${q.accountId}`}>{q.accountName}</Link>
                </TableCell>
                <TableCell>{q.dealName}</TableCell>
                <TableCell>{dayLabel(q.issueDate)}</TableCell>
                <TableCell>{q.validUntil ? dayLabel(q.validUntil) : '—'}</TableCell>
                <TableCell>
                  <span className={'status ' + statusTone(q.status)}>{q.status}</span>
                </TableCell>
                <TableCell>
                  <strong>{money(q.total)}</strong>
                  <small>{money(q.subtotal)} HT</small>
                </TableCell>
                <TableCell>
                  <Link href={`/devis/${q.id}`} className="circle" aria-label={`Ouvrir le devis ${q.number}`}>
                    <ArrowUpRight size={15} />
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </section>
  );
}
