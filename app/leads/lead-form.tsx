'use client';

import { useState, useTransition } from 'react';
import { Check, LoaderCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { leadStatuses } from '@/lib/schemas/lead';
import { createLead } from './actions';

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

export function CreateLeadDialog({ campaigns, trigger }: { campaigns: { id: string; name: string }[]; trigger: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const initial = {
    name: '',
    company: '',
    email: '',
    phone: '',
    status: 'Nouveau' as (typeof leadStatuses)[number],
    source: '',
    campaignId: null as string | null,
  };
  const [form, setForm] = useState(initial);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;
    startTransition(async () => {
      const result = await createLead(form);
      if ('error' in result) {
        toast.error(result.error);
        return;
      }
      toast.success('Lead créé.');
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
        <DialogTitle>Nouveau lead</DialogTitle>
        <DialogDescription>Enregistrez un prospect entrant.</DialogDescription>
        <form onSubmit={submit}>
          <label htmlFor="l-name">Nom
            <input id="l-name" required maxLength={100} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </label>
          <div className="form-row">
            <label htmlFor="l-company">Entreprise
              <input id="l-company" maxLength={100} value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
            </label>
            <label htmlFor="l-source">Source
              <input id="l-source" maxLength={100} value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} />
            </label>
          </div>
          <div className="form-row">
            <label htmlFor="l-email">E-mail
              <input id="l-email" type="email" maxLength={160} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </label>
            <label htmlFor="l-phone">Téléphone
              <input id="l-phone" maxLength={40} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </label>
          </div>
          <div className="form-row">
            <label>
              Statut
              <Pick
                label="Statut"
                value={form.status}
                onChange={(v) => setForm({ ...form, status: v as (typeof leadStatuses)[number] })}
                options={leadStatuses.map((s) => ({ value: s, label: s }))}
              />
            </label>
            <label>
              Campagne
              <Pick
                label="Campagne"
                value={form.campaignId ?? 'none'}
                onChange={(v) => setForm({ ...form, campaignId: v === 'none' ? null : v })}
                options={[{ value: 'none', label: 'Aucune' }, ...campaigns.map((c) => ({ value: c.id, label: c.name }))]}
              />
            </label>
          </div>
          <div className="form-footer">
            <button type="button" className="secondary" onClick={() => setOpen(false)}>
              Annuler
            </button>
            <button className="primary" disabled={pending}>
              {pending ? <LoaderCircle className="spin" size={16} /> : <Check size={16} />}
              Créer le lead
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
