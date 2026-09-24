'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Check, LoaderCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { createAccount, updateAccount } from './actions';
import { isoDay } from '@/lib/dashboard';

const colors = ['blue', 'navy', 'sky', 'lavender', 'pale', 'ice'];

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

export function CreateAccountDialog({ trigger }: { trigger: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const [form, setForm] = useState({
    name: '',
    city: '',
    sector: '',
    family: '',
    initials: '',
    color: 'blue',
    summary: '',
    orders: 0,
    revenue: 0,
    lastOrder: null as string | null,
    next: 'Premier contact à planifier',
    due: isoDay(1),
  });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;
    startTransition(async () => {
      const result = await createAccount({
        ...form,
        initials: form.initials.trim() || form.name.slice(0, 2).toUpperCase(),
      });
      if ('error' in result) {
        toast.error(result.error);
        return;
      }
      toast.success('Compte créé.');
      setOpen(false);
      router.push(`/comptes/${result.id}`);
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (v)
          setForm({
            name: '',
            city: '',
            sector: '',
            family: '',
            initials: '',
            color: 'blue',
            summary: '',
            orders: 0,
            revenue: 0,
            lastOrder: null,
            next: 'Premier contact à planifier',
            due: isoDay(1),
          });
      }}
    >
      <span onClick={() => setOpen(true)}>{trigger}</span>
      <DialogContent className="form-dialog">
        <DialogTitle>Nouveau compte</DialogTitle>
        <DialogDescription>Renseignez les informations de base ; le reste pourra être qualifié plus tard.</DialogDescription>
        <form onSubmit={submit}>
          <label htmlFor="name">Nom de l&apos;entreprise
            <input id="name" required maxLength={100} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </label>
          <div className="form-row">
            <label htmlFor="city">Ville
              <input id="city" maxLength={100} value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
            </label>
            <label htmlFor="sector">Secteur
              <input id="sector" maxLength={100} value={form.sector} onChange={(e) => setForm({ ...form, sector: e.target.value })} />
            </label>
          </div>
          <div className="form-row">
            <label htmlFor="family">Famille de produits
              <input id="family" maxLength={100} value={form.family} onChange={(e) => setForm({ ...form, family: e.target.value })} />
            </label>
            <label htmlFor="initials">Initiales
              <input id="initials" maxLength={4} placeholder="Auto" value={form.initials} onChange={(e) => setForm({ ...form, initials: e.target.value })} />
            </label>
          </div>
          <label>Couleur
            <Pick label="Couleur" value={form.color} onChange={(v) => setForm({ ...form, color: v })} options={colors.map((c) => ({ value: c, label: c }))} />
          </label>
          <label htmlFor="summary">Contexte
            <textarea id="summary" rows={3} maxLength={3000} value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} />
          </label>
          <label htmlFor="next">Prochaine action
            <input id="next" required maxLength={300} value={form.next} onChange={(e) => setForm({ ...form, next: e.target.value })} />
          </label>
          <label htmlFor="due">Date de la prochaine action
            <input id="due" type="date" value={form.due ?? ''} onChange={(e) => setForm({ ...form, due: e.target.value })} />
          </label>
          <div className="form-footer">
            <button type="button" className="secondary" onClick={() => setOpen(false)}>
              Annuler
            </button>
            <button className="primary" disabled={pending}>
              {pending ? <LoaderCircle className="spin" size={16} /> : <Check size={16} />}
              Créer le compte
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

type QualifyAccount = {
  id: string;
  name: string;
  city: string;
  sector: string;
  family: string;
  initials: string;
  color: string;
  summary: string;
  orders: number;
  revenue: number;
  lastOrder: string | null;
  next: string;
  due: string | null;
  revision: number;
};

export function QualifyAccountDialog({ account, trigger }: { account: QualifyAccount; trigger: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState(account);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await updateAccount(form);
      if ('error' in result) {
        toast.error(result.error);
        return;
      }
      toast.success('Fiche compte mise à jour.');
      setOpen(false);
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (v) setForm(account);
      }}
    >
      <span onClick={() => setOpen(true)}>{trigger}</span>
      <DialogContent className="form-dialog qualification">
        <DialogTitle>Qualifier la fiche client</DialogTitle>
        <DialogDescription>{account.name} · Une information inconnue peut rester vide.</DialogDescription>
        <form onSubmit={submit}>
          <label htmlFor="q-summary">Contexte du compte
            <textarea id="q-summary" rows={3} maxLength={3000} value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} />
          </label>
          <div className="form-row">
            <label htmlFor="q-city">Ville
              <input id="q-city" maxLength={100} value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
            </label>
            <label htmlFor="q-sector">Secteur
              <input id="q-sector" maxLength={100} value={form.sector} onChange={(e) => setForm({ ...form, sector: e.target.value })} />
            </label>
          </div>
          <div className="form-row">
            <label htmlFor="q-next">Prochaine action
              <input id="q-next" required maxLength={300} value={form.next} onChange={(e) => setForm({ ...form, next: e.target.value })} />
            </label>
            <label htmlFor="q-due">Échéance
              <input id="q-due" type="date" value={form.due ?? ''} onChange={(e) => setForm({ ...form, due: e.target.value })} />
            </label>
          </div>
          <div className="form-footer">
            <button type="button" className="secondary" onClick={() => setOpen(false)}>
              Annuler
            </button>
            <button className="primary" disabled={pending}>
              {pending ? 'Enregistrement…' : 'Enregistrer la fiche'}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
