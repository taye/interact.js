import { Action, Interaction } from '@interactjs/core/Interaction';
import { Scope } from '@interactjs/core/scope';
export declare type EdgeName = 'top' | 'left' | 'bottom' | 'right';
declare function install(scope: Scope): void;
declare const resize: {
    install: typeof install;
    defaults: import("../interactjs/types").ResizableOptions;
    checker(_pointer: import("../interactjs/types").PointerType, _event: import("../interactjs/types").PointerEventType, interactable: import("@interactjs/core/Interactable").Interactable, element: Element, interaction: Interaction, rect: import("../interactjs/types").Rect): {
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
    getCursor(action: Action): string;
    defaultMargin: number;
};
export default resize;
