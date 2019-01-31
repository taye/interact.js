import * as utils from '@interactjs/utils';
import defaults from './defaultOptions';
import Eventable from './Eventable';
import InteractableBase from './Interactable';
import InteractEvent from './InteractEvent';
export declare type Defaults = typeof defaults;
export declare function createScope(): Scope;
export declare class Scope {
    signals: utils.Signals;
    browser: {
        init: (window: any) => void;
        supportsTouch: boolean;
        supportsPointerEvent: boolean;
        isIOS7: boolean;
        isIOS: boolean;
        isIe9: boolean;
        isOperaMobile: boolean;
        prefixedMatchesSelector: string;
        pEventTypes: {
            up: string;
            down: string;
            over: string;
            out: string;
            move: string;
            cancel: string;
        };
        wheelEvent: string;
    };
    events: {
        add: (element: EventTarget, type: string, listener: Function, optionalArg?: any) => void;
        remove: (element: EventTarget, type: string, listener?: Function | "all", optionalArg?: any) => void;
        addDelegate: (selector: string, context: EventTarget, type: string, listener: Function, optionalArg?: any) => void;
        removeDelegate: (selector: any, context: any, type: any, listener?: any, optionalArg?: any) => void;
        delegateListener: (event: Event, optionalArg?: any) => void;
        delegateUseCapture: (event: Event) => any;
        delegatedEvents: {};
        documents: any[];
        supportsOptions: boolean;
        supportsPassive: boolean;
        _elements: EventTarget[];
        _targets: any[];
        init(window: Window): void;
    };
    utils: typeof utils;
    defaults: Defaults;
    Eventable: typeof Eventable;
    InteractEvent: typeof InteractEvent;
    Interactable: typeof InteractableBase;
    interactables: InteractableSet;
    _win: Window;
    document: any;
    documents: any[];
    init(window: Window): Scope;
    addDocument(doc: Document, options?: any): void | false;
    removeDocument(doc: any): void;
    onWindowUnload(event: any): void;
    getDocIndex(doc: any): number;
    getDocOptions(doc: any): any;
    constructor();
}
declare class InteractableSet {
    protected scope: Scope;
    signals: utils.Signals;
    list: InteractableBase[];
    constructor(scope: Scope);
    new(target: any, options: any): InteractableBase;
    indexOfElement(target: any, context: any): number;
    get(element: Interact.Target, options: any, dontCheckInContext?: boolean): InteractableBase;
    forEachMatch(element: any, callback: any): any;
}
export declare function initScope(scope: Scope, window: any): Scope;
export {};
