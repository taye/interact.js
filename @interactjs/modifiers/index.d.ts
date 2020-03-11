import * as all from './all';
import * as snappers from '@interactjs/utils/snappers/index';
declare module '@interactjs/interact/index' {
    interface InteractStatic {
        modifiers: typeof all;
        snappers: typeof snappers;
        createSnapGrid: typeof snappers.grid;
    }
}
declare const modifiers: Interact.Plugin;
export default modifiers;
