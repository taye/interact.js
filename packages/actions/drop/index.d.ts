import { Scope } from '@interactjs/core/scope';
declare module '@interactjs/core/Interactable' {
    interface Interactable {
        dropzone?: (options: any) => Interactable | {
            [key: string]: any;
        };
        dropCheck?: (dragEvent: any, event: any, draggable: any, draggableElement: any, dropElement: any, rect: any) => boolean;
    }
}
declare module '@interactjs/core/Interaction' {
    interface Interaction {
        dropStatus?: any;
    }
}
declare module '@interactjs/core/defaultOptions' {
    interface Defaults {
        drop?: any;
    }
}
declare module '@interactjs/core/scope' {
    interface Scope {
        dynamicDrop?: boolean;
    }
}
declare module '@interactjs/interact/interact' {
    interface InteractStatic {
        dynamicDrop?: (newValue?: boolean) => boolean | InteractStatic;
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
    defaults: {
        enabled: boolean;
        accept: any;
        overlap: string;
    };
};
export default drop;
