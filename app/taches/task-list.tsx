'use client';

import { useTransition } from 'react';
import Link from 'next/link';
import { Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from '@/components/ui/table';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { dayLabel, isoDay } from '@/lib/dashboard';
import { taskStatuses } from '@/lib/schemas/task';
import { updateTaskStatus } from './actions';
import { EditTaskDialog } from './task-form';

export type TaskRow = {
  id: string;
  title: string;
  description: string;
  dueDate: string | null;
  status: (typeof taskStatuses)[number];
  accountId: string | null;
  accountName: string | null;
  dealId: string | null;
  dealName: string | null;
  revision: number;
};

function StatusPick({ task }: { task: TaskRow }) {
  const [pending, startTransition] = useTransition();
  return (
    <Select
      value={task.status}
      onValueChange={(v) => {
        if (pending) return;
        startTransition(async () => {
          const result = await updateTaskStatus(task.id, task.revision, v);
          if ('error' in result) toast.error(result.error);
          else toast.success('Statut de la tâche mis à jour.');
        });
      }}
    >
      <SelectTrigger aria-label={'Statut ' + task.title} className="pick">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {taskStatuses.map((s) => (
          <SelectItem key={s} value={s}>
            {s}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function TaskList({
  tasks,
  accounts,
  deals,
}: {
  tasks: TaskRow[];
  accounts: { id: string; name: string }[];
  deals: { id: string; accountId: string; name: string }[];
}) {
  return (
    <section className="panel directory">
      <div className="panel-title">
        <div>
          <h2>
            Tâches <span className="count">{tasks.length}</span>
          </h2>
        </div>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Titre</TableHead>
            <TableHead>Échéance</TableHead>
            <TableHead>Lié à</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead><span className="sr-only">Actions</span></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tasks.map((t) => {
            const late = t.status === 'À faire' && !!t.dueDate && t.dueDate < isoDay();
            return (
              <TableRow key={t.id}>
                <TableCell>
                  <strong>{t.title}</strong>
                  {t.description && <small>{t.description}</small>}
                </TableCell>
                <TableCell>
                  <span className={late ? 'status late' : ''}>{dayLabel(t.dueDate)}</span>
                </TableCell>
                <TableCell>
                  {t.accountId ? (
                    <Link href={`/comptes/${t.accountId}`} className="text-button">
                      {t.accountName}
                    </Link>
                  ) : t.dealName ? (
                    <span>{t.dealName}</span>
                  ) : (
                    <span className="status">Aucun</span>
                  )}
                </TableCell>
                <TableCell>
                  <StatusPick task={t} />
                </TableCell>
                <TableCell>
                  <EditTaskDialog
                    task={t}
                    accounts={accounts}
                    deals={deals}
                    trigger={
                      <button className="circle" aria-label={'Modifier ' + t.title} title="Modifier">
                        <Pencil size={15} />
                      </button>
                    }
                  />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      {!tasks.length && <div className="empty">Aucune tâche pour le moment.</div>}
    </section>
  );
}
