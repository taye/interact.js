/* interact.js 1.10.26 | https://raw.github.com/taye/interact.js/main/LICENSE */

const domObjects={init:init,document:null,DocumentFragment:null,SVGElement:null,SVGSVGElement:null,SVGElementInstance:null,Element:null,HTMLElement:null,Event:null,Touch:null,PointerEvent:null};function blank(){}function init(e){const n=e;domObjects.document=n.document,domObjects.DocumentFragment=n.DocumentFragment||blank,domObjects.SVGElement=n.SVGElement||blank,domObjects.SVGSVGElement=n.SVGSVGElement||blank,domObjects.SVGElementInstance=n.SVGElementInstance||blank,domObjects.Element=n.Element||blank,domObjects.HTMLElement=n.HTMLElement||domObjects.Element,domObjects.Event=n.Event,domObjects.Touch=n.Touch||blank,domObjects.PointerEvent=n.PointerEvent||n.MSPointerEvent}export{domObjects as default};
//# sourceMappingURL=domObjects.prod.js.map
