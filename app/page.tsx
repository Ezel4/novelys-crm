import { database } from '@/db';
import { accounts, contacts, deals, tasks } from '@/db/schema';
import { seedDemoData } from '@/lib/seed';
import { reasons, isoDay } from '@/lib/dashboard';
import { stages } from '@/lib/schemas/deal';
import { DashboardClient, type PriorityAccount, type DealsByStage, type TodayTask } from './dashboard-client';

export default async function DashboardPage() {
  const db = database();
  await seedDemoData(db);

  const [accountRows, contactRows, dealRows, taskRows] = await Promise.all([
    db.select().from(accounts),
    db.select().from(contacts),
    db.select().from(deals),
    db.select().from(tasks),
  ]);

  const priorityAccounts: PriorityAccount[] = accountRows
    .map((a) => {
      const accountContacts = contactRows.filter((c) => c.accountId === a.id);
      const activeDeal = dealRows.find((d) => d.accountId === a.id && !['Gagné', 'Perdu'].includes(d.stage)) ?? null;
      const verified = accountContacts.find((c) => c.status === 'Vérifié');
      return {
        id: a.id,
        name: a.name,
        city: a.city,
        sector: a.sector,
        initials: a.initials,
        color: a.color,
        summary: a.summary,
        next: a.next,
        due: a.due,
        dealAmount: activeDeal?.amount ?? 0,
        reasons: reasons(a, accountContacts, activeDeal),
        verifiedContactName: verified?.name ?? null,
        verifiedContactRole: verified?.role ?? null,
      };
    })
    .sort((a, b) => b.reasons.length - a.reasons.length);

  const accountsById = new Map(priorityAccounts.map((a) => [a.id, a]));

  const openDeals = dealRows.filter((d) => !['Gagné', 'Perdu'].includes(d.stage));
  const totalOpenAmount = openDeals.reduce((s, d) => s + d.amount, 0);
  const wonAmount = dealRows.filter((d) => d.stage === 'Gagné').reduce((s, d) => s + d.amount, 0);
  const dueCount = accountRows.filter((a) => a.due && a.due <= isoDay()).length;

  const dealsByStage: DealsByStage = stages.map((stage) => {
    const inStage = dealRows.filter((d) => d.stage === stage);
    return { stage, count: inStage.length, amount: inStage.reduce((s, d) => s + d.amount, 0) };
  });

  const accountByIdRaw = new Map(accountRows.map((a) => [a.id, a]));
  const todayTasks: TodayTask[] = taskRows
    .filter((t) => t.status === 'À faire' && !!t.dueDate && t.dueDate <= isoDay())
    .map((t) => ({
      id: t.id,
      title: t.title,
      dueDate: t.dueDate,
      accountId: t.accountId,
      accountName: t.accountId ? accountByIdRaw.get(t.accountId)?.name ?? null : null,
      revision: t.revision,
    }))
    .sort((a, b) => (a.dueDate ?? '').localeCompare(b.dueDate ?? ''));

  return (
    <DashboardClient
      accounts={priorityAccounts}
      accountsById={accountsById}
      dealsByStage={dealsByStage}
      totalOpenAmount={totalOpenAmount}
      wonAmount={wonAmount}
      dueCount={dueCount}
      accountOptions={accountRows.map((a) => ({ id: a.id, name: a.name }))}
      contactOptions={contactRows.filter((c) => c.status === 'Vérifié').map((c) => ({ id: c.id, accountId: c.accountId, name: c.name }))}
      todayTasks={todayTasks}
    />
  );
}
