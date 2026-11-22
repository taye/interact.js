declare const _default: {
    aspectRatio: {
        (_options?: Partial<import("./aspectRatio").AspectRatioOptions>): import("./types").Modifier<import("./aspectRatio").AspectRatioOptions, import("./aspectRatio").AspectRatioState, "aspectRatio", unknown>;
        _defaults: import("./aspectRatio").AspectRatioOptions;
        _methods: {
            start: (arg: import("./types").ModifierArg<import("./aspectRatio").AspectRatioState>) => void;
            set: (arg: import("./types").ModifierArg<import("./aspectRatio").AspectRatioState>) => unknown;
            beforeEnd: (arg: import("./types").ModifierArg<import("./aspectRatio").AspectRatioState>) => void | import("@interactjs/core/types").Point;
            stop: (arg: import("./types").ModifierArg<import("./aspectRatio").AspectRatioState>) => void;
        };
    };
    restrictEdges: {
        (_options?: Partial<import("./restrict/edges").RestrictEdgesOptions>): import("./types").Modifier<import("./restrict/edges").RestrictEdgesOptions, import("./restrict/edges").RestrictEdgesState, "restrictEdges", void>;
        _defaults: import("./restrict/edges").RestrictEdgesOptions;
        _methods: {
            start: (arg: import("./types").ModifierArg<import("./restrict/edges").RestrictEdgesState>) => void;
            set: (arg: import("./types").ModifierArg<import("./restrict/edges").RestrictEdgesState>) => void;
            beforeEnd: (arg: import("./types").ModifierArg<import("./restrict/edges").RestrictEdgesState>) => void | import("@interactjs/core/types").Point;
            stop: (arg: import("./types").ModifierArg<import("./restrict/edges").RestrictEdgesState>) => void;
        };
    };
    restrict: {
        (_options?: Partial<import("./restrict/pointer").RestrictOptions>): import("./types").Modifier<import("./restrict/pointer").RestrictOptions, import("./restrict/pointer").RestrictState, "restrict", unknown>;
        _defaults: import("./restrict/pointer").RestrictOptions;
        _methods: {
            start: (arg: import("./types").ModifierArg<import("./restrict/pointer").RestrictState>) => void;
            set: (arg: import("./types").ModifierArg<import("./restrict/pointer").RestrictState>) => unknown;
            beforeEnd: (arg: import("./types").ModifierArg<import("./restrict/pointer").RestrictState>) => void | import("@interactjs/core/types").Point;
            stop: (arg: import("./types").ModifierArg<import("./restrict/pointer").RestrictState>) => void;
        };
    };
    restrictRect: {
        (_options?: Partial<import("./restrict/pointer").RestrictOptions & {
            elementRect: {
                top: number;
                left: number;
                bottom: number;
                right: number;
            };
        }>): import("./types").Modifier<import("./restrict/pointer").RestrictOptions & {
            elementRect: {
                top: number;
                left: number;
                bottom: number;
                right: number;
            };
        }, import("./restrict/pointer").RestrictState, "restrictRect", unknown>;
        _defaults: import("./restrict/pointer").RestrictOptions & {
            elementRect: {
                top: number;
                left: number;
                bottom: number;
                right: number;
            };
        };
        _methods: {
            start: (arg: import("./types").ModifierArg<import("./restrict/pointer").RestrictState>) => void;
            set: (arg: import("./types").ModifierArg<import("./restrict/pointer").RestrictState>) => unknown;
            beforeEnd: (arg: import("./types").ModifierArg<import("./restrict/pointer").RestrictState>) => void | import("@interactjs/core/types").Point;
            stop: (arg: import("./types").ModifierArg<import("./restrict/pointer").RestrictState>) => void;
        };
    };
    restrictSize: {
        (_options?: Partial<import("./restrict/size").RestrictSizeOptions>): import("./types").Modifier<import("./restrict/size").RestrictSizeOptions, import("./restrict/edges").RestrictEdgesState, "restrictSize", void>;
        _defaults: import("./restrict/size").RestrictSizeOptions;
        _methods: {
            start: (arg: import("./types").ModifierArg<import("./restrict/edges").RestrictEdgesState>) => void;
            set: (arg: import("./types").ModifierArg<import("./restrict/edges").RestrictEdgesState>) => void;
            beforeEnd: (arg: import("./types").ModifierArg<import("./restrict/edges").RestrictEdgesState>) => void | import("@interactjs/core/types").Point;
            stop: (arg: import("./types").ModifierArg<import("./restrict/edges").RestrictEdgesState>) => void;
        };
    };
    snapEdges: {
        (_options?: Partial<import("./snap/edges").SnapEdgesOptions>): import("./types").Modifier<import("./snap/edges").SnapEdgesOptions, import("./snap/pointer").SnapState, "snapEdges", {
            target: any;
            inRange: boolean;
            distance: number;
            range: number;
            delta: {
                x: number;
                y: number;
            };
        }>;
        _defaults: import("./snap/edges").SnapEdgesOptions;
        _methods: {
            start: (arg: import("./types").ModifierArg<import("./snap/pointer").SnapState>) => void;
            set: (arg: import("./types").ModifierArg<import("./snap/pointer").SnapState>) => {
                target: any;
                inRange: boolean;
                distance: number;
                range: number;
                delta: {
                    x: number;
                    y: number;
                };
            };
            beforeEnd: (arg: import("./types").ModifierArg<import("./snap/pointer").SnapState>) => void | import("@interactjs/core/types").Point;
            stop: (arg: import("./types").ModifierArg<import("./snap/pointer").SnapState>) => void;
        };
    };
    snap: {
        (_options?: Partial<import("./snap/pointer").SnapOptions>): import("./types").Modifier<import("./snap/pointer").SnapOptions, import("./snap/pointer").SnapState, "snap", {
            target: any;
            inRange: boolean;
            distance: number;
            range: number;
            delta: {
                x: number;
                y: number;
            };
        }>;
        _defaults: import("./snap/pointer").SnapOptions;
        _methods: {
            start: (arg: import("./types").ModifierArg<import("./snap/pointer").SnapState>) => void;
            set: (arg: import("./types").ModifierArg<import("./snap/pointer").SnapState>) => {
                target: any;
                inRange: boolean;
                distance: number;
                range: number;
                delta: {
                    x: number;
                    y: number;
                };
            };
            beforeEnd: (arg: import("./types").ModifierArg<import("./snap/pointer").SnapState>) => void | import("@interactjs/core/types").Point;
            stop: (arg: import("./types").ModifierArg<import("./snap/pointer").SnapState>) => void;
        };
    };
    snapSize: {
        (_options?: Partial<import("./snap/size").SnapSizeOptions>): import("./types").Modifier<import("./snap/size").SnapSizeOptions, import("./snap/pointer").SnapState, "snapSize", {
            target: any;
            inRange: boolean;
            distance: number;
            range: number;
            delta: {
                x: number;
                y: number;
            };
        }>;
        _defaults: import("./snap/size").SnapSizeOptions;
        _methods: {
            start: (arg: import("./types").ModifierArg<import("./snap/pointer").SnapState>) => void;
            set: (arg: import("./types").ModifierArg<import("./snap/pointer").SnapState>) => {
                target: any;
                inRange: boolean;
                distance: number;
                range: number;
                delta: {
                    x: number;
                    y: number;
                };
            };
            beforeEnd: (arg: import("./types").ModifierArg<import("./snap/pointer").SnapState>) => void | import("@interactjs/core/types").Point;
            stop: (arg: import("./types").ModifierArg<import("./snap/pointer").SnapState>) => void;
        };
    };
    spring: import("./types").ModifierFunction<any, any, "noop">;
    avoid: import("./types").ModifierFunction<any, any, "noop">;
    transform: import("./types").ModifierFunction<any, any, "noop">;
    rubberband: import("./types").ModifierFunction<any, any, "noop">;
};
export default _default;
