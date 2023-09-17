import type { EventPhase, InteractEvent } from '@interactjs/core/InteractEvent';
import type { PerActionDefaults } from '@interactjs/core/options';
import type { Plugin } from '@interactjs/core/scope';
import type { ActionName, ActionProps, ActionMethod, EdgeOptions, FullRect, ListenersArg } from '@interactjs/core/types';
export declare type EdgeName = 'top' | 'left' | 'bottom' | 'right';
export declare type ResizableMethod = ActionMethod<ResizableOptions>;
declare module '@interactjs/core/Interactable' {
    interface Interactable {
        resizable: ResizableMethod;
    }
}
declare module '@interactjs/core/Interaction' {
    interface Interaction<T extends ActionName | null = ActionName> {
        resizeAxes: 'x' | 'y' | 'xy';
        resizeStartAspectRatio: number;
    }
}
declare module '@interactjs/core/options' {
    interface ActionDefaults {
        resize: ResizableOptions;
    }
}
declare module '@interactjs/core/types' {
    interface ActionMap {
        resize?: typeof resize;
    }
}
export interface ResizableOptions extends PerActionDefaults {
    square?: boolean;
    preserveAspectRatio?: boolean;
    edges?: EdgeOptions | null;
    axis?: 'x' | 'y' | 'xy';
    invert?: 'none' | 'negate' | 'reposition';
    margin?: number;
    squareResize?: boolean;
    oninertiastart?: ListenersArg;
    onstart?: ListenersArg;
    onmove?: ListenersArg;
    onend?: ListenersArg;
}
export interface ResizeEvent<P extends EventPhase = EventPhase> extends InteractEvent<'resize', P> {
    deltaRect?: FullRect;
    edges?: ActionProps['edges'];
}
declare const resize: Plugin;
export default resize;
