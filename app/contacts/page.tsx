import { database } from '@/db';
import { accounts, contacts } from '@/db/schema';
import { Plus } from 'lucide-react';
import { ContactFilters } from './contact-filters';
import { CreateContactDialog } from './contact-form';

export default async function ContactsPage() {
  const db = database();
  const [contactRows, accountRows] = await Promise.all([
    db.select().from(contacts).orderBy(contacts.name),
    db.select({ id: accounts.id, name: accounts.name }).from(accounts).orderBy(accounts.name),
  ]);

  const accountNameById = new Map(accountRows.map((a) => [a.id, a.name]));

  return (
    <>
      <div className="heading">
        <div>
          <div className="eyebrow">
            VOTRE ESPACE COMMERCIAL <span>/</span> FULL ACE
          </div>
          <h1>Contacts</h1>
          <p>Tous vos interlocuteurs, tous comptes confondus.</p>
        </div>
        <div className="heading-actions">
          <CreateContactDialog
            accounts={accountRows}
            trigger={
              <button className="primary">
                <Plus size={18} />
                Nouveau contact
              </button>
            }
          />
        </div>
      </div>
      <ContactFilters contacts={contactRows} accountNameById={accountNameById} />
    </>
  );
}
