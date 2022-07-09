import type { EventTypes, Listener, ListenersArg } from '@interactjs/core/types';
export interface NormalizedListeners {
    [type: string]: Listener[];
}
export default function normalize(type: EventTypes, listeners?: ListenersArg | ListenersArg[], result?: NormalizedListeners): NormalizedListeners;
