import { MockCoords } from '@interactjs/utils/pointerUtils';
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
export declare function mockScope(options?: any): any;
export declare function mockSignals(): any;
export declare function mockInteractable(props?: {}): any;
export declare function getProps<T extends {}, K extends keyof T>(src: T, props: K[]): Pick<T, K>;
export declare function testEnv({ plugins, target, rect, }?: {
    plugins?: Interact.Plugin[];
    target?: Interact.Target;
    rect?: Interact.Rect;
}): {
    scope: import("@interactjs/core/scope").Scope;
    interaction: import("@interactjs/core/Interaction").Interaction<any>;
    target: import("../../types/types").Target;
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
    } & Touch & import("@interactjs/core/InteractEvent").InteractEvent<any, any>) | ({
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
    } & MouseEvent & import("@interactjs/core/InteractEvent").InteractEvent<any, any>) | ({
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
    } & PointerEvent & import("@interactjs/core/InteractEvent").InteractEvent<any, any>) | ({
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
    } & import("@interactjs/core/InteractEvent").InteractEvent<any, any> & MouseEvent) | ({
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
    } & import("@interactjs/core/InteractEvent").InteractEvent<any, any> & PointerEvent) | ({
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
    } & import("@interactjs/core/InteractEvent").InteractEvent<any, any> & TouchEvent) | ({
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
    } & import("@interactjs/core/InteractEvent").InteractEvent<any, any>);
};
