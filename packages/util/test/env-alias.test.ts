import { expect, test } from "bun:test"
import path from "node:path"

// The alias runs once at import, so each case needs a fresh process.
function run(env: Record<string, string>) {
  const result = Bun.spawnSync({
    cmd: [
      process.execPath,
      "-e",
      `await import(${JSON.stringify(path.join(import.meta.dir, "..", "src", "env-alias.ts"))})
console.log(JSON.stringify([process.env.OPENCODE_ALIAS_PROBE, process.env.OPENCODE_ALIAS_OTHER]))`,
    ],
    env: { PATH: process.env.PATH ?? "", ...env },
    stderr: "pipe",
  })
  expect(result.exitCode, result.stderr.toString()).toBe(0)
  return JSON.parse(result.stdout.toString())
}

test("an AINVIL_ variable is readable under its OPENCODE_ name and wins over it", () => {
  expect(run({ AINVIL_ALIAS_PROBE: "new", OPENCODE_ALIAS_PROBE: "old", OPENCODE_ALIAS_OTHER: "kept" })).toEqual([
    "new",
    "kept",
  ])
})
