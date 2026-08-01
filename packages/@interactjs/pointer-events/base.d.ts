import type { Eventable } from '@interactjs/core/Eventable';
import type { Interaction } from '@interactjs/core/Interaction';
import type { PerActionDefaults } from '@interactjs/core/options';
import type { Plugin } from '@interactjs/core/scope';
import type { Point, PointerType, PointerEventType, Element } from '@interactjs/core/types';
import { PointerEvent } from './PointerEvent';
export type EventTargetList = Array<{
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
    origin?: Point | string | Element;
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
declare module '@interactjs/core/options' {
    interface ActionDefaults {
        pointerEvents: Options;
    }
}
declare module '@interactjs/core/scope' {
    interface SignalArgs {
        'pointerEvents:new': {
            pointerEvent: PointerEvent<any>;
        };
        'pointerEvents:fired': {
            interaction: Interaction<null>;
            pointer: PointerType | PointerEvent<any>;
            event: PointerEventType | PointerEvent<any>;
            eventTarget: Node;
            pointerEvent: PointerEvent<any>;
            targets?: EventTargetList;
            type: string;
        };
        'pointerEvents:collect-targets': {
            interaction: Interaction<any>;
            pointer: PointerType | PointerEvent<any>;
            event: PointerEventType | PointerEvent<any>;
            eventTarget: Node;
            targets?: EventTargetList;
            type: string;
            path: Node[];
            node: null;
        };
    }
}
declare const pointerEvents: Plugin;
export default pointerEvents;
