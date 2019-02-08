import Interactable from './Interactable';
import Interaction from './Interaction';
import { ActionName } from './scope';
export declare enum EventPhase {
    Start = "start",
    Move = "move",
    End = "end",
    _NONE = ""
}
export declare class InteractEvent<T extends ActionName = any, P extends EventPhase = EventPhase._NONE> {
    type: string;
    target: Element;
    relatedTarget: Element | null;
    currentTarget: Element;
    screenX?: number;
    screenY?: number;
    button: number;
    buttons: number;
    ctrlKey: boolean;
    shiftKey: boolean;
    altKey: boolean;
    metaKey: boolean;
    interactable: Interactable;
    interaction: Interaction<T>;
    page: Interact.Point;
    client: Interact.Point;
    delta: Interact.Point;
    x0: number;
    y0: number;
    t0: number;
    dt: number;
    duration: number;
    clientX0: number;
    clientY0: number;
    velocity: Interact.Point;
    speed: number;
    swipe: ReturnType<InteractEvent<T>['getSwipe']>;
    timeStamp: any;
    dragEnter?: Element;
    dragLeave?: Element;
    axes?: Interact.Point;
    preEnd?: boolean;
    immediatePropagationStopped: boolean;
    propagationStopped: boolean;
    /** */
    constructor(interaction: Interaction, event: Interact.PointerEventType, actionName: T, phase: P, element: Element, related?: Element, preEnd?: boolean, type?: string);
    pageX: number;
    pageY: number;
    clientX: number;
    clientY: number;
    dx: number;
    dy: number;
    velocityX: number;
    velocityY: number;
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
export default InteractEvent;
