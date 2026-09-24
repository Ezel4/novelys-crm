import { database } from '@/db';
import { accounts, deals, tasks } from '@/db/schema';
import { Plus } from 'lucide-react';
import { TaskList } from './task-list';
import { CreateTaskDialog } from './task-form';

export default async function TachesPage() {
  const db = database();
  const [taskRows, accountRows, dealRows] = await Promise.all([
    db.select().from(tasks),
    db.select().from(accounts),
    db.select().from(deals),
  ]);

  const accountById = new Map(accountRows.map((a) => [a.id, a]));
  const dealById = new Map(dealRows.map((d) => [d.id, d]));

  const rows = taskRows
    .map((t) => ({
      id: t.id,
      title: t.title,
      description: t.description,
      dueDate: t.dueDate,
      status: t.status,
      accountId: t.accountId,
      accountName: t.accountId ? accountById.get(t.accountId)?.name ?? null : null,
      dealId: t.dealId,
      dealName: t.dealId ? dealById.get(t.dealId)?.name ?? null : null,
      revision: t.revision,
    }))
    .sort((a, b) => (a.dueDate ?? '9999').localeCompare(b.dueDate ?? '9999'));

  return (
    <>
      <div className="heading">
        <div>
          <div className="eyebrow">
            VOTRE ESPACE COMMERCIAL <span>/</span> FULL ACE
          </div>
          <h1>Tâches</h1>
          <p>Vos actions planifiées, liées ou non à un compte.</p>
        </div>
        <div className="heading-actions">
          <CreateTaskDialog
            accounts={accountRows.map((a) => ({ id: a.id, name: a.name }))}
            deals={dealRows.map((d) => ({ id: d.id, accountId: d.accountId, name: d.name }))}
            trigger={
              <button className="primary">
                <Plus size={18} />
                Nouvelle tâche
              </button>
            }
          />
        </div>
      </div>
      <TaskList
        tasks={rows}
        accounts={accountRows.map((a) => ({ id: a.id, name: a.name }))}
        deals={dealRows.map((d) => ({ id: d.id, accountId: d.accountId, name: d.name }))}
      />
    </>
  );
}
