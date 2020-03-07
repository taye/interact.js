import InteractionBase from './Interaction';
import { SearchDetails } from './interactionFinder';
declare module '@interactjs/core/scope' {
    interface Scope {
        Interaction: typeof InteractionBase;
        interactions: {
            new: <T extends ActionName>(options: any) => InteractionBase<T>;
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
declare const interactions: Interact.Plugin;
export default interactions;
