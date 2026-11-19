import { intro } from "@clack/prompts"
import { Effect } from "effect"
import { Commands } from "../commands"
import { Runtime } from "../../framework/runtime"
import { handlePromptErrors } from "../../ui/prompt"

// Every update source the updater knows (opencode.ai, upstream's npm package, Homebrew formula and WinGet id)
// installs upstream opencode, which would replace the fork. The command stays so scripts get a clear answer.
export default Runtime.handler(
  Commands.commands.upgrade,
  Effect.fn("cli.upgrade")(function* () {
    intro("Upgrade")
    return yield* Effect.fail(
      new Error(
        "Ainvil has no update service. Install a newer release from https://github.com/mayurchoubey/ainvil/releases.",
      ),
    )
  }, handlePromptErrors),
)
