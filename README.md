# Golf Booker — Golfstar Stockholm

A web application that monitors the [Sweetspot](https://book.sweetspot.io/clubs/golfstar-golf-club) golf booking system for available tee times at Golfstar's courses in Stockholm, Sweden. When a watched slot opens up, you get an email notification so you can book immediately.

![Golf Booker](https://github.com/user-attachments/assets/af5ccfcd-bd53-44e3-be86-5acd916c99d0)

## Features

- 🔐 **User accounts** — register and log in with email + password
- 🔍 **Browse tee times** — search available slots by course, date, and time window on all Golfstar Stockholm courses
- 👁️ **Watches** — add a watch for any course/date/time combination
- 🔔 **Email notifications** — receive an email the moment a watched slot becomes available
- ⏱️ **Automatic polling** — the app checks Sweetspot every 5 minutes via a cron job

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Auth | NextAuth.js v4 (credentials) |
| Database | SQLite via Prisma 7 + better-sqlite3 |
| Email | Nodemailer (SMTP) |
| Scheduler | Vercel Cron Jobs |
| Styling | Tailwind CSS |

## Getting Started

### 1. Clone & install

```bash
git clone https://github.com/JohanSjogren10/golf-booker
cd golf-booker
npm install
```

### 2. Configure environment variables

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

| Variable | Description |
|---|---|
| `DATABASE_URL` | SQLite path, e.g. `file:./dev.db` |
| `NEXTAUTH_SECRET` | Random secret (run `openssl rand -base64 32`) |
| `NEXTAUTH_URL` | Public URL, e.g. `http://localhost:3000` |
| `SWEETSPOT_API_BASE_URL` | Sweetspot API base URL |
| `SWEETSPOT_CLUB_SLUG` | Club slug, default `golfstar-golf-club` |
| `SMTP_HOST` | SMTP server hostname |
| `SMTP_PORT` | SMTP port (usually 587) |
| `SMTP_USER` | SMTP username / email |
| `SMTP_PASSWORD` | SMTP password / app password |
| `EMAIL_FROM` | Sender address for notifications |
| `CRON_SECRET` | Optional bearer token to secure the cron endpoint |

### 3. Set up the database

```bash
npx prisma migrate dev --name init
```

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deployment

### Vercel (recommended)

1. Push to GitHub and import the project in Vercel
2. Add all environment variables in the Vercel dashboard
3. The `vercel.json` cron configuration will automatically poll for availability every 5 minutes

### Self-hosted

Run `npm run build && npm start` behind a reverse proxy (nginx/caddy). Use a system cron job or GitHub Actions scheduled workflow to call `GET /api/cron/check-availability` periodically:

```bash
# crontab — every 5 minutes
*/5 * * * * curl -H "Authorization: Bearer <CRON_SECRET>" https://yourdomain.com/api/cron/check-availability
```

## Architecture

```
src/
├── app/
│   ├── page.tsx                       # Landing page
│   ├── login/page.tsx                 # Login form
│   ├── register/page.tsx              # Registration form
│   ├── dashboard/page.tsx             # User's active watches
│   ├── tee-times/page.tsx             # Browse & watch tee times
│   └── api/
│       ├── auth/[...nextauth]/        # NextAuth handler
│       ├── auth/register/             # User registration
│       ├── tee-times/                 # Sweetspot proxy
│       ├── watches/                   # CRUD for watches
│       └── cron/check-availability/   # Polling endpoint
├── lib/
│   ├── db.ts                          # Prisma client
│   ├── auth.ts                        # NextAuth config
│   ├── sweetspot.ts                   # Sweetspot API client
│   ├── notifications.ts               # Email via Nodemailer
│   └── checker.ts                     # Availability checker logic
└── components/
    ├── Navbar.tsx
    └── SessionProvider.tsx
```
