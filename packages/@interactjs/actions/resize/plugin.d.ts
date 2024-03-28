import type { EventPhase, InteractEvent } from '@interactjs/core/InteractEvent';
import type { PerActionDefaults } from '@interactjs/core/options';
import type { Plugin } from '@interactjs/core/scope';
import type { ActionName, ActionProps, EdgeOptions, FullRect, ListenersArg, OrBoolean } from '@interactjs/core/types';
export type EdgeName = 'top' | 'left' | 'bottom' | 'right';
declare module '@interactjs/core/Interactable' {
    interface Interactable {
        resizable(): ResizableOptions;
        resizable(options: Partial<OrBoolean<ResizableOptions>> | boolean): this;
        /**
         * ```js
         * interact(element).resizable({
         *   onstart: function (event) {},
         *   onmove : function (event) {},
         *   onend  : function (event) {},
         *
         *   edges: {
         *     top   : true,       // Use pointer coords to check for resize.
         *     left  : false,      // Disable resizing from left edge.
         *     bottom: '.resize-s',// Resize if pointer target matches selector
         *     right : handleEl    // Resize if pointer target is the given Element
         *   },
         *
         *   // Width and height can be adjusted independently. When `true`, width and
         *   // height are adjusted at a 1:1 ratio.
         *   square: false,
         *
         *   // Width and height can be adjusted independently. When `true`, width and
         *   // height maintain the aspect ratio they had when resizing started.
         *   preserveAspectRatio: false,
         *
         *   // a value of 'none' will limit the resize rect to a minimum of 0x0
         *   // 'negate' will allow the rect to have negative width/height
         *   // 'reposition' will keep the width/height positive by swapping
         *   // the top and bottom edges and/or swapping the left and right edges
         *   invert: 'none' || 'negate' || 'reposition'
         *
         *   // limit multiple resizes.
         *   // See the explanation in the {@link Interactable.draggable} example
         *   max: Infinity,
         *   maxPerElement: 1,
         * })
         *
         * var isResizeable = interact(element).resizable()
         * ```
         *
         * Gets or sets whether resize actions can be performed on the target
         *
         * @param options - true/false or An object with event
         * listeners to be fired on resize events (object makes the Interactable
         * resizable)
         * @returns A boolean indicating if this can be the
         * target of resize elements, or this Interactable
         */
        resizable(options?: Partial<OrBoolean<ResizableOptions>> | boolean): this | ResizableOptions;
    }
}
declare module '@interactjs/core/Interaction' {
    interface Interaction<T extends ActionName | null = ActionName> {
        resizeAxes: 'x' | 'y' | 'xy';
        styleCursor(newValue: boolean): this;
        styleCursor(): boolean;
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
