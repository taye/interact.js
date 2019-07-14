declare const restrictRect: {
    start: ({ rect, startOffset, state, interaction, pageCoords }: {
        rect: any;
        startOffset: any;
        state: any;
        interaction: any;
        pageCoords: any;
    }) => void;
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
