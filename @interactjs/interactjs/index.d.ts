import interact from '@interactjs/interact/index';
import * as modifiers from '@interactjs/modifiers/index';
import '@interactjs/types/index';
import * as snappers from '@interactjs/utils/snappers/index';
declare module '@interactjs/interact/interact' {
    interface InteractStatic {
        modifiers: typeof modifiers;
        snappers: typeof snappers;
        createSnapGrid: typeof snappers.grid;
    }
}
export declare function init(win: Window): import("@interactjs/interact/interact").InteractStatic;
export default interact;
