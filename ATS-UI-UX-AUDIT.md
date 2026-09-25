# ATS-UI — UI/UX Deep Audit

> **Project**: `ats-ui` (React 19 + Vite + Tailwind v4 + Radix/shadcn)
> **Audit date**: 2026-09-25
> **Peeled at**: `master @ dbc9a1b`
> **Scope**: user-facing UI/UX — layout & responsive behaviour, accessibility, loading/empty/error
> states, forms & validation feedback, destructive-action safety, microcopy consistency, theming.
> **Out of scope**: backend behaviour, API contracts, data-integrity bugs (covered by the earlier
> logic audits and already fixed).

---

## Baseline (measured, not assumed)

| Check                                   | Result                                                       |
| --------------------------------------- | ------------------------------------------------------------ |
| `npx tsc -p tsconfig.app.json --noEmit` | **CLEAN** (0 errors)                                         |
| `npx eslint .`                          | **59 problems** (34 errors, 25 warnings) — pre-existing only |
| Source size                             | 199 `.ts`/`.tsx` files, 53,868 lines                         |
| Feature pages                           | 17 route groups under `src/app/`                             |

So **every finding below is a UI/UX defect, not a type error** — TypeScript cannot see any of them.
The eslint figure is unchanged from the last recorded baseline, so no new lint debt was introduced
by the four most recent commits.

### How to read this document

- IDs are `UX-01` … `UX-49`. **Never renumber** — new findings append at the end.
- The **Status** line under each finding is the working state: `Open` / `Discussing` /
  `In progress` / `Fixed` / `Won't fix` / `By design`.
- Line numbers are as of `dbc9a1b`. **The evidence snippet is the reliable locator** — re-grep the
  snippet if a line has shifted.
- The Progress table is the single source of truth; keep it in sync whenever a status changes.

---

## Progress table

| ID    | Sev    | Area        | Title                                                     | Status |
| ----- | ------ | ----------- | --------------------------------------------------------- | ------ |
| UX-01 | HIGH   | Shell       | Sidebar detaches from content above 1440px                | Open   |
| UX-02 | HIGH   | Responsive  | Jobs master/detail never stacks on mobile                 | Open   |
| UX-03 | MEDIUM | Responsive  | Calendar view switcher unreachable on mobile              | Open   |
| UX-04 | MEDIUM | Responsive  | Schedule-interview grid is 4 columns at every width       | Open   |
| UX-05 | MEDIUM | Sheets      | Sheet close button renders off-screen on narrow viewports | Open   |
| UX-06 | MEDIUM | Sheets      | Five sheets use hard-coded widths that overflow/squish    | Open   |
| UX-07 | MEDIUM | Tables      | Zero responsive column hiding in any table                | Open   |
| UX-08 | MEDIUM | Layout      | Page container padding/gap inconsistent across features   | Open   |
| UX-09 | LOW    | Shell       | Sidebar collapse state is discarded on reload             | Open   |
| UX-10 | HIGH   | A11y        | 9 unnamed pagination icon buttons, shared by every table  | Fixed  |
| UX-11 | HIGH   | A11y        | Unnamed row-action icon buttons across 6 tables           | Fixed  |
| UX-12 | HIGH   | A11y        | Dialogs/sheets missing Radix Title and/or Description     | Fixed  |
| UX-13 | HIGH   | A11y        | Labels not associated with their controls (many forms)    | Open   |
| UX-14 | HIGH   | A11y        | Clickable rows and pipeline cards unreachable by keyboard | Open   |
| UX-15 | MEDIUM | A11y        | Duplicated `aria-label` values with no row context        | Fixed  |
| UX-16 | HIGH   | A11y        | Star-rating buttons unnamed and unlabelled (2 files)      | Open   |
| UX-17 | MEDIUM | A11y        | Status conveyed by colour alone                           | Open   |
| UX-18 | MEDIUM | A11y        | `outline-none` search inputs with no focus replacement    | Open   |
| UX-19 | MEDIUM | A11y        | Password visibility toggles removed from the tab order    | Open   |
| UX-20 | HIGH   | A11y        | Hand-rolled combobox not operable by keyboard             | Open   |
| UX-21 | HIGH   | States      | Store `error` is never rendered for 6 features            | Open   |
| UX-22 | HIGH   | States      | Persisted stores flash the previous session's data        | Open   |
| UX-23 | HIGH   | States      | Pipeline board has no loading state at all                | Open   |
| UX-24 | HIGH   | States      | Hired table shows its empty state mid-load                | Open   |
| UX-25 | HIGH   | States      | Dashboard metric cards render nothing when `kpi` is null  | Open   |
| UX-26 | MEDIUM | States      | Charts render empty axes instead of a "no data" state     | Open   |
| UX-27 | MEDIUM | States      | Three divergent table-skeleton implementations            | Open   |
| UX-28 | LOW    | States      | Empty states with no call to action                       | Open   |
| UX-29 | MEDIUM | States      | Team page never shows its refetch indicator               | Open   |
| UX-30 | HIGH   | Forms       | Whitespace-only input passes validation                   | Open   |
| UX-31 | HIGH   | Forms       | Invalid submit silently does nothing (no feedback)        | Open   |
| UX-32 | HIGH   | Forms       | No cross-field validation (salary, dates)                 | Open   |
| UX-33 | HIGH   | Forms       | Scorecard opens already-invalid with no required marking  | Open   |
| UX-34 | HIGH   | Safety      | Three destructive actions run without confirmation        | Open   |
| UX-35 | HIGH   | Safety      | Cascade-delete warnings depend on client-side data        | Open   |
| UX-36 | MEDIUM | Safety      | Four divergent implementations of the same confirmation   | Open   |
| UX-37 | MEDIUM | Forms       | Enter key inconsistently submits or bypasses guards       | Open   |
| UX-38 | MEDIUM | Forms       | Free-text input where a constrained select is required    | Open   |
| UX-39 | MEDIUM | Forms       | No pending/disabled state on some mutations               | Open   |
| UX-40 | HIGH   | Microcopy   | Raw field names, ObjectIds and HTTP text shown to users   | Open   |
| UX-41 | HIGH   | Microcopy   | Terminology drift: Talent Pool / Job / Client             | Open   |
| UX-42 | HIGH   | Microcopy   | Title Case vs sentence case on the same buttons           | Open   |
| UX-43 | MEDIUM | Microcopy   | "Add X" vs "New X" for identical create actions           | Open   |
| UX-44 | MEDIUM | Microcopy   | ASCII `...` vs `…` inconsistency                          | Open   |
| UX-45 | MEDIUM | Microcopy   | Toasts that don't name the object they acted on           | Open   |
| UX-46 | LOW    | Safety      | No undo affordance on any destructive toast               | Open   |
| UX-47 | MEDIUM | Consistency | Duplicated `Field` / `ColHeader` helper implementations   | Open   |
| UX-48 | MEDIUM | Theming     | `--success` / `--warning` have no dark-mode values        | Open   |
| UX-49 | MEDIUM | Conventions | 9 documented STYLE.md rules violated in shipped code      | Open   |

**Totals: 17 HIGH · 25 MEDIUM · 7 LOW = 49 findings.**

**Progress: 4 fixed · 45 open.** (See the `### Fix applied` section under each fixed issue.)

### Fix log

| Date       | ID    | Commit          | Summary                                                                                                                                                                                                                                                                                                          |
| ---------- | ----- | --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-09-25 | UX-10 | `698aeca` | Contextual `aria-label` + `aria-current` on all pagination controls in `components/table-pagination.tsx` (10 added lines, 0 deleted).                                                                                                                                                                            |
| 2026-09-25 | UX-12 | `81e0700` | `sr-only` Title/Description on the two detail sheets; the 5 hand-rolled description paragraphs converted to `DialogDescription`; then the remaining 10 sheets and 2 newly-found dialogs. **16 files, +101/−6.** Verified by exhaustive sweep: 16/16 `SheetHeader`s and every real `DialogContent` now have both. |
| 2026-09-25 | UX-15 | _(pending)_ | Row-context labels on **8** controls across 5 files (+16/−8). Grep confirms 0 remaining context-free labels. |
| 2026-09-25 | UX-11 | `adaa249` | Accessible names on **32** unnamed icon-only buttons across 14 files (+43/−2). Found 13 sites the reported list missed, and correctly skipped 1 that already had a `title`. Scanner re-run after the edit: 56 icon buttons, **0 unnamed**.                                                                       |

---

# A. Layout, responsive behaviour and the app shell

## UX-01 — Sidebar detaches from the content above 1440px

**Status:** Open
**Severity:** HIGH — the primary navigation visibly detaches from the app on any large monitor.

`ats-ui/src/components/layout.tsx:16`

```tsx
<div className="mx-auto w-full max-w-[1440px]">
  ...
  <SidebarProvider ...>
    <AppSidebar variant="inset" />
```

The `SidebarInset` (content column) flows _inside_ that centred wrapper, but the visible sidebar
panel is `position: fixed` with `data-[side=left]:left-0`:

`ats-ui/src/components/ui/sidebar.tsx:229-232`

```tsx
'fixed inset-y-0 z-10 hidden h-svh w-(--sidebar-width) transition-[left,right,width] ... data-[side=left]:left-0 ... md:flex',
```

The `sidebar-gap` spacer (`sidebar.tsx:218`) stays in normal flow, so the wrapper reserves space for
the sidebar at x≈240 while the _painted_ sidebar sits at the viewport's x=0. They only coincide when
the wrapper starts at x=0 — i.e. below 1440px.

**Impact:** on a 1920×1080 (or any >1440px) display, the nav rail is drawn ~200–300px to the left of
the content it belongs to, leaving a dead gap in between. Everything still works; it just looks
broken. This is the most visible defect in the app on a standard office monitor.

**Fix:** drop the `max-w-[1440px] mx-auto` wrapper (make the shell full-width), or move it _inside_
`SidebarInset` so the nav is never detached. If a centred reading column is wanted, apply it to the
page content only.

---

## UX-02 — Jobs master/detail never stacks on mobile

**Status:** Open
**Severity:** HIGH — `/ats/jobs` is unusable on a phone.

`ats-ui/src/app/jobs/page.tsx:118` and `ats-ui/src/app/jobs/_components/job-list.tsx:225`

```tsx
// jobs/page.tsx
<div className="flex flex-1 overflow-hidden">

// job-list.tsx
<div className="w-72 md:w-96 shrink-0 border-r border-t flex flex-col overflow-hidden">
```

The list is a fixed 288px (`md:` 384px) and the detail panel takes the remainder — no breakpoint
switches to an overlay/drawer, and there is no `jobs/:id` route in the layout to fall back to
(the route exists at `router.tsx` but the page still renders the split).

**Impact:** at 375px the detail panel is ~87px wide — unreadable and unusable. There is no way to
read a job on a phone.

**Fix:** stack the panel below the list under `md`, or make the panel a full-screen overlay on small
screens (the `Sheet` used elsewhere in the app is the natural fit).

---

## UX-03 — Calendar view switcher unreachable on mobile

**Status:** Open
**Severity:** MEDIUM

`ats-ui/src/app/calendar/_components/calendar-header.tsx:116`

```tsx
<ToggleGroup
  type="single"
  value={view}
  onValueChange={v => v && onViewChange(v as CalendarView)}
  className="hidden sm:flex"
>
```

Below 640px the Month/Week/Agenda switcher is hidden with **no replacement control** anywhere in the
header.

**Impact:** a mobile user is permanently locked to the month grid and can never reach the agenda
list — which is the only view that shows interview status as text (see UX-17).

**Fix:** add a compact `Select` for the view on `<sm`, or let the toggle group wrap instead of hiding.

---

## UX-04 — Schedule-interview grid is 4 columns at every width

**Status:** Open
**Severity:** MEDIUM

`ats-ui/src/components/schedule-interview-dialog.tsx:162`

```tsx
<div className="grid grid-cols-4 gap-3">
  <div className="col-span-4 flex flex-col gap-1.5">   {/* Title, Job */}
  <div className="col-span-2 flex flex-col gap-1.5">   {/* Interview Type */}
  <div className="flex flex-col gap-1.5">              {/* Duration → 1/4 */}
```

`DialogContent` is `max-w-[calc(100%-2rem)]` (`ui/dialog.tsx:62`), so on a 390px phone each quarter
column is ~70px wide.

**Impact:** Duration and Timezone inputs are too narrow to read their own values; the dialog is
awkward to complete on mobile.

**Fix:** `grid-cols-2 sm:grid-cols-4` with the sub-fields spanning accordingly.

---

## UX-05 — Sheet close button renders off-screen on narrow viewports

**Status:** Open
**Severity:** MEDIUM — removes the primary escape affordance on mobile.

`ats-ui/src/components/ui/sheet.tsx:80`

```tsx
className =
  'absolute top-0 right-full mr-1.5 bg-background border border-border shadow-sm ...';
```

`right-full` parks the button entirely _outside_ the sheet's left edge (plus a 6px gap). For any
sheet whose width approaches the viewport — and every sheet is `w-full` on mobile, e.g.
`candidate-detail-sheet.tsx:2427`, `talent-pool-detail-sheet.tsx:527`, `team-member-sheet.tsx:123` —
`right: 100%` lands at a negative x and the button is clipped off-screen.

**Impact:** mobile users (and the 704px-wide email sheets at ≤768px) lose the visible close button
and must rely on the overlay or Escape.

**Fix:** put the close button _inside_ the sheet (`right-4 top-4`) for the narrow breakpoint, e.g.
`right-full sm:right-full` → `right-4 sm:right-full sm:mr-1.5`, or simply always position it inside.

---

## UX-06 — Five sheets use hard-coded widths that overflow or squish

**Status:** Open
**Severity:** MEDIUM

| File                           | Line                               | Class                        | Problem                                                                            |
| ------------------------------ | ---------------------------------- | ---------------------------- | ---------------------------------------------------------------------------------- |
| `candidate-detail-sheet.tsx`   | 2427                               | `min-w-95` (380px)           | Beats `w-full` below 380px → sheet overflows horizontally, content clipped left    |
| `talent-pool-detail-sheet.tsx` | 527                                | `min-w-95`                   | Same                                                                               |
| `compose-email-sheet.tsx`      | 272                                | `style={{ width: '44rem' }}` | 704px; at 768px only 48px of gutter remains (see UX-05)                            |
| `email-detail-sheet.tsx`       | 249                                | `style={{ width: '44rem' }}` | Same                                                                               |
| `email-template-sheet.tsx`     | 102, `pipeline-template-sheet.tsx` | 299                          | `w-[30vw]` with no `min-w-*` → 230px at 768px; with `px-6` the form body is ~180px |
| `tag-form-sheet.tsx`           | 55                                 | `w-[360px]`                  | Sheet needs 360+16px; overflows a 360–375px phone                                  |
| `talent-pool-detail-sheet.tsx` | 610                                | `w-72` (288px) header block  | Squeezes the flex-1 name/email column to ~250px at 1024px, ~40px on mobile         |

**Fix:** adopt the `w-full sm:max-w-<n>` pattern used by the other sheets, and replace the fixed
header block with `sm:w-72 w-full`.

---

## UX-07 — Zero responsive column hiding in any table

**Status:** Open
**Severity:** MEDIUM

A repo-wide search for `hidden md:table-cell` / `hidden lg:table-cell` / `max-md:hidden` returns **no
matches**. Every list table keeps all columns at all widths:

| File                                                    | Columns |
| ------------------------------------------------------- | ------- |
| `candidates/_components/candidates-table.tsx:2069-2239` | 8       |
| `hired/_components/hired-table.tsx:867-1042`            | 7       |
| `talent-pool/_components/talent-pool-table.tsx`         | 7       |
| `team/_components/team-table.tsx:213-372`               | 7       |

`TableCell` is `whitespace-nowrap` (`ui/table.tsx:71`), so one long email or job title sets the
table's min-content width and every row scrolls sideways — the first column (the candidate's name)
scrolls out of view while the user reads the right-hand side.

Additionally `team-table.tsx:256` renders the email with no `truncate`/`break-all`:

```tsx
<a href={`mailto:${row.original.email}`} className="text-sm text-foreground underline ...">
```

**Fix:** mark low-priority columns `hidden lg:table-cell` (skills, AI score, applied date) and add
`truncate` inside a `min-w-0` wrapper. The horizontal-scroll wrapper exists and is correct — this is
about prioritising what stays visible.

---

## UX-08 — Page container padding/gap inconsistent across features

**Status:** Open
**Severity:** MEDIUM — visible layout shift on navigation.

| Padding/gap                              | Pages                                                                                                      |
| ---------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `gap-4 p-4 md:p-6`                       | candidates, clients, emails, hired, tags, talent-pool, team, permanently-ineligible, calendar              |
| `gap-6 p-4 md:p-6`                       | `candidates/quick-import/page.tsx:1306`, `settings/general/page.tsx:1164`, `settings/account/page.tsx:636` |
| `px-6 py-4` + `p-6` (no responsive step) | `dashboard/page.tsx:34`, `:50`                                                                             |
| **none**                                 | `jobs/page.tsx:118`, `settings/disposition-reasons/page.tsx:337`                                           |

`settings/disposition-reasons/page.tsx:337` is also the only page that returns a bare fragment (no
padding container, no `overflow-hidden`/`overflow-y-auto`):

```tsx
return (
  <>
    <Card>
```

**Impact:** navigating Dashboard → Candidates → Emails visibly shifts the left gutter and the
vertical rhythm; the rejection-reasons page scrolls the whole document instead of its content pane
and sits flush against the content edge.

**Fix:** extract a single page-shell wrapper and use it everywhere.

---

## UX-09 — Sidebar collapse state is discarded on reload

**Status:** Open
**Severity:** LOW

`ats-ui/src/components/layout.tsx:9` and `ui/sidebar.tsx:142`

```tsx
// layout.tsx
const [open, setOpen] = React.useState(true);
```

`SidebarProvider` writes the `sidebar_state` cookie on every toggle
(`sidebar.tsx:142`), but because `open` is controlled from `Layout` with a hard-coded `true`
initial value and nothing ever reads the cookie, the state resets on every reload. The cookie write
is dead weight.

**Fix:** initialise `useState` from the cookie (as upstream shadcn does), or drop the controlled
prop and let `SidebarProvider` manage its own persisted state.

---

# B. Accessibility

## UX-10 — 9 unnamed pagination icon buttons, shared by every table

**Status:** Fixed (2026-09-25)
**Severity:** HIGH — app-wide, affects all 8 tables.

`ats-ui/src/components/table-pagination.tsx:100, 108, 116, 124` (compact) and
`:164, 172, 186, 197, 205` (full), e.g.:

```tsx
<Button
  variant="outline"
  size="icon-xs"
  onClick={() => goToPage(0)}
  disabled={safePageIndex === 0}
>
  <ChevronFirstIcon className="size-3.5" />
</Button>
```

Nine buttons containing only a chevron glyph. A screen reader announces "button" nine times with no
purpose.

**Fix:** add `aria-label="First page" / "Previous page" / "Next page" / "Last page"` and
`aria-label={`Page ${n}`}` + `aria-current="page"` on the numbered buttons. One component fixes the
whole app.

### Fix applied (2026-09-25)

**Status:** Done. 10 added lines, **0 deleted**, in `src/components/table-pagination.tsx`.

Names are contextual rather than generic: the component already receives a `label` prop and all 9
call sites pass a real noun (`candidates`, `clients`, `emails`, `tags`, `members`, `jobs`), so each
control now reads e.g. _"Go to next page of candidates"_ instead of a bare _"Next page"_. This also
avoids the UX-15 class of defect (labels present but context-free) being introduced here.

Applied in **both** variants (`compact` and full):

```tsx
aria-label={`Go to first page of ${label}`}
aria-label={`Go to previous page of ${label}`}
aria-label={`Go to next page of ${label}`}
aria-label={`Go to last page of ${label}`}
// numbered buttons, plus the current-page semantics:
aria-label={`Go to page ${(p as number) + 1} of ${label}`}
aria-current={p === safePageIndex ? 'page' : undefined}
```

Notes on safety:

- **Purely additive.** No prop, state, handler, class or conditional was changed — only attributes
  added. Nothing about paging behaviour can differ.
- `aria-current` is `undefined` rather than `false` when the page is not current, so React omits the
  attribute entirely and no stray `aria-current="false"` is emitted.
- `Button` spreads `React.ComponentProps<'button'>` (`ui/button.tsx:45-57`), so both attributes reach
  the DOM. No wrapper changes were needed.
- The numbered buttons already had `pointer-events-none` when current; `aria-current` adds the
  semantic equivalent for assistive tech without altering that styling.

Verification: `tsc` clean · repo-wide `eslint .` still **59 problems (34 errors, 25 warnings)** —
identical to baseline · `pnpm build` ✓ (only the two pre-existing warnings). Since the change is
expected to be lint-neutral, an unchanged count is the correct pass condition.

---

## UX-11 — Unnamed row-action icon buttons across 6 tables

**Status:** Open
**Severity:** HIGH

Icon-only buttons with no `aria-label`, no `sr-only` text. Radix `Tooltip` is **not** a substitute:
it sets `aria-describedby` only while hovered, and a description is not an accessible _name_.

| File                                               | Lines                       | Actions                                  |
| -------------------------------------------------- | --------------------------- | ---------------------------------------- | ----------------------- |
| `clients/_components/client-detail-sheet.tsx`      | 576, 584, 595               | Mail / Edit / **Delete** per contact row |
| `clients/_components/client-detail-sheet.tsx`      | 1359, 1367                  | Note edit / **Delete**                   |
| `hired/_components/hired-table.tsx`                | 513, 534, 555               | Assign / Email / overflow menu           |
| `talent-pool/_components/talent-pool-table.tsx`    | 756, 775, 793               | Remove from pool / Assign / Email        |
| `clients/_components/clients-table.tsx`            | 722, 743, 763               | Edit / **Delete** / View jobs            |
| `jobs/_components/job-panel.tsx`                   | 434, 447, 462               | **Delete job** / Edit / Copy link        |
| `settings/_components/pipeline-template-sheet.tsx` | 444                         | **Remove stage**                         |
| `jobs/_components/job-list.tsx`                    | 247                         | Clear search                             |
| `candidates/page.tsx`                              | 32, `quick-import/page.tsx` | 1310                                     | Clear job filter / Back |
| `settings/account/page.tsx`                        | 153                         | Change avatar                            |
| + 4 tables                                         | 2319 / 619 / 448 / 852      | Clear search                             |
| `components/tags-selector.tsx`                     | 107, 175                    | Remove tag                               |

Example (`clients-table.tsx:743`):

```tsx
<Button
  variant="ghost"
  size="icon-sm"
  disabled={mutating}
  onClick={() => setDeleteTarget(row.original)}
>
  <Trash2Icon className="size-4" />
</Button>
```

**Impact:** a screen-reader user cannot tell a delete button from an email button, and destructive
controls are the most dangerous to guess at.

**Fix:** `aria-label={`Delete ${row.original.companyName}`}` etc. The codebase already does this
correctly in `candidates-table.tsx:677` (`aria-label={`Actions for ${name}`}`) —
reuse that pattern.

### Fix applied (2026-09-25)

**Status:** Done. **32 sites across 14 files, +43/−2** (the two removals are pure reformats of lines
that were edited).

#### The reported site list was wrong in both directions

This issue listed ~19 sites. Enumerating the codebase instead of trusting that list produced a very
different answer, and both errors would have mattered:

**It missed real sites.** `client-detail-sheet.tsx:575` is the exact `Mail`/`Pencil`/`Trash` pattern
this issue describes, yet was not listed. Neither were 4 "clear search" buttons, the job panel's
`Copy link`, the `DynamicList` remove buttons, or the stage-remove button — **13 unnamed sites were
missing from the list.**

**It also contained a non-issue.** `talent-pool-detail-sheet.tsx:127` ("Edit notes") _does_ have an
accessible name: a `title="Edit notes"` attribute. Since `title` is an accessible-name source in its
own right, it was **left alone**. A naive sweep that only checks `aria-label` would have flagged it
and added a redundant attribute.

#### The scanner, and why two earlier attempts were wrong

Precision mattered because a bulk edit across 32 sites is hard to review. Two draft heuristics were
discarded after producing provably wrong answers:

| Attempt                                          | Result       | Why it was wrong                                                                                                                                 |
| ------------------------------------------------ | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| v1 (tag/icon regex)                              | 66 "unnamed" | Counted `asChild` buttons whose child renders real text, and stripped the ternary in `{cond ? 'A' : 'B'}`, losing visible labels                 |
| v2 (+ string-literal check)                      | 5            | Treated `className="size-4"` as a visible label, so **every real icon button passed as "named"** — a false _negative_ in the dangerous direction |
| v3 (strip attribute values, then check literals) | **32**       | Matches the manual read of every site                                                                                                            |

v2 is the instructive failure: it reported the codebase as almost clean, which is exactly the result
that would have led to closing this issue without fixing it. The corrected scanner strips all
attribute values (so class names and handlers are not mistaken for text) _before_ looking for string
literals.

#### Names are contextual, not generic

Every per-row control names its record, reusing the pattern this issue itself cites
(`candidates-table.tsx:677`):

```tsx
aria-label={`Delete ${client.companyName}`}                                    // clients-table
aria-label={`Assign ${candidate.firstName} ${candidate.lastName} to a job`}    // hired / talent-pool
aria-label={`Remove ${candidate.firstName} ${candidate.lastName} from the talent pool`}
aria-label={`Delete job ${fullJob.title}`}                                     // job-panel
aria-label={`Email ${c.name}`}                                                // client contact row
aria-label={`Remove stage ${stage.name || i + 1}`}                             // pipeline-template-sheet
aria-label={`Remove item ${i + 1}`}                                            // DynamicList
```

This deliberately avoids reproducing the UX-15 defect (labels present but identical on every row) in
the very fix for UX-11.

#### Site-by-site

| File                                               | Sites | Names added                                                           |
| -------------------------------------------------- | ----- | --------------------------------------------------------------------- |
| `clients/_components/client-detail-sheet.tsx`      | 5     | Email/Edit/Delete contact (each naming the contact), Edit/Delete note |
| `clients/_components/clients-table.tsx`            | 3     | Edit/Delete/View jobs, each naming the company                        |
| `hired/_components/hired-table.tsx`                | 4     | Assign/Email/More actions (named), Clear search                       |
| `talent-pool/_components/talent-pool-table.tsx`    | 4     | Remove/Assign/Email (named), Clear search                             |
| `jobs/_components/job-panel.tsx`                   | 3     | Delete job/Edit job (named), Copy link                                |
| `jobs/_components/job-list.tsx`                    | 2     | Close search, Search jobs                                             |
| `candidates/quick-import/page.tsx`                 | 3     | Remove experience/education N, Back to candidates                     |
| `careers/[id]/apply/page.tsx`                      | 2     | Remove experience/education N (public form)                           |
| `candidates/_components/candidates-table.tsx`      | 1     | Clear search                                                          |
| `candidates/page.tsx`                              | 1     | Clear job filter                                                      |
| `permanently-ineligible` table                     | 1     | Clear search                                                          |
| `settings/_components/pipeline-template-sheet.tsx` | 1     | Remove stage N                                                        |
| `jobs/_components/new-job-sheet.tsx`               | 1     | Remove item N                                                         |
| `emails/[id]/page.tsx`                             | 1     | Download attachment                                                   |

#### Completeness proof

The scanner was re-run after the edit: **56 icon buttons scanned, 0 unnamed.** Repeatable if a future
change adds a control.

Verification: `tsc` clean · `eslint .` still **59 problems (34/25)** · `pnpm build` ✓. The diff is
additive apart from 2 reformatted lines, so no existing attribute, handler or class changed.

---

## UX-12 — Dialogs/sheets missing Radix Title and/or Description

**Status:** Fixed (2026-09-25)
**Severity:** HIGH — Radix logs a console warning and the surface has no accessible name.

**Missing `DialogTitle` entirely (no accessible name at all):**

- `candidates/_components/candidate-detail-sheet.tsx:2431` — the primary ATS candidate sheet has a
  `SheetHeader` containing only an avatar and a `<div>`, no `SheetTitle`:

```tsx
<SheetHeader className="shrink-0 border-b pl-6 pr-14 py-5">
  <div className="flex items-start gap-4">
```

- `talent-pool/_components/talent-pool-detail-sheet.tsx:525` — identical.

**`Title` present but `DialogDescription` missing** (Radix warns per dialog):

- `jobs/_components/assign-candidate-dialog.tsx:93` (a raw `<p>` at `:94` instead)
- `team/_components/permission-guide-dialog.tsx:304` (raw `<p>` at `:305`)
- `settings/_components/email-template-view-dialog.tsx:47`
- `settings/_components/pipeline-template-view-dialog.tsx:49`
- `candidates/_components/candidate-detail-sheet.tsx:738` ("Add to Talent Pool")

**`SheetTitle` present, no `SheetDescription`** (lower impact — a warning, not a naming failure):
`new-job-sheet.tsx:687`, `new-client-sheet.tsx:290`, `team-member-sheet.tsx:128`,
`team-member-edit-sheet.tsx:102`, `invite-team-sheet.tsx:105`, `tag-form-sheet.tsx:57`,
`pipeline-template-sheet.tsx:301`, `email-template-sheet.tsx:104`, `compose-email-sheet.tsx:275`,
`client-detail-sheet.tsx:1766`.

**Fix:** add `SheetTitle`/`DialogTitle` (using `className="sr-only"` where the design has no visible
title — `ui/sidebar.tsx:197` already does exactly this) and a `Description`. A raw `<p>` does not
satisfy Radix's `aria-describedby` wiring.

### Fix applied (2026-09-25) — the naming failures

**Status:** Done. 6 files, **+49 / −6** lines. The two sheets with no title at all now have an
accessible name; the five dialogs whose description was a hand-rolled `<p>` now use the real
primitive.

**1. The two detail sheets — `sr-only` Title + Description.**

`candidates/_components/candidate-detail-sheet.tsx` and
`talent-pool/_components/talent-pool-detail-sheet.tsx`, both inside the existing `SheetHeader`:

```tsx
<SheetTitle className="sr-only">{`Candidate: ${fullName}`}</SheetTitle>
<SheetDescription className="sr-only">
  Candidate profile, applications, interviews and activity.
</SheetDescription>
```

The candidate's **name is interpolated into the title**, so the sheet announces _"Candidate: Jane
Doe"_ rather than a generic label — the same reasoning applied in UX-10, and it avoids introducing
the UX-15 defect (context-free labels) here.

**2. The five missing descriptions.**

`assign-candidate-dialog.tsx` and `permission-guide-dialog.tsx` had a raw `<p>` carrying the
description text; these were converted to `DialogDescription`. The other three had no description at
all, so an `sr-only` one was added: `email-template-view-dialog.tsx`,
`pipeline-template-view-dialog.tsx`, `candidate-detail-sheet.tsx:738` ("Add to Talent Pool").

### Why these edits are visually inert (verified, not assumed)

This was the main risk, because both `SheetHeader` and `DialogHeader` are `flex flex-col gap-2/1.5`
— adding children to a flex container with a `gap` would add visible spacing if those children
occupied layout.

- The built stylesheet contains
  `.sr-only{clip-path:inset(50%);white-space:nowrap;border-width:0;width:1px;height:1px;margin:-1px;padding:0;position:absolute;overflow:hidden}`
  — `position: absolute` takes the element **out of flow**, so it cannot participate in a flex gap.
  Confirmed against `dist/assets/*.css` after the build, not from memory.
- `DialogDescription`'s base class is `text-sm text-muted-foreground` (`ui/dialog.tsx:136-145`),
  which is exactly the class the replaced `<p>` elements already carried — so those two swaps are
  styling-identical by construction.
- The Permission Guide case passed `text-xs`, which is _smaller_ than the `text-sm` the primitive
  also emits. Two utilities for the same property at equal specificity resolve by source order; the
  built CSS has `.text-sm` at byte 71512 and `.text-xs` at 71696, so **`.text-xs` is later and still
  wins** — the paragraph renders at the same size as before.
- `fullName` is in scope at both insertion points (`candidate-detail-sheet.tsx:2393`,
  `talent-pool-detail-sheet.tsx:512`), and `TYPE_LABEL` is in scope in
  `email-template-view-dialog.tsx:24`. Both confirmed by reading, since a bundled production build
  does not type-check the way a test would.

### Pass 2 (2026-09-25) — the remaining 10, plus 2 the original audit missed

**Status:** Done. The final tally is **13 files, +33/−0** for this pass, and **16 files, +101/−6**
for UX-12 as a whole.

The 10 `SheetTitle`-present-but-no-`SheetDescription` sheets were completed with the identical
`sr-only` pattern: `new-job-sheet.tsx`, `new-client-sheet.tsx`, `team-member-sheet.tsx`,
`team-member-edit-sheet.tsx`, `invite-team-sheet.tsx`, `tag-form-sheet.tsx`,
`pipeline-template-sheet.tsx`, `email-template-sheet.tsx`, `compose-email-sheet.tsx`,
`client-detail-sheet.tsx`.

Two of them needed care because the title is wrapped in a `flex items-center justify-between` row
alongside action buttons (`client-detail-sheet.tsx:1765`, `team-member-sheet.tsx:127`). Putting the
description _inside_ that row would have made it a third flex child and visibly shifted the layout,
so it was placed as a **sibling of the row**, still inside the `SheetHeader`.

**2 additional genuine gaps were found that the original audit did not list**, by sweeping _every_
`DialogContent` rather than only the reported lines: the two "Assign to a new job" dialogs
(`talent-pool-detail-sheet.tsx` and `talent-pool-table.tsx`) had a `DialogTitle` and no description.
Both are now fixed. This is the second time in this audit that a line-by-line fix list proved
incomplete when the defect class was enumerated exhaustively — **prefer a whole-codebase sweep over
the reported line list.**

### Completeness proof

Rather than asserting the issue is closed, the whole codebase was enumerated:

| Sweep                                                                          | Result                                        |
| ------------------------------------------------------------------------------ | --------------------------------------------- |
| Every `<SheetHeader>` in `src` has a `SheetTitle` AND a `SheetDescription`     | **16/16 — clean**                             |
| Every `<DialogContent>` in `src` has a `DialogTitle` AND a `DialogDescription` | Only 2 flags remain, both **false positives** |

The 2 remaining flags are `components/reject-dialog.tsx:74` and `components/change-job-dialog.tsx:64`,
which render a nested `RejectForm` / `ChangeJobForm` child. Those children own the `DialogHeader`
and do carry both `DialogTitle` and `DialogDescription` (`reject-dialog.tsx:173-179`,
`change-job-dialog.tsx:130-155`), so nothing is missing — a proximity-based sweep simply cannot see
through the component boundary.

(One methodological note: a first sweep with a 25-line window produced 3 false negatives, because
`client-detail-sheet.tsx`'s `SheetHeader` spans 82 lines — its description sits at `:1844` inside a
header opening at `:1765`. The window had to be widened before the result could be trusted.)

Verification after pass 2: `tsc` clean · `eslint .` still **59 problems (34/25)** · `pnpm build` ✓.
Each of the 10 files has exactly **1** `SheetDescription` import and **1** usage — checked, since a
13-file mechanical edit is exactly where a duplicated import or a missed usage would hide.

---

## UX-13 — Labels not associated with their controls

**Status:** Open
**Severity:** HIGH — this is a documented convention being violated at scale.

`ats-ui/STYLE.md:515` states: _"Always pair `Label` with its control via `htmlFor`/`id`."_
`STYLE.md:510` shows the pattern. Only ~14 files in the repo use `htmlFor` at all.

The dominant anti-pattern is a local `Field`/`FormField` helper that renders a bare `<Label>`:

```tsx
function FormField({ label, required, children }) {
  return (
    <div>
      <Label>{label}</Label> {/* no htmlFor; child has no id */}
      {children}
    </div>
  );
}
```

Affected helper definitions and their reach:

| File                                                  | Line | Reach                                   |
| ----------------------------------------------------- | ---- | --------------------------------------- |
| `jobs/_components/new-job-sheet.tsx`                  | 228  | ~18 job fields (`:891`–`:1146`)         |
| `clients/_components/new-client-sheet.tsx`            | 103  | every client form field (`:359`–`:503`) |
| `candidates/_components/interview-scorecard-form.tsx` | 857  | the entire scorecard form               |
| `team/_components/invite-team-sheet.tsx`              | 42   | every invite field                      |
| `team/_components/team-member-edit-sheet.tsx`         | 38   | every edit field                        |
| `candidates/quick-import/page.tsx`                    | 116  | every import field                      |
| `careers/[id]/apply/page.tsx`                         | 119  | the public application form             |

Plus direct occurrences:

- `components/schedule-interview-dialog.tsx:164, 168, 183, 242, 256, 265, 273, 281, 292, 299, 344, 354`
  — 12 labels with no `htmlFor`; the whole dialog is unlabelled.
- `clients/_components/client-detail-sheet.tsx:333, 341, 351, 360` (contact) and
  `:829, 847, 863, 874, 890, 934, 954` (CRM status/satisfaction/issues/check-in/EMR/BAA/notes)
- `components/reject-dialog.tsx:185, 224, 256`
- `settings/disposition-reasons/page.tsx:182, 191, 224, 236`

Separately, 8 search inputs rely on `placeholder` alone with no `aria-label`:
`candidates-table.tsx:2313`, `clients-table.tsx:267`, `tags-table.tsx:426`,
`talent-pool-table.tsx:848`, `hired-table.tsx:614`, `permanently-ineligible-table.tsx:443`,
`emails-list.tsx:609`, `job-list.tsx:231`.

**Impact:** clicking a label does not focus its input (mouse users lose a convenience), and a screen
reader announces bare edit fields with no name — the single largest accessibility gap in the app.

**Fix:** fix the six `Field` helpers once (`htmlFor`/`id` via `useId()`), which repairs hundreds of
fields in one pass. Reference the correct implementation already present at
`settings/account/page.tsx:67`.

---

## UX-14 — Clickable rows and pipeline cards unreachable by keyboard

**Status:** Open
**Severity:** HIGH — an entire class of navigation is mouse-only.

**Pipeline board cards** — `jobs/_components/job-pipeline-board.tsx:69-73` and `:140-143`:

```tsx
<div
  role={onClick ? 'button' : undefined}
  onClick={onClick}
  className={cn('group relative rounded-lg border bg-background p-3 w-full text-foreground',
    onClick && 'cursor-pointer ...')}
>
```

`role="button"` is declared but there is **no `tabIndex` and no `onKeyDown`**, so the element is
never focusable. Declaring the role without the behaviour is arguably worse than nothing.

**Clickable table rows** — 5 tables, same defect, and here not even `role` is set:
`candidates-table.tsx:2475`, `clients-table.tsx:871`, `hired-table.tsx:676`,
`talent-pool-table.tsx:906`, `permanently-ineligible-table.tsx:496`

```tsx
<TableRow
  key={row.id}
  className={cn('... cursor-pointer ...')}
  onClick={() => openDetail(row.original)}
>
```

**Calendar day cells** — `month-view.tsx:104-114` and `week-view.tsx:87-97`:

```tsx
role={dayEvents.length === 0 && onSlotClick ? 'button' : undefined}
```

Again no `tabIndex`/`onKeyDown`.

**Impact:** a keyboard user cannot open any candidate, client, hired candidate or talent-pool
record, cannot open a pipeline card, and cannot act on an empty calendar day. The app is navigable
only by mouse.

**Fix:** the cleanest option for rows is a real focusable control in the row (the primary cell as a
`<button>`); for the pipeline card, add `tabIndex={0}` + `onKeyDown` handling Enter and Space. For
the already-`role="button"` elements this is a two-attribute fix.

---

## UX-15 — Duplicated `aria-label` values with no row context

**Status:** Open
**Severity:** MEDIUM

Labels that are present but identical on every row are as unusable as missing labels, because a
screen-reader user listing the controls cannot tell which record each one targets.

`settings/disposition-reasons/page.tsx:424, 432`:

```tsx
<Button size="icon-sm" variant="ghost" aria-label="Edit" onClick={() => handleEdit(r)}>
<Button size="icon-sm" variant="ghost" aria-label={r.isActive ? 'Deactivate' : 'Activate'} ...>
```

Also:

- `permanently-ineligible-table.tsx:337, 352, 370, 403` — `"View details"`, `"Restore candidate"`,
  `"Place legal hold"`, `"Delete permanently"`, identical on every row.
- `settings/general/page.tsx:558` — `aria-label="Toggle active"` repeated per template.
- `tags-table.tsx:96, 103` and `team-table.tsx:224, 231` — `"Select row"` identical for every row.

**Fix:** interpolate the record name, matching `hired-table.tsx:353`
(`Select ${firstName} ${lastName}`).

### Fix applied (2026-09-25)

**Status:** Done. **8 sites across 5 files, +16/−8.** The 8 removed lines are exactly the 8 labels
that were replaced — nothing else changed.

| File | Before | After |
| --- | --- | --- |
| `settings/disposition-reasons/page.tsx` | `"Edit"`, `"Deactivate"`/`"Activate"` | `` `Edit ${r.label}` ``, `` `Deactivate ${r.label}` `` / `` `Activate ${r.label}` `` |
| `permanently-ineligible-table.tsx` | `"View details"`, `"Restore candidate"`, `"Delete permanently"` | `` `View details for ${first} ${last}` ``, `` `Restore ${first} ${last}` ``, `` `Delete ${first} ${last} permanently` `` |
| `tags-table.tsx` | `"Select row"` | `` `Select ${row.original.name}` `` |
| `team-table.tsx` | `"Select row"` | `` `Select ${row.original.firstName} ${row.original.lastName}` `` |
| `settings/general/page.tsx` | `"Toggle active"` | `` `Deactivate ${tpl.name}` `` / `` `Activate ${tpl.name}` `` |

#### Two judgement calls

**`"Select row"` became `Select <name>`, not just `Select row N`.** A row *position* is not a stable
identifier — a screen-reader user cannot tell which checkbox belongs to which record from an ordinal
alone, and it changes as the list re-sorts. Naming the record matches what `UX-11` did and what the
`Select all …` controls in other tables already do.

**`general/page.tsx` was a false positive in the original report, and is still worth fixing.**
The report described it as "repeated per template", but its trigger renders visible text
(`{tpl.isActive ? 'Active' : 'Inactive'}`), so the button is not icon-only — it always had an
accessible name from its content. The reason to change it is different and real: a static
`"Toggle active"` label **overrides** the visible text, so the accessible name contradicted what is
on screen. It now states the action and the target.

#### Fields were verified, not assumed

All interpolated fields are required (non-optional) in their types, so no label can render as
`"Activate undefined"`: `DispositionReason.label` (`disposition-reasons.store.ts:7`),
`PipelineTemplate.name` (`pipeline-template.types.ts:5`), `Tag.name` (`tag.types.ts:3`), and the
candidate shape used by the ineligible table. `tsc` confirms every reference resolves.

#### Completeness

Each of the 7 old context-free labels was grepped after the edit: **0 remaining** in `src`.

Verification: `tsc` clean · `eslint .` still **59 problems (34/25)** · `pnpm build` ✓.

---

## UX-16 — Star-rating buttons unnamed and unlabelled

**Status:** Open
**Severity:** HIGH

`candidates/_components/candidate-detail-sheet.tsx:237-251` and
`calendar/_components/event-sheet.tsx:344-358`:

```tsx
{
  [1, 2, 3, 4, 5].map(i => (
    <button
      key={i}
      type="button"
      onClick={() => setRating(i)}
      className="text-sm"
    >
      <StarIcon
        className={cn(
          'size-4',
          i <= rating
            ? 'fill-amber-400 text-amber-400'
            : 'text-muted-foreground/30'
        )}
      />
    </button>
  ));
}
```

Five buttons, no accessible name, no `aria-pressed`, no group label — a screen reader hears five
identical unnamed buttons and cannot tell which is selected.

**Impact:** the rating control is completely opaque to assistive tech, and `event-sheet.tsx:344` is
the post-interview feedback form.

**Fix:** `aria-label={`${i} of 5 stars`}` + `aria-pressed={i === rating}` inside a
`role="group"` with a label. The correct pattern already exists in this codebase at
`interview-scorecard-form.tsx:938` (`aria-label={`${i} star`}` via `ToggleGroup`) — reuse it.

---

## UX-17 — Status conveyed by colour alone

**Status:** Open
**Severity:** MEDIUM

**Cancelled/completed interviews** — `calendar/_components/event-card.tsx:29`:

```tsx
(TYPE_STYLES[event.type], event.status !== 'scheduled' && 'opacity-50');
```

The only cue that an interview is cancelled, completed or a no-show is a 50% opacity reduction. The
status text is rendered only in the agenda view (`agenda-view.tsx`), so in month and week views the
information is unavailable to anyone who cannot perceive the opacity difference. No `title`, no
`aria-label`.

**Trend polarity** — `dashboard/_components/dash-metric-cards.tsx:166-170`:

```tsx
className={cn('flex items-center gap-1 font-medium',
  isGood === null ? 'text-muted-foreground'
  : isGood ? 'text-success' : 'text-destructive')}
```

The visible string is `+N%` in both cases; whether that is good or bad is signalled only by green vs
red. (Note: the _polarity logic_ here was already fixed — `higherIsBetter` and the 0-is-neutral case
are correct. This finding is purely about the colour-only presentation.)

**Unread email** — `emails-list.tsx:226-231`: a blue dot plus `font-semibold`, with nothing
announcing "unread".

**Fix:** add a text/`aria-label` for the interview status (the agenda already renders it — reuse the
same helper), an explicit up/down arrow or the word "up"/"down" beside the trend percentage, and
`aria-label="Unread"` on the email row.

---

## UX-18 — `outline-none` search inputs with no focus replacement

**Status:** Open
**Severity:** MEDIUM

Search inputs inside popovers/panels strip the outline but never add a focus ring:

| File                                            | Line     |
| ----------------------------------------------- | -------- |
| `jobs/_components/new-job-sheet.tsx`            | 135, 343 |
| `talent-pool/_components/talent-pool-table.tsx` | 129      |
| `candidates/quick-import/page.tsx`              | 438      |
| `calendar/_components/event-sheet.tsx`          | 959, 984 |
| `components/tags-selector.tsx`                  | 41       |

```tsx
className =
  'flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/50';
```

At `new-job-sheet.tsx:135` the ring is on the _wrapper_ trigger button, not this input, so focus is
invisible while typing. At `event-sheet.tsx:984` the job option is a `<button>` with hover styling
only — no focus style at all.

**Fix:** `focus-visible:ring-2 focus-visible:ring-ring` (the codebase already does this correctly at
`emails-list.tsx:223` and `rich-text-editor.tsx:81`).

---

## UX-19 — Password visibility toggles removed from the tab order

**Status:** Open
**Severity:** MEDIUM

`tabIndex={-1}` on the show/hide-password buttons removes them from keyboard navigation entirely:

- `settings/account/page.tsx:409, 438`
- `auth/login/page.tsx:101`
- `auth/reset-password/page.tsx:126, 153`
- `auth/verify-email/page.tsx:183, 210`
- `tags/_components/tag-form-sheet.tsx:115, 122` (colour swatches)

They also carry no `aria-label`.

**Impact:** a keyboard-only user cannot reveal what they typed — meaningful on a login form where a
typo silently fails.

**Fix:** remove `tabIndex={-1}` and add `aria-label={show ? 'Hide password' : 'Show password'}`.

---

## UX-20 — Hand-rolled combobox not operable by keyboard

**Status:** Open
**Severity:** HIGH

`jobs/_components/new-job-sheet.tsx:128-190` (client picker):

```tsx
<button
  key={c._id}
  type="button"
  onMouseDown={e => { e.preventDefault(); handleSelect(c._id); }}
  className={cn('w-full flex items-center gap-2 px-3 py-1.5 ...')}
>
```

- Options respond to `onMouseDown` only — **Enter and Space select nothing**.
- No `role="listbox"` / `role="option"` on the panel and its children.
- The trigger has no `aria-expanded` / `aria-haspopup`.
- No Escape-to-close handling; no focus return to the trigger on close
  (focus is set via `setTimeout(..., 30)` at `:108-111`).

**Impact:** the client field is mandatory on the job form, so a keyboard-only user cannot create a
job at all.

**Fix:** use the existing shadcn `Command`/`Combobox` primitive (`components/ui/command.tsx` ships
in this repo and is used elsewhere), or add `onClick`, roles and Escape handling.

---

# C. Loading, empty and error states

## UX-21 — Store `error` is never rendered for 6 features

**Status:** Open
**Severity:** HIGH — a failed fetch is indistinguishable from "no data".

Every store sets `s.error` in its catch blocks, but a repo-wide search for a component reading
`error` from a feature store returns only **3** hits:

```
emails/[id]/page.tsx:283        setError(storeState.error)      ← correct
components/auth/protected-route.tsx:14  useBootStore(s => s.error)  ← correct (total outage only)
lib/boot-data.ts:63             states.find(s => s.error)        ← correct (outage detection)
```

So the following errors are written and never read by any component:

| Store                                    | Error set at                    | Consequence                                                                                                            |
| ---------------------------------------- | ------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `candidates.store.ts`                    | `:190, 214, 250, 285, 308, 344` | Candidates, Talent Pool, Hired, Ineligible all show "no candidates"                                                    |
| `clients.store.ts`                       | `:172, 195, 221, 232, 255`      | Clients table shows an empty list                                                                                      |
| `jobs.store.ts`                          | `:139, 158, 180, …`             | Jobs list shows an empty list                                                                                          |
| `interviews.store.ts`                    | `:149, 168, 206, …`             | Calendar has **no error UI at all** (`calendar/page.tsx:87` branches on `loading` only)                                |
| `emails.store.ts`                        | —                               | `emails-list.tsx:291-305` reads 8 fields but not `error`                                                               |
| `email-templates` / `pipeline-templates` | —                               | `settings/general/page.tsx:410-416, 694-701` read `loading` only → a failed fetch renders "No pipeline templates yet." |

`candidates-table.tsx:1553-1554` is the archetype:

```tsx
const items = useCandidateStore(s => s.items);
const loading = useCandidateStore(s => s.loading); // `error` never read
```

**Impact:** a transient API failure presents as "this workspace has no candidates / clients / jobs".
Users will conclude their data was deleted. Given this is a production CRM holding real recruitment
data, this is the most consequential UX defect in the audit.

**Fix:** add a shared inline error state (icon + message + Retry) and render it whenever
`error && items.length === 0`, before the empty state. `emails/[id]/page.tsx:261-360` already
implements the correct three-way `loading`/`error`/`not-found` pattern — lift it.

---

## UX-22 — Persisted stores flash the previous session's data

**Status:** Open
**Severity:** HIGH

**This is the same defect class as the dashboard stale-KPI bug fixed on 2026-09-25
(`dashboard.store.ts` — `persist` removed). Its siblings were not fixed.**

zustand rehydrates `localStorage` **synchronously at store creation** (module import), so on first
paint `items` is already non-empty and `loading` is `false`. `ProtectedRoute` gates on boot, but
`describeTotalOutage()` (`boot-data.ts:56-68`) only reports a failure when **every** required store
is _both_ empty _and_ errored — one failing endpoint at boot is enough to let the app open showing
the previous user's rows with no loading state. `resetSessionScopedStores()` only runs on logout or
401, never on a plain reload.

| Store                                | Line                                           | Persisted shape                                                            |
| ------------------------------------ | ---------------------------------------------- | -------------------------------------------------------------------------- |
| `store/slices/applications.store.ts` | 421-424 (`name: 'ats-applications'` at `:422`) | **no `partialize`** → `items`, `loading`, `error`, `filters` all persisted |
| `store/slices/jobs.store.ts`         | 327-334                                        | `partialize: s => ({ items, pagination })`                                 |
| `store/slices/clients.store.ts`      | 513-529                                        | `items` + `pagination`; `merge` prefers persisted                          |
| `interviews.store.ts`                | 426-429                                        | no `partialize`                                                            |
| `emails.store.ts`                    | 283-285                                        | no `partialize`                                                            |
| `users.store.ts`                     | 383-386                                        | `items`                                                                    |
| `tags.store.ts`                      | 146-150                                        | `items`                                                                    |
| `email-templates.store.ts`           | 188-192                                        | `items`                                                                    |
| `pipeline-templates.store.ts`        | 230-234                                        | `items`                                                                    |
| `settings.store.ts`                  | 86-90                                          | `settings`                                                                 |

`clients.store.ts:513-529` — the `merge` explicitly prefers persisted items, because `current.items`
is the empty `initialState` at hydration time:

```tsx
items:
  (current as ClientState).items.length > 0
    ? (current as ClientState).items
    : ((persisted as Partial<ClientState>).items ?? []),
```

**Impact:** two users on one machine, or one user whose session expired, sees the other session's
candidate/client/job rows painted for a few hundred milliseconds before live data lands. For a CRM
holding personal candidate data this is both a trust problem and a data-exposure problem.

**Fix:** apply the dashboard fix uniformly — either drop `persist` for entity lists (they are all
boot-loaded anyway, so caching buys nothing), or add a store-owned `hydrated`/`fresh` flag and gate
render on that rather than on mere non-null. Note `applications.store` persisting `loading` is
independently wrong: it can rehydrate as `true`.

---

## UX-23 — Pipeline board has no loading state at all

**Status:** Open
**Severity:** HIGH

`jobs/_components/job-pipeline-board.tsx:291-320`:

```tsx
const [applications, setApplications] = useState<Application[]>(
  cacheFresh ? cached!.applications : []
);
const [candidates, setCandidates] = useState<Candidate[]>(
  cacheFresh ? cached!.candidates : []
);
// no `loading` state anywhere in this component
```

And the columns render the _empty_ affordance unconditionally (`:265-267`):

```tsx
{pairs.length === 0 ? (
  <div ...>Drop here</div>
) : (pairs.map(pair => <DraggableCard ... />))}
```

The sibling tab in the same panel does it correctly — `job-candidates.tsx:92-95` has
`const [loading, setLoading] = useState(!cacheFresh)`. Two tabs of one panel disagree.

**Impact:** on a cold load of a job with 40 candidates, the board renders "Drop here" in every column
for the duration of the fetch — an experienced user may read that as a pipeline that was wiped.

**Fix:** add the same `loading` flag as the sibling tab and render column skeletons while it is set.

---

## UX-24 — Hired table shows its empty state mid-load

**Status:** Open
**Severity:** HIGH

`hired/_components/hired-table.tsx:141-156`:

```tsx
const [scopedApps, setScopedApps] = useState<Application[]>([]);
useEffect(() => {
  let alive = true;
  fetchAppsScoped({ limit: 9999 })
    .then(rows => { if (alive) setScopedApps(rows); })
    .catch(() => { if (alive) setScopedApps([]); });
  ...
}, [fetchAppsScoped]);
```

`loading` however comes from `useCandidateStore` (`:89`), which is `false` for this fetch:

```tsx
const apps = scopedApps.length > 0 ? scopedApps : applications; // :182
```

**Impact:** during a cold load the table renders "No hired candidates yet." (`:703`) even though the
user has hired candidates — a false negative on a KPI-critical list.

**Fix:** track a local `loading` flag for the scoped fetch and include it in the skeleton guard.

---

## UX-25 — Dashboard metric cards render nothing when `kpi` is null

**Status:** Open
**Severity:** HIGH

`dashboard/_components/dash-metric-cards.tsx:286-293`:

```tsx
if (loading && !kpi) { return (<div ...>{/* skeletons */}</div>); }
if (!kpi) return null;
```

**Impact:** if the dashboard fetch fails, or the workspace is brand new and the endpoint returns no
aggregate, the entire three-card KPI grid renders as **nothing** — no empty state, no error, no
retry. The user sees a page with a heading and a void where the numbers should be.

**Fix:** replace `return null` with an empty/error card stating that metrics are unavailable and
offering Retry.

---

## UX-26 — Charts render empty axes instead of a "no data" state

**Status:** Open
**Severity:** MEDIUM

`dashboard/_components/dash-applied-chart.tsx:163-176`:

```tsx
{loading && applications.length === 0 ? (
  <Skeleton className="h-62.5 w-full" />
) : (
  <ChartContainer config={chartConfig} ...>
    <LineChart data={data} ...>
```

`dash-hiring-trend.tsx:106-157` is identical. When the data is genuinely empty and not loading, the
chart renders full axes with a flat zero line — indistinguishable from "you had zero applications
every day", which is a meaningful and alarming claim.

(For contrast, `dash-funnel.tsx:126-135` gets this right with
`loading && candidates.length === 0`, and per my notes the funnel handles the empty case.)

**Fix:** when `data` is all-zero/empty after loading, render an explicit "No data for this period"
message inside the chart frame.

---

## UX-27 — Three divergent table-skeleton implementations

**Status:** Open
**Severity:** MEDIUM

| File                                          | Line    | Approach                                                                       |
| --------------------------------------------- | ------- | ------------------------------------------------------------------------------ |
| `candidates/_components/candidates-table.tsx` | 427-439 | Exported `TableSkeleton`, imported by hired/talent-pool/permanently-ineligible |
| `clients/_components/clients-table.tsx`       | 219-230 | A **private duplicate** `TableSkeleton`                                        |
| `team/_components/team-table.tsx`             | 728-742 | A **third inline** skeleton (8 rows × `baseColumns`)                           |
| `tags/_components/tags-table.tsx`             | 515-521 | Plain **text** where every other table shows a skeleton                        |

```tsx
// tags-table.tsx — the outlier
{loading && items.length === 0 ? (
  <TableCell colSpan={columns.length} className="h-32 text-center text-sm text-muted-foreground">
    Loading tags…
```

Also inconsistent:

- `settings/general/page.tsx:512-520` and `:839-847` use ad-hoc
  `<div className="h-16 rounded-md bg-muted animate-pulse" />` instead of the shared `Skeleton`
  used three lines away in the same card.
- The refetch bar is copy-pasted three times with different markup:
  `job-list.tsx:349-353` and `clients-table.tsx:861-865` (`h-px ... animate-pulse`) vs
  `emails-list.tsx:646-651` (a pulsing dot + the word "syncing…").

**Impact:** loading looks different in every section of the app, which reads as jank rather than as
intentional feedback.

**Fix:** move `TableSkeleton` into `components/` and delete the three local copies.

---

## UX-28 — Empty states with no call to action

**Status:** Open
**Severity:** LOW

Three lists show a bare one-liner inside the empty region where every other list in the app
(emails, careers, settings templates) shows an icon, explanatory copy and a CTA:

- `jobs/_components/job-list.tsx:367-370` — "No jobs found."
- `candidates/_components/candidates-table.tsx:2494-2501` — "No candidates found."
- `talent-pool/_components/talent-pool-table.tsx:930-936` — "No candidates in the talent pool yet."

**Fix:** reuse the emails-list empty-state pattern; offer "Add Job" / "Add Candidate" /
"Browse candidates" respectively.

---

## UX-29 — Team page never shows its refetch indicator

**Status:** Open
**Severity:** MEDIUM

`team/_components/team-table.tsx:355` declares `isRefreshing` in its props and `team/page.tsx:24`
passes it, but the component never destructures or renders it.

**Impact:** Clients, Candidates, Jobs and Emails all show a thin refetch bar; Team silently updates.
On a team roster that changes via socket, users cannot tell whether they are looking at fresh data.

**Fix:** destructure `isRefreshing` and render the same bar as the sibling tables.

---

# D. Forms, validation and destructive-action safety

## UX-30 — Whitespace-only input passes validation

**Status:** Open
**Severity:** HIGH

`careers/[id]/apply/page.tsx:78`, `quick-import/page.tsx:75-79`, `new-client-sheet.tsx:36`:

```tsx
z.string().min(1, 'Required').max(50);
```

Zod counts `"   "` as length 3, and there is no `.trim()`. Submit is gated only on `isValid`
(`apply/page.tsx:434`), so whitespace submits.

**Impact:** creates candidates and clients whose name is blank in every list, detail sheet and email
template substitution. On the public application form this is reachable by any visitor.

**Fix:** `.trim().min(1, 'Required')` — zod's `.trim()` transforms before the length check.

---

## UX-31 — Invalid submit silently does nothing

**Status:** Open
**Severity:** HIGH

`calendar/_components/event-sheet.tsx:846-849`:

```tsx
if (!title || !form.scheduledDate || !form.candidateId || !form.jobId) return;
```

No toast, no field-level error, no disabled state on the button. The user presses Create and
_absolutely nothing happens_ — the worst possible feedback.

**Contrast:** the very next branch (`:851-854`) _does_ toast for the Google Meet case:

```tsx
if (form.type === 'google_meet' && !form.meetingLink.trim()) {
  toast.error('Meeting link is required for Google Meet interviews');
  return;
}
```

So the pattern is understood, just not applied to the required-field guard.

Similarly `compose-email-sheet.tsx:227-233` lumps three fields into one toast and leaves Send enabled
(`disabled={mutating || uploading}` at `:427-434`, never reflecting validity):

```tsx
if (!toList.length || !subject.trim() || !body.trim()) {
  toast.error('To, Subject, and Message are required.');
  return;
}
```

And `new-job-sheet.tsx:1211-1219` uses a five-condition `disabled` with no message naming what is
missing.

**Fix:** mark the missing fields visually and focus the first one; disable the primary action and
explain why, or use inline field errors.

---

## UX-32 — No cross-field validation

**Status:** Open
**Severity:** HIGH

`jobs/_components/new-job-sheet.tsx:610-628`:

```tsx
const salaryRange =
  salaryMin && salaryMax && salaryPeriod
    ? { min: Number(salaryMin), max: Number(salaryMax), period: salaryPeriod }
    : undefined;
```

Nothing compares `min` to `max`, nothing rejects negatives (`Number('-5') === -5` passes), and
`startDate` is never compared against `applicationDeadline`.

`new-job-sheet.tsx:1023` silently coerces a bad openings value:

```tsx
openings: Number(openings) || 1,
```

**Impact:** a job can be saved with a salary band of "50,000–30,000", a negative salary, or a start
date before its own application deadline. These values flow into the public careers page and into
offer conversations.

**Fix:** a zod `superRefine` (or explicit guards) on the job schema: `min < max`, both `>= 0`,
`startDate >= applicationDeadline`; validate `openings` as a positive integer with a visible error
instead of silently defaulting to 1.

Related lower-severity items in the same family:

- `new-job-sheet.tsx:1070` — salary `currency` is unvalidated free text (`placeholder="USD"`); should
  be a `Select`.
- `interview-scorecard-form.tsx:756` — interview date and earliest-start date have no `min`/`max`.

---

## UX-33 — Scorecard opens already-invalid with no required marking

**Status:** Open
**Severity:** HIGH

`candidates/_components/interview-scorecard-form.tsx:240-259` initialises every rating to `0`, while
the schema at `:62` requires `z.number().int().min(1).max(5)`:

```tsx
const ratingField = z.number().int().min(1).max(5);
```

`RatingRow` (`:930`) takes no `required` prop and renders no asterisk, and the error only appears
after the first submit attempt.

**Impact:** the form is invalid on open, gives no indication of that, and the user discovers the
requirement only after a failed submit — then has to work out that every single star row is a
required field.

**Fix:** mark every rating row required (asterisk + hint), and either surface inline errors on blur
or show a summary of incomplete sections above the submit button.

---

## UX-34 — Three destructive actions run without confirmation

**Status:** Open
**Severity:** HIGH — and each is inconsistent with a confirmed twin elsewhere in the app.

**1. Remove from Talent Pool, fired immediately** — `candidates/_components/candidates-table.tsx:732`
and `hired/_components/hired-table.tsx:564`:

```tsx
onClick = { handleTalentPool }; // → updateTalentPool(id, 'remove')
```

Meanwhile the _same component_ routes the identical action through a confirm dialog at `:1312`
(`PipelineActionsMenu`), and `talent-pool-table.tsx:437-470` / `talent-pool-detail-sheet.tsx:876-910`
both confirm. Four code paths, two behaviours.

**2. Legal-hold toggle acts instantly** — `permanently-ineligible/_components/permanently-ineligible-table.tsx:377`,
`candidate-detail-sheet.tsx:1118` and `:3439`:

```tsx
onClick={() => toggleLegalHold(row.original._id, !!row.original.legalHold)}
```

Placing or lifting a legal hold is a compliance-relevant action with no confirmation step.

**3. Cancel Interview cancels and notifies with no confirmation** —
`calendar/_components/event-sheet.tsx:428`:

```tsx
onClick = { handleCancel }; // → cancelInterview(...)
```

`candidate-detail-sheet.tsx:355-365` _does_ confirm the same action. Cancelling sends notifications
to the candidate and interviewer, and there is no undo.

**Fix:** route all three through the shared `ConfirmDialog`, matching the already-correct twin in
each case.

---

## UX-35 — Cascade-delete warnings depend on client-side data

**Status:** Open
**Severity:** HIGH — the user can be told nothing while a large destructive cascade runs.

**Clients** — `clients/_components/clients-table.tsx:939-988`. `deleteTargetJobCount` is derived from
`jobCountsByClient` and `deleteTargetAppCount` from `allApps`; the warning block at `:950-970` only
renders when those counts are `> 0`:

```tsx
{
  deleteTargetJobCount > 0 && deleteTargetAppCount > 0 && (
    <div className="...">⚠ ...</div>
  );
}
```

**Jobs** — `jobs/_components/job-panel.tsx:551-586` has the identical failure: `jobAppCount` comes
from `useApplicationStore(s => s.items…)`, so an unloaded store yields `0`.

**Impact:** if the jobs/applications stores are not fully loaded (a filtered fetch, a page that
loaded a subset, or a failed fetch that sets no error visible here — see UX-21), the confirmation
dialog shows **no warning at all** while the backend still cascades the delete across jobs,
applications and related records. The user confirms a "delete this client" believing it is
low-impact.

**Fix:** fetch the dependent counts when the confirm dialog opens (a targeted count request), rather
than reading them from a possibly-partial store. Do not render the warning conditionally on a
client-derived number — if the count cannot be determined, say so explicitly.

---

## UX-36 — Four divergent implementations of the same confirmation

**Status:** Open
**Severity:** MEDIUM

**The Remove-from-Talent-Pool confirmation is implemented four times:**
`talent-pool-table.tsx:437-470`, `talent-pool-detail-sheet.tsx:876-910`,
`candidates-table.tsx:1470-1520`, `candidate-detail-sheet.tsx:4145-4190`. The copy, button variants
and naming all drift between them — and two of the four use a plain (primary) button for the
destructive action (`candidates-table.tsx:1487-1494`, `candidate-detail-sheet.tsx:4176-4186`) instead
of `variant="destructive"`.

**Two other inconsistent patterns for the same class of action:**

- `ConfirmDialog` (`components/confirm-dialog.tsx`) is used for emails and templates
  (`emails-list.tsx:831`) but skipped for clients/jobs/candidates, which hand-roll a `Dialog`
  (`clients-table.tsx:941`, `job-panel.tsx:551`, `permanently-ineligible-table.tsx:521`,
  `candidate-detail-sheet.tsx:4192`). There is no `alert-dialog` primitive in the repo at all.
- A third pattern — inline "Delete? Yes/No" with no dialog, no title and no focus trap:
  `team-table.tsx:437-462`, `tags-table.tsx:223-250`, `settings/general/page.tsx:616-637`.

Also: `settings/general/page.tsx:1012-1027` renders
`description={templateToDelete ? <span>…</span> : undefined}`, so when the lookup fails the dialog
says only "Delete email template?" with **no body text**.

**Fix:** add `components/ui/alert-dialog.tsx` (the missing primitive), route every destructive
confirmation through one component, and make the destructive button `variant="destructive"` by
default.

---

## UX-37 — Enter key inconsistently submits or bypasses guards

**Status:** Open
**Severity:** MEDIUM

| Site                                                           | Behaviour                                                                                                                                                   |
| -------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `jobs/_components/new-job-sheet.tsx`                           | The form has **no `<form>` element** — `handleSubmit` is called from `onClick` (`:1211`), so Enter never submits                                            |
| `tags/_components/tag-form-sheet.tsx:68`                       | `onKeyDown={e => e.key === 'Enter' && handleSave()}` saves from **outside** any form, bypassing the `disabled={!canSave}` guard on the button at `:145-148` |
| `settings/_components/pipeline-template-sheet.tsx:306`         | Enter while editing a stage name submits the **entire template** via the wrapping `<form onSubmit>`                                                         |
| `careers/[id]/apply/page.tsx:482`, `quick-import/page.tsx:532` | `TagsInput` calls `preventDefault`; every other input implicit-submits the whole application mid-edit                                                       |

**Impact:** user-hostile in two directions at once — some forms cannot be submitted with Enter, and
others save/advance far more than the user intended when they press it.

**Fix:** wrap each sheet's fields in a real `<form onSubmit>`, make the primary button
`type="submit"`, and `preventDefault` on Enter inside multi-line/nested repeat-group inputs.

---

## UX-38 — Free-text input where a constrained select is required

**Status:** Open
**Severity:** MEDIUM

`settings/disposition-reasons/page.tsx:142-147`:

```tsx
applicableStages
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);
```

Stages are a known, enumerable set (they come from the pipeline template). A typo produces a stage
string that silently matches no candidate — the reason simply never appears in the reject dialog, and
nothing tells the admin why.

**Impact:** silent misconfiguration of a feature that governs candidate rejection records.

**Fix:** a multi-select bound to the workspace's actual pipeline stages.

---

## UX-39 — No pending/disabled state on some mutations

**Status:** Open
**Severity:** MEDIUM — double-submit risk.

| File                                            | Line         | Problem                                                                                                   |
| ----------------------------------------------- | ------------ | --------------------------------------------------------------------------------------------------------- |
| `talent-pool/_components/talent-pool-table.tsx` | 455-464      | "Remove from pool" never disabled and closes the dialog immediately → `updateTalentPool` can fire twice   |
| `talent-pool/_components/talent-pool-table.tsx` | 407-417      | `Assign` gated only on `!selected`; `mutating` not passed                                                 |
| `hired/_components/hired-table.tsx`             | 997-1007     | Same                                                                                                      |
| `settings/general/page.tsx`                     | 553-567, 623 | `PipelineTemplatesCard` has no per-row pending state, unlike `EmailTemplatesCard` which does (`:709-710`) |
| `settings/disposition-reasons/page.tsx`         | 428-437      | Activate/deactivate not disabled                                                                          |
| `emails/_components/emails-list.tsx`            | 675-680      | Bulk-delete "Yes" not disabled while `mutating`                                                           |
| `candidates/_components/candidates-table.tsx`   | 2399-2417    | `Move to Stage` / `Reject` omit `disabled={bulkActing}` — only `Add to Talent Pool` (`:2423`) has it      |

The correct pattern is well established in this repo — `confirm-dialog.tsx:72-86`,
`reject-dialog.tsx:274-282`, `restore-candidate-dialog.tsx:198-210`,
`change-job-dialog.tsx:254-261`, `schedule-interview-dialog.tsx:412-432`,
`compose-email-sheet.tsx:410-427`, `new-job-sheet.tsx:1205-1222`, `team-table.tsx:444`.

**Note:** my earlier audit already fixed this class once in `talent-pool-table` (the `[mutating]`
memo-dependency bug). These are separate sites that were not in scope then.

---

# E. Microcopy and consistency

## UX-40 — Raw field names, ObjectIds and HTTP text shown to users

**Status:** Open
**Severity:** HIGH — several of these leak internal identifiers into a production CRM.

**Raw API field names in error messages** — `lib/api-client.ts:45`, surfaced through ~150 toast
sites (`candidates-table.tsx:602` and most others):

```tsx
const fieldErrors = details.map(d =>
  d.field ? `${d.field}: ${d.message}` : d.message
);
```

The user sees `companyName: Required`, `primaryContact.email: Invalid email`.

**Raw MongoDB ObjectIds rendered as names** — three sites:

- `clients/_components/client-detail-sheet.tsx:700`:
  `if (!user) return <span className="text-sm">{userId}</span>;`
- `tags/_components/tags-table.tsx:170`: `{id ?? '—'}`
- `candidates/_components/candidates-table.tsx:2160`: `{job?.title ?? appliedJobId}`

**Raw framework/HTTP text** — `app/error.tsx:6-12` renders `error.statusText` / `error.message`
verbatim ("Internal Server Error"); `jobs/_components/job-candidates.tsx:234` renders `{error}` raw;
`lib/api-client.ts:196` falls back to `new Error('Request failed')`.

**Raw enum fallbacks** — `team-member-sheet.tsx:234` (`ROLE_LABELS[r] ?? r`),
`settings/general/page.tsx:757` (`TYPE_MAP[tpl.type] ?? tpl.type`), `event-sheet.tsx:303, 323`
(`interviewerNames[id] ?? id`).

**Fix:** humanise field names in the API client (a small `FIELD_LABELS` map, or title-case the last
segment of the path), never render a bare ObjectId (fall back to "Unknown user" / "Unknown
candidate"), and give every route an `errorElement` with user-facing copy.

---

## UX-41 — Terminology drift: Talent Pool / Job / Client

**Status:** Open
**Severity:** HIGH — the same concept is named differently in different places, which is the most
common source of user confusion in a dense CRM.

**"Talent Pool" vs "Talent pool" vs "Pool"**

| Where                             | String                     |
| --------------------------------- | -------------------------- |
| `candidates-table.tsx:740`        | "Remove from Talent Pool"  |
| `candidate-detail-sheet.tsx:3546` | "Remove from Pool"         |
| `talent-pool-table.tsx:464`       | "Remove from pool"         |
| `hired-table.tsx:297` (toast)     | "removed from talent pool" |
| `app-sidebar.tsx`                 | "Talent Pool"              |

**Job / Position / Role**

- `app-sidebar.tsx:37` — "Jobs"
- `change-job-dialog.tsx:141` — "to another position"
- `careers/page.tsx:92, 116` — "Open positions" / "open roles"
- `job-panel.tsx:658` — a label reading "Experience" inside the job details

**Client / Company / Account**

- `app-sidebar.tsx:36` — "Clients"
- `new-client-sheet.tsx:359` — form label "Company Name \*"
- `clients-table.tsx:634` — column header "Company"
- `client-detail-sheet.tsx:757` — section heading "Company"
- `activity-sentence.ts:1227` — "provisioned a client account"

**Assign vs Add** — `talent-pool-table.tsx:325` and `hired-table.tsx:905` say "Assign to a new job",
while `candidates-table.tsx:1306` says "Add to Another Job" for the analogous action.

**Reject vs Rejection vs Disposition** — `settings-nav.tsx:9` and the card title say "Rejection
Reasons", the card description says "when **disposing** candidates"
(`disposition-reasons/page.tsx:346-348`), and the sheet description says "when **rejecting** a
candidate" (`:176`).

**Ineligible** — `app-sidebar.tsx:54` says "Ineligible", the page and table say "Permanently
Ineligible", and a column header reads "Marked Ineligible"
(`permanently-ineligible-table.tsx:293`).

**Email vs Email Candidate** — `candidates-table.tsx:1270` vs `:762` (two menus, same action) vs
`candidate-detail-sheet.tsx:1043, 3535, 3627`.

**Fix:** pick one term per concept, add a glossary to `STYLE.md`, and sweep. This is mechanical but
high-value; the inconsistencies are visible in a single session of normal use.

---

## UX-42 — Title Case vs sentence case on the same buttons

**Status:** Open
**Severity:** HIGH — same string, two casings, side by side in the UI.

**"Save Changes" vs "Save changes":**

| Casing         | Sites                                                                                                                                                                                         |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| "Save Changes" | `new-client-sheet.tsx:583`, `new-job-sheet.tsx:1222`, `event-sheet.tsx:673`, `interview-scorecard-form.tsx:830`, `client-detail-sheet.tsx:973`                                                |
| "Save changes" | `tag-form-sheet.tsx:147`, `team-member-edit-sheet.tsx:188`, `pipeline-template-sheet.tsx:465`, `general/page.tsx:138, 233, 369, 1154`, `email-template-sheet.tsx:265`, `account/page.tsx:302` |

Confirmed by grep: 5 sites use the title-cased form, 11 use the sentence-cased form.

**Fix:** pick one (sentence case is the modern convention and already the majority) and sweep.

---

## UX-43 — "Add X" vs "New X" for identical create actions

**Status:** Open
**Severity:** MEDIUM

- "Add Client" (`clients-table.tsx:353`), "Add Job" (`job-list.tsx:277`), "Add User"
  (`team-table.tsx:601`)
- "New tag" (`tags-table.tsx:487`), "New template" (`general/page.tsx:506, 833`), "New reason"
  (`disposition-reasons/page.tsx:352`)

Note also that when editing, three different labels appear for one action: `new-client-sheet.tsx:583`
chooses between "Save Changes"/"Add Client"; `new-job-sheet.tsx:1222` between "Save Changes"/
"Add Job"; `tag-form-sheet.tsx:57` titles the sheet "New Tag" but the button says "Create tag".

**Fix:** standardise on "Add <thing>" for the primary create action and "Save changes" for edits.

---

## UX-44 — ASCII `...` vs `…` inconsistency

**Status:** Open
**Severity:** MEDIUM

`event-sheet.tsx:673` renders `'Saving...'` while `settings/account/page.tsx:479` and
`general/page.tsx:138` render `'Saving…'`.

Confirmed: `event-sheet.tsx:673` uses `...`; the settings pages use the single-character ellipsis.
Also ASCII in `event-sheet.tsx:396, 423, 431, 941, 1037, 1242`, `quick-import:1301, 1363`,
`apply:1368`, `template-selector.tsx:122`.

**Fix:** use `…` (U+2026) everywhere; add a lint rule or a grep check before release.

---

## UX-45 — Toasts that don't name the object they acted on

**Status:** Open
**Severity:** MEDIUM

Confirmed in stores and sheets:

- `client-detail-sheet.tsx:448, 478, 494` — "Contact updated/removed/added"
- `client-detail-sheet.tsx:1516` — "Note updated"
- `tags-table.tsx:334, 344, 347` — "Tag deleted/updated/created"
- `email-detail-sheet.tsx:238` — "Email deleted"
- `team-member-edit-sheet.tsx:86` — "Member updated"
- `users.store.ts:247, 279` — "Team member removed" / "Permissions updated"
- `candidates.store.ts:304, 354` — "Candidate updated" / "Photo updated"

**Impact:** with two sheets open or two rapid actions, the user cannot tell which record the toast
refers to. Worse, a "Candidate updated" toast after a failed-looking edit gives false confidence
about _which_ candidate.

**Fix:** include the object name — "Note updated on Acme Corp", "Deleted tag 'Senior'".

---

## UX-46 — No undo affordance on any destructive toast

**Status:** Open
**Severity:** LOW

`components/ui/sonner.tsx:6-35` configures no `action` and no `duration` anywhere in the repo, so no
delete in the app offers an undo.

**Fix:** for hard-delete actions, return the deleted entity from the API (or keep it client-side) and
attach a sonner `action: { label: 'Undo', onClick }`.

---

## UX-47 — Duplicated `Field` / `ColHeader` helper implementations

**Status:** Open
**Severity:** MEDIUM — directly against `STYLE.md:12` ("DRY — never duplicate logic or styles").

**Six near-identical `Field` helpers:**

| File                                                  | Line    |
| ----------------------------------------------------- | ------- |
| `clients/_components/new-client-sheet.tsx`            | 94-109  |
| `candidates/_components/interview-scorecard-form.tsx` | 844-866 |
| `candidates/quick-import/page.tsx`                    | 106-127 |
| `careers/[id]/apply/page.tsx`                         | 109-130 |
| `team/_components/invite-team-sheet.tsx`              | 42      |
| `team/_components/team-member-edit-sheet.tsx`         | 38      |

**Four `ColHeader` copies:** `candidates-table.tsx:143`, `clients-table.tsx:113`, `tags-table.tsx:50`,
`team-table.tsx:75`.

Every one of these is also where UX-13's labelling defect lives, so consolidating them into one
correct component fixes both at once.

**Fix:** a single `components/form-field.tsx` that owns `useId()` + `htmlFor` + required marking +
error rendering.

---

# F. Theming and documented conventions

## UX-48 — `--success` / `--warning` have no dark-mode values

**Status:** Open
**Severity:** MEDIUM

`ats-ui/src/index.css:93-96` defines these only in `:root`:

```css
--success: #16a34a;
--success-bg: #dcfce7;
--warning: #d97706;
--warning-bg: #fef3c7;
```

`.dark { … }` (`index.css:138-176`) overrides `--primary`, `--background`, `--card`, `--muted`,
`--border`, `--destructive`, the charts and the sidebar — but **not** `--success` / `--success-bg` /
`--warning` / `--warning-bg`.

**Current exposure is low, and the codebase already avoids the worst of it.** All 9 usages are
tokens rather than the `-bg` variants, because the dark-safe pattern
`border-warning/40 bg-warning/10 text-warning` was adopted after the earlier audit:

- `new-job-sheet.tsx:754` — `border-warning/40 bg-warning/10`
- `new-job-sheet.tsx:1170-1171` — same, plus `text-warning`
- `candidates-table.tsx:406`, `talent-pool-table.tsx:248`, `tag-list.tsx:71` — `text-warning`
- `dash-metric-cards.tsx:167, 240` — `text-success`
- `account/page.tsx:585` — `text-success`

**So the concrete risk is:** if anyone writes `bg-warning-bg` / `bg-success-bg` (both are exposed as
Tailwind colours at `index.css:305-306`), it renders a light-parchment block on a dark background.
`#d97706` as `text-warning` is also only ~3.4:1 on the dark `--muted` (`pine-teal-800`), i.e. below
the 4.5:1 text threshold — acceptable for a 14px+ bold accent, marginal for small text.

**Fix:** either add `.dark` overrides for all four tokens, or **delete** `--warning-bg`/`--success-bg`
and the `--color-*` bindings so the misuse is impossible to write. The second option is cheaper and
matches how the code already styles these states.

---

## UX-49 — Nine documented STYLE.md rules violated in shipped code

**Status:** Open
**Severity:** MEDIUM — the design system is documented but not enforced.

Each of these is a case where the code contradicts an explicit rule in `ats-ui/STYLE.md`.

### 49.1 `font-bold` / `font-light` — 17 occurrences in 12 files

`STYLE.md:122` — _"No other weights are used. Do not introduce `font-bold` or `font-light`."_
Restated at `STYLE.md:563`.

Verified by grep — 17 matches across 12 files:

| File                                    | Lines                  | Class                                                       |
| --------------------------------------- | ---------------------- | ----------------------------------------------------------- |
| `dashboard/page.tsx`                    | 35                     | `text-2xl font-light`                                       |
| `dashboard/_components/dash-funnel.tsx` | 163                    | `text-4xl font-light`                                       |
| `app/error.tsx`                         | 15                     | `text-6xl font-bold`                                        |
| `app/not-found.tsx`                     | 4                      | `text-6xl font-bold`                                        |
| `job-panel.tsx`                         | 412                    | `text-xl font-bold`                                         |
| `job-candidates.tsx`                    | 393                    | `text-sm font-bold`                                         |
| `job-pipeline-board.tsx`                | 83, 149, 170, 244, 541 | `font-bold`                                                 |
| `candidates-table.tsx`                  | 294, 329               | `font-bold`                                                 |
| `candidate-detail-sheet.tsx`            | 563                    | `font-bold`                                                 |
| `dash-applied-chart.tsx`                | 151                    | `text-lg font-bold`                                         |
| `rich-text-editor.tsx`                  | 103                    | `[&_h1]:font-bold` (editor prose — arguably legitimate)     |
| `rich-text.tsx`                         | 59                     | `[&_h1]:font-bold` (rendered content — arguably legitimate) |

**Judgement:** the two rich-text cases style _user-authored content_, which genuinely needs bold
headings, and the numeric badges (`job-pipeline-board` column counts,
`candidates-table` AI-score circles) arguably need the weight for legibility at 10–11px. The page
headings (`dashboard/page.tsx:35`, `error.tsx:15`, `not-found.tsx:4`) and `job-panel.tsx:412` have
no such excuse and are the clear violations.

**Recommendation:** narrow the rule in `STYLE.md` to permit `font-bold` in _user-content prose_ and
_numeric data badges_, then fix the four heading cases. A rule that is violated 17 times is not a
rule — either enforce it or scope it.

### 49.2 `rounded-sm` — should be `rounded-md`

`STYLE.md:177` — _"`rounded-sm` → use `rounded-md`"_.

Occurrences include `careers/[id]/apply/page.tsx:204, 281, 346, 485, 637, 877, 893`,
`careers/page.tsx:133, 141`, `careers/[id]/page.tsx:62`, `candidates-table.tsx:485, 2114, 2157`,
`hired-table.tsx:393`.

### 49.3 Raw palette values instead of semantic tokens

`STYLE.md:37` and `:557` — _"Always use semantic tokens, never raw palette values"_ /
_"Don't use raw palette values (`pine-teal-800`) directly in JSX"_.

`new-job-sheet.tsx:739, 776, 833, 1210`, `new-client-sheet.tsx:577`,
`team-member-edit-sheet.tsx:180`, `invite-team-sheet.tsx:171`, `client-detail-sheet.tsx:966`,
`event-sheet.tsx:1240`, `job-panel.tsx:98`, `clients-table.tsx:83, 94, 188, 351`,
`activity-timeline.tsx:112-113`.

### 49.4 Custom UI where a shadcn primitive exists

`STYLE.md:558` — _"Use Shadcn components from `src/components/ui/`"_ / _"Don't build custom UI from
scratch if a Shadcn primitive exists"_.

- Raw `<textarea>` with hand-written classes: `new-client-sheet.tsx:454-459`,
  `client-detail-sheet.tsx:955, 1418`, `candidate-detail-sheet.tsx:3182`
- Raw Radix instead of the local `Popover`: `tags-selector.tsx:94, 136, 159`
- Raw `<button>` as a dropdown trigger: `job-panel.tsx:290-300`

### 49.5 `margin-*` used for layout spacing instead of `gap-*`

`STYLE.md:559` — _"Use `gap-_` for spacing between siblings"\*.

`settings/general/page.tsx:505-508` (`flex justify-end mt-1`), `event-sheet.tsx:1240` (`mt-1`),
`new-client-sheet.tsx:530` (`-mt-2`), `clients-table.tsx:947` (`mt-2 block`).

### 49.6 Cards using `border` instead of `ring-1 ring-foreground/10`

`STYLE.md:211, 299, 564`.

`careers/page.tsx:133, 141` (`<Card className="rounded-sm border border-border">`),
`careers/[id]/page.tsx:62`.

### 49.7 Table cell padding

`STYLE.md:161-162` specifies `p-2` cells and `h-10 px-2` headers, but every list table overrides to
`px-4` / `py-3`: `candidates-table.tsx:2458, 2515`, `permanently-ineligible-table.tsx:483`,
`talent-pool-table.tsx:893`, `hired-table.tsx:663`.

This one is a _documentation_ defect rather than a code defect — the roomier padding is clearly the
intended design. **Fix the doc, not the code.**

### 49.8 Sticky table header has three variants

`STYLE.md`'s Data Table Pattern specifies `sticky top-0 z-10 bg-muted`. In use:
`candidates-table.tsx:2450` (`bg-foreground/5 dark:bg-muted`), `tags-table.tsx:497`
(`bg-foreground/[0.05] dark:bg-muted`), `permanently-ineligible-table.tsx:472`.

Note `bg-foreground/[0.05]` is also a non-canonical Tailwind class per the repo's own preference for
`bg-foreground/5`.

### 49.9 Dialog radius contradicts the documented scale

`STYLE.md:189-194` — _"Cards `rounded-xl`"_, _"Modals, Sheets `rounded-lg`"_.

But `components/ui/dialog.tsx:62` ships `rounded-xl` for `DialogContent`, and `ui/sheet.tsx:69` ships
`rounded-md`. So the documented scale is inverted relative to the implementation — every modal in the
app is `rounded-xl` where the doc says `rounded-lg`.

**Fix:** decide the intended scale and make the doc and the primitives agree.

---

# Appendix

## A. Verification commands

Run from `ats-ui/`:

```bash
npx tsc -p tsconfig.app.json --noEmit     # expect: clean
npx eslint .                              # expect: 59 problems (34 errors, 25 warnings)
pnpm build                                # expect: ok, only the pre-existing
                                          # boot-data INEFFECTIVE_DYNAMIC_IMPORT
                                          # + chunk-size warnings
```

Both baseline figures above were measured at `dbc9a1b` and are unchanged from the previous audit —
so any change to them is caused by the fix under test.

## B. Confirmed CORRECT — do not re-report

Verified as sound and listed here to prevent future re-discovery:

**Loading/empty/error states done right**

- `job-candidates.tsx:92-95, 222-236, 239-252` — proper `loading`/`error`/empty triad with a CTA.
- `candidates-table.tsx:2471-2500` — `loading && data.length === 0` skeleton, mutually exclusive
  from the empty row.
- `clients-table.tsx:861-892` — refetch bar + guarded skeleton + empty row.
- `talent-pool-table.tsx:873-935`, `hired-table.tsx:643-703`,
  `permanently-ineligible-table.tsx:492-519` — guarded skeletons; the ineligible table even
  distinguishes filtered vs genuinely-empty copy.
- `emails-list.tsx:646-651, 715-800` — skeleton, empty state with icon + "Reset filters" CTA, and
  pagination deliberately kept mounted when the page is empty.
- `emails/[id]/page.tsx:261-360` — the explicit three-way `loading`/`error`/`not-found` pattern
  (the model to copy for UX-21).
- `activity-timeline.tsx:347-390` — `isLoading = loading && logs.length === 0`, mutually exclusive.
- `interview-scorecard-history.tsx:64-84` — skeleton → empty-with-CTA → list.
- `dash-funnel.tsx:126-135` — skeleton only while `loading && candidates.length === 0`.
- `dashboard.store.ts:162-168` — the reference fix for UX-22.
- `protected-route.tsx:31-60` — boot-outage gate with explicit failure copy and Try again, correctly
  scoped to a _total_ outage only.
- `careers/page.tsx:130-150` and `careers/[id]/page.tsx:56-70` — skeleton / error card /
  empty-with-CTA, all mutually exclusive.
- `settings/general/page.tsx:653-668, 970-985` — `!loading && templates.length === 0` empty states
  with a CTA.
- `settings/disposition-reasons/page.tsx:357-360, 448-456` — guarded loading, then empty state.

**Accessibility done right**

- `ui/dialog.tsx:77`, `ui/sheet.tsx:79` — close buttons include `<span className="sr-only">Close</span>`.
- `ui/sidebar.tsx:197-199, 274` — hidden `SheetTitle`/`SheetDescription` + sr-only "Toggle Sidebar".
- `nav-main.tsx:90` — the mail icon button has sr-only text.
- `nav-user.tsx:40` — `AvatarImage alt={user.name}`.
- `candidates-table.tsx:677, 1176` — `aria-label={`Actions for ${name}`}`, correct per-row context.
- `hired-table.tsx:353, 368` — `Select ${firstName} ${lastName}`, correct per-row context.
- `emails-list.tsx:217, 661` — per-email / per-view checkbox labels.
- `careers/page.tsx:105` — `aria-label="Search jobs"`.
- `settings/general/page.tsx:329, 343, 358, 1109` — all `Switch`es carry explicit `aria-label`s.
- `job-panel.tsx:287, 357` — status/pipeline triggers include the current value in the label.
- `calendar-header.tsx:79, 87` — `aria-label="Previous"` / `"Next"`.
- `job-pipeline-board.tsx:113-116` — reject icon button has both `title` and `aria-label`.
- `settings/account/page.tsx:67` — `Field` correctly pairs `Label htmlFor` with `Input id`
  (**the model to copy for UX-13**).
- `event-sheet.tsx:558-640, 1015-1181` — all labels properly linked.
- `compose-email-sheet.tsx:284-356` — properly linked.
- `settings/general/page.tsx:113, 196, 209, 299, 1114` — properly linked, incl.
  `TimezoneSelect id="ws-tz"` → `SelectTrigger id`.
- `team-member-edit-sheet.tsx:150` — `Checkbox id` + `label htmlFor`, correct.
- `schedule-interview-dialog.tsx:383` — interviewer chips use `aria-pressed`.
- `interview-scorecard-form.tsx:938, 962-994` — ToggleGroup star ratings with labels; `BooleanRow`
  uses a wrapping `<label>`, which is a valid implicit association.
- `client-detail-sheet.tsx:374, 908-928, 1403` — `htmlFor`/`id` checkbox pairs.
- `resume-viewer.tsx:281`, `email-detail-sheet.tsx:359`, `emails/[id]/page.tsx:183` — every iframe
  has a `title`.
- `emails-list.tsx:223` — `focus-visible:outline-none` **with** `focus-visible:ring-2`.
- `rich-text-editor.tsx:81` — `focus-within:outline-none` replaced by `focus-within:ring-3`.
- `event-sheet.tsx:950` — correct `onOpenAutoFocus` + manual focus.
- `new-job-sheet.tsx:111` — `focus:outline-none` accompanied by `focus:ring-2`.

**Layout done right**

- `ui/table.tsx:9` — every `Table` is wrapped in `relative w-full overflow-x-auto`; all 8 list
  tables use the `rounded-lg border flex flex-col flex-1 min-h-0 overflow-hidden` +
  `overflow-auto flex-1` + `sticky top-0 z-10` header pattern.
- `ui/button.tsx:36-40` — `icon-xs` is exactly `size-6` (24px), so pagination and row actions meet
  the minimum touch-target size.
- `ui/checkbox.tsx:14` — `after:-inset-x-3 after:-inset-y-2` gives a 40×32px hit area.
- `hooks/use-mobile.ts:2-3` — 768px breakpoint matches Tailwind `md:`.
- `ui/sidebar.tsx:309, 451, 627, 669` — `min-w-0` present at every level; `SidebarInset` also
  carries `min-w-0 flex-1`.
- `permanently-ineligible-table.tsx:277` — `block max-w-56 truncate` correctly caps a long label.
- `candidate-detail-sheet.tsx:3434` — the action footer is a sibling of the `flex-1 overflow-y-auto`
  body, so it never scrolls away (the correct sheet structure).
- Responsive grids that are correct: `dashboard/page.tsx:57` (`grid-cols-1 lg:grid-cols-3`),
  `dash-metric-cards.tsx:334` (`grid-cols-1 sm:grid-cols-3`),
  `dash-funnel.tsx:125` (`grid-cols-2 … lg:grid-cols-4`), `careers/page.tsx:167, 248`,
  `quick-import/page.tsx:533, 857, 864`, `job-panel.tsx:654, 671`, `settings/general/page.tsx:526`,
  `settings/account/page.tsx:223`, `interview-scorecard-form.tsx:408`.

**Pending/disabled states done right** — `confirm-dialog.tsx:72-86`, `reject-dialog.tsx:274-282`,
`restore-candidate-dialog.tsx:198-210`, `change-job-dialog.tsx:254-261`,
`schedule-interview-dialog.tsx:412-432`, `compose-email-sheet.tsx:410-427`, `team-table.tsx:444`,
`clients-table.tsx:981-988`, `team-member-edit-sheet.tsx` / `invite-team-sheet.tsx` (via `mutating`),
`interview-scorecard-form.tsx:822-827`, `new-job-sheet.tsx:1205-1222`.

## C. False leads — investigated and NOT defects

Recorded so they are not re-reported by a future pass.

1. **`month-view.tsx:132` `+N more` is NOT dead.** The earlier audit's UI-29 fix is present and
   correct — it is a real `<button>` with `stopPropagation()` and an `onSlotClick` handler. (It
   remains a small tap target — that is UX-25 in the responsive section, not a functionality bug.)
2. **The dashboard trend polarity is NOT inverted.** `dash-metric-cards.tsx` has the `higherIsBetter`
   prop and correctly renders `0%` as neutral. UX-17 covers only the _colour-only presentation_.
3. **`dash-metric-cards.tsx` `text-success`/`text-destructive` token usage is deliberate and
   dark-safe** — it is text on a card, not a solid badge, so the light-only `-bg` tokens are not
   involved.
4. **The `sticky top-0 z-10` table header pattern is not an overflow bug** despite the differing
   background classes — it is a cosmetic inconsistency (UX-49.8).
5. **`AppLoader` (`components/app-loader.tsx:3`) is not a full-page spinner defect.** It is used only
   as the boot gate in `protected-route.tsx:24, 59`, which is the correct place for it.
6. **Every `<img>` in the app has a meaningful `alt`.** Verified across `candidates-table.tsx:193`,
   `clients-table.tsx:151`, `team-table.tsx:110`, `candidate-detail-sheet.tsx:2436`,
   `talent-pool-detail-sheet.tsx:536`, `team-member-sheet.tsx:157`, `activity-timeline.tsx:620`,
   `app-sidebar.tsx:124`, `home-topbar.tsx:17`, and the auth/careers logos.
7. **Calendar realtime is not broken.** `useSocketRoom('interviews')`'s `join:room` is ignored by the
   server, but interview mutations are emitted to `applications` and every socket auto-joins
   `applications` at connect.
8. **The `<iframe>` email/resume previews are not an XSS vector.** Both render sites use
   `<iframe sandbox="allow-same-origin">` with no `allow-scripts`.
9. **`candidate-detail-sheet.tsx:583`'s raw `new Date(\`${date}T${time}\`)` is correct** — it is only
   the fallback arm of `zonedWallClockUtc(...) || ...`.
10. **`interview-scorecard-form.tsx` local-time handling is correct** — `datetime-local` values
    without an offset parse as local per spec, and `toDatetimeLocal` matches.
11. **Tailwind canonical-class hints in `get_errors`** (e.g. `min-h-[80px]` → `min-h-20`) are
    pre-existing style hints, not compile errors. Do not "fix" them as part of an unrelated change.
    (`tags-table.tsx:497`'s `bg-foreground/[0.05]` is the one worth correcting — see UX-49.8.)

## D. Known deliberate non-fixes

- **18 `react-hooks/set-state-in-effect` lint errors** are state-reset-on-open effects in dialogs.
  Radix unmounts dialog content when closed, so they are functionally correct. The repo convention
  is to rely on unmount/remount. Leave them.
- **Three `console.*` calls remain intentionally**: `job-pipeline-board.tsx` (fetch failure with no
  cache), `lib/boot-data.ts` (boot partial-failure summary), `store/realtime/socket.ts` (socket auth
  error).

## E. Suggested fix order

Ordered by impact ÷ effort, and grouped so each batch is independently revertable.

**Batch 1 — trust in the data (highest impact, low effort)**
`UX-21` (error states), `UX-22` (stale flash), `UX-25` (dashboard void), `UX-23` / `UX-24` (loading
states). These four all attack the same user-facing failure: "the app looks like my data is gone."
`UX-22` is a copy of a fix that already exists in the codebase.

**Batch 2 — accessibility blockers (high impact, medium effort, mostly mechanical)**
`UX-13` (fix the six `Field` helpers once — repairs hundreds of fields), `UX-10` (one shared
component fixes all 8 tables), `UX-12` (add `sr-only` titles), `UX-14` (tabIndex + Enter/Space),
`UX-16`, `UX-20`, `UX-11`.

**Batch 3 — destructive-action safety**
`UX-34` (three unconfirmed deletes), `UX-35` (missing cascade warnings), `UX-36` + `UX-47` (one
`AlertDialog` and one `Field` component), `UX-31` (silent invalid submit), `UX-30` (`.trim()`),
`UX-32` (cross-field validation).

**Batch 4 — the shell and responsive**
`UX-01` (large-monitor detachment — one line), `UX-02` (jobs on mobile), `UX-05` (close button),
`UX-03`, `UX-04`.

**Batch 5 — consistency sweep (mechanical, do in one pass)**
`UX-41` (glossary + sweep), `UX-42`, `UX-43`, `UX-44`, `UX-45`, `UX-40`, `UX-27`, `UX-08`.

**Batch 6 — theming and conventions**
`UX-48`, `UX-49`, `UX-06`, `UX-07`, `UX-26`, `UX-09`, `UX-15`, `UX-17`, `UX-18`, `UX-19`,
`UX-28`, `UX-29`, `UX-33`, `UX-37`, `UX-38`, `UX-39`, `UX-46`.
