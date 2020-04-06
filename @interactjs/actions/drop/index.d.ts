import InteractEvent from '@interactjs/core/InteractEvent';
import Interactable from '@interactjs/core/Interactable';
export interface DropzoneMethod {
    (options: Interact.DropzoneOptions | boolean): Interact.Interactable;
    (): Interact.DropzoneOptions;
}
declare module '@interactjs/core/Interactable' {
    interface Interactable {
        dropzone: DropzoneMethod;
        dropCheck: (dragEvent: InteractEvent, event: Interact.PointerEventType, draggable: Interactable, draggableElement: Interact.Element, dropElemen: Interact.Element, rect: any) => boolean;
    }
}
declare module '@interactjs/core/Interaction' {
    interface Interaction {
        dropState?: DropState;
    }
}
declare module '@interactjs/core/defaultOptions' {
    interface ActionDefaults {
        drop: Interact.DropzoneOptions;
    }
}
declare module '@interactjs/core/scope' {
    interface ActionMap {
        drop?: typeof drop;
    }
    interface Scope {
        dynamicDrop?: boolean;
    }
    interface SignalArgs {
        'actions/drop:start': DropSignalArg;
        'actions/drop:move': DropSignalArg;
        'actions/drop:end': DropSignalArg;
    }
}
interface DropSignalArg {
    interaction: Interact.Interaction;
    dragEvent: Interact.DragEvent;
}
export interface ActiveDrop {
    dropzone: Interactable;
    element: Interact.Element;
    rect: Interact.Rect;
}
export interface DropState {
    cur: {
        dropzone: Interactable;
        element: Interact.Element;
    };
    prev: {
        dropzone: Interactable;
        element: Interact.Element;
    };
    rejected: boolean;
    events: any;
    activeDrops: ActiveDrop[];
}
declare const drop: Interact.Plugin;
export default drop;
