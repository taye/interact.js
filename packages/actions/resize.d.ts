import { Scope } from '@interactjs/core/scope';
export declare type EdgeName = 'top' | 'left' | 'bottom' | 'right';
declare module '@interactjs/core/Interactable' {
    interface Interactable {
        resizable?: (options: any) => Interactable | {
            [key: string]: any;
        };
    }
}
declare module '@interactjs/core/defaultOptions' {
    interface Defaults {
        resize?: any;
    }
}
declare module '@interactjs/core/scope' {
    interface Actions {
        resize?: typeof resize;
    }
}
declare function install(scope: Scope): void;
declare const resize: {
    defaults: {
        square: boolean;
        preserveAspectRatio: boolean;
        axis: string;
        margin: number;
        edges: any;
        invert: string;
    };
    checker: (_pointer: any, _event: any, interactable: any, element: any, interaction: any, rect: any) => {
        name: string;
        edges: {
            left: boolean;
            right: boolean;
            top: boolean;
            bottom: boolean;
        };
        axes?: undefined;
    } | {
        name: string;
        axes: string;
        edges?: undefined;
    };
    cursors: {
        x: string;
        y: string;
        xy: string;
        top: string;
        left: string;
        bottom: string;
        right: string;
        topleft: string;
        bottomright: string;
        topright: string;
        bottomleft: string;
    };
    getCursor: (action: any) => any;
    defaultMargin: number;
};
declare const _default: {
    install: typeof install;
};
export default _default;
