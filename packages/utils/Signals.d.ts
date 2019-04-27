export declare type SignalListener = (signalArg: PartialSignalArg, sinalName?: string) => (void | boolean);
export interface SignalArg<T extends Interact.ActionName = any> {
    interaction: Interact.Interaction<T>;
    Interactable: Interact.Interactable;
    iEvent: Interact.InteractEvent<T>;
    element: Interact.EventTarget;
    coords: Interact.Point;
    event: Interact.PointerEventType;
    phase: Interact.EventPhase;
    [index: string]: any;
}
export declare type PartialSignalArg = Partial<SignalArg>;
declare class Signals {
    listeners: {
        [signalName: string]: SignalListener[];
    };
    on(name: string, listener: SignalListener): void;
    off(name: string, listener: SignalListener): void;
    fire(name: string, arg: Partial<SignalArg>): void | false;
}
export default Signals;
