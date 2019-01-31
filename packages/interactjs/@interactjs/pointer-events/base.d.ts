import { Scope } from '@interactjs/core/scope';
import * as utils from '@interactjs/utils';
import PointerEvent from './PointerEvent';
declare module '@interactjs/core/scope' {
    interface Scope {
        pointerEvents?: typeof pointerEvents;
    }
}
declare module '@interactjs/core/defaultOptions' {
    interface Defaults {
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
declare function fire(arg: any): any;
declare function collectEventTargets({ interaction, pointer, event, eventTarget, type }: {
    interaction: any;
    pointer: any;
    event: any;
    eventTarget: any;
    type: any;
}): any[];
declare function install(scope: Scope): void;
declare function createSignalListener(type: any): ({ interaction, pointer, event, eventTarget }: {
    interaction: any;
    pointer: any;
    event: any;
    eventTarget: any;
}) => void;
export default pointerEvents;
