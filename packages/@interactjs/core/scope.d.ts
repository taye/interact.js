import type Interaction from '@interactjs/core/Interaction';
import { Eventable } from './Eventable';
import { InteractEvent } from './InteractEvent';
import { Interactable as InteractableBase } from './Interactable';
import { InteractableSet } from './InteractableSet';
import type { OptionsArg } from './options';
import type { Actions } from './types';
export interface SignalArgs {
    'scope:add-document': DocSignalArg;
    'scope:remove-document': DocSignalArg;
    'interactable:unset': {
        interactable: InteractableBase;
    };
    'interactable:set': {
        interactable: InteractableBase;
        options: OptionsArg;
    };
    'interactions:destroy': {
        interaction: Interaction;
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
    options: Record<string, any>;
}
export interface Plugin {
    [key: string]: any;
    id?: string;
    listeners?: ListenerMap;
    before?: string[];
    install?(scope: Scope, options?: any): void;
}
export declare class Scope {
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
        prefixedMatchesSelector: "matches";
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
    defaults: import("@interactjs/core/options").Defaults;
    Eventable: typeof Eventable;
    actions: Actions;
    interactStatic: import("@interactjs/core/InteractStatic").InteractStatic;
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
    init(window: Window | typeof globalThis): Scope;
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
export declare function initScope(scope: Scope, window: Window | typeof globalThis): Scope;
export {};
