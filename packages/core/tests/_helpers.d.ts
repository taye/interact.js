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
    coords: {
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
    event: ({
        coords: {
            page: import("../../types/types").Point;
            client: import("../../types/types").Point;
            timeStamp?: number;
            pointerId?: any;
            target?: any;
        };
        readonly page: any;
        readonly client: any;
        readonly timeStamp: any;
        readonly pageX: any;
        readonly pageY: any;
        readonly clientX: any;
        readonly clientY: any;
        readonly pointerId: any;
        readonly target: any;
    } & Touch & MouseEvent) | ({
        coords: {
            page: import("../../types/types").Point;
            client: import("../../types/types").Point;
            timeStamp?: number;
            pointerId?: any;
            target?: any;
        };
        readonly page: any;
        readonly client: any;
        readonly timeStamp: any;
        readonly pageX: any;
        readonly pageY: any;
        readonly clientX: any;
        readonly clientY: any;
        readonly pointerId: any;
        readonly target: any;
    } & Touch & PointerEvent) | ({
        coords: {
            page: import("../../types/types").Point;
            client: import("../../types/types").Point;
            timeStamp?: number;
            pointerId?: any;
            target?: any;
        };
        readonly page: any;
        readonly client: any;
        readonly timeStamp: any;
        readonly pageX: any;
        readonly pageY: any;
        readonly clientX: any;
        readonly clientY: any;
        readonly pointerId: any;
        readonly target: any;
    } & Touch & TouchEvent) | ({
        coords: {
            page: import("../../types/types").Point;
            client: import("../../types/types").Point;
            timeStamp?: number;
            pointerId?: any;
            target?: any;
        };
        readonly page: any;
        readonly client: any;
        readonly timeStamp: any;
        readonly pageX: any;
        readonly pageY: any;
        readonly clientX: any;
        readonly clientY: any;
        readonly pointerId: any;
        readonly target: any;
    } & Touch & import("@interactjs/core/InteractEvent").InteractEvent<any, any>) | ({
        coords: {
            page: import("../../types/types").Point;
            client: import("../../types/types").Point;
            timeStamp?: number;
            pointerId?: any;
            target?: any;
        };
        readonly page: any;
        readonly client: any;
        readonly timeStamp: any;
        readonly pageX: any;
        readonly pageY: any;
        readonly clientX: any;
        readonly clientY: any;
        readonly pointerId: any;
        readonly target: any;
    } & MouseEvent) | ({
        coords: {
            page: import("../../types/types").Point;
            client: import("../../types/types").Point;
            timeStamp?: number;
            pointerId?: any;
            target?: any;
        };
        readonly page: any;
        readonly client: any;
        readonly timeStamp: any;
        readonly pageX: any;
        readonly pageY: any;
        readonly clientX: any;
        readonly clientY: any;
        readonly pointerId: any;
        readonly target: any;
    } & MouseEvent & PointerEvent) | ({
        coords: {
            page: import("../../types/types").Point;
            client: import("../../types/types").Point;
            timeStamp?: number;
            pointerId?: any;
            target?: any;
        };
        readonly page: any;
        readonly client: any;
        readonly timeStamp: any;
        readonly pageX: any;
        readonly pageY: any;
        readonly clientX: any;
        readonly clientY: any;
        readonly pointerId: any;
        readonly target: any;
    } & MouseEvent & TouchEvent) | ({
        coords: {
            page: import("../../types/types").Point;
            client: import("../../types/types").Point;
            timeStamp?: number;
            pointerId?: any;
            target?: any;
        };
        readonly page: any;
        readonly client: any;
        readonly timeStamp: any;
        readonly pageX: any;
        readonly pageY: any;
        readonly clientX: any;
        readonly clientY: any;
        readonly pointerId: any;
        readonly target: any;
    } & MouseEvent & import("@interactjs/core/InteractEvent").InteractEvent<any, any>) | ({
        coords: {
            page: import("../../types/types").Point;
            client: import("../../types/types").Point;
            timeStamp?: number;
            pointerId?: any;
            target?: any;
        };
        readonly page: any;
        readonly client: any;
        readonly timeStamp: any;
        readonly pageX: any;
        readonly pageY: any;
        readonly clientX: any;
        readonly clientY: any;
        readonly pointerId: any;
        readonly target: any;
    } & PointerEvent & MouseEvent) | ({
        coords: {
            page: import("../../types/types").Point;
            client: import("../../types/types").Point;
            timeStamp?: number;
            pointerId?: any;
            target?: any;
        };
        readonly page: any;
        readonly client: any;
        readonly timeStamp: any;
        readonly pageX: any;
        readonly pageY: any;
        readonly clientX: any;
        readonly clientY: any;
        readonly pointerId: any;
        readonly target: any;
    } & PointerEvent) | ({
        coords: {
            page: import("../../types/types").Point;
            client: import("../../types/types").Point;
            timeStamp?: number;
            pointerId?: any;
            target?: any;
        };
        readonly page: any;
        readonly client: any;
        readonly timeStamp: any;
        readonly pageX: any;
        readonly pageY: any;
        readonly clientX: any;
        readonly clientY: any;
        readonly pointerId: any;
        readonly target: any;
    } & PointerEvent & TouchEvent) | ({
        coords: {
            page: import("../../types/types").Point;
            client: import("../../types/types").Point;
            timeStamp?: number;
            pointerId?: any;
            target?: any;
        };
        readonly page: any;
        readonly client: any;
        readonly timeStamp: any;
        readonly pageX: any;
        readonly pageY: any;
        readonly clientX: any;
        readonly clientY: any;
        readonly pointerId: any;
        readonly target: any;
    } & PointerEvent & import("@interactjs/core/InteractEvent").InteractEvent<any, any>) | ({
        coords: {
            page: import("../../types/types").Point;
            client: import("../../types/types").Point;
            timeStamp?: number;
            pointerId?: any;
            target?: any;
        };
        readonly page: any;
        readonly client: any;
        readonly timeStamp: any;
        readonly pageX: any;
        readonly pageY: any;
        readonly clientX: any;
        readonly clientY: any;
        readonly pointerId: any;
        readonly target: any;
    } & import("@interactjs/core/InteractEvent").InteractEvent<any, any> & MouseEvent) | ({
        coords: {
            page: import("../../types/types").Point;
            client: import("../../types/types").Point;
            timeStamp?: number;
            pointerId?: any;
            target?: any;
        };
        readonly page: any;
        readonly client: any;
        readonly timeStamp: any;
        readonly pageX: any;
        readonly pageY: any;
        readonly clientX: any;
        readonly clientY: any;
        readonly pointerId: any;
        readonly target: any;
    } & import("@interactjs/core/InteractEvent").InteractEvent<any, any> & PointerEvent) | ({
        coords: {
            page: import("../../types/types").Point;
            client: import("../../types/types").Point;
            timeStamp?: number;
            pointerId?: any;
            target?: any;
        };
        readonly page: any;
        readonly client: any;
        readonly timeStamp: any;
        readonly pageX: any;
        readonly pageY: any;
        readonly clientX: any;
        readonly clientY: any;
        readonly pointerId: any;
        readonly target: any;
    } & import("@interactjs/core/InteractEvent").InteractEvent<any, any> & TouchEvent) | ({
        coords: {
            page: import("../../types/types").Point;
            client: import("../../types/types").Point;
            timeStamp?: number;
            pointerId?: any;
            target?: any;
        };
        readonly page: any;
        readonly client: any;
        readonly timeStamp: any;
        readonly pageX: any;
        readonly pageY: any;
        readonly clientX: any;
        readonly clientY: any;
        readonly pointerId: any;
        readonly target: any;
    } & import("@interactjs/core/InteractEvent").InteractEvent<any, any>);
};
