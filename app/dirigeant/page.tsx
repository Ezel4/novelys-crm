import Link from 'next/link';
import { database } from '@/db';
import { accounts, deals, tasks, users, quotes, leads, visits, campaigns } from '@/db/schema';
import { seedDemoData } from '@/lib/seed';
import { isoDay, money, dayLabel } from '@/lib/dashboard';
import { revenueByMonth } from '@/lib/reports';
import {
  teamPerformance, revenueConcentration, healthBreakdown, lossAnalysis, executiveAlerts, weightedPipeline,
} from '@/lib/roles';
import {
  TrendingUp, Users2, AlertOctagon, PieChart, Trophy, TrendingDown, Building2, Wallet, Gauge,
} from 'lucide-react';
import { RoleHeader } from '@/components/role-header';
import { ExecutiveCharts } from './executive-charts';

export default async function DirigeantPage() {
  const db = database();
  await seedDemoData(db);

  const [userRows, accountRows, dealRows, taskRows, quoteRows, leadRows, visitRows, campaignRows] =
    await Promise.all([
      db.select().from(users),
      db.select().from(accounts),

      db.select().from(deals),
      db.select().from(tasks),
      db.select().from(quotes),
      db.select().from(leads),
      db.select().from(visits),
      db.select().from(campaigns),
    ]);

  const me = userRows.find((u) => u.role === 'Dirigeant') ?? null;
  const today = isoDay();

  const team = teamPerformance(userRows, dealRows, accountRows, taskRows, visitRows);
  const concentration = revenueConcentration(accountRows);
  const health = healthBreakdown(accountRows);
  const losses = lossAnalysis(dealRows);
  const alerts = executiveAlerts(accountRows, dealRows, quoteRows, team, leadRows);
  const revenue = revenueByMonth(dealRows, 6);

  const openDeals = dealRows.filter((d) => !['Gagné', 'Perdu'].includes(d.stage));
  const wonDeals = dealRows.filter((d) => d.stage === 'Gagné');
  const lostDeals = dealRows.filter((d) => d.stage === 'Perdu');
  const closed = wonDeals.length + lostDeals.length;
  const winRate = closed ? Math.round((wonDeals.length / closed) * 100) : 0;
  const totalPipe = openDeals.reduce((s, d) => s + d.amount, 0);
  const weighted = weightedPipeline(openDeals);
  const avgDeal = wonDeals.length ? wonDeals.reduce((s, d) => s + d.amount, 0) / wonDeals.length : 0;
  const totalTarget = userRows.filter((u) => u.active).reduce((s, u) => s + u.monthlyTarget, 0);
  const monthWon = wonDeals
    .filter((d) => (d.deadline ?? '').startsWith(today.slice(0, 7)))
    .reduce((s, d) => s + d.amount, 0);

  const campaignBudget = campaignRows.reduce((s, c) => s + c.budget, 0);
  const convertedLeads = leadRows.filter((l) => l.status === 'Converti').length;

  const topAccounts = [...accountRows].sort((a, b) => b.revenue - a.revenue).slice(0, 6);

  return (
    <>
      <RoleHeader role="Dirigeant" user={me} />

      <div className="role-metrics">
        <Metric icon={<TrendingUp size={16} />} label="Signé ce mois" value={money(monthWon)} sub={totalTarget ? `Objectif équipe ${money(totalTarget)}` : undefined} progress={totalTarget ? Math.round((monthWon / totalTarget) * 100) : undefined} />
        <Metric icon={<Wallet size={16} />} label="Pipe total" value={money(totalPipe)} sub={`${openDeals.length} affaires ouvertes`} />
        <Metric icon={<Gauge size={16} />} label="Pipe pondéré" value={money(weighted)} sub="Prévision réaliste" />
        <Metric icon={<Trophy size={16} />} label="Taux de succès" value={`${winRate} %`} sub={`${wonDeals.length} gagnées / ${lostDeals.length} perdues`} />
        <Metric icon={<Building2 size={16} />} label="Panier moyen" value={money(avgDeal)} sub="Sur les affaires signées" />
      </div>

      {alerts.length > 0 && (
        <section className="panel alerts-panel">
          <div className="panel-title">
            <h2><AlertOctagon size={16} /> Ce qui demande un arbitrage</h2>
          </div>
          <ul className="alert-list">
            {alerts.map((a) => (
              <li key={a.id} className={`alert-${a.level}`}>
                <span className="alert-level">{a.level}</span>
                <div>
                  <strong>{a.title}</strong>
                  <small>{a.detail}</small>
                </div>
                <Link href={a.href}>Voir</Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <ExecutiveCharts
        revenue={revenue}
        health={health}
        losses={losses}
        stages={['À qualifier', 'Devis à préparer', 'Devis envoyé'].map((stage) => ({
          stage,
          amount: openDeals.filter((d) => d.stage === stage).reduce((s, d) => s + d.amount, 0),
          count: openDeals.filter((d) => d.stage === stage).length,
        }))}
      />

      <section className="panel panel-wide">
        <div className="panel-title">
          <h2><Users2 size={16} /> Performance de l’équipe</h2>
          <small className="panel-hint">Mois en cours</small>
        </div>
        <table className="adv-table team-table">
          <thead>
            <tr>
              <th>Collaborateur</th>
              <th>Poste</th>
              <th>Signé</th>
              <th>Objectif</th>
              <th>Pipe</th>
              <th>Taux</th>
              <th>Comptes</th>
              <th>Visites</th>
              <th>Retards</th>
            </tr>
          </thead>
          <tbody>
            {team.map((t) => (
              <tr key={t.user.id}>
                <td>
                  <div className="team-person">
                    <span className={`avatar ${t.user.color}`}>{t.user.initials}</span>
                    <div>
                      <strong>{t.user.name}</strong>
                      <small>{t.user.baseCity}</small>
                    </div>
                  </div>
                </td>
                <td>{t.user.role}</td>
                <td>{money(t.won)}</td>
                <td>
                  {t.user.monthlyTarget > 0 ? (
                    <div className="attainment">
                      <div className="role-progress">
                        <span
                          className={t.attainment >= 100 ? 'good' : t.attainment < 60 ? 'bad' : ''}
                          style={{ width: `${Math.min(t.attainment, 100)}%` }}
                        />
                      </div>
                      <small>{t.attainment} %</small>
                    </div>
                  ) : (
                    <small className="muted">Non applicable</small>
                  )}
                </td>
                <td>{money(t.pipeline)}</td>
                <td>{t.dealCount > 0 ? `${t.winRate} %` : '—'}</td>
                <td>{t.accounts}</td>
                <td>{t.visitsPlanned}</td>
                <td>
                  {t.overdueTasks > 0 ? (
                    <span className="role-badge late">{t.overdueTasks}</span>
                  ) : (
                    <span className="muted">0</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <div className="role-grid">
        <section className="panel">
          <div className="panel-title">
            <h2><PieChart size={16} /> Concentration du chiffre</h2>
          </div>
          <p className="concentration-headline">
            <strong>{concentration.share} %</strong> du chiffre repose sur 3 comptes
          </p>
          <ul className="role-list compact">
            {concentration.leaders.map((a) => (
              <li key={a.id}>
                <div>
                  <strong>
                    <Link href={`/comptes/${a.id}`}>{a.name}</Link>
                  </strong>
                  <small>
                    {a.sector} · {a.city}
                  </small>
                </div>
                <div className="role-amount">
                  <strong>{money(a.revenue)}</strong>
                  <small>{concentration.total ? Math.round((a.revenue / concentration.total) * 100) : 0} % du CA</small>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="panel">
          <div className="panel-title">
            <h2><TrendingDown size={16} /> Pourquoi nous perdons</h2>
            <Link href="/affaires">Affaires</Link>
          </div>
          {losses.length === 0 ? (
            <p className="role-empty">Aucune affaire perdue sur la période.</p>
          ) : (
            <ul className="role-list">
              {losses.map((l) => (
                <li key={l.reason}>
                  <div>
                    <strong>{l.reason}</strong>
                    <small>
                      {l.count} affaire{l.count > 1 ? 's' : ''}
                    </small>
                  </div>
                  <div className="role-amount">
                    <strong>{money(l.amount)}</strong>
                    <small>manqué</small>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="panel">
          <div className="panel-title">
            <h2><Building2 size={16} /> Comptes par chiffre</h2>
            <Link href="/comptes">Tous les comptes</Link>
          </div>
          <ul className="role-list compact">
            {topAccounts.map((a) => (
              <li key={a.id}>
                <div>
                  <strong>
                    <Link href={`/comptes/${a.id}`}>{a.name}</Link>
                  </strong>
                  <small>
                    {a.orders} commandes · dernier achat {dayLabel(a.lastOrder)}
                  </small>
                </div>
                <div className="role-amount">
                  <strong>{money(a.revenue)}</strong>
                  <small className={`health-text health-${a.health === 'À risque' ? 'risk' : a.health === 'À surveiller' ? 'watch' : 'ok'}`}>
                    {a.health}
                  </small>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="panel">
          <div className="panel-title">
            <h2><Trophy size={16} /> Acquisition</h2>
            <Link href="/campagnes">Campagnes</Link>
          </div>
          <div className="acq-grid">
            <div className="acq-stat">
              <small>Leads en base</small>
              <strong>{leadRows.length}</strong>
            </div>
            <div className="acq-stat">
              <small>Convertis</small>
              <strong>{convertedLeads}</strong>
            </div>
            <div className="acq-stat">
              <small>Taux de conversion</small>
              <strong>{leadRows.length ? Math.round((convertedLeads / leadRows.length) * 100) : 0} %</strong>
            </div>
            <div className="acq-stat">
              <small>Budget campagnes</small>
              <strong>{money(campaignBudget)}</strong>
            </div>
            <div className="acq-stat">
              <small>Coût par lead</small>
              <strong>{leadRows.length ? money(campaignBudget / leadRows.length) : '—'}</strong>
            </div>
            <div className="acq-stat">
              <small>Campagnes actives</small>
              <strong>{campaignRows.filter((c) => c.status === 'Active').length}</strong>
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
