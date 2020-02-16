import extend from '@interactjs/utils/extend'
import * as rectUtils from '@interactjs/utils/rect'
import { Modifier, ModifierArg, ModifierState } from './base'

export interface ModificationResult {
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
  rect: Interact.FullRect
  eventProps: any[]
  changed: boolean
}

interface MethodArg {
  phase: Interact.EventPhase
  pageCoords?: Interact.Point
  rect?: Interact.FullRect
  prevCoords?: Interact.Point
  prevRect?: Interact.FullRect
  coords?: Interact.Point
  preEnd?: boolean
  requireEndOnly?: boolean
  skipModifiers?: number
}

export default class Modification {
  states: ModifierState[] = []
  startOffset: Interact.Rect = { left: 0, right: 0, top: 0, bottom: 0 }
  startDelta: Interact.Point = null
  result?: ModificationResult = null
  endResult?: Interact.Point = null
  phase: Interact.EventPhase
  edges: Interact.EdgeOptions

  constructor (private readonly interaction: Readonly<Interact.Interaction>) {}

  start (
    { phase }: MethodArg,
    pageCoords: Interact.Point,
    prevCoords: Interact.Point,
    prevRect: Interact.FullRect,
  ) {
    const { interaction } = this
    const modifierList = getModifierList(interaction)
    this.prepareStates(modifierList)

    this.edges = extend({}, interaction.edges)
    this.startOffset = getRectOffset(interaction.rect, pageCoords)
    this.startDelta = { x: 0, y: 0 }

    const arg: MethodArg = {
      phase,
      pageCoords,
      preEnd: false,
      requireEndOnly: false,
      prevCoords,
      prevRect,
    }

    this.result = null
    this.startAll(arg)

    const result = this.result = this.setAll(arg)

    return result
  }

  fillArg (arg: Partial<ModifierArg>) {
    const { interaction } = this
    arg.interaction = interaction
    arg.interactable = interaction.interactable
    arg.element = interaction.element
    arg.rect = arg.rect || interaction.rect
    arg.edges = this.edges
    arg.startOffset = this.startOffset
  }

  startAll (arg: MethodArg & Partial<ModifierArg>) {
    this.fillArg(arg)

    for (const state of this.states) {
      if (state.methods.start) {
        arg.state = state
        state.methods.start(arg as ModifierArg)
      }
    }
  }

  setAll (arg: MethodArg & Partial<ModifierArg>): ModificationResult {
    this.fillArg(arg)

    const {
      prevCoords,
      prevRect,
      phase,
      preEnd,
      requireEndOnly,
      skipModifiers,
      rect,
    } = arg

    arg.coords = extend({}, arg.pageCoords)
    arg.rect = extend({}, rect)

    const states = skipModifiers
      ? this.states.slice(skipModifiers)
      : this.states

    const result = {
      rect,
      delta: { x: 0, y: 0 },
      rectDelta: {
        left  : 0,
        right : 0,
        top   : 0,
        bottom: 0,
      },
      coords: arg.coords,
      eventProps: [],
      changed: true,
    }

    for (const state of states) {
      const { options } = state
      const lastModifierCoords = extend({}, arg.coords)
      let returnValue = null

      if (state.methods.set && this.shouldDo(options, preEnd, requireEndOnly, phase)) {
        arg.state = state
        returnValue = state.methods.set(arg as ModifierArg)

        rectUtils.addEdges(this.edges, arg.rect, { x: arg.coords.x - lastModifierCoords.x, y: arg.coords.y - lastModifierCoords.y })
      }

      result.eventProps.push(returnValue)
    }

    result.delta.x = arg.coords.x - arg.pageCoords.x
    result.delta.y = arg.coords.y - arg.pageCoords.y

    result.rectDelta.left   = arg.rect.left - rect.left
    result.rectDelta.right  = arg.rect.right - rect.right
    result.rectDelta.top    = arg.rect.top - rect.top
    result.rectDelta.bottom = arg.rect.bottom - rect.bottom

    const rectChanged = !prevRect || result.rect.left !== prevRect.left ||
      result.rect.right !== prevRect.right ||
      result.rect.top !== prevRect.top ||
      result.rect.bottom !== prevRect.bottom

    result.changed = !prevCoords || prevCoords.x !== result.coords.x ||
      prevCoords.y !== result.coords.y ||
      rectChanged

    return result
  }

  beforeMove (arg: Partial<Interact.DoPhaseArg> & {
    phase: Interact.EventPhase
    preEnd?: boolean
    skipModifiers?: number
    prevCoords?: Interact.Point
    prevRect?: Interact.FullRect
    modifiedCoords?: Interact.Point
  }): void | false {
    const { interaction } = this
    const { phase, preEnd } = arg

    const prevCoords = arg.prevCoords || (this.result
      ? this.result.coords
      : null)
    const prevRect = arg.prevRect || (this.result
      ? this.result.rect
      : null)

    const result = this.setAll({
      preEnd,
      phase,
      pageCoords: arg.modifiedCoords || interaction.coords.cur.page,
      prevCoords,
      prevRect,
      requireEndOnly: false,
    })

    this.result = result

    // don't fire an action move if a modifier would keep the event in the same
    // cordinates as before
    if (!result.changed && interaction.interacting()) {
      return false
    }

    if (arg.modifiedCoords) {
      const { page } = interaction.coords.cur
      const adjustment = {
        x: arg.modifiedCoords.x - page.x,
        y: arg.modifiedCoords.y - page.y,
      }

      result.coords.x += adjustment.x
      result.coords.y += adjustment.y
      result.delta.x += adjustment.x
      result.delta.y += adjustment.y
    }

    this.setCoords(arg)
  }

  beforeEnd (arg: Omit<Interact.DoPhaseArg, 'iEvent'> & { noPreEnd?: boolean, state?: ModifierState }): void | false {
    const { interaction, event, noPreEnd } = arg
    const states = this.states

    if (noPreEnd || !states || !states.length) {
      return
    }

    let didPreEnd = false

    for (const state of states) {
      arg.state = state
      const { options, methods } = state

      const endPosition = methods.beforeEnd && methods.beforeEnd(arg as unknown as ModifierArg)

      if (endPosition) {
        this.endResult = endPosition
        return false
      }

      // if the endOnly or alwaysOnEnd options are true for any modifier
      if (!didPreEnd && this.shouldDo(options, true, true)) {
        // fire a move event at the modified coordinates
        interaction.move({ event, preEnd: true })
        didPreEnd = true
      }
    }
  }

  stop (arg: { interaction: Interact.Interaction }) {
    const { interaction } = arg

    if (!this.states || !this.states.length) {
      return
    }

    const modifierArg: Partial<ModifierArg> = extend({
      states: this.states,
      interactable: interaction.interactable,
      element: interaction.element,
      rect: null,
    }, arg)

    this.fillArg(modifierArg)

    for (const state of this.states) {
      modifierArg.state = state

      if (state.methods.stop) { state.methods.stop(modifierArg as ModifierArg) }
    }

    this.states = null
    this.endResult = null
  }

  prepareStates (modifierList: Modifier[]) {
    this.states = []

    for (let index = 0; index < modifierList.length; index++) {
      const { options, methods, name } = modifierList[index]

      if (options && options.enabled === false) { continue }

      this.states.push({
        options,
        methods,
        index,
        name,
      })
    }

    return this.states
  }

  setCoords (arg: { phase: Interact.EventPhase, rect?: Interact.Rect }) {
    const { interaction } = this
    const { phase } = arg
    const curCoords = interaction.coords.cur
    const startCoords = interaction.coords.start
    const { result, startDelta } = this
    const curDelta = result.delta

    if (phase === 'start') {
      extend(this.startDelta, result.delta)
    }

    for (const [coordsSet, delta] of [[startCoords, startDelta], [curCoords, curDelta]] as const) {
      coordsSet.page.x   += delta.x
      coordsSet.page.y   += delta.y
      coordsSet.client.x += delta.x
      coordsSet.client.y += delta.y
    }

    const { rectDelta } = this.result
    const rect = arg.rect || interaction.rect

    rect.left   += rectDelta.left
    rect.right  += rectDelta.right
    rect.top    += rectDelta.top
    rect.bottom += rectDelta.bottom

    rect.width = rect.right - rect.left
    rect.height = rect.bottom - rect.top
  }

  restoreCoords ({ interaction: { coords, rect, modification } }: { interaction: Interact.Interaction }) {
    if (!modification.result) { return }

    const { startDelta } = modification
    const { delta: curDelta, rectDelta } = modification.result

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

  shouldDo (options, preEnd?: boolean, requireEndOnly?: boolean, phase?: string) {
    return options
      ? options.enabled !== false &&
        (preEnd || !options.endOnly) &&
        (!requireEndOnly || options.endOnly || options.alwaysOnEnd) &&
        (options.setStart || phase !== 'start')
      : !requireEndOnly
  }

  destroy () {
    for (const prop in this) {
      this[prop] = null
    }
  }
}

function getModifierList (interaction) {
  const actionOptions = interaction.interactable.options[interaction.prepared.name]
  const actionModifiers = actionOptions.modifiers

  if (actionModifiers && actionModifiers.length) {
    return actionModifiers.filter(
      modifier => !modifier.options || modifier.options.enabled !== false,
    )
  }

  return ['snap', 'snapSize', 'snapEdges', 'restrict', 'restrictEdges', 'restrictSize']
    .map(type => {
      const options = actionOptions[type]

      return options && options.enabled && {
        options,
        methods: options._methods,
      }
    })
    .filter(m => !!m)
}

export function getRectOffset (rect, coords) {
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
