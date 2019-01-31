declare const win: {
    realWindow: any;
    window: any;
    getWindow: typeof getWindow;
    init: typeof init;
};
export declare function init(window: any): void;
export declare function getWindow(node: any): any;
export default win;
