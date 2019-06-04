import Signals from '@interactjs/utils/Signals';
export default class InteractableSet {
    protected scope: Interact.Scope;
    signals: Signals;
    list: Interact.Interactable[];
    selectorMap: {
        [selector: string]: Array<{
            context: Document | Element;
            interactable: Interact.Interactable;
        }>;
    };
    constructor(scope: Interact.Scope);
    new(target: Interact.Target, options?: any): Interact.Interactable;
    get(target: Interact.Target, options: any): any;
    forEachMatch(node: Node, callback: (interactable: any) => any): any;
}
