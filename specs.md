# RevisaFácil Frontend Specs (Summary)

## Goal

Unify the application UI with a consistent “techED grading workbench” design system and behavior across pages.

## Design System

- Use shared header with centered logo and right-aligned profile menu.
- Header component: `app/components/layout/AppHeader.tsx`.
- Logo text: `PLATAFORMA` + `RevisaFácil` (centered), clickable to `/`.
- Palette (tokens in `app/globals.css`):
  - `--paper`, `--paper-soft`, `--paper-strong` for surfaces.
  - `--chalk` accent green, `--graphite` text, `--fog` borders, `--wash` subtle fills.
- Remove gradients and cream shadow; use flat neutral background `#f7f8fa`.

## Global UI Behaviors

- Auth modal (from `AuthMenu`) is centered with blurred backdrop.
- Modal header shows logo (centered), no dividers; extra spacing between logo and tabs.
- Auth modal width widened (`max-w-lg` + `style width: 110%`).
- “Criar” in sidebar or dropzone when unauthenticated opens Auth modal.
- When user logs out, clear all main page state:
  - selected class/task, files, cached file name, drag state, type menu, progress, modal state, etc.

## Main Page (`app/page.tsx`)

- Layout: centered header + 3-column grid (left class/task, center work area, right summary).
- Header copy centered:
  - “Plataforma de correção inteligente de atividades escolares”
  - “Organize suas turmas, envie lotes de atividades e receba relatórios prontos em minutos.”
- Rubric Rail:
  - Progress fills to 25% (Envio) when files are present.
  - Extração only marked after 50%.
  - Labels aligned center with the step cards below.
- Remove “Comparação lado a lado” section.
- Remove dropzone progress bar (redundant).
- After extraction completes:
  - Show “Redirecionando” message + loading button.
  - Wait 3 seconds before redirecting to extractions page.
  - For bulk: redirect only after progress hits 100%.
- When unauthenticated:
  - Left sidebar: Plan card hidden.
  - “Criar” triggers Auth modal.
  - Right summary shows 0 documents and 0h; motivational copy.

## Left Sidebar (`ClassTaskSidebar`)

- Show only last 4 classes, with “Ver todas as turmas” button.
- “Ver todas as turmas” button:
  - Small text, centered, subtle styling, green on hover, with border.
- Add green scrollbar for class list; add left padding to scroll area.
- Each class can expand tasks; tasks list scrolls if more than 1 task (max height ~1 row).
- Plan card moved to bottom, always visible (no stretch issues):
  - Use `self-start` and `max-h` with scrollable list.

## File Upload

- File input should reset after change so re-adding same file works.
- JPG acceptance fixed (extension typo removed; MIME fallback added).

## Extractions Page (`/classes/[classId]/tasks/[taskId]/extractions`)

- New page replaces modal.
- Table with columns: name, created-at, status, actions.
- Add row hover, checkbox, highlighted status badges with dot indicator.
- Show class/task + progress on top.

## Extraction Detail Page (`/classes/[classId]/tasks/[taskId]/extraction/[extractionId]`)

- Split view:
  - Left: extracted text.
  - Right: report with tabs (Analysis primary, others mocked).
- Use same header and styling.

## Classes Page (`/classes`)

- Refactored to match design system with `AppHeader`.
- Table-based layout for classes.

## Tasks Page (`/classes/[classId]/tasks`)

- Refactored to match design system with `AppHeader`.
- Table-based layout for tasks.
- Clicking task goes to extractions page.

## Grade Criteria Pages

- `/grade-criteria`: table-based list + filters in toolbar.
- `/grade-criteria/[criteriaId]`: detail page with summary panel on right.
- Both use `AppHeader`.

## Pending Behavior

- Ensure Rubric Rail “Upload” fills correctly for JPG.
- Align header logo consistently via `AppHeader`.
