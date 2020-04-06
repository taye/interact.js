import visualizer from './visualizer';
declare module '@interactjs/core/scope' {
    interface Scope {
        logger: Logger;
    }
}
declare module '@interactjs/core/InteractStatic' {
    interface InteractStatic {
        visializer: typeof visualizer;
    }
}
declare module '@interactjs/core/defaultOptions' {
    interface BaseDefaults {
        devTools?: DevToolsOptions;
    }
}
declare module '@interactjs/core/Interactable' {
    interface Interactable {
        devTools?: Interact.OptionMethod<DevToolsOptions>;
    }
}
export interface DevToolsOptions {
    ignore: {
        [P in keyof typeof CheckName]?: boolean;
    };
}
export interface Logger {
    warn: (...args: any[]) => void;
    error: (...args: any[]) => void;
    log: (...args: any[]) => void;
}
export interface Check {
    name: CheckName;
    text: string;
    perform: (interaction: Interact.Interaction) => boolean;
    getInfo: (interaction: Interact.Interaction) => any[];
}
declare enum CheckName {
    touchAction = "touchAction",
    boxSizing = "boxSizing",
    noListeners = "noListeners"
}
declare const defaultExport: Interact.Plugin;
export default defaultExport;
