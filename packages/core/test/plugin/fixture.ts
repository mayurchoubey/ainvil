import { Agent } from "@ainvil/core/agent"
import { Artifact } from "@ainvil/core/artifact"
import { AISDK } from "@ainvil/core/aisdk"
import { Command } from "@ainvil/core/command"
import { Config } from "@ainvil/core/config"
import { Credential } from "@ainvil/core/credential"
import { Database } from "@ainvil/core/database/database"
import { Environment } from "@ainvil/core/environment/index"
import { FileAccess } from "@ainvil/core/file-access"
import { LayerNodePlatform } from "@ainvil/util/effect/app-node-platform"
import { AppProcess } from "@ainvil/util/process"
import { LayerNode } from "@ainvil/util/effect/layer-node"
import { Bus } from "@ainvil/core/bus"
import { FileSystem } from "@ainvil/core/filesystem"
import { FSUtil } from "@ainvil/util/fs-util"
import { Global } from "@ainvil/util/global"
import { Form } from "@ainvil/core/form"
import { Generate } from "@ainvil/core/generate"
import { InstructionDiscovery } from "@ainvil/core/instruction-discovery"
import { Integration } from "@ainvil/core/integration"
import { Job } from "@ainvil/core/job"
import { KV } from "@ainvil/core/kv"
import { Location } from "@ainvil/core/location"
import { Mcp } from "@ainvil/core/mcp/index"
import { Model } from "@ainvil/core/model"
import { Npm } from "@ainvil/util/npm"
import { Plugin } from "@ainvil/core/plugin"
import { PluginHooks } from "@ainvil/core/plugin/hooks"
import { Provider } from "@ainvil/core/provider"
import { Session } from "@ainvil/core/session"
import { SharedCache } from "@ainvil/core/shared-cache"
import { InstructionEntry } from "@ainvil/core/session/instruction-entry"
import { PersistentPty } from "@ainvil/core/persistent-pty"
import { LocationServiceMap } from "@ainvil/core/location-service-map"
import { AppNodeBuilder } from "@ainvil/core/effect/app-node-builder"
import { Permission } from "@ainvil/core/permission"
import { Reference } from "@ainvil/core/reference"
import { Rpc } from "@ainvil/core/rpc"
import { Skill } from "@ainvil/core/skill"
import { SkillDiscovery } from "@ainvil/core/skill/discovery"
import { Watcher } from "@ainvil/core/filesystem/watcher"
import { Tool } from "@ainvil/core/tool"
import { Vcs } from "@ainvil/core/vcs"
import { WebSearch } from "@ainvil/core/websearch"
import { Worktree } from "@ainvil/core/worktree"
import { WorktreeStrategies } from "@ainvil/core/worktree/strategies"
import { Effect, Layer } from "effect"
import { tempLocationLayer } from "../fixture/location"
import { emptyMcpLayer } from "../fixture/mcp"
import { offlineModels } from "../fixture/models"

const npmLayer = Layer.succeed(
  Npm.Service,
  Npm.Service.of({
    add: (name) => Effect.succeed({ directory: "", name }),
    resolve: (name) => Effect.succeed({ directory: "", name }),
    check: () => Effect.succeed(false),
    update: (name) => Effect.succeed({ directory: "", name }),
    which: () => Effect.undefined,
  }),
)

const generateLayer = Layer.succeed(
  Generate.Service,
  Generate.Service.of({
    text: () => Effect.succeed(""),
    image: () => Effect.die("unused"),
    decisions: () => Effect.die("unused"),
  }),
)

const configLayer = Config.testLayer()

const permissionLayer = Layer.succeed(
  Permission.Service,
  Permission.Service.of({
    close: Effect.void,
    ask: (input) => Effect.succeed({ id: input.id ?? Permission.ID.create(), effect: "ask" }),
    assert: () => Effect.void,
    assertNotDenied: () => Effect.void,
    allows: () => Effect.succeed(false),
    reply: () => Effect.void,
    get: () => Effect.succeed(undefined),
    forSession: () => Effect.succeed([]),
    list: () => Effect.succeed([]),
  }),
)

export const makePluginTestLayer = (permission = permissionLayer, generate = generateLayer) =>
  AppNodeBuilder.build(
    LayerNode.group([
      AppProcess.node,
      FileSystem.node,
      FSUtil.node,
      Location.node,
      Npm.node,
      Credential.node,
      Config.node,
      Database.node,
      Environment.node,
      FileAccess.node,
      Global.node,
      Bus.node,
      Form.node,
      Generate.node,
      LayerNodePlatform.httpClient,
      Plugin.node,
      Agent.node,
      Artifact.node,
      AISDK.node,
      Provider.node,
      Model.node,
      Command.node,
      InstructionDiscovery.node,
      Integration.node,
      Job.node,
      KV.node,
      Mcp.node,
      Session.node,
      SharedCache.node,
      InstructionEntry.node,
      PersistentPty.node,
      LocationServiceMap.node,
      Permission.node,
      PluginHooks.node,
      Reference.node,
      Rpc.node,
      Skill.node,
      SkillDiscovery.node,
      Tool.node,
      Vcs.node,
      Watcher.node,
      WebSearch.node,
      Worktree.node,
      WorktreeStrategies.node,
    ]),
    [
      Location.node.replace(tempLocationLayer),
      Npm.node.replace(npmLayer),
      Config.node.replace(configLayer),
      Mcp.node.replace(emptyMcpLayer),
      Generate.node.replace(generate),
      Permission.node.replace(permission),
      offlineModels,
    ],
  ).pipe(Layer.provideMerge(configLayer))

export const PluginTestLayer = makePluginTestLayer()
