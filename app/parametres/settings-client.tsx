'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import {
  Building2, Percent, BellRing, Users2, ListChecks, Database, Route, Save, Plus, Trash2, Eye, EyeOff,
} from 'lucide-react';
import { saveSettings, addPickListValue, togglePickListValue, deletePickListValue, updateUser } from './actions';
import { userRoles, availabilities, type User } from '@/lib/schemas/user';
import { cityNames } from '@/lib/geo';
import { money } from '@/lib/dashboard';

type ListValues = Record<string, { id: string; value: string; active: boolean }[]>;

const sections = [
  { id: 'societe', label: 'Société', icon: Building2, hint: 'Identité légale et coordonnées' },
  { id: 'commercial', label: 'Règles commerciales', icon: Percent, hint: 'TVA, remises, validité des devis' },
  { id: 'relances', label: 'Relances', icon: BellRing, hint: 'Rythme de suivi client' },
  { id: 'tournees', label: 'Tournées', icon: Route, hint: 'Point de départ et contraintes de route' },
  { id: 'equipe', label: 'Équipe', icon: Users2, hint: 'Les trois postes du CRM' },
  { id: 'listes', label: 'Listes de valeurs', icon: ListChecks, hint: 'Secteurs, familles, sources, motifs' },
  { id: 'notifications', label: 'Notifications', icon: BellRing, hint: 'Ce qui déclenche une alerte' },
  { id: 'donnees', label: 'Données & conformité', icon: Database, hint: 'Contrôles, doublons, rétention' },
] as const;

const listLabels: Record<string, string> = {
  secteurs: 'Secteurs d’activité',
  familles: 'Familles de produits',
  sources: 'Sources de leads',
  'motifs-perte': 'Motifs de perte',
};

export function SettingsClient({
  values,
  lists,
  users,
  counts,
}: {
  values: Record<string, string>;
  lists: ListValues;
  users: User[];
  counts: { accounts: number; contacts: number; deals: number; quotes: number };
}) {
  const [active, setActive] = useState<string>('societe');

  return (
    <div className="settings-layout">
      <nav className="settings-nav" aria-label="Sections des paramètres">
        {sections.map((s) => (
          <button
            key={s.id}
            type="button"
            className={active === s.id ? 'active' : ''}
            onClick={() => setActive(s.id)}
            aria-current={active === s.id ? 'page' : undefined}
          >
            <s.icon size={16} />
            <span>
              <strong>{s.label}</strong>
              <small>{s.hint}</small>
            </span>
          </button>
        ))}
      </nav>

      <div className="settings-content">
        {active === 'societe' && <CompanySection values={values} />}
        {active === 'commercial' && <SalesSection values={values} />}
        {active === 'relances' && <FollowUpSection values={values} />}
        {active === 'tournees' && <TourSection values={values} />}
        {active === 'equipe' && <TeamSection users={users} />}
        {active === 'listes' && <ListsSection lists={lists} />}
        {active === 'notifications' && <NotificationsSection values={values} />}
        {active === 'donnees' && <DataSection values={values} counts={counts} />}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- */

function useSettingsForm(section: string, initial: Record<string, string>, keys: string[]) {
  const [draft, setDraft] = useState<Record<string, string>>(() =>
    Object.fromEntries(keys.map((k) => [k, initial[k] ?? '']))
  );
  const [pending, start] = useTransition();

  const set = (key: string, value: string) => setDraft((d) => ({ ...d, [key]: value }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    start(async () => {
      const result = await saveSettings({ section, values: draft });
      if ('error' in result) toast.error(result.error);
      else toast.success('Paramètres enregistrés.');
    });
  };

  return { draft, set, submit, pending };
}

function SettingsForm({
  title,
  description,
  children,
  onSubmit,
  pending,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  onSubmit: (e: React.FormEvent) => void;
  pending: boolean;
}) {
  return (
    <form className="panel settings-panel" onSubmit={onSubmit}>
      <div className="panel-title">
        <h2>{title}</h2>
      </div>
      <p className="settings-description">{description}</p>
      <div className="settings-fields">{children}</div>
      <div className="settings-actions">
        <button type="submit" className="settings-save" disabled={pending}>
          <Save size={15} /> {pending ? 'Enregistrement…' : 'Enregistrer'}
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="settings-field">
      <span className="settings-label">{label}</span>
      {children}
      {hint && <small className="settings-hint">{hint}</small>}
    </label>
  );
}

function Toggle({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="settings-toggle">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span>
        <strong>{label}</strong>
        <small>{hint}</small>
      </span>
    </label>
  );
}

/* ---------------------------------------------------------------- */

function CompanySection({ values }: { values: Record<string, string> }) {
  const keys = [
    'company.name', 'company.legalForm', 'company.siret', 'company.vatNumber',
    'company.address', 'company.phone', 'company.email', 'company.website',
  ];
  const { draft, set, submit, pending } = useSettingsForm('societe', values, keys);

  return (
    <SettingsForm
      title="Identité de la société"
      description="Ces informations apparaissent en en-tête des devis et sur les documents envoyés aux clients."
      onSubmit={submit}
      pending={pending}
    >
      <Field label="Raison sociale">
        <input value={draft['company.name']} onChange={(e) => set('company.name', e.target.value)} />
      </Field>
      <Field label="Forme juridique">
        <input value={draft['company.legalForm']} onChange={(e) => set('company.legalForm', e.target.value)} />
      </Field>
      <Field label="SIRET" hint="14 chiffres, repris sur les devis.">
        <input value={draft['company.siret']} onChange={(e) => set('company.siret', e.target.value)} />
      </Field>
      <Field label="N° de TVA intracommunautaire">
        <input value={draft['company.vatNumber']} onChange={(e) => set('company.vatNumber', e.target.value)} />
      </Field>
      <Field label="Adresse du siège">
        <input value={draft['company.address']} onChange={(e) => set('company.address', e.target.value)} />
      </Field>
      <Field label="Téléphone">
        <input value={draft['company.phone']} onChange={(e) => set('company.phone', e.target.value)} />
      </Field>
      <Field label="E-mail de contact">
        <input value={draft['company.email']} onChange={(e) => set('company.email', e.target.value)} />
      </Field>
      <Field label="Site web">
        <input value={draft['company.website']} onChange={(e) => set('company.website', e.target.value)} />
      </Field>
    </SettingsForm>
  );
}

function SalesSection({ values }: { values: Record<string, string> }) {
  const keys = [
    'sales.currency', 'sales.defaultVatRate', 'sales.quoteValidityDays', 'sales.quotePrefix',
    'sales.defaultPaymentTerms', 'sales.minMargin', 'sales.maxDiscount',
  ];
  const { draft, set, submit, pending } = useSettingsForm('commercial', values, keys);

  return (
    <SettingsForm
      title="Règles commerciales"
      description="Les valeurs appliquées par défaut à chaque nouveau devis, et les garde-fous de marge."
      onSubmit={submit}
      pending={pending}
    >
      <Field label="Devise">
        <select value={draft['sales.currency']} onChange={(e) => set('sales.currency', e.target.value)}>
          <option value="EUR">Euro (€)</option>
          <option value="CHF">Franc suisse (CHF)</option>
          <option value="GBP">Livre sterling (£)</option>
        </select>
      </Field>
      <Field label="Taux de TVA par défaut (%)">
        <input type="number" min="0" max="100" step="0.1" value={draft['sales.defaultVatRate']} onChange={(e) => set('sales.defaultVatRate', e.target.value)} />
      </Field>
      <Field label="Validité des devis (jours)" hint="Au-delà, le devis est signalé comme expiré dans l’espace ADV.">
        <input type="number" min="1" max="365" value={draft['sales.quoteValidityDays']} onChange={(e) => set('sales.quoteValidityDays', e.target.value)} />
      </Field>
      <Field label="Préfixe de numérotation" hint="Exemple : DEV-2026-001.">
        <input value={draft['sales.quotePrefix']} onChange={(e) => set('sales.quotePrefix', e.target.value)} />
      </Field>
      <Field label="Conditions de paiement par défaut">
        <select value={draft['sales.defaultPaymentTerms']} onChange={(e) => set('sales.defaultPaymentTerms', e.target.value)}>
          <option>Comptant</option>
          <option>15 jours</option>
          <option>30 jours</option>
          <option>45 jours</option>
          <option>60 jours</option>
        </select>
      </Field>
      <Field label="Marge minimale (%)" hint="En dessous, une validation de la direction est requise.">
        <input type="number" min="0" max="100" value={draft['sales.minMargin']} onChange={(e) => set('sales.minMargin', e.target.value)} />
      </Field>
      <Field label="Remise maximale sans validation (%)">
        <input type="number" min="0" max="100" value={draft['sales.maxDiscount']} onChange={(e) => set('sales.maxDiscount', e.target.value)} />
      </Field>
    </SettingsForm>
  );
}

function FollowUpSection({ values }: { values: Record<string, string> }) {
  const keys = ['followup.relanceDays', 'followup.dormantDays', 'followup.contactRecheckDays', 'followup.quoteReminderDays'];
  const { draft, set, submit, pending } = useSettingsForm('relances', values, keys);

  return (
    <SettingsForm
      title="Rythme des relances"
      description="Ces seuils déterminent ce qui remonte dans l’espace commercial : relances dues, comptes qui dorment, fiches à revérifier."
      onSubmit={submit}
      pending={pending}
    >
      <Field label="Délai de relance standard (jours)" hint="Après un échange sans réponse.">
        <input type="number" min="1" max="90" value={draft['followup.relanceDays']} onChange={(e) => set('followup.relanceDays', e.target.value)} />
      </Field>
      <Field label="Compte considéré comme dormant après (jours)" hint="Sans aucune interaction enregistrée.">
        <input type="number" min="7" max="365" value={draft['followup.dormantDays']} onChange={(e) => set('followup.dormantDays', e.target.value)} />
      </Field>
      <Field label="Revérification d’un contact (jours)" hint="Un contact vérifié il y a longtemps redevient incertain.">
        <input type="number" min="30" max="730" value={draft['followup.contactRecheckDays']} onChange={(e) => set('followup.contactRecheckDays', e.target.value)} />
      </Field>
      <Field label="Rappel avant expiration d’un devis (jours)">
        <input type="number" min="1" max="60" value={draft['followup.quoteReminderDays']} onChange={(e) => set('followup.quoteReminderDays', e.target.value)} />
      </Field>
    </SettingsForm>
  );
}

function TourSection({ values }: { values: Record<string, string> }) {
  const keys = ['tour.startCity', 'tour.maxDailyKm', 'tour.avgSpeed', 'tour.visitDuration', 'tour.workdayStart', 'tour.workdayEnd'];
  const { draft, set, submit, pending } = useSettingsForm('tournees', values, keys);

  return (
    <SettingsForm
      title="Organisation des tournées"
      description="Le point de départ et les contraintes utilisées pour calculer les itinéraires affichés sur la carte."
      onSubmit={submit}
      pending={pending}
    >
      <Field label="Ville de départ" hint="Sert d’origine et de retour pour chaque tournée.">
        <select value={draft['tour.startCity']} onChange={(e) => set('tour.startCity', e.target.value)}>
          {cityNames.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Distance maximale par jour (km)" hint="Au-delà, la tournée est signalée comme trop chargée.">
        <input type="number" min="50" max="1200" value={draft['tour.maxDailyKm']} onChange={(e) => set('tour.maxDailyKm', e.target.value)} />
      </Field>
      <Field label="Vitesse moyenne retenue (km/h)" hint="Utilisée pour estimer les temps de trajet.">
        <input type="number" min="30" max="130" value={draft['tour.avgSpeed']} onChange={(e) => set('tour.avgSpeed', e.target.value)} />
      </Field>
      <Field label="Durée par défaut d’une visite (min)">
        <input type="number" min="15" max="240" step="15" value={draft['tour.visitDuration']} onChange={(e) => set('tour.visitDuration', e.target.value)} />
      </Field>
      <Field label="Début de journée">
        <input type="time" value={draft['tour.workdayStart']} onChange={(e) => set('tour.workdayStart', e.target.value)} />
      </Field>
      <Field label="Fin de journée">
        <input type="time" value={draft['tour.workdayEnd']} onChange={(e) => set('tour.workdayEnd', e.target.value)} />
      </Field>
    </SettingsForm>
  );
}

function NotificationsSection({ values }: { values: Record<string, string> }) {
  const keys = ['notify.dailyDigest', 'notify.quoteAccepted', 'notify.dealLost', 'notify.overdueTasks', 'notify.weeklyReport'];
  const { draft, set, submit, pending } = useSettingsForm('notifications', values, keys);
  const bool = (k: string) => draft[k] === 'true';

  return (
    <SettingsForm
      title="Notifications"
      description="Ce que le CRM signale, et à qui. Chaque poste reçoit ce qui le concerne."
      onSubmit={submit}
      pending={pending}
    >
      <div className="settings-toggles">
        <Toggle label="Résumé quotidien" hint="Chaque matin : relances dues, visites du jour, tâches en retard." checked={bool('notify.dailyDigest')} onChange={(v) => set('notify.dailyDigest', String(v))} />
        <Toggle label="Devis accepté" hint="Alerte immédiate à l’ADV pour lancer la production." checked={bool('notify.quoteAccepted')} onChange={(v) => set('notify.quoteAccepted', String(v))} />
        <Toggle label="Affaire perdue" hint="Notifie la direction avec le motif de perte saisi." checked={bool('notify.dealLost')} onChange={(v) => set('notify.dealLost', String(v))} />
        <Toggle label="Tâches en retard" hint="Rappel au propriétaire de la tâche dès le lendemain de l’échéance." checked={bool('notify.overdueTasks')} onChange={(v) => set('notify.overdueTasks', String(v))} />
        <Toggle label="Rapport hebdomadaire" hint="Synthèse du pipe et de la performance envoyée le lundi à la direction." checked={bool('notify.weeklyReport')} onChange={(v) => set('notify.weeklyReport', String(v))} />
      </div>
    </SettingsForm>
  );
}

function DataSection({
  values,
  counts,
}: {
  values: Record<string, string>;
  counts: { accounts: number; contacts: number; deals: number; quotes: number };
}) {
  const keys = ['data.duplicateCheck', 'data.requireLogoBeforeQuote', 'data.requirePhoneOnContact', 'data.retentionMonths'];
  const { draft, set, submit, pending } = useSettingsForm('donnees', values, keys);
  const bool = (k: string) => draft[k] === 'true';

  return (
    <>
      <section className="panel settings-panel">
        <div className="panel-title">
          <h2>
            <Database size={16} /> Volumétrie
          </h2>
        </div>
        <div className="settings-counts">
          <div>
            <strong>{counts.accounts}</strong>
            <small>Comptes</small>
          </div>
          <div>
            <strong>{counts.contacts}</strong>
            <small>Contacts</small>
          </div>
          <div>
            <strong>{counts.deals}</strong>
            <small>Affaires</small>
          </div>
          <div>
            <strong>{counts.quotes}</strong>
            <small>Devis</small>
          </div>
        </div>
      </section>

      <SettingsForm
        title="Contrôles et conformité"
        description="Les règles de qualité appliquées à la saisie. Elles alimentent le contrôle qualité de l’espace ADV."
        onSubmit={submit}
        pending={pending}
      >
        <div className="settings-toggles">
          <Toggle label="Détection des doublons" hint="Signale un compte ou un contact dont le nom existe déjà." checked={bool('data.duplicateCheck')} onChange={(v) => set('data.duplicateCheck', String(v))} />
          <Toggle label="Logo obligatoire avant devis" hint="Bloque l’envoi tant que le fichier vectoriel n’est pas rattaché." checked={bool('data.requireLogoBeforeQuote')} onChange={(v) => set('data.requireLogoBeforeQuote', String(v))} />
          <Toggle label="Téléphone obligatoire sur un contact" hint="Un contact sans téléphone ne peut pas être marqué comme vérifié." checked={bool('data.requirePhoneOnContact')} onChange={(v) => set('data.requirePhoneOnContact', String(v))} />
        </div>
        <Field label="Durée de conservation des données (mois)" hint="Au-delà, les fiches inactives sont proposées à l’archivage.">
          <input type="number" min="12" max="240" value={draft['data.retentionMonths']} onChange={(e) => set('data.retentionMonths', e.target.value)} />
        </Field>
      </SettingsForm>
    </>
  );
}

/* ---------------------------------------------------------------- */

function TeamSection({ users }: { users: User[] }) {
  return (
    <section className="panel settings-panel">
      <div className="panel-title">
        <h2>
          <Users2 size={16} /> Les trois postes
        </h2>
      </div>
      <p className="settings-description">
        Chaque collaborateur dispose de son espace dédié. Le poste détermine les sections affichées et les alertes reçues.
      </p>
      <div className="team-cards">
        {users.map((u) => (
          <UserCard key={u.id} user={u} />
        ))}
      </div>
    </section>
  );
}

function UserCard({ user }: { user: User }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(user);
  const [pending, start] = useTransition();

  const set = <K extends keyof User>(key: K, value: User[K]) => setDraft((d) => ({ ...d, [key]: value }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    start(async () => {
      const result = await updateUser(draft);
      if ('error' in result) toast.error(result.error);
      else {
        toast.success('Fiche enregistrée.');
        setOpen(false);
      }
    });
  };

  return (
    <div className="team-card">
      <div className="team-card-head">
        <span className={`avatar ${draft.color}`}>{draft.initials}</span>
        <div>
          <strong>{draft.name}</strong>
          <small>{draft.jobTitle}</small>
          <span className="team-card-role">{draft.role}</span>
        </div>
        <button type="button" className="team-card-toggle" onClick={() => setOpen((o) => !o)}>
          {open ? 'Fermer' : 'Modifier'}
        </button>
      </div>

      {!open ? (
        <dl className="team-card-facts">
          <div>
            <dt>Rattachement</dt>
            <dd>{draft.baseCity || '—'}</dd>
          </div>
          <div>
            <dt>Périmètre</dt>
            <dd>{draft.territory || '—'}</dd>
          </div>
          <div>
            <dt>Horaires</dt>
            <dd>{draft.workingHours}</dd>
          </div>
          <div>
            <dt>Objectif mensuel</dt>
            <dd>{draft.monthlyTarget > 0 ? money(draft.monthlyTarget) : 'Non applicable'}</dd>
          </div>
          <div>
            <dt>Disponibilité</dt>
            <dd>{draft.availability}</dd>
          </div>
          <div className="team-card-wide">
            <dt>Points forts</dt>
            <dd>{draft.strengths || '—'}</dd>
          </div>
          <div className="team-card-wide">
            <dt>Présentation</dt>
            <dd>{draft.bio || '—'}</dd>
          </div>
        </dl>
      ) : (
        <form className="settings-fields" onSubmit={submit}>
          <Field label="Nom">
            <input value={draft.name} onChange={(e) => set('name', e.target.value)} required />
          </Field>
          <Field label="Poste">
            <select value={draft.role} onChange={(e) => set('role', e.target.value as User['role'])}>
              {userRoles.map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
          </Field>
          <Field label="Intitulé du poste">
            <input value={draft.jobTitle} onChange={(e) => set('jobTitle', e.target.value)} />
          </Field>
          <Field label="Initiales">
            <input maxLength={4} value={draft.initials} onChange={(e) => set('initials', e.target.value)} />
          </Field>
          <Field label="E-mail">
            <input type="email" value={draft.email} onChange={(e) => set('email', e.target.value)} />
          </Field>
          <Field label="Téléphone">
            <input value={draft.phone} onChange={(e) => set('phone', e.target.value)} />
          </Field>
          <Field label="Ville de rattachement">
            <select value={draft.baseCity} onChange={(e) => set('baseCity', e.target.value)}>
              <option value="">—</option>
              {cityNames.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Périmètre">
            <input value={draft.territory} onChange={(e) => set('territory', e.target.value)} />
          </Field>
          <Field label="Horaires">
            <input value={draft.workingHours} onChange={(e) => set('workingHours', e.target.value)} />
          </Field>
          <Field label="Disponibilité">
            <select value={draft.availability} onChange={(e) => set('availability', e.target.value as User['availability'])}>
              {availabilities.map((a) => (
                <option key={a}>{a}</option>
              ))}
            </select>
          </Field>
          <Field label="Objectif mensuel (€)" hint="Laisser à 0 pour un poste sans objectif chiffré.">
            <input type="number" min="0" step="500" value={draft.monthlyTarget} onChange={(e) => set('monthlyTarget', Number(e.target.value))} />
          </Field>
          <Field label="Points forts">
            <input value={draft.strengths} onChange={(e) => set('strengths', e.target.value)} />
          </Field>
          <Field label="Présentation">
            <textarea rows={3} value={draft.bio} onChange={(e) => set('bio', e.target.value)} />
          </Field>
          <div className="settings-actions">
            <button type="submit" className="settings-save" disabled={pending}>
              <Save size={15} /> {pending ? 'Enregistrement…' : 'Enregistrer'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------- */

function ListsSection({ lists }: { lists: ListValues }) {
  return (
    <section className="panel settings-panel">
      <div className="panel-title">
        <h2>
          <ListChecks size={16} /> Listes de valeurs
        </h2>
      </div>
      <p className="settings-description">
        Les choix proposés dans les formulaires. Désactiver une valeur la retire des nouvelles saisies sans toucher à
        l’historique.
      </p>
      <div className="pick-lists">
        {Object.entries(lists).map(([list, items]) => (
          <PickList key={list} list={list} items={items} />
        ))}
      </div>
    </section>
  );
}

function PickList({ list, items }: { list: string; items: { id: string; value: string; active: boolean }[] }) {
  const [value, setValue] = useState('');
  const [pending, start] = useTransition();

  const add = (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim()) return;
    start(async () => {
      const result = await addPickListValue({ list, value: value.trim() });
      if ('error' in result) toast.error(result.error);
      else {
        toast.success('Valeur ajoutée.');
        setValue('');
      }
    });
  };

  const toggle = (id: string, active: boolean) =>
    start(async () => {
      const result = await togglePickListValue(id, active);
      if ('error' in result) toast.error(result.error);
    });

  const remove = (id: string) =>
    start(async () => {
      const result = await deletePickListValue(id);
      if ('error' in result) toast.error(result.error);
      else toast.success('Valeur supprimée.');
    });

  return (
    <div className="pick-list">
      <h3>{listLabels[list] ?? list}</h3>
      <ul>
        {items.map((item) => (
          <li key={item.id} className={item.active ? '' : 'inactive'}>
            <span>{item.value}</span>
            <div className="pick-list-actions">
              <button
                type="button"
                onClick={() => toggle(item.id, !item.active)}
                title={item.active ? 'Désactiver' : 'Réactiver'}
                aria-label={item.active ? `Désactiver ${item.value}` : `Réactiver ${item.value}`}
              >
                {item.active ? <Eye size={14} /> : <EyeOff size={14} />}
              </button>
              <button type="button" onClick={() => remove(item.id)} aria-label={`Supprimer ${item.value}`}>
                <Trash2 size={14} />
              </button>
            </div>
          </li>
        ))}
      </ul>
      <form className="pick-list-add" onSubmit={add}>
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Nouvelle valeur"
          aria-label={`Ajouter une valeur à ${listLabels[list] ?? list}`}
        />
        <button type="submit" disabled={pending || !value.trim()}>
          <Plus size={14} /> Ajouter
        </button>
      </form>
    </div>
  );
}
