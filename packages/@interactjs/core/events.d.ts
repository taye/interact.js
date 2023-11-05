import type { Scope } from '@interactjs/core/scope';
import type { Element } from '@interactjs/core/types';
declare module '@interactjs/core/scope' {
    interface Scope {
        events: ReturnType<typeof install>;
    }
}
declare type Listener = (event: Event | FakeEvent) => any;
declare function install(scope: Scope): {
    add: (eventTarget: EventTarget, type: string, listener: Listener, optionalArg?: boolean | any) => void;
    remove: (eventTarget: EventTarget, type: string, listener?: 'all' | Listener, optionalArg?: boolean | any) => void;
    addDelegate: (selector: string, context: Node, type: string, listener: Listener, optionalArg?: any) => void;
    removeDelegate: (selector: string, context: Document | Element, type: string, listener?: Listener, optionalArg?: any) => void;
    delegateListener: (event: Event | FakeEvent, optionalArg?: any) => void;
    delegateUseCapture: (this: Element, event: Event | FakeEvent) => any;
    delegatedEvents: {
        [type: string]: {
            selector: string;
            context: Node;
            listeners: Array<[Listener, {
                capture: boolean;
                passive: boolean;
            }]>;
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
declare class FakeEvent implements Partial<Event> {
    currentTarget: Node;
    originalEvent: Event;
    type: string;
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
