/* interact.js 1.10.27 | https://raw.github.com/taye/interact.js/main/LICENSE */

const VENDOR_PREFIXES=["webkit","moz"];function pointerExtend(e,t){e.__set||(e.__set={});for(const n in t)VENDOR_PREFIXES.some((e=>0===n.indexOf(e)))||"function"!=typeof e[n]&&"__set"!==n&&Object.defineProperty(e,n,{get:()=>n in e.__set?e.__set[n]:e.__set[n]=t[n],set(t){e.__set[n]=t},configurable:!0});return e}export{pointerExtend as default};
//# sourceMappingURL=pointerExtend.prod.js.map
