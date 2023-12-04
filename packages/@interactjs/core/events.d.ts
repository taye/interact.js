import type { Scope } from '@interactjs/core/scope';
import type { Element } from '@interactjs/core/types';
import type { NativeEventTarget } from './NativeTypes';
declare module '@interactjs/core/scope' {
    interface Scope {
        events: ReturnType<typeof install>;
    }
}
interface EventOptions {
    capture: boolean;
    passive: boolean;
}
type PartialEventTarget = Partial<NativeEventTarget>;
type ListenerEntry = {
    func: (event: Event | FakeEvent) => any;
    options: EventOptions;
};
declare function install(scope: Scope): {
    add: (eventTarget: PartialEventTarget, type: string, listener: ListenerEntry['func'], optionalArg?: boolean | EventOptions) => void;
    remove: (eventTarget: PartialEventTarget, type: string, listener?: 'all' | ListenerEntry['func'], optionalArg?: boolean | EventOptions) => void;
    addDelegate: (selector: string, context: Node, type: string, listener: ListenerEntry['func'], optionalArg?: any) => void;
    removeDelegate: (selector: string, context: Document | Element, type: string, listener?: ListenerEntry['func'], optionalArg?: any) => void;
    delegateListener: (event: Event | FakeEvent, optionalArg?: any) => void;
    delegateUseCapture: (this: Element, event: Event | FakeEvent) => any;
    delegatedEvents: {
        [type: string]: {
            selector: string;
            context: Node;
            listeners: ListenerEntry[];
        }[];
    };
    documents: Document[];
    targets: {
        eventTarget: PartialEventTarget;
        events: {
            [type: string]: ListenerEntry[];
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
