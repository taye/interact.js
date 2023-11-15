import type { InteractEvent, EventPhase } from '@interactjs/core/InteractEvent';
import type { Interaction, DoPhaseArg } from '@interactjs/core/Interaction';
import type { PerActionDefaults } from '@interactjs/core/options';
import type { Plugin } from '@interactjs/core/scope';
import type { ActionMethod, Rect, PointerType, ListenersArg } from '@interactjs/core/types';
export declare type GesturableMethod = ActionMethod<GesturableOptions>;
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
        gesturable: GesturableMethod;
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
