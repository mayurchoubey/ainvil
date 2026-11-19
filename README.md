# Ainvil

Ainvil is an AI coding agent: a background server, a command line, and a terminal UI that let a language model read, search and edit a codebase.

It is an independently maintained fork of [opencode](https://github.com/anomalyco/opencode), taken at `v2.2.6`. It is not built by, endorsed by, or affiliated with the opencode team. See [AINVIL.md](AINVIL.md) for what the fork is, [RENAME.md](RENAME.md) for how far the rename has gone, and [NOTICE](NOTICE) for attribution. The upstream MIT license is retained unchanged in [LICENSE](LICENSE).

## Status

Ainvil is not on the npm registry and has no installer. Packages are attached to [GitHub releases](https://github.com/mayurchoubey/ainvil/releases) as tarballs that reference each other by release URL, so a project installs them by URL:

```bash
npm install https://github.com/mayurchoubey/ainvil/releases/download/<tag>/ainvil-cli-2.2.6.tgz
```

Binaries are shipped for Apple-silicon macOS and for Alpine (musl) Linux on arm64 and x64. On any other platform the install succeeds and the `ainvil` command explains that no binary is available. Nothing is ever fetched from the `@ainvil` scope on npm, which this project does not publish to.

Ainvil does not update itself. `ainvil upgrade` refuses, because the only update sources in this code install upstream opencode.

## Run from source

Requires [Bun](https://bun.sh) 1.4.4.

```bash
bun install
```

```bash
bun run dev
```

`bun run dev -- --help` lists the commands. The command is `ainvil`; `opencode` is kept as an alias.

## Names

| What | Ainvil name | Still accepted |
|---|---|---|
| Packages | `@ainvil/*` | none |
| Command | `ainvil` | `opencode` |
| Environment variables | `AINVIL_*` | `OPENCODE_*` |
| Config file | `ainvil.json`, `ainvil.jsonc` | `opencode.json`, `opencode.jsonc` |
| Project folder | `.ainvil/` | `.opencode/` |
| Machine folders | `~/.config/ainvil`, `~/.local/share/ainvil` and so on | not shared with opencode |

Where both config files or project folders exist they are merged, and the Ainvil one is applied last, so its values win.

## What still belongs to upstream

Parts of this tree still describe or call upstream opencode and have not been changed:

- The documentation and marketing sites under `packages/web` and `services`.
- The desktop and web app text, and the SDK type names such as `OpenCodeClient`.
- The release workflows, the `install` script and other packaging, which publish to upstream's locations.
- The model catalog, which is fetched from `models.opencode.ai`. The provider packages it names by upstream's scope are served from this build, never downloaded.
- MCP OAuth with servers that use client ID metadata documents still presents upstream's document at opencode.ai, because Ainvil hosts none of its own.
- Hosted services that are upstream's own, such as OpenCode Zen, OpenCode Go and the OpenCode Console. They keep their names because they are not Ainvil's.
- Links to documentation at opencode.ai, which describes upstream and uses the opencode names.

## Development

- `bun run typecheck` and `bun run lint` from the repository root.
- Tests run from each package folder, for example `bun run test` in `packages/core`. They do not run from the root.
- [AGENTS.md](AGENTS.md) holds the code conventions inherited from upstream.

## License

MIT. See [LICENSE](LICENSE) and [NOTICE](NOTICE).
