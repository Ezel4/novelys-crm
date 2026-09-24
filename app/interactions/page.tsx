import { Plus } from 'lucide-react';
import { database } from '@/db';
import { accounts, contacts, interactions } from '@/db/schema';
import { InteractionDialog } from './interaction-form';
import { InteractionTimeline } from './interaction-timeline';

export default async function InteractionsPage() {
  const db = database();
  const [interactionRows, accountRows, contactRows] = await Promise.all([
    db.select().from(interactions),
    db.select().from(accounts),
    db.select().from(contacts),
  ]);

  const accountById = new Map(accountRows.map((a) => [a.id, a]));

  return (
    <>
      <div className="heading">
        <div>
          <div className="eyebrow">
            VOTRE ESPACE COMMERCIAL <span>/</span> FULL ACE
          </div>
          <h1>Interactions</h1>
          <p>Chaque échange enrichit votre mémoire client.</p>
        </div>
        <div className="heading-actions">
          <InteractionDialog
            accounts={accountRows.map((a) => ({ id: a.id, name: a.name }))}
            contacts={contactRows.filter((c) => c.status === 'Vérifié').map((c) => ({ id: c.id, accountId: c.accountId, name: c.name }))}
            trigger={
              <button className="primary">
                <Plus size={18} />
                Nouvelle interaction
              </button>
            }
          />
        </div>
      </div>
      <InteractionTimeline interactions={interactionRows} accountById={accountById} />
    </>
  );
}
