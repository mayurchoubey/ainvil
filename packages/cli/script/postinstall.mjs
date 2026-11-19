#!/usr/bin/env node

import childProcess from "node:child_process"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { createRequire } from "node:module"
import { fileURLToPath } from "node:url"

const directory = path.dirname(fileURLToPath(import.meta.url))
const require = createRequire(import.meta.url)
const packageJson = JSON.parse(fs.readFileSync(path.join(directory, "package.json"), "utf8"))
const command = Object.keys(packageJson.bin ?? {})[0]
if (!command) throw new Error("Ainvil package does not declare a binary")
const sourceCommand = packageJson.opencodeSourceBinary ?? command

const platform = { darwin: "darwin", linux: "linux", win32: "windows" }[os.platform()] ?? os.platform()
const nodeArch = { x64: "x64", arm64: "arm64", arm: "arm" }[os.arch()] ?? os.arch()
// x64 Node runs emulated on Windows ARM64, but PROCESSOR_IDENTIFIER still names the host CPU.
const arch =
  platform === "windows" && nodeArch === "x64" && process.env.PROCESSOR_IDENTIFIER?.startsWith("ARM")
    ? "arm64"
    : nodeArch
const sourceBinary = platform === "windows" ? `${sourceCommand}.exe` : sourceCommand
const targetBinary = path.resolve(directory, packageJson.bin[command])
const dependencies = packageJson.optionalDependencies ?? {}
// A build may ship only some variants of a platform (for example musl without glibc), so the base name
// is derived from any variant rather than requiring the plain package to be listed.
const suffix = `-${platform}-${arch}`
const variant = Object.keys(dependencies).find((name) => name.endsWith(suffix) || name.includes(`${suffix}-`))
const base = variant?.slice(0, variant.indexOf(suffix) + suffix.length)

function supportsAvx2() {
  if (arch !== "x64") return false
  if (platform === "linux") {
    try {
      return /(^|\s)avx2(\s|$)/i.test(fs.readFileSync("/proc/cpuinfo", "utf8"))
    } catch {
      return false
    }
  }
  if (platform === "darwin") {
    try {
      const result = childProcess.spawnSync("sysctl", ["-n", "hw.optional.avx2_0"], {
        encoding: "utf8",
        timeout: 1500,
      })
      return result.status === 0 && (result.stdout || "").trim() === "1"
    } catch {
      return false
    }
  }
  if (platform === "windows") {
    const script =
      '(Add-Type -MemberDefinition "[DllImport(""kernel32.dll"")] public static extern bool IsProcessorFeaturePresent(int ProcessorFeature);" -Name Kernel32 -Namespace Win32 -PassThru)::IsProcessorFeaturePresent(40)'
    for (const executable of ["powershell.exe", "pwsh.exe", "pwsh", "powershell"]) {
      try {
        const result = childProcess.spawnSync(executable, ["-NoProfile", "-NonInteractive", "-Command", script], {
          encoding: "utf8",
          timeout: 3000,
          windowsHide: true,
        })
        if (result.status !== 0) continue
        const output = (result.stdout || "").trim().toLowerCase()
        if (output === "true" || output === "1") return true
        if (output === "false" || output === "0") return false
      } catch {
        continue
      }
    }
  }
  return false
}

function isMusl() {
  if (platform !== "linux") return false
  try {
    if (fs.existsSync("/etc/alpine-release")) return true
    const result = childProcess.spawnSync("ldd", ["--version"], { encoding: "utf8" })
    return `${result.stdout || ""}${result.stderr || ""}`.toLowerCase().includes("musl")
  } catch {
    return false
  }
}

function packageNames() {
  const baseline = arch === "x64" && !supportsAvx2()
  const names =
    platform === "linux"
      ? isMusl()
        ? arch === "x64"
          ? baseline
            ? [`${base}-baseline-musl`, `${base}-musl`, `${base}-baseline`, base]
            : [`${base}-musl`, `${base}-baseline-musl`, base, `${base}-baseline`]
          : [`${base}-musl`, base]
        : arch === "x64"
          ? baseline
            ? [`${base}-baseline`, base, `${base}-baseline-musl`, `${base}-musl`]
            : [base, `${base}-baseline`, `${base}-musl`, `${base}-baseline-musl`]
          : [base, `${base}-musl`]
      : arch === "x64"
        ? baseline
          ? [`${base}-baseline`, base]
          : [base, `${base}-baseline`]
        : [base]
  // Windows 11 on ARM64 can still run the x64 binary under emulation when the native one fails.
  const x64 = base.replace(/-arm64$/, "-x64")
  const emulated = platform === "windows" && arch === "arm64" ? [`${x64}-baseline`, x64] : []
  return [...names, ...emulated].filter((name) => dependencies[name])
}

function copyBinary(source) {
  if (!fs.existsSync(source)) throw new Error(`Binary not found at ${source}`)
  fs.mkdirSync(path.dirname(targetBinary), { recursive: true })
  if (fs.existsSync(targetBinary)) {
    try {
      fs.unlinkSync(targetBinary)
    } catch {}
  }
  try {
    fs.linkSync(source, targetBinary)
  } catch {
    fs.copyFileSync(source, targetBinary)
  }
  fs.chmodSync(targetBinary, 0o755)
}

function resolveBinary(name) {
  const packagePath = require.resolve(`${name}/package.json`)
  // Package managers keep an older platform package when the matching version is not yet on the registry,
  // which would silently install the previous release under the new launcher.
  // Platform packages are listed by release URL, so the launcher's own version is the one to match.
  const version = JSON.parse(fs.readFileSync(packagePath, "utf8")).version
  if (version !== packageJson.version) throw new Error(`${name} is ${version}, expected ${packageJson.version}`)
  return path.join(path.dirname(packagePath), "bin", sourceBinary)
}

function verifyBinary() {
  return (
    childProcess.spawnSync(targetBinary, ["--version"], {
      stdio: "ignore",
      windowsHide: true,
    }).status === 0
  )
}

// The launcher is often a dependency of a larger application, so a platform without a working binary must not
// fail that application's install. The command is replaced by a script that explains itself when run.
function unavailable(reason) {
  console.error(`Ainvil: ${reason}. The ainvil command will not run on this machine.`)
  fs.mkdirSync(path.dirname(targetBinary), { recursive: true })
  fs.rmSync(targetBinary, { force: true })
  fs.writeFileSync(targetBinary, `#!/bin/sh\necho ${JSON.stringify(`Ainvil: ${reason}.`)} >&2\nexit 1\n`)
  fs.chmodSync(targetBinary, 0o755)
}

function main() {
  if (!base) return unavailable(`no binary for ${platform}-${arch} is shipped`)
  const names = packageNames()
  for (const name of names) {
    try {
      copyBinary(resolveBinary(name))
      if (verifyBinary()) return
    } catch {}
  }
  // Platform packages come only from the release that ships this launcher. They are never fetched from the npm
  // registry, where the same names could belong to someone else.
  unavailable(`no working binary was installed from ${names.join(" or ")}`)
}

main()
