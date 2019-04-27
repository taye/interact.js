declare type Listener = (event: Event | FakeEvent) => any;
declare function add(element: EventTarget, type: string, listener: Listener, optionalArg?: boolean | any): void;
declare function remove(element: EventTarget, type: string, listener?: 'all' | Listener, optionalArg?: boolean | any): void;
declare function addDelegate(selector: string, context: EventTarget, type: string, listener: Listener, optionalArg?: any): void;
declare function removeDelegate(selector: any, context: any, type: any, listener?: any, optionalArg?: any): void;
declare function delegateListener(event: Event, optionalArg?: any): void;
declare function delegateUseCapture(event: Event): any;
export declare class FakeEvent implements Partial<Event> {
    originalEvent: any;
    currentTarget: EventTarget;
    constructor(originalEvent: any);
    preventOriginalDefault(): void;
    stopPropagation(): void;
    stopImmediatePropagation(): void;
}
declare const events: {
    add: typeof add;
    remove: typeof remove;
    addDelegate: typeof addDelegate;
    removeDelegate: typeof removeDelegate;
    delegateListener: typeof delegateListener;
    delegateUseCapture: typeof delegateUseCapture;
    delegatedEvents: {
        [type: string]: {
            selectors: string[];
            contexts: EventTarget[];
            listeners: [Listener, boolean, boolean][][];
        };
    };
    documents: Document[];
    supportsOptions: boolean;
    supportsPassive: boolean;
    _elements: EventTarget[];
    _targets: {
        events: {
            [type: string]: Listener[];
        };
        typeCount: number;
    }[];
    init(window: Window): void;
};
export default events;
