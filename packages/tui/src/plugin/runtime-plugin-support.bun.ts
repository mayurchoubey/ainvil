import { ensurePluginRuntime, provides } from "@ainvil/plugin/runtime"
import { Plugin, PluginContextProvider, usePlugin } from "@ainvil/plugin/tui"
import { ensureRuntimePluginSupport } from "@opentui/solid/runtime-plugin-support/configure"

ensurePluginRuntime()
ensureRuntimePluginSupport({
  additional: {
    "@ainvil/plugin/tui": { Plugin, PluginContextProvider, usePlugin },
  },
  preserve: provides,
})
