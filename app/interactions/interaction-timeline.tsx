'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Phone, Mail, MessageSquare, FileText, ArrowUpRight, ArrowRight, ArrowUpDown } from 'lucide-react';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { dayLabel } from '@/lib/dashboard';

const interactionTypes = ['Appel', 'E-mail', 'Rendez-vous', 'Note'] as const;

type InteractionRow = {
  id: string;
  accountId: string | null;
  date: string;
  type: (typeof interactionTypes)[number];
  contactName: string;
  result: string;
  next: string;
  due: string;
};

const icons = { Appel: Phone, 'E-mail': Mail, 'Rendez-vous': MessageSquare, Note: FileText };

export function InteractionTimeline({
  interactions,
  accountById,
}: {
  interactions: InteractionRow[];
  accountById: Map<string, { id: string; name: string }>;
}) {
  const [type, setType] = useState<'Tous' | (typeof interactionTypes)[number]>('Tous');
  const [sortDir, setSortDir] = useState<'desc' | 'asc'>('desc');

  const sorted = useMemo(() => {
    const rows = interactions.filter((i) => type === 'Tous' || i.type === type);
    const dir = sortDir === 'desc' ? -1 : 1;
    return [...rows].sort((a, b) => a.date.localeCompare(b.date) * dir);
  }, [interactions, type, sortDir]);

  return (
    <section className="panel interactions-panel">
      <div className="panel-title">
        <div>
          <h2>
            La mémoire des échanges <span className="count">{sorted.length}</span>
          </h2>
        </div>
        <div className="filters-row">
          <Select value={type} onValueChange={(v) => setType(v as typeof type)}>
            <SelectTrigger aria-label="Filtrer par type" className="pick">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Tous">Tous les types</SelectItem>
              {interactionTypes.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <button type="button" className="sort-head" onClick={() => setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'))}>
            <ArrowUpDown size={13} />
            {sortDir === 'desc' ? 'Plus récent' : 'Plus ancien'}
          </button>
        </div>
      </div>
      <div className="timeline">
        {sorted.map((i) => {
          const account = i.accountId ? accountById.get(i.accountId) : undefined;
          const Icon = icons[i.type];
          return (
            <article className="timeline-item" key={i.id}>
              <span className="timeline-icon">
                <Icon size={18} />
              </span>
              <div>
                <div className="interaction-heading">
                  {account ? (
                    <Link href={`/comptes/${account.id}`}>
                      {account.name}
                      <ArrowUpRight size={15} />
                    </Link>
                  ) : (
                    <span>Compte non lié</span>
                  )}
                  <span>
                    {new Date(i.date).toLocaleDateString('fr-FR')} · {i.type}
                  </span>
                </div>
                <p className="contact-name">{i.contactName || 'Contact non confirmé'}</p>
                <p>{i.result}</p>
                <div className="interaction-next">
                  <ArrowRight size={15} />
                  {i.next}
                  <span>{dayLabel(i.due)}</span>
                </div>
              </div>
            </article>
          );
        })}
      </div>
      {!sorted.length && <div className="empty">Aucun échange ne correspond à ces filtres.</div>}
    </section>
  );
}
