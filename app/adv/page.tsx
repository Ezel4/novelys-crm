import Link from 'next/link';
import { database } from '@/db';
import { accounts, contacts, deals, tasks, users, quotes, quoteItems } from '@/db/schema';
import { seedDemoData } from '@/lib/seed';
import { isoDay, money, dayLabel } from '@/lib/dashboard';
import { quoteTotals } from '@/lib/schemas/quote';
import { pendingQuotes, expiringQuotes, overdueQuotes, dataIssues, advWorkload } from '@/lib/roles';
import {
  FileText, AlertTriangle, ClipboardCheck, PackageCheck, Timer, ShieldCheck, CircleDollarSign, Inbox,
} from 'lucide-react';
import { RoleHeader } from '@/components/role-header';

export default async function AdvPage() {
  const db = database();
  await seedDemoData(db);

  const [userRows, accountRows, contactRows, dealRows, taskRows, quoteRows, itemRows] = await Promise.all([
    db.select().from(users),
    db.select().from(accounts),
    db.select().from(contacts),
    db.select().from(deals),
    db.select().from(tasks),
    db.select().from(quotes),
    db.select().from(quoteItems),
  ]);

  const me = userRows.find((u) => u.role === 'ADV') ?? null;
  const today = isoDay();
  const accountById = new Map(accountRows.map((a) => [a.id, a]));

  const itemsByQuote = new Map<string, typeof itemRows>();
  for (const it of itemRows) {
    const list = itemsByQuote.get(it.quoteId) ?? [];
    list.push(it);
    itemsByQuote.set(it.quoteId, list);
  }
  const quoteAmount = (id: string, vatRate: number) =>
    quoteTotals(itemsByQuote.get(id) ?? [], vatRate).total;

  const workload = advWorkload(quoteRows, dealRows);
  const pending = pendingQuotes(quoteRows);
  const expiring = expiringQuotes(quoteRows, 7);
  const overdue = overdueQuotes(quoteRows);
  const issues = dataIssues(accountRows, contactRows, dealRows, quoteRows);
  const blocking = issues.filter((i) => i.severity === 'Bloquant');

  const myTasks = taskRows
    .filter((t) => t.ownerId === me?.id && t.status === 'À faire')
    .sort((a, b) => (a.dueDate ?? '9999').localeCompare(b.dueDate ?? '9999'));

  // Commandes à lancer : affaires gagnées dont la production n'est pas encore engagée.
  const toProduce = dealRows.filter((d) => d.stage === 'Gagné');
  const acceptedQuotes = quoteRows.filter((q) => q.status === 'Accepté');
  const draftQuotes = quoteRows.filter((q) => q.status === 'Brouillon');
  const toWrite = dealRows.filter((d) => d.stage === 'Devis à préparer');

  const pendingValue = pending.reduce((s, q) => s + quoteAmount(q.id, q.vatRate), 0);
  const acceptedValue = acceptedQuotes.reduce((s, q) => s + quoteAmount(q.id, q.vatRate), 0);

  return (
    <>
      <RoleHeader role="ADV" user={me} />

      <div className="role-metrics">
        <Metric icon={<Inbox size={16} />} label="Devis à rédiger" value={String(toWrite.length)} sub="Affaires en attente" tone={toWrite.length > 0 ? 'warn' : 'ok'} />
        <Metric icon={<FileText size={16} />} label="Brouillons" value={String(draftQuotes.length)} sub="À finaliser" />
        <Metric icon={<Timer size={16} />} label="En attente client" value={money(pendingValue)} sub={`${pending.length} devis envoyés`} />
        <Metric icon={<CircleDollarSign size={16} />} label="Acceptés à traiter" value={money(acceptedValue)} sub={`${acceptedQuotes.length} à transformer`} tone={acceptedQuotes.length > 0 ? 'good' : 'ok'} />
        <Metric icon={<AlertTriangle size={16} />} label="Dossiers bloqués" value={String(blocking.length)} sub="Données manquantes" tone={blocking.length > 0 ? 'bad' : 'ok'} />
      </div>

      <section className="panel">
        <div className="panel-title">
          <h2><ClipboardCheck size={16} /> Le cycle administratif</h2>
          <Link href="/devis">Tous les devis</Link>
        </div>
        <div className="adv-pipeline">
          {workload.map((step, i) => (
            <Link key={step.label} href={step.href} className="adv-step">
              <span className="adv-step-index">{i + 1}</span>
              <strong>{step.count}</strong>
              <small>{step.label}</small>
            </Link>
          ))}
        </div>
      </section>

      <div className="role-grid">
        <section className="panel panel-wide">
          <div className="panel-title">
            <h2><ShieldCheck size={16} /> Contrôle qualité des données</h2>
            <small className="panel-hint">
              {issues.length} anomalie{issues.length > 1 ? 's' : ''} détectée{issues.length > 1 ? 's' : ''}
            </small>
          </div>
          {issues.length === 0 ? (
            <p className="role-empty">Toutes les fiches sont exploitables. Aucun dossier bloqué.</p>
          ) : (
            <table className="adv-table">
              <thead>
                <tr>
                  <th>Gravité</th>
                  <th>Objet</th>
                  <th>Fiche</th>
                  <th>Ce qui manque</th>
                </tr>
              </thead>
              <tbody>
                {issues.map((issue) => (
                  <tr key={issue.id}>
                    <td>
                      <span className={`role-badge sev-${issue.severity === 'Bloquant' ? 'block' : issue.severity === 'À corriger' ? 'fix' : 'fill'}`}>
                        {issue.severity}
                      </span>
                    </td>
                    <td>{issue.entity}</td>
                    <td>
                      <Link href={issue.href}>{issue.label}</Link>
                    </td>
                    <td className="adv-detail">{issue.detail}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <section className="panel">
          <div className="panel-title">
            <h2><Timer size={16} /> Devis à relancer</h2>
            <Link href="/devis">Devis</Link>
          </div>
          {overdue.length === 0 && expiring.length === 0 ? (
            <p className="role-empty">Aucun devis n’arrive à échéance cette semaine.</p>
          ) : (
            <ul className="role-list">
              {overdue.map((q) => (
                <li key={q.id} className="overdue">
                  <div>
                    <strong>
                      <Link href={`/devis/${q.id}`}>{q.number}</Link>
                    </strong>
                    <small>
                      {accountById.get(q.accountId)?.name} · validité dépassée le {dayLabel(q.validUntil)}
                    </small>
                  </div>
                  <div className="role-amount">
                    <strong>{money(quoteAmount(q.id, q.vatRate))}</strong>
                    <small>Expiré</small>
                  </div>
                </li>
              ))}
              {expiring.map((q) => (
                <li key={q.id}>
                  <div>
                    <strong>
                      <Link href={`/devis/${q.id}`}>{q.number}</Link>
                    </strong>
                    <small>
                      {accountById.get(q.accountId)?.name} · expire le {dayLabel(q.validUntil)}
                    </small>
                  </div>
                  <div className="role-amount">
                    <strong>{money(quoteAmount(q.id, q.vatRate))}</strong>
                    <small>Bientôt</small>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="panel">
          <div className="panel-title">
            <h2><PackageCheck size={16} /> Commandes à lancer</h2>
            <Link href="/affaires">Affaires</Link>
          </div>
          {toProduce.length === 0 ? (
            <p className="role-empty">Aucune commande en attente de production.</p>
          ) : (
            <ul className="role-list">
              {toProduce.map((d) => (
                <li key={d.id}>
                  <div>
                    <strong>{d.name}</strong>
                    <small>
                      {accountById.get(d.accountId)?.name} ·{' '}
                      {d.deadline ? `livraison attendue le ${dayLabel(d.deadline)}` : 'date de livraison à fixer'}
                    </small>
                  </div>
                  <div className="role-amount">
                    <strong>{money(d.amount)}</strong>
                    <small>{d.logo ? 'Logo OK' : 'Logo manquant'}</small>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="panel">
          <div className="panel-title">
            <h2><ClipboardCheck size={16} /> Vos tâches</h2>
            <Link href="/taches">Toutes les tâches</Link>
          </div>
          {myTasks.length === 0 ? (
            <p className="role-empty">Aucune tâche assignée.</p>
          ) : (
            <ul className="role-list">
              {myTasks.map((t) => (
                <li key={t.id} className={t.dueDate && t.dueDate < today ? 'overdue' : ''}>
                  <div>
                    <strong>{t.title}</strong>
                    <small>
                      {t.accountId ? accountById.get(t.accountId)?.name : 'Sans compte'} · {dayLabel(t.dueDate)}
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
            <h2><FileText size={16} /> Conditions commerciales</h2>
            <Link href="/parametres">Paramètres</Link>
          </div>
          <ul className="role-list compact">
            {accountRows.map((a) => (
              <li key={a.id}>
                <div>
                  <strong>
                    <Link href={`/comptes/${a.id}`}>{a.name}</Link>
                  </strong>
                  <small>
                    Paiement {a.paymentTerms} · {a.orders} commandes · {money(a.revenue)} de CA cumulé
                  </small>
                </div>
                <span className={`role-badge health-${a.health === 'À risque' ? 'risk' : a.health === 'À surveiller' ? 'watch' : 'ok'}`}>
                  {a.health}
                </span>
              </li>
            ))}
          </ul>
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
  tone = 'ok',
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  tone?: 'ok' | 'good' | 'warn' | 'bad';
}) {
  return (
    <div className={`role-metric tone-${tone}`}>
      <span className="role-metric-icon">{icon}</span>
      <div className="role-metric-body">
        <small>{label}</small>
        <strong>{value}</strong>
        {sub && <span className="role-metric-sub">{sub}</span>}
      </div>
    </div>
  );
}
