declare const browser: {
    init: typeof init;
    supportsTouch: boolean;
    supportsPointerEvent: boolean;
    isIOS7: boolean;
    isIOS: boolean;
    isIe9: boolean;
    isOperaMobile: boolean;
    prefixedMatchesSelector: string;
    pEventTypes: {
        up: string;
        down: string;
        over: string;
        out: string;
        move: string;
        cancel: string;
    };
    wheelEvent: string;
};
declare function init(window: any): void;
export default browser;
