import type { Interactable } from '@interactjs/core/Interactable';
import type { InteractEvent } from '@interactjs/core/InteractEvent';
import type { Interaction } from '@interactjs/core/Interaction';
import type { PerActionDefaults } from '@interactjs/core/options';
import type { Plugin } from '@interactjs/core/scope';
import type { Element, PointerEventType, Rect, ListenersArg } from '@interactjs/core/types';
import '../drag/plugin';
import type { DragEvent } from '../drag/plugin';
import { DropEvent } from './DropEvent';
export type DropFunctionChecker = (dragEvent: any, // related drag operation
event: any, // touch or mouse EventEmitter
dropped: boolean, // default checker result
dropzone: Interactable, // dropzone interactable
dropElement: Element, // drop zone element
draggable: Interactable, // draggable's Interactable
draggableElement: Element) => boolean;
export interface DropzoneOptions extends PerActionDefaults {
    accept?: string | Element | (({ dropzone, draggableElement }: {
        dropzone: Interactable;
        draggableElement: Element;
    }) => boolean);
    overlap?: 'pointer' | 'center' | number;
    checker?: DropFunctionChecker;
    ondropactivate?: ListenersArg;
    ondropdeactivate?: ListenersArg;
    ondragenter?: ListenersArg;
    ondragleave?: ListenersArg;
    ondropmove?: ListenersArg;
    ondrop?: ListenersArg;
}
export interface DropzoneMethod {
    (this: Interactable, options: DropzoneOptions | boolean): Interactable;
    (): DropzoneOptions;
}
declare module '@interactjs/core/Interactable' {
    interface Interactable {
        /**
         *
         * ```js
         * interact('.drop').dropzone({
         *   accept: '.can-drop' || document.getElementById('single-drop'),
         *   overlap: 'pointer' || 'center' || zeroToOne
         * }
         * ```
         *
         * Returns or sets whether draggables can be dropped onto this target to
         * trigger drop events
         *
         * Dropzones can receive the following events:
         *  - `dropactivate` and `dropdeactivate` when an acceptable drag starts and ends
         *  - `dragenter` and `dragleave` when a draggable enters and leaves the dropzone
         *  - `dragmove` when a draggable that has entered the dropzone is moved
         *  - `drop` when a draggable is dropped into this dropzone
         *
         * Use the `accept` option to allow only elements that match the given CSS
         * selector or element. The value can be:
         *
         *  - **an Element** - only that element can be dropped into this dropzone.
         *  - **a string**, - the element being dragged must match it as a CSS selector.
         *  - **`null`** - accept options is cleared - it accepts any element.
         *
         * Use the `overlap` option to set how drops are checked for. The allowed
         * values are:
         *
         *   - `'pointer'`, the pointer must be over the dropzone (default)
         *   - `'center'`, the draggable element's center must be over the dropzone
         *   - a number from 0-1 which is the `(intersection area) / (draggable area)`.
         *   e.g. `0.5` for drop to happen when half of the area of the draggable is
         *   over the dropzone
         *
         * Use the `checker` option to specify a function to check if a dragged element
         * is over this Interactable.
         *
         * @param options - The new options to be set
         */
        dropzone(options: DropzoneOptions | boolean): Interactable;
        /** @returns The current setting */
        dropzone(): DropzoneOptions;
        /**
         * ```js
         * interact(target)
         * .dropChecker(function(dragEvent,         // related dragmove or dragend event
         *                       event,             // TouchEvent/PointerEvent/MouseEvent
         *                       dropped,           // bool result of the default checker
         *                       dropzone,          // dropzone Interactable
         *                       dropElement,       // dropzone elemnt
         *                       draggable,         // draggable Interactable
         *                       draggableElement) {// draggable element
         *
         *   return dropped && event.target.hasAttribute('allow-drop')
         * }
         * ```
         */
        dropCheck(dragEvent: InteractEvent, event: PointerEventType, draggable: Interactable, draggableElement: Element, dropElemen: Element, rect: any): boolean;
    }
}
declare module '@interactjs/core/Interaction' {
    interface Interaction {
        dropState?: DropState;
    }
}
declare module '@interactjs/core/InteractEvent' {
    interface InteractEvent {
        dropzone?: Interactable;
        dragEnter?: Element;
        dragLeave?: Element;
    }
}
declare module '@interactjs/core/options' {
    interface ActionDefaults {
        drop: DropzoneOptions;
    }
}
declare module '@interactjs/core/scope' {
    interface Scope {
        dynamicDrop?: boolean;
    }
    interface SignalArgs {
        'actions/drop:start': DropSignalArg;
        'actions/drop:move': DropSignalArg;
        'actions/drop:end': DropSignalArg;
    }
}
declare module '@interactjs/core/types' {
    interface ActionMap {
        drop?: typeof drop;
    }
}
declare module '@interactjs/core/InteractStatic' {
    interface InteractStatic {
        /**
         * Returns or sets whether the dimensions of dropzone elements are calculated
         * on every dragmove or only on dragstart for the default dropChecker
         *
         * @param {boolean} [newValue] True to check on each move. False to check only
         * before start
         * @return {boolean | interact} The current setting or interact
         */
        dynamicDrop: (newValue?: boolean) => boolean | this;
    }
}
interface DropSignalArg {
    interaction: Interaction<'drag'>;
    dragEvent: DragEvent;
}
export interface ActiveDrop {
    dropzone: Interactable;
    element: Element;
    rect: Rect;
}
export interface DropState {
    cur: {
        dropzone: Interactable;
        element: Element;
    };
    prev: {
        dropzone: Interactable;
        element: Element;
    };
    rejected: boolean;
    events: FiredDropEvents;
    activeDrops: ActiveDrop[];
}
type FiredDropEvents = Partial<Record<'leave' | 'enter' | 'move' | 'drop' | 'activate' | 'deactivate', DropEvent>>;
declare const drop: Plugin;
export default drop;
