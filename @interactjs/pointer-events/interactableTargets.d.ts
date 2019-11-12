declare module '@interactjs/core/Interactable' {
    interface Interactable {
        pointerEvents: typeof pointerEventsMethod;
        __backCompatOption: (optionName: string, newValue: any) => any;
    }
}
declare function pointerEventsMethod(this: Interact.Interactable, options: any): import("@interactjs/core/Interactable").Interactable;
declare const plugin: Interact.Plugin;
export default plugin;
