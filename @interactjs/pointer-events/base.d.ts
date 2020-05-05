import Eventable from '@interactjs/core/Eventable';
import Interaction from '@interactjs/core/Interaction';
import { PerActionDefaults } from '@interactjs/core/defaultOptions';
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
declare const pointerEvents: Interact.Plugin;
export default pointerEvents;
