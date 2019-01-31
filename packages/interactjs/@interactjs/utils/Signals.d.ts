declare class Signals {
    listeners: {};
    constructor();
    on(name: any, listener: any): void;
    off(name: any, listener: any): void;
    fire(name: any, arg: any): void | false;
}
export default Signals;
