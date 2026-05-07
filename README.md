# Namma-Raste Reporter

One-click civic infrastructure reporting: potholes and broken streetlights with photo + GPS + severity + a human-friendly Ticket ID.

## Tech

- Next.js (App Router) + TypeScript
- Tailwind CSS + shadcn/ui
- Supabase (Auth + Postgres + Storage + Realtime)
- React Hook Form + Zod
- Leaflet (admin map)

## Setup (Supabase)

1. Create a Supabase project.
2. In Supabase SQL editor, apply migrations in order:
   - `supabase/migrations/0001_init.sql`
   - `supabase/migrations/0002_admin_fields_and_track_ticket.sql`
3. In Supabase Storage:
   - Ensure bucket `reports` exists (created by migration).
4. In Supabase Realtime:
   - Enable Realtime for tables `reports` and `report_updates` (Database → Replication).

### Roles

By default new users are created as `citizen`.

To promote a user to admin/maintenance:

```sql
update public.profiles
set role = 'admin'
where id = '<user-uuid>';
```

## Setup (local)

1. Install deps:

```bash
npm i
```

2. Create `.env.local` (copy from `.env.local.example`):

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Optional `SUPABASE_SERVICE_ROLE_KEY` (recommended for signed image URLs in `/track`)
- `NEXT_PUBLIC_APP_URL` (used to build tracking links in email)
- SMTP: `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`

3. Run dev server:

```bash
npm run dev
```

Open `http://localhost:3000`.

## App routes

- **Landing**: `/`
- **Auth**: `/auth`
- **Report issue** (citizen, requires login): `/report`
- **Ticket confirmation**: `/ticket/[ticketId]`
- **Track ticket** (anyone with Ticket ID): `/track`
- **Admin dashboard** (admin/maintenance): `/admin`
- **Admin report detail**: `/admin/reports/[reportId]`

## Notes

- **Ticket IDs** are generated in Postgres via `report_ticket_seq` as `NR-YYYY-000123`.
- **Uploads** go to Storage bucket `reports` in path `<uid>/<report_uuid>.<ext>`.
- **Security** is enforced with Postgres RLS. Citizens can only see their own reports; admins/maintenance can see all.

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

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
# namma-raste
