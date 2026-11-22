import type { Plugin } from '@interactjs/core/scope';
import type { ActionName, Listener } from '@interactjs/core/types';
import './interactablePreventDefault';
import InteractionBase from './Interaction';
import type { SearchDetails } from './interactionFinder';
declare module '@interactjs/core/scope' {
    interface Scope {
        Interaction: typeof InteractionBase;
        interactions: {
            new: <T extends ActionName>(options: any) => InteractionBase<T>;
            list: Array<InteractionBase<ActionName>>;
            listeners: {
                [type: string]: Listener;
            };
            docEvents: Array<{
                type: string;
                listener: Listener;
            }>;
            pointerMoveTolerance: number;
        };
        prevTouchTime: number;
    }
    interface SignalArgs {
        'interactions:find': {
            interaction: InteractionBase;
            searchDetails: SearchDetails;
        };
    }
}
declare const interactions: Plugin;
export default interactions;
