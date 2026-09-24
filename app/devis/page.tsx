import { Plus } from 'lucide-react';
import { database } from '@/db';
import { accounts, contacts, deals, quotes, quoteItems } from '@/db/schema';
import { quoteTotals } from '@/lib/schemas/quote';
import { ExportButton } from '@/components/export-button';
import { QuoteTable, type QuoteRow } from './quote-table';
import { CreateQuoteDialog } from './quote-form';
import { exportQuotesCsv } from './actions';

export default async function DevisPage() {
  const db = database();
  const [quoteRows, allItems, dealRows, accountRows, contactRows] = await Promise.all([
    db.select().from(quotes),
    db.select().from(quoteItems),
    db.select().from(deals),
    db.select().from(accounts),
    db.select().from(contacts),
  ]);

  const accountById = new Map(accountRows.map((a) => [a.id, a]));
  const dealById = new Map(dealRows.map((d) => [d.id, d]));

  const itemsByQuote = new Map<string, typeof allItems>();
  for (const item of allItems) {
    const list = itemsByQuote.get(item.quoteId);
    if (list) list.push(item);
    else itemsByQuote.set(item.quoteId, [item]);
  }

  const rows: QuoteRow[] = quoteRows.map((q) => {
    const items = itemsByQuote.get(q.id) ?? [];
    const totals = quoteTotals(items, q.vatRate);
    return {
      id: q.id,
      number: q.number,
      accountId: q.accountId,
      accountName: accountById.get(q.accountId)?.name ?? 'Compte inconnu',
      dealName: dealById.get(q.dealId)?.name ?? 'Affaire inconnue',
      status: q.status,
      issueDate: q.issueDate,
      validUntil: q.validUntil,
      itemCount: items.length,
      subtotal: totals.subtotal,
      total: totals.total,
    };
  });

  return (
    <>
      <div className="heading">
        <div>
          <div className="eyebrow">
            VOTRE ESPACE COMMERCIAL <span>/</span> FULL ACE
          </div>
          <h1>Devis</h1>
          <p>Du chiffrage à la signature.</p>
        </div>
        <div className="heading-actions">
          <ExportButton label="Exporter" filename="devis.csv" action={exportQuotesCsv} />
          <CreateQuoteDialog
            deals={dealRows.map((d) => ({ id: d.id, name: d.name, accountId: d.accountId }))}
            contacts={contactRows.map((c) => ({ id: c.id, accountId: c.accountId, name: c.name }))}
            trigger={
              <button className="primary">
                <Plus size={17} />
                Nouveau devis
              </button>
            }
          />
        </div>
      </div>
      <QuoteTable quotes={rows} />
    </>
  );
}
