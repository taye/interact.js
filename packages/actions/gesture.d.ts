import { ActionName, Scope } from '@interactjs/core/scope';
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
    interface Actions {
        [ActionName.Gesture]?: typeof gesture;
    }
    enum ActionName {
        Gesture = "gesture"
    }
}
export interface GestureEvent extends Interact.InteractEvent<ActionName.Gesture> {
    distance: number;
    angle: number;
    da: number;
    scale: number;
    ds: number;
    box: Interact.Rect;
    touches: Interact.PointerType[];
}
export interface GestureSignalArg extends Interact.SignalArg {
    iEvent: GestureEvent;
    interaction: Interact.Interaction<ActionName.Gesture>;
    event: Interact.PointerEventType | GestureEvent;
}
declare function install(scope: Scope): void;
declare const gesture: {
    id: string;
    install: typeof install;
    defaults: {};
    checker(_pointer: any, _event: any, _interactable: any, _element: any, interaction: {
        pointers: {
            length: number;
        };
    }): {
        name: string;
    };
    getCursor(): string;
};
export default gesture;
