declare function start({ interaction, interactable, element, rect, state, startOffset }: {
    interaction: any;
    interactable: any;
    element: any;
    rect: any;
    state: any;
    startOffset: any;
}): void;
declare function set({ interaction, coords, state }: {
    interaction: any;
    coords: any;
    state: any;
}): void;
declare const snap: {
    start: typeof start;
    set: typeof set;
    defaults: {
        enabled: boolean;
        range: number;
        targets: any;
        offset: any;
        relativePoints: any;
    };
};
export default snap;
