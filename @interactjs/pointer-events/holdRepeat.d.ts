declare module '@interactjs/core/Interaction' {
    interface Interaction {
        holdIntervalHandle?: any;
    }
}
declare module '@interactjs/pointer-events/PointerEvent' {
    interface PointerEvent<T extends string = any> {
        count?: number;
    }
}
declare module '@interactjs/pointer-events/base' {
    interface PointerEventOptions {
        holdRepeatInterval?: number;
    }
}
declare const holdRepeat: Interact.Plugin;
export default holdRepeat;
