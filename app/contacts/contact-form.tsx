'use client';

import { useState, useTransition } from 'react';
import { Check, LoaderCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { createContact, updateContact } from './actions';

const statuses = ['Vérifié', 'À revérifier', 'Parti'] as const;

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

export function CreateContactDialog({
  accounts,
  defaultAccountId,
  trigger,
}: {
  accounts: { id: string; name: string }[];
  defaultAccountId?: string;
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const initial = {
    accountId: defaultAccountId ?? accounts[0]?.id ?? '',
    name: '',
    role: '',
    email: '',
    status: 'À revérifier' as (typeof statuses)[number],
    verified: null as string | null,
  };
  const [form, setForm] = useState(initial);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.accountId) return;
    startTransition(async () => {
      const result = await createContact(form);
      if ('error' in result) {
        toast.error(result.error);
        return;
      }
      toast.success('Contact créé.');
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
        <DialogTitle>Nouveau contact</DialogTitle>
        <DialogDescription>Rattachez ce contact à un compte existant.</DialogDescription>
        <form onSubmit={submit}>
          {!defaultAccountId && (
            <label>
              Compte
              <Pick
                label="Compte"
                value={form.accountId}
                onChange={(v) => setForm({ ...form, accountId: v })}
                options={accounts.map((a) => ({ value: a.id, label: a.name }))}
              />
            </label>
          )}
          <label htmlFor="c-name">Nom
            <input id="c-name" required maxLength={100} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </label>
          <div className="form-row">
            <label htmlFor="c-role">Rôle
              <input id="c-role" maxLength={100} value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} />
            </label>
            <label htmlFor="c-email">E-mail
              <input id="c-email" type="email" maxLength={160} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </label>
          </div>
          <label>
            Fiabilité
            <Pick
              label="Fiabilité"
              value={form.status}
              onChange={(v) => setForm({ ...form, status: v as (typeof statuses)[number] })}
              options={statuses.map((s) => ({ value: s, label: s }))}
            />
          </label>
          <div className="form-footer">
            <button type="button" className="secondary" onClick={() => setOpen(false)}>
              Annuler
            </button>
            <button className="primary" disabled={pending}>
              {pending ? <LoaderCircle className="spin" size={16} /> : <Check size={16} />}
              Créer le contact
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

type EditableContact = {
  id: string;
  accountId: string;
  name: string;
  role: string;
  email: string;
  status: (typeof statuses)[number];
  verified: string | null;
  revision: number;
};

export function EditContactDialog({ contact, trigger }: { contact: EditableContact; trigger: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState(contact);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await updateContact(form);
      if ('error' in result) {
        toast.error(result.error);
        return;
      }
      toast.success('Contact mis à jour.');
      setOpen(false);
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (v) setForm(contact);
      }}
    >
      <span onClick={() => setOpen(true)}>{trigger}</span>
      <DialogContent className="form-dialog">
        <DialogTitle>Modifier le contact</DialogTitle>
        <DialogDescription>Mettez à jour les informations de {contact.name}.</DialogDescription>
        <form onSubmit={submit}>
          <label htmlFor="ec-name">Nom
            <input id="ec-name" required maxLength={100} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </label>
          <div className="form-row">
            <label htmlFor="ec-role">Rôle
              <input id="ec-role" maxLength={100} value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} />
            </label>
            <label htmlFor="ec-email">E-mail
              <input id="ec-email" type="email" maxLength={160} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </label>
          </div>
          <label>
            Fiabilité
            <Pick
              label="Fiabilité"
              value={form.status}
              onChange={(v) =>
                setForm({ ...form, status: v as (typeof statuses)[number], verified: v === 'Vérifié' ? form.verified : form.verified })
              }
              options={statuses.map((s) => ({ value: s, label: s }))}
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
