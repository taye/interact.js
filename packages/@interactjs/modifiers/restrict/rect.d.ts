declare const restrictRect: {
    start: (arg: import("../base").ModifierArg<import("./pointer").RestrictState>) => void;
    set: (arg: import("../base").ModifierArg<import("./pointer").RestrictState>) => unknown;
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
        start: (arg: import("../base").ModifierArg<import("./pointer").RestrictState>) => void;
        set: (arg: import("../base").ModifierArg<import("./pointer").RestrictState>) => unknown;
        beforeEnd: (arg: import("../base").ModifierArg<import("./pointer").RestrictState>) => void | import("@interactjs/interact").Point;
        stop: (arg: import("../base").ModifierArg<import("./pointer").RestrictState>) => void;
    };
};
export default _default;
export { restrictRect };
