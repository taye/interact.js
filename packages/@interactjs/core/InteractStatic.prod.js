/* interact.js 1.10.26 | https://raw.github.com/taye/interact.js/main/LICENSE */

import browser from"../utils/browser.prod.js";import*as domUtils from"../utils/domUtils.prod.js";import is from"../utils/is.prod.js";import isNonNativeEvent from"../utils/isNonNativeEvent.prod.js";import{warnOnce}from"../utils/misc.prod.js";import*as pointerUtils from"../utils/pointerUtils.prod.js";function createInteractStatic(t){const e=(s,o)=>{let i=t.interactables.getExisting(s,o);return i||(i=t.interactables.new(s,o),i.events.global=e.globalEvents),i};return e.getPointerAverage=pointerUtils.pointerAverage,e.getTouchBBox=pointerUtils.touchBBox,e.getTouchDistance=pointerUtils.touchDistance,e.getTouchAngle=pointerUtils.touchAngle,e.getElementRect=domUtils.getElementRect,e.getElementClientRect=domUtils.getElementClientRect,e.matchesSelector=domUtils.matchesSelector,e.closest=domUtils.closest,e.globalEvents={},e.version="1.10.26",e.scope=t,e.use=function(t,e){return this.scope.usePlugin(t,e),this},e.isSet=function(t,e){return!!this.scope.interactables.get(t,e&&e.context)},e.on=warnOnce((function(t,e,s){if(is.string(t)&&-1!==t.search(" ")&&(t=t.trim().split(/ +/)),is.array(t)){for(const o of t)this.on(o,e,s);return this}if(is.object(t)){for(const s in t)this.on(s,t[s],e);return this}return isNonNativeEvent(t,this.scope.actions)?this.globalEvents[t]?this.globalEvents[t].push(e):this.globalEvents[t]=[e]:this.scope.events.add(this.scope.document,t,e,{options:s}),this}),"The interact.on() method is being deprecated"),e.off=warnOnce((function(t,e,s){if(is.string(t)&&-1!==t.search(" ")&&(t=t.trim().split(/ +/)),is.array(t)){for(const o of t)this.off(o,e,s);return this}if(is.object(t)){for(const s in t)this.off(s,t[s],e);return this}if(isNonNativeEvent(t,this.scope.actions)){let s;t in this.globalEvents&&-1!==(s=this.globalEvents[t].indexOf(e))&&this.globalEvents[t].splice(s,1)}else this.scope.events.remove(this.scope.document,t,e,s);return this}),"The interact.off() method is being deprecated"),e.debug=function(){return this.scope},e.supportsTouch=function(){return browser.supportsTouch},e.supportsPointerEvent=function(){return browser.supportsPointerEvent},e.stop=function(){for(const t of this.scope.interactions.list)t.stop();return this},e.pointerMoveTolerance=function(t){return is.number(t)?(this.scope.interactions.pointerMoveTolerance=t,this):this.scope.interactions.pointerMoveTolerance},e.addDocument=function(t,e){this.scope.addDocument(t,e)},e.removeDocument=function(t){this.scope.removeDocument(t)},e}export{createInteractStatic};
//# sourceMappingURL=InteractStatic.prod.js.map
