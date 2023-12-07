declare const _default: {
    window: (thing: any) => thing is Window;
    docFrag: (thing: any) => thing is DocumentFragment;
    object: (thing: any) => thing is {
        [index: string]: any;
    };
    func: (thing: any) => thing is (...args: any[]) => any;
    number: (thing: any) => thing is number;
    bool: (thing: any) => thing is boolean;
    string: (thing: any) => thing is string;
    element: (thing: any) => thing is HTMLElement | SVGElement;
    plainObject: (thing: any) => thing is {
        [index: string]: any;
    };
    array: <T extends unknown>(thing: any) => thing is T[];
};
export default _default;
