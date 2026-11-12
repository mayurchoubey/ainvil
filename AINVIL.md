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

Nothing from upstream has been removed or obscured. The fork retains the
original license, copyright notice, source files, and git history. The only
additions at the point of forking are this file, `NOTICE`, a README banner,
and `RENAME.md`.

## Why it exists

To own a coding-agent engine we can build on and ship for our own and
clients' use, under our own name and release cadence, rather than depending on
an upstream package we do not control. Pinning to 2.2.6 matches the version
our current integration (Toolsmith's agent engine) is built and verified
against.

## Why "pinned at 2.2.6"

Our downstream integration depends on `@opencode/cli@2.2.6` and
`@opencode/client@2.2.6`. This fork starts from that exact source so behaviour
is identical to what is already tested. Upstream has moved on (v2.2.7+); we
will pull upstream changes deliberately, as reviewed merges, not by tracking
`dev`.

## The rename to Ainvil

The repository, README, and project identity are branded Ainvil. The deep
rename of code-level identifiers is **staged, not yet done**, because it is
large and must keep the build green. See [`RENAME.md`](RENAME.md) for the
surface measurements and the ordered plan.

Until the code-level rename lands, internal package names (`@opencode/*`),
the `opencode` binary, the `OPENCODE_*` environment variables, and the
on-disk config namespace remain as upstream. That is deliberate: a
half-applied rename would not build.

## Maintenance you now own

Forking means owning maintenance, including security. Watch
[anomalyco/opencode](https://github.com/anomalyco/opencode) and pull security
fixes as reviewed merges onto this pinned line. Record each upstream commit
you adopt.
