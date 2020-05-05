import all from './all';
declare module '@interactjs/core/InteractStatic' {
    interface InteractStatic {
        modifiers: typeof all;
    }
}
declare const modifiers: Interact.Plugin;
export default modifiers;
