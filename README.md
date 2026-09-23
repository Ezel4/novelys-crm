# NOVELYS — CRM MVP

Code source du CRM FULL ACE, avec la charte NOVELYS.

## Fonctionnalités

- Priorités commerciales et agenda des prochaines actions.
- Fiches clients 360°, contacts et qualification des informations.
- Enregistrement des interactions et suivi de la prochaine action.
- Opportunités et devis avec changement de statut.
- Sauvegarde dans une base Cloudflare D1 ; données de démonstration fictives.

## Lancer sur votre ordinateur

Prérequis : Node.js 22.13 ou supérieur, connexion Internet pour installer les dépendances.
Ouvrez un terminal dans ce dossier, puis exécutez :

```sh
npx pnpm@11.25.0 install --frozen-lockfile
npm run build
```

À la première installation uniquement, initialisez la base locale :

```sh
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_dazzling_phil_sheldon.sql
```

Puis lancez le CRM :

```sh
npm start
```

Ouvrez l’adresse locale indiquée dans le terminal. Les six comptes fictifs sont créés au premier chargement. La base locale est indépendante de la version hébergée. Les modifications restent dans `.wrangler/state`.

Pour développer après l’initialisation, utilisez `npm run dev`.
Ce projet nécessite son serveur et sa base D1 : il ne s’ouvre pas en double-cliquant sur un fichier HTML.

## Contenu

- `app/` : interface, styles et API.
- `lib/crm.ts` : modèles et scénarios de démonstration.
- `db/` et `drizzle/` : structure et migration de la base.
- `public/` : logo, polices et licences.
- `pnpm-lock.yaml` : versions des dépendances.
- `README-TECHNIQUE.md` : documentation technique du socle.

L’archive contient les sources, sans dépendances installées, historique Git, fichiers temporaires ou données de la base hébergée.
L’accès privé de la version hébergée est fourni par Sites ; un hébergement sur une autre plateforme nécessite sa propre configuration d’accès et de base D1.
