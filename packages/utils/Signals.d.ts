declare type SignalListener = (signalArg: any, sinalName: string) => (void | boolean);
declare class Signals {
    listeners: {
        [signalName: string]: SignalListener[];
    };
    on(name: string, listener: SignalListener): void;
    off(name: string, listener: SignalListener): void;
    fire(name: string, arg: any): void | false;
}
export default Signals;
