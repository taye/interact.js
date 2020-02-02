export declare const snap: {
    (_options?: Partial<import("./snap/pointer").SnapOptions>): import("./base").Modifier<import("./snap/pointer").SnapOptions, import("./base").ModifierState<import("./snap/pointer").SnapOptions, {
        offsets?: import("./snap/pointer").Offset[];
        closest?: any;
        targetFields?: string[][];
    }, any>, "snap">;
    _defaults: import("./snap/pointer").SnapOptions;
    _methods: {
        start: (arg: import("./base").ModifierArg<import("./base").ModifierState<import("./snap/pointer").SnapOptions, {
            offsets?: import("./snap/pointer").Offset[];
            closest?: any;
            targetFields?: string[][];
        }, any>>) => void;
        set: (arg: import("./base").ModifierArg<import("./base").ModifierState<import("./snap/pointer").SnapOptions, {
            offsets?: import("./snap/pointer").Offset[];
            closest?: any;
            targetFields?: string[][];
        }, any>>) => any;
        beforeEnd: (arg: import("./base").ModifierArg<import("./base").ModifierState<import("./snap/pointer").SnapOptions, {
            offsets?: import("./snap/pointer").Offset[];
            closest?: any;
            targetFields?: string[][];
        }, any>>) => void | import("@interactjs/types/types").Point;
        stop: (arg: import("./base").ModifierArg<import("./base").ModifierState<import("./snap/pointer").SnapOptions, {
            offsets?: import("./snap/pointer").Offset[];
            closest?: any;
            targetFields?: string[][];
        }, any>>) => void;
    };
};
export declare const snapSize: {
    (_options?: Partial<Pick<import("./snap/pointer").SnapOptions, "enabled" | "offset" | "targets" | "endOnly" | "range">>): import("./base").Modifier<Pick<import("./snap/pointer").SnapOptions, "enabled" | "offset" | "targets" | "endOnly" | "range">, import("./base").ModifierState<import("./snap/pointer").SnapOptions, {
        offsets?: import("./snap/pointer").Offset[];
        closest?: any;
        targetFields?: string[][];
    }, any>, "snapSize">;
    _defaults: Pick<import("./snap/pointer").SnapOptions, "enabled" | "offset" | "targets" | "endOnly" | "range">;
    _methods: {
        start: (arg: import("./base").ModifierArg<import("./base").ModifierState<import("./snap/pointer").SnapOptions, {
            offsets?: import("./snap/pointer").Offset[];
            closest?: any;
            targetFields?: string[][];
        }, any>>) => void;
        set: (arg: import("./base").ModifierArg<import("./base").ModifierState<import("./snap/pointer").SnapOptions, {
            offsets?: import("./snap/pointer").Offset[];
            closest?: any;
            targetFields?: string[][];
        }, any>>) => any;
        beforeEnd: (arg: import("./base").ModifierArg<import("./base").ModifierState<import("./snap/pointer").SnapOptions, {
            offsets?: import("./snap/pointer").Offset[];
            closest?: any;
            targetFields?: string[][];
        }, any>>) => void | import("@interactjs/types/types").Point;
        stop: (arg: import("./base").ModifierArg<import("./base").ModifierState<import("./snap/pointer").SnapOptions, {
            offsets?: import("./snap/pointer").Offset[];
            closest?: any;
            targetFields?: string[][];
        }, any>>) => void;
    };
};
export declare const snapEdges: {
    (_options?: Partial<import("./snap/pointer").SnapOptions>): import("./base").Modifier<import("./snap/pointer").SnapOptions, import("./base").ModifierState<import("./snap/pointer").SnapOptions, {
        offsets?: import("./snap/pointer").Offset[];
        closest?: any;
        targetFields?: string[][];
    }, any>, "snapEdges">;
    _defaults: import("./snap/pointer").SnapOptions;
    _methods: {
        start: (arg: import("./base").ModifierArg<import("./base").ModifierState<import("./snap/pointer").SnapOptions, {
            offsets?: import("./snap/pointer").Offset[];
            closest?: any;
            targetFields?: string[][];
        }, any>>) => void;
        set: (arg: import("./base").ModifierArg<import("./base").ModifierState<import("./snap/pointer").SnapOptions, {
            offsets?: import("./snap/pointer").Offset[];
            closest?: any;
            targetFields?: string[][];
        }, any>>) => any;
        beforeEnd: (arg: import("./base").ModifierArg<import("./base").ModifierState<import("./snap/pointer").SnapOptions, {
            offsets?: import("./snap/pointer").Offset[];
            closest?: any;
            targetFields?: string[][];
        }, any>>) => void | import("@interactjs/types/types").Point;
        stop: (arg: import("./base").ModifierArg<import("./base").ModifierState<import("./snap/pointer").SnapOptions, {
            offsets?: import("./snap/pointer").Offset[];
            closest?: any;
            targetFields?: string[][];
        }, any>>) => void;
    };
};
export declare const restrict: {
    (_options?: Partial<import("./restrict/pointer").RestrictOptions>): import("./base").Modifier<import("./restrict/pointer").RestrictOptions, import("./base").ModifierState<import("./restrict/pointer").RestrictOptions, {
        offset: import("@interactjs/types/types").Rect;
    }, any>, "restrict">;
    _defaults: import("./restrict/pointer").RestrictOptions;
    _methods: {
        start: (arg: import("./base").ModifierArg<import("./base").ModifierState<import("./restrict/pointer").RestrictOptions, {
            offset: import("@interactjs/types/types").Rect;
        }, any>>) => void;
        set: (arg: import("./base").ModifierArg<import("./base").ModifierState<import("./restrict/pointer").RestrictOptions, {
            offset: import("@interactjs/types/types").Rect;
        }, any>>) => any;
        beforeEnd: (arg: import("./base").ModifierArg<import("./base").ModifierState<import("./restrict/pointer").RestrictOptions, {
            offset: import("@interactjs/types/types").Rect;
        }, any>>) => void | import("@interactjs/types/types").Point;
        stop: (arg: import("./base").ModifierArg<import("./base").ModifierState<import("./restrict/pointer").RestrictOptions, {
            offset: import("@interactjs/types/types").Rect;
        }, any>>) => void;
    };
};
export declare const restrictRect: {
    (_options?: Partial<import("./restrict/pointer").RestrictOptions & {
        elementRect: {
            top: number;
            left: number;
            bottom: number;
            right: number;
        };
    }>): import("./base").Modifier<import("./restrict/pointer").RestrictOptions & {
        elementRect: {
            top: number;
            left: number;
            bottom: number;
            right: number;
        };
    }, import("./base").ModifierState<import("./restrict/pointer").RestrictOptions, {
        offset: import("@interactjs/types/types").Rect;
    }, any>, "restrictRect">;
    _defaults: import("./restrict/pointer").RestrictOptions & {
        elementRect: {
            top: number;
            left: number;
            bottom: number;
            right: number;
        };
    };
    _methods: {
        start: (arg: import("./base").ModifierArg<import("./base").ModifierState<import("./restrict/pointer").RestrictOptions, {
            offset: import("@interactjs/types/types").Rect;
        }, any>>) => void;
        set: (arg: import("./base").ModifierArg<import("./base").ModifierState<import("./restrict/pointer").RestrictOptions, {
            offset: import("@interactjs/types/types").Rect;
        }, any>>) => any;
        beforeEnd: (arg: import("./base").ModifierArg<import("./base").ModifierState<import("./restrict/pointer").RestrictOptions, {
            offset: import("@interactjs/types/types").Rect;
        }, any>>) => void | import("@interactjs/types/types").Point;
        stop: (arg: import("./base").ModifierArg<import("./base").ModifierState<import("./restrict/pointer").RestrictOptions, {
            offset: import("@interactjs/types/types").Rect;
        }, any>>) => void;
    };
};
export declare const restrictEdges: {
    (_options?: Partial<import("./restrict/edges").RestrictEdgesOptions>): import("./base").Modifier<import("./restrict/edges").RestrictEdgesOptions, import("./base").ModifierState<import("./restrict/edges").RestrictEdgesOptions, {
        inner: import("@interactjs/types/types").Rect;
        outer: import("@interactjs/types/types").Rect;
        offset: import("@interactjs/types/types").Rect;
    }, any>, "restrictEdges">;
    _defaults: import("./restrict/edges").RestrictEdgesOptions;
    _methods: {
        start: (arg: import("./base").ModifierArg<import("./base").ModifierState<import("./restrict/edges").RestrictEdgesOptions, {
            inner: import("@interactjs/types/types").Rect;
            outer: import("@interactjs/types/types").Rect;
            offset: import("@interactjs/types/types").Rect;
        }, any>>) => void;
        set: (arg: import("./base").ModifierArg<import("./base").ModifierState<import("./restrict/edges").RestrictEdgesOptions, {
            inner: import("@interactjs/types/types").Rect;
            outer: import("@interactjs/types/types").Rect;
            offset: import("@interactjs/types/types").Rect;
        }, any>>) => any;
        beforeEnd: (arg: import("./base").ModifierArg<import("./base").ModifierState<import("./restrict/edges").RestrictEdgesOptions, {
            inner: import("@interactjs/types/types").Rect;
            outer: import("@interactjs/types/types").Rect;
            offset: import("@interactjs/types/types").Rect;
        }, any>>) => void | import("@interactjs/types/types").Point;
        stop: (arg: import("./base").ModifierArg<import("./base").ModifierState<import("./restrict/edges").RestrictEdgesOptions, {
            inner: import("@interactjs/types/types").Rect;
            outer: import("@interactjs/types/types").Rect;
            offset: import("@interactjs/types/types").Rect;
        }, any>>) => void;
    };
};
export declare const restrictSize: {
    (_options?: Partial<import("./restrict/size").RestrictSizeOptions>): import("./base").Modifier<import("./restrict/size").RestrictSizeOptions, import("./base").ModifierState<import("./restrict/edges").RestrictEdgesOptions, {
        inner: import("@interactjs/types/types").Rect;
        outer: import("@interactjs/types/types").Rect;
        offset: import("@interactjs/types/types").Rect;
    }, any>, "restrictSize">;
    _defaults: import("./restrict/size").RestrictSizeOptions;
    _methods: {
        start: (arg: import("./base").ModifierArg<import("./base").ModifierState<import("./restrict/edges").RestrictEdgesOptions, {
            inner: import("@interactjs/types/types").Rect;
            outer: import("@interactjs/types/types").Rect;
            offset: import("@interactjs/types/types").Rect;
        }, any>>) => void;
        set: (arg: import("./base").ModifierArg<import("./base").ModifierState<import("./restrict/edges").RestrictEdgesOptions, {
            inner: import("@interactjs/types/types").Rect;
            outer: import("@interactjs/types/types").Rect;
            offset: import("@interactjs/types/types").Rect;
        }, any>>) => any;
        beforeEnd: (arg: import("./base").ModifierArg<import("./base").ModifierState<import("./restrict/edges").RestrictEdgesOptions, {
            inner: import("@interactjs/types/types").Rect;
            outer: import("@interactjs/types/types").Rect;
            offset: import("@interactjs/types/types").Rect;
        }, any>>) => void | import("@interactjs/types/types").Point;
        stop: (arg: import("./base").ModifierArg<import("./base").ModifierState<import("./restrict/edges").RestrictEdgesOptions, {
            inner: import("@interactjs/types/types").Rect;
            outer: import("@interactjs/types/types").Rect;
            offset: import("@interactjs/types/types").Rect;
        }, any>>) => void;
    };
};
export declare const aspectRatio: {
    (_options?: Partial<import("./aspectRatio").AspectRatioOptions>): import("./base").Modifier<import("./aspectRatio").AspectRatioOptions, import("./base").ModifierState<import("./aspectRatio").AspectRatioOptions, {
        startCoords: import("@interactjs/types/types").Point;
        startRect: import("@interactjs/types/types").Rect;
        linkedEdges: import("@interactjs/types/types").EdgeOptions;
        ratio: number;
        equalDelta: boolean;
        xIsPrimaryAxis: boolean;
        edgeSign: 1 | -1;
        subStates: {
            options: {};
            methods?: {
                start?: (arg: import("./base").ModifierArg<any>) => void;
                set: (arg: import("./base").ModifierArg<any>) => void;
                beforeEnd?: (arg: import("./base").ModifierArg<any>) => void | import("@interactjs/types/types").Point;
                stop?: (arg: import("./base").ModifierArg<any>) => void;
            };
            index?: number;
            name?: any;
            result?: object;
        }[];
    }, any>, "aspectRatio">;
    _defaults: import("./aspectRatio").AspectRatioOptions;
    _methods: {
        start: (arg: import("./base").ModifierArg<import("./base").ModifierState<import("./aspectRatio").AspectRatioOptions, {
            startCoords: import("@interactjs/types/types").Point;
            startRect: import("@interactjs/types/types").Rect;
            linkedEdges: import("@interactjs/types/types").EdgeOptions;
            ratio: number;
            equalDelta: boolean;
            xIsPrimaryAxis: boolean;
            edgeSign: 1 | -1;
            subStates: {
                options: {};
                methods?: {
                    start?: (arg: import("./base").ModifierArg<any>) => void;
                    set: (arg: import("./base").ModifierArg<any>) => void;
                    beforeEnd?: (arg: import("./base").ModifierArg<any>) => void | import("@interactjs/types/types").Point;
                    stop?: (arg: import("./base").ModifierArg<any>) => void;
                };
                index?: number;
                name?: any;
                result?: object;
            }[];
        }, any>>) => void;
        set: (arg: import("./base").ModifierArg<import("./base").ModifierState<import("./aspectRatio").AspectRatioOptions, {
            startCoords: import("@interactjs/types/types").Point;
            startRect: import("@interactjs/types/types").Rect;
            linkedEdges: import("@interactjs/types/types").EdgeOptions;
            ratio: number;
            equalDelta: boolean;
            xIsPrimaryAxis: boolean;
            edgeSign: 1 | -1;
            subStates: {
                options: {};
                methods?: {
                    start?: (arg: import("./base").ModifierArg<any>) => void;
                    set: (arg: import("./base").ModifierArg<any>) => void;
                    beforeEnd?: (arg: import("./base").ModifierArg<any>) => void | import("@interactjs/types/types").Point;
                    stop?: (arg: import("./base").ModifierArg<any>) => void;
                };
                index?: number;
                name?: any;
                result?: object;
            }[];
        }, any>>) => any;
        beforeEnd: (arg: import("./base").ModifierArg<import("./base").ModifierState<import("./aspectRatio").AspectRatioOptions, {
            startCoords: import("@interactjs/types/types").Point;
            startRect: import("@interactjs/types/types").Rect;
            linkedEdges: import("@interactjs/types/types").EdgeOptions;
            ratio: number;
            equalDelta: boolean;
            xIsPrimaryAxis: boolean;
            edgeSign: 1 | -1;
            subStates: {
                options: {};
                methods?: {
                    start?: (arg: import("./base").ModifierArg<any>) => void;
                    set: (arg: import("./base").ModifierArg<any>) => void;
                    beforeEnd?: (arg: import("./base").ModifierArg<any>) => void | import("@interactjs/types/types").Point;
                    stop?: (arg: import("./base").ModifierArg<any>) => void;
                };
                index?: number;
                name?: any;
                result?: object;
            }[];
        }, any>>) => void | import("@interactjs/types/types").Point;
        stop: (arg: import("./base").ModifierArg<import("./base").ModifierState<import("./aspectRatio").AspectRatioOptions, {
            startCoords: import("@interactjs/types/types").Point;
            startRect: import("@interactjs/types/types").Rect;
            linkedEdges: import("@interactjs/types/types").EdgeOptions;
            ratio: number;
            equalDelta: boolean;
            xIsPrimaryAxis: boolean;
            edgeSign: 1 | -1;
            subStates: {
                options: {};
                methods?: {
                    start?: (arg: import("./base").ModifierArg<any>) => void;
                    set: (arg: import("./base").ModifierArg<any>) => void;
                    beforeEnd?: (arg: import("./base").ModifierArg<any>) => void | import("@interactjs/types/types").Point;
                    stop?: (arg: import("./base").ModifierArg<any>) => void;
                };
                index?: number;
                name?: any;
                result?: object;
            }[];
        }, any>>) => void;
    };
};
