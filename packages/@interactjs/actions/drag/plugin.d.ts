import type { InteractEvent } from '@interactjs/core/InteractEvent';
import type { PerActionDefaults } from '@interactjs/core/options';
import type { Plugin } from '@interactjs/core/scope';
import type { ActionMethod, ListenersArg } from '@interactjs/core/types';
declare module '@interactjs/core/Interactable' {
    interface Interactable {
        draggable: DraggableMethod;
    }
}
declare module '@interactjs/core/options' {
    interface ActionDefaults {
        drag: DraggableOptions;
    }
}
declare module '@interactjs/core/types' {
    interface ActionMap {
        drag?: typeof drag;
    }
}
export declare type DragEvent = InteractEvent<'drag'>;
export declare type DraggableMethod = ActionMethod<DraggableOptions>;
export interface DraggableOptions extends PerActionDefaults {
    startAxis?: 'x' | 'y' | 'xy';
    lockAxis?: 'x' | 'y' | 'xy' | 'start';
    oninertiastart?: ListenersArg;
    onstart?: ListenersArg;
    onmove?: ListenersArg;
    onend?: ListenersArg;
}
declare const drag: Plugin;
export default drag;
