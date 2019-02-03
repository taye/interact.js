import * as arr from '@interactjs/utils/arr';
import browser from '@interactjs/utils/browser';
import clone from '@interactjs/utils/clone';
import { getElementRect, nodeContains, trySelector } from '@interactjs/utils/domUtils';
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
            delete this.options.getRect;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiSW50ZXJhY3RhYmxlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiSW50ZXJhY3RhYmxlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sS0FBSyxHQUFHLE1BQU0sdUJBQXVCLENBQUE7QUFDNUMsT0FBTyxPQUFPLE1BQU0sMkJBQTJCLENBQUE7QUFDL0MsT0FBTyxLQUFLLE1BQU0seUJBQXlCLENBQUE7QUFDM0MsT0FBTyxFQUFFLGNBQWMsRUFBRSxZQUFZLEVBQUUsV0FBVyxFQUFFLE1BQU0sNEJBQTRCLENBQUE7QUFDdEYsT0FBTyxNQUFNLE1BQU0sMEJBQTBCLENBQUE7QUFDN0MsT0FBTyxNQUFNLE1BQU0sMEJBQTBCLENBQUE7QUFDN0MsT0FBTyxLQUFLLEVBQUUsTUFBTSxzQkFBc0IsQ0FBQTtBQUMxQyxPQUFPLGtCQUFrQixNQUFNLHNDQUFzQyxDQUFBO0FBQ3JFLE9BQU8sRUFBRSxTQUFTLEVBQUUsTUFBTSwwQkFBMEIsQ0FBQTtBQUVwRCxPQUFPLFNBQVMsTUFBTSxhQUFhLENBQUE7QUFHbkMsTUFBTTtBQUNOLE1BQU0sT0FBTyxZQUFZO0lBaUJ2QixNQUFNO0lBQ04sWUFBYSxNQUF1QixFQUFFLE9BQVksRUFBRSxjQUE4QjtRQU56RSxXQUFNLEdBQUcsSUFBSSxTQUFTLEVBQUUsQ0FBQTtRQU8vQixJQUFJLENBQUMsUUFBUSxHQUFHLE9BQU8sQ0FBQyxPQUFPLENBQUE7UUFDL0IsSUFBSSxDQUFDLE1BQU0sR0FBSyxNQUFNLENBQUE7UUFDdEIsSUFBSSxDQUFDLFFBQVEsR0FBRyxPQUFPLENBQUMsT0FBTyxJQUFJLGNBQWMsQ0FBQTtRQUNqRCxJQUFJLENBQUMsSUFBSSxHQUFPLFNBQVMsQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFBO1FBQ3ZFLElBQUksQ0FBQyxJQUFJLEdBQU8sSUFBSSxDQUFDLElBQUksQ0FB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QVEsRUFBRTtvQkFDM0MsU0FBUyxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFBO29CQUNoQyxTQUFTLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUE7b0JBQy9CLFNBQVMsQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQTtvQkFFaEMsc0NBQXNDO29CQUN0QyxJQUFJLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxNQUFNLEVBQUU7d0JBQy9CLFNBQVMsQ0FBQyxJQUFJLENBQUMsR0FBRyxJQUFJLENBQUE7cUJBQ3ZCO2lCQUNGO2dCQUVELE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxJQUFJLEVBQUUsTUFBTSxDQUFDLGdCQUFnQixDQUFDLENBQUE7Z0JBQzNELE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxJQUFJLEVBQUUsTUFBTSxDQUFDLGtCQUFrQixFQUFFLElBQUksQ0FBQyxDQUFBO2FBQ3BFO1NBQ0Y7YUFDSTtZQUNILE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLE1BQWMsRUFBRSxLQUFLLENBQUMsQ0FBQTtTQUMxQztJQUNILENBQUM7Q0FDRjtBQUVELGVBQWUsWUFBWSxDQUFBIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgYXJyIGZyb20gJ0BpbnRlcmFjdGpzL3V0aWxzL2FycidcbmltcG9ydCBicm93c2VyIGZyb20gJ0BpbnRlcmFjdGpzL3V0aWxzL2Jyb3dzZXInXG5pbXBvcnQgY2xvbmUgZnJvbSAnQGludGVyYWN0anMvdXRpbHMvY2xvbmUnXG5pbXBvcnQgeyBnZXRFbGVtZW50UmVjdCwgbm9kZUNvbnRhaW5zLCB0cnlTZWxlY3RvciB9IGZyb20gJ0BpbnRlcmFjdGpzL3V0aWxzL2RvbVV0aWxzJ1xuaW1wb3J0IGV2ZW50cyBmcm9tICdAaW50ZXJhY3Rqcy91dGlscy9ldmVudHMnXG5pbXBvcnQgZXh0ZW5kIGZyb20gJ0BpbnRlcmFjdGpzL3V0aWxzL2V4dGVuZCdcbmltcG9ydCAqIGFzIGlzIGZyb20gJ0BpbnRlcmFjdGpzL3V0aWxzL2lzJ1xuaW1wb3J0IG5vcm1hbGl6ZUxpc3RlbmVycyBmcm9tICdAaW50ZXJhY3Rqcy91dGlscy9ub3JtYWxpemVMaXN0ZW5lcnMnXG5pbXBvcnQgeyBnZXRXaW5kb3cgfSBmcm9tICdAaW50ZXJhY3Rqcy91dGlscy93aW5kb3cnXG5pbXBvcnQgeyBEZWZhdWx0cywgT3B0aW9ucyB9IGZyb20gJy4vZGVmYXVsdE9wdGlvbnMnXG5pbXBvcnQgRXZlbnRhYmxlIGZyb20gJy4vRXZlbnRhYmxlJ1xuaW1wb3J0IHsgQWN0aW9ucyB9IGZyb20gJy4vc2NvcGUnXG5cbi8qKiAqL1xuZXhwb3J0IGNsYXNzIEludGVyYWN0YWJsZSBpbXBsZW1lbnRzIFBhcnRpYWw8RXZlbnRhYmxlPiB7XG4gIHByb3RlY3RlZCBnZXQgX2RlZmF1bHRzICgpOiBEZWZhdWx0cyB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGJhc2U6IHt9LFxuICAgICAgcGVyQWN0aW9uOiB7fSxcbiAgICAgIGFjdGlvbnM6IHt9LFxuICAgIH1cbiAgfVxuXG4gIG9wdGlvbnMhOiBSZXF1aXJlZDxPcHRpb25zPlxuICByZWFkb25seSBfYWN0aW9uczogQWN0aW9uc1xuICByZWFkb25seSB0YXJnZXQ6IEludGVyYWN0LlRhcmdldFxuICByZWFkb25seSBldmVudHMgPSBuZXcgRXZlbnRhYmxlKClcbiAgcmVhZG9ubHkgX2NvbnRleHQ6IEVsZW1lbnRcbiAgcmVhZG9ubHkgX3dpbjogV2luZG93XG4gIHJlYWRvbmx5IF9kb2M6IERvY3VtZW50XG5cbiAgLyoqICovXG4gIGNvbnN0cnVjdG9yICh0YXJnZXQ6IEludGVyYWN0LlRhcmdldCwgb3B0aW9uczogYW55LCBkZWZhdWx0Q29udGV4dDogRWxlbWVudCB8IE5vZGUpIHtcbiAgICB0aGlzLl9hY3Rpb25zID0gb3B0aW9ucy5hY3Rpb25zXG4gICAgdGhpcy50YXJnZXQgICA9IHRhcmdldFxuICAgIHRoaXMuX2NvbnRleHQgPSBvcHRpb25zLmNvbnRleHQgfHwgZGVmYXVsdENvbnRleHRcbiAgICB0aGlzLl93aW4gICAgID0gZ2V0V2luZG93KHRyeVNlbGVjdG9yKHRhcmdldCkgPyB0aGlzLl9jb250ZXh0IDogdGFyZ2V0KVxuICAgIHRoaXMuX2RvYyAgICAgPSB0aGlzLl93aW4uZG9jdW1lbnRcblxuICAgIHRoaXMuc2V0KG9wdGlvbnMpXG4gIH1cblxuICBzZXRPbkV2ZW50cyAoYWN0aW9uTmFtZTogc3RyaW5nLCBwaGFzZXM6IHsgW3BoYXNlOiBzdHJpbmddOiBJbnRlcmFjdC5MaXN0ZW5lcnNBcmcgfSkge1xuICAgIGlmIChpcy5mdW5jKHBoYXNlcy5vbnN0YXJ0KSkgeyB0aGlzLm9uKGAke2FjdGlvbk5hbWV9c3RhcnRgLCBwaGFzZXMub25zdGFydCkgfVxuICAgIGlmIChpcy5mdW5jKHBoYXNlcy5vbm1vdmUpKSB7IHRoaXMub24oYCR7YWN0aW9uTmFtZX1tb3ZlYCwgcGhhc2VzLm9ubW92ZSkgfVxuICAgIGlmIChpcy5mdW5jKHBoYXNlcy5vbmVuZCkpIHsgdGhpcy5vbihgJHthY3Rpb25OYW1lfWVuZGAsIHBoYXNlcy5vbmVuZCkgfVxuICAgIGlmIChpcy5mdW5jKHBoYXNlcy5vbmluZXJ0aWFzdGFydCkpIHsgdGhpcy5vbihgJHthY3Rpb25OYW1lfWluZXJ0aWFzdGFydGAsIHBoYXNlcy5vbmluZXJ0aWFzdGFydCkgfVxuXG4gICAgcmV0dXJuIHRoaXNcbiAgfVxuXG4gIHVwZGF0ZVBlckFjdGlvbkxpc3RlbmVycyAoYWN0aW9uTmFtZSwgcHJldiwgY3VyKSB7XG4gICAgaWYgKGlzLmFycmF5KHByZXYpKSB7XG4gICAgICB0aGlzLm9mZihhY3Rpb25OYW1lLCBwcmV2KVxuICAgIH1cblxuICAgIGlmIChpcy5hcnJheShjdXIpKSB7XG4gICAgICB0aGlzLm9uKGFjdGlvbk5hbWUsIGN1cilcbiAgICB9XG4gIH1cblxuICBzZXRQZXJBY3Rpb24gKGFjdGlvbk5hbWUsIG9wdGlvbnM6IEludGVyYWN0Lk9yQm9vbGVhbjxPcHRpb25zPikge1xuICAgIGNvbnN0IGRlZmF1bHRzID0gdGhpcy5fZGVmYXVsdHNcblxuICAgIC8vIGZvciBhbGwgdGhlIGRlZmF1bHQgcGVyLWFjdGlvbiBvcHRpb25zXG4gICAgZm9yIChjb25zdCBvcHRpb25OYW1lIGluIG9wdGlvbnMpIHtcbiAgICAgIGNvbnN0IGFjdGlvbk9wdGlvbnMgPSB0aGlzLm9wdGlvbnNbYWN0aW9uTmFtZV1cbiAgICAgIGNvbnN0IG9wdGlvblZhbHVlID0gb3B0aW9uc1tvcHRpb25OYW1lXVxuICAgICAgY29uc3QgaXNBcnJheSA9IGlzLmFycmF5KG9wdGlvblZhbHVlKVxuXG4gICAgICAvLyByZW1vdmUgb2xkIGV2ZW50IGxpc3RlbmVycyBhbmQgYWRkIG5ldyBvbmVzXG4gICAgICBpZiAob3B0aW9uTmFtZSA9PT0gJ2xpc3RlbmVycycpIHtcbiAgICAgICAgdGhpcy51cGRhdGVQZXJBY3Rpb25MaXN0ZW5lcnMoYWN0aW9uTmFtZSwgYWN0aW9uT3B0aW9ucy5saXN0ZW5lcnMsIG9wdGlvblZhbHVlKVxuICAgICAgfVxuXG4gICAgICAvLyBpZiB0aGUgb3B0aW9uIHZhbHVlIGlzIGFuIGFycmF5XG4gICAgICBpZiAoaXNBcnJheSkge1xuICAgICAgICBhY3Rpb25PcHRpb25zW29wdGlvbk5hbWVdID0gYXJyLmZyb20ob3B0aW9uVmFsdWUpXG4gICAgICB9XG4gICAgICAvLyBpZiB0aGUgb3B0aW9uIHZhbHVlIGlzIGFuIG9iamVjdFxuICAgICAgZWxzZSBpZiAoIWlzQXJyYXkgJiYgaXMucGxhaW5PYmplY3Qob3B0aW9uVmFsdWUpKSB7XG4gICAgICAgIC8vIGNvcHkgdGhlIG9iamVjdFxuICAgICAgICBhY3Rpb25PcHRpb25zW29wdGlvbk5hbWVdID0gZXh0ZW5kKFxuICAgICAgICAgIGFjdGlvbk9wdGlvbnNbb3B0aW9uTmFtZV0gfHwge30sXG4gICAgICAgICAgY2xvbmUob3B0aW9uVmFsdWUpKVxuXG4gICAgICAgIC8vIHNldCBhbmFibGVkIGZpZWxkIHRvIHRydWUgaWYgaXQgZXhpc3RzIGluIHRoZSBkZWZhdWx0c1xuICAgICAgICBpZiAoaXMub2JqZWN0KGRlZmF1bHRzLnBlckFjdGlvbltvcHRpb25OYW1lXSkgJiYgJ2VuYWJsZWQnIGluIGRlZmF1bHRzLnBlckFjdGlvbltvcHRpb25OYW1lXSkge1xuICAgICAgICAgIGFjdGlvbk9wdGlvbnNbb3B0aW9uTmFtZV0uZW5hYmxlZCA9IG9wdGlvblZhbHVlLmVuYWJsZWQgIT09IGZhbHNlXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIC8vIGlmIHRoZSBvcHRpb24gdmFsdWUgaXMgYSBib29sZWFuIGFuZCB0aGUgZGVmYXVsdCBpcyBhbiBvYmplY3RcbiAgICAgIGVsc2UgaWYgKGlzLmJvb2wob3B0aW9uVmFsdWUpICYmIGlzLm9iamVjdChkZWZhdWx0cy5wZXJBY3Rpb25bb3B0aW9uTmFtZV0pKSB7XG4gICAgICAgIGFjdGlvbk9wdGlvbnNbb3B0aW9uTmFtZV0uZW5hYmxlZCA9IG9wdGlvblZhbHVlXG4gICAgICB9XG4gICAgICAvLyBpZiBpdCdzIGFueXRoaW5nIGVsc2UsIGRvIGEgcGxhaW4gYXNzaWdubWVudFxuICAgICAgZWxzZSB7XG4gICAgICAgIGFjdGlvbk9wdGlvbnNbb3B0aW9uTmFtZV0gPSBvcHRpb25WYWx1ZVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBUaGUgZGVmYXVsdCBmdW5jdGlvbiB0byBnZXQgYW4gSW50ZXJhY3RhYmxlcyBib3VuZGluZyByZWN0LiBDYW4gYmVcbiAgICogb3ZlcnJpZGRlbiB1c2luZyB7QGxpbmsgSW50ZXJhY3RhYmxlLnJlY3RDaGVja2VyfS5cbiAgICpcbiAgICogQHBhcmFtIHtFbGVtZW50fSBbZWxlbWVudF0gVGhlIGVsZW1lbnQgdG8gbWVhc3VyZS5cbiAgICogQHJldHVybiB7b2JqZWN0fSBUaGUgb2JqZWN0J3MgYm91bmRpbmcgcmVjdGFuZ2xlLlxuICAgKi9cbiAgZ2V0UmVjdCAoZWxlbWVudDogRWxlbWVudCkge1xuICAgIGVsZW1lbnQgPSBlbGVtZW50IHx8IChpcy5lbGVtZW50KHRoaXMudGFyZ2V0KVxuICAgICAgPyB0aGlzLnRhcmdldFxuICAgICAgOiBudWxsKVxuXG4gICAgaWYgKGlzLnN0cmluZyh0aGlzLnRhcmdldCkpIHtcbiAgICAgIGVsZW1lbnQgPSBlbGVtZW50IHx8IHRoaXMuX2NvbnRleHQucXVlcnlTZWxlY3Rvcih0aGlzLnRhcmdldClcbiAgICB9XG5cbiAgICByZXR1cm4gZ2V0RWxlbWVudFJlY3QoZWxlbWVudClcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIG9yIHNldHMgdGhlIGZ1bmN0aW9uIHVzZWQgdG8gY2FsY3VsYXRlIHRoZSBpbnRlcmFjdGFibGUnc1xuICAgKiBlbGVtZW50J3MgcmVjdGFuZ2xlXG4gICAqXG4gICAqIEBwYXJhbSB7ZnVuY3Rpb259IFtjaGVja2VyXSBBIGZ1bmN0aW9uIHdoaWNoIHJldHVybnMgdGhpcyBJbnRlcmFjdGFibGUnc1xuICAgKiBib3VuZGluZyByZWN0YW5nbGUuIFNlZSB7QGxpbmsgSW50ZXJhY3RhYmxlLmdldFJlY3R9XG4gICAqIEByZXR1cm4ge2Z1bmN0aW9uIHwgb2JqZWN0fSBUaGUgY2hlY2tlciBmdW5jdGlvbiBvciB0aGlzIEludGVyYWN0YWJsZVxuICAgKi9cbiAgcmVjdENoZWNrZXIgKGNoZWNrZXI6IChlbGVtZW50OiBFbGVtZW50KSA9PiBhbnkpIHtcbiAgICBpZiAoaXMuZnVuYyhjaGVja2VyKSkge1xuICAgICAgdGhpcy5nZXRSZWN0ID0gY2hlY2tlclxuXG4gICAgICByZXR1cm4gdGhpc1xuICAgIH1cblxuICAgIGlmIChjaGVja2VyID09PSBudWxsKSB7XG4gICAgICBkZWxldGUgdGhpcy5vcHRpb25zLmdldFJlY3RcblxuICAgICAgcmV0dXJuIHRoaXNcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy5nZXRSZWN0XG4gIH1cblxuICBfYmFja0NvbXBhdE9wdGlvbiAob3B0aW9uTmFtZSwgbmV3VmFsdWUpIHtcbiAgICBpZiAodHJ5U2VsZWN0b3IobmV3VmFsdWUpIHx8IGlzLm9iamVjdChuZXdWYWx1ZSkpIHtcbiAgICAgIHRoaXMub3B0aW9uc1tvcHRpb25OYW1lXSA9IG5ld1ZhbHVlXG5cbiAgICAgIGZvciAoY29uc3QgYWN0aW9uIG9mIHRoaXMuX2FjdGlvbnMubmFtZXMpIHtcbiAgICAgICAgdGhpcy5vcHRpb25zW2FjdGlvbl1bb3B0aW9uTmFtZV0gPSBuZXdWYWx1ZVxuICAgICAgfVxuXG4gICAgICByZXR1cm4gdGhpc1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzLm9wdGlvbnNbb3B0aW9uTmFtZV1cbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIG9yIHNldHMgdGhlIG9yaWdpbiBvZiB0aGUgSW50ZXJhY3RhYmxlJ3MgZWxlbWVudC4gIFRoZSB4IGFuZCB5XG4gICAqIG9mIHRoZSBvcmlnaW4gd2lsbCBiZSBzdWJ0cmFjdGVkIGZyb20gYWN0aW9uIGV2ZW50IGNvb3JkaW5hdGVzLlxuICAgKlxuICAgKiBAcGFyYW0ge0VsZW1lbnQgfCBvYmplY3QgfCBzdHJpbmd9IFtvcmlnaW5dIEFuIEhUTUwgb3IgU1ZHIEVsZW1lbnQgd2hvc2VcbiAgICogcmVjdCB3aWxsIGJlIHVzZWQsIGFuIG9iamVjdCBlZy4geyB4OiAwLCB5OiAwIH0gb3Igc3RyaW5nICdwYXJlbnQnLCAnc2VsZidcbiAgICogb3IgYW55IENTUyBzZWxlY3RvclxuICAgKlxuICAgKiBAcmV0dXJuIHtvYmplY3R9IFRoZSBjdXJyZW50IG9yaWdpbiBvciB0aGlzIEludGVyYWN0YWJsZVxuICAgKi9cbiAgb3JpZ2luIChuZXdWYWx1ZSkge1xuICAgIHJldHVybiB0aGlzLl9iYWNrQ29tcGF0T3B0aW9uKCdvcmlnaW4nLCBuZXdWYWx1ZSlcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIG9yIHNldHMgdGhlIG1vdXNlIGNvb3JkaW5hdGUgdHlwZXMgdXNlZCB0byBjYWxjdWxhdGUgdGhlXG4gICAqIG1vdmVtZW50IG9mIHRoZSBwb2ludGVyLlxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gW25ld1ZhbHVlXSBVc2UgJ2NsaWVudCcgaWYgeW91IHdpbGwgYmUgc2Nyb2xsaW5nIHdoaWxlXG4gICAqIGludGVyYWN0aW5nOyBVc2UgJ3BhZ2UnIGlmIHlvdSB3YW50IGF1dG9TY3JvbGwgdG8gd29ya1xuICAgKiBAcmV0dXJuIHtzdHJpbmcgfCBvYmplY3R9IFRoZSBjdXJyZW50IGRlbHRhU291cmNlIG9yIHRoaXMgSW50ZXJhY3RhYmxlXG4gICAqL1xuICBkZWx0YVNvdXJjZSAobmV3VmFsdWUpIHtcbiAgICBpZiAobmV3VmFsdWUgPT09ICdwYWdlJyB8fCBuZXdWYWx1ZSA9PT0gJ2NsaWVudCcpIHtcbiAgICAgIHRoaXMub3B0aW9ucy5kZWx0YVNvdXJjZSA9IG5ld1ZhbHVlXG5cbiAgICAgIHJldHVybiB0aGlzXG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXMub3B0aW9ucy5kZWx0YVNvdXJjZVxuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIHNlbGVjdG9yIGNvbnRleHQgTm9kZSBvZiB0aGUgSW50ZXJhY3RhYmxlLiBUaGUgZGVmYXVsdCBpc1xuICAgKiBgd2luZG93LmRvY3VtZW50YC5cbiAgICpcbiAgICogQHJldHVybiB7Tm9kZX0gVGhlIGNvbnRleHQgTm9kZSBvZiB0aGlzIEludGVyYWN0YWJsZVxuICAgKi9cbiAgY29udGV4dCAoKSB7XG4gICAgcmV0dXJuIHRoaXMuX2NvbnRleHRcbiAgfVxuXG4gIGluQ29udGV4dCAoZWxlbWVudCkge1xuICAgIHJldHVybiAodGhpcy5fY29udGV4dCA9PT0gZWxlbWVudC5vd25lckRvY3VtZW50IHx8XG4gICAgICAgICAgICBub2RlQ29udGFpbnModGhpcy5fY29udGV4dCwgZWxlbWVudCkpXG4gIH1cblxuICAvKipcbiAgICogQ2FsbHMgbGlzdGVuZXJzIGZvciB0aGUgZ2l2ZW4gSW50ZXJhY3RFdmVudCB0eXBlIGJvdW5kIGdsb2JhbGx5XG4gICAqIGFuZCBkaXJlY3RseSB0byB0aGlzIEludGVyYWN0YWJsZVxuICAgKlxuICAgKiBAcGFyYW0ge0ludGVyYWN0RXZlbnR9IGlFdmVudCBUaGUgSW50ZXJhY3RFdmVudCBvYmplY3QgdG8gYmUgZmlyZWQgb24gdGhpc1xuICAgKiBJbnRlcmFjdGFibGVcbiAgICogQHJldHVybiB7SW50ZXJhY3RhYmxlfSB0aGlzIEludGVyYWN0YWJsZVxuICAgKi9cbiAgZmlyZSAoaUV2ZW50KSB7XG4gICAgdGhpcy5ldmVudHMuZmlyZShpRXZlbnQpXG5cbiAgICByZXR1cm4gdGhpc1xuICB9XG5cbiAgX29uT2ZmIChtZXRob2Q6ICdvbicgfCAnb2ZmJywgdHlwZUFyZzogSW50ZXJhY3QuRXZlbnRUeXBlcywgbGlzdGVuZXJBcmc/OiBJbnRlcmFjdC5MaXN0ZW5lcnNBcmcgfCBudWxsLCBvcHRpb25zPzogYW55KSB7XG4gICAgaWYgKGlzLm9iamVjdCh0eXBlQXJnKSAmJiAhaXMuYXJyYXkodHlwZUFyZykpIHtcbiAgICAgIG9wdGlvbnMgPSBsaXN0ZW5lckFyZ1xuICAgICAgbGlzdGVuZXJBcmcgPSBudWxsXG4gICAgfVxuXG4gICAgY29uc3QgYWRkUmVtb3ZlID0gbWV0aG9kID09PSAnb24nID8gJ2FkZCcgOiAncmVtb3ZlJ1xuICAgIGNvbnN0IGxpc3RlbmVycyA9IG5vcm1hbGl6ZUxpc3RlbmVycyh0eXBlQXJnLCBsaXN0ZW5lckFyZylcblxuICAgIGZvciAobGV0IHR5cGUgaW4gbGlzdGVuZXJzKSB7XG4gICAgICBpZiAodHlwZSA9PT0gJ3doZWVsJykgeyB0eXBlID0gYnJvd3Nlci53aGVlbEV2ZW50IH1cblxuICAgICAgZm9yIChjb25zdCBsaXN0ZW5lciBvZiBsaXN0ZW5lcnNbdHlwZV0pIHtcbiAgICAgICAgLy8gaWYgaXQgaXMgYW4gYWN0aW9uIGV2ZW50IHR5cGVcbiAgICAgICAgaWYgKGFyci5jb250YWlucyh0aGlzLl9hY3Rpb25zLmV2ZW50VHlwZXMsIHR5cGUpKSB7XG4gICAgICAgICAgdGhpcy5ldmVudHNbbWV0aG9kXSh0eXBlLCBsaXN0ZW5lcilcbiAgICAgICAgfVxuICAgICAgICAvLyBkZWxlZ2F0ZWQgZXZlbnRcbiAgICAgICAgZWxzZSBpZiAoaXMuc3RyaW5nKHRoaXMudGFyZ2V0KSkge1xuICAgICAgICAgIGV2ZW50c1tgJHthZGRSZW1vdmV9RGVsZWdhdGVgXSh0aGlzLnRhcmdldCwgdGhpcy5fY29udGV4dCwgdHlwZSwgbGlzdGVuZXIsIG9wdGlvbnMpXG4gICAgICAgIH1cbiAgICAgICAgLy8gcmVtb3ZlIGxpc3RlbmVyIGZyb20gdGhpcyBJbnRlcmF0YWJsZSdzIGVsZW1lbnRcbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgKGV2ZW50c1thZGRSZW1vdmVdIGFzIHR5cGVvZiBldmVudHMucmVtb3ZlKSh0aGlzLnRhcmdldCBhcyBFbGVtZW50LCB0eXBlLCBsaXN0ZW5lciwgb3B0aW9ucylcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiB0aGlzXG4gIH1cblxuICAvKipcbiAgICogQmluZHMgYSBsaXN0ZW5lciBmb3IgYW4gSW50ZXJhY3RFdmVudCwgcG9pbnRlckV2ZW50IG9yIERPTSBldmVudC5cbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmcgfCBhcnJheSB8IG9iamVjdH0gdHlwZXMgVGhlIHR5cGVzIG9mIGV2ZW50cyB0byBsaXN0ZW5cbiAgICogZm9yXG4gICAqIEBwYXJhbSB7ZnVuY3Rpb24gfCBhcnJheSB8IG9iamVjdH0gW2xpc3RlbmVyXSBUaGUgZXZlbnQgbGlzdGVuZXIgZnVuY3Rpb24ocylcbiAgICogQHBhcmFtIHtvYmplY3QgfCBib29sZWFufSBbb3B0aW9uc10gb3B0aW9ucyBvYmplY3Qgb3IgdXNlQ2FwdHVyZSBmbGFnIGZvclxuICAgKiBhZGRFdmVudExpc3RlbmVyXG4gICAqIEByZXR1cm4ge0ludGVyYWN0YWJsZX0gVGhpcyBJbnRlcmFjdGFibGVcbiAgICovXG4gIG9uICh0eXBlczogSW50ZXJhY3QuRXZlbnRUeXBlcywgbGlzdGVuZXI/OiBJbnRlcmFjdC5MaXN0ZW5lcnNBcmcsIG9wdGlvbnM/OiBhbnkpIHtcbiAgICByZXR1cm4gdGhpcy5fb25PZmYoJ29uJywgdHlwZXMsIGxpc3RlbmVyLCBvcHRpb25zKVxuICB9XG5cbiAgLyoqXG4gICAqIFJlbW92ZXMgYW4gSW50ZXJhY3RFdmVudCwgcG9pbnRlckV2ZW50IG9yIERPTSBldmVudCBsaXN0ZW5lci5cbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmcgfCBhcnJheSB8IG9iamVjdH0gdHlwZXMgVGhlIHR5cGVzIG9mIGV2ZW50cyB0aGF0IHdlcmVcbiAgICogbGlzdGVuZWQgZm9yXG4gICAqIEBwYXJhbSB7ZnVuY3Rpb24gfCBhcnJheSB8IG9iamVjdH0gW2xpc3RlbmVyXSBUaGUgZXZlbnQgbGlzdGVuZXIgZnVuY3Rpb24ocylcbiAgICogQHBhcmFtIHtvYmplY3QgfCBib29sZWFufSBbb3B0aW9uc10gb3B0aW9ucyBvYmplY3Qgb3IgdXNlQ2FwdHVyZSBmbGFnIGZvclxuICAgKiByZW1vdmVFdmVudExpc3RlbmVyXG4gICAqIEByZXR1cm4ge0ludGVyYWN0YWJsZX0gVGhpcyBJbnRlcmFjdGFibGVcbiAgICovXG4gIG9mZiAodHlwZXM6IHN0cmluZyB8IHN0cmluZ1tdIHwgSW50ZXJhY3QuRXZlbnRUeXBlcywgbGlzdGVuZXI/OiBJbnRlcmFjdC5MaXN0ZW5lcnNBcmcsIG9wdGlvbnM/OiBhbnkpIHtcbiAgICByZXR1cm4gdGhpcy5fb25PZmYoJ29mZicsIHR5cGVzLCBsaXN0ZW5lciwgb3B0aW9ucylcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXNldCB0aGUgb3B0aW9ucyBvZiB0aGlzIEludGVyYWN0YWJsZVxuICAgKlxuICAgKiBAcGFyYW0ge29iamVjdH0gb3B0aW9ucyBUaGUgbmV3IHNldHRpbmdzIHRvIGFwcGx5XG4gICAqIEByZXR1cm4ge29iamVjdH0gVGhpcyBJbnRlcmFjdGFibGVcbiAgICovXG4gIHNldCAob3B0aW9uczogSW50ZXJhY3QuT3B0aW9uc0FyZykge1xuICAgIGNvbnN0IGRlZmF1bHRzID0gdGhpcy5fZGVmYXVsdHNcblxuICAgIGlmICghaXMub2JqZWN0KG9wdGlvbnMpKSB7XG4gICAgICBvcHRpb25zID0ge31cbiAgICB9XG5cbiAgICB0aGlzLm9wdGlvbnMgPSBjbG9uZShkZWZhdWx0cy5iYXNlKSBhcyBSZXF1aXJlZDxPcHRpb25zPlxuXG4gICAgZm9yIChjb25zdCBhY3Rpb25OYW1lIGluIHRoaXMuX2FjdGlvbnMubWV0aG9kRGljdCkge1xuICAgICAgY29uc3QgbWV0aG9kTmFtZSA9IHRoaXMuX2FjdGlvbnMubWV0aG9kRGljdFthY3Rpb25OYW1lXVxuXG4gICAgICB0aGlzLm9wdGlvbnNbYWN0aW9uTmFtZV0gPSB7fVxuICAgICAgdGhpcy5zZXRQZXJBY3Rpb24oYWN0aW9uTmFtZSwgZXh0ZW5kKGV4dGVuZCh7fSwgZGVmYXVsdHMucGVyQWN0aW9uKSwgZGVmYXVsdHMuYWN0aW9uc1thY3Rpb25OYW1lXSkpXG5cbiAgICAgIHRoaXNbbWV0aG9kTmFtZV0ob3B0aW9uc1thY3Rpb25OYW1lXSlcbiAgICB9XG5cbiAgICBmb3IgKGNvbnN0IHNldHRpbmcgaW4gb3B0aW9ucykge1xuICAgICAgaWYgKGlzLmZ1bmModGhpc1tzZXR0aW5nXSkpIHtcbiAgICAgICAgdGhpc1tzZXR0aW5nXShvcHRpb25zW3NldHRpbmddKVxuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiB0aGlzXG4gIH1cblxuICAvKipcbiAgICogUmVtb3ZlIHRoaXMgaW50ZXJhY3RhYmxlIGZyb20gdGhlIGxpc3Qgb2YgaW50ZXJhY3RhYmxlcyBhbmQgcmVtb3ZlIGl0J3NcbiAgICogYWN0aW9uIGNhcGFiaWxpdGllcyBhbmQgZXZlbnQgbGlzdGVuZXJzXG4gICAqXG4gICAqIEByZXR1cm4ge2ludGVyYWN0fVxuICAgKi9cbiAgdW5zZXQgKCkge1xuICAgIGV2ZW50cy5yZW1vdmUodGhpcy50YXJnZXQgYXMgTm9kZSwgJ2FsbCcpXG5cbiAgICBpZiAoaXMuc3RyaW5nKHRoaXMudGFyZ2V0KSkge1xuICAgICAgLy8gcmVtb3ZlIGRlbGVnYXRlZCBldmVudHNcbiAgICAgIGZvciAoY29uc3QgdHlwZSBpbiBldmVudHMuZGVsZWdhdGVkRXZlbnRzKSB7XG4gICAgICAgIGNvbnN0IGRlbGVnYXRlZCA9IGV2ZW50cy5kZWxlZ2F0ZWRFdmVudHNbdHlwZV1cblxuICAgICAgICBpZiAoZGVsZWdhdGVkLnNlbGVjdG9yc1swXSA9PT0gdGhpcy50YXJnZXQgJiZcbiAgICAgICAgICAgIGRlbGVnYXRlZC5jb250ZXh0c1swXSA9PT0gdGhpcy5fY29udGV4dCkge1xuICAgICAgICAgIGRlbGVnYXRlZC5zZWxlY3RvcnMuc3BsaWNlKDAsIDEpXG4gICAgICAgICAgZGVsZWdhdGVkLmNvbnRleHRzLnNwbGljZSgwLCAxKVxuICAgICAgICAgIGRlbGVnYXRlZC5saXN0ZW5lcnMuc3BsaWNlKDAsIDEpXG5cbiAgICAgICAgICAvLyByZW1vdmUgdGhlIGFycmF5cyBpZiB0aGV5IGFyZSBlbXB0eVxuICAgICAgICAgIGlmICghZGVsZWdhdGVkLnNlbGVjdG9ycy5sZW5ndGgpIHtcbiAgICAgICAgICAgIGRlbGVnYXRlZFt0eXBlXSA9IG51bGxcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBldmVudHMucmVtb3ZlKHRoaXMuX2NvbnRleHQsIHR5cGUsIGV2ZW50cy5kZWxlZ2F0ZUxpc3RlbmVyKVxuICAgICAgICBldmVudHMucmVtb3ZlKHRoaXMuX2NvbnRleHQsIHR5cGUsIGV2ZW50cy5kZWxlZ2F0ZVVzZUNhcHR1cmUsIHRydWUpXG4gICAgICB9XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgZXZlbnRzLnJlbW92ZSh0aGlzLnRhcmdldCBhcyBOb2RlLCAnYWxsJylcbiAgICB9XG4gIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgSW50ZXJhY3RhYmxlXG4iXX0=