/** @module interact */
import type { Scope, Plugin } from '@interactjs/core/scope';
import type { EventTypes, ListenersArg, Target } from '@interactjs/core/types';
import * as domUtils from '@interactjs/utils/domUtils';
import * as pointerUtils from '@interactjs/utils/pointerUtils';
import type { Interactable } from './Interactable';
import type { Options } from './options';
declare module '@interactjs/core/InteractStatic' {
    interface InteractStatic {
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
        use(plugin: Plugin, options?: {
            [key: string]: any;
        }): any;
        isSet(target: Target, options?: any): boolean;
        on(type: string | EventTypes, listener: ListenersArg, options?: object): any;
        off(type: EventTypes, listener: any, options?: object): any;
        debug(): any;
        supportsTouch(): boolean;
        supportsPointerEvent(): boolean;
        stop(): any;
        pointerMoveTolerance(newValue?: number): any;
        addDocument(doc: Document, options?: object): void;
        removeDocument(doc: Document): void;
    }
}
declare type _InteractStatic = import('@interactjs/core/InteractStatic').InteractStatic;
export declare function createInteractStatic(scope: Scope): _InteractStatic;
export {};
