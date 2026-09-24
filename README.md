# NOVELYS — CRM MVP

Code source du CRM FULL ACE, avec la charte NOVELYS.

## Fonctionnalités

- Priorités commerciales et agenda des prochaines actions.
- Fiches clients 360°, contacts et qualification des informations.
- Enregistrement des interactions et suivi de la prochaine action.
- Opportunités et devis avec changement de statut.
- Sauvegarde dans une base Postgres (Supabase) ; données de démonstration fictives.

## Hébergement

- Application Next.js déployée sur Vercel (`vercel.json`).
- Base Postgres Supabase : les tables sont dans le schéma `novelys` (`drizzle/0000_init.sql`).
- La variable d’environnement `DATABASE_URL` doit contenir l’URI du **Transaction pooler** Supabase
  (Supabase → Connect → Transaction pooler, port 6543).

Les comptes fictifs sont créés automatiquement au premier chargement si la base est vide.

## Lancer sur votre ordinateur

Prérequis : Node.js 22.13 ou supérieur.

```sh
npx pnpm@11.25.0 install --frozen-lockfile
```

Créez un fichier `.env.local` contenant `DATABASE_URL=...` (même valeur que sur Vercel, ou une base Postgres locale
initialisée avec `drizzle/0000_init.sql`), puis :

```sh
npm run dev
```

Après une modification de `db/schema.ts`, générez la migration avec `npm run db:generate`.

## Contenu

- `app/` : interface, styles et actions serveur.
- `lib/` : données de démonstration (`seed.ts`), schémas de validation, rapports, recherche et géolocalisation.
- `db/` et `drizzle/` : structure et migration de la base.
- `public/` : logo, polices et licences.
- `pnpm-lock.yaml` : versions des dépendances.
