import { Defaults, Options } from './defaultOptions';
import Eventable from './Eventable';
import { Actions } from './scope';
declare type IgnoreValue = string | Element | boolean;
/** */
export declare class Interactable implements Partial<Eventable> {
    protected readonly _defaults: Defaults;
    readonly options: Required<Options>;
    readonly _actions: Actions;
    readonly target: Interact.Target;
    readonly events: Eventable;
    readonly _context: Document | Element;
    readonly _win: Window;
    readonly _doc: Document;
    /** */
    constructor(target: Interact.Target, options: any, defaultContext: Document | Element);
    setOnEvents(actionName: string, phases: NonNullable<any>): this;
    updatePerActionListeners(actionName: any, prev: any, cur: any): void;
    setPerAction(actionName: any, options: Interact.OrBoolean<Options>): void;
    /**
     * The default function to get an Interactables bounding rect. Can be
     * overridden using {@link Interactable.rectChecker}.
     *
     * @param {Element} [element] The element to measure.
     * @return {object} The object's bounding rectangle.
     */
    getRect(element: Element): {
        left: any;
        right: any;
        top: any;
        bottom: any;
        width: any;
        height: any;
    };
    /**
     * Returns or sets the function used to calculate the interactable's
     * element's rectangle
     *
     * @param {function} [checker] A function which returns this Interactable's
     * bounding rectangle. See {@link Interactable.getRect}
     * @return {function | object} The checker function or this Interactable
     */
    rectChecker(checker: (element: Element) => any): this | ((element: Element) => {
        left: any;
        right: any;
        top: any;
        bottom: any;
        width: any;
        height: any;
    });
    _backCompatOption(optionName: any, newValue: any): any;
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
    deltaSource(newValue: any): "client" | "page" | this;
    /**
     * Gets the selector context Node of the Interactable. The default is
     * `window.document`.
     *
     * @return {Node} The context Node of this Interactable
     */
    context(): Element | Document;
    inContext(element: any): boolean;
    testIgnoreAllow(this: Interactable, options: {
        ignoreFrom: IgnoreValue;
        allowFrom: IgnoreValue;
    }, targetNode: Node, eventTarget: Element): any;
    testAllow(this: Interactable, allowFrom: IgnoreValue, targetNode: Node, element: Element): any;
    testIgnore(this: Interactable, ignoreFrom: IgnoreValue, targetNode: Node, element: Element): any;
    /**
     * Calls listeners for the given InteractEvent type bound globally
     * and directly to this Interactable
     *
     * @param {InteractEvent} iEvent The InteractEvent object to be fired on this
     * Interactable
     * @return {Interactable} this Interactable
     */
    fire(iEvent: any): this;
    _onOff(method: 'on' | 'off', typeArg: Interact.EventTypes, listenerArg?: Interact.ListenersArg | null, options?: any): this;
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
    on(types: Interact.EventTypes, listener?: Interact.ListenersArg, options?: any): this;
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
    off(types: string | string[] | Interact.EventTypes, listener?: Interact.ListenersArg, options?: any): this;
    /**
     * Reset the options of this Interactable
     *
     * @param {object} options The new settings to apply
     * @return {object} This Interactable
     */
    set(options: Interact.OptionsArg): this;
    /**
     * Remove this interactable from the list of interactables and remove it's
     * action capabilities and event listeners
     *
     * @return {interact}
     */
    unset(): void;
}
export default Interactable;
