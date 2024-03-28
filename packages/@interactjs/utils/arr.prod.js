/* interact.js 1.10.27 | https://raw.github.com/taye/interact.js/main/LICENSE */

const contains=(e,n)=>-1!==e.indexOf(n),remove=(e,n)=>e.splice(e.indexOf(n),1),merge=(e,n)=>{for(const r of n)e.push(r);return e},from=e=>merge([],e),findIndex=(e,n)=>{for(let r=0;r<e.length;r++)if(n(e[r],r,e))return r;return-1},find=(e,n)=>e[findIndex(e,n)];export{contains,find,findIndex,from,merge,remove};
//# sourceMappingURL=arr.prod.js.map
