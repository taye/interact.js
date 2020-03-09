export declare type GesturableMethod = Interact.ActionMethod<Interact.GesturableOptions>;
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
declare module '@interactjs/core/defaultOptions' {
    interface ActionDefaults {
        gesture: Interact.GesturableOptions;
    }
}
declare module '@interactjs/core/scope' {
    interface ActionMap {
        gesture?: typeof gesture;
    }
}
export interface GestureEvent extends Interact.InteractEvent<'gesture'> {
    distance: number;
    angle: number;
    da: number;
    scale: number;
    ds: number;
    box: Interact.Rect;
    touches: Interact.PointerType[];
}
export interface GestureSignalArg extends Interact.DoPhaseArg<'gesture', Interact.EventPhase> {
    iEvent: GestureEvent;
    interaction: Interact.Interaction<'gesture'>;
}
declare const gesture: Interact.Plugin;
export default gesture;
