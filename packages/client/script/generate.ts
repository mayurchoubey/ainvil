import { NodeFileSystem } from "@effect/platform-node"
import { compile, emitEffectImported, emitEffectShape, emitPromise, write } from "@ainvil/httpapi-codegen"
import {
  ClientApi,
  clientNamespace,
  effectOmitEndpoints,
  groupNames,
  promiseOmitEndpoints,
} from "@ainvil/protocol/client"
import { Agent } from "@ainvil/schema/agent"
import { Artifact } from "@ainvil/schema/artifact"
import { Command } from "@ainvil/schema/command"
import { Config } from "@ainvil/schema/config"
import { Credential } from "@ainvil/schema/credential"
import { Event } from "@ainvil/schema/event"
import { EventLog } from "@ainvil/schema/event-log"
import { FileDiff } from "@ainvil/schema/file-diff"
import { FileSystem } from "@ainvil/schema/filesystem"
import { Form } from "@ainvil/schema/form"
import { Generate } from "@ainvil/schema/generate"
import { Instruction } from "@ainvil/schema/instruction"
import { InstructionEntry } from "@ainvil/schema/instruction-entry"
import { Integration } from "@ainvil/schema/integration"
import { Job } from "@ainvil/schema/job"
import { Location } from "@ainvil/schema/location"
import { Mcp } from "@ainvil/schema/mcp"
import { Model } from "@ainvil/schema/model"
import { Money } from "@ainvil/schema/money"
import { Permission } from "@ainvil/schema/permission"
import { PermissionSaved } from "@ainvil/schema/permission-saved"
import { Plugin } from "@ainvil/schema/plugin"
import { Project } from "@ainvil/schema/project"
import { Worktree } from "@ainvil/schema/worktree"
import { AgentAttachment, FileAttachment, Prompt, PromptMention } from "@ainvil/schema/prompt"
import { PromptInput } from "@ainvil/schema/prompt-input"
import { Provider } from "@ainvil/schema/provider"
import { Pty } from "@ainvil/schema/pty"
import { PtyTicket } from "@ainvil/schema/pty-ticket"
import { Question } from "@ainvil/schema/question"
import { Reference } from "@ainvil/schema/reference"
import { AbsolutePath, RelativePath } from "@ainvil/schema/schema"
import { Schedule } from "@ainvil/schema/schedule"
import { Session } from "@ainvil/schema/session"
import { SessionMessage } from "@ainvil/schema/session-message"
import { SessionInbox } from "@ainvil/schema/session-inbox"
import { Shell } from "@ainvil/schema/shell"
import { Skill } from "@ainvil/schema/skill"
import { Snapshot } from "@ainvil/schema/snapshot"
import { UsageLimits } from "@ainvil/schema/usage-limits"
import { Vcs } from "@ainvil/schema/vcs"
import { WebSearch } from "@ainvil/schema/websearch"
import { Workspace } from "@ainvil/schema/workspace"
import { Effect, Schema } from "effect"
import { fileURLToPath } from "url"

const promiseContract = compile(ClientApi, {
  groupNames,
  omitEndpoints: promiseOmitEndpoints,
  namespace: clientNamespace,
  aliases: true,
})
const effectContract = compile(ClientApi, {
  groupNames,
  omitEndpoints: effectOmitEndpoints,
  namespace: clientNamespace,
  aliases: true,
})
const effectTypeReferences = [
  ...namespaceTypes("Agent", "@ainvil/schema/agent", Agent),
  ...namespaceTypes("Artifact", "@ainvil/schema/artifact", Artifact),
  ...namespaceTypes("Command", "@ainvil/schema/command", Command),
  ...namespaceTypes("Config", "@ainvil/schema/config", Config),
  ...namespaceTypes("Credential", "@ainvil/schema/credential", Credential),
  ...namespaceTypes("Event", "@ainvil/schema/event", Event),
  ...namespaceTypes("EventLog", "@ainvil/schema/event-log", EventLog),
  ...namespaceTypes("FileDiff", "@ainvil/schema/file-diff", FileDiff),
  ...namespaceTypes("FileSystem", "@ainvil/schema/filesystem", FileSystem),
  ...namespaceTypes("Form", "@ainvil/schema/form", Form),
  ...namespaceTypes("Generate", "@ainvil/schema/generate", Generate),
  ...namespaceTypes("Instruction", "@ainvil/schema/instruction", Instruction),
  ...namespaceTypes("InstructionEntry", "@ainvil/schema/instruction-entry", InstructionEntry),
  ...namespaceTypes("Integration", "@ainvil/schema/integration", Integration),
  ...namespaceTypes("Job", "@ainvil/schema/job", Job),
  typeReference("Location.PublicRef", "@ainvil/schema/location", Location.PublicRef),
  typeReference("Location.PublicInfo", "@ainvil/schema/location", Location.PublicInfo),
  ...namespaceTypes("Mcp", "@ainvil/schema/mcp", Mcp),
  ...namespaceTypes("Model", "@ainvil/schema/model", Model),
  ...namespaceTypes("Money", "@ainvil/schema/money", Money),
  ...namespaceTypes("Permission", "@ainvil/schema/permission", Permission),
  ...namespaceTypes("PermissionSaved", "@ainvil/schema/permission-saved", PermissionSaved),
  ...namespaceTypes("Plugin", "@ainvil/schema/plugin", Plugin),
  ...namespaceTypes("Project", "@ainvil/schema/project", Project),
  ...namespaceTypes("Worktree", "@ainvil/schema/worktree", Worktree),
  ...namespaceTypes("PromptInput", "@ainvil/schema/prompt-input", PromptInput),
  ...namespaceTypes("Provider", "@ainvil/schema/provider", Provider),
  ...namespaceTypes("Pty", "@ainvil/schema/pty", Pty),
  ...namespaceTypes("PtyTicket", "@ainvil/schema/pty-ticket", PtyTicket),
  ...namespaceTypes("Question", "@ainvil/schema/question", Question),
  ...namespaceTypes("Reference", "@ainvil/schema/reference", Reference),
  ...namespaceTypes("Schedule", "@ainvil/schema/schedule", Schedule),
  ...namespaceTypes("Session", "@ainvil/schema/session", Session),
  ...namespaceTypes("SessionMessage", "@ainvil/schema/session-message", SessionMessage),
  ...namespaceTypes("SessionInbox", "@ainvil/schema/session-inbox", SessionInbox),
  ...namespaceTypes("Shell", "@ainvil/schema/shell", Shell),
  ...namespaceTypes("Skill", "@ainvil/schema/skill", Skill),
  ...namespaceTypes("Snapshot", "@ainvil/schema/snapshot", Snapshot),
  ...namespaceTypes("UsageLimits", "@ainvil/schema/usage-limits", UsageLimits),
  ...namespaceTypes("Vcs", "@ainvil/schema/vcs", Vcs),
  ...namespaceTypes("WebSearch", "@ainvil/schema/websearch", WebSearch),
  ...namespaceTypes("Workspace", "@ainvil/schema/workspace", Workspace),
  typeReference("Prompt", "@ainvil/schema/prompt", Prompt),
  typeReference("PromptMention", "@ainvil/schema/prompt", PromptMention),
  typeReference("FileAttachment", "@ainvil/schema/prompt", FileAttachment),
  typeReference("AgentAttachment", "@ainvil/schema/prompt", AgentAttachment),
  typeReference("AbsolutePath", "@ainvil/schema/schema", AbsolutePath),
  typeReference("RelativePath", "@ainvil/schema/schema", RelativePath),
]

await Effect.runPromise(
  Effect.all(
    [
      write(
        emitPromise(promiseContract, {
          mutableOutputs: true,
        }),
        fileURLToPath(new URL("../src/promise/generated", import.meta.url)),
      ),
      write(
        emitEffectImported(effectContract, {
          module: "../../contract",
          api: "ClientApi",
          shapeModule: "../api/api.js",
        }),
        fileURLToPath(new URL("../src/effect/generated", import.meta.url)),
      ),
      write(
        emitEffectShape(effectContract, {
          typeReferences: effectTypeReferences,
          outputTypes: {
            "event.subscribe": {
              name: "OpenCodeEvent",
              import: 'import type { OpenCodeEvent } from "@ainvil/protocol/groups/event"',
            },
          },
        }),
        fileURLToPath(new URL("../src/effect/api", import.meta.url)),
      ),
    ],
    { concurrency: 3, discard: true },
  ).pipe(Effect.provide(NodeFileSystem.layer)),
)

function namespaceTypes(namespace: string, module: string, values: object) {
  return Object.entries(values).flatMap(([name, schema]) =>
    Schema.isSchema(schema) ? [typeReference(`${namespace}.${name}`, module, schema)] : [],
  )
}

function typeReference(name: string, module: string, schema: Schema.Top) {
  return {
    schema,
    name,
    import: `import type { ${name.split(".")[0]} } from ${JSON.stringify(module)}`,
  }
}
