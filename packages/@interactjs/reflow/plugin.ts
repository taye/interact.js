import type { Interactable } from '@interactjs/core/Interactable'
import type { DoAnyPhaseArg, Interaction } from '@interactjs/core/Interaction'
import type { Scope, Plugin } from '@interactjs/core/scope'
import type { ActionName, ActionProps, Element } from '@interactjs/core/types'
import * as arr from '@interactjs/utils/arr'
import { copyAction } from '@interactjs/utils/misc'
import * as pointerUtils from '@interactjs/utils/pointerUtils'
import { tlbrToXywh } from '@interactjs/utils/rect'

declare module '@interactjs/core/scope' {
  interface SignalArgs {
    'interactions:before-action-reflow': Omit<DoAnyPhaseArg, 'iEvent'>
    'interactions:action-reflow': DoAnyPhaseArg
    'interactions:after-action-reflow': DoAnyPhaseArg
  }
}

declare module '@interactjs/core/Interactable' {
  interface Interactable {
    /**
     * ```js
     * const interactable = interact(target)
     * const drag = { name: drag, axis: 'x' }
     * const resize = { name: resize, edges: { left: true, bottom: true }
     *
     * interactable.reflow(drag)
     * interactable.reflow(resize)
     * ```
     *
     * Start an action sequence to re-apply modifiers, check drops, etc.
     *
     * @param { Object } action The action to begin
     * @param { string } action.name The name of the action
     * @returns { Promise } A promise that resolves to the `Interactable` when actions on all targets have ended
     */
    reflow<T extends ActionName>(action: ActionProps<T>): ReturnType<typeof doReflow>
  }
}

declare module '@interactjs/core/Interaction' {
  interface Interaction {
    _reflowPromise: Promise<void>
    _reflowResolve: (...args: unknown[]) => void
  }
}

declare module '@interactjs/core/InteractEvent' {
  interface PhaseMap {
    reflow?: true
  }
}

function install(scope: Scope) {
  const { Interactable } = scope

  scope.actions.phases.reflow = true

  Interactable.prototype.reflow = function (action: ActionProps) {
    return doReflow(this, action, scope)
  }
}

function doReflow<T extends ActionName>(
  interactable: Interactable,
  action: ActionProps<T>,
  scope: Scope,
): Promise<Interactable> {
  const elements = interactable.getAllElements()

  // tslint:disable-next-line variable-name
  const Promise = (scope.window as any).Promise
  const promises: Array<Promise<null>> | null = Promise ? [] : null

  for (const element of elements) {
    const rect = interactable.getRect(element as HTMLElement | SVGElement)

    if (!rect) {
      break
    }

    const runningInteraction = arr.find(scope.interactions.list, (interaction: Interaction) => {
      return (
        interaction.interacting() &&
        interaction.interactable === interactable &&
        interaction.element === element &&
        interaction.prepared.name === action.name
      )
    })
    let reflowPromise: Promise<null>

    if (runningInteraction) {
      runningInteraction.move()

      if (promises) {
        reflowPromise =
          runningInteraction._reflowPromise ||
          new Promise((resolve: any) => {
            runningInteraction._reflowResolve = resolve
          })
      }
    } else {
      const xywh = tlbrToXywh(rect)
      const coords = {
        page: { x: xywh.x, y: xywh.y },
        client: { x: xywh.x, y: xywh.y },
        timeStamp: scope.now(),
      }

      const event = pointerUtils.coordsToEvent(coords)
      reflowPromise = startReflow<T>(scope, interactable, element, action, event)
    }

    if (promises) {
      promises.push(reflowPromise)
    }
  }

  return promises && Promise.all(promises).then(() => interactable)
}

function startReflow<T extends ActionName>(
  scope: Scope,
  interactable: Interactable,
  element: Element,
  action: ActionProps<T>,
  event: any,
) {
  const interaction = scope.interactions.new({ pointerType: 'reflow' })
  const signalArg = {
    interaction,
    event,
    pointer: event,
    eventTarget: element,
    phase: 'reflow',
  } as const

  interaction.interactable = interactable
  interaction.element = element
  interaction.prevEvent = event
  interaction.updatePointer(event, event, element, true)
  pointerUtils.setZeroCoords(interaction.coords.delta)

  copyAction(interaction.prepared, action)
  interaction._doPhase(signalArg)

  const { Promise } = scope.window as unknown as { Promise: PromiseConstructor }
  const reflowPromise = Promise
    ? new Promise<undefined>((resolve) => {
        interaction._reflowResolve = resolve
      })
    : undefined

  interaction._reflowPromise = reflowPromise
  interaction.start(action, interactable, element)

  if (interaction._interacting) {
    interaction.move(signalArg)
    interaction.end(event)
  } else {
    interaction.stop()
    interaction._reflowResolve()
  }

  interaction.removePointer(event, event)

  return reflowPromise
}

const reflow: Plugin = {
  id: 'reflow',
  install,
  listeners: {
    // remove completed reflow interactions
    'interactions:stop': ({ interaction }, scope) => {
      if (interaction.pointerType === 'reflow') {
        if (interaction._reflowResolve) {
          interaction._reflowResolve()
        }

        arr.remove(scope.interactions.list, interaction)
      }
    },
  },
}

export default reflow
