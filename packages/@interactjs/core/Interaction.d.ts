import type { Element, EdgeOptions, PointerEventType, PointerType, FullRect, CoordsSet } from '@interactjs/core/types';
import type { EventPhase } from './InteractEvent';
import { InteractEvent } from './InteractEvent';
import type { Interactable } from './Interactable';
import { PointerInfo } from './PointerInfo';
import type { Scope } from './scope';
import type { ActionName, ActionProps } from './types';
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
    pointer: PointerType;
    event: PointerEventType;
    eventTarget: Node;
    pointerIndex: number;
    pointerInfo: PointerInfo;
    interaction: Interaction<never>;
} & T;
export interface DoPhaseArg<T extends ActionName, P extends EventPhase> {
    event: PointerEventType;
    phase: EventPhase;
    interaction: Interaction<T>;
    iEvent: InteractEvent<T, P>;
    preEnd?: boolean;
    type?: string;
}
export declare type DoAnyPhaseArg = DoPhaseArg<ActionName, EventPhase>;
declare module '@interactjs/core/scope' {
    interface SignalArgs {
        'interactions:new': {
            interaction: Interaction<ActionName>;
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
            down: boolean;
        }>;
        'interactions:remove-pointer': PointerArgProps;
        'interactions:blur': {
            interaction: Interaction<never>;
            event: Event;
            type: 'blur';
        };
        'interactions:before-action-start': Omit<DoAnyPhaseArg, 'iEvent'>;
        'interactions:action-start': DoAnyPhaseArg;
        'interactions:after-action-start': DoAnyPhaseArg;
        'interactions:before-action-move': Omit<DoAnyPhaseArg, 'iEvent'>;
        'interactions:action-move': DoAnyPhaseArg;
        'interactions:after-action-move': DoAnyPhaseArg;
        'interactions:before-action-end': Omit<DoAnyPhaseArg, 'iEvent'>;
        'interactions:action-end': DoAnyPhaseArg;
        'interactions:after-action-end': DoAnyPhaseArg;
        'interactions:stop': {
            interaction: Interaction;
        };
    }
}
export declare type InteractionProxy<T extends ActionName | null = never> = Pick<Interaction<T>, keyof typeof _ProxyValues | keyof typeof _ProxyMethods>;
export declare class Interaction<T extends ActionName | null = ActionName> {
    interactable: Interactable | null;
    element: Element | null;
    rect: FullRect | null;
    _rects?: {
        start: FullRect;
        corrected: FullRect;
        previous: FullRect;
        delta: FullRect;
    };
    edges: EdgeOptions | null;
    _scopeFire: Scope['fire'];
    prepared: ActionProps<T>;
    pointerType: string;
    pointers: PointerInfo[];
    downEvent: PointerEventType | null;
    downPointer: PointerType;
    _latestPointer: {
        pointer: PointerType;
        event: PointerEventType;
        eventTarget: Node;
    };
    prevEvent: InteractEvent<T, EventPhase>;
    pointerIsDown: boolean;
    pointerWasMoved: boolean;
    _interacting: boolean;
    _ending: boolean;
    _stopped: boolean;
    _proxy: InteractionProxy<T> | null;
    simulation: any;
    /**
     * @alias Interaction.prototype.move
     */
    doMove: (this: void) => any;
    coords: CoordsSet;
    readonly _id: number;
    /** */
    constructor({ pointerType, scopeFire }: {
        pointerType?: string;
        scopeFire: Scope['fire'];
    });
    pointerDown(pointer: PointerType, event: PointerEventType, eventTarget: Node): void;
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
     * @return {Boolean} Whether the interaction was successfully started
     */
    start<A extends ActionName>(action: ActionProps<A>, interactable: Interactable, element: Element): boolean;
    pointerMove(pointer: PointerType, event: PointerEventType, eventTarget: Node): void;
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
    pointerUp(pointer: PointerType, event: PointerEventType, eventTarget: Node, curEventTarget: EventTarget): void;
    documentBlur(event: Event): void;
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
    end(event?: PointerEventType): void;
    currentAction(): T;
    interacting(): boolean;
    /** */
    stop(): void;
    getPointerIndex(pointer: any): number;
    getPointerInfo(pointer: any): PointerInfo;
    updatePointer(pointer: PointerType, event: PointerEventType, eventTarget: Node, down?: boolean): number;
    removePointer(pointer: PointerType, event: PointerEventType): void;
    _updateLatestPointer(pointer: PointerType, event: PointerEventType, eventTarget: Node): void;
    destroy(): void;
    _createPreparedEvent<P extends EventPhase>(event: PointerEventType, phase: P, preEnd?: boolean, type?: string): InteractEvent<T, P>;
    _fireEvent<P extends EventPhase>(iEvent: InteractEvent<T, P>): void;
    _doPhase<P extends EventPhase>(signalArg: Omit<DoPhaseArg<T, P>, 'iEvent'> & {
        iEvent?: InteractEvent<T, P>;
    }): boolean;
    _now(): number;
}
export default Interaction;
export { PointerInfo };
