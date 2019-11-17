import InteractionBase from './Interaction';
import { SearchDetails } from './interactionFinder';
import { Scope } from './scope';
declare module '../core/scope' {
    interface Scope {
        Interaction: typeof InteractionBase;
        interactions: {
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
declare module '@interactjs/core/scope' {
    interface SignalArgs {
        'interactions:find': {
            interaction: InteractionBase;
            searchDetails: SearchDetails;
        };
    }
}
declare function install(scope: Scope): void;
declare function doOnInteractions(method: any, scope: any): (event: any) => void;
declare function onDocSignal<T extends 'scope:add-document' | 'scope:remove-document'>({ doc, scope, options }: Interact.SignalArgs[T], eventMethodName: 'add' | 'remove'): void;
declare const _default: {
    id: string;
    install: typeof install;
    listeners: {
        'scope:add-document': (arg: any) => void;
        'scope:remove-document': (arg: any) => void;
    };
    onDocSignal: typeof onDocSignal;
    doOnInteractions: typeof doOnInteractions;
    methodNames: string[];
};
export default _default;
