import { Interaction } from '../core/Interaction';
import { ActionName, Scope } from '../core/scope';
export declare type EdgeName = 'top' | 'left' | 'bottom' | 'right';
export declare type ResizableMethod = Interact.ActionMethod<Interact.ResizableOptions>;
declare module '@interactjs/core/Interactable' {
    interface Interactable {
        resizable: ResizableMethod;
    }
}
declare module '@interactjs/core/Interaction' {
    interface Interaction {
        resizeAxes: 'x' | 'y' | 'xy';
        resizeRects: {
            start: Interact.FullRect;
            current: Interact.Rect;
            inverted: Interact.FullRect;
            previous: Interact.FullRect;
            delta: Interact.FullRect;
        };
        resizeStartAspectRatio: number;
    }
    interface ActionProps {
        edges?: {
            [edge in 'top' | 'left' | 'bottom' | 'right']?: boolean;
        };
        _linkedEdges?: {
            [edge in 'top' | 'left' | 'bottom' | 'right']?: boolean;
        };
    }
}
declare module '@interactjs/core/defaultOptions' {
    interface ActionDefaults {
        resize: Interact.ResizableOptions;
    }
}
declare module '@interactjs/core/scope' {
    interface Actions {
        [ActionName.Resize]?: typeof resize;
    }
    enum ActionName {
        Resize = "resize"
    }
}
export interface ResizeEvent extends Interact.InteractEvent<ActionName.Resize> {
    deltaRect?: Interact.FullRect;
    edges?: Interact.ActionProps['edges'];
}
declare function install(scope: Scope): void;
declare const resize: {
    id: string;
    install: typeof install;
    listeners: {
        'interactions:new': ({ interaction }: {
            interaction: any;
        }) => void;
        'interactions:action-start': (arg: any) => void;
        'interactions:action-move': (arg: any) => void;
        'interactions:action-end': typeof end;
    };
    defaults: import("../types/types").ResizableOptions;
    checker(_pointer: import("../types/types").PointerType, _event: import("../types/types").PointerEventType, interactable: import("@interactjs/core/Interactable").Interactable, element: import("../types/types").Element, interaction: Interaction<any>, rect: import("../types/types").Rect): {
        name: string;
        edges: {
            [edge: string]: boolean;
        };
        axes?: undefined;
    } | {
        name: string;
        axes: string;
        edges?: undefined;
    };
    cursors: {
        x: string;
        y: string;
        xy: string;
        top: string;
        left: string;
        bottom: string;
        right: string;
        topleft: string;
        bottomright: string;
        topright: string;
        bottomleft: string;
    };
    getCursor({ edges, axis, name }: import("@interactjs/core/Interaction").ActionProps<any>): string;
    defaultMargin: number;
};
declare function end({ iEvent, interaction }: {
    iEvent: ResizeEvent;
    interaction: Interaction;
}): void;
export default resize;
