# Arista ATS (frontend) — Codebase Audit

**Repo:** `ats-crm/ats` · **First audited:** 14 Oct 2026 · **Updated:** 20 Oct 2026 · **Method:** read-only review of the source; nothing was built, run or pushed during the audit.

**Current size:** 651 files and **58,321 lines** under `src/` (436 `.tsx`, 214 `.ts`, 1 `.css`). No automated tests.

**What changed in this update**

- Every finding from the 14 Oct audit (185) was re-checked against the current code and the git history since then. **21 are resolved and removed** (listed in §A8.1). The other 164 are still open and kept in Part B under their original IDs.
- The original audit was written against a few very large files (`candidate-detail-sheet.tsx` 4,229 lines, `candidates-table.tsx` 2,754 lines). These have since been split into hooks and small components, so **`path:line` references inside Part B point at the pre-split code**. The claim in each finding was re-checked against the new code, but the line numbers are only a pointer to the topic.
- The per-file summaries of Part B, which described the old layout, were dropped. The synthesis (Part A) and the open-issue lists (Part B) remain.
- Findings in Area A that cite `BUSINESS_LOGIC.md`, `STYLE.md` or `ATS-UI-UX-AUDIT.md` refer to docs that are no longer in this repository.

**How to read this document**

- **Part A** is the synthesis: what the app is, how it is built, how it connects to the backend, and the ranked list of open problems.
- **Part B** holds the open findings per area: **A** = candidates + careers, **B1** = jobs, clients, settings, tags, team, **B2** = auth, dashboard, calendar, emails, hired, talent pool, ineligible, home, **C** = infrastructure (router, stores, socket, lib, hooks, shared components, config). References like **[A-3]** point to issue 3 in area A.

**Not re-verified:** items that depend on backend behaviour (for example whether the emails endpoint now honours `search`) were checked on the frontend only.

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
| State        | Zustand 5 (immer; most slices persisted to `localStorage`) + immer                                                                     |
| Data         | Custom fetch wrapper `lib/api-client.ts` with single-flight token refresh; "boot" loads every list with `limit: 9999` after login |
| Realtime     | socket.io-client 4.8 (`/ats` namespace)                                                                                           |
| UI           | Tailwind 4 + shadcn/ui on the unified `radix-ui` package, lucide icons, sonner toasts, cmdk (shadcn Command), vaul (unused)                              |
| Tables / DnD | TanStack Table 8, dnd-kit (pipeline board)                                                                                        |
| Forms        | react-hook-form + zod 4 (careers/quick-import); most other forms are hand-rolled `useState`                                       |
| Rich text    | TipTap 3 (editor), marked (markdown → HTML), DOMPurify (sanitize)                                                                 |
| Charts       | recharts 3.8                                                                                                                      |
| Docs         | docx-preview (resume viewer)                                                                                                      |
| Theming      | next-themes (light/dark), Inter variable font                                                                                     |

Dependency hygiene: `shadcn` (a CLI) sits in `devDependencies` here, which is correct; `vaul`/`ui/drawer.tsx` are unused; the build ships as **one large JS chunk** with no route splitting [C-7]; `dist/` is committed next to source [C-27]. Full list in Part B · C §9.


## A3. Structure

```
ats/src
├── main.tsx, App.tsx, router.tsx, index.css
├── app/          feature pages (page.tsx + _components, _hooks, _utils, _data per feature)
├── components/   shared components (assign-job-dialog, tag-filter, candidate-form, schedule-interview, ui/ shadcn…)
├── hooks/        permission, pagination, debounced search, socket rooms, presence, unread emails…
├── lib/          api-client, boot-data, session-reset, activity-sentence, timezones, html/markdown…
└── store/        slices/*.store.ts (+ .helpers / .types), types/*.types.ts, realtime/socket.ts
```

Full tree with line counts: **§A9**.

Observations on structure:

- The big-file problem from the first audit is largely gone. The candidate detail sheet is now a thin shell over `use-candidate-*` hooks and ~60 small components in `candidates/_components`, and the stores are split into `.store`, `.store.helpers` and `.store.types` files.
- The biggest remaining files are `components/ui/sidebar.tsx` (702, shadcn), `store/realtime/socket.ts` (471), `lib/activity-actions.ts` (458), `lib/dashboard-metrics.ts` (376) and `lib/timezones.ts` (371).
- `candidates` is still the largest feature (108 files, 10,088 lines, about 17% of the code).
- The folder convention mimics Next.js (`page.tsx`) inside a Vite SPA; some stub pages (`jobs/[id]`, `clients/new`, `team/[id]`, `candidates/[id]`) are not linked from the router [C-38].


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
- **Socket.IO `/ats`:** server auto-joins every user to all rooms and pushes full documents. The client still emits `join:user`, `join:applications`, `join:room`, which the server ignores (it only handles `join:job` / `leave:job`); the server never emits `email:*` or `interview:deleted`, so those handlers are dead [C-3].
- **Contract mismatches found** (frontend ↔ backend):
  | Frontend | Backend | Effect |
  |---|---|---|
  | `POST /ats/emails/attachments` | route does not exist; send schema has no `attachments` | attachments always fail / silently dropped [B2-1] |
  | Template variables `candidatePhone`, `currentStage` | not in backend enum | template save 400 [B1-7] |
  | UI says resume "up to 10 MB", PDF only | parse endpoints 5 MB, accept DOCX | 6–9 MB files pass UI then fail [A-10] |
  | Invite acceptance uses `/auth/reset-password` | CRM uses `/auth/set-password` | two code paths with different side effects [B2-21] |
- **External services:** none are called from the browser (the Inter font is bundled). Zoom, Resend, Cloudinary and AI are all reached through the backend; the browser only loads Cloudinary file URLs and meeting links.


## A6. Data model (frontend view)

Types live in `store/types/*.types.ts` and mirror backend models: Candidate (status pending/approved/hired, talent-pool flag, eligibility, parsedData, aiScore, aiValidation, legalHold), Application (phase pending/approved/hired/rejected, currentStage, disposition fields, aiScore), Job (status draft/open/on_hold/closed, embedded pipeline stages), Client (contacts, crmProfile, notes), Interview (type zoom/google_meet/phone/in_person, timezone, feedbacks, meetingDetails), InterviewScorecard (5 weighted categories), Email, EmailTemplate, PipelineTemplate, DispositionReason, Tag, User (roles, appAccess, permissions), ActivityLog, Settings. Full field reference: Part B · C §8. Enum and type duplication vs the backend is noted in [C-42].


## A7. UI/UX and styles — summary

- **Strengths:** consistent shadcn look, real light/dark theming, good boot/outage screen, rich activity timeline, careful timezone helpers, careers flow with parsing review.
- **Weaknesses:**
  - Stale-data UX: detail sheets act on snapshots (talent pool / legal hold toggles repeat the same action [A-3], notes saved to the wrong candidate [A-4], calendar sheet stale after actions [B2-6], edit sheets overwrite newer data [B1-3, B1-5]).
  - Mobile: jobs master/detail has no mobile layout, template sheets `w-[30vw]`, sheet close button off-screen, sidebar detaches above 1440px [B1-35, C-21, C-22].
  - Accessibility: rows not keyboard-openable, unlabeled icon buttons, labels not bound to inputs, nested interactive elements, no focus trap in resume viewer [A-26, B1-51, B2-25, C-23, C-33, C-34].
  - Styles: hard-coded hex in dashboard and team screens; `--success/--warning` lack dark values [C-46, B2-39].
- Details: Part B · each area §4 and §5.


## A8. Open issues (ranked)

Open findings: A 32 · B1 52 · B2 36 · C 44 = **164**. IDs are from the 14 Oct audit; the full text of each is in Part B.

### Critical / High — security and privacy

1. **PII persisted to `localStorage`.** Candidates, applications, interviews (incl. Zoom passwords), emails, users, clients and activity logs survive reloads and only clear on explicit logout (`session-reset.ts` clears them then). [C-1]
2. **Socket pushes full candidate/client/interview documents to every ATS user** regardless of permission (backend root cause; the frontend applies them). [C-2]
3. **No `appAccess` gate**: CRM-only accounts can enter the ATS shell (`protected-route.tsx`). [C-5]
4. **Inbound email HTML** is rendered in an iframe that still loads remote images and tracking pixels. [B2-12]
5. **No security headers** on the Vercel deployment (`vercel.json` has only the SPA rewrite). [C-26]
6. **Applicant-controlled upload limits and types disagree** between UI and backend (10 MB vs 5 MB, DOCX). [A-10]

### High — broken features and data corruption

7. Email attachments cannot work (missing route and schema). [B2-1]
8. Candidate detail sheet acts on a stale snapshot, so a second toggle repeats the same action. [A-3]
9. Pipeline notes can be saved onto the wrong candidate (notes state is not reset when the candidate changes). [A-4]
10. Edit Job sheet and Rejection Reason sheet open with stale data and overwrite on save. [B1-3, B1-5]
11. Tag bulk delete can delete tags the user never selected (row-index selection, no `getRowId`). [B1-6]
12. Editing an interview can silently shift its time (interview tz vs company tz). [B2-5]
13. `applications._patch` uses `??`, so fields cleared on the server never clear locally. [C-6]
14. Any refresh error on reload (network, 5xx, 429) logs the user out. [C-4]
15. Template variables offered by the picker are rejected by the backend. [B1-7]
16. Client emits `join:user`, `join:applications`, `join:room`, which the server ignores. [C-3]

### High — performance and type safety

17. Single large bundle, every route imported eagerly, shared with the public careers page. [C-7]
18. Boot loads every collection with `limit: 9999`. (The dashboard itself now uses a slim metrics endpoint.) [C-8]
19. TypeScript `strict` is off; many unchecked casts. [C-9]

### Medium — logic, permissions, UX (selected)

- Multi-job candidates: row/sheet actions always act on the first application; bulk reject ignores the job filter. [A-13]
- Quick Import is two non-atomic calls; failure leaves an "approved" candidate visible in no tab. [A-7, A-17]
- No permission gating on buttons anywhere except `clients-table`; hierarchy ignored. [A-16, B1-11..15, B2-9, C-18]
- Socket: `connect()` guard still checks only `connected`; `onUnauthorized` does not disconnect the socket. [C-10, C-11]
- Logout does not reset the scorecards store, disposition-reasons store or interviewer cache. [C-14]
- Application deadline enforced only on the job detail button; backend has no check. [A-9]
- Interview feedback impossible after "Mark as Complete"; destructive interview actions without confirmation. [B2-7, B2-8]
- Dashboard funnel mixes candidate and application units; "conversion" can exceed 100%. [B2-11, C-30]
- Pipeline board drag errors not handled or rolled back; rejected cards don't move. [B1-9, B1-10]
- Team delete is a hard delete with no self-protection. [B1-31]
- Optional job/client fields cannot be cleared on edit. [B1-22]
- Client Notes tab can show another client's notes (`fetchedRef`). [B1-24]
- Client tag updates fail silently; the store no longer toasts, so the "toast handled by store" comment is now wrong. [B1-28]
- Public careers API aliases the authenticated helpers. [C-25]

### Low — hygiene

Dead code (stub routes, unused drawer/vaul, `isLegacy`), duplication (apply vs quick-import, status maps), unguarded `localStorage`/`sessionStorage` access, date strings parsed as UTC, Emails missing from the sidebar. [A-29, A-30, B1-49, B1-50, B2-23, B2-24, B2-41, C-38, C-39]

### Ambiguities that need an owner decision

- Can a candidate be in the Talent Pool and in a pipeline at the same time? [A-15, A-36, B2-35]
- Where do `approved` candidates with no application belong? [A-17]
- Which timezone should the calendar display: viewer, company or interview? [B2-20]
- Should salary, reason-for-leaving and CRM wellbeing flags be visible to interviewers? [B2-34]
- "Approve & Email" uses the `offer` template type for a pipeline approval. [A-15]

### A8.1 Resolved since 14 Oct (removed from Part B)

| ID | Finding | How it was fixed |
|---|---|---|
| A-1, B2-2 | Bulk email exposed every recipient's address | Bulk emails now go out as one message per recipient (`da1386f`) |
| A-2 | Backend trusted client-supplied `resumeRawText` | Backend extracts text from the uploaded file and ignores the client value (`job.controller.ts`) |
| A-5, A-6, B1-2, B2-4, C-13 | Filtered fetches left the shared jobs/interviews lists narrowed (also made the calendar status filter unable to return to "All") | Full list is reloaded after a filtered fetch (`8254518`) |
| A-8 | `handleHire` relied on a no-op refetch | Hire goes through the application store `hire` action |
| A-21 | Duplicate toasts on interview create | Stores no longer toast; callers toast once (`374885f`) |
| B1-1 | New Job ignored the chosen pipeline | Form sends `pipelineTemplateId` (`a77c5d5`) |
| B2-3 | Emails search input dropped keystrokes | Input state separated from the debounced query (`9a85ccc`). Whether the backend honours `search` was not re-checked |
| B2-10 | Dashboard re-downloaded five 9999-row lists per visit | Dashboard loads from `/ats/dashboard/metrics`, with debounced live refresh (`3b25907`); old requests remain only as a fallback |
| B2-16 | `AssignJobDialog` x3 and `TagFilter` x2 | One shared `components/assign-job-dialog.tsx` and `components/tag-filter.tsx` |
| B2-18 | Permanently-ineligible page bypassed the store | Uses the shared `use-ineligible-actions` hook (`2332c15`) |
| C-29 | Dashboard dropped socket changes that arrived during a fetch | Changes during a refresh are re-applied (`a28e43e`) |
| C-40 | Stores fired toasts | Toasts moved into callers (`374885f`) |
| B1-26 | Removing a client logo only cleared the preview | New `DELETE /clients/:id/logo` endpoint (deletes the Cloudinary image); the edit sheet calls it on save |
| C-48, C-49, C-50 | Docs drift in STYLE.md, BUSINESS_LOGIC.md, ATS-UI-UX-AUDIT.md | Those files are no longer in the repository |

Also changed since: reloads are faster (inbox and ineligible list no longer block boot, dashboard loads in parallel, job counts and job tabs reuse loaded data); job cards no longer count pending or permanently-ineligible rejections; the client logo upload now sends the field name the backend expects; pipeline columns show a loading state.

Also improved but still open: realtime recovery after token expiry and reconnect refetch (`05aaf21`, `2a59804`) address part of **[C-10]**; inline "Yes/No" delete confirms were replaced by dialogs in tags, team, pipeline templates, contacts, notes and bulk emails (`e904f06`, `9c9b96e`, `6d01f5f`); template sheets are full-width on phones (`22d75de`).


## A9. File tree (line counts, `.ts`/`.tsx`/`.css` only)

```
src/  (651 files, 58,321 lines)
├── app/  (437 files, 36,327 lines)
│   ├── auth/  (14 files, 725 lines)
│   ├── calendar/  (18 files, 1,829 lines)
│   ├── candidates/  (108 files, 10,088 lines)
│   ├── careers/  (23 files, 1,613 lines)
│   ├── clients/  (46 files, 3,857 lines)
│   ├── dashboard/  (6 files, 927 lines)
│   ├── emails/  (41 files, 2,790 lines)
│   ├── hired/  (8 files, 679 lines)
│   ├── home/  (4 files, 257 lines)
│   ├── jobs/  (63 files, 4,576 lines)
│   ├── permanently-ineligible/  (9 files, 610 lines)
│   ├── settings/  (41 files, 4,026 lines)
│   ├── tags/  (9 files, 788 lines)
│   ├── talent-pool/  (14 files, 1,168 lines)
│   ├── team/  (30 files, 2,320 lines)
│   └── unauthorized/  (1 files, 40 lines)
├── components/  (101 files, 9,511 lines)
│   ├── activity-timeline/  (5 files, 295 lines)
│   ├── auth/  (2 files, 82 lines)
│   ├── candidate-form/  (11 files, 630 lines)
│   ├── candidate-table/  (6 files, 300 lines)
│   ├── reject/  (2 files, 227 lines)
│   ├── schedule-interview/  (10 files, 623 lines)
│   └── ui/  (27 files, 3,131 lines)
├── hooks/  (18 files, 1,008 lines)
├── lib/  (40 files, 4,442 lines)
│   └── activity-sentence/  (14 files, 1,466 lines)
├── store/  (51 files, 6,472 lines)
│   ├── realtime/  (2 files, 544 lines)
│   ├── slices/  (31 files, 4,338 lines)
│   └── types/  (17 files, 1,568 lines)
├── App.tsx  (6)
├── index.css  (397)
├── main.tsx  (19)
└── router.tsx  (139)
```

---

# Part B — Open findings by area


## Area A — Candidates and public careers

32 open of 38 originally reported. IDs are unchanged, so `[A-n]` references still match.

3. **High · bug** · detail-sheet 2218-2238 and 1678-1689. Handlers read the **prop snapshot** `candidate` (`candidate.inTalentPool`, `candidate.legalHold`, `candidate.status`) instead of the live `c` (2376). The table passes a snapshot that never refreshes (`setSelected(candidate)`, candidates-table.tsx:1763), so after one toggle the next click sends the same action again: "add" twice, or legal hold `true` twice. The UI labels use `c` (3542, 3433), so the label and the action disagree. `handleToggleLegalHold` even refetches into the store "so the sheet reflects the new hold state" (1687-1689), but the handler still reads the stale prop. The same applies to `candidate.status` in the approve handlers (1764, 1820, 1883), the ConfirmDialog titles (3713-3891) and the scorecard fetch effect (2120). Fix: use `c` everywhere after it is resolved, or move the handlers below the `c` resolution.

4. **High · bug** · detail-sheet 1564, 3177-3209. `notesText` is component state that is never reset when the candidate changes. The sheet stays mounted in the table (candidates-table.tsx:2743) and its state persists between candidates. Text typed or loaded for candidate A stays in the textarea when candidate B opens. The prefill-on-focus runs only when the field is empty (3182-3186), so "Save Notes" writes A's notes onto B's application. Fix: key the sheet or notes block by `candidate._id`, or reset with an effect keyed on the id and application id.

7. **Medium · bug/data integrity** · quick-import/page.tsx:1255-1262. Import does two requests and is not atomic. If `assign-job` fails (job closed meanwhile, `APPLICATION_NO_PIPELINE`, network), the candidate already exists as `approved` with no application. The UI returns to Review, and a retry fails on unique email (BUSINESS_LOGIC.md:107). That orphan matches neither tab (In Review needs `pending`, In Pipeline needs an approved application; see Issue 17), so it disappears from the main UI. Fix: a single backend endpoint that creates and assigns in a transaction, or on retry detect the created id and call only assign-job.

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


## Area B1 — Jobs, clients, settings, tags, team

52 open of 55 originally reported. IDs are unchanged, so `[B1-n]` references still match.

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


## Area B2 — Auth, dashboard, calendar, emails, hired, talent pool, ineligible, home

36 open of 42 originally reported. IDs are unchanged, so `[B2-n]` references still match.

1. **High / bug: email attachments cannot work at all.** `uploadAttachment` POSTs `/ats/emails/attachments` (`store/slices/emails.store.ts:246-249`, called from `compose-email-sheet.tsx:207`), but the backend email router has no such route (`backend/src/features/emails/email.routes.ts:46-67`). The request fails, and the user sees "Failed to upload X". Even if an upload worked, `sendEmailSchema` has no `attachments` key (`email.routes.ts:19-39`) and `validate()` replaces `req.body` with the parsed data (`backend/src/shared/validators/common.validator.ts:36-46`), so zod strips `attachments` and forwarded attachments (`compose-email-sheet.tsx:158`, `:274`) are silently dropped. **Fix:** add a multipart upload route (Cloudinary/S3) and `attachments` to the schema and service, or hide the Attach button.

5. **High / bug: editing an interview can silently move it.** The edit form is pre-filled with the date and time in the **interview's** timezone (`event-sheet.tsx:719-720`), but on save the wall clock is converted to UTC in the **company** timezone (`:662-666`, `timezone = settings.companyTimezone`, `:547`). Whenever `event.timezone` differs from the company timezone, opening Edit and saving unchanged shifts the interview by the zone offset, and notifications go out. **Fix:** convert back using `event.timezone` (and let the dialog choose a timezone).

6. **Medium / bug-UX: the calendar detail sheet shows stale data after actions.** The page keeps a snapshot `selectedEvent` (`calendar/page.tsx:20,60-64`). The store replaces the item after Complete, No Show, Cancel or Feedback (`interviews.store.ts:299-354`), but the sheet keeps rendering the old object. The status badge stays "Scheduled", the action buttons stay visible, and new feedback does not appear, which invites duplicate actions. `onMutate` is not called for these actions either (`event-sheet.tsx:161-219`). **Fix:** store `selectedEventId` and read it from the store.

7. **Medium / business-logic: interview feedback can only be given before the interview is completed.** The Feedback button lives inside `event.status === 'scheduled'` (`event-sheet.tsx:428-441`). Once "Mark as Complete" is clicked, there is no way to add feedback. **Fix:** allow feedback for completed interviews, and restrict it to assigned interviewers.

8. **Medium / UX: destructive interview actions have no confirmation.** Cancel Interview runs DELETE immediately and emails notifications (`event-sheet.tsx:460-467`, `:210-219`). No Show and Complete are also one click. **Fix:** add a confirm dialog for Cancel.

9. **Medium / permissions: no frontend permission gating anywhere in scope.** There are no `usePermission` calls in any scope file. Dashboard, calendar, emails, hired and talent-pool have no route guard (`router.tsx:75,88-89,98,144-145`). Interviewers (candidates.read only, `backend/src/features/users/user.service.ts:118-124`) see Assign / Talent-pool / Email buttons that 403. Users without `dashboard.read` (interviewer, CRM-only roles) are sent to `/ats/dashboard` after login (`login/page.tsx:26`), from Unauthorized (`unauthorized/page.tsx:34`) and from Error (`error.tsx:19`). The dashboard's list fetches then reject together and the page renders empty (inferred). **Fix:** add per-route `RoleGuard`/permission guards, hide actions by permission, and pick a landing page based on permissions.

11. **Medium / inconsistency: the dashboard funnel mixes units and its "conversion" badges are wrong.** The stage counts are candidate-based (`dash-funnel.tsx:46-75`), but "hire rate" = `kpi.hiredCount / kpi.totalApplications` is application-based (`:86-89`), even though the file's own comment says to avoid mixing units (`:70-71`). The conversion badge compares adjacent tiles (`:140-147`): "In Pipeline ÷ Pending" is not a conversion, because approved candidates are not a subset of the currently pending ones, so it can exceed 100%. The `pipelineIds` fallback has a redundant third branch (`:62-67`). **Fix:** define the funnel from cumulative stage reach, and compute the hire rate from the same unit.

12. **Medium / security: inbound email HTML is rendered with remote content.** `<iframe srcDoc={email.bodyHtml} sandbox="allow-same-origin">` (`email-detail-sheet.tsx:357-362`, `emails/[id]/page.tsx:185-190`). Scripts are blocked, but remote images, CSS and tracking pixels load, which leaks read receipts and IPs to senders. Links cannot open, because there is no `allow-popups` and no `target` rewrite. The fixed `min-h-64` / `min-h-48` heights clip or inner-scroll long emails. **Fix:** sanitize (DOMPurify) and proxy or block remote images, add `allow-popups allow-popups-to-escape-sandbox` with `<base target="_blank">`, and auto-size the frame.

13. **Medium / bug: templates lose their HTML and unresolved placeholders get sent.** Template selection uses only `bodyText` (`compose-email-sheet.tsx:180,231`); `bodyHtml` from the selection is ignored, and the body is always sent as `<pre>` plain text (`:267`). For bulk sends there are no variables, so `{{candidateName}}` etc. are sent literally, and nothing checks for leftover `{{...}}` (`:234-281`). **Fix:** support HTML templates (the rich text editor exists in components), or warn on unresolved placeholders.

14. **Medium / UX: Reply on an outbound email replies to yourself.** Reply sets `To = mode.email.from` (`compose-email-sheet.tsx:135`). For an outbound email `from` is the system sender, yet Reply is offered for every non-failed email (`email-detail-sheet.tsx:420-430`, `[id]/page.tsx:225-235`). The quoted header prints the raw ISO date (`:140`). **Fix:** for outbound mail, reply to `to`, and format the date.

15. **Medium / dead code-perf: the talent pool's post-assign refetch is a no-op.** `await fetchApps({ limit: 9999 })` (`talent-pool-table.tsx:701`) carries no explicit filter, so `applications.store.fetch` returns early after boot (`applications.store.ts:91-99`). Compare hired-table, which uses `fetchAppsScoped` (`hired-table.tsx:285`). **Fix:** use `fetchScopedMerge`, or remove the call.

17. **Medium / duplication: interview and email presentation maps are copy-pasted** (see section 5): `event-card.tsx:5-13`, `agenda-view.tsx:16-38`, `event-sheet.tsx:60-89`; `emails-list.tsx:46-79`, `email-detail-sheet.tsx:38-82`, `[id]/page.tsx:26-35` (the last lacks delayed/bounced/complained and falls back to the "sent" style, `:118`); and `formatFileSize` 3 times. This violates `ats/CLAUDE.md` (DRY).

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


## Area C — Infrastructure (router, stores, socket, lib, hooks, shared components, config)

44 open of 50 originally reported. IDs are unchanged, so `[C-n]` references still match.

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

41. **Low · type-safety · user.types.ts / users.store.ts:119-128.** `invitedBy` is built on the client and sent to `POST /shared/users`. If the backend trusts it, the "invited by" name in invite emails can be spoofed by any user with `team.write` (inferred; backend not verified here). **Fix:** derive the inviter server-side from `req.user`.

42. **Low · inconsistency · application.types.ts.** `aiScore.recommendation` is typed `string`, while the candidate's is `AiFitRecommendation`. `ActivityResourceType` has 16 values vs 19 in BUSINESS_LOGIC.md:557. **Fix:** share the enums.

43. **Low · bug · disposition-reasons.store.ts.** The query string is built by hand, so `stageName` is not URL-encoded and an undefined stage leaves a trailing `?`. **Fix:** pass params to `getJson`.

44. **Low · ambiguity · timezones.ts:36 and :115.** "BST" labels both Dhaka (Bangladesh Standard Time) and London (British Summer Time). **Fix:** use offset-based labels.

45. **Low · inconsistency · lib/tags.ts:49-50.** `useMemo` deps list `cacheKey` but the closure reads `cache`. This violates exhaustive-deps and is fragile. **Fix:** depend on `cache`.

46. **Low · UX/theming · index.css:93-96.** `--success`, `--warning` and their `-bg` variants have no `.dark` override (audit UX-48, still open). `--text-secondary` and `--text-muted` are also not redefined for dark mode.

47. **Low · a11y · components/ui/textarea.tsx.** It is always `text-sm` (14px), so iOS Safari zooms on focus. **Fix:** use `text-base md:text-sm` as Input does upstream.

---

_Read-only review; no code, config or repository was changed by the audit._
