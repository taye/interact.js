import type { Scope } from '@interactjs/core/scope';
type PreventDefaultValue = 'always' | 'never' | 'auto';
declare module '@interactjs/core/Interactable' {
    interface Interactable {
        preventDefault(newValue: PreventDefaultValue): this;
        preventDefault(): PreventDefaultValue;
        /**
         * Returns or sets whether to prevent the browser's default behaviour in
         * response to pointer events. Can be set to:
         *  - `'always'` to always prevent
         *  - `'never'` to never prevent
         *  - `'auto'` to let interact.js try to determine what would be best
         *
         * @param newValue - `'always'`, `'never'` or `'auto'`
         * @returns The current setting or this Interactable
         */
        preventDefault(newValue?: PreventDefaultValue): PreventDefaultValue | this;
        checkAndPreventDefault(event: Event): void;
    }
}
export declare function install(scope: Scope): void;
declare const _default: {
    id: string;
    install: typeof install;
    listeners: any;
};
export default _default;
