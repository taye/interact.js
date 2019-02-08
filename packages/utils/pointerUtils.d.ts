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
    coordsToEvent({ page, client, timeStamp }: any): {
        page: any;
        client: any;
        timeStamp: any;
        readonly pageX: any;
        readonly pageY: any;
        readonly clientX: any;
        readonly clientY: any;
    };
};
export default pointerUtils;
