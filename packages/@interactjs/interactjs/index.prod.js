Object.defineProperty(exports,"__esModule",{value:!0}),exports.default=void 0;var e=o(require("../actions/plugin.prod.js")),u=o(require("../auto-scroll/plugin.prod.js")),r=o(require("../auto-start/plugin.prod.js")),t=o(require("../core/interactablePreventDefault.prod.js")),d=(o(require("../dev-tools/plugin.prod.js")),o(require("../inertia/plugin.prod.js"))),l=o(require("../interact/index.prod.js")),a=o(require("../modifiers/plugin.prod.js")),f=o(require("../offset/plugin.prod.js")),i=o(require("../pointer-events/plugin.prod.js")),s=o(require("../reflow/plugin.prod.js"));function o(e){return e&&e.__esModule?e:{default:e}}l.default.use(t.default),l.default.use(f.default),l.default.use(i.default),l.default.use(d.default),l.default.use(a.default),l.default.use(r.default),l.default.use(e.default),l.default.use(u.default),l.default.use(s.default),exports.default=l.default,l.default.default=l.default;
//# sourceMappingURL=index.prod.js.map