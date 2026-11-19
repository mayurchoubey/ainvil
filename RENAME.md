# Ainvil rename plan

The repository and project identity are branded Ainvil. This document is the
plan for the **code-level** rename of `opencode` identifiers, applied in stages
so the build stays green.

## Status

- **Stage A (npm scope): done.** Workspace packages are `@ainvil/*`.
  `@opencode/pty` and its platform binaries keep their upstream name because
  they are fetched from npm.
- **Stage B (command and package names): done for the primary CLI.** The root
  package is `ainvil`; the command, the compiled binary, the packed npm package
  and the Docker image use `ainvil`, with `opencode` kept as an alias.
  Not done: the Node (SEA) distribution (`opencode2-node`), the release
  workflows and scripts under `.github/`, the `install` script, Nix, AUR and
  WinGet packaging, and the remote installers in `packages/gui-plugins`. These
  all point at upstream's hosting (opencode.ai, upstream npm and GitHub
  releases) and need Ainvil's own publishing targets before they can change.
  The self-updater is disabled: no background check runs, `ainvil upgrade`
  refuses and the TUI offers no update command. The remote CLI download in
  `packages/gui-plugins` is disabled too. Packed packages reference each other
  by GitHub release URL, and the launcher never falls back to the npm registry.
- **Stage C (runtime namespace): done with fallback to the opencode names.**
  - Machine folders (data, config, cache, state, tmp) are `ainvil`, separate
    from any opencode install. Nothing is migrated from an opencode install.
  - Config files: `ainvil.json` / `ainvil.jsonc` win; `opencode.json` /
    `opencode.jsonc` are still read. New files are created under the Ainvil
    name.
  - Project folders: `.ainvil/` wins; `.opencode/` is still read.
  - Environment: `AINVIL_X` is mirrored onto `OPENCODE_X` at startup
    (`packages/util/src/env-alias.ts`), so the new name wins and the old one
    still works. The code itself still reads `OPENCODE_*`.
  - Not changed: the system policy folder (`/etc/opencode` and equivalents)
    and the macOS managed-preferences id `ai.opencode.managed`; the
    `~/.opencode/bin` path used by the upstream install script; file names
    inside the data folder (`opencode-local.db`, `opencode.log`); the server
    basic-auth user name `opencode`; and the user documentation.
- **Server suite (2026-11-17):** 124 pass, 1 skip, 0 fail after three test
  expectations left stale by Stages C and D were updated.
- **Stage D (wording): done for the engine and README.** CLI, terminal UI,
  server and core messages, help text, command hints and the system prompts
  say Ainvil; the README is rewritten and the translated upstream READMEs are
  removed; the crash screen opens issues on the Ainvil repository.
  Not changed: the documentation and marketing sites (`packages/web`,
  `services`), the desktop and web app text and its translations, SDK type
  names such as `OpenCodeClient`, updater and installer messages, upstream
  service names (OpenCode Zen, Go, Console), links to opencode.ai docs, the
  upstream wordmark on the sign-in result page, logo files, and identifiers
  sent to model providers (for example the ChatGPT agent name and the web
  fetch user agent).

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

For the downstream integration, only (1) strictly matters: it
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
