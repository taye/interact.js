import*as t from"../utils/arr.prod.js";import o from"../utils/extend.prod.js";import e from"../utils/normalizeListeners.prod.js";function s(t,o){for(const e of o){if(t.immediatePropagationStopped)break;e(t)}}export class Eventable{options;types={};propagationStopped=!1;immediatePropagationStopped=!1;global;constructor(t){this.options=o({},t||{})}fire(t){let o;const e=this.global;(o=this.types[t.type])&&s(t,o),!t.propagationStopped&&e&&(o=e[t.type])&&s(t,o)}on(o,s){const i=e(o,s);for(o in i)this.types[o]=t.merge(this.types[o]||[],i[o])}off(t,o){const s=e(t,o);for(t in s){const o=this.types[t];if(o&&o.length)for(const e of s[t]){const t=o.indexOf(e);-1!==t&&o.splice(t,1)}}}getRect(t){return null}}
//# sourceMappingURL=Eventable.prod.js.map