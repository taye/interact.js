/* interact.js 1.10.27 | https://raw.github.com/taye/interact.js/main/LICENSE */

let request,cancel,lastTime=0;function init(e){if(request=e.requestAnimationFrame,cancel=e.cancelAnimationFrame,!request){const t=["ms","moz","webkit","o"];for(const n of t)request=e[n+"RequestAnimationFrame"],cancel=e[n+"CancelAnimationFrame"]||e[n+"CancelRequestAnimationFrame"]}request=request&&request.bind(e),cancel=cancel&&cancel.bind(e),request||(request=t=>{const n=Date.now(),a=Math.max(0,16-(n-lastTime)),r=e.setTimeout((()=>{t(n+a)}),a);return lastTime=n+a,r},cancel=e=>clearTimeout(e))}var raf={request(e){return request(e)},cancel(e){return cancel(e)},init:init};export{raf as default};
//# sourceMappingURL=raf.prod.js.map
