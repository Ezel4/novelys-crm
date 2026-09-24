import { database } from '@/db';
import { accounts, contacts } from '@/db/schema';
import { AccountDirectory } from './account-directory';
import { ExportButton } from '@/components/export-button';
import { exportAccountsCsv } from './actions';

export default async function ComptesPage() {
  const db = database();
  const [accountRows, contactRows] = await Promise.all([
    db.select().from(accounts).orderBy(accounts.name),
    db.select().from(contacts),
  ]);

  const rows = accountRows.map((a) => {
    const verified = contactRows.find((c) => c.accountId === a.id && c.status === 'Vérifié');
    return {
      id: a.id,
      name: a.name,
      city: a.city,
      sector: a.sector,
      initials: a.initials,
      color: a.color,
      orders: a.orders,
      revenue: a.revenue,
      next: a.next,
      due: a.due,
      contactName: verified?.name ?? null,
      contactRole: verified?.role ?? null,
      contactVerified: !!verified,
    };
  });

  return (
    <>
      <div className="heading">
        <div>
          <div className="eyebrow">
            VOTRE ESPACE COMMERCIAL <span>/</span> FULL ACE
          </div>
          <h1>Comptes</h1>
          <p>Toute la connaissance client, au même endroit.</p>
        </div>
        <div className="heading-actions">
          <ExportButton label="Exporter" filename="comptes.csv" action={exportAccountsCsv} />
          <span className="today">
            {new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
          </span>
        </div>
      </div>
      <AccountDirectory accounts={rows} />
    </>
  );
}
