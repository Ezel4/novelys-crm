'use client';

import { useState, useTransition } from 'react';
import { Check, LoaderCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { taskStatuses } from '@/lib/schemas/task';
import { createTask, updateTask } from './actions';

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

export function CreateTaskDialog({
  accounts,
  deals,
  defaultAccountId,
  defaultDealId,
  trigger,
}: {
  accounts: { id: string; name: string }[];
  deals: { id: string; accountId: string; name: string }[];
  defaultAccountId?: string | null;
  defaultDealId?: string | null;
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const initial = {
    title: '',
    description: '',
    dueDate: null as string | null,
    status: 'À faire' as (typeof taskStatuses)[number],
    accountId: defaultAccountId ?? null,
    dealId: defaultDealId ?? null,
  };
  const [form, setForm] = useState(initial);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) return;
    startTransition(async () => {
      const result = await createTask(form);
      if ('error' in result) {
        toast.error(result.error);
        return;
      }
      toast.success('Tâche créée.');
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
        <DialogTitle>Nouvelle tâche</DialogTitle>
        <DialogDescription>Planifiez une action à réaliser.</DialogDescription>
        <form onSubmit={submit}>
          <label htmlFor="t-title">Titre
            <input id="t-title" required maxLength={150} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </label>
          <label htmlFor="t-description">Description
            <textarea id="t-description" maxLength={1000} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </label>
          <div className="form-row">
            <label htmlFor="t-due">Échéance
              <input id="t-due" type="date" value={form.dueDate ?? ''} onChange={(e) => setForm({ ...form, dueDate: e.target.value || null })} />
            </label>
            <label>
              Statut
              <Pick
                label="Statut"
                value={form.status}
                onChange={(v) => setForm({ ...form, status: v as (typeof taskStatuses)[number] })}
                options={taskStatuses.map((s) => ({ value: s, label: s }))}
              />
            </label>
          </div>
          <div className="form-row">
            <label>
              Compte lié
              <Pick
                label="Compte lié"
                value={form.accountId ?? 'none'}
                onChange={(v) => setForm({ ...form, accountId: v === 'none' ? null : v, dealId: v === 'none' ? form.dealId : null })}
                options={[{ value: 'none', label: 'Aucun' }, ...accounts.map((a) => ({ value: a.id, label: a.name }))]}
              />
            </label>
            <label>
              Affaire liée
              <Pick
                label="Affaire liée"
                value={form.dealId ?? 'none'}
                onChange={(v) => setForm({ ...form, dealId: v === 'none' ? null : v })}
                options={[
                  { value: 'none', label: 'Aucune' },
                  ...deals.filter((d) => !form.accountId || d.accountId === form.accountId).map((d) => ({ value: d.id, label: d.name })),
                ]}
              />
            </label>
          </div>
          <div className="form-footer">
            <button type="button" className="secondary" onClick={() => setOpen(false)}>
              Annuler
            </button>
            <button className="primary" disabled={pending}>
              {pending ? <LoaderCircle className="spin" size={16} /> : <Check size={16} />}
              Créer la tâche
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

type EditableTask = {
  id: string;
  title: string;
  description: string;
  dueDate: string | null;
  status: (typeof taskStatuses)[number];
  accountId: string | null;
  dealId: string | null;
  revision: number;
};

export function EditTaskDialog({
  task,
  accounts,
  deals,
  trigger,
}: {
  task: EditableTask;
  accounts: { id: string; name: string }[];
  deals: { id: string; accountId: string; name: string }[];
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState(task);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await updateTask(form);
      if ('error' in result) {
        toast.error(result.error);
        return;
      }
      toast.success('Tâche mise à jour.');
      setOpen(false);
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (v) setForm(task);
      }}
    >
      <span onClick={() => setOpen(true)}>{trigger}</span>
      <DialogContent className="form-dialog">
        <DialogTitle>Modifier la tâche</DialogTitle>
        <DialogDescription>Mettez à jour {task.title}.</DialogDescription>
        <form onSubmit={submit}>
          <label htmlFor="et-title">Titre
            <input id="et-title" required maxLength={150} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </label>
          <label htmlFor="et-description">Description
            <textarea id="et-description" maxLength={1000} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </label>
          <div className="form-row">
            <label htmlFor="et-due">Échéance
              <input id="et-due" type="date" value={form.dueDate ?? ''} onChange={(e) => setForm({ ...form, dueDate: e.target.value || null })} />
            </label>
            <label>
              Statut
              <Pick
                label="Statut"
                value={form.status}
                onChange={(v) => setForm({ ...form, status: v as (typeof taskStatuses)[number] })}
                options={taskStatuses.map((s) => ({ value: s, label: s }))}
              />
            </label>
          </div>
          <div className="form-row">
            <label>
              Compte lié
              <Pick
                label="Compte lié"
                value={form.accountId ?? 'none'}
                onChange={(v) => setForm({ ...form, accountId: v === 'none' ? null : v, dealId: v === 'none' ? form.dealId : null })}
                options={[{ value: 'none', label: 'Aucun' }, ...accounts.map((a) => ({ value: a.id, label: a.name }))]}
              />
            </label>
            <label>
              Affaire liée
              <Pick
                label="Affaire liée"
                value={form.dealId ?? 'none'}
                onChange={(v) => setForm({ ...form, dealId: v === 'none' ? null : v })}
                options={[
                  { value: 'none', label: 'Aucune' },
                  ...deals.filter((d) => !form.accountId || d.accountId === form.accountId).map((d) => ({ value: d.id, label: d.name })),
                ]}
              />
            </label>
          </div>
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
