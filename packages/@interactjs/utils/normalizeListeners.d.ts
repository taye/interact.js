import type { EventTypes, Listener, ListenersArg } from '@interactjs/core/types';
export interface NormalizedListeners {
    [type: string]: Listener[];
}
export default function normalize(type: EventTypes, listeners?: ListenersArg | ListenersArg[] | null, filter?: (_typeOrPrefix: string) => boolean, result?: NormalizedListeners): NormalizedListeners;
