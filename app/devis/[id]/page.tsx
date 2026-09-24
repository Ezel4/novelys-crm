import { asc, eq } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Pencil } from 'lucide-react';
import { database } from '@/db';
import { accounts, contacts, deals, quotes, quoteItems } from '@/db/schema';
import { dayLabel } from '@/lib/dashboard';
import { quoteTotals, lineTotal, exactMoney } from '@/lib/schemas/quote';
import { EditQuoteDialog } from '../quote-form';
import { PrintButton } from '../print-button';

export default async function QuoteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = database();

  const [quote] = await db.select().from(quotes).where(eq(quotes.id, id)).limit(1);
  if (!quote) notFound();

  const [items, [account], [deal], accountContacts] = await Promise.all([
    db.select().from(quoteItems).where(eq(quoteItems.quoteId, id)).orderBy(asc(quoteItems.position)),
    db.select().from(accounts).where(eq(accounts.id, quote.accountId)).limit(1),
    db.select().from(deals).where(eq(deals.id, quote.dealId)).limit(1),
    db.select().from(contacts).where(eq(contacts.accountId, quote.accountId)),
  ]);

  const totals = quoteTotals(items, quote.vatRate);
  const contact = quote.contactId ? accountContacts.find((c) => c.id === quote.contactId) ?? null : null;

  const editableItems = items.map((i) => ({
    position: i.position,
    label: i.label,
    quantity: i.quantity,
    unitPrice: i.unitPrice,
    discount: i.discount,
  }));

  return (
    <>
      <div className="heading no-print">
        <div>
          <div className="eyebrow">
            <Link href="/devis">DEVIS</Link> <span>/</span> {quote.number}
          </div>
          <h1>{quote.number}</h1>
          <p>
            {account?.name ?? 'Compte inconnu'} · {deal?.name ?? 'Affaire inconnue'}
          </p>
        </div>
        <div className="heading-actions sheet-actions">
          <PrintButton />
          <EditQuoteDialog
            quote={{
              id: quote.id,
              number: quote.number,
              accountId: quote.accountId,
              dealId: quote.dealId,
              contactId: quote.contactId,
              status: quote.status,
              issueDate: quote.issueDate,
              validUntil: quote.validUntil,
              vatRate: quote.vatRate,
              notes: quote.notes,
              revision: quote.revision,
            }}
            items={editableItems}
            contacts={accountContacts.map((c) => ({ id: c.id, accountId: c.accountId, name: c.name }))}
            trigger={
              <button className="secondary">
                <Pencil size={16} />
                Modifier
              </button>
            }
          />
        </div>
      </div>

      <article className="quote-document">
        <header className="quote-doc-head">
          <div>
            <img src="/novelys-mark.png" alt="" className="quote-doc-logo" />
            <strong>GROUPE FULL ACE</strong>
            <p>Espace commercial NOVELYS</p>
          </div>
          <div className="quote-doc-meta">
            <h2>Devis {quote.number}</h2>
            <dl>
              <div>
                <dt>Date</dt>
                <dd>{dayLabel(quote.issueDate)}</dd>
              </div>
              <div>
                <dt>Validité</dt>
                <dd>{quote.validUntil ? dayLabel(quote.validUntil) : '—'}</dd>
              </div>
              <div>
                <dt>Statut</dt>
                <dd>{quote.status}</dd>
              </div>
            </dl>
          </div>
        </header>

        <section className="quote-doc-parties">
          <div>
            <span className="eyebrow">CLIENT</span>
            <strong>{account?.name ?? 'Compte inconnu'}</strong>
            {account?.city ? <p>{account.city}</p> : null}
            {contact ? (
              <p>
                {contact.name}
                {contact.email ? ` · ${contact.email}` : ''}
              </p>
            ) : null}
          </div>
          <div>
            <span className="eyebrow">AFFAIRE</span>
            <strong>{deal?.name ?? 'Affaire inconnue'}</strong>
            {deal?.decisionMaker ? <p>Décideur : {deal.decisionMaker}</p> : null}
          </div>
        </section>

        <table className="quote-doc-table">
          <thead>
            <tr>
              <th>Désignation</th>
              <th>Qté</th>
              <th>P.U. HT</th>
              <th>Remise</th>
              <th>Total HT</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td>{item.label}</td>
                <td>{item.quantity}</td>
                <td>{exactMoney(item.unitPrice)}</td>
                <td>{item.discount ? `${item.discount} %` : '—'}</td>
                <td>{exactMoney(lineTotal(item))}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <dl className="quote-doc-totals">
          <div>
            <dt>Total HT</dt>
            <dd>{exactMoney(totals.subtotal)}</dd>
          </div>
          <div>
            <dt>TVA {quote.vatRate} %</dt>
            <dd>{exactMoney(totals.vat)}</dd>
          </div>
          <div className="quote-total-ttc">
            <dt>Total TTC</dt>
            <dd>{exactMoney(totals.total)}</dd>
          </div>
        </dl>

        {quote.notes ? (
          <section className="quote-doc-notes">
            <span className="eyebrow">NOTES</span>
            <p>{quote.notes}</p>
          </section>
        ) : null}

        <footer className="quote-doc-footer">
          <p>
            Devis valable {quote.validUntil ? `jusqu'au ${dayLabel(quote.validUntil)}` : '30 jours'}. Bon pour accord :
            date, signature et cachet.
          </p>
        </footer>
      </article>
    </>
  );
}
