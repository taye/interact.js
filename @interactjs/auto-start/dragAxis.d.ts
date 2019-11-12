declare function beforeStart({ interaction, eventTarget, dx, dy }: Interact.SignalArgs['interactions:move'], scope: Interact.Scope): void;
declare const _default: {
    id: string;
    listeners: {
        'autoStart:before-start': typeof beforeStart;
    };
};
export default _default;
