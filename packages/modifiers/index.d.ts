export declare const snap: {
    (_options?: Partial<import("./snap/pointer").SnapOptions>): import("./base").Modifier<import("./snap/pointer").SnapOptions, "snap">;
    _defaults: import("./snap/pointer").SnapOptions;
    _methods: {
        start: any;
        set: any;
        beforeEnd: any;
        stop: any;
    };
};
export declare const snapSize: {
    (_options?: Partial<Pick<import("./snap/pointer").SnapOptions, "enabled" | "offset" | "endOnly" | "targets" | "range">>): import("./base").Modifier<Pick<import("./snap/pointer").SnapOptions, "enabled" | "offset" | "endOnly" | "targets" | "range">, "snapSize">;
    _defaults: Pick<import("./snap/pointer").SnapOptions, "enabled" | "offset" | "endOnly" | "targets" | "range">;
    _methods: {
        start: any;
        set: any;
        beforeEnd: any;
        stop: any;
    };
};
export declare const snapEdges: {
    (_options?: Partial<Pick<import("./snap/pointer").SnapOptions, "enabled" | "offset" | "endOnly" | "targets" | "range">>): import("./base").Modifier<Pick<import("./snap/pointer").SnapOptions, "enabled" | "offset" | "endOnly" | "targets" | "range">, "snapEdges">;
    _defaults: Pick<import("./snap/pointer").SnapOptions, "enabled" | "offset" | "endOnly" | "targets" | "range">;
    _methods: {
        start: any;
        set: any;
        beforeEnd: any;
        stop: any;
    };
};
export declare const restrict: {
    (_options?: Partial<import("./restrict/pointer").RestrictOptions>): import("./base").Modifier<import("./restrict/pointer").RestrictOptions, "restrict">;
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
    }>): import("./base").Modifier<import("./restrict/pointer").RestrictOptions & {
        elementRect: {
            top: number;
            left: number;
            bottom: number;
            right: number;
        };
    }, "restrictRect">;
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
    (_options?: Partial<import("./restrict/edges").RestrictEdgesOptions>): import("./base").Modifier<import("./restrict/edges").RestrictEdgesOptions, "restrictEdges">;
    _defaults: import("./restrict/edges").RestrictEdgesOptions;
    _methods: {
        start: any;
        set: any;
        beforeEnd: any;
        stop: any;
    };
};
export declare const restrictSize: {
    (_options?: Partial<import("./restrict/size").RestrictSizeOptions>): import("./base").Modifier<import("./restrict/size").RestrictSizeOptions, "restrictSize">;
    _defaults: import("./restrict/size").RestrictSizeOptions;
    _methods: {
        start: any;
        set: any;
        beforeEnd: any;
        stop: any;
    };
};
