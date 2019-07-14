import { SnapOptions } from './pointer';
export declare type SnapSizeOptions = Pick<SnapOptions, 'targets' | 'offset' | 'endOnly' | 'enabled' | 'range'>;
declare function start(arg: any): any;
declare function set(arg: any): void;
declare const snapSize: {
    start: typeof start;
    set: typeof set;
    defaults: Pick<SnapOptions, "enabled" | "offset" | "endOnly" | "targets" | "range">;
};
export default snapSize;
