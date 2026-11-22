import type { Plugin } from '@interactjs/core/scope';
import './base';
declare module '@interactjs/core/options' {
    interface PerActionDefaults {
        hold?: number;
        delay?: number;
    }
}
declare module '@interactjs/core/Interaction' {
    interface Interaction {
        autoStartHoldTimer?: any;
    }
}
declare const hold: Plugin;
export default hold;
