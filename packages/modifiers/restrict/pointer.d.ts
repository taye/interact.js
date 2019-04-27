declare function start({ rect, startOffset, state }: {
    rect: any;
    startOffset: any;
    state: any;
}): void;
declare function set({ coords, interaction, state }: {
    coords: any;
    interaction: any;
    state: any;
}): any;
declare function getRestrictionRect(value: any, interaction: any, coords?: Interact.Point): any;
declare const restrict: {
    start: typeof start;
    set: typeof set;
    getRestrictionRect: typeof getRestrictionRect;
    defaults: {
        enabled: boolean;
        restriction: any;
        elementRect: any;
    };
};
export default restrict;
