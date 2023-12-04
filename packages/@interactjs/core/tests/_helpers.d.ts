import * as pointerUtils from '@interactjs/utils/pointerUtils';
import type { PointerType, Rect, Target, ActionProps } from '@interactjs/core/types';
import type { Plugin } from '../scope';
import { Scope } from '../scope';
export declare function unique(): number;
export declare function uniqueProps(obj: any): void;
export declare function newCoordsSet(n?: number): {
    start: {
        page: {
            x: number;
            y: number;
        };
        client: {
            x: number;
            y: number;
        };
        timeStamp: number;
    };
    cur: {
        page: {
            x: number;
            y: number;
        };
        client: {
            x: number;
            y: number;
        };
        timeStamp: number;
    };
    prev: {
        page: {
            x: number;
            y: number;
        };
        client: {
            x: number;
            y: number;
        };
        timeStamp: number;
    };
    delta: {
        page: {
            x: number;
            y: number;
        };
        client: {
            x: number;
            y: number;
        };
        timeStamp: number;
    };
    velocity: {
        page: {
            x: number;
            y: number;
        };
        client: {
            x: number;
            y: number;
        };
        timeStamp: number;
    };
};
export declare function newPointer(n?: number): PointerType;
export declare function mockScope({ document }?: any): Scope;
export declare function getProps<T extends {
    [key: string]: any;
}, K extends keyof T>(src: T, props: readonly K[]): Pick<T, K>;
export declare function testEnv<T extends Target = HTMLElement>({ plugins, target, rect, document, }?: {
    plugins?: Plugin[];
    target?: T;
    rect?: Rect;
    document?: Document;
}): {
    scope: Scope;
    interaction: import("@interactjs/core/Interaction").Interaction<keyof import("@interactjs/core/types").ActionMap>;
    target: T extends undefined ? HTMLElement : T;
    interactable: import("@interactjs/core/Interactable").Interactable;
    coords: pointerUtils.MockCoords;
    event: {
        coords: pointerUtils.MockCoords;
        readonly page: any;
        readonly client: any;
        readonly timeStamp: any;
        readonly pageX: any;
        readonly pageY: any;
        readonly clientX: any;
        readonly clientY: any;
        readonly pointerId: any;
        readonly target: any;
        readonly type: any;
        readonly pointerType: any;
        readonly buttons: any;
        preventDefault(): void;
    } & PointerType & import("@interactjs/core/types").PointerEventType;
    interact: import("@interactjs/core/InteractStatic").InteractStatic;
    start: <T_1 extends keyof import("@interactjs/core/types").ActionMap>(action: ActionProps<T_1>) => boolean;
    stop: () => void;
    down: () => void;
    move: (force?: boolean) => void;
    up: () => void;
};
export declare function timeout(n: number): Promise<unknown>;
export declare function ltrbwh(left: number, top: number, right: number, bottom: number, width: number, height: number): {
    left: number;
    top: number;
    right: number;
    bottom: number;
    width: number;
    height: number;
};
