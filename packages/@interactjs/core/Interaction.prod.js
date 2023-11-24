import*as t from"../utils/arr.prod.js";import e from"../utils/extend.prod.js";import i from"../utils/hypot.prod.js";import{warnOnce as n,copyAction as o}from"../utils/misc.prod.js";import*as r from"../utils/pointerUtils.prod.js";import*as s from"../utils/rect.prod.js";import{InteractEvent as p}from"./InteractEvent";import{PointerInfo as h}from"./PointerInfo";export let _ProxyValues;(t=>{t.interactable="",t.element="",t.prepared="",t.pointerIsDown="",t.pointerWasMoved="",t._proxy=""})(_ProxyValues||(_ProxyValues={}));export let _ProxyMethods;(t=>{t.start="",t.move="",t.end="",t.stop="",t.interacting=""})(_ProxyMethods||(_ProxyMethods={}));let a=0;export class Interaction{interactable=null;element=null;rect=null;_rects;edges=null;_scopeFire;prepared={name:null,axis:null,edges:null};pointerType;pointers=[];downEvent=null;downPointer={};_latestPointer={pointer:null,event:null,eventTarget:null};prevEvent=null;pointerIsDown=!1;pointerWasMoved=!1;_interacting=!1;_ending=!1;_stopped=!0;_proxy;simulation=null;get pointerMoveTolerance(){return 1}doMove=n((function(t){this.move(t)}),"The interaction.doMove() method has been renamed to interaction.move()");coords={start:r.newCoords(),prev:r.newCoords(),cur:r.newCoords(),delta:r.newCoords(),velocity:r.newCoords()};_id=a++;constructor({pointerType:t,scopeFire:e}){this._scopeFire=e,this.pointerType=t;const i=this;this._proxy={};for(const t in _ProxyValues)Object.defineProperty(this._proxy,t,{get(){return i[t]}});for(const t in _ProxyMethods)Object.defineProperty(this._proxy,t,{value:(...e)=>i[t](...e)});this._scopeFire("interactions:new",{interaction:this})}pointerDown(t,e,i){const n=this.updatePointer(t,e,i,!0),o=this.pointers[n];this._scopeFire("interactions:down",{pointer:t,event:e,eventTarget:i,pointerIndex:n,pointerInfo:o,type:"down",interaction:this})}start(t,i,n){return!(this.interacting()||!this.pointerIsDown||this.pointers.length<("gesture"===t.name?2:1)||!i.options[t.name].enabled)&&(o(this.prepared,t),this.interactable=i,this.element=n,this.rect=i.getRect(n),this.edges=this.prepared.edges?e({},this.prepared.edges):{left:!0,right:!0,top:!0,bottom:!0},this._stopped=!1,this._interacting=this._doPhase({interaction:this,event:this.downEvent,phase:"start"})&&!this._stopped,this._interacting)}pointerMove(t,e,n){this.simulation||this.modification&&this.modification.endResult||this.updatePointer(t,e,n,!1);const o=this.coords.cur.page.x===this.coords.prev.page.x&&this.coords.cur.page.y===this.coords.prev.page.y&&this.coords.cur.client.x===this.coords.prev.client.x&&this.coords.cur.client.y===this.coords.prev.client.y;let s,p;this.pointerIsDown&&!this.pointerWasMoved&&(s=this.coords.cur.client.x-this.coords.start.client.x,p=this.coords.cur.client.y-this.coords.start.client.y,this.pointerWasMoved=i(s,p)>this.pointerMoveTolerance);const h=this.getPointerIndex(t),a={pointer:t,pointerIndex:h,pointerInfo:this.pointers[h],event:e,type:"move",eventTarget:n,dx:s,dy:p,duplicate:o,interaction:this};o||r.setCoordVelocity(this.coords.velocity,this.coords.delta),this._scopeFire("interactions:move",a),o||this.simulation||(this.interacting()&&(a.type=null,this.move(a)),this.pointerWasMoved&&r.copyCoords(this.coords.prev,this.coords.cur))}move(t){t&&t.event||r.setZeroCoords(this.coords.delta),(t=e({pointer:this._latestPointer.pointer,event:this._latestPointer.event,eventTarget:this._latestPointer.eventTarget,interaction:this},t||{})).phase="move",this._doPhase(t)}pointerUp(t,e,i,n){let o=this.getPointerIndex(t);-1===o&&(o=this.updatePointer(t,e,i,!1));const r=/cancel$/i.test(e.type)?"cancel":"up";this._scopeFire("interactions:"+r,{pointer:t,pointerIndex:o,pointerInfo:this.pointers[o],event:e,eventTarget:i,type:r,curEventTarget:n,interaction:this}),this.simulation||this.end(e),this.removePointer(t,e)}documentBlur(t){this.end(t),this._scopeFire("interactions:blur",{event:t,type:"blur",interaction:this})}end(t){let e;this._ending=!0,t=t||this._latestPointer.event,this.interacting()&&(e=this._doPhase({event:t,interaction:this,phase:"end"})),this._ending=!1,!0===e&&this.stop()}currentAction(){return this._interacting?this.prepared.name:null}interacting(){return this._interacting}stop(){this._scopeFire("interactions:stop",{interaction:this}),this.interactable=this.element=null,this._interacting=!1,this._stopped=!0,this.prepared.name=this.prevEvent=null}getPointerIndex(e){const i=r.getPointerId(e);return"mouse"===this.pointerType||"pen"===this.pointerType?this.pointers.length-1:t.findIndex(this.pointers,(t=>t.id===i))}getPointerInfo(t){return this.pointers[this.getPointerIndex(t)]}updatePointer(t,e,i,n){const o=r.getPointerId(t);let s=this.getPointerIndex(t),p=this.pointers[s];return n=!1!==n&&(n||/(down|start)$/i.test(e.type)),p?p.pointer=t:(p=new h(o,t,e,null,null),s=this.pointers.length,this.pointers.push(p)),r.setCoords(this.coords.cur,this.pointers.map((t=>t.pointer)),this._now()),r.setCoordDeltas(this.coords.delta,this.coords.prev,this.coords.cur),n&&(this.pointerIsDown=!0,p.downTime=this.coords.cur.timeStamp,p.downTarget=i,r.pointerExtend(this.downPointer,t),this.interacting()||(r.copyCoords(this.coords.start,this.coords.cur),r.copyCoords(this.coords.prev,this.coords.cur),this.downEvent=e,this.pointerWasMoved=!1)),this._updateLatestPointer(t,e,i),this._scopeFire("interactions:update-pointer",{pointer:t,event:e,eventTarget:i,down:n,pointerInfo:p,pointerIndex:s,interaction:this}),s}removePointer(t,e){const i=this.getPointerIndex(t);if(-1===i)return;const n=this.pointers[i];this._scopeFire("interactions:remove-pointer",{pointer:t,event:e,eventTarget:null,pointerIndex:i,pointerInfo:n,interaction:this}),this.pointers.splice(i,1),this.pointerIsDown=!1}_updateLatestPointer(t,e,i){this._latestPointer.pointer=t,this._latestPointer.event=e,this._latestPointer.eventTarget=i}destroy(){this._latestPointer.pointer=null,this._latestPointer.event=null,this._latestPointer.eventTarget=null}_createPreparedEvent(t,e,i,n){return new p(this,t,this.prepared.name,e,this.element,i,n)}_fireEvent(t){var e;null==(e=this.interactable)||e.fire(t),(!this.prevEvent||t.timeStamp>=this.prevEvent.timeStamp)&&(this.prevEvent=t)}_doPhase(t){const{event:e,phase:i,preEnd:n,type:o}=t,{rect:r}=this;if(r&&"move"===i&&(s.addEdges(this.edges,r,this.coords.delta[this.interactable.options.deltaSource]),r.width=r.right-r.left,r.height=r.bottom-r.top),!1===this._scopeFire("interactions:before-action-"+i,t))return!1;const p=t.iEvent=this._createPreparedEvent(e,i,n,o);return this._scopeFire("interactions:action-"+i,t),"start"===i&&(this.prevEvent=p),this._fireEvent(p),this._scopeFire("interactions:after-action-"+i,t),!0}_now(){return Date.now()}}export default Interaction;export{h as PointerInfo};
//# sourceMappingURL=Interaction.prod.js.map