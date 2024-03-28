/* interact.js 1.10.27 | https://raw.github.com/taye/interact.js/main/LICENSE */

function isNonNativeEvent(e,n){if(n.phaselessTypes[e])return!0;for(const t in n.map)if(0===e.indexOf(t)&&e.substr(t.length)in n.phases)return!0;return!1}export{isNonNativeEvent as default};
//# sourceMappingURL=isNonNativeEvent.prod.js.map
