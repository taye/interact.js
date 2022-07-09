declare const restrictRect: {
    start: (arg: import("../types").ModifierArg<import("./pointer").RestrictState>) => void;
    set: (arg: import("../types").ModifierArg<import("./pointer").RestrictState>) => unknown;
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
    }>): import("../types").Modifier<import("./pointer").RestrictOptions & {
        elementRect: {
            top: number;
            left: number;
            bottom: number;
            right: number;
        };
    }, import("./pointer").RestrictState, "restrictRect", unknown>;
    _defaults: import("./pointer").RestrictOptions & {
        elementRect: {
            top: number;
            left: number;
            bottom: number;
            right: number;
        };
    };
    _methods: {
        start: (arg: import("../types").ModifierArg<import("./pointer").RestrictState>) => void;
        set: (arg: import("../types").ModifierArg<import("./pointer").RestrictState>) => unknown;
        beforeEnd: (arg: import("../types").ModifierArg<import("./pointer").RestrictState>) => void | import("@interactjs/core/types").Point;
        stop: (arg: import("../types").ModifierArg<import("./pointer").RestrictState>) => void;
    };
};
export default _default;
export { restrictRect };
