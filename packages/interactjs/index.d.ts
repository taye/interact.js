import interact from '@interactjs/interact';
import * as modifiers from '@interactjs/modifiers';
import { Modifier } from '@interactjs/modifiers/base';
import '@interactjs/types';
import * as snappers from '@interactjs/utils/snappers';
declare module '@interactjs/interact/interact' {
    interface InteractStatic {
        modifiers?: typeof modifiers & {
            [key: string]: (options?: any) => Modifier;
        };
        snappers?: typeof snappers & {
            [key: string]: any;
        };
        createSnapGrid?: typeof snappers.grid;
    }
}
export declare function init(win: Window): import("@interactjs/interact/interact").InteractStatic;
export default interact;
