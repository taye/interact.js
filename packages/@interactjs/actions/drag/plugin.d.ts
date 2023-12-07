import type { InteractEvent } from '@interactjs/core/InteractEvent';
import type { PerActionDefaults } from '@interactjs/core/options';
import type { Plugin } from '@interactjs/core/scope';
import type { ListenersArg, OrBoolean } from '@interactjs/core/types';
declare module '@interactjs/core/Interactable' {
    interface Interactable {
        draggable(options: Partial<OrBoolean<DraggableOptions>> | boolean): this;
        draggable(): DraggableOptions;
        /**
         * ```js
         * interact(element).draggable({
         *     onstart: function (event) {},
         *     onmove : function (event) {},
         *     onend  : function (event) {},
         *
         *     // the axis in which the first movement must be
         *     // for the drag sequence to start
         *     // 'xy' by default - any direction
         *     startAxis: 'x' || 'y' || 'xy',
         *
         *     // 'xy' by default - don't restrict to one axis (move in any direction)
         *     // 'x' or 'y' to restrict movement to either axis
         *     // 'start' to restrict movement to the axis the drag started in
         *     lockAxis: 'x' || 'y' || 'xy' || 'start',
         *
         *     // max number of drags that can happen concurrently
         *     // with elements of this Interactable. Infinity by default
         *     max: Infinity,
         *
         *     // max number of drags that can target the same element+Interactable
         *     // 1 by default
         *     maxPerElement: 2
         * })
         *
         * var isDraggable = interact('element').draggable(); // true
         * ```
         *
         * Get or set whether drag actions can be performed on the target
         *
         * @param options - true/false or An object with event
         * listeners to be fired on drag events (object makes the Interactable
         * draggable)
         */
        draggable(options?: Partial<OrBoolean<DraggableOptions>> | boolean): this | DraggableOptions;
    }
}
declare module '@interactjs/core/options' {
    interface ActionDefaults {
        drag: DraggableOptions;
    }
}
declare module '@interactjs/core/types' {
    interface ActionMap {
        drag?: typeof drag;
    }
}
export type DragEvent = InteractEvent<'drag'>;
export interface DraggableOptions extends PerActionDefaults {
    startAxis?: 'x' | 'y' | 'xy';
    lockAxis?: 'x' | 'y' | 'xy' | 'start';
    oninertiastart?: ListenersArg;
    onstart?: ListenersArg;
    onmove?: ListenersArg;
    onend?: ListenersArg;
}
declare const drag: Plugin;
export default drag;
