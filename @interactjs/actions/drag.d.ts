declare module '@interactjs/core/Interactable' {
    interface Interactable {
        draggable: DraggableMethod;
    }
}
declare module '@interactjs/core/defaultOptions' {
    interface ActionDefaults {
        drag: Interact.DraggableOptions;
    }
}
declare module '@interactjs/core/scope' {
    interface ActionMap {
        drag?: typeof drag;
    }
}
export declare type DragEvent = Interact.InteractEvent<'drag'>;
export declare type DraggableMethod = Interact.ActionMethod<Interact.DraggableOptions>;
declare const drag: Interact.Plugin;
export default drag;
