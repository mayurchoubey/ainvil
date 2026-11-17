import { R2Sql } from "@ainvil/stats-core/r2-sql"
import { layer } from "@ainvil/stats-core/runtime"
import { syncStats } from "@ainvil/stats-core/stat-sync"
import { Effect, Layer } from "effect"

// Runs one sync pass in this process, for local use. Deployed stages run the
// same steps in the StatsSyncWorkflow.
await Effect.runPromise(
  syncStats({ history: process.argv.includes("--history") }).pipe(Effect.provide(Layer.mergeAll(layer, R2Sql.layer))),
)
