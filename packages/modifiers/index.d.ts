export declare const snap: {
    (_options?: Partial<import("./snap/pointer").SnapOptions>): import("./base").Modifier<"snap", import("./snap/pointer").SnapOptions>;
    _defaults: import("./snap/pointer").SnapOptions;
    _methods: {
        start: any;
        set: any;
        beforeEnd: any;
        stop: any;
    };
};
export declare const snapSize: {
    (_options?: Partial<Pick<import("./snap/pointer").SnapOptions, "enabled" | "offset" | "endOnly" | "targets" | "range">>): import("./base").Modifier<"snapSize", Pick<import("./snap/pointer").SnapOptions, "enabled" | "offset" | "endOnly" | "targets" | "range">>;
    _defaults: Pick<import("./snap/pointer").SnapOptions, "enabled" | "offset" | "endOnly" | "targets" | "range">;
    _methods: {
        start: any;
        set: any;
        beforeEnd: any;
        stop: any;
    };
};
export declare const snapEdges: {
    (_options?: Partial<Pick<import("./snap/pointer").SnapOptions, "enabled" | "offset" | "endOnly" | "targets" | "range">>): import("./base").Modifier<"snapEdges", Pick<import("./snap/pointer").SnapOptions, "enabled" | "offset" | "endOnly" | "targets" | "range">>;
    _defaults: Pick<import("./snap/pointer").SnapOptions, "enabled" | "offset" | "endOnly" | "targets" | "range">;
    _methods: {
        start: any;
        set: any;
        beforeEnd: any;
        stop: any;
    };
};
export declare const restrict: {
    (_options?: Partial<import("./restrict/pointer").RestrictOptions>): import("./base").Modifier<"restrict", import("./restrict/pointer").RestrictOptions>;
    _defaults: import("./restrict/pointer").RestrictOptions;
    _methods: {
        start: any;
        set: any;
        beforeEnd: any;
        stop: any;
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
    }>): import("./base").Modifier<"restrictRect", import("./restrict/pointer").RestrictOptions & {
        elementRect: {
            top: number;
            left: number;
            bottom: number;
            right: number;
        };
    }>;
    _defaults: import("./restrict/pointer").RestrictOptions & {
        elementRect: {
            top: number;
            left: number;
            bottom: number;
            right: number;
        };
    };
    _methods: {
        start: any;
        set: any;
        beforeEnd: any;
        stop: any;
    };
};
export declare const restrictEdges: {
    (_options?: Partial<import("./restrict/edges").RestrictEdgesOptions>): import("./base").Modifier<"restrictEdges", import("./restrict/edges").RestrictEdgesOptions>;
    _defaults: import("./restrict/edges").RestrictEdgesOptions;
    _methods: {
        start: any;
        set: any;
        beforeEnd: any;
        stop: any;
    };
};
export declare const restrictSize: {
    (_options?: Partial<import("./restrict/size").RestrictSizeOptions>): import("./base").Modifier<"restrictSize", import("./restrict/size").RestrictSizeOptions>;
    _defaults: import("./restrict/size").RestrictSizeOptions;
    _methods: {
        start: any;
        set: any;
        beforeEnd: any;
        stop: any;
    };
};
