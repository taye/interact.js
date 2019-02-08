export declare function unique(): number;
export declare function uniqueProps(obj: any): void;
export declare function newCoordsSet(n?: number): {
    start: {
        page: {
            x: number;
            y: number;
        };
        client: {
            x: number;
            y: number;
        };
        timeStamp: number;
    };
    cur: {
        page: {
            x: number;
            y: number;
        };
        client: {
            x: number;
            y: number;
        };
        timeStamp: number;
    };
    prev: {
        page: {
            x: number;
            y: number;
        };
        client: {
            x: number;
            y: number;
        };
        timeStamp: number;
    };
    delta: {
        page: {
            x: number;
            y: number;
        };
        client: {
            x: number;
            y: number;
        };
        timeStamp: number;
    };
    velocity: {
        page: {
            x: number;
            y: number;
        };
        client: {
            x: number;
            y: number;
        };
        timeStamp: number;
    };
};
export declare function newPointer(n?: number): import("../../types/types").PointerType;
export declare function mockScope(options?: any): any;
export declare function mockSignals(): any;
export declare function mockInteractable(props?: {}): any;
export declare function getProps(src: any, props: any): any;
