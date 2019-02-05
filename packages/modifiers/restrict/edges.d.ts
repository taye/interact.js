import Interaction from '@interactjs/core/Interaction';
declare module '@interactjs/core/Interaction' {
    interface Action {
        linkedEdges?: {
            [key: string]: boolean;
        };
    }
}
declare function start({ interaction, state }: {
    interaction: Interaction;
    state: any;
}): void;
declare function set({ coords, interaction, state }: {
    coords: Interact.Point;
    interaction: Interaction;
    state: any;
}): void;
declare const restrictEdges: {
    noInner: {
        top: number;
        left: number;
        bottom: number;
        right: number;
    };
    noOuter: {
        top: number;
        left: number;
        bottom: number;
        right: number;
    };
    getRestrictionRect: (value: any, interaction: any, coords?: import("../../types").Point) => any;
    start: typeof start;
    set: typeof set;
    defaults: {
        enabled: boolean;
        inner: any;
        outer: any;
        offset: any;
    };
};
export default restrictEdges;
