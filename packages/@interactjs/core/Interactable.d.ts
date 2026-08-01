import type { Scope } from '@interactjs/core/scope';
import type { ActionName, Context, Element, EventTypes, Listeners, ListenersArg, OrBoolean, Target } from '@interactjs/core/types';
import { Eventable } from './Eventable';
import type { OptionsArg, Options } from './options';
type DeltaSource = 'page' | 'client';
/**
 * ```ts
 * const interactable = interact('.cards')
 *   .draggable({
 *     listeners: { move: event => console.log(event.type, event.pageX, event.pageY) }
 *   })
 *   .resizable({
 *     listeners: { move: event => console.log(event.rect) },
 *     modifiers: [interact.modifiers.restrictEdges({ outer: 'parent' })]
 *   })
 * ```
 */
export declare class Interactable implements Partial<Eventable> {
    readonly target: Target;
    constructor(target: Target, options: any, defaultContext: Document | Element, scopeEvents: Scope['events']);
    setOnEvents(actionName: ActionName, phases: NonNullable<any>): this;
    updatePerActionListeners(actionName: ActionName, prev: Listeners | undefined, cur: Listeners | undefined): void;
    setPerAction(actionName: ActionName, options: OrBoolean<Options>): void;
    /**
     * The default function to get an Interactables bounding rect. Can be
     * overridden using {@link Interactable.rectChecker}.
     *
     * @param {Element} [element] The element to measure.
     * @return {Rect} The object's bounding rectangle.
     */
    getRect(element: Element): Required<import("@interactjs/core/types").Rect>;
    /**
     * Returns or sets the function used to calculate the interactable's
     * element's rectangle
     *
     * @param {function} [checker] A function which returns this Interactable's
     * bounding rectangle. See {@link Interactable.getRect}
     * @return {function | object} The checker function or this Interactable
     */
    rectChecker(): (element: Element) => any | null;
    rectChecker(checker: (element: Element) => any): this;
    /**
     * Gets or sets the origin of the Interactable's element.  The x and y
     * of the origin will be subtracted from action event coordinates.
     *
     * @param {Element | object | string} [origin] An HTML or SVG Element whose
     * rect will be used, an object eg. { x: 0, y: 0 } or string 'parent', 'self'
     * or any CSS selector
     *
     * @return {object} The current origin or this Interactable
     */
    origin(newValue: any): any;
    /**
     * Returns or sets the mouse coordinate types used to calculate the
     * movement of the pointer.
     *
     * @param {string} [newValue] Use 'client' if you will be scrolling while
     * interacting; Use 'page' if you want autoScroll to work
     * @return {string | object} The current deltaSource or this Interactable
     */
    deltaSource(): DeltaSource;
    deltaSource(newValue: DeltaSource): this;
    /**
     * Gets the selector context Node of the Interactable. The default is
     * `window.document`.
     *
     * @return {Node} The context Node of this Interactable
     */
    context(): Context;
    inContext(element: Document | Node): boolean;
    /**
     * Calls listeners for the given InteractEvent type bound globally
     * and directly to this Interactable
     *
     * @param {InteractEvent} iEvent The InteractEvent object to be fired on this
     * Interactable
     * @return {Interactable} this Interactable
     */
    fire<E extends {
        type: string;
    }>(iEvent: E): this;
    /**
     * Binds a listener for an InteractEvent, pointerEvent or DOM event.
     *
     * @param {string | array | object} types The types of events to listen
     * for
     * @param {function | array | object} [listener] The event listener function(s)
     * @param {object | boolean} [options] options object or useCapture flag for
     * addEventListener
     * @return {Interactable} This Interactable
     */
    on(types: EventTypes, listener?: ListenersArg, options?: any): this;
    /**
     * Removes an InteractEvent, pointerEvent or DOM event listener.
     *
     * @param {string | array | object} types The types of events that were
     * listened for
     * @param {function | array | object} [listener] The event listener function(s)
     * @param {object | boolean} [options] options object or useCapture flag for
     * removeEventListener
     * @return {Interactable} This Interactable
     */
    off(types: string | string[] | EventTypes, listener?: ListenersArg, options?: any): this;
    /**
     * Reset the options of this Interactable
     *
     * @param {object} options The new settings to apply
     * @return {object} This Interactable
     */
    set(options: OptionsArg): this;
    /**
     * Remove this interactable from the list of interactables and remove it's
     * action capabilities and event listeners
     */
    unset(): void;
}
export {};
