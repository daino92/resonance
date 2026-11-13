# TypeScript Skill

- Prefer precise domain types over broad primitives.
- Avoid `any`; use `unknown` at untrusted boundaries and narrow it.
- Prefer discriminated unions for finite state.
- Keep runtime validation at external boundaries.
- Avoid unsafe assertions unless an invariant is established.
- Let inference work locally; annotate public APIs and ambiguous boundaries.
- Prefer exhaustive handling for unions.
- Keep generics constrained and readable.
- Derive duplicate types from canonical schemas or APIs where possible.

Follow the shared [coding patterns](coding-patterns.md). Share canonical Zod-derived contracts through the shared contracts package, and preserve the separation between logical IDs, scoped identities, schema versions and content revisions.
