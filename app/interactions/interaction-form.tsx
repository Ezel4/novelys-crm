'use client';

import { useState, useTransition } from 'react';
import { Check, LoaderCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { isoDay } from '@/lib/dashboard';
import { createInteraction } from './actions';

const types = ['Appel', 'E-mail', 'Rendez-vous', 'Note'] as const;

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

type AccountOption = { id: string; name: string };
type ContactOption = { id: string; accountId: string; name: string };

export function InteractionDialog({
  accounts,
  contacts,
  defaultAccountId,
  defaultNext,
  defaultDue,
  trigger,
}: {
  accounts: AccountOption[];
  contacts: ContactOption[];
  defaultAccountId?: string;
  defaultNext?: string;
  defaultDue?: string | null;
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const initial = {
    accountId: defaultAccountId ?? accounts[0]?.id ?? '',
    contactId: 'none',
    type: 'Appel' as (typeof types)[number],
    result: '',
    next: defaultNext ?? '',
    due: defaultDue && defaultDue >= isoDay() ? defaultDue : isoDay(),
  };
  const [form, setForm] = useState(initial);

  const accountContacts = contacts.filter((c) => c.accountId === form.accountId);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.result.trim() || !form.next.trim()) return;
    const contact = accountContacts.find((c) => c.id === form.contactId);
    startTransition(async () => {
      const result = await createInteraction({
        accountId: form.accountId || null,
        contactId: contact?.id ?? null,
        dealId: null,
        leadId: null,
        date: new Date().toISOString(),
        type: form.type,
        contactName: contact?.name || 'Contact non confirmé',
        result: form.result.trim(),
        next: form.next.trim(),
        due: form.due,
      });
      if ('error' in result) {
        toast.error(result.error);
        return;
      }
      toast.success('Échange enregistré. La mémoire client est à jour.');
      setOpen(false);
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (v) setForm(initial);
      }}
    >
      <span onClick={() => setOpen(true)}>{trigger}</span>
      <DialogContent className="form-dialog">
        <DialogTitle>Enregistrer un échange</DialogTitle>
        <DialogDescription>Conservez ce que vous avez appris et la prochaine étape.</DialogDescription>
        <form onSubmit={submit}>
          {!defaultAccountId && (
            <label>
              Compte
              <Pick
                label="Compte"
                value={form.accountId}
                onChange={(v) => setForm({ ...form, accountId: v, contactId: 'none' })}
                options={accounts.map((a) => ({ value: a.id, label: a.name }))}
              />
            </label>
          )}
          <div className="form-row">
            <label>
              Type d&apos;échange
              <Pick label="Type d'échange" value={form.type} onChange={(v) => setForm({ ...form, type: v as (typeof types)[number] })} options={types.map((t) => ({ value: t, label: t }))} />
            </label>
            <label>
              Interlocuteur
              <Pick
                label="Interlocuteur"
                value={form.contactId}
                onChange={(v) => setForm({ ...form, contactId: v })}
                options={[{ value: 'none', label: 'Contact non confirmé' }, ...accountContacts.map((c) => ({ value: c.id, label: c.name }))]}
              />
            </label>
          </div>
          <label htmlFor="i-result">Ce que vous avez appris
            <textarea
              id="i-result"
              required
              maxLength={3000}
              rows={4}
              placeholder="Besoin exprimé, décision, informations à retenir…"
              value={form.result}
              onChange={(e) => setForm({ ...form, result: e.target.value })}
            />
          </label>
          <label htmlFor="i-next">Prochaine action
            <input id="i-next" required maxLength={300} value={form.next} onChange={(e) => setForm({ ...form, next: e.target.value })} />
          </label>
          <label htmlFor="i-due">Date de la prochaine action
            <input id="i-due" type="date" required value={form.due} onChange={(e) => setForm({ ...form, due: e.target.value })} />
          </label>
          <div className="form-footer">
            <button type="button" className="secondary" onClick={() => setOpen(false)}>
              Annuler
            </button>
            <button className="primary" disabled={pending}>
              {pending ? <LoaderCircle className="spin" size={16} /> : <Check size={16} />}
              Enregistrer l&apos;échange
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
