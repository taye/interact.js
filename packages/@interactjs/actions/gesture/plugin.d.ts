import type { InteractEvent, EventPhase } from '@interactjs/core/InteractEvent';
import type { Interaction, DoPhaseArg } from '@interactjs/core/Interaction';
import type { PerActionDefaults } from '@interactjs/core/options';
import type { Plugin } from '@interactjs/core/scope';
import type { Rect, PointerType, ListenersArg, OrBoolean } from '@interactjs/core/types';
declare module '@interactjs/core/Interaction' {
    interface Interaction {
        gesture?: {
            angle: number;
            distance: number;
            scale: number;
            startAngle: number;
            startDistance: number;
        };
    }
}
declare module '@interactjs/core/Interactable' {
    interface Interactable {
        gesturable(options: Partial<OrBoolean<GesturableOptions>> | boolean): this;
        gesturable(): GesturableOptions;
        /**
         * ```js
         * interact(element).gesturable({
         *     onstart: function (event) {},
         *     onmove : function (event) {},
         *     onend  : function (event) {},
         *
         *     // limit multiple gestures.
         *     // See the explanation in {@link Interactable.draggable} example
         *     max: Infinity,
         *     maxPerElement: 1,
         * })
         *
         * var isGestureable = interact(element).gesturable()
         * ```
         *
         * Gets or sets whether multitouch gestures can be performed on the target
         *
         * @param options - true/false or An object with event listeners to be fired on gesture events (makes the Interactable gesturable)
         * @returns A boolean indicating if this can be the target of gesture events, or this Interactable
         */
        gesturable(options?: Partial<OrBoolean<GesturableOptions>> | boolean): this | GesturableOptions;
    }
}
declare module '@interactjs/core/options' {
    interface ActionDefaults {
        gesture: GesturableOptions;
    }
}
declare module '@interactjs/core/types' {
    interface ActionMap {
        gesture?: typeof gesture;
    }
}
export interface GesturableOptions extends PerActionDefaults {
    onstart?: ListenersArg;
    onmove?: ListenersArg;
    onend?: ListenersArg;
}
export interface GestureEvent extends InteractEvent<'gesture'> {
    distance: number;
    angle: number;
    da: number;
    scale: number;
    ds: number;
    box: Rect;
    touches: PointerType[];
}
export interface GestureSignalArg extends DoPhaseArg<'gesture', EventPhase> {
    iEvent: GestureEvent;
    interaction: Interaction<'gesture'>;
}
declare const gesture: Plugin;
export default gesture;
