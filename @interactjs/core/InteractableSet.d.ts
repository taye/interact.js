declare module '@interactjs/core/scope' {
    interface SignalArgs {
        'interactable:new': {
            interactable: Interact.Interactable;
            target: Interact.Target;
            options: Interact.OptionsArg;
            win: Window;
        };
    }
}
interface InteractableScopeProp {
    context: Document | Interact.Element;
    interactable: Interact.Interactable;
}
export default class InteractableSet {
    protected scope: Interact.Scope;
    list: Interact.Interactable[];
    selectorMap: {
        [selector: string]: InteractableScopeProp[];
    };
    constructor(scope: Interact.Scope);
    new(target: Interact.Target, options?: any): Interact.Interactable;
    get(target: Interact.Target, options?: Interact.Options): import("@interactjs/core/Interactable").Interactable;
    forEachMatch<T>(node: Node, callback: (interactable: Interact.Interactable) => T): T | void;
}
export {};
