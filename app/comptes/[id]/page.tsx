import { eq, inArray } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, Pencil, Plus, ArrowUpRight } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { database } from '@/db';
import { accounts, contacts, deals, interactions, attachments, quotes, quoteItems } from '@/db/schema';
import { money, dayLabel } from '@/lib/dashboard';
import { quoteTotals, exactMoney } from '@/lib/schemas/quote';
import { CreateQuoteDialog } from '@/app/devis/quote-form';
import { QualifyAccountDialog } from '../account-form';
import { InteractionDialog } from '@/app/interactions/interaction-form';
import { ContactCard } from '@/app/contacts/contact-card';
import { DealCardMini } from '@/app/affaires/deal-card-mini';
import { AttachmentsPanel } from './attachments-panel';

export default async function AccountDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = database();

  const [account] = await db.select().from(accounts).where(eq(accounts.id, id)).limit(1);
  if (!account) notFound();

  const [accountContacts, accountDeals, accountInteractions, accountAttachments, accountQuotes] = await Promise.all([
    db.select().from(contacts).where(eq(contacts.accountId, id)),
    db.select().from(deals).where(eq(deals.accountId, id)),
    db.select().from(interactions).where(eq(interactions.accountId, id)),
    db.select().from(attachments).where(eq(attachments.accountId, id)),
    db.select().from(quotes).where(eq(quotes.accountId, id)),
  ]);

  // Les lignes des seuls devis de ce compte, pour en calculer les totaux.
  const quoteIds = accountQuotes.map((q) => q.id);
  const accountQuoteItems = quoteIds.length
    ? await db.select().from(quoteItems).where(inArray(quoteItems.quoteId, quoteIds))
    : [];

  const quoteItemsByQuote = new Map<string, typeof accountQuoteItems>();
  for (const item of accountQuoteItems) {
    const list = quoteItemsByQuote.get(item.quoteId);
    if (list) list.push(item);
    else quoteItemsByQuote.set(item.quoteId, [item]);
  }

  const dealById = new Map(accountDeals.map((d) => [d.id, d]));

  const sortedInteractions = [...accountInteractions].sort((a, b) => b.date.localeCompare(a.date));
  const verifiedContacts = accountContacts.filter((c) => c.status === 'Vérifié');
  const activeDeal = accountDeals.find((d) => !['Gagné', 'Perdu'].includes(d.stage)) ?? accountDeals[0] ?? null;

  return (
    <>
      <div className="heading">
        <div>
          <div className="eyebrow">
            <Link href="/comptes">COMPTES</Link> <span>/</span> {account.name}
          </div>
          <h1>{account.name}</h1>
          <p>{account.sector} · {account.city}</p>
        </div>
        <div className="heading-actions sheet-actions">
          <InteractionDialog
            accounts={[{ id: account.id, name: account.name }]}
            contacts={verifiedContacts.map((c) => ({ id: c.id, accountId: c.accountId, name: c.name }))}
            defaultAccountId={account.id}
            defaultNext={account.next}
            defaultDue={account.due}
            trigger={
              <button className="primary">
                <Plus size={17} />
                Enregistrer un échange
              </button>
            }
          />
          <QualifyAccountDialog
            account={account}
            trigger={
              <button className="secondary">
                <Pencil size={16} />
                Qualifier
              </button>
            }
          />
        </div>
      </div>

      <Tabs defaultValue="context" className="detail-tabs">
        <TabsList>
          <TabsTrigger value="context">Contexte</TabsTrigger>
          <TabsTrigger value="contacts">Contacts</TabsTrigger>
          <TabsTrigger value="deals">Affaires</TabsTrigger>
          <TabsTrigger value="quotes">Devis</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="history">Historique</TabsTrigger>
        </TabsList>

        <TabsContent value="context">
          <section className="sheet-section">
            <h3>Ce que l&apos;on sait</h3>
            <p>{account.summary || 'Aucun contexte renseigné.'}</p>
            <div className="detail-stats">
              <div>
                <strong>{account.orders}</strong>
                <span>commandes</span>
              </div>
              <div>
                <strong>{money(account.revenue)}</strong>
                <span>CA historique simulé</span>
              </div>
            </div>
          </section>
          {activeDeal && (
            <section className="sheet-section">
              <h3>Affaire en cours</h3>
              <p>{activeDeal.name}</p>
              <dl>
                <div>
                  <dt>Montant</dt>
                  <dd>{money(activeDeal.amount)}</dd>
                </div>
                <div>
                  <dt>Statut du devis</dt>
                  <dd>{activeDeal.stage}</dd>
                </div>
                <div>
                  <dt>Décideur</dt>
                  <dd>{activeDeal.decisionMaker || 'À qualifier'}</dd>
                </div>
                <div>
                  <dt>Calendrier</dt>
                  <dd>{dayLabel(activeDeal.deadline)}</dd>
                </div>
                <div>
                  <dt>Logo exploitable</dt>
                  <dd>{activeDeal.logo ? 'Disponible' : 'Manquant'}</dd>
                </div>
              </dl>
            </section>
          )}
          <div className="next-action">
            <span className="eyebrow">PROCHAINE ACTION · {dayLabel(account.due)}</span>
            <p>{account.next}</p>
          </div>
        </TabsContent>

        <TabsContent value="contacts">
          <p className="contact-help">
            Seuls les contacts vérifiés sont proposés pour les échanges. Les contacts partis restent dans l&apos;historique.
          </p>
          {accountContacts.map((c) => (
            <ContactCard key={c.id} contact={c} accountName={account.name} showAccount={false} />
          ))}
          {!accountContacts.length && <div className="empty">Aucun contact pour ce compte.</div>}
        </TabsContent>

        <TabsContent value="deals">
          {accountDeals.map((d) => (
            <DealCardMini key={d.id} deal={d} />
          ))}
          {!accountDeals.length && <div className="empty">Aucune affaire pour ce compte.</div>}
          <Link href="/affaires" className="text-button">
            Voir toutes les affaires
            <ArrowUpRight size={16} />
          </Link>
        </TabsContent>

        <TabsContent value="quotes">
          {accountQuotes.map((q) => {
            const totals = quoteTotals(quoteItemsByQuote.get(q.id) ?? [], q.vatRate);
            return (
              <Link key={q.id} href={`/devis/${q.id}`} className="history-card quote-link-card">
                <span>{dayLabel(q.issueDate)}</span>
                <h3>
                  {q.number} · {exactMoney(totals.total)} TTC
                </h3>
                <p>{dealById.get(q.dealId)?.name ?? 'Affaire inconnue'}</p>
                <div>
                  <span className={'status ' + (q.status === 'Accepté' ? 'verified' : q.status === 'Refusé' || q.status === 'Expiré' ? 'warning' : '')}>
                    {q.status}
                  </span>
                </div>
              </Link>
            );
          })}
          {!accountQuotes.length && <div className="empty">Aucun devis pour ce compte.</div>}
          {accountDeals.length > 0 && (
            <CreateQuoteDialog
              deals={accountDeals.map((d) => ({ id: d.id, name: d.name, accountId: d.accountId }))}
              contacts={accountContacts.map((c) => ({ id: c.id, accountId: c.accountId, name: c.name }))}
              trigger={
                <button className="text-button">
                  Créer un devis
                  <ArrowUpRight size={16} />
                </button>
              }
            />
          )}
        </TabsContent>

        <TabsContent value="documents">
          <AttachmentsPanel accountId={account.id} attachments={accountAttachments} />
        </TabsContent>

        <TabsContent value="history">
          {sortedInteractions.map((i) => (
            <article className="history-card" key={i.id}>
              <span>
                {new Date(i.date).toLocaleDateString('fr-FR')} · {i.type}
              </span>
              <h3>{i.contactName || 'Contact non confirmé'}</h3>
              <p>{i.result}</p>
              <div>
                <ArrowRight size={15} />
                {i.next} · {dayLabel(i.due)}
              </div>
            </article>
          ))}
          {!sortedInteractions.length && <div className="empty">Aucun échange enregistré.</div>}
        </TabsContent>
      </Tabs>
    </>
  );
}
