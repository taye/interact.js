import type { PerActionDefaults } from '@interactjs/core/options'
import type { ActionName, HasGetRect } from '@interactjs/core/types'

import { rectToXY, resolveRectLike } from './rect'

export default function getOriginXY(
  target: HasGetRect & { options: PerActionDefaults },
  element: Node,
  actionName?: ActionName,
) {
  const actionOptions = actionName && (target.options as any)[actionName]
  const actionOrigin = actionOptions && actionOptions.origin
  const origin = actionOrigin || target.options.origin

  const originRect = resolveRectLike(origin, target, element, [target && element])

  return rectToXY(originRect) || { x: 0, y: 0 }
}
