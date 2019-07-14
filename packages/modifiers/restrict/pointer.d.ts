declare function start({ rect, startOffset, state, interaction, pageCoords }: {
    rect: any;
    startOffset: any;
    state: any;
    interaction: any;
    pageCoords: any;
}): void;
declare function set({ coords, interaction, state }: {
    coords: any;
    interaction: any;
    state: any;
}): void;
declare function getRestrictionRect(value: any, interaction: any, coords?: Interact.Point): import("../../types/types").Rect;
declare const restrict: {
    start: typeof start;
    set: typeof set;
    getRestrictionRect: typeof getRestrictionRect;
    defaults: import("../../types/types").RestrictOptions;
};
export default restrict;
