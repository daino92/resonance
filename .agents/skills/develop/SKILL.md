---
name: develop
description: Implement a bounded feature or refactor from agreed requirements while following project-specific coding references.
---

# Develop

Read applicable project instructions, affected source and the agreed design. For small changes, the request and a short plan can supply that design. Resolve contracts and important design decisions before implementation.

## Load relevant references

- For source changes, including React components, hooks and styles, read [coding patterns](references/coding-patterns.md).
- For TypeScript, contracts and validation, read the canonical [TypeScript guidance](references/typescript.md).
- For user-requested branch, commit, merge, release or hotfix work, follow the Git Flow section below. Reading it grants no authority for Git mutations.

## Workflow

1. Map the agreed criteria to small implementation tasks and affected files. Confirm that required values have real sources and that dependencies are available.
2. Implement the smallest complete slice. Preserve unrelated changes and existing safety guards.
3. If a material decision changes, update the design with its reason. Do not silently rewrite accepted requirements.
4. Test changed behavior and review the implementation. Run required project checks; optional workflow stages cannot waive them.
5. Record completed work, evidence, blockers and remaining tasks in the feature record when one exists. Keep implemented and verified status separate.

## Git Flow

Inspect actual Git state and branch names first. Do not initialize a repository, configure remotes or create integration branches as a side effect of unrelated work; if the repository or `develop` does not exist, report it and keep working in the current workspace.

- Use `develop` as the integration branch. Create `feature/<kebab-case-name>` from `develop` for new work.
- Use the repository's actual production branch (`main` or `master`). Do not rename it.
- Branch releases from `develop`; branch hotfixes from the production branch.
- Every merge into `develop` must always go through a pull request (merge request) whose base is `develop`. This applies to feature, release and hotfix branches without exception. Never merge into `develop` locally or push directly to it.
- Run relevant checks before proposing a PR for merge. Opening a PR does not authorize merging it or enabling auto-merge.
- Use conventional English commit messages. Preserve unrelated changes. Do not skip hooks or force-push protected branches.
- Commit, push, merge, delete branches or tag releases only within the user's request.

## Handoff

Report the exact changed scope, acceptance criteria and verification results. Update affected documentation. Do not commit, publish or deploy without user authorization.
