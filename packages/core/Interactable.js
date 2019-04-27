import * as arr from '@interactjs/utils/arr';
import browser from '@interactjs/utils/browser';
import clone from '@interactjs/utils/clone';
import { getElementRect, matchesUpTo, nodeContains, trySelector } from '@interactjs/utils/domUtils';
import events from '@interactjs/utils/events';
import extend from '@interactjs/utils/extend';
import * as is from '@interactjs/utils/is';
import normalizeListeners from '@interactjs/utils/normalizeListeners';
import { getWindow } from '@interactjs/utils/window';
import Eventable from './Eventable';
/** */
export class Interactable {
    /** */
    constructor(target, options, defaultContext) {
        this.events = new Eventable();
        this._actions = options.actions;
        this.target = target;
        this._context = options.context || defaultContext;
        this._win = getWindow(trySelector(target) ? this._context : target);
        this._doc = this._win.document;
        this.set(options);
    }
    get _defaults() {
        return {
            base: {},
            perAction: {},
            actions: {},
        };
    }
    setOnEvents(actionName, phases) {
        if (is.func(phases.onstart)) {
            this.on(`${actionName}start`, phases.onstart);
        }
        if (is.func(phases.onmove)) {
            this.on(`${actionName}move`, phases.onmove);
        }
        if (is.func(phases.onend)) {
            this.on(`${actionName}end`, phases.onend);
        }
        if (is.func(phases.oninertiastart)) {
            this.on(`${actionName}inertiastart`, phases.oninertiastart);
        }
        return this;
    }
    updatePerActionListeners(actionName, prev, cur) {
        if (is.array(prev) || is.object(prev)) {
            this.off(actionName, prev);
        }
        if (is.array(cur) || is.object(cur)) {
            this.on(actionName, cur);
        }
    }
    setPerAction(actionName, options) {
        const defaults = this._defaults;
        // for all the default per-action options
        for (const optionName in options) {
            const actionOptions = this.options[actionName];
            const optionValue = options[optionName];
            const isArray = is.array(optionValue);
            // remove old event listeners and add new ones
            if (optionName === 'listeners') {
                this.updatePerActionListeners(actionName, actionOptions.listeners, optionValue);
            }
            // if the option value is an array
            if (isArray) {
                actionOptions[optionName] = arr.from(optionValue);
            }
            // if the option value is an object
            else if (!isArray && is.plainObject(optionValue)) {
                // copy the object
                actionOptions[optionName] = extend(actionOptions[optionName] || {}, clone(optionValue));
                // set anabled field to true if it exists in the defaults
                if (is.object(defaults.perAction[optionName]) && 'enabled' in defaults.perAction[optionName]) {
                    actionOptions[optionName].enabled = optionValue.enabled !== false;
                }
            }
            // if the option value is a boolean and the default is an object
            else if (is.bool(optionValue) && is.object(defaults.perAction[optionName])) {
                actionOptions[optionName].enabled = optionValue;
            }
            // if it's anything else, do a plain assignment
            else {
                actionOptions[optionName] = optionValue;
            }
        }
    }
    /**
     * The default function to get an Interactables bounding rect. Can be
     * overridden using {@link Interactable.rectChecker}.
     *
     * @param {Element} [element] The element to measure.
     * @return {object} The object's bounding rectangle.
     */
    getRect(element) {
        element = element || (is.element(this.target)
            ? this.target
            : null);
        if (is.string(this.target)) {
            element = element || this._context.querySelector(this.target);
        }
        return getElementRect(element);
    }
    /**
     * Returns or sets the function used to calculate the interactable's
     * element's rectangle
     *
     * @param {function} [checker] A function which returns this Interactable's
     * bounding rectangle. See {@link Interactable.getRect}
     * @return {function | object} The checker function or this Interactable
     */
    rectChecker(checker) {
        if (is.func(checker)) {
            this.getRect = checker;
            return this;
        }
        if (checker === null) {
            delete this.getRect;
            return this;
        }
        return this.getRect;
    }
    _backCompatOption(optionName, newValue) {
        if (trySelector(newValue) || is.object(newValue)) {
            this.options[optionName] = newValue;
            for (const action of this._actions.names) {
                this.options[action][optionName] = newValue;
            }
            return this;
        }
        return this.options[optionName];
    }
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
    origin(newValue) {
        return this._backCompatOption('origin', newValue);
    }
    /**
     * Returns or sets the mouse coordinate types used to calculate the
     * movement of the pointer.
     *
     * @param {string} [newValue] Use 'client' if you will be scrolling while
     * interacting; Use 'page' if you want autoScroll to work
     * @return {string | object} The current deltaSource or this Interactable
     */
    deltaSource(newValue) {
        if (newValue === 'page' || newValue === 'client') {
            this.options.deltaSource = newValue;
            return this;
        }
        return this.options.deltaSource;
    }
    /**
     * Gets the selector context Node of the Interactable. The default is
     * `window.document`.
     *
     * @return {Node} The context Node of this Interactable
     */
    context() {
        return this._context;
    }
    inContext(element) {
        return (this._context === element.ownerDocument ||
            nodeContains(this._context, element));
    }
    testIgnoreAllow(options, interactableElement, eventTarget) {
        return (!this.testIgnore(options.ignoreFrom, interactableElement, eventTarget) &&
            this.testAllow(options.allowFrom, interactableElement, eventTarget));
    }
    testAllow(allowFrom, interactableElement, element) {
        if (!allowFrom) {
            return true;
        }
        if (!is.element(element)) {
            return false;
        }
        if (is.string(allowFrom)) {
            return matchesUpTo(element, allowFrom, interactableElement);
        }
        else if (is.element(allowFrom)) {
            return nodeContains(allowFrom, element);
        }
        return false;
    }
    testIgnore(ignoreFrom, interactableElement, element) {
        if (!ignoreFrom || !is.element(element)) {
            return false;
        }
        if (is.string(ignoreFrom)) {
            return matchesUpTo(element, ignoreFrom, interactableElement);
        }
        else if (is.element(ignoreFrom)) {
            return nodeContains(ignoreFrom, element);
        }
        return false;
    }
    /**
     * Calls listeners for the given InteractEvent type bound globally
     * and directly to this Interactable
     *
     * @param {InteractEvent} iEvent The InteractEvent object to be fired on this
     * Interactable
     * @return {Interactable} this Interactable
     */
    fire(iEvent) {
        this.events.fire(iEvent);
        return this;
    }
    _onOff(method, typeArg, listenerArg, options) {
        if (is.object(typeArg) && !is.array(typeArg)) {
            options = listenerArg;
            listenerArg = null;
        }
        const addRemove = method === 'on' ? 'add' : 'remove';
        const listeners = normalizeListeners(typeArg, listenerArg);
        for (let type in listeners) {
            if (type === 'wheel') {
                type = browser.wheelEvent;
            }
            for (const listener of listeners[type]) {
                // if it is an action event type
                if (arr.contains(this._actions.eventTypes, type)) {
                    this.events[method](type, listener);
                }
                // delegated event
                else if (is.string(this.target)) {
                    events[`${addRemove}Delegate`](this.target, this._context, type, listener, options);
                }
                // remove listener from this Interatable's element
                else {
                    events[addRemove](this.target, type, listener, options);
                }
            }
        }
        return this;
    }
    /**
     * Binds a listener for an InteractEvent, pointerEvent or DOM event.
     *
     * @param {string | array | object} types The types of events to listen
     * for
     * @param {function | array | object} [listener] The event listener function(s)
     * @param {object | boolean} [options] options object or useCapture flag for
     * addEventListener
     * @return {Interactable} This Interactable
     */
    on(types, listener, options) {
        return this._onOff('on', types, listener, options);
    }
    /**
     * Removes an InteractEvent, pointerEvent or DOM event listener.
     *
     * @param {string | array | object} types The types of events that were
     * listened for
     * @param {function | array | object} [listener] The event listener function(s)
     * @param {object | boolean} [options] options object or useCapture flag for
     * removeEventListener
     * @return {Interactable} This Interactable
     */
    off(types, listener, options) {
        return this._onOff('off', types, listener, options);
    }
    /**
     * Reset the options of this Interactable
     *
     * @param {object} options The new settings to apply
     * @return {object} This Interactable
     */
    set(options) {
        const defaults = this._defaults;
        if (!is.object(options)) {
            options = {};
        }
        this.options = clone(defaults.base);
        for (const actionName in this._actions.methodDict) {
            const methodName = this._actions.methodDict[actionName];
            this.options[actionName] = {};
            this.setPerAction(actionName, extend(extend({}, defaults.perAction), defaults.actions[actionName]));
            this[methodName](options[actionName]);
        }
        for (const setting in options) {
            if (is.func(this[setting])) {
                this[setting](options[setting]);
            }
        }
        return this;
    }
    /**
     * Remove this interactable from the list of interactables and remove it's
     * action capabilities and event listeners
     *
     * @return {interact}
     */
    unset() {
        events.remove(this.target, 'all');
        if (is.string(this.target)) {
            // remove delegated events
            for (const type in events.delegatedEvents) {
                const delegated = events.delegatedEvents[type];
                if (delegated.selectors[0] === this.target &&
                    delegated.contexts[0] === this._context) {
                    delegated.selectors.splice(0, 1);
                    delegated.contexts.splice(0, 1);
                    delegated.listeners.splice(0, 1);
                    // remove the arrays if they are empty
                    if (!delegated.selectors.length) {
                        delegated[type] = null;
                    }
                }
                events.remove(this._context, type, events.delegateListener);
                events.remove(this._context, type, events.delegateUseCapture, true);
            }
        }
        else {
            events.remove(this.target, 'all');
        }
    }
}
export default Interactable;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiSW50ZXJhY3RhYmxlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiSW50ZXJhY3RhYmxlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sS0FBSyxHQUFHLE1BQU0sdUJBQXVCLENBQUE7QUFDNUMsT0FBTyxPQUFPLE1BQU0sMkJBQTJCLENBQUE7QUFDL0MsT0FBTyxLQUFLLE1BQU0seUJBQXlCLENBQUE7QUFDM0MsT0FBTyxFQUFFLGNBQWMsRUFBRSxXQUFXLEVBQUUsWUFBWSxFQUFFLFdBQVcsRUFBRSxNQUFNLDRCQUE0QixDQUFBO0FBQ25HLE9BQU8sTUFBTSxNQUFNLDBCQUEwQixDQUFBO0FBQzdDLE9BQU8sTUFBTSxNQUFNLDBCQUEwQixDQUFBO0FBQzdDLE9BQU8sS0FBSyxFQUFFLE1BQU0sc0JBQXNCLENBQUE7QUFDMUMsT0FBTyxrQkFBa0IsTUFBTSxzQ0FBc0MsQ0FBQTtBQUNyRSxPQUFPLEVBQUUsU0FBUyxFQUFFLE1BQU0sMEJBQTBCLENBQUE7QUFFcEQsT0FBTyxTQUFTLE1BQU0sYUFBYSxDQUFBO0FBS25DLE1BQU07QUFDTixNQUFNLE9BQU8sWUFBWTtJQWlCdkIsTUFBTTtJQUNOLFlBQWEsTUFBdUIsRUFBRSxPQUFZLEVBQUUsY0FBa0M7UUFON0UsV0FBTSxHQUFHLElBQUksU0FBUyxFQUFFLENBQUE7UUFPL0IsSUFBSSxDQUFDLFFBQVEsR0FBRyxPQUFPLENBQUMsT0FBTyxDQUFBO1FBQy9CLElBQUksQ0FBQyxNQUFNLEdBQUssTUFBTSxDQUFBO1FBQ3RCLElBQUksQ0FBQyxRQUFRLEdBQUcsT0FBTyxDQUFDLE9BQU8sSUFBSSxjQUFjLENBQUE7UUFDakQsSUFBSSxDQUFDLElBQUksR0FBTyxTQUFTLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQTtRQUN2RSxJQUFJLENBQUMsSUFBSSxHQUFPLElBQUksQ0FB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QUN6QyxNQUFNLFNBQVMsR0FBRyxNQUFNLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQyxDQUFBO2dCQUU5QyxJQUFJLFNBQVMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLEtBQUssSUFBSSxDQUFDLE1BQU07b0JBQ3RDLFNBQVMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLEtBQUssSUFBSSxDQUFDLFFBQVEsRUFBRTtvQkFDM0MsU0FBUyxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFBO29CQUNoQyxTQUFTLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUE7b0JBQy9CLFNBQVMsQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQTtvQkFFaEMsc0NBQXNDO29CQUN0QyxJQUFJLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxNQUFNLEVBQUU7d0JBQy9CLFNBQVMsQ0FBQyxJQUFJLENBQUMsR0FBRyxJQUFJLENBQUE7cUJBQ3ZCO2lCQUNGO2dCQUVELE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxJQUFJLEVBQUUsTUFBTSxDQUFDLGdCQUFnQixDQUFDLENBQUE7Z0JBQzNELE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxJQUFJLEVBQUUsTUFBTSxDQUFDLGtCQUFrQixFQUFFLElBQUksQ0FBQyxDQUFBO2FBQ3BFO1NBQ0Y7YUFDSTtZQUNILE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLE1BQWMsRUFBRSxLQUFLLENBQUMsQ0FBQTtTQUMxQztJQUNILENBQUM7Q0FDRjtBQUVELGVBQWUsWUFBWSxDQUFBIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgYXJyIGZyb20gJ0BpbnRlcmFjdGpzL3V0aWxzL2FycidcbmltcG9ydCBicm93c2VyIGZyb20gJ0BpbnRlcmFjdGpzL3V0aWxzL2Jyb3dzZXInXG5pbXBvcnQgY2xvbmUgZnJvbSAnQGludGVyYWN0anMvdXRpbHMvY2xvbmUnXG5pbXBvcnQgeyBnZXRFbGVtZW50UmVjdCwgbWF0Y2hlc1VwVG8sIG5vZGVDb250YWlucywgdHJ5U2VsZWN0b3IgfSBmcm9tICdAaW50ZXJhY3Rqcy91dGlscy9kb21VdGlscydcbmltcG9ydCBldmVudHMgZnJvbSAnQGludGVyYWN0anMvdXRpbHMvZXZlbnRzJ1xuaW1wb3J0IGV4dGVuZCBmcm9tICdAaW50ZXJhY3Rqcy91dGlscy9leHRlbmQnXG5pbXBvcnQgKiBhcyBpcyBmcm9tICdAaW50ZXJhY3Rqcy91dGlscy9pcydcbmltcG9ydCBub3JtYWxpemVMaXN0ZW5lcnMgZnJvbSAnQGludGVyYWN0anMvdXRpbHMvbm9ybWFsaXplTGlzdGVuZXJzJ1xuaW1wb3J0IHsgZ2V0V2luZG93IH0gZnJvbSAnQGludGVyYWN0anMvdXRpbHMvd2luZG93J1xuaW1wb3J0IHsgQWN0aW9uRGVmYXVsdHMsIERlZmF1bHRzLCBPcHRpb25zIH0gZnJvbSAnLi9kZWZhdWx0T3B0aW9ucydcbmltcG9ydCBFdmVudGFibGUgZnJvbSAnLi9FdmVudGFibGUnXG5pbXBvcnQgeyBBY3Rpb25zIH0gZnJvbSAnLi9zY29wZSdcblxudHlwZSBJZ25vcmVWYWx1ZSA9IHN0cmluZyB8IEVsZW1lbnQgfCBib29sZWFuXG5cbi8qKiAqL1xuZXhwb3J0IGNsYXNzIEludGVyYWN0YWJsZSBpbXBsZW1lbnRzIFBhcnRpYWw8RXZlbnRhYmxlPiB7XG4gIHByb3RlY3RlZCBnZXQgX2RlZmF1bHRzICgpOiBEZWZhdWx0cyB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGJhc2U6IHt9LFxuICAgICAgcGVyQWN0aW9uOiB7fSxcbiAgICAgIGFjdGlvbnM6IHt9IGFzIEFjdGlvbkRlZmF1bHRzLFxuICAgIH1cbiAgfVxuXG4gIHJlYWRvbmx5IG9wdGlvbnMhOiBSZXF1aXJlZDxPcHRpb25zPlxuICByZWFkb25seSBfYWN0aW9uczogQWN0aW9uc1xuICByZWFkb25seSB0YXJnZXQ6IEludGVyYWN0LlRhcmdldFxuICByZWFkb25seSBldmVudHMgPSBuZXcgRXZlbnRhYmxlKClcbiAgcmVhZG9ubHkgX2NvbnRleHQ6IERvY3VtZW50IHwgRWxlbWVudFxuICByZWFkb25seSBfd2luOiBXaW5kb3dcbiAgcmVhZG9ubHkgX2RvYzogRG9jdW1lbnRcblxuICAvKiogKi9cbiAgY29uc3RydWN0b3IgKHRhcmdldDogSW50ZXJhY3QuVGFyZ2V0LCBvcHRpb25zOiBhbnksIGRlZmF1bHRDb250ZXh0OiBEb2N1bWVudCB8IEVsZW1lbnQpIHtcbiAgICB0aGlzLl9hY3Rpb25zID0gb3B0aW9ucy5hY3Rpb25zXG4gICAgdGhpcy50YXJnZXQgICA9IHRhcmdldFxuICAgIHRoaXMuX2NvbnRleHQgPSBvcHRpb25zLmNvbnRleHQgfHwgZGVmYXVsdENvbnRleHRcbiAgICB0aGlzLl93aW4gICAgID0gZ2V0V2luZG93KHRyeVNlbGVjdG9yKHRhcmdldCkgPyB0aGlzLl9jb250ZXh0IDogdGFyZ2V0KVxuICAgIHRoaXMuX2RvYyAgICAgPSB0aGlzLl93aW4uZG9jdW1lbnRcblxuICAgIHRoaXMuc2V0KG9wdGlvbnMpXG4gIH1cblxuICBzZXRPbkV2ZW50cyAoYWN0aW9uTmFtZTogc3RyaW5nLCBwaGFzZXM6IE5vbk51bGxhYmxlPGFueT4pIHtcbiAgICBpZiAoaXMuZnVuYyhwaGFzZXMub25zdGFydCkpIHsgdGhpcy5vbihgJHthY3Rpb25OYW1lfXN0YXJ0YCwgcGhhc2VzLm9uc3RhcnQpIH1cbiAgICBpZiAoaXMuZnVuYyhwaGFzZXMub25tb3ZlKSkgeyB0aGlzLm9uKGAke2FjdGlvbk5hbWV9bW92ZWAsIHBoYXNlcy5vbm1vdmUpIH1cbiAgICBpZiAoaXMuZnVuYyhwaGFzZXMub25lbmQpKSB7IHRoaXMub24oYCR7YWN0aW9uTmFtZX1lbmRgLCBwaGFzZXMub25lbmQpIH1cbiAgICBpZiAoaXMuZnVuYyhwaGFzZXMub25pbmVydGlhc3RhcnQpKSB7IHRoaXMub24oYCR7YWN0aW9uTmFtZX1pbmVydGlhc3RhcnRgLCBwaGFzZXMub25pbmVydGlhc3RhcnQpIH1cblxuICAgIHJldHVybiB0aGlzXG4gIH1cblxuICB1cGRhdGVQZXJBY3Rpb25MaXN0ZW5lcnMgKGFjdGlvbk5hbWUsIHByZXYsIGN1cikge1xuICAgIGlmIChpcy5hcnJheShwcmV2KSB8fCBpcy5vYmplY3QocHJldikpIHtcbiAgICAgIHRoaXMub2ZmKGFjdGlvbk5hbWUsIHByZXYpXG4gICAgfVxuXG4gICAgaWYgKGlzLmFycmF5KGN1cikgfHwgaXMub2JqZWN0KGN1cikpIHtcbiAgICAgIHRoaXMub24oYWN0aW9uTmFtZSwgY3VyKVxuICAgIH1cbiAgfVxuXG4gIHNldFBlckFjdGlvbiAoYWN0aW9uTmFtZSwgb3B0aW9uczogSW50ZXJhY3QuT3JCb29sZWFuPE9wdGlvbnM+KSB7XG4gICAgY29uc3QgZGVmYXVsdHMgPSB0aGlzLl9kZWZhdWx0c1xuXG4gICAgLy8gZm9yIGFsbCB0aGUgZGVmYXVsdCBwZXItYWN0aW9uIG9wdGlvbnNcbiAgICBmb3IgKGNvbnN0IG9wdGlvbk5hbWUgaW4gb3B0aW9ucykge1xuICAgICAgY29uc3QgYWN0aW9uT3B0aW9ucyA9IHRoaXMub3B0aW9uc1thY3Rpb25OYW1lXVxuICAgICAgY29uc3Qgb3B0aW9uVmFsdWUgPSBvcHRpb25zW29wdGlvbk5hbWVdXG4gICAgICBjb25zdCBpc0FycmF5ID0gaXMuYXJyYXkob3B0aW9uVmFsdWUpXG5cbiAgICAgIC8vIHJlbW92ZSBvbGQgZXZlbnQgbGlzdGVuZXJzIGFuZCBhZGQgbmV3IG9uZXNcbiAgICAgIGlmIChvcHRpb25OYW1lID09PSAnbGlzdGVuZXJzJykge1xuICAgICAgICB0aGlzLnVwZGF0ZVBlckFjdGlvbkxpc3RlbmVycyhhY3Rpb25OYW1lLCBhY3Rpb25PcHRpb25zLmxpc3RlbmVycywgb3B0aW9uVmFsdWUpXG4gICAgICB9XG5cbiAgICAgIC8vIGlmIHRoZSBvcHRpb24gdmFsdWUgaXMgYW4gYXJyYXlcbiAgICAgIGlmIChpc0FycmF5KSB7XG4gICAgICAgIGFjdGlvbk9wdGlvbnNbb3B0aW9uTmFtZV0gPSBhcnIuZnJvbShvcHRpb25WYWx1ZSlcbiAgICAgIH1cbiAgICAgIC8vIGlmIHRoZSBvcHRpb24gdmFsdWUgaXMgYW4gb2JqZWN0XG4gICAgICBlbHNlIGlmICghaXNBcnJheSAmJiBpcy5wbGFpbk9iamVjdChvcHRpb25WYWx1ZSkpIHtcbiAgICAgICAgLy8gY29weSB0aGUgb2JqZWN0XG4gICAgICAgIGFjdGlvbk9wdGlvbnNbb3B0aW9uTmFtZV0gPSBleHRlbmQoXG4gICAgICAgICAgYWN0aW9uT3B0aW9uc1tvcHRpb25OYW1lXSB8fCB7fSxcbiAgICAgICAgICBjbG9uZShvcHRpb25WYWx1ZSkpXG5cbiAgICAgICAgLy8gc2V0IGFuYWJsZWQgZmllbGQgdG8gdHJ1ZSBpZiBpdCBleGlzdHMgaW4gdGhlIGRlZmF1bHRzXG4gICAgICAgIGlmIChpcy5vYmplY3QoZGVmYXVsdHMucGVyQWN0aW9uW29wdGlvbk5hbWVdKSAmJiAnZW5hYmxlZCcgaW4gZGVmYXVsdHMucGVyQWN0aW9uW29wdGlvbk5hbWVdKSB7XG4gICAgICAgICAgYWN0aW9uT3B0aW9uc1tvcHRpb25OYW1lXS5lbmFibGVkID0gb3B0aW9uVmFsdWUuZW5hYmxlZCAhPT0gZmFsc2VcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgLy8gaWYgdGhlIG9wdGlvbiB2YWx1ZSBpcyBhIGJvb2xlYW4gYW5kIHRoZSBkZWZhdWx0IGlzIGFuIG9iamVjdFxuICAgICAgZWxzZSBpZiAoaXMuYm9vbChvcHRpb25WYWx1ZSkgJiYgaXMub2JqZWN0KGRlZmF1bHRzLnBlckFjdGlvbltvcHRpb25OYW1lXSkpIHtcbiAgICAgICAgYWN0aW9uT3B0aW9uc1tvcHRpb25OYW1lXS5lbmFibGVkID0gb3B0aW9uVmFsdWVcbiAgICAgIH1cbiAgICAgIC8vIGlmIGl0J3MgYW55dGhpbmcgZWxzZSwgZG8gYSBwbGFpbiBhc3NpZ25tZW50XG4gICAgICBlbHNlIHtcbiAgICAgICAgYWN0aW9uT3B0aW9uc1tvcHRpb25OYW1lXSA9IG9wdGlvblZhbHVlXG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFRoZSBkZWZhdWx0IGZ1bmN0aW9uIHRvIGdldCBhbiBJbnRlcmFjdGFibGVzIGJvdW5kaW5nIHJlY3QuIENhbiBiZVxuICAgKiBvdmVycmlkZGVuIHVzaW5nIHtAbGluayBJbnRlcmFjdGFibGUucmVjdENoZWNrZXJ9LlxuICAgKlxuICAgKiBAcGFyYW0ge0VsZW1lbnR9IFtlbGVtZW50XSBUaGUgZWxlbWVudCB0byBtZWFzdXJlLlxuICAgKiBAcmV0dXJuIHtvYmplY3R9IFRoZSBvYmplY3QncyBib3VuZGluZyByZWN0YW5nbGUuXG4gICAqL1xuICBnZXRSZWN0IChlbGVtZW50OiBFbGVtZW50KSB7XG4gICAgZWxlbWVudCA9IGVsZW1lbnQgfHwgKGlzLmVsZW1lbnQodGhpcy50YXJnZXQpXG4gICAgICA/IHRoaXMudGFyZ2V0XG4gICAgICA6IG51bGwpXG5cbiAgICBpZiAoaXMuc3RyaW5nKHRoaXMudGFyZ2V0KSkge1xuICAgICAgZWxlbWVudCA9IGVsZW1lbnQgfHwgdGhpcy5fY29udGV4dC5xdWVyeVNlbGVjdG9yKHRoaXMudGFyZ2V0KVxuICAgIH1cblxuICAgIHJldHVybiBnZXRFbGVtZW50UmVjdChlbGVtZW50KVxuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgb3Igc2V0cyB0aGUgZnVuY3Rpb24gdXNlZCB0byBjYWxjdWxhdGUgdGhlIGludGVyYWN0YWJsZSdzXG4gICAqIGVsZW1lbnQncyByZWN0YW5nbGVcbiAgICpcbiAgICogQHBhcmFtIHtmdW5jdGlvbn0gW2NoZWNrZXJdIEEgZnVuY3Rpb24gd2hpY2ggcmV0dXJucyB0aGlzIEludGVyYWN0YWJsZSdzXG4gICAqIGJvdW5kaW5nIHJlY3RhbmdsZS4gU2VlIHtAbGluayBJbnRlcmFjdGFibGUuZ2V0UmVjdH1cbiAgICogQHJldHVybiB7ZnVuY3Rpb24gfCBvYmplY3R9IFRoZSBjaGVja2VyIGZ1bmN0aW9uIG9yIHRoaXMgSW50ZXJhY3RhYmxlXG4gICAqL1xuICByZWN0Q2hlY2tlciAoY2hlY2tlcjogKGVsZW1lbnQ6IEVsZW1lbnQpID0+IGFueSkge1xuICAgIGlmIChpcy5mdW5jKGNoZWNrZXIpKSB7XG4gICAgICB0aGlzLmdldFJlY3QgPSBjaGVja2VyXG5cbiAgICAgIHJldHVybiB0aGlzXG4gICAgfVxuXG4gICAgaWYgKGNoZWNrZXIgPT09IG51bGwpIHtcbiAgICAgIGRlbGV0ZSB0aGlzLmdldFJlY3RcblxuICAgICAgcmV0dXJuIHRoaXNcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy5nZXRSZWN0XG4gIH1cblxuICBfYmFja0NvbXBhdE9wdGlvbiAob3B0aW9uTmFtZSwgbmV3VmFsdWUpIHtcbiAgICBpZiAodHJ5U2VsZWN0b3IobmV3VmFsdWUpIHx8IGlzLm9iamVjdChuZXdWYWx1ZSkpIHtcbiAgICAgIHRoaXMub3B0aW9uc1tvcHRpb25OYW1lXSA9IG5ld1ZhbHVlXG5cbiAgICAgIGZvciAoY29uc3QgYWN0aW9uIG9mIHRoaXMuX2FjdGlvbnMubmFtZXMpIHtcbiAgICAgICAgdGhpcy5vcHRpb25zW2FjdGlvbl1bb3B0aW9uTmFtZV0gPSBuZXdWYWx1ZVxuICAgICAgfVxuXG4gICAgICByZXR1cm4gdGhpc1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzLm9wdGlvbnNbb3B0aW9uTmFtZV1cbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIG9yIHNldHMgdGhlIG9yaWdpbiBvZiB0aGUgSW50ZXJhY3RhYmxlJ3MgZWxlbWVudC4gIFRoZSB4IGFuZCB5XG4gICAqIG9mIHRoZSBvcmlnaW4gd2lsbCBiZSBzdWJ0cmFjdGVkIGZyb20gYWN0aW9uIGV2ZW50IGNvb3JkaW5hdGVzLlxuICAgKlxuICAgKiBAcGFyYW0ge0VsZW1lbnQgfCBvYmplY3QgfCBzdHJpbmd9IFtvcmlnaW5dIEFuIEhUTUwgb3IgU1ZHIEVsZW1lbnQgd2hvc2VcbiAgICogcmVjdCB3aWxsIGJlIHVzZWQsIGFuIG9iamVjdCBlZy4geyB4OiAwLCB5OiAwIH0gb3Igc3RyaW5nICdwYXJlbnQnLCAnc2VsZidcbiAgICogb3IgYW55IENTUyBzZWxlY3RvclxuICAgKlxuICAgKiBAcmV0dXJuIHtvYmplY3R9IFRoZSBjdXJyZW50IG9yaWdpbiBvciB0aGlzIEludGVyYWN0YWJsZVxuICAgKi9cbiAgb3JpZ2luIChuZXdWYWx1ZSkge1xuICAgIHJldHVybiB0aGlzLl9iYWNrQ29tcGF0T3B0aW9uKCdvcmlnaW4nLCBuZXdWYWx1ZSlcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIG9yIHNldHMgdGhlIG1vdXNlIGNvb3JkaW5hdGUgdHlwZXMgdXNlZCB0byBjYWxjdWxhdGUgdGhlXG4gICAqIG1vdmVtZW50IG9mIHRoZSBwb2ludGVyLlxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gW25ld1ZhbHVlXSBVc2UgJ2NsaWVudCcgaWYgeW91IHdpbGwgYmUgc2Nyb2xsaW5nIHdoaWxlXG4gICAqIGludGVyYWN0aW5nOyBVc2UgJ3BhZ2UnIGlmIHlvdSB3YW50IGF1dG9TY3JvbGwgdG8gd29ya1xuICAgKiBAcmV0dXJuIHtzdHJpbmcgfCBvYmplY3R9IFRoZSBjdXJyZW50IGRlbHRhU291cmNlIG9yIHRoaXMgSW50ZXJhY3RhYmxlXG4gICAqL1xuICBkZWx0YVNvdXJjZSAobmV3VmFsdWUpIHtcbiAgICBpZiAobmV3VmFsdWUgPT09ICdwYWdlJyB8fCBuZXdWYWx1ZSA9PT0gJ2NsaWVudCcpIHtcbiAgICAgIHRoaXMub3B0aW9ucy5kZWx0YVNvdXJjZSA9IG5ld1ZhbHVlXG5cbiAgICAgIHJldHVybiB0aGlzXG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXMub3B0aW9ucy5kZWx0YVNvdXJjZVxuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIHNlbGVjdG9yIGNvbnRleHQgTm9kZSBvZiB0aGUgSW50ZXJhY3RhYmxlLiBUaGUgZGVmYXVsdCBpc1xuICAgKiBgd2luZG93LmRvY3VtZW50YC5cbiAgICpcbiAgICogQHJldHVybiB7Tm9kZX0gVGhlIGNvbnRleHQgTm9kZSBvZiB0aGlzIEludGVyYWN0YWJsZVxuICAgKi9cbiAgY29udGV4dCAoKSB7XG4gICAgcmV0dXJuIHRoaXMuX2NvbnRleHRcbiAgfVxuXG4gIGluQ29udGV4dCAoZWxlbWVudCkge1xuICAgIHJldHVybiAodGhpcy5fY29udGV4dCA9PT0gZWxlbWVudC5vd25lckRvY3VtZW50IHx8XG4gICAgICAgICAgICBub2RlQ29udGFpbnModGhpcy5fY29udGV4dCwgZWxlbWVudCkpXG4gIH1cblxuICB0ZXN0SWdub3JlQWxsb3cgKHRoaXM6IEludGVyYWN0YWJsZSwgb3B0aW9uczogeyBpZ25vcmVGcm9tOiBJZ25vcmVWYWx1ZSwgYWxsb3dGcm9tOiBJZ25vcmVWYWx1ZSB9LCBpbnRlcmFjdGFibGVFbGVtZW50OiBFbGVtZW50LCBldmVudFRhcmdldDogRWxlbWVudCkge1xuICAgIHJldHVybiAoIXRoaXMudGVzdElnbm9yZShvcHRpb25zLmlnbm9yZUZyb20sIGludGVyYWN0YWJsZUVsZW1lbnQsIGV2ZW50VGFyZ2V0KSAmJlxuICAgICAgICAgICAgdGhpcy50ZXN0QWxsb3cob3B0aW9ucy5hbGxvd0Zyb20sIGludGVyYWN0YWJsZUVsZW1lbnQsIGV2ZW50VGFyZ2V0KSlcbiAgfVxuXG4gIHRlc3RBbGxvdyAodGhpczogSW50ZXJhY3RhYmxlLCBhbGxvd0Zyb206IElnbm9yZVZhbHVlLCBpbnRlcmFjdGFibGVFbGVtZW50OiBFbGVtZW50LCBlbGVtZW50OiBFbGVtZW50KSB7XG4gICAgaWYgKCFhbGxvd0Zyb20pIHsgcmV0dXJuIHRydWUgfVxuXG4gICAgaWYgKCFpcy5lbGVtZW50KGVsZW1lbnQpKSB7IHJldHVybiBmYWxzZSB9XG5cbiAgICBpZiAoaXMuc3RyaW5nKGFsbG93RnJvbSkpIHtcbiAgICAgIHJldHVybiBtYXRjaGVzVXBUbyhlbGVtZW50LCBhbGxvd0Zyb20sIGludGVyYWN0YWJsZUVsZW1lbnQpXG4gICAgfVxuICAgIGVsc2UgaWYgKGlzLmVsZW1lbnQoYWxsb3dGcm9tKSkge1xuICAgICAgcmV0dXJuIG5vZGVDb250YWlucyhhbGxvd0Zyb20sIGVsZW1lbnQpXG4gICAgfVxuXG4gICAgcmV0dXJuIGZhbHNlXG4gIH1cblxuICB0ZXN0SWdub3JlICh0aGlzOiBJbnRlcmFjdGFibGUsIGlnbm9yZUZyb206IElnbm9yZVZhbHVlLCBpbnRlcmFjdGFibGVFbGVtZW50OiBFbGVtZW50LCBlbGVtZW50OiBFbGVtZW50KSB7XG4gICAgaWYgKCFpZ25vcmVGcm9tIHx8ICFpcy5lbGVtZW50KGVsZW1lbnQpKSB7IHJldHVybiBmYWxzZSB9XG5cbiAgICBpZiAoaXMuc3RyaW5nKGlnbm9yZUZyb20pKSB7XG4gICAgICByZXR1cm4gbWF0Y2hlc1VwVG8oZWxlbWVudCwgaWdub3JlRnJvbSwgaW50ZXJhY3RhYmxlRWxlbWVudClcbiAgICB9XG4gICAgZWxzZSBpZiAoaXMuZWxlbWVudChpZ25vcmVGcm9tKSkge1xuICAgICAgcmV0dXJuIG5vZGVDb250YWlucyhpZ25vcmVGcm9tLCBlbGVtZW50KVxuICAgIH1cblxuICAgIHJldHVybiBmYWxzZVxuICB9XG5cbiAgLyoqXG4gICAqIENhbGxzIGxpc3RlbmVycyBmb3IgdGhlIGdpdmVuIEludGVyYWN0RXZlbnQgdHlwZSBib3VuZCBnbG9iYWxseVxuICAgKiBhbmQgZGlyZWN0bHkgdG8gdGhpcyBJbnRlcmFjdGFibGVcbiAgICpcbiAgICogQHBhcmFtIHtJbnRlcmFjdEV2ZW50fSBpRXZlbnQgVGhlIEludGVyYWN0RXZlbnQgb2JqZWN0IHRvIGJlIGZpcmVkIG9uIHRoaXNcbiAgICogSW50ZXJhY3RhYmxlXG4gICAqIEByZXR1cm4ge0ludGVyYWN0YWJsZX0gdGhpcyBJbnRlcmFjdGFibGVcbiAgICovXG4gIGZpcmUgKGlFdmVudCkge1xuICAgIHRoaXMuZXZlbnRzLmZpcmUoaUV2ZW50KVxuXG4gICAgcmV0dXJuIHRoaXNcbiAgfVxuXG4gIF9vbk9mZiAobWV0aG9kOiAnb24nIHwgJ29mZicsIHR5cGVBcmc6IEludGVyYWN0LkV2ZW50VHlwZXMsIGxpc3RlbmVyQXJnPzogSW50ZXJhY3QuTGlzdGVuZXJzQXJnIHwgbnVsbCwgb3B0aW9ucz86IGFueSkge1xuICAgIGlmIChpcy5vYmplY3QodHlwZUFyZykgJiYgIWlzLmFycmF5KHR5cGVBcmcpKSB7XG4gICAgICBvcHRpb25zID0gbGlzdGVuZXJBcmdcbiAgICAgIGxpc3RlbmVyQXJnID0gbnVsbFxuICAgIH1cblxuICAgIGNvbnN0IGFkZFJlbW92ZSA9IG1ldGhvZCA9PT0gJ29uJyA/ICdhZGQnIDogJ3JlbW92ZSdcbiAgICBjb25zdCBsaXN0ZW5lcnMgPSBub3JtYWxpemVMaXN0ZW5lcnModHlwZUFyZywgbGlzdGVuZXJBcmcpXG5cbiAgICBmb3IgKGxldCB0eXBlIGluIGxpc3RlbmVycykge1xuICAgICAgaWYgKHR5cGUgPT09ICd3aGVlbCcpIHsgdHlwZSA9IGJyb3dzZXIud2hlZWxFdmVudCB9XG5cbiAgICAgIGZvciAoY29uc3QgbGlzdGVuZXIgb2YgbGlzdGVuZXJzW3R5cGVdKSB7XG4gICAgICAgIC8vIGlmIGl0IGlzIGFuIGFjdGlvbiBldmVudCB0eXBlXG4gICAgICAgIGlmIChhcnIuY29udGFpbnModGhpcy5fYWN0aW9ucy5ldmVudFR5cGVzLCB0eXBlKSkge1xuICAgICAgICAgIHRoaXMuZXZlbnRzW21ldGhvZF0odHlwZSwgbGlzdGVuZXIpXG4gICAgICAgIH1cbiAgICAgICAgLy8gZGVsZWdhdGVkIGV2ZW50XG4gICAgICAgIGVsc2UgaWYgKGlzLnN0cmluZyh0aGlzLnRhcmdldCkpIHtcbiAgICAgICAgICBldmVudHNbYCR7YWRkUmVtb3ZlfURlbGVnYXRlYF0odGhpcy50YXJnZXQsIHRoaXMuX2NvbnRleHQsIHR5cGUsIGxpc3RlbmVyLCBvcHRpb25zKVxuICAgICAgICB9XG4gICAgICAgIC8vIHJlbW92ZSBsaXN0ZW5lciBmcm9tIHRoaXMgSW50ZXJhdGFibGUncyBlbGVtZW50XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgIChldmVudHNbYWRkUmVtb3ZlXSBhcyB0eXBlb2YgZXZlbnRzLnJlbW92ZSkodGhpcy50YXJnZXQsIHR5cGUsIGxpc3RlbmVyLCBvcHRpb25zKVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXNcbiAgfVxuXG4gIC8qKlxuICAgKiBCaW5kcyBhIGxpc3RlbmVyIGZvciBhbiBJbnRlcmFjdEV2ZW50LCBwb2ludGVyRXZlbnQgb3IgRE9NIGV2ZW50LlxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZyB8IGFycmF5IHwgb2JqZWN0fSB0eXBlcyBUaGUgdHlwZXMgb2YgZXZlbnRzIHRvIGxpc3RlblxuICAgKiBmb3JcbiAgICogQHBhcmFtIHtmdW5jdGlvbiB8IGFycmF5IHwgb2JqZWN0fSBbbGlzdGVuZXJdIFRoZSBldmVudCBsaXN0ZW5lciBmdW5jdGlvbihzKVxuICAgKiBAcGFyYW0ge29iamVjdCB8IGJvb2xlYW59IFtvcHRpb25zXSBvcHRpb25zIG9iamVjdCBvciB1c2VDYXB0dXJlIGZsYWcgZm9yXG4gICAqIGFkZEV2ZW50TGlzdGVuZXJcbiAgICogQHJldHVybiB7SW50ZXJhY3RhYmxlfSBUaGlzIEludGVyYWN0YWJsZVxuICAgKi9cbiAgb24gKHR5cGVzOiBJbnRlcmFjdC5FdmVudFR5cGVzLCBsaXN0ZW5lcj86IEludGVyYWN0Lkxpc3RlbmVyc0FyZywgb3B0aW9ucz86IGFueSkge1xuICAgIHJldHVybiB0aGlzLl9vbk9mZignb24nLCB0eXBlcywgbGlzdGVuZXIsIG9wdGlvbnMpXG4gIH1cblxuICAvKipcbiAgICogUmVtb3ZlcyBhbiBJbnRlcmFjdEV2ZW50LCBwb2ludGVyRXZlbnQgb3IgRE9NIGV2ZW50IGxpc3RlbmVyLlxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZyB8IGFycmF5IHwgb2JqZWN0fSB0eXBlcyBUaGUgdHlwZXMgb2YgZXZlbnRzIHRoYXQgd2VyZVxuICAgKiBsaXN0ZW5lZCBmb3JcbiAgICogQHBhcmFtIHtmdW5jdGlvbiB8IGFycmF5IHwgb2JqZWN0fSBbbGlzdGVuZXJdIFRoZSBldmVudCBsaXN0ZW5lciBmdW5jdGlvbihzKVxuICAgKiBAcGFyYW0ge29iamVjdCB8IGJvb2xlYW59IFtvcHRpb25zXSBvcHRpb25zIG9iamVjdCBvciB1c2VDYXB0dXJlIGZsYWcgZm9yXG4gICAqIHJlbW92ZUV2ZW50TGlzdGVuZXJcbiAgICogQHJldHVybiB7SW50ZXJhY3RhYmxlfSBUaGlzIEludGVyYWN0YWJsZVxuICAgKi9cbiAgb2ZmICh0eXBlczogc3RyaW5nIHwgc3RyaW5nW10gfCBJbnRlcmFjdC5FdmVudFR5cGVzLCBsaXN0ZW5lcj86IEludGVyYWN0Lkxpc3RlbmVyc0FyZywgb3B0aW9ucz86IGFueSkge1xuICAgIHJldHVybiB0aGlzLl9vbk9mZignb2ZmJywgdHlwZXMsIGxpc3RlbmVyLCBvcHRpb25zKVxuICB9XG5cbiAgLyoqXG4gICAqIFJlc2V0IHRoZSBvcHRpb25zIG9mIHRoaXMgSW50ZXJhY3RhYmxlXG4gICAqXG4gICAqIEBwYXJhbSB7b2JqZWN0fSBvcHRpb25zIFRoZSBuZXcgc2V0dGluZ3MgdG8gYXBwbHlcbiAgICogQHJldHVybiB7b2JqZWN0fSBUaGlzIEludGVyYWN0YWJsZVxuICAgKi9cbiAgc2V0IChvcHRpb25zOiBJbnRlcmFjdC5PcHRpb25zQXJnKSB7XG4gICAgY29uc3QgZGVmYXVsdHMgPSB0aGlzLl9kZWZhdWx0c1xuXG4gICAgaWYgKCFpcy5vYmplY3Qob3B0aW9ucykpIHtcbiAgICAgIG9wdGlvbnMgPSB7fVxuICAgIH1cblxuICAgICh0aGlzLm9wdGlvbnMgYXMgUmVxdWlyZWQ8T3B0aW9ucz4pID0gY2xvbmUoZGVmYXVsdHMuYmFzZSkgYXMgUmVxdWlyZWQ8T3B0aW9ucz5cblxuICAgIGZvciAoY29uc3QgYWN0aW9uTmFtZSBpbiB0aGlzLl9hY3Rpb25zLm1ldGhvZERpY3QpIHtcbiAgICAgIGNvbnN0IG1ldGhvZE5hbWUgPSB0aGlzLl9hY3Rpb25zLm1ldGhvZERpY3RbYWN0aW9uTmFtZV1cblxuICAgICAgdGhpcy5vcHRpb25zW2FjdGlvbk5hbWVdID0ge31cbiAgICAgIHRoaXMuc2V0UGVyQWN0aW9uKGFjdGlvbk5hbWUsIGV4dGVuZChleHRlbmQoe30sIGRlZmF1bHRzLnBlckFjdGlvbiksIGRlZmF1bHRzLmFjdGlvbnNbYWN0aW9uTmFtZV0pKVxuXG4gICAgICB0aGlzW21ldGhvZE5hbWVdKG9wdGlvbnNbYWN0aW9uTmFtZV0pXG4gICAgfVxuXG4gICAgZm9yIChjb25zdCBzZXR0aW5nIGluIG9wdGlvbnMpIHtcbiAgICAgIGlmIChpcy5mdW5jKHRoaXNbc2V0dGluZ10pKSB7XG4gICAgICAgIHRoaXNbc2V0dGluZ10ob3B0aW9uc1tzZXR0aW5nXSlcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gdGhpc1xuICB9XG5cbiAgLyoqXG4gICAqIFJlbW92ZSB0aGlzIGludGVyYWN0YWJsZSBmcm9tIHRoZSBsaXN0IG9mIGludGVyYWN0YWJsZXMgYW5kIHJlbW92ZSBpdCdzXG4gICAqIGFjdGlvbiBjYXBhYmlsaXRpZXMgYW5kIGV2ZW50IGxpc3RlbmVyc1xuICAgKlxuICAgKiBAcmV0dXJuIHtpbnRlcmFjdH1cbiAgICovXG4gIHVuc2V0ICgpIHtcbiAgICBldmVudHMucmVtb3ZlKHRoaXMudGFyZ2V0IGFzIE5vZGUsICdhbGwnKVxuXG4gICAgaWYgKGlzLnN0cmluZyh0aGlzLnRhcmdldCkpIHtcbiAgICAgIC8vIHJlbW92ZSBkZWxlZ2F0ZWQgZXZlbnRzXG4gICAgICBmb3IgKGNvbnN0IHR5cGUgaW4gZXZlbnRzLmRlbGVnYXRlZEV2ZW50cykge1xuICAgICAgICBjb25zdCBkZWxlZ2F0ZWQgPSBldmVudHMuZGVsZWdhdGVkRXZlbnRzW3R5cGVdXG5cbiAgICAgICAgaWYgKGRlbGVnYXRlZC5zZWxlY3RvcnNbMF0gPT09IHRoaXMudGFyZ2V0ICYmXG4gICAgICAgICAgICBkZWxlZ2F0ZWQuY29udGV4dHNbMF0gPT09IHRoaXMuX2NvbnRleHQpIHtcbiAgICAgICAgICBkZWxlZ2F0ZWQuc2VsZWN0b3JzLnNwbGljZSgwLCAxKVxuICAgICAgICAgIGRlbGVnYXRlZC5jb250ZXh0cy5zcGxpY2UoMCwgMSlcbiAgICAgICAgICBkZWxlZ2F0ZWQubGlzdGVuZXJzLnNwbGljZSgwLCAxKVxuXG4gICAgICAgICAgLy8gcmVtb3ZlIHRoZSBhcnJheXMgaWYgdGhleSBhcmUgZW1wdHlcbiAgICAgICAgICBpZiAoIWRlbGVnYXRlZC5zZWxlY3RvcnMubGVuZ3RoKSB7XG4gICAgICAgICAgICBkZWxlZ2F0ZWRbdHlwZV0gPSBudWxsXG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgZXZlbnRzLnJlbW92ZSh0aGlzLl9jb250ZXh0LCB0eXBlLCBldmVudHMuZGVsZWdhdGVMaXN0ZW5lcilcbiAgICAgICAgZXZlbnRzLnJlbW92ZSh0aGlzLl9jb250ZXh0LCB0eXBlLCBldmVudHMuZGVsZWdhdGVVc2VDYXB0dXJlLCB0cnVlKVxuICAgICAgfVxuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIGV2ZW50cy5yZW1vdmUodGhpcy50YXJnZXQgYXMgTm9kZSwgJ2FsbCcpXG4gICAgfVxuICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IEludGVyYWN0YWJsZVxuIl19