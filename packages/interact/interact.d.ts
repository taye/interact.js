/** @module interact */
import { Scope } from '@interactjs/core/scope';
import * as utils from '@interactjs/utils';
export interface Plugin extends Partial<any> {
    install(scope: any): void;
}
declare module '@interactjs/core/scope' {
    interface Scope {
        interact: typeof interact;
        _plugins: Plugin[];
    }
}
export interface InteractStatic {
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
declare function interactStatic(target: Interact.Target, options?: any): import("@interactjs/core/Interactable").Interactable;
/**
 * ```js
 * interact('#draggable').draggable(true);
 *
 * var rectables = interact('rect');
 * rectables
 *   .gesturable(true)
 *   .on('gesturemove', function (event) {
 *       // ...
 *   });
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
export declare const interact: InteractStatic & typeof interactStatic;
declare function use(plugin: Plugin): InteractStatic & typeof interactStatic;
declare function isSet(element: Element, options?: any): boolean;
declare function on(type: String | Interact.EventTypes, listener: Interact.Listeners, options?: any): InteractStatic & typeof interactStatic;
declare function off(type: any, listener: any, options: any): InteractStatic & typeof interactStatic;
declare function debug(): Scope;
declare function supportsTouch(): boolean;
declare function supportsPointerEvent(): boolean;
declare function stop(): InteractStatic & typeof interactStatic;
declare function pointerMoveTolerance(newValue: any): number | (InteractStatic & typeof interactStatic);
export { scope };
export default interact;
