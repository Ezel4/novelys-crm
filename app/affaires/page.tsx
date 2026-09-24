import { database } from '@/db';
import { accounts, deals } from '@/db/schema';
import { KanbanBoard } from './kanban-board';
import { ExportButton } from '@/components/export-button';
import { exportDealsCsv } from './actions';

export default async function AffairesPage() {
  const db = database();
  const [dealRows, accountRows] = await Promise.all([
    db.select().from(deals),
    db.select().from(accounts),
  ]);

  const accountById = new Map(accountRows.map((a) => [a.id, a]));

  const rows = dealRows.map((d) => {
    const account = accountById.get(d.accountId);
    return {
      id: d.id,
      accountId: d.accountId,
      accountName: account?.name ?? 'Compte inconnu',
      companyMark: account?.initials ?? '?',
      companyColor: account?.color ?? 'blue',
      name: d.name,
      amount: d.amount,
      stage: d.stage,
      deadline: d.deadline,
      revision: d.revision,
    };
  });

  return (
    <>
      <div className="heading">
        <div>
          <div className="eyebrow">
            VOTRE ESPACE COMMERCIAL <span>/</span> FULL ACE
          </div>
          <h1>Affaires</h1>
          <p>Des besoins identifiés aux projets concrétisés.</p>
        </div>
        <div className="heading-actions">
          <ExportButton label="Exporter" filename="affaires.csv" action={exportDealsCsv} />
        </div>
      </div>
      <KanbanBoard deals={rows} accounts={accountRows.map((a) => ({ id: a.id, name: a.name }))} />
    </>
  );
}
