declare function start(arg: Interact.SignalArg): void;
declare function set(arg: Interact.SignalArg): void;
declare const snap: {
    start: typeof start;
    set: typeof set;
    defaults: {
        enabled: boolean;
        range: number;
        targets: any;
        offset: any;
        offsetWithOrigin: boolean;
        relativePoints: any;
    };
};
export default snap;
