'use client';

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Cell, Pie, PieChart } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import { money } from '@/lib/dashboard';
import type { revenueByMonth, leadFunnel, campaignPerformance, dealWinLoss } from '@/lib/reports';

const revenueConfig: ChartConfig = { amount: { label: 'Revenu gagné', color: '#00a98e' } };
const funnelConfig: ChartConfig = { count: { label: 'Leads', color: '#1947d1' } };
const campaignConfig: ChartConfig = {
  leads: { label: 'Leads générés', color: '#789cf7' },
  converted: { label: 'Convertis', color: '#00a98e' },
};
const winLossColors = ['#00a98e', '#b43e48'];

export function ReportsClient({
  revenue,
  funnel,
  campaigns,
  winLoss,
}: {
  revenue: ReturnType<typeof revenueByMonth>;
  funnel: ReturnType<typeof leadFunnel>;
  campaigns: ReturnType<typeof campaignPerformance>;
  winLoss: ReturnType<typeof dealWinLoss>;
}) {
  const totalWinLoss = winLoss.reduce((s, w) => s + w.count, 0);

  return (
    <div className="chart-grid">
      <section className="panel">
        <div className="panel-title">
          <h2>Revenu gagné par mois</h2>
        </div>
        <ChartContainer config={revenueConfig}>
          <BarChart data={revenue}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="label" tickLine={false} axisLine={false} />
            <YAxis tickLine={false} axisLine={false} tickFormatter={(v) => money(v)} width={70} />
            <ChartTooltip content={<ChartTooltipContent formatter={(v) => money(Number(v))} />} />
            <Bar dataKey="amount" fill="var(--color-amount)" radius={6} />
          </BarChart>
        </ChartContainer>
      </section>

      <section className="panel">
        <div className="panel-title">
          <h2>Conversion des leads</h2>
        </div>
        <ChartContainer config={funnelConfig}>
          <BarChart data={funnel} layout="vertical">
            <CartesianGrid horizontal={false} />
            <XAxis type="number" tickLine={false} axisLine={false} />
            <YAxis dataKey="status" type="category" tickLine={false} axisLine={false} width={90} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="count" fill="var(--color-count)" radius={6} />
          </BarChart>
        </ChartContainer>
        {!funnel.some((f) => f.count) && <div className="empty">Pas encore de leads à analyser.</div>}
      </section>

      <section className="panel">
        <div className="panel-title">
          <h2>Performance des campagnes</h2>
        </div>
        <ChartContainer config={campaignConfig}>
          <BarChart data={campaigns}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="name" tickLine={false} axisLine={false} interval={0} angle={-15} textAnchor="end" height={60} />
            <YAxis tickLine={false} axisLine={false} allowDecimals={false} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="leads" fill="var(--color-leads)" radius={6} />
            <Bar dataKey="converted" fill="var(--color-converted)" radius={6} />
          </BarChart>
        </ChartContainer>
        {!campaigns.length && <div className="empty">Aucune campagne pour le moment.</div>}
      </section>

      <section className="panel">
        <div className="panel-title">
          <h2>Affaires gagnées / perdues</h2>
        </div>
        {totalWinLoss ? (
          <ChartContainer config={{}}>
            <PieChart>
              <ChartTooltip content={<ChartTooltipContent formatter={(v) => String(v)} />} />
              <Pie data={winLoss} dataKey="count" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={2}>
                {winLoss.map((w, i) => (
                  <Cell key={w.name} fill={winLossColors[i % winLossColors.length]} />
                ))}
              </Pie>
            </PieChart>
          </ChartContainer>
        ) : (
          <div className="empty">Aucune affaire close pour le moment.</div>
        )}
        <div className="win-loss-legend">
          {winLoss.map((w, i) => (
            <span key={w.name}>
              <i style={{ background: winLossColors[i % winLossColors.length] }} />
              {w.name} · {w.count} ({money(w.amount)})
            </span>
          ))}
        </div>
      </section>
    </div>
  );
}
