export declare let realWindow: Window;
declare let win: Window;
export { win as window };
export declare function init(window: Window & {
    wrap?: (...args: any[]) => any;
}): void;
export declare function getWindow(node: any): any;
