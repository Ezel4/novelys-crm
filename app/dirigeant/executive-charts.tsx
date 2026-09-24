'use client';

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Cell, Pie, PieChart, Line, LineChart } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import { money } from '@/lib/dashboard';

const revenueConfig: ChartConfig = { amount: { label: 'Chiffre signé', color: '#00a98e' } };
const stageConfig: ChartConfig = { amount: { label: 'Montant', color: '#1947d1' } };
const lossConfig: ChartConfig = { amount: { label: 'Montant perdu', color: '#b43e48' } };

const healthColors: Record<string, string> = {
  Bonne: '#00a98e',
  'À surveiller': '#d98324',
  'À risque': '#b43e48',
};

export function ExecutiveCharts({
  revenue,
  health,
  losses,
  stages,
}: {
  revenue: { label: string; amount: number }[];
  health: { level: string; count: number; revenue: number }[];
  losses: { reason: string; count: number; amount: number }[];
  stages: { stage: string; amount: number; count: number }[];
}) {
  const healthData = health.filter((h) => h.count > 0);

  return (
    <div className="chart-grid exec-charts">
      <section className="panel">
        <div className="panel-title">
          <h2>Chiffre signé sur 6 mois</h2>
        </div>
        <ChartContainer config={revenueConfig}>
          <LineChart data={revenue}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="label" tickLine={false} axisLine={false} />
            <YAxis tickLine={false} axisLine={false} tickFormatter={(v) => money(v)} width={70} />
            <ChartTooltip content={<ChartTooltipContent formatter={(v) => money(Number(v))} />} />
            <Line dataKey="amount" stroke="var(--color-amount)" strokeWidth={3} dot={{ r: 4 }} />
          </LineChart>
        </ChartContainer>
      </section>

      <section className="panel">
        <div className="panel-title">
          <h2>Pipe par étape</h2>
        </div>
        <ChartContainer config={stageConfig}>
          <BarChart data={stages} layout="vertical">
            <CartesianGrid horizontal={false} />
            <XAxis type="number" tickLine={false} axisLine={false} tickFormatter={(v) => money(v)} />
            <YAxis dataKey="stage" type="category" tickLine={false} axisLine={false} width={120} />
            <ChartTooltip content={<ChartTooltipContent formatter={(v) => money(Number(v))} />} />
            <Bar dataKey="amount" fill="var(--color-amount)" radius={6} />
          </BarChart>
        </ChartContainer>
      </section>

      <section className="panel">
        <div className="panel-title">
          <h2>Santé du portefeuille</h2>
        </div>
        {healthData.length === 0 ? (
          <div className="empty">Aucun compte à analyser.</div>
        ) : (
          <>
            <ChartContainer config={{}}>
              <PieChart>
                <ChartTooltip content={<ChartTooltipContent nameKey="level" />} />
                <Pie data={healthData} dataKey="count" nameKey="level" innerRadius={50} outerRadius={85}>
                  {healthData.map((h) => (
                    <Cell key={h.level} fill={healthColors[h.level] ?? '#789cf7'} />
                  ))}
                </Pie>
              </PieChart>
            </ChartContainer>
            <ul className="chart-legend">
              {healthData.map((h) => (
                <li key={h.level}>
                  <span className="legend-dot" style={{ background: healthColors[h.level] }} />
                  {h.level} — {h.count} compte{h.count > 1 ? 's' : ''} · {money(h.revenue)}
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      <section className="panel">
        <div className="panel-title">
          <h2>Montants perdus par motif</h2>
        </div>
        {losses.length === 0 ? (
          <div className="empty">Aucune affaire perdue à analyser.</div>
        ) : (
          <ChartContainer config={lossConfig}>
            <BarChart data={losses} layout="vertical">
              <CartesianGrid horizontal={false} />
              <XAxis type="number" tickLine={false} axisLine={false} tickFormatter={(v) => money(v)} />
              <YAxis dataKey="reason" type="category" tickLine={false} axisLine={false} width={150} />
              <ChartTooltip content={<ChartTooltipContent formatter={(v) => money(Number(v))} />} />
              <Bar dataKey="amount" fill="var(--color-amount)" radius={6} />
            </BarChart>
          </ChartContainer>
        )}
      </section>
    </div>
  );
}
