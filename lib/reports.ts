import type { Deal } from './schemas/deal';
import type { Lead } from './schemas/lead';
import type { Campaign } from './schemas/campaign';
import { leadStatuses } from './schemas/lead';

export function revenueByMonth(deals: Deal[], months = 6) {
  const now = new Date();
  const buckets: { key: string; label: string; amount: number }[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    buckets.push({ key, label: d.toLocaleDateString('fr-FR', { month: 'short' }), amount: 0 });
  }
  const byKey = new Map(buckets.map((b) => [b.key, b]));
  for (const deal of deals) {
    if (deal.stage !== 'Gagné' || !deal.deadline) continue;
    const key = deal.deadline.slice(0, 7);
    const bucket = byKey.get(key);
    if (bucket) bucket.amount += deal.amount;
  }
  return buckets;
}

export function leadFunnel(leads: Lead[]) {
  const total = leads.length || 1;
  return leadStatuses
    .filter((s) => s !== 'Non qualifié')
    .map((status) => {
      const count = leads.filter((l) => l.status === status).length;
      return { status, count, rate: Math.round((count / total) * 100) };
    });
}

export function campaignPerformance(campaigns: Campaign[], leads: Lead[]) {
  return campaigns.map((c) => {
    const campaignLeads = leads.filter((l) => l.campaignId === c.id);
    const converted = campaignLeads.filter((l) => l.status === 'Converti').length;
    return {
      name: c.name,
      leads: campaignLeads.length,
      converted,
      conversionRate: campaignLeads.length ? Math.round((converted / campaignLeads.length) * 100) : 0,
    };
  });
}

export function dealWinLoss(deals: Deal[]) {
  const won = deals.filter((d) => d.stage === 'Gagné');
  const lost = deals.filter((d) => d.stage === 'Perdu');
  return [
    { name: 'Gagnées', count: won.length, amount: won.reduce((s, d) => s + d.amount, 0) },
    { name: 'Perdues', count: lost.length, amount: lost.reduce((s, d) => s + d.amount, 0) },
  ];
}
