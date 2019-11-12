declare const restrictRect: {
    start: (arg: import("../base").ModifierArg<import("../base").ModifierState<import("./pointer").RestrictOptions, {
        offset: import("../../types/types").Rect;
    }, any>>) => void;
    set: (arg: import("../base").ModifierArg<import("../base").ModifierState<import("./pointer").RestrictOptions, {
        offset: import("../../types/types").Rect;
    }, any>>) => void;
    defaults: import("./pointer").RestrictOptions & {
        elementRect: {
            top: number;
            left: number;
            bottom: number;
            right: number;
        };
    };
};
export default restrictRect;
