import * as utils from '@interactjs/utils/index';
import Eventable from './Eventable';
import InteractEvent, { PhaseMap } from './InteractEvent';
import InteractStatic from './InteractStatic';
import InteractableBase from './Interactable';
import InteractableSet from './InteractableSet';
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
export declare type ListenerMap = {
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
export interface ActionMap {
}
export declare type ActionName = keyof ActionMap;
export interface Actions {
    map: ActionMap;
    phases: PhaseMap;
    methodDict: {
        [P in ActionName]?: string;
    };
    phaselessTypes: {
        [type: string]: true;
    };
}
export interface Plugin {
    [key: string]: any;
    id?: string;
    listeners?: ListenerMap;
    before?: string[];
    install?(scope: Scope, options?: any): void;
}
export default class Scope {
    id: string;
    isInitialized: boolean;
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
    utils: typeof utils;
    defaults: import("@interactjs/core/defaultOptions").Defaults;
    Eventable: typeof Eventable;
    actions: Actions;
    interactStatic: InteractStatic;
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
    init(window: Window): import("@interactjs/core/scope").default;
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
export declare function isNonNativeEvent(type: string, actions: Actions): boolean;
export declare function initScope(scope: Scope, window: Window): import("@interactjs/core/scope").default;
export { Scope };
