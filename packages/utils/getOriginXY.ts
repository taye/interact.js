import { rectToXY, resolveRectLike } from './rect'

export default function (target, element, action?) {
  const actionOptions = target.options[action]
  const actionOrigin = actionOptions && actionOptions.origin
  const origin = actionOrigin || target.options.origin

  const originRect = resolveRectLike(origin, target, element, [target && element])

  return rectToXY(originRect) || { x: 0, y: 0 }
}
