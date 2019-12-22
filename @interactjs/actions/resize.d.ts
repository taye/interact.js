import { ActionName } from '@interactjs/core/scope';
export declare type EdgeName = 'top' | 'left' | 'bottom' | 'right';
export declare type ResizableMethod = Interact.ActionMethod<Interact.ResizableOptions>;
declare module '@interactjs/core/Interactable' {
    interface Interactable {
        resizable: ResizableMethod;
    }
}
declare module '@interactjs/core/Interaction' {
    interface Interaction {
        resizeAxes: 'x' | 'y' | 'xy';
        resizeStartAspectRatio: number;
    }
}
declare module '@interactjs/core/defaultOptions' {
    interface ActionDefaults {
        resize: Interact.ResizableOptions;
    }
}
declare module '@interactjs/core/scope' {
    interface Actions {
        [ActionName.Resize]?: typeof resize;
    }
    enum ActionName {
        Resize = "resize"
    }
}
export interface ResizeEvent extends Interact.InteractEvent<ActionName.Resize> {
    deltaRect?: Interact.FullRect;
    edges?: Interact.ActionProps['edges'];
}
declare const resize: Interact.Plugin;
export default resize;
