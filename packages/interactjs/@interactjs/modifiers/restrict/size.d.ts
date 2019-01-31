declare function start(arg: any): void;
declare function set(arg: any): void;
declare const restrictSize: {
    start: typeof start;
    set: typeof set;
    defaults: {
        enabled: boolean;
        min: any;
        max: any;
    };
};
export default restrictSize;
