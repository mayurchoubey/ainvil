import type { FileSystem } from "@ainvil/core/filesystem"
import { Bus } from "@ainvil/core/bus"
import { Image } from "@ainvil/core/image"
import { LocationServiceMap } from "@ainvil/core/location-service-map"
import type { LocationServices } from "@ainvil/core/location-services"
import { Plugin } from "@ainvil/core/plugin"
import { PluginHooks } from "@ainvil/core/plugin/hooks"
import { Skill } from "@ainvil/core/skill"
import type { Location } from "@ainvil/schema/location"
import { makeGlobalNode } from "@ainvil/util/effect/app-node"
import { LayerNode } from "@ainvil/util/effect/layer-node"
import { Effect, Layer, LayerMap } from "effect"

// Plain-prompt unit fixtures use virtual directories.
export const promptLocationNode = makeGlobalNode({
  service: LocationServiceMap.Service,
  layer: Layer.effect(
    LocationServiceMap.Service,
    Effect.gen(function* () {
      const bus = yield* Bus.Service
      return yield* LayerMap.make(
        (_ref: Location.Ref) =>
          LayerNode.compile(LayerNode.group([PluginHooks.node, Image.node, Skill.node, Plugin.node]), {
            replacements: [
              Bus.node.replace(Layer.succeed(Bus.Service, bus)),
              Plugin.node.replace(Layer.mock(Plugin.Service, { awaitActivation: Effect.void })),
            ],
          }) as unknown as Layer.Layer<LocationServices, FileSystem.DirectoryNotFoundError>,
      )
    }),
  ),
  deps: [Bus.node],
})
