/**
 * interact.js v1.4.0-alpha.2+sha.f1199bc
 *
 * Copyright (c) 2012-2018 Taye Adeyemi <dev@taye.me>
 * Released under the MIT License.
 * https://raw.github.com/taye/interact.js/master/LICENSE
 */
(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.interact = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(_dereq_,module,exports){
'use strict';

var _index = _dereq_('./src/index');

var exported = typeof window === 'undefined' ? function (window) {
  return (0, _index.init)(window);
} : (0, _index.init)(window);

// export default exported;
/*
 * In a (windowless) server environment this file exports a factory function
 * that takes the window to use.
 *
 *     var interact = require('interact.js')(windowObject);
 *
 * See https://github.com/taye/interact.js/issues/187
 */

module.exports = exported;

},{"./src/index":100}],2:[function(_dereq_,module,exports){
module.exports = { "default": _dereq_("core-js/library/fn/object/create"), __esModule: true };
},{"core-js/library/fn/object/create":12}],3:[function(_dereq_,module,exports){
module.exports = { "default": _dereq_("core-js/library/fn/object/define-property"), __esModule: true };
},{"core-js/library/fn/object/define-property":13}],4:[function(_dereq_,module,exports){
module.exports = { "default": _dereq_("core-js/library/fn/object/set-prototype-of"), __esModule: true };
},{"core-js/library/fn/object/set-prototype-of":14}],5:[function(_dereq_,module,exports){
module.exports = { "default": _dereq_("core-js/library/fn/symbol"), __esModule: true };
},{"core-js/library/fn/symbol":15}],6:[function(_dereq_,module,exports){
module.exports = { "default": _dereq_("core-js/library/fn/symbol/iterator"), __esModule: true };
},{"core-js/library/fn/symbol/iterator":16}],7:[function(_dereq_,module,exports){
"use strict";

exports.__esModule = true;

exports.default = function (instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
};
},{}],8:[function(_dereq_,module,exports){
"use strict";

exports.__esModule = true;

var _defineProperty = _dereq_("../core-js/object/define-property");

var _defineProperty2 = _interopRequireDefault(_defineProperty);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      (0, _defineProperty2.default)(target, descriptor.key, descriptor);
    }
  }

  return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);
    if (staticProps) defineProperties(Constructor, staticProps);
    return Constructor;
  };
}();
},{"../core-js/object/define-property":3}],9:[function(_dereq_,module,exports){
"use strict";

exports.__esModule = true;

var _setPrototypeOf = _dereq_("../core-js/object/set-prototype-of");

var _setPrototypeOf2 = _interopRequireDefault(_setPrototypeOf);

var _create = _dereq_("../core-js/object/create");

var _create2 = _interopRequireDefault(_create);

var _typeof2 = _dereq_("../helpers/typeof");

var _typeof3 = _interopRequireDefault(_typeof2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = function (subClass, superClass) {
  if (typeof superClass !== "function" && superClass !== null) {
    throw new TypeError("Super expression must either be null or a function, not " + (typeof superClass === "undefined" ? "undefined" : (0, _typeof3.default)(superClass)));
  }

  subClass.prototype = (0, _create2.default)(superClass && superClass.prototype, {
    constructor: {
      value: subClass,
      enumerable: false,
      writable: true,
      configurable: true
    }
  });
  if (superClass) _setPrototypeOf2.default ? (0, _setPrototypeOf2.default)(subClass, superClass) : subClass.__proto__ = superClass;
};
},{"../core-js/object/create":2,"../core-js/object/set-prototype-of":4,"../helpers/typeof":11}],10:[function(_dereq_,module,exports){
"use strict";

exports.__esModule = true;

var _typeof2 = _dereq_("../helpers/typeof");

var _typeof3 = _interopRequireDefault(_typeof2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = function (self, call) {
  if (!self) {
    throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
  }

  return call && ((typeof call === "undefined" ? "undefined" : (0, _typeof3.default)(call)) === "object" || typeof call === "function") ? call : self;
};
},{"../helpers/typeof":11}],11:[function(_dereq_,module,exports){
"use strict";

exports.__esModule = true;

var _iterator = _dereq_("../core-js/symbol/iterator");

var _iterator2 = _interopRequireDefault(_iterator);

var _symbol = _dereq_("../core-js/symbol");

var _symbol2 = _interopRequireDefault(_symbol);

var _typeof = typeof _symbol2.default === "function" && typeof _iterator2.default === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof _symbol2.default === "function" && obj.constructor === _symbol2.default && obj !== _symbol2.default.prototype ? "symbol" : typeof obj; };

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = typeof _symbol2.default === "function" && _typeof(_iterator2.default) === "symbol" ? function (obj) {
  return typeof obj === "undefined" ? "undefined" : _typeof(obj);
} : function (obj) {
  return obj && typeof _symbol2.default === "function" && obj.constructor === _symbol2.default && obj !== _symbol2.default.prototype ? "symbol" : typeof obj === "undefined" ? "undefined" : _typeof(obj);
};
},{"../core-js/symbol":5,"../core-js/symbol/iterator":6}],12:[function(_dereq_,module,exports){
_dereq_('../../modules/es6.object.create');
var $Object = _dereq_('../../modules/_core').Object;
module.exports = function create(P, D) {
  return $Object.create(P, D);
};

},{"../../modules/_core":22,"../../modules/es6.object.create":74}],13:[function(_dereq_,module,exports){
_dereq_('../../modules/es6.object.define-property');
var $Object = _dereq_('../../modules/_core').Object;
module.exports = function defineProperty(it, key, desc) {
  return $Object.defineProperty(it, key, desc);
};

},{"../../modules/_core":22,"../../modules/es6.object.define-property":75}],14:[function(_dereq_,module,exports){
_dereq_('../../modules/es6.object.set-prototype-of');
module.exports = _dereq_('../../modules/_core').Object.setPrototypeOf;

},{"../../modules/_core":22,"../../modules/es6.object.set-prototype-of":76}],15:[function(_dereq_,module,exports){
_dereq_('../../modules/es6.symbol');
_dereq_('../../modules/es6.object.to-string');
_dereq_('../../modules/es7.symbol.async-iterator');
_dereq_('../../modules/es7.symbol.observable');
module.exports = _dereq_('../../modules/_core').Symbol;

},{"../../modules/_core":22,"../../modules/es6.object.to-string":77,"../../modules/es6.symbol":79,"../../modules/es7.symbol.async-iterator":80,"../../modules/es7.symbol.observable":81}],16:[function(_dereq_,module,exports){
_dereq_('../../modules/es6.string.iterator');
_dereq_('../../modules/web.dom.iterable');
module.exports = _dereq_('../../modules/_wks-ext').f('iterator');

},{"../../modules/_wks-ext":71,"../../modules/es6.string.iterator":78,"../../modules/web.dom.iterable":82}],17:[function(_dereq_,module,exports){
module.exports = function (it) {
  if (typeof it != 'function') throw TypeError(it + ' is not a function!');
  return it;
};

},{}],18:[function(_dereq_,module,exports){
module.exports = function () { /* empty */ };

},{}],19:[function(_dereq_,module,exports){
var isObject = _dereq_('./_is-object');
module.exports = function (it) {
  if (!isObject(it)) throw TypeError(it + ' is not an object!');
  return it;
};

},{"./_is-object":38}],20:[function(_dereq_,module,exports){
// false -> Array#indexOf
// true  -> Array#includes
var toIObject = _dereq_('./_to-iobject');
var toLength = _dereq_('./_to-length');
var toAbsoluteIndex = _dereq_('./_to-absolute-index');
module.exports = function (IS_INCLUDES) {
  return function ($this, el, fromIndex) {
    var O = toIObject($this);
    var length = toLength(O.length);
    var index = toAbsoluteIndex(fromIndex, length);
    var value;
    // Array#includes uses SameValueZero equality algorithm
    // eslint-disable-next-line no-self-compare
    if (IS_INCLUDES && el != el) while (length > index) {
      value = O[index++];
      // eslint-disable-next-line no-self-compare
      if (value != value) return true;
    // Array#indexOf ignores holes, Array#includes - not
    } else for (;length > index; index++) if (IS_INCLUDES || index in O) {
      if (O[index] === el) return IS_INCLUDES || index || 0;
    } return !IS_INCLUDES && -1;
  };
};

},{"./_to-absolute-index":63,"./_to-iobject":65,"./_to-length":66}],21:[function(_dereq_,module,exports){
var toString = {}.toString;

module.exports = function (it) {
  return toString.call(it).slice(8, -1);
};

},{}],22:[function(_dereq_,module,exports){
var core = module.exports = { version: '2.5.1' };
if (typeof __e == 'number') __e = core; // eslint-disable-line no-undef

},{}],23:[function(_dereq_,module,exports){
// optional / simple context binding
var aFunction = _dereq_('./_a-function');
module.exports = function (fn, that, length) {
  aFunction(fn);
  if (that === undefined) return fn;
  switch (length) {
    case 1: return function (a) {
      return fn.call(that, a);
    };
    case 2: return function (a, b) {
      return fn.call(that, a, b);
    };
    case 3: return function (a, b, c) {
      return fn.call(that, a, b, c);
    };
  }
  return function (/* ...args */) {
    return fn.apply(that, arguments);
  };
};

},{"./_a-function":17}],24:[function(_dereq_,module,exports){
// 7.2.1 RequireObjectCoercible(argument)
module.exports = function (it) {
  if (it == undefined) throw TypeError("Can't call method on  " + it);
  return it;
};

},{}],25:[function(_dereq_,module,exports){
// Thank's IE8 for his funny defineProperty
module.exports = !_dereq_('./_fails')(function () {
  return Object.defineProperty({}, 'a', { get: function () { return 7; } }).a != 7;
});

},{"./_fails":30}],26:[function(_dereq_,module,exports){
var isObject = _dereq_('./_is-object');
var document = _dereq_('./_global').document;
// typeof document.createElement is 'object' in old IE
var is = isObject(document) && isObject(document.createElement);
module.exports = function (it) {
  return is ? document.createElement(it) : {};
};

},{"./_global":31,"./_is-object":38}],27:[function(_dereq_,module,exports){
// IE 8- don't enum bug keys
module.exports = (
  'constructor,hasOwnProperty,isPrototypeOf,propertyIsEnumerable,toLocaleString,toString,valueOf'
).split(',');

},{}],28:[function(_dereq_,module,exports){
// all enumerable object keys, includes symbols
var getKeys = _dereq_('./_object-keys');
var gOPS = _dereq_('./_object-gops');
var pIE = _dereq_('./_object-pie');
module.exports = function (it) {
  var result = getKeys(it);
  var getSymbols = gOPS.f;
  if (getSymbols) {
    var symbols = getSymbols(it);
    var isEnum = pIE.f;
    var i = 0;
    var key;
    while (symbols.length > i) if (isEnum.call(it, key = symbols[i++])) result.push(key);
  } return result;
};

},{"./_object-gops":51,"./_object-keys":54,"./_object-pie":55}],29:[function(_dereq_,module,exports){
var global = _dereq_('./_global');
var core = _dereq_('./_core');
var ctx = _dereq_('./_ctx');
var hide = _dereq_('./_hide');
var PROTOTYPE = 'prototype';

var $export = function (type, name, source) {
  var IS_FORCED = type & $export.F;
  var IS_GLOBAL = type & $export.G;
  var IS_STATIC = type & $export.S;
  var IS_PROTO = type & $export.P;
  var IS_BIND = type & $export.B;
  var IS_WRAP = type & $export.W;
  var exports = IS_GLOBAL ? core : core[name] || (core[name] = {});
  var expProto = exports[PROTOTYPE];
  var target = IS_GLOBAL ? global : IS_STATIC ? global[name] : (global[name] || {})[PROTOTYPE];
  var key, own, out;
  if (IS_GLOBAL) source = name;
  for (key in source) {
    // contains in native
    own = !IS_FORCED && target && target[key] !== undefined;
    if (own && key in exports) continue;
    // export native or passed
    out = own ? target[key] : source[key];
    // prevent global pollution for namespaces
    exports[key] = IS_GLOBAL && typeof target[key] != 'function' ? source[key]
    // bind timers to global for call from export context
    : IS_BIND && own ? ctx(out, global)
    // wrap global constructors for prevent change them in library
    : IS_WRAP && target[key] == out ? (function (C) {
      var F = function (a, b, c) {
        if (this instanceof C) {
          switch (arguments.length) {
            case 0: return new C();
            case 1: return new C(a);
            case 2: return new C(a, b);
          } return new C(a, b, c);
        } return C.apply(this, arguments);
      };
      F[PROTOTYPE] = C[PROTOTYPE];
      return F;
    // make static versions for prototype methods
    })(out) : IS_PROTO && typeof out == 'function' ? ctx(Function.call, out) : out;
    // export proto methods to core.%CONSTRUCTOR%.methods.%NAME%
    if (IS_PROTO) {
      (exports.virtual || (exports.virtual = {}))[key] = out;
      // export proto methods to core.%CONSTRUCTOR%.prototype.%NAME%
      if (type & $export.R && expProto && !expProto[key]) hide(expProto, key, out);
    }
  }
};
// type bitmap
$export.F = 1;   // forced
$export.G = 2;   // global
$export.S = 4;   // static
$export.P = 8;   // proto
$export.B = 16;  // bind
$export.W = 32;  // wrap
$export.U = 64;  // safe
$export.R = 128; // real proto method for `library`
module.exports = $export;

},{"./_core":22,"./_ctx":23,"./_global":31,"./_hide":33}],30:[function(_dereq_,module,exports){
module.exports = function (exec) {
  try {
    return !!exec();
  } catch (e) {
    return true;
  }
};

},{}],31:[function(_dereq_,module,exports){
// https://github.com/zloirock/core-js/issues/86#issuecomment-115759028
var global = module.exports = typeof window != 'undefined' && window.Math == Math
  ? window : typeof self != 'undefined' && self.Math == Math ? self
  // eslint-disable-next-line no-new-func
  : Function('return this')();
if (typeof __g == 'number') __g = global; // eslint-disable-line no-undef

},{}],32:[function(_dereq_,module,exports){
var hasOwnProperty = {}.hasOwnProperty;
module.exports = function (it, key) {
  return hasOwnProperty.call(it, key);
};

},{}],33:[function(_dereq_,module,exports){
var dP = _dereq_('./_object-dp');
var createDesc = _dereq_('./_property-desc');
module.exports = _dereq_('./_descriptors') ? function (object, key, value) {
  return dP.f(object, key, createDesc(1, value));
} : function (object, key, value) {
  object[key] = value;
  return object;
};

},{"./_descriptors":25,"./_object-dp":46,"./_property-desc":56}],34:[function(_dereq_,module,exports){
var document = _dereq_('./_global').document;
module.exports = document && document.documentElement;

},{"./_global":31}],35:[function(_dereq_,module,exports){
module.exports = !_dereq_('./_descriptors') && !_dereq_('./_fails')(function () {
  return Object.defineProperty(_dereq_('./_dom-create')('div'), 'a', { get: function () { return 7; } }).a != 7;
});

},{"./_descriptors":25,"./_dom-create":26,"./_fails":30}],36:[function(_dereq_,module,exports){
// fallback for non-array-like ES3 and non-enumerable old V8 strings
var cof = _dereq_('./_cof');
// eslint-disable-next-line no-prototype-builtins
module.exports = Object('z').propertyIsEnumerable(0) ? Object : function (it) {
  return cof(it) == 'String' ? it.split('') : Object(it);
};

},{"./_cof":21}],37:[function(_dereq_,module,exports){
// 7.2.2 IsArray(argument)
var cof = _dereq_('./_cof');
module.exports = Array.isArray || function isArray(arg) {
  return cof(arg) == 'Array';
};

},{"./_cof":21}],38:[function(_dereq_,module,exports){
module.exports = function (it) {
  return typeof it === 'object' ? it !== null : typeof it === 'function';
};

},{}],39:[function(_dereq_,module,exports){
'use strict';
var create = _dereq_('./_object-create');
var descriptor = _dereq_('./_property-desc');
var setToStringTag = _dereq_('./_set-to-string-tag');
var IteratorPrototype = {};

// 25.1.2.1.1 %IteratorPrototype%[@@iterator]()
_dereq_('./_hide')(IteratorPrototype, _dereq_('./_wks')('iterator'), function () { return this; });

module.exports = function (Constructor, NAME, next) {
  Constructor.prototype = create(IteratorPrototype, { next: descriptor(1, next) });
  setToStringTag(Constructor, NAME + ' Iterator');
};

},{"./_hide":33,"./_object-create":45,"./_property-desc":56,"./_set-to-string-tag":59,"./_wks":72}],40:[function(_dereq_,module,exports){
'use strict';
var LIBRARY = _dereq_('./_library');
var $export = _dereq_('./_export');
var redefine = _dereq_('./_redefine');
var hide = _dereq_('./_hide');
var has = _dereq_('./_has');
var Iterators = _dereq_('./_iterators');
var $iterCreate = _dereq_('./_iter-create');
var setToStringTag = _dereq_('./_set-to-string-tag');
var getPrototypeOf = _dereq_('./_object-gpo');
var ITERATOR = _dereq_('./_wks')('iterator');
var BUGGY = !([].keys && 'next' in [].keys()); // Safari has buggy iterators w/o `next`
var FF_ITERATOR = '@@iterator';
var KEYS = 'keys';
var VALUES = 'values';

var returnThis = function () { return this; };

module.exports = function (Base, NAME, Constructor, next, DEFAULT, IS_SET, FORCED) {
  $iterCreate(Constructor, NAME, next);
  var getMethod = function (kind) {
    if (!BUGGY && kind in proto) return proto[kind];
    switch (kind) {
      case KEYS: return function keys() { return new Constructor(this, kind); };
      case VALUES: return function values() { return new Constructor(this, kind); };
    } return function entries() { return new Constructor(this, kind); };
  };
  var TAG = NAME + ' Iterator';
  var DEF_VALUES = DEFAULT == VALUES;
  var VALUES_BUG = false;
  var proto = Base.prototype;
  var $native = proto[ITERATOR] || proto[FF_ITERATOR] || DEFAULT && proto[DEFAULT];
  var $default = $native || getMethod(DEFAULT);
  var $entries = DEFAULT ? !DEF_VALUES ? $default : getMethod('entries') : undefined;
  var $anyNative = NAME == 'Array' ? proto.entries || $native : $native;
  var methods, key, IteratorPrototype;
  // Fix native
  if ($anyNative) {
    IteratorPrototype = getPrototypeOf($anyNative.call(new Base()));
    if (IteratorPrototype !== Object.prototype && IteratorPrototype.next) {
      // Set @@toStringTag to native iterators
      setToStringTag(IteratorPrototype, TAG, true);
      // fix for some old engines
      if (!LIBRARY && !has(IteratorPrototype, ITERATOR)) hide(IteratorPrototype, ITERATOR, returnThis);
    }
  }
  // fix Array#{values, @@iterator}.name in V8 / FF
  if (DEF_VALUES && $native && $native.name !== VALUES) {
    VALUES_BUG = true;
    $default = function values() { return $native.call(this); };
  }
  // Define iterator
  if ((!LIBRARY || FORCED) && (BUGGY || VALUES_BUG || !proto[ITERATOR])) {
    hide(proto, ITERATOR, $default);
  }
  // Plug for library
  Iterators[NAME] = $default;
  Iterators[TAG] = returnThis;
  if (DEFAULT) {
    methods = {
      values: DEF_VALUES ? $default : getMethod(VALUES),
      keys: IS_SET ? $default : getMethod(KEYS),
      entries: $entries
    };
    if (FORCED) for (key in methods) {
      if (!(key in proto)) redefine(proto, key, methods[key]);
    } else $export($export.P + $export.F * (BUGGY || VALUES_BUG), NAME, methods);
  }
  return methods;
};

},{"./_export":29,"./_has":32,"./_hide":33,"./_iter-create":39,"./_iterators":42,"./_library":43,"./_object-gpo":52,"./_redefine":57,"./_set-to-string-tag":59,"./_wks":72}],41:[function(_dereq_,module,exports){
module.exports = function (done, value) {
  return { value: value, done: !!done };
};

},{}],42:[function(_dereq_,module,exports){
module.exports = {};

},{}],43:[function(_dereq_,module,exports){
module.exports = true;

},{}],44:[function(_dereq_,module,exports){
var META = _dereq_('./_uid')('meta');
var isObject = _dereq_('./_is-object');
var has = _dereq_('./_has');
var setDesc = _dereq_('./_object-dp').f;
var id = 0;
var isExtensible = Object.isExtensible || function () {
  return true;
};
var FREEZE = !_dereq_('./_fails')(function () {
  return isExtensible(Object.preventExtensions({}));
});
var setMeta = function (it) {
  setDesc(it, META, { value: {
    i: 'O' + ++id, // object ID
    w: {}          // weak collections IDs
  } });
};
var fastKey = function (it, create) {
  // return primitive with prefix
  if (!isObject(it)) return typeof it == 'symbol' ? it : (typeof it == 'string' ? 'S' : 'P') + it;
  if (!has(it, META)) {
    // can't set metadata to uncaught frozen object
    if (!isExtensible(it)) return 'F';
    // not necessary to add metadata
    if (!create) return 'E';
    // add missing metadata
    setMeta(it);
  // return object ID
  } return it[META].i;
};
var getWeak = function (it, create) {
  if (!has(it, META)) {
    // can't set metadata to uncaught frozen object
    if (!isExtensible(it)) return true;
    // not necessary to add metadata
    if (!create) return false;
    // add missing metadata
    setMeta(it);
  // return hash weak collections IDs
  } return it[META].w;
};
// add metadata on freeze-family methods calling
var onFreeze = function (it) {
  if (FREEZE && meta.NEED && isExtensible(it) && !has(it, META)) setMeta(it);
  return it;
};
var meta = module.exports = {
  KEY: META,
  NEED: false,
  fastKey: fastKey,
  getWeak: getWeak,
  onFreeze: onFreeze
};

},{"./_fails":30,"./_has":32,"./_is-object":38,"./_object-dp":46,"./_uid":69}],45:[function(_dereq_,module,exports){
// 19.1.2.2 / 15.2.3.5 Object.create(O [, Properties])
var anObject = _dereq_('./_an-object');
var dPs = _dereq_('./_object-dps');
var enumBugKeys = _dereq_('./_enum-bug-keys');
var IE_PROTO = _dereq_('./_shared-key')('IE_PROTO');
var Empty = function () { /* empty */ };
var PROTOTYPE = 'prototype';

// Create object with fake `null` prototype: use iframe Object with cleared prototype
var createDict = function () {
  // Thrash, waste and sodomy: IE GC bug
  var iframe = _dereq_('./_dom-create')('iframe');
  var i = enumBugKeys.length;
  var lt = '<';
  var gt = '>';
  var iframeDocument;
  iframe.style.display = 'none';
  _dereq_('./_html').appendChild(iframe);
  iframe.src = 'javascript:'; // eslint-disable-line no-script-url
  // createDict = iframe.contentWindow.Object;
  // html.removeChild(iframe);
  iframeDocument = iframe.contentWindow.document;
  iframeDocument.open();
  iframeDocument.write(lt + 'script' + gt + 'document.F=Object' + lt + '/script' + gt);
  iframeDocument.close();
  createDict = iframeDocument.F;
  while (i--) delete createDict[PROTOTYPE][enumBugKeys[i]];
  return createDict();
};

module.exports = Object.create || function create(O, Properties) {
  var result;
  if (O !== null) {
    Empty[PROTOTYPE] = anObject(O);
    result = new Empty();
    Empty[PROTOTYPE] = null;
    // add "__proto__" for Object.getPrototypeOf polyfill
    result[IE_PROTO] = O;
  } else result = createDict();
  return Properties === undefined ? result : dPs(result, Properties);
};

},{"./_an-object":19,"./_dom-create":26,"./_enum-bug-keys":27,"./_html":34,"./_object-dps":47,"./_shared-key":60}],46:[function(_dereq_,module,exports){
var anObject = _dereq_('./_an-object');
var IE8_DOM_DEFINE = _dereq_('./_ie8-dom-define');
var toPrimitive = _dereq_('./_to-primitive');
var dP = Object.defineProperty;

exports.f = _dereq_('./_descriptors') ? Object.defineProperty : function defineProperty(O, P, Attributes) {
  anObject(O);
  P = toPrimitive(P, true);
  anObject(Attributes);
  if (IE8_DOM_DEFINE) try {
    return dP(O, P, Attributes);
  } catch (e) { /* empty */ }
  if ('get' in Attributes || 'set' in Attributes) throw TypeError('Accessors not supported!');
  if ('value' in Attributes) O[P] = Attributes.value;
  return O;
};

},{"./_an-object":19,"./_descriptors":25,"./_ie8-dom-define":35,"./_to-primitive":68}],47:[function(_dereq_,module,exports){
var dP = _dereq_('./_object-dp');
var anObject = _dereq_('./_an-object');
var getKeys = _dereq_('./_object-keys');

module.exports = _dereq_('./_descriptors') ? Object.defineProperties : function defineProperties(O, Properties) {
  anObject(O);
  var keys = getKeys(Properties);
  var length = keys.length;
  var i = 0;
  var P;
  while (length > i) dP.f(O, P = keys[i++], Properties[P]);
  return O;
};

},{"./_an-object":19,"./_descriptors":25,"./_object-dp":46,"./_object-keys":54}],48:[function(_dereq_,module,exports){
var pIE = _dereq_('./_object-pie');
var createDesc = _dereq_('./_property-desc');
var toIObject = _dereq_('./_to-iobject');
var toPrimitive = _dereq_('./_to-primitive');
var has = _dereq_('./_has');
var IE8_DOM_DEFINE = _dereq_('./_ie8-dom-define');
var gOPD = Object.getOwnPropertyDescriptor;

exports.f = _dereq_('./_descriptors') ? gOPD : function getOwnPropertyDescriptor(O, P) {
  O = toIObject(O);
  P = toPrimitive(P, true);
  if (IE8_DOM_DEFINE) try {
    return gOPD(O, P);
  } catch (e) { /* empty */ }
  if (has(O, P)) return createDesc(!pIE.f.call(O, P), O[P]);
};

},{"./_descriptors":25,"./_has":32,"./_ie8-dom-define":35,"./_object-pie":55,"./_property-desc":56,"./_to-iobject":65,"./_to-primitive":68}],49:[function(_dereq_,module,exports){
// fallback for IE11 buggy Object.getOwnPropertyNames with iframe and window
var toIObject = _dereq_('./_to-iobject');
var gOPN = _dereq_('./_object-gopn').f;
var toString = {}.toString;

var windowNames = typeof window == 'object' && window && Object.getOwnPropertyNames
  ? Object.getOwnPropertyNames(window) : [];

var getWindowNames = function (it) {
  try {
    return gOPN(it);
  } catch (e) {
    return windowNames.slice();
  }
};

module.exports.f = function getOwnPropertyNames(it) {
  return windowNames && toString.call(it) == '[object Window]' ? getWindowNames(it) : gOPN(toIObject(it));
};

},{"./_object-gopn":50,"./_to-iobject":65}],50:[function(_dereq_,module,exports){
// 19.1.2.7 / 15.2.3.4 Object.getOwnPropertyNames(O)
var $keys = _dereq_('./_object-keys-internal');
var hiddenKeys = _dereq_('./_enum-bug-keys').concat('length', 'prototype');

exports.f = Object.getOwnPropertyNames || function getOwnPropertyNames(O) {
  return $keys(O, hiddenKeys);
};

},{"./_enum-bug-keys":27,"./_object-keys-internal":53}],51:[function(_dereq_,module,exports){
exports.f = Object.getOwnPropertySymbols;

},{}],52:[function(_dereq_,module,exports){
// 19.1.2.9 / 15.2.3.2 Object.getPrototypeOf(O)
var has = _dereq_('./_has');
var toObject = _dereq_('./_to-object');
var IE_PROTO = _dereq_('./_shared-key')('IE_PROTO');
var ObjectProto = Object.prototype;

module.exports = Object.getPrototypeOf || function (O) {
  O = toObject(O);
  if (has(O, IE_PROTO)) return O[IE_PROTO];
  if (typeof O.constructor == 'function' && O instanceof O.constructor) {
    return O.constructor.prototype;
  } return O instanceof Object ? ObjectProto : null;
};

},{"./_has":32,"./_shared-key":60,"./_to-object":67}],53:[function(_dereq_,module,exports){
var has = _dereq_('./_has');
var toIObject = _dereq_('./_to-iobject');
var arrayIndexOf = _dereq_('./_array-includes')(false);
var IE_PROTO = _dereq_('./_shared-key')('IE_PROTO');

module.exports = function (object, names) {
  var O = toIObject(object);
  var i = 0;
  var result = [];
  var key;
  for (key in O) if (key != IE_PROTO) has(O, key) && result.push(key);
  // Don't enum bug & hidden keys
  while (names.length > i) if (has(O, key = names[i++])) {
    ~arrayIndexOf(result, key) || result.push(key);
  }
  return result;
};

},{"./_array-includes":20,"./_has":32,"./_shared-key":60,"./_to-iobject":65}],54:[function(_dereq_,module,exports){
// 19.1.2.14 / 15.2.3.14 Object.keys(O)
var $keys = _dereq_('./_object-keys-internal');
var enumBugKeys = _dereq_('./_enum-bug-keys');

module.exports = Object.keys || function keys(O) {
  return $keys(O, enumBugKeys);
};

},{"./_enum-bug-keys":27,"./_object-keys-internal":53}],55:[function(_dereq_,module,exports){
exports.f = {}.propertyIsEnumerable;

},{}],56:[function(_dereq_,module,exports){
module.exports = function (bitmap, value) {
  return {
    enumerable: !(bitmap & 1),
    configurable: !(bitmap & 2),
    writable: !(bitmap & 4),
    value: value
  };
};

},{}],57:[function(_dereq_,module,exports){
module.exports = _dereq_('./_hide');

},{"./_hide":33}],58:[function(_dereq_,module,exports){
// Works with __proto__ only. Old v8 can't work with null proto objects.
/* eslint-disable no-proto */
var isObject = _dereq_('./_is-object');
var anObject = _dereq_('./_an-object');
var check = function (O, proto) {
  anObject(O);
  if (!isObject(proto) && proto !== null) throw TypeError(proto + ": can't set as prototype!");
};
module.exports = {
  set: Object.setPrototypeOf || ('__proto__' in {} ? // eslint-disable-line
    function (test, buggy, set) {
      try {
        set = _dereq_('./_ctx')(Function.call, _dereq_('./_object-gopd').f(Object.prototype, '__proto__').set, 2);
        set(test, []);
        buggy = !(test instanceof Array);
      } catch (e) { buggy = true; }
      return function setPrototypeOf(O, proto) {
        check(O, proto);
        if (buggy) O.__proto__ = proto;
        else set(O, proto);
        return O;
      };
    }({}, false) : undefined),
  check: check
};

},{"./_an-object":19,"./_ctx":23,"./_is-object":38,"./_object-gopd":48}],59:[function(_dereq_,module,exports){
var def = _dereq_('./_object-dp').f;
var has = _dereq_('./_has');
var TAG = _dereq_('./_wks')('toStringTag');

module.exports = function (it, tag, stat) {
  if (it && !has(it = stat ? it : it.prototype, TAG)) def(it, TAG, { configurable: true, value: tag });
};

},{"./_has":32,"./_object-dp":46,"./_wks":72}],60:[function(_dereq_,module,exports){
var shared = _dereq_('./_shared')('keys');
var uid = _dereq_('./_uid');
module.exports = function (key) {
  return shared[key] || (shared[key] = uid(key));
};

},{"./_shared":61,"./_uid":69}],61:[function(_dereq_,module,exports){
var global = _dereq_('./_global');
var SHARED = '__core-js_shared__';
var store = global[SHARED] || (global[SHARED] = {});
module.exports = function (key) {
  return store[key] || (store[key] = {});
};

},{"./_global":31}],62:[function(_dereq_,module,exports){
var toInteger = _dereq_('./_to-integer');
var defined = _dereq_('./_defined');
// true  -> String#at
// false -> String#codePointAt
module.exports = function (TO_STRING) {
  return function (that, pos) {
    var s = String(defined(that));
    var i = toInteger(pos);
    var l = s.length;
    var a, b;
    if (i < 0 || i >= l) return TO_STRING ? '' : undefined;
    a = s.charCodeAt(i);
    return a < 0xd800 || a > 0xdbff || i + 1 === l || (b = s.charCodeAt(i + 1)) < 0xdc00 || b > 0xdfff
      ? TO_STRING ? s.charAt(i) : a
      : TO_STRING ? s.slice(i, i + 2) : (a - 0xd800 << 10) + (b - 0xdc00) + 0x10000;
  };
};

},{"./_defined":24,"./_to-integer":64}],63:[function(_dereq_,module,exports){
var toInteger = _dereq_('./_to-integer');
var max = Math.max;
var min = Math.min;
module.exports = function (index, length) {
  index = toInteger(index);
  return index < 0 ? max(index + length, 0) : min(index, length);
};

},{"./_to-integer":64}],64:[function(_dereq_,module,exports){
// 7.1.4 ToInteger
var ceil = Math.ceil;
var floor = Math.floor;
module.exports = function (it) {
  return isNaN(it = +it) ? 0 : (it > 0 ? floor : ceil)(it);
};

},{}],65:[function(_dereq_,module,exports){
// to indexed object, toObject with fallback for non-array-like ES3 strings
var IObject = _dereq_('./_iobject');
var defined = _dereq_('./_defined');
module.exports = function (it) {
  return IObject(defined(it));
};

},{"./_defined":24,"./_iobject":36}],66:[function(_dereq_,module,exports){
// 7.1.15 ToLength
var toInteger = _dereq_('./_to-integer');
var min = Math.min;
module.exports = function (it) {
  return it > 0 ? min(toInteger(it), 0x1fffffffffffff) : 0; // pow(2, 53) - 1 == 9007199254740991
};

},{"./_to-integer":64}],67:[function(_dereq_,module,exports){
// 7.1.13 ToObject(argument)
var defined = _dereq_('./_defined');
module.exports = function (it) {
  return Object(defined(it));
};

},{"./_defined":24}],68:[function(_dereq_,module,exports){
// 7.1.1 ToPrimitive(input [, PreferredType])
var isObject = _dereq_('./_is-object');
// instead of the ES6 spec version, we didn't implement @@toPrimitive case
// and the second argument - flag - preferred type is a string
module.exports = function (it, S) {
  if (!isObject(it)) return it;
  var fn, val;
  if (S && typeof (fn = it.toString) == 'function' && !isObject(val = fn.call(it))) return val;
  if (typeof (fn = it.valueOf) == 'function' && !isObject(val = fn.call(it))) return val;
  if (!S && typeof (fn = it.toString) == 'function' && !isObject(val = fn.call(it))) return val;
  throw TypeError("Can't convert object to primitive value");
};

},{"./_is-object":38}],69:[function(_dereq_,module,exports){
var id = 0;
var px = Math.random();
module.exports = function (key) {
  return 'Symbol('.concat(key === undefined ? '' : key, ')_', (++id + px).toString(36));
};

},{}],70:[function(_dereq_,module,exports){
var global = _dereq_('./_global');
var core = _dereq_('./_core');
var LIBRARY = _dereq_('./_library');
var wksExt = _dereq_('./_wks-ext');
var defineProperty = _dereq_('./_object-dp').f;
module.exports = function (name) {
  var $Symbol = core.Symbol || (core.Symbol = LIBRARY ? {} : global.Symbol || {});
  if (name.charAt(0) != '_' && !(name in $Symbol)) defineProperty($Symbol, name, { value: wksExt.f(name) });
};

},{"./_core":22,"./_global":31,"./_library":43,"./_object-dp":46,"./_wks-ext":71}],71:[function(_dereq_,module,exports){
exports.f = _dereq_('./_wks');

},{"./_wks":72}],72:[function(_dereq_,module,exports){
var store = _dereq_('./_shared')('wks');
var uid = _dereq_('./_uid');
var Symbol = _dereq_('./_global').Symbol;
var USE_SYMBOL = typeof Symbol == 'function';

var $exports = module.exports = function (name) {
  return store[name] || (store[name] =
    USE_SYMBOL && Symbol[name] || (USE_SYMBOL ? Symbol : uid)('Symbol.' + name));
};

$exports.store = store;

},{"./_global":31,"./_shared":61,"./_uid":69}],73:[function(_dereq_,module,exports){
'use strict';
var addToUnscopables = _dereq_('./_add-to-unscopables');
var step = _dereq_('./_iter-step');
var Iterators = _dereq_('./_iterators');
var toIObject = _dereq_('./_to-iobject');

// 22.1.3.4 Array.prototype.entries()
// 22.1.3.13 Array.prototype.keys()
// 22.1.3.29 Array.prototype.values()
// 22.1.3.30 Array.prototype[@@iterator]()
module.exports = _dereq_('./_iter-define')(Array, 'Array', function (iterated, kind) {
  this._t = toIObject(iterated); // target
  this._i = 0;                   // next index
  this._k = kind;                // kind
// 22.1.5.2.1 %ArrayIteratorPrototype%.next()
}, function () {
  var O = this._t;
  var kind = this._k;
  var index = this._i++;
  if (!O || index >= O.length) {
    this._t = undefined;
    return step(1);
  }
  if (kind == 'keys') return step(0, index);
  if (kind == 'values') return step(0, O[index]);
  return step(0, [index, O[index]]);
}, 'values');

// argumentsList[@@iterator] is %ArrayProto_values% (9.4.4.6, 9.4.4.7)
Iterators.Arguments = Iterators.Array;

addToUnscopables('keys');
addToUnscopables('values');
addToUnscopables('entries');

},{"./_add-to-unscopables":18,"./_iter-define":40,"./_iter-step":41,"./_iterators":42,"./_to-iobject":65}],74:[function(_dereq_,module,exports){
var $export = _dereq_('./_export');
// 19.1.2.2 / 15.2.3.5 Object.create(O [, Properties])
$export($export.S, 'Object', { create: _dereq_('./_object-create') });

},{"./_export":29,"./_object-create":45}],75:[function(_dereq_,module,exports){
var $export = _dereq_('./_export');
// 19.1.2.4 / 15.2.3.6 Object.defineProperty(O, P, Attributes)
$export($export.S + $export.F * !_dereq_('./_descriptors'), 'Object', { defineProperty: _dereq_('./_object-dp').f });

},{"./_descriptors":25,"./_export":29,"./_object-dp":46}],76:[function(_dereq_,module,exports){
// 19.1.3.19 Object.setPrototypeOf(O, proto)
var $export = _dereq_('./_export');
$export($export.S, 'Object', { setPrototypeOf: _dereq_('./_set-proto').set });

},{"./_export":29,"./_set-proto":58}],77:[function(_dereq_,module,exports){

},{}],78:[function(_dereq_,module,exports){
'use strict';
var $at = _dereq_('./_string-at')(true);

// 21.1.3.27 String.prototype[@@iterator]()
_dereq_('./_iter-define')(String, 'String', function (iterated) {
  this._t = String(iterated); // target
  this._i = 0;                // next index
// 21.1.5.2.1 %StringIteratorPrototype%.next()
}, function () {
  var O = this._t;
  var index = this._i;
  var point;
  if (index >= O.length) return { value: undefined, done: true };
  point = $at(O, index);
  this._i += point.length;
  return { value: point, done: false };
});

},{"./_iter-define":40,"./_string-at":62}],79:[function(_dereq_,module,exports){
'use strict';
// ECMAScript 6 symbols shim
var global = _dereq_('./_global');
var has = _dereq_('./_has');
var DESCRIPTORS = _dereq_('./_descriptors');
var $export = _dereq_('./_export');
var redefine = _dereq_('./_redefine');
var META = _dereq_('./_meta').KEY;
var $fails = _dereq_('./_fails');
var shared = _dereq_('./_shared');
var setToStringTag = _dereq_('./_set-to-string-tag');
var uid = _dereq_('./_uid');
var wks = _dereq_('./_wks');
var wksExt = _dereq_('./_wks-ext');
var wksDefine = _dereq_('./_wks-define');
var enumKeys = _dereq_('./_enum-keys');
var isArray = _dereq_('./_is-array');
var anObject = _dereq_('./_an-object');
var toIObject = _dereq_('./_to-iobject');
var toPrimitive = _dereq_('./_to-primitive');
var createDesc = _dereq_('./_property-desc');
var _create = _dereq_('./_object-create');
var gOPNExt = _dereq_('./_object-gopn-ext');
var $GOPD = _dereq_('./_object-gopd');
var $DP = _dereq_('./_object-dp');
var $keys = _dereq_('./_object-keys');
var gOPD = $GOPD.f;
var dP = $DP.f;
var gOPN = gOPNExt.f;
var $Symbol = global.Symbol;
var $JSON = global.JSON;
var _stringify = $JSON && $JSON.stringify;
var PROTOTYPE = 'prototype';
var HIDDEN = wks('_hidden');
var TO_PRIMITIVE = wks('toPrimitive');
var isEnum = {}.propertyIsEnumerable;
var SymbolRegistry = shared('symbol-registry');
var AllSymbols = shared('symbols');
var OPSymbols = shared('op-symbols');
var ObjectProto = Object[PROTOTYPE];
var USE_NATIVE = typeof $Symbol == 'function';
var QObject = global.QObject;
// Don't use setters in Qt Script, https://github.com/zloirock/core-js/issues/173
var setter = !QObject || !QObject[PROTOTYPE] || !QObject[PROTOTYPE].findChild;

// fallback for old Android, https://code.google.com/p/v8/issues/detail?id=687
var setSymbolDesc = DESCRIPTORS && $fails(function () {
  return _create(dP({}, 'a', {
    get: function () { return dP(this, 'a', { value: 7 }).a; }
  })).a != 7;
}) ? function (it, key, D) {
  var protoDesc = gOPD(ObjectProto, key);
  if (protoDesc) delete ObjectProto[key];
  dP(it, key, D);
  if (protoDesc && it !== ObjectProto) dP(ObjectProto, key, protoDesc);
} : dP;

var wrap = function (tag) {
  var sym = AllSymbols[tag] = _create($Symbol[PROTOTYPE]);
  sym._k = tag;
  return sym;
};

var isSymbol = USE_NATIVE && typeof $Symbol.iterator == 'symbol' ? function (it) {
  return typeof it == 'symbol';
} : function (it) {
  return it instanceof $Symbol;
};

var $defineProperty = function defineProperty(it, key, D) {
  if (it === ObjectProto) $defineProperty(OPSymbols, key, D);
  anObject(it);
  key = toPrimitive(key, true);
  anObject(D);
  if (has(AllSymbols, key)) {
    if (!D.enumerable) {
      if (!has(it, HIDDEN)) dP(it, HIDDEN, createDesc(1, {}));
      it[HIDDEN][key] = true;
    } else {
      if (has(it, HIDDEN) && it[HIDDEN][key]) it[HIDDEN][key] = false;
      D = _create(D, { enumerable: createDesc(0, false) });
    } return setSymbolDesc(it, key, D);
  } return dP(it, key, D);
};
var $defineProperties = function defineProperties(it, P) {
  anObject(it);
  var keys = enumKeys(P = toIObject(P));
  var i = 0;
  var l = keys.length;
  var key;
  while (l > i) $defineProperty(it, key = keys[i++], P[key]);
  return it;
};
var $create = function create(it, P) {
  return P === undefined ? _create(it) : $defineProperties(_create(it), P);
};
var $propertyIsEnumerable = function propertyIsEnumerable(key) {
  var E = isEnum.call(this, key = toPrimitive(key, true));
  if (this === ObjectProto && has(AllSymbols, key) && !has(OPSymbols, key)) return false;
  return E || !has(this, key) || !has(AllSymbols, key) || has(this, HIDDEN) && this[HIDDEN][key] ? E : true;
};
var $getOwnPropertyDescriptor = function getOwnPropertyDescriptor(it, key) {
  it = toIObject(it);
  key = toPrimitive(key, true);
  if (it === ObjectProto && has(AllSymbols, key) && !has(OPSymbols, key)) return;
  var D = gOPD(it, key);
  if (D && has(AllSymbols, key) && !(has(it, HIDDEN) && it[HIDDEN][key])) D.enumerable = true;
  return D;
};
var $getOwnPropertyNames = function getOwnPropertyNames(it) {
  var names = gOPN(toIObject(it));
  var result = [];
  var i = 0;
  var key;
  while (names.length > i) {
    if (!has(AllSymbols, key = names[i++]) && key != HIDDEN && key != META) result.push(key);
  } return result;
};
var $getOwnPropertySymbols = function getOwnPropertySymbols(it) {
  var IS_OP = it === ObjectProto;
  var names = gOPN(IS_OP ? OPSymbols : toIObject(it));
  var result = [];
  var i = 0;
  var key;
  while (names.length > i) {
    if (has(AllSymbols, key = names[i++]) && (IS_OP ? has(ObjectProto, key) : true)) result.push(AllSymbols[key]);
  } return result;
};

// 19.4.1.1 Symbol([description])
if (!USE_NATIVE) {
  $Symbol = function Symbol() {
    if (this instanceof $Symbol) throw TypeError('Symbol is not a constructor!');
    var tag = uid(arguments.length > 0 ? arguments[0] : undefined);
    var $set = function (value) {
      if (this === ObjectProto) $set.call(OPSymbols, value);
      if (has(this, HIDDEN) && has(this[HIDDEN], tag)) this[HIDDEN][tag] = false;
      setSymbolDesc(this, tag, createDesc(1, value));
    };
    if (DESCRIPTORS && setter) setSymbolDesc(ObjectProto, tag, { configurable: true, set: $set });
    return wrap(tag);
  };
  redefine($Symbol[PROTOTYPE], 'toString', function toString() {
    return this._k;
  });

  $GOPD.f = $getOwnPropertyDescriptor;
  $DP.f = $defineProperty;
  _dereq_('./_object-gopn').f = gOPNExt.f = $getOwnPropertyNames;
  _dereq_('./_object-pie').f = $propertyIsEnumerable;
  _dereq_('./_object-gops').f = $getOwnPropertySymbols;

  if (DESCRIPTORS && !_dereq_('./_library')) {
    redefine(ObjectProto, 'propertyIsEnumerable', $propertyIsEnumerable, true);
  }

  wksExt.f = function (name) {
    return wrap(wks(name));
  };
}

$export($export.G + $export.W + $export.F * !USE_NATIVE, { Symbol: $Symbol });

for (var es6Symbols = (
  // 19.4.2.2, 19.4.2.3, 19.4.2.4, 19.4.2.6, 19.4.2.8, 19.4.2.9, 19.4.2.10, 19.4.2.11, 19.4.2.12, 19.4.2.13, 19.4.2.14
  'hasInstance,isConcatSpreadable,iterator,match,replace,search,species,split,toPrimitive,toStringTag,unscopables'
).split(','), j = 0; es6Symbols.length > j;)wks(es6Symbols[j++]);

for (var wellKnownSymbols = $keys(wks.store), k = 0; wellKnownSymbols.length > k;) wksDefine(wellKnownSymbols[k++]);

$export($export.S + $export.F * !USE_NATIVE, 'Symbol', {
  // 19.4.2.1 Symbol.for(key)
  'for': function (key) {
    return has(SymbolRegistry, key += '')
      ? SymbolRegistry[key]
      : SymbolRegistry[key] = $Symbol(key);
  },
  // 19.4.2.5 Symbol.keyFor(sym)
  keyFor: function keyFor(sym) {
    if (!isSymbol(sym)) throw TypeError(sym + ' is not a symbol!');
    for (var key in SymbolRegistry) if (SymbolRegistry[key] === sym) return key;
  },
  useSetter: function () { setter = true; },
  useSimple: function () { setter = false; }
});

$export($export.S + $export.F * !USE_NATIVE, 'Object', {
  // 19.1.2.2 Object.create(O [, Properties])
  create: $create,
  // 19.1.2.4 Object.defineProperty(O, P, Attributes)
  defineProperty: $defineProperty,
  // 19.1.2.3 Object.defineProperties(O, Properties)
  defineProperties: $defineProperties,
  // 19.1.2.6 Object.getOwnPropertyDescriptor(O, P)
  getOwnPropertyDescriptor: $getOwnPropertyDescriptor,
  // 19.1.2.7 Object.getOwnPropertyNames(O)
  getOwnPropertyNames: $getOwnPropertyNames,
  // 19.1.2.8 Object.getOwnPropertySymbols(O)
  getOwnPropertySymbols: $getOwnPropertySymbols
});

// 24.3.2 JSON.stringify(value [, replacer [, space]])
$JSON && $export($export.S + $export.F * (!USE_NATIVE || $fails(function () {
  var S = $Symbol();
  // MS Edge converts symbol values to JSON as {}
  // WebKit converts symbol values to JSON as null
  // V8 throws on boxed symbols
  return _stringify([S]) != '[null]' || _stringify({ a: S }) != '{}' || _stringify(Object(S)) != '{}';
})), 'JSON', {
  stringify: function stringify(it) {
    if (it === undefined || isSymbol(it)) return; // IE8 returns string on undefined
    var args = [it];
    var i = 1;
    var replacer, $replacer;
    while (arguments.length > i) args.push(arguments[i++]);
    replacer = args[1];
    if (typeof replacer == 'function') $replacer = replacer;
    if ($replacer || !isArray(replacer)) replacer = function (key, value) {
      if ($replacer) value = $replacer.call(this, key, value);
      if (!isSymbol(value)) return value;
    };
    args[1] = replacer;
    return _stringify.apply($JSON, args);
  }
});

// 19.4.3.4 Symbol.prototype[@@toPrimitive](hint)
$Symbol[PROTOTYPE][TO_PRIMITIVE] || _dereq_('./_hide')($Symbol[PROTOTYPE], TO_PRIMITIVE, $Symbol[PROTOTYPE].valueOf);
// 19.4.3.5 Symbol.prototype[@@toStringTag]
setToStringTag($Symbol, 'Symbol');
// 20.2.1.9 Math[@@toStringTag]
setToStringTag(Math, 'Math', true);
// 24.3.3 JSON[@@toStringTag]
setToStringTag(global.JSON, 'JSON', true);

},{"./_an-object":19,"./_descriptors":25,"./_enum-keys":28,"./_export":29,"./_fails":30,"./_global":31,"./_has":32,"./_hide":33,"./_is-array":37,"./_library":43,"./_meta":44,"./_object-create":45,"./_object-dp":46,"./_object-gopd":48,"./_object-gopn":50,"./_object-gopn-ext":49,"./_object-gops":51,"./_object-keys":54,"./_object-pie":55,"./_property-desc":56,"./_redefine":57,"./_set-to-string-tag":59,"./_shared":61,"./_to-iobject":65,"./_to-primitive":68,"./_uid":69,"./_wks":72,"./_wks-define":70,"./_wks-ext":71}],80:[function(_dereq_,module,exports){
_dereq_('./_wks-define')('asyncIterator');

},{"./_wks-define":70}],81:[function(_dereq_,module,exports){
_dereq_('./_wks-define')('observable');

},{"./_wks-define":70}],82:[function(_dereq_,module,exports){
_dereq_('./es6.array.iterator');
var global = _dereq_('./_global');
var hide = _dereq_('./_hide');
var Iterators = _dereq_('./_iterators');
var TO_STRING_TAG = _dereq_('./_wks')('toStringTag');

var DOMIterables = ('CSSRuleList,CSSStyleDeclaration,CSSValueList,ClientRectList,DOMRectList,DOMStringList,' +
  'DOMTokenList,DataTransferItemList,FileList,HTMLAllCollection,HTMLCollection,HTMLFormElement,HTMLSelectElement,' +
  'MediaList,MimeTypeArray,NamedNodeMap,NodeList,PaintRequestList,Plugin,PluginArray,SVGLengthList,SVGNumberList,' +
  'SVGPathSegList,SVGPointList,SVGStringList,SVGTransformList,SourceBufferList,StyleSheetList,TextTrackCueList,' +
  'TextTrackList,TouchList').split(',');

for (var i = 0; i < DOMIterables.length; i++) {
  var NAME = DOMIterables[i];
  var Collection = global[NAME];
  var proto = Collection && Collection.prototype;
  if (proto && !proto[TO_STRING_TAG]) hide(proto, TO_STRING_TAG, NAME);
  Iterators[NAME] = Iterators.Array;
}

},{"./_global":31,"./_hide":33,"./_iterators":42,"./_wks":72,"./es6.array.iterator":73}],83:[function(_dereq_,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _classCallCheck2 = _dereq_('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _extend = _dereq_('./utils/extend.js');

var _extend2 = _interopRequireDefault(_extend);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function fireUntilImmediateStopped(event, listeners) {
  for (var _i = 0; _i < listeners.length; _i++) {
    var _ref;

    _ref = listeners[_i];
    var listener = _ref;

    if (event.immediatePropagationStopped) {
      break;
    }

    listener(event);
  }
}

var Eventable = function () {
  function Eventable(options) {
    (0, _classCallCheck3.default)(this, Eventable);

    this.options = (0, _extend2.default)({}, options || {});
  }

  Eventable.prototype.fire = function fire(event) {
    var listeners = void 0;
    var onEvent = 'on' + event.type;
    var global = this.global;

    // Interactable#on() listeners
    if (listeners = this[event.type]) {
      fireUntilImmediateStopped(event, listeners);
    }

    // interactable.onevent listener
    if (this[onEvent]) {
      this[onEvent](event);
    }

    // interact.on() listeners
    if (!event.propagationStopped && global && (listeners = global[event.type])) {
      fireUntilImmediateStopped(event, listeners);
    }
  };

  Eventable.prototype.on = function on(eventType, listener) {
    // if this type of event was never bound
    if (this[eventType]) {
      this[eventType].push(listener);
    } else {
      this[eventType] = [listener];
    }
  };

  Eventable.prototype.off = function off(eventType, listener) {
    // if it is an action event type
    var eventList = this[eventType];
    var index = eventList ? eventList.indexOf(listener) : -1;

    if (index !== -1) {
      eventList.splice(index, 1);
    }

    if (eventList && eventList.length === 0 || !listener) {
      this[eventType] = undefined;
    }
  };

  return Eventable;
}();

exports.default = Eventable;

},{"./utils/extend.js":126,"babel-runtime/helpers/classCallCheck":7}],84:[function(_dereq_,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _classCallCheck2 = _dereq_('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = _dereq_('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _extend = _dereq_('./utils/extend');

var _extend2 = _interopRequireDefault(_extend);

var _getOriginXY = _dereq_('./utils/getOriginXY');

var _getOriginXY2 = _interopRequireDefault(_getOriginXY);

var _defaultOptions = _dereq_('./defaultOptions');

var _defaultOptions2 = _interopRequireDefault(_defaultOptions);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var InteractEvent = function () {
  /** */
  function InteractEvent(interaction, event, actionName, phase, element, related, preEnd, type) {
    (0, _classCallCheck3.default)(this, InteractEvent);

    element = element || interaction.element;

    var target = interaction.target;
    var deltaSource = (target && target.options || _defaultOptions2.default).deltaSource;
    var origin = (0, _getOriginXY2.default)(target, element, actionName);
    var starting = phase === 'start';
    var ending = phase === 'end';
    var prevEvent = starting ? this : interaction.prevEvent;
    var coords = starting ? interaction.startCoords : ending ? { page: prevEvent.page, client: prevEvent.client, timeStamp: interaction.curCoords.timeStamp } : interaction.curCoords;

    this.page = (0, _extend2.default)({}, coords.page);
    this.client = (0, _extend2.default)({}, coords.client);
    this.timeStamp = coords.timeStamp;

    if (!ending) {
      this.page.x -= origin.x;
      this.page.y -= origin.y;

      this.client.x -= origin.x;
      this.client.y -= origin.y;
    }

    this.ctrlKey = event.ctrlKey;
    this.altKey = event.altKey;
    this.shiftKey = event.shiftKey;
    this.metaKey = event.metaKey;
    this.button = event.button;
    this.buttons = event.buttons;
    this.target = element;
    this.currentTarget = element;
    this.relatedTarget = related || null;
    this.preEnd = preEnd;
    this.type = type || actionName + (phase || '');
    this.interaction = interaction;
    this.interactable = target;

    this.t0 = starting ? interaction.pointers[interaction.pointers.length - 1].downTime : prevEvent.t0;

    this.x0 = interaction.startCoords.page.x - origin.x;
    this.y0 = interaction.startCoords.page.y - origin.y;
    this.clientX0 = interaction.startCoords.client.x - origin.x;
    this.clientY0 = interaction.startCoords.client.y - origin.y;

    if (starting || ending) {
      this.delta = { x: 0, y: 0 };
    } else {
      this.delta = {
        x: this[deltaSource].x - prevEvent[deltaSource].x,
        y: this[deltaSource].y - prevEvent[deltaSource].y
      };
    }

    this.dt = interaction.pointerDelta.timeStamp;
    this.duration = this.timeStamp - this.t0;

    // speed and velocity in pixels per second
    this.speed = interaction.pointerDelta[deltaSource].speed;
    this.velocity = {
      x: interaction.pointerDelta[deltaSource].vx,
      y: interaction.pointerDelta[deltaSource].vy
    };

    this.swipe = ending || phase === 'inertiastart' ? this.getSwipe() : null;
  }

  InteractEvent.prototype.getSwipe = function getSwipe() {
    var interaction = this.interaction;

    if (interaction.prevEvent.speed < 600 || this.timeStamp - interaction.prevEvent.timeStamp > 150) {
      return null;
    }

    var angle = 180 * Math.atan2(interaction.prevEvent.velocityY, interaction.prevEvent.velocityX) / Math.PI;
    var overlap = 22.5;

    if (angle < 0) {
      angle += 360;
    }

    var left = 135 - overlap <= angle && angle < 225 + overlap;
    var up = 225 - overlap <= angle && angle < 315 + overlap;

    var right = !left && (315 - overlap <= angle || angle < 45 + overlap);
    var down = !up && 45 - overlap <= angle && angle < 135 + overlap;

    return {
      up: up,
      down: down,
      left: left,
      right: right,
      angle: angle,
      speed: interaction.prevEvent.speed,
      velocity: {
        x: interaction.prevEvent.velocityX,
        y: interaction.prevEvent.velocityY
      }
    };
  };

  InteractEvent.prototype.preventDefault = function preventDefault() {};

  /** */


  InteractEvent.prototype.stopImmediatePropagation = function stopImmediatePropagation() {
    this.immediatePropagationStopped = this.propagationStopped = true;
  };

  /** */


  InteractEvent.prototype.stopPropagation = function stopPropagation() {
    this.propagationStopped = true;
  };

  (0, _createClass3.default)(InteractEvent, [{
    key: 'pageX',
    get: function get() {
      return this.page.x;
    },
    set: function set(value) {
      this.page.x = value;
    }
  }, {
    key: 'pageY',
    get: function get() {
      return this.page.y;
    },
    set: function set(value) {
      this.page.y = value;
    }
  }, {
    key: 'clientX',
    get: function get() {
      return this.client.x;
    },
    set: function set(value) {
      this.client.x = value;
    }
  }, {
    key: 'clientY',
    get: function get() {
      return this.client.y;
    },
    set: function set(value) {
      this.client.y = value;
    }
  }, {
    key: 'dx',
    get: function get() {
      return this.delta.x;
    },
    set: function set(value) {
      this.delta.x = value;
    }
  }, {
    key: 'dy',
    get: function get() {
      return this.delta.y;
    },
    set: function set(value) {
      this.delta.y = value;
    }
  }, {
    key: 'velocityX',
    get: function get() {
      return this.velocity.x;
    },
    set: function set(value) {
      this.velocity.x = value;
    }
  }, {
    key: 'velocityY',
    get: function get() {
      return this.velocity.y;
    },
    set: function set(value) {
      this.velocity.y = value;
    }
  }]);
  return InteractEvent;
}();

exports.default = InteractEvent;

},{"./defaultOptions":99,"./utils/extend":126,"./utils/getOriginXY":127,"babel-runtime/helpers/classCallCheck":7,"babel-runtime/helpers/createClass":8}],85:[function(_dereq_,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _classCallCheck2 = _dereq_('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _clone = _dereq_('./utils/clone');

var _clone2 = _interopRequireDefault(_clone);

var _is = _dereq_('./utils/is');

var is = _interopRequireWildcard(_is);

var _events = _dereq_('./utils/events');

var _events2 = _interopRequireDefault(_events);

var _extend = _dereq_('./utils/extend');

var _extend2 = _interopRequireDefault(_extend);

var _arr = _dereq_('./utils/arr');

var arr = _interopRequireWildcard(_arr);

var _Eventable = _dereq_('./Eventable');

var _Eventable2 = _interopRequireDefault(_Eventable);

var _defaultOptions = _dereq_('./defaultOptions');

var _defaultOptions2 = _interopRequireDefault(_defaultOptions);

var _domUtils = _dereq_('./utils/domUtils');

var _window = _dereq_('./utils/window');

var _browser = _dereq_('./utils/browser');

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var Interactable = function () {
  /** */
  function Interactable(target, options, defaultContext) {
    (0, _classCallCheck3.default)(this, Interactable);

    this._signals = options.signals;
    this._actions = options.actions;
    this.target = target;
    this.events = new _Eventable2.default();
    this._context = options.context || defaultContext;
    this._win = (0, _window.getWindow)((0, _domUtils.trySelector)(target) ? this._context : target);
    this._doc = this._win.document;

    this._signals.fire('new', {
      target: target,
      options: options,
      interactable: this,
      win: this._win
    });

    this.set(options);
  }

  Interactable.prototype.setOnEvents = function setOnEvents(action, phases) {
    var onAction = 'on' + action;

    if (is.func(phases.onstart)) {
      this.events[onAction + 'start'] = phases.onstart;
    }
    if (is.func(phases.onmove)) {
      this.events[onAction + 'move'] = phases.onmove;
    }
    if (is.func(phases.onend)) {
      this.events[onAction + 'end'] = phases.onend;
    }
    if (is.func(phases.oninertiastart)) {
      this.events[onAction + 'inertiastart'] = phases.oninertiastart;
    }

    return this;
  };

  Interactable.prototype.setPerAction = function setPerAction(actionName, options) {
    // for all the default per-action options
    for (var optionName in options) {
      var actionOptions = this.options[actionName];
      var optionValue = options[optionName];
      var isArray = is.array(optionValue);

      // if the option value is an array
      if (isArray) {
        actionOptions[optionName] = arr.from(optionValue);
      }
      // if the option value is an object
      else if (!isArray && is.plainObject(optionValue)) {
          // copy the object
          actionOptions[optionName] = (0, _extend2.default)(actionOptions[optionName] || {}, (0, _clone2.default)(optionValue));

          // set anabled field to true if it exists in the defaults
          if (is.object(_defaultOptions2.default.perAction[optionName]) && 'enabled' in _defaultOptions2.default.perAction[optionName]) {
            actionOptions[optionName].enabled = optionValue.enabled === false ? false : true;
          }
        }
        // if the option value is a boolean and the default is an object
        else if (is.bool(optionValue) && is.object(_defaultOptions2.default.perAction[optionName])) {
            actionOptions[optionName].enabled = optionValue;
          }
          // if it's anything else, do a plain assignment
          else {
              actionOptions[optionName] = optionValue;
            }
    }
  };

  /**
   * The default function to get an Interactables bounding rect. Can be
   * overridden using {@link Interactable.rectChecker}.
   *
   * @param {Element} [element] The element to measure.
   * @return {object} The object's bounding rectangle.
   */


  Interactable.prototype.getRect = function getRect(element) {
    element = element || this.target;

    if (is.string(this.target) && !is.element(element)) {
      element = this._context.querySelector(this.target);
    }

    return (0, _domUtils.getElementRect)(element);
  };

  /**
   * Returns or sets the function used to calculate the interactable's
   * element's rectangle
   *
   * @param {function} [checker] A function which returns this Interactable's
   * bounding rectangle. See {@link Interactable.getRect}
   * @return {function | object} The checker function or this Interactable
   */


  Interactable.prototype.rectChecker = function rectChecker(checker) {
    if (is.func(checker)) {
      this.getRect = checker;

      return this;
    }

    if (checker === null) {
      delete this.options.getRect;

      return this;
    }

    return this.getRect;
  };

  Interactable.prototype._backCompatOption = function _backCompatOption(optionName, newValue) {
    if ((0, _domUtils.trySelector)(newValue) || is.object(newValue)) {
      this.options[optionName] = newValue;

      for (var _i = 0; _i < this._actions.names.length; _i++) {
        var _ref;

        _ref = this._actions.names[_i];
        var action = _ref;

        this.options[action][optionName] = newValue;
      }

      return this;
    }

    return this.options[optionName];
  };

  /**
   * Gets or sets the origin of the Interactable's element.  The x and y
   * of the origin will be subtracted from action event coordinates.
   *
   * @param {Element | object | string} [origin] An HTML or SVG Element whose
   * rect will be used, an object eg. { x: 0, y: 0 } or string 'parent', 'self'
   * or any CSS selector
   *
   * @return {object} The current origin or this Interactable
   */


  Interactable.prototype.origin = function origin(newValue) {
    return this._backCompatOption('origin', newValue);
  };

  /**
   * Returns or sets the mouse coordinate types used to calculate the
   * movement of the pointer.
   *
   * @param {string} [newValue] Use 'client' if you will be scrolling while
   * interacting; Use 'page' if you want autoScroll to work
   * @return {string | object} The current deltaSource or this Interactable
   */


  Interactable.prototype.deltaSource = function deltaSource(newValue) {
    if (newValue === 'page' || newValue === 'client') {
      this.options.deltaSource = newValue;

      return this;
    }

    return this.options.deltaSource;
  };

  /**
   * Gets the selector context Node of the Interactable. The default is
   * `window.document`.
   *
   * @return {Node} The context Node of this Interactable
   */


  Interactable.prototype.context = function context() {
    return this._context;
  };

  Interactable.prototype.inContext = function inContext(element) {
    return this._context === element.ownerDocument || (0, _domUtils.nodeContains)(this._context, element);
  };

  /**
   * Calls listeners for the given InteractEvent type bound globally
   * and directly to this Interactable
   *
   * @param {InteractEvent} iEvent The InteractEvent object to be fired on this
   * Interactable
   * @return {Interactable} this Interactable
   */


  Interactable.prototype.fire = function fire(iEvent) {
    this.events.fire(iEvent);

    return this;
  };

  Interactable.prototype._onOffMultiple = function _onOffMultiple(method, eventType, listener, options) {
    if (is.string(eventType) && eventType.search(' ') !== -1) {
      eventType = eventType.trim().split(/ +/);
    }

    if (is.array(eventType)) {
      for (var _i2 = 0; _i2 < eventType.length; _i2++) {
        var _ref2;

        _ref2 = eventType[_i2];
        var type = _ref2;

        this[method](type, listener, options);
      }

      return true;
    }

    if (is.object(eventType)) {
      for (var prop in eventType) {
        this[method](prop, eventType[prop], listener);
      }

      return true;
    }
  };

  /**
   * Binds a listener for an InteractEvent, pointerEvent or DOM event.
   *
   * @param {string | array | object} eventType  The types of events to listen
   * for
   * @param {function} listener   The function event (s)
   * @param {object | boolean} [options]    options object or useCapture flag
   * for addEventListener
   * @return {object} This Interactable
   */


  Interactable.prototype.on = function on(eventType, listener, options) {
    if (this._onOffMultiple('on', eventType, listener, options)) {
      return this;
    }

    if (eventType === 'wheel') {
      eventType = _browser.wheelEvent;
    }

    if (arr.contains(this._actions.eventTypes, eventType)) {
      this.events.on(eventType, listener);
    }
    // delegated event for selector
    else if (is.string(this.target)) {
        _events2.default.addDelegate(this.target, this._context, eventType, listener, options);
      } else {
        _events2.default.add(this.target, eventType, listener, options);
      }

    return this;
  };

  /**
   * Removes an InteractEvent, pointerEvent or DOM event listener
   *
   * @param {string | array | object} eventType The types of events that were
   * listened for
   * @param {function} listener The listener function to be removed
   * @param {object | boolean} [options] options object or useCapture flag for
   * removeEventListener
   * @return {object} This Interactable
   */


  Interactable.prototype.off = function off(eventType, listener, options) {
    if (this._onOffMultiple('off', eventType, listener, options)) {
      return this;
    }

    if (eventType === 'wheel') {
      eventType = _browser.wheelEvent;
    }

    // if it is an action event type
    if (arr.contains(this._actions.eventTypes, eventType)) {
      this.events.off(eventType, listener);
    }
    // delegated event
    else if (is.string(this.target)) {
        _events2.default.removeDelegate(this.target, this._context, eventType, listener, options);
      }
      // remove listener from this Interatable's element
      else {
          _events2.default.remove(this.target, eventType, listener, options);
        }

    return this;
  };

  /**
   * Reset the options of this Interactable
   *
   * @param {object} options The new settings to apply
   * @return {object} This Interactable
   */


  Interactable.prototype.set = function set(options) {
    if (!is.object(options)) {
      options = {};
    }

    this.options = (0, _clone2.default)(_defaultOptions2.default.base);

    for (var actionName in this._actions.methodDict) {
      var methodName = this._actions.methodDict[actionName];

      this.options[actionName] = {};
      this.setPerAction(actionName, (0, _extend2.default)((0, _extend2.default)({}, _defaultOptions2.default.perAction), _defaultOptions2.default[actionName]));

      this[methodName](options[actionName]);
    }

    for (var setting in options) {
      if (is.func(this[setting])) {
        this[setting](options[setting]);
      }
    }

    this._signals.fire('set', {
      options: options,
      interactable: this
    });

    return this;
  };

  /**
   * Remove this interactable from the list of interactables and remove it's
   * action capabilities and event listeners
   *
   * @return {interact}
   */


  Interactable.prototype.unset = function unset() {
    _events2.default.remove(this.target, 'all');

    if (is.string(this.target)) {
      // remove delegated events
      for (var type in _events2.default.delegatedEvents) {
        var delegated = _events2.default.delegatedEvents[type];

        if (delegated.selectors[0] === this.target && delegated.contexts[0] === this._context) {

          delegated.selectors.splice(0, 1);
          delegated.contexts.splice(0, 1);
          delegated.listeners.splice(0, 1);

          // remove the arrays if they are empty
          if (!delegated.selectors.length) {
            delegated[type] = null;
          }
        }

        _events2.default.remove(this._context, type, _events2.default.delegateListener);
        _events2.default.remove(this._context, type, _events2.default.delegateUseCapture, true);
      }
    } else {
      _events2.default.remove(this, 'all');
    }

    this._signals.fire('unset', { interactable: this });
  };

  return Interactable;
}();

exports.default = Interactable;

},{"./Eventable":83,"./defaultOptions":99,"./utils/arr":120,"./utils/browser":121,"./utils/clone":122,"./utils/domUtils":124,"./utils/events":125,"./utils/extend":126,"./utils/is":131,"./utils/window":139,"babel-runtime/helpers/classCallCheck":7}],86:[function(_dereq_,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _classCallCheck2 = _dereq_('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _InteractEvent = _dereq_('./InteractEvent');

var _InteractEvent2 = _interopRequireDefault(_InteractEvent);

var _utils = _dereq_('./utils');

var utils = _interopRequireWildcard(_utils);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var Interaction = function () {
  /** */
  function Interaction(_ref) {
    var pointerType = _ref.pointerType,
        signals = _ref.signals;
    (0, _classCallCheck3.default)(this, Interaction);

    this._signals = signals;

    this.target = null; // current interactable being interacted with
    this.element = null; // the target element of the interactable
    this.prepared = { // action that's ready to be fired on next move event
      name: null,
      axis: null,
      edges: null
    };

    // keep track of added pointers
    this.pointers = [/* { id, pointer, event, target, downTime }*/];

    // Previous native pointer move event coordinates
    this.prevCoords = {
      page: { x: 0, y: 0 },
      client: { x: 0, y: 0 },
      timeStamp: 0
    };
    // current native pointer move event coordinates
    this.curCoords = {
      page: { x: 0, y: 0 },
      client: { x: 0, y: 0 },
      timeStamp: 0
    };

    // Starting InteractEvent pointer coordinates
    this.startCoords = {
      page: { x: 0, y: 0 },
      client: { x: 0, y: 0 },
      timeStamp: 0
    };

    // Change in coordinates and time of the pointer
    this.pointerDelta = {
      page: { x: 0, y: 0, vx: 0, vy: 0, speed: 0 },
      client: { x: 0, y: 0, vx: 0, vy: 0, speed: 0 },
      timeStamp: 0
    };

    this.downEvent = null; // pointerdown/mousedown/touchstart event
    this.downPointer = {};

    this._latestPointer = {
      pointer: null,
      event: null,
      eventTarget: null
    };

    this.prevEvent = null; // previous action event

    this.pointerIsDown = false;
    this.pointerWasMoved = false;
    this._interacting = false;
    this._ending = false;

    this.pointerType = pointerType;

    this._signals.fire('new', this);
  }

  Interaction.prototype.pointerDown = function pointerDown(pointer, event, eventTarget) {
    var pointerIndex = this.updatePointer(pointer, event, eventTarget, true);

    this._signals.fire('down', {
      pointer: pointer,
      event: event,
      eventTarget: eventTarget,
      pointerIndex: pointerIndex,
      interaction: this
    });
  };

  /**
   * ```js
   * interact(target)
   *   .draggable({
   *     // disable the default drag start by down->move
   *     manualStart: true
   *   })
   *   // start dragging after the user holds the pointer down
   *   .on('hold', function (event) {
   *     var interaction = event.interaction;
   *
   *     if (!interaction.interacting()) {
   *       interaction.start({ name: 'drag' },
   *                         event.interactable,
   *                         event.currentTarget);
   *     }
   * });
   * ```
   *
   * Start an action with the given Interactable and Element as tartgets. The
   * action must be enabled for the target Interactable and an appropriate
   * number of pointers must be held down - 1 for drag/resize, 2 for gesture.
   *
   * Use it with `interactable.<action>able({ manualStart: false })` to always
   * [start actions manually](https://github.com/taye/interact.js/issues/114)
   *
   * @param {object} action   The action to be performed - drag, resize, etc.
   * @param {Interactable} target  The Interactable to target
   * @param {Element} element The DOM Element to target
   * @return {object} interact
   */


  Interaction.prototype.start = function start(action, target, element) {
    if (this.interacting() || !this.pointerIsDown || this.pointers.length < (action.name === 'gesture' ? 2 : 1)) {
      return;
    }

    utils.copyAction(this.prepared, action);

    this.target = target;
    this.element = element;
    this._interacting = this._doPhase({
      interaction: this,
      event: this.downEvent,
      phase: 'start'
    });
  };

  Interaction.prototype.pointerMove = function pointerMove(pointer, event, eventTarget) {
    if (!this.simulation) {
      this.updatePointer(pointer, event, eventTarget, false);
      utils.pointer.setCoords(this.curCoords, this.pointers.map(function (p) {
        return p.pointer;
      }));
    }

    var duplicateMove = this.curCoords.page.x === this.prevCoords.page.x && this.curCoords.page.y === this.prevCoords.page.y && this.curCoords.client.x === this.prevCoords.client.x && this.curCoords.client.y === this.prevCoords.client.y;

    var dx = void 0;
    var dy = void 0;

    // register movement greater than pointerMoveTolerance
    if (this.pointerIsDown && !this.pointerWasMoved) {
      dx = this.curCoords.client.x - this.startCoords.client.x;
      dy = this.curCoords.client.y - this.startCoords.client.y;

      this.pointerWasMoved = utils.hypot(dx, dy) > Interaction.pointerMoveTolerance;
    }

    var signalArg = {
      pointer: pointer,
      pointerIndex: this.getPointerIndex(pointer),
      event: event,
      eventTarget: eventTarget,
      dx: dx,
      dy: dy,
      duplicate: duplicateMove,
      interaction: this,
      interactingBeforeMove: this.interacting()
    };

    if (!duplicateMove) {
      // set pointer coordinate, time changes and speeds
      utils.pointer.setCoordDeltas(this.pointerDelta, this.prevCoords, this.curCoords);
    }

    this._signals.fire('move', signalArg);

    if (!duplicateMove) {
      // if interacting, fire an 'action-move' signal etc
      if (this.interacting()) {
        this.move(signalArg);
      }

      if (this.pointerWasMoved) {
        utils.pointer.copyCoords(this.prevCoords, this.curCoords);
      }
    }
  };

  /**
   * ```js
   * interact(target)
   *   .draggable(true)
   *   .on('dragmove', function (event) {
   *     if (someCondition) {
   *       // change the snap settings
   *       event.interactable.draggable({ snap: { targets: [] }});
   *       // fire another move event with re-calculated snap
   *       event.interaction.move();
   *     }
   *   });
   * ```
   *
   * Force a move of the current action at the same coordinates. Useful if
   * snap/restrict has been changed and you want a movement with the new
   * settings.
   */


  Interaction.prototype.move = function move(signalArg) {
    signalArg = utils.extend({
      pointer: this._latestPointer.pointer,
      event: this._latestPointer.event,
      eventTarget: this._latestPointer.eventTarget,
      interaction: this,
      noBefore: false
    }, signalArg || {});

    signalArg.phase = 'move';

    this._doPhase(signalArg);
  };

  // End interact move events and stop auto-scroll unless simulation is running


  Interaction.prototype.pointerUp = function pointerUp(pointer, event, eventTarget, curEventTarget) {
    var pointerIndex = this.getPointerIndex(pointer);

    this._signals.fire(/cancel$/i.test(event.type) ? 'cancel' : 'up', {
      pointer: pointer,
      pointerIndex: pointerIndex,
      event: event,
      eventTarget: eventTarget,
      curEventTarget: curEventTarget,
      interaction: this
    });

    if (!this.simulation) {
      this.end(event);
    }

    this.pointerIsDown = false;
    this.removePointer(pointer, event);
  };

  Interaction.prototype.documentBlur = function documentBlur(event) {
    this.end(event);
    this._signals.fire('blur', { event: event, interaction: this });
  };

  /**
   * ```js
   * interact(target)
   *   .draggable(true)
   *   .on('move', function (event) {
   *     if (event.pageX > 1000) {
   *       // end the current action
   *       event.interaction.end();
   *       // stop all further listeners from being called
   *       event.stopImmediatePropagation();
   *     }
   *   });
   * ```
   *
   * @param {PointerEvent} [event]
   */


  Interaction.prototype.end = function end(event) {
    this._ending = true;
    event = event || this._latestPointer.event;
    var endPhaseResult = void 0;

    if (this.interacting()) {
      endPhaseResult = this._doPhase({
        event: event,
        interaction: this,
        phase: 'end'
      });
    }

    this._ending = false;

    if (endPhaseResult === true) {
      this.stop();
    }
  };

  Interaction.prototype.currentAction = function currentAction() {
    return this._interacting ? this.prepared.name : null;
  };

  Interaction.prototype.interacting = function interacting() {
    return this._interacting;
  };

  /** */


  Interaction.prototype.stop = function stop() {
    this._signals.fire('stop', { interaction: this });

    this.target = this.element = null;

    this._interacting = false;
    this.prepared.name = this.prevEvent = null;
  };

  Interaction.prototype.getPointerIndex = function getPointerIndex(pointer) {
    var pointerId = utils.pointer.getPointerId(pointer);

    // mouse and pen interactions may have only one pointer
    return this.pointerType === 'mouse' || this.pointerType === 'pen' ? 0 : utils.arr.findIndex(this.pointers, function (curPointer) {
      return curPointer.id === pointerId;
    });
  };

  Interaction.prototype.getPointerInfo = function getPointerInfo(pointer) {
    return this.pointers[this.getPointerIndex(pointer)];
  };

  Interaction.prototype.updatePointer = function updatePointer(pointer, event, eventTarget) {
    var down = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : event && /(down|start)$/i.test(event.type);

    var id = utils.pointer.getPointerId(pointer);
    var pointerIndex = this.getPointerIndex(pointer);
    var pointerInfo = this.pointers[pointerIndex];

    if (!pointerInfo) {
      pointerInfo = {
        id: id,
        pointer: pointer,
        event: event,
        downTime: null,
        downTarget: null
      };

      pointerIndex = this.pointers.length;
      this.pointers.push(pointerInfo);
    } else {
      pointerInfo.pointer = pointer;
    }

    if (down) {
      this.pointerIsDown = true;

      if (!this.interacting()) {
        utils.pointer.setCoords(this.startCoords, this.pointers.map(function (p) {
          return p.pointer;
        }));

        utils.pointer.copyCoords(this.curCoords, this.startCoords);
        utils.pointer.copyCoords(this.prevCoords, this.startCoords);
        utils.pointer.pointerExtend(this.downPointer, pointer);

        this.downEvent = event;
        pointerInfo.downTime = this.curCoords.timeStamp;
        pointerInfo.downTarget = eventTarget;

        this.pointerWasMoved = false;
      }

      this._signals.fire('update-pointer-down', {
        pointer: pointer,
        event: event,
        eventTarget: eventTarget,
        down: down,
        pointerInfo: pointerInfo,
        pointerIndex: pointerIndex,
        interaction: this
      });
    }

    this._updateLatestPointer(pointer, event, eventTarget);

    return pointerIndex;
  };

  Interaction.prototype.removePointer = function removePointer(pointer, event) {
    var pointerIndex = this.getPointerIndex(pointer);

    if (pointerIndex === -1) {
      return;
    }

    var pointerInfo = this.pointers[pointerIndex];

    this._signals.fire('remove-pointer', {
      pointer: pointer,
      event: event,
      pointerIndex: pointerIndex,
      pointerInfo: pointerInfo,
      interaction: this
    });

    this.pointers.splice(pointerIndex, 1);
  };

  Interaction.prototype._updateLatestPointer = function _updateLatestPointer(pointer, event, eventTarget) {
    this._latestPointer.pointer = pointer;
    this._latestPointer.event = event;
    this._latestPointer.eventTarget = eventTarget;
  };

  Interaction.prototype._createPreparedEvent = function _createPreparedEvent(event, phase, preEnd, type) {
    var actionName = this.prepared.name;

    return new _InteractEvent2.default(this, event, actionName, phase, this.element, null, preEnd, type);
  };

  Interaction.prototype._fireEvent = function _fireEvent(iEvent) {
    this.target.fire(iEvent);

    if (!this.prevEvent || iEvent.timeStamp >= this.prevEvent.timeStamp) {
      this.prevEvent = iEvent;
    }
  };

  Interaction.prototype._doPhase = function _doPhase(signalArg) {
    var event = signalArg.event,
        phase = signalArg.phase,
        preEnd = signalArg.preEnd,
        type = signalArg.type;


    if (!signalArg.noBefore) {
      var beforeResult = this._signals.fire('before-action-' + phase, signalArg);

      if (beforeResult === false) {
        return false;
      }
    }

    var iEvent = signalArg.iEvent = this._createPreparedEvent(event, phase, preEnd, type);

    this._signals.fire('action-' + phase, signalArg);

    this._fireEvent(iEvent);

    this._signals.fire('after-action-' + phase, signalArg);

    return true;
  };

  return Interaction;
}();

Interaction.pointerMoveTolerance = 1;

/**
 * @alias Interaction.prototype.move
 */
Interaction.prototype.doMove = utils.warnOnce(function (signalArg) {
  this.move(signalArg);
}, 'The interaction.doMove() method has been renamed to interaction.move()');

exports.default = Interaction;

},{"./InteractEvent":84,"./utils":129,"babel-runtime/helpers/classCallCheck":7}],87:[function(_dereq_,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _is = _dereq_('../utils/is');

var is = _interopRequireWildcard(_is);

var _arr = _dereq_('../utils/arr');

var arr = _interopRequireWildcard(_arr);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function init(scope) {
  var actions = scope.actions,
      Interactable = scope.Interactable,
      interactions = scope.interactions,
      defaults = scope.defaults;


  interactions.signals.on('before-action-move', beforeMove);
  interactions.signals.on('action-resume', beforeMove);

  // dragmove
  interactions.signals.on('action-move', move);

  Interactable.prototype.draggable = drag.draggable;

  actions.drag = drag;
  actions.names.push('drag');
  arr.merge(actions.eventTypes, ['dragstart', 'dragmove', 'draginertiastart', 'dragresume', 'dragend']);
  actions.methodDict.drag = 'draggable';

  defaults.drag = drag.defaults;
}

function beforeMove(_ref) {
  var interaction = _ref.interaction;

  if (interaction.prepared.name !== 'drag') {
    return;
  }

  var axis = interaction.prepared.axis;

  if (axis === 'x') {
    interaction.curCoords.page.y = interaction.startCoords.page.y;
    interaction.curCoords.client.y = interaction.startCoords.client.y;

    interaction.pointerDelta.page.speed = Math.abs(interaction.pointerDelta.page.vx);
    interaction.pointerDelta.client.speed = Math.abs(interaction.pointerDelta.client.vx);
    interaction.pointerDelta.client.vy = 0;
    interaction.pointerDelta.page.vy = 0;
  } else if (axis === 'y') {
    interaction.curCoords.page.x = interaction.startCoords.page.x;
    interaction.curCoords.client.x = interaction.startCoords.client.x;

    interaction.pointerDelta.page.speed = Math.abs(interaction.pointerDelta.page.vy);
    interaction.pointerDelta.client.speed = Math.abs(interaction.pointerDelta.client.vy);
    interaction.pointerDelta.client.vx = 0;
    interaction.pointerDelta.page.vx = 0;
  }
}

function move(_ref2) {
  var iEvent = _ref2.iEvent,
      interaction = _ref2.interaction;

  if (interaction.prepared.name !== 'drag') {
    return;
  }

  var axis = interaction.prepared.axis;

  if (axis === 'x' || axis === 'y') {
    var opposite = axis === 'x' ? 'y' : 'x';

    iEvent.page[opposite] = interaction.startCoords.page[opposite];
    iEvent.client[opposite] = interaction.startCoords.client[opposite];
    iEvent.delta[opposite] = 0;
  }
}

/**
 * ```js
 * interact(element).draggable({
 *     onstart: function (event) {},
 *     onmove : function (event) {},
 *     onend  : function (event) {},
 *
 *     // the axis in which the first movement must be
 *     // for the drag sequence to start
 *     // 'xy' by default - any direction
 *     startAxis: 'x' || 'y' || 'xy',
 *
 *     // 'xy' by default - don't restrict to one axis (move in any direction)
 *     // 'x' or 'y' to restrict movement to either axis
 *     // 'start' to restrict movement to the axis the drag started in
 *     lockAxis: 'x' || 'y' || 'xy' || 'start',
 *
 *     // max number of drags that can happen concurrently
 *     // with elements of this Interactable. Infinity by default
 *     max: Infinity,
 *
 *     // max number of drags that can target the same element+Interactable
 *     // 1 by default
 *     maxPerElement: 2
 * });
 *
 * var isDraggable = interact('element').draggable(); // true
 * ```
 *
 * Get or set whether drag actions can be performed on the target
 *
 * @alias Interactable.prototype.draggable
 *
 * @param {boolean | object} [options] true/false or An object with event
 * listeners to be fired on drag events (object makes the Interactable
 * draggable)
 * @return {boolean | Interactable} boolean indicating if this can be the
 * target of drag events, or this Interctable
 */
function draggable(options) {
  if (is.object(options)) {
    this.options.drag.enabled = options.enabled === false ? false : true;
    this.setPerAction('drag', options);
    this.setOnEvents('drag', options);

    if (/^(xy|x|y|start)$/.test(options.lockAxis)) {
      this.options.drag.lockAxis = options.lockAxis;
    }
    if (/^(xy|x|y)$/.test(options.startAxis)) {
      this.options.drag.startAxis = options.startAxis;
    }

    return this;
  }

  if (is.bool(options)) {
    this.options.drag.enabled = options;

    if (!options) {
      this.ondragstart = this.ondragstart = this.ondragend = null;
    }

    return this;
  }

  return this.options.drag;
}

var drag = {
  init: init,
  draggable: draggable,
  beforeMove: beforeMove,
  move: move,
  defaults: {
    startAxis: 'xy',
    lockAxis: 'xy'
  },

  checker: function checker(pointer, event, interactable) {
    var dragOptions = interactable.options.drag;

    return dragOptions.enabled ? {
      name: 'drag',
      axis: dragOptions.lockAxis === 'start' ? dragOptions.startAxis : dragOptions.lockAxis
    } : null;
  },
  getCursor: function getCursor() {
    return 'move';
  }
};

exports.default = drag;

},{"../utils/arr":120,"../utils/is":131}],88:[function(_dereq_,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _classCallCheck2 = _dereq_('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var DropEvent = function DropEvent(dropStatus, dragEvent, type) {
  (0, _classCallCheck3.default)(this, DropEvent);

  var _ref = type === 'deactivate' ? { element: null, dropzone: null } : type === 'dragleave' ? dropStatus.prev : dropStatus.cur,
      element = _ref.element,
      dropzone = _ref.dropzone;

  this.type = type;
  this.target = element;
  this.currentTarget = element;
  this.dropzone = dropzone;
  this.dragEvent = dragEvent;
  this.relatedTarget = dragEvent.target;
  this.interaction = dragEvent.interaction;
  this.draggable = dragEvent.interactable;
  this.timeStamp = dragEvent.timeStamp;
};

exports.default = DropEvent;

},{"babel-runtime/helpers/classCallCheck":7}],89:[function(_dereq_,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _utils = _dereq_('../../utils');

var utils = _interopRequireWildcard(_utils);

var _DropEvent = _dereq_('./DropEvent');

var _DropEvent2 = _interopRequireDefault(_DropEvent);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function init(scope) {
  var actions = scope.actions,
      interact = scope.interact,
      Interactable = scope.Interactable,
      interactions = scope.interactions,
      defaults = scope.defaults;


  var dynamicDrop = false;

  interactions.signals.on('after-action-start', function (_ref) {
    var interaction = _ref.interaction,
        event = _ref.event,
        dragEvent = _ref.iEvent;

    if (interaction.prepared.name !== 'drag') {
      return;
    }

    var dropStatus = interaction.dropStatus;

    // reset active dropzones

    dropStatus.activeDrops = null;
    dropStatus.events = null;

    if (!interaction.dynamicDrop) {
      dropStatus.activeDrops = getActiveDrops(scope, interaction.element);
    }

    var dropEvents = getDropEvents(interaction, event, dragEvent);

    if (dropEvents.activate) {
      fireActivationEvents(dropStatus.activeDrops, dropEvents.activate);
    }
  });

  interactions.signals.on('action-move', function (arg) {
    return onEventCreated(arg, scope, dynamicDrop);
  });
  interactions.signals.on('action-end', function (arg) {
    return onEventCreated(arg, scope, dynamicDrop);
  });

  interactions.signals.on('after-action-move', function (_ref2) {
    var interaction = _ref2.interaction;

    if (interaction.prepared.name !== 'drag') {
      return;
    }

    fireDropEvents(interaction, interaction.dropStatus.events);
    interaction.dropStatus.events = {};
  });

  interactions.signals.on('after-action-end', function (_ref3) {
    var interaction = _ref3.interaction;

    if (interaction.prepared.name === 'drag') {
      fireDropEvents(interaction, interaction.dropStatus.events);
    }
  });

  interactions.signals.on('stop', function (_ref4) {
    var interaction = _ref4.interaction;

    interaction.dropStatus.activeDrops = null;
    interaction.dropStatus.events = null;
  });

  /**
   * ```js
   * interact(target)
   * .dropChecker(function(dragEvent,         // related dragmove or dragend event
   *                       event,             // TouchEvent/PointerEvent/MouseEvent
   *                       dropped,           // bool result of the default checker
   *                       dropzone,          // dropzone Interactable
   *                       dropElement,       // dropzone elemnt
   *                       draggable,         // draggable Interactable
   *                       draggableElement) {// draggable element
   *
   *   return dropped && event.target.hasAttribute('allow-drop');
   * }
   * ```
   *
   * ```js
   * interact('.drop').dropzone({
   *   accept: '.can-drop' || document.getElementById('single-drop'),
   *   overlap: 'pointer' || 'center' || zeroToOne
   * }
   * ```
   *
   * Returns or sets whether draggables can be dropped onto this target to
   * trigger drop events
   *
   * Dropzones can receive the following events:
   *  - `dropactivate` and `dropdeactivate` when an acceptable drag starts and ends
   *  - `dragenter` and `dragleave` when a draggable enters and leaves the dropzone
   *  - `dragmove` when a draggable that has entered the dropzone is moved
   *  - `drop` when a draggable is dropped into this dropzone
   *
   * Use the `accept` option to allow only elements that match the given CSS
   * selector or element. The value can be:
   *
   *  - **an Element** - only that element can be dropped into this dropzone.
   *  - **a string**, - the element being dragged must match it as a CSS selector.
   *  - **`null`** - accept options is cleared - it accepts any element.
   *
   * Use the `overlap` option to set how drops are checked for. The allowed
   * values are:
   *
   *   - `'pointer'`, the pointer must be over the dropzone (default)
   *   - `'center'`, the draggable element's center must be over the dropzone
   *   - a number from 0-1 which is the `(intersection area) / (draggable area)`.
   *   e.g. `0.5` for drop to happen when half of the area of the draggable is
   *   over the dropzone
   *
   * Use the `checker` option to specify a function to check if a dragged element
   * is over this Interactable.
   *
   * @param {boolean | object | null} [options] The new options to be set.
   * @return {boolean | Interactable} The current setting or this Interactable
   */
  Interactable.prototype.dropzone = function (options) {
    if (utils.is.object(options)) {
      this.options.drop.enabled = options.enabled === false ? false : true;

      if (utils.is.func(options.ondrop)) {
        this.events.ondrop = options.ondrop;
      }
      if (utils.is.func(options.ondropactivate)) {
        this.events.ondropactivate = options.ondropactivate;
      }
      if (utils.is.func(options.ondropdeactivate)) {
        this.events.ondropdeactivate = options.ondropdeactivate;
      }
      if (utils.is.func(options.ondragenter)) {
        this.events.ondragenter = options.ondragenter;
      }
      if (utils.is.func(options.ondragleave)) {
        this.events.ondragleave = options.ondragleave;
      }
      if (utils.is.func(options.ondropmove)) {
        this.events.ondropmove = options.ondropmove;
      }

      if (/^(pointer|center)$/.test(options.overlap)) {
        this.options.drop.overlap = options.overlap;
      } else if (utils.is.number(options.overlap)) {
        this.options.drop.overlap = Math.max(Math.min(1, options.overlap), 0);
      }
      if ('accept' in options) {
        this.options.drop.accept = options.accept;
      }
      if ('checker' in options) {
        this.options.drop.checker = options.checker;
      }

      return this;
    }

    if (utils.is.bool(options)) {
      this.options.drop.enabled = options;

      if (!options) {
        this.ondragenter = this.ondragleave = this.ondrop = this.ondropactivate = this.ondropdeactivate = null;
      }

      return this;
    }

    return this.options.drop;
  };

  Interactable.prototype.dropCheck = function (dragEvent, event, draggable, draggableElement, dropElement, rect) {
    var dropped = false;

    // if the dropzone has no rect (eg. display: none)
    // call the custom dropChecker or just return false
    if (!(rect = rect || this.getRect(dropElement))) {
      return this.options.drop.checker ? this.options.drop.checker(dragEvent, event, dropped, this, dropElement, draggable, draggableElement) : false;
    }

    var dropOverlap = this.options.drop.overlap;

    if (dropOverlap === 'pointer') {
      var origin = utils.getOriginXY(draggable, draggableElement, 'drag');
      var page = utils.pointer.getPageXY(dragEvent);

      page.x += origin.x;
      page.y += origin.y;

      var horizontal = page.x > rect.left && page.x < rect.right;
      var vertical = page.y > rect.top && page.y < rect.bottom;

      dropped = horizontal && vertical;
    }

    var dragRect = draggable.getRect(draggableElement);

    if (dragRect && dropOverlap === 'center') {
      var cx = dragRect.left + dragRect.width / 2;
      var cy = dragRect.top + dragRect.height / 2;

      dropped = cx >= rect.left && cx <= rect.right && cy >= rect.top && cy <= rect.bottom;
    }

    if (dragRect && utils.is.number(dropOverlap)) {
      var overlapArea = Math.max(0, Math.min(rect.right, dragRect.right) - Math.max(rect.left, dragRect.left)) * Math.max(0, Math.min(rect.bottom, dragRect.bottom) - Math.max(rect.top, dragRect.top));

      var overlapRatio = overlapArea / (dragRect.width * dragRect.height);

      dropped = overlapRatio >= dropOverlap;
    }

    if (this.options.drop.checker) {
      dropped = this.options.drop.checker(dragEvent, event, dropped, this, dropElement, draggable, draggableElement);
    }

    return dropped;
  };

  interactions.signals.on('new', function (interaction) {
    interaction.dropStatus = {
      cur: {
        dropzone: null, // the dropzone a drag target might be dropped into
        element: null // the element at the time of checking
      },
      prev: {
        dropzone: null, // the dropzone that was recently dragged away from
        element: null // the element at the time of checking
      },
      events: null, // the drop events related to the current drag event
      activeDrops: null // an array of { dropzone, element, rect }
    };
  });

  interactions.signals.on('stop', function (_ref5) {
    var dropStatus = _ref5.interaction.dropStatus;

    dropStatus.cur.dropzone = dropStatus.cur.element = dropStatus.prev.dropzone = dropStatus.prev.element = null;
  });

  /**
   * Returns or sets whether the dimensions of dropzone elements are calculated
   * on every dragmove or only on dragstart for the default dropChecker
   *
   * @param {boolean} [newValue] True to check on each move. False to check only
   * before start
   * @return {boolean | interact} The current setting or interact
   */
  interact.dynamicDrop = function (newValue) {
    if (utils.is.bool(newValue)) {
      //if (dragging && dynamicDrop !== newValue && !newValue) {
      //  calcRects(dropzones);
      //}

      dynamicDrop = newValue;

      return interact;
    }
    return dynamicDrop;
  };

  utils.arr.merge(actions.eventTypes, ['dragenter', 'dragleave', 'dropactivate', 'dropdeactivate', 'dropmove', 'drop']);
  actions.methodDict.drop = 'dropzone';

  defaults.drop = drop.defaults;
}

function collectDrops(_ref6, draggableElement) {
  var interactables = _ref6.interactables;

  var drops = [];

  // collect all dropzones and their elements which qualify for a drop
  for (var _i = 0; _i < interactables.list.length; _i++) {
    var _ref7;

    _ref7 = interactables.list[_i];
    var dropzone = _ref7;

    if (!dropzone.options.drop.enabled) {
      continue;
    }

    var accept = dropzone.options.drop.accept;

    // test the draggable draggableElement against the dropzone's accept setting
    if (utils.is.element(accept) && accept !== draggableElement || utils.is.string(accept) && !utils.dom.matchesSelector(draggableElement, accept)) {

      continue;
    }

    // query for new elements if necessary
    var dropElements = utils.is.string(dropzone.target) ? dropzone._context.querySelectorAll(dropzone.target) : [dropzone.target];

    for (var _i2 = 0; _i2 < dropElements.length; _i2++) {
      var _ref8;

      _ref8 = dropElements[_i2];
      var dropzoneElement = _ref8;

      if (dropzoneElement !== draggableElement) {
        drops.push({
          dropzone: dropzone,
          element: dropzoneElement
        });
      }
    }
  }

  return drops;
}

function fireActivationEvents(activeDrops, event) {
  var prevElement = void 0;

  // loop through all active dropzones and trigger event
  for (var _i3 = 0; _i3 < activeDrops.length; _i3++) {
    var _ref10;

    _ref10 = activeDrops[_i3];
    var _ref9 = _ref10;
    var dropzone = _ref9.dropzone;
    var element = _ref9.element;


    // prevent trigger of duplicate events on same element
    if (element !== prevElement) {
      // set current element as event target
      event.target = element;
      dropzone.fire(event);
    }
    prevElement = element;
  }
}

// return a new array of possible drops. getActiveDrops should always be
// called when a drag has just started or a drag event happens while
// dynamicDrop is true
function getActiveDrops(scope, dragElement) {
  // get dropzones and their elements that could receive the draggable
  var activeDrops = collectDrops(scope, dragElement);

  for (var _i4 = 0; _i4 < activeDrops.length; _i4++) {
    var _ref11;

    _ref11 = activeDrops[_i4];
    var activeDrop = _ref11;

    activeDrop.rect = activeDrop.dropzone.getRect(activeDrop.element);
  }

  return activeDrops;
}

function getDrop(_ref12, dragEvent, pointerEvent) {
  var dropStatus = _ref12.dropStatus,
      draggable = _ref12.target,
      dragElement = _ref12.element;

  var validDrops = [];

  // collect all dropzones and their elements which qualify for a drop
  for (var _i5 = 0; _i5 < dropStatus.activeDrops.length; _i5++) {
    var _ref14;

    _ref14 = dropStatus.activeDrops[_i5];
    var _ref13 = _ref14;
    var dropzone = _ref13.dropzone;
    var dropzoneElement = _ref13.element;
    var rect = _ref13.rect;

    validDrops.push(dropzone.dropCheck(dragEvent, pointerEvent, draggable, dragElement, dropzoneElement, rect) ? dropzoneElement : null);
  }

  // get the most appropriate dropzone based on DOM depth and order
  var dropIndex = utils.dom.indexOfDeepestElement(validDrops);

  return dropStatus.activeDrops[dropIndex] || null;
}

function getDropEvents(interaction, pointerEvent, dragEvent) {
  var dropStatus = interaction.dropStatus;

  var dropEvents = {
    enter: null,
    leave: null,
    activate: null,
    deactivate: null,
    move: null,
    drop: null
  };

  if (dropStatus.cur.element !== dropStatus.prev.element) {
    // if there was a previous dropzone, create a dragleave event
    if (dropStatus.prev.dropzone) {
      dropEvents.leave = new _DropEvent2.default(dropStatus, dragEvent, 'dragleave');

      dragEvent.dragLeave = dropEvents.leave.target = dropStatus.prev.element;
      dragEvent.prevDropzone = dropEvents.leave.dropzone = dropStatus.prev.dropzone;
    }
    // if dropzone is not null, create a dragenter event
    if (dropStatus.cur.dropzone) {
      dropEvents.enter = new _DropEvent2.default(dropStatus, dragEvent, 'dragenter');

      dragEvent.dragEnter = dropStatus.cur.element;
      dragEvent.dropzone = dropStatus.cur.dropzone;
    }
  }

  if (dragEvent.type === 'dragend' && dropStatus.cur.dropzone) {
    dropEvents.drop = new _DropEvent2.default(dropStatus, dragEvent, 'drop');

    dragEvent.dropzone = dropStatus.cur.dropzone;
    dragEvent.relatedTarget = dropStatus.cur.element;
  }
  if (dragEvent.type === 'dragstart') {
    dropEvents.activate = new _DropEvent2.default(dropStatus, dragEvent, 'dropactivate');

    dropEvents.activate.target = null;
    dropEvents.activate.dropzone = null;
  }
  if (dragEvent.type === 'dragend') {
    dropEvents.deactivate = new _DropEvent2.default(dropStatus, dragEvent, 'dropdeactivate');

    dropEvents.deactivate.target = null;
    dropEvents.deactivate.dropzone = null;
  }
  if (dragEvent.type === 'dragmove' && dropStatus.cur.dropzone) {
    dropEvents.move = new _DropEvent2.default(dropStatus, dragEvent, 'dropmove');

    dropEvents.move.dragmove = dragEvent;
    dragEvent.dropzone = dropStatus.cur.dropzone;
  }

  return dropEvents;
}

function fireDropEvents(interaction, events) {
  var dropStatus = interaction.dropStatus;
  var activeDrops = dropStatus.activeDrops,
      cur = dropStatus.cur,
      prev = dropStatus.prev;


  if (events.leave) {
    prev.dropzone.fire(events.leave);
  }
  if (events.move) {
    cur.dropzone.fire(events.move);
  }
  if (events.enter) {
    cur.dropzone.fire(events.enter);
  }
  if (events.drop) {
    cur.dropzone.fire(events.drop);
  }

  if (events.deactivate) {
    fireActivationEvents(activeDrops, events.deactivate);
  }

  dropStatus.prev.dropzone = cur.dropzone;
  dropStatus.prev.element = cur.element;
}

function onEventCreated(_ref15, scope, dynamicDrop) {
  var interaction = _ref15.interaction,
      iEvent = _ref15.iEvent,
      event = _ref15.event;

  if (iEvent.type !== 'dragmove' && iEvent.type !== 'dragend') {
    return;
  }

  var dropStatus = interaction.dropStatus;


  if (dynamicDrop) {
    dropStatus.activeDrops = getActiveDrops(scope, interaction.target, interaction.element);
  }

  var dragEvent = iEvent;
  var dropResult = getDrop(interaction, dragEvent, event);

  dropStatus.cur.dropzone = dropResult && dropResult.dropzone;
  dropStatus.cur.element = dropResult && dropResult.element;

  dropStatus.events = getDropEvents(interaction, event, dragEvent);
}

var drop = {
  init: init,
  getActiveDrops: getActiveDrops,
  getDrop: getDrop,
  getDropEvents: getDropEvents,
  fireDropEvents: fireDropEvents,
  defaults: {
    enabled: false,
    accept: null,
    overlap: 'pointer'
  }
};

exports.default = drop;

},{"../../utils":129,"./DropEvent":88}],90:[function(_dereq_,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _utils = _dereq_('../utils');

var utils = _interopRequireWildcard(_utils);

var _InteractEvent = _dereq_('../InteractEvent');

var _InteractEvent2 = _interopRequireDefault(_InteractEvent);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function init(scope) {
  var actions = scope.actions,
      Interactable = scope.Interactable,
      interactions = scope.interactions,
      defaults = scope.defaults;


  var gesture = {
    defaults: {},

    checker: function checker(pointer, event, interactable, element, interaction) {
      if (interaction.pointers.length >= 2) {
        return { name: 'gesture' };
      }

      return null;
    },

    getCursor: function getCursor() {
      return '';
    }
  };

  /**
   * ```js
   * interact(element).gesturable({
   *     onstart: function (event) {},
   *     onmove : function (event) {},
   *     onend  : function (event) {},
   *
   *     // limit multiple gestures.
   *     // See the explanation in {@link Interactable.draggable} example
   *     max: Infinity,
   *     maxPerElement: 1,
   * });
   *
   * var isGestureable = interact(element).gesturable();
   * ```
   *
   * Gets or sets whether multitouch gestures can be performed on the target
   *
   * @param {boolean | object} [options] true/false or An object with event
   * listeners to be fired on gesture events (makes the Interactable gesturable)
   * @return {boolean | Interactable} A boolean indicating if this can be the
   * target of gesture events, or this Interactable
   */
  Interactable.prototype.gesturable = function (options) {
    if (utils.is.object(options)) {
      this.options.gesture.enabled = options.enabled === false ? false : true;
      this.setPerAction('gesture', options);
      this.setOnEvents('gesture', options);

      return this;
    }

    if (utils.is.bool(options)) {
      this.options.gesture.enabled = options;

      if (!options) {
        this.ongesturestart = this.ongesturestart = this.ongestureend = null;
      }

      return this;
    }

    return this.options.gesture;
  };

  interactions.signals.on('action-start', start);
  interactions.signals.on('action-move', move);

  interactions.signals.on('action-start', updateGestureProps);
  interactions.signals.on('action-move', updateGestureProps);
  interactions.signals.on('action-end', updateGestureProps);

  interactions.signals.on('new', function (interaction) {
    interaction.gesture = {
      start: { x: 0, y: 0 },

      startDistance: 0, // distance between two touches of touchStart
      prevDistance: 0,
      distance: 0,

      scale: 1, // gesture.distance / gesture.startDistance

      startAngle: 0, // angle of line joining two touches
      prevAngle: 0 // angle of the previous gesture event
    };
  });

  actions.gesture = gesture;
  actions.names.push('gesture');
  utils.arr.merge(actions.eventTypes, ['gesturestart', 'gesturemove', 'gestureend']);
  actions.methodDict.gesture = 'gesturable';

  defaults.gesture = gesture.defaults;
}

function start(_ref) {
  var iEvent = _ref.iEvent,
      interaction = _ref.interaction;

  if (interaction.prepared.name !== 'gesture') {
    return;
  }

  iEvent.ds = 0;

  interaction.gesture.startDistance = interaction.gesture.prevDistance = iEvent.distance;
  interaction.gesture.startAngle = interaction.gesture.prevAngle = iEvent.angle;
  interaction.gesture.scale = 1;
}

function move(_ref2) {
  var iEvent = _ref2.iEvent,
      interaction = _ref2.interaction;

  if (interaction.prepared.name !== 'gesture') {
    return;
  }

  iEvent.ds = iEvent.scale - interaction.gesture.scale;

  interaction.target.fire(iEvent);

  interaction.gesture.prevAngle = iEvent.angle;
  interaction.gesture.prevDistance = iEvent.distance;

  if (iEvent.scale !== Infinity && iEvent.scale !== null && iEvent.scale !== undefined && !isNaN(iEvent.scale)) {

    interaction.gesture.scale = iEvent.scale;
  }
}

function updateGestureProps(_ref3) {
  var interaction = _ref3.interaction,
      iEvent = _ref3.iEvent,
      event = _ref3.event,
      phase = _ref3.phase,
      deltaSource = _ref3.deltaSource;

  if (interaction.prepared.name !== 'gesture') {
    return;
  }

  var pointers = interaction.pointers;
  var starting = phase === 'start';
  var ending = phase === 'end';

  iEvent.touches = [pointers[0].pointer, pointers[1].pointer];

  if (starting) {
    iEvent.distance = utils.pointer.touchDistance(pointers, deltaSource);
    iEvent.box = utils.pointer.touchBBox(pointers);
    iEvent.scale = 1;
    iEvent.ds = 0;
    iEvent.angle = utils.pointer.touchAngle(pointers, undefined, deltaSource);
    iEvent.da = 0;
  } else if (ending || event instanceof _InteractEvent2.default) {
    iEvent.distance = interaction.prevEvent.distance;
    iEvent.box = interaction.prevEvent.box;
    iEvent.scale = interaction.prevEvent.scale;
    iEvent.ds = iEvent.scale - 1;
    iEvent.angle = interaction.prevEvent.angle;
    iEvent.da = iEvent.angle - interaction.gesture.startAngle;
  } else {
    iEvent.distance = utils.pointer.touchDistance(pointers, deltaSource);
    iEvent.box = utils.pointer.touchBBox(pointers);
    iEvent.scale = iEvent.distance / interaction.gesture.startDistance;
    iEvent.angle = utils.pointer.touchAngle(pointers, interaction.gesture.prevAngle, deltaSource);

    iEvent.ds = iEvent.scale - interaction.gesture.prevScale;
    iEvent.da = iEvent.angle - interaction.gesture.prevAngle;
  }
}

exports.default = { init: init };

},{"../InteractEvent":84,"../utils":129}],91:[function(_dereq_,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.init = exports.drop = exports.drag = exports.resize = exports.gesture = undefined;

var _gesture = _dereq_('./gesture');

var _gesture2 = _interopRequireDefault(_gesture);

var _resize = _dereq_('./resize');

var _resize2 = _interopRequireDefault(_resize);

var _drag = _dereq_('./drag');

var _drag2 = _interopRequireDefault(_drag);

var _drop = _dereq_('./drop');

var _drop2 = _interopRequireDefault(_drop);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function init(scope) {
  _gesture2.default.init(scope);
  _resize2.default.init(scope);
  _drag2.default.init(scope);
  _drop2.default.init(scope);
}

exports.gesture = _gesture2.default;
exports.resize = _resize2.default;
exports.drag = _drag2.default;
exports.drop = _drop2.default;
exports.init = init;

},{"./drag":87,"./drop":89,"./gesture":90,"./resize":92}],92:[function(_dereq_,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _utils = _dereq_('../utils');

var utils = _interopRequireWildcard(_utils);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function init(scope) {
  var actions = scope.actions,
      browser = scope.browser,
      Interactable = scope.Interactable,
      interactions = scope.interactions,
      defaults = scope.defaults;

  // Less Precision with touch input

  var defaultMargin = browser.supportsTouch || browser.supportsPointerEvent ? 20 : 10;

  var resize = {
    defaults: {
      square: false,
      preserveAspectRatio: false,
      axis: 'xy',

      // use default margin
      margin: NaN,

      // object with props left, right, top, bottom which are
      // true/false values to resize when the pointer is over that edge,
      // CSS selectors to match the handles for each direction
      // or the Elements for each handle
      edges: null,

      // a value of 'none' will limit the resize rect to a minimum of 0x0
      // 'negate' will alow the rect to have negative width/height
      // 'reposition' will keep the width/height positive by swapping
      // the top and bottom edges and/or swapping the left and right edges
      invert: 'none'
    },

    checker: function checker(pointer, event, interactable, element, interaction, rect) {
      if (!rect) {
        return null;
      }

      var page = utils.extend({}, interaction.curCoords.page);
      var options = interactable.options;

      if (options.resize.enabled) {
        var resizeOptions = options.resize;
        var resizeEdges = { left: false, right: false, top: false, bottom: false };

        // if using resize.edges
        if (utils.is.object(resizeOptions.edges)) {
          for (var edge in resizeEdges) {
            resizeEdges[edge] = checkResizeEdge(edge, resizeOptions.edges[edge], page, interaction._eventTarget, element, rect, resizeOptions.margin || defaultMargin);
          }

          resizeEdges.left = resizeEdges.left && !resizeEdges.right;
          resizeEdges.top = resizeEdges.top && !resizeEdges.bottom;

          if (resizeEdges.left || resizeEdges.right || resizeEdges.top || resizeEdges.bottom) {
            return {
              name: 'resize',
              edges: resizeEdges
            };
          }
        } else {
          var right = options.resize.axis !== 'y' && page.x > rect.right - defaultMargin;
          var bottom = options.resize.axis !== 'x' && page.y > rect.bottom - defaultMargin;

          if (right || bottom) {
            return {
              name: 'resize',
              axes: (right ? 'x' : '') + (bottom ? 'y' : '')
            };
          }
        }
      }

      return null;
    },

    cursors: browser.isIe9 ? {
      x: 'e-resize',
      y: 's-resize',
      xy: 'se-resize',

      top: 'n-resize',
      left: 'w-resize',
      bottom: 's-resize',
      right: 'e-resize',
      topleft: 'se-resize',
      bottomright: 'se-resize',
      topright: 'ne-resize',
      bottomleft: 'ne-resize'
    } : {
      x: 'ew-resize',
      y: 'ns-resize',
      xy: 'nwse-resize',

      top: 'ns-resize',
      left: 'ew-resize',
      bottom: 'ns-resize',
      right: 'ew-resize',
      topleft: 'nwse-resize',
      bottomright: 'nwse-resize',
      topright: 'nesw-resize',
      bottomleft: 'nesw-resize'
    },

    getCursor: function getCursor(action) {
      if (action.axis) {
        return resize.cursors[action.name + action.axis];
      } else if (action.edges) {
        var cursorKey = '';
        var edgeNames = ['top', 'bottom', 'left', 'right'];

        for (var i = 0; i < 4; i++) {
          if (action.edges[edgeNames[i]]) {
            cursorKey += edgeNames[i];
          }
        }

        return resize.cursors[cursorKey];
      }
    }
  };

  /**
   * ```js
   * interact(element).resizable({
   *   onstart: function (event) {},
   *   onmove : function (event) {},
   *   onend  : function (event) {},
   *
   *   edges: {
   *     top   : true,       // Use pointer coords to check for resize.
   *     left  : false,      // Disable resizing from left edge.
   *     bottom: '.resize-s',// Resize if pointer target matches selector
   *     right : handleEl    // Resize if pointer target is the given Element
   *   },
   *
   *     // Width and height can be adjusted independently. When `true`, width and
   *     // height are adjusted at a 1:1 ratio.
   *     square: false,
   *
   *     // Width and height can be adjusted independently. When `true`, width and
   *     // height maintain the aspect ratio they had when resizing started.
   *     preserveAspectRatio: false,
   *
   *   // a value of 'none' will limit the resize rect to a minimum of 0x0
   *   // 'negate' will allow the rect to have negative width/height
   *   // 'reposition' will keep the width/height positive by swapping
   *   // the top and bottom edges and/or swapping the left and right edges
   *   invert: 'none' || 'negate' || 'reposition'
   *
   *   // limit multiple resizes.
   *   // See the explanation in the {@link Interactable.draggable} example
   *   max: Infinity,
   *   maxPerElement: 1,
   * });
   *
   * var isResizeable = interact(element).resizable();
   * ```
   *
   * Gets or sets whether resize actions can be performed on the target
   *
   * @param {boolean | object} [options] true/false or An object with event
   * listeners to be fired on resize events (object makes the Interactable
   * resizable)
   * @return {boolean | Interactable} A boolean indicating if this can be the
   * target of resize elements, or this Interactable
   */
  Interactable.prototype.resizable = function (options) {
    if (utils.is.object(options)) {
      this.options.resize.enabled = options.enabled === false ? false : true;
      this.setPerAction('resize', options);
      this.setOnEvents('resize', options);

      if (/^x$|^y$|^xy$/.test(options.axis)) {
        this.options.resize.axis = options.axis;
      } else if (options.axis === null) {
        this.options.resize.axis = defaults.resize.axis;
      }

      if (utils.is.bool(options.preserveAspectRatio)) {
        this.options.resize.preserveAspectRatio = options.preserveAspectRatio;
      } else if (utils.is.bool(options.square)) {
        this.options.resize.square = options.square;
      }

      return this;
    }
    if (utils.is.bool(options)) {
      this.options.resize.enabled = options;

      if (!options) {
        this.onresizestart = this.onresizestart = this.onresizeend = null;
      }

      return this;
    }
    return this.options.resize;
  };

  interactions.signals.on('new', function (interaction) {
    interaction.resizeAxes = 'xy';
  });

  interactions.signals.on('action-start', start);
  interactions.signals.on('action-move', move);

  interactions.signals.on('action-start', updateEventAxes);
  interactions.signals.on('action-move', updateEventAxes);

  actions.resize = resize;
  actions.names.push('resize');
  utils.arr.merge(actions.eventTypes, ['resizestart', 'resizemove', 'resizeinertiastart', 'resizeresume', 'resizeend']);
  actions.methodDict.resize = 'resizable';

  defaults.resize = resize.defaults;
}

function checkResizeEdge(name, value, page, element, interactableElement, rect, margin) {
  // false, '', undefined, null
  if (!value) {
    return false;
  }

  // true value, use pointer coords and element rect
  if (value === true) {
    // if dimensions are negative, "switch" edges
    var width = utils.is.number(rect.width) ? rect.width : rect.right - rect.left;
    var height = utils.is.number(rect.height) ? rect.height : rect.bottom - rect.top;

    if (width < 0) {
      if (name === 'left') {
        name = 'right';
      } else if (name === 'right') {
        name = 'left';
      }
    }
    if (height < 0) {
      if (name === 'top') {
        name = 'bottom';
      } else if (name === 'bottom') {
        name = 'top';
      }
    }

    if (name === 'left') {
      return page.x < (width >= 0 ? rect.left : rect.right) + margin;
    }
    if (name === 'top') {
      return page.y < (height >= 0 ? rect.top : rect.bottom) + margin;
    }

    if (name === 'right') {
      return page.x > (width >= 0 ? rect.right : rect.left) - margin;
    }
    if (name === 'bottom') {
      return page.y > (height >= 0 ? rect.bottom : rect.top) - margin;
    }
  }

  // the remaining checks require an element
  if (!utils.is.element(element)) {
    return false;
  }

  return utils.is.element(value)
  // the value is an element to use as a resize handle
  ? value === element
  // otherwise check if element matches value as selector
  : utils.dom.matchesUpTo(element, value, interactableElement);
}

function start(_ref) {
  var iEvent = _ref.iEvent,
      interaction = _ref.interaction;

  if (interaction.prepared.name !== 'resize' || !interaction.prepared.edges) {
    return;
  }

  var startRect = interaction.target.getRect(interaction.element);
  var resizeOptions = interaction.target.options.resize;

  /*
   * When using the `resizable.square` or `resizable.preserveAspectRatio` options, resizing from one edge
   * will affect another. E.g. with `resizable.square`, resizing to make the right edge larger will make
   * the bottom edge larger by the same amount. We call these 'linked' edges. Any linked edges will depend
   * on the active edges and the edge being interacted with.
   */
  if (resizeOptions.square || resizeOptions.preserveAspectRatio) {
    var linkedEdges = utils.extend({}, interaction.prepared.edges);

    linkedEdges.top = linkedEdges.top || linkedEdges.left && !linkedEdges.bottom;
    linkedEdges.left = linkedEdges.left || linkedEdges.top && !linkedEdges.right;
    linkedEdges.bottom = linkedEdges.bottom || linkedEdges.right && !linkedEdges.top;
    linkedEdges.right = linkedEdges.right || linkedEdges.bottom && !linkedEdges.left;

    interaction.prepared._linkedEdges = linkedEdges;
  } else {
    interaction.prepared._linkedEdges = null;
  }

  // if using `resizable.preserveAspectRatio` option, record aspect ratio at the start of the resize
  if (resizeOptions.preserveAspectRatio) {
    interaction.resizeStartAspectRatio = startRect.width / startRect.height;
  }

  interaction.resizeRects = {
    start: startRect,
    current: utils.extend({}, startRect),
    inverted: utils.extend({}, startRect),
    previous: utils.extend({}, startRect),
    delta: {
      left: 0, right: 0, width: 0,
      top: 0, bottom: 0, height: 0
    }
  };

  iEvent.rect = interaction.resizeRects.inverted;
  iEvent.deltaRect = interaction.resizeRects.delta;
}

function move(_ref2) {
  var iEvent = _ref2.iEvent,
      interaction = _ref2.interaction;

  if (interaction.prepared.name !== 'resize' || !interaction.prepared.edges) {
    return;
  }

  var resizeOptions = interaction.target.options.resize;
  var invert = resizeOptions.invert;
  var invertible = invert === 'reposition' || invert === 'negate';

  var edges = interaction.prepared.edges;

  // eslint-disable-next-line no-shadow
  var start = interaction.resizeRects.start;
  var current = interaction.resizeRects.current;
  var inverted = interaction.resizeRects.inverted;
  var deltaRect = interaction.resizeRects.delta;
  var previous = utils.extend(interaction.resizeRects.previous, inverted);
  var originalEdges = edges;

  var eventDelta = utils.extend({}, iEvent.delta);

  if (resizeOptions.preserveAspectRatio || resizeOptions.square) {
    // `resize.preserveAspectRatio` takes precedence over `resize.square`
    var startAspectRatio = resizeOptions.preserveAspectRatio ? interaction.resizeStartAspectRatio : 1;

    edges = interaction.prepared._linkedEdges;

    if (originalEdges.left && originalEdges.bottom || originalEdges.right && originalEdges.top) {
      eventDelta.y = -eventDelta.x / startAspectRatio;
    } else if (originalEdges.left || originalEdges.right) {
      eventDelta.y = eventDelta.x / startAspectRatio;
    } else if (originalEdges.top || originalEdges.bottom) {
      eventDelta.x = eventDelta.y * startAspectRatio;
    }
  }

  // update the 'current' rect without modifications
  if (edges.top) {
    current.top += eventDelta.y;
  }
  if (edges.bottom) {
    current.bottom += eventDelta.y;
  }
  if (edges.left) {
    current.left += eventDelta.x;
  }
  if (edges.right) {
    current.right += eventDelta.x;
  }

  if (invertible) {
    // if invertible, copy the current rect
    utils.extend(inverted, current);

    if (invert === 'reposition') {
      // swap edge values if necessary to keep width/height positive
      var swap = void 0;

      if (inverted.top > inverted.bottom) {
        swap = inverted.top;

        inverted.top = inverted.bottom;
        inverted.bottom = swap;
      }
      if (inverted.left > inverted.right) {
        swap = inverted.left;

        inverted.left = inverted.right;
        inverted.right = swap;
      }
    }
  } else {
    // if not invertible, restrict to minimum of 0x0 rect
    inverted.top = Math.min(current.top, start.bottom);
    inverted.bottom = Math.max(current.bottom, start.top);
    inverted.left = Math.min(current.left, start.right);
    inverted.right = Math.max(current.right, start.left);
  }

  inverted.width = inverted.right - inverted.left;
  inverted.height = inverted.bottom - inverted.top;

  for (var edge in inverted) {
    deltaRect[edge] = inverted[edge] - previous[edge];
  }

  iEvent.edges = interaction.prepared.edges;
  iEvent.rect = inverted;
  iEvent.deltaRect = deltaRect;
}

function updateEventAxes(_ref3) {
  var interaction = _ref3.interaction,
      iEvent = _ref3.iEvent,
      action = _ref3.action;

  if (action !== 'resize' || !interaction.resizeAxes) {
    return;
  }

  var options = interaction.target.options;

  if (options.resize.square) {
    if (interaction.resizeAxes === 'y') {
      iEvent.delta.x = iEvent.delta.y;
    } else {
      iEvent.delta.y = iEvent.delta.x;
    }
    iEvent.axes = 'xy';
  } else {
    iEvent.axes = interaction.resizeAxes;

    if (interaction.resizeAxes === 'x') {
      iEvent.delta.y = 0;
    } else if (interaction.resizeAxes === 'y') {
      iEvent.delta.x = 0;
    }
  }
}

exports.default = { init: init };

},{"../utils":129}],93:[function(_dereq_,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _raf = _dereq_('./utils/raf');

var _raf2 = _interopRequireDefault(_raf);

var _window = _dereq_('./utils/window');

var _is = _dereq_('./utils/is');

var is = _interopRequireWildcard(_is);

var _domUtils = _dereq_('./utils/domUtils');

var domUtils = _interopRequireWildcard(_domUtils);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function init(scope) {
  var interactions = scope.interactions,
      defaults = scope.defaults;


  var autoScroll = scope.autoScroll = {
    defaults: {
      enabled: false,
      container: null, // the item that is scrolled (Window or HTMLElement)
      margin: 60,
      speed: 300 // the scroll speed in pixels per second
    },

    interaction: null,
    i: null, // the handle returned by window.setInterval
    x: 0, y: 0, // Direction each pulse is to scroll in

    isScrolling: false,
    prevTime: 0,

    start: function start(interaction) {
      autoScroll.isScrolling = true;
      _raf2.default.cancel(autoScroll.i);

      autoScroll.interaction = interaction;
      autoScroll.prevTime = new Date().getTime();
      autoScroll.i = _raf2.default.request(autoScroll.scroll);
    },

    stop: function stop() {
      autoScroll.isScrolling = false;
      _raf2.default.cancel(autoScroll.i);
    },

    // scroll the window by the values in scroll.x/y
    scroll: function scroll() {
      var options = autoScroll.interaction.target.options[autoScroll.interaction.prepared.name].autoScroll;
      var container = options.container || (0, _window.getWindow)(autoScroll.interaction.element);
      var now = new Date().getTime();
      // change in time in seconds
      var dt = (now - autoScroll.prevTime) / 1000;
      // displacement
      var s = options.speed * dt;

      if (s >= 1) {
        if (is.window(container)) {
          container.scrollBy(autoScroll.x * s, autoScroll.y * s);
        } else if (container) {
          container.scrollLeft += autoScroll.x * s;
          container.scrollTop += autoScroll.y * s;
        }

        autoScroll.prevTime = now;
      }

      if (autoScroll.isScrolling) {
        _raf2.default.cancel(autoScroll.i);
        autoScroll.i = _raf2.default.request(autoScroll.scroll);
      }
    },
    check: function check(interactable, actionName) {
      var options = interactable.options;

      return options[actionName].autoScroll && options[actionName].autoScroll.enabled;
    },
    onInteractionMove: function onInteractionMove(_ref) {
      var interaction = _ref.interaction,
          pointer = _ref.pointer;

      if (!(interaction.interacting() && autoScroll.check(interaction.target, interaction.prepared.name))) {
        return;
      }

      if (interaction.simulation) {
        autoScroll.x = autoScroll.y = 0;
        return;
      }

      var top = void 0;
      var right = void 0;
      var bottom = void 0;
      var left = void 0;

      var options = interaction.target.options[interaction.prepared.name].autoScroll;
      var container = options.container || (0, _window.getWindow)(interaction.element);

      if (is.window(container)) {
        left = pointer.clientX < autoScroll.margin;
        top = pointer.clientY < autoScroll.margin;
        right = pointer.clientX > container.innerWidth - autoScroll.margin;
        bottom = pointer.clientY > container.innerHeight - autoScroll.margin;
      } else {
        var rect = domUtils.getElementClientRect(container);

        left = pointer.clientX < rect.left + autoScroll.margin;
        top = pointer.clientY < rect.top + autoScroll.margin;
        right = pointer.clientX > rect.right - autoScroll.margin;
        bottom = pointer.clientY > rect.bottom - autoScroll.margin;
      }

      autoScroll.x = right ? 1 : left ? -1 : 0;
      autoScroll.y = bottom ? 1 : top ? -1 : 0;

      if (!autoScroll.isScrolling) {
        // set the autoScroll properties to those of the target
        autoScroll.margin = options.margin;
        autoScroll.speed = options.speed;

        autoScroll.start(interaction);
      }
    }
  };

  interactions.signals.on('stop', autoScroll.stop);

  interactions.signals.on('action-move', autoScroll.onInteractionMove);

  defaults.perAction.autoScroll = autoScroll.defaults;
}

exports.default = { init: init };

},{"./utils/domUtils":124,"./utils/is":131,"./utils/raf":135,"./utils/window":139}],94:[function(_dereq_,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _is = _dereq_('../utils/is');

var is = _interopRequireWildcard(_is);

var _domUtils = _dereq_('../utils/domUtils');

var domUtils = _interopRequireWildcard(_domUtils);

var _utils = _dereq_('../utils');

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function init(scope) {
  var Interactable = scope.Interactable,
      actions = scope.actions;


  Interactable.prototype.getAction = function (pointer, event, interaction, element) {
    var action = this.defaultActionChecker(pointer, event, interaction, element);

    if (this.options.actionChecker) {
      return this.options.actionChecker(pointer, event, action, this, element, interaction);
    }

    return action;
  };

  /**
   * ```js
   * interact(element, { ignoreFrom: document.getElementById('no-action') });
   * // or
   * interact(element).ignoreFrom('input, textarea, a');
   * ```
   * @deprecated
   * If the target of the `mousedown`, `pointerdown` or `touchstart` event or any
   * of it's parents match the given CSS selector or Element, no
   * drag/resize/gesture is started.
   *
   * Don't use this method. Instead set the `ignoreFrom` option for each action
   * or for `pointerEvents`
   *
   * @example
   * interact(targett)
   *   .draggable({
   *     ignoreFrom: 'input, textarea, a[href]'',
   *   })
   *   .pointerEvents({
   *     ignoreFrom: '[no-pointer]',
   *   });
   *
   * @param {string | Element | null} [newValue] a CSS selector string, an
   * Element or `null` to not ignore any elements
   * @return {string | Element | object} The current ignoreFrom value or this
   * Interactable
   */
  Interactable.prototype.ignoreFrom = (0, _utils.warnOnce)(function (newValue) {
    return this._backCompatOption('ignoreFrom', newValue);
  }, 'Interactable.ignoreFrom() has been deprecated. Use Interactble.draggable({ignoreFrom: newValue}).');

  /**
   * ```js
   *
   * @deprecated
   * A drag/resize/gesture is started only If the target of the `mousedown`,
   * `pointerdown` or `touchstart` event or any of it's parents match the given
   * CSS selector or Element.
   *
   * Don't use this method. Instead set the `allowFrom` option for each action
   * or for `pointerEvents`
   *
   * @example
   * interact(targett)
   *   .resizable({
   *     allowFrom: '.resize-handle',
   *   .pointerEvents({
   *     allowFrom: '.handle',,
   *   });
   *
   * @param {string | Element | null} [newValue] a CSS selector string, an
   * Element or `null` to allow from any element
   * @return {string | Element | object} The current allowFrom value or this
   * Interactable
   */
  Interactable.prototype.allowFrom = (0, _utils.warnOnce)(function (newValue) {
    return this._backCompatOption('allowFrom', newValue);
  }, 'Interactable.allowFrom() has been deprecated. Use Interactble.draggable({allowFrom: newValue}).');

  Interactable.prototype.testIgnore = function (ignoreFrom, interactableElement, element) {
    if (!ignoreFrom || !is.element(element)) {
      return false;
    }

    if (is.string(ignoreFrom)) {
      return domUtils.matchesUpTo(element, ignoreFrom, interactableElement);
    } else if (is.element(ignoreFrom)) {
      return domUtils.nodeContains(ignoreFrom, element);
    }

    return false;
  };

  Interactable.prototype.testAllow = function (allowFrom, interactableElement, element) {
    if (!allowFrom) {
      return true;
    }

    if (!is.element(element)) {
      return false;
    }

    if (is.string(allowFrom)) {
      return domUtils.matchesUpTo(element, allowFrom, interactableElement);
    } else if (is.element(allowFrom)) {
      return domUtils.nodeContains(allowFrom, element);
    }

    return false;
  };

  Interactable.prototype.testIgnoreAllow = function (options, interactableElement, eventTarget) {
    return !this.testIgnore(options.ignoreFrom, interactableElement, eventTarget) && this.testAllow(options.allowFrom, interactableElement, eventTarget);
  };

  /**
   * ```js
   * interact('.resize-drag')
   *   .resizable(true)
   *   .draggable(true)
   *   .actionChecker(function (pointer, event, action, interactable, element, interaction) {
   *
   *   if (interact.matchesSelector(event.target, '.drag-handle') {
   *     // force drag with handle target
   *     action.name = drag;
   *   }
   *   else {
   *     // resize from the top and right edges
   *     action.name  = 'resize';
   *     action.edges = { top: true, right: true };
   *   }
   *
   *   return action;
   * });
   * ```
   *
   * Gets or sets the function used to check action to be performed on
   * pointerDown
   *
   * @param {function | null} [checker] A function which takes a pointer event,
   * defaultAction string, interactable, element and interaction as parameters
   * and returns an object with name property 'drag' 'resize' or 'gesture' and
   * optionally an `edges` object with boolean 'top', 'left', 'bottom' and right
   * props.
   * @return {Function | Interactable} The checker function or this Interactable
   */
  Interactable.prototype.actionChecker = function (checker) {
    if (is.func(checker)) {
      this.options.actionChecker = checker;

      return this;
    }

    if (checker === null) {
      delete this.options.actionChecker;

      return this;
    }

    return this.options.actionChecker;
  };

  /**
   * Returns or sets whether the the cursor should be changed depending on the
   * action that would be performed if the mouse were pressed and dragged.
   *
   * @param {boolean} [newValue]
   * @return {boolean | Interactable} The current setting or this Interactable
   */
  Interactable.prototype.styleCursor = function (newValue) {
    if (is.bool(newValue)) {
      this.options.styleCursor = newValue;

      return this;
    }

    if (newValue === null) {
      delete this.options.styleCursor;

      return this;
    }

    return this.options.styleCursor;
  };

  Interactable.prototype.defaultActionChecker = function (pointer, event, interaction, element) {
    var rect = this.getRect(element);
    var buttons = event.buttons || {
      0: 1,
      1: 4,
      3: 8,
      4: 16
    }[event.button];
    var action = null;

    for (var _i = 0; _i < actions.names.length; _i++) {
      var _ref;

      _ref = actions.names[_i];
      var actionName = _ref;

      // check mouseButton setting if the pointer is down
      if (interaction.pointerIsDown && /mouse|pointer/.test(interaction.pointerType) && (buttons & this.options[actionName].mouseButtons) === 0) {
        continue;
      }

      action = actions[actionName].checker(pointer, event, this, element, interaction, rect);

      if (action) {
        return action;
      }
    }
  };
}

exports.default = { init: init };

},{"../utils":129,"../utils/domUtils":124,"../utils/is":131}],95:[function(_dereq_,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _utils = _dereq_('../utils');

var utils = _interopRequireWildcard(_utils);

var _InteractableMethods = _dereq_('./InteractableMethods');

var _InteractableMethods2 = _interopRequireDefault(_InteractableMethods);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function init(scope) {
  var interact = scope.interact,
      interactions = scope.interactions,
      defaults = scope.defaults,
      Signals = scope.Signals;


  interact.use(_InteractableMethods2.default);

  // set cursor style on mousedown
  interactions.signals.on('down', function (_ref) {
    var interaction = _ref.interaction,
        pointer = _ref.pointer,
        event = _ref.event,
        eventTarget = _ref.eventTarget;

    if (interaction.interacting()) {
      return;
    }

    var actionInfo = getActionInfo(interaction, pointer, event, eventTarget, scope);
    prepare(interaction, actionInfo, scope);
  });

  // set cursor style on mousemove
  interactions.signals.on('move', function (_ref2) {
    var interaction = _ref2.interaction,
        pointer = _ref2.pointer,
        event = _ref2.event,
        eventTarget = _ref2.eventTarget;

    if (interaction.pointerType !== 'mouse' || interaction.pointerIsDown || interaction.interacting()) {
      return;
    }

    var actionInfo = getActionInfo(interaction, pointer, event, eventTarget, scope);
    prepare(interaction, actionInfo, scope);
  });

  interactions.signals.on('move', function (arg) {
    var interaction = arg.interaction,
        event = arg.event;


    if (!interaction.pointerIsDown || interaction.interacting() || !interaction.pointerWasMoved || !interaction.prepared.name) {
      return;
    }

    scope.autoStart.signals.fire('before-start', arg);

    var target = interaction.target;

    if (interaction.prepared.name && target) {
      // check manualStart and interaction limit
      if (target.options[interaction.prepared.name].manualStart || !withinInteractionLimit(target, interaction.element, interaction.prepared, scope)) {
        interaction.stop(event);
      } else {
        interaction.start(interaction.prepared, target, interaction.element);
      }
    }
  });

  interactions.signals.on('stop', function (_ref3) {
    var interaction = _ref3.interaction;

    var target = interaction.target;

    if (target && target.options.styleCursor) {
      target._doc.documentElement.style.cursor = '';
    }
  });

  interact.maxInteractions = maxInteractions;

  defaults.base.actionChecker = null;
  defaults.base.styleCursor = true;

  utils.extend(defaults.perAction, {
    manualStart: false,
    max: Infinity,
    maxPerElement: 1,
    allowFrom: null,
    ignoreFrom: null,

    // only allow left button by default
    // see https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent/buttons#Return_value
    mouseButtons: 1
  });

  /**
   * Returns or sets the maximum number of concurrent interactions allowed.  By
   * default only 1 interaction is allowed at a time (for backwards
   * compatibility). To allow multiple interactions on the same Interactables and
   * elements, you need to enable it in the draggable, resizable and gesturable
   * `'max'` and `'maxPerElement'` options.
   *
   * @alias module:interact.maxInteractions
   *
   * @param {number} [newValue] Any number. newValue <= 0 means no interactions.
   */
  interact.maxInteractions = function (newValue) {
    return maxInteractions(newValue, scope);
  };

  scope.autoStart = {
    // Allow this many interactions to happen simultaneously
    maxInteractions: Infinity,
    withinInteractionLimit: withinInteractionLimit,
    signals: new Signals()
  };
}

// Check if the current target supports the action.
// If so, return the validated action. Otherwise, return null
function validateAction(action, interactable, element, eventTarget, scope) {
  if (utils.is.object(action) && interactable.testIgnoreAllow(interactable.options[action.name], element, eventTarget) && interactable.options[action.name].enabled && withinInteractionLimit(interactable, element, action, scope)) {
    return action;
  }

  return null;
}

function validateSelector(interaction, pointer, event, matches, matchElements, eventTarget, scope) {
  for (var i = 0, len = matches.length; i < len; i++) {
    var match = matches[i];
    var matchElement = matchElements[i];
    var action = validateAction(match.getAction(pointer, event, interaction, matchElement), match, matchElement, eventTarget, scope);

    if (action) {
      return {
        action: action,
        target: match,
        element: matchElement
      };
    }
  }

  return {};
}

function getActionInfo(interaction, pointer, event, eventTarget, scope) {
  var matches = [];
  var matchElements = [];

  var element = eventTarget;

  function pushMatches(interactable) {
    matches.push(interactable);
    matchElements.push(element);
  }

  while (utils.is.element(element)) {
    matches = [];
    matchElements = [];

    scope.interactables.forEachMatch(element, pushMatches);

    var actionInfo = validateSelector(interaction, pointer, event, matches, matchElements, eventTarget, scope);

    if (actionInfo.action && !actionInfo.target.options[actionInfo.action.name].manualStart) {
      return actionInfo;
    }

    element = utils.dom.parentNode(element);
  }

  return {};
}

function prepare(interaction, _ref4, scope) {
  var action = _ref4.action,
      target = _ref4.target,
      element = _ref4.element;

  action = action || {};

  if (interaction.target && interaction.target.options.styleCursor) {
    interaction.target._doc.documentElement.style.cursor = '';
  }

  interaction.target = target;
  interaction.element = element;
  utils.copyAction(interaction.prepared, action);

  if (target && target.options.styleCursor) {
    var cursor = action ? scope.actions[action.name].getCursor(action) : '';
    interaction.target._doc.documentElement.style.cursor = cursor;
  }

  scope.autoStart.signals.fire('prepared', { interaction: interaction });
}

function withinInteractionLimit(interactable, element, action, scope) {
  var options = interactable.options;
  var maxActions = options[action.name].max;
  var maxPerElement = options[action.name].maxPerElement;
  var autoStartMax = scope.autoStart.maxInteractions;
  var activeInteractions = 0;
  var targetCount = 0;
  var targetElementCount = 0;

  // no actions if any of these values == 0
  if (!(maxActions && maxPerElement && autoStartMax)) {
    return;
  }

  for (var _i = 0; _i < scope.interactions.list.length; _i++) {
    var _ref5;

    _ref5 = scope.interactions.list[_i];
    var interaction = _ref5;

    var otherAction = interaction.prepared.name;

    if (!interaction.interacting()) {
      continue;
    }

    activeInteractions++;

    if (activeInteractions >= autoStartMax) {
      return false;
    }

    if (interaction.target !== interactable) {
      continue;
    }

    targetCount += otherAction === action.name | 0;

    if (targetCount >= maxActions) {
      return false;
    }

    if (interaction.element === element) {
      targetElementCount++;

      if (otherAction === action.name && targetElementCount >= maxPerElement) {
        return false;
      }
    }
  }

  return autoStartMax > 0;
}

function maxInteractions(newValue, scope) {
  if (utils.is.number(newValue)) {
    scope.autoStart.maxInteractions = newValue;

    return this;
  }

  return scope.autoStart.maxInteractions;
}

exports.default = {
  init: init,
  maxInteractions: maxInteractions,
  withinInteractionLimit: withinInteractionLimit,
  validateAction: validateAction
};

},{"../utils":129,"./InteractableMethods":94}],96:[function(_dereq_,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _is = _dereq_('../utils/is');

var is = _interopRequireWildcard(_is);

var _base = _dereq_('./base');

var _domUtils = _dereq_('../utils/domUtils');

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function init(scope) {
  scope.autoStart.signals.on('before-start', function (_ref) {
    var interaction = _ref.interaction,
        eventTarget = _ref.eventTarget,
        dx = _ref.dx,
        dy = _ref.dy;

    if (interaction.prepared.name !== 'drag') {
      return;
    }

    // check if a drag is in the correct axis
    var absX = Math.abs(dx);
    var absY = Math.abs(dy);
    var targetOptions = interaction.target.options.drag;
    var startAxis = targetOptions.startAxis;
    var currentAxis = absX > absY ? 'x' : absX < absY ? 'y' : 'xy';

    interaction.prepared.axis = targetOptions.lockAxis === 'start' ? currentAxis[0] // always lock to one axis even if currentAxis === 'xy'
    : targetOptions.lockAxis;

    // if the movement isn't in the startAxis of the interactable
    if (currentAxis !== 'xy' && startAxis !== 'xy' && startAxis !== currentAxis) {
      // cancel the prepared action
      interaction.prepared.name = null;

      // then try to get a drag from another ineractable
      var element = eventTarget;

      var getDraggable = function getDraggable(interactable) {
        if (interactable === interaction.target) {
          return;
        }

        var options = interaction.target.options.drag;

        if (!options.manualStart && interactable.testIgnoreAllow(options, element, eventTarget)) {

          var action = interactable.getAction(interaction.downPointer, interaction.downEvent, interaction, element);

          if (action && action.name === 'drag' && checkStartAxis(currentAxis, interactable) && (0, _base.validateAction)(action, interactable, element, eventTarget, scope)) {

            return interactable;
          }
        }
      };

      // check all interactables
      while (is.element(element)) {
        var interactable = scope.interactables.forEachMatch(element, getDraggable);

        if (interactable) {
          interaction.prepared.name = 'drag';
          interaction.target = interactable;
          interaction.element = element;
          break;
        }

        element = (0, _domUtils.parentNode)(element);
      }
    }
  });

  function checkStartAxis(startAxis, interactable) {
    if (!interactable) {
      return false;
    }

    var thisAxis = interactable.options.drag.startAxis;

    return startAxis === 'xy' || thisAxis === 'xy' || thisAxis === startAxis;
  }
}

exports.default = { init: init };

},{"../utils/domUtils":124,"../utils/is":131,"./base":95}],97:[function(_dereq_,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
function init(scope) {
  var autoStart = scope.autoStart,
      interactions = scope.interactions,
      defaults = scope.defaults;


  defaults.perAction.hold = 0;
  defaults.perAction.delay = 0;

  interactions.signals.on('new', function (interaction) {
    interaction.autoStartHoldTimer = null;
  });

  autoStart.signals.on('prepared', function (_ref) {
    var interaction = _ref.interaction;

    var hold = getHoldDuration(interaction);

    if (hold > 0) {
      interaction.autoStartHoldTimer = setTimeout(function () {
        interaction.start(interaction.prepared, interaction.target, interaction.element);
      }, hold);
    }
  });

  interactions.signals.on('move', function (_ref2) {
    var interaction = _ref2.interaction,
        duplicate = _ref2.duplicate;

    if (interaction.pointerWasMoved && !duplicate) {
      clearTimeout(interaction.autoStartHoldTimer);
    }
  });

  // prevent regular down->move autoStart
  autoStart.signals.on('before-start', function (_ref3) {
    var interaction = _ref3.interaction;

    var hold = getHoldDuration(interaction);

    if (hold > 0) {
      interaction.prepared.name = null;
    }
  });
}

function getHoldDuration(interaction) {
  var actionName = interaction.prepared && interaction.prepared.name;

  if (!actionName) {
    return null;
  }

  var options = interaction.target.options;

  return options[actionName].hold || options[actionName].delay;
}

exports.default = {
  init: init,
  getHoldDuration: getHoldDuration
};

},{}],98:[function(_dereq_,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.init = exports.dragAxis = exports.hold = exports.autoStart = undefined;

var _base = _dereq_('./base');

var _base2 = _interopRequireDefault(_base);

var _hold = _dereq_('./hold');

var _hold2 = _interopRequireDefault(_hold);

var _dragAxis = _dereq_('./dragAxis');

var _dragAxis2 = _interopRequireDefault(_dragAxis);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function init(scope) {
  _base2.default.init(scope);
  _hold2.default.init(scope);
  _dragAxis2.default.init(scope);
}

exports.autoStart = _base2.default;
exports.hold = _hold2.default;
exports.dragAxis = _dragAxis2.default;
exports.init = init;

},{"./base":95,"./dragAxis":96,"./hold":97}],99:[function(_dereq_,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = {
  base: {
    preventDefault: 'auto',
    deltaSource: 'page'
  },

  perAction: {
    enabled: false,
    origin: { x: 0, y: 0 }
  }
};

},{}],100:[function(_dereq_,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.init = init;

var _scope = _dereq_('./scope');

var _interact = _dereq_('./interact');

var _interact2 = _interopRequireDefault(_interact);

var _interactions = _dereq_('./interactions');

var _interactions2 = _interopRequireDefault(_interactions);

var _interactablePreventDefault = _dereq_('./interactablePreventDefault');

var _interactablePreventDefault2 = _interopRequireDefault(_interactablePreventDefault);

var _inertia = _dereq_('./inertia');

var _inertia2 = _interopRequireDefault(_inertia);

var _pointerEvents = _dereq_('./pointerEvents');

var pointerEvents = _interopRequireWildcard(_pointerEvents);

var _autoStart = _dereq_('./autoStart');

var autoStart = _interopRequireWildcard(_autoStart);

var _actions = _dereq_('./actions');

var actions = _interopRequireWildcard(_actions);

var _modifiers = _dereq_('./modifiers');

var modifiers = _interopRequireWildcard(_modifiers);

var _snappers = _dereq_('./utils/snappers');

var snappers = _interopRequireWildcard(_snappers);

var _autoScroll = _dereq_('./autoScroll');

var _autoScroll2 = _interopRequireDefault(_autoScroll);

var _reflow = _dereq_('./reflow');

var _reflow2 = _interopRequireDefault(_reflow);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/* browser entry point */

function init(window) {
  (0, _scope.init)(window);

  _interact2.default.use(_interactions2.default);
  _interact2.default.use(_interactablePreventDefault2.default);

  // inertia
  _interact2.default.use(_inertia2.default);

  // pointerEvents
  _interact2.default.use(pointerEvents);

  // autoStart, hold
  _interact2.default.use(autoStart);

  // drag and drop, resize, gesture
  _interact2.default.use(actions);

  // snap, resize, etc.
  _interact2.default.use(modifiers);

  _interact2.default.snappers = snappers;
  _interact2.default.createSnapGrid = _interact2.default.snappers.grid;

  // autoScroll
  _interact2.default.use(_autoScroll2.default);

  // reflow
  _interact2.default.use(_reflow2.default);

  return _interact2.default;
}

},{"./actions":91,"./autoScroll":93,"./autoStart":98,"./inertia":101,"./interact":102,"./interactablePreventDefault":103,"./interactions":104,"./modifiers":106,"./pointerEvents":115,"./reflow":117,"./scope":118,"./utils/snappers":138}],101:[function(_dereq_,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _base = _dereq_('./modifiers/base');

var _base2 = _interopRequireDefault(_base);

var _utils = _dereq_('./utils');

var utils = _interopRequireWildcard(_utils);

var _raf = _dereq_('./utils/raf');

var _raf2 = _interopRequireDefault(_raf);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function init(scope) {
  var interactions = scope.interactions,
      defaults = scope.defaults;


  interactions.signals.on('new', function (interaction) {
    interaction.inertia = {
      active: false,
      smoothEnd: false,
      allowResume: false,

      startEvent: null,
      upCoords: {},

      xe: 0, ye: 0,
      sx: 0, sy: 0,

      t0: 0,
      vx0: 0, vys: 0,
      duration: 0,

      lambda_v0: 0,
      one_ve_v0: 0,
      i: null
    };
  });

  interactions.signals.on('up', function (arg) {
    return release(arg, scope);
  });
  interactions.signals.on('down', function (arg) {
    return resume(arg, scope);
  });
  interactions.signals.on('stop', function (arg) {
    return stop(arg, scope);
  });

  defaults.perAction.inertia = {
    enabled: false,
    resistance: 10, // the lambda in exponential decay
    minSpeed: 100, // target speed must be above this for inertia to start
    endSpeed: 10, // the speed at which inertia is slow enough to stop
    allowResume: true, // allow resuming an action in inertia phase
    smoothEndDuration: 300 // animate to snap/restrict endOnly if there's no inertia
  };
}

function resume(_ref, scope) {
  var interaction = _ref.interaction,
      event = _ref.event,
      pointer = _ref.pointer,
      eventTarget = _ref.eventTarget;

  var status = interaction.inertia;

  // Check if the down event hits the current inertia target
  if (status.active) {
    var element = eventTarget;

    // climb up the DOM tree from the event target
    while (utils.is.element(element)) {

      // if interaction element is the current inertia target element
      if (element === interaction.element) {
        // stop inertia
        _raf2.default.cancel(status.i);
        status.active = false;
        interaction.simulation = null;

        // update pointers to the down event's coordinates
        interaction.updatePointer(pointer, event, eventTarget, true);
        utils.pointer.setCoords(interaction.curCoords, interaction.pointers);

        // fire appropriate signals
        var signalArg = {
          interaction: interaction
        };

        scope.interactions.signals.fire('action-resume', signalArg);

        // fire a reume event
        var resumeEvent = new scope.InteractEvent(interaction, event, interaction.prepared.name, 'resume', interaction.element);

        interaction._fireEvent(resumeEvent);
        _base2.default.resetStatuses(interaction.modifiers.statuses, scope.modifiers);

        utils.pointer.copyCoords(interaction.prevCoords, interaction.curCoords);
        break;
      }

      element = utils.dom.parentNode(element);
    }
  }
}

function release(_ref2, scope) {
  var interaction = _ref2.interaction,
      event = _ref2.event;

  var status = interaction.inertia;

  if (!interaction.interacting() || interaction.simulation && interaction.simulation.active) {
    return;
  }

  var options = getOptions(interaction);

  var now = new Date().getTime();
  var pointerSpeed = interaction.pointerDelta.client.speed;

  var smoothEnd = false;
  var modifierResult = void 0;

  // check if inertia should be started
  var inertiaPossible = options && options.enabled && interaction.prepared.name !== 'gesture' && event !== status.startEvent;

  var inertia = inertiaPossible && now - interaction.curCoords.timeStamp < 50 && pointerSpeed > options.minSpeed && pointerSpeed > options.endSpeed;

  var modifierArg = {
    interaction: interaction,
    pageCoords: utils.extend({}, interaction.curCoords.page),
    statuses: {},
    preEnd: true,
    requireEndOnly: true
  };

  // smoothEnd
  if (inertiaPossible && !inertia) {
    _base2.default.resetStatuses(modifierArg.statuses, scope.modifiers);

    modifierResult = _base2.default.setAll(modifierArg, scope.modifiers);

    if (modifierResult.shouldMove && modifierResult.locked) {
      smoothEnd = true;
    }
  }

  if (!(inertia || smoothEnd)) {
    return;
  }

  utils.pointer.copyCoords(status.upCoords, interaction.curCoords);

  interaction.pointers[0].pointer = status.startEvent = new scope.InteractEvent(interaction, event, interaction.prepared.name, 'inertiastart', interaction.element);

  status.t0 = now;

  status.active = true;
  status.allowResume = options.allowResume;
  interaction.simulation = status;

  interaction.target.fire(status.startEvent);

  if (inertia) {
    status.vx0 = interaction.pointerDelta.client.vx;
    status.vy0 = interaction.pointerDelta.client.vy;
    status.v0 = pointerSpeed;

    calcInertia(interaction, status);

    utils.extend(modifierArg.pageCoords, interaction.curCoords.page);

    modifierArg.pageCoords.x += status.xe;
    modifierArg.pageCoords.y += status.ye;

    _base2.default.resetStatuses(modifierArg.statuses, scope.modifiers);

    modifierResult = _base2.default.setAll(modifierArg, scope.modifiers);

    status.modifiedXe += modifierResult.delta.x;
    status.modifiedYe += modifierResult.delta.y;

    status.i = _raf2.default.request(function () {
      return inertiaTick(interaction);
    });
  } else {
    status.smoothEnd = true;
    status.xe = modifierResult.delta.x;
    status.ye = modifierResult.delta.y;

    status.sx = status.sy = 0;

    status.i = _raf2.default.request(function () {
      return smothEndTick(interaction);
    });
  }
}

function stop(_ref3) {
  var interaction = _ref3.interaction;

  var status = interaction.inertia;

  if (status.active) {
    _raf2.default.cancel(status.i);
    status.active = false;
    interaction.simulation = null;
  }
}

function calcInertia(interaction, status) {
  var options = getOptions(interaction);
  var lambda = options.resistance;
  var inertiaDur = -Math.log(options.endSpeed / status.v0) / lambda;

  status.x0 = interaction.prevEvent.page.x;
  status.y0 = interaction.prevEvent.page.y;
  status.t0 = status.startEvent.timeStamp / 1000;
  status.sx = status.sy = 0;

  status.modifiedXe = status.xe = (status.vx0 - inertiaDur) / lambda;
  status.modifiedYe = status.ye = (status.vy0 - inertiaDur) / lambda;
  status.te = inertiaDur;

  status.lambda_v0 = lambda / status.v0;
  status.one_ve_v0 = 1 - options.endSpeed / status.v0;
}

function inertiaTick(interaction) {
  updateInertiaCoords(interaction);
  utils.pointer.setCoordDeltas(interaction.pointerDelta, interaction.prevCoords, interaction.curCoords);

  var status = interaction.inertia;
  var options = getOptions(interaction);
  var lambda = options.resistance;
  var t = new Date().getTime() / 1000 - status.t0;

  if (t < status.te) {

    var progress = 1 - (Math.exp(-lambda * t) - status.lambda_v0) / status.one_ve_v0;

    if (status.modifiedXe === status.xe && status.modifiedYe === status.ye) {
      status.sx = status.xe * progress;
      status.sy = status.ye * progress;
    } else {
      var quadPoint = utils.getQuadraticCurvePoint(0, 0, status.xe, status.ye, status.modifiedXe, status.modifiedYe, progress);

      status.sx = quadPoint.x;
      status.sy = quadPoint.y;
    }

    interaction.move();

    status.i = _raf2.default.request(function () {
      return inertiaTick(interaction);
    });
  } else {
    status.sx = status.modifiedXe;
    status.sy = status.modifiedYe;

    interaction.move();
    interaction.end(status.startEvent);
    status.active = false;
    interaction.simulation = null;
  }

  utils.pointer.copyCoords(interaction.prevCoords, interaction.curCoords);
}

function smothEndTick(interaction) {
  updateInertiaCoords(interaction);

  var status = interaction.inertia;
  var t = new Date().getTime() - status.t0;

  var _getOptions = getOptions(interaction),
      duration = _getOptions.smoothEndDuration;

  if (t < duration) {
    status.sx = utils.easeOutQuad(t, 0, status.xe, duration);
    status.sy = utils.easeOutQuad(t, 0, status.ye, duration);

    interaction.move();

    status.i = _raf2.default.request(function () {
      return smothEndTick(interaction);
    });
  } else {
    status.sx = status.xe;
    status.sy = status.ye;

    interaction.move();
    interaction.end(status.startEvent);

    status.smoothEnd = status.active = false;
    interaction.simulation = null;
  }
}

function updateInertiaCoords(interaction) {
  var status = interaction.inertia;

  // return if inertia isn't running
  if (!status.active) {
    return;
  }

  var pageUp = status.upCoords.page;
  var clientUp = status.upCoords.client;

  utils.pointer.setCoords(interaction.curCoords, [{
    pageX: pageUp.x + status.sx,
    pageY: pageUp.y + status.sy,
    clientX: clientUp.x + status.sx,
    clientY: clientUp.y + status.sy
  }]);
}

function getOptions(_ref4) {
  var target = _ref4.target,
      prepared = _ref4.prepared;

  return target && target.options && prepared.name && target.options[prepared.name].inertia;
}

exports.default = {
  init: init,
  calcInertia: calcInertia,
  inertiaTick: inertiaTick,
  smothEndTick: smothEndTick,
  updateInertiaCoords: updateInertiaCoords
};

},{"./modifiers/base":105,"./utils":129,"./utils/raf":135}],102:[function(_dereq_,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _browser = _dereq_('./utils/browser');

var _browser2 = _interopRequireDefault(_browser);

var _events = _dereq_('./utils/events');

var _events2 = _interopRequireDefault(_events);

var _utils = _dereq_('./utils');

var utils = _interopRequireWildcard(_utils);

var _scope = _dereq_('./scope');

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/** @module interact */

var globalEvents = {};
var signals = new utils.Signals();

/**
 * ```js
 * interact('#draggable').draggable(true);
 *
 * var rectables = interact('rect');
 * rectables
 *   .gesturable(true)
 *   .on('gesturemove', function (event) {
 *       // ...
 *   });
 * ```
 *
 * The methods of this variable can be used to set elements as interactables
 * and also to change various default settings.
 *
 * Calling it as a function and passing an element or a valid CSS selector
 * string returns an Interactable object which has various methods to configure
 * it.
 *
 * @global
 *
 * @param {Element | string} element The HTML or SVG Element to interact with
 * or CSS selector
 * @return {Interactable}
 */
function interact(element, options) {
  var interactable = _scope.scope.interactables.get(element, options);

  if (!interactable) {
    options = utils.extend(options || {}, {
      signals: signals,
      actions: _scope.scope.actions
    });
    interactable = new _scope.scope.Interactable(element, options, _scope.scope.document);
    interactable.events.global = globalEvents;

    _scope.scope.addDocument(interactable._doc);

    _scope.scope.interactables.list.push(interactable);
  }

  return interactable;
}

/**
 * Use a plugin
 *
 * @alias module:interact.use
 *
 * @param {Object} plugin
 * @param {function} plugin.init
 * @return {interact}
*/
interact.use = function (plugin) {
  plugin.init(_scope.scope);
  return interact;
};

/**
 * Check if an element or selector has been set with the {@link interact}
 * function
 *
 * @alias module:interact.isSet
 *
 * @param {Element} element The Element being searched for
 * @return {boolean} Indicates if the element or CSS selector was previously
 * passed to interact
*/
interact.isSet = function (element, options) {
  return _scope.scope.interactables.indexOfElement(element, options && options.context) !== -1;
};

/**
 * Add a global listener for an InteractEvent or adds a DOM event to `document`
 *
 * @alias module:interact.on
 *
 * @param {string | array | object} type The types of events to listen for
 * @param {function} listener The function event (s)
 * @param {object | boolean} [options] object or useCapture flag for
 * addEventListener
 * @return {object} interact
 */
interact.on = function (type, listener, options) {
  if (utils.is.string(type) && type.search(' ') !== -1) {
    type = type.trim().split(/ +/);
  }

  if (utils.is.array(type)) {
    for (var _i = 0; _i < type.length; _i++) {
      var _ref;

      _ref = type[_i];
      var eventType = _ref;

      interact.on(eventType, listener, options);
    }

    return interact;
  }

  if (utils.is.object(type)) {
    for (var prop in type) {
      interact.on(prop, type[prop], listener);
    }

    return interact;
  }

  // if it is an InteractEvent type, add listener to globalEvents
  if (utils.arr.contains(_scope.scope.actions.eventTypes, type)) {
    // if this type of event was never bound
    if (!globalEvents[type]) {
      globalEvents[type] = [listener];
    } else {
      globalEvents[type].push(listener);
    }
  }
  // If non InteractEvent type, addEventListener to document
  else {
      _events2.default.add(_scope.scope.document, type, listener, { options: options });
    }

  return interact;
};

/**
 * Removes a global InteractEvent listener or DOM event from `document`
 *
 * @alias module:interact.off
 *
 * @param {string | array | object} type The types of events that were listened
 * for
 * @param {function} listener The listener function to be removed
 * @param {object | boolean} options [options] object or useCapture flag for
 * removeEventListener
 * @return {object} interact
 */
interact.off = function (type, listener, options) {
  if (utils.is.string(type) && type.search(' ') !== -1) {
    type = type.trim().split(/ +/);
  }

  if (utils.is.array(type)) {
    for (var _i2 = 0; _i2 < type.length; _i2++) {
      var _ref2;

      _ref2 = type[_i2];
      var eventType = _ref2;

      interact.off(eventType, listener, options);
    }

    return interact;
  }

  if (utils.is.object(type)) {
    for (var prop in type) {
      interact.off(prop, type[prop], listener);
    }

    return interact;
  }

  if (!utils.arr.contains(_scope.scope.actions.eventTypes, type)) {
    _events2.default.remove(_scope.scope.document, type, listener, options);
  } else {
    var index = void 0;

    if (type in globalEvents && (index = globalEvents[type].indexOf(listener)) !== -1) {
      globalEvents[type].splice(index, 1);
    }
  }

  return interact;
};

/**
 * Returns an object which exposes internal data

 * @alias module:interact.debug
 *
 * @return {object} An object with properties that outline the current state
 * and expose internal functions and variables
 */
interact.debug = function () {
  return _scope.scope;
};

// expose the functions used to calculate multi-touch properties
interact.getPointerAverage = utils.pointer.pointerAverage;
interact.getTouchBBox = utils.pointer.touchBBox;
interact.getTouchDistance = utils.pointer.touchDistance;
interact.getTouchAngle = utils.pointer.touchAngle;

interact.getElementRect = utils.dom.getElementRect;
interact.getElementClientRect = utils.dom.getElementClientRect;
interact.matchesSelector = utils.dom.matchesSelector;
interact.closest = utils.dom.closest;

/**
 * @alias module:interact.supportsTouch
 *
 * @return {boolean} Whether or not the browser supports touch input
 */
interact.supportsTouch = function () {
  return _browser2.default.supportsTouch;
};

/**
 * @alias module:interact.supportsPointerEvent
 *
 * @return {boolean} Whether or not the browser supports PointerEvents
 */
interact.supportsPointerEvent = function () {
  return _browser2.default.supportsPointerEvent;
};

/**
 * Cancels all interactions (end events are not fired)
 *
 * @alias module:interact.stop
 *
 * @param {Event} event An event on which to call preventDefault()
 * @return {object} interact
 */
interact.stop = function (event) {
  for (var _i3 = 0; _i3 < _scope.scope.interactions.list.length; _i3++) {
    var _ref3;

    _ref3 = _scope.scope.interactions.list[_i3];
    var interaction = _ref3;

    interaction.stop(event);
  }

  return interact;
};

/**
 * Returns or sets the distance the pointer must be moved before an action
 * sequence occurs. This also affects tolerance for tap events.
 *
 * @alias module:interact.pointerMoveTolerance
 *
 * @param {number} [newValue] The movement from the start position must be greater than this value
 * @return {interact | number}
 */
interact.pointerMoveTolerance = function (newValue) {
  if (utils.is.number(newValue)) {
    _scope.scope.Interaction.pointerMoveTolerance = newValue;

    return interact;
  }

  return _scope.scope.Interaction.pointerMoveTolerance;
};

signals.on('unset', function (_ref4) {
  var interactable = _ref4.interactable;

  _scope.scope.interactables.list.splice(_scope.scope.interactables.list.indexOf(interactable), 1);

  // Stop related interactions when an Interactable is unset
  for (var _i4 = 0; _i4 < _scope.scope.interactions.list.length; _i4++) {
    var _ref5;

    _ref5 = _scope.scope.interactions.list[_i4];
    var interaction = _ref5;

    if (interaction.target === interactable && interaction.interacting() && interaction._ending) {
      interaction.stop();
    }
  }
});
interact.addDocument = _scope.scope.addDocument;
interact.removeDocument = _scope.scope.removeDocument;

_scope.scope.interactables = {
  // all set interactables
  list: [],

  indexOfElement: function indexOfElement(target, context) {
    context = context || _scope.scope.document;

    var list = this.list;

    for (var i = 0; i < list.length; i++) {
      var interactable = list[i];

      if (interactable.target === target && interactable._context === context) {
        return i;
      }
    }

    return -1;
  },
  get: function get(element, options, dontCheckInContext) {
    var ret = this.list[this.indexOfElement(element, options && options.context)];

    return ret && (utils.is.string(element) || dontCheckInContext || ret.inContext(element)) ? ret : null;
  },
  forEachMatch: function forEachMatch(element, callback) {
    for (var _i5 = 0; _i5 < this.list.length; _i5++) {
      var _ref6;

      _ref6 = this.list[_i5];
      var interactable = _ref6;

      var ret = void 0;

      if ((utils.is.string(interactable.target)
      // target is a selector and the element matches
      ? utils.is.element(element) && utils.dom.matchesSelector(element, interactable.target) :
      // target is the element
      element === interactable.target) &&
      // the element is in context
      interactable.inContext(element)) {
        ret = callback(interactable);
      }

      if (ret !== undefined) {
        return ret;
      }
    }
  },


  signals: signals
};

_scope.scope.interact = interact;

exports.default = interact;

},{"./scope":118,"./utils":129,"./utils/browser":121,"./utils/events":125}],103:[function(_dereq_,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.init = init;

var _is = _dereq_('./utils/is');

var is = _interopRequireWildcard(_is);

var _events = _dereq_('./utils/events');

var _events2 = _interopRequireDefault(_events);

var _browser = _dereq_('./utils/browser');

var _browser2 = _interopRequireDefault(_browser);

var _domUtils = _dereq_('./utils/domUtils');

var _window = _dereq_('./utils/window');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function preventDefault(interactable, newValue) {
  if (/^(always|never|auto)$/.test(newValue)) {
    interactable.options.preventDefault = newValue;
    return interactable;
  }

  if (is.bool(newValue)) {
    interactable.options.preventDefault = newValue ? 'always' : 'never';
    return interactable;
  }

  return interactable.options.preventDefault;
}

function checkAndPreventDefault(interactable, scope, event) {
  var setting = interactable.options.preventDefault;

  if (setting === 'never') {
    return;
  }

  if (setting === 'always') {
    event.preventDefault();
    return;
  }

  // setting === 'auto'

  // don't preventDefault of touch{start,move} events if the browser supports passive
  // events listeners. CSS touch-action and user-selecct should be used instead
  if (_events2.default.supportsPassive && /^touch(start|move)$/.test(event.type) && !_browser2.default.isIOS) {
    var docOptions = scope.getDocIndex((0, _window.getWindow)(event.target).document);

    if (!(docOptions && docOptions.events) || docOptions.events.passive !== false) {
      return;
    }
  }

  // don't preventDefault of pointerdown events
  if (/^(mouse|pointer|touch)*(down|start)/i.test(event.type)) {
    return;
  }

  // don't preventDefault on editable elements
  if (is.element(event.target) && (0, _domUtils.matchesSelector)(event.target, 'input,select,textarea,[contenteditable=true],[contenteditable=true] *')) {
    return;
  }

  event.preventDefault();
}

function onInteractionEvent(_ref) {
  var interaction = _ref.interaction,
      event = _ref.event;

  if (interaction.target) {
    interaction.target.checkAndPreventDefault(event);
  }
}

function init(scope) {
  /** @lends Interactable */
  var Interactable = scope.Interactable;
  /**
   * Returns or sets whether to prevent the browser's default behaviour in
   * response to pointer events. Can be set to:
   *  - `'always'` to always prevent
   *  - `'never'` to never prevent
   *  - `'auto'` to let interact.js try to determine what would be best
   *
   * @param {string} [newValue] `true`, `false` or `'auto'`
   * @return {string | Interactable} The current setting or this Interactable
   */
  Interactable.prototype.preventDefault = function (newValue) {
    return preventDefault(this, newValue);
  };

  Interactable.prototype.checkAndPreventDefault = function (event) {
    return checkAndPreventDefault(this, scope, event);
  };

  var _arr = ['down', 'move', 'up', 'cancel'];
  for (var _i = 0; _i < _arr.length; _i++) {
    var eventSignal = _arr[_i];
    scope.interactions.signals.on(eventSignal, onInteractionEvent);
  }

  // prevent native HTML5 drag on interact.js target elements
  scope.interactions.eventMap.dragstart = function preventNativeDrag(event) {
    for (var _i2 = 0; _i2 < scope.interactions.list.length; _i2++) {
      var _ref2;

      _ref2 = scope.interactions.list[_i2];
      var interaction = _ref2;


      if (interaction.element && (interaction.element === event.target || (0, _domUtils.nodeContains)(interaction.element, event.target))) {

        interaction.target.checkAndPreventDefault(event);
        return;
      }
    }
  };
}

exports.default = { init: init };

},{"./utils/browser":121,"./utils/domUtils":124,"./utils/events":125,"./utils/is":131,"./utils/window":139}],104:[function(_dereq_,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _classCallCheck2 = _dereq_('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _possibleConstructorReturn2 = _dereq_('babel-runtime/helpers/possibleConstructorReturn');

var _possibleConstructorReturn3 = _interopRequireDefault(_possibleConstructorReturn2);

var _inherits2 = _dereq_('babel-runtime/helpers/inherits');

var _inherits3 = _interopRequireDefault(_inherits2);

exports.newInteraction = newInteraction;

var _Interaction2 = _dereq_('./Interaction');

var _Interaction3 = _interopRequireDefault(_Interaction2);

var _events = _dereq_('./utils/events');

var _events2 = _interopRequireDefault(_events);

var _interactionFinder = _dereq_('./utils/interactionFinder');

var _interactionFinder2 = _interopRequireDefault(_interactionFinder);

var _browser = _dereq_('./utils/browser');

var _browser2 = _interopRequireDefault(_browser);

var _domObjects = _dereq_('./utils/domObjects');

var _domObjects2 = _interopRequireDefault(_domObjects);

var _pointerUtils = _dereq_('./utils/pointerUtils');

var _pointerUtils2 = _interopRequireDefault(_pointerUtils);

var _Signals = _dereq_('./utils/Signals');

var _Signals2 = _interopRequireDefault(_Signals);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var methodNames = ['pointerDown', 'pointerMove', 'pointerUp', 'updatePointer', 'removePointer', 'windowBlur'];

function init(scope) {
  var signals = new _Signals2.default();

  var listeners = {};

  for (var _i = 0; _i < methodNames.length; _i++) {
    var method = methodNames[_i];
    listeners[method] = doOnInteractions(method, scope);
  }

  var eventMap = {/* 'eventType': listenerFunc */};
  var pEventTypes = _browser2.default.pEventTypes;

  if (_domObjects2.default.PointerEvent) {
    eventMap[pEventTypes.down] = listeners.pointerDown;
    eventMap[pEventTypes.move] = listeners.pointerMove;
    eventMap[pEventTypes.up] = listeners.pointerUp;
    eventMap[pEventTypes.cancel] = listeners.pointerUp;
  } else {
    eventMap.mousedown = listeners.pointerDown;
    eventMap.mousemove = listeners.pointerMove;
    eventMap.mouseup = listeners.pointerUp;

    eventMap.touchstart = listeners.pointerDown;
    eventMap.touchmove = listeners.pointerMove;
    eventMap.touchend = listeners.pointerUp;
    eventMap.touchcancel = listeners.pointerUp;
  }

  eventMap.blur = function (event) {
    for (var _i2 = 0; _i2 < scope.interactions.list.length; _i2++) {
      var _ref;

      _ref = scope.interactions.list[_i2];
      var interaction = _ref;

      interaction.documentBlur(event);
    }
  };

  scope.signals.on('add-document', onDocSignal);
  scope.signals.on('remove-document', onDocSignal);

  // for ignoring browser's simulated mouse events
  scope.prevTouchTime = 0;

  // eslint-disable-next-line no-shadow
  scope.Interaction = function (_Interaction) {
    (0, _inherits3.default)(Interaction, _Interaction);

    function Interaction() {
      (0, _classCallCheck3.default)(this, Interaction);
      return (0, _possibleConstructorReturn3.default)(this, _Interaction.apply(this, arguments));
    }

    return Interaction;
  }(_Interaction3.default);
  scope.interactions = {
    signals: signals,
    // all active and idle interactions
    list: [],
    new: function _new(options) {
      options.signals = signals;

      return new scope.Interaction(options);
    },

    listeners: listeners,
    eventMap: eventMap
  };

  scope.actions = {
    names: [],
    methodDict: {},
    eventTypes: []
  };
}

function doOnInteractions(method, scope) {
  return function (event) {
    var interactions = scope.interactions.list;

    var pointerType = _pointerUtils2.default.getPointerType(event);

    var _pointerUtils$getEven = _pointerUtils2.default.getEventTargets(event),
        eventTarget = _pointerUtils$getEven[0],
        curEventTarget = _pointerUtils$getEven[1];

    var matches = []; // [ [pointer, interaction], ...]

    if (_browser2.default.supportsTouch && /touch/.test(event.type)) {
      scope.prevTouchTime = new Date().getTime();

      for (var _i3 = 0; _i3 < event.changedTouches.length; _i3++) {
        var _ref2;

        _ref2 = event.changedTouches[_i3];
        var changedTouch = _ref2;

        var pointer = changedTouch;
        var pointerId = _pointerUtils2.default.getPointerId(pointer);
        var interaction = getInteraction({
          pointer: pointer,
          pointerId: pointerId,
          pointerType: pointerType,
          eventType: event.type,
          eventTarget: eventTarget,
          scope: scope
        });

        matches.push([pointer, interaction]);
      }
    } else {
      var invalidPointer = false;

      if (!_browser2.default.supportsPointerEvent && /mouse/.test(event.type)) {
        // ignore mouse events while touch interactions are active
        for (var i = 0; i < interactions.length && !invalidPointer; i++) {
          invalidPointer = interactions[i].pointerType !== 'mouse' && interactions[i].pointerIsDown;
        }

        // try to ignore mouse events that are simulated by the browser
        // after a touch event
        invalidPointer = invalidPointer || new Date().getTime() - scope.prevTouchTime < 500
        // on iOS and Firefox Mobile, MouseEvent.timeStamp is zero if simulated
        || event.timeStamp === 0;
      }

      if (!invalidPointer) {
        var _interaction = getInteraction({
          pointer: event,
          pointerId: _pointerUtils2.default.getPointerId(event),
          pointerType: pointerType,
          eventType: event.type,
          eventTarget: eventTarget,
          scope: scope
        });

        matches.push([event, _interaction]);
      }
    }

    for (var _i4 = 0; _i4 < matches.length; _i4++) {
      var _ref3 = matches[_i4];
      var _pointer = _ref3[0];
      var _interaction2 = _ref3[1];

      _interaction2[method](_pointer, event, eventTarget, curEventTarget);
    }
  };
}

function getInteraction(searchDetails) {
  var pointerType = searchDetails.pointerType,
      scope = searchDetails.scope;


  var foundInteraction = _interactionFinder2.default.search(searchDetails);
  var signalArg = { interaction: foundInteraction, searchDetails: searchDetails };

  scope.interactions.signals.fire('find', signalArg);

  return signalArg.interaction || newInteraction({ pointerType: pointerType }, scope);
}

function newInteraction(options, scope) {
  var interaction = scope.interactions.new(options);

  scope.interactions.list.push(interaction);
  return interaction;
}

function onDocSignal(_ref4, signalName) {
  var doc = _ref4.doc,
      scope = _ref4.scope,
      options = _ref4.options;
  var eventMap = scope.interactions.eventMap;

  var eventMethod = signalName.indexOf('add') === 0 ? _events2.default.add : _events2.default.remove;

  // delegate event listener
  for (var eventType in _events2.default.delegatedEvents) {
    eventMethod(doc, eventType, _events2.default.delegateListener);
    eventMethod(doc, eventType, _events2.default.delegateUseCapture, true);
  }

  var eventOptions = options && options.events;

  for (var _eventType in eventMap) {
    eventMethod(doc, _eventType, eventMap[_eventType], eventOptions);
  }
}

exports.default = {
  init: init,
  onDocSignal: onDocSignal,
  doOnInteractions: doOnInteractions,
  newInteraction: newInteraction,
  methodNames: methodNames
};

},{"./Interaction":86,"./utils/Signals":119,"./utils/browser":121,"./utils/domObjects":123,"./utils/events":125,"./utils/interactionFinder":130,"./utils/pointerUtils":134,"babel-runtime/helpers/classCallCheck":7,"babel-runtime/helpers/inherits":9,"babel-runtime/helpers/possibleConstructorReturn":10}],105:[function(_dereq_,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extend = _dereq_('../utils/extend');

var _extend2 = _interopRequireDefault(_extend);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function init(scope) {
  var interactions = scope.interactions;


  scope.modifiers = { names: [] };

  interactions.signals.on('new', function (interaction) {
    interaction.modifiers = {
      startOffset: { left: 0, right: 0, top: 0, bottom: 0 },
      offsets: {},
      statuses: resetStatuses({}, scope.modifiers),
      result: null
    };
  });

  interactions.signals.on('before-action-start', function (arg) {
    return start(arg, scope.modifiers, arg.interaction.startCoords.page);
  });

  interactions.signals.on('action-resume', function (arg) {
    beforeMove(arg, scope.modifiers);
    start(arg, scope.modifiers, arg.interaction.curCoords.page);
  });

  interactions.signals.on('before-action-move', function (arg) {
    return beforeMove(arg, scope.modifiers);
  });
  interactions.signals.on('before-action-end', function (arg) {
    return beforeEnd(arg, scope.modifiers);
  });

  interactions.signals.on('before-action-start', function (arg) {
    return setCurCoords(arg, scope.modifiers);
  });
  interactions.signals.on('before-action-move', function (arg) {
    return setCurCoords(arg, scope.modifiers);
  });
}

function setOffsets(arg, modifiers) {
  var interaction = arg.interaction,
      page = arg.pageCoords;
  var target = interaction.target,
      element = interaction.element,
      startOffset = interaction.modifiers.startOffset;

  var rect = target.getRect(element);

  if (rect) {
    startOffset.left = page.x - rect.left;
    startOffset.top = page.y - rect.top;

    startOffset.right = rect.right - page.x;
    startOffset.bottom = rect.bottom - page.y;

    if (!('width' in rect)) {
      rect.width = rect.right - rect.left;
    }
    if (!('height' in rect)) {
      rect.height = rect.bottom - rect.top;
    }
  } else {
    startOffset.left = startOffset.top = startOffset.right = startOffset.bottom = 0;
  }

  arg.rect = rect;
  arg.interactable = target;
  arg.element = element;

  for (var _i = 0; _i < modifiers.names.length; _i++) {
    var _ref;

    _ref = modifiers.names[_i];
    var modifierName = _ref;

    arg.options = target.options[interaction.prepared.name][modifierName];

    if (!arg.options) {
      continue;
    }

    interaction.modifiers.offsets[modifierName] = modifiers[modifierName].setOffset(arg);
  }
}

function setAll(arg, modifiers) {
  var interaction = arg.interaction,
      statuses = arg.statuses,
      preEnd = arg.preEnd,
      requireEndOnly = arg.requireEndOnly;


  arg.modifiedCoords = (0, _extend2.default)({}, arg.pageCoords);

  var result = {
    delta: { x: 0, y: 0 },
    coords: arg.modifiedCoords,
    changed: false,
    locked: false,
    shouldMove: true
  };

  for (var _i2 = 0; _i2 < modifiers.names.length; _i2++) {
    var _ref2;

    _ref2 = modifiers.names[_i2];
    var modifierName = _ref2;

    var modifier = modifiers[modifierName];
    var options = interaction.target.options[interaction.prepared.name][modifierName];

    if (!shouldDo(options, preEnd, requireEndOnly)) {
      continue;
    }

    arg.status = arg.status = statuses[modifierName];
    arg.options = options;
    arg.offset = arg.interaction.modifiers.offsets[modifierName];

    modifier.set(arg);

    if (arg.status.locked) {
      arg.modifiedCoords.x += arg.status.delta.x;
      arg.modifiedCoords.y += arg.status.delta.y;

      result.delta.x += arg.status.delta.x;
      result.delta.y += arg.status.delta.y;

      result.locked = true;
    }
  }

  var changed = interaction.curCoords.page.x !== arg.modifiedCoords.x || interaction.curCoords.page.y !== arg.modifiedCoords.y;

  // a move should be fired if:
  //  - there are no modifiers enabled,
  //  - no modifiers are "locked" i.e. have changed the pointer's coordinates, or
  //  - the locked coords have changed since the last pointer move
  result.shouldMove = !arg.status || !result.locked || changed;

  return result;
}

function resetStatuses(statuses, modifiers) {
  for (var _i3 = 0; _i3 < modifiers.names.length; _i3++) {
    var _ref3;

    _ref3 = modifiers.names[_i3];
    var modifierName = _ref3;

    var status = statuses[modifierName] || {};

    status.delta = { x: 0, y: 0 };
    status.locked = false;

    statuses[modifierName] = status;
  }

  return statuses;
}

function start(_ref4, modifiers, pageCoords) {
  var interaction = _ref4.interaction;

  var arg = {
    interaction: interaction,
    pageCoords: pageCoords,
    startOffset: interaction.modifiers.startOffset,
    statuses: interaction.modifiers.statuses,
    preEnd: false,
    requireEndOnly: false
  };

  setOffsets(arg, modifiers);
  resetStatuses(arg.statuses, modifiers);

  arg.pageCoords = (0, _extend2.default)({}, interaction.startCoords.page);
  interaction.modifiers.result = setAll(arg, modifiers);
}

function beforeMove(_ref5, modifiers) {
  var interaction = _ref5.interaction,
      preEnd = _ref5.preEnd,
      interactingBeforeMove = _ref5.interactingBeforeMove;

  var modifierResult = setAll({
    interaction: interaction,
    preEnd: preEnd,
    pageCoords: interaction.curCoords.page,
    statuses: interaction.modifiers.statuses,
    requireEndOnly: false
  }, modifiers);

  interaction.modifiers.result = modifierResult;

  // don't fire an action move if a modifier would keep the event in the same
  // cordinates as before
  if (!modifierResult.shouldMove && interactingBeforeMove) {
    return false;
  }
}

function beforeEnd(_ref6, modifiers) {
  var interaction = _ref6.interaction,
      event = _ref6.event;

  for (var _i4 = 0; _i4 < modifiers.names.length; _i4++) {
    var _ref7;

    _ref7 = modifiers.names[_i4];
    var modifierName = _ref7;

    var options = interaction.target.options[interaction.prepared.name][modifierName];

    // if the endOnly option is true for any modifier
    if (shouldDo(options, true, true)) {
      // fire a move event at the modified coordinates
      interaction.move({ event: event, preEnd: true });
      break;
    }
  }
}

function setCurCoords(arg, modifiers) {
  var interaction = arg.interaction;

  var modifierArg = (0, _extend2.default)({
    page: interaction.curCoords.page,
    client: interaction.curCoords.client
  }, arg);

  for (var i = 0; i < modifiers.names.length; i++) {
    var modifierName = modifiers.names[i];
    modifierArg.options = interaction.target.options[interaction.prepared.name][modifierName];

    if (!modifierArg.options) {
      continue;
    }

    var modifier = modifiers[modifierName];

    modifierArg.status = interaction.modifiers.statuses[modifierName];

    modifier.modifyCoords(modifierArg);
  }
}

function shouldDo(options, preEnd, requireEndOnly) {
  return options && options.enabled && (preEnd || !options.endOnly) && (!requireEndOnly || options.endOnly);
}

exports.default = {
  init: init,
  setOffsets: setOffsets,
  setAll: setAll,
  resetStatuses: resetStatuses,
  start: start,
  beforeMove: beforeMove,
  beforeEnd: beforeEnd,
  shouldDo: shouldDo
};

},{"../utils/extend":126}],106:[function(_dereq_,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.init = exports.restrictSize = exports.restrictEdges = exports.restrict = exports.snapSize = exports.snap = exports.modifiers = undefined;

var _base = _dereq_('./base');

var _base2 = _interopRequireDefault(_base);

var _snap = _dereq_('./snap');

var _snap2 = _interopRequireDefault(_snap);

var _snapSize = _dereq_('./snapSize');

var _snapSize2 = _interopRequireDefault(_snapSize);

var _restrict = _dereq_('./restrict');

var _restrict2 = _interopRequireDefault(_restrict);

var _restrictEdges = _dereq_('./restrictEdges');

var _restrictEdges2 = _interopRequireDefault(_restrictEdges);

var _restrictSize = _dereq_('./restrictSize');

var _restrictSize2 = _interopRequireDefault(_restrictSize);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function init(scope) {
  _base2.default.init(scope);
  _snap2.default.init(scope);
  _snapSize2.default.init(scope);
  _restrict2.default.init(scope);
  _restrictEdges2.default.init(scope);
  _restrictSize2.default.init(scope);
}

exports.modifiers = _base2.default;
exports.snap = _snap2.default;
exports.snapSize = _snapSize2.default;
exports.restrict = _restrict2.default;
exports.restrictEdges = _restrictEdges2.default;
exports.restrictSize = _restrictSize2.default;
exports.init = init;

},{"./base":105,"./restrict":107,"./restrictEdges":108,"./restrictSize":109,"./snap":110,"./snapSize":111}],107:[function(_dereq_,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _is = _dereq_('../utils/is');

var is = _interopRequireWildcard(_is);

var _extend = _dereq_('../utils/extend');

var _extend2 = _interopRequireDefault(_extend);

var _rect = _dereq_('../utils/rect');

var _rect2 = _interopRequireDefault(_rect);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function init(scope) {
  var modifiers = scope.modifiers,
      defaults = scope.defaults;


  modifiers.restrict = restrict;
  modifiers.names.push('restrict');

  defaults.perAction.restrict = restrict.defaults;
}

function setOffset(_ref) {
  var rect = _ref.rect,
      startOffset = _ref.startOffset,
      options = _ref.options;

  var elementRect = options && options.elementRect;
  var offset = {};

  if (rect && elementRect) {
    offset.left = startOffset.left - rect.width * elementRect.left;
    offset.top = startOffset.top - rect.height * elementRect.top;

    offset.right = startOffset.right - rect.width * (1 - elementRect.right);
    offset.bottom = startOffset.bottom - rect.height * (1 - elementRect.bottom);
  } else {
    offset.left = offset.top = offset.right = offset.bottom = 0;
  }

  return offset;
}

function set(_ref2) {
  var modifiedCoords = _ref2.modifiedCoords,
      interaction = _ref2.interaction,
      status = _ref2.status,
      offset = _ref2.offset,
      options = _ref2.options;

  if (!options) {
    return status;
  }

  var page = (0, _extend2.default)({}, modifiedCoords);

  var restriction = getRestrictionRect(options.restriction, interaction, page);

  if (!restriction) {
    return status;
  }

  status.delta.x = 0;
  status.delta.y = 0;
  status.locked = false;

  var rect = restriction;
  var modifiedX = page.x;
  var modifiedY = page.y;

  // object is assumed to have
  // x, y, width, height or
  // left, top, right, bottom
  if ('x' in restriction && 'y' in restriction) {
    modifiedX = Math.max(Math.min(rect.x + rect.width - offset.right, page.x), rect.x + offset.left);
    modifiedY = Math.max(Math.min(rect.y + rect.height - offset.bottom, page.y), rect.y + offset.top);
  } else {
    modifiedX = Math.max(Math.min(rect.right - offset.right, page.x), rect.left + offset.left);
    modifiedY = Math.max(Math.min(rect.bottom - offset.bottom, page.y), rect.top + offset.top);
  }

  status.delta.x = modifiedX - page.x;
  status.delta.y = modifiedY - page.y;

  status.locked = !!(status.delta.x || status.delta.y);

  status.modifiedX = modifiedX;
  status.modifiedY = modifiedY;
}

function modifyCoords(_ref3) {
  var page = _ref3.page,
      client = _ref3.client,
      status = _ref3.status,
      phase = _ref3.phase,
      options = _ref3.options;

  var elementRect = options && options.elementRect;

  if (options && options.enabled && !(phase === 'start' && elementRect && status.locked)) {

    if (status.locked) {
      page.x += status.delta.x;
      page.y += status.delta.y;
      client.x += status.delta.x;
      client.y += status.delta.y;
    }
  }
}

function getRestrictionRect(value, interaction, page) {
  if (is.func(value)) {
    return _rect2.default.resolveRectLike(value, interaction.target, interaction.element, [page.x, page.y, interaction]);
  } else {
    return _rect2.default.resolveRectLike(value, interaction.target, interaction.element);
  }
}

var restrict = {
  init: init,
  setOffset: setOffset,
  set: set,
  modifyCoords: modifyCoords,
  getRestrictionRect: getRestrictionRect,
  defaults: {
    enabled: false,
    endOnly: false,
    restriction: null,
    elementRect: null
  }
};

exports.default = restrict;

},{"../utils/extend":126,"../utils/is":131,"../utils/rect":136}],108:[function(_dereq_,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extend = _dereq_('../utils/extend');

var _extend2 = _interopRequireDefault(_extend);

var _rect = _dereq_('../utils/rect');

var _rect2 = _interopRequireDefault(_rect);

var _restrict = _dereq_('./restrict');

var _restrict2 = _interopRequireDefault(_restrict);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var getRestrictionRect = _restrict2.default.getRestrictionRect; // This module adds the options.resize.restrictEdges setting which sets min and
// max for the top, left, bottom and right edges of the target being resized.
//
// interact(target).resize({
//   edges: { top: true, left: true },
//   restrictEdges: {
//     inner: { top: 200, left: 200, right: 400, bottom: 400 },
//     outer: { top:   0, left:   0, right: 600, bottom: 600 },
//   },
// });

var noInner = { top: +Infinity, left: +Infinity, bottom: -Infinity, right: -Infinity };
var noOuter = { top: -Infinity, left: -Infinity, bottom: +Infinity, right: +Infinity };

function init(scope) {
  var modifiers = scope.modifiers,
      defaults = scope.defaults;


  modifiers.restrictEdges = restrictEdges;
  modifiers.names.push('restrictEdges');

  defaults.perAction.restrictEdges = restrictEdges.defaults;
}

function setOffset(_ref) {
  var interaction = _ref.interaction,
      options = _ref.options;

  var startOffset = interaction.modifiers.startOffset;
  var offset = void 0;

  if (options) {
    var offsetRect = getRestrictionRect(options.offset, interaction, interaction.startCoords.page);

    offset = _rect2.default.rectToXY(offsetRect);
  }

  offset = offset || { x: 0, y: 0 };

  return {
    top: offset.y + startOffset.top,
    left: offset.x + startOffset.left,
    bottom: offset.y - startOffset.bottom,
    right: offset.x - startOffset.right
  };
}

function set(_ref2) {
  var modifiedCoords = _ref2.modifiedCoords,
      interaction = _ref2.interaction,
      status = _ref2.status,
      offset = _ref2.offset,
      options = _ref2.options;

  var edges = interaction.prepared.linkedEdges || interaction.prepared.edges;

  if (!interaction.interacting() || !edges) {
    return;
  }

  var page = (0, _extend2.default)({}, modifiedCoords);
  var inner = getRestrictionRect(options.inner, interaction, page) || {};
  var outer = getRestrictionRect(options.outer, interaction, page) || {};

  fixRect(inner, noInner);
  fixRect(outer, noOuter);

  var modifiedX = page.x;
  var modifiedY = page.y;

  status.delta.x = 0;
  status.delta.y = 0;
  status.locked = false;

  if (edges.top) {
    modifiedY = Math.min(Math.max(outer.top + offset.top, page.y), inner.top + offset.top);
  } else if (edges.bottom) {
    modifiedY = Math.max(Math.min(outer.bottom + offset.bottom, page.y), inner.bottom + offset.bottom);
  }
  if (edges.left) {
    modifiedX = Math.min(Math.max(outer.left + offset.left, page.x), inner.left + offset.left);
  } else if (edges.right) {
    modifiedX = Math.max(Math.min(outer.right + offset.right, page.x), inner.right + offset.right);
  }

  status.delta.x = modifiedX - page.x;
  status.delta.y = modifiedY - page.y;

  status.locked = !!(status.delta.x || status.delta.y);
}

function modifyCoords(_ref3) {
  var page = _ref3.page,
      client = _ref3.client,
      status = _ref3.status,
      phase = _ref3.phase,
      options = _ref3.options;

  if (options && options.enabled && phase !== 'start') {

    if (status.locked) {
      page.x += status.delta.x;
      page.y += status.delta.y;
      client.x += status.delta.x;
      client.y += status.delta.y;
    }
  }
}

function fixRect(rect, defaults) {
  var _arr = ['top', 'left', 'bottom', 'right'];

  for (var _i = 0; _i < _arr.length; _i++) {
    var edge = _arr[_i];
    if (!(edge in rect)) {
      rect[edge] = defaults[edge];
    }
  }

  return rect;
}

var restrictEdges = {
  init: init,
  noInner: noInner,
  noOuter: noOuter,
  getRestrictionRect: getRestrictionRect,
  setOffset: setOffset,
  set: set,
  modifyCoords: modifyCoords,
  defaults: {
    enabled: false,
    endOnly: false,
    inner: null,
    outer: null,
    offset: null
  }
};

exports.default = restrictEdges;

},{"../utils/extend":126,"../utils/rect":136,"./restrict":107}],109:[function(_dereq_,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extend = _dereq_('../utils/extend');

var _extend2 = _interopRequireDefault(_extend);

var _rect = _dereq_('../utils/rect');

var _rect2 = _interopRequireDefault(_rect);

var _restrictEdges = _dereq_('./restrictEdges');

var _restrictEdges2 = _interopRequireDefault(_restrictEdges);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var noMin = { width: -Infinity, height: -Infinity }; // This module adds the options.resize.restrictSize setting which sets min and
// max width and height for the target being resized.
//
// interact(target).resize({
//   edges: { top: true, left: true },
//   restrictSize: {
//     min: { width: -600, height: -600 },
//     max: { width:  600, height:  600 },
//   },
// });

var noMax = { width: +Infinity, height: +Infinity };

function init(scope) {
  var modifiers = scope.modifiers,
      defaults = scope.defaults;


  modifiers.restrictSize = restrictSize;
  modifiers.names.push('restrictSize');

  defaults.perAction.restrictSize = restrictSize.defaults;
}

function setOffset(_ref) {
  var interaction = _ref.interaction;

  return _restrictEdges2.default.setOffset({ interaction: interaction });
}

function set(arg) {
  var interaction = arg.interaction,
      options = arg.options;

  var edges = interaction.prepared.linkedEdges || interaction.prepared.edges;

  if (!interaction.interacting() || !edges) {
    return;
  }

  var rect = _rect2.default.xywhToTlbr(interaction.resizeRects.inverted);

  var minSize = _rect2.default.tlbrToXywh(_restrictEdges2.default.getRestrictionRect(options.min, interaction)) || noMin;
  var maxSize = _rect2.default.tlbrToXywh(_restrictEdges2.default.getRestrictionRect(options.max, interaction)) || noMax;

  arg.options = {
    enabled: options.enabled,
    endOnly: options.endOnly,
    inner: (0, _extend2.default)({}, _restrictEdges2.default.noInner),
    outer: (0, _extend2.default)({}, _restrictEdges2.default.noOuter)
  };

  if (edges.top) {
    arg.options.inner.top = rect.bottom - minSize.height;
    arg.options.outer.top = rect.bottom - maxSize.height;
  } else if (edges.bottom) {
    arg.options.inner.bottom = rect.top + minSize.height;
    arg.options.outer.bottom = rect.top + maxSize.height;
  }
  if (edges.left) {
    arg.options.inner.left = rect.right - minSize.width;
    arg.options.outer.left = rect.right - maxSize.width;
  } else if (edges.right) {
    arg.options.inner.right = rect.left + minSize.width;
    arg.options.outer.right = rect.left + maxSize.width;
  }

  _restrictEdges2.default.set(arg);
}

var restrictSize = {
  init: init,
  setOffset: setOffset,
  set: set,
  modifyCoords: _restrictEdges2.default.modifyCoords,
  defaults: {
    enabled: false,
    endOnly: false,
    min: null,
    max: null
  }
};

exports.default = restrictSize;

},{"../utils/extend":126,"../utils/rect":136,"./restrictEdges":108}],110:[function(_dereq_,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _utils = _dereq_('../utils');

var utils = _interopRequireWildcard(_utils);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function init(scope) {
  var modifiers = scope.modifiers,
      defaults = scope.defaults;


  modifiers.snap = snap;
  modifiers.names.push('snap');

  defaults.perAction.snap = snap.defaults;
}

function setOffset(_ref) {
  var interaction = _ref.interaction,
      interactable = _ref.interactable,
      element = _ref.element,
      rect = _ref.rect,
      startOffset = _ref.startOffset,
      options = _ref.options;

  var offsets = [];
  var optionsOrigin = utils.rect.rectToXY(utils.rect.resolveRectLike(options.origin));
  var origin = optionsOrigin || utils.getOriginXY(interactable, element, interaction.prepared.name);
  options = options || interactable.options[interaction.prepared.name].snap || {};

  var snapOffset = void 0;

  if (options.offset === 'startCoords') {
    snapOffset = {
      x: interaction.startCoords.page.x - origin.x,
      y: interaction.startCoords.page.y - origin.y
    };
  } else {
    var offsetRect = utils.rect.resolveRectLike(options.offset, interactable, element, [interaction]);

    snapOffset = utils.rect.rectToXY(offsetRect) || { x: 0, y: 0 };
  }

  if (rect && options.relativePoints && options.relativePoints.length) {
    for (var _i = 0; _i < (options.relativePoints || []).length; _i++) {
      var _ref3;

      _ref3 = (options.relativePoints || [])[_i];
      var _ref2 = _ref3;
      var relativeX = _ref2.x;
      var relativeY = _ref2.y;

      offsets.push({
        x: startOffset.left - rect.width * relativeX + snapOffset.x,
        y: startOffset.top - rect.height * relativeY + snapOffset.y
      });
    }
  } else {
    offsets.push(snapOffset);
  }

  return offsets;
}

function set(_ref4) {
  var interaction = _ref4.interaction,
      modifiedCoords = _ref4.modifiedCoords,
      status = _ref4.status,
      options = _ref4.options,
      offsets = _ref4.offset;

  var origin = utils.getOriginXY(interaction.target, interaction.element, interaction.prepared.name);
  var page = utils.extend({}, modifiedCoords);
  var targets = [];
  var target = void 0;
  var i = void 0;

  page.x -= origin.x;
  page.y -= origin.y;

  status.realX = page.x;
  status.realY = page.y;

  var len = options.targets ? options.targets.length : 0;

  for (var _i2 = 0; _i2 < offsets.length; _i2++) {
    var _ref6;

    _ref6 = offsets[_i2];
    var _ref5 = _ref6;
    var offsetX = _ref5.x;
    var offsetY = _ref5.y;

    var relativeX = page.x - offsetX;
    var relativeY = page.y - offsetY;

    for (var _i3 = 0; _i3 < options.targets.length; _i3++) {
      var _ref7;

      _ref7 = options.targets[_i3];
      var snapTarget = _ref7;

      if (utils.is.func(snapTarget)) {
        target = snapTarget(relativeX, relativeY, interaction);
      } else {
        target = snapTarget;
      }

      if (!target) {
        continue;
      }

      targets.push({
        x: utils.is.number(target.x) ? target.x + offsetX : relativeX,
        y: utils.is.number(target.y) ? target.y + offsetY : relativeY,

        range: utils.is.number(target.range) ? target.range : options.range
      });
    }
  }

  var closest = {
    target: null,
    inRange: false,
    distance: 0,
    range: 0,
    dx: 0,
    dy: 0
  };

  for (i = 0, len = targets.length; i < len; i++) {
    target = targets[i];

    var range = target.range;
    var dx = target.x - page.x;
    var dy = target.y - page.y;
    var distance = utils.hypot(dx, dy);
    var inRange = distance <= range;

    // Infinite targets count as being out of range
    // compared to non infinite ones that are in range
    if (range === Infinity && closest.inRange && closest.range !== Infinity) {
      inRange = false;
    }

    if (!closest.target || (inRange
    // is the closest target in range?
    ? closest.inRange && range !== Infinity
    // the pointer is relatively deeper in this target
    ? distance / range < closest.distance / closest.range
    // this target has Infinite range and the closest doesn't
    : range === Infinity && closest.range !== Infinity ||
    // OR this target is closer that the previous closest
    distance < closest.distance :
    // The other is not in range and the pointer is closer to this target
    !closest.inRange && distance < closest.distance)) {

      closest.target = target;
      closest.distance = distance;
      closest.range = range;
      closest.inRange = inRange;
      closest.dx = dx;
      closest.dy = dy;

      status.range = range;
    }
  }

  status.modifiedX = closest.target.x;
  status.modifiedY = closest.target.y;

  status.delta.x = closest.dx;
  status.delta.y = closest.dy;

  status.locked = closest.inRange;
}

function modifyCoords(_ref8) {
  var page = _ref8.page,
      client = _ref8.client,
      status = _ref8.status,
      phase = _ref8.phase,
      options = _ref8.options;

  var relativePoints = options && options.relativePoints;

  if (options && options.enabled && !(phase === 'start' && relativePoints && relativePoints.length)) {

    if (status.locked) {
      page.x += status.delta.x;
      page.y += status.delta.y;
      client.x += status.delta.x;
      client.y += status.delta.y;
    }

    return {
      range: status.range,
      locked: status.locked,
      x: status.modifiedX,
      y: status.modifiedY,
      realX: status.realX,
      realY: status.realY,
      dx: status.delta.x,
      dy: status.delta.y
    };
  }
}

var snap = {
  init: init,
  setOffset: setOffset,
  set: set,
  modifyCoords: modifyCoords,
  defaults: {
    enabled: false,
    endOnly: false,
    range: Infinity,
    targets: null,
    offsets: null,

    relativePoints: null
  }
};

exports.default = snap;

},{"../utils":129}],111:[function(_dereq_,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extend = _dereq_('../utils/extend');

var _extend2 = _interopRequireDefault(_extend);

var _is = _dereq_('../utils/is');

var is = _interopRequireWildcard(_is);

var _snap = _dereq_('./snap');

var _snap2 = _interopRequireDefault(_snap);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function init(scope) {
  var modifiers = scope.modifiers,
      defaults = scope.defaults;


  modifiers.snapSize = snapSize;
  modifiers.names.push('snapSize');

  defaults.perAction.snapSize = snapSize.defaults;
} // This module allows snapping of the size of targets during resize
// interactions.

function setOffset(arg) {
  var interaction = arg.interaction,
      options = arg.options;

  var edges = interaction.prepared.edges;

  if (!edges) {
    return;
  }

  arg.options = {
    relativePoints: [{
      x: edges.left ? 0 : 1,
      y: edges.top ? 0 : 1
    }],
    origin: { x: 0, y: 0 },
    offset: 'self',
    range: options.range
  };

  var offsets = _snap2.default.setOffset(arg);
  arg.options = options;

  return offsets;
}

function set(arg) {
  var interaction = arg.interaction,
      options = arg.options,
      offset = arg.offset,
      modifiedCoords = arg.modifiedCoords;

  var page = (0, _extend2.default)({}, modifiedCoords);
  var relativeX = page.x - offset[0].x;
  var relativeY = page.y - offset[0].y;

  arg.options = (0, _extend2.default)({}, options);
  arg.options.targets = [];

  for (var _i = 0; _i < (options.targets || []).length; _i++) {
    var _ref;

    _ref = (options.targets || [])[_i];
    var snapTarget = _ref;

    var target = void 0;

    if (is.func(snapTarget)) {
      target = snapTarget(relativeX, relativeY, interaction);
    } else {
      target = snapTarget;
    }

    if (!target) {
      continue;
    }

    if ('width' in target && 'height' in target) {
      target.x = target.width;
      target.y = target.height;
    }

    arg.options.targets.push(target);
  }

  _snap2.default.set(arg);
}

function modifyCoords(arg) {
  var options = arg.options;


  arg.options = (0, _extend2.default)({}, options);
  arg.options.enabled = options.enabled;
  arg.options.relativePoints = [null];

  _snap2.default.modifyCoords(arg);
}

var snapSize = {
  init: init,
  setOffset: setOffset,
  set: set,
  modifyCoords: modifyCoords,
  defaults: {
    enabled: false,
    endOnly: false,
    range: Infinity,
    targets: null,
    offsets: null
  }
};

exports.default = snapSize;

},{"../utils/extend":126,"../utils/is":131,"./snap":110}],112:[function(_dereq_,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _classCallCheck2 = _dereq_('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _pointerUtils = _dereq_('../utils/pointerUtils');

var _pointerUtils2 = _interopRequireDefault(_pointerUtils);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var PointerEvent = function () {
  /** */
  function PointerEvent(type, pointer, event, eventTarget, interaction) {
    (0, _classCallCheck3.default)(this, PointerEvent);

    _pointerUtils2.default.pointerExtend(this, event);

    if (event !== pointer) {
      _pointerUtils2.default.pointerExtend(this, pointer);
    }

    this.interaction = interaction;

    this.timeStamp = new Date().getTime();
    this.originalEvent = event;
    this.type = type;
    this.pointerId = _pointerUtils2.default.getPointerId(pointer);
    this.pointerType = _pointerUtils2.default.getPointerType(pointer);
    this.target = eventTarget;
    this.currentTarget = null;

    if (type === 'tap') {
      var pointerIndex = interaction.getPointerIndex(pointer);
      this.dt = this.timeStamp - interaction.pointers[pointerIndex].downTime;

      var interval = this.timeStamp - interaction.tapTime;

      this.double = !!(interaction.prevTap && interaction.prevTap.type !== 'doubletap' && interaction.prevTap.target === this.target && interval < 500);
    } else if (type === 'doubletap') {
      this.dt = pointer.timeStamp - interaction.tapTime;
    }
  }

  PointerEvent.prototype.subtractOrigin = function subtractOrigin(_ref) {
    var originX = _ref.x,
        originY = _ref.y;

    this.pageX -= originX;
    this.pageY -= originY;
    this.clientX -= originX;
    this.clientY -= originY;

    return this;
  };

  PointerEvent.prototype.addOrigin = function addOrigin(_ref2) {
    var originX = _ref2.x,
        originY = _ref2.y;

    this.pageX += originX;
    this.pageY += originY;
    this.clientX += originX;
    this.clientY += originY;

    return this;
  };

  /** */


  PointerEvent.prototype.preventDefault = function preventDefault() {
    this.originalEvent.preventDefault();
  };

  /** */


  PointerEvent.prototype.stopPropagation = function stopPropagation() {
    this.propagationStopped = true;
  };

  /** */


  PointerEvent.prototype.stopImmediatePropagation = function stopImmediatePropagation() {
    this.immediatePropagationStopped = this.propagationStopped = true;
  };

  return PointerEvent;
}();

exports.default = PointerEvent;

},{"../utils/pointerUtils":134,"babel-runtime/helpers/classCallCheck":7}],113:[function(_dereq_,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _utils = _dereq_('../utils');

var utils = _interopRequireWildcard(_utils);

var _PointerEvent = _dereq_('./PointerEvent');

var _PointerEvent2 = _interopRequireDefault(_PointerEvent);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

var signals = new utils.Signals();
var simpleSignals = ['down', 'up', 'cancel'];
var simpleEvents = ['down', 'up', 'cancel'];

var pointerEvents = {
  init: init,
  signals: signals,
  PointerEvent: _PointerEvent2.default,
  fire: fire,
  collectEventTargets: collectEventTargets,
  createSignalListener: createSignalListener,
  defaults: {
    holdDuration: 600,
    ignoreFrom: null,
    allowFrom: null,
    origin: { x: 0, y: 0 }
  },
  types: ['down', 'move', 'up', 'cancel', 'tap', 'doubletap', 'hold']
};

function fire(arg) {
  var interaction = arg.interaction,
      pointer = arg.pointer,
      event = arg.event,
      eventTarget = arg.eventTarget,
      _arg$type = arg.type,
      type = _arg$type === undefined ? arg.pointerEvent.type : _arg$type,
      _arg$targets = arg.targets,
      targets = _arg$targets === undefined ? collectEventTargets(arg) : _arg$targets,
      _arg$pointerEvent = arg.pointerEvent,
      pointerEvent = _arg$pointerEvent === undefined ? new _PointerEvent2.default(type, pointer, event, eventTarget, interaction) : _arg$pointerEvent;


  var signalArg = {
    interaction: interaction,
    pointer: pointer,
    event: event,
    eventTarget: eventTarget,
    targets: targets,
    type: type,
    pointerEvent: pointerEvent
  };

  for (var i = 0; i < targets.length; i++) {
    var target = targets[i];

    for (var prop in target.props || {}) {
      pointerEvent[prop] = target.props[prop];
    }

    var origin = utils.getOriginXY(target.eventable, target.element);

    pointerEvent.subtractOrigin(origin);
    pointerEvent.eventable = target.eventable;
    pointerEvent.currentTarget = target.element;

    target.eventable.fire(pointerEvent);

    pointerEvent.addOrigin(origin);

    if (pointerEvent.immediatePropagationStopped || pointerEvent.propagationStopped && i + 1 < targets.length && targets[i + 1].element !== pointerEvent.currentTarget) {
      break;
    }
  }

  signals.fire('fired', signalArg);

  if (type === 'tap') {
    // if pointerEvent should make a double tap, create and fire a doubletap
    // PointerEvent and use that as the prevTap
    var prevTap = pointerEvent.double ? fire({
      interaction: interaction, pointer: pointer, event: event, eventTarget: eventTarget,
      type: 'doubletap'
    }) : pointerEvent;

    interaction.prevTap = prevTap;
    interaction.tapTime = prevTap.timeStamp;
  }

  return pointerEvent;
}

function collectEventTargets(_ref) {
  var interaction = _ref.interaction,
      pointer = _ref.pointer,
      event = _ref.event,
      eventTarget = _ref.eventTarget,
      type = _ref.type;

  var pointerIndex = interaction.getPointerIndex(pointer);
  var pointerInfo = interaction.pointers[pointerIndex];

  // do not fire a tap event if the pointer was moved before being lifted
  if (type === 'tap' && (interaction.pointerWasMoved
  // or if the pointerup target is different to the pointerdown target
  || !(pointerInfo && pointerInfo.downTarget === eventTarget))) {
    return [];
  }

  var path = utils.dom.getPath(eventTarget);
  var signalArg = {
    interaction: interaction,
    pointer: pointer,
    event: event,
    eventTarget: eventTarget,
    type: type,
    path: path,
    targets: [],
    element: null
  };

  for (var _i = 0; _i < path.length; _i++) {
    var _ref2;

    _ref2 = path[_i];
    var element = _ref2;

    signalArg.element = element;

    signals.fire('collect-targets', signalArg);
  }

  if (type === 'hold') {
    signalArg.targets = signalArg.targets.filter(function (target) {
      return target.eventable.options.holdDuration === interaction.holdTimers[pointerIndex].duration;
    });
  }

  return signalArg.targets;
}

function init(scope) {
  var interactions = scope.interactions;


  scope.pointerEvents = pointerEvents;
  scope.defaults.pointerEvents = pointerEvents.defaults;

  interactions.signals.on('new', function (interaction) {
    interaction.prevTap = null; // the most recent tap event on this interaction
    interaction.tapTime = 0; // time of the most recent tap event
    interaction.holdTimers = []; // [{ duration, timeout }]
  });

  interactions.signals.on('update-pointer-down', function (_ref3) {
    var interaction = _ref3.interaction,
        pointerIndex = _ref3.pointerIndex;

    interaction.holdTimers[pointerIndex] = { duration: Infinity, timeout: null };
  });

  interactions.signals.on('remove-pointer', function (_ref4) {
    var interaction = _ref4.interaction,
        pointerIndex = _ref4.pointerIndex;

    interaction.holdTimers.splice(pointerIndex, 1);
  });

  interactions.signals.on('move', function (_ref5) {
    var interaction = _ref5.interaction,
        pointer = _ref5.pointer,
        event = _ref5.event,
        eventTarget = _ref5.eventTarget,
        duplicateMove = _ref5.duplicateMove;

    var pointerIndex = interaction.getPointerIndex(pointer);

    if (!duplicateMove && (!interaction.pointerIsDown || interaction.pointerWasMoved)) {
      if (interaction.pointerIsDown) {
        clearTimeout(interaction.holdTimers[pointerIndex].timeout);
      }

      fire({
        interaction: interaction, pointer: pointer, event: event, eventTarget: eventTarget,
        type: 'move'
      });
    }
  });

  interactions.signals.on('down', function (_ref6) {
    var interaction = _ref6.interaction,
        pointer = _ref6.pointer,
        event = _ref6.event,
        eventTarget = _ref6.eventTarget,
        pointerIndex = _ref6.pointerIndex;

    var timer = interaction.holdTimers[pointerIndex];
    var path = utils.dom.getPath(eventTarget);
    var signalArg = {
      interaction: interaction,
      pointer: pointer,
      event: event,
      eventTarget: eventTarget,
      type: 'hold',
      targets: [],
      path: path,
      element: null
    };

    for (var _i2 = 0; _i2 < path.length; _i2++) {
      var _ref7;

      _ref7 = path[_i2];
      var element = _ref7;

      signalArg.element = element;

      signals.fire('collect-targets', signalArg);
    }

    if (!signalArg.targets.length) {
      return;
    }

    var minDuration = Infinity;

    for (var _i3 = 0; _i3 < signalArg.targets.length; _i3++) {
      var _ref8;

      _ref8 = signalArg.targets[_i3];
      var target = _ref8;

      var holdDuration = target.eventable.options.holdDuration;

      if (holdDuration < minDuration) {
        minDuration = holdDuration;
      }
    }

    timer.duration = minDuration;
    timer.timeout = setTimeout(function () {
      fire({
        interaction: interaction,
        eventTarget: eventTarget,
        pointer: pointer,
        event: event,
        type: 'hold'
      });
    }, minDuration);
  });

  interactions.signals.on('up', function (_ref9) {
    var interaction = _ref9.interaction,
        pointer = _ref9.pointer,
        event = _ref9.event,
        eventTarget = _ref9.eventTarget;

    if (!interaction.pointerWasMoved) {
      fire({ interaction: interaction, eventTarget: eventTarget, pointer: pointer, event: event, type: 'tap' });
    }
  });

  var _arr = ['up', 'cancel'];
  for (var _i4 = 0; _i4 < _arr.length; _i4++) {
    var signalName = _arr[_i4];
    interactions.signals.on(signalName, function (_ref10) {
      var interaction = _ref10.interaction,
          pointerIndex = _ref10.pointerIndex;

      if (interaction.holdTimers[pointerIndex]) {
        clearTimeout(interaction.holdTimers[pointerIndex].timeout);
      }
    });
  }

  for (var i = 0; i < simpleSignals.length; i++) {
    interactions.signals.on(simpleSignals[i], createSignalListener(simpleEvents[i]));
  }
}

function createSignalListener(type) {
  return function (_ref11) {
    var interaction = _ref11.interaction,
        pointer = _ref11.pointer,
        event = _ref11.event,
        eventTarget = _ref11.eventTarget;

    fire({ interaction: interaction, eventTarget: eventTarget, pointer: pointer, event: event, type: type });
  };
}

exports.default = pointerEvents;

},{"../utils":129,"./PointerEvent":112}],114:[function(_dereq_,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
function init(scope) {
  var pointerEvents = scope.pointerEvents,
      interactions = scope.interactions;


  pointerEvents.signals.on('new', onNew);
  pointerEvents.signals.on('fired', function (arg) {
    return onFired(arg, pointerEvents);
  });

  var _arr = ['move', 'up', 'cancel', 'endall'];
  for (var _i = 0; _i < _arr.length; _i++) {
    var signal = _arr[_i];
    interactions.signals.on(signal, endHoldRepeat);
  }

  // don't repeat by default
  pointerEvents.defaults.holdRepeatInterval = 0;
  pointerEvents.types.push('holdrepeat');
}

function onNew(_ref) {
  var pointerEvent = _ref.pointerEvent;

  if (pointerEvent.type !== 'hold') {
    return;
  }

  pointerEvent.count = (pointerEvent.count || 0) + 1;
}

function onFired(_ref2, pointerEvents) {
  var interaction = _ref2.interaction,
      pointerEvent = _ref2.pointerEvent,
      eventTarget = _ref2.eventTarget,
      targets = _ref2.targets;

  if (pointerEvent.type !== 'hold' || !targets.length) {
    return;
  }

  // get the repeat interval from the first eventable
  var interval = targets[0].eventable.options.holdRepeatInterval;

  // don't repeat if the interval is 0 or less
  if (interval <= 0) {
    return;
  }

  // set a timeout to fire the holdrepeat event
  interaction.holdIntervalHandle = setTimeout(function () {
    pointerEvents.fire({
      interaction: interaction,
      eventTarget: eventTarget,
      type: 'hold',
      pointer: pointerEvent,
      event: pointerEvent
    });
  }, interval);
}

function endHoldRepeat(_ref3) {
  var interaction = _ref3.interaction;

  // set the interaction's holdStopTime property
  // to stop further holdRepeat events
  if (interaction.holdIntervalHandle) {
    clearInterval(interaction.holdIntervalHandle);
    interaction.holdIntervalHandle = null;
  }
}

exports.default = {
  init: init
};

},{}],115:[function(_dereq_,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.init = exports.interactableTargets = exports.holdRepeat = exports.pointerEvents = undefined;

var _base = _dereq_('./base');

var _base2 = _interopRequireDefault(_base);

var _holdRepeat = _dereq_('./holdRepeat');

var _holdRepeat2 = _interopRequireDefault(_holdRepeat);

var _interactableTargets = _dereq_('./interactableTargets');

var _interactableTargets2 = _interopRequireDefault(_interactableTargets);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function init(scope) {
  _base2.default.init(scope);
  _holdRepeat2.default.init(scope);
  _interactableTargets2.default.init(scope);
}

exports.pointerEvents = _base2.default;
exports.holdRepeat = _holdRepeat2.default;
exports.interactableTargets = _interactableTargets2.default;
exports.init = init;

},{"./base":113,"./holdRepeat":114,"./interactableTargets":116}],116:[function(_dereq_,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _is = _dereq_('../utils/is');

var is = _interopRequireWildcard(_is);

var _extend = _dereq_('../utils/extend');

var _extend2 = _interopRequireDefault(_extend);

var _arr = _dereq_('../utils/arr');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function init(scope) {
  var pointerEvents = scope.pointerEvents,
      actions = scope.actions,
      Interactable = scope.Interactable,
      interactables = scope.interactables;


  pointerEvents.signals.on('collect-targets', function (_ref) {
    var targets = _ref.targets,
        element = _ref.element,
        type = _ref.type,
        eventTarget = _ref.eventTarget;

    scope.interactables.forEachMatch(element, function (interactable) {
      var eventable = interactable.events;
      var options = eventable.options;

      if (eventable[type] && is.element(element) && interactable.testIgnoreAllow(options, element, eventTarget)) {

        targets.push({
          element: element,
          eventable: eventable,
          props: { interactable: interactable }
        });
      }
    });
  });

  interactables.signals.on('new', function (_ref2) {
    var interactable = _ref2.interactable;

    interactable.events.getRect = function (element) {
      return interactable.getRect(element);
    };
  });

  interactables.signals.on('set', function (_ref3) {
    var interactable = _ref3.interactable,
        options = _ref3.options;

    (0, _extend2.default)(interactable.events.options, pointerEvents.defaults);
    (0, _extend2.default)(interactable.events.options, options);
  });

  (0, _arr.merge)(actions.eventTypes, pointerEvents.types);

  Interactable.prototype.pointerEvents = function (options) {
    (0, _extend2.default)(this.events.options, options);

    return this;
  };

  var __backCompatOption = Interactable.prototype._backCompatOption;

  Interactable.prototype._backCompatOption = function (optionName, newValue) {
    var ret = __backCompatOption.call(this, optionName, newValue);

    if (ret === this) {
      this.events.options[optionName] = newValue;
    }

    return ret;
  };
}

exports.default = {
  init: init
};

},{"../utils/arr":120,"../utils/extend":126,"../utils/is":131}],117:[function(_dereq_,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.init = init;

var _interactions = _dereq_('./interactions');

var _utils = _dereq_('./utils');

function init(scope) {
  var actions = scope.actions,
      interactions = scope.interactions,
      Interactable = scope.Interactable;

  // add action reflow event types

  for (var _i = 0; _i < actions.names.length; _i++) {
    var _ref;

    _ref = actions.names[_i];
    var actionName = _ref;

    actions.eventTypes.push(actionName + 'reflow');
  }

  // remove completed reflow interactions
  interactions.signals.on('stop', function (_ref2) {
    var interaction = _ref2.interaction;

    if (interaction.pointerType === 'reflow') {
      _utils.arr.remove(scope.interactions.list, interaction);
    }
  });

  /**
   * ```js
   * const interactable = interact(target);
   * const drag = { name: drag, axis: 'x' };
   * const resize = { name: resize, edges: { left: true, bottom: true };
   *
   * interactable.reflow(drag);
   * interactable.reflow(resize);
   * ```
   *
   * Start an action sequence to re-apply modifiers, check drops, etc.
   *
   * @param { Object } action The action to begin
   * @param { string } action.name The name of the action
   */
  Interactable.prototype.reflow = function (action) {
    return reflow(this, action, scope);
  };
}

function reflow(interactable, action, scope) {
  var elements = _utils.is.string(interactable.target) ? _utils.arr.from(interactable._context.querySelectorAll(interactable.target)) : [interactable.target];

  // follow autoStart max interaction settings
  if (scope.autoStart) {
    elements = elements.filter(function (element) {
      return scope.autoStart.withinInteractionLimit(interactable, element, action, scope);
    });
  }

  for (var _i2 = 0; _i2 < elements.length; _i2++) {
    var _ref3;

    _ref3 = elements[_i2];
    var element = _ref3;

    var interaction = (0, _interactions.newInteraction)({ pointerType: 'reflow' }, scope);

    var rect = interactable.getRect(element);

    if (!rect) {
      break;
    }

    var xywh = _utils.rect.tlbrToXywh(rect);
    var coords = {
      page: xywh,
      client: xywh
    };
    var event = (0, _utils.extend)(_utils.pointer.coordsToEvent(coords), coords);
    var signalArg = {
      interaction: interaction,
      event: event,
      pointer: event,
      eventTarget: element,
      phase: 'reflow'
    };

    interaction.target = interactable;
    interaction.element = element;
    interaction.prepared = (0, _utils.extend)({}, action);
    interaction.prevEvent = event;
    interaction.updatePointer(event, event, element, true);

    interaction._doPhase(signalArg);

    signalArg.phase = 'start';
    interaction._interacting = interaction._doPhase(signalArg);

    if (interaction._interacting) {
      interaction.move(signalArg);
      interaction.end(event);
    } else {
      interaction.stop();
    }

    interaction.removePointer(event, event);
    interaction.pointerIsDown = false;
  }
}

exports.default = { init: init };

},{"./interactions":104,"./utils":129}],118:[function(_dereq_,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.scope = undefined;

var _classCallCheck2 = _dereq_('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _possibleConstructorReturn2 = _dereq_('babel-runtime/helpers/possibleConstructorReturn');

var _possibleConstructorReturn3 = _interopRequireDefault(_possibleConstructorReturn2);

var _inherits2 = _dereq_('babel-runtime/helpers/inherits');

var _inherits3 = _interopRequireDefault(_inherits2);

exports.init = init;

var _Eventable = _dereq_('./Eventable');

var _Eventable2 = _interopRequireDefault(_Eventable);

var _defaultOptions = _dereq_('./defaultOptions');

var _defaultOptions2 = _interopRequireDefault(_defaultOptions);

var _utils = _dereq_('./utils');

var utils = _interopRequireWildcard(_utils);

var _domObjects = _dereq_('./utils/domObjects');

var _domObjects2 = _interopRequireDefault(_domObjects);

var _InteractEvent = _dereq_('./InteractEvent');

var _InteractEvent2 = _interopRequireDefault(_InteractEvent);

var _Interactable2 = _dereq_('./Interactable');

var _Interactable3 = _interopRequireDefault(_Interactable2);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var win = utils.win,
    browser = utils.browser,
    raf = utils.raf,
    Signals = utils.Signals,
    events = utils.events;
var scope = exports.scope = {
  Signals: Signals,
  signals: new Signals(),
  browser: browser,
  events: events,
  utils: utils,
  defaults: _defaultOptions2.default,
  Eventable: _Eventable2.default,

  // main document
  document: null,
  // all documents being listened to
  documents: [/* { doc, options } */],

  addDocument: function addDocument(doc, options) {
    // do nothing if document is already known
    if (scope.getDocIndex(doc) !== -1) {
      return false;
    }

    var window = win.getWindow(doc);

    scope.documents.push({ doc: doc, options: options });
    events.documents.push(doc);

    // don't add an unload event for the main document
    // so that the page may be cached in browser history
    if (doc !== scope.document) {
      events.add(window, 'unload', scope.onWindowUnload);
    }

    scope.signals.fire('add-document', { doc: doc, window: window, scope: scope, options: options });
  },
  removeDocument: function removeDocument(doc) {
    var index = scope.getDocIndex(doc);

    var window = win.getWindow(doc);
    var options = scope.documents[index].options;

    events.remove(window, 'unload', scope.onWindowUnload);

    scope.documents.splice(index, 1);
    events.documents.splice(index, 1);

    scope.signals.fire('remove-document', { doc: doc, window: window, scope: scope, options: options });
  },
  onWindowUnload: function onWindowUnload(event) {
    scope.removeDocument(event.target.document);
  },
  getDocIndex: function getDocIndex(doc) {
    for (var i = 0; i < scope.documents.length; i++) {
      if (scope.documents[i].doc === doc) {
        return i;
      }
    }

    return -1;
  }
};

function init(window) {
  win.init(window);
  _domObjects2.default.init(window);
  browser.init(window);
  raf.init(window);

  scope.document = window.document;

  scope.InteractEvent = _InteractEvent2.default;
  // eslint-disable-next-line no-shadow
  scope.Interactable = function (_Interactable) {
    (0, _inherits3.default)(Interactable, _Interactable);

    function Interactable() {
      (0, _classCallCheck3.default)(this, Interactable);
      return (0, _possibleConstructorReturn3.default)(this, _Interactable.apply(this, arguments));
    }

    return Interactable;
  }(_Interactable3.default);
}

},{"./Eventable":83,"./InteractEvent":84,"./Interactable":85,"./defaultOptions":99,"./utils":129,"./utils/domObjects":123,"babel-runtime/helpers/classCallCheck":7,"babel-runtime/helpers/inherits":9,"babel-runtime/helpers/possibleConstructorReturn":10}],119:[function(_dereq_,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _classCallCheck2 = _dereq_("babel-runtime/helpers/classCallCheck");

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var Signals = function () {
  function Signals() {
    (0, _classCallCheck3.default)(this, Signals);

    this.listeners = {
      // signalName: [listeners],
    };
  }

  Signals.prototype.on = function on(name, listener) {
    if (!this.listeners[name]) {
      this.listeners[name] = [listener];
      return;
    }

    this.listeners[name].push(listener);
  };

  Signals.prototype.off = function off(name, listener) {
    if (!this.listeners[name]) {
      return;
    }

    var index = this.listeners[name].indexOf(listener);

    if (index !== -1) {
      this.listeners[name].splice(index, 1);
    }
  };

  Signals.prototype.fire = function fire(name, arg) {
    var targetListeners = this.listeners[name];

    if (!targetListeners) {
      return;
    }

    for (var _i = 0; _i < targetListeners.length; _i++) {
      var _ref;

      _ref = targetListeners[_i];
      var listener = _ref;

      if (listener(arg, name) === false) {
        return false;
      }
    }
  };

  return Signals;
}();

exports.default = Signals;

},{"babel-runtime/helpers/classCallCheck":7}],120:[function(_dereq_,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.contains = contains;
exports.remove = remove;
exports.merge = merge;
exports.from = from;
exports.findIndex = findIndex;
exports.find = find;
exports.some = some;
function contains(array, target) {
  return array.indexOf(target) !== -1;
}

function remove(array, target) {
  return array.splice(array.indexOf(target), 1);
}

function merge(target, source) {
  for (var _i = 0; _i < source.length; _i++) {
    var _ref;

    _ref = source[_i];
    var item = _ref;

    target.push(item);
  }

  return target;
}

function from(source) {
  return merge([], source);
}

function findIndex(array, func) {
  for (var i = 0; i < array.length; i++) {
    if (func(array[i], i, array)) {
      return i;
    }
  }

  return -1;
}

function find(array, func) {
  return array[findIndex(array, func)];
}

function some(array, func) {
  return findIndex(array, func) !== -1;
}

},{}],121:[function(_dereq_,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _window = _dereq_('./window');

var _window2 = _interopRequireDefault(_window);

var _is = _dereq_('./is');

var is = _interopRequireWildcard(_is);

var _domObjects = _dereq_('./domObjects');

var _domObjects2 = _interopRequireDefault(_domObjects);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var browser = {
  init: init
};

exports.default = browser;


function init(window) {
  var Element = _domObjects2.default.Element;
  var navigator = _window2.default.window.navigator;

  // Does the browser support touch input?
  browser.supportsTouch = !!('ontouchstart' in window || is.func(window.DocumentTouch) && _domObjects2.default.document instanceof window.DocumentTouch);

  // Does the browser support PointerEvents
  browser.supportsPointerEvent = !!_domObjects2.default.PointerEvent;

  browser.isIOS = /iP(hone|od|ad)/.test(navigator.platform);

  // scrolling doesn't change the result of getClientRects on iOS 7
  browser.isIOS7 = /iP(hone|od|ad)/.test(navigator.platform) && /OS 7[^\d]/.test(navigator.appVersion);

  browser.isIe9 = /MSIE 9/.test(navigator.userAgent);

  // prefix matchesSelector
  browser.prefixedMatchesSelector = 'matches' in Element.prototype ? 'matches' : 'webkitMatchesSelector' in Element.prototype ? 'webkitMatchesSelector' : 'mozMatchesSelector' in Element.prototype ? 'mozMatchesSelector' : 'oMatchesSelector' in Element.prototype ? 'oMatchesSelector' : 'msMatchesSelector';

  browser.pEventTypes = _domObjects2.default.PointerEvent ? _domObjects2.default.PointerEvent === window.MSPointerEvent ? {
    up: 'MSPointerUp',
    down: 'MSPointerDown',
    over: 'mouseover',
    out: 'mouseout',
    move: 'MSPointerMove',
    cancel: 'MSPointerCancel'
  } : {
    up: 'pointerup',
    down: 'pointerdown',
    over: 'pointerover',
    out: 'pointerout',
    move: 'pointermove',
    cancel: 'pointercancel'
  } : null;

  // because Webkit and Opera still use 'mousewheel' event type
  browser.wheelEvent = 'onmousewheel' in _domObjects2.default.document ? 'mousewheel' : 'wheel';

  // Opera Mobile must be handled differently
  browser.isOperaMobile = navigator.appName === 'Opera' && browser.supportsTouch && navigator.userAgent.match('Presto');
}

},{"./domObjects":123,"./is":131,"./window":139}],122:[function(_dereq_,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = clone;

var _is = _dereq_('./is');

var is = _interopRequireWildcard(_is);

var _arr = _dereq_('./arr');

var arr = _interopRequireWildcard(_arr);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function clone(source) {
  var dest = {};

  for (var prop in source) {
    var value = source[prop];

    if (is.plainObject(value)) {
      dest[prop] = clone(value);
    } else if (is.array(value)) {
      dest[prop] = arr.from(value);
    } else {
      dest[prop] = value;
    }
  }

  return dest;
}

},{"./arr":120,"./is":131}],123:[function(_dereq_,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
var domObjects = {
  init: init
};

function blank() {}

exports.default = domObjects;


function init(window) {
  domObjects.document = window.document;
  domObjects.DocumentFragment = window.DocumentFragment || blank;
  domObjects.SVGElement = window.SVGElement || blank;
  domObjects.SVGSVGElement = window.SVGSVGElement || blank;
  domObjects.SVGElementInstance = window.SVGElementInstance || blank;
  domObjects.Element = window.Element || blank;
  domObjects.HTMLElement = window.HTMLElement || domObjects.Element;

  domObjects.Event = window.Event;
  domObjects.Touch = window.Touch || blank;
  domObjects.PointerEvent = window.PointerEvent || window.MSPointerEvent;
}

},{}],124:[function(_dereq_,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.nodeContains = nodeContains;
exports.closest = closest;
exports.parentNode = parentNode;
exports.matchesSelector = matchesSelector;
exports.indexOfDeepestElement = indexOfDeepestElement;
exports.matchesUpTo = matchesUpTo;
exports.getActualElement = getActualElement;
exports.getScrollXY = getScrollXY;
exports.getElementClientRect = getElementClientRect;
exports.getElementRect = getElementRect;
exports.getPath = getPath;
exports.trySelector = trySelector;

var _window = _dereq_('./window');

var _window2 = _interopRequireDefault(_window);

var _browser = _dereq_('./browser');

var _browser2 = _interopRequireDefault(_browser);

var _is = _dereq_('./is');

var is = _interopRequireWildcard(_is);

var _domObjects = _dereq_('./domObjects');

var _domObjects2 = _interopRequireDefault(_domObjects);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function nodeContains(parent, child) {
  while (child) {
    if (child === parent) {
      return true;
    }

    child = child.parentNode;
  }

  return false;
}

function closest(element, selector) {
  while (is.element(element)) {
    if (matchesSelector(element, selector)) {
      return element;
    }

    element = parentNode(element);
  }

  return null;
}

function parentNode(node) {
  var parent = node.parentNode;

  if (is.docFrag(parent)) {
    // skip past #shado-root fragments
    while ((parent = parent.host) && is.docFrag(parent)) {
      continue;
    }

    return parent;
  }

  return parent;
}

function matchesSelector(element, selector) {
  // remove /deep/ from selectors if shadowDOM polyfill is used
  if (_window2.default.window !== _window2.default.realWindow) {
    selector = selector.replace(/\/deep\//g, ' ');
  }

  return element[_browser2.default.prefixedMatchesSelector](selector);
}

// Test for the element that's "above" all other qualifiers
function indexOfDeepestElement(elements) {
  var deepestZoneParents = [];
  var dropzoneParents = [];
  var dropzone = void 0;
  var deepestZone = elements[0];
  var index = deepestZone ? 0 : -1;
  var parent = void 0;
  var child = void 0;
  var i = void 0;
  var n = void 0;

  for (i = 1; i < elements.length; i++) {
    dropzone = elements[i];

    // an element might belong to multiple selector dropzones
    if (!dropzone || dropzone === deepestZone) {
      continue;
    }

    if (!deepestZone) {
      deepestZone = dropzone;
      index = i;
      continue;
    }

    // check if the deepest or current are document.documentElement or document.rootElement
    // - if the current dropzone is, do nothing and continue
    if (dropzone.parentNode === dropzone.ownerDocument) {
      continue;
    }
    // - if deepest is, update with the current dropzone and continue to next
    else if (deepestZone.parentNode === dropzone.ownerDocument) {
        deepestZone = dropzone;
        index = i;
        continue;
      }

    if (!deepestZoneParents.length) {
      parent = deepestZone;
      while (parent.parentNode && parent.parentNode !== parent.ownerDocument) {
        deepestZoneParents.unshift(parent);
        parent = parent.parentNode;
      }
    }

    // if this element is an svg element and the current deepest is
    // an HTMLElement
    if (deepestZone instanceof _domObjects2.default.HTMLElement && dropzone instanceof _domObjects2.default.SVGElement && !(dropzone instanceof _domObjects2.default.SVGSVGElement)) {

      if (dropzone === deepestZone.parentNode) {
        continue;
      }

      parent = dropzone.ownerSVGElement;
    } else {
      parent = dropzone;
    }

    dropzoneParents = [];

    while (parent.parentNode !== parent.ownerDocument) {
      dropzoneParents.unshift(parent);
      parent = parent.parentNode;
    }

    n = 0;

    // get (position of last common ancestor) + 1
    while (dropzoneParents[n] && dropzoneParents[n] === deepestZoneParents[n]) {
      n++;
    }

    var parents = [dropzoneParents[n - 1], dropzoneParents[n], deepestZoneParents[n]];

    child = parents[0].lastChild;

    while (child) {
      if (child === parents[1]) {
        deepestZone = dropzone;
        index = i;
        deepestZoneParents = [];

        break;
      } else if (child === parents[2]) {
        break;
      }

      child = child.previousSibling;
    }
  }

  return index;
}

function matchesUpTo(element, selector, limit) {
  while (is.element(element)) {
    if (matchesSelector(element, selector)) {
      return true;
    }

    element = parentNode(element);

    if (element === limit) {
      return matchesSelector(element, selector);
    }
  }

  return false;
}

function getActualElement(element) {
  return element instanceof _domObjects2.default.SVGElementInstance ? element.correspondingUseElement : element;
}

function getScrollXY(relevantWindow) {
  relevantWindow = relevantWindow || _window2.default.window;
  return {
    x: relevantWindow.scrollX || relevantWindow.document.documentElement.scrollLeft,
    y: relevantWindow.scrollY || relevantWindow.document.documentElement.scrollTop
  };
}

function getElementClientRect(element) {
  var clientRect = element instanceof _domObjects2.default.SVGElement ? element.getBoundingClientRect() : element.getClientRects()[0];

  return clientRect && {
    left: clientRect.left,
    right: clientRect.right,
    top: clientRect.top,
    bottom: clientRect.bottom,
    width: clientRect.width || clientRect.right - clientRect.left,
    height: clientRect.height || clientRect.bottom - clientRect.top
  };
}

function getElementRect(element) {
  var clientRect = getElementClientRect(element);

  if (!_browser2.default.isIOS7 && clientRect) {
    var scroll = getScrollXY(_window2.default.getWindow(element));

    clientRect.left += scroll.x;
    clientRect.right += scroll.x;
    clientRect.top += scroll.y;
    clientRect.bottom += scroll.y;
  }

  return clientRect;
}

function getPath(element) {
  var path = [];

  while (element) {
    path.push(element);
    element = parentNode(element);
  }

  return path;
}

function trySelector(value) {
  if (!is.string(value)) {
    return false;
  }

  // an exception will be raised if it is invalid
  _domObjects2.default.document.querySelector(value);
  return true;
}

},{"./browser":121,"./domObjects":123,"./is":131,"./window":139}],125:[function(_dereq_,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _is = _dereq_('./is');

var is = _interopRequireWildcard(_is);

var _domUtils = _dereq_('./domUtils');

var domUtils = _interopRequireWildcard(_domUtils);

var _pointerUtils = _dereq_('./pointerUtils');

var _pointerUtils2 = _interopRequireDefault(_pointerUtils);

var _pointerExtend = _dereq_('./pointerExtend');

var _pointerExtend2 = _interopRequireDefault(_pointerExtend);

var _arr = _dereq_('./arr');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

var elements = [];
var targets = [];

// {
//   type: {
//     selectors: ['selector', ...],
//     contexts : [document, ...],
//     listeners: [[listener, capture, passive], ...]
//   }
//  }
var delegatedEvents = {};
var documents = [];

var supportsOptions = void 0;

function add(element, type, listener, optionalArg) {
  var options = getOptions(optionalArg);
  var elementIndex = elements.indexOf(element);
  var target = targets[elementIndex];

  if (!target) {
    target = {
      events: {},
      typeCount: 0
    };

    elementIndex = elements.push(element) - 1;
    targets.push(target);
  }

  if (!target.events[type]) {
    target.events[type] = [];
    target.typeCount++;
  }

  if (!(0, _arr.contains)(target.events[type], listener)) {
    element.addEventListener(type, listener, supportsOptions ? options : !!options.capture);
    target.events[type].push(listener);
  }
}

function remove(element, type, listener, optionalArg) {
  var options = getOptions(optionalArg);
  var elementIndex = elements.indexOf(element);
  var target = targets[elementIndex];

  if (!target || !target.events) {
    return;
  }

  if (type === 'all') {
    for (type in target.events) {
      if (target.events.hasOwnProperty(type)) {
        remove(element, type, 'all');
      }
    }
    return;
  }

  if (target.events[type]) {
    var len = target.events[type].length;

    if (listener === 'all') {
      for (var i = 0; i < len; i++) {
        remove(element, type, target.events[type][i], options);
      }
      return;
    } else {
      for (var _i = 0; _i < len; _i++) {
        if (target.events[type][_i] === listener) {
          element.removeEventListener(type, listener, supportsOptions ? options : !!options.capture);
          target.events[type].splice(_i, 1);

          break;
        }
      }
    }

    if (target.events[type] && target.events[type].length === 0) {
      target.events[type] = null;
      target.typeCount--;
    }
  }

  if (!target.typeCount) {
    targets.splice(elementIndex, 1);
    elements.splice(elementIndex, 1);
  }
}

function addDelegate(selector, context, type, listener, optionalArg) {
  var options = getOptions(optionalArg);
  if (!delegatedEvents[type]) {
    delegatedEvents[type] = {
      selectors: [],
      contexts: [],
      listeners: []
    };

    // add delegate listener functions
    for (var _i2 = 0; _i2 < documents.length; _i2++) {
      var doc = documents[_i2];
      add(doc, type, delegateListener);
      add(doc, type, delegateUseCapture, true);
    }
  }

  var delegated = delegatedEvents[type];
  var index = void 0;

  for (index = delegated.selectors.length - 1; index >= 0; index--) {
    if (delegated.selectors[index] === selector && delegated.contexts[index] === context) {
      break;
    }
  }

  if (index === -1) {
    index = delegated.selectors.length;

    delegated.selectors.push(selector);
    delegated.contexts.push(context);
    delegated.listeners.push([]);
  }

  // keep listener and capture and passive flags
  delegated.listeners[index].push([listener, !!options.capture, options.passive]);
}

function removeDelegate(selector, context, type, listener, optionalArg) {
  var options = getOptions(optionalArg);
  var delegated = delegatedEvents[type];
  var matchFound = false;
  var index = void 0;

  if (!delegated) {
    return;
  }

  // count from last index of delegated to 0
  for (index = delegated.selectors.length - 1; index >= 0; index--) {
    // look for matching selector and context Node
    if (delegated.selectors[index] === selector && delegated.contexts[index] === context) {

      var listeners = delegated.listeners[index];

      // each item of the listeners array is an array: [function, capture, passive]
      for (var i = listeners.length - 1; i >= 0; i--) {
        var _listeners$i = listeners[i],
            fn = _listeners$i[0],
            capture = _listeners$i[1],
            passive = _listeners$i[2];

        // check if the listener functions and capture and passive flags match

        if (fn === listener && capture === !!options.capture && passive === options.passive) {
          // remove the listener from the array of listeners
          listeners.splice(i, 1);

          // if all listeners for this interactable have been removed
          // remove the interactable from the delegated arrays
          if (!listeners.length) {
            delegated.selectors.splice(index, 1);
            delegated.contexts.splice(index, 1);
            delegated.listeners.splice(index, 1);

            // remove delegate function from context
            remove(context, type, delegateListener);
            remove(context, type, delegateUseCapture, true);

            // remove the arrays if they are empty
            if (!delegated.selectors.length) {
              delegatedEvents[type] = null;
            }
          }

          // only remove one listener
          matchFound = true;
          break;
        }
      }

      if (matchFound) {
        break;
      }
    }
  }
}

// bound to the interactable context when a DOM event
// listener is added to a selector interactable
function delegateListener(event, optionalArg) {
  var options = getOptions(optionalArg);
  var fakeEvent = {};
  var delegated = delegatedEvents[event.type];

  var _pointerUtils$getEven = _pointerUtils2.default.getEventTargets(event),
      eventTarget = _pointerUtils$getEven[0];

  var element = eventTarget;

  // duplicate the event so that currentTarget can be changed
  (0, _pointerExtend2.default)(fakeEvent, event);

  fakeEvent.originalEvent = event;
  fakeEvent.preventDefault = preventOriginalDefault;

  // climb up document tree looking for selector matches
  while (is.element(element)) {
    for (var i = 0; i < delegated.selectors.length; i++) {
      var selector = delegated.selectors[i];
      var context = delegated.contexts[i];

      if (domUtils.matchesSelector(element, selector) && domUtils.nodeContains(context, eventTarget) && domUtils.nodeContains(context, element)) {

        var listeners = delegated.listeners[i];

        fakeEvent.currentTarget = element;

        for (var j = 0; j < listeners.length; j++) {
          var _listeners$j = listeners[j],
              fn = _listeners$j[0],
              capture = _listeners$j[1],
              passive = _listeners$j[2];


          if (capture === !!options.capture && passive === options.passive) {
            fn(fakeEvent);
          }
        }
      }
    }

    element = domUtils.parentNode(element);
  }
}

function delegateUseCapture(event) {
  return delegateListener.call(this, event, true);
}

function preventOriginalDefault() {
  this.originalEvent.preventDefault();
}

function getOptions(param) {
  return is.object(param) ? param : { capture: param };
}

exports.default = {
  add: add,
  remove: remove,

  addDelegate: addDelegate,
  removeDelegate: removeDelegate,

  delegateListener: delegateListener,
  delegateUseCapture: delegateUseCapture,
  delegatedEvents: delegatedEvents,
  documents: documents,

  supportsOptions: supportsOptions,

  _elements: elements,
  _targets: targets,

  init: function init(window) {
    supportsOptions = false;

    window.document.createElement('div').addEventListener('test', null, {
      get capture() {
        supportsOptions = true;
      }
    });
  }
};

},{"./arr":120,"./domUtils":124,"./is":131,"./pointerExtend":133,"./pointerUtils":134}],126:[function(_dereq_,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = extend;
function extend(dest, source) {
  for (var prop in source) {
    dest[prop] = source[prop];
  }
  return dest;
}

},{}],127:[function(_dereq_,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function (target, element, action) {
  var actionOptions = target.options[action];
  var actionOrigin = actionOptions && actionOptions.origin;
  var origin = actionOrigin || target.options.origin;

  var originRect = (0, _rect.resolveRectLike)(origin, target, element, [target && element]);

  return (0, _rect.rectToXY)(originRect) || { x: 0, y: 0 };
};

var _rect = _dereq_('./rect');

},{"./rect":136}],128:[function(_dereq_,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function (x, y) {
  return Math.sqrt(x * x + y * y);
};

},{}],129:[function(_dereq_,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.events = exports.browser = exports.win = exports.raf = exports.rect = exports.pointer = exports.is = exports.hypot = exports.getOriginXY = exports.extend = exports.dom = exports.arr = exports.Signals = undefined;
exports.warnOnce = warnOnce;
exports._getQBezierValue = _getQBezierValue;
exports.getQuadraticCurvePoint = getQuadraticCurvePoint;
exports.easeOutQuad = easeOutQuad;
exports.copyAction = copyAction;

var _window = _dereq_('./window');

var _window2 = _interopRequireDefault(_window);

var _browser = _dereq_('./browser');

var _browser2 = _interopRequireDefault(_browser);

var _Signals = _dereq_('./Signals');

var _Signals2 = _interopRequireDefault(_Signals);

var _arr = _dereq_('./arr');

var arr = _interopRequireWildcard(_arr);

var _domUtils = _dereq_('./domUtils');

var dom = _interopRequireWildcard(_domUtils);

var _raf = _dereq_('./raf');

var _raf2 = _interopRequireDefault(_raf);

var _extend = _dereq_('./extend');

var _extend2 = _interopRequireDefault(_extend);

var _getOriginXY = _dereq_('./getOriginXY');

var _getOriginXY2 = _interopRequireDefault(_getOriginXY);

var _hypot = _dereq_('./hypot');

var _hypot2 = _interopRequireDefault(_hypot);

var _is = _dereq_('./is');

var is = _interopRequireWildcard(_is);

var _pointerUtils = _dereq_('./pointerUtils');

var _pointerUtils2 = _interopRequireDefault(_pointerUtils);

var _rect = _dereq_('./rect');

var _rect2 = _interopRequireDefault(_rect);

var _events = _dereq_('./events');

var _events2 = _interopRequireDefault(_events);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function warnOnce(method, message) {
  var warned = false;

  return function () {
    if (!warned) {
      _window2.default.window.console.warn(message);
      warned = true;
    }

    return method.apply(this, arguments);
  };
}

// http://stackoverflow.com/a/5634528/2280888
function _getQBezierValue(t, p1, p2, p3) {
  var iT = 1 - t;
  return iT * iT * p1 + 2 * iT * t * p2 + t * t * p3;
}

function getQuadraticCurvePoint(startX, startY, cpX, cpY, endX, endY, position) {
  return {
    x: _getQBezierValue(position, startX, cpX, endX),
    y: _getQBezierValue(position, startY, cpY, endY)
  };
}

// http://gizma.com/easing/
function easeOutQuad(t, b, c, d) {
  t /= d;
  return -c * t * (t - 2) + b;
}

function copyAction(dest, src) {
  dest.name = src.name;
  dest.axis = src.axis;
  dest.edges = src.edges;

  return dest;
}

exports.Signals = _Signals2.default;
exports.arr = arr;
exports.dom = dom;
exports.extend = _extend2.default;
exports.getOriginXY = _getOriginXY2.default;
exports.hypot = _hypot2.default;
exports.is = is;
exports.pointer = _pointerUtils2.default;
exports.rect = _rect2.default;
exports.raf = _raf2.default;
exports.win = _window2.default;
exports.browser = _browser2.default;
exports.events = _events2.default;

},{"./Signals":119,"./arr":120,"./browser":121,"./domUtils":124,"./events":125,"./extend":126,"./getOriginXY":127,"./hypot":128,"./is":131,"./pointerUtils":134,"./raf":135,"./rect":136,"./window":139}],130:[function(_dereq_,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _index = _dereq_('./index');

var utils = _interopRequireWildcard(_index);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

var finder = {
  methodOrder: ['simulationResume', 'mouseOrPen', 'hasPointer', 'idle'],

  search: function search(details) {
    for (var _i = 0; _i < finder.methodOrder.length; _i++) {
      var _ref;

      _ref = finder.methodOrder[_i];
      var method = _ref;

      var interaction = finder[method](details);

      if (interaction) {
        return interaction;
      }
    }
  },

  // try to resume simulation with a new pointer
  simulationResume: function simulationResume(_ref2) {
    var pointerType = _ref2.pointerType,
        eventType = _ref2.eventType,
        eventTarget = _ref2.eventTarget,
        scope = _ref2.scope;

    if (!/down|start/i.test(eventType)) {
      return null;
    }

    for (var _i2 = 0; _i2 < scope.interactions.list.length; _i2++) {
      var _ref3;

      _ref3 = scope.interactions.list[_i2];
      var interaction = _ref3;

      var element = eventTarget;

      if (interaction.simulation && interaction.simulation.allowResume && interaction.pointerType === pointerType) {
        while (element) {
          // if the element is the interaction element
          if (element === interaction.element) {
            return interaction;
          }
          element = utils.dom.parentNode(element);
        }
      }
    }

    return null;
  },

  // if it's a mouse or pen interaction
  mouseOrPen: function mouseOrPen(_ref4) {
    var pointerId = _ref4.pointerId,
        pointerType = _ref4.pointerType,
        eventType = _ref4.eventType,
        scope = _ref4.scope;

    if (pointerType !== 'mouse' && pointerType !== 'pen') {
      return null;
    }

    var firstNonActive = void 0;

    for (var _i3 = 0; _i3 < scope.interactions.list.length; _i3++) {
      var _ref5;

      _ref5 = scope.interactions.list[_i3];
      var interaction = _ref5;

      if (interaction.pointerType === pointerType) {
        // if it's a down event, skip interactions with running simulations
        if (interaction.simulation && !hasPointerId(interaction, pointerId)) {
          continue;
        }

        // if the interaction is active, return it immediately
        if (interaction.interacting()) {
          return interaction;
        }
        // otherwise save it and look for another active interaction
        else if (!firstNonActive) {
            firstNonActive = interaction;
          }
      }
    }

    // if no active mouse interaction was found use the first inactive mouse
    // interaction
    if (firstNonActive) {
      return firstNonActive;
    }

    // find any mouse or pen interaction.
    // ignore the interaction if the eventType is a *down, and a simulation
    // is active
    for (var _i4 = 0; _i4 < scope.interactions.list.length; _i4++) {
      var _ref6;

      _ref6 = scope.interactions.list[_i4];
      var _interaction = _ref6;

      if (_interaction.pointerType === pointerType && !(/down/i.test(eventType) && _interaction.simulation)) {
        return _interaction;
      }
    }

    return null;
  },

  // get interaction that has this pointer
  hasPointer: function hasPointer(_ref7) {
    var pointerId = _ref7.pointerId,
        scope = _ref7.scope;

    for (var _i5 = 0; _i5 < scope.interactions.list.length; _i5++) {
      var _ref8;

      _ref8 = scope.interactions.list[_i5];
      var interaction = _ref8;

      if (hasPointerId(interaction, pointerId)) {
        return interaction;
      }
    }
  },

  // get first idle interaction with a matching pointerType
  idle: function idle(_ref9) {
    var pointerType = _ref9.pointerType,
        scope = _ref9.scope;

    for (var _i6 = 0; _i6 < scope.interactions.list.length; _i6++) {
      var _ref10;

      _ref10 = scope.interactions.list[_i6];
      var interaction = _ref10;

      // if there's already a pointer held down
      if (interaction.pointers.length === 1) {
        var target = interaction.target;
        // don't add this pointer if there is a target interactable and it
        // isn't gesturable
        if (target && !target.options.gesture.enabled) {
          continue;
        }
      }
      // maximum of 2 pointers per interaction
      else if (interaction.pointers.length >= 2) {
          continue;
        }

      if (!interaction.interacting() && pointerType === interaction.pointerType) {
        return interaction;
      }
    }

    return null;
  }
};

function hasPointerId(interaction, pointerId) {
  return utils.arr.some(interaction.pointers, function (_ref11) {
    var id = _ref11.id;
    return id === pointerId;
  });
}

exports.default = finder;

},{"./index":129}],131:[function(_dereq_,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.array = exports.plainObject = exports.element = exports.string = exports.bool = exports.number = exports.func = exports.object = exports.docFrag = exports.window = undefined;

var _typeof2 = _dereq_('babel-runtime/helpers/typeof');

var _typeof3 = _interopRequireDefault(_typeof2);

var _window2 = _dereq_('./window');

var _window3 = _interopRequireDefault(_window2);

var _isWindow = _dereq_('./isWindow');

var _isWindow2 = _interopRequireDefault(_isWindow);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var window = exports.window = function window(thing) {
  return thing === _window3.default.window || (0, _isWindow2.default)(thing);
};

var docFrag = exports.docFrag = function docFrag(thing) {
  return object(thing) && thing.nodeType === 11;
};

var object = exports.object = function object(thing) {
  return !!thing && (typeof thing === 'undefined' ? 'undefined' : (0, _typeof3.default)(thing)) === 'object';
};

var func = exports.func = function func(thing) {
  return typeof thing === 'function';
};

var number = exports.number = function number(thing) {
  return typeof thing === 'number';
};

var bool = exports.bool = function bool(thing) {
  return typeof thing === 'boolean';
};

var string = exports.string = function string(thing) {
  return typeof thing === 'string';
};

var element = exports.element = function element(thing) {
  if (!thing || (typeof thing === 'undefined' ? 'undefined' : (0, _typeof3.default)(thing)) !== 'object') {
    return false;
  }

  var _window = _window3.default.getWindow(thing) || _window3.default.window;

  return (/object|function/.test((0, _typeof3.default)(_window.Element)) ? thing instanceof _window.Element //DOM2
    : thing.nodeType === 1 && typeof thing.nodeName === 'string'
  );
};

var plainObject = exports.plainObject = function plainObject(thing) {
  return object(thing) && thing.constructor.name === 'Object';
};

var array = exports.array = function array(thing) {
  return object(thing) && typeof thing.length !== 'undefined' && func(thing.splice);
};

},{"./isWindow":132,"./window":139,"babel-runtime/helpers/typeof":11}],132:[function(_dereq_,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function (thing) {
  return !!(thing && thing.Window) && thing instanceof thing.Window;
};

},{}],133:[function(_dereq_,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = pointerExtend;
function pointerExtend(dest, source) {
  for (var prop in source) {
    var prefixedPropREs = pointerExtend.prefixedPropREs;
    var deprecated = false;

    // skip deprecated prefixed properties
    for (var vendor in prefixedPropREs) {
      if (prop.indexOf(vendor) === 0 && prefixedPropREs[vendor].test(prop)) {
        deprecated = true;
        break;
      }
    }

    if (!deprecated && typeof source[prop] !== 'function') {
      dest[prop] = source[prop];
    }
  }
  return dest;
}

pointerExtend.prefixedPropREs = {
  webkit: /(Movement[XY]|Radius[XY]|RotationAngle|Force)$/
};

},{}],134:[function(_dereq_,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _hypot = _dereq_('./hypot');

var _hypot2 = _interopRequireDefault(_hypot);

var _browser = _dereq_('./browser');

var _browser2 = _interopRequireDefault(_browser);

var _domObjects = _dereq_('./domObjects');

var _domObjects2 = _interopRequireDefault(_domObjects);

var _domUtils = _dereq_('./domUtils');

var domUtils = _interopRequireWildcard(_domUtils);

var _is = _dereq_('./is');

var is = _interopRequireWildcard(_is);

var _pointerExtend = _dereq_('./pointerExtend');

var _pointerExtend2 = _interopRequireDefault(_pointerExtend);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var pointerUtils = {
  copyCoords: function copyCoords(dest, src) {
    dest.page = dest.page || {};
    dest.page.x = src.page.x;
    dest.page.y = src.page.y;

    dest.client = dest.client || {};
    dest.client.x = src.client.x;
    dest.client.y = src.client.y;

    dest.timeStamp = src.timeStamp;
  },

  setCoordDeltas: function setCoordDeltas(targetObj, prev, cur) {
    targetObj.page.x = cur.page.x - prev.page.x;
    targetObj.page.y = cur.page.y - prev.page.y;
    targetObj.client.x = cur.client.x - prev.client.x;
    targetObj.client.y = cur.client.y - prev.client.y;
    targetObj.timeStamp = cur.timeStamp - prev.timeStamp;

    // set pointer velocity
    var dt = Math.max(targetObj.timeStamp / 1000, 0.001);

    targetObj.page.speed = (0, _hypot2.default)(targetObj.page.x, targetObj.page.y) / dt;
    targetObj.page.vx = targetObj.page.x / dt;
    targetObj.page.vy = targetObj.page.y / dt;

    targetObj.client.speed = (0, _hypot2.default)(targetObj.client.x, targetObj.page.y) / dt;
    targetObj.client.vx = targetObj.client.x / dt;
    targetObj.client.vy = targetObj.client.y / dt;
  },

  isNativePointer: function isNativePointer(pointer) {
    return pointer instanceof _domObjects2.default.Event || pointer instanceof _domObjects2.default.Touch;
  },

  // Get specified X/Y coords for mouse or event.touches[0]
  getXY: function getXY(type, pointer, xy) {
    xy = xy || {};
    type = type || 'page';

    xy.x = pointer[type + 'X'];
    xy.y = pointer[type + 'Y'];

    return xy;
  },

  getPageXY: function getPageXY(pointer, page) {
    page = page || {};

    // Opera Mobile handles the viewport and scrolling oddly
    if (_browser2.default.isOperaMobile && pointerUtils.isNativePointer(pointer)) {
      pointerUtils.getXY('screen', pointer, page);

      page.x += window.scrollX;
      page.y += window.scrollY;
    } else {
      pointerUtils.getXY('page', pointer, page);
    }

    return page;
  },

  getClientXY: function getClientXY(pointer, client) {
    client = client || {};

    if (_browser2.default.isOperaMobile && pointerUtils.isNativePointer(pointer)) {
      // Opera Mobile handles the viewport and scrolling oddly
      pointerUtils.getXY('screen', pointer, client);
    } else {
      pointerUtils.getXY('client', pointer, client);
    }

    return client;
  },

  getPointerId: function getPointerId(pointer) {
    return is.number(pointer.pointerId) ? pointer.pointerId : pointer.identifier;
  },

  setCoords: function setCoords(targetObj, pointers, timeStamp) {
    var pointer = pointers.length > 1 ? pointerUtils.pointerAverage(pointers) : pointers[0];

    var tmpXY = {};

    pointerUtils.getPageXY(pointer, tmpXY);
    targetObj.page.x = tmpXY.x;
    targetObj.page.y = tmpXY.y;

    pointerUtils.getClientXY(pointer, tmpXY);
    targetObj.client.x = tmpXY.x;
    targetObj.client.y = tmpXY.y;

    targetObj.timeStamp = is.number(timeStamp) ? timeStamp : new Date().getTime();
  },

  pointerExtend: _pointerExtend2.default,

  getTouchPair: function getTouchPair(event) {
    var touches = [];

    // array of touches is supplied
    if (is.array(event)) {
      touches[0] = event[0];
      touches[1] = event[1];
    }
    // an event
    else {
        if (event.type === 'touchend') {
          if (event.touches.length === 1) {
            touches[0] = event.touches[0];
            touches[1] = event.changedTouches[0];
          } else if (event.touches.length === 0) {
            touches[0] = event.changedTouches[0];
            touches[1] = event.changedTouches[1];
          }
        } else {
          touches[0] = event.touches[0];
          touches[1] = event.touches[1];
        }
      }

    return touches;
  },

  pointerAverage: function pointerAverage(pointers) {
    var average = {
      pageX: 0,
      pageY: 0,
      clientX: 0,
      clientY: 0,
      screenX: 0,
      screenY: 0
    };

    for (var _i = 0; _i < pointers.length; _i++) {
      var _ref;

      _ref = pointers[_i];
      var pointer = _ref;

      for (var _prop in average) {
        average[_prop] += pointer[_prop];
      }
    }
    for (var prop in average) {
      average[prop] /= pointers.length;
    }

    return average;
  },

  touchBBox: function touchBBox(event) {
    if (!event.length && !(event.touches && event.touches.length > 1)) {
      return;
    }

    var touches = pointerUtils.getTouchPair(event);
    var minX = Math.min(touches[0].pageX, touches[1].pageX);
    var minY = Math.min(touches[0].pageY, touches[1].pageY);
    var maxX = Math.max(touches[0].pageX, touches[1].pageX);
    var maxY = Math.max(touches[0].pageY, touches[1].pageY);

    return {
      x: minX,
      y: minY,
      left: minX,
      top: minY,
      width: maxX - minX,
      height: maxY - minY
    };
  },

  touchDistance: function touchDistance(event, deltaSource) {
    var sourceX = deltaSource + 'X';
    var sourceY = deltaSource + 'Y';
    var touches = pointerUtils.getTouchPair(event);

    var dx = touches[0][sourceX] - touches[1][sourceX];
    var dy = touches[0][sourceY] - touches[1][sourceY];

    return (0, _hypot2.default)(dx, dy);
  },

  touchAngle: function touchAngle(event, prevAngle, deltaSource) {
    var sourceX = deltaSource + 'X';
    var sourceY = deltaSource + 'Y';
    var touches = pointerUtils.getTouchPair(event);
    var dx = touches[1][sourceX] - touches[0][sourceX];
    var dy = touches[1][sourceY] - touches[0][sourceY];
    var angle = 180 * Math.atan2(dy, dx) / Math.PI;

    return angle;
  },

  getPointerType: function getPointerType(pointer) {
    return is.string(pointer.pointerType) ? pointer.pointerType : is.number(pointer.pointerType) ? [undefined, undefined, 'touch', 'pen', 'mouse'][pointer.pointerType]
    // if the PointerEvent API isn't available, then the "pointer" must
    // be either a MouseEvent, TouchEvent, or Touch object
    : /touch/.test(pointer.type) || pointer instanceof _domObjects2.default.Touch ? 'touch' : 'mouse';
  },

  // [ event.target, event.currentTarget ]
  getEventTargets: function getEventTargets(event) {
    var path = is.func(event.composedPath) ? event.composedPath() : event.path;

    return [domUtils.getActualElement(path ? path[0] : event.target), domUtils.getActualElement(event.currentTarget)];
  },

  coordsToEvent: function coordsToEvent(_ref2) {
    var page = _ref2.page,
        client = _ref2.client;

    return {
      pageX: page.x,
      pageY: page.y,
      clientX: client.x,
      clientY: client.y
    };
  }
};

exports.default = pointerUtils;

},{"./browser":121,"./domObjects":123,"./domUtils":124,"./hypot":128,"./is":131,"./pointerExtend":133}],135:[function(_dereq_,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
var lastTime = 0;
var _request = void 0;
var _cancel = void 0;

function init(window) {
  _request = window.requestAnimationFrame;
  _cancel = window.cancelAnimationFrame;

  if (!_request) {
    var vendors = ['ms', 'moz', 'webkit', 'o'];

    for (var _i = 0; _i < vendors.length; _i++) {
      var vendor = vendors[_i];
      _request = window[vendor + 'RequestAnimationFrame'];
      _cancel = window[vendor + 'CancelAnimationFrame'] || window[vendor + 'CancelRequestAnimationFrame'];
    }
  }

  if (!_request) {
    _request = function request(callback) {
      var currTime = new Date().getTime();
      var timeToCall = Math.max(0, 16 - (currTime - lastTime));
      var token = setTimeout(function () {
        callback(currTime + timeToCall);
      }, timeToCall);

      lastTime = currTime + timeToCall;
      return token;
    };

    _cancel = function cancel(token) {
      return clearTimeout(token);
    };
  }
}

exports.default = {
  request: function request(callback) {
    return _request(callback);
  },
  cancel: function cancel(token) {
    return _cancel(token);
  },
  init: init
};

},{}],136:[function(_dereq_,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getStringOptionResult = getStringOptionResult;
exports.resolveRectLike = resolveRectLike;
exports.rectToXY = rectToXY;
exports.xywhToTlbr = xywhToTlbr;
exports.tlbrToXywh = tlbrToXywh;

var _extend = _dereq_('./extend');

var _extend2 = _interopRequireDefault(_extend);

var _is = _dereq_('./is');

var is = _interopRequireWildcard(_is);

var _domUtils = _dereq_('./domUtils');

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function getStringOptionResult(value, interactable, element) {
  if (!is.string(value)) {
    return null;
  }

  if (value === 'parent') {
    value = (0, _domUtils.parentNode)(element);
  } else if (value === 'self') {
    value = interactable.getRect(element);
  } else {
    value = (0, _domUtils.closest)(element, value);
  }

  return value;
}

function resolveRectLike(value, interactable, element, functionArgs) {
  value = getStringOptionResult(value, interactable, element) || value;

  if (is.func(value)) {
    value = value.apply(null, functionArgs);
  }

  if (is.element(value)) {
    value = (0, _domUtils.getElementRect)(value);
  }

  return value;
}

function rectToXY(rect) {
  return rect && {
    x: 'x' in rect ? rect.x : rect.left,
    y: 'y' in rect ? rect.y : rect.top
  };
}

function xywhToTlbr(rect) {
  if (rect && !('left' in rect && 'top' in rect)) {
    rect = (0, _extend2.default)({}, rect);

    rect.left = rect.x || 0;
    rect.top = rect.y || 0;
    rect.right = rect.right || rect.left + rect.width;
    rect.bottom = rect.bottom || rect.top + rect.height;
  }

  return rect;
}

function tlbrToXywh(rect) {
  if (rect && !('x' in rect && 'y' in rect)) {
    rect = (0, _extend2.default)({}, rect);

    rect.x = rect.left || 0;
    rect.y = rect.top || 0;
    rect.width = rect.width || rect.right - rect.x;
    rect.height = rect.height || rect.bottom - rect.y;
  }

  return rect;
}

exports.default = {
  getStringOptionResult: getStringOptionResult,
  resolveRectLike: resolveRectLike,
  rectToXY: rectToXY,
  xywhToTlbr: xywhToTlbr,
  tlbrToXywh: tlbrToXywh
};

},{"./domUtils":124,"./extend":126,"./is":131}],137:[function(_dereq_,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _is = _dereq_('../is');

var is = _interopRequireWildcard(_is);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

exports.default = function (grid) {
  return function (x, y) {
    var gridX = grid.x,
        gridY = grid.y,
        range = grid.range,
        offset = grid.offset,
        _grid$limits = grid.limits,
        limits = _grid$limits === undefined ? {
      left: -Infinity,
      right: Infinity,
      top: -Infinity,
      bottom: Infinity
    } : _grid$limits;


    var offsetX = 0;
    var offsetY = 0;

    if (is.object(offset)) {
      offsetX = offset.x;
      offsetY = offset.y;
    }

    var gridx = Math.round((x - offsetX) / gridX);
    var gridy = Math.round((y - offsetY) / gridY);

    var newX = Math.max(limits.left, Math.min(limits.right, gridx * gridX + offsetX));
    var newY = Math.max(limits.top, Math.min(limits.bottom, gridy * gridY + offsetY));

    return {
      x: newX,
      y: newY,
      range: range
    };
  };
};

},{"../is":131}],138:[function(_dereq_,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.grid = undefined;

var _grid = _dereq_('./grid');

var _grid2 = _interopRequireDefault(_grid);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.grid = _grid2.default;

},{"./grid":137}],139:[function(_dereq_,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.init = init;
exports.getWindow = getWindow;

var _isWindow = _dereq_('./isWindow');

var _isWindow2 = _interopRequireDefault(_isWindow);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var win = {
  getWindow: getWindow,
  init: init
};

function init(window) {
  // get wrapped window if using Shadow DOM polyfill

  win.realWindow = window;

  // create a TextNode
  var el = window.document.createTextNode('');

  // check if it's wrapped by a polyfill
  if (el.ownerDocument !== window.document && typeof window.wrap === 'function' && window.wrap(el) === el) {
    // use wrapped window
    window = window.wrap(window);
  }

  win.window = window;
}

if (typeof window === 'undefined') {
  win.window = undefined;
  win.realWindow = undefined;
} else {
  init(window);
}

function getWindow(node) {
  if ((0, _isWindow2.default)(node)) {
    return node;
  }

  var rootNode = node.ownerDocument || node;

  return rootNode.defaultView || win.window;
}

win.init = init;

exports.default = win;

},{"./isWindow":132}]},{},[1])(1)
});


//# sourceMappingURL=interact.js.map
