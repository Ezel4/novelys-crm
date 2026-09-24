'use client';

import { useMemo, useState, useTransition } from 'react';
import { Check, LoaderCircle, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';

import { quoteStatuses, quoteTotals, lineTotal, exactMoney, type QuoteItemInput } from '@/lib/schemas/quote';
import { createQuote, updateQuote } from './actions';

function Pick({
  value,
  onChange,
  options,
  label,
}: {
  value: string;
  onChange: (s: string) => void;
  options: { value: string; label: string }[];
  label: string;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger aria-label={label} className="pick">
        <SelectValue placeholder={label} />
      </SelectTrigger>
      <SelectContent>
        {options.map((x) => (
          <SelectItem key={x.value} value={x.value}>
            {x.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

const emptyItem: QuoteItemInput = { label: '', quantity: 1, unitPrice: 0, discount: 0, position: 0 };

/** Tableau de lignes éditable, partagé par la création et la modification. */
function ItemsEditor({
  items,
  onChange,
  vatRate,
}: {
  items: QuoteItemInput[];
  onChange: (items: QuoteItemInput[]) => void;
  vatRate: number;
}) {
  const totals = useMemo(() => quoteTotals(items, vatRate), [items, vatRate]);

  function patch(index: number, changes: Partial<QuoteItemInput>) {
    onChange(items.map((item, i) => (i === index ? { ...item, ...changes } : item)));
  }

  function addLine() {
    onChange([...items, { ...emptyItem, position: items.length }]);
  }

  function removeLine(index: number) {
    onChange(items.filter((_, i) => i !== index).map((item, i) => ({ ...item, position: i })));
  }

  return (
    <div className="quote-items">
      <div className="quote-items-head">
        <span>Désignation</span>
        <span>Qté</span>
        <span>P.U. HT</span>
        <span>Remise %</span>
        <span>Total HT</span>
        <span className="sr-only">Actions</span>
      </div>

      {items.map((item, index) => (
        <div className="quote-items-row" key={index}>
          <input
            aria-label={`Désignation ligne ${index + 1}`}
            required
            maxLength={200}
            placeholder="Prestation…"
            value={item.label}
            onChange={(e) => patch(index, { label: e.target.value })}
          />
          <input
            aria-label={`Quantité ligne ${index + 1}`}
            type="number"
            min={0.01}
            step="0.01"
            value={item.quantity}
            onChange={(e) => patch(index, { quantity: Number(e.target.value) })}
          />
          <input
            aria-label={`Prix unitaire ligne ${index + 1}`}
            type="number"
            min={0}
            step="0.01"
            value={item.unitPrice}
            onChange={(e) => patch(index, { unitPrice: Number(e.target.value) })}
          />
          <input
            aria-label={`Remise ligne ${index + 1}`}
            type="number"
            min={0}
            max={100}
            step="1"
            value={item.discount}
            onChange={(e) => patch(index, { discount: Number(e.target.value) })}
          />
          <span className="quote-line-total">{exactMoney(lineTotal(item))}</span>
          <button
            type="button"
            className="circle"
            aria-label={`Supprimer la ligne ${index + 1}`}
            onClick={() => removeLine(index)}
            disabled={items.length === 1}
          >
            <Trash2 size={15} />
          </button>
        </div>
      ))}

      <button type="button" className="secondary quote-add-line" onClick={addLine}>
        <Plus size={16} />
        Ajouter une ligne
      </button>

      <dl className="quote-totals">
        <div>
          <dt>Total HT</dt>
          <dd>{exactMoney(totals.subtotal)}</dd>
        </div>
        <div>
          <dt>TVA {vatRate}%</dt>
          <dd>{exactMoney(totals.vat)}</dd>
        </div>
        <div className="quote-total-ttc">
          <dt>Total TTC</dt>
          <dd>{exactMoney(totals.total)}</dd>
        </div>
      </dl>
    </div>
  );
}

type DealOption = { id: string; name: string; accountId: string };
type ContactOption = { id: string; accountId: string; name: string };

function today() {
  return new Date().toISOString().slice(0, 10);
}

export function CreateQuoteDialog({
  deals,
  contacts,
  defaultDealId,
  trigger,
}: {
  deals: DealOption[];
  contacts: ContactOption[];
  defaultDealId?: string;
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const initial = {
    dealId: defaultDealId ?? deals[0]?.id ?? '',
    contactId: null as string | null,
    status: 'Brouillon' as (typeof quoteStatuses)[number],
    issueDate: today(),
    validUntil: null as string | null,
    vatRate: 20,
    notes: '',
  };
  const [form, setForm] = useState(initial);
  const [items, setItems] = useState<QuoteItemInput[]>([{ ...emptyItem }]);

  const selectedDeal = deals.find((d) => d.id === form.dealId) ?? null;
  const dealContacts = contacts.filter((c) => c.accountId === selectedDeal?.accountId);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedDeal) {
      toast.error('Sélectionnez une affaire.');
      return;
    }
    if (items.some((i) => !i.label.trim())) {
      toast.error('Chaque ligne doit avoir une désignation.');
      return;
    }
    startTransition(async () => {
      const result = await createQuote({ ...form, accountId: selectedDeal.accountId, items });
      if ('error' in result) {
        toast.error(result.error);
        return;
      }
      toast.success('Devis créé.');
      setOpen(false);
    });
  }

  if (deals.length === 0) return null;

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (v) {
          setForm(initial);
          setItems([{ ...emptyItem }]);
        }
      }}
    >
      <span onClick={() => setOpen(true)}>{trigger}</span>
      <DialogContent className="form-dialog form-dialog-wide">
        <DialogTitle>Nouveau devis</DialogTitle>
        <DialogDescription>Le devis reprend le compte de l&apos;affaire sélectionnée.</DialogDescription>
        <form onSubmit={submit}>
          {!defaultDealId && (
            <label>
              Affaire
              <Pick
                label="Affaire"
                value={form.dealId}
                onChange={(v) => setForm({ ...form, dealId: v, contactId: null })}
                options={deals.map((d) => ({ value: d.id, label: d.name }))}
              />
            </label>
          )}
          {dealContacts.length > 0 && (
            <label>
              Contact
              <Pick
                label="Contact"
                value={form.contactId ?? 'none'}
                onChange={(v) => setForm({ ...form, contactId: v === 'none' ? null : v })}
                options={[{ value: 'none', label: 'Aucun' }, ...dealContacts.map((c) => ({ value: c.id, label: c.name }))]}
              />
            </label>
          )}
          <div className="form-row">
            <label htmlFor="q-issue">Date du devis
              <input
                id="q-issue"
                type="date"
                required
                value={form.issueDate}
                onChange={(e) => setForm({ ...form, issueDate: e.target.value })}
              />
            </label>
            <label htmlFor="q-valid">Valable jusqu&apos;au
              <input
                id="q-valid"
                type="date"
                value={form.validUntil ?? ''}
                onChange={(e) => setForm({ ...form, validUntil: e.target.value || null })}
              />
            </label>
          </div>
          <div className="form-row">
            <label>
              Statut
              <Pick
                label="Statut"
                value={form.status}
                onChange={(v) => setForm({ ...form, status: v as (typeof quoteStatuses)[number] })}
                options={quoteStatuses.map((s) => ({ value: s, label: s }))}
              />
            </label>
            <label htmlFor="q-vat">Taux de TVA (%)
              <input
                id="q-vat"
                type="number"
                min={0}
                max={100}
                step="0.1"
                value={form.vatRate}
                onChange={(e) => setForm({ ...form, vatRate: Number(e.target.value) })}
              />
            </label>
          </div>

          <ItemsEditor items={items} onChange={setItems} vatRate={form.vatRate} />

          <label htmlFor="q-notes">Notes
            <textarea
              id="q-notes"
              rows={3}
              maxLength={2000}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </label>

          <div className="form-footer">
            <button type="button" className="secondary" onClick={() => setOpen(false)}>
              Annuler
            </button>
            <button className="primary" disabled={pending}>
              {pending ? <LoaderCircle className="spin" size={16} /> : <Check size={16} />}
              Créer le devis
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

type EditableQuote = {
  id: string;
  number: string;
  accountId: string;
  dealId: string;
  contactId: string | null;
  status: (typeof quoteStatuses)[number];
  issueDate: string;
  validUntil: string | null;
  vatRate: number;
  notes: string;
  revision: number;
};

export function EditQuoteDialog({
  quote,
  items: initialItems,
  contacts,
  trigger,
}: {
  quote: EditableQuote;
  items: QuoteItemInput[];
  contacts: ContactOption[];
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState(quote);
  const [items, setItems] = useState<QuoteItemInput[]>(initialItems);

  const accountContacts = contacts.filter((c) => c.accountId === quote.accountId);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (items.some((i) => !i.label.trim())) {
      toast.error('Chaque ligne doit avoir une désignation.');
      return;
    }
    startTransition(async () => {
      const result = await updateQuote({ ...form, items });
      if ('error' in result) {
        toast.error(result.error);
        return;
      }
      toast.success('Devis mis à jour.');
      setOpen(false);
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (v) {
          setForm(quote);
          setItems(initialItems);
        }
      }}
    >
      <span onClick={() => setOpen(true)}>{trigger}</span>
      <DialogContent className="form-dialog form-dialog-wide">
        <DialogTitle>Modifier le devis</DialogTitle>
        <DialogDescription>{quote.number}</DialogDescription>
        <form onSubmit={submit}>
          {accountContacts.length > 0 && (
            <label>
              Contact
              <Pick
                label="Contact"
                value={form.contactId ?? 'none'}
                onChange={(v) => setForm({ ...form, contactId: v === 'none' ? null : v })}
                options={[{ value: 'none', label: 'Aucun' }, ...accountContacts.map((c) => ({ value: c.id, label: c.name }))]}
              />
            </label>
          )}
          <div className="form-row">
            <label htmlFor="eq-issue">Date du devis
              <input
                id="eq-issue"
                type="date"
                required
                value={form.issueDate}
                onChange={(e) => setForm({ ...form, issueDate: e.target.value })}
              />
            </label>
            <label htmlFor="eq-valid">Valable jusqu&apos;au
              <input
                id="eq-valid"
                type="date"
                value={form.validUntil ?? ''}
                onChange={(e) => setForm({ ...form, validUntil: e.target.value || null })}
              />
            </label>
          </div>
          <div className="form-row">
            <label>
              Statut
              <Pick
                label="Statut"
                value={form.status}
                onChange={(v) => setForm({ ...form, status: v as (typeof quoteStatuses)[number] })}
                options={quoteStatuses.map((s) => ({ value: s, label: s }))}
              />
            </label>
            <label htmlFor="eq-vat">Taux de TVA (%)
              <input
                id="eq-vat"
                type="number"
                min={0}
                max={100}
                step="0.1"
                value={form.vatRate}
                onChange={(e) => setForm({ ...form, vatRate: Number(e.target.value) })}
              />
            </label>
          </div>

          <ItemsEditor items={items} onChange={setItems} vatRate={form.vatRate} />

          <label htmlFor="eq-notes">Notes
            <textarea
              id="eq-notes"
              rows={3}
              maxLength={2000}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </label>

          <div className="form-footer">
            <button type="button" className="secondary" onClick={() => setOpen(false)}>
              Annuler
            </button>
            <button className="primary" disabled={pending}>
              {pending ? 'Enregistrement…' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
