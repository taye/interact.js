import * as utils from '../utils/index';
import Interactable from './Interactable';
import InteractEvent, { EventPhase } from './InteractEvent';
import PointerInfo from './PointerInfo';
import { ActionName } from './scope';
export interface ActionProps<T extends ActionName = any> {
    name: T;
    axis?: 'x' | 'y' | 'xy';
}
export interface StartAction extends ActionProps {
    name: ActionName | string;
}
export declare enum _ProxyValues {
    interactable = "",
    element = "",
    prepared = "",
    pointerIsDown = "",
    pointerWasMoved = "",
    _proxy = ""
}
export declare enum _ProxyMethods {
    start = "",
    move = "",
    end = "",
    stop = "",
    interacting = ""
}
export declare type PointerArgProps<T extends {} = {}> = {
    pointer: Interact.PointerType;
    event: Interact.PointerEventType;
    eventTarget: Interact.EventTarget;
    pointerIndex: number;
    interaction: Interaction;
} & T;
export interface DoPhaseArg {
    event: Interact.PointerEventType;
    phase: EventPhase;
    interaction: Interaction;
    iEvent: InteractEvent;
    preEnd?: boolean;
    type?: string;
}
declare module '@interactjs/core/scope' {
    interface SignalArgs {
        'interactions:new': {
            interaction: Interaction;
        };
        'interactions:down': PointerArgProps<{
            type: 'down';
        }>;
        'interactions:move': PointerArgProps<{
            type: 'move';
            dx: number;
            dy: number;
            duplicate: boolean;
        }>;
        'interactions:up': PointerArgProps<{
            type: 'up';
            curEventTarget: EventTarget;
        }>;
        'interactions:cancel': SignalArgs['interactions:up'] & {
            type: 'cancel';
            curEventTarget: EventTarget;
        };
        'interactions:update-pointer': PointerArgProps<{
            pointerInfo: PointerInfo;
            down: boolean;
        }>;
        'interactions:remove-pointer': PointerArgProps<{
            pointerInfo: PointerInfo;
        }>;
        'interactions:blur': any;
        'interactions:before-action-start': Omit<DoPhaseArg, 'iEvent'>;
        'interactions:action-start': DoPhaseArg;
        'interactions:after-action-start': DoPhaseArg;
        'interactions:before-action-move': Omit<DoPhaseArg, 'iEvent'>;
        'interactions:action-move': DoPhaseArg;
        'interactions:after-action-move': DoPhaseArg;
        'interactions:before-action-end': Omit<DoPhaseArg, 'iEvent'>;
        'interactions:action-end': DoPhaseArg;
        'interactions:after-action-end': DoPhaseArg;
        'interactions:stop': {
            interaction: Interaction;
        };
    }
}
export declare type _InteractionProxy = Pick<Interaction, keyof typeof _ProxyValues | keyof typeof _ProxyMethods>;
export declare class Interaction<T extends ActionName = any> {
    interactable: Interactable;
    element: Interact.Element;
    rect: Interact.Rect & Interact.Size;
    edges: {
        [P in keyof Interact.Rect]?: boolean;
    };
    _scopeFire: Interact.Scope['fire'];
    prepared: ActionProps<T>;
    pointerType: string;
    pointers: PointerInfo[];
    downEvent: Interact.PointerEventType;
    downPointer: Interact.PointerType;
    _latestPointer: {
        pointer: Interact.EventTarget;
        event: Interact.PointerEventType;
        eventTarget: Node;
    };
    prevEvent: InteractEvent<T>;
    pointerIsDown: boolean;
    pointerWasMoved: boolean;
    _interacting: boolean;
    _ending: boolean;
    _stopped: boolean;
    _proxy: _InteractionProxy;
    simulation: any;
    readonly pointerMoveTolerance: number;
    /**
     * @alias Interaction.prototype.move
     */
    doMove: (this: typeof utils) => any;
    coords: {
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
    /** */
    constructor({ pointerType, scopeFire }: {
        pointerType?: string;
        scopeFire: Interact.Scope['fire'];
    });
    pointerDown(pointer: Interact.PointerType, event: Interact.PointerEventType, eventTarget: Interact.EventTarget): void;
    /**
     * ```js
     * interact(target)
     *   .draggable({
     *     // disable the default drag start by down->move
     *     manualStart: true
     *   })
     *   // start dragging after the user holds the pointer down
     *   .on('hold', function (event) {
     *     var interaction = event.interaction
     *
     *     if (!interaction.interacting()) {
     *       interaction.start({ name: 'drag' },
     *                         event.interactable,
     *                         event.currentTarget)
     *     }
     * })
     * ```
     *
     * Start an action with the given Interactable and Element as tartgets. The
     * action must be enabled for the target Interactable and an appropriate
     * number of pointers must be held down - 1 for drag/resize, 2 for gesture.
     *
     * Use it with `interactable.<action>able({ manualStart: false })` to always
     * [start actions manually](https://github.com/taye/interact.js/issues/114)
     *
     * @param {object} action   The action to be performed - drag, resize, etc.
     * @param {Interactable} target  The Interactable to target
     * @param {Element} element The DOM Element to target
     * @return {object} interact
     */
    start(action: StartAction, interactable: Interactable, element: Interact.Element): boolean;
    pointerMove(pointer: Interact.PointerType, event: Interact.PointerEventType, eventTarget: Interact.EventTarget): void;
    /**
     * ```js
     * interact(target)
     *   .draggable(true)
     *   .on('dragmove', function (event) {
     *     if (someCondition) {
     *       // change the snap settings
     *       event.interactable.draggable({ snap: { targets: [] }})
     *       // fire another move event with re-calculated snap
     *       event.interaction.move()
     *     }
     *   })
     * ```
     *
     * Force a move of the current action at the same coordinates. Useful if
     * snap/restrict has been changed and you want a movement with the new
     * settings.
     */
    move(signalArg?: any): void;
    pointerUp(pointer: Interact.PointerType, event: Interact.PointerEventType, eventTarget: Interact.EventTarget, curEventTarget: Interact.EventTarget): void;
    documentBlur(event: any): void;
    /**
     * ```js
     * interact(target)
     *   .draggable(true)
     *   .on('move', function (event) {
     *     if (event.pageX > 1000) {
     *       // end the current action
     *       event.interaction.end()
     *       // stop all further listeners from being called
     *       event.stopImmediatePropagation()
     *     }
     *   })
     * ```
     *
     * @param {PointerEvent} [event]
     */
    end(event?: Interact.PointerEventType): void;
    currentAction(): T;
    interacting(): boolean;
    /** */
    stop(): void;
    getPointerIndex(pointer: any): number;
    getPointerInfo(pointer: any): PointerInfo;
    updatePointer(pointer: Interact.PointerType, event: Interact.PointerEventType, eventTarget: Interact.EventTarget, down?: boolean): number;
    removePointer(pointer: Interact.PointerType, event: Interact.PointerEventType): void;
    _updateLatestPointer(pointer: any, event: any, eventTarget: any): void;
    destroy(): void;
    _createPreparedEvent(event: Interact.PointerEventType, phase: EventPhase, preEnd?: boolean, type?: string): InteractEvent<T, EventPhase>;
    _fireEvent(iEvent: any): void;
    _doPhase(signalArg: Omit<DoPhaseArg, 'iEvent'> & {
        iEvent?: InteractEvent<T>;
    }): boolean;
    _now(): number;
}
export default Interaction;
export { PointerInfo };
