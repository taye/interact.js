declare module '@interactjs/core/Interaction' {
    interface Interaction {
        offsetBy?: typeof offsetBy;
        offset: {
            total: Interact.Point;
            pending: Interact.Point;
        };
    }
    enum _ProxyMethods {
        offsetBy = ""
    }
}
export declare function addTotal(interaction: Interact.Interaction): void;
export declare function applyPending(interaction: Interact.Interaction): boolean;
declare function offsetBy(this: Interact.Interaction, { x, y }: Interact.Point): void;
declare const offset: Interact.Plugin;
export default offset;
