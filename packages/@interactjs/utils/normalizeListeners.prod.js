import r from"./is";export default function t(o,e,i=(r=>!0),n){if(n=n||{},r.string(o)&&-1!==o.search(" ")&&(o=f(o)),r.array(o))return o.forEach((r=>t(r,e,i,n))),n;if(r.object(o)&&(e=o,o=""),r.func(e)&&i(o))n[o]=n[o]||[],n[o].push(e);else if(r.array(e))for(const r of e)t(o,r,i,n);else if(r.object(e))for(const r in e)t(f(r).map((r=>`${o}${r}`)),e[r],i,n);return n}function f(r){return r.trim().split(/ +/)}
//# sourceMappingURL=normalizeListeners.prod.js.map