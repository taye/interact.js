import type { Plugin } from '@interactjs/core/scope';
import type { PointerEventOptions } from '@interactjs/pointer-events/base';
declare module '@interactjs/core/Interactable' {
    interface Interactable {
        pointerEvents(options: Partial<PointerEventOptions>): this;
    }
}
declare const plugin: Plugin;
export default plugin;
