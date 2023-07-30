declare function init(global: Window | typeof globalThis): void;
declare const _default: {
    request: (callback: FrameRequestCallback) => number;
    cancel: (token: number) => void;
    init: typeof init;
};
export default _default;
