# KeliTech Interventions

Application web complete pour la gestion des interventions informatiques de la Municipalite de Kelibia.

## Stack

- Frontend : React, Vite, Tailwind CSS, Material UI
- Backend : Node.js, Express.js, Prisma
- Base de donnees : PostgreSQL
- Authentification : JWT

## Base de donnees

Le projet utilise PostgreSQL via `DATABASE_URL`.

Options :

- PostgreSQL installe localement sur Windows
- PostgreSQL gratuit en ligne, par exemple Neon Free
- PostgreSQL gratuit gere par Render pendant le deploiement

## Demarrage local

1. Cree une base PostgreSQL.

Exemple attendu par `backend/.env` :

```env
DATABASE_URL="postgresql://kelitech:kelitech_password@localhost:5432/kelitech_interventions?schema=public"
JWT_SECRET="change-this-secret-in-production"
JWT_EXPIRES_IN="8h"
PORT=4000
CLIENT_URL="http://localhost:5173"
UPLOAD_DIR="uploads"
```

2. Installe et initialise.

```bash
npm install
npm run db:generate
npm run db:push
npm run db:seed
npm run dev
```

URLs par defaut :

- Frontend : http://localhost:5173
- Backend : http://localhost:4000
- API : http://localhost:4000/api

## Deploiement gratuit

Le projet contient `render.yaml` pour un deploiement gratuit sur Render.

Render creera :

- un web service Node gratuit
- une base PostgreSQL gratuite

Important : d'apres la documentation Render, les services gratuits peuvent se mettre en veille apres inactivite et les bases PostgreSQL gratuites expirent apres 30 jours. Pour une base gratuite plus durable, utilisez Neon Free et mettez son URL dans `DATABASE_URL`.

## Comptes de demonstration

Apres `npm run db:seed` :

| Role | Email | Mot de passe |
| --- | --- | --- |
| Admin / Technicien | admin@municipalite.tn | Admin123! |
| Utilisateur | ahmed@municipalite.tn | User123! |
| Utilisateur | fatma@municipalite.tn | User123! |
| Utilisateur | wafaa@municipalite.tn | User123! |
| Utilisateur | yassine@municipalite.tn | User123! |
| Utilisateur | moncef@municipalite.tn | User123! |
| Utilisateur | habiba@municipalite.tn | User123! |

## Verification

```bash
npm run typecheck
npm run build
```

Le build frontend peut signaler un gros chunk JavaScript a cause de Material UI et Recharts. C'est un avertissement de performance, pas une erreur d'execution.
