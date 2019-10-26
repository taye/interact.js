export declare function nodeContains(parent: Node, child: Node): boolean;
export declare function closest(element: any, selector: any): import("../types/types").Element;
export declare function parentNode(node: any): any;
export declare function matchesSelector(element: any, selector: any): any;
export declare function indexOfDeepestElement(elements: Interact.Element[] | NodeListOf<Element>): number;
export declare function matchesUpTo(element: Interact.Element, selector: string, limit: Node): any;
export declare function getActualElement(element: any): any;
export declare function getScrollXY(relevantWindow: any): {
    x: any;
    y: any;
};
export declare function getElementClientRect(element: any): {
    left: any;
    right: any;
    top: any;
    bottom: any;
    width: any;
    height: any;
};
export declare function getElementRect(element: any): {
    left: any;
    right: any;
    top: any;
    bottom: any;
    width: any;
    height: any;
};
export declare function getPath(node: any): any[];
export declare function trySelector(value: any): boolean;
