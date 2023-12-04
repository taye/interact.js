import * as domUtils from '@interactjs/utils/domUtils';
import * as pointerUtils from '@interactjs/utils/pointerUtils';
import type { Scope, Plugin } from '@interactjs/core/scope';
import type { EventTypes, ListenersArg, Target } from '@interactjs/core/types';
import type { Interactable } from './Interactable';
import type { Options } from './options';
/**
 * ```js
 * interact('#draggable').draggable(true)
 *
 * var rectables = interact('rect')
 * rectables
 *   .gesturable(true)
 *   .on('gesturemove', function (event) {
 *       // ...
 *   })
 * ```
 *
 * The methods of this variable can be used to set elements as interactables
 * and also to change various default settings.
 *
 * Calling it as a function and passing an element or a valid CSS selector
 * string returns an Interactable object which has various methods to configure
 * it.
 *
 * @param {Element | string} target The HTML or SVG Element to interact with
 * or CSS selector
 * @return {Interactable}
 */
export interface InteractStatic {
    (target: Target, options?: Options): Interactable;
    getPointerAverage: typeof pointerUtils.pointerAverage;
    getTouchBBox: typeof pointerUtils.touchBBox;
    getTouchDistance: typeof pointerUtils.touchDistance;
    getTouchAngle: typeof pointerUtils.touchAngle;
    getElementRect: typeof domUtils.getElementRect;
    getElementClientRect: typeof domUtils.getElementClientRect;
    matchesSelector: typeof domUtils.matchesSelector;
    closest: typeof domUtils.closest;
    version: string;
    /**
     * Use a plugin
     */
    use(plugin: Plugin, options?: {
        [key: string]: any;
    }): any;
    /**
     * Check if an element or selector has been set with the `interact(target)`
     * function
     *
     * @return {boolean} Indicates if the element or CSS selector was previously
     * passed to interact
     */
    isSet(target: Target, options?: any): boolean;
    on(type: string | EventTypes, listener: ListenersArg, options?: object): any;
    off(type: EventTypes, listener: any, options?: object): any;
    debug(): any;
    /**
     * Whether or not the browser supports touch input
     */
    supportsTouch(): boolean;
    /**
     * Whether or not the browser supports PointerEvents
     */
    supportsPointerEvent(): boolean;
    /**
     * Cancels all interactions (end events are not fired)
     */
    stop(): InteractStatic;
    /**
     * Returns or sets the distance the pointer must be moved before an action
     * sequence occurs. This also affects tolerance for tap events.
     */
    pointerMoveTolerance(
    /** The movement from the start position must be greater than this value */
    newValue?: number): InteractStatic | number;
    addDocument(doc: Document, options?: object): void;
    removeDocument(doc: Document): void;
}
export declare function createInteractStatic(scope: Scope): InteractStatic;
