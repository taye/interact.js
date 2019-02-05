import InteractEvent from '@interactjs/core/InteractEvent';
import { Scope } from '@interactjs/core/scope';
export declare type DropzoneMethod = (options?: Interact.DropzoneOptions | boolean) => Interact.Interactable | Interact.DropzoneOptions;
declare module '@interactjs/core/Interactable' {
    interface Interactable {
        dropzone: DropzoneMethod;
        dropCheck: (dragEvent: InteractEvent, event: Interact.PointerEventType, draggable: Interactable, draggableElement: Element, dropElemen: Element, rect: any) => boolean;
    }
}
declare module '@interactjs/core/Interaction' {
    interface Interaction {
        dropStatus?: {
            [key: string]: any;
        };
    }
}
declare module '@interactjs/core/defaultOptions' {
    interface ActionDefaults {
        drop?: Interact.DropzoneOptions;
    }
}
declare module '@interactjs/core/scope' {
    interface Scope {
        dynamicDrop?: boolean;
    }
}
declare module '@interactjs/interact/interact' {
    interface InteractStatic {
        dynamicDrop: (newValue?: boolean) => boolean | Interact.interact;
    }
}
declare function install(scope: Scope): void;
declare function getActiveDrops(scope: Scope, dragElement: Element): any[];
declare function getDrop({ dropStatus, target: draggable, element: dragElement }: {
    dropStatus: any;
    target: any;
    element: any;
}, dragEvent: any, pointerEvent: any): any;
declare function getDropEvents(interaction: any, _pointerEvent: any, dragEvent: any): {
    enter: any;
    leave: any;
    activate: any;
    deactivate: any;
    move: any;
    drop: any;
};
declare function fireDropEvents(interaction: any, events: any): void;
declare const drop: {
    install: typeof install;
    getActiveDrops: typeof getActiveDrops;
    getDrop: typeof getDrop;
    getDropEvents: typeof getDropEvents;
    fireDropEvents: typeof fireDropEvents;
    defaults: import("../../types").DropzoneOptions;
};
export default drop;
