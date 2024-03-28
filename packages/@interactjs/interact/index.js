/**
 * interact.js 1.10.27
 *
 * Copyright (c) 2012-present Taye Adeyemi <dev@taye.me>
 * Released under the MIT License.
 * https://raw.github.com/taye/interact.js/main/LICENSE
 */

import { Scope } from "../core/scope.js";
const scope = new Scope();
const interact = scope.interactStatic;
const _global = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : window;
scope.init(_global);
export { interact as default };
//# sourceMappingURL=index.js.map
