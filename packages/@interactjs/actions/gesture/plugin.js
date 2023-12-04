"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _is = _interopRequireDefault(require("../../utils/is.js"));
var pointerUtils = _interopRequireWildcard(require("../../utils/pointerUtils.js"));
function _getRequireWildcardCache(e) { if ("function" != typeof WeakMap) return null; var r = new WeakMap(), t = new WeakMap(); return (_getRequireWildcardCache = function (e) { return e ? t : r; })(e); }
function _interopRequireWildcard(e, r) { if (!r && e && e.__esModule) return e; if (null === e || "object" != typeof e && "function" != typeof e) return { default: e }; var t = _getRequireWildcardCache(r); if (t && t.has(e)) return t.get(e); var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var u in e) if ("default" !== u && Object.prototype.hasOwnProperty.call(e, u)) { var i = a ? Object.getOwnPropertyDescriptor(e, u) : null; i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u]; } return n.default = e, t && t.set(e, n), n; }
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function install(scope) {
  const {
    actions,
    Interactable,
    defaults
  } = scope;
  Interactable.prototype.gesturable = function (options) {
    if (_is.default.object(options)) {
      this.options.gesture.enabled = options.enabled !== false;
      this.setPerAction('gesture', options);
      this.setOnEvents('gesture', options);
      return this;
    }
    if (_is.default.bool(options)) {
      this.options.gesture.enabled = options;
      return this;
    }
    return this.options.gesture;
  };
  actions.map.gesture = gesture;
  actions.methodDict.gesture = 'gesturable';
  defaults.actions.gesture = gesture.defaults;
}
function updateGestureProps({
  interaction,
  iEvent,
  phase
}) {
  if (interaction.prepared.name !== 'gesture') return;
  const pointers = interaction.pointers.map(p => p.pointer);
  const starting = phase === 'start';
  const ending = phase === 'end';
  const deltaSource = interaction.interactable.options.deltaSource;
  iEvent.touches = [pointers[0], pointers[1]];
  if (starting) {
    iEvent.distance = pointerUtils.touchDistance(pointers, deltaSource);
    iEvent.box = pointerUtils.touchBBox(pointers);
    iEvent.scale = 1;
    iEvent.ds = 0;
    iEvent.angle = pointerUtils.touchAngle(pointers, deltaSource);
    iEvent.da = 0;
    interaction.gesture.startDistance = iEvent.distance;
    interaction.gesture.startAngle = iEvent.angle;
  } else if (ending || interaction.pointers.length < 2) {
    const prevEvent = interaction.prevEvent;
    iEvent.distance = prevEvent.distance;
    iEvent.box = prevEvent.box;
    iEvent.scale = prevEvent.scale;
    iEvent.ds = 0;
    iEvent.angle = prevEvent.angle;
    iEvent.da = 0;
  } else {
    iEvent.distance = pointerUtils.touchDistance(pointers, deltaSource);
    iEvent.box = pointerUtils.touchBBox(pointers);
    iEvent.scale = iEvent.distance / interaction.gesture.startDistance;
    iEvent.angle = pointerUtils.touchAngle(pointers, deltaSource);
    iEvent.ds = iEvent.scale - interaction.gesture.scale;
    iEvent.da = iEvent.angle - interaction.gesture.angle;
  }
  interaction.gesture.distance = iEvent.distance;
  interaction.gesture.angle = iEvent.angle;
  if (_is.default.number(iEvent.scale) && iEvent.scale !== Infinity && !isNaN(iEvent.scale)) {
    interaction.gesture.scale = iEvent.scale;
  }
}
const gesture = {
  id: 'actions/gesture',
  before: ['actions/drag', 'actions/resize'],
  install,
  listeners: {
    'interactions:action-start': updateGestureProps,
    'interactions:action-move': updateGestureProps,
    'interactions:action-end': updateGestureProps,
    'interactions:new': ({
      interaction
    }) => {
      interaction.gesture = {
        angle: 0,
        distance: 0,
        scale: 1,
        startAngle: 0,
        startDistance: 0
      };
    },
    'auto-start:check': arg => {
      if (arg.interaction.pointers.length < 2) {
        return undefined;
      }
      const gestureOptions = arg.interactable.options.gesture;
      if (!(gestureOptions && gestureOptions.enabled)) {
        return undefined;
      }
      arg.action = {
        name: 'gesture'
      };
      return false;
    }
  },
  defaults: {},
  getCursor() {
    return '';
  },
  filterEventType: type => type.search('gesture') === 0
};
var _default = exports.default = gesture;
//# sourceMappingURL=plugin.js.map