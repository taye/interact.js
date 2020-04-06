import * as allSnappers from './all';
declare module '@interactjs/core/InteractStatic' {
    interface InteractStatic {
        snappers: typeof allSnappers;
        createSnapGrid: typeof allSnappers.grid;
    }
}
declare const snappersPlugin: Interact.Plugin;
export default snappersPlugin;
