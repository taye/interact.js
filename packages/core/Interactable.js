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
    testIgnoreAllow(options, targetNode, eventTarget) {
        return (!this.testIgnore(options.ignoreFrom, targetNode, eventTarget) &&
            this.testAllow(options.allowFrom, targetNode, eventTarget));
    }
    testAllow(allowFrom, targetNode, element) {
        if (!allowFrom) {
            return true;
        }
        if (!is.element(element)) {
            return false;
        }
        if (is.string(allowFrom)) {
            return matchesUpTo(element, allowFrom, targetNode);
        }
        else if (is.element(allowFrom)) {
            return nodeContains(allowFrom, element);
        }
        return false;
    }
    testIgnore(ignoreFrom, targetNode, element) {
        if (!ignoreFrom || !is.element(element)) {
            return false;
        }
        if (is.string(ignoreFrom)) {
            return matchesUpTo(element, ignoreFrom, targetNode);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiSW50ZXJhY3RhYmxlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiSW50ZXJhY3RhYmxlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sS0FBSyxHQUFHLE1BQU0sdUJBQXVCLENBQUE7QUFDNUMsT0FBTyxPQUFPLE1BQU0sMkJBQTJCLENBQUE7QUFDL0MsT0FBTyxLQUFLLE1BQU0seUJBQXlCLENBQUE7QUFDM0MsT0FBTyxFQUFFLGNBQWMsRUFBRSxXQUFXLEVBQUUsWUFBWSxFQUFFLFdBQVcsRUFBRSxNQUFNLDRCQUE0QixDQUFBO0FBQ25HLE9BQU8sTUFBTSxNQUFNLDBCQUEwQixDQUFBO0FBQzdDLE9BQU8sTUFBTSxNQUFNLDBCQUEwQixDQUFBO0FBQzdDLE9BQU8sS0FBSyxFQUFFLE1BQU0sc0JBQXNCLENBQUE7QUFDMUMsT0FBTyxrQkFBa0IsTUFBTSxzQ0FBc0MsQ0FBQTtBQUNyRSxPQUFPLEVBQUUsU0FBUyxFQUFFLE1BQU0sMEJBQTBCLENBQUE7QUFFcEQsT0FBTyxTQUFTLE1BQU0sYUFBYSxDQUFBO0FBS25DLE1BQU07QUFDTixNQUFNLE9BQU8sWUFBWTtJQWlCdkIsTUFBTTtJQUNOLFlBQWEsTUFBdUIsRUFBRSxPQUFZLEVBQUUsY0FBa0M7UUFON0UsV0FBTSxHQUFHLElBQUksU0FBUyxFQUFFLENBQUE7UUFPL0IsSUFBSSxDQUFDLFFBQVEsR0FBRyxPQUFPLENBQUMsT0FBTyxDQUFBO1FBQy9CLElBQUksQ0FBQyxNQUFNLEdBQUssTUFBTSxDQUFBO1FBQ3RCLElBQUksQ0FBQyxRQUFRLEdBQUcsT0FBTyxDQUFDLE9BQU8sSUFBSSxjQUFjLENBQUE7UUFDakQsSUFBSSxDQUFDLElBQUksR0FBTyxTQUFTLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQTtRQUN2RSxJQUFJLENBQUMsSUFBSSxHQUFPLElBQUksQ0FB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QUFTLEdBQUcsTUFBTSxDQUFDLGVBQWUsQ0FBQyxJQUFJLENBQUMsQ0FBQTtnQkFFOUMsSUFBSSxTQUFTLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxLQUFLLElBQUksQ0FBQyxNQUFNO29CQUN0QyxTQUFTLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxLQUFLLElBQUksQ0FBQyxRQUFRLEVBQUU7b0JBQzNDLFNBQVMsQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQTtvQkFDaEMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFBO29CQUMvQixTQUFTLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUE7b0JBRWhDLHNDQUFzQztvQkFDdEMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsTUFBTSxFQUFFO3dCQUMvQixTQUFTLENBQUMsSUFBSSxDQUFDLEdBQUcsSUFBSSxDQUFBO3FCQUN2QjtpQkFDRjtnQkFFRCxNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsSUFBSSxFQUFFLE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFBO2dCQUMzRCxNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsSUFBSSxFQUFFLE1BQU0sQ0FBQyxrQkFBa0IsRUFBRSxJQUFJLENBQUMsQ0FBQTthQUNwRTtTQUNGO2FBQ0k7WUFDSCxNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxNQUFjLEVBQUUsS0FBSyxDQUFDLENBQUE7U0FDMUM7SUFDSCxDQUFDO0NBQ0Y7QUFFRCxlQUFlLFlBQVksQ0FBQSIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGFyciBmcm9tICdAaW50ZXJhY3Rqcy91dGlscy9hcnInXG5pbXBvcnQgYnJvd3NlciBmcm9tICdAaW50ZXJhY3Rqcy91dGlscy9icm93c2VyJ1xuaW1wb3J0IGNsb25lIGZyb20gJ0BpbnRlcmFjdGpzL3V0aWxzL2Nsb25lJ1xuaW1wb3J0IHsgZ2V0RWxlbWVudFJlY3QsIG1hdGNoZXNVcFRvLCBub2RlQ29udGFpbnMsIHRyeVNlbGVjdG9yIH0gZnJvbSAnQGludGVyYWN0anMvdXRpbHMvZG9tVXRpbHMnXG5pbXBvcnQgZXZlbnRzIGZyb20gJ0BpbnRlcmFjdGpzL3V0aWxzL2V2ZW50cydcbmltcG9ydCBleHRlbmQgZnJvbSAnQGludGVyYWN0anMvdXRpbHMvZXh0ZW5kJ1xuaW1wb3J0ICogYXMgaXMgZnJvbSAnQGludGVyYWN0anMvdXRpbHMvaXMnXG5pbXBvcnQgbm9ybWFsaXplTGlzdGVuZXJzIGZyb20gJ0BpbnRlcmFjdGpzL3V0aWxzL25vcm1hbGl6ZUxpc3RlbmVycydcbmltcG9ydCB7IGdldFdpbmRvdyB9IGZyb20gJ0BpbnRlcmFjdGpzL3V0aWxzL3dpbmRvdydcbmltcG9ydCB7IEFjdGlvbkRlZmF1bHRzLCBEZWZhdWx0cywgT3B0aW9ucyB9IGZyb20gJy4vZGVmYXVsdE9wdGlvbnMnXG5pbXBvcnQgRXZlbnRhYmxlIGZyb20gJy4vRXZlbnRhYmxlJ1xuaW1wb3J0IHsgQWN0aW9ucyB9IGZyb20gJy4vc2NvcGUnXG5cbnR5cGUgSWdub3JlVmFsdWUgPSBzdHJpbmcgfCBFbGVtZW50IHwgYm9vbGVhblxuXG4vKiogKi9cbmV4cG9ydCBjbGFzcyBJbnRlcmFjdGFibGUgaW1wbGVtZW50cyBQYXJ0aWFsPEV2ZW50YWJsZT4ge1xuICBwcm90ZWN0ZWQgZ2V0IF9kZWZhdWx0cyAoKTogRGVmYXVsdHMge1xuICAgIHJldHVybiB7XG4gICAgICBiYXNlOiB7fSxcbiAgICAgIHBlckFjdGlvbjoge30sXG4gICAgICBhY3Rpb25zOiB7fSBhcyBBY3Rpb25EZWZhdWx0cyxcbiAgICB9XG4gIH1cblxuICByZWFkb25seSBvcHRpb25zITogUmVxdWlyZWQ8T3B0aW9ucz5cbiAgcmVhZG9ubHkgX2FjdGlvbnM6IEFjdGlvbnNcbiAgcmVhZG9ubHkgdGFyZ2V0OiBJbnRlcmFjdC5UYXJnZXRcbiAgcmVhZG9ubHkgZXZlbnRzID0gbmV3IEV2ZW50YWJsZSgpXG4gIHJlYWRvbmx5IF9jb250ZXh0OiBEb2N1bWVudCB8IEVsZW1lbnRcbiAgcmVhZG9ubHkgX3dpbjogV2luZG93XG4gIHJlYWRvbmx5IF9kb2M6IERvY3VtZW50XG5cbiAgLyoqICovXG4gIGNvbnN0cnVjdG9yICh0YXJnZXQ6IEludGVyYWN0LlRhcmdldCwgb3B0aW9uczogYW55LCBkZWZhdWx0Q29udGV4dDogRG9jdW1lbnQgfCBFbGVtZW50KSB7XG4gICAgdGhpcy5fYWN0aW9ucyA9IG9wdGlvbnMuYWN0aW9uc1xuICAgIHRoaXMudGFyZ2V0ICAgPSB0YXJnZXRcbiAgICB0aGlzLl9jb250ZXh0ID0gb3B0aW9ucy5jb250ZXh0IHx8IGRlZmF1bHRDb250ZXh0XG4gICAgdGhpcy5fd2luICAgICA9IGdldFdpbmRvdyh0cnlTZWxlY3Rvcih0YXJnZXQpID8gdGhpcy5fY29udGV4dCA6IHRhcmdldClcbiAgICB0aGlzLl9kb2MgICAgID0gdGhpcy5fd2luLmRvY3VtZW50XG5cbiAgICB0aGlzLnNldChvcHRpb25zKVxuICB9XG5cbiAgc2V0T25FdmVudHMgKGFjdGlvbk5hbWU6IHN0cmluZywgcGhhc2VzOiBOb25OdWxsYWJsZTxhbnk+KSB7XG4gICAgaWYgKGlzLmZ1bmMocGhhc2VzLm9uc3RhcnQpKSB7IHRoaXMub24oYCR7YWN0aW9uTmFtZX1zdGFydGAsIHBoYXNlcy5vbnN0YXJ0KSB9XG4gICAgaWYgKGlzLmZ1bmMocGhhc2VzLm9ubW92ZSkpIHsgdGhpcy5vbihgJHthY3Rpb25OYW1lfW1vdmVgLCBwaGFzZXMub25tb3ZlKSB9XG4gICAgaWYgKGlzLmZ1bmMocGhhc2VzLm9uZW5kKSkgeyB0aGlzLm9uKGAke2FjdGlvbk5hbWV9ZW5kYCwgcGhhc2VzLm9uZW5kKSB9XG4gICAgaWYgKGlzLmZ1bmMocGhhc2VzLm9uaW5lcnRpYXN0YXJ0KSkgeyB0aGlzLm9uKGAke2FjdGlvbk5hbWV9aW5lcnRpYXN0YXJ0YCwgcGhhc2VzLm9uaW5lcnRpYXN0YXJ0KSB9XG5cbiAgICByZXR1cm4gdGhpc1xuICB9XG5cbiAgdXBkYXRlUGVyQWN0aW9uTGlzdGVuZXJzIChhY3Rpb25OYW1lLCBwcmV2LCBjdXIpIHtcbiAgICBpZiAoaXMuYXJyYXkocHJldikgfHwgaXMub2JqZWN0KHByZXYpKSB7XG4gICAgICB0aGlzLm9mZihhY3Rpb25OYW1lLCBwcmV2KVxuICAgIH1cblxuICAgIGlmIChpcy5hcnJheShjdXIpIHx8IGlzLm9iamVjdChjdXIpKSB7XG4gICAgICB0aGlzLm9uKGFjdGlvbk5hbWUsIGN1cilcbiAgICB9XG4gIH1cblxuICBzZXRQZXJBY3Rpb24gKGFjdGlvbk5hbWUsIG9wdGlvbnM6IEludGVyYWN0Lk9yQm9vbGVhbjxPcHRpb25zPikge1xuICAgIGNvbnN0IGRlZmF1bHRzID0gdGhpcy5fZGVmYXVsdHNcblxuICAgIC8vIGZvciBhbGwgdGhlIGRlZmF1bHQgcGVyLWFjdGlvbiBvcHRpb25zXG4gICAgZm9yIChjb25zdCBvcHRpb25OYW1lIGluIG9wdGlvbnMpIHtcbiAgICAgIGNvbnN0IGFjdGlvbk9wdGlvbnMgPSB0aGlzLm9wdGlvbnNbYWN0aW9uTmFtZV1cbiAgICAgIGNvbnN0IG9wdGlvblZhbHVlID0gb3B0aW9uc1tvcHRpb25OYW1lXVxuICAgICAgY29uc3QgaXNBcnJheSA9IGlzLmFycmF5KG9wdGlvblZhbHVlKVxuXG4gICAgICAvLyByZW1vdmUgb2xkIGV2ZW50IGxpc3RlbmVycyBhbmQgYWRkIG5ldyBvbmVzXG4gICAgICBpZiAob3B0aW9uTmFtZSA9PT0gJ2xpc3RlbmVycycpIHtcbiAgICAgICAgdGhpcy51cGRhdGVQZXJBY3Rpb25MaXN0ZW5lcnMoYWN0aW9uTmFtZSwgYWN0aW9uT3B0aW9ucy5saXN0ZW5lcnMsIG9wdGlvblZhbHVlKVxuICAgICAgfVxuXG4gICAgICAvLyBpZiB0aGUgb3B0aW9uIHZhbHVlIGlzIGFuIGFycmF5XG4gICAgICBpZiAoaXNBcnJheSkge1xuICAgICAgICBhY3Rpb25PcHRpb25zW29wdGlvbk5hbWVdID0gYXJyLmZyb20ob3B0aW9uVmFsdWUpXG4gICAgICB9XG4gICAgICAvLyBpZiB0aGUgb3B0aW9uIHZhbHVlIGlzIGFuIG9iamVjdFxuICAgICAgZWxzZSBpZiAoIWlzQXJyYXkgJiYgaXMucGxhaW5PYmplY3Qob3B0aW9uVmFsdWUpKSB7XG4gICAgICAgIC8vIGNvcHkgdGhlIG9iamVjdFxuICAgICAgICBhY3Rpb25PcHRpb25zW29wdGlvbk5hbWVdID0gZXh0ZW5kKFxuICAgICAgICAgIGFjdGlvbk9wdGlvbnNbb3B0aW9uTmFtZV0gfHwge30sXG4gICAgICAgICAgY2xvbmUob3B0aW9uVmFsdWUpKVxuXG4gICAgICAgIC8vIHNldCBhbmFibGVkIGZpZWxkIHRvIHRydWUgaWYgaXQgZXhpc3RzIGluIHRoZSBkZWZhdWx0c1xuICAgICAgICBpZiAoaXMub2JqZWN0KGRlZmF1bHRzLnBlckFjdGlvbltvcHRpb25OYW1lXSkgJiYgJ2VuYWJsZWQnIGluIGRlZmF1bHRzLnBlckFjdGlvbltvcHRpb25OYW1lXSkge1xuICAgICAgICAgIGFjdGlvbk9wdGlvbnNbb3B0aW9uTmFtZV0uZW5hYmxlZCA9IG9wdGlvblZhbHVlLmVuYWJsZWQgIT09IGZhbHNlXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIC8vIGlmIHRoZSBvcHRpb24gdmFsdWUgaXMgYSBib29sZWFuIGFuZCB0aGUgZGVmYXVsdCBpcyBhbiBvYmplY3RcbiAgICAgIGVsc2UgaWYgKGlzLmJvb2wob3B0aW9uVmFsdWUpICYmIGlzLm9iamVjdChkZWZhdWx0cy5wZXJBY3Rpb25bb3B0aW9uTmFtZV0pKSB7XG4gICAgICAgIGFjdGlvbk9wdGlvbnNbb3B0aW9uTmFtZV0uZW5hYmxlZCA9IG9wdGlvblZhbHVlXG4gICAgICB9XG4gICAgICAvLyBpZiBpdCdzIGFueXRoaW5nIGVsc2UsIGRvIGEgcGxhaW4gYXNzaWdubWVudFxuICAgICAgZWxzZSB7XG4gICAgICAgIGFjdGlvbk9wdGlvbnNbb3B0aW9uTmFtZV0gPSBvcHRpb25WYWx1ZVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBUaGUgZGVmYXVsdCBmdW5jdGlvbiB0byBnZXQgYW4gSW50ZXJhY3RhYmxlcyBib3VuZGluZyByZWN0LiBDYW4gYmVcbiAgICogb3ZlcnJpZGRlbiB1c2luZyB7QGxpbmsgSW50ZXJhY3RhYmxlLnJlY3RDaGVja2VyfS5cbiAgICpcbiAgICogQHBhcmFtIHtFbGVtZW50fSBbZWxlbWVudF0gVGhlIGVsZW1lbnQgdG8gbWVhc3VyZS5cbiAgICogQHJldHVybiB7b2JqZWN0fSBUaGUgb2JqZWN0J3MgYm91bmRpbmcgcmVjdGFuZ2xlLlxuICAgKi9cbiAgZ2V0UmVjdCAoZWxlbWVudDogRWxlbWVudCkge1xuICAgIGVsZW1lbnQgPSBlbGVtZW50IHx8IChpcy5lbGVtZW50KHRoaXMudGFyZ2V0KVxuICAgICAgPyB0aGlzLnRhcmdldFxuICAgICAgOiBudWxsKVxuXG4gICAgaWYgKGlzLnN0cmluZyh0aGlzLnRhcmdldCkpIHtcbiAgICAgIGVsZW1lbnQgPSBlbGVtZW50IHx8IHRoaXMuX2NvbnRleHQucXVlcnlTZWxlY3Rvcih0aGlzLnRhcmdldClcbiAgICB9XG5cbiAgICByZXR1cm4gZ2V0RWxlbWVudFJlY3QoZWxlbWVudClcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIG9yIHNldHMgdGhlIGZ1bmN0aW9uIHVzZWQgdG8gY2FsY3VsYXRlIHRoZSBpbnRlcmFjdGFibGUnc1xuICAgKiBlbGVtZW50J3MgcmVjdGFuZ2xlXG4gICAqXG4gICAqIEBwYXJhbSB7ZnVuY3Rpb259IFtjaGVja2VyXSBBIGZ1bmN0aW9uIHdoaWNoIHJldHVybnMgdGhpcyBJbnRlcmFjdGFibGUnc1xuICAgKiBib3VuZGluZyByZWN0YW5nbGUuIFNlZSB7QGxpbmsgSW50ZXJhY3RhYmxlLmdldFJlY3R9XG4gICAqIEByZXR1cm4ge2Z1bmN0aW9uIHwgb2JqZWN0fSBUaGUgY2hlY2tlciBmdW5jdGlvbiBvciB0aGlzIEludGVyYWN0YWJsZVxuICAgKi9cbiAgcmVjdENoZWNrZXIgKGNoZWNrZXI6IChlbGVtZW50OiBFbGVtZW50KSA9PiBhbnkpIHtcbiAgICBpZiAoaXMuZnVuYyhjaGVja2VyKSkge1xuICAgICAgdGhpcy5nZXRSZWN0ID0gY2hlY2tlclxuXG4gICAgICByZXR1cm4gdGhpc1xuICAgIH1cblxuICAgIGlmIChjaGVja2VyID09PSBudWxsKSB7XG4gICAgICBkZWxldGUgdGhpcy5nZXRSZWN0XG5cbiAgICAgIHJldHVybiB0aGlzXG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXMuZ2V0UmVjdFxuICB9XG5cbiAgX2JhY2tDb21wYXRPcHRpb24gKG9wdGlvbk5hbWUsIG5ld1ZhbHVlKSB7XG4gICAgaWYgKHRyeVNlbGVjdG9yKG5ld1ZhbHVlKSB8fCBpcy5vYmplY3QobmV3VmFsdWUpKSB7XG4gICAgICB0aGlzLm9wdGlvbnNbb3B0aW9uTmFtZV0gPSBuZXdWYWx1ZVxuXG4gICAgICBmb3IgKGNvbnN0IGFjdGlvbiBvZiB0aGlzLl9hY3Rpb25zLm5hbWVzKSB7XG4gICAgICAgIHRoaXMub3B0aW9uc1thY3Rpb25dW29wdGlvbk5hbWVdID0gbmV3VmFsdWVcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHRoaXNcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy5vcHRpb25zW29wdGlvbk5hbWVdXG4gIH1cblxuICAvKipcbiAgICogR2V0cyBvciBzZXRzIHRoZSBvcmlnaW4gb2YgdGhlIEludGVyYWN0YWJsZSdzIGVsZW1lbnQuICBUaGUgeCBhbmQgeVxuICAgKiBvZiB0aGUgb3JpZ2luIHdpbGwgYmUgc3VidHJhY3RlZCBmcm9tIGFjdGlvbiBldmVudCBjb29yZGluYXRlcy5cbiAgICpcbiAgICogQHBhcmFtIHtFbGVtZW50IHwgb2JqZWN0IHwgc3RyaW5nfSBbb3JpZ2luXSBBbiBIVE1MIG9yIFNWRyBFbGVtZW50IHdob3NlXG4gICAqIHJlY3Qgd2lsbCBiZSB1c2VkLCBhbiBvYmplY3QgZWcuIHsgeDogMCwgeTogMCB9IG9yIHN0cmluZyAncGFyZW50JywgJ3NlbGYnXG4gICAqIG9yIGFueSBDU1Mgc2VsZWN0b3JcbiAgICpcbiAgICogQHJldHVybiB7b2JqZWN0fSBUaGUgY3VycmVudCBvcmlnaW4gb3IgdGhpcyBJbnRlcmFjdGFibGVcbiAgICovXG4gIG9yaWdpbiAobmV3VmFsdWUpIHtcbiAgICByZXR1cm4gdGhpcy5fYmFja0NvbXBhdE9wdGlvbignb3JpZ2luJywgbmV3VmFsdWUpXG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyBvciBzZXRzIHRoZSBtb3VzZSBjb29yZGluYXRlIHR5cGVzIHVzZWQgdG8gY2FsY3VsYXRlIHRoZVxuICAgKiBtb3ZlbWVudCBvZiB0aGUgcG9pbnRlci5cbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IFtuZXdWYWx1ZV0gVXNlICdjbGllbnQnIGlmIHlvdSB3aWxsIGJlIHNjcm9sbGluZyB3aGlsZVxuICAgKiBpbnRlcmFjdGluZzsgVXNlICdwYWdlJyBpZiB5b3Ugd2FudCBhdXRvU2Nyb2xsIHRvIHdvcmtcbiAgICogQHJldHVybiB7c3RyaW5nIHwgb2JqZWN0fSBUaGUgY3VycmVudCBkZWx0YVNvdXJjZSBvciB0aGlzIEludGVyYWN0YWJsZVxuICAgKi9cbiAgZGVsdGFTb3VyY2UgKG5ld1ZhbHVlKSB7XG4gICAgaWYgKG5ld1ZhbHVlID09PSAncGFnZScgfHwgbmV3VmFsdWUgPT09ICdjbGllbnQnKSB7XG4gICAgICB0aGlzLm9wdGlvbnMuZGVsdGFTb3VyY2UgPSBuZXdWYWx1ZVxuXG4gICAgICByZXR1cm4gdGhpc1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzLm9wdGlvbnMuZGVsdGFTb3VyY2VcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBzZWxlY3RvciBjb250ZXh0IE5vZGUgb2YgdGhlIEludGVyYWN0YWJsZS4gVGhlIGRlZmF1bHQgaXNcbiAgICogYHdpbmRvdy5kb2N1bWVudGAuXG4gICAqXG4gICAqIEByZXR1cm4ge05vZGV9IFRoZSBjb250ZXh0IE5vZGUgb2YgdGhpcyBJbnRlcmFjdGFibGVcbiAgICovXG4gIGNvbnRleHQgKCkge1xuICAgIHJldHVybiB0aGlzLl9jb250ZXh0XG4gIH1cblxuICBpbkNvbnRleHQgKGVsZW1lbnQpIHtcbiAgICByZXR1cm4gKHRoaXMuX2NvbnRleHQgPT09IGVsZW1lbnQub3duZXJEb2N1bWVudCB8fFxuICAgICAgICAgICAgbm9kZUNvbnRhaW5zKHRoaXMuX2NvbnRleHQsIGVsZW1lbnQpKVxuICB9XG5cbiAgdGVzdElnbm9yZUFsbG93ICh0aGlzOiBJbnRlcmFjdGFibGUsIG9wdGlvbnM6IHsgaWdub3JlRnJvbTogSWdub3JlVmFsdWUsIGFsbG93RnJvbTogSWdub3JlVmFsdWUgfSwgdGFyZ2V0Tm9kZTogTm9kZSwgZXZlbnRUYXJnZXQ6IEVsZW1lbnQpIHtcbiAgICByZXR1cm4gKCF0aGlzLnRlc3RJZ25vcmUob3B0aW9ucy5pZ25vcmVGcm9tLCB0YXJnZXROb2RlLCBldmVudFRhcmdldCkgJiZcbiAgICAgICAgICAgIHRoaXMudGVzdEFsbG93KG9wdGlvbnMuYWxsb3dGcm9tLCB0YXJnZXROb2RlLCBldmVudFRhcmdldCkpXG4gIH1cblxuICB0ZXN0QWxsb3cgKHRoaXM6IEludGVyYWN0YWJsZSwgYWxsb3dGcm9tOiBJZ25vcmVWYWx1ZSwgdGFyZ2V0Tm9kZTogTm9kZSwgZWxlbWVudDogRWxlbWVudCkge1xuICAgIGlmICghYWxsb3dGcm9tKSB7IHJldHVybiB0cnVlIH1cblxuICAgIGlmICghaXMuZWxlbWVudChlbGVtZW50KSkgeyByZXR1cm4gZmFsc2UgfVxuXG4gICAgaWYgKGlzLnN0cmluZyhhbGxvd0Zyb20pKSB7XG4gICAgICByZXR1cm4gbWF0Y2hlc1VwVG8oZWxlbWVudCwgYWxsb3dGcm9tLCB0YXJnZXROb2RlKVxuICAgIH1cbiAgICBlbHNlIGlmIChpcy5lbGVtZW50KGFsbG93RnJvbSkpIHtcbiAgICAgIHJldHVybiBub2RlQ29udGFpbnMoYWxsb3dGcm9tLCBlbGVtZW50KVxuICAgIH1cblxuICAgIHJldHVybiBmYWxzZVxuICB9XG5cbiAgdGVzdElnbm9yZSAodGhpczogSW50ZXJhY3RhYmxlLCBpZ25vcmVGcm9tOiBJZ25vcmVWYWx1ZSwgdGFyZ2V0Tm9kZTogTm9kZSwgZWxlbWVudDogRWxlbWVudCkge1xuICAgIGlmICghaWdub3JlRnJvbSB8fCAhaXMuZWxlbWVudChlbGVtZW50KSkgeyByZXR1cm4gZmFsc2UgfVxuXG4gICAgaWYgKGlzLnN0cmluZyhpZ25vcmVGcm9tKSkge1xuICAgICAgcmV0dXJuIG1hdGNoZXNVcFRvKGVsZW1lbnQsIGlnbm9yZUZyb20sIHRhcmdldE5vZGUpXG4gICAgfVxuICAgIGVsc2UgaWYgKGlzLmVsZW1lbnQoaWdub3JlRnJvbSkpIHtcbiAgICAgIHJldHVybiBub2RlQ29udGFpbnMoaWdub3JlRnJvbSwgZWxlbWVudClcbiAgICB9XG5cbiAgICByZXR1cm4gZmFsc2VcbiAgfVxuXG4gIC8qKlxuICAgKiBDYWxscyBsaXN0ZW5lcnMgZm9yIHRoZSBnaXZlbiBJbnRlcmFjdEV2ZW50IHR5cGUgYm91bmQgZ2xvYmFsbHlcbiAgICogYW5kIGRpcmVjdGx5IHRvIHRoaXMgSW50ZXJhY3RhYmxlXG4gICAqXG4gICAqIEBwYXJhbSB7SW50ZXJhY3RFdmVudH0gaUV2ZW50IFRoZSBJbnRlcmFjdEV2ZW50IG9iamVjdCB0byBiZSBmaXJlZCBvbiB0aGlzXG4gICAqIEludGVyYWN0YWJsZVxuICAgKiBAcmV0dXJuIHtJbnRlcmFjdGFibGV9IHRoaXMgSW50ZXJhY3RhYmxlXG4gICAqL1xuICBmaXJlIChpRXZlbnQpIHtcbiAgICB0aGlzLmV2ZW50cy5maXJlKGlFdmVudClcblxuICAgIHJldHVybiB0aGlzXG4gIH1cblxuICBfb25PZmYgKG1ldGhvZDogJ29uJyB8ICdvZmYnLCB0eXBlQXJnOiBJbnRlcmFjdC5FdmVudFR5cGVzLCBsaXN0ZW5lckFyZz86IEludGVyYWN0Lkxpc3RlbmVyc0FyZyB8IG51bGwsIG9wdGlvbnM/OiBhbnkpIHtcbiAgICBpZiAoaXMub2JqZWN0KHR5cGVBcmcpICYmICFpcy5hcnJheSh0eXBlQXJnKSkge1xuICAgICAgb3B0aW9ucyA9IGxpc3RlbmVyQXJnXG4gICAgICBsaXN0ZW5lckFyZyA9IG51bGxcbiAgICB9XG5cbiAgICBjb25zdCBhZGRSZW1vdmUgPSBtZXRob2QgPT09ICdvbicgPyAnYWRkJyA6ICdyZW1vdmUnXG4gICAgY29uc3QgbGlzdGVuZXJzID0gbm9ybWFsaXplTGlzdGVuZXJzKHR5cGVBcmcsIGxpc3RlbmVyQXJnKVxuXG4gICAgZm9yIChsZXQgdHlwZSBpbiBsaXN0ZW5lcnMpIHtcbiAgICAgIGlmICh0eXBlID09PSAnd2hlZWwnKSB7IHR5cGUgPSBicm93c2VyLndoZWVsRXZlbnQgfVxuXG4gICAgICBmb3IgKGNvbnN0IGxpc3RlbmVyIG9mIGxpc3RlbmVyc1t0eXBlXSkge1xuICAgICAgICAvLyBpZiBpdCBpcyBhbiBhY3Rpb24gZXZlbnQgdHlwZVxuICAgICAgICBpZiAoYXJyLmNvbnRhaW5zKHRoaXMuX2FjdGlvbnMuZXZlbnRUeXBlcywgdHlwZSkpIHtcbiAgICAgICAgICB0aGlzLmV2ZW50c1ttZXRob2RdKHR5cGUsIGxpc3RlbmVyKVxuICAgICAgICB9XG4gICAgICAgIC8vIGRlbGVnYXRlZCBldmVudFxuICAgICAgICBlbHNlIGlmIChpcy5zdHJpbmcodGhpcy50YXJnZXQpKSB7XG4gICAgICAgICAgZXZlbnRzW2Ake2FkZFJlbW92ZX1EZWxlZ2F0ZWBdKHRoaXMudGFyZ2V0LCB0aGlzLl9jb250ZXh0LCB0eXBlLCBsaXN0ZW5lciwgb3B0aW9ucylcbiAgICAgICAgfVxuICAgICAgICAvLyByZW1vdmUgbGlzdGVuZXIgZnJvbSB0aGlzIEludGVyYXRhYmxlJ3MgZWxlbWVudFxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAoZXZlbnRzW2FkZFJlbW92ZV0gYXMgdHlwZW9mIGV2ZW50cy5yZW1vdmUpKHRoaXMudGFyZ2V0LCB0eXBlLCBsaXN0ZW5lciwgb3B0aW9ucylcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiB0aGlzXG4gIH1cblxuICAvKipcbiAgICogQmluZHMgYSBsaXN0ZW5lciBmb3IgYW4gSW50ZXJhY3RFdmVudCwgcG9pbnRlckV2ZW50IG9yIERPTSBldmVudC5cbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmcgfCBhcnJheSB8IG9iamVjdH0gdHlwZXMgVGhlIHR5cGVzIG9mIGV2ZW50cyB0byBsaXN0ZW5cbiAgICogZm9yXG4gICAqIEBwYXJhbSB7ZnVuY3Rpb24gfCBhcnJheSB8IG9iamVjdH0gW2xpc3RlbmVyXSBUaGUgZXZlbnQgbGlzdGVuZXIgZnVuY3Rpb24ocylcbiAgICogQHBhcmFtIHtvYmplY3QgfCBib29sZWFufSBbb3B0aW9uc10gb3B0aW9ucyBvYmplY3Qgb3IgdXNlQ2FwdHVyZSBmbGFnIGZvclxuICAgKiBhZGRFdmVudExpc3RlbmVyXG4gICAqIEByZXR1cm4ge0ludGVyYWN0YWJsZX0gVGhpcyBJbnRlcmFjdGFibGVcbiAgICovXG4gIG9uICh0eXBlczogSW50ZXJhY3QuRXZlbnRUeXBlcywgbGlzdGVuZXI/OiBJbnRlcmFjdC5MaXN0ZW5lcnNBcmcsIG9wdGlvbnM/OiBhbnkpIHtcbiAgICByZXR1cm4gdGhpcy5fb25PZmYoJ29uJywgdHlwZXMsIGxpc3RlbmVyLCBvcHRpb25zKVxuICB9XG5cbiAgLyoqXG4gICAqIFJlbW92ZXMgYW4gSW50ZXJhY3RFdmVudCwgcG9pbnRlckV2ZW50IG9yIERPTSBldmVudCBsaXN0ZW5lci5cbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmcgfCBhcnJheSB8IG9iamVjdH0gdHlwZXMgVGhlIHR5cGVzIG9mIGV2ZW50cyB0aGF0IHdlcmVcbiAgICogbGlzdGVuZWQgZm9yXG4gICAqIEBwYXJhbSB7ZnVuY3Rpb24gfCBhcnJheSB8IG9iamVjdH0gW2xpc3RlbmVyXSBUaGUgZXZlbnQgbGlzdGVuZXIgZnVuY3Rpb24ocylcbiAgICogQHBhcmFtIHtvYmplY3QgfCBib29sZWFufSBbb3B0aW9uc10gb3B0aW9ucyBvYmplY3Qgb3IgdXNlQ2FwdHVyZSBmbGFnIGZvclxuICAgKiByZW1vdmVFdmVudExpc3RlbmVyXG4gICAqIEByZXR1cm4ge0ludGVyYWN0YWJsZX0gVGhpcyBJbnRlcmFjdGFibGVcbiAgICovXG4gIG9mZiAodHlwZXM6IHN0cmluZyB8IHN0cmluZ1tdIHwgSW50ZXJhY3QuRXZlbnRUeXBlcywgbGlzdGVuZXI/OiBJbnRlcmFjdC5MaXN0ZW5lcnNBcmcsIG9wdGlvbnM/OiBhbnkpIHtcbiAgICByZXR1cm4gdGhpcy5fb25PZmYoJ29mZicsIHR5cGVzLCBsaXN0ZW5lciwgb3B0aW9ucylcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXNldCB0aGUgb3B0aW9ucyBvZiB0aGlzIEludGVyYWN0YWJsZVxuICAgKlxuICAgKiBAcGFyYW0ge29iamVjdH0gb3B0aW9ucyBUaGUgbmV3IHNldHRpbmdzIHRvIGFwcGx5XG4gICAqIEByZXR1cm4ge29iamVjdH0gVGhpcyBJbnRlcmFjdGFibGVcbiAgICovXG4gIHNldCAob3B0aW9uczogSW50ZXJhY3QuT3B0aW9uc0FyZykge1xuICAgIGNvbnN0IGRlZmF1bHRzID0gdGhpcy5fZGVmYXVsdHNcblxuICAgIGlmICghaXMub2JqZWN0KG9wdGlvbnMpKSB7XG4gICAgICBvcHRpb25zID0ge31cbiAgICB9XG5cbiAgICAodGhpcy5vcHRpb25zIGFzIFJlcXVpcmVkPE9wdGlvbnM+KSA9IGNsb25lKGRlZmF1bHRzLmJhc2UpIGFzIFJlcXVpcmVkPE9wdGlvbnM+XG5cbiAgICBmb3IgKGNvbnN0IGFjdGlvbk5hbWUgaW4gdGhpcy5fYWN0aW9ucy5tZXRob2REaWN0KSB7XG4gICAgICBjb25zdCBtZXRob2ROYW1lID0gdGhpcy5fYWN0aW9ucy5tZXRob2REaWN0W2FjdGlvbk5hbWVdXG5cbiAgICAgIHRoaXMub3B0aW9uc1thY3Rpb25OYW1lXSA9IHt9XG4gICAgICB0aGlzLnNldFBlckFjdGlvbihhY3Rpb25OYW1lLCBleHRlbmQoZXh0ZW5kKHt9LCBkZWZhdWx0cy5wZXJBY3Rpb24pLCBkZWZhdWx0cy5hY3Rpb25zW2FjdGlvbk5hbWVdKSlcblxuICAgICAgdGhpc1ttZXRob2ROYW1lXShvcHRpb25zW2FjdGlvbk5hbWVdKVxuICAgIH1cblxuICAgIGZvciAoY29uc3Qgc2V0dGluZyBpbiBvcHRpb25zKSB7XG4gICAgICBpZiAoaXMuZnVuYyh0aGlzW3NldHRpbmddKSkge1xuICAgICAgICB0aGlzW3NldHRpbmddKG9wdGlvbnNbc2V0dGluZ10pXG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXNcbiAgfVxuXG4gIC8qKlxuICAgKiBSZW1vdmUgdGhpcyBpbnRlcmFjdGFibGUgZnJvbSB0aGUgbGlzdCBvZiBpbnRlcmFjdGFibGVzIGFuZCByZW1vdmUgaXQnc1xuICAgKiBhY3Rpb24gY2FwYWJpbGl0aWVzIGFuZCBldmVudCBsaXN0ZW5lcnNcbiAgICpcbiAgICogQHJldHVybiB7aW50ZXJhY3R9XG4gICAqL1xuICB1bnNldCAoKSB7XG4gICAgZXZlbnRzLnJlbW92ZSh0aGlzLnRhcmdldCBhcyBOb2RlLCAnYWxsJylcblxuICAgIGlmIChpcy5zdHJpbmcodGhpcy50YXJnZXQpKSB7XG4gICAgICAvLyByZW1vdmUgZGVsZWdhdGVkIGV2ZW50c1xuICAgICAgZm9yIChjb25zdCB0eXBlIGluIGV2ZW50cy5kZWxlZ2F0ZWRFdmVudHMpIHtcbiAgICAgICAgY29uc3QgZGVsZWdhdGVkID0gZXZlbnRzLmRlbGVnYXRlZEV2ZW50c1t0eXBlXVxuXG4gICAgICAgIGlmIChkZWxlZ2F0ZWQuc2VsZWN0b3JzWzBdID09PSB0aGlzLnRhcmdldCAmJlxuICAgICAgICAgICAgZGVsZWdhdGVkLmNvbnRleHRzWzBdID09PSB0aGlzLl9jb250ZXh0KSB7XG4gICAgICAgICAgZGVsZWdhdGVkLnNlbGVjdG9ycy5zcGxpY2UoMCwgMSlcbiAgICAgICAgICBkZWxlZ2F0ZWQuY29udGV4dHMuc3BsaWNlKDAsIDEpXG4gICAgICAgICAgZGVsZWdhdGVkLmxpc3RlbmVycy5zcGxpY2UoMCwgMSlcblxuICAgICAgICAgIC8vIHJlbW92ZSB0aGUgYXJyYXlzIGlmIHRoZXkgYXJlIGVtcHR5XG4gICAgICAgICAgaWYgKCFkZWxlZ2F0ZWQuc2VsZWN0b3JzLmxlbmd0aCkge1xuICAgICAgICAgICAgZGVsZWdhdGVkW3R5cGVdID0gbnVsbFxuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGV2ZW50cy5yZW1vdmUodGhpcy5fY29udGV4dCwgdHlwZSwgZXZlbnRzLmRlbGVnYXRlTGlzdGVuZXIpXG4gICAgICAgIGV2ZW50cy5yZW1vdmUodGhpcy5fY29udGV4dCwgdHlwZSwgZXZlbnRzLmRlbGVnYXRlVXNlQ2FwdHVyZSwgdHJ1ZSlcbiAgICAgIH1cbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICBldmVudHMucmVtb3ZlKHRoaXMudGFyZ2V0IGFzIE5vZGUsICdhbGwnKVxuICAgIH1cbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBJbnRlcmFjdGFibGVcbiJdfQ==