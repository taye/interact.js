import type { Rect, Target, Element } from '@interactjs/core/types';
export declare function nodeContains(parent: Node, child: Node): boolean;
export declare function closest(element: Node, selector: string): HTMLElement | SVGElement;
export declare function parentNode(node: Node | Document): ParentNode;
export declare function matchesSelector(element: Element, selector: string): boolean;
export declare function indexOfDeepestElement(elements: Element[] | NodeListOf<globalThis.Element>): number;
export declare function matchesUpTo(element: Element, selector: string, limit: Node): boolean;
export declare function getActualElement(element: Element): any;
export declare function getScrollXY(relevantWindow?: Window): {
    x: number;
    y: number;
};
export declare function getElementClientRect(element: Element): Required<Rect>;
export declare function getElementRect(element: Element): Required<Rect>;
export declare function getPath(node: Node | Document): any[];
export declare function trySelector(value: Target): boolean;
