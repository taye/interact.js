import interact, { init as initInteract } from '@interactjs/interact';
import * as modifiers from '@interactjs/modifiers';
import extend from '@interactjs/utils/extend';
import * as snappers from '@interactjs/utils/snappers';
if (typeof window === 'object' && !!window) {
    init(window);
}
export function init(win) {
    initInteract(win);
    return interact.use({
        install(scope) {
            interact.modifiers = extend(scope.modifiers, modifiers);
            interact.snappers = snappers;
            interact.createSnapGrid = interact.snappers.grid;
        },
    });
}
export default interact;
if (typeof module === 'object' && !!module) {
    module.exports = interact;
}
//# sourceMappingURL=index.js.map