import { Modifier, ModifierArg, ModifierState } from './base';
export interface ModificationResult {
    delta: Interact.Point;
    rectDelta: Interact.Rect;
    coords: Interact.Point;
    rect: Interact.FullRect;
    eventProps: any[];
    changed: boolean;
}
interface MethodArg {
    phase: Interact.EventPhase;
    pageCoords?: Interact.Point;
    rect?: Interact.FullRect;
    coords?: Interact.Point;
    preEnd?: boolean;
    skipModifiers?: number;
}
export default class Modification {
    readonly interaction: Readonly<Interact.Interaction>;
    states: ModifierState[];
    startOffset: Interact.Rect;
    startDelta: Interact.Point;
    result?: ModificationResult;
    endResult?: Interact.Point;
    edges: Interact.EdgeOptions;
    constructor(interaction: Readonly<Interact.Interaction>);
    start({ phase }: MethodArg, pageCoords: Interact.Point): ModificationResult;
    fillArg(arg: Partial<ModifierArg>): void;
    startAll(arg: MethodArg & Partial<ModifierArg>): void;
    setAll(arg: MethodArg & Partial<ModifierArg>): ModificationResult;
    applyToInteraction(arg: {
        phase: Interact.EventPhase;
        rect?: Interact.Rect;
    }): void;
    setAndApply(arg: Partial<Interact.DoAnyPhaseArg> & {
        phase: Interact.EventPhase;
        preEnd?: boolean;
        skipModifiers?: number;
        modifiedCoords?: Interact.Point;
    }): void | false;
    beforeEnd(arg: Omit<Interact.DoAnyPhaseArg, 'iEvent'> & {
        state?: ModifierState;
    }): void | false;
    stop(arg: {
        interaction: Interact.Interaction;
    }): void;
    prepareStates(modifierList: Modifier[]): {
        options: {};
        methods?: {
            start?: (arg: ModifierArg<any>) => void;
            set: (arg: ModifierArg<any>) => void;
            beforeEnd?: (arg: ModifierArg<any>) => void | import("@interactjs/types/types").Point;
            stop?: (arg: ModifierArg<any>) => void;
        };
        index?: number;
        name?: any;
    }[];
    restoreInteractionCoords({ interaction: { coords, rect, modification } }: {
        interaction: Interact.Interaction;
    }): void;
    shouldDo(options: any, preEnd?: boolean, phase?: string, requireEndOnly?: boolean): boolean;
    copyFrom(other: Modification): void;
    destroy(): void;
}
export declare function getRectOffset(rect: any, coords: any): {
    left: number;
    top: number;
    right: number;
    bottom: number;
};
export {};
