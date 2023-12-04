Object.defineProperty(exports,"__esModule",{value:!0}),exports.coordsToEvent=function(e){return{coords:e,get page(){return this.coords.page},get client(){return this.coords.client},get timeStamp(){return this.coords.timeStamp},get pageX(){return this.coords.page.x},get pageY(){return this.coords.page.y},get clientX(){return this.coords.client.x},get clientY(){return this.coords.client.y},get pointerId(){return this.coords.pointerId},get target(){return this.coords.target},get type(){return this.coords.type},get pointerType(){return this.coords.pointerType},get buttons(){return this.coords.buttons},preventDefault(){}}},exports.copyCoords=(e,t)=>{e.page=e.page||{},e.page.x=t.page.x,e.page.y=t.page.y,e.client=e.client||{},e.client.x=t.client.x,e.client.y=t.client.y,e.timeStamp=t.timeStamp},exports.getClientXY=l,exports.getEventTargets=e=>{const t=n.default.func(e.composedPath)?e.composedPath():e.path;return[r.getActualElement(t?t[0]:e.target),r.getActualElement(e.currentTarget)]},exports.getPageXY=u,exports.getPointerId=e=>n.default.number(e.pointerId)?e.pointerId:e.identifier,exports.getPointerType=e=>n.default.string(e.pointerType)?e.pointerType:n.default.number(e.pointerType)?[void 0,void 0,"touch","pen","mouse"][e.pointerType]:/touch/.test(e.type||"")||e instanceof t.default.Touch?"touch":"mouse",exports.getTouchPair=g,exports.getXY=s,exports.isNativePointer=c,exports.newCoords=()=>({page:{x:0,y:0},client:{x:0,y:0},timeStamp:0}),exports.pointerAverage=d,Object.defineProperty(exports,"pointerExtend",{enumerable:!0,get:()=>i.default}),exports.setCoordDeltas=(e,t,r)=>{e.page.x=r.page.x-t.page.x,e.page.y=r.page.y-t.page.y,e.client.x=r.client.x-t.client.x,e.client.y=r.client.y-t.client.y,e.timeStamp=r.timeStamp-t.timeStamp},exports.setCoordVelocity=(e,t)=>{const r=Math.max(t.timeStamp/1e3,.001);e.page.x=t.page.x/r,e.page.y=t.page.y/r,e.client.x=t.client.x/r,e.client.y=t.client.y/r,e.timeStamp=r},exports.setCoords=(e,t,r)=>{const o=t.length>1?d(t):t[0];u(o,e.page),l(o,e.client),e.timeStamp=r},exports.setZeroCoords=e=>{e.page.x=0,e.page.y=0,e.client.x=0,e.client.y=0},exports.touchAngle=(e,t)=>{const r=t+"X",o=t+"Y",n=g(e),i=n[1][r]-n[0][r],p=n[1][o]-n[0][o];return 180*Math.atan2(p,i)/Math.PI},exports.touchBBox=e=>{if(!e.length)return null;const t=g(e),r=Math.min(t[0].pageX,t[1].pageX),o=Math.min(t[0].pageY,t[1].pageY),n=Math.max(t[0].pageX,t[1].pageX),i=Math.max(t[0].pageY,t[1].pageY);return{x:r,y:o,left:r,top:o,right:n,bottom:i,width:n-r,height:i-o}},exports.touchDistance=(e,t)=>{const r=t+"X",n=t+"Y",i=g(e),p=i[0][r]-i[1][r],a=i[0][n]-i[1][n];return(0,o.default)(p,a)};var e=a(require("./browser")),t=a(require("./domObjects")),r=((e,t)=>{if(e&&e.__esModule)return e;if(null===e||"object"!=typeof e&&"function"!=typeof e)return{default:e};var r=p(t);if(r&&r.has(e))return r.get(e);var o={__proto__:null},n=Object.defineProperty&&Object.getOwnPropertyDescriptor;for(var i in e)if("default"!==i&&Object.prototype.hasOwnProperty.call(e,i)){var a=n?Object.getOwnPropertyDescriptor(e,i):null;a&&(a.get||a.set)?Object.defineProperty(o,i,a):o[i]=e[i]}return o.default=e,r&&r.set(e,o),o})(require("./domUtils")),o=a(require("./hypot")),n=a(require("./is")),i=a(require("./pointerExtend"));function p(e){if("function"!=typeof WeakMap)return null;var t=new WeakMap,r=new WeakMap;return(p=e=>e?r:t)(e)}function a(e){return e&&e.__esModule?e:{default:e}}function c(e){return e instanceof t.default.Event||e instanceof t.default.Touch}function s(e,t,r){return e=e||"page",(r=r||{}).x=t[e+"X"],r.y=t[e+"Y"],r}function u(t,r){return r=r||{x:0,y:0},e.default.isOperaMobile&&c(t)?(s("screen",t,r),r.x+=window.scrollX,r.y+=window.scrollY):s("page",t,r),r}function l(t,r){return r=r||{},e.default.isOperaMobile&&c(t)?s("screen",t,r):s("client",t,r),r}function g(e){const t=[];return n.default.array(e)?(t[0]=e[0],t[1]=e[1]):"touchend"===e.type?1===e.touches.length?(t[0]=e.touches[0],t[1]=e.changedTouches[0]):0===e.touches.length&&(t[0]=e.changedTouches[0],t[1]=e.changedTouches[1]):(t[0]=e.touches[0],t[1]=e.touches[1]),t}function d(e){const t={pageX:0,pageY:0,clientX:0,clientY:0,screenX:0,screenY:0};for(const r of e)for(const e in t)t[e]+=r[e];for(const r in t)t[r]/=e.length;return t}
//# sourceMappingURL=pointerUtils.prod.js.map