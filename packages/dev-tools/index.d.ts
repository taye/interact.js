declare module '@interactjs/core/scope' {
    interface Scope {
        logger: Logger;
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
    name: string;
    text: string;
    perform: (interaction: Interact.Interaction) => boolean;
    getInfo: (interaction: Interact.Interaction) => any[];
}
declare enum CheckName {
    touchAction = "",
    boxSizing = "",
    noListeners = ""
}
declare function install(scope: Interact.Scope, { logger }?: {
    logger?: Logger;
}): void;
declare const defaultExport: {
    id: string;
    install: () => void;
    checks?: undefined;
    CheckName?: undefined;
    links?: undefined;
    prefix?: undefined;
} | {
    id: string;
    install: typeof install;
    checks: Check[];
    CheckName: typeof CheckName;
    links: {
        touchAction: string;
        boxSizing: string;
    };
    prefix: string;
};
export default defaultExport;
