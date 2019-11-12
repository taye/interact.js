export interface NormalizedListeners {
    [type: string]: Interact.Listener[];
}
export default function normalize(type: Interact.EventTypes, listeners?: Interact.ListenersArg | Interact.ListenersArg[], result?: NormalizedListeners): NormalizedListeners;
