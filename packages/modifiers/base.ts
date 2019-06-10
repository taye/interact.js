import { Scope } from '@interactjs/core/scope'
import extend from '@interactjs/utils/extend'

declare module '@interactjs/core/scope' {
  interface Scope {
    modifiers?: any
  }
}

declare module '@interactjs/core/Interaction' {
  interface Interaction {
    modifiers?: {
      states: any[]
      offsets: any
      startOffset: any
      startDelta: Interact.Point
      result?: {
        delta: {
          x: number
          y: number
        }
        rectDelta: {
          left: number
          right: number
          top: number
          bottom: number
        }
        coords: Interact.Point
        changed: boolean
      },
      endPrevented: boolean
    }
  }
}

declare module '@interactjs/core/defaultOptions' {
  interface PerActionDefaults {
    modifiers?: Array<ReturnType<typeof makeModifier>>
  }
}

function install (scope: Scope) {
  const {
    interactions,
  } = scope

  scope.defaults.perAction.modifiers = []
  scope.modifiers = {}

  interactions.signals.on('new', ({ interaction }) => {
    interaction.modifiers = {
      startOffset: { left: 0, right: 0, top: 0, bottom: 0 },
      offsets: {},
      states: null,
      result: null,
      endPrevented: false,
      startDelta: null,
    }
  })

  interactions.signals.on('before-action-start', (arg) => {
    start(arg as any, arg.interaction.coords.start.page, scope.modifiers)
  })

  interactions.signals.on('action-resume', (arg) => {
    stop(arg as Required<Interact.SignalArg>)
    start(arg as Required<Interact.SignalArg>, arg.interaction.coords.cur.page, scope.modifiers)
    beforeMove(arg as Required<Interact.SignalArg>)
  })

  interactions.signals.on('after-action-move', restoreCoords as any)
  interactions.signals.on('before-action-move', beforeMove)

  interactions.signals.on('before-action-start', setCoords)
  interactions.signals.on('after-action-start', restoreCoords as any)

  interactions.signals.on('before-action-end', beforeEnd)
  interactions.signals.on('stop', stop)
}

function start (
  { interaction, phase }: Interact.SignalArg,
  pageCoords: Interact.Point,
  registeredModifiers,
) {
  const { interactable, element } = interaction
  const modifierList = getModifierList(interaction, registeredModifiers)
  const states = prepareStates(modifierList)

  const rect = extend({}, interaction.rect)

  if (!('width'  in rect)) { rect.width  = rect.right  - rect.left }
  if (!('height' in rect)) { rect.height = rect.bottom - rect.top  }

  const startOffset = getRectOffset(rect, pageCoords)

  interaction.modifiers.startOffset = startOffset
  interaction.modifiers.startDelta = { x: 0, y: 0 }

  const arg: Partial<Interact.SignalArg> = {
    interaction,
    interactable,
    element,
    pageCoords,
    phase,
    rect,
    startOffset,
    states,
    preEnd: false,
    requireEndOnly: false,
  }

  interaction.modifiers.states = states
  interaction.modifiers.result = null
  startAll(arg)

  arg.pageCoords = extend({}, interaction.coords.start.page)

  const result = interaction.modifiers.result = setAll(arg)

  return result
}

export function startAll (arg) {
  for (const state of arg.states) {
    if (state.methods.start) {
      arg.state = state
      state.methods.start(arg)
    }
  }
}

export function setAll (arg: Partial<Interact.SignalArg>) {
  const {
    interaction,
    modifiersState = interaction.modifiers,
    prevCoords = modifiersState.result
      ? modifiersState.result.coords
      : interaction.coords.prev.page,
    phase,
    preEnd,
    requireEndOnly,
    rect,
    skipModifiers,
  } = arg

  const states = skipModifiers
    ? arg.states.slice(skipModifiers)
    : arg.states

  arg.coords = extend({}, arg.pageCoords)
  arg.rect = extend({}, rect)

  const result = {
    delta: { x: 0, y: 0 },
    rectDelta: {
      left  : 0,
      right : 0,
      top   : 0,
      bottom: 0,
    },
    coords: arg.coords,
    changed: true,
  }

  for (const state of states) {
    const { options } = state

    if (!state.methods.set ||
      !shouldDo(options, preEnd, requireEndOnly, phase)) { continue }

    arg.state = state
    state.methods.set(arg)
  }

  result.delta.x = arg.coords.x - arg.pageCoords.x
  result.delta.y = arg.coords.y - arg.pageCoords.y

  let rectChanged = false

  if (rect) {
    result.rectDelta.left   = arg.rect.left - rect.left
    result.rectDelta.right  = arg.rect.right - rect.right
    result.rectDelta.top    = arg.rect.top - rect.top
    result.rectDelta.bottom = arg.rect.bottom - rect.bottom

    rectChanged = result.rectDelta.left !== 0 ||
      result.rectDelta.right !== 0 ||
      result.rectDelta.top !== 0 ||
      result.rectDelta.bottom !== 0
  }

  result.changed = prevCoords.x !== result.coords.x ||
    prevCoords.y !== result.coords.y ||
    rectChanged

  return result
}

function beforeMove (arg: Interact.SignalArg): void | false {
  const { interaction, phase, preEnd, skipModifiers } = arg
  const { interactable, element } = interaction
  const modifierResult = setAll(
    {
      interaction,
      interactable,
      element,
      preEnd,
      phase,
      pageCoords: interaction.coords.cur.page,
      rect: interaction.rect,
      states: interaction.modifiers.states,
      requireEndOnly: false,
      skipModifiers,
    })

  interaction.modifiers.result = modifierResult

  // don't fire an action move if a modifier would keep the event in the same
  // cordinates as before
  if (!modifierResult.changed && interaction.interacting()) {
    return false
  }

  setCoords(arg)
}

function beforeEnd (arg): void | false {
  const { interaction, event, noPreEnd } = arg
  const states = interaction.modifiers.states

  if (noPreEnd || !states || !states.length) {
    return
  }

  let didPreEnd = false

  for (const state of states) {
    arg.state = state
    const { options, methods } = state

    const endResult = methods.beforeEnd && methods.beforeEnd(arg)

    if (endResult === false) {
      interaction.modifiers.endPrevented = true
      return false
    }

    // if the endOnly option is true for any modifier
    if (!didPreEnd && shouldDo(options, true, true)) {
      // fire a move event at the modified coordinates
      interaction.move({ event, preEnd: true })
      didPreEnd = true
    }
  }
}

function stop (arg: Interact.SignalArg) {
  const { interaction } = arg
  const states = interaction.modifiers.states

  if (!states || !states.length) {
    return
  }

  const modifierArg = extend({
    states,
    interactable: interaction.interactable,
    element: interaction.element,
  }, arg)

  restoreCoords(arg)

  for (const state of states) {
    modifierArg.state = state

    if (state.methods.stop) { state.methods.stop(modifierArg) }
  }

  arg.interaction.modifiers.states = null
  arg.interaction.modifiers.endPrevented = false
}

function getModifierList (interaction, registeredModifiers) {
  const actionOptions = interaction.interactable.options[interaction.prepared.name]
  const actionModifiers = actionOptions.modifiers

  if (actionModifiers && actionModifiers.length) {
    return actionModifiers
      .filter((modifier) => !modifier.options || modifier.options.enabled !== false)
      .map((modifier) => {
        if (!modifier.methods && modifier.type) {
          return registeredModifiers[modifier.type](modifier)
        }

        return modifier
      })
  }

  return ['snap', 'snapSize', 'snapEdges', 'restrict', 'restrictEdges', 'restrictSize']
    .map((type) => {
      const options = actionOptions[type]

      return options && options.enabled && {
        options,
        methods: options._methods,
      }
    })
    .filter((m) => !!m)
}

export function prepareStates (modifierList) {
  const states = []

  for (let index = 0; index < modifierList.length; index++) {
    const { options, methods, name } = modifierList[index]

    if (options && options.enabled === false) { continue }

    const state = {
      options,
      methods,
      index,
      name,
    }

    states.push(state)
  }

  return states
}

function setCoords (arg) {
  const { interaction, phase } = arg
  const curCoords = arg.curCoords || interaction.coords.cur
  const startCoords = arg.startCoords || interaction.coords.start
  const { result, startDelta } = interaction.modifiers
  const curDelta = result.delta

  if (phase === 'start') {
    extend(interaction.modifiers.startDelta, result.delta)
  }

  for (const [coordsSet, delta] of [[startCoords, startDelta], [curCoords, curDelta]]) {
    coordsSet.page.x   += delta.x
    coordsSet.page.y   += delta.y
    coordsSet.client.x += delta.x
    coordsSet.client.y += delta.y
  }

  const { rectDelta } = interaction.modifiers.result
  const rect = arg.rect || interaction.rect

  rect.left   += rectDelta.left
  rect.right  += rectDelta.right
  rect.top    += rectDelta.top
  rect.bottom += rectDelta.bottom

  rect.width = rect.right - rect.left
  rect.height = rect.bottom - rect.top
}

function restoreCoords ({ interaction: { coords, rect, modifiers } }: Interact.SignalArg) {
  if (!modifiers.result) { return }

  const { startDelta } = modifiers
  const { delta: curDelta, rectDelta } = modifiers.result

  const coordsAndDeltas = [
    [coords.start, startDelta],
    [coords.cur, curDelta],
  ]

  for (const [coordsSet, delta] of coordsAndDeltas as any) {
    coordsSet.page.x -= delta.x
    coordsSet.page.y -= delta.y
    coordsSet.client.x -= delta.x
    coordsSet.client.y -= delta.y
  }

  rect.left -= rectDelta.left
  rect.right -= rectDelta.right
  rect.top -= rectDelta.top
  rect.bottom -= rectDelta.bottom
}

function shouldDo (options, preEnd?: boolean, requireEndOnly?: boolean, phase?: string) {
  return options
    ? options.enabled !== false &&
      (preEnd || !options.endOnly) &&
      (!requireEndOnly || options.endOnly || options.alwaysOnEnd) &&
      (options.setStart || phase !== 'start')
    : !requireEndOnly
}

function getRectOffset (rect, coords) {
  return rect
    ? {
      left  : coords.x - rect.left,
      top   : coords.y - rect.top,
      right : rect.right  - coords.x,
      bottom: rect.bottom - coords.y,
    }
    : {
      left  : 0,
      top   : 0,
      right : 0,
      bottom: 0,
    }
}

function makeModifier<
  Options extends { enabled?: boolean, [key: string]: any }
> (module: { defaults: Options, [key: string]: any }, name?: string) {
  const { defaults } = module
  const methods = {
    start: module.start,
    set: module.set,
    beforeEnd: module.beforeEnd,
    stop: module.stop,
  }

  const modifier = (options?: Partial<Options>) => {
    options = options || {}

    options.enabled = options.enabled !== false

    // add missing defaults to options
    for (const prop in defaults) {
      if (!(prop in options)) {
        options[prop] = defaults[prop]
      }
    }

    return { options, methods, name }
  }

  if (typeof name === 'string') {
    // for backwrads compatibility
    modifier._defaults = defaults
    modifier._methods = methods
  }

  return modifier
}

export default {
  id: 'modifiers/base',
  install,
  startAll,
  setAll,
  prepareStates,
  start,
  beforeMove,
  beforeEnd,
  stop,
  shouldDo,
  getModifierList,
  getRectOffset,
  makeModifier,
} as Interact.Plugin

export {
  makeModifier,
}
