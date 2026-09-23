# Arista ATS — Style Guide

> For AI agents and contributors building new parts of this application.
> All values are extracted directly from source. Do not deviate without explicit approval.

---

## Core Principles (from CLAUDE.md)

- Smaller, pure components with single responsibility
- Reusable components wherever possible
- Minimal but clear code — no unnecessary abstractions
- DRY — never duplicate logic or styles
- Shadcn/Radix UI first for all UI elements
- Responsive by default (mobile-first)
- Light and dark theme support on every component

---

## Color System

Colors use the **OKLCH color space** for perceptually uniform light/dark handling.

### Palettes

| Token Prefix          | Role                           |
| --------------------- | ------------------------------ |
| `--color-pine-teal-*` | Primary brand color (teal)     |
| `--color-parchment-*` | Background/warm accent         |
| `--color-silver-*`    | Neutral surfaces, borders      |
| `--color-ash-grey-*`  | Muted text, secondary elements |

Each palette has 11 stops: `50` through `950`.

### Semantic Tokens

Always use semantic tokens, never raw palette values.

#### Light Mode (`:root`)

| Token                    | Value                        |
| ------------------------ | ---------------------------- |
| `--primary`              | `var(--color-pine-teal-800)` |
| `--primary-foreground`   | `#ffffff`                    |
| `--background`           | `var(--color-parchment-50)`  |
| `--foreground`           | `var(--color-pine-teal-950)` |
| `--card`                 | `#ffffff`                    |
| `--card-foreground`      | `var(--color-pine-teal-950)` |
| `--popover`              | `#ffffff`                    |
| `--popover-foreground`   | `var(--color-pine-teal-950)` |
| `--secondary`            | `var(--color-silver-50)`     |
| `--secondary-foreground` | `var(--color-pine-teal-900)` |
| `--muted`                | `var(--color-silver-50)`     |
| `--muted-foreground`     | `var(--color-ash-grey-500)`  |
| `--accent`               | `var(--color-pine-teal-50)`  |
| `--accent-foreground`    | `var(--color-pine-teal-800)` |
| `--border`               | `var(--color-silver-200)`    |
| `--border-subtle`        | `var(--color-silver-300)`    |
| `--input`                | `var(--color-silver-200)`    |
| `--ring`                 | `var(--color-pine-teal-700)` |
| `--destructive`          | `oklch(0.577 0.245 27.325)`  |
| `--success`              | `#69c58a`                    |
| `--success-bg`           | `#eaf7ee`                    |
| `--warning`              | `#f3a64a`                    |
| `--warning-bg`           | `#fff3e3`                    |

#### Dark Mode (`.dark`)

| Token                  | Value                        |
| ---------------------- | ---------------------------- |
| `--primary`            | `var(--color-pine-teal-400)` |
| `--primary-foreground` | `var(--color-pine-teal-950)` |
| `--background`         | `var(--color-pine-teal-950)` |
| `--foreground`         | `var(--color-parchment-50)`  |
| `--card`               | `var(--color-pine-teal-900)` |
| `--card-foreground`    | `var(--color-parchment-50)`  |
| `--secondary`          | `var(--color-pine-teal-800)` |
| `--muted`              | `var(--color-pine-teal-800)` |
| `--muted-foreground`   | `var(--color-ash-grey-400)`  |
| `--accent`             | `var(--color-pine-teal-800)` |
| `--border`             | `rgba(255, 255, 255, 0.08)`  |
| `--border-subtle`      | `rgba(255, 255, 255, 0.06)`  |
| `--input`              | `rgba(255, 255, 255, 0.08)`  |
| `--ring`               | `var(--color-pine-teal-400)` |
| `--destructive`        | `oklch(0.704 0.191 22.216)`  |

#### Sidebar Tokens

| Token                  | Light                        | Dark                         |
| ---------------------- | ---------------------------- | ---------------------------- |
| `--sidebar`            | `var(--color-pine-teal-800)` | `var(--color-pine-teal-900)` |
| `--sidebar-foreground` | `rgba(255,255,255,0.72)`     | `rgba(255,255,255,0.72)`     |
| `--sidebar-primary`    | `#ffffff`                    | `var(--color-pine-teal-400)` |
| `--sidebar-accent`     | `rgba(255,255,255,0.08)`     | `rgba(255,255,255,0.06)`     |
| `--sidebar-border`     | `rgba(255,255,255,0.08)`     | `rgba(255,255,255,0.06)`     |

---

## Typography

```
Font Family:  Inter Variable (from @fontsource-variable/inter)
Base Size:    14px
Line Height:  1.5
Smoothing:    antialiased
```

### Tailwind Tokens

```
--font-sans:    'Inter Variable', sans-serif
--font-heading: 'Inter Variable', sans-serif
```

### Weights in Use

| Class           | Weight |
| --------------- | ------ |
| `font-medium`   | 500    |
| `font-semibold` | 600    |

No other weights are used. Do not introduce `font-bold` or `font-light`.

### Size Scale in Use

| Class       | Size | Usage                                      |
| ----------- | ---- | ------------------------------------------ |
| `text-xs`   | 12px | Badges, secondary labels, meta text        |
| `text-sm`   | 14px | Body text, table cells, inputs (default)   |
| `text-base` | 16px | Card titles, nav brand name, page headings |
| `text-2xl`  | 24px | Dashboard metric values                    |
| `text-3xl`  | 30px | Responsive metric values (`@[250px]/card`) |

---

## Spacing

Base unit is **4px**. All spacing derives from this.

### Page-Level Padding

```
p-4 md:p-6
```

### Common Gap Patterns

| Class   | Value | Usage                       |
| ------- | ----- | --------------------------- |
| `gap-1` | 4px   | Tight icon+text             |
| `gap-2` | 8px   | Sidebar menus, inline items |
| `gap-4` | 16px  | Section spacing             |
| `gap-6` | 24px  | Page-level section gaps     |

### Component Internal Padding

| Component        | Padding                                      |
| ---------------- | -------------------------------------------- |
| Card             | `px-6 py-6` (default), `px-4 py-4` (size=sm) |
| Sidebar sections | `p-2`                                        |
| Table cells      | `p-2`                                        |
| Table header     | `h-10 px-2`                                  |
| Button default   | `h-11 px-[18px]`                             |
| Input            | `h-9 px-2.5 py-1`                            |
| Dropdown items   | `px-2 py-1.5`                                |

---

## Border Radius

```
--radius: 1rem (16px) — base
```

| Variable        | Value | Class Equivalent                |
| --------------- | ----- | ------------------------------- |
| `--radius-sm`   | 8px   | `rounded-sm` → use `rounded-md` |
| `--radius-md`   | 12px  | `rounded-md`                    |
| `--radius-lg`   | 16px  | `rounded-lg`                    |
| `--radius-xl`   | 20px  | `rounded-xl`                    |
| `--radius-2xl`  | 24px  | `rounded-2xl`                   |
| `--radius-3xl`  | 32px  | `rounded-3xl`                   |
| `--radius-full` | 999px | `rounded-full`                  |

### Applied Per Component

| Component        | Radius               |
| ---------------- | -------------------- |
| Cards            | `rounded-xl`         |
| Buttons          | `rounded-md`         |
| Inputs, Selects  | `rounded-md`         |
| Badges           | `rounded-4xl` (pill) |
| Checkboxes       | `rounded-[4px]`      |
| Modals, Sheets   | `rounded-lg`         |
| Table containers | `rounded-lg`         |

---

## Shadows

```
--shadow:       0 2px 10px rgba(0,0,0,0.03)
--shadow-hover: 0 6px 20px rgba(0,0,0,0.05)
```

| Usage                  | Class                       |
| ---------------------- | --------------------------- |
| Cards, inputs, buttons | `shadow-xs`                 |
| Popovers, dropdowns    | `shadow-sm`                 |
| Modals                 | `shadow-md`                 |
| Card border ring       | `ring-1 ring-foreground/10` |

---

## Layout Architecture

### App Shell

```
<SidebarProvider>               ← context + CSS vars
  <AppSidebar variant="inset" /> ← 256px wide sidebar
  <SidebarInset>
    <SiteHeader />               ← 48px tall header
    <Outlet />                   ← page content
  </SidebarInset>
</SidebarProvider>
```

### Dimensions

| Element                 | Value                                |
| ----------------------- | ------------------------------------ |
| Sidebar width (desktop) | `256px` (`16rem`)                    |
| Sidebar width (mobile)  | `288px` (`18rem`)                    |
| Sidebar collapsed       | `48px` (`3rem`, icon only)           |
| Header height           | `48px` (`calc(var(--spacing) * 12)`) |
| App max-width           | `1440px`                             |

### Page Content Pattern

```tsx
<div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
  {/* page content */}
</div>
```

### Responsive Grid (Container Queries)

| Container Query | Breakpoint | Layout                          |
| --------------- | ---------- | ------------------------------- |
| `@xl/main`      | 640px+     | 2-column card grid              |
| `@4xl/main`     | 960px+     | Show tab list instead of select |
| `@5xl/main`     | 1280px+    | 4-column card grid              |
| `@[250px]/card` | 250px+     | Larger text in cards            |

---

## Component Patterns

### Button

Source: `src/components/ui/button.tsx`

**Variants:**

| Variant       | Appearance                                                     |
| ------------- | -------------------------------------------------------------- |
| `default`     | `bg-primary text-primary-foreground hover:bg-primary/80`       |
| `outline`     | `border-border-subtle bg-background shadow-xs`                 |
| `secondary`   | `bg-secondary text-secondary-foreground hover:bg-secondary/80` |
| `ghost`       | `hover:bg-muted hover:text-foreground`                         |
| `destructive` | `bg-destructive/10 text-destructive hover:bg-destructive/20`   |
| `link`        | `text-primary underline-offset-4 hover:underline`              |

**Sizes:**

| Size      | Class                    |
| --------- | ------------------------ |
| `default` | `h-11 gap-2 px-[18px]`   |
| `sm`      | `h-8 gap-1 px-2.5`       |
| `lg`      | `h-12 gap-2 px-5`        |
| `xs`      | `h-6 gap-1 px-2 text-xs` |
| `icon`    | `size-9`                 |
| `icon-sm` | `size-8`                 |
| `icon-xs` | `size-6`                 |
| `icon-lg` | `size-10`                |

**Base:** `rounded-md text-sm font-medium transition-all duration-200 border border-transparent focus-visible:ring-3 ring-ring/50 disabled:opacity-50`

---

### Card

Source: `src/components/ui/card.tsx`

```tsx
<Card>
  {' '}
  // rounded-xl bg-card shadow-xs ring-1 ring-foreground/10
  <CardHeader>
    {' '}
    // px-6 grid auto-rows-min gap-1
    <CardTitle /> // font-heading text-base font-medium
    <CardDescription /> // text-sm text-muted-foreground
    <CardAction /> // right-aligned, col-start-2 row-span-2
  </CardHeader>
  <CardContent> // px-6</CardContent>
  <CardFooter> // px-6</CardFooter>
</Card>
```

Use `size="sm"` prop for compact cards (`px-4 py-4 gap-4`).

---

### Badge

Source: `src/components/ui/badge.tsx`

```tsx
<Badge variant="outline">Text</Badge>
```

**Base:** `h-5 inline-flex items-center gap-1 rounded-4xl border px-2 py-0.5 text-xs font-medium`

| Variant       | Appearance                               |
| ------------- | ---------------------------------------- |
| `default`     | `bg-primary text-primary-foreground`     |
| `secondary`   | `bg-secondary text-secondary-foreground` |
| `destructive` | `bg-destructive/10 text-destructive`     |
| `outline`     | `border-border text-foreground`          |

---

### Input

Source: `src/components/ui/input.tsx`

```tsx
<Input type="text" placeholder="..." />
```

**Base:** `h-9 w-full rounded-md border border-input bg-transparent px-2.5 py-1 text-sm shadow-xs transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-3 ring-ring/50 dark:bg-input/30 disabled:opacity-50`

---

### Select

Source: `src/components/ui/select.tsx`

```tsx
<Select>
  <SelectTrigger size="sm">
    <SelectValue placeholder="Select..." />
  </SelectTrigger>
  <SelectContent align="end">
    <SelectGroup>
      <SelectItem value="val">Label</SelectItem>
    </SelectGroup>
  </SelectContent>
</Select>
```

**Trigger base:** `h-9 rounded-md border border-input bg-transparent px-2.5 py-2 text-sm shadow-xs dark:bg-input/30`

Use `size="sm"` (`h-8`) for compact contexts (table toolbars, filters).

---

### Label

Source: `src/components/ui/label.tsx`

```tsx
<Label htmlFor="input-id">Label Text</Label>
```

**Base:** `flex items-center gap-2 text-sm font-medium select-none leading-none`

---

### Checkbox

Source: `src/components/ui/checkbox.tsx`

**Base:** `size-4 rounded-[4px] border border-input shadow-xs checked:bg-primary checked:border-primary focus-visible:ring-3 ring-ring/50`

---

### Table

Source: `src/components/ui/table.tsx`

```tsx
<Table>
  <TableHeader className="sticky top-0 z-10 bg-muted">
    <TableRow>
      <TableHead>Column</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow>
      <TableCell>Value</TableCell>
    </TableRow>
  </TableBody>
</Table>
```

- Header: sticky, `bg-muted`, `h-10 px-2 font-medium text-sm whitespace-nowrap`
- Rows: `border-b hover:bg-muted/50`
- Cells: `p-2 align-middle whitespace-nowrap`

---

### Tabs

Source: `src/components/ui/tabs.tsx`

Two variants: `default` (filled list) and `line` (underline indicator).

```tsx
<Tabs defaultValue="tab1">
  <TabsList>
    <TabsTrigger value="tab1">Tab 1</TabsTrigger>
  </TabsList>
  <TabsContent value="tab1">...</TabsContent>
</Tabs>
```

**List base:** `h-9 inline-flex rounded-lg p-[3px] bg-muted`
**Trigger active:** `bg-background text-foreground shadow-sm`
**Trigger inactive:** `text-foreground/60`

---

### Dropdown Menu

Source: `src/components/ui/dropdown-menu.tsx`

**Content:** `z-50 min-w-32 rounded-md bg-popover p-1 shadow-md ring-1 ring-foreground/10`
**Item:** `flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm cursor-pointer focus:bg-accent focus:text-accent-foreground`
**Label:** `px-2 py-1.5 text-xs font-medium text-muted-foreground`
**Separator:** `-mx-1 my-1 h-px bg-border`

---

## Sidebar

Source: `src/components/app-sidebar.tsx`, `src/components/ui/sidebar.tsx`

### Structure

```
SidebarHeader     → Brand logo + name
SidebarContent    → NavMain, NavInternals, NavSecondary (mt-auto)
SidebarFooter     → NavUser (avatar + theme toggle + menu)
```

### Nav Sections

| Section        | Items                     |
| -------------- | ------------------------- |
| `NavMain`      | Clients, Jobs, Candidates |
| `NavInternals` | Analytics, Team, Calendar |
| `NavSecondary` | Settings, Tags            |

### Item Styling

- Default: `h-8 rounded-md p-2 text-sm`
- Hover: `bg-sidebar-accent text-sidebar-accent-foreground`
- Active: `bg-sidebar-accent text-sidebar-accent-foreground font-medium`
- Collapsed: icon centered, `size-8`, tooltip on right side

### Collapsed Behavior

- Toggle via `Cmd/Ctrl+B`
- Collapsed state persists in cookie (`sidebar_state`, 7-day TTL)
- Mobile uses Sheet overlay (`288px`)

---

## Header

Source: `src/components/site-header.tsx`

```
h-[48px] flex items-center gap-2 border-b shrink-0
```

Contents: `SidebarTrigger` (`variant="ghost" size="icon-sm"`) + `Separator` (`h-4`) + page title (`text-base font-medium`)

Page title is derived from pathname (first segment, capitalized).

---

## Theme Switching

- Provider: `next-themes` with `attribute="class"`, `defaultTheme="system"`
- Light: no class on root
- Dark: `.dark` class on `<html>`
- Toggle lives in `NavUser` dropdown (bottom of sidebar)
- Icons: `SunIcon` (light) ↔ `MoonIcon` (dark)

---

## Form Composition Pattern

```tsx
<div className="flex flex-col gap-2">
  <Label htmlFor="field">Field Label</Label>
  <Input id="field" placeholder="Enter value..." />
</div>
```

For selects, replace `<Input>` with `<Select>`. Always pair `Label` with its control via `htmlFor`/`id`.

---

## Data Table Pattern

Reference implementations, in preference order:

- `src/components/table-pagination.tsx` — the shared `TablePagination` used by
  every list screen.
- `src/app/candidates/_components/candidates-table.tsx` — a full list screen,
  including row selection, the actions `DropdownMenu` and persisted pagination.

- Sticky header: `sticky top-0 z-10 bg-muted`
- Row selection: `Checkbox` in first column
- Status column: `Badge variant="outline"` with icon
- Actions column: `DropdownMenu` triggered by `EllipsisVerticalIcon`
- Pagination: `TablePagination` component
- Drag-to-reorder: `@dnd-kit` with `restrictToVerticalAxis`

---

## Icons

All icons come from `lucide-react`. Default icon size in buttons and menus: `size-4` (16px). Use `size-3` for decorative/dense contexts (drag handles, small badges).

---

## Animation

From `tw-animate-css`:

- `animate-in` / `animate-out` with `fade-in`, `zoom-in`, `slide-in-from-*`
- `duration-100` / `duration-200` for transitions
- Avoid custom animations — use the existing scale

---

## Do / Don't

| Do                                                               | Don't                                                     |
| ---------------------------------------------------------------- | --------------------------------------------------------- |
| Use semantic tokens (`bg-primary`, `text-muted-foreground`)      | Use raw palette values (`pine-teal-800`) directly in JSX  |
| Use Shadcn components from `src/components/ui/`                  | Build custom UI from scratch if a Shadcn primitive exists |
| Use `gap-*` for spacing between siblings                         | Use `margin-*` for layout spacing                         |
| Apply `dark:` variants alongside light styles                    | Hardcode colors that ignore dark mode                     |
| Use container queries (`@xl/main`) for card-level responsiveness | Use viewport breakpoints inside card components           |
| Keep components pure and single-responsibility                   | Mix data-fetching and presentation logic in one component |
| Use `font-medium` or `font-semibold`                             | Use `font-bold`, `font-light`, or other weights           |
| Use `ring-1 ring-foreground/10` for card borders                 | Use `border border-*` on cards                            |
