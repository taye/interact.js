import * as utils from '@interactjs/utils';
import defaults from './defaultOptions';
import Eventable from './Eventable';
import InteractableBase from './Interactable';
import InteractableSet from './InteractableSet';
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
export interface Plugin {
    id?: string;
    install(scope: Scope, options?: any): void;
    [key: string]: any;
}
export declare class Scope {
    id: string;
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
    window: Window;
    documents: Array<{
        doc: Document;
        options: any;
    }>;
    _plugins: Plugin[];
    _pluginMap: {
        [id: string]: Plugin;
    };
    constructor();
    onWindowUnload: (event: BeforeUnloadEvent) => void;
    init(window: Window): Scope;
    pluginIsInstalled(plugin: Plugin): boolean | Plugin;
    usePlugin(plugin: Plugin, options?: {
        [key: string]: any;
    }): this;
    addDocument(doc: Document, options?: any): void | false;
    removeDocument(doc: Document): void;
    getDocIndex(doc: Document): number;
    getDocOptions(doc: Document): any;
    now(): number;
}
export declare function initScope(scope: Scope, window: Window): Scope;
