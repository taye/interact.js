import { ActionName, Scope } from '@interactjs/core/scope';
declare module '@interactjs/core/Interactable' {
    interface Interactable {
        draggable: DraggableMethod;
    }
}
declare module '@interactjs/core/defaultOptions' {
    interface ActionDefaults {
        drag: Interact.DraggableOptions;
    }
}
declare module '@interactjs/core/scope' {
    interface Actions {
        [ActionName.Drag]?: typeof drag;
    }
    enum ActionName {
        Drag = "drag"
    }
}
export declare type DragEvent = Interact.InteractEvent<ActionName.Drag>;
export declare type DraggableMethod = Interact.ActionMethod<Interact.DraggableOptions>;
declare function install(scope: Scope): void;
declare function beforeMove({ interaction }: {
    interaction: any;
}): void;
declare function move({ iEvent, interaction }: {
    iEvent: any;
    interaction: any;
}): void;
declare const drag: {
    install: typeof install;
    draggable: import("../types/types").ActionMethod<import("../types/types").DraggableOptions>;
    beforeMove: typeof beforeMove;
    move: typeof move;
    defaults: import("../types/types").DropzoneOptions;
    checker(_pointer: any, _event: any, interactable: any): {
        name: string;
        axis: any;
    };
    getCursor(): string;
};
export default drag;
