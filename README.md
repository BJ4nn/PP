This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

This project expects Postgres. When using `npm run dev`, it will attempt to start a local dev Postgres via `docker compose` (using `docker-compose.yml`) if nothing is listening on `localhost:5432`.

On first run with a fresh DB, it also applies Prisma migrations and seeds demo accounts.

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Production setup (Vercel + external Postgres)

Configure the following environment variables in your hosting platform (for Vercel: Project Settings → Environment Variables). Do not commit secrets to git.

- `DATABASE_URL`: Postgres connection string (production DB).
- `NEXTAUTH_SECRET`: Generate with `openssl rand -hex 32`.
- `NEXTAUTH_URL`: Public app URL, e.g. `https://your-app.vercel.app`.
- `ALLOWED_ORIGINS`: Comma-separated list including the app URL.
- `TRUST_PROXY`: `true` when behind Vercel/proxy.
- `EMAIL_ENABLED`: Set to `true` to send verification emails.
- `EMAIL_FROM`: Sender address for outgoing emails.
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_SECURE`: SMTP connection.

Ensure your Vercel build command runs migrations:

```bash
npx prisma migrate deploy && npm run build
```

### Gmail SMTP (free)

1. Enable 2FA on your Google account.
2. Create an App Password for "Mail".
3. Set:
   - `SMTP_HOST=smtp.gmail.com`
   - `SMTP_PORT=587`
   - `SMTP_SECURE=false`
   - `SMTP_USER=your@gmail.com`
   - `SMTP_PASS=<app-password>`

## Oracle Always Free Postgres (no sleep)

If you want a free DB that does not sleep, use an Oracle Cloud Always Free VM:

1. Create an Always Free VM (Ubuntu) and assign a static public IP.
2. Install Postgres (or run it via Docker) and enable external access.
3. Lock down port 5432 to allowed IPs if possible; use `sslmode=require`.
4. Create a DB/user and set `DATABASE_URL` in Vercel.
5. Optional: add a daily `pg_dump` cron for backups.

For a detailed step-by-step guide, see `docs/deploy/production-vercel-oracle.md`.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
