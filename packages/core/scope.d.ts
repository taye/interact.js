import * as utils from '../utils/index';
import defaults from './defaultOptions';
import Eventable from './Eventable';
import InteractableBase from './Interactable';
import InteractableSet from './InteractableSet';
import InteractEvent from './InteractEvent';
export interface SignalArgs {
    'scope:add-document': DocSignalArg;
    'scope:remove-document': DocSignalArg;
    'interactable:unset': {
        interactable: InteractableBase;
    };
    'interactable:set': {
        interactable: InteractableBase;
        options: Interact.Options;
    };
    'interactions:destroy': {
        interaction: Interact.Interaction;
    };
}
export declare type ListenerName = keyof SignalArgs;
declare type ListenerMap = {
    [P in ListenerName]?: (arg: SignalArgs[P], scope: Scope, signalName: P) => void | boolean;
};
interface DocSignalArg {
    doc: Document;
    window: Window;
    scope: Scope;
    options?: {
        [index: string]: any;
    };
}
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
    [key: string]: any;
    id?: string;
    listeners?: ListenerMap;
    before?: string;
    install?(scope: Scope, options?: any): void;
}
export declare class Scope {
    id: string;
    listenerMaps: Array<{
        map: ListenerMap;
        id: string;
    }>;
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
        remove: (element: EventTarget, type: string, listener?: ((event: Event | import("../utils/events").FakeEvent) => any) | "all", optionalArg?: any) => void;
        addDelegate: (selector: string, context: Node, type: string, listener: (event: Event | import("../utils/events").FakeEvent) => any, optionalArg?: any) => void;
        removeDelegate: (selector: any, context: any, type: any, listener?: any, optionalArg?: any) => void;
        delegateListener: (event: Event, optionalArg?: any) => void;
        delegateUseCapture: (event: Event) => any;
        delegatedEvents: {
            [type: string]: {
                selectors: string[];
                contexts: Node[];
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
    _plugins: {
        list: Plugin[];
        map: {
            [id: string]: Plugin;
        };
    };
    constructor();
    addListeners(map: ListenerMap, id?: string): void;
    fire<T extends ListenerName>(name: T, arg: SignalArgs[T]): void | false;
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
export {};
