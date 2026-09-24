'use client';

import { useMemo, useState } from 'react';
import { Pencil, ArrowUpDown } from 'lucide-react';
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from '@/components/ui/table';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { money, dayLabel } from '@/lib/dashboard';
import { campaignTypes, campaignStatuses } from '@/lib/schemas/campaign';
import { EditCampaignDialog } from './campaign-form';

type CampaignRow = {
  id: string;
  name: string;
  type: (typeof campaignTypes)[number];
  status: (typeof campaignStatuses)[number];
  startDate: string | null;
  endDate: string | null;
  budget: number;
  accountId: string | null;
  revision: number;
  leadCount: number;
};

type SortKey = 'name' | 'budget' | 'leadCount';

export function CampaignTable({ campaigns }: { campaigns: CampaignRow[] }) {
  const [type, setType] = useState<'Tous' | (typeof campaignTypes)[number]>('Tous');
  const [status, setStatus] = useState<'Tous' | (typeof campaignStatuses)[number]>('Tous');
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setSortKey(key);
      setSortDir('asc');
    }
  }

  const filtered = useMemo(() => {
    const rows = campaigns.filter((c) => (type === 'Tous' || c.type === type) && (status === 'Tous' || c.status === status));
    const dir = sortDir === 'asc' ? 1 : -1;
    return [...rows].sort((a, b) => {
      if (sortKey === 'name') return a.name.localeCompare(b.name) * dir;
      return (a[sortKey] - b[sortKey]) * dir;
    });
  }, [campaigns, type, status, sortKey, sortDir]);

  return (
    <section className="panel directory">
      <div className="panel-title">
        <div>
          <h2>
            Campagnes <span className="count">{filtered.length}</span>
          </h2>
        </div>
        <div className="filters-row">
          <Select value={type} onValueChange={(v) => setType(v as typeof type)}>
            <SelectTrigger aria-label="Filtrer par type" className="pick">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Tous">Tous les types</SelectItem>
              {campaignTypes.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
            <SelectTrigger aria-label="Filtrer par statut" className="pick">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Tous">Tous les statuts</SelectItem>
              {campaignStatuses.map((s) => (
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
            <TableHead>
              <button type="button" className="sort-head" onClick={() => toggleSort('name')}>
                Nom <ArrowUpDown size={12} />
              </button>
            </TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead>Période</TableHead>
            <TableHead>
              <button type="button" className="sort-head" onClick={() => toggleSort('budget')}>
                Budget <ArrowUpDown size={12} />
              </button>
            </TableHead>
            <TableHead>
              <button type="button" className="sort-head" onClick={() => toggleSort('leadCount')}>
                Leads générés <ArrowUpDown size={12} />
              </button>
            </TableHead>
            <TableHead><span className="sr-only">Actions</span></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.map((c) => (
            <TableRow key={c.id}>
              <TableCell>
                <strong>{c.name}</strong>
              </TableCell>
              <TableCell>{c.type}</TableCell>
              <TableCell>
                <span className={'status ' + (c.status === 'Active' ? 'verified' : c.status === 'Annulée' ? 'warning' : '')}>
                  {c.status}
                </span>
              </TableCell>
              <TableCell>
                {dayLabel(c.startDate)} → {dayLabel(c.endDate)}
              </TableCell>
              <TableCell>{money(c.budget)}</TableCell>
              <TableCell>{c.leadCount}</TableCell>
              <TableCell>
                <EditCampaignDialog
                  campaign={c}
                  trigger={
                    <button className="circle" aria-label={'Modifier ' + c.name} title={'Modifier ' + c.name}>
                      <Pencil size={16} />
                    </button>
                  }
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {!filtered.length && <div className="empty">Aucune campagne ne correspond à ces filtres.</div>}
    </section>
  );
}
