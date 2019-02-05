import { ActionName, Scope } from '@interactjs/core/scope';
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
    interface Actions {
        [ActionName.Drag]?: typeof drag;
    }
    enum ActionName {
        Drag = "drag"
    }
}
export declare type DragEvent = Interact.InteractEvent<ActionName.Drag>;
export declare type DraggableMethod = (options?: Interact.OrBoolean<Interact.DraggableOptions> | boolean) => Interact.Interactable | Interact.DropzoneOptions;
declare function install(scope: Scope): void;
declare function beforeMove({ interaction }: {
    interaction: any;
}): void;
declare function move({ iEvent, interaction }: {
    iEvent: any;
    interaction: any;
}): void;
/**
 * ```js
 * interact(element).draggable({
 *     onstart: function (event) {},
 *     onmove : function (event) {},
 *     onend  : function (event) {},
 *
 *     // the axis in which the first movement must be
 *     // for the drag sequence to start
 *     // 'xy' by default - any direction
 *     startAxis: 'x' || 'y' || 'xy',
 *
 *     // 'xy' by default - don't restrict to one axis (move in any direction)
 *     // 'x' or 'y' to restrict movement to either axis
 *     // 'start' to restrict movement to the axis the drag started in
 *     lockAxis: 'x' || 'y' || 'xy' || 'start',
 *
 *     // max number of drags that can happen concurrently
 *     // with elements of this Interactable. Infinity by default
 *     max: Infinity,
 *
 *     // max number of drags that can target the same element+Interactable
 *     // 1 by default
 *     maxPerElement: 2
 * });
 *
 * var isDraggable = interact('element').draggable(); // true
 * ```
 *
 * Get or set whether drag actions can be performed on the target
 *
 * @alias Interactable.prototype.draggable
 *
 * @param {boolean | object} [options] true/false or An object with event
 * listeners to be fired on drag events (object makes the Interactable
 * draggable)
 * @return {boolean | Interactable} boolean indicating if this can be the
 * target of drag events, or this Interctable
 */
declare function draggable(this: Interact.Interactable, options?: Interact.DraggableOptions | boolean): import("@interactjs/core/Interactable").Interactable | import("../types").DraggableOptions;
declare const drag: {
    install: typeof install;
    draggable: typeof draggable;
    beforeMove: typeof beforeMove;
    move: typeof move;
    defaults: import("../types").DropzoneOptions;
    checker(_pointer: any, _event: any, interactable: any): {
        name: string;
        axis: any;
    };
    getCursor(): string;
};
export default drag;
