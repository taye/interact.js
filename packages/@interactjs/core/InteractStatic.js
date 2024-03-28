/**
 * interact.js 1.10.27
 *
 * Copyright (c) 2012-present Taye Adeyemi <dev@taye.me>
 * Released under the MIT License.
 * https://raw.github.com/taye/interact.js/main/LICENSE
 */

import browser from "../utils/browser.js";
import * as domUtils from "../utils/domUtils.js";
import is from "../utils/is.js";
import isNonNativeEvent from "../utils/isNonNativeEvent.js";
import { warnOnce } from "../utils/misc.js";
import * as pointerUtils from "../utils/pointerUtils.js";

/**
 * ```js
 * interact('#draggable').draggable(true)
 *
 * var rectables = interact('rect')
 * rectables
 *   .gesturable(true)
 *   .on('gesturemove', function (event) {
 *       // ...
 *   })
 * ```
 *
 * The methods of this variable can be used to set elements as interactables
 * and also to change various default settings.
 *
 * Calling it as a function and passing an element or a valid CSS selector
 * string returns an Interactable object which has various methods to configure
 * it.
 *
 * @param {Element | string} target The HTML or SVG Element to interact with
 * or CSS selector
 * @return {Interactable}
 */

function createInteractStatic(scope) {
  const interact = (target, options) => {
    let interactable = scope.interactables.getExisting(target, options);
    if (!interactable) {
      interactable = scope.interactables.new(target, options);
      interactable.events.global = interact.globalEvents;
    }
    return interactable;
  };

  // expose the functions used to calculate multi-touch properties
  interact.getPointerAverage = pointerUtils.pointerAverage;
  interact.getTouchBBox = pointerUtils.touchBBox;
  interact.getTouchDistance = pointerUtils.touchDistance;
  interact.getTouchAngle = pointerUtils.touchAngle;
  interact.getElementRect = domUtils.getElementRect;
  interact.getElementClientRect = domUtils.getElementClientRect;
  interact.matchesSelector = domUtils.matchesSelector;
  interact.closest = domUtils.closest;
  interact.globalEvents = {};

  // eslint-disable-next-line no-undef
  interact.version = "1.10.27";
  interact.scope = scope;
  interact.use = function (plugin, options) {
    this.scope.usePlugin(plugin, options);
    return this;
  };
  interact.isSet = function (target, options) {
    return !!this.scope.interactables.get(target, options && options.context);
  };
  interact.on = warnOnce(function on(type, listener, options) {
    if (is.string(type) && type.search(' ') !== -1) {
      type = type.trim().split(/ +/);
    }
    if (is.array(type)) {
      for (const eventType of type) {
        this.on(eventType, listener, options);
      }
      return this;
    }
    if (is.object(type)) {
      for (const prop in type) {
        this.on(prop, type[prop], listener);
      }
      return this;
    }

    // if it is an InteractEvent type, add listener to globalEvents
    if (isNonNativeEvent(type, this.scope.actions)) {
      // if this type of event was never bound
      if (!this.globalEvents[type]) {
        this.globalEvents[type] = [listener];
      } else {
        this.globalEvents[type].push(listener);
      }
    }
    // If non InteractEvent type, addEventListener to document
    else {
      this.scope.events.add(this.scope.document, type, listener, {
        options
      });
    }
    return this;
  }, 'The interact.on() method is being deprecated');
  interact.off = warnOnce(function off(type, listener, options) {
    if (is.string(type) && type.search(' ') !== -1) {
      type = type.trim().split(/ +/);
    }
    if (is.array(type)) {
      for (const eventType of type) {
        this.off(eventType, listener, options);
      }
      return this;
    }
    if (is.object(type)) {
      for (const prop in type) {
        this.off(prop, type[prop], listener);
      }
      return this;
    }
    if (isNonNativeEvent(type, this.scope.actions)) {
      let index;
      if (type in this.globalEvents && (index = this.globalEvents[type].indexOf(listener)) !== -1) {
        this.globalEvents[type].splice(index, 1);
      }
    } else {
      this.scope.events.remove(this.scope.document, type, listener, options);
    }
    return this;
  }, 'The interact.off() method is being deprecated');
  interact.debug = function () {
    return this.scope;
  };
  interact.supportsTouch = function () {
    return browser.supportsTouch;
  };
  interact.supportsPointerEvent = function () {
    return browser.supportsPointerEvent;
  };
  interact.stop = function () {
    for (const interaction of this.scope.interactions.list) {
      interaction.stop();
    }
    return this;
  };
  interact.pointerMoveTolerance = function (newValue) {
    if (is.number(newValue)) {
      this.scope.interactions.pointerMoveTolerance = newValue;
      return this;
    }
    return this.scope.interactions.pointerMoveTolerance;
  };
  interact.addDocument = function (doc, options) {
    this.scope.addDocument(doc, options);
  };
  interact.removeDocument = function (doc) {
    this.scope.removeDocument(doc);
  };
  return interact;
}
export { createInteractStatic };
//# sourceMappingURL=InteractStatic.js.map
