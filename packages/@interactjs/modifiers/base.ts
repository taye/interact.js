import { EventPhase, InteractEvent } from '@interactjs/core/InteractEvent'
import { Interactable } from '@interactjs/core/Interactable'
import Interaction from '@interactjs/core/Interaction'
import { Plugin } from '@interactjs/core/scope'
import { EdgeOptions, FullRect, Point, Rect } from '@interactjs/types'

import Modification from './Modification'

declare module '@interactjs/core/Interaction' {
  interface Interaction {
    modification?: Modification
  }
}

declare module '@interactjs/core/InteractEvent' {
  interface InteractEvent {
    modifiers?: Array<{
      name: string
      [key: string]: any
    }>
  }
}

declare module '@interactjs/core/defaultOptions' {
  interface PerActionDefaults {
    modifiers?: Modifier[]
  }
}

export interface Modifier<
  Defaults = any,
  State extends ModifierState = any,
  Name extends string = any
> {
  options?: Defaults
  methods: {
    start?: (arg: ModifierArg<State>) => void
    set: (arg: ModifierArg<State>) => void
    beforeEnd?: (arg: ModifierArg<State>) => Point | void
    stop?: (arg: ModifierArg<State>) => void
  }
  name?: Name
  enable: () => Modifier<Defaults, State, Name>
  disable: () => Modifier<Defaults, State, Name>
}

export type ModifierState<
  Defaults = {},
  StateProps extends { [prop: string]: any } = {},
  Name extends string = any
> = {
  options: Defaults
  methods?: Modifier<Defaults>['methods']
  index?: number
  name?: Name
} & StateProps

export interface ModifierArg<State extends ModifierState = ModifierState> {
  interaction: Interaction
  interactable: Interactable
  phase: EventPhase
  rect: FullRect
  edges: EdgeOptions
  state?: State
  element: Element
  pageCoords?: Point
  prevCoords?: Point
  prevRect?: FullRect
  coords?: Point
  startOffset?: Rect
  preEnd?: boolean
}

export interface ModifierModule<
  Defaults extends { enabled?: boolean },
  State extends ModifierState,
> {
  defaults?: Defaults
  start? (arg: ModifierArg<State>): void
  set? (arg: ModifierArg<State>): any
  beforeEnd? (arg: ModifierArg<State>): Point | void
  stop? (arg: ModifierArg<State>): void
}

export interface ModifierFunction <
  Defaults extends { enabled?: boolean },
  State extends ModifierState,
  Name extends string,
> {
  (_options?: Partial<Defaults>): Modifier<Defaults, State, Name>
  _defaults: Defaults
  _methods: ModifierModule<Defaults, State>
}

export function makeModifier<
  Defaults extends { enabled?: boolean },
  State extends ModifierState,
  Name extends string
> (
  module: ModifierModule<Defaults, State>,
  name?: Name,
) {
  const { defaults } = module
  const methods = {
    start: module.start,
    set: module.set,
    beforeEnd: module.beforeEnd,
    stop: module.stop,
  }

  const modifier = (_options?: Partial<Defaults>) => {
    const options: Defaults = (_options || {}) as Defaults

    options.enabled = options.enabled !== false

    // add missing defaults to options
    for (const prop in defaults) {
      if (!(prop in options)) {
        options[prop] = defaults[prop]
      }
    }

    const m: Modifier<Defaults, State, Name> = {
      options,
      methods,
      name,
      enable: () => {
        options.enabled = true
        return m
      },
      disable: () => {
        options.enabled = false
        return m
      },
    }

    return m
  }

  if (name && typeof name === 'string') {
    // for backwrads compatibility
    modifier._defaults = defaults
    modifier._methods = methods
  }

  return modifier
}

export function addEventModifiers ({ iEvent, interaction: { modification: { result } } }: {
  iEvent: InteractEvent<any>
  interaction: Interaction<any>
}) {
  if (result) {
    iEvent.modifiers = result.eventProps
  }
}

const modifiersBase: Plugin = {
  id: 'modifiers/base',
  before: ['actions'],
  install: scope => {
    scope.defaults.perAction.modifiers = []
  },
  listeners: {
    'interactions:new': ({ interaction }) => {
      interaction.modification = new Modification(interaction)
    },

    'interactions:before-action-start': arg => {
      const { modification } = arg.interaction

      modification.start(arg, arg.interaction.coords.start.page)
      arg.interaction.edges = modification.edges
      modification.applyToInteraction(arg)
    },

    'interactions:before-action-move': arg => arg.interaction.modification.setAndApply(arg),

    'interactions:before-action-end': arg => arg.interaction.modification.beforeEnd(arg),

    'interactions:action-start': addEventModifiers,
    'interactions:action-move': addEventModifiers,
    'interactions:action-end': addEventModifiers,

    'interactions:after-action-start': arg => arg.interaction.modification.restoreInteractionCoords(arg),
    'interactions:after-action-move': arg => arg.interaction.modification.restoreInteractionCoords(arg),

    'interactions:stop': arg => arg.interaction.modification.stop(arg),
  },
}

export default modifiersBase
