import { ActionProps, Interaction } from '@interactjs/core/Interaction';
import { ActionName, Scope } from '@interactjs/core/scope';
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
}
declare function install(scope: Scope): void;
declare const resize: {
    id: string;
    install: typeof install;
    defaults: import("../types/types").ResizableOptions;
    checker(_pointer: import("../types/types").PointerType, _event: import("../types/types").PointerEventType, interactable: import("@interactjs/core/Interactable").Interactable, element: Element, interaction: Interaction<any>, rect: import("../types/types").Rect): {
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
    getCursor({ edges, axis, name }: ActionProps<any>): string;
    defaultMargin: number;
};
export default resize;
