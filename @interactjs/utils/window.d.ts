declare const win: {
    realWindow: Window;
    window: Window;
    getWindow: typeof getWindow;
    init: typeof init;
};
export declare function init(window: Window & {
    wrap?: (...args: any[]) => any;
}): void;
export declare function getWindow(node: any): any;
export default win;
