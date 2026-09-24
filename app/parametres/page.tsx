import { database } from '@/db';
import { settings, pickLists, users, accounts, deals, contacts, quotes } from '@/db/schema';
import { seedDemoData } from '@/lib/seed';
import { SettingsClient } from './settings-client';

export default async function ParametresPage() {
  const db = database();
  await seedDemoData(db);

  const [settingRows, pickRows, userRows, accountRows, dealRows, contactRows, quoteRows] = await Promise.all([
    db.select().from(settings),
    db.select().from(pickLists),
    db.select().from(users),
    db.select().from(accounts),
    db.select().from(deals),
    db.select().from(contacts),
    db.select().from(quotes),
  ]);

  const values: Record<string, string> = {};
  for (const s of settingRows) values[s.key] = s.value;

  const lists: Record<string, { id: string; value: string; active: boolean }[]> = {};
  for (const p of [...pickRows].sort((a, b) => a.position - b.position)) {
    (lists[p.list] ??= []).push({ id: p.id, value: p.value, active: p.active });
  }

  return (
    <>
      <div className="heading">
        <div>
          <div className="eyebrow">
            VOTRE ESPACE COMMERCIAL <span>/</span> FULL ACE
          </div>
          <h1>Paramètres</h1>
          <p>La configuration du CRM : société, règles commerciales, équipe, listes et données.</p>
        </div>
      </div>

      <SettingsClient
        values={values}
        lists={lists}
        users={userRows}
        counts={{
          accounts: accountRows.length,
          contacts: contactRows.length,
          deals: dealRows.length,
          quotes: quoteRows.length,
        }}
      />
    </>
  );
}
