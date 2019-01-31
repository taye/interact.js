declare class Eventable {
    options: any;
    types: {};
    propagationStopped: boolean;
    immediatePropagationStopped: boolean;
    global: any;
    constructor(options?: {
        [index: string]: any;
    });
    fire(event: any): void;
    on(type: any, listener: any): void;
    off(type: any, listener: any): void;
}
export default Eventable;
