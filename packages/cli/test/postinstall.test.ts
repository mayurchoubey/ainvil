import { expect, test } from "bun:test"
import fs from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import { tmpdir } from "./fixture/tmpdir"

const platform = { darwin: "darwin", linux: "linux", win32: "windows" }[os.platform() as string] ?? os.platform()
const host = `@ainvil/cli-${platform}-${os.arch()}`

// Lays out the launcher package as the pack script does, with a fake npm first on PATH that records any call.
async function launcher(directory: string, optionalDependencies: Record<string, string>) {
  await fs.mkdir(path.join(directory, "bin"), { recursive: true })
  await fs.mkdir(path.join(directory, "path"), { recursive: true })
  await fs.copyFile(path.join(import.meta.dir, "../script/postinstall.mjs"), path.join(directory, "postinstall.mjs"))
  await Bun.write(path.join(directory, "bin", "ainvil.exe"), "echo placeholder\nexit 1\n")
  await Bun.write(
    path.join(directory, "package.json"),
    JSON.stringify({
      name: "@ainvil/cli",
      version: "2.2.6",
      bin: { ainvil: "./bin/ainvil.exe" },
      optionalDependencies,
    }),
  )
  await Bun.write(path.join(directory, "path", "npm"), `#!/bin/sh\ntouch "${directory}/npm-was-called"\nexit 1\n`)
  await fs.chmod(path.join(directory, "path", "npm"), 0o755)
  const result = Bun.spawnSync([process.execPath, path.join(directory, "postinstall.mjs")], {
    cwd: directory,
    env: {
      ...process.env,
      PATH: `${path.join(directory, "path")}${path.delimiter}${process.env["PATH"]}`,
      npm_execpath: "",
    },
    stderr: "pipe",
  })
  return {
    code: result.exitCode,
    stderr: result.stderr.toString(),
    npm: await Bun.file(path.join(directory, "npm-was-called")).exists(),
    stub: await Bun.file(path.join(directory, "bin", "ainvil.exe")).text(),
  }
}

test.skipIf(process.platform === "win32")(
  "a platform with no shipped binary leaves the install passing and a launcher that says why",
  async () => {
    await using directory = await tmpdir()
    const result = await launcher(directory.path, { "@ainvil/cli-plan9-mips": "2.2.6" })
    expect(result.code).toBe(0)
    expect(result.stderr).toContain(`no binary for ${platform}-${os.arch()}`)
    expect(result.stub).toContain(`no binary for ${platform}-${os.arch()}`)
    expect(result.npm).toBe(false)
  },
)

test.skipIf(process.platform === "win32")(
  "a missing platform package is never fetched from the npm registry",
  async () => {
    await using directory = await tmpdir()
    const result = await launcher(directory.path, { [host]: "https://example.test/cli.tgz" })
    expect(result.code).toBe(0)
    expect(result.stderr).toContain(host)
    expect(result.stub).toContain("exit 1")
    expect(result.stub).not.toContain("placeholder")
    expect(result.npm).toBe(false)
  },
)
