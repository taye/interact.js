import Interaction from '@interactjs/core/Interaction';
import { RestrictOptions } from './pointer';
export interface RestrictEdgesOptions {
    inner: RestrictOptions['restriction'];
    outer: RestrictOptions['restriction'];
    offset: RestrictOptions['offset'];
    endOnly: boolean;
    enabled: boolean;
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
    getRestrictionRect: (value: any, interaction: any, coords?: import("../../types/types").Point) => import("../../types/types").Rect;
    start: typeof start;
    set: typeof set;
    defaults: RestrictEdgesOptions;
};
export default restrictEdges;
