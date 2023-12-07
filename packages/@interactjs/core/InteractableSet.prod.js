/* interact.js 1.10.26 | https://raw.github.com/taye/interact.js/main/LICENSE */

import*as arr from"../utils/arr.prod.js";import*as domUtils from"../utils/domUtils.prod.js";import extend from"../utils/extend.prod.js";import is from"../utils/is.prod.js";class InteractableSet{constructor(t){this.list=[],this.selectorMap={},this.scope=void 0,this.scope=t,t.addListeners({"interactable:unset":t=>{let{interactable:e}=t;const{target:s}=e,i=is.string(s)?this.selectorMap[s]:s[this.scope.id],o=arr.findIndex(i,(t=>t===e));i.splice(o,1)}})}new(t,e){e=extend(e||{},{actions:this.scope.actions});const s=new this.scope.Interactable(t,e,this.scope.document,this.scope.events);return this.scope.addDocument(s._doc),this.list.push(s),is.string(t)?(this.selectorMap[t]||(this.selectorMap[t]=[]),this.selectorMap[t].push(s)):(s.target[this.scope.id]||Object.defineProperty(t,this.scope.id,{value:[],configurable:!0}),t[this.scope.id].push(s)),this.scope.fire("interactable:new",{target:t,options:e,interactable:s,win:this.scope._win}),s}getExisting(t,e){const s=e&&e.context||this.scope.document,i=is.string(t),o=i?this.selectorMap[t]:t[this.scope.id];if(o)return arr.find(o,(e=>e._context===s&&(i||e.inContext(t))))}forEachMatch(t,e){for(const s of this.list){let i;if((is.string(s.target)?is.element(t)&&domUtils.matchesSelector(t,s.target):t===s.target)&&s.inContext(t)&&(i=e(s)),void 0!==i)return i}}}export{InteractableSet};
//# sourceMappingURL=InteractableSet.prod.js.map
