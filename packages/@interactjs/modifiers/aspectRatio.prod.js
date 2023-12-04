import t from"../utils/extend.prod.js";import{addEdges as e}from"../utils/rect.prod.js";import{makeModifier as o}from"./base";import{Modification as r}from"./Modification";const i={start(e){const{state:o,rect:i,edges:s,pageCoords:a}=e;let{ratio:n,enabled:d}=o.options;const{equalDelta:l,modifiers:c}=o.options;"preserve"===n&&(n=i.width/i.height),o.startCoords=t({},a),o.startRect=t({},i),o.ratio=n,o.equalDelta=l;const p=o.linkedEdges={top:s.top||s.left&&!s.bottom,left:s.left||s.top&&!s.right,bottom:s.bottom||s.right&&!s.top,right:s.right||s.bottom&&!s.left};if(o.xIsPrimaryAxis=!(!s.left&&!s.right),o.equalDelta){const t=(p.left?1:-1)*(p.top?1:-1);o.edgeSign={x:t,y:t}}else o.edgeSign={x:p.left?-1:1,y:p.top?-1:1};if(!1!==d&&t(s,p),null==c||!c.length)return;const f=new r(e.interaction);f.copyFrom(e.interaction.modification),f.prepareStates(c),o.subModification=f,f.startAll({...e})},set(o){const{state:r,rect:i,coords:n}=o,{linkedEdges:d}=r,l=t({},n),c=r.equalDelta?s:a;if(t(o.edges,d),c(r,r.xIsPrimaryAxis,n,i),!r.subModification)return null;const p=t({},i);e(d,p,{x:n.x-l.x,y:n.y-l.y});const f=r.subModification.setAll({...o,rect:p,edges:d,pageCoords:n,prevCoords:n,prevRect:p}),{delta:g}=f;return f.changed&&(c(r,Math.abs(g.x)>Math.abs(g.y),f.coords,f.rect),t(n,f.coords)),f.eventProps},defaults:{ratio:"preserve",equalDelta:!1,modifiers:[],enabled:!1}};function s({startCoords:t,edgeSign:e},o,r){o?r.y=t.y+(r.x-t.x)*e.y:r.x=t.x+(r.y-t.y)*e.x}function a({startRect:t,startCoords:e,ratio:o,edgeSign:r},i,s,a){if(i){const i=a.width/o;s.y=e.y+(i-t.height)*r.y}else{const i=a.height*o;s.x=e.x+(i-t.width)*r.x}}export default o(i,"aspectRatio");export{i as aspectRatio};
//# sourceMappingURL=aspectRatio.prod.js.map