import type { InteractEvent } from '@interactjs/core/InteractEvent';
import type Interaction from '@interactjs/core/Interaction';
import type { Plugin } from '@interactjs/core/scope';
import { Modification } from './Modification';
import type { Modifier, ModifierModule, ModifierState } from './types';
declare module '@interactjs/core/Interaction' {
    interface Interaction {
        modification?: Modification;
    }
}
declare module '@interactjs/core/InteractEvent' {
    interface InteractEvent {
        modifiers?: Array<{
            name: string;
            [key: string]: any;
        }>;
    }
}
declare module '@interactjs/core/options' {
    interface PerActionDefaults {
        modifiers?: Modifier[];
    }
}
export declare function makeModifier<Defaults extends {
    enabled?: boolean;
}, State extends ModifierState, Name extends string, Result>(module: ModifierModule<Defaults, State, Result>, name?: Name): {
    (_options?: Partial<Defaults>): Modifier<Defaults, State, Name, Result>;
    _defaults: Defaults;
    _methods: {
        start: (arg: import("./types").ModifierArg<State>) => void;
        set: (arg: import("./types").ModifierArg<State>) => Result;
        beforeEnd: (arg: import("./types").ModifierArg<State>) => void | import("@interactjs/core/types").Point;
        stop: (arg: import("./types").ModifierArg<State>) => void;
    };
};
export declare function addEventModifiers({ iEvent, interaction, }: {
    iEvent: InteractEvent<any>;
    interaction: Interaction<any>;
}): void;
declare const modifiersBase: Plugin;
export default modifiersBase;
