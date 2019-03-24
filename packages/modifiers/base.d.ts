import { Scope } from '@interactjs/core/scope';
declare module '@interactjs/core/scope' {
    interface Scope {
        modifiers?: any;
    }
}
declare module '@interactjs/core/Interaction' {
    interface Interaction {
        modifiers?: any;
    }
}
declare module '@interactjs/core/defaultOptions' {
    interface PerActionDefaults {
        modifiers?: any[];
    }
}
declare function install(scope: Scope): void;
declare function startAll(arg: any): void;
declare function getRectOffset(rect: any, coords: any): {
    left: number;
    top: number;
    right: number;
    bottom: number;
};
declare function start({ interaction, phase }: Interact.SignalArg, pageCoords: Interact.Point, registeredModifiers: any): {
    delta: {
        x: number;
        y: number;
    };
    coords: import("../types/types").Point;
    changed: boolean;
};
declare function setAll(arg: Partial<Interact.SignalArg>): {
    delta: {
        x: number;
        y: number;
    };
    coords: import("../types/types").Point;
    changed: boolean;
};
declare function prepareStates(modifierList: any): any[];
declare function beforeMove({ interaction, phase, preEnd, skipModifiers }: {
    interaction: any;
    phase: any;
    preEnd: any;
    skipModifiers: any;
}): void | false;
declare function beforeEnd(arg: any): void | false;
declare function stop(arg: any): void;
declare function getModifierList(interaction: any, registeredModifiers: any): any;
declare function shouldDo(options: any, preEnd?: boolean, requireEndOnly?: boolean, phase?: string): any;
declare function makeModifier(module: any, name?: string): {
    (options: any): {
        options: any;
        methods: {
            start: any;
            set: any;
            beforeEnd: any;
            stop: any;
        };
        name: string;
    };
    _defaults: any;
    _methods: {
        start: any;
        set: any;
        beforeEnd: any;
        stop: any;
    };
};
declare const _default: {
    id: string;
    install: typeof install;
    startAll: typeof startAll;
    setAll: typeof setAll;
    prepareStates: typeof prepareStates;
    start: typeof start;
    beforeMove: typeof beforeMove;
    beforeEnd: typeof beforeEnd;
    stop: typeof stop;
    shouldDo: typeof shouldDo;
    getModifierList: typeof getModifierList;
    getRectOffset: typeof getRectOffset;
    makeModifier: typeof makeModifier;
};
export default _default;
