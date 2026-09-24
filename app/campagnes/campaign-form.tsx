'use client';

import { useState, useTransition } from 'react';
import { Check, LoaderCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { campaignTypes, campaignStatuses } from '@/lib/schemas/campaign';
import { createCampaign, updateCampaign } from './actions';

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

export function CreateCampaignDialog({ trigger }: { trigger: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const initial = {
    name: '',
    type: 'Autre' as (typeof campaignTypes)[number],
    status: 'Planifiée' as (typeof campaignStatuses)[number],
    startDate: null as string | null,
    endDate: null as string | null,
    budget: 0,
    accountId: null as string | null,
  };
  const [form, setForm] = useState(initial);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;
    startTransition(async () => {
      const result = await createCampaign(form);
      if ('error' in result) {
        toast.error(result.error);
        return;
      }
      toast.success('Campagne créée.');
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
        <DialogTitle>Nouvelle campagne</DialogTitle>
        <DialogDescription>Créez une campagne marketing pour générer des leads.</DialogDescription>
        <form onSubmit={submit}>
          <label htmlFor="camp-name">Nom
            <input id="camp-name" required maxLength={150} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </label>
          <div className="form-row">
            <label>
              Type
              <Pick label="Type" value={form.type} onChange={(v) => setForm({ ...form, type: v as (typeof campaignTypes)[number] })} options={campaignTypes.map((t) => ({ value: t, label: t }))} />
            </label>
            <label>
              Statut
              <Pick
                label="Statut"
                value={form.status}
                onChange={(v) => setForm({ ...form, status: v as (typeof campaignStatuses)[number] })}
                options={campaignStatuses.map((s) => ({ value: s, label: s }))}
              />
            </label>
          </div>
          <div className="form-row">
            <label htmlFor="camp-start">Date de début
              <input id="camp-start" type="date" value={form.startDate ?? ''} onChange={(e) => setForm({ ...form, startDate: e.target.value || null })} />
            </label>
            <label htmlFor="camp-end">Date de fin
              <input id="camp-end" type="date" value={form.endDate ?? ''} onChange={(e) => setForm({ ...form, endDate: e.target.value || null })} />
            </label>
          </div>
          <label htmlFor="camp-budget">Budget
            <input
              id="camp-budget"
              type="number"
              min={0}
              step="0.01"
              value={form.budget}
              onChange={(e) => setForm({ ...form, budget: Number(e.target.value) })}
            />
          </label>
          <div className="form-footer">
            <button type="button" className="secondary" onClick={() => setOpen(false)}>
              Annuler
            </button>
            <button className="primary" disabled={pending}>
              {pending ? <LoaderCircle className="spin" size={16} /> : <Check size={16} />}
              Créer la campagne
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

type EditableCampaign = {
  id: string;
  name: string;
  type: (typeof campaignTypes)[number];
  status: (typeof campaignStatuses)[number];
  startDate: string | null;
  endDate: string | null;
  budget: number;
  accountId: string | null;
  revision: number;
};

export function EditCampaignDialog({ campaign, trigger }: { campaign: EditableCampaign; trigger: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState(campaign);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await updateCampaign(form);
      if ('error' in result) {
        toast.error(result.error);
        return;
      }
      toast.success('Campagne mise à jour.');
      setOpen(false);
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (v) setForm(campaign);
      }}
    >
      <span onClick={() => setOpen(true)}>{trigger}</span>
      <DialogContent className="form-dialog">
        <DialogTitle>Modifier la campagne</DialogTitle>
        <DialogDescription>{campaign.name}</DialogDescription>
        <form onSubmit={submit}>
          <label htmlFor="ecamp-name">Nom
            <input id="ecamp-name" required maxLength={150} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </label>
          <div className="form-row">
            <label>
              Type
              <Pick label="Type" value={form.type} onChange={(v) => setForm({ ...form, type: v as (typeof campaignTypes)[number] })} options={campaignTypes.map((t) => ({ value: t, label: t }))} />
            </label>
            <label>
              Statut
              <Pick
                label="Statut"
                value={form.status}
                onChange={(v) => setForm({ ...form, status: v as (typeof campaignStatuses)[number] })}
                options={campaignStatuses.map((s) => ({ value: s, label: s }))}
              />
            </label>
          </div>
          <div className="form-row">
            <label htmlFor="ecamp-start">Date de début
              <input id="ecamp-start" type="date" value={form.startDate ?? ''} onChange={(e) => setForm({ ...form, startDate: e.target.value || null })} />
            </label>
            <label htmlFor="ecamp-end">Date de fin
              <input id="ecamp-end" type="date" value={form.endDate ?? ''} onChange={(e) => setForm({ ...form, endDate: e.target.value || null })} />
            </label>
          </div>
          <label htmlFor="ecamp-budget">Budget
            <input
              id="ecamp-budget"
              type="number"
              min={0}
              step="0.01"
              value={form.budget}
              onChange={(e) => setForm({ ...form, budget: Number(e.target.value) })}
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
