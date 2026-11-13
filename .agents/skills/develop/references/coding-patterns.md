# Coding patterns

Apply these conventions to new and changed code. Do not perform unrelated repository-wide cleanup.

- Use `const` arrow functions for helpers, exported functions, hooks and React components. Preserve normal class/library method syntax where required by an existing contract.
- Use one import per module path. Merge mixed value/type imports with inline `type`. Group external imports, workspace packages, then local imports with blank lines.
- Import only the named exports you use from any library: `import { StrictMode, type ChangeEvent } from "react";`, `import { Pool, type PoolClient } from "pg";`, `import { debounce } from "lodash-es";`. Do not import a whole library object or namespace to reach its members (`import React from "react"` with `React.StrictMode`, `import _ from "lodash"` with `_.debounce`, `import * as x from "lib"`), and do not use the global `React.X` namespace. A default import is fine when the default export is the package's single API (`import Fastify from "fastify"`, `import StarterKit from "@tiptap/starter-kit"`). The automatic JSX runtime needs no React import. `pnpm lint` enforces namespace imports, known utility-bag packages and default imports used only through two or more members.
- Prefer the configured workspace package public exports across package boundaries. Do not deep-import another package's internals into application source.
- Use folder barrels for intentional public APIs. In the admin, `@/*` maps to `apps/admin/src/*` (tsconfig `paths` and Vite `resolve.alias`); elsewhere `@/*` maps to the repository root for tests and scripts. Keep heavy third-party imports tree-shakeable.
- Use `UPPER_SNAKE_CASE` for private module-level configuration constants; preserve existing exported schema/public API names. Keep precise domain types and explicit public contracts; do not use `any` to bypass errors.
- Always use braces for conditionals and loops. Use one statement per line and semantic blank lines between validation, setup, effects, handlers and return blocks. Avoid nested ternaries and compressed multi-step handlers.
- Prettier owns wrapping, quotes and indentation. Read editor/formatter settings if present. Use the package manager the project uses, in order of preference: pnpm, yarn, npm (`pnpm lint`, `yarn lint`, `npm run lint`). Keep the lint script coverage aligned with these rules and do not describe it as a complete architectural or security audit.

## React components, hooks and styles

Apply these conventions when designing, implementing or reviewing React components, hooks and styles.

- Use function components and hooks. Prefer composition over oversized configurable components.
- Derive values during render instead of storing them through effects. Use effects only to synchronize with external systems, and keep their cleanup explicit and StrictMode-safe.
- If TanStack Query is present, keep it responsible for server state. Keep presentational components independent from data fetching where practical.
- Admin server state: reads are `queryOptions` factories in `@/api/queries.ts` (pass the query `signal` to `api()`); writes are `useMutation` hooks in `@/hooks` that invalidate in `onSuccess`. Build keys only with `queryKeys` from `@/api/queryKeys.ts`; related reads share a prefix (`queryKeys.entries(env)`, `queryKeys.models(env)`) so one invalidation refreshes them. `pnpm lint` rejects `api`/`streamEvents` imports outside `@/api` and `@/hooks`. A 401 from any query or mutation reloads the session centrally in `main.tsx`.
- Use stable domain keys for lists, not array indexes.
- Handle loading, empty, error and success states deliberately.
- Define component props with `interface`; use `type` for unions, mapped types and schema-derived types.
- Export a component module's primary component with `export default` at the bottom. Export hooks/utilities by name. Preserve existing package public exports unless the task requires an API change.
- Export hooks as `export const useX = (...) => { ... }`.
- Wrap handlers passed to child components or used in effect dependencies with `useCallback`. Extract callbacks for component props; short native DOM event adapters may remain inline. Never call hooks inside loops or conditional branches. Avoid blanket memoization elsewhere.
- If MUI is present, prefer MUI components and the shared theme over custom markup and styles.
- If Emotion is present, use the object syntax `styled("div")({ ... })` for new component styles, not `styled.div` or tagged template literals.
- When MUI and Emotion are both present, combine them: import `styled` from `@mui/material/styles` (Emotion-backed and theme-aware) and extend MUI components with object styles that read theme values, e.g. `styled(Paper)(({ theme }) => ({ padding: theme.spacing(2) }))`. Use `styled("div")` only for layout wrappers with no MUI equivalent. Do not mix in a second styled instance from `@emotion/styled`.
- Keep accessible contrast, semantic elements, visible focus, labels, keyboard interaction and keyboard alternatives to drag-and-drop.

## File naming and folder structure

Apply these conventions to new and changed admin files. Move existing files only as part of a task that touches them; do not restructure the whole app as unrelated cleanup.

- Name React component files in `PascalCase` matching the default-exported component (`FieldDialog.tsx`).
- Name hook files after the hook in `camelCase` (`useUnsaved.ts`).
- Plain modules such as configuration, constants or helpers may use `camelCase` or `kebab-case` (`config.ts`, `field-types.ts`). Keep one style within a folder.
- Group admin source by role into known folders:
  - `components/` for reusable UI components.
  - `pageComponents/` for route-level pages and their composition.
  - `hooks/` for custom hooks.
  - `utils/` for pure helpers without React or I/O.
  - `api/` for HTTP clients, query keys and, if TanStack Query is present, its query/mutation wrappers.
  - `theme/` for design tokens and everything generated from them (UI framework theme, CSS variables, brand assets).
- Extract logic into a custom hook whenever it fits one: state with its handlers, effects, data fetching, derived values or reusable behavior. A component body should mostly compose hooks and render markup.
- Keep design tokens in `theme/` as the single source of visual identity. Name tokens by role, not by hue. Components and stylesheets consume tokens through the UI framework theme or CSS custom properties; do not write literal colors outside `theme/`. Projects describe their concrete theme setup in a project-specific design-system reference.
- Place every custom hook in `hooks/`, including hooks used by a single component. Do not colocate hooks next to components.

### Barrel exports

- Give each role folder an `index.ts` barrel. Re-export default components by name (`export { default as Modal } from "./Modal";`) and named exports with `export * from "./module";`.
- Import across folders through the barrel (`import { Modal, FieldDialog } from "@/components";`); `pnpm lint` rejects `../` and deep `@/folder/file` imports in the admin. Use `SubmitEvent`/`SubmitEventHandler` for form submits; React 19 types deprecate `FormEvent`. Import siblings in the same folder by direct path (`./Modal`) to avoid circular imports.
- Do not re-export modules loaded with `React.lazy`/`import()` from a barrel. A static barrel export pulls them into the main chunk and defeats code splitting; import them by path in the `import()` call.
