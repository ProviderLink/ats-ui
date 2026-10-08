# Arista ATS (UI)

Applicant tracking frontend for the unified ATS/CRM backend (`ats-crm-backend`). It covers the public careers portal and the recruiter app under `/ats`.

**Stack:** React 19, TypeScript, Vite, React Router, Zustand, Tailwind 4 + shadcn/ui, TanStack Table, Socket.IO client.

## Getting started

```bash
pnpm install
cp .env.example .env   # set VITE_API_URL and VITE_WS_URL
pnpm dev               # http://localhost:5173/ats
```

| Script       | Purpose                     |
| ------------ | --------------------------- |
| `pnpm dev`   | Start the dev server        |
| `pnpm build` | Type-check and build `dist` |
| `pnpm lint`  | Run ESLint                  |

## Main areas

- **Careers** (`/careers`, public): job list, job details, apply with resume parsing.
- **Candidates**: In Review, In Pipeline and Hired tabs, with bulk actions (move stage, reject, add to Talent Pool, remove from job to Talent Pool, email).
- **Talent Pool**: parked candidates, assignable to a new job. **Permanently Ineligible**: banned candidates, permanent delete (admin only).
- **Jobs, Clients, Calendar, Emails, Tags, Team, Settings**.

## Candidate flow in brief

- **Reject** closes the application with a reason and a destination (Talent Pool or Permanently Ineligible).
- **Remove from Job** (bulk, In Pipeline tab) closes the application without a rejection and adds the candidate to the Talent Pool. Uses `PATCH /ats/applications/:id/move-to-talent-pool`.
- **Change Job** (row menu) replaces the current job and keeps the candidate in the pipeline.
- **Add to Talent Pool** only tags the candidate; it does not remove them from the job.

## Conventions

See [CLAUDE.md](CLAUDE.md), [STYLE.md](STYLE.md) and [BUSINESS_LOGIC.md](BUSINESS_LOGIC.md). Access tokens are kept in memory only; the refresh token is an httpOnly cookie set by the backend.

## Deploy

Vercel, auto-deployed from `master`. `vercel.json` rewrites all routes to `index.html`.
