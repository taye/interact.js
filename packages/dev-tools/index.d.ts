declare module '@interactjs/core/scope' {
    interface Scope {
        logger: Logger;
    }
}
export interface Logger {
    warn: (...args: any[]) => void;
    error: (...args: any[]) => void;
    log: (...args: any[]) => void;
}
export declare const links: {
    touchAction: string;
    boxSizing: string;
};
export declare const install: (scope: import("@interactjs/core/scope").Scope, { logger }?: {
    logger?: Logger;
}) => void;
export declare const touchActionMessage = "[interact.js] Consider adding CSS \"touch-action: none\" to this element\n";
export declare const boxSizingMessage = "[interact.js] Consider adding CSS \"box-sizing: border-box\" to this resizable element";
export declare const noListenersMessage = "[interact.js] There are no listeners set for this action";
export declare function touchAction({ element }: Interact.Interaction, logger: Logger): void;
export declare function boxSizing(interaction: Interact.Interaction, logger: Logger): void;
export declare function noListeners(interaction: Interact.Interaction, logger: Logger): void;
declare const _default: {
    id: string;
    install: (scope: import("@interactjs/core/scope").Scope, { logger }?: {
        logger?: Logger;
    }) => void;
};
export default _default;
