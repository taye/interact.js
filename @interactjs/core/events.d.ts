declare module '@interactjs/core/scope' {
    interface Scope {
        events: ReturnType<typeof install>;
    }
}
declare type Listener = (event: Event | FakeEvent) => any;
declare function install(scope: Interact.Scope): {
    add: (eventTarget: EventTarget, type: string, listener: Listener, optionalArg?: any) => void;
    remove: (eventTarget: EventTarget, type: string, listener?: Listener | "all", optionalArg?: any) => void;
    addDelegate: (selector: string, context: Node, type: string, listener: Listener, optionalArg?: any) => void;
    removeDelegate: (selector: string, context: import("../types/types").Context, type: string, listener?: Listener, optionalArg?: any) => void;
    delegateListener: (event: Event, optionalArg?: any) => void;
    delegateUseCapture: (event: Event) => any;
    delegatedEvents: {
        [type: string]: {
            selector: string;
            context: Node;
            listeners: [Listener, {
                capture: boolean;
                passive: boolean;
            }][];
        }[];
    };
    documents: Document[];
    targets: {
        eventTarget: EventTarget;
        events: {
            [type: string]: Listener[];
        };
    }[];
    supportsOptions: boolean;
    supportsPassive: boolean;
};
export declare class FakeEvent implements Partial<Event> {
    currentTarget: EventTarget;
    originalEvent: Event;
    constructor(originalEvent: Event);
    preventOriginalDefault(): void;
    stopPropagation(): void;
    stopImmediatePropagation(): void;
}
declare const _default: {
    id: string;
    install: typeof install;
};
export default _default;
