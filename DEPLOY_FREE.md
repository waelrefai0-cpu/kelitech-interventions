# Deploiement gratuit

Le projet est maintenant prepare pour un deploiement gratuit simple sur Render avec une seule URL publique.

## Ce qui sera deploye

- Backend Express
- Frontend React/Vite servi par le backend
- Base PostgreSQL Render Free

## Important

Render Free est gratuit pour tester et partager une demo. D'apres la documentation Render, les web services gratuits peuvent se mettre en veille apres inactivite, et les bases PostgreSQL gratuites expirent apres une periode limitee. Pour une base gratuite plus durable, utilisez Neon Free et remplacez `DATABASE_URL` dans Render.

## Deploiement Render

1. Cree un compte gratuit sur Render.
2. Mets ce projet sur GitHub.
3. Dans Render, choisis **New > Blueprint**.
4. Connecte le depot GitHub.
5. Render detectera `render.yaml`.
6. Lance le deploiement.

Le fichier `render.yaml` cree :

- un web service gratuit `kelitech-interventions`
- une base PostgreSQL gratuite `kelitech-postgres`

Render executera automatiquement :

```bash
npm install && npm run db:generate && npm run build
```

Puis avant le deploiement :

```bash
npm run db:push && npm run db:seed
```

Puis le lancement :

```bash
npm run start --workspace backend
```

## URL finale

Apres le deploiement, Render donnera une URL comme :

```text
https://kelitech-interventions.onrender.com
```

Cette seule URL sert toute l'application.

## Comptes de test

- Admin / Technicien : `admin@municipalite.tn` / `Admin123!`
- Utilisateur : `ahmed@municipalite.tn` / `User123!`
- Utilisateur : `fatma@municipalite.tn` / `User123!`
- Utilisateur : `wafaa@municipalite.tn` / `User123!`
- Utilisateur : `yassine@municipalite.tn` / `User123!`
- Utilisateur : `moncef@municipalite.tn` / `User123!`
- Utilisateur : `habiba@municipalite.tn` / `User123!`
