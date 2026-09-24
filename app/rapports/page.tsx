import { database } from '@/db';
import { deals, leads, campaigns } from '@/db/schema';
import { revenueByMonth, leadFunnel, campaignPerformance, dealWinLoss } from '@/lib/reports';
import { ReportsClient } from './reports-client';

export default async function RapportsPage() {
  const db = database();
  const [dealRows, leadRows, campaignRows] = await Promise.all([
    db.select().from(deals),
    db.select().from(leads),
    db.select().from(campaigns),
  ]);

  return (
    <>
      <div className="heading">
        <div>
          <div className="eyebrow">
            VOTRE ESPACE COMMERCIAL <span>/</span> FULL ACE
          </div>
          <h1>Rapports</h1>
          <p>La performance commerciale en un coup d’œil.</p>
        </div>
      </div>
      <ReportsClient
        revenue={revenueByMonth(dealRows)}
        funnel={leadFunnel(leadRows)}
        campaigns={campaignPerformance(campaignRows, leadRows)}
        winLoss={dealWinLoss(dealRows)}
      />
    </>
  );
}
