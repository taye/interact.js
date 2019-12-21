import { Modifier, ModifierModule, ModifierState } from './base';
export interface AspectRatioOptions {
    ratio?: number | 'preserve';
    equalDelta?: boolean;
    modifiers?: Modifier[];
    enabled?: boolean;
}
export declare type AspectRatioState = ModifierState<AspectRatioOptions, {
    startCoords: Interact.Point;
    startRect: Interact.Rect;
    linkedEdges: Interact.EdgeOptions;
    ratio: number;
    equalDelta: boolean;
    xIsPrimaryAxis: boolean;
    edgeSign: 1 | -1;
    subStates: ModifierState[];
}>;
declare const aspectRatio: ModifierModule<AspectRatioOptions, AspectRatioState>;
export default aspectRatio;
