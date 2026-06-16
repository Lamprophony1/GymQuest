# GymChall Doodle Fit Visual Refresh Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current Sega/arcade-heavy visual layer with the approved Doodle Fit + Clean Gym visual system across the existing GymChall web UI.

**Architecture:** Keep the React screen/component structure unchanged and implement the refresh through global CSS tokens, component variants, and one visual-system regression test. The change is intentionally scoped to presentation so the current data flow, API client, forms, and business behavior remain stable.

**Tech Stack:** React, Vite, TypeScript, Vitest, CSS custom properties, lucide-react.

---

## File Structure

- Modify: `.gitignore`
  - Ignores `.superpowers/` local design exploration artifacts.
- Create: `docs/superpowers/specs/2026-06-16-gymchall-doodle-fit-visual-refresh.md`
  - Records the approved design decision and acceptance criteria.
- Create: `docs/superpowers/plans/2026-06-16-gymchall-doodle-fit-visual-refresh.md`
  - This implementation plan.
- Create: `web/src/test/designSystem.test.ts`
  - Guards against regression to VT323 / old Sega purple and verifies the approved token palette exists.
- Modify: `web/src/styles.css`
  - Replaces the Sega arcade skin with Doodle Fit / Clean Gym tokens and component styling.

## Task 1: Add Visual-System Regression Test

**Files:**
- Create: `web/src/test/designSystem.test.ts`

- [ ] **Step 1: Write the failing test**

Create `web/src/test/designSystem.test.ts`:

```ts
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, test } from 'vitest';

const styles = readFileSync(resolve(__dirname, '../styles.css'), 'utf8');

describe('Doodle Fit visual system', () => {
  test('uses the approved Clean Gym palette and type system', () => {
    expect(styles).toContain('--primary: #0f6f48');
    expect(styles).toContain('--fresh: #1aa866');
    expect(styles).toContain('--accent: #f4ff5f');
    expect(styles).toContain('--aqua: #79e7ff');
    expect(styles).toContain('--danger: #ff6f61');
    expect(styles).toContain('Space Grotesk');
    expect(styles).toContain('Nunito');
  });

  test('does not keep the old Sega arcade identity as the app skin', () => {
    expect(styles).not.toContain('VT323');
    expect(styles).not.toContain('#4503ff');
    expect(styles).not.toContain('--shadow-ring');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```powershell
npm test -- src/test/designSystem.test.ts
```

Expected result before the CSS rewrite: FAIL because `styles.css` still contains `VT323`, `#4503ff`, `--shadow-ring`, and does not contain the new approved tokens.

- [ ] **Step 3: Commit test only is not required**

Do not commit yet. Keep the red test in the working tree and proceed to Task 2.

## Task 2: Replace Global Tokens And Base Typography

**Files:**
- Modify: `web/src/styles.css`

- [ ] **Step 1: Replace the top-level import and `:root` token block**

Use these approved tokens:

```css
@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800&family=Space+Grotesk:wght@500;600;700&display=swap');

:root {
  --ink: #141615;
  --muted: #64716a;
  --page-bg: #f8fbf5;
  --surface: #ffffff;
  --surface-soft: #eff9ef;
  --primary: #0f6f48;
  --fresh: #1aa866;
  --accent: #f4ff5f;
  --aqua: #79e7ff;
  --danger: #ff6f61;
  --warning-soft: #fff6d8;
  --danger-soft: #fff0ed;
  --aqua-soft: #ebfbff;
  --lime-soft: #fbffe0;
  --border: #203a2d;
  --border-soft: #cfe1d5;
  --disabled: #edf2ec;
  --fg-disabled: #8c9a91;
  --shadow-sticker: 5px 6px 0 #203a2d;
  --shadow-soft: 0 16px 40px rgba(15, 111, 72, 0.12);
  --radius-lg: 28px;
  --radius-md: 20px;
  --radius-sm: 14px;
  --app-width: 960px;
  color-scheme: light;
  font-family: "Nunito", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  color: var(--ink);
  background: var(--page-bg);
}
```

- [ ] **Step 2: Update global body, headings, and paragraphs**

Apply `Nunito` to body/control text, `Space Grotesk` to headings and big numbers, keep dashboard headings capped, and use mobile-first readable sizes:

```css
body {
  min-width: 320px;
  min-height: 100vh;
  margin: 0;
  background: radial-gradient(circle at top left, rgba(244, 255, 95, 0.28), transparent 32rem), var(--page-bg);
  color: var(--ink);
  font-family: "Nunito", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  font-size: 1rem;
  line-height: 1.5;
}

h1,
h2,
h3 {
  color: var(--ink);
  font-family: "Space Grotesk", "Nunito", sans-serif;
  font-weight: 700;
  letter-spacing: 0;
  text-wrap: balance;
}

h1 { font-size: clamp(2rem, 7vw, 2.5rem); line-height: 1; }
h2 { font-size: clamp(1.5rem, 5vw, 1.75rem); line-height: 1.05; }
h3 { font-size: clamp(1.125rem, 4vw, 1.25rem); line-height: 1.12; }
p { font-size: 1rem; line-height: 1.5; }
```

- [ ] **Step 3: Keep all spacing on the 4-point grid**

Use gaps/padding from `8, 12, 16, 20, 24, 28, 32, 40, 48`.

## Task 3: Restyle App Shell, Dashboard, Buttons, And Score Panels

**Files:**
- Modify: `web/src/styles.css`

- [ ] **Step 1: Implement shell and hero surfaces**

Use `--surface`, `--surface-soft`, `--primary`, and sticker shadows. Preserve these selectors:

```css
.app-shell
.app-header
.dashboard-hero
.panel-section
.status-panel
.score-grid
.score-panel
.score-panel--brand
.score-panel--success
.score-panel--warning
.score-panel--danger
.score-panel--info
```

The dashboard hero must be the most expressive surface and use green as the main field. The panel sections and admin/status areas must remain cleaner.

- [ ] **Step 2: Implement button system**

Preserve all existing variants:

```css
.button
.button--secondary
.button--tertiary
.button--quaternary
.button--success
.button--danger
.button--dark
.icon-button
.icon-button--danger
```

Required behavior:

- `min-height: 48px` or higher.
- `white-space: nowrap`.
- visible `:focus-visible`.
- active press uses small translate only.
- disabled state is readable and not clickable.

- [ ] **Step 3: Implement icon frames**

Preserve:

```css
.icon-frame
.icon-frame--success
.icon-frame--warning
.icon-frame--danger
.icon-frame--info
```

Use rounded sticker frames with color roles: green, lime, coral, aqua.

## Task 4: Restyle Ranking, Status, Forms, Admin, Alerts, And Bottom Nav

**Files:**
- Modify: `web/src/styles.css`

- [ ] **Step 1: Ranking and badges**

Preserve selectors:

```css
.ranking-list
.ranking-row
.ranking-row--active
.ranking-row__position
.ranking-row__name
.ranking-row__badges
.ranking-row__score
.badge
.badge--success
.badge--warning
.badge--danger
.badge--neutral
```

Ranking rows use white/surface backgrounds, active row uses soft green, position chip uses lime, and badges stay inline/content-sized.

- [ ] **Step 2: Forms and admin**

Preserve selectors:

```css
.arcade-form
.form-screen
.admin-stats
.admin-forms
.admin-lists
.mini-stat
.admin-list
.record-row
```

The `.arcade-form` class name remains for compatibility, but the visual style becomes a clean Doodle Fit form. Inputs must have visible background and border contrast.

- [ ] **Step 3: Alerts and navigation**

Preserve selectors:

```css
.alert
.alert--success
.alert--danger
.alert--brand
.bottom-nav
.bottom-nav__item
.bottom-nav__item--active
.tab-row
.tab-button
.tab-button--active
```

Alerts use text + color roles. Bottom nav remains fixed, mobile-first, and keeps touch targets at 56px or higher.

## Task 5: Verify And Commit

**Files:**
- Verify: `web/src/test/designSystem.test.ts`
- Verify: `web/src/styles.css`

- [ ] **Step 1: Run targeted visual-system test**

Run:

```powershell
npm test -- src/test/designSystem.test.ts
```

Expected: PASS.

- [ ] **Step 2: Run complete frontend tests**

Run:

```powershell
npm test
```

Expected: all Vitest suites pass.

- [ ] **Step 3: Run frontend build**

Run:

```powershell
npm run build
```

Expected: TypeScript and Vite build pass.

- [ ] **Step 4: Review Git status and diff**

Run:

```powershell
git status --short
git diff -- web/src/styles.css web/src/test/designSystem.test.ts
```

Expected: only the intended implementation files are pending.

- [ ] **Step 5: Commit implementation**

Run:

```powershell
git add web/src/styles.css web/src/test/designSystem.test.ts
git commit -m "style: apply doodle fit visual system"
```

## Self-Review

Spec coverage:

- Approved combination of option 1 layout and option 2 palette is covered by Tasks 2-4.
- Mobile-first and legibility requirements are covered by typography, touch target, button nowrap, and responsive tasks.
- Dashboard/ranking/badges/status keep the strongest game expression in Tasks 3-4.
- Forms/admin use cleaner styling in Task 4.
- Regression away from Sega/VT323/old purple is covered in Task 1.

Placeholder scan:

- No task contains TBD, TODO, "implement later", or unresolved paths.

Type consistency:

- Test file uses Vitest and Node `readFileSync`, compatible with existing `@types/node`.
- CSS selectors match current React class names.

## Execution Mode

The user approved direct execution after writing the spec. This plan will be executed inline in the current session.
