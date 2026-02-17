## Project Architecture

- `frontend/` is a SolidJS SSR app (see `frontend/entryServer.tsx`, `frontend/App.tsx`) hydrated on client via `frontend/entryClient.tsx`.
- `backend/` is a standalone tRPC server (`backend/index.ts`) exposing `system` + `sheets` routers via `backend/routes/app.ts`.
- Core data flow is Google Sheets-backed: `SheetStore` in `backend/SheetStore.ts` reads/writes sheet rows and emits `matchCreated` events.
- Frontend state is provider-driven: `TRPCProvider` configures query/mutation/subscription links; `SheetsProvider` hydrates cache + subscribes to `sheets.onMatchAdded`.
- Shared contracts live in `shared/types/*` (notably `shared/types/Sheets.ts` with Zod codecs for sheet date/duration encoding).

## Runtime + Build Workflow

- Use scripts from `package.json`: `pnpm dev`, `pnpm build`, `pnpm prerender`, `pnpm preview`, `pnpm test`, `pnpm lint`.
- Do not suggest starting a dev server unless asked; assume one is already running.
- Production output is split: Vite builds client/server, Rollup builds backend (`rollup.config.js`), then prerender emits static pages (`tools/prerenderPages.ts`).
- Keep SSR + prerender compatibility; avoid browser-only access outside guarded client lifecycle blocks.
- tRPC is mounted at `/trpc` in both dev (`tools/devServer.ts`) and preview/static (`tools/staticServer.ts`).

## Model Tool Usage

- Start with targeted discovery: use file search + focused reads before editing; prioritize files already used by feature entry points (`frontend/routes.tsx`, providers, routers).
- Prefer minimal diffs with `apply_patch`; keep changes scoped to requested behavior and existing patterns.
- For UI work, inspect the closest `*Test` page first (for example `frontend/pages/WidgetTest/WidgetTest.tsx`, `frontend/pages/DropdownTest/DropdownTest.tsx`) before introducing new patterns.
- Do not edit generated outputs (`**/index.ts`, `*.module.scss.d.ts`); update source files and let plugins regenerate.
- Validate with project scripts when relevant (`pnpm lint`, `pnpm test`); avoid suggesting `pnpm dev` unless explicitly asked.
- Preserve SSR safety during edits: guard browser APIs with lifecycle/client checks (`isServer`, `onMount`, `onCleanup`) as done in `Dropdown`, `Modal`, `TextMarquee`.

## Coding Conventions (Codebase-Specific)

- Solid patterns only: use `<Show>`, `<For>`, `<Switch>/<Match>` instead of React-style conditionals/maps.
- Define components as `const X: Component` / `ParentComponent`; keep side effects minimal and cleaned up (`onCleanup` / `onDestroy`).
- Prefer `classList` merging pattern used in `frontend/components/Button/Button.tsx`.
- Use path aliases (`#components`, `#pages`, `#backend`, `#shared`, etc.) from `tsconfig.json`/`vite.config.ts`.
- Do not edit generated barrels (`index.ts`) or generated SCSS typings (`*.module.scss.d.ts`); plugins regenerate them.
- Avoid code comments unless explicitly requested.

## UI + Styling Rules

- Use SCSS modules only; no inline styling systems.
- Terminal-like design is intentional; base tokens/functions are in `frontend/styles/_app.scss` (`ch()`, `cw()`, color/font variables).
- Character-unit sizing is runtime-driven by `ConsoleUnitPrototypeProvider`; prefer unit-based layout and avoid pixel-first sizing.
- Keep layout on the character grid and use `round(...)` for snap-to-grid constraints (see `Homepage.module.scss`, `Table.module.scss`, `Modal.module.scss`).
- Reuse primitives before creating new ones: `Widget`, `WidgetAlt`, `Divider`, `Modal`, `Button`, `Input`, `Dropdown`, `Table`, `MaterialSymbol`, `InlineAction`, `AnimatedText`, `TextMarquee`, `Break`.
- `Widget` is the default framed container with label slots; prefer it for dashboard blocks and test pages.
- `Dropdown` uses portal rendering + keyboard/typeahead/listbox ARIA behavior; preserve this accessibility behavior when modifying it.
- `Modal` supports drag + narrow-screen fallback; preserve pointer/resize cleanup behavior.
- Compose classes via `classList` merge style used across components (`Button`, `Widget`, `WidgetAlt`, `Input`, `Dropdown`, `Table`).
- Keep acrylic background visibility in mind (containers are typically transparent unless explicitly modal/overlay).
- Test and demo UI changes through existing `*Test` pages under `frontend/pages`; if adding a new test page, register it in `frontend/routes.tsx` under `/tests`.

## Data + Integration Constraints

- Backend env vars are required and validated in `backend/environment.ts` (`SERVER_PORT`, Google API email/key, spreadsheet ID).
- `SheetStore` deduplicates matches by hash and uses cached cell loading; preserve this behavior when changing sheet write logic.
- Match and replay payloads must conform to shared Zod schemas/codecs in `shared/types/Sheets.ts`.
- For Sheets-related features, maintain compatibility with local-created-match cache behavior in `frontend/lib/sheetUtils.ts` + `SheetsProvider`.
