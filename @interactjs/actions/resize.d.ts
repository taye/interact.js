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
    interface ActionMap {
        resize?: typeof resize;
    }
}
export interface ResizeEvent<P extends Interact.EventPhase = Interact.EventPhase> extends Interact.InteractEvent<'resize', P> {
    deltaRect?: Interact.FullRect;
    edges?: Interact.ActionProps['edges'];
}
declare const resize: Interact.Plugin;
export default resize;
