/**
 * interact.js 1.10.27
 *
 * Copyright (c) 2012-present Taye Adeyemi <dev@taye.me>
 * Released under the MIT License.
 * https://raw.github.com/taye/interact.js/main/LICENSE
 */

import interact from "../@interactjs/interactjs/index.js";
export { default } from "../@interactjs/interactjs/index.js";

// eslint-disable-next-line import/no-extraneous-dependencies
if (typeof module === 'object' && !!module) {
  try {
    module.exports = interact;
  } catch (_unused) {}
}
interact.default = interact;
//# sourceMappingURL=index.js.map
