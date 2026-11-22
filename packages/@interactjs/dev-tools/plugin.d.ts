import type Interaction from '@interactjs/core/Interaction';
import type { Plugin } from '@interactjs/core/scope';
import type { OptionMethod } from '@interactjs/core/types';
declare module '@interactjs/core/scope' {
    interface Scope {
        logger: Logger;
    }
}
declare module '@interactjs/core/options' {
    interface BaseDefaults {
        devTools?: DevToolsOptions;
    }
}
declare module '@interactjs/core/Interactable' {
    interface Interactable {
        devTools: OptionMethod<DevToolsOptions>;
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
    perform: (interaction: Interaction) => boolean;
    getInfo: (interaction: Interaction) => any[];
}
declare enum CheckName {
    touchAction = "touchAction",
    boxSizing = "boxSizing",
    noListeners = "noListeners"
}
declare const defaultExport: Plugin;
export default defaultExport;
