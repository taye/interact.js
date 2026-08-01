import type Interaction from '@interactjs/core/Interaction';
import type { Plugin } from '@interactjs/core/scope';
import type { Point } from '@interactjs/core/types';
declare module '@interactjs/core/Interaction' {
    interface Interaction {
        offsetBy?: typeof offsetBy;
        offset: {
            total: Point;
            pending: Point;
        };
    }
    enum _ProxyMethods {
        offsetBy = ""
    }
}
export declare function addTotal(interaction: Interaction): void;
export declare function applyPending(interaction: Interaction): boolean;
declare function offsetBy(this: Interaction, { x, y }: Point): void;
declare const offset: Plugin;
export default offset;
