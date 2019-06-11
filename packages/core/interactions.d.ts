import Signals from '@interactjs/utils/Signals';
import InteractionBase from './Interaction';
import { Scope } from './scope';
declare module '@interactjs/core/scope' {
    interface Scope {
        Interaction: typeof InteractionBase;
        interactions: {
            signals: Signals;
            new: (options: any) => InteractionBase;
            list: InteractionBase[];
            listeners: {
                [type: string]: Interact.Listener;
            };
            docEvents: Array<{
                type: string;
                listener: Interact.Listener;
            }>;
            pointerMoveTolerance: number;
        };
        prevTouchTime: number;
    }
}
declare function install(scope: Scope): void;
declare function doOnInteractions(method: any, scope: any): (event: any) => void;
declare function onDocSignal({ doc, scope, options }: {
    doc: any;
    scope: any;
    options: any;
}, signalName: any): void;
declare const _default: {
    id: string;
    install: typeof install;
    onDocSignal: typeof onDocSignal;
    doOnInteractions: typeof doOnInteractions;
    methodNames: string[];
};
export default _default;
