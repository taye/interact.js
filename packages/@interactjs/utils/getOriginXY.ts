import type { PerActionDefaults } from '@interactjs/core/options'
import type { ActionName } from '@interactjs/core/scope'
import type { HasGetRect } from '@interactjs/types/index'

import { rectToXY, resolveRectLike } from './rect'

export default function (
  target: HasGetRect & { options: PerActionDefaults },
  element: Node,
  actionName?: ActionName,
) {
  const actionOptions = (target.options as any)[actionName]
  const actionOrigin = actionOptions && actionOptions.origin
  const origin = actionOrigin || target.options.origin

  const originRect = resolveRectLike(origin, target, element, [target && element])

  return rectToXY(originRect) || { x: 0, y: 0 }
}
