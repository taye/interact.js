import * as snappers from '@interactjs/utils/snappers';
declare module '@interactjs/interact/interact' {
    interface InteractStatic {
        modifiers?: any;
        snappers?: typeof snappers;
        createSnapGrid?: typeof interact.snappers.grid;
    }
}
declare const exported: import("@interactjs/interact/interact").InteractStatic & ((target: import("./types").Target, options?: any) => import("@interactjs/core/Interactable").Interactable);
export default exported;
