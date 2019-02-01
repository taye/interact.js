import Eventable from '@interactjs/core/Eventable';
import Interaction from '@interactjs/core/Interaction';
import { Scope } from '@interactjs/core/scope';
import * as utils from '@interactjs/utils';
import PointerEvent from './PointerEvent';
declare type EventTargetList = Array<{
    eventable: Eventable;
    element: Window | Document | Element;
    props: {
        [key: string]: any;
    };
}>;
declare module '@interactjs/core/scope' {
    interface Scope {
        pointerEvents: typeof pointerEvents;
    }
}
declare module '@interactjs/core/Interaction' {
    interface Interaction {
        prevTap?: PointerEvent<string>;
        tapTime?: number;
    }
}
declare module '@interactjs/core/PointerInfo' {
    interface PointerInfo {
        hold: {
            duration: number;
            timeout: any;
        };
    }
}
declare module '@interactjs/core/defaultOptions' {
    interface Defaults {
        pointerEvents: any;
    }
    interface Options {
        pointerEvents?: any;
    }
}
declare const pointerEvents: {
    install: typeof install;
    signals: utils.Signals;
    PointerEvent: typeof PointerEvent;
    fire: typeof fire;
    collectEventTargets: typeof collectEventTargets;
    createSignalListener: typeof createSignalListener;
    defaults: {
        holdDuration: number;
        ignoreFrom: any;
        allowFrom: any;
        origin: {
            x: number;
            y: number;
        };
    };
    types: string[];
};
declare function fire<T extends string>(arg: {
    interaction: Interaction;
    pointer: Interact.PointerType;
    event: Interact.PointerEventType;
    eventTarget: EventTarget;
    targets?: EventTargetList;
    pointerEvent?: PointerEvent<T>;
    type: T;
}): PointerEvent<string>;
declare function collectEventTargets<T extends string>({ interaction, pointer, event, eventTarget, type }: {
    interaction: Interaction;
    pointer: Interact.PointerType;
    event: Interact.PointerEventType;
    eventTarget: EventTarget;
    type: T;
}): {
    eventable: Eventable;
    element: Element | Window | Document;
    props: {
        [key: string]: any;
    };
}[];
declare function install(scope: Scope): void;
declare function createSignalListener(type: string): ({ interaction, pointer, event, eventTarget }: any) => void;
export default pointerEvents;
