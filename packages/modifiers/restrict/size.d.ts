import { RestrictOptions } from './pointer';
export interface RestrictSizeOptions {
    min: Interact.Size | Interact.Point | RestrictOptions['restriction'];
    max: Interact.Size | Interact.Point | RestrictOptions['restriction'];
    endOnly: boolean;
    enabled: boolean;
}
declare function start(arg: any): void;
declare function set(arg: any): void;
declare const restrictSize: {
    start: typeof start;
    set: typeof set;
    defaults: RestrictSizeOptions;
};
export default restrictSize;
