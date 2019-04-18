import { EventPhase } from '@interactjs/core/InteractEvent'
import modifiers from '@interactjs/modifiers/base'
import * as utils from '@interactjs/utils'
import raf from '@interactjs/utils/raf'

declare module '@interactjs/core/InteractEvent' {
  // eslint-disable-next-line no-shadow
  enum EventPhase {
    Resume = 'resume',
    InertiaStart = 'inertiastart',
  }
}

declare module '@interactjs/core/Interaction' {
  interface Interaction {
    inertia?: {
      active: boolean
      smoothEnd: boolean
      allowResume: boolean

      startEvent?: Interact.InteractEvent
      upCoords: {
        page: Interact.Point
        client: Interact.Point
        timeStamp: number
      }

      xe?: number
      ye?: number
      sx?: number
      sy?: number

      t0?: number
      te?: number
      v0?: number
      vx0?: number
      vy0?: number
      duration?: number
      modifiedXe?: number
      modifiedYe?: number

      lambda_v0?: number // eslint-disable-line camelcase
      one_ve_v0?: number // eslint-disable-line camelcase
      timeout: any
    }
  }
}

declare module '@interactjs/core/defaultOptions' {
  interface PerActionDefaults {
    inertia?: {
      enabled?: boolean,
      resistance?: number,        // the lambda in exponential decay
      minSpeed?: number,          // target speed must be above this for inertia to start
      endSpeed?: number,          // the speed at which inertia is slow enough to stop
      allowResume?: true,         // allow resuming an action in inertia phase
      smoothEndDuration?: number, // animate to snap/restrict endOnly if there's no inertia
    } | boolean // FIXME
  }
}

(EventPhase as any).Resume = 'resume'
; (EventPhase as any).InertiaStart = 'inertiastart'

function install (scope: Interact.Scope) {
  const {
    interactions,
    defaults,
  } = scope

  interactions.signals.on('new', ({ interaction }) => {
    interaction.inertia = {
      active     : false,
      smoothEnd  : false,
      allowResume: false,
      upCoords   : {} as any,
      timeout    : null,
    }
  })

  // FIXME proper signal typing
  interactions.signals.on('before-action-end', (arg) => release(arg as any, scope))
  interactions.signals.on('down', (arg) => resume(arg as any, scope))
  interactions.signals.on('stop', (arg) => stop(arg as any))

  defaults.perAction.inertia = {
    enabled          : false,
    resistance       : 10,    // the lambda in exponential decay
    minSpeed         : 100,   // target speed must be above this for inertia to start
    endSpeed         : 10,    // the speed at which inertia is slow enough to stop
    allowResume      : true,  // allow resuming an action in inertia phase
    smoothEndDuration: 300,   // animate to snap/restrict endOnly if there's no inertia
  }

  scope.usePlugin(modifiers)
}

function resume (
  { interaction, event, pointer, eventTarget }: Interact.SignalArg,
  scope: Interact.Scope
) {
  const state = interaction.inertia

  // Check if the down event hits the current inertia target
  if (state.active) {
    let element = eventTarget

    // climb up the DOM tree from the event target
    while (utils.is.element(element)) {
      // if interaction element is the current inertia target element
      if (element === interaction.element) {
        // stop inertia
        raf.cancel(state.timeout)
        state.active = false
        interaction.simulation = null

        // update pointers to the down event's coordinates
        interaction.updatePointer(pointer, event, eventTarget, true)
        utils.pointer.setCoords(
          interaction.coords.cur,
          interaction.pointers.map((p) => p.pointer),
          interaction._now()
        )

        // fire appropriate signals
        const signalArg = {
          interaction,
        }

        scope.interactions.signals.fire('action-resume', signalArg)

        // fire a reume event
        const resumeEvent = new scope.InteractEvent(
          interaction, event, interaction.prepared.name, EventPhase.Resume, interaction.element)

        interaction._fireEvent(resumeEvent)

        utils.pointer.copyCoords(interaction.coords.prev, interaction.coords.cur)
        break
      }

      element = utils.dom.parentNode(element)
    }
  }
}

function release<T extends Interact.ActionName> (
  { interaction, event, noPreEnd }: Interact.SignalArg,
  scope: Interact.Scope
) {
  const state = interaction.inertia

  if (!interaction.interacting() ||
    (interaction.simulation && interaction.simulation.active) ||
  noPreEnd) {
    return null
  }

  const options = getOptions(interaction)

  const now = interaction._now()
  const { client: velocityClient } = interaction.coords.velocity
  const pointerSpeed = utils.hypot(velocityClient.x, velocityClient.y)

  let smoothEnd = false
  let modifierResult: ReturnType<typeof modifiers.setAll>

  // check if inertia should be started
  const inertiaPossible = (options && options.enabled &&
                     interaction.prepared.name !== 'gesture' &&
                     event !== state.startEvent)

  const inertia = (inertiaPossible &&
    (now - interaction.coords.cur.timeStamp) < 50 &&
    pointerSpeed > options.minSpeed &&
    pointerSpeed > options.endSpeed)

  const modifierArg = {
    interaction,
    pageCoords: utils.extend({}, interaction.coords.cur.page),
    states: inertiaPossible && interaction.modifiers.states.map(
      (modifierStatus) => utils.extend({}, modifierStatus)
    ),
    preEnd: true,
    prevCoords: undefined,
    requireEndOnly: null,
  }

  // smoothEnd
  if (inertiaPossible && !inertia) {
    modifierArg.prevCoords = interaction.prevEvent.page
    modifierArg.requireEndOnly = false
    modifierResult = modifiers.setAll(modifierArg)

    if (modifierResult.changed) {
      smoothEnd = true
    }
  }

  if (!(inertia || smoothEnd)) { return null }

  utils.pointer.copyCoords(state.upCoords, interaction.coords.cur)

  interaction.pointers[0].pointer = state.startEvent = new scope.InteractEvent(
    interaction,
    event,
    // FIXME add proper typing Action.name
    interaction.prepared.name as T,
    EventPhase.InertiaStart,
    interaction.element,
  )

  state.t0 = now

  state.active = true
  state.allowResume = options.allowResume
  interaction.simulation = state

  interaction.interactable.fire(state.startEvent)

  if (inertia) {
    state.vx0 = interaction.coords.velocity.client.x
    state.vy0 = interaction.coords.velocity.client.y
    state.v0 = pointerSpeed

    calcInertia(interaction, state)

    utils.extend(modifierArg.pageCoords, interaction.coords.cur.page)

    modifierArg.pageCoords.x += state.xe
    modifierArg.pageCoords.y += state.ye
    modifierArg.prevCoords = undefined
    modifierArg.requireEndOnly = true

    modifierResult = modifiers.setAll(modifierArg)

    state.modifiedXe += modifierResult.delta.x
    state.modifiedYe += modifierResult.delta.y

    state.timeout = raf.request(() => inertiaTick(interaction))
  }
  else {
    state.smoothEnd = true
    state.xe = modifierResult.delta.x
    state.ye = modifierResult.delta.y

    state.sx = state.sy = 0

    state.timeout = raf.request(() => smothEndTick(interaction))
  }

  return false
}

function stop ({ interaction }: Interact.SignalArg) {
  const state = interaction.inertia
  if (state.active) {
    raf.cancel(state.timeout)
    state.active = false
    interaction.simulation = null
  }
}

function calcInertia (interaction: Interact.Interaction, state) {
  const options = getOptions(interaction)
  const lambda = options.resistance
  const inertiaDur = -Math.log(options.endSpeed / state.v0) / lambda

  state.x0 = interaction.prevEvent.page.x
  state.y0 = interaction.prevEvent.page.y
  state.t0 = state.startEvent.timeStamp / 1000
  state.sx = state.sy = 0

  state.modifiedXe = state.xe = (state.vx0 - inertiaDur) / lambda
  state.modifiedYe = state.ye = (state.vy0 - inertiaDur) / lambda
  state.te = inertiaDur

  state.lambda_v0 = lambda / state.v0
  state.one_ve_v0 = 1 - options.endSpeed / state.v0
}

function inertiaTick (interaction: Interact.Interaction) {
  updateInertiaCoords(interaction)
  utils.pointer.setCoordDeltas(interaction.coords.delta, interaction.coords.prev, interaction.coords.cur)
  utils.pointer.setCoordVelocity(interaction.coords.velocity, interaction.coords.delta)

  const state = interaction.inertia
  const options = getOptions(interaction)
  const lambda = options.resistance
  const t = interaction._now() / 1000 - state.t0

  if (t < state.te) {
    const progress =  1 - (Math.exp(-lambda * t) - state.lambda_v0) / state.one_ve_v0

    if (state.modifiedXe === state.xe && state.modifiedYe === state.ye) {
      state.sx = state.xe * progress
      state.sy = state.ye * progress
    }
    else {
      const quadPoint = utils.getQuadraticCurvePoint(
        0, 0,
        state.xe, state.ye,
        state.modifiedXe, state.modifiedYe,
        progress)

      state.sx = quadPoint.x
      state.sy = quadPoint.y
    }

    interaction.move()

    state.timeout = raf.request(() => inertiaTick(interaction))
  }
  else {
    state.sx = state.modifiedXe
    state.sy = state.modifiedYe

    interaction.move()
    interaction.end(state.startEvent)
    state.active = false
    interaction.simulation = null
  }

  utils.pointer.copyCoords(interaction.coords.prev, interaction.coords.cur)
}

function smothEndTick (interaction: Interact.Interaction) {
  updateInertiaCoords(interaction)

  const state = interaction.inertia
  const t = interaction._now() - state.t0
  const { smoothEndDuration: duration } = getOptions(interaction)

  if (t < duration) {
    state.sx = utils.easeOutQuad(t, 0, state.xe, duration)
    state.sy = utils.easeOutQuad(t, 0, state.ye, duration)

    interaction.move()

    state.timeout = raf.request(() => smothEndTick(interaction))
  }
  else {
    state.sx = state.xe
    state.sy = state.ye

    interaction.move()
    interaction.end(state.startEvent)

    state.smoothEnd =
      state.active = false
    interaction.simulation = null
  }
}

function updateInertiaCoords (interaction: Interact.Interaction) {
  const state = interaction.inertia

  // return if inertia isn't running
  if (!state.active) { return }

  const pageUp   = state.upCoords.page
  const clientUp = state.upCoords.client

  utils.pointer.setCoords(interaction.coords.cur, [ {
    pageX  : pageUp.x   + state.sx,
    pageY  : pageUp.y   + state.sy,
    clientX: clientUp.x + state.sx,
    clientY: clientUp.y + state.sy,
  } ], interaction._now())
}

function getOptions ({ interactable, prepared }: Interact.Interaction) {
  return interactable &&
    interactable.options &&
    prepared.name &&
    interactable.options[prepared.name].inertia
}

export default {
  id: 'inertia',
  install,
  calcInertia,
  inertiaTick,
  smothEndTick,
  updateInertiaCoords,
}
