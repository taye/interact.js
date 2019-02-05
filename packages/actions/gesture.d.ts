import { ActionName, Scope } from '@interactjs/core/scope';
export declare type GesturableMethod = (options?: Interact.GesturableOptions | boolean) => Interact.Interactable | Interact.GesturableOptions;
declare module '@interactjs/core/Interactable' {
    interface Interactable {
        gesturable: GesturableMethod;
    }
}
declare module '@interactjs/core/defaultOptions' {
    interface ActionDefaults {
        gesture?: Interact.GesturableOptions;
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
export declare type GestureEvent = Interact.InteractEvent<ActionName.Gesture>;
declare function install(scope: Scope): void;
declare const gesture: {
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
