declare module '@interactjs/core/Interaction' {
    interface Interaction {
        holdIntervalHandle?: any;
    }
}
declare module '@interactjs/pointer-events/base' {
    interface PointerEventOptions {
        holdRepeatInterval?: number;
    }
}
declare const _default: import("@interactjs/core/scope").Plugin;
export default _default;
