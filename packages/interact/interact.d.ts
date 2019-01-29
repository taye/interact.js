/** @module interact */
import { Scope } from '@interactjs/core/scope';
import * as utils from '@interactjs/utils';
export interface Plugin extends Partial<any> {
    install(scope: any): void;
}
declare module '@interactjs/core/scope' {
    interface Scope {
        interact: typeof interactExport;
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
export declare function interact<InteractStatic>(target: Interact.Target, options?: any): import("@interactjs/core/Interactable").Interactable;
export declare namespace interact {
    var use: typeof use;
    var isSet: typeof isSet;
    var on: typeof on;
    var off: typeof off;
    var debug: typeof debug;
    var getPointerAverage: (pointers: PointerEvent[] | Event[]) => {
        pageX: number;
        pageY: number;
        clientX: number;
        clientY: number;
        screenX: number;
        screenY: number;
    };
    var getTouchBBox: (event: Event | PointerEvent[]) => {
        x: number;
        y: number;
        left: number;
        top: number;
        width: number;
        height: number;
    };
    var getTouchDistance: (event: any, deltaSource: any) => number;
    var getTouchAngle: (event: any, deltaSource: any) => number;
    var getElementRect: typeof utils.dom.getElementRect;
    var getElementClientRect: typeof utils.dom.getElementClientRect;
    var matchesSelector: typeof utils.dom.matchesSelector;
    var closest: typeof utils.dom.closest;
    var supportsTouch: typeof supportsTouch;
    var supportsPointerEvent: typeof supportsPointerEvent;
    var stop: typeof stop;
    var pointerMoveTolerance: typeof pointerMoveTolerance;
    var addDocument: (doc: Document, options?: any) => false | void;
    var removeDocument: (doc: any) => void;
}
declare function use(plugin: Plugin): typeof interact;
declare function isSet(element: Element, options?: any): boolean;
declare function on(type: String | Interact.EventTypes, listener: Interact.Listeners, options?: any): typeof interact;
declare function off(type: any, listener: any, options: any): typeof interact;
declare function debug(): Scope;
declare function supportsTouch(): boolean;
declare function supportsPointerEvent(): boolean;
declare function stop(): typeof interact;
declare function pointerMoveTolerance(newValue: any): number | typeof interact;
export declare const interactExport: InteractStatic & typeof interact;
export { scope };
export default interactExport;
