import type { Plugin } from '@interactjs/core/scope';
import './all';
import './base';
import all from './all';
declare module '@interactjs/core/InteractStatic' {
    interface InteractStatic {
        modifiers: typeof all;
    }
}
declare const modifiers: Plugin;
export default modifiers;
