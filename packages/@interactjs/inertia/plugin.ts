import type { Interaction, DoPhaseArg } from '@interactjs/core/Interaction'
import type { Scope, SignalArgs, Plugin } from '@interactjs/core/scope'
import type { ActionName, Point, PointerEventType } from '@interactjs/core/types'
/* eslint-disable import/no-duplicates -- for typescript module augmentations */
import '@interactjs/modifiers/base'
import '@interactjs/offset/plugin'
import * as modifiers from '@interactjs/modifiers/base'
import { Modification } from '@interactjs/modifiers/Modification'
import type { ModifierArg } from '@interactjs/modifiers/types'
import offset from '@interactjs/offset/plugin'
/* eslint-enable import/no-duplicates */
import * as dom from '@interactjs/utils/domUtils'
import hypot from '@interactjs/utils/hypot'
import is from '@interactjs/utils/is'
import { copyCoords } from '@interactjs/utils/pointerUtils'
import raf from '@interactjs/utils/raf'

declare module '@interactjs/core/InteractEvent' {
  interface PhaseMap {
    resume?: true
    inertiastart?: true
  }
}

declare module '@interactjs/core/Interaction' {
  interface Interaction {
    inertia?: InertiaState
  }
}

declare module '@interactjs/core/options' {
  interface PerActionDefaults {
    inertia?: {
      enabled?: boolean
      resistance?: number // the lambda in exponential decay
      minSpeed?: number // target speed must be above this for inertia to start
      endSpeed?: number // the speed at which inertia is slow enough to stop
      allowResume?: true // allow resuming an action in inertia phase
      smoothEndDuration?: number // animate to snap/restrict endOnly if there's no inertia
    }
  }
}

declare module '@interactjs/core/scope' {
  interface SignalArgs {
    'interactions:before-action-inertiastart': Omit<DoPhaseArg<ActionName, 'inertiastart'>, 'iEvent'>
    'interactions:action-inertiastart': DoPhaseArg<ActionName, 'inertiastart'>
    'interactions:after-action-inertiastart': DoPhaseArg<ActionName, 'inertiastart'>
    'interactions:before-action-resume': Omit<DoPhaseArg<ActionName, 'resume'>, 'iEvent'>
    'interactions:action-resume': DoPhaseArg<ActionName, 'resume'>
    'interactions:after-action-resume': DoPhaseArg<ActionName, 'resume'>
  }
}

function install(scope: Scope) {
  const { defaults } = scope

  scope.usePlugin(offset)
  scope.usePlugin(modifiers.default)
  scope.actions.phases.inertiastart = true
  scope.actions.phases.resume = true

  defaults.perAction.inertia = {
    enabled: false,
    resistance: 10, // the lambda in exponential decay
    minSpeed: 100, // target speed must be above this for inertia to start
    endSpeed: 10, // the speed at which inertia is slow enough to stop
    allowResume: true, // allow resuming an action in inertia phase
    smoothEndDuration: 300, // animate to snap/restrict endOnly if there's no inertia
  }
}

export class InertiaState {
  active = false
  isModified = false
  smoothEnd = false
  allowResume = false

  modification!: Modification
  modifierCount = 0
  modifierArg!: ModifierArg

  startCoords!: Point
  t0 = 0
  v0 = 0

  te = 0
  targetOffset!: Point
  modifiedOffset!: Point
  currentOffset!: Point

  lambda_v0? = 0 // eslint-disable-line camelcase
  one_ve_v0? = 0 // eslint-disable-line camelcase
  timeout!: number
  readonly interaction: Interaction

  constructor(interaction: Interaction) {
    this.interaction = interaction
  }

  start(event: PointerEventType) {
    const { interaction } = this
    const options = getOptions(interaction)

    if (!options || !options.enabled) {
      return false
    }

    const { client: velocityClient } = interaction.coords.velocity
    const pointerSpeed = hypot(velocityClient.x, velocityClient.y)
    const modification = this.modification || (this.modification = new Modification(interaction))

    modification.copyFrom(interaction.modification)

    this.t0 = interaction._now()
    this.allowResume = options.allowResume
    this.v0 = pointerSpeed
    this.currentOffset = { x: 0, y: 0 }
    this.startCoords = interaction.coords.cur.page

    this.modifierArg = modification.fillArg({
      pageCoords: this.startCoords,
      preEnd: true,
      phase: 'inertiastart',
    })

    const thrown =
      this.t0 - interaction.coords.cur.timeStamp < 50 &&
      pointerSpeed > options.minSpeed &&
      pointerSpeed > options.endSpeed

    if (thrown) {
      this.startInertia()
    } else {
      modification.result = modification.setAll(this.modifierArg)

      if (!modification.result.changed) {
        return false
      }

      this.startSmoothEnd()
    }

    // force modification change
    interaction.modification.result.rect = null

    // bring inertiastart event to the target coords
    interaction.offsetBy(this.targetOffset)
    interaction._doPhase({
      interaction,
      event,
      phase: 'inertiastart',
    })
    interaction.offsetBy({ x: -this.targetOffset.x, y: -this.targetOffset.y })
    // force modification change
    interaction.modification.result.rect = null

    this.active = true
    interaction.simulation = this

    return true
  }

  startInertia() {
    const startVelocity = this.interaction.coords.velocity.client
    const options = getOptions(this.interaction)
    const lambda = options.resistance
    const inertiaDur = -Math.log(options.endSpeed / this.v0) / lambda

    this.targetOffset = {
      x: (startVelocity.x - inertiaDur) / lambda,
      y: (startVelocity.y - inertiaDur) / lambda,
    }

    this.te = inertiaDur
    this.lambda_v0 = lambda / this.v0
    this.one_ve_v0 = 1 - options.endSpeed / this.v0

    const { modification, modifierArg } = this

    modifierArg.pageCoords = {
      x: this.startCoords.x + this.targetOffset.x,
      y: this.startCoords.y + this.targetOffset.y,
    }

    modification.result = modification.setAll(modifierArg)

    if (modification.result.changed) {
      this.isModified = true
      this.modifiedOffset = {
        x: this.targetOffset.x + modification.result.delta.x,
        y: this.targetOffset.y + modification.result.delta.y,
      }
    }

    this.onNextFrame(() => this.inertiaTick())
  }

  startSmoothEnd() {
    this.smoothEnd = true
    this.isModified = true
    this.targetOffset = {
      x: this.modification.result.delta.x,
      y: this.modification.result.delta.y,
    }

    this.onNextFrame(() => this.smoothEndTick())
  }

  onNextFrame(tickFn: () => void) {
    this.timeout = raf.request(() => {
      if (this.active) {
        tickFn()
      }
    })
  }

  inertiaTick() {
    const { interaction } = this
    const options = getOptions(interaction)
    const lambda = options.resistance
    const t = (interaction._now() - this.t0) / 1000

    if (t < this.te) {
      const progress = 1 - (Math.exp(-lambda * t) - this.lambda_v0) / this.one_ve_v0
      let newOffset: Point

      if (this.isModified) {
        newOffset = getQuadraticCurvePoint(
          0,
          0,
          this.targetOffset.x,
          this.targetOffset.y,
          this.modifiedOffset.x,
          this.modifiedOffset.y,
          progress,
        )
      } else {
        newOffset = {
          x: this.targetOffset.x * progress,
          y: this.targetOffset.y * progress,
        }
      }

      const delta = { x: newOffset.x - this.currentOffset.x, y: newOffset.y - this.currentOffset.y }

      this.currentOffset.x += delta.x
      this.currentOffset.y += delta.y

      interaction.offsetBy(delta)
      interaction.move()

      this.onNextFrame(() => this.inertiaTick())
    } else {
      interaction.offsetBy({
        x: this.modifiedOffset.x - this.currentOffset.x,
        y: this.modifiedOffset.y - this.currentOffset.y,
      })

      this.end()
    }
  }

  smoothEndTick() {
    const { interaction } = this
    const t = interaction._now() - this.t0
    const { smoothEndDuration: duration } = getOptions(interaction)

    if (t < duration) {
      const newOffset = {
        x: easeOutQuad(t, 0, this.targetOffset.x, duration),
        y: easeOutQuad(t, 0, this.targetOffset.y, duration),
      }
      const delta = {
        x: newOffset.x - this.currentOffset.x,
        y: newOffset.y - this.currentOffset.y,
      }

      this.currentOffset.x += delta.x
      this.currentOffset.y += delta.y

      interaction.offsetBy(delta)
      interaction.move({ skipModifiers: this.modifierCount })

      this.onNextFrame(() => this.smoothEndTick())
    } else {
      interaction.offsetBy({
        x: this.targetOffset.x - this.currentOffset.x,
        y: this.targetOffset.y - this.currentOffset.y,
      })

      this.end()
    }
  }

  resume({ pointer, event, eventTarget }: SignalArgs['interactions:down']) {
    const { interaction } = this

    // undo inertia changes to interaction coords
    interaction.offsetBy({
      x: -this.currentOffset.x,
      y: -this.currentOffset.y,
    })

    // update pointer at pointer down position
    interaction.updatePointer(pointer, event, eventTarget, true)

    // fire resume signals and event
    interaction._doPhase({
      interaction,
      event,
      phase: 'resume',
    })
    copyCoords(interaction.coords.prev, interaction.coords.cur)

    this.stop()
  }

  end() {
    this.interaction.move()
    this.interaction.end()
    this.stop()
  }

  stop() {
    this.active = this.smoothEnd = false
    this.interaction.simulation = null
    raf.cancel(this.timeout)
  }
}

function start({ interaction, event }: DoPhaseArg<ActionName, 'end'>) {
  if (!interaction._interacting || interaction.simulation) {
    return null
  }

  const started = interaction.inertia.start(event)

  // prevent action end if inertia or smoothEnd
  return started ? false : null
}

// Check if the down event hits the current inertia target
// control should be return to the user
function resume(arg: SignalArgs['interactions:down']) {
  const { interaction, eventTarget } = arg
  const state = interaction.inertia

  if (!state.active) return

  let element = eventTarget as Node

  // climb up the DOM tree from the event target
  while (is.element(element)) {
    // if interaction element is the current inertia target element
    if (element === interaction.element) {
      state.resume(arg)
      break
    }

    element = dom.parentNode(element)
  }
}

function stop({ interaction }: { interaction: Interaction }) {
  const state = interaction.inertia

  if (state.active) {
    state.stop()
  }
}

function getOptions({ interactable, prepared }: Interaction) {
  return interactable && interactable.options && prepared.name && interactable.options[prepared.name].inertia
}

const inertia: Plugin = {
  id: 'inertia',
  before: ['modifiers', 'actions'],
  install,
  listeners: {
    'interactions:new': ({ interaction }) => {
      interaction.inertia = new InertiaState(interaction)
    },

    'interactions:before-action-end': start,
    'interactions:down': resume,
    'interactions:stop': stop,

    'interactions:before-action-resume': (arg) => {
      const { modification } = arg.interaction

      modification.stop(arg)
      modification.start(arg, arg.interaction.coords.cur.page)
      modification.applyToInteraction(arg)
    },

    'interactions:before-action-inertiastart': (arg) => arg.interaction.modification.setAndApply(arg),
    'interactions:action-resume': modifiers.addEventModifiers,
    'interactions:action-inertiastart': modifiers.addEventModifiers,
    'interactions:after-action-inertiastart': (arg) =>
      arg.interaction.modification.restoreInteractionCoords(arg),
    'interactions:after-action-resume': (arg) => arg.interaction.modification.restoreInteractionCoords(arg),
  },
}

// http://stackoverflow.com/a/5634528/2280888
function _getQBezierValue(t: number, p1: number, p2: number, p3: number) {
  const iT = 1 - t
  return iT * iT * p1 + 2 * iT * t * p2 + t * t * p3
}

function getQuadraticCurvePoint(
  startX: number,
  startY: number,
  cpX: number,
  cpY: number,
  endX: number,
  endY: number,
  position: number,
) {
  return {
    x: _getQBezierValue(position, startX, cpX, endX),
    y: _getQBezierValue(position, startY, cpY, endY),
  }
}

// http://gizma.com/easing/
function easeOutQuad(t: number, b: number, c: number, d: number) {
  t /= d
  return -c * t * (t - 2) + b
}

export default inertia
