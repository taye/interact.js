/* eslint-disable import/no-extraneous-dependencies */
import type { InteractEvent as _InteractEvent, EventPhase } from '@interactjs/core/InteractEvent'
import type * as interaction from '@interactjs/core/Interaction'
import type { ActionName, ActionProps as _ActionProps } from '@interactjs/core/types'
// import module augmentations
import type * as _ from '@interactjs/interactjs'

export * from '@interactjs/core/types'
export type { Plugin } from '@interactjs/core/scope'
export type { EventPhase } from '@interactjs/core/InteractEvent'
export type { Options } from '@interactjs/core/options'
export type { PointerEvent } from '@interactjs/pointer-events/PointerEvent'
export type { Interactable } from '@interactjs/core/Interactable'
export type { DragEvent } from '@interactjs/actions/drag/plugin'
export type { DropEvent } from '@interactjs/actions/drop/DropEvent'
export type { GestureEvent } from '@interactjs/actions/gesture/plugin'
export type { ResizeEvent } from '@interactjs/actions/resize/plugin'
export type { SnapFunction, SnapTarget } from '@interactjs/modifiers/snap/pointer'

export type ActionProps<T extends ActionName = ActionName> = _ActionProps<T>
export type Interaction<T extends ActionName = ActionName> = interaction.Interaction<T>
export type InteractionProxy<T extends ActionName = ActionName> = interaction.InteractionProxy<T>
export type PointerArgProps<T extends {} = {}> = interaction.PointerArgProps<T>
export type InteractEvent<T extends ActionName = never, P extends EventPhase = EventPhase> = _InteractEvent<
T,
P
>
