import * as Interact from '@interactjs/types/index'

import { rectToXY, resolveRectLike } from './rect'

export default function (
  target: Interact.HasGetRect & { options: Interact.PerActionDefaults },
  element: Node,
  actionName?: Interact.ActionName,
) {
  const actionOptions = (target.options as any)[actionName]
  const actionOrigin = actionOptions && actionOptions.origin
  const origin = actionOrigin || target.options.origin

  const originRect = resolveRectLike(origin, target, element, [target && element])

  return rectToXY(originRect) || { x: 0, y: 0 }
}
