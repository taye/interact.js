declare const restrictRect: {
    start: ({ rect, startOffset, state, interaction, pageCoords }: import("../base").ModifierArg<import("../base").ModifierState<import("./pointer").RestrictOptions, {
        offset: import("../../types/types").Rect;
    }, any>>) => void;
    set: ({ coords, interaction, state }: {
        coords: any;
        interaction: any;
        state: any;
    }) => void;
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
