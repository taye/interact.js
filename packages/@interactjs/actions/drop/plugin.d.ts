import type { InteractEvent } from '@interactjs/core/InteractEvent';
import type { Interactable } from '@interactjs/core/Interactable';
import type { Interaction } from '@interactjs/core/Interaction';
import type { PerActionDefaults } from '@interactjs/core/options';
import type { Plugin } from '@interactjs/core/scope';
import type { Element, PointerEventType, Rect, ListenersArg } from '@interactjs/core/types';
import type { DragEvent } from '../drag/plugin';
import { DropEvent } from './DropEvent';
export declare type DropFunctionChecker = (dragEvent: any, // related drag operation
event: any, // touch or mouse EventEmitter
dropped: boolean, // default checker result
dropzone: Interactable, // dropzone interactable
dropElement: Element, // drop zone element
draggable: Interactable, // draggable's Interactable
draggableElement: Element) => boolean;
export interface DropzoneOptions extends PerActionDefaults {
    accept?: string | Element | (({ dropzone, draggableElement }: {
        dropzone: Interactable;
        draggableElement: Element;
    }) => boolean);
    overlap?: 'pointer' | 'center' | number;
    checker?: DropFunctionChecker;
    ondropactivate?: ListenersArg;
    ondropdeactivate?: ListenersArg;
    ondragenter?: ListenersArg;
    ondragleave?: ListenersArg;
    ondropmove?: ListenersArg;
    ondrop?: ListenersArg;
}
export interface DropzoneMethod {
    (this: Interactable, options: DropzoneOptions | boolean): Interactable;
    (): DropzoneOptions;
}
declare module '@interactjs/core/Interactable' {
    interface Interactable {
        dropzone: DropzoneMethod;
        dropCheck: (dragEvent: InteractEvent, event: PointerEventType, draggable: Interactable, draggableElement: Element, dropElemen: Element, rect: any) => boolean;
    }
}
declare module '@interactjs/core/Interaction' {
    interface Interaction {
        dropState?: DropState;
    }
}
declare module '@interactjs/core/InteractEvent' {
    interface InteractEvent {
        prevDropzone?: Interactable;
        dropzone?: Interactable;
        dragEnter?: Element;
        dragLeave?: Element;
    }
}
declare module '@interactjs/core/options' {
    interface ActionDefaults {
        drop: DropzoneOptions;
    }
}
declare module '@interactjs/core/scope' {
    interface Scope {
        dynamicDrop?: boolean;
    }
    interface SignalArgs {
        'actions/drop:start': DropSignalArg;
        'actions/drop:move': DropSignalArg;
        'actions/drop:end': DropSignalArg;
    }
}
declare module '@interactjs/core/types' {
    interface ActionMap {
        drop?: typeof drop;
    }
}
declare module '@interactjs/core/InteractStatic' {
    interface InteractStatic {
        dynamicDrop: (this: InteractStatic, newValue?: boolean) => boolean | this;
    }
}
interface DropSignalArg {
    interaction: Interaction<'drag'>;
    dragEvent: DragEvent;
}
export interface ActiveDrop {
    dropzone: Interactable;
    element: Element;
    rect: Rect;
}
export interface DropState {
    cur: {
        dropzone: Interactable;
        element: Element;
    };
    prev: {
        dropzone: Interactable;
        element: Element;
    };
    rejected: boolean;
    events: FiredDropEvents;
    activeDrops: ActiveDrop[];
}
declare type FiredDropEvents = Partial<Record<'leave' | 'enter' | 'move' | 'drop' | 'activate' | 'deactivate', DropEvent>>;
declare const drop: Plugin;
export default drop;
