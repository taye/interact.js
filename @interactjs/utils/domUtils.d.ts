export declare function nodeContains(parent: Node | Interact.EventTarget, child: Node | Interact.EventTarget): boolean;
export declare function closest(element: Node, selector: string): import("../types/types").Element;
export declare function parentNode(node: Node | Document): Node & ParentNode;
export declare function matchesSelector(element: Interact.Element, selector: string): any;
export declare function indexOfDeepestElement(elements: Interact.Element[] | NodeListOf<Element>): number;
export declare function matchesUpTo(element: Interact.Element, selector: string, limit: Node): any;
export declare function getActualElement(element: Interact.Element): import("../types/types").Element;
export declare function getScrollXY(relevantWindow: any): {
    x: any;
    y: any;
};
export declare function getElementClientRect(element: Interact.Element): {
    left: number;
    right: number;
    top: number;
    bottom: number;
    width: number;
    height: number;
};
export declare function getElementRect(element: Interact.Element): {
    left: number;
    right: number;
    top: number;
    bottom: number;
    width: number;
    height: number;
};
export declare function getPath(node: Node | Document): any[];
export declare function trySelector(value: any): boolean;
