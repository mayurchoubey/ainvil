export * as Provider from "./provider.js"

import { Context, Effect, Layer, Option, Schema, Stream, Struct } from "effect"
import { Provider } from "@ainvil/schema/provider"
import { Model } from "@ainvil/schema/model"
import { makeLocationNode } from "@ainvil/util/effect/app-node"
import { HttpTimeout, type ProviderPackage } from "@ainvil/ai/effect"
import { isRecord } from "@ainvil/util/record"
import { Npm } from "@ainvil/util/npm"
import type { DeepMutable } from "./schema.js"
import { importModule, resolveModule } from "@ainvil/util/runtime-import"
import { Bus } from "./bus.js"
import { Integration } from "./integration.js"
import { State } from "./state.js"
import { IntegrationConnection } from "./integration/connection.js"
import { Credential } from "@ainvil/schema/credential"
import { Location } from "./location.js"
import { freeze } from "immer"
import { AISDKNative } from "./aisdk-native.js"

export const ID = Provider.ID
export type ID = typeof ID.Type

export const AISDK_PREFIX = "aisdk:"
export const isAISDK = (value: string | undefined): value is string => value?.startsWith(AISDK_PREFIX) ?? false
export const aisdk = (value: string) => (isAISDK(value) ? value : `${AISDK_PREFIX}${value}`)
export function packageName(value: string): string
export function packageName(value: undefined): undefined
export function packageName(value: string | undefined): string | undefined
export function packageName(value: string | undefined) {
  // Upstream's scopes name the same native entrypoints: the live model catalog and existing user configuration
  // use them, and left unmapped they would be installed from npm instead of loaded from this build.
  const upstream = ["@opencode/", "@opencode-ai/"].find((scope) => value?.startsWith(`${scope}ai/`))
  if (value && upstream) return value.replace(upstream, "@ainvil/")
  if (value === undefined || !isAISDK(value)) return value
  return value.slice(AISDK_PREFIX.length)
}

type Json = Schema.Schema.Type<typeof Schema.Json>
const JsonRecord = Schema.Record(Schema.String, Schema.Json)
const decodeJsonRecord = Schema.decodeUnknownSync(JsonRecord)

export class LoadError extends Schema.TaggedError<LoadError>()("Provider.LoadError", {
  package: Schema.String,
  cause: Schema.Defect(),
}) {}

const packages = new Map<string, Promise<unknown>>()
const builtins = new Map<string, () => Promise<unknown>>([
  ["@ainvil/ai/providers/alibaba", () => import("@ainvil/ai/providers/alibaba")],
  ["@ainvil/ai/providers/alibaba/chat", () => import("@ainvil/ai/providers/alibaba/chat")],
  ["@ainvil/ai/providers/alibaba/messages", () => import("@ainvil/ai/providers/alibaba/messages")],
  ["@ainvil/ai/providers/alibaba/responses", () => import("@ainvil/ai/providers/alibaba/responses")],
  ["@ainvil/ai/providers/alibaba/images", () => import("@ainvil/ai/providers/alibaba/images")],
  ["@ainvil/ai/providers/amazon-bedrock", () => import("@ainvil/ai/providers/amazon-bedrock")],
  ["@ainvil/ai/providers/amazon-bedrock/mantle", () => import("@ainvil/ai/providers/amazon-bedrock/mantle")],
  ["@ainvil/ai/providers/amazon-bedrock/mantle/chat", () => import("@ainvil/ai/providers/amazon-bedrock/mantle/chat")],
  [
    "@ainvil/ai/providers/amazon-bedrock/mantle/messages",
    () => import("@ainvil/ai/providers/amazon-bedrock/mantle/messages"),
  ],
  [
    "@ainvil/ai/providers/amazon-bedrock/mantle/responses",
    () => import("@ainvil/ai/providers/amazon-bedrock/mantle/responses"),
  ],
  ["@ainvil/ai/providers/anthropic", () => import("@ainvil/ai/providers/anthropic")],
  ["@ainvil/ai/providers/anthropic-compatible", () => import("@ainvil/ai/providers/anthropic-compatible")],
  ["@ainvil/ai/providers/azure", () => import("@ainvil/ai/providers/azure")],
  ["@ainvil/ai/providers/azure/chat", () => import("@ainvil/ai/providers/azure/chat")],
  ["@ainvil/ai/providers/azure/responses", () => import("@ainvil/ai/providers/azure/responses")],
  ["@ainvil/ai/providers/azure/images", () => import("@ainvil/ai/providers/azure/images")],
  ["@ainvil/ai/providers/azure/messages", () => import("@ainvil/ai/providers/azure/messages")],
  ["@ainvil/ai/providers/baseten", () => import("@ainvil/ai/providers/baseten")],
  ["@ainvil/ai/providers/baseten/decisions", () => import("@ainvil/ai/providers/baseten/decisions")],
  ["@ainvil/ai/providers/cerebras", () => import("@ainvil/ai/providers/cerebras")],
  ["@ainvil/ai/providers/cloudflare-ai-gateway", () => import("@ainvil/ai/providers/cloudflare-ai-gateway")],
  [
    "@ainvil/ai/providers/cloudflare-ai-gateway/decisions",
    () => import("@ainvil/ai/providers/cloudflare-ai-gateway/decisions"),
  ],
  ["@ainvil/ai/providers/cloudflare-workers-ai", () => import("@ainvil/ai/providers/cloudflare-workers-ai")],
  [
    "@ainvil/ai/providers/cloudflare-workers-ai/decisions",
    () => import("@ainvil/ai/providers/cloudflare-workers-ai/decisions"),
  ],
  [
    "@ainvil/ai/providers/cloudflare-workers-ai/images",
    () => import("@ainvil/ai/providers/cloudflare-workers-ai/images"),
  ],
  ["@ainvil/ai/providers/cohere", () => import("@ainvil/ai/providers/cohere")],
  ["@ainvil/ai/providers/cohere/chat", () => import("@ainvil/ai/providers/cohere/chat")],
  ["@ainvil/ai/providers/deepinfra", () => import("@ainvil/ai/providers/deepinfra")],
  ["@ainvil/ai/providers/deepseek", () => import("@ainvil/ai/providers/deepseek")],
  ["@ainvil/ai/providers/digitalocean", () => import("@ainvil/ai/providers/digitalocean")],
  ["@ainvil/ai/providers/digitalocean/decisions", () => import("@ainvil/ai/providers/digitalocean/decisions")],
  ["@ainvil/ai/providers/digitalocean/images", () => import("@ainvil/ai/providers/digitalocean/images")],
  ["@ainvil/ai/providers/digitalocean/responses", () => import("@ainvil/ai/providers/digitalocean/responses")],
  ["@ainvil/ai/providers/fireworks", () => import("@ainvil/ai/providers/fireworks")],
  ["@ainvil/ai/providers/google", () => import("@ainvil/ai/providers/google")],
  ["@ainvil/ai/providers/google/interactions", () => import("@ainvil/ai/providers/google/interactions")],
  ["@ainvil/ai/providers/google/images", () => import("@ainvil/ai/providers/google/images")],
  ["@ainvil/ai/providers/google-vertex", () => import("@ainvil/ai/providers/google-vertex")],
  ["@ainvil/ai/providers/google-vertex/chat", () => import("@ainvil/ai/providers/google-vertex/chat")],
  ["@ainvil/ai/providers/google-vertex/gemini", () => import("@ainvil/ai/providers/google-vertex/gemini")],
  ["@ainvil/ai/providers/google-vertex/interactions", () => import("@ainvil/ai/providers/google-vertex/interactions")],
  ["@ainvil/ai/providers/google-vertex/messages", () => import("@ainvil/ai/providers/google-vertex/messages")],
  ["@ainvil/ai/providers/google-vertex/mistral", () => import("@ainvil/ai/providers/google-vertex/mistral")],
  ["@ainvil/ai/providers/google-vertex/responses", () => import("@ainvil/ai/providers/google-vertex/responses")],
  ["@ainvil/ai/providers/google-vertex/images", () => import("@ainvil/ai/providers/google-vertex/images")],
  ["@ainvil/ai/providers/google-vertex-messages", () => import("@ainvil/ai/providers/google-vertex-messages")],
  ["@ainvil/ai/providers/groq", () => import("@ainvil/ai/providers/groq")],
  ["@ainvil/ai/providers/meta", () => import("@ainvil/ai/providers/meta")],
  ["@ainvil/ai/providers/meta/chat", () => import("@ainvil/ai/providers/meta/chat")],
  ["@ainvil/ai/providers/meta/images", () => import("@ainvil/ai/providers/meta/images")],
  ["@ainvil/ai/providers/meta/messages", () => import("@ainvil/ai/providers/meta/messages")],
  ["@ainvil/ai/providers/meta/responses", () => import("@ainvil/ai/providers/meta/responses")],
  ["@ainvil/ai/providers/minimax", () => import("@ainvil/ai/providers/minimax")],
  ["@ainvil/ai/providers/minimax/chat", () => import("@ainvil/ai/providers/minimax/chat")],
  ["@ainvil/ai/providers/minimax/images", () => import("@ainvil/ai/providers/minimax/images")],
  ["@ainvil/ai/providers/minimax/messages", () => import("@ainvil/ai/providers/minimax/messages")],
  ["@ainvil/ai/providers/minimax/responses", () => import("@ainvil/ai/providers/minimax/responses")],
  ["@ainvil/ai/providers/mistral", () => import("@ainvil/ai/providers/mistral")],
  ["@ainvil/ai/providers/moonshot", () => import("@ainvil/ai/providers/moonshot")],
  ["@ainvil/ai/providers/moonshot/chat", () => import("@ainvil/ai/providers/moonshot/chat")],
  ["@ainvil/ai/providers/moonshot/messages", () => import("@ainvil/ai/providers/moonshot/messages")],
  ["@ainvil/ai/providers/moonshot/responses", () => import("@ainvil/ai/providers/moonshot/responses")],
  ["@ainvil/ai/providers/openai", () => import("@ainvil/ai/providers/openai")],
  ["@ainvil/ai/providers/openai/chat", () => import("@ainvil/ai/providers/openai/chat")],
  ["@ainvil/ai/providers/openai/responses", () => import("@ainvil/ai/providers/openai/responses")],
  ["@ainvil/ai/providers/openai/images", () => import("@ainvil/ai/providers/openai/images")],
  ["@ainvil/ai/providers/openai-compatible", () => import("@ainvil/ai/providers/openai-compatible")],
  [
    "@ainvil/ai/providers/openai-compatible/responses",
    () => import("@ainvil/ai/providers/openai-compatible/responses"),
  ],
  ["@ainvil/ai/providers/openai-compatible/images", () => import("@ainvil/ai/providers/openai-compatible/images")],
  [
    "@ainvil/ai/providers/openai-compatible-responses",
    () => import("@ainvil/ai/providers/openai-compatible-responses"),
  ],
  ["@ainvil/ai/providers/opencode/decisions", () => import("@ainvil/ai/providers/opencode/decisions")],
  ["@ainvil/ai/providers/openrouter", () => import("@ainvil/ai/providers/openrouter")],
  ["@ainvil/ai/providers/openrouter/decisions", () => import("@ainvil/ai/providers/openrouter/decisions")],
  ["@ainvil/ai/providers/openrouter/images", () => import("@ainvil/ai/providers/openrouter/images")],
  ["@ainvil/ai/providers/openrouter/responses", () => import("@ainvil/ai/providers/openrouter/responses")],
  ["@ainvil/ai/providers/togetherai", () => import("@ainvil/ai/providers/togetherai")],
  ["@ainvil/ai/providers/typesafe-ai/decisions", () => import("@ainvil/ai/providers/typesafe-ai/decisions")],
  ["@ainvil/ai/providers/venice", () => import("@ainvil/ai/providers/venice")],
  ["@ainvil/ai/providers/venice/responses", () => import("@ainvil/ai/providers/venice/responses")],
  ["@ainvil/ai/providers/vercel-ai-gateway", () => import("@ainvil/ai/providers/vercel-ai-gateway")],
  ["@ainvil/ai/providers/vercel-ai-gateway/chat", () => import("@ainvil/ai/providers/vercel-ai-gateway/chat")],
  ["@ainvil/ai/providers/vercel-ai-gateway/messages", () => import("@ainvil/ai/providers/vercel-ai-gateway/messages")],
  [
    "@ainvil/ai/providers/vercel-ai-gateway/responses",
    () => import("@ainvil/ai/providers/vercel-ai-gateway/responses"),
  ],
  [
    "@ainvil/ai/providers/vercel-ai-gateway/decisions",
    () => import("@ainvil/ai/providers/vercel-ai-gateway/decisions"),
  ],
  ["@ainvil/ai/providers/vercel-ai-gateway/images", () => import("@ainvil/ai/providers/vercel-ai-gateway/images")],
  ["@ainvil/ai/providers/xai", () => import("@ainvil/ai/providers/xai")],
  ["@ainvil/ai/providers/xai/images", () => import("@ainvil/ai/providers/xai/images")],
  ["@ainvil/ai/providers/zai", () => import("@ainvil/ai/providers/zai")],
  ["@ainvil/ai/providers/zai/chat", () => import("@ainvil/ai/providers/zai/chat")],
  ["@ainvil/ai/providers/zai/images", () => import("@ainvil/ai/providers/zai/images")],
  ["@ainvil/ai/providers/zai-coding-plan", () => import("@ainvil/ai/providers/zai-coding-plan")],
  ["@ainvil/ai/providers/zai-coding-plan/chat", () => import("@ainvil/ai/providers/zai-coding-plan/chat")],
  ["@ainvil/ai/providers/zai-coding-plan/messages", () => import("@ainvil/ai/providers/zai-coding-plan/messages")],
  ["@ainvil/ai/providers/zai-coding-plan/responses", () => import("@ainvil/ai/providers/zai-coding-plan/responses")],
])

/** Native `@ainvil/ai/providers/*` entrypoints bundled with Core and loadable by name from config. */
export const builtinPackages: ReadonlySet<string> = new Set(builtins.keys())

export const loadPackage = Effect.fn("Provider.loadPackage")(function* (input: string, npm?: Npm.Interface) {
  const specifier = packageName(input)
  const builtin = builtins.get(specifier)
  if (builtin) return yield* importPackage(specifier, specifier, builtin)
  const resolved = yield* Effect.sync(() => {
    if (specifier.startsWith("file://") || specifier.startsWith("@ainvil/ai/")) return specifier
    try {
      return import.meta.resolve(specifier)
    } catch {
      return undefined
    }
  })
  if (resolved) return yield* importPackage(specifier, resolved)
  if (!npm) {
    return yield* new LoadError({
      package: specifier,
      cause: new Error(`Provider package ${specifier} is not installed`),
    })
  }
  const parts = specifier.split("/")
  const root = specifier.startsWith("@") ? parts.slice(0, 2).join("/") : (parts[0] ?? specifier)
  const installed = yield* npm.add(root).pipe(Effect.mapError((cause) => new LoadError({ package: specifier, cause })))
  const entrypoint = yield* Effect.try({
    try: () => resolveModule(specifier, installed.directory),
    catch: (cause) => new LoadError({ package: specifier, cause }),
  })
  return yield* importPackage(specifier, entrypoint)
})

const settingsKeys = Struct.keys(Provider.Settings.schema.fields)
const providerOnlyKeys = settingsKeys.filter((key) => !(key in Model.Settings.schema.fields))

/** The provider options: every settings key OpenCode doesn't read itself. */
export function nativeSettings(settings: Settings) {
  return Struct.omit(settings, settingsKeys)
}

/** Settings a model inherits from its provider. */
export function modelSettings(settings: Settings | undefined) {
  return settings && Struct.omit(settings, providerOnlyKeys)
}

const decodeTimeout = Schema.decodeUnknownOption(HttpTimeout)

/** Applied to `headerTimeout` when provider settings leave it unset or invalid. */
export const DEFAULT_TIMEOUT_MS = 300_000

/**
 * Applied to `chunkTimeout` when provider settings leave it unset or invalid. Some providers, such as DeepSeek, have
 * specifically asked clients to allow at least 15 minutes, because their models can stream nothing for minutes while
 * they reason.
 */
export const DEFAULT_CHUNK_TIMEOUT_MS = 900_000

/** One timeout setting without a default; invalid values are dropped. */
export function timeout(value: unknown) {
  return Option.getOrUndefined(decodeTimeout(value))
}

/** Request timeouts from provider settings, resolved for every route. `timeout` has no default. */
export function timeouts(settings: Readonly<Record<string, unknown>>) {
  return {
    timeout: timeout(settings.timeout),
    headerTimeout: timeout(settings.headerTimeout) ?? DEFAULT_TIMEOUT_MS,
    chunkTimeout: timeout(settings.chunkTimeout) ?? DEFAULT_CHUNK_TIMEOUT_MS,
  }
}

const decodeEncoding = Schema.decodeUnknownOption(Provider.Encoding)

/** Request body encoding from provider or model settings; invalid values are dropped. */
export function encoding(settings: Readonly<Record<string, unknown>>) {
  return Option.getOrUndefined(decodeEncoding(settings.encoding))
}

export function mergeOverlay(
  base: Readonly<Record<string, unknown>> | undefined,
  overlay: Readonly<Record<string, unknown>> | undefined,
): Record<string, Json> | undefined {
  if (base === undefined) return overlay && decodeJsonRecord({ ...overlay })
  if (overlay === undefined) return decodeJsonRecord({ ...base })
  return decodeJsonRecord(mergeRecord(base, overlay))
}

function mergeRecord(
  base: Readonly<Record<string, unknown>>,
  overlay: Readonly<Record<string, unknown>>,
): Record<string, unknown> {
  return Object.fromEntries(
    new Set([...Object.keys(base), ...Object.keys(overlay)]).values().map((key): [string, unknown] => {
      const left = base[key]
      const right = overlay[key]
      if (right === undefined) return [key, left]
      if (isRecord(left) && isRecord(right)) return [key, mergeRecord(left, right)]
      return [key, right]
    }),
  )
}

export function mergeHeaders(
  base: Readonly<Record<string, string>> | undefined,
  overlay: Readonly<Record<string, string>> | undefined,
) {
  if (base === undefined) return overlay && { ...overlay }
  if (overlay === undefined) return { ...base }
  return Object.fromEntries(
    [...Object.entries(base), ...Object.entries(overlay)]
      .reduce((result, entry) => {
        result.set(entry[0].toLowerCase(), entry)
        return result
      }, new Map<string, [string, string]>())
      .values(),
  )
}

export const Request = Provider.Request
export type Request = Provider.Request

export const Compaction = Provider.Compaction
export type Compaction = Provider.Compaction

export const Cache = Provider.Cache
export type Cache = Provider.Cache

export const Transport = Provider.Transport
export type Transport = Provider.Transport

export const Settings = Provider.Settings
export type Settings = Provider.Settings

export const Info = Provider.Info
export type Info = Provider.Info

export type MutableInfo = DeepMutable<Info>

export { Event } from "@ainvil/schema/provider"

/** Provider metadata owns its drafts; model definitions remain immutable inputs. */
export type Definition = {
  readonly provider: Info
  readonly models: ReadonlyMap<Model.ID, Model.Info>
  readonly sourceConnection?: IntegrationConnection.Info
}

export interface Editor {
  readonly list: () => readonly Definition[]
  readonly get: (providerID: ID) => Definition | undefined
  readonly add: (definition: {
    readonly info: Info
    readonly models: readonly Model.Info[]
    readonly sourceConnection?: IntegrationConnection.Info
  }) => void
  readonly update: (providerID: ID, update: (provider: MutableInfo) => void) => void
  readonly remove: (providerID: ID) => void
  readonly models: {
    readonly set: (providerID: ID, models: readonly Model.Info[]) => void
    readonly update: (providerID: ID, modelID: Model.ID, update: (model: DeepMutable<Model.Info>) => void) => void
    readonly remove: (providerID: ID, modelID: Model.ID) => void
  }
}

export interface Snapshot {
  readonly records: ReadonlyMap<ID, Definition>
  readonly available: readonly Definition[]
  readonly providers: readonly Info[]
}

export interface Interface extends State.Transformable<Editor> {
  readonly get: (providerID: ID) => Effect.Effect<Info | undefined>
  readonly all: () => Effect.Effect<readonly Info[]>
  readonly available: () => Effect.Effect<readonly Info[]>
  /** Internal definition/access snapshot; raw model inventories never cross the HTTP API. */
  readonly snapshot: () => Effect.Effect<Snapshot>
}

export class Service extends Context.Service<Service, Interface>()("@ainvil/Provider") {}

// Every location references the same index for a shared immutable definition array.
const definitions = new WeakMap<readonly Model.Info[], Map<ID, ReadonlyMap<Model.ID, Model.Info>>>()
function index(providerID: ID, models: readonly Model.Info[]) {
  const indexes = definitions.get(models) ?? new Map<ID, ReadonlyMap<Model.ID, Model.Info>>()
  const cached = indexes.get(providerID)
  if (cached) return cached
  // Model shares these definitions without copying, so a foreign definition takes this provider's identity here.
  const result = freeze(
    new Map(models.map((model) => [model.id, model.providerID === providerID ? model : { ...model, providerID }])),
    true,
  )
  indexes.set(providerID, result)
  definitions.set(models, indexes)
  return result
}

const layer = Layer.effect(
  Service,
  Effect.gen(function* () {
    const bus = yield* Bus.Service
    const integrations = yield* Integration.Service
    const location = yield* Location.Service
    const state = State.create<
      Map<
        ID,
        {
          provider: MutableInfo
          models: ReadonlyMap<Model.ID, Model.Info>
          sourceConnection?: IntegrationConnection.Info
        }
      >,
      Editor
    >({
      name: "provider",
      initial: () => new Map(),
      editor: (records) => {
        const maps = new WeakSet<ReadonlyMap<Model.ID, Model.Info>>()
        const models = new WeakSet<Model.Info>()
        const entry = (id: ID) => {
          const current = records.get(id)
          if (current) return current
          const added = { provider: Info.empty(id) as MutableInfo, models: new Map<Model.ID, Model.Info>() }
          records.set(id, added)
          maps.add(added.models)
          return added
        }
        const writable = (id: ID) => {
          const record = entry(id)
          if (maps.has(record.models)) return record.models as Map<Model.ID, Model.Info>
          const owned = new Map(record.models)
          record.models = owned
          maps.add(owned)
          return owned
        }
        return {
          list: () => Array.from(records.values()),
          get: (id) => records.get(id),
          add: (definition) => {
            records.set(definition.info.id, {
              provider: structuredClone(definition.info) as MutableInfo,
              models: index(definition.info.id, definition.models),
              sourceConnection: definition.sourceConnection,
            })
          },
          update: (id, update) => {
            const record = entry(id)
            update(record.provider)
            record.provider.id = id
            AISDKNative.rewrite(record.provider, {
              specifier: record.provider.package,
              providerID: id,
              canonical: record.provider.canonical,
            })
          },
          remove: (id) => {
            records.delete(id)
          },
          models: {
            set: (id, values) => {
              entry(id).models = index(id, values)
            },
            update: (providerID, modelID, update) => {
              const record = entry(providerID)
              const target = writable(providerID)
              const current = target.get(modelID)
              const model = // An earlier add/set can publish and freeze an owned model within this fold.
                (
                  current && models.has(current) && !Object.isFrozen(current)
                    ? current
                    : current
                      ? structuredClone(current)
                      : Model.Info.default(providerID, modelID)
                ) as DeepMutable<Model.Info>
              update(model)
              model.id = modelID
              model.providerID = providerID
              AISDKNative.rewrite(model, {
                specifier: model.package ?? record.provider.package,
                providerID,
                canonical: model.canonical ?? record.provider.canonical,
                modelID: model.modelID ?? modelID,
              })
              models.add(model)
              target.set(modelID, model)
            },
            remove: (providerID, modelID) => {
              if (!records.has(providerID)) return
              writable(providerID).delete(modelID)
            },
          },
        }
      },
      notify: () => notify,
    })
    // Registrations may outlive a borrowed service layer; their later disposal must
    // not query dependencies that have already closed.
    yield* Effect.addFinalizer(() => State.shutdown(state.reload()))
    let cached: { records: Snapshot["records"]; value: Snapshot } | undefined
    const snapshot = Effect.fn("Provider.snapshot")(function* () {
      while (true) {
        const revision = integrations.revision()
        const records = state.get()
        // Connection presence decides availability; resolving OAuth tokens belongs to execution.
        const connections = yield* integrations.list()
        // Either fold can disable a plugin that also contributed to the other domain.
        if (revision !== integrations.revision() || records !== state.get()) continue
        const byID = new Map(connections.map((integration) => [integration.id, integration]))
        const available = Array.from(records.values()).filter((record) => {
          if (record.provider.activation === "disabled") return false
          const integration = byID.get(record.provider.integrationID ?? Integration.ID.make(record.provider.id))
          // Never combine the previous account's discovered endpoints/models with a new connection.
          if (
            record.sourceConnection &&
            IntegrationConnection.key(record.sourceConnection) !==
              IntegrationConnection.key(integration?.connections[0])
          )
            return false
          if (record.provider.activation === "enabled") return true
          if (integration?.connections.length) return true
          return record.provider.integrationID === undefined && !integration
        })
        // A credential change that leaves the same definitions available is not a catalog change.
        if (
          cached?.records === records &&
          cached.value.available.length === available.length &&
          cached.value.available.every((record, index) => record === available[index])
        )
          return cached.value
        const value = freeze({ records, available, providers: available.map((record) => record.provider) }, true)
        cached = { records, value }
        return value
      }
    })
    let published: Snapshot | undefined
    const notify: Effect.Effect<void> = Effect.gen(function* () {
      const value = yield* snapshot()
      if (value === published) return
      published = value
      yield* bus.publish(
        Provider.Event.Updated,
        {},
        {
          location: { directory: location.directory, workspaceID: location.workspaceID },
        },
      )
    })
    yield* bus.subscribe([Integration.Event.Updated, Credential.Event.Switched]).pipe(
      Stream.runForEach(() => notify),
      Effect.forkScoped({ startImmediately: true }),
    )
    return Service.of({
      transform: state.transform,
      reload: state.reload,
      get: Effect.fn("Provider.get")((id) => Effect.sync(() => freeze(state.get().get(id)?.provider, true))),
      all: Effect.fn("Provider.all")(() =>
        Effect.sync(() => Array.from(state.get().values(), (record) => freeze(record.provider, true))),
      ),
      available: Effect.fn("Provider.available")(() => snapshot().pipe(Effect.map((value) => value.providers))),
      snapshot,
    })
  }),
)

export const node = makeLocationNode({ service: Service, layer, deps: [Bus.node, Integration.node, Location.node] })

const importPackage = Effect.fn("Provider.importPackage")(function* (
  specifier: string,
  entrypoint: string,
  load = () => importModule(entrypoint),
) {
  const module = yield* Effect.tryPromise({
    try: () => {
      const existing = packages.get(entrypoint)
      if (existing) return existing
      const loaded = load()
      packages.set(entrypoint, loaded)
      return loaded
    },
    catch: (cause) => new LoadError({ package: specifier, cause }),
  })
  if (typeof module !== "object" || module === null || typeof (module as { model?: unknown }).model !== "function") {
    return yield* new LoadError({
      package: specifier,
      cause: new Error(`Provider package ${specifier} does not export model(modelID, settings)`),
    })
  }
  return module as ProviderPackage.Definition
})
