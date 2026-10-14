# Arista ATS (frontend) — Full Codebase Audit

**Repo:** `ats-crm/ats` · **Audited:** 14 Oct 2026 · **Method:** read-only, every source file read top to bottom (229 files, ~55,600 lines of TS/TSX plus config, CSS and docs). Nothing was built, run, edited or pushed.

**How to read this document**

- **Part A** is the synthesis: what the app is, how it is built, how it connects to the backend, and the consolidated, ranked list of problems.
- **Part B** is the detailed area-by-area audit (four areas), each with: files read (with line counts), per-file summary, features and flows, UI/UX, styles, roles and permissions, connections (every endpoint), data types, dependencies, and a numbered issue list with `path:line` evidence.
- Issue references like **[A-3]** point to issue 3 in area A of Part B. Areas: **A** = candidates + careers, **B1** = jobs, clients, settings, tags, team, **B2** = auth, dashboard, calendar, emails, hired, talent pool, ineligible, home, **C** = infrastructure (router, stores, socket, lib, hooks, shared components, config, docs).
- "Inferred" means reasoned from code, not observed at runtime.

**Limitations:** the copy in the project folder has no dotfiles (`.env.example`, `.gitignore`) and no `.git`, so env values, ignore rules and history were not checked.

---

# Part A — Synthesis

## A1. What the app is

The ATS is the recruiting side of the Arista platform. It has two faces in one React SPA:

1. **Public careers portal** (`/careers`, `/careers/:id`, `/careers/:id/apply`): job board, job detail, and a 3-step apply flow that uploads a PDF resume, has the backend AI-parse it, lets the applicant review the parsed data, then submits.
2. **Recruiter app** (`/ats/*`): Clients, Jobs (with pipeline board), Candidates (In Review / In Pipeline), Talent Pool, Hired, Permanently Ineligible, Calendar (interviews), Emails, Tags, Team, Settings (general, pipeline templates, email templates, rejection reasons), Account, Dashboard.

Hiring a candidate in the ATS provisions their CRM (VA) login on the backend, which is the hand-off point to the CRM app.

## A2. Stack and dependencies

| Area         | Choice                                                                                                                            |
| ------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| Framework    | React 19.2, TypeScript ~6.0 (strict **off**), Vite 8 with React Compiler (babel plugin)                                           |
| Routing      | react-router-dom 7, all pages imported eagerly (no code splitting)                                                                |
| State        | Zustand 5 (16 slices, 13 persisted to `localStorage`) + immer                                                                     |
| Data         | Custom fetch wrapper `lib/api-client.ts` with single-flight token refresh; "boot" loads every list with `limit: 9999` after login |
| Realtime     | socket.io-client 4.8 (`/ats` namespace)                                                                                           |
| UI           | Tailwind 4 + shadcn/ui on the unified `radix-ui` package, lucide icons, sonner toasts, vaul (unused)                              |
| Tables / DnD | TanStack Table 8, dnd-kit (pipeline board)                                                                                        |
| Forms        | react-hook-form + zod 4 (careers/quick-import); most other forms are hand-rolled `useState`                                       |
| Rich text    | TipTap 3 (editor), marked (markdown → HTML), DOMPurify (sanitize)                                                                 |
| Charts       | recharts 3.8                                                                                                                      |
| Docs         | docx-preview (resume viewer)                                                                                                      |
| Theming      | next-themes (light/dark), Inter variable font                                                                                     |

Dependency hygiene: `shadcn` (a CLI) sits in `devDependencies` here, which is correct; `vaul`/`ui/drawer.tsx` are unused; the build ships as **one 2.6 MB JS chunk** (`dist/assets/index-u4hgZwva.js`) [C-7]; `dist/` is committed next to source [C-27]. Full list in Part B · C §9.

## A3. Structure

```
ats/src
├── main.tsx, App.tsx, router.tsx, index.css
├── app/                 feature pages (Next.js-style folders: page.tsx, _components, _utils, _data)
│   ├── careers/         public portal
│   ├── auth/            login, forgot, reset, verify-email
│   ├── candidates/      table, 4.2k-line detail sheet, scorecards, quick import
│   ├── jobs/ clients/ talent-pool/ hired/ permanently-ineligible/
│   ├── calendar/ emails/ dashboard/ tags/ team/ settings/ home/
│   └── error.tsx, not-found.tsx, unauthorized/
├── components/          shared app components + components/ui (shadcn)
├── hooks/               permission, pagination, socket rooms, unread emails, interviewer options…
├── lib/                 api-client, boot-data, session-reset, activity-sentence (1.4k lines), timezones, html/markdown…
└── store/               slices/*.store.ts, types/*.types.ts, realtime/socket.ts
```

Observations on structure:

- The folder convention mimics Next.js (`page.tsx`, `'use client'` directives) inside a Vite SPA; several routed placeholder pages (`jobs/[id]`, `clients/new`, `team/[id]`, `candidates/[id]` …) are stubs never linked from the UI [A-29, B1-49].
- Two files dominate maintenance risk: `candidates/_components/candidate-detail-sheet.tsx` (4,229 lines) and `candidates-table.tsx` (2,754 lines), with three copies of the approve handlers and duplicated dialogs [A-30]. The repo's own `CLAUDE.md` asks for small components and DRY code; the code does not follow it.
- Complete annotated file tree with line counts: **§A9**.

## A4. Routes, roles and permissions

Full route map: Part B · C §3. Summary:

- **Public:** `/careers/*`, `/ats` (landing), `/ats/login|forgot-password|reset-password|verify-email/:token`.
- **Authenticated only (no role/permission guard):** dashboard, clients, jobs, candidates (+quick-import), talent pool, hired, calendar, account, tags, emails.
- **Role-guarded:** `permanently-ineligible`, `team`, `settings/disposition-reasons` → admin; `settings/general` → admin, hiring_manager, recruiter, coordinator.

**Roles** (from backend defaults): admin, hiring_manager, recruiter, coordinator, interviewer (ATS); account_manager, va, client (CRM). Backend permission model: `resource.{read,write,manage,schedule}` with hierarchy manage ⇒ write ⇒ read and schedule ⇒ write ⇒ read; admin bypasses everything.

**Where it goes wrong:**

- Three different gates disagree: the sidebar filters by **permission**, routes guard by **role**, and almost no buttons are gated at all. Users see actions that 403 (approve, hire, edit job, settings saves, tag delete…) [A-16, B1-11, B1-12, B1-14, B2-9, C-18].
- Team shows in the sidebar for every role with `team.read` (all four non-admin ATS roles) but the route is admin-only [B1-15, C-18]. The in-app Permission Guide contradicts the backend [B1-15].
- `usePermission` checks exact flags with no hierarchy, unlike the backend [B1-13].
- No `appAccess` check: a CRM-only user can sign into the ATS shell [C-5]. Interviewers land on a dashboard they cannot load [B2-9].

## A5. Connections to the backend

- **HTTP:** base `VITE_API_URL` (e.g. `…/api/v1`), JSON envelope `{success,data,message,meta}` / `{success:false,error:{code,message,details}}`. Access token in memory, refresh via httpOnly cookie `refreshTokenAts` (`POST /auth/refresh-token`). Every endpoint called, grouped by store, is in Part B · C §7 (plus per-area tables in A §7, B1 §7, B2 §7).
- **Boot:** after login every collection (candidates, applications, jobs, clients, users, interviews, tags, templates, emails, settings…) is fetched with `limit: 9999` and held in Zustand; later "unfiltered" fetches are no-ops, and filtered fetches _replace_ the shared list. This single design choice causes a family of stale/narrowed-list bugs [A-6, B1-2, B2-4, B2-15, C-12, C-13] and does not scale [C-8, B2-10].
- **Socket.IO `/ats`:** server auto-joins every user to all rooms and pushes full documents. The client emits `join:user`, `join:applications`, `join:room` that the server ignores; the server never emits `email:*` or `interview:deleted`, so those handlers are dead [C-3].
- **Contract mismatches found** (frontend ↔ backend):
  | Frontend | Backend | Effect |
  |---|---|---|
  | New Job sends `pipelineId` | schema expects `pipelineTemplateId` (stripped) | every job gets the default pipeline [B1-1] |
  | `POST /ats/emails/attachments` | route does not exist; send schema has no `attachments` | attachments always fail / silently dropped [B2-1] |
  | Emails search sends `search` | backend ignores it | search does nothing [B2-3] |
  | Template variables `candidatePhone`, `currentStage` | not in backend enum | template save 400 [B1-7] |
  | UI says resume "up to 10 MB", PDF only | parse endpoints 5 MB, accept DOCX | 6–9 MB files pass UI then fail [A-10] |
  | Invite acceptance uses `/auth/reset-password` | CRM uses `/auth/set-password` | two code paths with different side effects [B2-21] |
  | Apply page sends `resumeRawText` | backend trusts it over the file | AI scoring fed arbitrary text [A-2] |
- **External services:** none are called from the browser (the Inter font is bundled). Zoom, Resend, Cloudinary and AI are all reached through the backend; the browser only loads Cloudinary file URLs and meeting links.

## A6. Data model (frontend view)

Types live in `store/types/*.types.ts` and mirror backend models: Candidate (status pending/approved/hired, talent-pool flag, eligibility, parsedData, aiScore, aiValidation, legalHold), Application (phase pending/approved/hired/rejected, currentStage, disposition fields, aiScore), Job (status draft/open/on_hold/closed, embedded pipeline stages), Client (contacts, crmProfile, notes), Interview (type zoom/google_meet/phone/in_person, timezone, feedbacks, meetingDetails), InterviewScorecard (5 weighted categories), Email, EmailTemplate, PipelineTemplate, DispositionReason, Tag, User (roles, appAccess, permissions), ActivityLog, Settings. Full field reference: Part B · C §8. Enum and type duplication vs the backend is noted in [C-42].

## A7. UI/UX and styles — summary

- **Strengths:** consistent shadcn look, real light/dark theming, good boot/outage screen, rich activity timeline, careful timezone helpers, careers flow with parsing review.
- **Weaknesses:**
  - Stale-data UX: detail sheets act on snapshots (talent pool / legal hold toggles repeat the same action [A-3], notes saved to the wrong candidate [A-4], calendar sheet stale after actions [B2-6], edit sheets overwrite newer data [B1-3, B1-5]).
  - Mobile: jobs master/detail has no mobile layout, template sheets `w-[30vw]`, sheet close button off-screen, sidebar detaches above 1440px [B1-35, C-21, C-22].
  - Accessibility: rows not keyboard-openable, unlabeled icon buttons, labels not bound to inputs, nested interactive elements, no focus trap in resume viewer [A-26, B1-51, B2-25, C-23, C-33, C-34].
  - Styles: STYLE.md has drifted from `index.css` (token values, nav sections, radius, weights) [C-48]; hard-coded hex in dashboard and team screens; `--success/--warning` lack dark values [C-46, B2-39].
- Details: Part B · each area §4 and §5.

## A8. Consolidated issue list (ranked)

Totals in Part B: A 38 · B1 55 · B2 42 · C 50 = **185 findings**. The list below merges duplicates across areas and ranks the ones that matter most. Everything else is in Part B.

### Critical / High — security and privacy

1. **Bulk email exposes every candidate's address to every other candidate.** All selected candidates go into one `To:` list (`app/emails/_utils/candidate-compose.ts:52-53`; used from candidates, hired and talent pool). PII disclosure. [A-1, B2-2]
2. **PII persisted to `localStorage`.** Candidates, applications, interviews (incl. Zoom passwords), emails (full bodies), users, clients, activity logs survive reloads and only clear on explicit logout. [C-1]
3. **Socket pushes full candidate/client/interview documents to every ATS user**, regardless of permission (backend-side root cause; frontend applies them). [C-2]
4. **No `appAccess` gate** — CRM-only accounts can enter the ATS shell. [C-5]
5. **Applicant-controlled resume text** is sent back and trusted by the backend for AI validation/scoring. [A-2]
6. **Inbound email HTML** rendered in an iframe that still loads remote images/tracking pixels; links can't open. [B2-12]
7. **No security headers** on the Vercel deployment (CSP, frame-ancestors, Referrer-Policy). [C-26]

### High — broken features and data corruption

8. Job pipeline choice ignored on create (`pipelineId` vs `pipelineTemplateId`). [B1-1]
9. Email attachments cannot work (missing route + schema). [B2-1]
10. Store design narrows shared lists after any filtered fetch and never restores them (jobs, interviews, applications). [B1-2, A-6, B2-4, C-13]
11. Candidate detail sheet acts on a stale snapshot; second toggle repeats the action. [A-3]
12. Pipeline notes can be saved onto the wrong candidate. [A-4]
13. Edit Job sheet and Rejection Reason sheet open with stale/wrong data and overwrite on save. [B1-3, B1-5]
14. Tag bulk delete can delete tags the user never selected (row-index selection). [B1-6]
15. Editing an interview can silently shift its time (interview tz vs company tz). [B2-5]
16. Calendar status filter cannot return to "All". [B2-4]
17. Emails search input drops characters and the backend ignores the query. [B2-3]
18. `applications._patch` uses `??`, so fields cleared server-side (stage, disposition) never clear locally. [C-6]
19. Any refresh error on reload (network, 5xx, 429) logs the user out. [C-4]
20. Template variables offered by the picker are rejected by the backend. [B1-7]

### High — performance and type safety

21. Single 2.6 MB bundle shared by the public careers page. [C-7]
22. Boot loads entire collections; dashboard re-downloads five 9999-row lists on every visit and socket event. [C-8, B2-10]
23. TypeScript `strict` is off; many unchecked casts. [C-9]

### Medium — logic, permissions, UX (selected)

- Multi-job candidates: row/sheet actions always act on the first application; bulk reject ignores the job filter. [A-13]
- Quick Import is two non-atomic calls; failure leaves an "approved" candidate visible in no tab. [A-7, A-17]
- Hired candidates with a new pipeline lose pipeline controls in the sheet. [A-14]
- No permission gating on buttons anywhere except clients-table; hierarchy ignored. [A-16, B1-11..15, B2-9, C-18]
- Socket client bugs: duplicate sockets on reconnect, expired token reused, realtime silently stops. [C-10]
- Logout does not reset scorecards, disposition reasons, interviewer cache. [C-14]
- Application deadline enforced only on the job detail button. [A-9]
- Interview feedback impossible after "Mark as Complete"; destructive interview actions without confirmation. [B2-7, B2-8]
- Dashboard funnel mixes candidate and application units; "conversion" can exceed 100%. [B2-11, C-30]
- Pipeline board drag errors not handled or rolled back; rejected cards don't move. [B1-9, B1-10]
- Team delete is a hard delete with no self-protection. [B1-31]
- Optional job/client fields cannot be cleared on edit (undefined dropped). [B1-22]
- Client Notes tab can show another client's notes. [B1-24]
- Upload limits/types disagree between UI and backend. [A-10]

### Low — hygiene

Dead code (template `dashboard/data.json`, stub routes, unused drawer/vaul, `isLegacy`), heavy duplication (apply vs quick-import, three AssignJobDialogs, status maps), docs drift (STYLE.md, BUSINESS_LOGIC.md, prior UX audit's false `ui/command.tsx` claim), unguarded `localStorage`/`sessionStorage` access, date strings parsed as UTC. [A-29, A-30, B1-49, B1-50, B2-23, B2-41, C-38, C-39, C-48..50]

### Ambiguities that need an owner decision

- Can a candidate be in the Talent Pool and in a pipeline at the same time? Docs say both "independent flag" and "assigning takes them out of the pool". [A-15, A-36, B2-35]
- Where do `approved` candidates with no application belong? No defined home. [A-17]
- Which timezone should the calendar display: viewer, company or interview? [B2-20]
- Should salary, reason-for-leaving and CRM wellbeing flags be visible to interviewers? [B2-34]
- "Approve & Email" uses the `offer` template type for a pipeline approval. [A-15]

### Status of earlier audits

- `ATS-UI-UX-AUDIT.md`: still open UX-01, 05, 09, 13, 21, 22, 27, 36, 40, 46, 48, 49; partly fixed UX-04, UX-11; UX-10 fixed; UX-20's claim that `ui/command.tsx` exists is false. [C-50]
- `ATS-GUIDE-MAINTAINER-NOTES.md` (12 Oct): all seven "likely bugs" still present (pipeline ignored, 10 MB vs 5 MB, "Status: Pending" label, delete warnings that claim a cascade, complete-then-feedback order, Team link, ungated buttons).
- `AUDIT-2026-10-08.md` frontend items: logout now sends `app:'ats'` (H7 fixed, `auth.store.ts:128`); `localStorage` PII still open; Vercel headers still open.

---

## A9. File tree (line counts in parentheses)

```
ats/
├── dist/  (committed build output, 16 files — not expanded)
├── public/
│   ├── arista-ats.png  [108 KB]
│   ├── favicon.svg  [9 KB]
│   └── icons.svg  [4 KB]
├── src/
│   ├── app/
│   │   ├── auth/
│   │   │   ├── _components/
│   │   │   │   └── auth-background.tsx  (91)
│   │   │   ├── forgot-password/
│   │   │   │   └── page.tsx  (105)
│   │   │   ├── login/
│   │   │   │   └── page.tsx  (119)
│   │   │   ├── reset-password/
│   │   │   │   └── page.tsx  (184)
│   │   │   ├── verify-email/
│   │   │   │   └── page.tsx  (238)
│   │   │   └── layout.tsx  (22)
│   │   ├── calendar/
│   │   │   ├── _components/
│   │   │   │   ├── agenda-view.tsx  (211)
│   │   │   │   ├── calendar-header.tsx  (145)
│   │   │   │   ├── event-card.tsx  (39)
│   │   │   │   ├── event-sheet.tsx  (795)
│   │   │   │   ├── month-view.tsx  (151)
│   │   │   │   └── week-view.tsx  (113)
│   │   │   ├── _utils/
│   │   │   │   └── calendar-helpers.ts  (97)
│   │   │   └── page.tsx  (125)
│   │   ├── candidates/
│   │   │   ├── [id]/
│   │   │   │   └── page.tsx  (10)
│   │   │   ├── _components/
│   │   │   │   ├── candidate-detail-sheet.tsx  (4229)
│   │   │   │   ├── candidates-table.tsx  (2754)
│   │   │   │   ├── interview-scorecard-detail.tsx  (342)
│   │   │   │   ├── interview-scorecard-form.tsx  (1001)
│   │   │   │   └── interview-scorecard-history.tsx  (171)
│   │   │   ├── _utils/
│   │   │   │   └── candidate-styles.ts  (102)
│   │   │   ├── new/
│   │   │   │   └── page.tsx  (5)
│   │   │   ├── quick-import/
│   │   │   │   └── page.tsx  (1371)
│   │   │   └── page.tsx  (52)
│   │   ├── careers/
│   │   │   ├── [id]/
│   │   │   │   ├── apply/
│   │   │   │   │   └── page.tsx  (1467)
│   │   │   │   └── page.tsx  (317)
│   │   │   ├── _components/
│   │   │   │   ├── apply-stepper.tsx  (41)
│   │   │   │   ├── careers-doodles.tsx  (50)
│   │   │   │   ├── job-closed-notice.tsx  (28)
│   │   │   │   ├── job-facts.tsx  (22)
│   │   │   │   └── section-nav.tsx  (62)
│   │   │   └── page.tsx  (206)
│   │   ├── clients/
│   │   │   ├── [id]/
│   │   │   │   └── page.tsx  (10)
│   │   │   ├── _components/
│   │   │   │   ├── client-detail-sheet.tsx  (1957)
│   │   │   │   ├── clients-table.tsx  (998)
│   │   │   │   └── new-client-sheet.tsx  (597)
│   │   │   ├── new/
│   │   │   │   └── page.tsx  (7)
│   │   │   └── page.tsx  (9)
│   │   ├── dashboard/
│   │   │   ├── _components/
│   │   │   │   ├── dash-applied-chart.tsx  (207)
│   │   │   │   ├── dash-funnel.tsx  (211)
│   │   │   │   ├── dash-hiring-trend.tsx  (171)
│   │   │   │   └── dash-metric-cards.tsx  (340)
│   │   │   ├── data.json  (614)
│   │   │   └── page.tsx  (79)
│   │   ├── emails/
│   │   │   ├── [id]/
│   │   │   │   └── page.tsx  (406)
│   │   │   ├── _components/
│   │   │   │   ├── compose-email-sheet.tsx  (462)
│   │   │   │   ├── email-detail-sheet.tsx  (462)
│   │   │   │   ├── emails-list.tsx  (850)
│   │   │   │   └── template-selector.tsx  (296)
│   │   │   ├── _utils/
│   │   │   │   └── candidate-compose.ts  (72)
│   │   │   └── page.tsx  (9)
│   │   ├── hired/
│   │   │   ├── _components/
│   │   │   │   └── hired-table.tsx  (1049)
│   │   │   └── page.tsx  (18)
│   │   ├── home/
│   │   │   ├── _components/
│   │   │   │   ├── home-background.tsx  (130)
│   │   │   │   ├── home-hero.tsx  (66)
│   │   │   │   └── home-topbar.tsx  (31)
│   │   │   └── page.tsx  (30)
│   │   ├── jobs/
│   │   │   ├── [id]/
│   │   │   │   └── page.tsx  (12)
│   │   │   ├── _components/
│   │   │   │   ├── assign-candidate-dialog.tsx  (210)
│   │   │   │   ├── job-candidates.tsx  (492)
│   │   │   │   ├── job-list.tsx  (452)
│   │   │   │   ├── job-panel.tsx  (779)
│   │   │   │   ├── job-pipeline-board.tsx  (587)
│   │   │   │   ├── new-job-sheet.tsx  (1235)
│   │   │   │   └── pipeline-change-dialog.tsx  (346)
│   │   │   ├── new/
│   │   │   │   └── page.tsx  (7)
│   │   │   └── page.tsx  (143)
│   │   ├── permanently-ineligible/
│   │   │   ├── _components/
│   │   │   │   └── permanently-ineligible-table.tsx  (608)
│   │   │   └── page.tsx  (18)
│   │   ├── settings/
│   │   │   ├── _components/
│   │   │   │   ├── email-template-sheet.tsx  (280)
│   │   │   │   ├── email-template-view-dialog.tsx  (159)
│   │   │   │   ├── pipeline-template-sheet.tsx  (477)
│   │   │   │   └── pipeline-template-view-dialog.tsx  (181)
│   │   │   ├── _data/
│   │   │   │   └── settings.ts  (145)
│   │   │   ├── account/
│   │   │   │   └── page.tsx  (674)
│   │   │   ├── disposition-reasons/
│   │   │   │   └── page.tsx  (624)
│   │   │   └── general/
│   │   │       └── page.tsx  (1223)
│   │   ├── tags/
│   │   │   ├── _components/
│   │   │   │   ├── tag-badge.tsx  (24)
│   │   │   │   ├── tag-form-sheet.tsx  (157)
│   │   │   │   └── tags-table.tsx  (574)
│   │   │   ├── _data/
│   │   │   │   └── tags.ts  (26)
│   │   │   └── page.tsx  (9)
│   │   ├── talent-pool/
│   │   │   ├── _components/
│   │   │   │   ├── talent-pool-detail-sheet.tsx  (1121)
│   │   │   │   └── talent-pool-table.tsx  (1095)
│   │   │   └── page.tsx  (19)
│   │   ├── team/
│   │   │   ├── [id]/
│   │   │   │   └── page.tsx  (10)
│   │   │   ├── _components/
│   │   │   │   ├── invite-team-sheet.tsx  (185)
│   │   │   │   ├── permission-guide-dialog.tsx  (447)
│   │   │   │   ├── team-member-edit-sheet.tsx  (198)
│   │   │   │   ├── team-member-sheet.tsx  (331)
│   │   │   │   └── team-table.tsx  (807)
│   │   │   ├── _data/
│   │   │   │   └── team.ts  (23)
│   │   │   └── page.tsx  (28)
│   │   ├── unauthorized/
│   │   │   └── page.tsx  (40)
│   │   ├── error.tsx  (23)
│   │   └── not-found.tsx  (11)
│   ├── components/
│   │   ├── auth/
│   │   │   ├── protected-route.tsx  (63)
│   │   │   └── role-guard.tsx  (19)
│   │   ├── ui/
│   │   │   ├── avatar.tsx  (112)
│   │   │   ├── badge.tsx  (49)
│   │   │   ├── button.tsx  (67)
│   │   │   ├── card.tsx  (103)
│   │   │   ├── chart.tsx  (373)
│   │   │   ├── checkbox.tsx  (31)
│   │   │   ├── collapsible.tsx  (22)
│   │   │   ├── dialog.tsx  (163)
│   │   │   ├── drawer.tsx  (129)
│   │   │   ├── dropdown-menu.tsx  (273)
│   │   │   ├── input.tsx  (19)
│   │   │   ├── label.tsx  (22)
│   │   │   ├── popover.tsx  (65)
│   │   │   ├── select.tsx  (190)
│   │   │   ├── separator.tsx  (26)
│   │   │   ├── sheet.tsx  (143)
│   │   │   ├── sidebar.tsx  (702)
│   │   │   ├── skeleton.tsx  (13)
│   │   │   ├── sonner.tsx  (47)
│   │   │   ├── switch.tsx  (32)
│   │   │   ├── table.tsx  (114)
│   │   │   ├── tabs.tsx  (98)
│   │   │   ├── textarea.tsx  (19)
│   │   │   ├── toggle-group.tsx  (87)
│   │   │   ├── toggle.tsx  (47)
│   │   │   └── tooltip.tsx  (57)
│   │   ├── activity-timeline.tsx  (691)
│   │   ├── app-loader.tsx  (9)
│   │   ├── app-sidebar.tsx  (144)
│   │   ├── change-job-dialog.tsx  (272)
│   │   ├── confirm-dialog.tsx  (93)
│   │   ├── layout.tsx  (38)
│   │   ├── nav-group.tsx  (53)
│   │   ├── nav-main.tsx  (127)
│   │   ├── nav-user.tsx  (119)
│   │   ├── portfolio-section.tsx  (102)
│   │   ├── public-shell.tsx  (31)
│   │   ├── recipient-field.tsx  (156)
│   │   ├── reject-dialog.tsx  (393)
│   │   ├── restore-candidate-dialog.tsx  (215)
│   │   ├── resume-viewer.tsx  (293)
│   │   ├── rich-text-editor.tsx  (353)
│   │   ├── rich-text.tsx  (65)
│   │   ├── schedule-interview-dialog.tsx  (538)
│   │   ├── sidebar-error-boundary.tsx  (36)
│   │   ├── site-header.tsx  (32)
│   │   ├── table-pagination.tsx  (223)
│   │   ├── tag-list.tsx  (98)
│   │   ├── tags-selector.tsx  (183)
│   │   ├── timezone-select.tsx  (75)
│   │   └── unread-emails-toast.tsx  (36)
│   ├── hooks/
│   │   ├── use-activity-actors.ts  (147)
│   │   ├── use-candidate-email-activity.ts  (79)
│   │   ├── use-interviewer-options.ts  (112)
│   │   ├── use-mobile.ts  (32)
│   │   ├── use-permission.ts  (24)
│   │   ├── use-search-with-page-restore.ts  (57)
│   │   ├── use-socket-room.ts  (36)
│   │   ├── use-table-pagination.ts  (170)
│   │   └── use-unread-emails.ts  (73)
│   ├── lib/
│   │   ├── activity-sentence.ts  (1865)
│   │   ├── activity.ts  (39)
│   │   ├── api-client.ts  (327)
│   │   ├── boot-data.ts  (123)
│   │   ├── download.ts  (55)
│   │   ├── html.ts  (167)
│   │   ├── job-format.ts  (147)
│   │   ├── markdown.ts  (33)
│   │   ├── public-api.ts  (25)
│   │   ├── recipients.ts  (13)
│   │   ├── session-reset.ts  (104)
│   │   ├── tags.ts  (73)
│   │   ├── timezones.ts  (371)
│   │   └── utils.ts  (74)
│   ├── store/
│   │   ├── realtime/
│   │   │   └── socket.ts  (317)
│   │   ├── slices/
│   │   │   ├── activity-logs.store.ts  (201)
│   │   │   ├── applications.store.ts  (456)
│   │   │   ├── auth.store.ts  (262)
│   │   │   ├── boot.store.ts  (38)
│   │   │   ├── candidates.store.ts  (591)
│   │   │   ├── clients.store.ts  (531)
│   │   │   ├── dashboard.store.ts  (659)
│   │   │   ├── disposition-reasons.store.ts  (85)
│   │   │   ├── email-templates.store.ts  (194)
│   │   │   ├── emails.store.ts  (287)
│   │   │   ├── interview-scorecards.store.ts  (150)
│   │   │   ├── interviews.store.ts  (431)
│   │   │   ├── jobs.store.ts  (336)
│   │   │   ├── pipeline-templates.store.ts  (236)
│   │   │   ├── settings.store.ts  (92)
│   │   │   ├── tags.store.ts  (152)
│   │   │   └── users.store.ts  (388)
│   │   ├── types/
│   │   │   ├── activity-log.types.ts  (70)
│   │   │   ├── application.types.ts  (66)
│   │   │   ├── candidate.types.ts  (145)
│   │   │   ├── client.types.ts  (107)
│   │   │   ├── common.ts  (34)
│   │   │   ├── email-template.types.ts  (38)
│   │   │   ├── email.types.ts  (71)
│   │   │   ├── enums.ts  (250)
│   │   │   ├── index.ts  (14)
│   │   │   ├── interview-scorecard.types.ts  (244)
│   │   │   ├── interview.types.ts  (108)
│   │   │   ├── job.types.ts  (120)
│   │   │   ├── pipeline-template.types.ts  (29)
│   │   │   ├── settings.types.ts  (35)
│   │   │   ├── tag.types.ts  (29)
│   │   │   └── user.types.ts  (81)
│   │   └── index.ts  (22)
│   ├── App.tsx  (6)
│   ├── index.css  (397)
│   ├── main.tsx  (65)
│   └── router.tsx  (155)
├── ATS-UI-UX-AUDIT.md  (2294)
├── BUSINESS_LOGIC.md  (615)
├── CLAUDE.md  (11)
├── components.json  (25)
├── eslint.config.js  (42)
├── index.html  (13)
├── package.json  (71)
├── pnpm-lock.yaml  [273 KB]
├── README.md  (41)
├── STYLE.md  (564)
├── tsconfig.app.json  (28)
├── tsconfig.json  (14)
├── tsconfig.node.json  (24)
├── vercel.json  (3)
└── vite.config.ts  (23)
```

---

# Part B — Detailed audit by area

## Area A — Candidates and public careers (`src/app/candidates/**`, `src/app/careers/**`)

Auditor A. Strictly read-only. Paths are relative to `ats/` unless they start with `backend/`. Line refs are `path:line`.

---

### 1. Scope covered (every file read top to bottom)

| File                                                            | Lines                           |
| --------------------------------------------------------------- | ------------------------------- |
| src/app/candidates/page.tsx                                     | 52                              |
| src/app/candidates/new/page.tsx                                 | 5                               |
| src/app/candidates/[id]/page.tsx                                | 10                              |
| src/app/candidates/\_utils/candidate-styles.ts                  | 102                             |
| src/app/candidates/quick-import/page.tsx                        | 1371                            |
| src/app/candidates/\_components/candidates-table.tsx            | 2754 (100 KB, read in 4 chunks) |
| src/app/candidates/\_components/candidate-detail-sheet.tsx      | 4229 (160 KB, read in 7 chunks) |
| src/app/candidates/\_components/interview-scorecard-form.tsx    | 1001                            |
| src/app/candidates/\_components/interview-scorecard-detail.tsx  | 342                             |
| src/app/candidates/\_components/interview-scorecard-history.tsx | 171                             |
| src/app/careers/page.tsx                                        | 206                             |
| src/app/careers/[id]/page.tsx                                   | 317                             |
| src/app/careers/[id]/apply/page.tsx                             | 1467                            |
| src/app/careers/\_components/apply-stepper.tsx                  | 41                              |
| src/app/careers/\_components/careers-doodles.tsx                | 50                              |
| src/app/careers/\_components/job-closed-notice.tsx              | 28                              |
| src/app/careers/\_components/job-facts.tsx                      | 22                              |
| src/app/careers/\_components/section-nav.tsx                    | 62                              |
| BUSINESS_LOGIC.md (whole doc)                                   | 615                             |

Total: 12,230 lines of scope code plus the 615-line doc.

I also read these outside scope to confirm how things connect: `src/router.tsx:30-130`, `src/lib/public-api.ts`, `src/hooks/use-permission.ts`, `src/app/emails/_utils/candidate-compose.ts`, `src/store/slices/candidates.store.ts:100-175`, `src/store/slices/jobs.store.ts:80-140`, `src/store/slices/interviews.store.ts:95-160,262-290`, `src/store/slices/interview-scorecards.store.ts:1-66`, `backend/src/shared/middleware/upload.ts:1-125`, `backend/src/features/jobs/job.controller.ts:100-200`, `backend/src/features/jobs/job.routes.ts:195-225`, `backend/src/features/candidates/candidate.routes.ts:170-420`, `backend/src/features/candidates/candidate.controller.ts:151-159`.

---

### 2. What each file does

#### candidates/

- **page.tsx**: the `/ats/candidates` route. It reads `?jobId=`. If set, it calls `useJobStore.fetch({page:1,limit:9999})` (page.tsx:18-20); after boot that call does nothing because it has no filter. It shows a "Filtered by job" banner with a clear button (page.tsx:26-40), then renders `<CandidatesTable/>`. The comment at page.tsx:17 says "Candidate fetching is handled server-side inside CandidatesTable", but the table filters entirely on the client (candidates-table.tsx:1630-1631, 1866-1867). The comment is stale.
- **new/page.tsx**: redirects to `/ats/candidates/quick-import`. It is **not routed** in `router.tsx` (grep finds no `CandidateNewPage` import), so it is dead code.
- **[id]/page.tsx**: a stub page that shows only `Candidate #{id}` (lines 6-8). It **is routed** (`router.tsx` `candidates/:id`), so a reachable placeholder page has shipped.
- **\_utils/candidate-styles.ts**: `AVATAR_BG`/`avatarBg(name)` (line 16-18; it crashes on an empty name because `charCodeAt(0)` returns NaN and the index is undefined, which gives `undefined` classes, harmless), `statusConfig` for CandidateStatus (used only by `jobs/_components/assign-candidate-dialog.tsx`), `fitConfig` + `getFitConfig`, `phaseConfig` for ApplicationPhase, `scoreBarColor`/`scoreTextColor`. These are shared with jobs, talent-pool, activity-timeline and hired.
- **quick-import/page.tsx**: an internal 4-step importer (input, parsing, review, importing). The step-1 RHF+zod form (lines 74-97) requires firstName, lastName, email, phone, yearsOfExperience, jobId, englishProficiency and cityOfResidence; salaries, reasonForLeaving and videoIntroUrl are optional. `JobSearchSelect` (351-484) is a hand-rolled popover combobox. Parsing calls `POST /ats/candidates/public/parse` (1165-1168). Import calls `POST /ats/candidates` (multipart) **then** `POST /ats/candidates/:id/assign-job` (1255-1262). `TagsInput`, `ExperienceEditor` and `EducationEditor` are local copies.
- **\_components/candidates-table.tsx**: the main list (TanStack table) with two tabs, "In Review" (`pending`) and "In Pipeline" (`approved`), at 1537 and 2424-2439. It exports `ColHeader`, `SortHeader`, `CandidateCell`, `AiScoreCell` and `TableSkeleton`, which hired, talent-pool and permanently-ineligible tables reuse. Its row menus are `ReviewActionsDropdown` (522-878) and `PipelineActionsMenu` (880-1530). There are bulk actions (2029-2170), a cell that changes stage inline (`PipelineStageSelectCell`, 451-520), a concurrency helper `runAllWithConcurrency` (127-149, limit 8) and the detail sheet mount (2743-2751).
- **\_components/candidate-detail-sheet.tsx**: the right-side Sheet that holds the whole candidate profile. Sub-components: `IntroVideo` (150-198), `InterviewCompleteFeedbackForm` (200-386), `RescheduleDialog`/`RescheduleForm` (388-511), `PipelineProgressBar` (513-612), `EnglishProficiencyBadge`, `ExperienceTimeline`, `EducationList`, `TalentPoolDialog` (716-761), `ApplicationCard` (763-953), `PendingActionsToolbar` (973-1075), `IneligibleActions` (1093-1144), `CandidateCrmButton` (1149-1204), `RejectionHistory` (1261-1440), and the main `CandidateDetailSheet` (1442-4229). The footer switches between 4 modes: ineligible, pending, approved, hired (3431-3693).
- **\_components/interview-scorecard-form.tsx**: a Sheet with an RHF+zod form covering 5 rating categories plus notes plus a required `finalRecommendation`. It shows a live preview through `computeScorecardPreview` (303-320). Create posts `candidateId` and `jobId`; update cannot change the job. `interviewType` is hard-coded to `'initial_screening'` (325).
- **\_components/interview-scorecard-detail.tsx**: a read-only Dialog for one scorecard, with category blocks and notes and an Edit button.
- **\_components/interview-scorecard-history.tsx**: lists `useInterviewScorecardStore.items` as clickable cards and opens the detail Dialog. It **ignores its `candidateId` prop** (36-41).

#### careers/

- **page.tsx**: the public job list. It calls `publicApi.get('/ats/jobs',{status:'open',limit:9999})` (38-41), filters by title and location on the client, syncs `?q=` to the URL (72-78), sorts newest first, and renders `JobCard` (169-196) with an excerpt that `DOMParser` strips to plain text (16-23). It has a loading skeleton, an error notice and an empty notice.
- **[id]/page.tsx**: the public job detail. It calls `GET /ats/jobs/:id` and shows `JobClosedNotice` when status is not `open` (83). It renders facts (salary, type, mode, experience, deadline), a sticky `SectionNav`, rich-text description, bullet and check lists, and an Apply button. Apply is disabled when the deadline has passed (`formatDeadline(...).destructive`, 85-88). On mobile the Apply bar is fixed to the bottom (220-222).
- **[id]/apply/page.tsx**: the public apply wizard (`input → parsing → review → submitting → success`). The zod schema is at 80-103 (video intro required, portfolio optional). Step 1 calls `POST /ats/candidates/public/upload-and-parse` (1202-1205). Final submit calls `POST /ats/jobs/:id/apply` with the file, the parsed data the candidate edited, `resumeRawText`, and an optional portfolio file (1247-1296).
- **\_components/apply-stepper.tsx**: 3 steps, "Your details / Review / Submit". The "Submit" step never becomes active, because the page passes only 0 or 1 (apply/page.tsx:1398).
- **\_components/careers-doodles.tsx**: decorative SVGs, `aria-hidden`, shown only at `lg` and up.
- **\_components/job-closed-notice.tsx**: a card that links to `/careers`.
- **\_components/job-facts.tsx**: a `<dl>` grid.
- **\_components/section-nav.tsx**: a scroll-spy nav. It uses `Array.prototype.findLast` (21), which needs ES2023 or a polyfill on older Safari (inferred).

---

### 3. Features and user flows

#### 3.1 Public apply (careers)

1. `/careers` loads open jobs anonymously. `publicApi` reuses `getJson`, which attaches the token only if one is present (`lib/public-api.ts:3-19`). A logged-in staff member therefore gets full job objects.
2. `/careers/:id`: if the job is not open, the closed notice shows. If the deadline has passed, the Apply button is disabled ([id]/page.tsx:88, 260).
3. `/careers/:id/apply` loads the job again. If it is closed, the closed notice shows (apply/page.tsx:1331). The deadline is **not** checked here (see Issue 9).
4. The user fills the form. Resume drag/drop or picker is checked on the client as `application/pdf` only (432-441). Portfolio accepts PDF, ZIP and images (444-470). The submit button is disabled until `isValid && resumeFile` (425).
5. On submit, the page builds FormData and calls `POST /ats/candidates/public/upload-and-parse` (stateless, no DB write). On success it moves to the Review step and fills it with the AI `parsedData`. If the server error text matches `/image-based|scanned|text-based PDF/`, it holds the spinner for at least 1.2 s, clears the file and shows an inline error (1226-1240). Any other error shows a toast.
6. Review: the user edits summary, skills, languages, certifications, experience and education.
7. Submit: `POST /ats/jobs/:id/apply` with all fields again, plus `resumeOriginalName`, `resumeRawText` (from the parse step), `parsedData` as JSON, the resume `file` and the optional `portfolioFile` (1252-1290). Success shows the success screen. The backend may answer `{blocked:true}` for a banned candidate (BUSINESS_LOGIC.md:302). The UI ignores the body and shows the same success screen, which is intended to stay silent (inferred).
8. Per the backend and the doc, no application is created here. The candidate is created or refreshed as `pending` with `appliedJobId` (BUSINESS_LOGIC.md:296-305).

#### 3.2 Internal Quick Import

1. "Add Candidate" (candidates-table.tsx:2505-2510) leads to `/ats/candidates/quick-import`, optionally with `?jobId=`.
2. On mount, the page calls `fetchJobs({status:'open',limit:9999})`. This **replaces** the global job store (see Issue 6), and calls `fetchClients` if the client list is empty (1091-1094).
3. The user fills the form, picks a job and a PDF, then clicks "Upload & Parse". The page calls `POST /ats/candidates/public/parse` with only the file (1159-1168).
4. Review and edit, then "Import Candidate". The page calls `POST /ats/candidates` (multipart, `candidates.write`) and then `POST /ats/candidates/:id/assign-job {jobId}` (1255-1262). The form resets and stays on the page.
5. Per the doc, the result is status `approved`, source `internal_upload`, and then an `assigned` application at the first stage (BUSINESS_LOGIC.md:307-309, 334).

#### 3.3 Candidates table: In Review tab

- Membership is `status==='pending' && !inTalentPool && eligibility!=='permanently_ineligible'` (1818-1824), which matches the doc's IN REVIEW definition (BUSINESS_LOGIC.md:311).
- Row menu `ReviewActionsDropdown`:
  - **Approve**: if `appliedJobId` is set, it approves into that job. Otherwise the user picks an open job. Calls `candStore.approve(id, jobId)`, then `appStore.fetchScopedMerge({limit:9999})` (598-607).
  - **Reject**: if the candidate has a live application, it calls `appStore.reject(appId)`. Otherwise it calls `candStore.rejectCandidate` with reason, destination and notes (628-657).
  - **Add/Remove Talent Pool**: `candStore.updateTalentPool` (659-676).
  - **Email**: opens ComposeEmailSheet with a prefilled `general` email (779-802).
- Clicking a row opens the detail sheet (2633, 1762-1765).

#### 3.4 Candidates table: In Pipeline tab

- Membership is "has an application with `phase==='approved'`" (1771-1777). A fallback heuristic is at 1788-1806 (see Issue 17).
- Inline stage select per row calls `appStore.moveStage` (467-478).
- `PipelineActionsMenu` acts on **`candidateApps[0]`**, the first approved application (919). Its actions are Move Stage, Hire (then `candStore.fetch()`, 1051), Schedule Interview (`interviewStore.createForApplication` with the time interpreted in the company timezone, 1145-1184), Reject (`appStore.reject`), Email, Change Job (`candStore.changeJob`, then `fetchScopedMerge`), Add to Another Job (`candStore.assignJob`, then `fetchScopedMerge`), and Talent Pool toggle (with a confirm dialog).

#### 3.5 Bulk actions (both tabs)

Selection covers **all filtered rows across every page** (1975-1982). The selection clears when the tab, the `jobId` filter or the search query changes (1990-1992). Actions:

- Move to Stage (pipeline tab only): the options come from the first selected candidate's pipeline (1996-2000). Candidates in other pipelines fail with "Stage not available" (2152-2154).
- Reject: goes per candidate to the application endpoint or the candidate endpoint (2100-2143).
- Remove from Job → Talent Pool (pipeline tab only): `appStore.moveToTalentPool` on the application for the filtered job, or else the stage application, or else the first live one (2056-2086).
- Add to Talent Pool: `updateTalentPool(id,'add')` for each candidate (2029-2046).
- Email: one compose with every address in **To** (2011-2027, `emails/_utils/candidate-compose.ts:51-53`).

#### 3.6 Detail sheet flows

- Pending footer: Approve / Approve & Email / Approve, Email & Talent Pool / Email / Add to Talent Pool / Reject & Email / Reject (973-1075, 3439-3461). Each Approve variant opens a ConfirmDialog with a job picker when `appliedJobId` is missing (3705-3912). The & Email variants open the composer afterwards with template type `offer` (approve) or `rejection` (3941-3954).
- Approved footer: Move Stage / Schedule Interview / Hire / Email / Pool toggle / Change Job / Add to Another Job / Reject (3462-3609).
- Hired footer: Email / Pool / `CandidateCrmButton` (provision VA via `useUserStore.provisionVA`) / Add to Another Job (3610-3665).
- Ineligible footer (meant for admins): Legal hold toggle (`PATCH /ats/candidates/:id/legal-hold` directly through `patchJson`, 1683), Restore (`candStore.restoreCandidate(id,{jobId})`, 1642), Delete permanently (`candStore.remove`, 1667).
- Body: AI validation (pending only) or AI evaluation (approved only), summary, skills, languages, certifications, experience, education, additional info, application cards (each with an activity timeline for that application), interviews (with complete+feedback, reschedule, cancel), interview scorecards, pipeline notes (`appStore.updateNotes`), hired applications, resume viewer, intro video, portfolio, legacy CRM profile, candidate activity timeline (merged with email activity) and "Transition History" (`GET /shared/activity-logs/candidate/:id?includeRelated=true&limit=100`, 1292-1294).
- Every mutation also calls `logOptimisticActivity(...)` for an instant timeline row.

#### 3.7 Interview scorecards

Shown only when `c.status==='approved'` (2875, 3116-3166). The fetch happens on open only for approved candidates (2119-2123, `GET /ats/interview-scorecards?candidateId=&limit=100`). Add or edit opens a Sheet form. Create calls `scorecardStore.create`, edit calls `scorecardStore.update`. `onCreated` fetches again.

---

### 4. UI/UX observations

- Layout: the table page uses `flex-1 min-h-0` with a sticky header and an inner scroll area (2593-2667). Pagination sits at the bottom. The detail sheet is `w-full sm:w-[68vw] min-w-95` (2412). The scorecard form opens as a **second Sheet on top of the first** (scorecard-form 383-386), even though the detail file chose a Dialog to avoid nesting (scorecard-detail 172-178).
- Loading states: the table shows a skeleton when `loading && data.length===0`, plus a "Refreshing…" label (2519-2523, 2622-2623). The sheet shows an applications skeleton while `appLoading` (2838-2843). Scorecard history has a skeleton. Careers pages have skeletons.
- Empty states: "No candidates found." (2651); "No applications yet." (2846); interviews and scorecards have their own; careers has both a no-match and a no-jobs message.
- Error states: almost everything uses toasts. Careers shows inline error notices. `RejectionHistory` fails silently (1302-1305).
- Accessibility:
  - Table rows open the sheet with `onClick` only. There is no keyboard path (no tabIndex, no role, no Enter handler) at candidates-table.tsx:2626-2633.
  - The search `Input` has only a placeholder and no label (2447-2452). The careers search does have `aria-label` (careers/page.tsx:111).
  - The resume dropzones are `role="button" tabIndex=0` and react to Enter only, not Space (apply 652-654, quick-import 711-713).
  - The remove-file X buttons have no `aria-label` (apply 666-675, 763-772; quick-import 725-734; TagsInput remove button apply 160-166 / quick-import 156-162).
  - In `JobSearchSelect` the clear control is a `<span role="button">` inside a `<button>`, so interactive elements are nested and the clear cannot be reached by keyboard (quick-import 413-421).
  - `Field` labels have no `htmlFor`, so labels are not associated with inputs in apply, quick-import or the scorecard form.
  - `DialogDescription` (renders `<p>`) wraps `<p>` children, which is invalid nesting (detail-sheet 4196-4206).
  - The disabled "Add to Another Job" button sits in a focusable span so its tooltip works (3566-3591). That part is fine.
- Dark mode: mostly token-based, but some colors are hard-coded with no dark variant. The careers amber warning `border-amber-300 bg-amber-50 text-amber-900` (apply 698) has no dark variant; careers pages are always the dark `bg-careers` theme, while the cards are `careers-card` (custom). The quick-import warning does have dark variants (757). Hex colors `#16a34a`, `#69c58a`, `#3d8a5a` appear in candidate-styles.ts:34,82 and detail-sheet 2549, 2644, 2653, 3262.
- Consistency:
  - The Pipeline Notes control is a raw `<textarea>` with copied shadcn classes instead of `<Textarea>` (3177-3187).
  - Text sizes run from 9px to 11px (`text-[9px]`, `text-[10px]`, `text-[11px]`) all over the table and sheet.
  - The status shown in quick-import says "Pending" at step 1 (793) and "Active" at review (1016). Per the doc, the real status is `approved` (BUSINESS_LOGIC.md:308).
  - Scorecard history resolves interviewer names with the ATS-interviewer list, while the form lets the user pick any non-client/VA user, account managers included (form 199-207). A scorecard by an account manager would show "Unknown" interviewer (history 55-58, sheet passes `users` from `useInterviewerOptions`, 3132-3136).
- The bulk bar's Reject and Move to Stage buttons are not disabled while `bulkActing` (2534-2551), though Talent Pool and Remove from Job are.
- After a pending approve whose `appliedJobId` points to a job that is now closed or draft, the dialog shows only that job's title. The user cannot pick another job (3754-3755, 3823-3824), so approve can only fail on the server (BUSINESS_LOGIC.md:313).
- The Reschedule dialog gets `loading={actionLoading}`, but the reschedule handler never sets `actionLoading` and has no try/catch (3975-4005). The button never shows "Saving…", double-submits are possible, and a rejected promise goes unhandled. The store toasts, which hides the problem.

---

### 5. Styles

- The UI is Tailwind v4 with shadcn primitives: Button, Badge, Dialog, Sheet, Select, Tabs, Tooltip, DropdownMenu, Checkbox, ToggleGroup, Popover, Card, Skeleton, Table, Separator, Textarea, Input, Label. It uses v4 syntax such as `wrap-break-word`, `bg-linear-to-b`, `max-w-none!`, `size-*`, `has-aria-expanded:`, `*:data-[slot=...]` (candidates-table.tsx:493).
- Custom tokens: `pine-teal-*`, `silver-200`, `text-warning`, `careers`, `careers-accent`, `careers-card`, `font-heading`, `min-w-35`/`max-w-55`/`min-w-95` (custom spacing scale).
- Inline `style` is used for dynamic stage colors (`backgroundColor: s.color`) and for score bar widths.
- Very long className strings are inline (candidates-table.tsx:493, 497). The pending-toolbar emerald button class is copied 3 times (detail-sheet 999, 1009, 1020) plus a fourth near-copy on Hire (3508).
- The score color scale is implemented twice: `scoreBarColor`/`scoreTextColor` in candidate-styles.ts:90-102, and a separate inline ternary in `AiScoreCell` (candidates-table.tsx:303-309) that uses green/amber/orange/red instead of pine-teal.
- `PROFICIENCY_STYLE`/`PROFICIENCY_LABEL` (detail-sheet 622-641) duplicate the english-proficiency option labels found in apply 549-559 and quick-import 608-618.

---

### 6. Roles and permissions

- **No permission or role checks exist anywhere in `src/app/candidates/**`.** No file in scope imports `usePermission`or`useAuthStore().user.roles`for gating. The only`useAuthStore`uses read`senderName` or the default interviewer.
- `router.tsx` puts `candidates`, `candidates/quick-import` and `candidates/:id` under `ProtectedRoute` only, with no `RoleGuard` (router.tsx:82-87). The sidebar hides the Candidates link without `candidates.read` (`components/app-sidebar.tsx:94`), but a direct URL still works.
- Consequences per the default RBAC matrix (BUSINESS_LOGIC.md:255): an **interviewer** (`candidates: read`) and a **coordinator** (`candidates: write`, not manage) see every action. Interviewers see Approve, Reject, Hire, Change Job, Add Candidate, bulk actions and Legal Hold. Hiring_manager, recruiter and coordinator users see Restore/Delete if they ever load an ineligible candidate. The backend refuses with 403 (`candidate.routes.ts` uses `requirePermission('candidates','write')` and `requireRoles('admin')` on eligibility/restore/legal-hold), so the result is a failed toast, not a privilege escalation.
- `CandidateCrmButton` (detail-sheet 1149-1204) is shown to anyone looking at a hired candidate. VA provisioning is admin-only per the doc (BUSINESS_LOGIC.md:428).
- `InterviewCompleteFeedbackForm` is shown on every `scheduled` interview for any viewer (detail-sheet 3041-3105). The backend accepts feedback only from an assigned interviewer, once (BUSINESS_LOGIC.md:388). The UI does not check `iv.interviewerIds.includes(currentUser._id)` or whether feedback already exists.
- The scorecard Edit button is shown for every scorecard regardless of author (scorecard-history 160-167, scorecard-detail 421-425). The rule for who may edit is not documented; the doc says only `interviewScorecards: write` (BUSINESS_LOGIC.md:258). This is ambiguous.
- Admin-only data: ineligible candidates reach this sheet only because the backend serves them to admins (BUSINESS_LOGIC.md:359). The sheet has no client-side admin guard of its own (3431-3438).

---

### 7. Connections (endpoints called in scope)

| Method + path                                                                                                                                                                              | Caller                                                                                | Auth/guard (backend)                                                     | Request → response                                                                                                                              |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| GET `/ats/jobs?status=open&limit=9999`                                                                                                                                                     | careers/page.tsx:38                                                                   | `optionalAuthenticate`; anonymous callers get trimmed open jobs          | → `Job[]` or `{data:Job[]}`                                                                                                                     |
| GET `/ats/jobs/:id`                                                                                                                                                                        | careers/[id]/page.tsx:46; apply/page.tsx:1153                                         | `optionalAuthenticate`                                                   | → `Job` (a draft returns 404 for anonymous callers)                                                                                             |
| POST `/ats/candidates/public/upload-and-parse`                                                                                                                                             | apply/page.tsx:1202                                                                   | public; `uploadResume` (5 MB, PDF/DOCX); `publicApplySchema`             | FormData (fields + `file`) → `{resumeOriginalName,resumeRawText,parsedData}`                                                                    |
| POST `/ats/jobs/:id/apply`                                                                                                                                                                 | apply/page.tsx:1290                                                                   | public; `uploadResumeWithPortfolio` (10 MB, 2 files); `applyToJobSchema` | FormData (fields, `resumeOriginalName`, `resumeRawText`, `parsedData` JSON, `file`, `portfolioFile?`) → candidate or `{blocked:true}` (ignored) |
| POST `/ats/candidates/public/parse`                                                                                                                                                        | quick-import/page.tsx:1165                                                            | public; `uploadResume`                                                   | FormData `file` → `CandidateParsedData \| null`                                                                                                 |
| POST `/ats/candidates`                                                                                                                                                                     | quick-import/page.tsx:1255                                                            | `candidates.write`; `uploadResume`; `createCandidateSchema`              | multipart → `{_id,...}`                                                                                                                         |
| POST `/ats/candidates/:id/assign-job`                                                                                                                                                      | quick-import/page.tsx:1260 (direct `postJson`), table/sheet via `candStore.assignJob` | `candidates.write`                                                       | `{jobId,startStageId?}`                                                                                                                         |
| POST `/ats/candidates/:id/approve` (inferred from `candStore.approve`)                                                                                                                     | table 598, sheet 1771/1827/1890                                                       | `candidates.write`                                                       | `{jobId}` → `{applicationId, jobId}` (sheet reads `result.applicationId/jobId`)                                                                 |
| PATCH `/ats/candidates/:id/reject` (via `rejectCandidate`)                                                                                                                                 | table 634/2118, sheet 1981/2028                                                       | `candidates.write`                                                       | `{rejectionReasonId, destination?, internalNotes?}`                                                                                             |
| PATCH `/ats/candidates/:id/talent-pool` (via `updateTalentPool`)                                                                                                                           | table 662/1062/2034, sheet 1621/1891/1934/2222                                        | `candidates.write`                                                       | `{action:'add'\|'remove', notes?}` (inferred shape)                                                                                             |
| POST `/ats/candidates/:id/change-job` (via `changeJob`)                                                                                                                                    | table 1125, sheet 2258                                                                | `candidates.write`                                                       | `{applicationId,targetJobId,startStageId?}`                                                                                                     |
| PATCH `/ats/candidates/:id` (via `update`)                                                                                                                                                 | sheet 2401 (tags)                                                                     | `candidates.write`                                                       | `{tags}`                                                                                                                                        |
| PATCH `/ats/candidates/:id/legal-hold`                                                                                                                                                     | sheet 1683 (direct `patchJson`, bypasses the store)                                   | `requireRoles('admin')`                                                  | `{legalHold}`                                                                                                                                   |
| PATCH `/ats/candidates/:id/restore` (via `restoreCandidate`)                                                                                                                               | sheet 1642                                                                            | admin                                                                    | `{jobId}`                                                                                                                                       |
| DELETE `/ats/candidates/:id` (via `remove`)                                                                                                                                                | sheet 1667                                                                            | `candidates.manage` + service-level admin flag (controller 155-156)      | —                                                                                                                                               |
| GET `/ats/candidates/:id` (via `fetchOne`)                                                                                                                                                 | sheet 1689                                                                            | `candidates.read`                                                        | —                                                                                                                                               |
| Application store: moveStage, hire, reject, approve, updateNotes, moveToTalentPool, fetchScopedMerge (`GET /ats/applications?limit=9999`)                                                  | table/sheet                                                                           | `candidates.*` per doc                                                   | —                                                                                                                                               |
| Interview store: createForApplication (`POST /ats/applications/:id/interviews`), update, cancel, completeAndFeedback, fetch (`GET /ats/interviews?candidateId=`), fetchScopedByApplication | table 1164; sheet 2102-2106, 2327, 3045, 3081, 3977                                   | `interviews.*`                                                           | `{title,type,jobId?,scheduledAt(UTC ISO),interviewerIds,meetingDetails{link,phoneNumber,address}}`                                              |
| GET/POST/PATCH `/ats/interview-scorecards`                                                                                                                                                 | scorecard store                                                                       | `interviewScorecards.write`                                              | create `{candidateId,jobId,interviewerId,interviewDate,interviewType,...ratings,...notes,finalRecommendation}`                                  |
| GET `/shared/activity-logs/candidate/:id?includeRelated=true&limit=100`                                                                                                                    | sheet 1292                                                                            | `candidates.read` (BUSINESS_LOGIC.md:276)                                | `TransitionEntry[]`                                                                                                                             |
| `useUserStore.provisionVA` (→ `/shared/users/provision-va`)                                                                                                                                | sheet 1170                                                                            | admin (doc)                                                              | —                                                                                                                                               |
| Email templates fetch, tags fetch, users fetch                                                                                                                                             | sheet 1513-1522, form 271-273                                                         | —                                                                        | —                                                                                                                                               |
| Socket rooms `candidates`, `applications`                                                                                                                                                  | table 1618-1619 (`useSocketRoom`)                                                     | `/ats` namespace                                                         | `<resource>:created/updated/deleted` patch the stores                                                                                           |

External services touched indirectly: Cloudinary (resume and portfolio upload on apply; video `<video src>` for Cloudinary intro videos, detail-sheet 177-180), AI parsing (Claude/OpenAI) through the parse endpoints, Zoom through interview creation, Resend through the email composer.

---

### 8. Data models and types used in scope

- `Candidate` (store/types): firstName, lastName, email, phone, avatar, status (`pending|approved|hired`), eligibilityStatus, inTalentPool, legalHold, appliedJobId, tags, parsedData{summary,skills,languages,certifications,experience[{company,title,duration,description}],education[{institution,degree,field,year}]}, aiScore{score,recommendation,summary,strengths[],concerns[]}, aiValidation{isValid,score,reason,completedAt}, yearsOfExperience, englishProficiency, currentSalaryPHP/USD, reasonForLeaving, cityOfResidence, resumeUrl, resumeOriginalName, videoIntroUrl, videoIntroSource, portfolioUrl/FileUrl/FileName, crmProfile (legacy), source, createdAt, updatedAt.
- `Application`: candidateId, jobId, clientId, phase, currentStage{stageId,stageName,assignedAt}, source, aiValidation, approvedAt/By, hiredAt/By, rejectedAt, rejectionReason, notes, appliedAt, updatedAt.
- `Job.pipeline.stages[{_id,name,color,order,isActive}]`, salaryRange, applicationDeadline, openings, jobType, locationType, experienceLevel, skills, responsibilities, requirements, benefits.
- `Interview`: type, status, scheduledAt, duration, timezone, meetingDetails, interviewerIds, feedbacks[{_id,interviewerId,rating,notes,submittedAt}].
- `InterviewScorecard`: interviewerId, jobId, interviewDate, comm*/exp*/prof*/tech*/avail* inputs plus *Rating/\*Weighted, overallScore, notes fields, earliestStartDate, compensationExpectation, finalRecommendation (5-value enum). The scorecard zod schema is at form 62-104 (ratings are int 1-5; finalRecommendation is required).
- Apply zod (apply 80-103) and quick-import zod (74-97) **differ**: apply requires `videoIntroUrl` and has `portfolioUrl`. Quick-import requires `jobId`, makes video optional, and **renders no video input at all** (Issue 12).
- `RejectPayload` from `components/reject-dialog`: `{rejectionReasonId, destination?, internalNotes?}` (used at table 634-640).
- `TransitionEntry` (detail-sheet 1269-1277) is a local interface declared inside the component body.
- Compose variables passed: candidateName, candidateEmail, **candidatePhone**, jobTitle, clientName, **currentStage**, senderName (table 789-800; sheet 1726-1737). The doc's list of allowed template variables (BUSINESS_LOGIC.md:166) does not include `candidatePhone` or `currentStage`, but does include `companyName`, `interviewDate` and others that are never passed. This is ambiguous.

---

### 9. Dependencies used

- `@tanstack/react-table` (table, pagination model, sorting model) at candidates-table.tsx:78-87.
- `react-hook-form` + `@hookform/resolvers/zod` + `zod` (apply, quick-import, scorecard form).
- `zustand` stores (with immer and persist) through `@/store/slices/*`.
- `sonner` toasts; `lucide-react` icons; `react-router-dom` (`useParams`, `useSearchParams`, `Link`, `Navigate`, `useNavigate`).
- shadcn/Radix UI primitives.
- Internal helpers: `@/lib/timezones` (`zonedWallClockToUtc`, `getZonedDate/Time`, `DEFAULT_TIMEZONE`), `@/lib/activity` (`logOptimisticActivity`), `@/lib/utils` (`cn`, `formatDate`, `timeAgo`, `sortableTime`, `safeHttpUrl`), `@/lib/job-format`, `@/lib/tags`, `@/lib/public-api`.
- Shared components: `ComposeEmailSheet`, `ChangeJobDialog`, `ConfirmDialog`, `RejectDialog`, `ScheduleInterviewDialog`, `RestoreCandidateDialog`, `ResumeViewer`, `PortfolioSection`, `TagsSelector`, `ActivityTimeline`, `RichText`, `TablePagination`.
- Hooks: `useSocketRoom`, `useTablePagination`, `useInterviewerOptions`, `useCandidateEmailActivity`.

---

### 10. ISSUES

1. **High · security/privacy** · candidates-table.tsx:2011-2027 with `app/emails/_utils/candidate-compose.ts:51-53`. Bulk email puts every selected candidate's address in one **To** list. Every applicant receives every other applicant's email address, which is a PII disclosure between unrelated candidates and a likely GDPR/consent problem. Fix: send one message per recipient through a bulk-send endpoint, or use BCC.

2. **High · security (cross-ref backend)** · apply/page.tsx:1274-1275 sends `resumeRawText` back from the client, and `backend/src/features/jobs/job.controller.ts:149-157` **trusts a non-empty `body.resumeRawText`** instead of extracting text from the uploaded file. A public applicant can submit any text unrelated to the uploaded PDF. That text then drives AI candidacy validation and scoring (BUSINESS_LOGIC.md:456-458), and it bypasses the "text-based PDF only" rule (an image PDF passes if raw text is supplied). The same pattern applies to `parsedData`, which the client also controls (1276-1286), although editing it is an intended feature. Fix: always extract server-side from `req.file` on apply. Treat the client copy as display-only, or drop it.

3. **High · bug** · detail-sheet 2218-2238 and 1678-1689. Handlers read the **prop snapshot** `candidate` (`candidate.inTalentPool`, `candidate.legalHold`, `candidate.status`) instead of the live `c` (2376). The table passes a snapshot that never refreshes (`setSelected(candidate)`, candidates-table.tsx:1763), so after one toggle the next click sends the same action again: "add" twice, or legal hold `true` twice. The UI labels use `c` (3542, 3433), so the label and the action disagree. `handleToggleLegalHold` even refetches into the store "so the sheet reflects the new hold state" (1687-1689), but the handler still reads the stale prop. The same applies to `candidate.status` in the approve handlers (1764, 1820, 1883), the ConfirmDialog titles (3713-3891) and the scorecard fetch effect (2120). Fix: use `c` everywhere after it is resolved, or move the handlers below the `c` resolution.

4. **High · bug** · detail-sheet 1564, 3177-3209. `notesText` is component state that is never reset when the candidate changes. The sheet stays mounted in the table (candidates-table.tsx:2743) and its state persists between candidates. Text typed or loaded for candidate A stays in the textarea when candidate B opens. The prefill-on-focus runs only when the field is empty (3182-3186), so "Save Notes" writes A's notes onto B's application. Fix: key the sheet or notes block by `candidate._id`, or reset with an effect keyed on the id and application id.

5. **Medium · bug** · detail-sheet 2099-2108, 3055-3059, 3090-3094, 3988-3990. `fetchInterviews({candidateId, limit:50})` goes through `interviews.store.ts:98-150`, which **replaces the shared `items`** and persists `candidateId` into `filters`. The sheet's own comment (1526-1530) says writing to the shared list "reduced the calendar to a single candidate's interviews", yet this branch runs for **every non-pipeline candidate opened**, including all In Review candidates. Fix: use a scoped fetch (as for applications) or a separate keyed slice.

6. **Medium · bug** · quick-import/page.tsx:1091-1094. `fetchJobs({status:'open',limit:9999})` counts as an explicit filter, so it always hits the server and **overwrites the global job store with open jobs only** and saves `status:'open'` into the store filters (`jobs.store.ts:99-133`). Afterwards the candidates table, the sheet (`getJobTitle` falls back to the raw id, 1610-1612), the Job column, hired/closed job titles and the jobs pages lose every non-open job until reload. The `openJobsWithPreset` fallback (1116-1129) also cannot work, because a non-open preset job is no longer in `allJobs`. Fix: filter locally (`allJobs.filter(status==='open')`) or use a scoped, non-mutating fetch.

7. **Medium · bug/data integrity** · quick-import/page.tsx:1255-1262. Import does two requests and is not atomic. If `assign-job` fails (job closed meanwhile, `APPLICATION_NO_PIPELINE`, network), the candidate already exists as `approved` with no application. The UI returns to Review, and a retry fails on unique email (BUSINESS_LOGIC.md:107). That orphan matches neither tab (In Review needs `pending`, In Pipeline needs an approved application; see Issue 17), so it disappears from the main UI. Fix: a single backend endpoint that creates and assigns in a transaction, or on retry detect the created id and call only assign-job.

8. **Medium · bug** · candidates-table.tsx:1050-1051. `handleHire` awaits `candStore.fetch()` with no params. After boot that call does nothing (`candidates.store.ts:116-129`), and the store's own comment there claims fetches "after approve/reject/hire ... always hit the server". The status change to `hired` depends entirely on the socket. Fix: use `fetchOne(candidate._id)` or merge the hire response into the store.

9. **Medium · business-rule gap** · apply/page.tsx:1331 checks only `status !== 'open'`. The job detail page disables Apply once `applicationDeadline` has passed ([id]/page.tsx:88, 260), but the apply URL stays usable, and the backend has no deadline check (grep of `backend/src` finds `applicationDeadline` only in types and schemas; `job.controller.ts:121-128` checks only `status`). Fix: check the deadline in `applyToJob` and on the apply page.

10. **Medium · inconsistency** · Upload limits and types disagree:
    - The UI says "PDF only (text-based), up to 10 MB" (apply 685; quick-import 744).
    - `upload-and-parse` and `parse` use `uploadResume`, limited to **5 MB** (`backend/src/shared/middleware/upload.ts:10`).
    - Apply uses 10 MB (`upload.ts:81`).
    - Backend and doc accept **PDF and DOCX** (`upload.ts:12-15`, BUSINESS_LOGIC.md:297), while the UI rejects DOCX (apply 432-441).
    - A 6-9 MB resume passes the UI and then fails at parse.
    - The UI does no size check on the client.
      Fix: one shared constant; validate size on the client; decide on DOCX.

11. **Medium · bug** · candidates-table.tsx:2393-2410 with 1927-1958. The table hands **already-paged** data (`pagedData`) to `useReactTable` with `getSortedRowModel` and `sorting` state. The header sort buttons (Candidate, AI Score, Applied, at 2234-2345) therefore sort only the 20 visible rows, and this conflicts with the dropdown `sortBy` (1593-1598). The `sorting` state also starts as `createdAt desc` on every page. `manualPagination: true` together with `getPaginationRowModel` is redundant. Fix: remove the header sort buttons or make them drive `sortBy`; drop `getSortedRowModel` and `getPaginationRowModel`.

12. **Medium · bug/UX** · quick-import/page.tsx:81-85, 1238-1241. The schema and submit include `videoIntroUrl`, but the input step **renders no field for it** (grep finds it only at schema, review and submit). Internal imports can never carry a video intro. Fix: add the field or remove it from schema and submit.

13. **Medium · bug** · candidates-table.tsx:919 (`candidateApps[0]`), 2109-2113, 2062-2070; detail-sheet 2053-2056, 1974-1976. A candidate can hold several live applications through "Add to Another Job":
    - Row and sheet actions (stage, hire, reject, schedule, change job) always act on the **first** approved application in store order, and nothing in the UI says which job.
    - Bulk Reject uses `liveApplicationByCandidateId` (first live application) and **ignores `?jobId=`**. Rejecting from a job-filtered view can reject the candidate from a different job.
    - Bulk "Remove from job" does honour `jobIdFilter` (2068-2070), so the two bulk actions behave differently.
      Fix: choose the application by job context (`jobIdFilter`, or an explicit job picker); show which job is targeted.

14. **Medium · inconsistency/business rule** · detail-sheet 2875, 3225, 2120, 3462/3610.
    - Pipeline sections (interviews, scorecards, notes) and the pipeline footer appear only when `c.status==='approved'`.
    - Per the doc, a hired candidate "stays hired when assigned to further jobs" (BUSINESS_LOGIC.md:326, rule 6). A hired candidate with a new approved application therefore cannot move stage, hire, reject, schedule interviews or write notes from the sheet. They also do not appear in the In Pipeline tab's actions, because the menu works but the sheet does not.
    - Conversely, a candidate with status `approved` and no application (an internal import whose assign failed) gets a pipeline footer where every action is disabled.
      Fix: gate on `activePipelineApp` instead of `status`.

15. **Medium · ambiguity/business rule** · detail-sheet 1881-1956, 3843-3912. "Approve, Email & Talent Pool" approves into a job and then adds the Talent Pool flag, so the candidate ends up both in a pipeline and in the pool. The doc says "Assigning or changing a candidate's job takes them out of the pool" (BUSINESS_LOGIC.md:355); this flow puts them straight back. If the pool call fails after approve succeeded, the toast reports failure for an action that half-succeeded. The "& Email" approve flows also use the **`offer`** template type (3949), which describes approval into a pipeline as an offer. Fix: clarify the rule; make the combined action atomic, or describe it accurately.

16. **Medium · UX/permissions** · section 6: no permission gating in scope. Interviewers and coordinators get every approve/reject/hire/import/legal-hold/restore/delete button, and backend 403s surface as toasts. `CandidateCrmButton` (1149) and `InterviewCompleteFeedbackForm` (3041) ignore role and assignment, and the backend refuses non-assigned interviewers (BUSINESS_LOGIC.md:388). Fix: use `usePermission().hasPermission('candidates','write'|'manage')`, `hasRole('admin')`, and check interviewer assignment.

17. **Medium · bad implementation** · candidates-table.tsx:1779-1806. The fallback for "pipeline ids" turns on whenever **no approved application exists anywhere**, and then lists every `status==='approved'` candidate with **no applications**. Those are exactly internal imports not yet assigned. As a result the In Pipeline tab holds unassigned candidates (who have no stage and no usable actions) whenever the tenant has zero live pipelines, and they vanish as soon as one approved application exists. The justification in the comment ("application store corrupted by a lightweight socket broadcast") points to a store bug, not a view rule. Fix: remove the fallback, fix the socket merge, and give unassigned `approved` candidates a defined home (BUSINESS_LOGIC.md does not define one; this is an ambiguity).

18. **Medium · bug (race/stale)** · interview-scorecard-history.tsx:36-50 with `interview-scorecards.store.ts:46-65`. History ignores `candidateId` and shows whatever `items` the store holds. `fetchByCandidate` keeps the old `items` on error and has no request-id guard. Opening candidate B can show A's scorecards on error, or when A's slower response arrives last. The count chip (detail-sheet 3123) has the same problem. Fix: filter by `candidateId` and key results per candidate.

19. **Low · bug** · detail-sheet 524-525. `PipelineProgressBar` divides by `stages.length - 1`. With a one-stage pipeline that is `0/0`, so the width becomes `NaN%`. Fix: guard `stages.length <= 1`.

20. **Low · bug** · candidates-table.tsx:1593-1598, 1736, 1741. `localStorage.getItem/setItem` is not wrapped in try/catch. In a private or blocked-storage context this throws during render or in handlers. Fix: wrap it.

21. **Low · bug** · candidates-table.tsx:1164-1182 with `interviews.store.ts:278,285`. The store already toasts success and error for `createForApplication`, and the table toasts again (1177, 1180), so the user sees duplicate toasts. The sheet's version swallows errors and relies on the store toast (2351-2353), which is inconsistent. Fix: toast in one place.

22. **Low · bug** · detail-sheet 498-501. The reschedule fallback `new Date(`${date}T${time}`)` uses the **browser** timezone when `currentTimezone` is missing. This contradicts the doc comment at 402-403 and the company-timezone rule (BUSINESS_LOGIC.md:382). Fix: fall back to `companyTimezone`.

23. **Low · inconsistency** · interview-scorecard-form.tsx:135-139, 171-173, 239, 324, 351-353.
    - `interviewDate` uses browser-local `datetime-local`, while interviews use the company timezone.
    - `earliestStartDate` is stored as UTC midnight and displayed with `formatDate`, which can show the previous day west of UTC (inferred).
    - The default `interviewDate` is evaluated once at mount (`useForm` defaultValues), so after `reset()` the form shows the time the sheet first mounted, not now.

24. **Low · inconsistency** · interview-scorecard-form.tsx:114-115 vs detail-sheet 3158-3161. The prop comment says job options are "jobs scoped to this candidate's applications", but the sheet passes **all jobs**, so a scorecard can be filed against an unrelated job. The interviewer pool (form 199-207) includes account managers and differs from `useInterviewerOptions` (ATS staff), the source the history and the sheet use to resolve names.

25. **Low · UX** · detail-sheet 4217-4223. "Delete permanently" stays enabled while `legalHold` is true, although the backend blocks it (BUSINESS_LOGIC.md:363). Fix: disable it and explain why.

26. **Low · a11y** · section 4: rows cannot be opened by keyboard (2626-2633); the search has no label (2447); dropzones react to Enter only; icon-only remove buttons lack labels; nested interactive span inside a button (quick-import 413-421); labels are not linked to inputs; `<p>` nested inside `<p>` (4196-4206).

27. **Low · performance** · candidates-table.tsx:189-195. Each `CandidateCell` subscribes to the user store and runs `allUsers.some(...)`, so each page render costs O(rows × users). `ReviewActionsDropdown` and `PipelineActionsMenu` subscribe to the **whole** candidate and application stores (`useCandidateStore()` / `useApplicationStore()` with no selector, at 533-534, 889-890), so every row re-renders on any store change. `jobIdsForTab` loops over all applications for each candidate (1832-1849) inside `counts` and `filteredData`, which is O(candidates × applications). `columns` is rebuilt on every selection change (2379-2391). The detail sheet runs `jobs.find` many times inside render loops. Fix: precompute maps by candidate id, use selectors, memoize.

28. **Low · performance** · careers/page.tsx:169-171. `plainText(job.description)` creates a new `DOMParser` document for every card on every render, including on every search keystroke. Fix: memoize per job.

29. **Low · dead code** ·
    - `pendingApplicationByCandidateId` (candidates-table.tsx:1697-1705) is only a fallback after `liveApplicationByCandidateId` (2109-2113), which is a superset, so it is unreachable. The same holds for the `stageInfoByCandidateId` fallback there.
    - `counts.hired` is computed but there is no Hired tab (1860-1862 vs 2424-2435).
    - `jobIdsForTab`'s non-pending/approved branch (1841-1843) is unused for the same reason.
    - `candidates/new/page.tsx` is not routed.
    - `candidates/[id]/page.tsx` is a routed stub.
    - `apply/page.tsx` defines Step `success` metadata (1380-1383) that is never rendered.
    - `ApplyStepper`'s third step can never become active (1398).

30. **Low · duplication** ·
    - apply/page.tsx and quick-import/page.tsx share nearly identical `Field`, `TagsInput`, `ExperienceEditor`, `EducationEditor`, `LoadingScreen`, the review cards, the english-proficiency select, the PDF dropzone, the image-PDF error handling and `MIN_PARSE_DURATION_MS` (apply 109-347, 1073-1110 vs quick-import 103-347, 1038-1075).
    - The apply page builds FormData twice (1178-1199 vs 1252-1288).
    - The detail sheet repeats three approve handlers (1761-1956) and three approve dialogs (3705-3912) almost line for line.
    - Reject routing is copied in table and sheet (634-640, 1974-1982, 2021-2029, 2117-2131).
    - The compose prefill exists in 4 places (table 782-801 and 988-1019, sheet 1709-1759) instead of using `buildCandidateComposeMode`.
    - `senderName` IIFE copies appear at table 796-799 and 1013-1016, and sheet 1733-1736.
    - The Move Stage dialog appears in both table (1359-1407) and sheet (4009-4062), and Hire, Talent-pool-confirm and Schedule dialogs are duplicated the same way.
      This breaks the repo's own CLAUDE.md "DRY / smaller components" rules (ats/CLAUDE.md). The 4,229-line sheet and 2,754-line table are maintenance hotspots.

31. **Low · bad implementation** · detail-sheet 3947-3953. `ComposeEmailSheet` gets a fresh `mode` object on every render (`buildComposeMode(...)`). If the compose sheet seeds its state from `mode` in an effect, it would reset while the user types. This is inferred and needs a check of `compose-email-sheet.tsx`, which is outside my scope. `substituteTemplate` (128-132) also duplicates server-side `{{variable}}` substitution (BUSINESS_LOGIC.md:397).

32. **Low · UX** · apply/page.tsx:362. `JobSummaryCard` shows `job.location ?? 'Remote'`, which labels an onsite or hybrid job without a location as "Remote". Fix: use `locationTypeLabel` when location is empty.

33. **Low · inconsistency** · quick-import/page.tsx:793 vs 1016. The status label says "Pending" on step 1 and "Active" on review. Per BUSINESS_LOGIC.md:308 the candidate is created `approved`.

34. **Low · inconsistency** · candidates-table.tsx:190-195 vs detail-sheet 1162-1165. The table's CRM badge requires `u.isActive`, but the sheet's "CRM Active" check does not, so a revoked or deactivated VA still shows "CRM Active" in the sheet and the "Give CRM Portal Access" button is hidden.

35. **Low · type-safety** ·
    - `field.onChange(v || null)` pushes `null` into an enum field typed as non-null (apply 543; quick-import 602).
    - Non-null assertions are used: `validation!`, `aiValidation!`, `parsedData!.experience![0]` (table 332; sheet 2452-2589).
    - Casts appear: `setRecommendation as (v: string) => void` (sheet 278), `data.type as Interview['type']` (table 1166; sheet 2329).
    - `TransitionEntry.metadata` is cast to `Record<string,string|undefined>` (1343-1346).

36. **Low · ambiguity (doc vs code)** ·
    - The doc says "The ATS UI loads all data once after login" (BUSINESS_LOGIC.md:23), while candidates/page.tsx:17 says fetching is "server-side inside CandidatesTable"; the code filters on the client.
    - The doc lists allowed template variables (BUSINESS_LOGIC.md:166) that do not match the variables the UI sends (`candidatePhone`, `currentStage`).
    - The doc requires a disposition reason for candidate-level reject (BUSINESS_LOGIC.md:316). The single-row In Review path sends `payload` straight through (sheet 1981), while the table path strips it down to `{rejectionReasonId,destination,internalNotes}` (table 634-640). The sheet may forward extra fields.
    - Whether a pipeline candidate may sit in the Talent Pool at the same time (table bulk "Add to Talent Pool" in the pipeline tab, 2565-2573; pipeline row menu 1328-1347) is undefined: "independent flag" (BUSINESS_LOGIC.md:355) vs "assigning takes them out of the pool".

37. **Low · bug** · candidates-table.tsx:1745-1754. `handleSearchChange` calls `resetPage()` on each keystroke but applies the query 300 ms later, so pagination resets against the old result set. The comment "avoid hammering the server" is wrong because search is local. The timer is not cleared on unmount.

38. **Low · UX** · RejectionHistory (detail-sheet 1245-1259) collapses side-effect rows by **matching the second**, which is a heuristic. A genuine user talent-pool action in the same second as an unrelated primary event, such as a socket-driven hire elsewhere, is dropped. The `limit=100` cap hides older transitions silently.

---

## Area B1 — Jobs, clients, settings, tags, team

Scope: `ats/src/app/jobs/`, `ats/src/app/clients/`, `ats/src/app/settings/`, `ats/src/app/tags/`, `ats/src/app/team/`.
Paths are relative to `ats/src/` unless prefixed `backend/` (= `backend/src/`). Read-only audit; nothing was run.

---

### 1. Scope covered (every file read completely, top to bottom)

| File                                                        | Lines      |
| ----------------------------------------------------------- | ---------- |
| app/jobs/[id]/page.tsx                                      | 12         |
| app/jobs/new/page.tsx                                       | 7          |
| app/jobs/page.tsx                                           | 143        |
| app/jobs/\_components/assign-candidate-dialog.tsx           | 210        |
| app/jobs/\_components/job-candidates.tsx                    | 492        |
| app/jobs/\_components/job-list.tsx                          | 452        |
| app/jobs/\_components/job-panel.tsx                         | 779        |
| app/jobs/\_components/job-pipeline-board.tsx                | 587        |
| app/jobs/\_components/new-job-sheet.tsx                     | 1235       |
| app/jobs/\_components/pipeline-change-dialog.tsx            | 346        |
| app/clients/[id]/page.tsx                                   | 10         |
| app/clients/new/page.tsx                                    | 7          |
| app/clients/page.tsx                                        | 9          |
| app/clients/\_components/client-detail-sheet.tsx            | 1957       |
| app/clients/\_components/clients-table.tsx                  | 998        |
| app/clients/\_components/new-client-sheet.tsx               | 597        |
| app/settings/\_components/email-template-sheet.tsx          | 280        |
| app/settings/\_components/email-template-view-dialog.tsx    | 159        |
| app/settings/\_components/pipeline-template-sheet.tsx       | 477        |
| app/settings/\_components/pipeline-template-view-dialog.tsx | 181        |
| app/settings/\_data/settings.ts                             | 145        |
| app/settings/account/page.tsx                               | 674        |
| app/settings/disposition-reasons/page.tsx                   | 624        |
| app/settings/general/page.tsx                               | 1223       |
| app/tags/\_components/tag-badge.tsx                         | 24         |
| app/tags/\_components/tag-form-sheet.tsx                    | 157        |
| app/tags/\_components/tags-table.tsx                        | 574        |
| app/tags/\_data/tags.ts                                     | 26         |
| app/tags/page.tsx                                           | 9          |
| app/team/[id]/page.tsx                                      | 10         |
| app/team/\_components/invite-team-sheet.tsx                 | 185        |
| app/team/\_components/permission-guide-dialog.tsx           | 447        |
| app/team/\_components/team-member-edit-sheet.tsx            | 198        |
| app/team/\_components/team-member-sheet.tsx                 | 331        |
| app/team/\_components/team-table.tsx                        | 807        |
| app/team/\_data/team.ts                                     | 23         |
| app/team/page.tsx                                           | 28         |
| **Total (37 files)**                                        | **14,423** |

Read outside scope to verify connections (relevant sections only): `router.tsx`, `hooks/use-permission.ts`, `hooks/use-socket-room.ts`, `lib/boot-data.ts`, `lib/activity.ts`, `lib/api-client.ts` (error parsing), `components/app-sidebar.tsx` (nav gating), `store/slices/{jobs,clients,applications,candidates,tags,users,disposition-reasons}.store.ts`, `store/types/{job,client,user,settings}.types.ts`, `index.css` tokens, `STYLE.md`; backend `features/{jobs,clients,users,settings,email-templates,pipeline-templates,disposition-reasons,tags}/*.routes.ts`, `features/users/user.service.ts` (role permission defaults, deactivateUser), `features/jobs/job.service.ts` (createJob), `features/pipeline-templates/pipelineTemplate.service.ts`, `shared/middleware/authorize.ts`, `shared/validators/common.validator.ts`.

Note on line numbers: line refs come from my reads. For components with long JSX, a ref may point to the start of the relevant block.

---

### 2. Per-folder / per-file summary

#### 2.1 jobs/

- **page.tsx** (`/ats/jobs`, router.tsx:79): master/detail layout.
  - Joins socket room `jobs`.
  - Fetches all jobs with `useJobStore.fetch({limit:9999})`. Fetches all clients directly with `getJson('/ats/clients',{limit:9999})` so the client store is not mutated.
  - Sorts jobs client-side by status rank (open > draft > on_hold > closed), then createdAt desc.
  - Deep links: `?client=<companyName>` resolves to a clientId and runs `setFilters` + `fetch`. `?job=<id>` selects that job; otherwise the first job is selected.
  - Renders `JobList` + `JobPanel` inside a `<Suspense>` that does nothing here (left over from Next.js useSearchParams).
- **[id]/page.tsx**, **new/page.tsx**: placeholder stubs. Routed (router.tsx:80-81) but nothing links to them; all links use `/ats/jobs?job=` or `?action=new`.
- **job-list.tsx** `JobList`: left column (`w-72 md:w-96`).
  - Header: search toggle and "Add Job".
  - Status filter dropdown with a clear button.
  - Job buttons show status badge, client, location type, openings and candidate count.
  - Client-side pagination via TanStack `useReactTable` with `columns: []`, used only as a paginator. Page index is kept in sessionStorage, page size in localStorage.
  - Fetches ALL applications locally just to compute candidate counts.
  - `?action=new` opens `NewJobSheet` and then strips the param.
- **job-panel.tsx** `JobPanel`: right pane.
  - Header: status dropdown (`setStatus`), priority chip, pipeline dropdown (opens `PipelineChangeDialog`), Delete, Edit and Copy-public-link buttons.
  - Warning banner when an open job has no pipeline.
  - Tabs: Details (`JobDetails`), Pipeline (`JobPipelineBoard`), Candidates (`JobCandidates`), Activity (`ActivityTimeline`).
  - Calls `fetchOne` on selection to get the full job. When `templateId` is null, it infers the current template by matching stage ids.
  - `JobDetails`: overview, compensation, skills, an inline TagsSelector that PATCHes job tags immediately, a sanitized rich description, and bullet lists.
- **job-candidates.tsx** `JobCandidates`: Candidates tab.
  - Module-level 30s cache. Fetches `/ats/applications?jobId` plus ALL `/ats/candidates`, then joins them.
  - Phase chips: In Pipeline, Hired, Rejected. Pending is counted but has no chip.
  - Sort dropdown. Cards open `CandidateDetailSheet`. Buttons go to quick-import and the candidates list.
- **job-pipeline-board.tsx** `JobPipelineBoard`: Kanban built on dnd-kit.
  - Own 30s module cache; fetches ALL applications and ALL candidates.
  - Columns are the job's active stages, sorted. Approved applications with no stage go to the first stage.
  - Drag end PATCHes the stage via `useApplicationStore.moveStage`.
  - Reject opens the shared `RejectDialog`; destinations are hidden when the candidate has other live applications.
  - Static "Rejected" column.
- **pipeline-change-dialog.tsx** `PipelineChangeDialog`: summarizes how candidates in old stages map to the new template (matched by stage NAME). Offers an optional manual remap table with a native `<select>`. Auto-confirms when applications exist but none sit in a stage.
- **new-job-sheet.tsx** `NewJobSheet`: create/edit sheet.
  - Custom `ClientCombobox`, `DynamicList` and `SkillsInput`.
  - AI: "Start with AI" draft on create (`POST /ats/jobs/generate-draft`); "Improve with AI" standardize on edit (`POST /ats/jobs/standardize`), with revert.
  - Pipeline Select with stage preview; enums, dates, salary, rich-text description and tags.
  - Discard-confirm footer. Module-level `aiNotesCache`.
- **assign-candidate-dialog.tsx** `AssignCandidateDialog`: imported nowhere, so dead code. It would call `useCandidateStore.assignJob` → `POST /ats/candidates/:id/assign-job`.

#### 2.2 clients/

- **page.tsx**: wraps `ClientsTable`. **[id]/page.tsx**, **new/page.tsx**: placeholder stubs (routed router.tsx:76-78, unused).
- **clients-table.tsx** `ClientsTable`:
  - Toolbar: search (300ms debounce), status filter, sort dropdown with 7 options (persisted to localStorage), Add Client.
  - TanStack table over a client-side page slice.
  - Columns:
    - Company: logo or initials, city/state, and a CRM badge from the users store.
    - Status; Industry/size; Primary contact.
    - Jobs: total/open counts from the jobs store.
    - Actions: Edit (gated by `clients.write`), Delete (gated by `clients.manage`) and a "View jobs" deep link.
  - Row click opens `ClientDetailSheet`. The delete confirm dialog shows how many jobs and applications are affected.
- **new-client-sheet.tsx** `NewClientSheet`: the only react-hook-form + zod form in scope.
  - Create: client, then optional logo upload, then optional primary contact.
  - Edit: PATCH, then optional logo upload.
  - Logo preview via `URL.createObjectURL`.
- **client-detail-sheet.tsx** `ClientDetailSheet` → `ClientDetailSheetContent`. The null guard sits outside the hooks.
  - Header: CRM provision/revoke buttons, Edit, Delete and inline tags.
  - Identity block.
  - Tabs:
    - Overview.
    - Contacts: CRUD, primary-contact enforcement, compose email.
    - Jobs: from the jobs store; counts from merged applications.
    - Activity.
    - Notes: CRUD.
    - CRM: view/edit health, satisfaction, onboarding, BAA and notes. Shown only when `crmProfile` exists.

#### 2.3 settings/

- **\_data/settings.ts**:
  - `workspaceSettings`: hardcoded values used as fallbacks.
  - `ROLE_LABELS`: canonical copy, re-exported by team.
  - `PERMISSION_RESOURCES` / `RESOURCE_LABELS`.
  - Stale duplicate types `PipelineTemplate`, `EmailTemplate` and `Permission`, keyed by `id` rather than `_id`.
  - `EMAIL_TEMPLATE_TYPES`, `EMAIL_VARIABLES`.
- **general/page.tsx** (`/ats/settings/general`): tabs General, Pipeline Templates, Email Templates and Rejection Reasons (admin only). Cards:
  - `WorkspaceCard`: company timezone.
  - `EmailSettingsCard`: fromName editable, fromEmail read-only.
  - `AiSettingsCard`: provider plus 3 toggles.
  - `ApplicationConfirmationCard`: enable switch plus template select.
  - `PipelineTemplatesCard`: list, activate/deactivate, set default, view, edit, delete.
  - `EmailTemplatesCard`: list, set default, toggle active, view, edit, delete (via ConfirmDialog).
  - Reuses `DispositionReasonsCard` from the disposition page.
- **disposition-reasons/page.tsx**: `DispositionReasonsCard` (grouped by category, with search, edit and delete) and `DispositionReasonSheet` (label, category, active; advanced: applicable stages as CSV, require notes). Calls the API directly instead of using the store. Also a standalone admin route, `/ats/settings/disposition-reasons`.
- **account/page.tsx**: routed at `/ats/account` (router.tsx:141), not under /settings. Sections:
  - Profile: avatar upload, first/last name, phone.
  - Password: change it, or send a reset link.
  - Permissions: read-only matrix of the user's own flags.
  - Uses custom tab buttons.
- **\_components**: email/pipeline template sheets and view dialogs (covered in the issues).

#### 2.4 tags/

- **page.tsx** → `TagsTable`: search, bulk select + delete, New tag. Columns: name, preview, color, created by, created at, actions. Client-side pagination; socket room `tags`.
- **tag-form-sheet.tsx**: name, 24 preset colors (`_data/tags.ts`), hex input, native color picker, preview.
- **tag-badge.tsx**: colored pill using `${color}18`/`${color}55` alpha suffix.

#### 2.5 team/

- **page.tsx** (`/ats/team`, admin-only RoleGuard router.tsx:99-106): fetches users, renders `TeamTable`.
- **team-table.tsx**:
  - Filters: role, app, status. Also bulk delete, a Permissions guide button and Add User.
  - Columns: name, email/phone, first role, status, joined, app access, Edit/Delete.
  - Excludes client/va users. Sorted by the rank of each user's first role.
- **invite-team-sheet.tsx**: first/last/email/phone/one role → `POST /shared/users`.
- **team-member-sheet.tsx**: read-only profile/access/activity (sign-ins vs changes filters).
- **team-member-edit-sheet.tsx**: name, phone, roles (checkboxes), active switch; blocked until invite accepted.
- **permission-guide-dialog.tsx**: hardcoded role x resource matrix.
- **\_data/team.ts**: `ALL_ROLES` (6 roles, excludes client/va), `AVATAR_BG`, re-export `ROLE_LABELS`.
- **[id]/page.tsx**: placeholder stub `Team Member #{id}`.

---

### 3. Features & user flows

#### 3.1 Browse jobs

1. User opens `/ats/jobs`. The page joins socket room `jobs` and calls `useJobStore.fetch({limit:9999})`, which does nothing after boot (jobs.store.ts:86-97). It also fetches all clients locally (page.tsx) and all applications (job-list.tsx).
2. The list is sorted by status rank and the first job is auto-selected. Selecting a job makes `JobPanel` call `fetchPipelines()` and `fetchOne(id)` (`GET /ats/jobs/:id`).
3. Choosing a status filter calls `setFilters` + `fetch({status, page:1})`. Because the filter is explicit, this hits the server and replaces the global job store items (ISSUE 2).
4. Search is client-side only, on title and client name.

#### 3.2 Create job

1. "Add Job" or `/ats/jobs?action=new` (dashboard link) opens `NewJobSheet`.
2. Optional AI draft:
   - The user types a brief of at least 10 chars and clicks Generate.
   - `POST /ats/jobs/generate-draft {notes}` fills the title, the description (markdown converted to HTML) and the lists.
   - If fields already have content, the user must confirm the overwrite. AI badges clear when a field is edited.
3. Required fields: title, client, job type, location type, experience level, description. Submit stays disabled until they are filled. The default pipeline is preselected.
4. Submit:
   - Sends `POST /ats/jobs` with a DTO that includes `pipelineId`, which the backend drops (ISSUE 1).
   - Store unshift, optimistic activity log, toast, sheet closes.
   - The form state is NOT reset (ISSUE 4).
5. Closing the sheet with content shows an inline "discard?" footer.

#### 3.3 Edit job

- The pencil opens the same sheet in edit mode, seeded from `fullJob` at mount.
- "Improve with AI" sends the list fields to `POST /ats/jobs/standardize`; Revert restores the snapshot.
- Save sends `PATCH /ats/jobs/:id` (clientId omitted).

#### 3.4 Status / pipeline / delete

- Status dropdown: `PATCH /ats/jobs/:id/status`; the store toasts; activity is logged optimistically.
- Pipeline change:
  1. The user picks an active template.
  2. `PipelineChangeDialog` fetches the job's applications (`GET /ats/applications?jobId&limit=9999`).
  3. It shows a summary, or a manual remap table.
  4. Confirm sends `PATCH /ats/jobs/:id/pipeline {templateId, stageMapping?}`, then the job is refetched.
- Delete: confirm (warns with the application count) → `DELETE /ats/jobs/:id`. The store removes the job and its applications.
- Copy link: copies `${origin}/careers/:id` to the clipboard.

#### 3.5 Pipeline board

- Drag a card (6px activation) to a column → local stageMap updates optimistically → `PATCH /ats/applications/:id/stage {stageId}`.
- The Ban icon opens `RejectDialog` → `PATCH /ats/applications/:id/reject {reason, rejectionReasonId, destination, internalNotes}`, then a toast.
- Clicking a card opens `/ats/candidates/:id`.

#### 3.6 Candidates tab

- Shows candidate cards for the job, filtered by phase chip (default: In Pipeline).
- "Add Candidate to This Job" → `/ats/candidates/quick-import?jobId=`.
- "View in Candidates" → `/ats/candidates?jobId=`.
- A card opens `CandidateDetailSheet`.

#### 3.7 Clients

- List: client data comes from the store (boot); job counts from the jobs store; CRM badge from the users store. On mount it calls `fetchJobs({clientId: undefined, limit: 9999})`, which does nothing (ISSUE 2).
- Add client:
  1. `POST /ats/clients`.
  2. Optional logo: `POST /ats/clients/:id/logo` (multipart `file`).
  3. Optional primary contact: `POST /ats/clients/:id/contacts {isPrimary:true}`.
- Edit: `PATCH /ats/clients/:id` (with tags), then optional logo upload.
- Delete: `DELETE /ats/clients/:id`. The store also purges that client's jobs and applications (clients.store.ts:256-277).
- View jobs: `/ats/jobs?client=<companyName>`.
- Detail sheet:
  - Contacts CRUD: `POST/PATCH/DELETE /ats/clients/:id/contacts[/:contactId]`.
  - Compose email: ComposeEmailSheet, prefilled.
  - Notes CRUD: `GET/POST/PATCH/DELETE /ats/clients/:id/notes[/:noteId]`.
  - CRM profile: `PATCH /ats/clients/:id/crm-profile`.
  - Inline tags: `PATCH /ats/clients/:id {tags}`.
  - Provision CRM access: `POST /shared/users/provision-client {clientId}`. Shown only when the client is active and has at least one hired application.
  - Revoke CRM access: `POST /shared/users/:id/revoke-crm`.
  - Applications are merged in via `GET /ats/applications?clientId&limit=9999`.

#### 3.8 Settings

- Timezone, email fromName, AI settings and application confirmation each save a partial body via `PATCH /shared/settings`. `GET /shared/settings` runs on mount.
- Pipeline templates: `GET/POST/PATCH/DELETE /ats/pipeline-templates`. Set default sends `PATCH {isDefault:true}`; the toggle sends `PATCH {isActive}`.
- Email templates: `GET/POST/PATCH/DELETE /ats/email-templates`, plus `setDefault` (a store PATCH). The application-confirmation card lists templates via `GET /ats/email-templates?type=application_confirmation`.
- Rejection reasons: `GET/POST/PATCH/DELETE /ats/disposition-reasons`, called directly.
- Account: `PATCH /shared/users/me`, `POST /shared/users/me/avatar`, and `changePassword` / `forgotPassword` via the auth store.

#### 3.9 Tags

- New/Edit: `POST /ats/tags` / `PATCH /ats/tags/:id {name,color}`.
- Delete and bulk delete: `DELETE /ats/tags/:id` (bulk uses Promise.all).

#### 3.10 Team

- Invite: `POST /shared/users {firstName,lastName,email,phone,roles:[role],invitedBy}`.
- Edit: `PATCH /shared/users/:id {firstName,lastName,phone,roles,isActive}`.
- Delete and bulk delete: `DELETE /shared/users/:id`. The backend hard-deletes the user (user.service.ts:468-493).
- The view sheet shows permissions and activity.

---

### 4. UI/UX observations

- Layout:
  - Jobs is a two-pane master/detail with a fixed left column (`w-72 md:w-96`, job-list.tsx). There is no mobile breakpoint to stack or hide panes, so on a 375px phone the detail pane gets about 90px.
  - Clients, tags and team are full-width TanStack tables in bordered scroll containers with sticky headers. There is no card or stacked layout at small widths, only horizontal scroll.
- Sheets mostly use `SheetContent side="right"`, but widths are inconsistent:
  - `w-[30vw]`: email/pipeline template sheets; breaks on mobile.
  - `w-[360px]`: tag sheet.
  - `w-md max-w-[calc(100vw-2rem)]`: disposition sheet.
  - `sm:max-w-xl/2xl`: job sheet.
  - `sm:!max-w-[500px]`: client detail.
  - Default width: client form, invite.
- Loading states differ:
  - Skeletons in the job list, clients table, team table and templates. The template skeletons are `animate-pulse` divs rather than `Skeleton`.
  - Plain "Loading..." text in tags and disposition reasons.
  - A spinner in job candidates.
  - None on the board, which shows empty columns while loading and on error.
- Empty states exist for jobs, clients, contacts, notes, templates, tags, team and board columns ("Drop here").
- Error states: the job candidates tab renders an error. Most other views only toast; the board only logs to the console.
- Destructive confirmations are inconsistent:
  - Dialog: job delete, client delete.
  - ConfirmDialog: email template, disposition reason.
  - Inline "Delete? Yes/No": pipeline templates, tags, team, contacts, notes.
  - No confirmation at all: CRM revoke.
- Dark mode: classes widely carry `dark:` variants. However, hardcoded hex colors (#69c58a, #2d8a51, #f3a64a) in client-detail-sheet, team-member-sheet and team-table bypass the tokens, and the team-member-sheet avatar's inline hex background has no dark variant.
- Accessibility gaps (ISSUE 51):
  - Form labels have no `htmlFor`.
  - Clickable rows and divs are not keyboard-operable.
  - Custom comboboxes and popovers have no ARIA roles.
  - Icon-only buttons rely on `title` alone.
  - Color swatches are labelled only by their hex value.
- Consistency:
  - The same concept, job status, is styled three different ways: Badge variants in job-list, `jobStatusConfig` in client-detail, and job-panel's own styles.
  - The `statusConfig` in clients-table differs from the one in client-detail.
  - The account page uses custom tab buttons; everywhere else uses shadcn Tabs.

### 5. Styles

- Stack: Tailwind v4 + shadcn primitives (Button, Badge, Sheet, Dialog, Select, Tabs, Tooltip, Table, Checkbox, Switch, Card, Collapsible, Skeleton, Avatar).
- Tokens: index.css defines the brand palettes `pine-teal-*` and `silver-*` and the semantic tokens `success` and `warning`. Some code uses them (`text-success`, `border-warning/40`).
- Token conflict: STYLE.md:37 says "Always use semantic tokens, never raw palette values", and STYLE.md lists `--success` = `#69c58a`. But index.css sets `--success: #16a34a`, and components hardcode `#69c58a`/`#2d8a51` instead of using `text-success`. Docs and code contradict each other, and the token is bypassed.
- Raw palette classes are common (amber-_, rose-_, emerald-_, green-_, red-_, blue-_) in job-panel, job-pipeline-board, and the disposition `CATEGORY_COLORS`.
- Native elements are used instead of shadcn:
  - `<select>`: pipeline-change-dialog.
  - `<textarea>`: new-client-sheet and client-detail-sheet.
  - `<input type="color">`: pipeline-template-sheet, tag-form-sheet.
  - Custom dropdowns: ClientCombobox, StageIconPicker.
- Arbitrary values: `w-62.5`, `max-w-30`, `bg-white/4`, `dark:bg-white/[0.07]`, `rounded-[3px]`, inline gradients/striping in job-panel, and an inline `style={{maxHeight:'200px', overflowY:'scroll'}}` in new-job-sheet.
- User colors get alpha by string concatenation (`${color}18`, `firstTag.color + '70'` in job-candidates). This assumes 6-digit hex and breaks for 3-digit or named colors. The backend enforces 6-digit hex only for stages; I did not check the tag color schema.
- The pine-teal hover override (`hover:bg-pine-teal-700 dark:hover:bg-pine-teal-700`) is repeated on about 10 primary buttons instead of being a Button variant.
- Leftover `'use client'` directives in a Vite SPA: new-client-sheet, client-detail-sheet, team/page and the team components.

### 6. Roles & permissions

Backend defaults (backend/features/users/user.service.ts:36-150):

- admin: everything.
- hiring_manager: jobs read/write/manage; clients read; tags read/write; settings read; team read; pipelineTemplates and emailTemplates read.
- recruiter and coordinator: jobs READ, clients READ, tags read, settings read, team read, templates read.
- interviewer: tags read and team read only; no jobs, clients or settings.

Backend hierarchy: manage implies write implies read; schedule implies write (backend/shared/middleware/authorize.ts:36-60).

Frontend checks found:

- Router (router.tsx:74-143):
  - Admin-only: `/ats/team`, `/ats/team/:id`, `/ats/settings/disposition-reasons`.
  - Admin, hiring_manager, recruiter and coordinator: `/ats/settings/general`.
  - No guard: `/ats/jobs`, `/ats/clients`, `/ats/tags`, `/ats/account`.
- Sidebar hides Clients, Jobs, Settings, Tags and Team by `hasPermission(resource,'read')` (components/app-sidebar.tsx:87-107).
- `usePermission.hasPermission` checks only the exact flag, with no hierarchy (hooks/use-permission.ts:11-15).
- clients-table gates Edit with `clients.write` and Delete with `clients.manage`. Nothing else in scope is gated by permission.
- On general settings, the Rejection Reasons tab is gated by `roles.includes('admin')`.
- No UI gating at all: jobs, the client detail sheet, new client, tags, pipeline/email templates, AI and workspace settings (see ISSUES 11-14).

| Feature                                        | UI shows to                    | Backend requires                               |
| ---------------------------------------------- | ------------------------------ | ---------------------------------------------- |
| Create/edit job, status, pipeline, AI          | anyone on /ats/jobs            | jobs.write (job.routes.ts)                     |
| Delete job                                     | anyone                         | jobs.manage                                    |
| Add client                                     | anyone                         | clients.write (client.routes.ts)               |
| Client detail Edit/Delete, contacts, CRM, tags | anyone                         | clients.write / manage                         |
| Client notes                                   | anyone                         | role admin (client.routes.ts:158-180)          |
| Provision / revoke CRM                         | anyone                         | team.write / team.manage (user.routes.ts)      |
| Settings saves                                 | admin/HM/recruiter/coordinator | settings.write (settings.routes.ts)            |
| Pipeline/email templates CRUD                  | same                           | pipelineTemplates.write / emailTemplates.write |
| Tags create/edit                               | anyone                         | tags.write; delete tags.manage (tag.routes.ts) |

---

### 7. Connections (all frontend calls in scope)

Socket rooms: `jobs` (jobs/page.tsx), `job:<id>` (jobs/[id]/page.tsx:6, stub only), `clients` (clients-table.tsx), `tags` (tags-table.tsx). No team or settings rooms.

| Method & path                                             | Caller                                                                                                                                                          | Backend guard                                                                                     | Body / response                                                         |
| --------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| GET /ats/jobs                                             | jobs.store fetch via jobs/page.tsx, job-list status filter, clients-table                                                                                       | optionalAuthenticate, query zod                                                                   | `{clientId,status,search,page,limit}` → Job[] or `{data,...pagination}` |
| GET /ats/jobs/:id                                         | job-panel (fetchOne)                                                                                                                                            | optionalAuthenticate                                                                              | Job                                                                     |
| POST /ats/jobs                                            | new-job-sheet                                                                                                                                                   | jobs.write                                                                                        | CreateJobDto (`pipelineId` stripped)                                    |
| PATCH /ats/jobs/:id                                       | new-job-sheet; job-panel (tags)                                                                                                                                 | jobs.write                                                                                        | UpdateJobDto                                                            |
| DELETE /ats/jobs/:id                                      | job-panel                                                                                                                                                       | jobs.manage                                                                                       | `{deleted:true}`                                                        |
| PATCH /ats/jobs/:id/status                                | job-panel                                                                                                                                                       | jobs.write                                                                                        | `{status}`                                                              |
| PATCH /ats/jobs/:id/pipeline                              | job-panel                                                                                                                                                       | jobs.write                                                                                        | `{templateId, stageMapping?: Record<oldName,newName>}`                  |
| POST /ats/jobs/generate-draft                             | new-job-sheet                                                                                                                                                   | jobs.write; notes 10-20000 chars                                                                  | GeneratedJobDraft (AI provider per settings)                            |
| POST /ats/jobs/standardize                                | new-job-sheet                                                                                                                                                   | jobs.write                                                                                        | 4 string arrays in and out                                              |
| GET /ats/clients                                          | jobs/page.tsx (limit 9999)                                                                                                                                      | clients.read                                                                                      | Client[]                                                                |
| POST/PATCH/DELETE /ats/clients[/:id]                      | new-client-sheet; clients-table; client-detail-sheet                                                                                                            | clients.write / manage                                                                            | CreateClientDto / UpdateClientDto                                       |
| POST /ats/clients/:id/logo (multipart `file`)             | new-client-sheet                                                                                                                                                | clients.write                                                                                     | Client                                                                  |
| POST/PATCH/DELETE /ats/clients/:id/contacts[/:cid]        | new-client-sheet; client-detail-sheet                                                                                                                           | clients.write                                                                                     | contact dto → Client                                                    |
| PATCH /ats/clients/:id/crm-profile                        | client-detail-sheet                                                                                                                                             | clients.write                                                                                     | ClientCrmProfile partial                                                |
| GET/POST/PATCH/DELETE /ats/clients/:id/notes[/:nid]       | client-detail-sheet NotesTab                                                                                                                                    | requireRoles('admin')                                                                             | `{method, content}`                                                     |
| GET /ats/applications                                     | job-list (all), job-candidates (jobId), job-pipeline-board (all), pipeline-change-dialog (jobId), assign-candidate-dialog, client-detail-sheet (clientId merge) | applications routes (out of scope)                                                                | Application[]                                                           |
| GET /ats/candidates?limit=9999                            | job-candidates; job-pipeline-board                                                                                                                              | out of scope                                                                                      | Candidate[] (all)                                                       |
| PATCH /ats/applications/:id/stage                         | job-pipeline-board                                                                                                                                              | out of scope                                                                                      | `{stageId}`                                                             |
| PATCH /ats/applications/:id/reject                        | job-pipeline-board                                                                                                                                              | out of scope                                                                                      | `{reason,rejectionReasonId,destination,internalNotes}`                  |
| POST /ats/candidates/:id/assign-job                       | assign-candidate-dialog (dead)                                                                                                                                  | out of scope                                                                                      | `{jobId, startStageId?}`                                                |
| GET/PATCH /shared/settings                                | general/page.tsx                                                                                                                                                | settings.read / settings.write; fromEmail must equal COMPANY_EMAIL; fromName 1-100; IANA timezone | AppSettings partial                                                     |
| GET/POST/PATCH/DELETE /ats/pipeline-templates             | general/page.tsx                                                                                                                                                | pipelineTemplates.read/write; at least 1 stage; stage name min 1; icon enum; color #RRGGBB        | PipelineTemplate                                                        |
| GET/POST/PATCH/DELETE /ats/email-templates (+ setDefault) | general/page.tsx                                                                                                                                                | emailTemplates.read/write; bodyHtml/bodyText min 1; variables enum                                | EmailTemplate                                                           |
| GET/POST/PATCH/DELETE /ats/disposition-reasons            | disposition-reasons/page.tsx                                                                                                                                    | settings.read / settings.write; DELETE returns 409 when the reason is in use                      | DispositionReason                                                       |
| GET/POST/PATCH/DELETE /ats/tags                           | tags-table                                                                                                                                                      | tags.read / write / manage; name 1-50                                                             | Tag                                                                     |
| GET /shared/users                                         | team/page.tsx; tags-table; client-detail UserCell/NoteAuthor                                                                                                    | team.read                                                                                         | User[]                                                                  |
| POST /shared/users                                        | invite-team-sheet                                                                                                                                               | team.write; roles enum, min 1 (`invitedBy` stripped)                                              | `{user, inviteToken}`                                                   |
| PATCH /shared/users/:id                                   | team-member-edit-sheet                                                                                                                                          | team.write                                                                                        | UpdateUserDto                                                           |
| DELETE /shared/users/:id                                  | team-table                                                                                                                                                      | team.manage; HARD delete (user.service.ts:468-493)                                                | none                                                                    |
| PATCH /shared/users/me, POST /shared/users/me/avatar      | account/page.tsx                                                                                                                                                | authenticated                                                                                     | User                                                                    |
| POST /shared/users/provision-client                       | client-detail-sheet                                                                                                                                             | team.write                                                                                        | `{clientId}` → User (sends invite email)                                |
| POST /shared/users/:id/revoke-crm                         | client-detail-sheet                                                                                                                                             | team.manage                                                                                       | User                                                                    |
| change-password / forgot-password                         | account/page.tsx via auth store                                                                                                                                 | auth routes                                                                                       | none                                                                    |

Backend endpoints that exist but the UI never calls:

- `PATCH /shared/users/:id/permissions` (team.manage). The store action `updatePermissions` exists but has no UI.
- `/ats/disposition-reasons/:id/reorder` and `/:id/deactivate`.

External services touched indirectly:

- AI provider (Claude or OpenAI): generate-draft, standardize, and AI settings.
- Resend: email templates, the provisioning invite, password reset. Inferred from comments in general/page.tsx and client-detail-sheet.
- Logo/avatar storage (Cloudinary or similar): inferred, not verified in scope.

---

### 8. Data models / types used

- **Job** (store/types/job.types.ts:24-53):
  - status: `open|draft|on_hold|closed`.
  - jobType: `full_time|part_time|contract|temporary`.
  - locationType: `remote|hybrid|onsite`.
  - experienceLevel: `entry|mid|senior|lead`.
  - priority: `low|medium|high|urgent`.
  - salaryRange: `{min, max, currency, period}`, with period from hourly to yearly.
  - pipeline: `{templateId?, stages: StageShape[]}`, copied from the template at creation.
  - tags: `RawTag[]`, either ids or populated objects.
  - `CreateJobDto.pipelineId` (job.types.ts:59) has no backend counterpart.
- **Client** (client.types.ts:34-57):
  - status: `active|inactive|suspended`.
  - companySize: `1-10|11-50|51-200|201-500|500+`. Legacy `1-50` is normalized to `11-50` in both the store and new-client-sheet (duplicated).
  - contacts[]: `{name, email, phone?, position?, isPrimary}`.
  - crmProfile: healthStatus (green|yellow|red), baaSign, baaSignedDate, emrSystem, onboardingComplete, sopReceived, satisfactionScore (1-5 or null), openIssuesCount, lastClientCheckin, notes.
  - ClientNote: `{method: call|email|meeting|message|other, content (max 5000)}`.
  - The backend crm-profile schema also accepts accountOwnerId, serviceStartDate and primary/secondary contacts, which the ATS UI does not surface.
- **PipelineTemplate / StageShape**:
  - Stage: `{_id, name, color (#RRGGBB), order (>= 1), isActive, icon (enum of 48)}`.
  - Template: `{name, description, isDefault, isActive, stages}`.
  - Rules: the backend requires at least one stage; a code comment says the default template must be active.
- **EmailTemplate**: name (max 100), subject (max 200), bodyHtml, bodyText, type (8 values), variables[] (enum), isDefault, isActive.
- **DispositionReason** (disposition-reasons.store.ts:5-33):
  - category: 7 values.
  - applicableStages: string[] of stage names.
  - defaultEligibility: `eligible|permanently_ineligible`, derived from the category.
  - requireInternalNotes, order.
- **AppSettings** (settings.types.ts):
  - email: `{fromEmail, fromName}`.
  - ai: `{provider: claude|openai, resumeValidation, candidateScoring, resumeParsing}`.
  - companyTimezone.
  - applicationConfirmation: `{enabled, templateId (or null)}`.
- **Tag**: `{_id, name (max 50), color, createdBy, createdAt}`.
- **User** (user.types.ts:31-51):
  - roles: 8 values. appAccess: `ats|crm`.
  - permissions: per resource, `{read, write, manage, schedule, approve}`.
  - isActive, emailVerified, isInviteAccepted, lastLoginAts/Crm, clientRef, candidateRef.
- Stale duplicate model types in settings/\_data/settings.ts use `id` instead of `_id`.

### 9. Dependencies used in scope

- `@tanstack/react-table`: clients, tags and team tables. job-list uses it only as a paginator, with `columns: []`.
- `@dnd-kit/core`: pipeline board. Uses DndContext, PointerSensor only, DragOverlay, useDraggable/useDroppable and rectIntersection.
- `react-hook-form` + `@hookform/resolvers/zod` + `zod`: only in new-client-sheet. All other forms use ad-hoc useState.
- `sonner`: toasts everywhere, including inside stores, so double toasts are possible.
- `zustand`: stores; jobs, clients, tags and users are persisted to localStorage.
- `lucide-react`: icons. pipeline-template-sheet imports 47 icons for ICON_MAP.
- `react-router-dom`: useSearchParams, useNavigate, useParams.
- Shared components: RichTextEditor/RichText (Tiptap + DOMPurify, out of scope), TagsSelector, ActivityTimeline, RejectDialog, ComposeEmailSheet, CandidateDetailSheet, ConfirmDialog, TimezoneSelect, TablePagination.

---

### 10. ISSUES

Severity / category / location / problem / impact / fix. "inferred" marks claims not directly proven by code read.

1. **High / bug: the pipeline chosen in the New Job sheet is silently ignored.** (new-job-sheet.tsx `pipelineId` in submit dto; backend/features/jobs/job.routes.ts createJobSchema; backend/shared/validators/common.validator.ts:46; backend/features/jobs/job.service.ts createJob)
   - What happens: the frontend sends `pipelineId`. The backend `createJobSchema` has no pipeline field, and `validate` replaces `req.body` with the parsed object, which strips it. The service reads `input.pipelineTemplateId`, which never arrives, so every job gets the default template.
   - Why it matters: the UI marks Pipeline as required and previews its stages, so users believe their choice took effect.
   - Fix: use one field name (`pipelineTemplateId`) in the zod schema, the DTO type (job.types.ts:59) and the form.

2. **High / bug: the job list stays stuck on a filtered subset.** (store/slices/jobs.store.ts:86-97 and items replacement; job-list.tsx status filter; jobs/page.tsx `?client=`; clients-table.tsx fetchJobs on mount)
   - What happens: after boot, `fetch` returns early for any call without an explicit filter, but an explicit filter replaces `items` with the server's subset. So after picking a status and then "All Status", or after `/ats/jobs?client=X` and then plain `/ats/jobs`, the "unfiltered" fetch does nothing.
   - Why it matters: the list, and the persisted store that clients and dashboard counts read, keep only the subset until a reload. clients-table's mount fetch has the same no-op, although its comment says it resets.
   - Fix: filter client-side (all data is already loaded), or force a refetch when a filter is cleared.

3. **High / bug (data overwrite): the Edit Job sheet holds stale values.** (new-job-sheet.tsx initial useState seeding; job-panel.tsx sheet mount keyed by job id; inline TagsSelector)
   - What happens: state is seeded once at mount, and the sheet stays mounted, keyed only by job id. Inline tag edits, socket updates, and the late-arriving `fetchOne` detail all leave the sheet's state stale.
   - Why it matters: Save PATCHes the stale tags and every other field, reverting the user's own or other users' changes. Cancel also keeps unsaved edits for the next open.
   - Fix: reset state from `job` on open (new-client-sheet already does this), or key the sheet by `job.updatedAt` plus an open counter.

4. **Medium / bug: the New Job form is never reset.**
   - What happens: `NewJobSheet` in job-list.tsx has no key, and its state lives in the component (not inside the Radix content). After a successful create or a "Discard", the next "Add Job" shows the previous job's data and immediately raises the discard prompt.
   - Why it matters: the `aiNotesCache` comment assumes the state unmounts, which it does not.
   - Fix: reset state after a successful create or discard, or remount with a key.

5. **High / bug (data corruption): the disposition reason edit sheet shows the wrong data.** (disposition-reasons/page.tsx DispositionReasonSheet useState seeding; `key` on SheetContent; parent always mounts the sheet)
   - What happens: `DispositionReasonSheet` seeds `useState` from `reason` but is always mounted. The incrementing `key` sits on `SheetContent`, not on the stateful component, so editing a reason shows the values from the first mount: an empty "new" form or a previously edited reason.
   - Why it matters: saving PATCHes the selected reason with the wrong label, category, stages and active flag.
   - Fix: put `key={editSheetKey}` on `<DispositionReasonSheet>` itself.

6. **High / bug (data loss): tag bulk delete can delete the wrong tags.** (tags-table.tsx useReactTable config ~387-400; bulk delete ~402-416)
   - What happens: there is no `getRowId`, so selection keys are row indexes into the current `filtered` array. Changing the search remaps those indexes to different tags, and "Delete selected" removes whatever now sits at them. `selectedCount` also counts hidden selections.
   - Why it matters: users can permanently delete tags they never selected.
   - Fix: add `getRowId: r => r._id` (team-table already does) and clear the selection when the filter changes.

7. **High / bug: email template variables are rejected by the backend.** (settings/\_data/settings.ts:137-145 EMAIL_VARIABLES; backend/features/email-templates/emailTemplate.routes.ts SYSTEM_VARIABLES_ENUM; email-template-sheet.tsx usedVars)
   - What happens: the picker offers `candidatePhone` and `currentStage`, which the backend enum lacks, so any template that uses them fails to save with a 400.
   - Also: the backend supports interviewDate, interviewTime, interviewType, meetingLink, interviewerName and companyName, which the picker does not offer and `usedVars` ignores. Variables in the subject are never scanned.
   - Fix: generate the list from one shared source.

8. **Medium / bug: an empty email body is allowed in the UI but rejected by the backend.** The backend requires `bodyHtml`/`bodyText` with min(1); email-template-sheet's submit check covers only name and subject.

9. **Medium / bug: pipeline board errors are unhandled.** (job-pipeline-board.tsx handleDragEnd; applications.store.ts moveStage rethrows)
   - What happens: there is no try/catch or toast. The optimistic `stageMap` is not reverted, `setActiveId(null)` is skipped, and dropping a card on its own column still sends a PATCH.
   - Fix: try/catch with rollback, and skip the call when the stage is unchanged.

10. **Medium / bug: a rejected card does not move.**
    - What happens: a comment in job-pipeline-board says the store patch moves the card to Rejected, but the board renders its own local `applications` state, which `rejectApp` never updates. The card stays in its stage column until a remount refetches. The module cache is likewise never updated after mutations.
    - Fix: patch local state after a mutation, or derive the board from the store.

11. **High / security-UX: the jobs UI has no permission gating.** (job-panel.tsx header buttons; job-list.tsx Add Job; router.tsx:79-81 unguarded)
    - What happens: status, pipeline, delete, edit, Add Job and AI controls show for everyone. Recruiter and coordinator have only `jobs.read`, and interviewer has no jobs permissions at all, yet `/ats/jobs` is unguarded.
    - Why it matters: the server enforces the rules, so the result is 403 toasts, not a breach.
    - Fix: gate the controls with `hasPermission('jobs','write'|'manage')`.

12. **Medium / security-UX: client permission gating is partial and inconsistent.**
    - What happens:
      - The table gates Edit and Delete, but "Add Client" is open.
      - `ClientDetailSheet` always receives `onEdit`/`onDelete`, so its header Edit/Delete bypass the gate.
      - Contacts, CRM edit, tags, notes and CRM provision/revoke are ungated.
    - Server requirements: notes are admin-only (backend client.routes.ts:158-180); provisioning needs `team.write`/`team.manage`.

13. **Medium / inconsistency: the frontend permission check has no hierarchy.**
    - What happens: `hooks/use-permission.ts:14` reads the exact flag, while the backend treats manage > write > read and schedule > write (authorize.ts:52-59).
    - Why it matters: a user with a custom `clients.manage` but no explicit `write` sees Delete but not Edit, and the Account permissions table under-reports access.

14. **Medium / security-UX: settings write controls are shown to non-admins.**
    - What happens: `/ats/settings/general` admits admin, hiring_manager, recruiter and coordinator, but only admin has `settings.write`, `pipelineTemplates.write` and `emailTemplates.write`. Every Save, New, Edit, Delete and Set-default control is shown and fails with a 403.
    - Only the Rejection Reasons tab is gated.

15. **Medium / inconsistency: Team is shown in the sidebar but blocked by the route, and the permission guide is wrong.**
    - Sidebar: it shows Team for `team.read` (app-sidebar.tsx:107), which the backend grants to HM, recruiter, coordinator and interviewer. The route is admin-only (router.tsx:99-106), so those users land on /unauthorized.
    - Permission Guide (permission-guide-dialog.tsx:127-136): it says team is admin-only, contradicting the backend. It also omits `interviewScorecards` and claims "approve → write" (424-427), which the backend hierarchy does not implement.

16. **Medium / bug: the pipeline template sheet closes before the async save resolves.** (pipeline-template-sheet.tsx submit; general/page.tsx save handler)
    - What happens: on a 400 (an empty stage name or zero stages, both rejected by the backend), the user loses the whole form. There is no client-side validation of stage names or stage count.
    - The same close-before-save pattern is in tag-form-sheet.

17. **Medium / bug (backend contract): every pipeline template edit regenerates all stage ids.**
    - What happens: `stageSchema` has no `_id`, the frontend strips `_id` (general/page.tsx), and the service replaces the stages array.
    - Why it matters: job-panel's fallback, which detects a job's template by stage ids, breaks for jobs created before the edit.
    - Also: the create schema has no `isActive`, so creating a template with "Active" off is ignored.

18. **Medium / bug: pipeline change dialog logic.**
    - (a) Inferred race: the auto-confirm effect runs on the first render after opening, while `appLoading` is still false and `scopedApps` still holds the previous open's data. JobPanel does not remount the dialog per job, so it can change the pipeline without showing anything.
    - (b) Counts are grouped by stage NAME and include rejected and hired applications that keep a `currentStage`.
    - (c) `newStages` is not filtered by `isActive`, while JobPanel's matching is.
    - (d) The mapping is keyed by stage name, so duplicate names collide.
    - (e) It uses a native `<select>`.

19. **Medium / performance: every job view loads all candidates and all applications.**
    - job-candidates and job-pipeline-board both GET `/ats/candidates?limit=9999`; the board also fetches every application, and job-list fetches all applications again.
    - Joins use `candidates.find` inside `map`, which is O(n\*m).
    - `approvedApplications` is not memoized, so the `pairs` memo recomputes on every render.
    - Boot already loaded this data into stores, so it ends up duplicated in three module caches.

20. **Medium / bug: the delete-job warning count reads the shared application store** (job-panel), while the page deliberately keeps per-job application data local. The count shown may not match what gets deleted (inferred).

21. **Medium / bug: unhandled promise rejections.**
    - job-panel `handleStatusChange`, `handleDelete` and `handlePipelineChange` await store actions that rethrow after toasting, and are called with `void`.
    - email-template-sheet `handleSubmit` has try/finally with no catch, and the parent in general/page.tsx rethrows.

22. **Medium / bug: optional job fields cannot be cleared when editing.** (new-job-sheet.tsx submit dto)
    - What happens: location, salary, deadline and start date become `undefined`, which JSON drops, so the PATCH keeps the old value. The backend would accept `null`.
    - Also: salary min > max is not validated; salary is silently dropped when no period is chosen; currency is free text.
    - The same pattern affects phone in team-member-edit-sheet and the address subfields in new-client-sheet.

23. **Medium / bug: client CRM edit sends null for a cleared Satisfaction Score.** The backend schema is `z.number().min(1).max(5).optional()`, which rejects null. Inputs are not clamped to 1-5 or >= 0 beyond HTML hints.

24. **Medium / bug: the client Notes tab can show another client's notes.** A `fetchedRef` in NotesTab blocks the refetch when `clientId` changes while the tab stays mounted (sheet content persists across clients and Tabs is uncontrolled). `notesLoading` is global (inferred from the mount model).

25. **Medium / bug: client create is not atomic.**
    - What happens: create, logo upload and contact creation run in sequence. If a later step fails, the catch says "Failed to create client" even though the client exists, and the sheet stays open.
    - Why it matters: retrying creates a duplicate client.

26. **Low / UX: logo "Remove" in edit only clears the preview.** It never deletes the server logo. The blob URL from `createObjectURL` is never revoked, and there is no size or type validation (the account avatar has the same gap).

27. **Low / bug: website field mismatch.** The hint promises https URLs, but the client schema accepts any string. The backend `httpUrlSchema` rejects bad values after submit; the error does include field details.

28. **Medium / bug: client tag updates fail silently.** `handleUpdateTags` in client-detail-sheet swallows errors with the comment "toast handled by store", but `clients.store.update` does not toast.

29. **Medium / bug: client column sort only sorts the current page.**
    - What happens: `data: pagedData` with `getSortedRowModel` sorts only the 10-row slice, and it competes with the "Sort" dropdown.
    - Also: tag search matches only populated tag objects, but list endpoints ship raw ids, so it never matches.

30. **Medium / bug: the tags table shows a load-error toast for any store error.**
    - What happens: the `useEffect` toasts "Failed to load tags" whenever `error` is set (tags-table.tsx ~298-300), but create, update and remove also set `error` in tags.store. A failed delete therefore shows two toasts, one of them wrong. team/page.tsx has the same pattern.
    - Also: tag actions are ungated. hiring_manager cannot delete tags (that needs `tags.manage`) but still sees the button.

31. **Medium / security-UX: team "Delete" is a hard delete with no self-protection.**
    - What happens: the UI says Delete, and the backend `deactivateUser` actually removes the document (backend user.service.ts:468-493). That orphans `createdBy` references, which the UI then shows as raw ids (client-detail-sheet, tags-table "Created by").
    - Inferred (no guard seen in deactivateUser or the edit sheet): nothing stops an admin from deleting themself, removing their own admin role, or deactivating themself.
    - Bulk delete runs through Promise.all and the store toasts once per user; the inline comment "toast handled by store" relies on that.

32. **Low / UX: team table selection and sorting.**
    - Row selection persists across filters, so `selectedCount` counts hidden rows while `getSelectedRowModel` deletes only the visible ones.
    - The Role column shows only the first role.
    - Sort state exists but no header is sortable. Tags has the same problem: no sortable headers, fixed createdAt desc.

33. **Low / UX: invite limitations.**
    - Invite allows only one role, although the backend and the edit sheet support several.
    - No client-side email validation.
    - It is not a `<form>`, so Enter does not submit.
    - `invitedBy` is sent but stripped by the backend schema.

34. **Low / inconsistency: team edit logging and missing permission UI.**
    - The edit sheet logs a profile edit as `permissions_updated`.
    - `users.store.updatePermissions` exists but no UI uses it, so per-user permission overrides cannot be managed from the app.

35. **Medium / UX (responsive): several screens break on mobile.**
    - The jobs master/detail has no mobile layout: a fixed `w-72/w-96` column sits beside the panel.
    - The email and pipeline template sheets use `w-[30vw]`, about 110px on a phone.
    - Template rows put 5-6 shrink-0 buttons in one row and overflow on narrow screens.
    - ats/CLAUDE.md says "Responsive must".

36. **Medium / UX: Revoke CRM access has no confirmation, and its status check is inconsistent.** `hasCrmAccess` in client-detail-sheet ignores `isActive`, while the table's CRM badge requires it. A revoked (inactive) user still shows "CRM Active" in the sheet.

37. **Low / bug: primary-contact enforcement is client-side and spread over several requests.**
    - Unchecking primary on the only contact leaves zero primaries.
    - There is no rollback if the second PATCH fails.
    - Checking a new primary does not demote the old one on the client side (depends on the backend; inferred).

38. **Low / bug: compose email to a client contact passes candidate variables.** `candidateName` is set to the contact's name, and `companyName`/`clientName` are empty, so templates render wrong values.

39. **Low / bug: job date handling.**
    - Start Date is shown as the raw ISO string.
    - "Posted" uses `createdAt.slice(0,10)`, which is UTC.
    - Date inputs convert with `new Date('YYYY-MM-DD').toISOString()` (UTC midnight) in new-job-sheet and client-detail-sheet, so dates can shift by a day for US users.
    - Each file uses a different date format.

40. **Low / ambiguity: the "View jobs" deep link uses the company name**, which is ambiguous when names repeat. Once applied, job-list shows no client-filter chip or clear button (only the status filter has one), so the list is silently filtered.

41. **Low / bug: openings and description validation.**
    - `Number(openings) || 1` turns 0 into 1 but lets negative numbers through, and the backend rejects them with a 400 (`min(1)`).
    - The required check runs `description.trim()` on the editor's HTML, so an empty editor value like `<p></p>` passes (inferred; depends on RichTextEditor).

42. **Low / bug: copy link.** There is no try/catch around `navigator.clipboard`, and it copies the public careers URL for draft and closed jobs too.

43. **Low / bug: application confirmation card.**
    - The template list is filtered to active templates, so a saved inactive template shows as blank.
    - The helper text lists `companyName`, which the variable picker does not offer.
    - The `initialized` ref never resyncs.

44. **Low / UX: email template view and edit.**
    - The view dialog shows only `bodyText`, never a rendered HTML preview.
    - Editing regenerates `bodyHtml` from the text, flattening rich HTML from seeded templates (inferred).
    - Changing the type of a default template while editing silently un-defaults it (the default toggle is hidden).

45. **Low / dead code: pipeline template sheet warnings.**
    - The `existingDefaultName` prop is never passed from general/page.tsx, so the "replaces X as default" warning never shows.
    - The "default must stay active" warning is unreachable in normal flows.

46. **Low / UX: reordering is promised but missing.**
    - The pipeline template sheet has no stage reorder and no per-stage active toggle, although its description mentions "stage order" and the view dialog lists inactive stages.
    - Disposition reasons show a drag handle with no reorder, although the backend has `PATCH /:id/reorder`.
    - Applicable stages is free-text CSV that must match stage names exactly.

47. **Low / inconsistency: the disposition page bypasses `useDispositionReasonsStore`** and calls the API directly. The store's cached `activeReasons`, used by reject flows, is not refreshed after admin edits until the next `fetchActive` (inferred).

48. **Low / misleading data: hardcoded fallbacks shown as real values.**
    - "Arista Healthcare Staffing", `hello@arista.com` and `America/Chicago` (settings/\_data/settings.ts:2-20) appear as real values before settings load.
    - The rest of `workspaceSettings` (name, website, description, currency) is unused.
    - The AI provider label hardcodes "OpenAI (GPT-4o)".

49. **Low / dead code.**
    - Placeholder pages `jobs/[id]`, `jobs/new`, `clients/[id]`, `clients/new` and `team/[id]` are routed but never linked.
    - `assign-candidate-dialog.tsx` is unused.
    - Stale types in settings/\_data/settings.ts: `PipelineTemplate`, `EmailTemplate`, `Permission`, `PermissionsMap`.
    - The `<Suspense>` wrapper in jobs/page.tsx does nothing in a Vite SPA.
    - `'use client'` directives (see section 5).

50. **Low / duplication: maps, labels and patterns are repeated.**
    - Status/label maps: job-list vs job-panel vs client-detail-sheet.
    - AVATAR_BG/statusConfig: clients-table and client-detail-sheet, with different styles.
    - RESOURCE/ROLE labels copied three times: settings/\_data/settings.ts, team-member-sheet.tsx, permission-guide-dialog.tsx:220-262.
    - The module-cache fetch pattern in job-candidates and job-pipeline-board.
    - Two near-identical view dialogs.
    - companySize normalization in new-client-sheet and clients.store.
    - `normalizeBullets` runs twice in job-panel.
    - These conflict with ats/CLAUDE.md: "Must follow the DRY principle".

51. **Low / a11y.**
    - Labels are not bound to inputs in most forms: new-job-sheet FormField, new-client-sheet Field, the team invite/edit Field, ContactForm, NoteForm, the disposition sheet.
    - Non-button elements are clickable: client table rows, board cards.
    - The dnd board has no KeyboardSensor.
    - ClientCombobox and StageIconPicker lack listbox semantics, keyboard navigation and Escape/outside-click handling; the icon picker never closes on an outside click.
    - The account page's tab buttons use `aria-current="page"`.
    - Switches have no labels (team-member-edit-sheet).

52. **Low / invalid markup (clients-table).**
    - A `<div>` progress bar is a direct child of `<table>`.
    - The skeleton renders 8 cells and the empty row uses `colSpan=8` for a 6-column table.
    - The `cols` memo omits `canEdit`, `canDelete` and handlers from its deps.

53. **Low / style: token bypass and doc conflict.**
    - STYLE.md (`--success: #69c58a`, "never raw palette values") conflicts with index.css (`--success: #16a34a`), and components hardcode `#69c58a`/`#2d8a51` (client-detail-sheet, team-table, team-member-sheet).
    - Native `<textarea>`/`<select>` are used instead of shadcn.
    - The pine-teal hover override is repeated on primary buttons.

54. **Low / ambiguity: CRM business rules live only in the UI.**
    - The CRM tab appears only when `crmProfile` already exists, and the ATS UI cannot create one.
    - CRM provisioning requires an active client with at least one hired application. That rule exists only in the UI (backend not verified).
    - The client Jobs tab counts candidates in all phases, including rejected.
    - `j.jobType.replace('_',' ')` yields "full time", while other screens use label maps.

55. **Low / UX: job Candidates tab.** Pending applications are counted but have no chip. The "Pendings First" sort option can never apply because the list is always filtered to a single phase, so the sort dropdown has no effect.

---

## Area B2 — Auth, dashboard, calendar, emails, hired, talent pool, ineligible, home

Auditor scope: read-only. All paths are relative to `ats/src/` unless prefixed with `backend/`.

---

### 1. Scope covered (every file read top to bottom)

| File                                                                     | Lines                                                                                               |
| ------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------- |
| App.tsx                                                                  | 6                                                                                                   |
| app/error.tsx                                                            | 23                                                                                                  |
| app/not-found.tsx                                                        | 11                                                                                                  |
| app/unauthorized/page.tsx                                                | 40                                                                                                  |
| app/home/page.tsx                                                        | 30                                                                                                  |
| app/home/\_components/home-background.tsx                                | 130                                                                                                 |
| app/home/\_components/home-hero.tsx                                      | 66                                                                                                  |
| app/home/\_components/home-topbar.tsx                                    | 31                                                                                                  |
| app/auth/layout.tsx                                                      | 22                                                                                                  |
| app/auth/\_components/auth-background.tsx                                | 91                                                                                                  |
| app/auth/login/page.tsx                                                  | 119                                                                                                 |
| app/auth/forgot-password/page.tsx                                        | 105                                                                                                 |
| app/auth/reset-password/page.tsx                                         | 184                                                                                                 |
| app/auth/verify-email/page.tsx                                           | 238                                                                                                 |
| app/dashboard/page.tsx                                                   | 79                                                                                                  |
| app/dashboard/\_components/dash-metric-cards.tsx                         | 340                                                                                                 |
| app/dashboard/\_components/dash-funnel.tsx                               | 211                                                                                                 |
| app/dashboard/\_components/dash-hiring-trend.tsx                         | 171                                                                                                 |
| app/dashboard/\_components/dash-applied-chart.tsx                        | 207                                                                                                 |
| app/dashboard/data.json                                                  | 614 (68 records; every record parsed and checked: keys id/header/type/status/target/limit/reviewer) |
| app/calendar/page.tsx                                                    | 125                                                                                                 |
| app/calendar/\_utils/calendar-helpers.ts                                 | 97                                                                                                  |
| app/calendar/\_components/calendar-header.tsx                            | 145                                                                                                 |
| app/calendar/\_components/event-card.tsx                                 | 39                                                                                                  |
| app/calendar/\_components/month-view.tsx                                 | 151                                                                                                 |
| app/calendar/\_components/week-view.tsx                                  | 113                                                                                                 |
| app/calendar/\_components/agenda-view.tsx                                | 211                                                                                                 |
| app/calendar/\_components/event-sheet.tsx                                | 795                                                                                                 |
| app/emails/page.tsx                                                      | 9                                                                                                   |
| app/emails/[id]/page.tsx                                                 | 406                                                                                                 |
| app/emails/\_utils/candidate-compose.ts                                  | 72                                                                                                  |
| app/emails/\_components/emails-list.tsx                                  | 850                                                                                                 |
| app/emails/\_components/compose-email-sheet.tsx                          | 462                                                                                                 |
| app/emails/\_components/email-detail-sheet.tsx                           | 462                                                                                                 |
| app/emails/\_components/template-selector.tsx                            | 296                                                                                                 |
| app/hired/page.tsx                                                       | 18                                                                                                  |
| app/hired/\_components/hired-table.tsx                                   | 1049                                                                                                |
| app/talent-pool/page.tsx                                                 | 19                                                                                                  |
| app/talent-pool/\_components/talent-pool-table.tsx                       | 1095                                                                                                |
| app/talent-pool/\_components/talent-pool-detail-sheet.tsx                | 1121                                                                                                |
| app/permanently-ineligible/page.tsx                                      | 18                                                                                                  |
| app/permanently-ineligible/\_components/permanently-ineligible-table.tsx | 608                                                                                                 |
| **Total**                                                                | **10,879**                                                                                          |

Context I read outside scope (only to confirm how things connect): `router.tsx`, `components/auth/protected-route.tsx`, `components/auth/role-guard.tsx`, `components/app-sidebar.tsx`, `hooks/use-permission.ts`, `hooks/use-socket-room.ts`, parts of `store/slices/{auth,dashboard,interviews,emails,applications,candidates}.store.ts`, `lib/timezones.ts` (getZonedDate/Time), `lib/boot-data.ts`, `index.css` (tokens), and on the backend `features/auth/auth.routes.ts` + `auth.service.ts` (resetPassword/verifyEmail/setPassword), `features/emails/email.routes.ts`, `email.service.ts`, `email.controller.ts`, `features/interviews/interview.routes.ts`, `features/candidates/candidate.routes.ts`, `features/users/user.service.ts` (role to permission map), `shared/validators/common.validator.ts`.

---

### 2. Summary by folder and file

#### App.tsx / router

- `App.tsx:1-6`: just renders `<RouterProvider router={router} />`.
- Routing (in `router.tsx`, out of scope but needed): `/ats` is the public home page, `/ats/{login,forgot-password,reset-password,verify-email/:token}` sit under `AuthLayout`, and the protected pages sit under `ProtectedRoute > Layout`. `errorElement: <ErrorPage/>` is attached **only** to the ProtectedRoute branch (`router.tsx:70`). `/ats/unauthorized` lives outside ProtectedRoute and Layout (`router.tsx:150`). `/` and `*` both show `NotFoundPage` (`router.tsx:153-154`).

#### app/error.tsx

- Route error boundary: `useRouteError()`, shows `statusText` or `error.message`, and has a "Go to Dashboard" button (`error.tsx:7-20`). Uses `min-h-svh` and sits full screen.

#### app/not-found.tsx

- A static 404 with no navigation link (`not-found.tsx:1-11`). It uses `flex-1`, so it relies on a flex parent, but it is mounted at the root with no layout (`router.tsx:153-154`).

#### app/unauthorized/page.tsx

- Shows an "Access denied" message, lists the user's roles (`unauthorized/page.tsx:21-27`), and has Go back and Dashboard buttons (`:31-36`).

#### app/home/\*

- `page.tsx`: the landing page shell with a canvas background, top bar, hero and a footer with the year (`home/page.tsx:13-30`).
- `home-background.tsx`: a DPR-aware canvas that draws a GitHub-contribution-style grid with deterministic hash levels (`:37-50`). It is theme-aware through `next-themes` `resolvedTheme` (`:54-59`) and repaints on resize via ResizeObserver (`:110-115`). It has a radial vignette and gradient overlays (`:126-127`).
- `home-hero.tsx`: headline, an "Enter workspace" link to `/ats/dashboard` (`:41-48`), and a list of three marketing module cards (`:9-25`).
- `home-topbar.tsx`: brand link to `/ats` and a Careers link to `/careers` (`:11-27`).

#### app/auth/\*

- `layout.tsx`: a centered `max-w-sm` column with the brand mark "Arista ATS." (`:14`) and an `<Outlet/>`.
- `_components/auth-background.tsx`: animated gradient orbs via an inline `<style>` with keyframes (`:4-20`), plus decorative SVG grid, rings and lines in hard-coded `oklch(0.6 0.12 185)` (`:65-86`).
- `login/page.tsx`: email and password form with show/hide (`:97-108`). It calls `useAuthStore.login` (`:43`) and redirects to `location.state.from.pathname` or `/ats/dashboard` once authenticated (`:24-37`).
- `forgot-password/page.tsx`: posts the email and shows a generic "If an account exists" confirmation (`:28-30`, `:40-63`).
- `reset-password/page.tsx`: reads `?token=` (`:27`), validates that the two passwords match and are at least 8 characters on the client (`:38-45`), calls `resetPassword(token,pw)`, then redirects to login after 2s (`:48-51`).
- `verify-email/page.tsx`: on mount calls `verifyEmail(token)` once, guarded by `useRef` (`:41-53`). On success it shows a set-password form that calls **`resetPassword(token, pw)`** (`:68`), then redirects to login (`:71`).

#### app/dashboard/\*

- `page.tsx`: sets `dashboardStore.setActive(true)` and calls `fetch()` on mount (`:19-25`), and shows a toast on error (`:27-29`). It has a "Post New Job" button that goes to `/ats/jobs?action=new` (`:39`). The layout is the metric cards, then a 2/3 + 1/3 chart grid, then the funnel (`:52-68`). It is wrapped in a pointless `<Suspense>` (`:73-79`).
- `dash-metric-cards.tsx`: three KPI cards (Candidates, Clients, Open Jobs) with 6-month sparklines (`buildMonthly6m` `:42-64`) and a 3-month-vs-previous-3-month % change (`pctChange3m` `:66-81`). `MetricCard` (`:83-256`) duplicates its whole JSX for the bar and line variants. There is a skeleton (`:258-275`).
- `dash-funnel.tsx`: a "Hiring Pipeline" card with four stage tiles (Pending Review, In Pipeline, Hired, Talent Pool), each with a count, a conversion badge and a % of total (`:8-37`, `:137-206`). The hire rate is application-based (`:86-89`).
- `dash-hiring-trend.tsx`: an area chart of hires per month over the last 6 months, driven by `app.hiredAt` (`:30-58`). It has a "View Open Roles" footer link to `/ats/jobs` (`:161-167`).
- `dash-applied-chart.tsx`: a line chart of applications with 30d (daily) and 3m/6m/12m (monthly) range tabs (`:26-31`, `:35-80`), plus a total for each range (`:95-104`).
- `data.json`: 68 shadcn "dashboard-01" template rows (Cover page, Table of contents, ... reviewer "Eddie Lake", "Jamik Tashpulatov"). **Nothing references it** (a grep for `data.json` / `./data` across `ats/` finds no importer). This is dead sample data.

#### app/calendar/\*

- `page.tsx`: holds view state (month/week/agenda, default month `:18`), `currentDate`, the status filter, and the sheet state. It loads interviews via `useInterviewStore.fetch({limit:200, status?})` (`:32-40`) and joins the `interviews` socket room (`:30`). Prev/next step by a week or a month (`:42-58`); agenda also steps by month.
- `_utils/calendar-helpers.ts`: `toISO` (local date), plus `getInterviewDate`, `getInterviewStartTime` and `getInterviewEndTime`, which use the interview's own timezone through `lib/timezones` (`:23-54`). Also `formatScheduledAt`, `formatDateLabel` and `getMeetingLocation`.
- `calendar-header.tsx`: Today, prev and next buttons and a title (`:30-43`, `:69-95`), a status filter Select (`:98-113`), a view ToggleGroup that is **`hidden sm:flex`** (`:119`), and a New Event button (`:138-141`).
- `event-card.tsx`: a pill button colored by interview type, dimmed when the status is not scheduled (`:5-13`, `:24-37`).
- `month-view.tsx`: a 6x7 grid (`:38-52`) with events sorted by zoned start time (`:57-66`), at most 3 per cell, then "+N more" (`:92-93`, `:131-144`). Clicking an empty cell creates an event (`:103-107`).
- `week-view.tsx`: a 7-column week starting Sunday (`:12-17`). Clicking an empty day creates an event (`:89-93`).
- `agenda-view.tsx`: groups the current month's interviews by zoned date (`:64-89`) and resolves interviewer names from `useUserStore` (`:57-62`). It has an empty state (`:91-99`). The `onSlotClick` prop is ignored (`:51`).
- `event-sheet.tsx`: in detail mode it renders `EventDetail` (`:103-473`) with type and status badges, time, link (click-to-copy), phone, address, interviewers, existing feedback, an inline feedback form (rating, recommendation, notes) and action buttons (Edit / Feedback / Mark as Complete / No Show / Cancel Interview) that show **only when status is scheduled** (`:428-470`). Create and edit modes render the shared `ScheduleInterviewDialog` (`:706-766`). Schedulable candidates are those with an `approved` application (`:575-592`). The wall clock is converted to UTC with `zonedWallClockToUtc(date,time, companyTimezone)` (`:619-623`, `:662-666`).

#### app/emails/\*

- `page.tsx`: a wrapper around `<EmailsList/>`.
- `_components/emails-list.tsx`: a mailbox UI. It has All/Inbox/Sent/Failed tabs with counts from 4 separate `limit:1` requests (`:385-412`), a search box (debounced, `:446-451`), a status Select (`:617-632`), and Compose. Paging is server-side and persisted to session/localStorage (`:326-334`, `:458-479`). Rows have checkboxes, single delete through ConfirmDialog (`:831-847`), and bulk delete with an inline Yes/No (`:669-699`). Clicking a row opens `EmailDetailSheet` and marks the email read (`:545-549`). There is a stepBack-on-empty-page helper (`:367-374`).
- `_components/compose-email-sheet.tsx`: a composer with new / reply / forward / prefill modes (`:52-70`). Form state is reset during render based on a "mode signature" (`:94-182`). It has the template picker, To/Cc/Bcc `RecipientField`s, subject, a plain-text body and attachments (upload through `uploadAttachment`, 10 MB limit `:33`, `:199-215`). On send it wraps the body in `<pre>` with HTML escaped (`:267`) and passes `context`, `variables`, `inReplyTo`, `threadId` and `attachments` (`:260-275`).
- `_components/email-detail-sheet.tsx`: shows the subject, a status badge (with failure-reason tooltip), a context chip that shows raw ObjectIds (`:151-157`), sender, recipients, cc/bcc, and the HTML body in `<iframe srcDoc sandbox="allow-same-origin">` (`:357-362`) or the text body. Attachments are download links. The footer has Delete (confirm), Reply or Resend (Resend replaces Reply when status is failed), and Forward.
- `_components/template-selector.tsx`: a popover listing active templates grouped by `EMAIL_TEMPLATE_TYPES` with search and emoji icons (`:38-47`, `:99-117`). It returns `{templateId,type,subject,bodyText,bodyHtml}`. It still has a Next.js leftover `'use client'` (`:1`).
- `_utils/candidate-compose.ts`: `buildCandidateComposeMode` dedupes candidate emails and puts **all** of them into one `to` string (`:52-53`). With a single recipient it uses the `general` template and fills in variables (`:56-70`).
- `[id]/page.tsx`: a thread view. It runs `fetchOne(id)`, then `fetchThread(threadId)`, sorts by createdAt (`:273-304`), and renders an `EmailMessage` card for each message with Reply/Resend/Forward (`:106-248`). Compose opens the shared sheet.

#### app/hired/\*

- `page.tsx`: a Suspense wrapper.
- `_components/hired-table.tsx`: candidates who hold at least one `hired` application (`:236`). The data comes from `fetchAppsScoped({limit:9999})` with the shared applications store as fallback (`:146-164`). Columns: select, Candidate, Hired For (first hire + "+N" tooltip), Other Activity (approved-phase apps + talent pool), Tags, Hired Date, and actions (Assign to job, Email, menu with Add/Remove Talent Pool) (`:341-596`). There is client-side search over name/email/phone/skills and a tag filter (`:235-261`). It contains local `TagFilter` (`:792-890`) and `AssignJobDialog` (`:893-1049`) components. The row click opens the shared `CandidateDetailSheet`.

#### app/talent-pool/\*

- `page.tsx`: a Suspense wrapper.
- `_components/talent-pool-table.tsx`: `items.filter(c => c.inTalentPool)` (`:578`) with search (name, email, phone, skills, current title/company) and a tag filter. Columns: select, Candidate, Current Role, Skills (+N tooltip), Exp, Tags, Notes, and actions (Remove from pool with confirm, Assign to job, Email) (`:712-899`). It contains local `TagFilter` (`:86-202`), `AssignJobDialog` (`:288-446`) and `RemoveTalentPoolConfirmDialog` (`:448-495`).
- `_components/talent-pool-detail-sheet.tsx`: a large profile sheet. It shows identity (avatar, email, phone, years of experience), PI and Legal Hold badges, `TagsSelector` (`:728-733`), "added to pool" date, Remove from pool and Assign to job, an inline notes editor (`TalentPoolNotesEditor` `:71-176`), summary, skills, languages, certs, experience timeline, education, Additional Info (salary PHP/USD, reason for leaving `:879-929`), resume viewer and intro video (`:932-953`), portfolio, CRM profile (workload, satisfaction stars, burnout/replacement risk, notes `:969-1037`), and an activity timeline with email activity (`:1043-1051`). It contains a **third** copy of `AssignJobDialog` (`:300-445`).

#### app/permanently-ineligible/\*

- `page.tsx`: a Suspense wrapper.
- `_components/permanently-ineligible-table.tsx`: reads `useCandidateStore.ineligibleItems` and loads it once via `fetchIneligible()` (`:72-74`, `:141-143`). Columns: Candidate, Reason (server-resolved label), Marked Ineligible, Legal Hold, and actions (View, Restore through `RestoreCandidateDialog` which needs a job, Legal hold toggle, Permanent delete with confirm) (`:252-419`). Legal hold and delete call `patchJson` / `deleteJson` **directly from the component** (`:212`, `:228`), not through the store.

---

### 3. Features and user flows

#### 3.1 Landing to login

1. The user visits `/ats` and sees HomePage. "Enter workspace" links to `/ats/dashboard` (`home-hero.tsx:43`).
2. ProtectedRoute redirects to `/ats/login` with `state.from` when the user is unauthenticated (`protected-route.tsx:25-27`).
3. On login submit, `useAuthStore.login` POSTs `/auth/login` `{email,password}` (`auth.store.ts:101-104`), stores the access token, reconnects the socket and sets the user. The page's effect then navigates to `from` (pathname only) or `/ats/dashboard` (`login/page.tsx:24-37`).
4. ProtectedRoute runs `bootAllData()`, which fetches every store with limit 9999 (`boot-data.ts:78-89`), and shows `AppLoader` until it is done.

#### 3.2 Forgot and reset password

1. `/ats/forgot-password` POSTs `/auth/forgot-password` `{email}` (public). It always shows "Check your email" (`forgot-password/page.tsx:28-30`).
2. The email links to `/ats/reset-password?token=...` (`backend/src/features/auth/auth.service.ts:173`).
3. The form validates on the client and POSTs `/auth/reset-password` `{token,password}`, then shows "Password updated" and redirects to `/ats/login` after 2s (`reset-password/page.tsx:36-59`).

#### 3.3 Invitation acceptance

1. An admin invites a user, and the email links to `/ats/verify-email/:inviteToken` (`backend/src/features/users/user.service.ts:333`).
2. On mount the page POSTs `/auth/verify-email` `{token}`. The backend sets `emailVerified` and `isInviteAccepted` but does not use up the token (`backend/.../auth.service.ts:320-338`).
3. The user sets a password, and the page POSTs **`/auth/reset-password`** `{token,password}` (`verify-email/page.tsx:68`). The backend accepts the invite token and activates the account (`auth.service.ts:242-275`). The page redirects to login; there is no auto sign-in despite the button label "Set password & sign in" (`:226`).

#### 3.4 Dashboard

1. On mount: `setActive(true)` and `fetch()` (`dashboard/page.tsx:19-25`).
2. The store fires 6 requests in parallel: GET `/ats/dashboard` (errors swallowed to null), `/ats/clients`, `/ats/jobs`, `/ats/candidates`, `/ats/applications`, `/ats/interviews`, each with `{page:1,limit:9999}` (`dashboard.store.ts:597-613`).
3. KPIs come from the snapshot when present, otherwise they are derived on the client (`dashboard.store.ts:498-535`). A socket invalidator refetches while the page is active (`:558-563`).
4. The components derive charts on the client from the raw lists.

#### 3.5 Calendar

1. On mount the page calls `fetch({limit:200})`. After boot this is a **no-op** because the params hold only `limit` (`interviews.store.ts:98-112`), so the calendar shows the boot-loaded `items` (limit 9999).
2. Choosing a status triggers `refresh({limit:200,status})`, which **replaces** the shared `items` with up to 200 filtered rows (`interviews.store.ts:115-136`).
3. Clicking an empty day or "New Event" opens `ScheduleInterviewDialog` in create mode. The user picks an open job, then a candidate with an approved app for that job. On submit the page POSTs `/ats/interviews` with applicationId, candidateId, jobId, clientId, title, type, scheduledAt (UTC computed in company tz), interviewerIds and meetingDetails (`event-sheet.tsx:631-645`). Then `onMutate()` runs (`loadInterviews`, usually a no-op) and the dialog closes.
4. Clicking an event opens the detail Sheet:
   - Edit opens the same dialog in edit mode, then PATCH `/ats/interviews/:id`.
   - Mark as Complete sends PATCH `{status:'completed'}`; No Show sends PATCH `{status:'no_show'}`. Both also call `logOptimisticActivity` (`:161-208`).
   - Cancel sends DELETE `/ats/interviews/:id` (the store marks it cancelled) (`:210-219`). There is no confirmation.
   - Feedback sends POST `/ats/interviews/:id/feedback` `{rating,notes,recommendation}` (`:136-159`).
5. Backend guards: `requirePermission('interviews','read'|'write')` (`backend/src/features/interviews/interview.routes.ts:27-54`).

#### 3.6 Emails

1. `/ats/emails` (not in the sidebar; it is reached from the unread-emails toast, `components/unread-emails-toast.tsx:29`) fetches GET `/ats/emails?direction&status&search&page&limit` and the 4 count queries.
2. Compose: the user fills To/Cc/Bcc/subject/body and an optional template. "Attach file" POSTs `/ats/emails/attachments` (form-data) (`emails.store.ts:246-249`). Send POSTs `/ats/emails` `{to[],cc[],bcc[],subject,bodyHtml,bodyText,templateId,context,variables,inReplyTo,threadId,attachments}`.
3. Opening a row runs PATCH `/ats/emails/:id/read` when the row is unread. Delete runs DELETE `/ats/emails/:id`. Resend runs POST `/ats/emails/:id/resend` (only for failed emails).
4. Thread page `/ats/emails/:id`: GET `/ats/emails/:id`, then GET `/ats/emails/thread/:threadId`. Nothing in the app links to this route (a grep for `/ats/emails/` finds no link).
5. Bulk email from Hired or Talent Pool: select rows, `buildCandidateComposeMode`, and one email goes out with every candidate in **To**.

#### 3.7 Hired

1. Mount: fetch tags, jobs and clients if they are empty, and run `fetchAppsScoped({limit:9999})` (GET `/ats/applications`).
2. The rows are candidates in `candidateStore.items` that have a hired application. Search and tag filter run on the client.
3. Assign to job: pick an open job and an optional start stage, then `assignJob(candidateId, jobId, stageId)` (POST `/ats/candidates/:id/assign-job`, inferred from the route list in `backend/src/features/candidates/candidate.routes.ts:311-314`), then re-run the scoped apps fetch (`hired-table.tsx:281-294`).
4. Talent pool toggle: `updateTalentPool(id,'add'|'remove')` (PATCH `/ats/candidates/:id/talent-pool`).
5. Email: opens the composer prefilled.

#### 3.8 Talent Pool

1. Rows come from `candidateStore.items.filter(inTalentPool)`. Search, tags and actions work as on Hired, plus Remove (with confirm).
2. Detail sheet:
   - Notes editor calls `updateTalentPool(id,'add',notes)`.
   - Tags call `updateCandidate(id,{tags})` (PATCH `/ats/candidates/:id`).
   - Assign job and remove from pool are also available here.
   - Activity timeline: GET activity logs plus email activity, through the hooks.

#### 3.9 Permanently Ineligible (admin only, via `RoleGuard`, `router.tsx:93`)

1. `fetchIneligible()` loads once per session.
2. Restore: pick a job, then `restoreCandidate(id,{jobId})` (PATCH `/ats/candidates/:id/restore`, `requireRoles('admin')`).
3. Legal hold: PATCH `/ats/candidates/:id/legal-hold` `{legalHold}` (admin), then `fetchIneligible(true)`.
4. Delete: confirm dialog, then DELETE `/ats/candidates/:id` (`requirePermission('candidates','manage')`; the backend refuses when legalHold is set, `candidate.service.ts:586`), then `fetchIneligible(true)`.

---

### 4. UI/UX observations

- **Layout consistency:** the list pages (Hired, Talent Pool, PI, Emails) share one pattern: toolbar, count line, optional bulk bar, bordered table with a sticky header, and pagination. The dashboard uses a different header style (`text-2xl font-light`, `dashboard/page.tsx:35`), while the other pages have no in-page title.
- **Loading states:** these exist throughout (skeletons in the dashboard, calendar, emails and tables; "Loading…" text). The dashboard metric cards show a skeleton until `kpi` is set (`dash-metric-cards.tsx:283-291`).
- **Empty states:** they exist, but Hired and Talent Pool show "No hired candidates yet." / "No candidates in the talent pool yet." even when a filter is what emptied the list (`hired-table.tsx:741`, `talent-pool-table.tsx:1042`). PI handles this correctly (`permanently-ineligible-table.tsx:518-520`).
- **Error states:** the dashboard shows only a toast. The email thread page has an error card. The other pages rely on store toasts.
- **Responsiveness:**
  - The calendar view toggle is hidden below `sm` (`calendar-header.tsx:119`), so mobile users are stuck in month view, a 7-column grid with `min-h-20` cells.
  - The talent pool detail sheet has `min-w-95` (380px) (`talent-pool-detail-sheet.tsx:592`), which overflows on very narrow phones.
  - The compose and detail sheets use inline `style={{ width: '44rem', maxWidth: '100vw' }}` (`compose-email-sheet.tsx:286`, `email-detail-sheet.tsx:248`) instead of Tailwind classes.
- **Dark mode:** generally handled with `dark:` variants. The landing page canvas reads `resolvedTheme`. Hard-coded hex colors in dashboard tiles (`#94a3b8`, `#60a5fa`, `#34d399`, `#a78bfa`, `#3b82f6`, `#10b981`) do not adapt between themes (`dash-funnel.tsx:8-37`, `dash-metric-cards.tsx:318,327`, `dash-hiring-trend.tsx:24`).
- **Accessibility:**
  - Clickable table rows are mouse-only (`onClick` on `<tr>`, no keyboard access) (`hired-table.tsx:716-717`, `talent-pool-table.tsx:1015-1016`, `permanently-ineligible-table.tsx:499-500`).
  - Calendar day cells get `role="button"` with no `tabIndex` and no key handler (`month-view.tsx:108-110`, `week-view.tsx:94-96`).
  - In the email list a `<button>` is nested inside a `<button>` (`emails-list.tsx:220` wraps `:257`).
  - Emoji icons are not `aria-hidden` (`template-selector.tsx:160-161, 226-228`).
  - The template label points to a non-existent id (`compose-email-sheet.tsx:302`).
  - The email search inputs have no label (only placeholders) (`emails-list.tsx:609-614`, `template-selector.tsx:193-199`).
  - Good: password toggles have aria-labels, star rating buttons have `aria-pressed`, the checkboxes have aria-labels, and the sheets have sr-only titles.
- **Feedback:** after Mark Complete, No Show or Cancel, the open sheet keeps showing the old event (see Issue #6).

### 5. Styles

- Tailwind v4 syntax throughout (`bg-linear-to-r`, `size-*`, `p-0!`, `w-(--radix-popover-trigger-width)`, `wrap-break-word`, `min-h-50`, `h-62.5`). shadcn primitives are used: Card, Sheet, Dialog, Select, Popover, Tooltip, Table, Tabs, Checkbox, Badge, ToggleGroup, Chart (Recharts wrapper).
- Tokens: `--primary`, `--success`, `--warning`, `--destructive`, `--chart-1`, `--muted-foreground` (from `index.css`). `--success` and `--warning` are defined only in `:root` (`index.css:93-96`), not redefined under `.dark`.
- Custom CSS: an inline `<style>` with keyframes in `auth-background.tsx:4-20`; the `.tp-duration` utility (`index.css:357-360`) forces italics; raw `oklch(...)` strings in the canvas and SVG.
- Inconsistencies and duplication:
  - Interview `TYPE_STYLES`, `TYPE_LABELS` and `STATUS_STYLES` are copy-pasted in `event-card.tsx:5-13`, `agenda-view.tsx:16-38` and `event-sheet.tsx:60-89`.
  - Email `statusConfig` appears in `emails-list.tsx:46-79`, `email-detail-sheet.tsx:38-82` and `[id]/page.tsx:26-35`. The thread-page copy lacks delayed/bounced/complained.
  - `formatFileSize` is copied 3 times (`compose-email-sheet.tsx:46`, `email-detail-sheet.tsx:32`, `[id]/page.tsx:37`).
  - `ContextChip` and `DirectionIcon` are each copied 2-3 times.
  - `TagFilter` is copied 2 times (`hired-table.tsx:792`, `talent-pool-table.tsx:86`).
  - `AssignJobDialog` is copied 3 times, with different UX (chips vs Select for the stage) (`hired-table.tsx:893`, `talent-pool-table.tsx:288`, `talent-pool-detail-sheet.tsx:300`).
  - Auth pages repeat the card class string `rounded-xl shadow-lg border-border/60 bg-card/80 backdrop-blur-md` about 10 times, and the password-with-toggle input 4 times.
  - The brand text "Arista ATS." in the auth layout (`auth/layout.tsx:14`) uses a `CommandIcon` placeholder, while the home top bar uses `/arista-ats.png` (`home-topbar.tsx:16`).
  - Each table cell creates its own `TooltipProvider` even though the whole table is already wrapped in one (e.g. `hired-table.tsx:416, 448, 516, 538` inside `:616`).
  - All of this conflicts with the repo's own `ats/CLAUDE.md` rules (DRY, reusable components, use shadcn, light/dark theming).

### 6. Roles and permissions in scope

- Route guards (`router.tsx`): only `permanently-ineligible` has `RoleGuard allowedRoles={['admin']}` (`:92-96`). **dashboard, calendar, emails, emails/:id, hired and talent-pool have no route-level guard.** Any authenticated ATS user can open them by URL; only the backend enforces access.
- Sidebar (`components/app-sidebar.tsx:84-108`):
  - Dashboard requires `dashboard.read`.
  - Calendar requires `interviews.read`.
  - Hired and Talent Pool require `candidates.read`.
  - Ineligible requires the `admin` role.
  - Emails has **no sidebar entry**.
- **No component in my scope calls `usePermission`/`hasPermission`/`hasRole`** (grep found nothing). So write actions show for everyone:
  - Assign job, Talent-pool add/remove, Email, tag edit and notes edit.
  - Calendar Edit, Complete, No Show, Cancel and Feedback.
  - Email delete and resend.
- Backend role map (`backend/src/features/users/user.service.ts:36-130`): `interviewer` has candidates.read only, interviews read/write, and **no dashboard, clients, jobs or emails**. Effects:
  - An interviewer can see Hired and Talent Pool, but every write button returns 403.
  - Their login lands on `/ats/dashboard` (`login/page.tsx:26`), whose `/ats/clients` and `/ats/jobs` fetches fail, so `Promise.all` rejects and they see a "Failed to load dashboard data" toast and an empty page (inferred from `dashboard.store.ts:597-613` and the permission map).
  - The Unauthorized and Error pages also send everyone to the Dashboard (`unauthorized/page.tsx:34`, `error.tsx:19`).
- Interview actions: anyone with `interviews.write` can cancel or complete **any** interview and submit feedback (there is no check that the user is an assigned interviewer) (`event-sheet.tsx:428-470`).
- Emails: `emails.read` returns all emails for everyone. The backend `getAllEmails` has no owner scoping (`backend/src/features/emails/email.service.ts:11-47`). This is a shared mailbox; it is unclear whether that is intended.
- Unauthorized page: shows the role names to the user (`unauthorized/page.tsx:21-27`). This is harmless.

### 7. Connections (frontend calls from my scope, directly or through stores)

| Method & path                                                                                         | Caller                                                                                              | Backend guard                                                                                                     |
| ----------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | ------- | -------------------------------------------------------------------- |
| POST /auth/login                                                                                      | login page via auth.store (`auth.store.ts:101-104`)                                                 | public, zod                                                                                                       |
| POST /auth/forgot-password                                                                            | forgot page (`auth.store.ts:149-151`)                                                               | public                                                                                                            |
| POST /auth/reset-password `{token,password}`                                                          | reset page and verify-email page (`auth.store.ts:153-155`)                                          | public; accepts passwordResetToken OR inviteToken (`backend/.../auth.service.ts:242-275`)                         |
| POST /auth/verify-email `{token}`                                                                     | verify-email page (`auth.store.ts:157-159`)                                                         | public                                                                                                            |
| (unused by ATS) POST /auth/set-password                                                               | CRM uses it (`crm/src/services/auth.service.ts:81`); ATS does not                                   | public                                                                                                            |
| GET /ats/dashboard                                                                                    | dashboard.store (`:598`)                                                                            | `requirePermission('dashboard','read')` (`atsDashboard.routes.ts:14`)                                             |
| GET /ats/clients, /ats/jobs, /ats/candidates, /ats/applications, /ats/interviews `?page=1&limit=9999` | dashboard.store (`:599-612`), hired/TP/PI (`fetchJobs`, `fetchClients`, `fetchAppsScoped`)          | per-resource read permission                                                                                      |
| GET /ats/interviews `?limit=200&status=`                                                              | calendar page (`page.tsx:32-36`)                                                                    | interviews.read                                                                                                   |
| POST /ats/interviews                                                                                  | event-sheet create (`:631`)                                                                         | interviews.write + zod                                                                                            |
| PATCH /ats/interviews/:id                                                                             | event-sheet edit / complete / no-show                                                               | interviews.write                                                                                                  |
| DELETE /ats/interviews/:id                                                                            | event-sheet cancel                                                                                  | interviews.write                                                                                                  |
| POST /ats/interviews/:id/feedback                                                                     | event-sheet feedback                                                                                | interviews.write                                                                                                  |
| GET /ats/emails `?direction&status&search&page&limit`                                                 | emails-list (`:349-355`, `:387-404`)                                                                | emails.read. **`search` is ignored by the backend** (`email.controller.ts:7-27`, `email.service.ts:11-29`)        |
| POST /ats/emails                                                                                      | compose-email-sheet (`:260-275`)                                                                    | emails.write; zod schema has **no `attachments` field** (`backend/.../email.routes.ts:19-39`)                     |
| POST /ats/emails/attachments (multipart)                                                              | emails.store `uploadAttachment` (`emails.store.ts:246-249`)                                         | **no such route** (`email.routes.ts:46-67`)                                                                       |
| GET /ats/emails/:id, GET /ats/emails/thread/:threadId                                                 | [id] page                                                                                           | emails.read                                                                                                       |
| PATCH /ats/emails/:id/read                                                                            | emails-list openDetail                                                                              | emails.read                                                                                                       |
| DELETE /ats/emails/:id                                                                                | emails-list, detail sheet                                                                           | emails.write                                                                                                      |
| POST /ats/emails/:id/resend                                                                           | emails-list, detail sheet, thread page                                                              | emails.write                                                                                                      |
| POST /ats/candidates/:id/assign-job                                                                   | hired, TP, TP sheet via `assignJob`                                                                 | candidates.write                                                                                                  |
| PATCH /ats/candidates/:id/talent-pool                                                                 | hired, TP, TP sheet                                                                                 | candidates.write                                                                                                  |
| PATCH /ats/candidates/:id                                                                             | TP sheet tags                                                                                       | candidates.write                                                                                                  |
| PATCH /ats/candidates/:id/restore                                                                     | PI via store                                                                                        | `requireRoles('admin')`                                                                                           |
| PATCH /ats/candidates/:id/legal-hold                                                                  | PI direct `patchJson` (`:228`)                                                                      | `requireRoles('admin')`                                                                                           |
| DELETE /ats/candidates/:id                                                                            | PI direct `deleteJson` (`:212`)                                                                     | candidates.manage (hiring_manager/recruiter also have it, `user.service.ts:75,90`); blocked when legalHold is set |
| Socket rooms                                                                                          | calendar `interviews`; hired/TP `candidates`+`applications`; PI `candidates`; dashboard invalidator | socket events `interview:created                                                                                  | updated | deleted` patch the store (`store/realtime/socket.ts:99-101,261-291`) |

External services that surface in scope:

- Resend (emails sent and received; webhook-delivered inbound emails are shown in the iframe).
- Cloudinary (intro video playback, detected by the `'cloudinary'` substring, `talent-pool-detail-sheet.tsx:185`; resume/portfolio via shared viewers).
- Zoom and Google Meet are only interview types/links (Google Meet needs a manual link, `event-sheet.tsx:615-618`).
- No AI calls in scope.

### 8. Data models/types used in scope (from usage)

- **Interview:** `_id, title, type ('zoom'|'google_meet'|'phone_call'|'in_person'), status ('scheduled'|'completed'|'cancelled'|'no_show'), scheduledAt (UTC ISO), duration (min), timezone, meetingDetails{link,phoneNumber,address}, interviewerIds[], interviewerNames?[], feedbacks[{_id,interviewerId,rating 1-5,notes,recommendation 'strong_yes'|'yes'|'neutral'|'no'|'strong_no'}], applicationId, candidateId, jobId, clientId` (`event-sheet.tsx`, `agenda-view.tsx`).
- **Email:** `_id, direction ('inbound'|'outbound'), status ('delivered'|'received'|'sent'|'pending'|'failed'|'delayed'|'bounced'|'complained'), from, to[], cc?[], bcc?[], subject, bodyHtml?, bodyText?, attachments?[{url,filename,size}], context?{type,candidateId,applicationId,jobId,interviewId}, threadId, isRead, sentAt?, receivedAt?, createdAt, failureReason?` (`emails-list.tsx:46-79`, `email-detail-sheet.tsx`).
- **EmailTemplate:** `_id, name, type, subject, bodyText, bodyHtml, isActive, isDefault` (`template-selector.tsx`).
- **ComposeMode** union (`compose-email-sheet.tsx:52-70`).
- **Candidate** fields read in scope: `firstName, lastName, email, phone, avatar, tags (string|{_id}), parsedData{summary,skills[],languages[],certifications[],experience[{title,company,duration,description}],education[{degree,field,institution,year}]}, yearsOfExperience, inTalentPool, talentPoolNotes, talentPoolAddedAt, status, eligibilityStatus ('eligible'|'permanently_ineligible'), permanentlyIneligibleAt, permanentlyIneligibleReasonLabel, legalHold, currentSalaryPHP, currentSalaryUSD, reasonForLeaving, resumeUrl, resumeOriginalName, videoIntroUrl, videoIntroSource ('cloudinary'|'external'), portfolioUrl/FileUrl/FileName, crmProfile{workloadLevel,satisfactionScore,lastVaCheckin,burnoutRiskFlag,replacementRiskFlag,notes}, createdAt`.
- **Application:** `_id, candidateId, jobId, clientId, phase ('pending'|'approved'|'hired'|'rejected', legacy 'in_pipeline'), appliedAt, hiredAt, source ('direct_apply'|...), createdAt`.
- **Dashboard:** `DashboardSnapshot.overview` (all optional numbers) and `KpiSummary` (`dashboard.store.ts:21-55`).
- **Validation in scope:** only the client-side password length of 8 and the match check (auth pages), the 10 MB attachment limit, the requirement for a Google Meet link, and the To/Subject/Message required check. Recipients are parsed through `parseRecipients`.

### 9. Libraries used in scope

- `react-router-dom` (routing, `useRouteError`, `Link`, `useSearchParams`).
- `zustand` stores (via hooks).
- `sonner` (toasts).
- `lucide-react` (icons).
- `recharts` through the shadcn `ChartContainer` (bar, line and area charts).
- `@tanstack/react-table` (Hired/TP/PI tables: core, sorted and paginated row models).
- `next-themes` (`useTheme` in the home background).
- Radix through shadcn (Sheet, Dialog, Select, Popover, Tooltip, ToggleGroup, Tabs, Checkbox, Avatar).
- `Intl.DateTimeFormat` for dates and time zones.
- No form library: every form uses `useState`.

---

### 10. ISSUES

1. **High / bug: email attachments cannot work at all.** `uploadAttachment` POSTs `/ats/emails/attachments` (`store/slices/emails.store.ts:246-249`, called from `compose-email-sheet.tsx:207`), but the backend email router has no such route (`backend/src/features/emails/email.routes.ts:46-67`). The request fails, and the user sees "Failed to upload X". Even if an upload worked, `sendEmailSchema` has no `attachments` key (`email.routes.ts:19-39`) and `validate()` replaces `req.body` with the parsed data (`backend/src/shared/validators/common.validator.ts:36-46`), so zod strips `attachments` and forwarded attachments (`compose-email-sheet.tsx:158`, `:274`) are silently dropped. **Fix:** add a multipart upload route (Cloudinary/S3) and `attachments` to the schema and service, or hide the Attach button.

2. **High / security-privacy: bulk candidate emails expose every recipient to everyone.** `buildCandidateComposeMode` joins every selected candidate's address into one `to` string (`app/emails/_utils/candidate-compose.ts:52-53`; comment at `:20`). The backend sends a single message with `to: input.to` (`backend/src/features/emails/email.service.ts:73,89`). Candidates of a Hired or Talent Pool bulk send see each other's personal emails, which is a privacy / GDPR issue. **Fix:** send one email per recipient (or put them in BCC), and have the backend fan out.

3. **High / bug-UX: the Emails search box drops characters, and its search does nothing anyway.** The input is controlled by `query` (`emails-list.tsx:611`), but `handleQuery` only calls `setQuery` after a 300 ms debounce (`:446-451`). React reverts the DOM value on every keystroke, so fast typing loses characters (only the last keystroke in each 300 ms window survives). Separately, the backend ignores `search` (`backend/src/features/emails/email.controller.ts:7-27`, `email.service.ts:11-29`), so the result is never filtered, yet the count reads "N emails found" (`emails-list.tsx:643-645`). **Fix:** keep a separate `inputValue` state (as hired-table does, `hired-table.tsx:114,266`) and implement `search` on the backend (subject/from/to regex or a text index).

4. **High / bug: the calendar status filter cannot be reset to "All".** Selecting a status calls `refresh({limit:200,status})`, which stores `filters.status` and replaces the shared `items` (`interviews.store.ts:115-136`). Choosing "All Statuses" then calls `fetch({limit:200})` (`calendar/page.tsx:33-35`). Because the params hold only `limit`, `fetch` returns early after boot (`interviews.store.ts:102-110`). Even if it ran, `filters = {...get().filters, ...params}` would keep the old `status` (`:116`). The calendar stays filtered until reload. It also caps the shared interview list at 200 rows for other screens. **Fix:** pass `status: undefined` explicitly and force a refresh, or filter on the client from the boot list instead of mutating the shared store.

5. **High / bug: editing an interview can silently move it.** The edit form is pre-filled with the date and time in the **interview's** timezone (`event-sheet.tsx:719-720`), but on save the wall clock is converted to UTC in the **company** timezone (`:662-666`, `timezone = settings.companyTimezone`, `:547`). Whenever `event.timezone` differs from the company timezone, opening Edit and saving unchanged shifts the interview by the zone offset, and notifications go out. **Fix:** convert back using `event.timezone` (and let the dialog choose a timezone).

6. **Medium / bug-UX: the calendar detail sheet shows stale data after actions.** The page keeps a snapshot `selectedEvent` (`calendar/page.tsx:20,60-64`). The store replaces the item after Complete, No Show, Cancel or Feedback (`interviews.store.ts:299-354`), but the sheet keeps rendering the old object. The status badge stays "Scheduled", the action buttons stay visible, and new feedback does not appear, which invites duplicate actions. `onMutate` is not called for these actions either (`event-sheet.tsx:161-219`). **Fix:** store `selectedEventId` and read it from the store.

7. **Medium / business-logic: interview feedback can only be given before the interview is completed.** The Feedback button lives inside `event.status === 'scheduled'` (`event-sheet.tsx:428-441`). Once "Mark as Complete" is clicked, there is no way to add feedback. **Fix:** allow feedback for completed interviews, and restrict it to assigned interviewers.

8. **Medium / UX: destructive interview actions have no confirmation.** Cancel Interview runs DELETE immediately and emails notifications (`event-sheet.tsx:460-467`, `:210-219`). No Show and Complete are also one click. **Fix:** add a confirm dialog for Cancel.

9. **Medium / permissions: no frontend permission gating anywhere in scope.** There are no `usePermission` calls in any scope file. Dashboard, calendar, emails, hired and talent-pool have no route guard (`router.tsx:75,88-89,98,144-145`). Interviewers (candidates.read only, `backend/src/features/users/user.service.ts:118-124`) see Assign / Talent-pool / Email buttons that 403. Users without `dashboard.read` (interviewer, CRM-only roles) are sent to `/ats/dashboard` after login (`login/page.tsx:26`), from Unauthorized (`unauthorized/page.tsx:34`) and from Error (`error.tsx:19`). The dashboard's list fetches then reject together and the page renders empty (inferred). **Fix:** add per-route `RoleGuard`/permission guards, hide actions by permission, and pick a landing page based on permissions.

10. **Medium / performance: the dashboard downloads the entire database on each visit.** It sends 5 list requests with `limit: 9999` plus the snapshot on every mount and on every socket invalidation (`dashboard.store.ts:160,597-613`), duplicating the data boot already loaded (`lib/boot-data.ts:78-85`). The work grows linearly with candidates and applications. **Fix:** compute aggregates on the server (extend `/ats/dashboard`), or reuse the boot-loaded stores.

11. **Medium / inconsistency: the dashboard funnel mixes units and its "conversion" badges are wrong.** The stage counts are candidate-based (`dash-funnel.tsx:46-75`), but "hire rate" = `kpi.hiredCount / kpi.totalApplications` is application-based (`:86-89`), even though the file's own comment says to avoid mixing units (`:70-71`). The conversion badge compares adjacent tiles (`:140-147`): "In Pipeline ÷ Pending" is not a conversion, because approved candidates are not a subset of the currently pending ones, so it can exceed 100%. The `pipelineIds` fallback has a redundant third branch (`:62-67`). **Fix:** define the funnel from cumulative stage reach, and compute the hire rate from the same unit.

12. **Medium / security: inbound email HTML is rendered with remote content.** `<iframe srcDoc={email.bodyHtml} sandbox="allow-same-origin">` (`email-detail-sheet.tsx:357-362`, `emails/[id]/page.tsx:185-190`). Scripts are blocked, but remote images, CSS and tracking pixels load, which leaks read receipts and IPs to senders. Links cannot open, because there is no `allow-popups` and no `target` rewrite. The fixed `min-h-64` / `min-h-48` heights clip or inner-scroll long emails. **Fix:** sanitize (DOMPurify) and proxy or block remote images, add `allow-popups allow-popups-to-escape-sandbox` with `<base target="_blank">`, and auto-size the frame.

13. **Medium / bug: templates lose their HTML and unresolved placeholders get sent.** Template selection uses only `bodyText` (`compose-email-sheet.tsx:180,231`); `bodyHtml` from the selection is ignored, and the body is always sent as `<pre>` plain text (`:267`). For bulk sends there are no variables, so `{{candidateName}}` etc. are sent literally, and nothing checks for leftover `{{...}}` (`:234-281`). **Fix:** support HTML templates (the rich text editor exists in components), or warn on unresolved placeholders.

14. **Medium / UX: Reply on an outbound email replies to yourself.** Reply sets `To = mode.email.from` (`compose-email-sheet.tsx:135`). For an outbound email `from` is the system sender, yet Reply is offered for every non-failed email (`email-detail-sheet.tsx:420-430`, `[id]/page.tsx:225-235`). The quoted header prints the raw ISO date (`:140`). **Fix:** for outbound mail, reply to `to`, and format the date.

15. **Medium / dead code-perf: the talent pool's post-assign refetch is a no-op.** `await fetchApps({ limit: 9999 })` (`talent-pool-table.tsx:701`) carries no explicit filter, so `applications.store.fetch` returns early after boot (`applications.store.ts:91-99`). Compare hired-table, which uses `fetchAppsScoped` (`hired-table.tsx:285`). **Fix:** use `fetchScopedMerge`, or remove the call.

16. **Medium / duplication: `AssignJobDialog` exists 3 times and `TagFilter` 2 times, and they behave differently.**
    - Copies: `hired-table.tsx:893-1049` (stage chips, resets on overlay close), `talent-pool-table.tsx:288-446` (stage Select, never resets on Cancel), `talent-pool-detail-sheet.tsx:300-445` (no client name, search by title only). TagFilter: `hired-table.tsx:792-890` vs `talent-pool-table.tsx:86-202`.
    - All three clear their own state before the async assign finishes and do not disable Assign while it runs, so double submits are possible and the selection is lost on failure (`hired-table.tsx:1034-1042`, `talent-pool-table.tsx:426-438`, `talent-pool-detail-sheet.tsx:425-437`).
    - The Cancel button in hired/TP calls `onClose` without resetting, so the previous selection reappears for the next candidate (`hired-table.tsx:1031`, `talent-pool-table.tsx:423`).
    - **Fix:** extract one shared component that has a pending state.

17. **Medium / duplication: interview and email presentation maps are copy-pasted** (see section 5): `event-card.tsx:5-13`, `agenda-view.tsx:16-38`, `event-sheet.tsx:60-89`; `emails-list.tsx:46-79`, `email-detail-sheet.tsx:38-82`, `[id]/page.tsx:26-35` (the last lacks delayed/bounced/complained and falls back to the "sent" style, `:118`); and `formatFileSize` 3 times. This violates `ats/CLAUDE.md` (DRY).

18. **Medium / bad implementation: the PI page bypasses the store.** Legal hold and delete call `patchJson` / `deleteJson` directly (`permanently-ineligible-table.tsx:212,228`). After a delete only `ineligibleItems` is refetched. The shared `items`, `applications` and `interviews` stores keep rows referencing the deleted candidate until reload (inferred). Delete stays enabled for legal-hold rows and only fails server-side (`backend/src/features/candidates/candidate.service.ts:586`), and the confirm dialog does not mention the hold (`:549-592`). **Fix:** add store actions that patch every store, and disable Delete when `legalHold` is set.

19. **Medium / UX: there is no way to view a hidden day's events in the calendar.** "+N more" calls `onSlotClick` (`month-view.tsx:135-140`), which opens the **create** dialog for that day (`calendar/page.tsx:97,66-70`) instead of listing the events. The comment claims this fixed reachability. **Fix:** open a day popover, or switch to the agenda or week view for that date.

20. **Medium / bug: mixed-timezone calendar grouping and sorting.** Each interview is placed on the date and time of **its own** timezone (`calendar-helpers.ts:23-36`, `month-view.tsx:60-64`), while the grid is built in the browser's local time (`toISO`, `:9-14`). Interviews scheduled in different zones on the same day are sorted by their own wall-clock strings, not by the actual instant. Viewers in other zones see times that are not their local time, and no zone label appears in the grid (`event-card.tsx:22,35`). This is an ambiguous business rule (company tz vs viewer tz vs interview tz). **Fix:** pick one display zone (viewer or company), render in it, and sort by `scheduledAt`.

21. **Medium / ambiguity-inconsistency: invite acceptance uses the reset endpoint.** The ATS `verify-email` page sets the password through `/auth/reset-password` (`verify-email/page.tsx:68`), while the CRM uses the dedicated `/auth/set-password` (`crm/src/services/auth.service.ts:81`), which behaves differently (no refresh-token wipe, no audit log; `backend/.../auth.service.ts:340-360` vs `:242-285`). The page also calls `/auth/verify-email` on load, which sets `isInviteAccepted=true` before any password exists (`auth.service.ts:335-337`). The button says "Set password & sign in" but only redirects to the login page (`verify-email/page.tsx:71,226`). **Fix:** use one endpoint in both apps, and either auto-login or rename the button.

22. **Low / bug: the landing page vignette never renders.** `bg-[radial-gradient(ellipse_at_center,transparent_18%,background_72%)]` (`home-background.tsx:126`) uses the bare word `background`, which is not a CSS color (it should be `var(--background)`), so the declaration is invalid and dropped. **Fix:** `...,var(--background)_72%`.

23. **Low / dead code:**
    - `app/dashboard/data.json` (614 lines of shadcn template sample data) is unreferenced.
    - `gradientId` is defined on every metric card (`dash-metric-cards.tsx:310,319,328`) but never used by `MetricCard`.
    - The dashboard store computes `trend`, `applicationsTrend` (180 days), `topJobs`, `candidateStatuses`, `jobStatuses`, `interviewStatuses` and `pipelineStages` on every fetch (`dashboard.store.ts:636-642`), but none of the four dashboard components read them (they only use `kpi`, `candidates`, `clients`, `jobs`, `applications` and `loading`).
    - `AgendaView` accepts `onSlotClick` and ignores it (`agenda-view.tsx:51`).
    - Trivial wrapper `parseEmails` (`compose-email-sheet.tsx:195-197`), and a redundant title ternary (`:186-193`).
    - `'use client'` in a Vite app (`template-selector.tsx:1`).
    - `<Suspense>` wrappers with no lazy children (`dashboard/page.tsx:75`, `hired/page.tsx:14`, `talent-pool/page.tsx:33`, `permanently-ineligible/page.tsx:14`).
    - The `/ats/emails/:id` thread page is never linked from the UI.

24. **Low / UX: the Emails page is missing from navigation.** There is no sidebar item for `/ats/emails` (`components/app-sidebar.tsx:35-80`); users reach it only through the unread toast. **Fix:** add a permission-gated nav item.

25. **Low / UX-a11y: invalid HTML and keyboard gaps.**
    - A nested `<button>` in `EmailItem` (`emails-list.tsx:220,257`).
    - Nested `<p>` inside `DialogDescription`, which renders a `<p>` (`talent-pool-table.tsx:466-475`, `talent-pool-detail-sheet.tsx:1092-1103`, `permanently-ineligible-table.tsx:558-572`).
    - `role="button"` divs that cannot be focused (`month-view.tsx:108-110`, `week-view.tsx:94-96`).
    - Mouse-only table rows (see section 4).
    - A label `htmlFor="template"` that points to no element (`compose-email-sheet.tsx:302`).
    - The skills "+N more" trigger is an unfocusable `<span>` with a "click" icon, but it is a hover tooltip (`talent-pool-table.tsx:249-254`).

26. **Low / UX: in the email list, "select all" only appears after selecting one row.** The select-all checkbox lives in the bulk bar, which shows only when `selectedCount > 0` (`emails-list.tsx:655-667`). After a delete, rows are removed locally but the page is not refetched to backfill (`:511-543`). Bulk delete fires N parallel DELETEs with no bulk endpoint (`:534`). Tab counts do not refresh on new inbound mail; they refresh only after a mutation (`:414-423`).

27. **Low / UX: the status filter options do not match the tabs or the backend statuses.** The status Select omits delayed, bounced and complained (`emails-list.tsx:624-631`), although the UI styles them (`:67-78`). The Failed tab overrides the status filter (`:343-348`), and Inbox combined with status "sent" can never match anything.

28. **Low / UX: the email detail chip shows raw Mongo ids** ("Candidate #64f…", "Job #…", `email-detail-sheet.tsx:151-157,167`) with no link to the record.

29. **Low / UX: empty states ignore active filters** in Hired and Talent Pool (`hired-table.tsx:741`, `talent-pool-table.tsx:1042`). `handleClearSearch` does not reset the page (`hired-table.tsx:275-279`, `talent-pool-table.tsx:626-630`).

30. **Low / inconsistency: the talent pool search placeholder promises "or tags"** (`talent-pool-table.tsx:926`), but the filter does not search tag names (`:583-594`).

31. **Low / bug: the talent pool notes editor closes before the save resolves.** `onSave(draft); setEditing(false);` (`talent-pool-detail-sheet.tsx:135-138`). On failure the draft is lost. Notes are saved through `updateTalentPool(id,'add',notes)` (`:518`), which reuses "add" semantics.

32. **Low / bad implementation: misleading activity log.** Assigning a job from the talent pool sheet logs `action: 'created'` with the text "Applied to job" (`talent-pool-detail-sheet.tsx:544-549`).

33. **Low / UX: the talent pool sheet has a double separator.** The education block ends with `<Separator/>`, and Additional Info starts with another `<Separator/>` (`talent-pool-detail-sheet.tsx:865,880`). Resume has no separator before it while Portfolio does (`:932,957`). The experience row prints "company · duration" with a dangling "·" when a part is missing (`:256`), and education prints "undefined in …" when degree or field is missing (`:284`, inferred from the optional parsed data).

34. **Low / roles-sensitivity (inferred): sensitive data is shown to every candidates.read user.** Salary (PHP/USD), reason for leaving, and CRM wellbeing flags (burnout and replacement risk, satisfaction) appear in the talent pool sheet (`talent-pool-detail-sheet.tsx:879-1037`) for anyone with `candidates.read`, including interviewers. Whether this is allowed needs a decision.

35. **Low / bug: the hired list comment and code disagree.** The comment says "Prefer the shared list when it looks complete", but the code prefers `scopedApps` (`hired-table.tsx:161-164`). Hire infos are documented as "newest first" but are never sorted (`:169-192`); the order follows the API's createdAt order, not `hiredAt`. A "hired" candidate can also be in the talent pool and in active pipelines at once (`:198-217`); whether that is allowed is an open business question.

36. **Low / UX: login drops the query and hash of the deep link.** The redirect uses only `from.pathname` (`login/page.tsx:24-27`), so `?tab=…` and similar state is lost after re-login.

37. **Low / security (minor): reset and invite tokens travel in URLs.** The reset token is in a query string and the invite token in a path (`reset-password/page.tsx:27`, `verify-email/page.tsx:24`), so they can leak through history and Referer (the backend generates these URLs). The verify-email page performs a state change on load (`:41-53`). These are standard tradeoffs. Mitigate with short expiry and `Referrer-Policy: no-referrer` on the auth pages.

38. **Low / UX: not-found and error pages.** `NotFoundPage` has no link home and relies on `flex-1` without a flex parent at the root route (`not-found.tsx:3`, `router.tsx:153-154`). The error boundary is attached only to the protected branch, so errors in public, auth or landing pages fall back to the default React Router error screen (`router.tsx:70`).

39. **Low / dark-mode-theming: hard-coded hex colors in the dashboard** (`dash-funnel.tsx:8-37,114`, `dash-metric-cards.tsx:318,327`, `dash-hiring-trend.tsx:24,164`) and `--success`/`--warning` defined only in `:root` (`index.css:93-96`). The same colors are used in both themes, against the "proper light/dark theming" rule in `ats/CLAUDE.md`.

40. **Low / bug: "0" percent change still shows a down arrow.** `isFlat` styles the text as neutral, but the icon renders `TrendingDown` whenever `!isUp`, including 0 (`dash-metric-cards.tsx:173-177,246-250`). `pctChange3m` returns 100% when the previous period is 0 (`:79`), which overstates growth.

41. **Low / bad implementation: storage access is unguarded.** `sessionStorage` and `localStorage` reads and writes have no try/catch (`emails-list.tsx:328,332,373,428,434,443,477-478`). In private mode or when storage is blocked, a throw breaks the page on init.

42. **Low / ambiguity: dashboard "Open Jobs" trend.** The sparkline and % change count currently open jobs by **creation** month (`dash-metric-cards.tsx:299-301`). That describes when today's open jobs were created, not how the open-job count changed over time, so the trend label "vs last 3 months" misleads.

---

## Area C — Infrastructure: router, stores, socket, lib, hooks, shared components, config, docs

Repo root: `ats`. All paths below are relative to it unless prefixed with `backend/`.
Scope: everything in ats/ except `src/app/**`, `dist/**`, `pnpm-lock.yaml` and images. dist/index.html was also inspected.

---

### 1. Scope covered (every file read in full; line counts from `wc -l`)

**Config and root**

- package.json (71), vite.config.ts (23), tsconfig.json (14), tsconfig.app.json (28), tsconfig.node.json (24), eslint.config.js (42), components.json (25), index.html (13), vercel.json (3)
- public/icons.svg (24), public/favicon.svg (0 newlines, 9522 bytes, a single line)
- dist/index.html plus a listing of dist/assets

**Docs**

- README.md (41), CLAUDE.md (11), STYLE.md (564), BUSINESS_LOGIC.md (615), ATS-UI-UX-AUDIT.md (2294)

**Entry points**

- src/main.tsx (65), src/App.tsx (6), src/router.tsx (155), src/index.css (397)

**src/lib**

- activity-sentence.ts (1865), activity.ts (39), api-client.ts (327), boot-data.ts (123), download.ts (55), html.ts (167), job-format.ts (147), markdown.ts (33), public-api.ts (25), recipients.ts (13), session-reset.ts (104), tags.ts (73), timezones.ts (371), utils.ts (74)

**src/hooks**

- use-activity-actors.ts (147), use-candidate-email-activity.ts (79), use-interviewer-options.ts (112), use-mobile.ts (32), use-permission.ts (24), use-search-with-page-restore.ts (57), use-socket-room.ts (36), use-table-pagination.ts (170), use-unread-emails.ts (73)

**src/store**

- index.ts (22), realtime/socket.ts (317)
- types/: activity-log.types.ts (70), application.types.ts (66), candidate.types.ts (145), client.types.ts (107), common.ts (34), email-template.types.ts (38), email.types.ts (71), enums.ts (250), index.ts (14), interview-scorecard.types.ts (244), interview.types.ts (108), job.types.ts (120), pipeline-template.types.ts (29), settings.types.ts (35), tag.types.ts (29), user.types.ts (81)
- slices/: activity-logs (201), applications (456), auth (262), boot (38), candidates (591), clients (531), dashboard (659), disposition-reasons (85), email-templates (194), emails (287), interview-scorecards (150), interviews (431), jobs (336), pipeline-templates (236), settings (92), tags (152), users (388)

**src/components**

- activity-timeline.tsx (691), app-loader.tsx (9), app-sidebar.tsx (144), change-job-dialog.tsx (272), confirm-dialog.tsx (93), layout.tsx (38), nav-group.tsx (53), nav-main.tsx (127), nav-user.tsx (119), portfolio-section.tsx (102), public-shell.tsx (31), recipient-field.tsx (156), reject-dialog.tsx (393), restore-candidate-dialog.tsx (215), resume-viewer.tsx (293), rich-text-editor.tsx (353), rich-text.tsx (65), schedule-interview-dialog.tsx (538), sidebar-error-boundary.tsx (36), site-header.tsx (32), table-pagination.tsx (223), tag-list.tsx (98), tags-selector.tsx (183), timezone-select.tsx (75), unread-emails-toast.tsx (36)
- auth/protected-route.tsx (63), auth/role-guard.tsx (19)
- ui/: avatar 112, badge 49, button 67, card 103, chart 373, checkbox 31, collapsible 22, dialog 163, drawer 129, dropdown-menu 273, input 19, label 22, popover 65, select 190, separator 26, sheet 143, sidebar 702, skeleton 13, sonner 47, switch 32, table 114, tabs 98, textarea 19, toggle-group 87, toggle 47, tooltip 57

**Read outside scope to verify connections:** backend/src/sockets/ats.socket.ts (full), plus a grep of every `emitToAts(` call in backend/src.

---

### 2. Per-folder and per-file summary

#### Config

- **package.json** (name `ats-ui-new`, package.json:2)
  - Stack: React 19.2, react-router-dom 7, zustand 5 (with immer), Tailwind 4, Vite 8 with the rolldown bundler, TypeScript ~6.0.
  - The React Compiler runs through a babel preset (vite.config.ts:11).
  - Scripts are dev, build, lint and preview only. There is no test script or test runner (package.json:6-11).
  - A pnpm override pins `socket.io-parser >=4.2.7` as a security fix (package.json:66-70).
- **vite.config.ts**
  - Defines the `@` alias. The dev server opens `/ats`.
  - No `manualChunks` setting and no route-level lazy loading.
- **tsconfig.app.json** has no `"strict": true` (tsconfig.app.json:2-26), so `strictNullChecks` and `noImplicitAny` are off.
- **tsconfig.json** uses `baseUrl` plus `ignoreDeprecations: "6.0"` (tsconfig.json:8-9) to silence the TS 6 deprecation of `baseUrl`.
- **eslint.config.js** uses typescript-eslint, react-hooks and react-refresh. It ignores `dist` (:9) and sets `no-unused-vars` with `^_` ignore patterns.
- **components.json** is shadcn config: style `radix-vega`, `iconLibrary: lucide`, cssVariables enabled.
- **index.html**
  - Favicon is `/arista-ats.png`.
  - `public/favicon.svg` is the stock Vite logo and is unused.
  - `public/icons.svg` is the Vite template's social-icon sprite and is unused (grep finds no references).
- **vercel.json** contains only an SPA rewrite to `/index.html` (vercel.json:2). There are no security headers (CSP, X-Frame-Options, Referrer-Policy).
- **dist/** is committed build output:
  - index.html, arista-ats.png, favicon.svg, icons.svg.
  - assets/: one 2,637,030-byte JS chunk `index-u4hgZwva.js`, separate chunks only for `docx-preview` and `session-reset` (both dynamic imports), one CSS file, and the Inter woff2 subsets.
  - `eslint.config.js:9` ignores dist, which indicates it lives in the repo. A .gitignore is not available in the copy to confirm intent.

#### Entry points

- **main.tsx**
  - Calls `socketManager.registerStore(...)` for tag, candidate, job, application, interview, client, pipeline_template and email_template; email gets `_patch` only. No user or settings dispatcher is registered.
  - Render tree: `StrictMode > ThemeProvider(attribute=class, defaultTheme=system) > TooltipProvider > App + Toaster`.
- **App.tsx** renders `RouterProvider`.
- **router.tsx** imports every page eagerly (router.tsx:1-34). See section 3 for the route map.
- **index.css**
  - Brand palettes in OKLCH: silver, ash-grey, pine-teal, parchment.
  - Semantic tokens defined in `:root` and `.dark`, plus `.careers-theme` and `.careers-dark` blocks.
  - `@theme inline` bindings, docx-preview overrides, and a page-specific `.tp-duration` rule.
  - Imports `shadcn/tailwind.css` (from a devDependency) for the `data-open:` and `data-checked:` variants.

#### lib

- **api-client.ts**
  - BASE_URL defaults to `http://localhost:5001/api/v1` (:1-3).
  - The access token is held in memory (`setAuthToken`/`getAuthToken`).
  - Refresh is single-flight via `POST /auth/refresh-token` with credentials (:96-100). A `_refreshFailed` latch stops retries, and only 401/403 count as a definitive failure.
  - Unwraps the `{success,data,meta}` envelope; list responses become `{data, ...meta}` (:210-223).
  - `parseError` joins `details[]` as `field: message` (:60).
  - `buildUrl` comma-joins array params.
  - Exports `getJson`, `postJson`, `postJsonSilent`, `postJsonPublic`, `postForm`, `patchJson`, `deleteJson`, `isApiUrl`, `RefreshFailedError`, `onUnauthorized`, `resetRefreshState`.
- **public-api.ts**
  - Thin aliases. Its comment admits `GET /ats/jobs*` may be auth-gated (:15-18).
  - It uses `postJson`, not `postJsonPublic`, so an anonymous 401 goes through the refresh path (inferred).
- **boot-data.ts**
  - After login, fetches every list with `limit 9999` (:77-90): clients, jobs, candidates, ineligible candidates (admin), applications, interviews, tags, users, settings, email templates and pipeline templates. Emails are fetched as page 1, limit 50.
  - `describeTotalOutage` returns an outage only if every required store is both empty and errored (:56-68).
  - States that "all filtering is client-side" (:4).
- **session-reset.ts**
  - Clears 13 persisted `ats-*` localStorage keys and resets the stores.
  - Imported dynamically to break an import cycle.
  - Does not reset the in-memory disposition-reasons store, the interview-scorecards store, or the module-level interviewer-options cache.
- **download.ts** fetches into a blob, then clicks an object URL. The bearer token is attached only when `isApiUrl(url)` is true.
- **utils.ts**: `cn`, `safeHttpUrl`, `formatDate` (en-US), `timeAgo`, `isValidObjectId`, `sortableTime`.
- **activity.ts**: `logOptimisticActivity` prepends a `local-…` entry, then force-refetches the feed.
- **recipients.ts**: email-list helpers.
- **markdown.ts**
  - `descriptionToHtml` returns `marked` output without sanitizing it (:29-33).
  - Its `looksLikeHtml` duplicates the one in html.ts (:5-10 vs html.ts:31-33).
- **html.ts**: `escapeHtml`, `htmlToPlainText`, `summarizeText`, `looksLikeHtml`.
- **tags.ts**: `normalizeTags`, `useResolvedTags` (its memo deps list `cacheKey` but the closure uses `cache`, :49-50), `getTagId(s)`.
- **job-format.ts**
  - Label maps, `formatSalary`, `formatDeadline`, `toChips`, `splitBullets`, `toBullets`.
  - Its own `formatDate` (:60) duplicates utils.ts:19 but uses the browser locale.
- **timezones.ts**
  - 20 curated IANA zones; DEFAULT `America/Chicago` (:166).
  - `getZonedDate`/`getZonedTime`, plus a DST-aware `zonedWallClockToUtc` (:346-371).
  - Label "BST" is used for Dhaka (:36) and also for London summer time (:115).
- **activity-sentence.ts**
  - `KNOWN_ACTIONS` (:176-243), `resolveActionKey` (suffix peeling), tone and icon maps (around :487-619), `buildActivitySentence` (a large switch), and `formatActivityDay`/`formatActivityClock`/`formatActivityTime`.
  - LOCALE constants are declared at the bottom (:1802-1814).

#### hooks

- **use-permission.ts**: admin always passes; otherwise checks `user.permissions[resource][action]`. The hook ignores the backend's action hierarchy (manage > write > read), so `hasPermission('candidates','read')` for a user with only `manage:true` depends on how the backend fills the map (inferred).
- **use-socket-room.ts**: joins and leaves named rooms through `socketManager`. Used for job, jobs, candidates, applications, clients, interviews and tags (9 call sites).
- **use-table-pagination.ts**: page index in sessionStorage, page size in localStorage. The value is not clamped when data shrinks; the `TablePagination` component clamps (`safePageIndex`).
- **use-search-with-page-restore.ts**: resets to page 0 when searching and restores the page afterwards.
- **use-mobile.ts**: 768px breakpoint.
- **use-unread-emails.ts**: counts unread among the loaded emails only (boot loads 50).
- **use-candidate-email-activity.ts**
  - Calls `GET /ats/emails {candidateId, limit 100}`.
  - Re-runs when the emails store item count changes.
  - Does not clear old rows when `candidateId` changes.
- **use-interviewer-options.ts**: `GET /shared/users {roles: 'admin,hiring_manager,recruiter,coordinator,interviewer', isActive: true, limit: 200}`, cached at module level for the life of the tab.
- **use-activity-actors.ts**: resolves actor names and avatars. It duplicates the AI-action set from activity-sentence.ts and checks raw, unresolved action strings.

#### store

Described in sections 7 and 8. Every slice is a `create()(persist(immer(...)))`, except dashboard (not persisted), boot, disposition-reasons and interview-scorecards (in memory).

**realtime/socket.ts**

- A `SocketManager` singleton.
- `connect()` creates `io(WS_URL + '/ats', {auth:{token}, reconnection, reconnectionAttempts: 10, reconnectionDelayMax: 30s})` (:152-164).
- Binds `<resource>:created|updated|deleted` events to the registered store dispatchers.
- Fires dashboard invalidators on domain events.
- Exposes room helpers (:210-238).

#### components (app-level)

- **layout.tsx**: `SidebarProvider` controlled by `useState(true)` (:10), inside a `mx-auto max-w-[1440px]` wrapper (:16). Renders `AppSidebar variant=inset`, `SidebarInset`, `SiteHeader`, `Outlet` and `UnreadEmailsToast`.
- **app-sidebar.tsx**
  - Four groups: main (Clients, Jobs, Candidates, Talent Pool, Hired, Ineligible), secondary (Settings, Tags), internals (Dashboard, Team, Calendar), and links (Home Page, Jobs Page).
  - Items are filtered by permission (:87-108).
- **nav-main.tsx** renders the main nav plus fixed Emails and Quick Import entries, with a custom collapsed tooltip.
- **nav-group.tsx** renders a generic group.
- **nav-user.tsx**: avatar, theme toggle (uses `theme` rather than `resolvedTheme`), account link, and a logout that awaits without a catch.
- **site-header.tsx**: sidebar trigger plus a title derived from the path.
- **sidebar-error-boundary.tsx**: swallows the sidebar-provider render error and renders null. It is a hack.
- **public-shell.tsx**: careers wrapper. `isDark` is hard-wired to true, while the index.css comment says careers "always renders light".
- **auth/protected-route.tsx**
  - Redirects to `/ats/login` when `!isAuthenticated` (:25-26).
  - Kicks off boot (:19) and shows `AppLoader` or an outage card while booting.
  - Does not check appAccess.
- **auth/role-guard.tsx**: if no role overlaps, `Navigate` to `/ats/unauthorized` (:16).
- **activity-timeline.tsx**
  - Feed per resource: day groups, actor avatars, and a load-more button.
  - Imports `@/app/candidates/_utils/candidate-styles`, so a shared component depends on a feature folder.
- **change-job-dialog.tsx**: pick a target open job and start stage, then `candidates.changeJob`.
- **confirm-dialog.tsx**: generic confirm. The docstring claims an internal pending state that does not exist; it relies on the `loading` prop.
- **reject-dialog.tsx**
  - Disposition reason select (category-grouped), destination radio (pool or ineligible), internal notes.
  - References a non-existent `CANDIDATE-FLOW-SPEC.md`.
  - `defaultEligibility` is unused.
- **restore-candidate-dialog.tsx**: admin restore, choosing a job.
- **resume-viewer.tsx**
  - PDF via iframe blob; DOCX via lazy `docx-preview` followed by DOMPurify.
  - The full-view overlay has no Escape handler or focus trap.
- **rich-text-editor.tsx**: TipTap StarterKit, Link and Placeholder. Has a toolbar plus a duplicate bubble menu, and uses `prose-sm` classes even though the typography plugin is not installed.
- **rich-text.tsx**: renders HTML through a DOMPurify allowlist. `target` is allowed without enforcing `rel`.
- **schedule-interview-dialog.tsx**
  - Fields: title, type, date and time (naive wall clock; callers convert to UTC), meeting link/phone/address, interviewers, notes.
  - Two `grid-cols-2` blocks (:245, :295).
- **table-pagination.tsx**: shared pager with contextual aria-labels (UX-10 fix). `PAGE_SIZE_OPTIONS` duplicates `DEFAULT_PAGE_SIZES` in use-table-pagination.
- **tag-list.tsx**: renders tag chips with `color + '20'` hex alpha.
- **tags-selector.tsx**: raw `PopoverPrimitive` with no Portal, plus a `'use client'` leftover.
- **timezone-select.tsx**: select over the curated zones.
- **portfolio-section.tsx**: portfolio URL or file display using `safeHttpUrl`.
- **recipient-field.tsx**: chip input for To/CC/BCC.
- **unread-emails-toast.tsx**: shows a toast when the unread count grows.
- **app-loader.tsx**: spinner.

#### components/ui

- Generated with shadcn, then customised:
  - Button default height `h-11`, a soft destructive variant, and outline using `border-border-subtle`.
  - Sheet's close button sits outside the panel (`right-full`, sheet.tsx:76).
  - Dialog uses `rounded-xl` (dialog.tsx:62).
- Generations are mixed: popover and switch use `data-[state=...]`, the others use `data-open`/`data-checked`.
- `drawer.tsx` (vaul) is imported nowhere. `toggle.tsx` is used only by toggle-group.
- `sidebar.tsx` writes a `sidebar_state` cookie that is never read. It also binds a window-level Ctrl/Cmd+B shortcut.

---

### 3. Features and user flows (infra level)

#### Route map (router.tsx)

| Path                                                                                    | Component                                        | Guard                                                                   |
| --------------------------------------------------------------------------------------- | ------------------------------------------------ | ----------------------------------------------------------------------- |
| `/careers`                                                                              | CareersPage                                      | `PublicShell`, no auth, no errorElement (:46)                           |
| `/careers/:id`                                                                          | CareerJobDetailPage                              | same (:47)                                                              |
| `/careers/:id/apply`                                                                    | CareersApplyPage                                 | same (:48)                                                              |
| `/ats` (index)                                                                          | HomePage                                         | public (:53)                                                            |
| `/ats/login`, `/ats/forgot-password`, `/ats/reset-password`, `/ats/verify-email/:token` | auth pages                                       | `AuthLayout` (:61-64)                                                   |
| `/ats/dashboard`                                                                        | Dashboard                                        | `ProtectedRoute` (errorElement ErrorPage) > Layout; no role guard (:75) |
| `/ats/clients`, `/clients/new`, `/clients/:id`                                          | ClientsPage, ClientNewPage, ClientDetailPage     | Protected (:76-78)                                                      |
| `/ats/jobs`, `/jobs/new`, `/jobs/:id`                                                   | JobsPage, JobNewPage, JobDetailPage              | Protected (:79-81)                                                      |
| `/ats/candidates`, `/candidates/quick-import`, `/candidates/:id`                        | CandidatesPage, QuickImport, CandidateDetailPage | Protected (:82-87)                                                      |
| `/ats/talent-pool`, `/ats/hired`                                                        | TalentPoolPage, HiredPage                        | Protected (:88-89)                                                      |
| `/ats/permanently-ineligible`                                                           | PermanentlyIneligiblePage                        | `RoleGuard ['admin']` (:91-95)                                          |
| `/ats/calendar`                                                                         | CalendarPage                                     | Protected (:98)                                                         |
| `/ats/team`, `/ats/team/:id`                                                            | TeamPage, TeamMemberPage                         | `RoleGuard ['admin']` (:100-112)                                        |
| `/ats/settings`                                                                         | `Navigate` to `/ats/settings/general`            | (:116)                                                                  |
| `/ats/settings/general`                                                                 | SettingsGeneralPage                              | `RoleGuard` admin, hiring_manager, recruiter, coordinator (:120-131)    |
| `/ats/settings/disposition-reasons`                                                     | SettingsDispositionReasonsPage                   | `RoleGuard ['admin']` (:135-139)                                        |
| `/ats/account`, `/ats/tags`, `/ats/emails`, `/ats/emails/:id`                           | account, tags, emails pages                      | Protected (:142-145)                                                    |
| `/ats/unauthorized`                                                                     | UnauthorizedPage                                 | (:150)                                                                  |
| `/`, `*`                                                                                | NotFoundPage                                     | (:153-154)                                                              |

#### Auth and session flow

1. **Login** (`auth.store.login`): `POST /auth/login` (silent). The body has no `app` field; the backend defaults to `ats`.
   - The token is stored in memory.
   - `user` and `isAuthenticated` are persisted to `ats-auth` (auth.store.ts:202-205).
   - The socket connects.
2. **Reload**:
   - Persist hydration triggers `runAuthInit` (auth.store.ts:216-249).
   - If the persisted user looks valid, it calls `POST /auth/refresh-token` (silent) and reconnects the socket.
   - On any error, including network errors or a 5xx, the state is cleared to logged-out (:238-241).
3. **Boot**:
   - `ProtectedRoute` waits for `isInitialized`, then `runBoot` fetches every list with limit 9999.
   - When boot finishes, the app renders.
   - If every required store is empty and errored, an outage card with Try again is shown.
4. **During use**:
   - When the access token expires, the api-client refreshes once (single-flight) and retries.
   - A definitive failure calls `onUnauthorized`, which resets auth only if no token remains (auth.store.ts:211-213).
5. **Logout**:
   - `POST /auth/logout {app:'ats'}`, then the socket disconnects.
   - `resetSessionScopedStores()` clears the 13 localStorage keys, and boot is reset.
6. **Forgot, reset and verify**: public posts to `/auth/forgot-password`, `/auth/reset-password` and `/auth/verify-email`. Change password uses `POST /auth/change-password`.

#### Data freshness flow

- After boot, each slice's `fetch()` without an explicit filter is a no-op (example: jobs.store.ts:86-97; users.store.ts:72-83).
- A filtered fetch still hits the server and replaces `items` with the filtered result (jobs.store.ts:129-131). applications has `fetchScoped` and `fetchScopedMerge` to avoid this.
- Socket events patch stores. The dashboard store refetches the snapshot plus five 9999-row lists on each invalidation while the dashboard is mounted.

#### Activity timeline flow

- `activity-logs.fetch(resourceType, resourceId)` calls `GET /shared/activity-logs/:type/:id?page&limit=50`.
- Each entry goes through `buildActivitySentence`, and entries are grouped by day.
- `fetchMore` pages through older entries. An optimistic local entry is prepended by `logOptimisticActivity`.

#### Scheduling flow

1. The user fills in the dialog.
2. The caller converts wall clock time to UTC with `zonedWallClockToUtc` in the company timezone.
3. The interview is created via either `POST /ats/applications/:appId/interviews` or `POST /ats/interviews`.
4. A Google Meet link is marked `required` only on the input (schedule-interview-dialog.tsx:358). It is a plain button, not a form submit, so the requirement is not enforced (inferred from the input not being in a form submit path).

#### Rejection and disposition flow

1. `reject-dialog` loads `GET /ats/disposition-reasons/active?stageName=`.
2. It calls `applications.reject` (`PATCH /ats/applications/:id/reject {reason, rejectionReasonId, destination, internalNotes}`) or the candidate-level `PATCH /ats/candidates/:id/reject`.

---

### 4. UI/UX observations

- **Shell**: a fixed sidebar inside a centred 1440px wrapper (layout.tsx:16 vs ui/sidebar.tsx fixed `left-0`). On viewports wider than 1440px the rail detaches from the content (UX-01, still open).
- **Sidebar state**: the collapsed state is not restored on reload (layout.tsx:10; UX-09, still open).
- **Mobile**:
  - Sheet close button at `right-full` (sheet.tsx:76) goes off-screen when the sheet is full width (UX-05, still open).
  - schedule-interview-dialog is now `grid-cols-2` (:245, :295), changed from the audited `grid-cols-4`. It is still not responsive (UX-04 partially addressed).
  - table-pagination row does not wrap.
- **Loading, empty and error states**:
  - Boot gate and outage screen are good (protected-route.tsx).
  - Store `error` fields are mostly unrendered (UX-21, open).
  - activity-timeline uses the store's single global `loading`/`error`, shared across every feed.
- **Accessibility**:
  - Pagination is labelled (fixed).
  - tags-selector remove (x) buttons have no accessible name (tags-selector.tsx:107-113, :170-175). The audit's UX-11 "0 unnamed" claim did not cover them.
  - reject-dialog labels are not associated with their controls (UX-13, open).
  - resume-viewer full-view overlay has no Escape handler or focus trap.
  - The sidebar's Ctrl/Cmd+B window shortcut also fires inside the TipTap editor, where Ctrl+B means bold (inferred conflict).
- **Theme**:
  - The nav-user toggle reads `theme`, which can be `system`, so the icon or toggle direction can be wrong on first click (inferred).
  - `--success`/`--warning` have no dark-mode values (index.css:93-96; UX-48, open).
- **Consistency**:
  - `ConfirmDialog` exists but there is no alert-dialog primitive (UX-36, open).
  - `TableSkeleton` is duplicated (candidates-table.tsx:435 and clients-table.tsx:219; UX-27, open).

---

### 5. Styles

- Tailwind 4 with an `@theme inline` token mapping. Radius base is `1rem`, with derived sm through 3xl.
- STYLE.md vs code drift:
  - STYLE.md:62-65 documents `--success: #69c58a`, `--success-bg: #eaf7ee`, `--warning: #f3a64a` and `--warning-bg: #fff3e3`. index.css:93-96 actually has `#16a34a`, `#dcfce7`, `#d97706` and `#fef3c7`. The doc claims "All values are extracted directly from source" (STYLE.md:4).
  - STYLE.md:459-465 lists nav sections `NavMain: Clients, Jobs, Candidates`, `NavInternals: Analytics, Team, Calendar` and `NavSecondary: Settings, Tags`. The code has Talent Pool, Hired and Ineligible in main, Dashboard rather than Analytics, plus Home Page and Jobs Page links (app-sidebar.tsx:36-78).
  - STYLE.md:477 says the collapsed state persists in the `sidebar_state` cookie. It is written but never read (layout.tsx:10).
  - STYLE.md:122 bans `font-bold` and `font-light`; there are 17 occurrences in src (grep count).
  - STYLE.md:194 says "Modals, Sheets rounded-lg". Dialog is `rounded-xl` (dialog.tsx:62) and the right Sheet is `rounded-md` (sheet.tsx:65).
  - STYLE.md:386 describes Checkbox with `checked:` classes. The real component uses `data-checked:` via shadcn/tailwind.css.
- `index.css`:
  - The `.careers-theme` and `.careers-dark` comments contradict each other, and public-shell always applies dark.
  - `.tp-duration` is page-specific CSS in the global file.
  - The docx-preview overrides are global.
- Mixed quote styles and `'use client'` directives remain in ui files and tags-selector.tsx (Next.js leftovers).
- `tag-list.tsx` and `tags-selector.tsx:103` build colours as `tag.color + '20'`, which only works with 6-digit hex (the backend enforces `#rrggbb` per BUSINESS_LOGIC.md:174, so this is low risk).

---

### 6. Roles and permissions

- **Route level** (router.tsx): only role checks, via `RoleGuard`.
  - admin-only: permanently-ineligible, team, team/:id, settings/disposition-reasons.
  - settings/general: every ATS role except interviewer.
  - Everything else needs only authentication.
- **Nav level** (app-sidebar.tsx:87-108): permission checks.
  - Clients: `clients.read`. Jobs: `jobs.read`. Candidates, Talent Pool, Hired: candidates permission. Ineligible: admin role.
  - Settings: `settings.read`. Tags: `tags.read`. Dashboard: `dashboard.read`. Team: `team.read`. Calendar: `interviews.read`.
  - Emails and Quick Import (nav-main) are always shown.
- **Mismatches** between the two levels:
  - Default `team.read` is granted to hiring_manager, recruiter, coordinator and interviewer (BUSINESS_LOGIC.md:264). They all see a Team link that routes them to /ats/unauthorized.
  - Interviewer has no settings permission by default, so it is consistent there. A manually granted `settings.read` would show a link the RoleGuard blocks.
  - Routes such as /ats/dashboard, /ats/clients and /ats/jobs have no route guard, so an interviewer can open them by URL. The server then 403s and the page renders empty (inferred).
- **Component level**: `usePermission(resource, action)`, where admin always passes (use-permission.ts).
- **App access**: there is no frontend appAccess check. `ProtectedRoute` checks only `isAuthenticated` (protected-route.tsx:10-26), and per BUSINESS_LOGIC.md:600 login does not check the requested app. A CRM-only user (client, va, account_manager) can log into the ATS UI. Boot fetches would 403 and produce the outage card or empty screens (inferred).
- **Socket access**: the server checks appAccess at connect (backend/src/sockets/ats.socket.ts:27-33). It then auto-joins every connected ATS user, including interviewers, to `candidates`, `applications`, `clients` and the other rooms (:35-42). Every ATS user receives full candidate and client PII payloads regardless of permissions.

---

### 7. Connections

#### HTTP endpoints called from the frontend infra (stores, hooks, lib)

Base URL is `VITE_API_URL` or the default `http://localhost:5001/api/v1`. Auth is a Bearer header plus the refresh cookie.

**Auth (auth.store.ts, api-client.ts)**

| Method | Path                  | Notes                                                |
| ------ | --------------------- | ---------------------------------------------------- |
| POST   | /auth/login           | silent, `{email,password}`                           |
| POST   | /auth/logout          | `{app:'ats'}`                                        |
| POST   | /auth/refresh-token   | credentials; api-client.ts:96-100, auth.store.ts:230 |
| POST   | /auth/forgot-password | public                                               |
| POST   | /auth/reset-password  | public                                               |
| POST   | /auth/verify-email    | public                                               |
| POST   | /auth/change-password |                                                      |

**Shared**

| Method | Path                                            | Notes                                                                                      |
| ------ | ----------------------------------------------- | ------------------------------------------------------------------------------------------ |
| GET    | /shared/users                                   | users.store.ts:92; use-interviewer-options (roles list, isActive, limit 200)               |
| POST   | /shared/users                                   | users.store.ts:129; sends `invitedBy {firstName,lastName}`; response `{user, inviteToken}` |
| PATCH  | /shared/users/:id                               | users.store.ts:167                                                                         |
| PATCH  | /shared/users/me                                | users.store.ts:188                                                                         |
| POST   | /shared/users/me/avatar                         | multipart, users.store.ts:212                                                              |
| DELETE | /shared/users/:id                               | users.store.ts:242                                                                         |
| PATCH  | /shared/users/:id/permissions                   | users.store.ts:268                                                                         |
| POST   | /shared/users/provision-client                  | `{clientId}`, users.store.ts:296                                                           |
| POST   | /shared/users/provision-va                      | `{candidateId}`, users.store.ts:321                                                        |
| POST   | /shared/users/:id/revoke-crm                    | users.store.ts:346                                                                         |
| GET    | /shared/settings                                | settings.store                                                                             |
| PATCH  | /shared/settings                                | settings.store                                                                             |
| GET    | /shared/activity-logs/:resourceType/:resourceId | `{page, limit:50}`                                                                         |

**ATS: candidates (candidates.store.ts)**

| Method | Path                            | Notes                                                                                                               |
| ------ | ------------------------------- | ------------------------------------------------------------------------------------------------------------------- | ----------------- |
| GET    | /ats/candidates                 | filters; boot `limit 9999`; `eligibilityStatus=permanently_ineligible` for admin                                    |
| GET    | /ats/candidates/:id             |                                                                                                                     |
| POST   | /ats/candidates                 | multipart: firstName, lastName, email, phone, file, yearsOfExperience, tags (JSON), videoIntroUrl, videoIntroSource |
| PATCH  | /ats/candidates/:id             |                                                                                                                     |
| DELETE | /ats/candidates/:id             |                                                                                                                     |
| POST   | /ats/candidates/:id/avatar      | multipart                                                                                                           |
| PATCH  | /ats/candidates/:id/talent-pool | `{action:'add'                                                                                                      | 'remove', notes}` |
| PATCH  | /ats/candidates/:id/reject      |                                                                                                                     |
| POST   | /ats/candidates/:id/change-job  | `{applicationId,targetJobId,startStageId}`, then refetch                                                            |
| PATCH  | /ats/candidates/:id/restore     | `{jobId}`                                                                                                           |
| POST   | /ats/candidates/:id/assign-job  | `{jobId,startStageId?}`                                                                                             |
| POST   | /ats/candidates/:id/approve     | `{jobId}`                                                                                                           |

**ATS: applications (applications.store.ts)**

| Method | Path                                      | Notes                                                             |
| ------ | ----------------------------------------- | ----------------------------------------------------------------- |
| GET    | /ats/applications                         |                                                                   |
| GET    | /ats/applications/:id                     |                                                                   |
| PATCH  | /ats/applications/:id/approve             |                                                                   |
| PATCH  | /ats/applications/:id/stage               | `{stageId}`                                                       |
| PATCH  | /ats/applications/:id/hire                |                                                                   |
| PATCH  | /ats/applications/:id/reject              | `{reason,rejectionReasonId,destination,internalNotes}` (:290-293) |
| PATCH  | /ats/applications/:id/move-to-talent-pool | `{notes}`                                                         |
| PATCH  | /ats/applications/:id/notes               | `{notes}`                                                         |
| DELETE | /ats/applications/:id                     |                                                                   |

**ATS: interviews (interviews.store.ts)**

| Method | Path                                             |
| ------ | ------------------------------------------------ |
| GET    | /ats/interviews                                  |
| GET    | /ats/interviews/:id                              |
| POST   | /ats/interviews                                  |
| PATCH  | /ats/interviews/:id                              |
| DELETE | /ats/interviews/:id (cancel)                     |
| POST   | /ats/interviews/:id/feedback                     |
| GET    | /ats/applications/:appId/interviews              |
| POST   | /ats/applications/:appId/interviews              |
| PATCH  | /ats/applications/:appId/interviews/:id          |
| DELETE | /ats/applications/:appId/interviews/:id          |
| POST   | /ats/applications/:appId/interviews/:id/feedback |

**ATS: interview scorecards (interview-scorecards.store.ts)**

| Method | Path                          | Notes                      |
| ------ | ----------------------------- | -------------------------- |
| GET    | /ats/interview-scorecards     | `{candidateId, limit:100}` |
| GET    | /ats/interview-scorecards/:id |                            |
| POST   | /ats/interview-scorecards     |                            |
| PATCH  | /ats/interview-scorecards/:id |                            |

**ATS: jobs (jobs.store.ts)**

| Method | Path                     | Notes                                |
| ------ | ------------------------ | ------------------------------------ |
| GET    | /ats/jobs                | :116                                 |
| POST   | /ats/jobs                | :169                                 |
| GET    | /ats/jobs/:id            | :150                                 |
| PATCH  | /ats/jobs/:id            | :192                                 |
| DELETE | /ats/jobs/:id            | :214                                 |
| PATCH  | /ats/jobs/:id/status     | `{status}` (:237)                    |
| PATCH  | /ats/jobs/:id/pipeline   | `{templateId, stageMapping?}` (:272) |
| POST   | /ats/jobs/generate-draft | `{notes}` (:291)                     |
| POST   | /ats/jobs/standardize    | (:295)                               |

**ATS: clients (clients.store.ts)**

| Method | Path                                 |
| ------ | ------------------------------------ |
| GET    | /ats/clients                         |
| POST   | /ats/clients                         |
| GET    | /ats/clients/:id                     |
| PATCH  | /ats/clients/:id                     |
| DELETE | /ats/clients/:id                     |
| POST   | /ats/clients/:id/logo                |
| POST   | /ats/clients/:id/contacts            |
| PATCH  | /ats/clients/:id/contacts/:contactId |
| DELETE | /ats/clients/:id/contacts/:contactId |
| PATCH  | /ats/clients/:id/crm-profile         |
| GET    | /ats/clients/:id/notes               |
| POST   | /ats/clients/:id/notes               |
| PATCH  | /ats/clients/:id/notes/:noteId       |
| DELETE | /ats/clients/:id/notes/:noteId       |

**ATS: emails (emails.store.ts, use-candidate-email-activity)**

| Method | Path                         | Notes                                                              |
| ------ | ---------------------------- | ------------------------------------------------------------------ |
| GET    | /ats/emails                  | filters including search; `{candidateId, limit 100}` from the hook |
| GET    | /ats/emails/:id              |                                                                    |
| GET    | /ats/emails/thread/:threadId |                                                                    |
| POST   | /ats/emails                  | `SendEmailDto`                                                     |
| POST   | /ats/emails/:id/resend       |                                                                    |
| PATCH  | /ats/emails/:id/read         |                                                                    |
| DELETE | /ats/emails/:id              |                                                                    |
| POST   | /ats/emails/attachments      | multipart                                                          |

**ATS: templates, tags, other**

| Method | Path                                       | Notes                                                                   |
| ------ | ------------------------------------------ | ----------------------------------------------------------------------- |
| GET    | /ats/email-templates                       |                                                                         |
| POST   | /ats/email-templates                       |                                                                         |
| PATCH  | /ats/email-templates/:id                   | `setDefault` sends `{isDefault:true}`                                   |
| DELETE | /ats/email-templates/:id                   |                                                                         |
| GET    | /ats/pipeline-templates                    |                                                                         |
| POST   | /ats/pipeline-templates                    |                                                                         |
| GET    | /ats/pipeline-templates/:id                |                                                                         |
| PATCH  | /ats/pipeline-templates/:id                |                                                                         |
| DELETE | /ats/pipeline-templates/:id                |                                                                         |
| GET    | /ats/tags                                  |                                                                         |
| POST   | /ats/tags                                  |                                                                         |
| PATCH  | /ats/tags/:id                              |                                                                         |
| DELETE | /ats/tags/:id                              |                                                                         |
| GET    | /ats/disposition-reasons/active?stageName= | query string built by hand                                              |
| GET    | /ats/dashboard                             | dashboard.store.ts:598, plus five list calls with limit 9999 (:599-603) |

`download.ts` fetches arbitrary file URLs and attaches the token only for API URLs.

#### Socket.IO

Namespace `${VITE_WS_URL}/ats`; `auth.token` is sent at handshake (socket.ts:159-160).

**Listened to** (socket.ts:90-116):

- `candidate|job|application|interview|client|tag|pipeline_template|email_template : created|updated|deleted`
- `email:created`, `email:updated`
- Domain events `candidate:statusChanged`, `application:phaseChanged`, `job:statusChanged` (these trigger the dashboard invalidator)

**Emitted** (socket.ts:210-238):

- `join:job`/`leave:job` (jobId)
- `join:user`/`leave:user` ({userId})
- `join:applications`/`leave:applications`
- `join:room`/`leave:room` (room)

**Server reality** (backend/src/sockets/ats.socket.ts:35-51):

- On connect the server auto-joins `applications`, `candidates`, `jobs`, `clients`, `tags`, `pipeline-templates`, `email-templates` and `user:<id>`.
- It handles only `join:job` and `leave:job`.
- `join:user`, `join:applications` and `join:room` (all `useSocketRoom` calls other than job) are ignored.

**Backend emits** (grep of `emitToAts(`):

- No emit for `email:*`, `interview:deleted`, `user:*` or `settings:*`.
- Nothing is emitted to any `job:<id>` room.
- Interview events go to the `applications` room.

**Consequence**: the frontend's email realtime handlers, `interview:deleted`, and the per-job room are dead paths.

#### External services touched from this scope

- Cloudinary URLs for resumes, avatars and logos, displayed through resume-viewer and download.
- Google Meet and Zoom links shown as strings.
- docx-preview runs client-side.
- No Sentry or analytics on the frontend.
- Fonts come from `@fontsource-variable/inter`, bundled.

---

### 8. Data models and types (store/types)

- **common.ts**: `Pagination{total,page,limit,totalPages}`, `ApiError`, `AsyncState`, `PaginatedResponse`, `StageShape{_id,name,color,order,isActive,icon}`.
- **enums.ts** (`as const` objects with derived types):
  - CandidateStatus: pending, approved, hired
  - JobStatus: draft, open, on_hold, closed
  - ApplicationPhase: pending, approved, hired, rejected
  - InterviewStatus: scheduled, completed, cancelled, no_show
  - InterviewType: zoom, google_meet, phone_call, in_person
  - InterviewMeetingType: 8 values, with labels
  - ClientStatus: active, inactive, suspended
  - CrmHealth: green, yellow, red
  - JobPriority: low, medium, high, urgent
  - JobType: full_time, part_time, contract, temporary
  - LocationType: remote, hybrid, onsite
  - ExperienceLevel: entry, mid, senior, lead
  - AiFitRecommendation: poor_fit, moderate_fit, good_fit, strong_fit
  - InterviewRecommendation: strong_yes, yes, neutral, no, strong_no
  - WorkloadLevel
  - CandidateSource: applied, internal_upload
  - ApplicationSource: direct_apply, internal_upload, assigned
  - SalaryPeriod: hourly, daily, weekly, bi_weekly, monthly, yearly
  - CompanySize: 1-10, 11-50, 51-200, 201-500, 500+
  - UserRole: admin, hiring_manager, recruiter, coordinator, interviewer, account_manager, client, va
  - EmailDirection
  - EmailStatus: 8 values
  - EmailTemplateType: 8 values
  - AppAccess: ats, crm
  - EnglishProficiency
  - VideoIntroSource
  - NoteMethod
- **candidate.types.ts**:
  - Identity: names, email, phone, avatar.
  - Resume and media: resumeUrl, resumeOriginalName, resumeRawText, videoIntroUrl/Source, portfolio fields.
  - AI: `parsedData{summary,skills,languages,certifications,experience[],education[]}`, `aiValidation`, `aiScore{score,recommendation,...}`.
  - Profile: appliedJobId, yearsOfExperience, englishProficiency, current salary in PHP and USD, reasonForLeaving, city.
  - Status: source, `tags: RawTag[]`, talent-pool fields, status, `eligibilityStatus`, `permanentlyIneligibleAt/By/Reason`, legalHold, crmProfile.
  - Also Create and Update DTOs and `CandidateFilters`.
- **application.types.ts**:
  - Links and state: candidateId, jobId, clientId, phase, `currentStage`/`lastStage{stageId,stageName,assignedAt,assignedBy}`, source.
  - AI: aiValidation, aiScore (its `recommendation` is a plain string, unlike the candidate's enum).
  - Lifecycle: approved/hired/rejected/closed at/by, rejectionReason, dispositionDate, dispositionReasonId, `dispositionDestination: 'candidate_pool'|'permanently_ineligible'`.
  - Other: internalNotes, isBlocked, interviewIds, notes, appliedAt.
- **job.types.ts**:
  - Job: title, description, clientId, status, type, location, experience, priority, openings, list fields, tags, `salaryRange{min,max,currency,period}`, deadlines, `pipeline{templateId,stages: StageShape[]}`.
  - DTOs: `CreateJobDto` (with `pipelineId`), `GenerateJobDraftDto{notes}`, `GeneratedJobDraft`, `StandardizeJobContentDto`.
- **interview.types.ts**:
  - `MeetingDetails{link,meetingId,password,phoneNumber,address}`.
  - Interview: duration (server-set), timezone (company), interviewerIds, interviewerNames, `feedbacks[]`.
  - DTOs: Create, CreateNested, Update, Feedback.
- **interview-scorecard.types.ts**:
  - EXPERIENCE_SELECTIONS (8 values) and FINAL_RECOMMENDATIONS (5 values); types are only `initial_screening`.
  - CATEGORY_WEIGHTS: communication 30, experience 25, professionalism 15, technology 20, availability 10.
  - `computeScorecardPreview` mirrors the server formula (BUSINESS_LOGIC.md:154).
  - Not exported from types/index.ts (an intentional comment explains why).
- **client.types.ts**:
  - Client: companyName, email, phone, website, logo, industry, companySize, status, description, address, `contacts[{name,email,phone,position,isPrimary}]`, crmProfile, tags.
  - `ClientNote{method,content,author}`, plus DTOs.
- **email.types.ts**: Email with direction, from/to/cc/bcc, subject, body, status, threadId, `context{type,candidateId,applicationId,jobId,interviewId}`, attachments, resendId, isRead. `SendEmailDto` includes variables and attachments.
- **email-template.types.ts**, **pipeline-template.types.ts**, **tag.types.ts** (`RawTag = string | Tag`).
- **settings.types.ts**: `AppSettings{email{fromEmail,fromName}, ai{provider:'claude'|'openai', resumeValidation, candidateScoring, resumeParsing}, companyTimezone, applicationConfirmation{enabled,templateId}}`.
- **user.types.ts**:
  - `UserPermissions` covers 17 resources, each with optional read/write/manage/schedule/approve.
  - User: roles, appAccess, isActive, emailVerified, isInviteAccepted, lastLoginAts/Crm, clientRef, candidateRef.
  - `CreateUserDto.invitedBy` is client-supplied.
- **activity-log.types.ts**: `ActivityResourceType` has 16 values. BUSINESS_LOGIC.md:557 lists 19, including `pipeline_template`, `email_template` and `report`.
- **Relationships**: Application links Candidate, Job and Client; Interview links Application; Job.pipeline is a copy of a PipelineTemplate (BUSINESS_LOGIC.md:130); Tag is referenced by candidate, job and client.

---

### 9. Dependencies (how they are used in scope)

- **zustand + immer + persist**: every store. Persist uses localStorage.
- **socket.io-client**: socket.ts.
- **react-router-dom 7**: `createBrowserRouter`; guards use `Navigate`.
- **radix-ui (umbrella) and shadcn**: everything under ui/.
- **vaul**: drawer.tsx, which is unused.
- **next-themes**: ThemeProvider in main.tsx and the nav-user toggle.
- **sonner**: toasts, including toasts fired from inside stores (jobs.store.ts:221, users.store.ts:247).
- **TipTap 3**: rich-text-editor.
- **DOMPurify**: rich-text and the resume-viewer docx path.
- **marked**: markdown.ts.
- **docx-preview**: lazy-loaded in resume-viewer.
- **recharts 3**: ui/chart.tsx.
- **@tanstack/react-table**: table-pagination and app tables.
- **@dnd-kit**: pipeline board and template sheet (app scope).
- **react-hook-form + zod**: app forms.
- **lucide-react**: icons.
- **tw-animate-css**, **@fontsource-variable/inter**.
- **Dev dependencies**: shadcn (its CSS is imported at runtime by index.css), babel-plugin-react-compiler, eslint plugins.
- **No test libraries.**

---

### 10. ISSUES

1. **High · security/privacy · store/slices/\*.ts persist configs.** Entity data containing PII is written to localStorage:
   - `ats-applications` (applications.store.ts:452, no partialize)
   - `ats-interviews` (interviews.store.ts:427, no partialize; includes `meetingDetails.password`)
   - `ats-emails` (emails.store.ts:283, no partialize; full email bodies)
   - `ats-candidates` `detail` (candidates.store.ts:588)
   - `ats-users`, `ats-clients`, `ats-jobs`, `ats-activity-logs`

   This contradicts README.md:37 "Access tokens in memory only" in spirit. The data survives until logout; a plain reload or tab close does not clear it (session-reset.ts runs only on logout or 401). Because boot refetches everything anyway, the cache adds little. **Fix:** drop persist for entity lists or partialize to non-PII, and switch to sessionStorage at minimum. (Overlaps audit UX-22, still open.)

2. **High · security · backend/src/sockets/ats.socket.ts:35-42 (connection).** Every authenticated ATS user is auto-joined to the candidates, applications and clients rooms, so full documents are pushed to interviewers and coordinators regardless of their `permissions` map. The frontend applies them to stores. **Fix:** join rooms based on permissions, or strip payloads to ids and refetch.

3. **High · bug · store/realtime/socket.ts:210-238 vs backend/src/sockets/ats.socket.ts:44-50.** The frontend emits `join:user`, `join:applications` and `join:room`; the server handles only `join:job`/`leave:job`. No backend code emits to `job:<id>` rooms, and none emits `email:created`, `email:updated` or `interview:deleted` (grep of `emitToAts`). So:
   - the email realtime handlers (socket.ts:114-115, main.tsx email `_patch`) never fire;
   - unread-email toasts update only when a fetch happens (inferred);
   - an interview cancel from another user is never reflected. BUSINESS_LOGIC.md:488 claims `email:*` events exist.

   **Fix:** align the contract (emit the email and interview-deleted events server-side) and delete the dead room emits.

4. **High · bug · auth.store.ts:238-241.** `runAuthInit` treats any refresh error, including a network error, 5xx or rate-limit 429, as logged-out. This contradicts api-client's "only 401/403 is definitive" policy. A backend blip during reload logs every user out. It also does not call `resetSessionScopedStores`, so persisted entity caches stay on disk. **Fix:** distinguish `RefreshFailedError` with 401/403 from transient errors and retry or keep the session on transient ones.

5. **High · security/UX · components/auth/protected-route.tsx:10-26.** There is no `appAccess` check; per BUSINESS_LOGIC.md:600 login does not check the app either. A CRM-only account (client, va, account_manager) can sign into the ATS UI, reach the shell and trigger 9999-row boot fetches that 403 (inferred). **Fix:** after login or refresh, require `user.appAccess.includes('ats') || roles.includes('admin')`, otherwise log out with a message. The backend login should also enforce it.

6. **High · bug · applications.store.ts:391-420 (`_patch`).** The merge uses `app.x ?? prev.x` for currentStage, rejectionReason, closedAt, dispositionDestination, dispositionReasonId and others. A field the server clears to `null` (for example `currentStage` on reject, or disposition fields when an application is reopened by a move, BUSINESS_LOGIC.md:336) is never cleared locally. Stale stage or disposition data stays on screen until a full reload. **Fix:** replace the record with the server payload, or merge with `'key' in app` semantics.

7. **High · performance · router.tsx:1-34, vite.config.ts.** Every page is imported eagerly, producing a single 2.6 MB JS chunk (`dist/assets/index-u4hgZwva.js`, 2,637,030 bytes). The public careers page pays the full ATS bundle (TipTap, recharts, dnd-kit). **Fix:** use `lazy()` and route `lazy` for the app pages, split the careers entry, and add `manualChunks` for vendor code.

8. **High · performance · lib/boot-data.ts:77-90; dashboard.store.ts:579-603.** Boot pulls entire collections (limit 9999) into the browser. The dashboard refetches the snapshot plus five 9999-row lists on every fetch and on every socket invalidation while it is mounted. This does not scale with data volume, and a list silently truncates past 9999 rows. **Fix:** use server-side pagination and aggregates, or at least debounce and make invalidation incremental.

9. **High · type-safety · tsconfig.app.json:2-26.** `strict` is off, so there is no `strictNullChecks`. Many `as` casts in the stores (for example `(res as {data:User[]}).data`, users.store.ts:96-98) hide shape errors, and the audit's "tsc CLEAN" baseline (ATS-UI-UX-AUDIT.md:17) is weak evidence. **Fix:** enable strict incrementally.

10. **Medium · bug · store/realtime/socket.ts:152.** The `connect()` guard checks only `this.socket?.connected`. Calling it while a socket is still connecting, as reconnect and login can both trigger (inferred), creates a second socket, giving duplicate listeners and double patches. Separately, `auth:{token}` is a static object captured at creation (:160), so automatic reconnection after token expiry resends an expired token. The `connect_error` auth branch then disconnects permanently (:182-185) and realtime silently stops until reload. **Fix:** guard on `this.socket && !this.socket.disconnected`, use `auth: cb => cb({token: getAuthToken()})`, and reconnect after a token refresh.

11. **Medium · bug · auth.store.ts:211-213.** The `onUnauthorized` handler resets auth state but does not disconnect the socket or clear persisted stores. After a definitive 401 the old socket can keep pushing data into stores until it errors. **Fix:** call `socketManager.disconnect()` and `resetSessionScopedStores()`.

12. **Medium · bug · pipeline-templates.store.ts:208.** After a failed two-step `setAsDefault`, the code calls `void get().fetch()` "to reconcile". After boot that fetch is a no-op (the unfiltered early return, compare jobs.store.ts:86-97), so local state stays inconsistent. **Fix:** add a `force` parameter or call `getJson` directly.

13. **Medium · bug · jobs.store.ts:99-131 (same pattern in interviews.store `refresh` and applications.store `fetch`).** A filtered fetch merges the new params into the persisted `filters` and then replaces `items` with the filtered subset. Because later unfiltered calls are no-ops, the global list stays narrowed: other pages see only that client's jobs, and stores used for cascade warnings (UX-35) under-count. **Fix:** keep scoped results in separate keyed state, or merge rather than replace.

14. **Medium · bug · lib/session-reset.ts.** The in-memory `disposition-reasons` store, the `interview-scorecards` store and the module-level `use-interviewer-options` cache are not reset on logout. The next user in the same tab sees the previous user's scorecards and interviewer list until reload. **Fix:** register reset hooks for these.

15. **Medium · bug · interviews.store.ts (`byApplication`).** The per-application cache is populated by `GET /ats/applications/:appId/interviews` but never updated by create, update or cancel mutations or by socket events. Views reading it show stale interviews (inferred from the store code). **Fix:** update it in the mutations and `_patch`, or derive it from `items`.

16. **Medium · bug · activity-sentence.ts:176-243 vs :497, :487, :1124.** `job_changed` and `cancelled` have icons and switch cases but are missing from `KNOWN_ACTIONS`, so they are flagged `isLegacy`. A prefixed `application_job_changed` resolves to no key. Meanwhile `isLegacy` is never consumed anywhere in the UI, although the file's docs (:54-58) say the timeline renders a badge. **Fix:** add the two actions to `KNOWN_ACTIONS`, and either render the badge or delete the field.

17. **Medium · bug · activity-sentence.ts:586-593, :612-619, :1372.** `resume_validation_completed` reuses the AI verdict text, but tone and icon resolution special-case only the other two AI actions, so a failed resume validation renders in the neutral or "ai" tone rather than danger. **Fix:** include it in the verdict tone and icon branches.

18. **Medium · UX/inconsistency · app-sidebar.tsx:87-108 vs router.tsx:91-139.** The nav filters by permission and the routes guard by role. The Team link shows for any `team.read` holder (the default for 4 non-admin roles, BUSINESS_LOGIC.md:264) but routes them to /ats/unauthorized. Emails and Quick Import are always visible (nav-main). Dashboard, Clients and Jobs routes have no guard at all. **Fix:** use one source of truth, a permission-based `RouteGuard` reused by both.

19. **Medium · bug/UX · components/schedule-interview-dialog.tsx:341-358.** The Google Meet link has an HTML `required` attribute only, so the submit path does not enforce it (inferred). There is no validation for phone or address, or for past dates. The interviewer list can be emptied despite the "you are included by default" copy. The `grid-cols-2` blocks (:245, :295) are not responsive (audit UX-04 partially addressed). **Fix:** validate in the submit handler and use `grid-cols-1 sm:grid-cols-2`.

20. **Medium · UX/a11y · components/ui/sidebar.tsx (keyboard shortcut).** A window-level Ctrl/Cmd+B toggles the sidebar even while focus is in the TipTap editor, where it means bold. The likely result is both actions, or a collapsed sidebar mid-edit (inferred). **Fix:** ignore the shortcut when the target is editable.

21. **Medium · UX · layout.tsx:16 (with ui/sidebar.tsx fixed `left-0`).** The sidebar detaches from the content above 1440px. This is audit UX-01, still open. **Fix:** remove the wrapper or move the max-width inside `SidebarInset`.

22. **Medium · UX · components/ui/sheet.tsx:76.** The close button uses `right-full`, outside the panel, so it is off-screen when the sheet is full width on mobile. This is audit UX-05, still open.

23. **Medium · a11y · components/tags-selector.tsx:107-113, :170-175.** The remove (x) buttons have no accessible name, and the popover uses raw `PopoverPrimitive` without a Portal (:94-136), so it can be clipped by `overflow-hidden` sheets (inferred). The audit marked UX-11 fixed with "0 unnamed", but these sites, originally listed at UX-11 line 439, were not in its fix table. **Fix:** add `aria-label={\`Remove tag ${tag.name}\`}`and use`ui/popover`.

24. **Medium · security (defence in depth) · lib/markdown.ts:29-33.** `descriptionToHtml` returns raw `marked` output. RichText sanitizes it, and RichTextEditor's schema strips unknown nodes, but any future direct `dangerouslySetInnerHTML` use would be XSS. Also, rich-text.tsx allows `target` without forcing `rel="noopener noreferrer"`. **Fix:** sanitize inside `descriptionToHtml`, and add a DOMPurify `afterSanitizeAttributes` hook that sets `rel`.

25. **Medium · bug · lib/public-api.ts.** The "public" API aliases the authenticated `getJson`/`postJson`. An anonymous careers visitor who gets a 401 triggers `POST /auth/refresh-token` and `onUnauthorized` (inferred from api-client behaviour). `postJsonPublic` exists but is not used here. **Fix:** route public calls through the non-refreshing helpers.

26. **Medium · security · vercel.json:2.** No security headers are configured (no CSP, frame-ancestors, Referrer-Policy or Permissions-Policy), even though the app renders user and email HTML. **Fix:** add a `headers` block.

27. **Medium · bad implementation · dist/ committed.** The build output (2.6 MB bundle, fonts, assets) is checked in next to the source. It goes stale relative to src and inflates diffs. The audit itself verified fixes "against dist/assets" (ATS-UI-UX-AUDIT.md:614-617, 933). **Fix:** gitignore dist and build in CI or Vercel.

28. **Medium · inconsistency/UX · emails.store.ts (socket `_patch`).** It unshifts incoming emails into the currently filtered page regardless of the filter. The path is dead today (issue 3), but it would mis-list emails once the events exist. use-unread-emails counts only the 50 loaded emails. **Fix:** check filter membership, and get the unread count from the server.

29. **Medium · bug · dashboard.store.ts:574-575.** `fetch` returns early while a fetch is in flight, so socket invalidations during a fetch are dropped rather than queued. `fetchSeq` (:552, :579) cannot actually supersede anything because overlapping runs never start. **Fix:** set a dirty flag and refetch after the current run.

30. **Medium · ambiguity · dashboard.store.ts (pipeline conversion).** "Conversion" is computed from the current phase counts, not from stages reached, so a candidate who was hired then rejected elsewhere (for example) skews the rates. **Fix:** compute from history, or relabel as "current distribution".

31. **Medium · inconsistency · public-shell.tsx vs index.css careers comments.** `isDark` is hard-coded true, while index.css says careers "always renders light", and `.careers-theme`/`.careers-dark` contradict each other. **Fix:** decide on one careers theme and delete the dead block.

32. **Medium · UX · components/activity-timeline.tsx.** It uses the activity-logs store's single global `loading`/`error`, so two timelines (for example sheet and page) interfere. RESOURCE_ICON lacks `pipeline_template`, `email_template` and `report`. The documented tone badge on named-actor avatars is not rendered. A comment says 26px where the size is 24px. It also imports from `@/app/candidates/_utils/candidate-styles`, a layering inversion. **Fix:** key loading and error state per feed, and move the shared styles into lib.

33. **Medium · UX · components/resume-viewer.tsx (full-view overlay).** It has no Escape-to-close, no focus trap and no `role="dialog"`. **Fix:** use `ui/dialog`.

34. **Medium · a11y · components/reject-dialog.tsx.** Labels have no `htmlFor` (audit UX-13, still open at its listed lines). "Never rehire" reasons remain selectable when the destination radio is hidden. `defaultEligibility` is unused. The comment references a missing `CANDIDATE-FLOW-SPEC.md`. **Fix:** associate labels, filter reasons by destination, and remove the dead reference.

35. **Low · bug · hooks/use-candidate-email-activity.ts.** It does not clear rows when `candidateId` changes, so the previous candidate's emails flash, and it refetches whenever the global email count changes. **Fix:** reset on id change and key by id.

36. **Low · bug · hooks/use-interviewer-options.ts.** The module-level cache never expires, so new team members never appear without a reload. **Fix:** add a TTL, or invalidate on users-store changes.

37. **Low · bug · components/nav-user.tsx.** The theme toggle uses `theme`, which can be `system`, instead of `resolvedTheme`, and `handleLogout` awaits without a catch, so a failed logout throws an unhandled rejection. **Fix:** use `resolvedTheme` and wrap the logout in try/finally.

38. **Low · dead code · components/ui/drawer.tsx (vaul), public/favicon.svg (Vite logo), public/icons.svg (Vite template sprite), the `sidebar_state` cookie write (ui/sidebar.tsx), and `isLegacy` (activity-sentence.ts).** None are used. **Fix:** remove them, and drop `vaul` from the dependencies.

39. **Low · duplication.**

- `looksLikeHtml`: markdown.ts:5-10 and html.ts:31-33.
- `formatDate`: utils.ts:19 (en-US) and job-format.ts:60 (browser locale), which give different output.
- AI action set: use-activity-actors.ts and activity-sentence.ts.
- `PAGE_SIZE_OPTIONS` (table-pagination.tsx) and `DEFAULT_PAGE_SIZES` (use-table-pagination.ts).
- `TableSkeleton`: candidates-table.tsx:435 and clients-table.tsx:219.
- Collapsed-tooltip logic: nav-main.tsx and ui/sidebar.

**Fix:** consolidate.

40. **Low · bad implementation · stores fire toasts** (jobs.store.ts:221-260, users.store.ts:247-253, candidates.store). UI side effects inside state logic make toasts double up when callers also toast, and keep the stores from being reused silently. **Fix:** return results and let components toast.

41. **Low · type-safety · user.types.ts / users.store.ts:119-128.** `invitedBy` is built on the client and sent to `POST /shared/users`. If the backend trusts it, the "invited by" name in invite emails can be spoofed by any user with `team.write` (inferred; backend not verified here). **Fix:** derive the inviter server-side from `req.user`.

42. **Low · inconsistency · application.types.ts.** `aiScore.recommendation` is typed `string`, while the candidate's is `AiFitRecommendation`. `ActivityResourceType` has 16 values vs 19 in BUSINESS_LOGIC.md:557. **Fix:** share the enums.

43. **Low · bug · disposition-reasons.store.ts.** The query string is built by hand, so `stageName` is not URL-encoded and an undefined stage leaves a trailing `?`. **Fix:** pass params to `getJson`.

44. **Low · ambiguity · timezones.ts:36 and :115.** "BST" labels both Dhaka (Bangladesh Standard Time) and London (British Summer Time). **Fix:** use offset-based labels.

45. **Low · inconsistency · lib/tags.ts:49-50.** `useMemo` deps list `cacheKey` but the closure reads `cache`. This violates exhaustive-deps and is fragile. **Fix:** depend on `cache`.

46. **Low · UX/theming · index.css:93-96.** `--success`, `--warning` and their `-bg` variants have no `.dark` override (audit UX-48, still open). `--text-secondary` and `--text-muted` are also not redefined for dark mode.

47. **Low · a11y · components/ui/textarea.tsx.** It is always `text-sm` (14px), so iOS Safari zooms on focus. **Fix:** use `text-base md:text-sm` as Input does upstream.

48. **Low · docs drift · STYLE.md.** These claims contradict the code (details in section 5):

- token hex values (:62-65 vs index.css:93-96)
- nav sections (:459-465)
- sidebar cookie persistence (:477)
- modal and sheet radius (:194)
- checkbox classes (:386)
- weight rule (:122)

README.md:11 references `.env.example`, which is absent from the copy (may be due to the dotfile stripping). CLAUDE.md:1 has the typo "paractices". **Fix:** regenerate STYLE.md from source.

49. **Low · docs drift · BUSINESS_LOGIC.md:483-488.**

- It says `/ats` events include `email` and that `join:job` adds `job:<id>`. Nothing emits email or `job:<id>` events (issue 3).
- It states "The ATS UI keeps the access token in memory only" (:615) but omits that all entity data is persisted (issue 1).
- Its permission table (:253-270) is not reflected in the frontend route guards (issue 18).

50. **Low · docs drift · ATS-UI-UX-AUDIT.md.** Status verification follows. Internal contradictions:

- The section headers for UX-11, UX-15, UX-16, UX-18 and UX-19 still read "**Status:** Open" (:420, :786, :852, :981, :1078) while the progress table says Fixed.
- Four fix-log commits are "(pending)" (:101-104).
- Paths use `ats-ui/`, but the repo folder is `ats/`.
- UX-20's fix cites "`components/ui/command.tsx` ships in this repo and is used elsewhere" (:1183). There is no command.tsx in components/ui (ls), so that claim is false.
- Appendix C.7 (:2244) correctly notes that `join:room` is ignored by the server.

**Spot-checked still holds:**

- UX-01: layout.tsx:16.
- UX-05: sheet.tsx:76.
- UX-09: layout.tsx:10.
- UX-21: stores' `error` mostly unrendered; components not re-verified exhaustively.
- UX-22: persist configs listed above. applications is now at :452, not :421.
- UX-27: two TableSkeletons.
- UX-36: no alert-dialog primitive.
- UX-40: api-client.ts:60 still emits raw `field: message`.
- UX-46: sonner has no action or duration.
- UX-48: index.css:93-96.
- UX-49.1: 17 font-bold/font-light occurrences.
- UX-49.9: dialog.tsx:62 `rounded-xl`.
- UX-13 in reject-dialog.

**Spot-checked fixed:**

- UX-10: table-pagination has 9 aria-labels.

**Partially fixed:**

- UX-04: grid-cols-4 became grid-cols-2, still not responsive.
- UX-11: tags-selector buttons are still unnamed.

The remaining app-folder claims (UX-02, -03, -06, -07, -14, -20, -23 to -26, -30 to -35, -37 to -45, -47) are outside this scope and should be confirmed by the app auditors.

---

_End of audit. Read-only review; no code, config or repository was changed._
