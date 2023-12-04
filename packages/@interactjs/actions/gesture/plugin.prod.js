Object.defineProperty(exports,"__esModule",{value:!0}),exports.default=void 0;var e,t=(e=require("../../utils/is.prod.js"))&&e.__esModule?e:{default:e},s=((e,t)=>{if(e&&e.__esModule)return e;if(null===e||"object"!=typeof e&&"function"!=typeof e)return{default:e};var s=n(t);if(s&&s.has(e))return s.get(e);var r={__proto__:null},a=Object.defineProperty&&Object.getOwnPropertyDescriptor;for(var i in e)if("default"!==i&&Object.prototype.hasOwnProperty.call(e,i)){var o=a?Object.getOwnPropertyDescriptor(e,i):null;o&&(o.get||o.set)?Object.defineProperty(r,i,o):r[i]=e[i]}return r.default=e,s&&s.set(e,r),r})(require("../../utils/pointerUtils.prod.js"));function n(e){if("function"!=typeof WeakMap)return null;var t=new WeakMap,s=new WeakMap;return(n=e=>e?s:t)(e)}function r({interaction:e,iEvent:n,phase:r}){if("gesture"!==e.prepared.name)return;const a=e.pointers.map((e=>e.pointer)),i="start"===r,o="end"===r,c=e.interactable.options.deltaSource;if(n.touches=[a[0],a[1]],i)n.distance=s.touchDistance(a,c),n.box=s.touchBBox(a),n.scale=1,n.ds=0,n.angle=s.touchAngle(a,c),n.da=0,e.gesture.startDistance=n.distance,e.gesture.startAngle=n.angle;else if(o||e.pointers.length<2){const t=e.prevEvent;n.distance=t.distance,n.box=t.box,n.scale=t.scale,n.ds=0,n.angle=t.angle,n.da=0}else n.distance=s.touchDistance(a,c),n.box=s.touchBBox(a),n.scale=n.distance/e.gesture.startDistance,n.angle=s.touchAngle(a,c),n.ds=n.scale-e.gesture.scale,n.da=n.angle-e.gesture.angle;e.gesture.distance=n.distance,e.gesture.angle=n.angle,t.default.number(n.scale)&&n.scale!==1/0&&!isNaN(n.scale)&&(e.gesture.scale=n.scale)}const a={id:"actions/gesture",before:["actions/drag","actions/resize"],install(e){const{actions:s,Interactable:n,defaults:r}=e;n.prototype.gesturable=function(e){return t.default.object(e)?(this.options.gesture.enabled=!1!==e.enabled,this.setPerAction("gesture",e),this.setOnEvents("gesture",e),this):t.default.bool(e)?(this.options.gesture.enabled=e,this):this.options.gesture},s.map.gesture=a,s.methodDict.gesture="gesturable",r.actions.gesture=a.defaults},listeners:{"interactions:action-start":r,"interactions:action-move":r,"interactions:action-end":r,"interactions:new"({interaction:e}){e.gesture={angle:0,distance:0,scale:1,startAngle:0,startDistance:0}},"auto-start:check"(e){if(e.interaction.pointers.length<2)return;const t=e.interactable.options.gesture;return t&&t.enabled?(e.action={name:"gesture"},!1):void 0}},defaults:{},getCursor(){return""},filterEventType:e=>0===e.search("gesture")};exports.default=a;
//# sourceMappingURL=plugin.prod.js.map