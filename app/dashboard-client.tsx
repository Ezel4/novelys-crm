'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowUpRight,
  ArrowRight,
  Plus,
  Target,
  Users,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Check,
  Clock,
  FileText,
  CheckCheck,
  ListTodo,
} from 'lucide-react';
import { toast } from 'sonner';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { money, dayLabel, isoDay } from '@/lib/dashboard';
import { stages } from '@/lib/schemas/deal';
import { InteractionDialog } from '@/app/interactions/interaction-form';
import { updateTaskStatus } from '@/app/taches/actions';

function Pick({
  value,
  onChange,
  options,
  label,
}: {
  value: string;
  onChange: (s: string) => void;
  options: { value: string; label: string }[];
  label: string;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger aria-label={label} className="pick">
        <SelectValue placeholder={label} />
      </SelectTrigger>
      <SelectContent>
        {options.map((x) => (
          <SelectItem key={x.value} value={x.value}>
            {x.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function Circle({
  children,
  onClick,
  label,
  className = '',
}: {
  children: React.ReactNode;
  onClick?: () => void;
  label: string;
  className?: string;
}) {
  return (
    <button type="button" className={'circle ' + className} onClick={onClick} aria-label={label} title={label}>
      {children}
    </button>
  );
}

export type PriorityAccount = {
  id: string;
  name: string;
  city: string;
  sector: string;
  initials: string;
  color: string;
  summary: string;
  next: string;
  due: string | null;
  dealAmount: number;
  reasons: string[];
  verifiedContactName: string | null;
  verifiedContactRole: string | null;
};

export type DealsByStage = { stage: (typeof stages)[number]; count: number; amount: number }[];

export type TodayTask = {
  id: string;
  title: string;
  dueDate: string | null;
  accountId: string | null;
  accountName: string | null;
  revision: number;
};

function TodayTaskRow({ task }: { task: TodayTask }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  return (
    <div className="today-task">
      <button
        type="button"
        className="task-check"
        aria-label={'Marquer fait : ' + task.title}
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const result = await updateTaskStatus(task.id, task.revision, 'Fait');
            if ('error' in result) toast.error(result.error);
            else toast.success('Tâche marquée comme faite.');
          })
        }
      >
        <Check size={14} />
      </button>
      <div>
        <strong>{task.title}</strong>
        <span>
          {task.dueDate && task.dueDate < isoDay() ? 'En retard' : "Aujourd’hui"}
          {task.accountName && (
            <>
              {' · '}
              <button type="button" className="text-button" onClick={() => router.push(`/comptes/${task.accountId}`)}>
                {task.accountName}
              </button>
            </>
          )}
        </span>
      </div>
    </div>
  );
}

export function DashboardClient({
  accounts,
  accountsById,
  dealsByStage,
  totalOpenAmount,
  wonAmount,
  dueCount,
  accountOptions,
  contactOptions,
  todayTasks,
}: {
  accounts: PriorityAccount[];
  accountsById: Map<string, PriorityAccount>;
  dealsByStage: DealsByStage;
  totalOpenAmount: number;
  wonAmount: number;
  dueCount: number;
  accountOptions: { id: string; name: string }[];
  contactOptions: { id: string; accountId: string; name: string }[];
  todayTasks: TodayTask[];
}) {
  const router = useRouter();
  const [filter, setFilter] = useState('Toutes');
  const [focusId, setFocusId] = useState(accounts[0]?.id ?? '');
  const [calendarOffset, setCalendarOffset] = useState(0);
  const [calendarDay, setCalendarDay] = useState<string | null>(null);

  const filtered = accounts.filter((a) => {
    if (filter === 'Toutes') return true;
    if (filter === 'À relancer') return !!a.due && a.due <= isoDay();
    if (filter === 'À qualifier') return a.reasons.some((x) => /qualifier|inconnu/.test(x));
    if (filter === 'Contacts à vérifier') return !a.verifiedContactName;
    return true;
  });

  const focus = accountsById.get(focusId) ?? accounts[0];

  const month = new Date();
  month.setDate(1);
  month.setMonth(month.getMonth() + calendarOffset);
  const monthStart = (month.getDay() + 6) % 7;
  const monthDays = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const calendarDates = Array.from({ length: monthStart + monthDays }, (_, i) =>
    i < monthStart
      ? null
      : `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}-${String(i - monthStart + 1).padStart(2, '0')}`
  );
  const dueAccounts = accounts.filter((a) => a.due);

  return (
    <>
      <div className="heading">
        <div>
          <div className="eyebrow">
            VOTRE ESPACE COMMERCIAL <span>/</span> FULL ACE
          </div>
          <h1>Mes priorités</h1>
          <p>Les bons contacts. Le bon contexte. La prochaine action.</p>
        </div>
        <div className="heading-actions">
          <span className="today">{new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
          <InteractionDialog
            accounts={accountOptions}
            contacts={contactOptions}
            defaultAccountId={focus?.id}
            defaultNext={focus?.next}
            defaultDue={focus?.due}
            trigger={
              <button className="primary" disabled={!accounts.length}>
                <Plus size={18} />
                Nouvelle interaction
              </button>
            }
          />
        </div>
      </div>

      <div className="metrics">
        <div className="metric">
          <span className="metric-icon">
            <Target />
          </span>
          <div>
            <strong>
              {dueCount.toString().padStart(2, '0')}
              <span className="metric-pill">à traiter</span>
            </strong>
            <p>Actions à échéance</p>
          </div>
        </div>
        <div className="metric">
          <span className="metric-icon">
            <Users />
          </span>
          <div>
            <strong>
              {accounts.length.toString().padStart(2, '0')}
              <span className="metric-note">comptes suivis</span>
            </strong>
            <p>Votre portefeuille client</p>
          </div>
        </div>
        <div className="metric">
          <span className="metric-icon">
            <ArrowUpRight />
          </span>
          <div>
            <strong>
              {money(totalOpenAmount)}
              <span className="metric-note">
                {dealsByStage.filter((d) => d.stage !== 'Gagné' && d.stage !== 'Perdu').reduce((s, d) => s + d.count, 0)} opportunités
              </span>
            </strong>
            <p>Montant des projets en cours</p>
          </div>
        </div>
        <div className="demo-label">
          <span className="demo-dot" />
          Données de démonstration
          <small>Scénarios fictifs · MVP</small>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="main-column">
          <section className="panel priorities-panel">
            <div className="panel-title">
              <div>
                <h2>
                  À vous de jouer <span className="count">{filtered.length}</span>
                </h2>
                <p>Chaque priorité a une raison.</p>
              </div>
              <Pick
                value={filter}
                onChange={setFilter}
                label="Filtrer les priorités"
                options={['Toutes', 'À relancer', 'À qualifier', 'Contacts à vérifier'].map((v) => ({
                  value: v,
                  label: v === 'Toutes' ? 'Toutes les priorités' : v,
                }))}
              />
            </div>
            <div className="priority-grid">
              {filtered.map((a) => (
                <button
                  key={a.id}
                  className={'priority-card ' + a.color + (focusId === a.id ? ' selected' : '')}
                  onClick={() => setFocusId(a.id)}
                  aria-pressed={focusId === a.id}
                >
                  <div className="card-top">
                    <span className="company-mark">{a.initials}</span>
                    <ArrowUpRight size={19} />
                  </div>
                  <span className="priority-reason">{a.reasons[0] || 'Suivi de la relation'}</span>
                  <h3>{a.name}</h3>
                  <p>{a.next}</p>
                  <div className="card-bottom">
                    <span>
                      <Clock size={13} />
                      {a.due && a.due < isoDay() ? 'En retard' : a.due === isoDay() ? "Aujourd’hui" : dayLabel(a.due)}
                    </span>
                    <span>{money(a.dealAmount)}</span>
                  </div>
                </button>
              ))}
            </div>
            {!filtered.length && <div className="empty">Aucune priorité dans cette catégorie.</div>}
          </section>

          <div className="lower-grid">
            <section className="panel calendar-panel">
              <div className="panel-title">
                <h2>Votre agenda</h2>
                <CalendarDays size={18} />
              </div>
              <div className="month-nav">
                <Circle
                  label="Mois précédent"
                  onClick={() => {
                    setCalendarOffset((x) => x - 1);
                    setCalendarDay(null);
                  }}
                >
                  <ChevronLeft />
                </Circle>
                <strong>{month.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}</strong>
                <Circle
                  label="Mois suivant"
                  onClick={() => {
                    setCalendarOffset((x) => x + 1);
                    setCalendarDay(null);
                  }}
                >
                  <ChevronRight />
                </Circle>
              </div>
              <div className="calendar-grid">
                {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d, i) => (
                  <span className="weekday" key={i}>
                    {d}
                  </span>
                ))}
                {calendarDates.map((d, i) =>
                  d ? (
                    <button
                      key={d}
                      aria-label={dayLabel(d)}
                      onClick={() => setCalendarDay(d)}
                      className={
                        (d === isoDay() ? 'current-day ' : '') +
                        (d === calendarDay ? 'picked ' : '') +
                        (dueAccounts.some((a) => a.due === d) ? 'has-event' : '')
                      }
                    >
                      {Number(d.slice(-2))}
                      {dueAccounts.some((a) => a.due === d) && <i />}
                    </button>
                  ) : (
                    <span key={'empty' + i} />
                  )
                )}
              </div>
              <div className="calendar-caption">
                {calendarDay ? (
                  dueAccounts
                    .filter((a) => a.due === calendarDay)
                    .map((a) => (
                      <button key={a.id} onClick={() => router.push(`/comptes/${a.id}`)}>
                        {a.name}
                        <ArrowUpRight size={14} />
                      </button>
                    ))
                ) : (
                  <>
                    <span className="legend-dot" />
                    Prochaines actions planifiées
                  </>
                )}
                {calendarDay && !dueAccounts.some((a) => a.due === calendarDay) && 'Aucune action prévue ce jour.'}
              </div>
            </section>

            <section className="panel pipeline-panel">
              <div className="panel-title">
                <h2>Vos opportunités</h2>
                <Circle label="Voir toutes les opportunités" onClick={() => router.push('/affaires')}>
                  <ArrowUpRight />
                </Circle>
              </div>
              <div className="pipeline-total">
                {money(totalOpenAmount)}
                <p>dans votre pipeline</p>
              </div>
              <div className="funnel">
                {dealsByStage.slice(0, 3).map((d, i) => (
                  <button key={d.stage} style={{ width: `${100 - i * 12}%` }} onClick={() => router.push('/affaires')}>
                    <span>
                      {d.stage}
                      <small>
                        {d.count} projet{d.count > 1 ? 's' : ''}
                      </small>
                    </span>
                    <strong>{money(d.amount)}</strong>
                  </button>
                ))}
              </div>
              <div className="won">
                <CheckCheck size={16} />
                {money(wonAmount)} de projets gagnés
              </div>
            </section>

            <section className="panel tasks-panel">
              <div className="panel-title">
                <h2>Tâches du jour</h2>
                <Circle label="Voir toutes les tâches" onClick={() => router.push('/taches')}>
                  <ListTodo size={17} />
                </Circle>
              </div>
              <div className="today-task-list">
                {todayTasks.map((t) => (
                  <TodayTaskRow key={t.id} task={t} />
                ))}
              </div>
              {!todayTasks.length && <div className="empty">Aucune tâche en attente aujourd’hui.</div>}
            </section>
          </div>
        </div>

        <aside className="right-column">
          {focus && (
            <>
              <section className="focus-card">
                <div className="focus-top">
                  <span>CLIENT À LA UNE</span>
                  <Circle label={'Ouvrir ' + focus.name} onClick={() => router.push(`/comptes/${focus.id}`)}>
                    <ArrowUpRight />
                  </Circle>
                </div>
                <div className="focus-monogram">{focus.initials}</div>
                <h2>{focus.name}</h2>
                <p>
                  {focus.sector} <span>·</span> {focus.city}
                </p>
                <div className="focus-contact">
                  <span className="avatar">
                    {focus.verifiedContactName
                      ? focus.verifiedContactName
                          .split(' ')
                          .map((x) => x[0])
                          .join('')
                      : '?'}
                  </span>
                  <div>
                    <strong>{focus.verifiedContactName || 'Contact à confirmer'}</strong>
                    <span>{focus.verifiedContactRole || 'Aucun contact vérifié'}</span>
                  </div>
                  {focus.verifiedContactName && <Check size={16} />}
                </div>
                <button className="focus-open" onClick={() => router.push(`/comptes/${focus.id}`)}>
                  Ouvrir la fiche 360°
                  <ArrowRight size={17} />
                </button>
              </section>
              <section className="panel context-panel">
                <div className="panel-title">
                  <h2>Le contexte, en bref</h2>
                  <span className="context-icon">
                    <FileText size={16} />
                  </span>
                </div>
                <p className="context-summary">{focus.summary}</p>
                <div className="next-action">
                  <span className="eyebrow">PROCHAINE ACTION</span>
                  <p>{focus.next}</p>
                  <span className="action-date">
                    <CalendarDays size={14} />
                    {dayLabel(focus.due)}
                  </span>
                  <InteractionDialog
                    accounts={[{ id: focus.id, name: focus.name }]}
                    contacts={contactOptions.filter((c) => c.accountId === focus.id)}
                    defaultAccountId={focus.id}
                    defaultNext={focus.next}
                    defaultDue={focus.due}
                    trigger={
                      <button>
                        Enregistrer un échange
                        <Plus size={16} />
                      </button>
                    }
                  />
                </div>
              </section>
            </>
          )}
        </aside>
      </div>
    </>
  );
}
