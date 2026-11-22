import type { SignalArgs, Scope } from '@interactjs/core/scope';
declare function beforeStart({ interaction, eventTarget, dx, dy }: SignalArgs['interactions:move'], scope: Scope): void;
declare const _default: {
    id: string;
    listeners: {
        'autoStart:before-start': typeof beforeStart;
    };
};
export default _default;
