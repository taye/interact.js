declare const restrictRect: {
    start: (arg: import("../base").ModifierArg<import("../base").ModifierState<import("./pointer").RestrictOptions, {
        offset: import("@interactjs/types/types").Rect;
    }, any>>) => void;
    set: (arg: import("../base").ModifierArg<import("../base").ModifierState<import("./pointer").RestrictOptions, {
        offset: import("@interactjs/types/types").Rect;
    }, any>>) => any;
    defaults: import("./pointer").RestrictOptions & {
        elementRect: {
            top: number;
            left: number;
            bottom: number;
            right: number;
        };
    };
};
declare const _default: {
    (_options?: Partial<import("./pointer").RestrictOptions & {
        elementRect: {
            top: number;
            left: number;
            bottom: number;
            right: number;
        };
    }>): import("../base").Modifier<import("./pointer").RestrictOptions & {
        elementRect: {
            top: number;
            left: number;
            bottom: number;
            right: number;
        };
    }, import("../base").ModifierState<import("./pointer").RestrictOptions, {
        offset: import("@interactjs/types/types").Rect;
    }, any>, "restrictRect">;
    _defaults: import("./pointer").RestrictOptions & {
        elementRect: {
            top: number;
            left: number;
            bottom: number;
            right: number;
        };
    };
    _methods: {
        start: (arg: import("../base").ModifierArg<import("../base").ModifierState<import("./pointer").RestrictOptions, {
            offset: import("@interactjs/types/types").Rect;
        }, any>>) => void;
        set: (arg: import("../base").ModifierArg<import("../base").ModifierState<import("./pointer").RestrictOptions, {
            offset: import("@interactjs/types/types").Rect;
        }, any>>) => any;
        beforeEnd: (arg: import("../base").ModifierArg<import("../base").ModifierState<import("./pointer").RestrictOptions, {
            offset: import("@interactjs/types/types").Rect;
        }, any>>) => void | import("@interactjs/types/types").Point;
        stop: (arg: import("../base").ModifierArg<import("../base").ModifierState<import("./pointer").RestrictOptions, {
            offset: import("@interactjs/types/types").Rect;
        }, any>>) => void;
    };
};
export default _default;
export { restrictRect };
