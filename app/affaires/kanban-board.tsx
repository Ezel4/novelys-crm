'use client';

import { useTransition } from 'react';
import Link from 'next/link';
import { ArrowUpRight, CalendarDays, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { stages } from '@/lib/schemas/deal';
import { money, dayLabel } from '@/lib/dashboard';
import { updateDealStage } from './actions';
import { CreateDealDialog } from './deal-form';

const stageColors = ['#a6afd2', '#789cf7', '#1947d1', '#38765f', '#8c8f9b'];

type DealRow = {
  id: string;
  accountId: string;
  accountName: string;
  companyMark: string;
  companyColor: string;
  name: string;
  amount: number;
  stage: (typeof stages)[number];
  deadline: string | null;
  revision: number;
};

function StagePick({ deal }: { deal: DealRow }) {
  const [pending, startTransition] = useTransition();
  return (
    <Select
      value={deal.stage}
      onValueChange={(v) => {
        if (pending) return;
        startTransition(async () => {
          const result = await updateDealStage(deal.id, deal.revision, v, deal.accountId);
          if ('error' in result) toast.error(result.error);
          else toast.success('Statut du projet mis à jour.');
        });
      }}
    >
      <SelectTrigger aria-label={'Statut ' + deal.name} className="pick">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {stages.map((s) => (
          <SelectItem key={s} value={s}>
            {s}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function KanbanBoard({ deals, accounts }: { deals: DealRow[]; accounts: { id: string; name: string }[] }) {
  return (
    <>
      <div className="board-heading">
        <p>
          {deals.length} projets suivis <span>·</span> Montants non pondérés
        </p>
        <CreateDealDialog
          accounts={accounts}
          trigger={
            <button className="primary">
              <Plus size={18} />
              Nouvelle affaire
            </button>
          }
        />
      </div>
      <div className="kanban">
        {stages.map((s, index) => {
          const columnDeals = deals.filter((d) => d.stage === s);
          return (
            <section className="kanban-column" key={s}>
              <h2>
                <i style={{ background: stageColors[index] }} />
                {s}
                <span>{columnDeals.length}</span>
              </h2>
              <p className="column-total">{money(columnDeals.reduce((sum, d) => sum + d.amount, 0))}</p>
              {columnDeals.map((d) => (
                <article className="deal" key={d.id}>
                  <Link href={`/comptes/${d.accountId}`} className="deal-company">
                    <span className={'company-mark ' + d.companyColor}>{d.companyMark}</span>
                    <ArrowUpRight size={17} />
                  </Link>
                  <h3>{d.accountName}</h3>
                  <p>{d.name}</p>
                  <strong className="deal-amount">{money(d.amount)}</strong>
                  <div className="deal-detail">
                    <CalendarDays size={14} />
                    {d.deadline ? dayLabel(d.deadline) : 'Calendrier à qualifier'}
                  </div>
                  <StagePick deal={d} />
                </article>
              ))}
              {!columnDeals.length && <div className="board-empty">Aucun projet à cette étape</div>}
            </section>
          );
        })}
      </div>
    </>
  );
}
