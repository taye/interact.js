export declare const window: (thing: any) => thing is Window;
export declare const docFrag: (thing: any) => thing is DocumentFragment;
export declare const object: (thing: any) => thing is {
    [index: string]: any;
};
export declare const func: (thing: any) => thing is (...args: any) => any;
export declare const number: (thing: any) => thing is number;
export declare const bool: (thing: any) => thing is boolean;
export declare const string: (thing: any) => thing is string;
export declare const element: (thing: any) => thing is Element;
export declare const plainObject: typeof object;
export declare const array: (thing: any) => thing is any[];
