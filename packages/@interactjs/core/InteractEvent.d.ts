import type { Point, FullRect, PointerEventType, Element, ActionName } from '@interactjs/core/types';
import { BaseEvent } from './BaseEvent';
import type { Interaction } from './Interaction';
export type EventPhase = keyof PhaseMap;
export interface PhaseMap {
    start: true;
    move: true;
    end: true;
}
export interface InteractEvent {
    pageX: number;
    pageY: number;
    clientX: number;
    clientY: number;
    dx: number;
    dy: number;
    velocityX: number;
    velocityY: number;
}
export declare class InteractEvent<T extends ActionName = never, P extends EventPhase = EventPhase> extends BaseEvent<T> {
    target: Element;
    currentTarget: Element;
    relatedTarget: Element | null;
    screenX?: number;
    screenY?: number;
    button: number;
    buttons: number;
    ctrlKey: boolean;
    shiftKey: boolean;
    altKey: boolean;
    metaKey: boolean;
    page: Point;
    client: Point;
    delta: Point;
    rect: FullRect;
    x0: number;
    y0: number;
    t0: number;
    dt: number;
    duration: number;
    clientX0: number;
    clientY0: number;
    velocity: Point;
    speed: number;
    swipe: ReturnType<InteractEvent<T>['getSwipe']>;
    axes?: 'x' | 'y' | 'xy';
    constructor(interaction: Interaction<T>, event: PointerEventType, actionName: T, phase: P, element: Element, preEnd?: boolean, type?: string);
    getSwipe(): {
        up: boolean;
        down: boolean;
        left: boolean;
        right: boolean;
        angle: number;
        speed: number;
        velocity: {
            x: number;
            y: number;
        };
    };
    preventDefault(): void;
    /**
     * Don't call listeners on the remaining targets
     */
    stopImmediatePropagation(): void;
    /**
     * Don't call any other listeners (even on the current target)
     */
    stopPropagation(): void;
}
