import { PerActionDefaults } from '@interactjs/core/defaultOptions';
import Eventable from '@interactjs/core/Eventable';
import Interaction from '@interactjs/core/Interaction';
import { Scope } from '@interactjs/core/scope';
import * as utils from '@interactjs/utils';
import PointerEvent from './PointerEvent';
export declare type EventTargetList = Array<{
    node: Node;
    eventable: Eventable;
    props: {
        [key: string]: any;
    };
}>;
export interface PointerEventOptions extends PerActionDefaults {
    enabled?: undefined;
    holdDuration?: number;
    ignoreFrom?: any;
    allowFrom?: any;
    origin?: Interact.Point | string | Element;
}
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
        hold?: {
            duration: number;
            timeout: any;
        };
    }
}
declare module '@interactjs/core/defaultOptions' {
    interface ActionDefaults {
        pointerEvents: Interact.Options;
    }
}
declare const pointerEvents: {
    id: string;
    install: typeof install;
    signals: utils.Signals;
    PointerEvent: typeof PointerEvent;
    fire: typeof fire;
    collectEventTargets: typeof collectEventTargets;
    createSignalListener: typeof createSignalListener;
    defaults: PointerEventOptions;
    types: string[];
};
declare function fire<T extends string>(arg: {
    interaction: Interaction;
    pointer: Interact.PointerType;
    event: Interact.PointerEventType;
    eventTarget: Interact.EventTarget;
    targets?: EventTargetList;
    pointerEvent?: PointerEvent<T>;
    type: T;
}, scope: Interact.Scope): PointerEvent<any>;
declare function collectEventTargets<T extends string>({ interaction, pointer, event, eventTarget, type }: {
    interaction: Interaction;
    pointer: Interact.PointerType;
    event: Interact.PointerEventType;
    eventTarget: Interact.EventTarget;
    type: T;
}): {
    node: Node;
    eventable: Eventable;
    props: {
        [key: string]: any;
    };
}[];
declare function install(scope: Scope): void;
declare function createSignalListener(type: string, scope: any): ({ interaction, pointer, event, eventTarget }: any) => void;
export default pointerEvents;
