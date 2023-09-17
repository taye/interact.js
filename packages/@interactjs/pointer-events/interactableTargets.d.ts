import type { Interactable } from '@interactjs/core/Interactable';
import type { Plugin } from '@interactjs/core/scope';
declare module '@interactjs/core/Interactable' {
    interface Interactable {
        pointerEvents: typeof pointerEventsMethod;
        __backCompatOption: (optionName: string, newValue: any) => any;
    }
}
declare function pointerEventsMethod(this: Interactable, options: any): Interactable;
declare const plugin: Plugin;
export default plugin;
