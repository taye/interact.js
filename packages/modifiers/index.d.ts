export declare const snap: {
    (options?: Partial<{
        enabled: boolean;
        range: number;
        targets: any;
        offset: any;
        offsetWithOrigin: boolean;
        relativePoints: any;
    }>): import("./base").Modifier<"snap">;
    _defaults: {
        enabled: boolean;
        range: number;
        targets: any;
        offset: any;
        offsetWithOrigin: boolean;
        relativePoints: any;
    };
    _methods: {
        start: any;
        set: any;
        beforeEnd: any;
        stop: any;
    };
};
export declare const snapSize: {
    (options?: Partial<{
        enabled: boolean;
        range: number;
        targets: any;
        offset: any;
    }>): import("./base").Modifier<"snapSize">;
    _defaults: {
        enabled: boolean;
        range: number;
        targets: any;
        offset: any;
    };
    _methods: {
        start: any;
        set: any;
        beforeEnd: any;
        stop: any;
    };
};
export declare const snapEdges: {
    (options?: Partial<{
        offset: {
            x: number;
            y: number;
        };
    } & Partial<{
        enabled: boolean;
        range: number;
        targets: any;
        offset: any;
    }>>): import("./base").Modifier<"snapEdges">;
    _defaults: {
        offset: {
            x: number;
            y: number;
        };
    } & Partial<{
        enabled: boolean;
        range: number;
        targets: any;
        offset: any;
    }>;
    _methods: {
        start: any;
        set: any;
        beforeEnd: any;
        stop: any;
    };
};
export declare const restrict: {
    (options?: Partial<{
        enabled: boolean;
        restriction: any;
        elementRect: any;
    }>): import("./base").Modifier<"restrict">;
    _defaults: {
        enabled: boolean;
        restriction: any;
        elementRect: any;
    };
    _methods: {
        start: any;
        set: any;
        beforeEnd: any;
        stop: any;
    };
};
export declare const restrictEdges: {
    (options?: Partial<{
        enabled: boolean;
        inner: any;
        outer: any;
        offset: any;
    }>): import("./base").Modifier<"restrictEdges">;
    _defaults: {
        enabled: boolean;
        inner: any;
        outer: any;
        offset: any;
    };
    _methods: {
        start: any;
        set: any;
        beforeEnd: any;
        stop: any;
    };
};
export declare const restrictSize: {
    (options?: Partial<{
        enabled: boolean;
        min: any;
        max: any;
    }>): import("./base").Modifier<"restrictSize">;
    _defaults: {
        enabled: boolean;
        min: any;
        max: any;
    };
    _methods: {
        start: any;
        set: any;
        beforeEnd: any;
        stop: any;
    };
};
