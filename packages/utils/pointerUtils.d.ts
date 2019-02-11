import pointerExtend from './pointerExtend';
declare const pointerUtils: {
    copyCoords(dest: any, src: any): void;
    setCoordDeltas(targetObj: any, prev: any, cur: any): void;
    setCoordVelocity(targetObj: any, delta: any): void;
    isNativePointer(pointer: any): boolean;
    getXY(type: any, pointer: any, xy: any): any;
    getPageXY(pointer: import("../types/types").PointerType, page?: import("../types/types").Point): import("../types/types").Point;
    getClientXY(pointer: any, client: any): any;
    getPointerId(pointer: any): any;
    setCoords(targetObj: any, pointers: any[], timeStamp?: number): void;
    pointerExtend: typeof pointerExtend;
    getTouchPair(event: any): any[];
    pointerAverage(pointers: PointerEvent[] | Event[]): {
        pageX: number;
        pageY: number;
        clientX: number;
        clientY: number;
        screenX: number;
        screenY: number;
    };
    touchBBox(event: Event | (Touch | MouseEvent | PointerEvent | TouchEvent | import("@interactjs/core/InteractEvent").InteractEvent<any, any>)[]): {
        x: number;
        y: number;
        left: number;
        top: number;
        right: number;
        bottom: number;
        width: number;
        height: number;
    };
    touchDistance(event: any, deltaSource: any): number;
    touchAngle(event: any, deltaSource: any): number;
    getPointerType(pointer: any): any;
    getEventTargets(event: any): any[];
    newCoords(): {
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
    coordsToEvent({ page, client, timeStamp }: {
        page: import("../types/types").Point;
        client: import("../types/types").Point;
        timeStamp?: number;
    }): ({
        page: import("../types/types").Point;
        client: import("../types/types").Point;
        timeStamp: number;
        readonly pageX: number;
        readonly pageY: number;
        readonly clientX: number;
        readonly clientY: number;
    } & Touch & MouseEvent) | ({
        page: import("../types/types").Point;
        client: import("../types/types").Point;
        timeStamp: number;
        readonly pageX: number;
        readonly pageY: number;
        readonly clientX: number;
        readonly clientY: number;
    } & Touch & PointerEvent) | ({
        page: import("../types/types").Point;
        client: import("../types/types").Point;
        timeStamp: number;
        readonly pageX: number;
        readonly pageY: number;
        readonly clientX: number;
        readonly clientY: number;
    } & Touch & TouchEvent) | ({
        page: import("../types/types").Point;
        client: import("../types/types").Point;
        timeStamp: number;
        readonly pageX: number;
        readonly pageY: number;
        readonly clientX: number;
        readonly clientY: number;
    } & Touch & import("@interactjs/core/InteractEvent").InteractEvent<any, any>) | ({
        page: import("../types/types").Point;
        client: import("../types/types").Point;
        timeStamp: number;
        readonly pageX: number;
        readonly pageY: number;
        readonly clientX: number;
        readonly clientY: number;
    } & MouseEvent) | ({
        page: import("../types/types").Point;
        client: import("../types/types").Point;
        timeStamp: number;
        readonly pageX: number;
        readonly pageY: number;
        readonly clientX: number;
        readonly clientY: number;
    } & MouseEvent & PointerEvent) | ({
        page: import("../types/types").Point;
        client: import("../types/types").Point;
        timeStamp: number;
        readonly pageX: number;
        readonly pageY: number;
        readonly clientX: number;
        readonly clientY: number;
    } & MouseEvent & TouchEvent) | ({
        page: import("../types/types").Point;
        client: import("../types/types").Point;
        timeStamp: number;
        readonly pageX: number;
        readonly pageY: number;
        readonly clientX: number;
        readonly clientY: number;
    } & MouseEvent & import("@interactjs/core/InteractEvent").InteractEvent<any, any>) | ({
        page: import("../types/types").Point;
        client: import("../types/types").Point;
        timeStamp: number;
        readonly pageX: number;
        readonly pageY: number;
        readonly clientX: number;
        readonly clientY: number;
    } & PointerEvent & MouseEvent) | ({
        page: import("../types/types").Point;
        client: import("../types/types").Point;
        timeStamp: number;
        readonly pageX: number;
        readonly pageY: number;
        readonly clientX: number;
        readonly clientY: number;
    } & PointerEvent) | ({
        page: import("../types/types").Point;
        client: import("../types/types").Point;
        timeStamp: number;
        readonly pageX: number;
        readonly pageY: number;
        readonly clientX: number;
        readonly clientY: number;
    } & PointerEvent & TouchEvent) | ({
        page: import("../types/types").Point;
        client: import("../types/types").Point;
        timeStamp: number;
        readonly pageX: number;
        readonly pageY: number;
        readonly clientX: number;
        readonly clientY: number;
    } & PointerEvent & import("@interactjs/core/InteractEvent").InteractEvent<any, any>) | ({
        page: import("../types/types").Point;
        client: import("../types/types").Point;
        timeStamp: number;
        readonly pageX: number;
        readonly pageY: number;
        readonly clientX: number;
        readonly clientY: number;
    } & import("@interactjs/core/InteractEvent").InteractEvent<any, any> & MouseEvent) | ({
        page: import("../types/types").Point;
        client: import("../types/types").Point;
        timeStamp: number;
        readonly pageX: number;
        readonly pageY: number;
        readonly clientX: number;
        readonly clientY: number;
    } & import("@interactjs/core/InteractEvent").InteractEvent<any, any> & PointerEvent) | ({
        page: import("../types/types").Point;
        client: import("../types/types").Point;
        timeStamp: number;
        readonly pageX: number;
        readonly pageY: number;
        readonly clientX: number;
        readonly clientY: number;
    } & import("@interactjs/core/InteractEvent").InteractEvent<any, any> & TouchEvent) | ({
        page: import("../types/types").Point;
        client: import("../types/types").Point;
        timeStamp: number;
        readonly pageX: number;
        readonly pageY: number;
        readonly clientX: number;
        readonly clientY: number;
    } & import("@interactjs/core/InteractEvent").InteractEvent<any, any>);
};
export default pointerUtils;
