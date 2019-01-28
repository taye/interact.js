declare function start(arg: any): any;
declare function set(arg: any): void;
declare const snapSize: {
    start: typeof start;
    set: typeof set;
    defaults: {
        enabled: boolean;
        range: number;
        targets: any;
        offset: any;
    };
};
export default snapSize;
