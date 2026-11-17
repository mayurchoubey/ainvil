import { createReactiveTimelineProjection } from "@ainvil/session-ui/timeline/projection"

export { reuseTimelineRows } from "@ainvil/session-ui/timeline/projection"

export function createTimelineProjection(input: Parameters<typeof createReactiveTimelineProjection>[0]) {
  return createReactiveTimelineProjection(input)
}
