declare type Listener = (event: any) => any;
declare class Eventable {
    options: any;
    types: {
        [type: string]: Listener[];
    };
    propagationStopped: boolean;
    immediatePropagationStopped: boolean;
    global: any;
    constructor(options?: {
        [index: string]: any;
    });
    fire(event: any): void;
    on(type: string, listener: Listener): void;
    off(type: string, listener: Listener): void;
}
export default Eventable;
