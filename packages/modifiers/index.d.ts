export declare const snap: {
    (_options?: Partial<{
        enabled: boolean;
        range: number;
        targets: any;
        offset: any;
        offsetWithOrigin: boolean;
        relativePoints: any;
    }>): import("./base").Modifier<"snap", {
        enabled: boolean;
        range: number;
        targets: any;
        offset: any;
        offsetWithOrigin: boolean;
        relativePoints: any;
    }>;
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
    (_options?: Partial<{
        enabled: boolean;
        range: number;
        targets: any;
        offset: any;
    }>): import("./base").Modifier<"snapSize", {
        enabled: boolean;
        range: number;
        targets: any;
        offset: any;
    }>;
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
    (_options?: Partial<{
        offset: {
            x: number;
            y: number;
        };
    } & Partial<{
        enabled: boolean;
        range: number;
        targets: any;
        offset: any;
    }>>): import("./base").Modifier<"snapEdges", {
        offset: {
            x: number;
            y: number;
        };
    } & Partial<{
        enabled: boolean;
        range: number;
        targets: any;
        offset: any;
    }>>;
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
    (_options?: Partial<import("../types/types").RestrictOptions>): import("./base").Modifier<"restrict", import("../types/types").RestrictOptions>;
    _defaults: import("../types/types").RestrictOptions;
    _methods: {
        start: any;
        set: any;
        beforeEnd: any;
        stop: any;
    };
};
export declare const restrictRect: {
    (_options?: Partial<import("../types/types").RestrictOptions & {
        elementRect: {
            top: number;
            left: number;
            bottom: number;
            right: number;
        };
    }>): import("./base").Modifier<"restrictRect", import("../types/types").RestrictOptions & {
        elementRect: {
            top: number;
            left: number;
            bottom: number;
            right: number;
        };
    }>;
    _defaults: import("../types/types").RestrictOptions & {
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
    (_options?: Partial<{
        enabled: boolean;
        inner: any;
        outer: any;
        offset: any;
    }>): import("./base").Modifier<"restrictEdges", {
        enabled: boolean;
        inner: any;
        outer: any;
        offset: any;
    }>;
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
    (_options?: Partial<{
        enabled: boolean;
        min: any;
        max: any;
    }>): import("./base").Modifier<"restrictSize", {
        enabled: boolean;
        min: any;
        max: any;
    }>;
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
