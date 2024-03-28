import type { InteractEvent } from '@interactjs/core/InteractEvent';
import type { CoordsSetMember, PointerType, Point, PointerEventType } from '@interactjs/core/types';
import pointerExtend from './pointerExtend';
export declare function copyCoords(dest: CoordsSetMember, src: CoordsSetMember): void;
export declare function setCoordDeltas(targetObj: CoordsSetMember, prev: CoordsSetMember, cur: CoordsSetMember): void;
export declare function setCoordVelocity(targetObj: CoordsSetMember, delta: CoordsSetMember): void;
export declare function setZeroCoords(targetObj: CoordsSetMember): void;
export declare function isNativePointer(pointer: any): boolean;
export declare function getXY(type: string, pointer: PointerType | InteractEvent, xy: Point): Point;
export declare function getPageXY(pointer: PointerType | InteractEvent, page?: Point): Point;
export declare function getClientXY(pointer: PointerType, client: Point): Point;
export declare function getPointerId(pointer: {
    pointerId?: number;
    identifier?: number;
    type?: string;
}): number;
export declare function setCoords(dest: CoordsSetMember, pointers: any[], timeStamp: number): void;
export declare function getTouchPair(event: TouchEvent | PointerType[]): PointerType[];
export declare function pointerAverage(pointers: PointerType[]): {
    pageX: number;
    pageY: number;
    clientX: number;
    clientY: number;
    screenX: number;
    screenY: number;
};
export declare function touchBBox(event: PointerType[]): {
    x: number;
    y: number;
    left: number;
    top: number;
    right: number;
    bottom: number;
    width: number;
    height: number;
};
export declare function touchDistance(event: PointerType[] | TouchEvent, deltaSource: string): number;
export declare function touchAngle(event: PointerType[] | TouchEvent, deltaSource: string): number;
export declare function getPointerType(pointer: {
    pointerType?: string;
    identifier?: number;
    type?: string;
}): string;
export declare function getEventTargets(event: Event): any[];
export declare function newCoords(): CoordsSetMember;
export declare function coordsToEvent(coords: MockCoords): {
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
    preventDefault(): void;
} & PointerType & PointerEventType;
export interface MockCoords {
    page: Point;
    client: Point;
    timeStamp?: number;
    pointerId?: any;
    target?: any;
    type?: string;
    pointerType?: string;
    buttons?: number;
}
export { pointerExtend };
