import { loadRuntimeModules, resolveHostPackageRoots, type RuntimeModuleLoader } from "./runtime-modules.js"

const foreignPkgSuffix = String.raw`(?:node_modules[/\\](@(?:ainvil|opencode)[/\\]plugin|effect)|(@(?:ainvil|opencode)[/\\]plugin|effect)@[^/\\]+@@@\d+)`
const foreignPkgPattern = new RegExp(String.raw`^(.*[/\\]${foreignPkgSuffix})[/\\](.+)$`)

let installed: Readonly<Record<string, RuntimeModuleLoader>> | undefined

// Plugins published for upstream import its scope for the same package the host provides.
const upstreamPlugin = "@opencode/plugin"
const hostPlugin = "@ainvil/plugin"
const isHostPlugin = (specifier: string) => specifier === hostPlugin || specifier.startsWith(`${hostPlugin}/`)

export function provides(specifier: string) {
  const name =
    specifier === upstreamPlugin || specifier.startsWith(`${upstreamPlugin}/`)
      ? specifier.replace(upstreamPlugin, hostPlugin)
      : specifier
  return installed !== undefined && Object.hasOwn(installed, name)
}

export function ensurePluginRuntime() {
  if (typeof Bun === "undefined") return {}
  if (installed) return installed
  const modules = loadRuntimeModules()
  installed = modules
  Bun.plugin({
    name: "opencode-plugin-runtime",
    setup(build) {
      for (const [specifier, load] of Object.entries(modules)) {
        const module = () => {
          const exports = load()
          return exports instanceof Promise
            ? exports.then((value) => ({ exports: value, loader: "object" as const }))
            : { exports, loader: "object" as const }
        }
        build.module(specifier, module)
        if (isHostPlugin(specifier)) build.module(specifier.replace(hostPlugin, upstreamPlugin), module)
      }
      build.onLoad({ filter: createForeignPackageFilter() }, (args) => {
        const match = args.path.match(foreignPkgPattern)
        const target = match ? `${match[2] ?? match[3]}/${match[4]}`.replaceAll("\\", "/") : args.path
        throw new Error(
          `Cannot load "${target}" from plugin node_modules: "${target}" is not provided by OpenCode; plugins must use the host's "effect" and "@ainvil/plugin" modules.`,
        )
      })
    },
  })
  return modules
}

export function createForeignPackageFilter(rootsInput: Iterable<string> = resolveHostPackageRoots()) {
  const suffix = String.raw`[/\\]${foreignPkgSuffix}[/\\].*\.[cm]?[jt]sx?(?:[?#].*)?$`
  const roots = [...new Set(rootsInput)]
  if (roots.length === 0) return new RegExp(suffix)
  const escaped = roots
    .map((value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/(?:\\\/|\\\\|\/)+/g, "[/\\\\]"))
    .join("|")
  return new RegExp(`^(?!(?:${escaped})[/\\\\]).*${suffix}`)
}
