import * as utils from '@interactjs/utils';
import defaults from './defaultOptions';
import Eventable from './Eventable';
import InteractableBase from './Interactable';
import InteractEvent from './InteractEvent';
export declare enum ActionName {
}
export interface Actions {
    names: ActionName[];
    methodDict: {
        [key: string]: string;
    };
    eventTypes: string[];
}
export declare function createScope(): Scope;
export declare type Defaults = typeof defaults;
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
        add: (element: EventTarget, type: string, listener: (event: Event | import("../utils/events").FakeEvent) => any, optionalArg?: any) => void;
        remove: (element: EventTarget, type: string, listener?: "all" | ((event: Event | import("../utils/events").FakeEvent) => any), optionalArg?: any) => void;
        addDelegate: (selector: string, context: EventTarget, type: string, listener: (event: Event | import("../utils/events").FakeEvent) => any, optionalArg?: any) => void;
        removeDelegate: (selector: any, context: any, type: any, listener?: any, optionalArg?: any) => void;
        delegateListener: (event: Event, optionalArg?: any) => void;
        delegateUseCapture: (event: Event) => any;
        delegatedEvents: {
            [type: string]: {
                selectors: string[];
                contexts: EventTarget[];
                listeners: [(event: Event | import("../utils/events").FakeEvent) => any, boolean, boolean][][];
            };
        };
        documents: Document[];
        supportsOptions: boolean;
        supportsPassive: boolean;
        _elements: EventTarget[];
        _targets: {
            events: {
                [type: string]: ((event: Event | import("../utils/events").FakeEvent) => any)[];
            };
            typeCount: number;
        }[];
        init(window: Window): void;
    };
    utils: typeof utils;
    defaults: Defaults;
    Eventable: typeof Eventable;
    actions: Actions;
    InteractEvent: typeof InteractEvent;
    Interactable: typeof InteractableBase;
    interactables: InteractableSet;
    _win: Window;
    document: Document;
    documents: Array<{
        doc: Document;
        options: any;
    }>;
    constructor();
    init(window: Window): Scope;
    addDocument(doc: Document, options?: any): void | false;
    removeDocument(doc: Document): void;
    onWindowUnload(event: Event): void;
    getDocIndex(doc: Document): number;
    getDocOptions(doc: Document): any;
}
declare class InteractableSet {
    protected scope: Scope;
    signals: utils.Signals;
    list: InteractableBase[];
    constructor(scope: Scope);
    new(target: Interact.Target, options: any): InteractableBase;
    indexOfElement(target: Interact.Target, context: Document | Element): number;
    get(element: Interact.Target, options: any, dontCheckInContext?: boolean): InteractableBase;
    forEachMatch(element: Document | Element, callback: (interactable: any) => any): any;
}
export declare function initScope(scope: Scope, window: Window): Scope;
export {};
