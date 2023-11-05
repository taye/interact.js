import type { Scope } from '@interactjs/core/scope';
import './drag/plugin';
import './drop/plugin';
import './gesture/plugin';
import './resize/plugin';
declare const _default: {
    id: string;
    install(scope: Scope): void;
};
export default _default;
