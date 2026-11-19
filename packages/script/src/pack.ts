import { $ } from "bun"
import { mkdir, rm } from "node:fs/promises"
import path from "node:path"

const root = path.resolve(import.meta.dir, "../../..")

// Release outputs land at the repository root, where the release workflow uploads them.
export const npmDir = path.join(root, "dist", "npm")
export const archiveDir = path.join(root, "dist", "archives")

/**
 * Ainvil packages are published as GitHub release assets, not to the npm registry, so packed manifests name each
 * other by asset URL. AINVIL_RELEASE_TAG is the release the tarballs are uploaded to.
 */
export function releaseUrl(name: string, version: string) {
  const tag = process.env["AINVIL_RELEASE_TAG"]
  if (!tag) throw new Error("AINVIL_RELEASE_TAG is required to pack")
  return `https://github.com/mayurchoubey/ainvil/releases/download/${tag}/${name.replace("@", "").replace("/", "-")}-${version}.tgz`
}

type Manifest = {
  name: string
  version: string
  dependencies?: Record<string, string>
  files?: string[]
  exports: Record<string, string | null>
  imports?: Record<string, Record<string, string>>
}

/**
 * Builds the package in `directory`, points its TypeScript exports at the build output, and packs it
 * into dist/npm. `types` is where the build writes declarations; `source` keeps `import` on the
 * TypeScript sources for packages that ship them. `workspaceOnly` exports map to null, so the published package
 * resolves none of them, even through a wildcard export.
 */
export async function pack(
  directory: string,
  options: { types?: string; source?: boolean; workspaceOnly?: readonly string[] } = {},
) {
  const types = options.types ?? "./dist/"
  const file = path.join(directory, "package.json")
  const original = await Bun.file(file).text()
  // SAFETY: release packages declare a name, a version, and string export targets.
  const pkg = JSON.parse(original) as Manifest
  const declaration = (value: string) => value.replace("./src/", types).replace(/\.tsx?$/, ".d.ts")
  const output = (value: string) => value.replace("./src/", "./dist/").replace(/\.tsx?$/, ".js")
  const tarball = path.join(npmDir, `${pkg.name.replace("@", "").replace("/", "-")}-${pkg.version}.tgz`)

  await $`bun run build`.cwd(directory)

  const exports = Object.fromEntries(
    Object.entries(pkg.exports).map(([key, value]) => {
      if (value === null || options.workspaceOnly?.includes(key)) return [key, null]

      if (!/\.tsx?$/.test(value)) return [key, value]

      return [key, { import: options.source ? value : output(value), types: declaration(value) }]
    }),
  )
  const imports = pkg.imports
    ? Object.fromEntries(
        Object.entries(pkg.imports).map(([key, conditions]) => [
          key,
          Object.fromEntries(
            Object.entries(conditions).map(([condition, value]) => [
              condition,
              condition === "types" ? declaration(value) : output(value),
            ]),
          ),
        ]),
      )
    : undefined

  // Workspace packages are released together at one version.
  const dependencies = Object.fromEntries(
    Object.entries(pkg.dependencies ?? {}).map(([name, range]) => [
      name,
      name.startsWith("@ainvil/") ? releaseUrl(name, pkg.version) : range,
    ]),
  )

  await mkdir(npmDir, { recursive: true })
  await rm(tarball, { force: true })
  // The MIT license requires its text to ship with every copy; NOTICE carries the upstream attribution.
  const legal = ["LICENSE", "NOTICE"]
  await Bun.write(
    file,
    JSON.stringify(
      {
        ...pkg,
        ...(pkg.files ? { files: [...pkg.files, ...legal] } : {}),
        ...(pkg.dependencies ? { dependencies } : {}),
        exports,
        ...(imports ? { imports } : {}),
      },
      null,
      2,
    ) + "\n",
  )
  await Promise.all(legal.map((name) => Bun.write(path.join(directory, name), Bun.file(path.join(root, name)))))

  try {
    await $`bun pm pack --destination ${npmDir}`.cwd(directory)
  } finally {
    await Bun.write(file, original)
    await Promise.all(legal.map((name) => rm(path.join(directory, name), { force: true })))
  }

  return tarball
}
