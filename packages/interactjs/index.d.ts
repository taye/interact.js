import interact from '@interactjs/interact';
import '@interactjs/types';
import * as snappers from '@interactjs/utils/snappers';
declare module '@interactjs/interact/interact' {
    interface InteractStatic {
        modifiers?: any;
        snappers?: typeof snappers & {
            [key: string]: any;
        };
        createSnapGrid?: typeof snappers.grid;
    }
}
export declare function init(win: Window): import("@interactjs/interact/interact").InteractStatic;
export default interact;
