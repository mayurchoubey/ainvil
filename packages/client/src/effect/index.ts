// TODO: Keep additional network capabilities inside Schema and Protocol as the client grows; /effect must never import
// Core or Server. Preserve these datatype exports so internal model reorganizations do not require caller migrations.
import type { Effect } from "effect"
import type { OpenCode } from "./client.js"

export * from "./generated/index"
export { OpenCode } from "./client.js"
export type {
  AgentApi,
  AppApi,
  CommandApi,
  ConfigApi,
  EventApi,
  IntegrationApi,
  ModelApi,
  PluginApi,
  ProviderApi,
  ReferenceApi,
  RpcApi,
  RpcClient,
  WebSearchApi,
  SessionApi,
  SkillApi,
} from "./api.js"
export { Agent } from "@ainvil/schema/agent"
export { Command } from "@ainvil/schema/command"
export { Config } from "@ainvil/schema/config"
export { Credential } from "@ainvil/schema/credential"
export { Event } from "@ainvil/schema/event"
export { EventLog } from "@ainvil/schema/event-log"
export { FileSystem } from "@ainvil/schema/filesystem"
export { Form } from "@ainvil/schema/form"
export { Integration } from "@ainvil/schema/integration"
export { Location } from "@ainvil/schema/location"
export { Model } from "@ainvil/schema/model"
export { Permission } from "@ainvil/schema/permission"
export { PermissionSaved } from "@ainvil/schema/permission-saved"
export { Project } from "@ainvil/schema/project"
export { Worktree } from "@ainvil/schema/worktree"
export { Vcs } from "@ainvil/schema/vcs"
export { Provider } from "@ainvil/schema/provider"
export { Pty } from "@ainvil/schema/pty"
export { Question } from "@ainvil/schema/question"
export { Reference } from "@ainvil/schema/reference"
export { WebSearch } from "@ainvil/schema/websearch"
export { AbsolutePath, RelativePath } from "@ainvil/schema/schema"
export { Session } from "@ainvil/schema/session"
export { SessionInbox } from "@ainvil/schema/session-inbox"
export { SessionMessage } from "@ainvil/schema/session-message"
export { Skill } from "@ainvil/schema/skill"
export { Prompt } from "@ainvil/schema/prompt"
export { PromptInput } from "@ainvil/schema/prompt-input"
export type { OpenCodeEvent } from "@ainvil/protocol/groups/event"
export type OpenCodeClient = Effect.Success<ReturnType<typeof OpenCode.make>>
