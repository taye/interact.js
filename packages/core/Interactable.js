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
        if (is.array(prev)) {
            this.off(actionName, prev);
        }
        if (is.array(cur)) {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiSW50ZXJhY3RhYmxlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiSW50ZXJhY3RhYmxlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sS0FBSyxHQUFHLE1BQU0sdUJBQXVCLENBQUE7QUFDNUMsT0FBTyxPQUFPLE1BQU0sMkJBQTJCLENBQUE7QUFDL0MsT0FBTyxLQUFLLE1BQU0seUJBQXlCLENBQUE7QUFDM0MsT0FBTyxFQUFFLGNBQWMsRUFBRSxXQUFXLEVBQUUsWUFBWSxFQUFFLFdBQVcsRUFBRSxNQUFNLDRCQUE0QixDQUFBO0FBQ25HLE9BQU8sTUFBTSxNQUFNLDBCQUEwQixDQUFBO0FBQzdDLE9BQU8sTUFBTSxNQUFNLDBCQUEwQixDQUFBO0FBQzdDLE9BQU8sS0FBSyxFQUFFLE1BQU0sc0JBQXNCLENBQUE7QUFDMUMsT0FBTyxrQkFBa0IsTUFBTSxzQ0FBc0MsQ0FBQTtBQUNyRSxPQUFPLEVBQUUsU0FBUyxFQUFFLE1BQU0sMEJBQTBCLENBQUE7QUFFcEQsT0FBTyxTQUFTLE1BQU0sYUFBYSxDQUFBO0FBS25DLE1BQU07QUFDTixNQUFNLE9BQU8sWUFBWTtJQWlCdkIsTUFBTTtJQUNOLFlBQWEsTUFBdUIsRUFBRSxPQUFZLEVBQUUsY0FBa0M7UUFON0UsV0FBTSxHQUFHLElBQUksU0FBUyxFQUFFLENBQUE7UUFPL0IsSUFBSSxDQUFDLFFBQVEsR0FBRyxPQUFPLENBQUMsT0FBTyxDQUFBO1FBQy9CLElBQUksQ0FBQyxNQUFNLEdBQUssTUFBTSxDQUFBO1FBQ3RCLElBQUksQ0FBQyxRQUFRLEdBQUcsT0FBTyxDQUFDLE9BQU8sSUFBSSxjQUFjLENBQUE7UUFDakQsSUFBSSxDQUFDLElBQUksR0FBTyxTQUFTLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQTtRQUN2RSxJQUFJLENBQUMsSUFBSSxHQUFPLElBQUksQ0FB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UyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsS0FBSyxJQUFJLENBQUMsTUFBTTtvQkFDdEMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsS0FBSyxJQUFJLENBQUMsUUFBUSxFQUFFO29CQUMzQyxTQUFTLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUE7b0JBQ2hDLFNBQVMsQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQTtvQkFDL0IsU0FBUyxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFBO29CQUVoQyxzQ0FBc0M7b0JBQ3RDLElBQUksQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLE1BQU0sRUFBRTt3QkFDL0IsU0FBUyxDQUFDLElBQUksQ0FBQyxHQUFHLElBQUksQ0FBQTtxQkFDdkI7aUJBQ0Y7Z0JBRUQsTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLElBQUksRUFBRSxNQUFNLENBQUMsZ0JBQWdCLENBQUMsQ0FBQTtnQkFDM0QsTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLElBQUksRUFBRSxNQUFNLENBQUMsa0JBQWtCLEVBQUUsSUFBSSxDQUFDLENBQUE7YUFDcEU7U0FDRjthQUNJO1lBQ0gsTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsTUFBYyxFQUFFLEtBQUssQ0FBQyxDQUFBO1NBQzFDO0lBQ0gsQ0FBQztDQUNGO0FBRUQsZUFBZSxZQUFZLENBQUEiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBhcnIgZnJvbSAnQGludGVyYWN0anMvdXRpbHMvYXJyJ1xuaW1wb3J0IGJyb3dzZXIgZnJvbSAnQGludGVyYWN0anMvdXRpbHMvYnJvd3NlcidcbmltcG9ydCBjbG9uZSBmcm9tICdAaW50ZXJhY3Rqcy91dGlscy9jbG9uZSdcbmltcG9ydCB7IGdldEVsZW1lbnRSZWN0LCBtYXRjaGVzVXBUbywgbm9kZUNvbnRhaW5zLCB0cnlTZWxlY3RvciB9IGZyb20gJ0BpbnRlcmFjdGpzL3V0aWxzL2RvbVV0aWxzJ1xuaW1wb3J0IGV2ZW50cyBmcm9tICdAaW50ZXJhY3Rqcy91dGlscy9ldmVudHMnXG5pbXBvcnQgZXh0ZW5kIGZyb20gJ0BpbnRlcmFjdGpzL3V0aWxzL2V4dGVuZCdcbmltcG9ydCAqIGFzIGlzIGZyb20gJ0BpbnRlcmFjdGpzL3V0aWxzL2lzJ1xuaW1wb3J0IG5vcm1hbGl6ZUxpc3RlbmVycyBmcm9tICdAaW50ZXJhY3Rqcy91dGlscy9ub3JtYWxpemVMaXN0ZW5lcnMnXG5pbXBvcnQgeyBnZXRXaW5kb3cgfSBmcm9tICdAaW50ZXJhY3Rqcy91dGlscy93aW5kb3cnXG5pbXBvcnQgeyBBY3Rpb25EZWZhdWx0cywgRGVmYXVsdHMsIE9wdGlvbnMgfSBmcm9tICcuL2RlZmF1bHRPcHRpb25zJ1xuaW1wb3J0IEV2ZW50YWJsZSBmcm9tICcuL0V2ZW50YWJsZSdcbmltcG9ydCB7IEFjdGlvbnMgfSBmcm9tICcuL3Njb3BlJ1xuXG50eXBlIElnbm9yZVZhbHVlID0gc3RyaW5nIHwgRWxlbWVudCB8IGJvb2xlYW5cblxuLyoqICovXG5leHBvcnQgY2xhc3MgSW50ZXJhY3RhYmxlIGltcGxlbWVudHMgUGFydGlhbDxFdmVudGFibGU+IHtcbiAgcHJvdGVjdGVkIGdldCBfZGVmYXVsdHMgKCk6IERlZmF1bHRzIHtcbiAgICByZXR1cm4ge1xuICAgICAgYmFzZToge30sXG4gICAgICBwZXJBY3Rpb246IHt9LFxuICAgICAgYWN0aW9uczoge30gYXMgQWN0aW9uRGVmYXVsdHMsXG4gICAgfVxuICB9XG5cbiAgcmVhZG9ubHkgb3B0aW9ucyE6IFJlcXVpcmVkPE9wdGlvbnM+XG4gIHJlYWRvbmx5IF9hY3Rpb25zOiBBY3Rpb25zXG4gIHJlYWRvbmx5IHRhcmdldDogSW50ZXJhY3QuVGFyZ2V0XG4gIHJlYWRvbmx5IGV2ZW50cyA9IG5ldyBFdmVudGFibGUoKVxuICByZWFkb25seSBfY29udGV4dDogRG9jdW1lbnQgfCBFbGVtZW50XG4gIHJlYWRvbmx5IF93aW46IFdpbmRvd1xuICByZWFkb25seSBfZG9jOiBEb2N1bWVudFxuXG4gIC8qKiAqL1xuICBjb25zdHJ1Y3RvciAodGFyZ2V0OiBJbnRlcmFjdC5UYXJnZXQsIG9wdGlvbnM6IGFueSwgZGVmYXVsdENvbnRleHQ6IERvY3VtZW50IHwgRWxlbWVudCkge1xuICAgIHRoaXMuX2FjdGlvbnMgPSBvcHRpb25zLmFjdGlvbnNcbiAgICB0aGlzLnRhcmdldCAgID0gdGFyZ2V0XG4gICAgdGhpcy5fY29udGV4dCA9IG9wdGlvbnMuY29udGV4dCB8fCBkZWZhdWx0Q29udGV4dFxuICAgIHRoaXMuX3dpbiAgICAgPSBnZXRXaW5kb3codHJ5U2VsZWN0b3IodGFyZ2V0KSA/IHRoaXMuX2NvbnRleHQgOiB0YXJnZXQpXG4gICAgdGhpcy5fZG9jICAgICA9IHRoaXMuX3dpbi5kb2N1bWVudFxuXG4gICAgdGhpcy5zZXQob3B0aW9ucylcbiAgfVxuXG4gIHNldE9uRXZlbnRzIChhY3Rpb25OYW1lOiBzdHJpbmcsIHBoYXNlczogTm9uTnVsbGFibGU8YW55Pikge1xuICAgIGlmIChpcy5mdW5jKHBoYXNlcy5vbnN0YXJ0KSkgeyB0aGlzLm9uKGAke2FjdGlvbk5hbWV9c3RhcnRgLCBwaGFzZXMub25zdGFydCkgfVxuICAgIGlmIChpcy5mdW5jKHBoYXNlcy5vbm1vdmUpKSB7IHRoaXMub24oYCR7YWN0aW9uTmFtZX1tb3ZlYCwgcGhhc2VzLm9ubW92ZSkgfVxuICAgIGlmIChpcy5mdW5jKHBoYXNlcy5vbmVuZCkpIHsgdGhpcy5vbihgJHthY3Rpb25OYW1lfWVuZGAsIHBoYXNlcy5vbmVuZCkgfVxuICAgIGlmIChpcy5mdW5jKHBoYXNlcy5vbmluZXJ0aWFzdGFydCkpIHsgdGhpcy5vbihgJHthY3Rpb25OYW1lfWluZXJ0aWFzdGFydGAsIHBoYXNlcy5vbmluZXJ0aWFzdGFydCkgfVxuXG4gICAgcmV0dXJuIHRoaXNcbiAgfVxuXG4gIHVwZGF0ZVBlckFjdGlvbkxpc3RlbmVycyAoYWN0aW9uTmFtZSwgcHJldiwgY3VyKSB7XG4gICAgaWYgKGlzLmFycmF5KHByZXYpKSB7XG4gICAgICB0aGlzLm9mZihhY3Rpb25OYW1lLCBwcmV2KVxuICAgIH1cblxuICAgIGlmIChpcy5hcnJheShjdXIpKSB7XG4gICAgICB0aGlzLm9uKGFjdGlvbk5hbWUsIGN1cilcbiAgICB9XG4gIH1cblxuICBzZXRQZXJBY3Rpb24gKGFjdGlvbk5hbWUsIG9wdGlvbnM6IEludGVyYWN0Lk9yQm9vbGVhbjxPcHRpb25zPikge1xuICAgIGNvbnN0IGRlZmF1bHRzID0gdGhpcy5fZGVmYXVsdHNcblxuICAgIC8vIGZvciBhbGwgdGhlIGRlZmF1bHQgcGVyLWFjdGlvbiBvcHRpb25zXG4gICAgZm9yIChjb25zdCBvcHRpb25OYW1lIGluIG9wdGlvbnMpIHtcbiAgICAgIGNvbnN0IGFjdGlvbk9wdGlvbnMgPSB0aGlzLm9wdGlvbnNbYWN0aW9uTmFtZV1cbiAgICAgIGNvbnN0IG9wdGlvblZhbHVlID0gb3B0aW9uc1tvcHRpb25OYW1lXVxuICAgICAgY29uc3QgaXNBcnJheSA9IGlzLmFycmF5KG9wdGlvblZhbHVlKVxuXG4gICAgICAvLyByZW1vdmUgb2xkIGV2ZW50IGxpc3RlbmVycyBhbmQgYWRkIG5ldyBvbmVzXG4gICAgICBpZiAob3B0aW9uTmFtZSA9PT0gJ2xpc3RlbmVycycpIHtcbiAgICAgICAgdGhpcy51cGRhdGVQZXJBY3Rpb25MaXN0ZW5lcnMoYWN0aW9uTmFtZSwgYWN0aW9uT3B0aW9ucy5saXN0ZW5lcnMsIG9wdGlvblZhbHVlKVxuICAgICAgfVxuXG4gICAgICAvLyBpZiB0aGUgb3B0aW9uIHZhbHVlIGlzIGFuIGFycmF5XG4gICAgICBpZiAoaXNBcnJheSkge1xuICAgICAgICBhY3Rpb25PcHRpb25zW29wdGlvbk5hbWVdID0gYXJyLmZyb20ob3B0aW9uVmFsdWUpXG4gICAgICB9XG4gICAgICAvLyBpZiB0aGUgb3B0aW9uIHZhbHVlIGlzIGFuIG9iamVjdFxuICAgICAgZWxzZSBpZiAoIWlzQXJyYXkgJiYgaXMucGxhaW5PYmplY3Qob3B0aW9uVmFsdWUpKSB7XG4gICAgICAgIC8vIGNvcHkgdGhlIG9iamVjdFxuICAgICAgICBhY3Rpb25PcHRpb25zW29wdGlvbk5hbWVdID0gZXh0ZW5kKFxuICAgICAgICAgIGFjdGlvbk9wdGlvbnNbb3B0aW9uTmFtZV0gfHwge30sXG4gICAgICAgICAgY2xvbmUob3B0aW9uVmFsdWUpKVxuXG4gICAgICAgIC8vIHNldCBhbmFibGVkIGZpZWxkIHRvIHRydWUgaWYgaXQgZXhpc3RzIGluIHRoZSBkZWZhdWx0c1xuICAgICAgICBpZiAoaXMub2JqZWN0KGRlZmF1bHRzLnBlckFjdGlvbltvcHRpb25OYW1lXSkgJiYgJ2VuYWJsZWQnIGluIGRlZmF1bHRzLnBlckFjdGlvbltvcHRpb25OYW1lXSkge1xuICAgICAgICAgIGFjdGlvbk9wdGlvbnNbb3B0aW9uTmFtZV0uZW5hYmxlZCA9IG9wdGlvblZhbHVlLmVuYWJsZWQgIT09IGZhbHNlXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIC8vIGlmIHRoZSBvcHRpb24gdmFsdWUgaXMgYSBib29sZWFuIGFuZCB0aGUgZGVmYXVsdCBpcyBhbiBvYmplY3RcbiAgICAgIGVsc2UgaWYgKGlzLmJvb2wob3B0aW9uVmFsdWUpICYmIGlzLm9iamVjdChkZWZhdWx0cy5wZXJBY3Rpb25bb3B0aW9uTmFtZV0pKSB7XG4gICAgICAgIGFjdGlvbk9wdGlvbnNbb3B0aW9uTmFtZV0uZW5hYmxlZCA9IG9wdGlvblZhbHVlXG4gICAgICB9XG4gICAgICAvLyBpZiBpdCdzIGFueXRoaW5nIGVsc2UsIGRvIGEgcGxhaW4gYXNzaWdubWVudFxuICAgICAgZWxzZSB7XG4gICAgICAgIGFjdGlvbk9wdGlvbnNbb3B0aW9uTmFtZV0gPSBvcHRpb25WYWx1ZVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBUaGUgZGVmYXVsdCBmdW5jdGlvbiB0byBnZXQgYW4gSW50ZXJhY3RhYmxlcyBib3VuZGluZyByZWN0LiBDYW4gYmVcbiAgICogb3ZlcnJpZGRlbiB1c2luZyB7QGxpbmsgSW50ZXJhY3RhYmxlLnJlY3RDaGVja2VyfS5cbiAgICpcbiAgICogQHBhcmFtIHtFbGVtZW50fSBbZWxlbWVudF0gVGhlIGVsZW1lbnQgdG8gbWVhc3VyZS5cbiAgICogQHJldHVybiB7b2JqZWN0fSBUaGUgb2JqZWN0J3MgYm91bmRpbmcgcmVjdGFuZ2xlLlxuICAgKi9cbiAgZ2V0UmVjdCAoZWxlbWVudDogRWxlbWVudCkge1xuICAgIGVsZW1lbnQgPSBlbGVtZW50IHx8IChpcy5lbGVtZW50KHRoaXMudGFyZ2V0KVxuICAgICAgPyB0aGlzLnRhcmdldFxuICAgICAgOiBudWxsKVxuXG4gICAgaWYgKGlzLnN0cmluZyh0aGlzLnRhcmdldCkpIHtcbiAgICAgIGVsZW1lbnQgPSBlbGVtZW50IHx8IHRoaXMuX2NvbnRleHQucXVlcnlTZWxlY3Rvcih0aGlzLnRhcmdldClcbiAgICB9XG5cbiAgICByZXR1cm4gZ2V0RWxlbWVudFJlY3QoZWxlbWVudClcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIG9yIHNldHMgdGhlIGZ1bmN0aW9uIHVzZWQgdG8gY2FsY3VsYXRlIHRoZSBpbnRlcmFjdGFibGUnc1xuICAgKiBlbGVtZW50J3MgcmVjdGFuZ2xlXG4gICAqXG4gICAqIEBwYXJhbSB7ZnVuY3Rpb259IFtjaGVja2VyXSBBIGZ1bmN0aW9uIHdoaWNoIHJldHVybnMgdGhpcyBJbnRlcmFjdGFibGUnc1xuICAgKiBib3VuZGluZyByZWN0YW5nbGUuIFNlZSB7QGxpbmsgSW50ZXJhY3RhYmxlLmdldFJlY3R9XG4gICAqIEByZXR1cm4ge2Z1bmN0aW9uIHwgb2JqZWN0fSBUaGUgY2hlY2tlciBmdW5jdGlvbiBvciB0aGlzIEludGVyYWN0YWJsZVxuICAgKi9cbiAgcmVjdENoZWNrZXIgKGNoZWNrZXI6IChlbGVtZW50OiBFbGVtZW50KSA9PiBhbnkpIHtcbiAgICBpZiAoaXMuZnVuYyhjaGVja2VyKSkge1xuICAgICAgdGhpcy5nZXRSZWN0ID0gY2hlY2tlclxuXG4gICAgICByZXR1cm4gdGhpc1xuICAgIH1cblxuICAgIGlmIChjaGVja2VyID09PSBudWxsKSB7XG4gICAgICBkZWxldGUgdGhpcy5nZXRSZWN0XG5cbiAgICAgIHJldHVybiB0aGlzXG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXMuZ2V0UmVjdFxuICB9XG5cbiAgX2JhY2tDb21wYXRPcHRpb24gKG9wdGlvbk5hbWUsIG5ld1ZhbHVlKSB7XG4gICAgaWYgKHRyeVNlbGVjdG9yKG5ld1ZhbHVlKSB8fCBpcy5vYmplY3QobmV3VmFsdWUpKSB7XG4gICAgICB0aGlzLm9wdGlvbnNbb3B0aW9uTmFtZV0gPSBuZXdWYWx1ZVxuXG4gICAgICBmb3IgKGNvbnN0IGFjdGlvbiBvZiB0aGlzLl9hY3Rpb25zLm5hbWVzKSB7XG4gICAgICAgIHRoaXMub3B0aW9uc1thY3Rpb25dW29wdGlvbk5hbWVdID0gbmV3VmFsdWVcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHRoaXNcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy5vcHRpb25zW29wdGlvbk5hbWVdXG4gIH1cblxuICAvKipcbiAgICogR2V0cyBvciBzZXRzIHRoZSBvcmlnaW4gb2YgdGhlIEludGVyYWN0YWJsZSdzIGVsZW1lbnQuICBUaGUgeCBhbmQgeVxuICAgKiBvZiB0aGUgb3JpZ2luIHdpbGwgYmUgc3VidHJhY3RlZCBmcm9tIGFjdGlvbiBldmVudCBjb29yZGluYXRlcy5cbiAgICpcbiAgICogQHBhcmFtIHtFbGVtZW50IHwgb2JqZWN0IHwgc3RyaW5nfSBbb3JpZ2luXSBBbiBIVE1MIG9yIFNWRyBFbGVtZW50IHdob3NlXG4gICAqIHJlY3Qgd2lsbCBiZSB1c2VkLCBhbiBvYmplY3QgZWcuIHsgeDogMCwgeTogMCB9IG9yIHN0cmluZyAncGFyZW50JywgJ3NlbGYnXG4gICAqIG9yIGFueSBDU1Mgc2VsZWN0b3JcbiAgICpcbiAgICogQHJldHVybiB7b2JqZWN0fSBUaGUgY3VycmVudCBvcmlnaW4gb3IgdGhpcyBJbnRlcmFjdGFibGVcbiAgICovXG4gIG9yaWdpbiAobmV3VmFsdWUpIHtcbiAgICByZXR1cm4gdGhpcy5fYmFja0NvbXBhdE9wdGlvbignb3JpZ2luJywgbmV3VmFsdWUpXG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyBvciBzZXRzIHRoZSBtb3VzZSBjb29yZGluYXRlIHR5cGVzIHVzZWQgdG8gY2FsY3VsYXRlIHRoZVxuICAgKiBtb3ZlbWVudCBvZiB0aGUgcG9pbnRlci5cbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IFtuZXdWYWx1ZV0gVXNlICdjbGllbnQnIGlmIHlvdSB3aWxsIGJlIHNjcm9sbGluZyB3aGlsZVxuICAgKiBpbnRlcmFjdGluZzsgVXNlICdwYWdlJyBpZiB5b3Ugd2FudCBhdXRvU2Nyb2xsIHRvIHdvcmtcbiAgICogQHJldHVybiB7c3RyaW5nIHwgb2JqZWN0fSBUaGUgY3VycmVudCBkZWx0YVNvdXJjZSBvciB0aGlzIEludGVyYWN0YWJsZVxuICAgKi9cbiAgZGVsdGFTb3VyY2UgKG5ld1ZhbHVlKSB7XG4gICAgaWYgKG5ld1ZhbHVlID09PSAncGFnZScgfHwgbmV3VmFsdWUgPT09ICdjbGllbnQnKSB7XG4gICAgICB0aGlzLm9wdGlvbnMuZGVsdGFTb3VyY2UgPSBuZXdWYWx1ZVxuXG4gICAgICByZXR1cm4gdGhpc1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzLm9wdGlvbnMuZGVsdGFTb3VyY2VcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBzZWxlY3RvciBjb250ZXh0IE5vZGUgb2YgdGhlIEludGVyYWN0YWJsZS4gVGhlIGRlZmF1bHQgaXNcbiAgICogYHdpbmRvdy5kb2N1bWVudGAuXG4gICAqXG4gICAqIEByZXR1cm4ge05vZGV9IFRoZSBjb250ZXh0IE5vZGUgb2YgdGhpcyBJbnRlcmFjdGFibGVcbiAgICovXG4gIGNvbnRleHQgKCkge1xuICAgIHJldHVybiB0aGlzLl9jb250ZXh0XG4gIH1cblxuICBpbkNvbnRleHQgKGVsZW1lbnQpIHtcbiAgICByZXR1cm4gKHRoaXMuX2NvbnRleHQgPT09IGVsZW1lbnQub3duZXJEb2N1bWVudCB8fFxuICAgICAgICAgICAgbm9kZUNvbnRhaW5zKHRoaXMuX2NvbnRleHQsIGVsZW1lbnQpKVxuICB9XG5cbiAgdGVzdElnbm9yZUFsbG93ICh0aGlzOiBJbnRlcmFjdGFibGUsIG9wdGlvbnM6IHsgaWdub3JlRnJvbTogSWdub3JlVmFsdWUsIGFsbG93RnJvbTogSWdub3JlVmFsdWUgfSwgaW50ZXJhY3RhYmxlRWxlbWVudDogRWxlbWVudCwgZXZlbnRUYXJnZXQ6IEVsZW1lbnQpIHtcbiAgICByZXR1cm4gKCF0aGlzLnRlc3RJZ25vcmUob3B0aW9ucy5pZ25vcmVGcm9tLCBpbnRlcmFjdGFibGVFbGVtZW50LCBldmVudFRhcmdldCkgJiZcbiAgICAgICAgICAgIHRoaXMudGVzdEFsbG93KG9wdGlvbnMuYWxsb3dGcm9tLCBpbnRlcmFjdGFibGVFbGVtZW50LCBldmVudFRhcmdldCkpXG4gIH1cblxuICB0ZXN0QWxsb3cgKHRoaXM6IEludGVyYWN0YWJsZSwgYWxsb3dGcm9tOiBJZ25vcmVWYWx1ZSwgaW50ZXJhY3RhYmxlRWxlbWVudDogRWxlbWVudCwgZWxlbWVudDogRWxlbWVudCkge1xuICAgIGlmICghYWxsb3dGcm9tKSB7IHJldHVybiB0cnVlIH1cblxuICAgIGlmICghaXMuZWxlbWVudChlbGVtZW50KSkgeyByZXR1cm4gZmFsc2UgfVxuXG4gICAgaWYgKGlzLnN0cmluZyhhbGxvd0Zyb20pKSB7XG4gICAgICByZXR1cm4gbWF0Y2hlc1VwVG8oZWxlbWVudCwgYWxsb3dGcm9tLCBpbnRlcmFjdGFibGVFbGVtZW50KVxuICAgIH1cbiAgICBlbHNlIGlmIChpcy5lbGVtZW50KGFsbG93RnJvbSkpIHtcbiAgICAgIHJldHVybiBub2RlQ29udGFpbnMoYWxsb3dGcm9tLCBlbGVtZW50KVxuICAgIH1cblxuICAgIHJldHVybiBmYWxzZVxuICB9XG5cbiAgdGVzdElnbm9yZSAodGhpczogSW50ZXJhY3RhYmxlLCBpZ25vcmVGcm9tOiBJZ25vcmVWYWx1ZSwgaW50ZXJhY3RhYmxlRWxlbWVudDogRWxlbWVudCwgZWxlbWVudDogRWxlbWVudCkge1xuICAgIGlmICghaWdub3JlRnJvbSB8fCAhaXMuZWxlbWVudChlbGVtZW50KSkgeyByZXR1cm4gZmFsc2UgfVxuXG4gICAgaWYgKGlzLnN0cmluZyhpZ25vcmVGcm9tKSkge1xuICAgICAgcmV0dXJuIG1hdGNoZXNVcFRvKGVsZW1lbnQsIGlnbm9yZUZyb20sIGludGVyYWN0YWJsZUVsZW1lbnQpXG4gICAgfVxuICAgIGVsc2UgaWYgKGlzLmVsZW1lbnQoaWdub3JlRnJvbSkpIHtcbiAgICAgIHJldHVybiBub2RlQ29udGFpbnMoaWdub3JlRnJvbSwgZWxlbWVudClcbiAgICB9XG5cbiAgICByZXR1cm4gZmFsc2VcbiAgfVxuXG4gIC8qKlxuICAgKiBDYWxscyBsaXN0ZW5lcnMgZm9yIHRoZSBnaXZlbiBJbnRlcmFjdEV2ZW50IHR5cGUgYm91bmQgZ2xvYmFsbHlcbiAgICogYW5kIGRpcmVjdGx5IHRvIHRoaXMgSW50ZXJhY3RhYmxlXG4gICAqXG4gICAqIEBwYXJhbSB7SW50ZXJhY3RFdmVudH0gaUV2ZW50IFRoZSBJbnRlcmFjdEV2ZW50IG9iamVjdCB0byBiZSBmaXJlZCBvbiB0aGlzXG4gICAqIEludGVyYWN0YWJsZVxuICAgKiBAcmV0dXJuIHtJbnRlcmFjdGFibGV9IHRoaXMgSW50ZXJhY3RhYmxlXG4gICAqL1xuICBmaXJlIChpRXZlbnQpIHtcbiAgICB0aGlzLmV2ZW50cy5maXJlKGlFdmVudClcblxuICAgIHJldHVybiB0aGlzXG4gIH1cblxuICBfb25PZmYgKG1ldGhvZDogJ29uJyB8ICdvZmYnLCB0eXBlQXJnOiBJbnRlcmFjdC5FdmVudFR5cGVzLCBsaXN0ZW5lckFyZz86IEludGVyYWN0Lkxpc3RlbmVyc0FyZyB8IG51bGwsIG9wdGlvbnM/OiBhbnkpIHtcbiAgICBpZiAoaXMub2JqZWN0KHR5cGVBcmcpICYmICFpcy5hcnJheSh0eXBlQXJnKSkge1xuICAgICAgb3B0aW9ucyA9IGxpc3RlbmVyQXJnXG4gICAgICBsaXN0ZW5lckFyZyA9IG51bGxcbiAgICB9XG5cbiAgICBjb25zdCBhZGRSZW1vdmUgPSBtZXRob2QgPT09ICdvbicgPyAnYWRkJyA6ICdyZW1vdmUnXG4gICAgY29uc3QgbGlzdGVuZXJzID0gbm9ybWFsaXplTGlzdGVuZXJzKHR5cGVBcmcsIGxpc3RlbmVyQXJnKVxuXG4gICAgZm9yIChsZXQgdHlwZSBpbiBsaXN0ZW5lcnMpIHtcbiAgICAgIGlmICh0eXBlID09PSAnd2hlZWwnKSB7IHR5cGUgPSBicm93c2VyLndoZWVsRXZlbnQgfVxuXG4gICAgICBmb3IgKGNvbnN0IGxpc3RlbmVyIG9mIGxpc3RlbmVyc1t0eXBlXSkge1xuICAgICAgICAvLyBpZiBpdCBpcyBhbiBhY3Rpb24gZXZlbnQgdHlwZVxuICAgICAgICBpZiAoYXJyLmNvbnRhaW5zKHRoaXMuX2FjdGlvbnMuZXZlbnRUeXBlcywgdHlwZSkpIHtcbiAgICAgICAgICB0aGlzLmV2ZW50c1ttZXRob2RdKHR5cGUsIGxpc3RlbmVyKVxuICAgICAgICB9XG4gICAgICAgIC8vIGRlbGVnYXRlZCBldmVudFxuICAgICAgICBlbHNlIGlmIChpcy5zdHJpbmcodGhpcy50YXJnZXQpKSB7XG4gICAgICAgICAgZXZlbnRzW2Ake2FkZFJlbW92ZX1EZWxlZ2F0ZWBdKHRoaXMudGFyZ2V0LCB0aGlzLl9jb250ZXh0LCB0eXBlLCBsaXN0ZW5lciwgb3B0aW9ucylcbiAgICAgICAgfVxuICAgICAgICAvLyByZW1vdmUgbGlzdGVuZXIgZnJvbSB0aGlzIEludGVyYXRhYmxlJ3MgZWxlbWVudFxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAoZXZlbnRzW2FkZFJlbW92ZV0gYXMgdHlwZW9mIGV2ZW50cy5yZW1vdmUpKHRoaXMudGFyZ2V0LCB0eXBlLCBsaXN0ZW5lciwgb3B0aW9ucylcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiB0aGlzXG4gIH1cblxuICAvKipcbiAgICogQmluZHMgYSBsaXN0ZW5lciBmb3IgYW4gSW50ZXJhY3RFdmVudCwgcG9pbnRlckV2ZW50IG9yIERPTSBldmVudC5cbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmcgfCBhcnJheSB8IG9iamVjdH0gdHlwZXMgVGhlIHR5cGVzIG9mIGV2ZW50cyB0byBsaXN0ZW5cbiAgICogZm9yXG4gICAqIEBwYXJhbSB7ZnVuY3Rpb24gfCBhcnJheSB8IG9iamVjdH0gW2xpc3RlbmVyXSBUaGUgZXZlbnQgbGlzdGVuZXIgZnVuY3Rpb24ocylcbiAgICogQHBhcmFtIHtvYmplY3QgfCBib29sZWFufSBbb3B0aW9uc10gb3B0aW9ucyBvYmplY3Qgb3IgdXNlQ2FwdHVyZSBmbGFnIGZvclxuICAgKiBhZGRFdmVudExpc3RlbmVyXG4gICAqIEByZXR1cm4ge0ludGVyYWN0YWJsZX0gVGhpcyBJbnRlcmFjdGFibGVcbiAgICovXG4gIG9uICh0eXBlczogSW50ZXJhY3QuRXZlbnRUeXBlcywgbGlzdGVuZXI/OiBJbnRlcmFjdC5MaXN0ZW5lcnNBcmcsIG9wdGlvbnM/OiBhbnkpIHtcbiAgICByZXR1cm4gdGhpcy5fb25PZmYoJ29uJywgdHlwZXMsIGxpc3RlbmVyLCBvcHRpb25zKVxuICB9XG5cbiAgLyoqXG4gICAqIFJlbW92ZXMgYW4gSW50ZXJhY3RFdmVudCwgcG9pbnRlckV2ZW50IG9yIERPTSBldmVudCBsaXN0ZW5lci5cbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmcgfCBhcnJheSB8IG9iamVjdH0gdHlwZXMgVGhlIHR5cGVzIG9mIGV2ZW50cyB0aGF0IHdlcmVcbiAgICogbGlzdGVuZWQgZm9yXG4gICAqIEBwYXJhbSB7ZnVuY3Rpb24gfCBhcnJheSB8IG9iamVjdH0gW2xpc3RlbmVyXSBUaGUgZXZlbnQgbGlzdGVuZXIgZnVuY3Rpb24ocylcbiAgICogQHBhcmFtIHtvYmplY3QgfCBib29sZWFufSBbb3B0aW9uc10gb3B0aW9ucyBvYmplY3Qgb3IgdXNlQ2FwdHVyZSBmbGFnIGZvclxuICAgKiByZW1vdmVFdmVudExpc3RlbmVyXG4gICAqIEByZXR1cm4ge0ludGVyYWN0YWJsZX0gVGhpcyBJbnRlcmFjdGFibGVcbiAgICovXG4gIG9mZiAodHlwZXM6IHN0cmluZyB8IHN0cmluZ1tdIHwgSW50ZXJhY3QuRXZlbnRUeXBlcywgbGlzdGVuZXI/OiBJbnRlcmFjdC5MaXN0ZW5lcnNBcmcsIG9wdGlvbnM/OiBhbnkpIHtcbiAgICByZXR1cm4gdGhpcy5fb25PZmYoJ29mZicsIHR5cGVzLCBsaXN0ZW5lciwgb3B0aW9ucylcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXNldCB0aGUgb3B0aW9ucyBvZiB0aGlzIEludGVyYWN0YWJsZVxuICAgKlxuICAgKiBAcGFyYW0ge29iamVjdH0gb3B0aW9ucyBUaGUgbmV3IHNldHRpbmdzIHRvIGFwcGx5XG4gICAqIEByZXR1cm4ge29iamVjdH0gVGhpcyBJbnRlcmFjdGFibGVcbiAgICovXG4gIHNldCAob3B0aW9uczogSW50ZXJhY3QuT3B0aW9uc0FyZykge1xuICAgIGNvbnN0IGRlZmF1bHRzID0gdGhpcy5fZGVmYXVsdHNcblxuICAgIGlmICghaXMub2JqZWN0KG9wdGlvbnMpKSB7XG4gICAgICBvcHRpb25zID0ge31cbiAgICB9XG5cbiAgICAodGhpcy5vcHRpb25zIGFzIFJlcXVpcmVkPE9wdGlvbnM+KSA9IGNsb25lKGRlZmF1bHRzLmJhc2UpIGFzIFJlcXVpcmVkPE9wdGlvbnM+XG5cbiAgICBmb3IgKGNvbnN0IGFjdGlvbk5hbWUgaW4gdGhpcy5fYWN0aW9ucy5tZXRob2REaWN0KSB7XG4gICAgICBjb25zdCBtZXRob2ROYW1lID0gdGhpcy5fYWN0aW9ucy5tZXRob2REaWN0W2FjdGlvbk5hbWVdXG5cbiAgICAgIHRoaXMub3B0aW9uc1thY3Rpb25OYW1lXSA9IHt9XG4gICAgICB0aGlzLnNldFBlckFjdGlvbihhY3Rpb25OYW1lLCBleHRlbmQoZXh0ZW5kKHt9LCBkZWZhdWx0cy5wZXJBY3Rpb24pLCBkZWZhdWx0cy5hY3Rpb25zW2FjdGlvbk5hbWVdKSlcblxuICAgICAgdGhpc1ttZXRob2ROYW1lXShvcHRpb25zW2FjdGlvbk5hbWVdKVxuICAgIH1cblxuICAgIGZvciAoY29uc3Qgc2V0dGluZyBpbiBvcHRpb25zKSB7XG4gICAgICBpZiAoaXMuZnVuYyh0aGlzW3NldHRpbmddKSkge1xuICAgICAgICB0aGlzW3NldHRpbmddKG9wdGlvbnNbc2V0dGluZ10pXG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXNcbiAgfVxuXG4gIC8qKlxuICAgKiBSZW1vdmUgdGhpcyBpbnRlcmFjdGFibGUgZnJvbSB0aGUgbGlzdCBvZiBpbnRlcmFjdGFibGVzIGFuZCByZW1vdmUgaXQnc1xuICAgKiBhY3Rpb24gY2FwYWJpbGl0aWVzIGFuZCBldmVudCBsaXN0ZW5lcnNcbiAgICpcbiAgICogQHJldHVybiB7aW50ZXJhY3R9XG4gICAqL1xuICB1bnNldCAoKSB7XG4gICAgZXZlbnRzLnJlbW92ZSh0aGlzLnRhcmdldCBhcyBOb2RlLCAnYWxsJylcblxuICAgIGlmIChpcy5zdHJpbmcodGhpcy50YXJnZXQpKSB7XG4gICAgICAvLyByZW1vdmUgZGVsZWdhdGVkIGV2ZW50c1xuICAgICAgZm9yIChjb25zdCB0eXBlIGluIGV2ZW50cy5kZWxlZ2F0ZWRFdmVudHMpIHtcbiAgICAgICAgY29uc3QgZGVsZWdhdGVkID0gZXZlbnRzLmRlbGVnYXRlZEV2ZW50c1t0eXBlXVxuXG4gICAgICAgIGlmIChkZWxlZ2F0ZWQuc2VsZWN0b3JzWzBdID09PSB0aGlzLnRhcmdldCAmJlxuICAgICAgICAgICAgZGVsZWdhdGVkLmNvbnRleHRzWzBdID09PSB0aGlzLl9jb250ZXh0KSB7XG4gICAgICAgICAgZGVsZWdhdGVkLnNlbGVjdG9ycy5zcGxpY2UoMCwgMSlcbiAgICAgICAgICBkZWxlZ2F0ZWQuY29udGV4dHMuc3BsaWNlKDAsIDEpXG4gICAgICAgICAgZGVsZWdhdGVkLmxpc3RlbmVycy5zcGxpY2UoMCwgMSlcblxuICAgICAgICAgIC8vIHJlbW92ZSB0aGUgYXJyYXlzIGlmIHRoZXkgYXJlIGVtcHR5XG4gICAgICAgICAgaWYgKCFkZWxlZ2F0ZWQuc2VsZWN0b3JzLmxlbmd0aCkge1xuICAgICAgICAgICAgZGVsZWdhdGVkW3R5cGVdID0gbnVsbFxuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGV2ZW50cy5yZW1vdmUodGhpcy5fY29udGV4dCwgdHlwZSwgZXZlbnRzLmRlbGVnYXRlTGlzdGVuZXIpXG4gICAgICAgIGV2ZW50cy5yZW1vdmUodGhpcy5fY29udGV4dCwgdHlwZSwgZXZlbnRzLmRlbGVnYXRlVXNlQ2FwdHVyZSwgdHJ1ZSlcbiAgICAgIH1cbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICBldmVudHMucmVtb3ZlKHRoaXMudGFyZ2V0IGFzIE5vZGUsICdhbGwnKVxuICAgIH1cbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBJbnRlcmFjdGFibGVcbiJdfQ==