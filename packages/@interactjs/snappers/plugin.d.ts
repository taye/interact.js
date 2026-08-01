import type { Plugin } from '@interactjs/core/scope';
import * as allSnappers from './all';
declare module '@interactjs/core/InteractStatic' {
    interface InteractStatic {
        snappers: typeof allSnappers;
        createSnapGrid: typeof allSnappers.grid;
    }
}
declare const snappersPlugin: Plugin;
export default snappersPlugin;
