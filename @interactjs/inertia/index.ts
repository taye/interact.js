import * as modifiers from '@interactjs/modifiers/base'
import Modification from '@interactjs/modifiers/Modification'
import offset from '@interactjs/offset'
import * as dom from '@interactjs/utils/domUtils'
import hypot from '@interactjs/utils/hypot'
import * as is from '@interactjs/utils/is'
import { setCoords } from '@interactjs/utils/pointerUtils'
import raf from '@interactjs/utils/raf'

declare module '@interactjs/core/InteractEvent' {
  // eslint-disable-next-line no-shadow
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

declare module '@interactjs/core/defaultOptions' {
  interface PerActionDefaults {
    inertia?: {
      enabled?: boolean
      resistance?: number        // the lambda in exponential decay
      minSpeed?: number          // target speed must be above this for inertia to start
      endSpeed?: number          // the speed at which inertia is slow enough to stop
      allowResume?: true         // allow resuming an action in inertia phase
      smoothEndDuration?: number // animate to snap/restrict endOnly if there's no inertia
    }
  }
}

declare module '@interactjs/core/scope' {
  interface SignalArgs {
    'interactions:before-action-resume': Omit<Interact.DoPhaseArg<Interact.ActionName, 'inertiastart'>, 'iEvent'>
    'interactions:action-resume': Interact.DoPhaseArg<Interact.ActionName, 'inertiastart'>
    'interactions:after-action-resume': Interact.DoPhaseArg<Interact.ActionName, 'inertiastart'>
  }
}

function install (scope: Interact.Scope) {
  const {
    defaults,
  } = scope

  scope.usePlugin(offset)
  scope.usePlugin(modifiers.default)

  defaults.perAction.inertia = {
    enabled          : false,
    resistance       : 10,    // the lambda in exponential decay
    minSpeed         : 100,   // target speed must be above this for inertia to start
    endSpeed         : 10,    // the speed at which inertia is slow enough to stop
    allowResume      : true,  // allow resuming an action in inertia phase
    smoothEndDuration: 300,   // animate to snap/restrict endOnly if there's no inertia
  }
}

export class InertiaState {
  active = false
  isModified = false
  smoothEnd = false
  allowResume = false

  modification: Modification = null
  modifierCount = 0
  modifierArg: modifiers.ModifierArg = null

  startEvent: Interact.InteractEvent<Interact.ActionName> = null
  startCoords: Interact.Point = null
  startVelocity: Interact.Point = null
  t0 = 0
  v0 = 0

  te = 0
  targetOffset: Interact.Point = null
  modifiedOffset: Interact.Point = null
  currentOffset: Interact.Point = null

  lambda_v0? = 0 // eslint-disable-line camelcase
  one_ve_v0? = 0 // eslint-disable-line camelcase
  timeout: number = null

  constructor (
    private readonly interaction: Interact.Interaction,
    private readonly scope: Interact.Scope,
  ) {}

  start (
    event: Interact.PointerEventType,
  ) {
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

    this.modifierArg = {
      interaction,
      interactable: interaction.interactable,
      element: interaction.element,
      rect: interaction.rect,
      edges: interaction.edges,
      pageCoords: this.startCoords,
      preEnd: true,
      phase: 'inertiastart',
    }

    const thrown = (
      (this.t0 - interaction.coords.cur.timeStamp) < 50 &&
      pointerSpeed > options.minSpeed &&
      pointerSpeed > options.endSpeed
    )

    if (!thrown) {
      modification.result = modification.setAll(this.modifierArg)

      if (!modification.result.changed) {
        return false
      }
    }

    // FIXME
    // modification.applyToInteraction(this.modifierArg)
    this.startEvent = new this.scope.InteractEvent(
      interaction,
      event,
      interaction.prepared.name,
      'inertiastart',
      interaction.element,
    )
    // modification.restoreCoords(this.modifierArg)
    // iEvent.modifiers = modification.result.eventProps

    this.active = true
    interaction.simulation = this
    interaction.interactable.fire(this.startEvent)

    if (thrown) {
      this.startInertia()
    } else {
      this.startSmoothEnd()
    }

    return true
  }

  calcInertia () {
    const options = getOptions(this.interaction)
    const lambda = options.resistance
    const inertiaDur = -Math.log(options.endSpeed / this.v0) / lambda

    this.t0 = this.startEvent.timeStamp / 1000
    this.targetOffset = {
      x: (this.startVelocity.x - inertiaDur) / lambda,
      y: (this.startVelocity.y - inertiaDur) / lambda,
    }

    this.te = inertiaDur
    this.lambda_v0 = lambda / this.v0
    this.one_ve_v0 = 1 - options.endSpeed / this.v0
  }

  startInertia () {
    const { modification, modifierArg } = this

    this.startVelocity = this.interaction.coords.velocity.client
    this.calcInertia()

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

    this.timeout = raf.request(() => this.inertiaTick())
  }

  startSmoothEnd () {
    this.smoothEnd = true
    this.isModified = true
    this.targetOffset = {
      x: this.modification.result.delta.x,
      y: this.modification.result.delta.y,
    }

    this.timeout = raf.request(() => this.smoothEndTick())
  }

  inertiaTick () {
    const { interaction } = this
    const options = getOptions(interaction)
    const lambda = options.resistance
    const t = interaction._now() / 1000 - this.t0

    if (t < this.te) {
      const progress =  1 - (Math.exp(-lambda * t) - this.lambda_v0) / this.one_ve_v0
      let newOffset: Interact.Point

      if (this.isModified) {
        newOffset = getQuadraticCurvePoint(
          0, 0,
          this.targetOffset.x, this.targetOffset.y,
          this.modifiedOffset.x, this.modifiedOffset.y,
          progress,
        )
      }
      else {
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

      this.timeout = raf.request(() => this.inertiaTick())
    }
    else {
      interaction.offsetBy({
        x: this.modifiedOffset.x - this.currentOffset.x,
        y: this.modifiedOffset.y - this.currentOffset.y,
      })

      this.end()
    }
  }

  smoothEndTick () {
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

      this.timeout = raf.request(() => this.smoothEndTick())
    }
    else {
      interaction.offsetBy({
        x: this.targetOffset.x - this.currentOffset.x,
        y: this.targetOffset.y - this.currentOffset.y,
      })

      this.end()
    }
  }

  resume (arg: Interact.PointerArgProps<{ type: 'down', down?: boolean }>) {
    const { interaction } = this

    interaction.offsetBy({
      x: -this.currentOffset.x,
      y: -this.currentOffset.y,
    })

    arg.down = true
    this.scope.fire('interactions:update-pointer', arg as Interact.PointerArgProps<{ down: true }>)
    this.stop()
    setCoords(interaction.coords.cur, interaction.pointers.map(p => p.pointer), interaction._now())

    // fire resume signals and event
    interaction._doPhase({
      interaction,
      phase: 'resume',
      event: arg.event,
    })
  }

  end () {
    this.interaction.move()
    this.interaction.end()
    this.stop()
  }
  stop () {
    this.active = this.smoothEnd = false
    this.interaction.simulation = null
    raf.cancel(this.timeout)
  }
}

function start ({ interaction, event }: Interact.DoPhaseArg<Interact.ActionName, 'inertiastart'>) {
  if (!interaction._interacting || interaction.simulation) {
    return null
  }

  const started = interaction.inertia.start(event)

  // prevent action end if inertia or smoothEnd
  return started ? false : null
}

function resume (arg: Interact.SignalArgs['interactions:down']) {
  const { interaction, eventTarget } = arg
  const state = interaction.inertia

  // Check if the down event hits the current inertia target
  if (!state.active) { return }

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

function stop ({ interaction }: Interact.DoPhaseArg<Interact.ActionName, 'inertiastart'>) {
  const state = interaction.inertia

  if (state.active) {
    state.stop()
  }
}

function getOptions ({ interactable, prepared }: Interact.Interaction) {
  return interactable &&
    interactable.options &&
    prepared.name &&
    interactable.options[prepared.name].inertia
}

const inertia: Interact.Plugin = {
  id: 'inertia',
  before: ['modifiers/base'],
  install,
  listeners: {
    'interactions:new': ({ interaction }, scope) => {
      interaction.inertia = new InertiaState(interaction, scope)
    },

    'interactions:before-action-end': start,
    'interactions:down': resume,
    'interactions:stop': stop,
  },
}

// http://stackoverflow.com/a/5634528/2280888
function _getQBezierValue (t: number, p1: number, p2: number, p3: number) {
  const iT = 1 - t
  return iT * iT * p1 + 2 * iT * t * p2 + t * t * p3
}

function getQuadraticCurvePoint (
  startX: number, startY: number, cpX: number, cpY: number, endX: number, endY: number, position: number) {
  return {
    x:  _getQBezierValue(position, startX, cpX, endX),
    y:  _getQBezierValue(position, startY, cpY, endY),
  }
}

// http://gizma.com/easing/
function easeOutQuad (t: number, b: number, c: number, d: number) {
  t /= d
  return -c * t * (t - 2) + b
}

export default inertia
