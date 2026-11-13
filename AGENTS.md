# Project engineering rules

Read `.agents/skills/develop/SKILL.md` and its `references/coding-patterns.md` and `references/typescript.md` before implementation.

## Local application of the references

This is a standalone React/TypeScript/Vite application. Use pnpm 9.12.3. References to the t-compose admin, its API, monorepo packages, Zod contracts, MUI, Emotion apply only if those technologies are introduced deliberately. Do not add them solely to satisfy an example.

- `src/components`: reusable UI components; PascalCase files and bottom default exports.
- `src/pageComponents`: application composition.
- `src/hooks`: all custom hooks and stateful React behavior, including single-use hooks.
- `src/utils`: pure helpers without React, DOM or network access.
- `src/api`: external service clients and response validation.
- `src/theme`: CSS tokens and scene colors. Preserve the existing visual identity.
- `src/scene`: Three.js materials and rendering-specific modules.
- `src/data`: canonical genre types, dataset, graph and lesson models.

Use `@/folder` barrels across role folders and direct relative imports for siblings. Keep dynamically imported modules outside static barrels. Use named library imports, inline type imports, arrow functions and braces. Use interfaces for component props. Keep handlers passed to child components stable with useCallback where appropriate. Keep public data exports compatible.

Run `pnpm lint`, `pnpm test` and `pnpm build` after changes. The convention check covers selected structural rules; it does not replace code review. Use `pnpm format` for Prettier formatting. Validate rendered behavior in a browser when behavior or layout changes.
