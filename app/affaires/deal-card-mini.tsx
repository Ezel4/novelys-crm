'use client';

import { CalendarDays } from 'lucide-react';
import { money, dayLabel } from '@/lib/dashboard';

type Deal = {
  id: string;
  name: string;
  amount: number;
  stage: string;
  deadline: string | null;
};

export function DealCardMini({ deal }: { deal: Deal }) {
  return (
    <article className="deal">
      <h3>{deal.name}</h3>
      <strong className="deal-amount">{money(deal.amount)}</strong>
      <div className="deal-detail">
        <CalendarDays size={14} />
        {deal.deadline ? dayLabel(deal.deadline) : 'Calendrier à qualifier'}
      </div>
      <span className="status">{deal.stage}</span>
    </article>
  );
}
