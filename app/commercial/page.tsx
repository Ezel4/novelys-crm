import Link from 'next/link';
import { database } from '@/db';
import { accounts, contacts, deals, tasks, users, visits, interactions } from '@/db/schema';

import { seedDemoData } from '@/lib/seed';
import { isoDay, money, dayLabel } from '@/lib/dashboard';
import { geocode } from '@/lib/geo';
import { monthlyWon, weightedPipeline, dormantAccounts, dueFollowUps } from '@/lib/roles';
import {
  Briefcase, Target, PhoneCall, AlarmClock, TrendingUp, Users2, MapPin, Flame, Heart, CalendarClock,
} from 'lucide-react';
import { TourMap, type MapStop } from './tour-map';
import { RoleHeader } from '@/components/role-header';

export default async function CommercialPage() {
  const db = database();
  await seedDemoData(db);

  const [userRows, accountRows, contactRows, dealRows, taskRows, visitRows, interactionRows] = await Promise.all([
    db.select().from(users),
    db.select().from(accounts),
    db.select().from(contacts),
    db.select().from(deals),
    db.select().from(tasks),
    db.select().from(visits),
    db.select().from(interactions),
  ]);

  const me = userRows.find((u) => u.role === 'Commercial') ?? userRows[0];
  const myAccounts = accountRows.filter((a) => a.ownerId === me?.id);
  const myDeals = dealRows.filter((d) => d.ownerId === me?.id);
  const myTasks = taskRows.filter((t) => t.ownerId === me?.id);
  const myVisits = visitRows.filter((v) => v.userId === me?.id && v.status !== 'Annulée');
  const today = isoDay();

  const openDeals = myDeals.filter((d) => !['Gagné', 'Perdu'].includes(d.stage));
  const won = monthlyWon(dealRows, me?.id ?? '');
  const weighted = weightedPipeline(openDeals);
  const attainment = me?.monthlyTarget ? Math.round((won / me.monthlyTarget) * 100) : 0;

  const lastTouch = new Map<string, string>();
  for (const i of interactionRows) {
    if (!i.accountId) continue;
    const day = i.date.slice(0, 10);
    if (!lastTouch.has(i.accountId) || day > lastTouch.get(i.accountId)!) lastTouch.set(i.accountId, day);
  }

  const dormant = dormantAccounts(myAccounts, lastTouch, 45);
  const followUps = dueFollowUps(myAccounts);
  const accountById = new Map(accountRows.map((a) => [a.id, a]));
  const contactById = new Map(contactRows.map((c) => [c.id, c]));
  const dealByAccount = new Map<string, typeof dealRows>();
  for (const d of dealRows) {
    const list = dealByAccount.get(d.accountId) ?? [];
    list.push(d);
    dealByAccount.set(d.accountId, list);
  }

  const stops: MapStop[] = myVisits
    .filter((v) => v.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime))
    .map((v) => {
      const account = v.accountId ? accountById.get(v.accountId) ?? null : null;
      const activeDeal = account
        ? (dealByAccount.get(account.id) ?? []).find((d) => !['Gagné', 'Perdu'].includes(d.stage)) ?? null
        : null;
      return {
        id: v.id,
        label: v.label,
        city: v.city,
        lat: v.lat,
        lng: v.lng,
        date: v.date,
        startTime: v.startTime,
        durationMin: v.durationMin,
        purpose: v.purpose,
        status: v.status,
        accountId: v.accountId,
        accountName: account?.name ?? null,
        contactName: v.contactId ? contactById.get(v.contactId)?.name ?? null : null,
        dealAmount: activeDeal?.amount ?? 0,
        notes: v.notes,
      };
    });

  const baseCoords = geocode(me?.baseCity ?? 'Nantes') ?? { lat: 47.2184, lng: -1.5536, region: '' };
  const todayTasks = myTasks
    .filter((t) => t.status === 'À faire' && !!t.dueDate && t.dueDate <= today)
    .sort((a, b) => (a.priority === 'Haute' ? -1 : 1) - (b.priority === 'Haute' ? -1 : 1));

  // Les affaires les plus chaudes : montant pondéré par la probabilité, échéance proche d'abord.
  const hotDeals = [...openDeals]
    .sort((a, b) => (b.amount * b.probability) / 100 - (a.amount * a.probability) / 100)
    .slice(0, 5);

  const myContacts = contactRows.filter((c) => myAccounts.some((a) => a.id === c.accountId) && c.status !== 'Parti');
  const ambassadors = myContacts.filter((c) => c.relationship === 'Ambassadeur' || c.relationship === 'Solide');
  const toRecheck = myContacts.filter((c) => c.status === 'À revérifier');
  const birthdaysSoon = myContacts
    .filter((c) => {
      if (!c.birthday) return false;
      const md = c.birthday.slice(5);
      const from = today.slice(5);
      const to = isoDay(30).slice(5);
      return to > from ? md >= from && md <= to : md >= from || md <= to;
    })
    .slice(0, 3);

  return (
    <>
      <RoleHeader role="Commercial" user={me ?? null} />

      <div className="role-metrics">
        <Metric icon={<TrendingUp size={16} />} label="Signé ce mois" value={money(won)} sub={me?.monthlyTarget ? `Objectif ${money(me.monthlyTarget)}` : undefined} progress={attainment} />
        <Metric icon={<Briefcase size={16} />} label="Pipe ouvert" value={money(openDeals.reduce((s, d) => s + d.amount, 0))} sub={`${openDeals.length} affaire${openDeals.length > 1 ? 's' : ''}`} />
        <Metric icon={<Target size={16} />} label="Pipe pondéré" value={money(weighted)} sub="Selon probabilité" />
        <Metric icon={<Users2 size={16} />} label="Portefeuille" value={String(myAccounts.length)} sub={`${myContacts.length} contacts actifs`} />
        <Metric icon={<MapPin size={16} />} label="Visites à venir" value={String(stops.length)} sub={stops[0] ? `Prochaine ${dayLabel(stops[0].date)}` : 'Aucune planifiée'} />
      </div>

      {stops.length > 0 && <TourMap stops={stops} base={{ city: me?.baseCity ?? 'Nantes', lat: baseCoords.lat, lng: baseCoords.lng }} />}

      <div className="role-grid">
        <section className="panel">
          <div className="panel-title">
            <h2><AlarmClock size={16} /> À faire aujourd’hui</h2>
            <Link href="/taches">Toutes les tâches</Link>
          </div>
          {todayTasks.length === 0 ? (
            <p className="role-empty">Aucune tâche en retard. Le portefeuille est à jour.</p>
          ) : (
            <ul className="role-list">
              {todayTasks.map((t) => (
                <li key={t.id} className={t.dueDate && t.dueDate < today ? 'overdue' : ''}>
                  <div>
                    <strong>{t.title}</strong>
                    <small>
                      {t.accountId ? accountById.get(t.accountId)?.name : 'Sans compte'} · échéance {dayLabel(t.dueDate)}
                    </small>
                  </div>
                  <span className={`role-badge priority-${t.priority.toLowerCase()}`}>{t.priority}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="panel">
          <div className="panel-title">
            <h2><Flame size={16} /> Affaires les plus chaudes</h2>
            <Link href="/affaires">Pipeline</Link>
          </div>
          <ul className="role-list">
            {hotDeals.map((d) => (
              <li key={d.id}>
                <div>
                  <strong>{d.name}</strong>
                  <small>
                    {accountById.get(d.accountId)?.name} · {d.stage}
                    {d.deadline ? ` · besoin le ${dayLabel(d.deadline)}` : ' · date à qualifier'}
                  </small>
                </div>
                <div className="role-amount">
                  <strong>{money(d.amount)}</strong>
                  <small>{d.probability} % de chances</small>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="panel">
          <div className="panel-title">
            <h2><PhoneCall size={16} /> Relances dues</h2>
            <Link href="/comptes">Comptes</Link>
          </div>
          {followUps.length === 0 ? (
            <p className="role-empty">Aucune relance en attente.</p>
          ) : (
            <ul className="role-list">
              {followUps.map((a) => (
                <li key={a.id}>
                  <div>
                    <strong>
                      <Link href={`/comptes/${a.id}`}>{a.name}</Link>
                    </strong>
                    <small>{a.next}</small>
                  </div>
                  <span className={`role-badge ${a.due && a.due < today ? 'late' : 'due'}`}>{dayLabel(a.due)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="panel">
          <div className="panel-title">
            <h2><CalendarClock size={16} /> Comptes qui dorment</h2>
            <small className="panel-hint">Sans contact depuis 45 jours</small>
          </div>
          {dormant.length === 0 ? (
            <p className="role-empty">Tous les comptes ont été touchés récemment.</p>
          ) : (
            <ul className="role-list">
              {dormant.map((a) => (
                <li key={a.id}>
                  <div>
                    <strong>
                      <Link href={`/comptes/${a.id}`}>{a.name}</Link>
                    </strong>
                    <small>
                      {a.lastTouch ? `Dernier échange le ${dayLabel(a.lastTouch)}` : 'Jamais contacté'} · {money(a.revenue)} de CA
                    </small>
                  </div>
                  <span className={`role-badge health-${a.health === 'À risque' ? 'risk' : a.health === 'À surveiller' ? 'watch' : 'ok'}`}>
                    {a.health}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="panel panel-wide">
          <div className="panel-title">
            <h2><Heart size={16} /> Relation client</h2>
            <Link href="/contacts">Tous les contacts</Link>
          </div>
          <div className="human-grid">
            <div className="human-block">
              <h3>Vos meilleurs appuis</h3>
              {ambassadors.length === 0 ? (
                <p className="role-empty">Aucune relation solide identifiée.</p>
              ) : (
                <ul className="human-list">
                  {ambassadors.map((c) => (
                    <li key={c.id}>
                      <span className={`human-avatar rel-${c.relationship.toLowerCase()}`}>
                        {c.name.split(' ').map((p) => p[0]).slice(0, 2).join('')}
                      </span>
                      <div>
                        <strong>{c.name}</strong>
                        <small>
                          {c.role} · {accountById.get(c.accountId)?.name}
                        </small>
                        <small className="human-channel">
                          {c.relationship} · préfère {c.preferredChannel.toLowerCase()}
                          {c.bestTime ? ` · ${c.bestTime.toLowerCase()}` : ''}
                        </small>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="human-block">
              <h3>À revérifier</h3>
              {toRecheck.length === 0 ? (
                <p className="role-empty">Toutes les fiches sont à jour.</p>
              ) : (
                <ul className="human-list">
                  {toRecheck.map((c) => (
                    <li key={c.id}>
                      <span className="human-avatar rel-froide">
                        {c.name.split(' ').map((p) => p[0]).slice(0, 2).join('')}
                      </span>
                      <div>
                        <strong>{c.name}</strong>
                        <small>
                          {c.role} · {accountById.get(c.accountId)?.name}
                        </small>
                        {c.personalNote && <small className="human-note">{c.personalNote}</small>}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="human-block">
              <h3>Attentions à venir</h3>
              {birthdaysSoon.length === 0 ? (
                <p className="role-empty">Pas d’anniversaire dans les 30 prochains jours.</p>
              ) : (
                <ul className="human-list">
                  {birthdaysSoon.map((c) => (
                    <li key={c.id}>
                      <span className="human-avatar rel-solide">🎂</span>
                      <div>
                        <strong>{c.name}</strong>
                        <small>
                          Anniversaire le{' '}
                          {new Date(`2000-${c.birthday!.slice(5)}T12:00:00`).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'long',
                          })}
                        </small>
                        <small className="human-note">{accountById.get(c.accountId)?.name}</small>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </section>
      </div>
    </>
  );
}

function Metric({
  icon,
  label,
  value,
  sub,
  progress,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  progress?: number;
}) {
  return (
    <div className="role-metric">
      <span className="role-metric-icon">{icon}</span>
      <div className="role-metric-body">
        <small>{label}</small>
        <strong>{value}</strong>
        {sub && <span className="role-metric-sub">{sub}</span>}
        {typeof progress === 'number' && (
          <div className="role-progress" role="img" aria-label={`${progress} % de l’objectif`}>
            <span style={{ width: `${Math.min(progress, 100)}%` }} />
          </div>
        )}
      </div>
    </div>
  );
}
