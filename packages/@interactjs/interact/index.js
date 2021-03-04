import { Scope } from "../core/scope.js";
const scope = new Scope();
const interact = scope.interactStatic;
export default interact;
export const init = win => scope.init(win);

if (typeof window === 'object' && !!window) {
  init(window);
}
//# sourceMappingURL=index.js.map