import type { Element, PointerEventType, PointerType, FullRect, CoordsSet, ActionName, ActionProps } from '@interactjs/core/types';
import type { Interactable } from './Interactable';
import type { EventPhase } from './InteractEvent';
import { InteractEvent } from './InteractEvent';
import { PointerInfo } from './PointerInfo';
import type { Scope } from './scope';
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
export type PointerArgProps<T extends {} = {}> = {
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
export type DoAnyPhaseArg = DoPhaseArg<ActionName, EventPhase>;
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
export type InteractionProxy<T extends ActionName | null = never> = Pick<Interaction<T>, Exclude<keyof typeof _ProxyValues | keyof typeof _ProxyMethods, '_proxy'>>;
export declare class Interaction<T extends ActionName | null = ActionName> {
    /** current interactable being interacted with */
    interactable: Interactable | null;
    /** the target element of the interactable */
    element: Element | null;
    rect: FullRect | null;
    prepared: ActionProps<T>;
    pointerType: string;
    pointerIsDown: boolean;
    pointerWasMoved: boolean;
    doMove: (this: void) => any;
    coords: CoordsSet;
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
     * @param action - The action to be performed - drag, resize, etc.
     * @param target - The Interactable to target
     * @param element - The DOM Element to target
     * @returns Whether the interaction was successfully started
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
     */
    end(event?: PointerEventType): void;
    currentAction(): T;
    interacting(): boolean;
    stop(): void;
    destroy(): void;
}
export default Interaction;
export { PointerInfo };
