import { describe, expect, test } from "bun:test"
import { mkdtemp, rm } from "node:fs/promises"
import os from "node:os"
import path from "node:path"

describe("upgrade command", () => {
  test("is registered in root help and documents its options", async () => {
    const root = await cli(["--help"], {}, "../src/index.ts")
    const help = await cli(["upgrade", "--help"], {}, "../src/index.ts")
    expect(root.exitCode).toBe(0)
    expect(root.stdout).toContain("upgrade")
    expect(help.exitCode).toBe(0)
    expect(help.stdout).toContain("[<target>]")
    expect(help.stdout).toContain("--method")
    expect(help.stdout).toContain("-m")
  })

  // Every update source the updater knows installs upstream opencode, so the command must do nothing.
  test.each([[[]], [["--method", "npm"]], [["2.3.4", "--method", "curl"]]])(
    "refuses to upgrade with %j and never looks up or installs a version",
    async (args) => {
      const result = await cli(args)
      expect(result.exitCode).toBe(1)
      expect(result.events).toEqual([])
      expect(result.stdout).toContain("Ainvil has no update service")
      expect(result.stdout).toContain("github.com/mayurchoubey/ainvil/releases")
    },
  )

  test("rejects unsupported methods", async () => {
    const result = await cli(["--method", "apt"])
    expect(result.exitCode).not.toBe(0)
    expect(result.events).toEqual([])
  })
})

async function cli(args: string[], env: Record<string, string> = {}, entry = "fixture/upgrade.ts") {
  const root = await mkdtemp(path.join(os.tmpdir(), "opencode-upgrade-"))
  try {
    const child = Bun.spawn(
      [process.execPath, "--define", 'OPENCODE_VERSION="0.0.0-beta-old"', path.join(import.meta.dir, entry), ...args],
      {
        cwd: path.join(import.meta.dir, ".."),
        env: {
          ...process.env,
          OPENCODE_TEST_HOME: root,
          XDG_DATA_HOME: path.join(root, "data"),
          XDG_CONFIG_HOME: path.join(root, "config"),
          XDG_CACHE_HOME: path.join(root, "cache"),
          XDG_STATE_HOME: path.join(root, "state"),
          ...env,
        },
        stdout: "pipe",
        stderr: "pipe",
      },
    )
    const [stdout, stderr, exitCode] = await Promise.all([
      new Response(child.stdout).text(),
      new Response(child.stderr).text(),
      child.exited,
    ])
    const events = stdout
      .split("\n")
      .filter((line) => line.startsWith("EVENT "))
      .map((line) => JSON.parse(line.slice(6)))
    expect(await Bun.file(path.join(root, "state", "ainvil", "service-local.json")).exists()).toBe(false)
    return { stdout, stderr, exitCode, events }
  } finally {
    await rm(root, { recursive: true, force: true })
  }
}
