/** @module interact */
import { Options } from '@interactjs/core/defaultOptions';
import Interactable from '@interactjs/core/Interactable';
import { Scope } from '@interactjs/core/scope';
import * as utils from '@interactjs/utils';
declare module '@interactjs/core/scope' {
    interface Scope {
        interact: InteractStatic;
    }
}
export interface InteractStatic {
    (target: Interact.Target, options?: Options): Interactable;
    on: typeof on;
    pointerMoveTolerance: typeof pointerMoveTolerance;
    stop: typeof stop;
    supportsPointerEvent: typeof supportsPointerEvent;
    supportsTouch: typeof supportsTouch;
    debug: typeof debug;
    off: typeof off;
    isSet: typeof isSet;
    use: typeof use;
    getPointerAverage: typeof utils.pointer.pointerAverage;
    getTouchBBox: typeof utils.pointer.touchBBox;
    getTouchDistance: typeof utils.pointer.touchDistance;
    getTouchAngle: typeof utils.pointer.touchAngle;
    getElementRect: typeof utils.dom.getElementRect;
    getElementClientRect: typeof utils.dom.getElementClientRect;
    matchesSelector: typeof utils.dom.matchesSelector;
    closest: typeof utils.dom.closest;
    addDocument: typeof scope.addDocument;
    removeDocument: typeof scope.removeDocument;
    version: string;
}
declare const scope: Scope;
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
 * @global
 *
 * @param {Element | string} target The HTML or SVG Element to interact with
 * or CSS selector
 * @return {Interactable}
 */
export declare const interact: InteractStatic;
declare function use(plugin: Interact.Plugin, options?: {
    [key: string]: any;
}): InteractStatic;
declare function isSet(target: Element, options?: any): boolean;
declare function on(type: string | Interact.EventTypes, listener: Interact.ListenersArg, options?: any): InteractStatic;
declare function off(type: any, listener: any, options: any): InteractStatic;
declare function debug(): Scope;
declare function supportsTouch(): boolean;
declare function supportsPointerEvent(): boolean;
declare function stop(): InteractStatic;
declare function pointerMoveTolerance(newValue: any): number | InteractStatic;
export { scope };
export default interact;
