'use client';

import { useMemo, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowUpRight } from 'lucide-react';
import { toast } from 'sonner';
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from '@/components/ui/table';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { leadStatuses } from '@/lib/schemas/lead';
import { updateLeadStatus, convertLead } from './actions';

type LeadRow = {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  status: (typeof leadStatuses)[number];
  source: string;
  campaignName: string | null;
  convertedAccountId: string | null;
  revision: number;
};

function StatusPick({ lead }: { lead: LeadRow }) {
  const [pending, startTransition] = useTransition();
  if (lead.status === 'Converti') return <span className="status verified">Converti</span>;
  return (
    <Select
      value={lead.status}
      onValueChange={(v) => {
        if (pending) return;
        startTransition(async () => {
          const result = await updateLeadStatus(lead.id, lead.revision, v);
          if ('error' in result) toast.error(result.error);
          else toast.success('Statut du lead mis à jour.');
        });
      }}
    >
      <SelectTrigger aria-label={'Statut ' + lead.name} className="pick">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {leadStatuses.map((s) => (
          <SelectItem key={s} value={s}>
            {s}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function ConvertAction({ lead }: { lead: LeadRow }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  if (lead.status === 'Converti') {
    return lead.convertedAccountId ? (
      <Link href={`/comptes/${lead.convertedAccountId}`} className="text-button">
        Voir le compte
        <ArrowUpRight size={14} />
      </Link>
    ) : null;
  }

  return (
    <button
      className="secondary"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const result = await convertLead(lead.id);
          if ('error' in result) {
            toast.error(result.error);
            return;
          }
          toast.success('Lead converti en compte.');
          router.push(`/comptes/${result.accountId}`);
        })
      }
    >
      {pending ? 'Conversion…' : 'Convertir'}
    </button>
  );
}

export function LeadList({ leads }: { leads: LeadRow[] }) {
  const [status, setStatus] = useState<'Tous' | (typeof leadStatuses)[number]>('Tous');
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    return leads.filter((l) => {
      if (status !== 'Tous' && l.status !== status) return false;
      const q = query.trim().toLowerCase();
      if (q && !l.name.toLowerCase().includes(q) && !l.company.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [leads, status, query]);

  return (
    <section className="panel directory">
      <div className="panel-title">
        <div>
          <h2>
            Leads <span className="count">{filtered.length}</span>
          </h2>
        </div>
        <div className="filters-row">
          <input
            className="text-filter"
            placeholder="Rechercher un nom ou une entreprise…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Rechercher un lead"
          />
          <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
            <SelectTrigger aria-label="Filtrer par statut" className="pick">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Tous">Tous les statuts</SelectItem>
              {leadStatuses.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nom</TableHead>
            <TableHead>Entreprise</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead>Campagne source</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead><span className="sr-only">Actions</span></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.map((l) => (
            <TableRow key={l.id}>
              <TableCell>
                <strong>{l.name}</strong>
              </TableCell>
              <TableCell>{l.company || <span className="status">Non renseignée</span>}</TableCell>
              <TableCell>
                {l.email}
                <small>{l.phone}</small>
              </TableCell>
              <TableCell>{l.campaignName ?? <span className="status">{l.source || 'Aucune'}</span>}</TableCell>
              <TableCell>
                <StatusPick lead={l} />
              </TableCell>
              <TableCell>
                <ConvertAction lead={l} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {!filtered.length && <div className="empty">Aucun lead ne correspond à ces filtres.</div>}
    </section>
  );
}
