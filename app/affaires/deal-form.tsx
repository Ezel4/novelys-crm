'use client';

import { useState, useTransition } from 'react';
import { Check, LoaderCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { stages } from '@/lib/schemas/deal';
import { createDeal, updateDeal } from './actions';

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

export function CreateDealDialog({
  accounts,
  defaultAccountId,
  contacts,
  trigger,
}: {
  accounts: { id: string; name: string }[];
  defaultAccountId?: string;
  contacts?: { id: string; name: string }[];
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const initial = {
    accountId: defaultAccountId ?? accounts[0]?.id ?? '',
    contactId: null as string | null,
    name: '',
    amount: 0,
    stage: 'À qualifier' as (typeof stages)[number],
    decisionMaker: '',
    deadline: null as string | null,
    logo: false,
  };
  const [form, setForm] = useState(initial);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.accountId) return;
    startTransition(async () => {
      const result = await createDeal(form);
      if ('error' in result) {
        toast.error(result.error);
        return;
      }
      toast.success('Affaire créée.');
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
        <DialogTitle>Nouvelle affaire</DialogTitle>
        <DialogDescription>Rattachez cette affaire à un compte existant.</DialogDescription>
        <form onSubmit={submit}>
          {!defaultAccountId && (
            <label>
              Compte
              <Pick
                label="Compte"
                value={form.accountId}
                onChange={(v) => setForm({ ...form, accountId: v, contactId: null })}
                options={accounts.map((a) => ({ value: a.id, label: a.name }))}
              />
            </label>
          )}
          {contacts && contacts.length > 0 && (
            <label>
              Contact
              <Pick
                label="Contact"
                value={form.contactId ?? 'none'}
                onChange={(v) => setForm({ ...form, contactId: v === 'none' ? null : v })}
                options={[{ value: 'none', label: 'Aucun' }, ...contacts.map((c) => ({ value: c.id, label: c.name }))]}
              />
            </label>
          )}
          <label htmlFor="d-name">Nom du projet
            <input id="d-name" required maxLength={150} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </label>
          <div className="form-row">
            <label htmlFor="d-amount">Montant
              <input
                id="d-amount"
                type="number"
                min={0}
                step="0.01"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
              />
            </label>
            <label htmlFor="d-deadline">Échéance
              <input id="d-deadline" type="date" value={form.deadline ?? ''} onChange={(e) => setForm({ ...form, deadline: e.target.value || null })} />
            </label>
          </div>
          <label htmlFor="d-decision">Décideur
            <input id="d-decision" maxLength={100} value={form.decisionMaker} onChange={(e) => setForm({ ...form, decisionMaker: e.target.value })} />
          </label>
          <div className="form-footer">
            <button type="button" className="secondary" onClick={() => setOpen(false)}>
              Annuler
            </button>
            <button className="primary" disabled={pending}>
              {pending ? <LoaderCircle className="spin" size={16} /> : <Check size={16} />}
              Créer l&apos;affaire
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

type EditableDeal = {
  id: string;
  accountId: string;
  contactId: string | null;
  name: string;
  amount: number;
  stage: (typeof stages)[number];
  decisionMaker: string;
  deadline: string | null;
  logo: boolean;
  revision: number;
};

export function EditDealDialog({ deal, trigger }: { deal: EditableDeal; trigger: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState(deal);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await updateDeal(form);
      if ('error' in result) {
        toast.error(result.error);
        return;
      }
      toast.success('Affaire mise à jour.');
      setOpen(false);
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (v) setForm(deal);
      }}
    >
      <span onClick={() => setOpen(true)}>{trigger}</span>
      <DialogContent className="form-dialog">
        <DialogTitle>Modifier l&apos;affaire</DialogTitle>
        <DialogDescription>{deal.name}</DialogDescription>
        <form onSubmit={submit}>
          <label htmlFor="ed-name">Nom du projet
            <input id="ed-name" required maxLength={150} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </label>
          <div className="form-row">
            <label htmlFor="ed-amount">Montant
              <input
                id="ed-amount"
                type="number"
                min={0}
                step="0.01"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
              />
            </label>
            <label htmlFor="ed-deadline">Échéance
              <input id="ed-deadline" type="date" value={form.deadline ?? ''} onChange={(e) => setForm({ ...form, deadline: e.target.value || null })} />
            </label>
          </div>
          <div className="form-row">
            <label>
              Statut du devis
              <Pick label="Statut du devis" value={form.stage} onChange={(v) => setForm({ ...form, stage: v as (typeof stages)[number] })} options={stages.map((s) => ({ value: s, label: s }))} />
            </label>
            <label>
              Logo exploitable
              <Pick
                label="Logo exploitable"
                value={form.logo ? 'yes' : 'no'}
                onChange={(v) => setForm({ ...form, logo: v === 'yes' })}
                options={[{ value: 'yes', label: 'Disponible' }, { value: 'no', label: 'Manquant' }]}
              />
            </label>
          </div>
          <label htmlFor="ed-decision">Décideur
            <input id="ed-decision" maxLength={100} value={form.decisionMaker} onChange={(e) => setForm({ ...form, decisionMaker: e.target.value })} />
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
