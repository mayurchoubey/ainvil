# Ainvil rename plan

The repository and project identity are branded Ainvil. This document is the
plan for the remaining **code-level** rename of `opencode` identifiers. It is
not yet applied, because the surface is large and a half-applied rename does
not build.

## Surface (measured at v2.2.6, tag `dc2ffcf8`)

| What | Occurrences | Files |
|------|-------------|-------|
| `@opencode/*` npm scope (package names, deps, imports, tsconfig paths) | 9,773 | 2,277 |
| `OPENCODE_*` environment variables | 2,346 | 545 |
| Other `opencode` strings (`.opencode`, `config/opencode`, `"opencode"`, command/service name) | ~3,900 | ~930 |

37 workspace packages, Bun + Turbo, with codegen (`packages/client`),
ast-grep lint rules, and a `release` workflow — all keyed to these names. A
blind find-and-replace will break the build. The rename must be staged and
verified green at each stage.

## Decide first: how far to rename

Three distinct identities, independently renameable:

1. **npm identity** — the `@opencode/*` scope + root/`cli` package name + the
   `bin` entries (`opencode`, `opencode2`). This is what you install and
   publish. Renaming to `@ainvil/*` + `ainvil` is what makes
   `npm i @ainvil/cli` and an `ainvil` command real.
2. **Runtime identity** — the `opencode` binary name in use, subcommands
   (`opencode service ...`), `OPENCODE_*` env vars, and the on-disk config /
   data / storage namespace. Renaming these changes where the tool reads
   config and credentials, so it needs migration care.
3. **Branding/docs** — README, site links, logos, Discord/URLs. Cosmetic;
   already partly done (README banner, this file, `NOTICE`).

For the downstream Toolsmith integration, only (1) strictly matters: it
imports `@opencode/cli` and `@opencode/client`. (2) matters only if you want
zero `opencode` footprint at runtime.

## Staged plan (each stage ends green: `bun install` + `bun run typecheck`)

- **Stage A — npm scope.** `@opencode/` → `@ainvil/` across package names,
  `dependencies`/`devDependencies`, workspace catalog, and tsconfig path
  aliases. Rebuild lockfile. Re-run `packages/client` codegen
  (`bun run generate`) so generated SDK names follow. Fix ast-grep rule paths.
  Verify typecheck + lint.
- **Stage B — bin + package names.** Root `package.json` `name` → `ainvil`;
  `packages/cli` `bin` → `ainvil` / `ainvil2`; update the release workflow and
  `script/pack.ts` accordingly. Keep the old `opencode` bin as an alias for
  one release if anything local calls it.
- **Stage C — runtime namespace.** `OPENCODE_*` env, config/data dirs, service
  name. Provide a migration/fallback (read the old namespace if the new one is
  absent) so an existing install keeps working. This is the riskiest stage —
  do it last, behind tests.
- **Stage D — branding.** README body, logos, site/Discord links, remaining
  user-facing "opencode" copy.

## Keeping upstream mergeable

Renaming identifiers across 2,277 files will conflict with almost every
upstream change. Before Stage A, decide the merge strategy: either accept that
upstream merges become manual, or keep the rename as a thin top layer (publish
wrapper packages / bin shims under `@ainvil/*` that re-export `@opencode/*`)
so the bulk of the tree stays upstream-identical and mergeable. The wrapper
approach is far cheaper to maintain if you expect to track upstream closely.
