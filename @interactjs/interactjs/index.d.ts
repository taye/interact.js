import interact from '../interact/index';
import { Modifier } from '../modifiers/base';
import * as modifiers from '../modifiers/index';
import '../types/index';
import * as snappers from '../utils/snappers/index';
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
