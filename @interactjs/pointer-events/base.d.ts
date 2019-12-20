import { PerActionDefaults } from '../core/defaultOptions';
import Eventable from '../core/Eventable';
import Interaction from '../core/Interaction';
import { Scope } from '../core/scope';
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
    origin?: Interact.Point | string | Interact.Element;
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
declare module '@interactjs/core/scope' {
    interface SignalArgs {
        'pointerEvents:new': {
            pointerEvent: PointerEvent<any>;
        };
        'pointerEvents:fired': {
            interaction: Interaction;
            pointer: Interact.PointerType | PointerEvent<any>;
            event: Interact.PointerEventType | PointerEvent<any>;
            eventTarget: Interact.EventTarget;
            pointerEvent: PointerEvent<any>;
            targets?: EventTargetList;
            type: string;
        };
        'pointerEvents:collect-targets': {
            interaction: Interaction;
            pointer: Interact.PointerType | PointerEvent<any>;
            event: Interact.PointerEventType | PointerEvent<any>;
            eventTarget: Interact.EventTarget;
            targets?: EventTargetList;
            type: string;
            path: Node[];
            node: null;
        };
    }
}
declare const pointerEvents: {
    id: string;
    install: typeof install;
    listeners: {
        'interactions:new': typeof addInteractionProps;
        'interactions:update-pointer': typeof addHoldInfo;
        'interactions:move': typeof moveAndClearHold;
        'interactions:down': (arg: any, scope: any) => void;
        'interactions:up': (arg: any, scope: any) => void;
        'interactions:cancel': (arg: any, scope: any) => void;
    };
    PointerEvent: typeof PointerEvent;
    fire: typeof fire;
    collectEventTargets: typeof collectEventTargets;
    defaults: PointerEventOptions;
    types: string[];
};
declare function fire<T extends string>(arg: {
    pointer: Interact.PointerType | PointerEvent<any>;
    event: Interact.PointerEventType | PointerEvent<any>;
    eventTarget: Interact.EventTarget;
    interaction: Interaction;
    type: T;
    targets?: EventTargetList;
}, scope: Interact.Scope): PointerEvent<T>;
declare function collectEventTargets<T extends string>({ interaction, pointer, event, eventTarget, type }: {
    interaction: Interaction;
    pointer: Interact.PointerType | PointerEvent<any>;
    event: Interact.PointerEventType | PointerEvent<any>;
    eventTarget: Interact.EventTarget;
    type: T;
}, scope: Interact.Scope): {
    node: Node;
    eventable: Eventable;
    props: {
        [key: string]: any;
    };
}[];
declare function addInteractionProps({ interaction }: {
    interaction: any;
}): void;
declare function addHoldInfo({ down, pointerInfo }: Interact.SignalArgs['interactions:update-pointer']): void;
declare function moveAndClearHold({ interaction, pointer, event, eventTarget, duplicate }: Interact.SignalArgs['interactions:move'], scope: Interact.Scope): void;
declare function install(scope: Scope): void;
export default pointerEvents;
