import * as domUtils from '@interactjs/utils/domUtils';
import * as pointerUtils from '@interactjs/utils/pointerUtils';
import Interactable from './Interactable';
import { Options } from './defaultOptions';
export interface InteractStatic {
    (target: Interact.Target, options?: Options): Interactable;
}
export declare class InteractStatic {
    getPointerAverage: typeof pointerUtils.pointerAverage;
    getTouchBBox: typeof pointerUtils.touchBBox;
    getTouchDistance: typeof pointerUtils.touchDistance;
    getTouchAngle: typeof pointerUtils.touchAngle;
    getElementRect: typeof domUtils.getElementRect;
    getElementClientRect: typeof domUtils.getElementClientRect;
    matchesSelector: typeof domUtils.matchesSelector;
    closest: typeof domUtils.closest;
    globalEvents: any;
    dynamicDrop: (newValue?: boolean) => boolean | this;
    version: string;
    interact: InteractStatic;
    scope: Interact.Scope;
    constructor(scope: Interact.Scope);
    /**
     * Use a plugin
     *
     * @alias module:interact.use
     *
     * @param {Object} plugin
     * @param {function} plugin.install
     * @return {InteractStatic}
     */
    use(plugin: Interact.Plugin, options?: {
        [key: string]: any;
    }): this;
    /**
     * Check if an element or selector has been set with the {@link interact}
     * function
     *
     * @alias module:interact.isSet
     *
     * @param {Element} element The Element being searched for
     * @return {boolean} Indicates if the element or CSS selector was previously
     * passed to interact
     */
    isSet(target: Interact.Element, options?: any): boolean;
    /**
     * Add a global listener for an InteractEvent or adds a DOM event to `document`
     *
     * @alias module:interact.on
     *
     * @param {string | array | object} type The types of events to listen for
     * @param {function} listener The function event (s)
     * @param {object | boolean} [options] object or useCapture flag for
     * addEventListener
     * @return {object} interact
     */
    on(type: string | Interact.EventTypes, listener: Interact.ListenersArg, options?: object): this;
    /**
     * Removes a global InteractEvent listener or DOM event from `document`
     *
     * @alias module:interact.off
     *
     * @param {string | array | object} type The types of events that were listened
     * for
     * @param {function} listener The listener function to be removed
     * @param {object | boolean} options [options] object or useCapture flag for
     * removeEventListener
     * @return {object} interact
     */
    off(type: Interact.EventTypes, listener: any, options?: object): this;
    debug(): import("@interactjs/core/scope").default;
    /**
     * @alias module:interact.supportsTouch
     *
     * @return {boolean} Whether or not the browser supports touch input
     */
    supportsTouch(): boolean;
    /**
     * @alias module:interact.supportsPointerEvent
     *
     * @return {boolean} Whether or not the browser supports PointerEvents
     */
    supportsPointerEvent(): boolean;
    /**
     * Cancels all interactions (end events are not fired)
     *
     * @alias module:interact.stop
     *
     * @return {object} interact
     */
    stop(): this;
    /**
     * Returns or sets the distance the pointer must be moved before an action
     * sequence occurs. This also affects tolerance for tap events.
     *
     * @alias module:interact.pointerMoveTolerance
     *
     * @param {number} [newValue] The movement from the start position must be greater than this value
     * @return {interact | number}
     */
    pointerMoveTolerance(newValue?: number): number | this;
    addDocument(doc: Document, options?: object): void;
    removeDocument(doc: Document): void;
}
export default InteractStatic;
