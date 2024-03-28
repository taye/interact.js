/* interact.js 1.10.27 | https://raw.github.com/taye/interact.js/main/LICENSE */

var grid=t=>{const r=[["x","y"],["left","top"],["right","bottom"],["width","height"]].filter((r=>{let[o,i]=r;return o in t||i in t})),o=(o,i)=>{const{range:n,limits:e={left:-1/0,right:1/0,top:-1/0,bottom:1/0},offset:a={x:0,y:0}}=t,h={range:n,grid:t,x:null,y:null};for(const[n,l]of r){const r=Math.round((o-a.x)/t[n]),d=Math.round((i-a.y)/t[l]);h[n]=Math.max(e.left,Math.min(e.right,r*t[n]+a.x)),h[l]=Math.max(e.top,Math.min(e.bottom,d*t[l]+a.y))}return h};return o.grid=t,o.coordFields=r,o};export{grid as default};
//# sourceMappingURL=grid.prod.js.map
