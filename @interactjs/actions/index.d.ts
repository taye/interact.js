import drag from './drag';
import drop from './drop/index';
import gesture from './gesture';
import resize from './resize';
declare const _default: {
    id: string;
    install(scope: import("@interactjs/core/scope").default): void;
};
export default _default;
export { gesture, resize, drag, drop, };
