import{window as n}from"./window";export function warnOnce(e,o){let t=!1;return function(){return t||(n.console.warn(o),t=!0),e.apply(this,arguments)}}export function copyAction(n,e){return n.name=e.name,n.axis=e.axis,n.edges=e.edges,n}export const sign=n=>n>=0?1:-1;
//# sourceMappingURL=misc.prod.js.map