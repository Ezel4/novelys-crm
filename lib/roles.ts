import type { Account } from './schemas/account';
import type { Contact } from './schemas/contact';
import type { Deal } from './schemas/deal';
import type { Quote } from './schemas/quote';
import type { Task } from './schemas/task';
import type { Lead } from './schemas/lead';
import type { User } from './schemas/user';
import type { Visit } from './schemas/visit';
import { isoDay } from './dashboard';

/* ------------------------------------------------------------------ */
/* Espace COMMERCIAL — terrain, portefeuille, tournées                  */
/* ------------------------------------------------------------------ */

/** Chiffre signé sur le mois en cours pour un commercial. */
export function monthlyWon(deals: Deal[], userId: string) {
  const month = isoDay().slice(0, 7);
  return deals
    .filter((d) => d.ownerId === userId && d.stage === 'Gagné' && (d.deadline ?? '').startsWith(month))
    .reduce((s, d) => s + d.amount, 0);
}

/** Pondération du pipe par la probabilité : la vision réaliste du mois à venir. */
export function weightedPipeline(deals: Deal[]) {
  return deals
    .filter((d) => !['Gagné', 'Perdu'].includes(d.stage))
    .reduce((s, d) => s + (d.amount * d.probability) / 100, 0);
}

/** Comptes sans interaction depuis `days` jours : le risque silencieux du portefeuille. */
export function dormantAccounts(accounts: Account[], lastTouch: Map<string, string>, days = 45) {
  const limit = isoDay(-days);
  return accounts
    .filter((a) => (lastTouch.get(a.id) ?? '0000-00-00') < limit)
    .map((a) => ({ ...a, lastTouch: lastTouch.get(a.id) ?? null }))
    .sort((a, b) => (a.lastTouch ?? '').localeCompare(b.lastTouch ?? ''));
}

/** Relances à passer aujourd'hui ou en retard. */
export function dueFollowUps(accounts: Account[]) {
  const today = isoDay();
  return accounts
    .filter((a) => a.due && a.due <= today)
    .sort((a, b) => (a.due ?? '').localeCompare(b.due ?? ''));
}

/* ------------------------------------------------------------------ */
/* Espace ADV — devis, commandes, conformité des données                */
/* ------------------------------------------------------------------ */

/** Devis en attente de réponse client, triés par ancienneté d'envoi. */
export function pendingQuotes(quotes: Quote[]) {
  return quotes
    .filter((q) => q.status === 'Envoyé')
    .sort((a, b) => a.issueDate.localeCompare(b.issueDate));
}

/** Devis dont la validité arrive à échéance dans les prochains jours. */
export function expiringQuotes(quotes: Quote[], withinDays = 7) {
  const today = isoDay();
  const horizon = isoDay(withinDays);
  return quotes.filter(
    (q) => q.status === 'Envoyé' && q.validUntil && q.validUntil >= today && q.validUntil <= horizon
  );
}

/** Devis dont la validité est dépassée mais encore marqués « Envoyé ». */
export function overdueQuotes(quotes: Quote[]) {
  const today = isoDay();
  return quotes.filter((q) => q.status === 'Envoyé' && q.validUntil && q.validUntil < today);
}

/**
 * Anomalies de données bloquant la production d'un devis ou d'une commande.
 * C'est le travail quotidien de l'ADV : rendre le dossier exploitable.
 */
export type DataIssue = {
  id: string;
  severity: 'Bloquant' | 'À corriger' | 'À compléter';
  entity: 'Compte' | 'Contact' | 'Affaire' | 'Devis';
  label: string;
  detail: string;
  href: string;
};

export function dataIssues(
  accounts: Account[],
  contacts: Contact[],
  deals: Deal[],
  quotes: Quote[]
): DataIssue[] {
  const issues: DataIssue[] = [];
  const contactsByAccount = new Map<string, Contact[]>();
  for (const c of contacts) {
    const list = contactsByAccount.get(c.accountId) ?? [];
    list.push(c);
    contactsByAccount.set(c.accountId, list);
  }

  for (const a of accounts) {
    const own = contactsByAccount.get(a.id) ?? [];
    if (own.length === 0) {
      issues.push({
        id: `acc-nocontact-${a.id}`,
        severity: 'Bloquant',
        entity: 'Compte',
        label: a.name,
        detail: 'Aucun contact rattaché : impossible d’adresser un devis.',
        href: `/comptes/${a.id}`,
      });
    } else if (!own.some((c) => c.status === 'Vérifié')) {
      issues.push({
        id: `acc-unverified-${a.id}`,
        severity: 'À corriger',
        entity: 'Compte',
        label: a.name,
        detail: 'Aucun contact vérifié : coordonnées à confirmer avant envoi.',
        href: `/comptes/${a.id}`,
      });
    }
    if (!a.city) {
      issues.push({
        id: `acc-nocity-${a.id}`,
        severity: 'À compléter',
        entity: 'Compte',
        label: a.name,
        detail: 'Ville absente : le compte n’apparaît pas sur la carte des tournées.',
        href: `/comptes/${a.id}`,
      });
    }
  }

  for (const c of contacts) {
    if (c.status === 'Parti') continue;
    if (!c.email) {
      issues.push({
        id: `ct-noemail-${c.id}`,
        severity: 'Bloquant',
        entity: 'Contact',
        label: c.name,
        detail: 'E-mail manquant : l’envoi du devis échouera.',
        href: '/contacts',
      });
    }
    if (!c.phone) {
      issues.push({
        id: `ct-nophone-${c.id}`,
        severity: 'À compléter',
        entity: 'Contact',
        label: c.name,
        detail: 'Téléphone manquant : pas de relance possible hors e-mail.',
        href: '/contacts',
      });
    }
  }

  for (const d of deals) {
    if (['Gagné', 'Perdu'].includes(d.stage)) continue;
    if (!d.logo) {
      issues.push({
        id: `dl-nologo-${d.id}`,
        severity: 'Bloquant',
        entity: 'Affaire',
        label: d.name,
        detail: 'Logo vectoriel manquant : le marquage ne peut pas être chiffré.',
        href: '/affaires',
      });
    }
    if (!d.deadline) {
      issues.push({
        id: `dl-nodate-${d.id}`,
        severity: 'À compléter',
        entity: 'Affaire',
        label: d.name,
        detail: 'Date de besoin absente : impossible de réserver la production.',
        href: '/affaires',
      });
    }
    if (!d.decisionMaker) {
      issues.push({
        id: `dl-nodm-${d.id}`,
        severity: 'À corriger',
        entity: 'Affaire',
        label: d.name,
        detail: 'Décideur non identifié : le devis risque de rester sans réponse.',
        href: '/affaires',
      });
    }
  }

  for (const q of quotes) {
    if (q.status === 'Envoyé' && !q.validUntil) {
      issues.push({
        id: `qt-novalid-${q.id}`,
        severity: 'À corriger',
        entity: 'Devis',
        label: q.number,
        detail: 'Date de validité absente : le devis ne peut pas être relancé au bon moment.',
        href: `/devis/${q.id}`,
      });
    }
  }

  const order = { Bloquant: 0, 'À corriger': 1, 'À compléter': 2 };
  return issues.sort((a, b) => order[a.severity] - order[b.severity]);
}

/** Charge de travail ADV par étape du cycle administratif. */
export function advWorkload(quotes: Quote[], deals: Deal[]) {
  return [
    { label: 'Devis à rédiger', count: deals.filter((d) => d.stage === 'Devis à préparer').length, href: '/devis' },
    { label: 'Brouillons à finaliser', count: quotes.filter((q) => q.status === 'Brouillon').length, href: '/devis' },
    { label: 'En attente client', count: quotes.filter((q) => q.status === 'Envoyé').length, href: '/devis' },
    { label: 'Acceptés à traiter', count: quotes.filter((q) => q.status === 'Accepté').length, href: '/devis' },
  ];
}

/* ------------------------------------------------------------------ */
/* Espace DIRIGEANT — pilotage, équipe, santé du portefeuille           */
/* ------------------------------------------------------------------ */

export type TeamPerformance = {
  user: User;
  won: number;
  pipeline: number;
  weighted: number;
  dealCount: number;
  winRate: number;
  attainment: number;
  accounts: number;
  visitsPlanned: number;
  overdueTasks: number;
};

export function teamPerformance(
  users: User[],
  deals: Deal[],
  accounts: Account[],
  tasks: Task[],
  visits: Visit[]
): TeamPerformance[] {
  const today = isoDay();
  return users
    .filter((u) => u.active)
    .map((u) => {
      const own = deals.filter((d) => d.ownerId === u.id);
      const won = own.filter((d) => d.stage === 'Gagné');
      const lost = own.filter((d) => d.stage === 'Perdu');
      const open = own.filter((d) => !['Gagné', 'Perdu'].includes(d.stage));
      const closed = won.length + lost.length;
      const wonAmount = won.reduce((s, d) => s + d.amount, 0);
      return {
        user: u,
        won: wonAmount,
        pipeline: open.reduce((s, d) => s + d.amount, 0),
        weighted: weightedPipeline(open),
        dealCount: own.length,
        winRate: closed ? Math.round((won.length / closed) * 100) : 0,
        attainment: u.monthlyTarget ? Math.round((wonAmount / u.monthlyTarget) * 100) : 0,
        accounts: accounts.filter((a) => a.ownerId === u.id).length,
        visitsPlanned: visits.filter((v) => v.userId === u.id && v.status !== 'Annulée' && v.date >= today).length,
        overdueTasks: tasks.filter(
          (t) => t.ownerId === u.id && t.status === 'À faire' && !!t.dueDate && t.dueDate < today
        ).length,
      };
    })
    .sort((a, b) => b.won - a.won);
}

/** Concentration du chiffre : part des 3 premiers comptes. Un indicateur de risque pour un dirigeant. */
export function revenueConcentration(accounts: Account[]) {
  const sorted = [...accounts].sort((a, b) => b.revenue - a.revenue);
  const total = sorted.reduce((s, a) => s + a.revenue, 0);
  const top3 = sorted.slice(0, 3).reduce((s, a) => s + a.revenue, 0);
  return {
    total,
    top3,
    share: total ? Math.round((top3 / total) * 100) : 0,
    leaders: sorted.slice(0, 3),
  };
}

/** Répartition des comptes par niveau de santé. */
export function healthBreakdown(accounts: Account[]) {
  const levels = ['Bonne', 'À surveiller', 'À risque'] as const;
  return levels.map((level) => ({
    level,
    count: accounts.filter((a) => a.health === level).length,
    revenue: accounts.filter((a) => a.health === level).reduce((s, a) => s + a.revenue, 0),
  }));
}

/** Motifs de perte agrégés : ce que le dirigeant doit corriger en priorité. */
export function lossAnalysis(deals: Deal[]) {
  const lost = deals.filter((d) => d.stage === 'Perdu');
  const byReason = new Map<string, { count: number; amount: number }>();
  for (const d of lost) {
    const reason = d.lossReason || 'Non renseigné';
    const entry = byReason.get(reason) ?? { count: 0, amount: 0 };
    entry.count += 1;
    entry.amount += d.amount;
    byReason.set(reason, entry);
  }
  return [...byReason.entries()]
    .map(([reason, v]) => ({ reason, ...v }))
    .sort((a, b) => b.amount - a.amount);
}

/** Alertes de direction : ce qui exige un arbitrage cette semaine. */
export type Alert = {
  id: string;
  level: 'critique' | 'attention' | 'info';
  title: string;
  detail: string;
  href: string;
};

export function executiveAlerts(
  accounts: Account[],
  deals: Deal[],
  quotes: Quote[],
  team: TeamPerformance[],
  leads: Lead[]
): Alert[] {
  const alerts: Alert[] = [];
  const concentration = revenueConcentration(accounts);

  if (concentration.share >= 60) {
    alerts.push({
      id: 'concentration',
      level: 'critique',
      title: `${concentration.share} % du chiffre sur 3 comptes`,
      detail: 'La dépendance client est élevée : prévoir un plan de diversification.',
      href: '/comptes',
    });
  }

  const atRisk = accounts.filter((a) => a.health === 'À risque');
  if (atRisk.length > 0) {
    alerts.push({
      id: 'health',
      level: 'critique',
      title: `${atRisk.length} compte${atRisk.length > 1 ? 's' : ''} à risque`,
      detail: `${atRisk.slice(0, 3).map((a) => a.name).join(', ')} — chiffre exposé à court terme.`,
      href: '/comptes',
    });
  }

  const stale = overdueQuotes(quotes);
  if (stale.length > 0) {
    alerts.push({
      id: 'quotes',
      level: 'attention',
      title: `${stale.length} devis expiré${stale.length > 1 ? 's' : ''} sans réponse`,
      detail: 'Ces montants sortent du pipe s’ils ne sont pas relancés.',
      href: '/devis',
    });
  }

  const behind = team.filter((t) => t.user.role === 'Commercial' && t.user.monthlyTarget > 0 && t.attainment < 60);
  if (behind.length > 0) {
    alerts.push({
      id: 'targets',
      level: 'attention',
      title: `${behind.length} commercial${behind.length > 1 ? 'aux' : ''} sous 60 % d’objectif`,
      detail: behind.map((t) => `${t.user.name} (${t.attainment} %)`).join(', '),
      href: '/dirigeant',
    });
  }

  const untouched = leads.filter((l) => l.status === 'Nouveau');
  if (untouched.length >= 3) {
    alerts.push({
      id: 'leads',
      level: 'info',
      title: `${untouched.length} leads jamais contactés`,
      detail: 'Le haut de funnel n’est pas traité : opportunité de chiffre perdue.',
      href: '/leads',
    });
  }

  return alerts;
}
