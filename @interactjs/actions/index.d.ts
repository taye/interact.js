import { Scope } from '@interactjs/core/scope';
import drag from './drag';
import drop from './drop/index';
import gesture from './gesture';
import resize from './resize';
declare const _default: {
    id: string;
    install(scope: Scope): void;
};
export default _default;
export { gesture, resize, drag, drop, };
