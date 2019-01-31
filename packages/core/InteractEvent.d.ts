import Interactable from './Interactable';
import Interaction from './Interaction';
declare class InteractEvent {
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
    interaction: any;
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
    swipe: ReturnType<InteractEvent['getSwipe']>;
    timeStamp: any;
    dragEnter?: Element;
    dragLeave?: Element;
    axes?: Interact.Point;
    distance?: number;
    angle?: number;
    da?: number;
    scale?: number;
    ds?: number;
    box?: Interact.Rect;
    preEnd?: boolean;
    immediatePropagationStopped: boolean;
    propagationStopped: boolean;
    /** */
    constructor(interaction: Interaction, event: Interact.PointerEventType, actionName: string, phase: string, element: Element, related?: Element, preEnd?: boolean, type?: string);
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
        speed: any;
        velocity: {
            x: any;
            y: any;
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
