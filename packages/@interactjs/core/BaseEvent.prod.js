/* interact.js 1.10.27 | https://raw.github.com/taye/interact.js/main/LICENSE */

class BaseEvent{constructor(t){this.immediatePropagationStopped=!1,this.propagationStopped=!1,this._interaction=t}preventDefault(){}stopPropagation(){this.propagationStopped=!0}stopImmediatePropagation(){this.immediatePropagationStopped=this.propagationStopped=!0}}Object.defineProperty(BaseEvent.prototype,"interaction",{get(){return this._interaction._proxy},set(){}});export{BaseEvent};
//# sourceMappingURL=BaseEvent.prod.js.map
