import { MockCoords } from '../../utils/pointerUtils';
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
export declare function newPointer(n?: number): import("../../types/types").PointerType;
export declare function mockScope(options?: any): import("@interactjs/core/scope").Scope;
export declare function getProps<T extends object, K extends keyof T>(src: T, props: K[]): Pick<T, K>;
export declare function testEnv<T extends Interact.Target = HTMLElement>({ plugins, target, rect, }?: {
    plugins?: Interact.Plugin[];
    target?: T;
    rect?: Interact.Rect;
}): {
    scope: import("@interactjs/core/scope").Scope;
    interaction: import("@interactjs/core/Interaction").Interaction<any>;
    target: T;
    interactable: import("@interactjs/core/Interactable").Interactable;
    coords: MockCoords;
    event: ({
        coords: MockCoords;
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
    } & MouseEvent) | ({
        coords: MockCoords;
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
    } & MouseEvent & PointerEvent) | ({
        coords: MockCoords;
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
    } & MouseEvent & import("../../types/types").InteractEvent<any, any>) | ({
        coords: MockCoords;
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
    } & MouseEvent & TouchEvent) | ({
        coords: MockCoords;
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
    } & Touch & MouseEvent) | ({
        coords: MockCoords;
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
    } & Touch & PointerEvent) | ({
        coords: MockCoords;
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
    } & Touch & import("../../types/types").InteractEvent<any, any>) | ({
        coords: MockCoords;
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
    } & Touch & TouchEvent) | ({
        coords: MockCoords;
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
    } & PointerEvent & MouseEvent) | ({
        coords: MockCoords;
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
    } & PointerEvent) | ({
        coords: MockCoords;
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
    } & PointerEvent & import("../../types/types").InteractEvent<any, any>) | ({
        coords: MockCoords;
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
    } & PointerEvent & TouchEvent) | ({
        coords: MockCoords;
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
    } & import("../../types/types").InteractEvent<any, any> & MouseEvent) | ({
        coords: MockCoords;
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
    } & import("../../types/types").InteractEvent<any, any> & PointerEvent) | ({
        coords: MockCoords;
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
    } & import("../../types/types").InteractEvent<any, any>) | ({
        coords: MockCoords;
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
    } & import("../../types/types").InteractEvent<any, any> & TouchEvent);
};
export declare function timeout(n: any): Promise<unknown>;
