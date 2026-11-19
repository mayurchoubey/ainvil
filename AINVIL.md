# Ainvil

**Ainvil is a fork of [opencode](https://github.com/anomalyco/opencode), pinned at `v2.2.6`.**

This document explains what this fork is, why it exists, and how the rename
from "opencode" to "Ainvil" is staged. For legal attribution see
[`NOTICE`](NOTICE); the upstream MIT license is retained unchanged in
[`LICENSE`](LICENSE).

## What this is

A genuine, independently-maintained fork of opencode, taken at the exact
source state behind the published `@opencode/cli@2.2.6` release (git tag
`v2.2.6`, commit `dc2ffcf8bf26f9e669b6aa22b95f50e12be15e06`). GitHub shows
this repository as "forked from anomalyco/opencode", so the lineage is
explicit.

The fork retains the original license, copyright notice and git history. It
has since modified upstream files; [`RENAME.md`](RENAME.md) records what
changed.

## Why it exists

To own a coding-agent engine we can build on and ship under our own name and
release cadence, rather than depending on an upstream package we do not
control. Pinning to 2.2.6 matches the version our current integration is built
and verified against.

## Why "pinned at 2.2.6"

Our downstream integration depends on `@opencode/cli@2.2.6` and
`@opencode/client@2.2.6`. This fork starts from that exact source so behaviour
is identical to what is already tested. Upstream has moved on (v2.2.7+); we
will pull upstream changes deliberately, as reviewed merges, not by tracking
`dev`.

## The rename to Ainvil

The rename is staged so the build stays green; [`RENAME.md`](RENAME.md) records
what each stage changed and what is left. In short: packages are `@ainvil/*`,
the command is `ainvil`, and Ainvil has its own machine folders, config file
names and environment variable prefix, with the opencode names still accepted
as a fallback. Engine messages and prompts say Ainvil. The documentation sites,
app text and release pipeline still belong to upstream. The self-updater is
disabled: Ainvil never checks for or installs updates by itself, and
`ainvil upgrade` refuses, because every update source that code knows installs
upstream opencode.

## Maintenance you now own

Forking means owning maintenance, including security. Watch
[anomalyco/opencode](https://github.com/anomalyco/opencode) and pull security
fixes as reviewed merges onto this pinned line. Record each upstream commit
you adopt.
