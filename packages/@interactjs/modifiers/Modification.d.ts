import type { EventPhase } from '@interactjs/core/InteractEvent';
import type { Interaction, DoAnyPhaseArg } from '@interactjs/core/Interaction';
import type { EdgeOptions, FullRect, Point, Rect } from '@interactjs/core/types';
import type { Modifier, ModifierArg, ModifierState } from './types';
export interface ModificationResult {
    delta: Point;
    rectDelta: Rect;
    coords: Point;
    rect: FullRect;
    eventProps: any[];
    changed: boolean;
}
interface MethodArg {
    phase: EventPhase;
    pageCoords: Point;
    rect: FullRect;
    coords: Point;
    preEnd?: boolean;
    skipModifiers?: number;
}
export declare class Modification {
    states: ModifierState[];
    startOffset: Rect;
    startDelta: Point;
    result: ModificationResult;
    endResult: Point;
    startEdges: EdgeOptions;
    edges: EdgeOptions;
    readonly interaction: Readonly<Interaction>;
    constructor(interaction: Interaction);
    start({ phase }: {
        phase: EventPhase;
    }, pageCoords: Point): ModificationResult;
    fillArg(arg: Partial<ModifierArg>): ModifierArg<{
        options: unknown;
        methods?: {
            start?: (arg: ModifierArg<any>) => void;
            set?: (arg: ModifierArg<any>) => any;
            beforeEnd?: (arg: ModifierArg<any>) => void | Point;
            stop?: (arg: ModifierArg<any>) => void;
        };
        index?: number;
        name?: any;
    }>;
    startAll(arg: MethodArg & Partial<ModifierArg>): void;
    setAll(arg: MethodArg & Partial<ModifierArg>): ModificationResult;
    applyToInteraction(arg: {
        phase: EventPhase;
        rect?: Rect;
    }): void;
    setAndApply(arg: Partial<DoAnyPhaseArg> & {
        phase: EventPhase;
        preEnd?: boolean;
        skipModifiers?: number;
        modifiedCoords?: Point;
    }): void | false;
    beforeEnd(arg: Omit<DoAnyPhaseArg, 'iEvent'> & {
        state?: ModifierState;
    }): void | false;
    stop(arg: {
        interaction: Interaction;
    }): void;
    prepareStates(modifierList: Modifier[]): {
        options: unknown;
        methods?: {
            start?: (arg: ModifierArg<any>) => void;
            set?: (arg: ModifierArg<any>) => any;
            beforeEnd?: (arg: ModifierArg<any>) => void | Point;
            stop?: (arg: ModifierArg<any>) => void;
        };
        index?: number;
        name?: any;
    }[];
    restoreInteractionCoords({ interaction: { coords, rect, modification } }: {
        interaction: Interaction;
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
