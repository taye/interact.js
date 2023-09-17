import { Scope } from "../core/scope.js";
const scope = new Scope();
const interact = scope.interactStatic;
export default interact;

const _global = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : this;

scope.init(_global);
//# sourceMappingURL=index.js.map