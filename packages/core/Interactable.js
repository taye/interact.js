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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiSW50ZXJhY3RhYmxlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiSW50ZXJhY3RhYmxlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sS0FBSyxHQUFHLE1BQU0sdUJBQXVCLENBQUE7QUFDNUMsT0FBTyxPQUFPLE1BQU0sMkJBQTJCLENBQUE7QUFDL0MsT0FBTyxLQUFLLE1BQU0seUJBQXlCLENBQUE7QUFDM0MsT0FBTyxFQUFFLGNBQWMsRUFBRSxZQUFZLEVBQUUsV0FBVyxFQUFFLE1BQU0sNEJBQTRCLENBQUE7QUFDdEYsT0FBTyxNQUFNLE1BQU0sMEJBQTBCLENBQUE7QUFDN0MsT0FBTyxNQUFNLE1BQU0sMEJBQTBCLENBQUE7QUFDN0MsT0FBTyxLQUFLLEVBQUUsTUFBTSxzQkFBc0IsQ0FBQTtBQUMxQyxPQUFPLGtCQUFrQixNQUFNLHNDQUFzQyxDQUFBO0FBQ3JFLE9BQU8sRUFBRSxTQUFTLEVBQUUsTUFBTSwwQkFBMEIsQ0FBQTtBQUVwRCxPQUFPLFNBQVMsTUFBTSxhQUFhLENBQUE7QUFHbkMsTUFBTTtBQUNOLE1BQU0sT0FBTyxZQUFZO0lBaUJ2QixNQUFNO0lBQ04sWUFBYSxNQUF1QixFQUFFLE9BQVksRUFBRSxjQUE4QjtRQU56RSxXQUFNLEdBQUcsSUFBSSxTQUFTLEVBQUUsQ0FBQTtRQU8vQixJQUFJLENBQUMsUUFBUSxHQUFHLE9BQU8sQ0FBQyxPQUFPLENBQUE7UUFDL0IsSUFBSSxDQUFDLE1BQU0sR0FBSyxNQUFNLENBQUE7UUFDdEIsSUFBSSxDQUFDLFFBQVEsR0FBRyxPQUFPLENBQUMsT0FBTyxJQUFJLGNBQWMsQ0FBQTtRQUNqRCxJQUFJLENBQUMsSUFBSSxHQUFPLFNBQVMsQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFBO1FBQ3ZFLElBQUksQ0FBQyxJQUFJLEdBQU8sSUFBSSxDQUFDLElBQUksQ0FB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USxFQUFFO29CQUMzQyxTQUFTLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUE7b0JBQ2hDLFNBQVMsQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQTtvQkFDL0IsU0FBUyxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFBO29CQUVoQyxzQ0FBc0M7b0JBQ3RDLElBQUksQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLE1BQU0sRUFBRTt3QkFDL0IsU0FBUyxDQUFDLElBQUksQ0FBQyxHQUFHLElBQUksQ0FBQTtxQkFDdkI7aUJBQ0Y7Z0JBRUQsTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLElBQUksRUFBRSxNQUFNLENBQUMsZ0JBQWdCLENBQUMsQ0FBQTtnQkFDM0QsTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLElBQUksRUFBRSxNQUFNLENBQUMsa0JBQWtCLEVBQUUsSUFBSSxDQUFDLENBQUE7YUFDcEU7U0FDRjthQUNJO1lBQ0gsTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsTUFBYyxFQUFFLEtBQUssQ0FBQyxDQUFBO1NBQzFDO0lBQ0gsQ0FBQztDQUNGO0FBRUQsZUFBZSxZQUFZLENBQUEiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBhcnIgZnJvbSAnQGludGVyYWN0anMvdXRpbHMvYXJyJ1xuaW1wb3J0IGJyb3dzZXIgZnJvbSAnQGludGVyYWN0anMvdXRpbHMvYnJvd3NlcidcbmltcG9ydCBjbG9uZSBmcm9tICdAaW50ZXJhY3Rqcy91dGlscy9jbG9uZSdcbmltcG9ydCB7IGdldEVsZW1lbnRSZWN0LCBub2RlQ29udGFpbnMsIHRyeVNlbGVjdG9yIH0gZnJvbSAnQGludGVyYWN0anMvdXRpbHMvZG9tVXRpbHMnXG5pbXBvcnQgZXZlbnRzIGZyb20gJ0BpbnRlcmFjdGpzL3V0aWxzL2V2ZW50cydcbmltcG9ydCBleHRlbmQgZnJvbSAnQGludGVyYWN0anMvdXRpbHMvZXh0ZW5kJ1xuaW1wb3J0ICogYXMgaXMgZnJvbSAnQGludGVyYWN0anMvdXRpbHMvaXMnXG5pbXBvcnQgbm9ybWFsaXplTGlzdGVuZXJzIGZyb20gJ0BpbnRlcmFjdGpzL3V0aWxzL25vcm1hbGl6ZUxpc3RlbmVycydcbmltcG9ydCB7IGdldFdpbmRvdyB9IGZyb20gJ0BpbnRlcmFjdGpzL3V0aWxzL3dpbmRvdydcbmltcG9ydCB7IERlZmF1bHRzLCBPcHRpb25zIH0gZnJvbSAnLi9kZWZhdWx0T3B0aW9ucydcbmltcG9ydCBFdmVudGFibGUgZnJvbSAnLi9FdmVudGFibGUnXG5pbXBvcnQgeyBBY3Rpb25zIH0gZnJvbSAnLi9zY29wZSdcblxuLyoqICovXG5leHBvcnQgY2xhc3MgSW50ZXJhY3RhYmxlIGltcGxlbWVudHMgUGFydGlhbDxFdmVudGFibGU+IHtcbiAgcHJvdGVjdGVkIGdldCBfZGVmYXVsdHMgKCk6IERlZmF1bHRzIHtcbiAgICByZXR1cm4ge1xuICAgICAgYmFzZToge30sXG4gICAgICBwZXJBY3Rpb246IHt9LFxuICAgICAgYWN0aW9uczoge30sXG4gICAgfVxuICB9XG5cbiAgb3B0aW9ucyE6IFJlcXVpcmVkPE9wdGlvbnM+XG4gIHJlYWRvbmx5IF9hY3Rpb25zOiBBY3Rpb25zXG4gIHJlYWRvbmx5IHRhcmdldDogSW50ZXJhY3QuVGFyZ2V0XG4gIHJlYWRvbmx5IGV2ZW50cyA9IG5ldyBFdmVudGFibGUoKVxuICByZWFkb25seSBfY29udGV4dDogRWxlbWVudFxuICByZWFkb25seSBfd2luOiBXaW5kb3dcbiAgcmVhZG9ubHkgX2RvYzogRG9jdW1lbnRcblxuICAvKiogKi9cbiAgY29uc3RydWN0b3IgKHRhcmdldDogSW50ZXJhY3QuVGFyZ2V0LCBvcHRpb25zOiBhbnksIGRlZmF1bHRDb250ZXh0OiBFbGVtZW50IHwgTm9kZSkge1xuICAgIHRoaXMuX2FjdGlvbnMgPSBvcHRpb25zLmFjdGlvbnNcbiAgICB0aGlzLnRhcmdldCAgID0gdGFyZ2V0XG4gICAgdGhpcy5fY29udGV4dCA9IG9wdGlvbnMuY29udGV4dCB8fCBkZWZhdWx0Q29udGV4dFxuICAgIHRoaXMuX3dpbiAgICAgPSBnZXRXaW5kb3codHJ5U2VsZWN0b3IodGFyZ2V0KSA/IHRoaXMuX2NvbnRleHQgOiB0YXJnZXQpXG4gICAgdGhpcy5fZG9jICAgICA9IHRoaXMuX3dpbi5kb2N1bWVudFxuXG4gICAgdGhpcy5zZXQob3B0aW9ucylcbiAgfVxuXG4gIHNldE9uRXZlbnRzIChhY3Rpb25OYW1lOiBzdHJpbmcsIHBoYXNlczogeyBbcGhhc2U6IHN0cmluZ106IEludGVyYWN0Lkxpc3RlbmVyc0FyZyB9KSB7XG4gICAgaWYgKGlzLmZ1bmMocGhhc2VzLm9uc3RhcnQpKSB7IHRoaXMub24oYCR7YWN0aW9uTmFtZX1zdGFydGAsIHBoYXNlcy5vbnN0YXJ0KSB9XG4gICAgaWYgKGlzLmZ1bmMocGhhc2VzLm9ubW92ZSkpIHsgdGhpcy5vbihgJHthY3Rpb25OYW1lfW1vdmVgLCBwaGFzZXMub25tb3ZlKSB9XG4gICAgaWYgKGlzLmZ1bmMocGhhc2VzLm9uZW5kKSkgeyB0aGlzLm9uKGAke2FjdGlvbk5hbWV9ZW5kYCwgcGhhc2VzLm9uZW5kKSB9XG4gICAgaWYgKGlzLmZ1bmMocGhhc2VzLm9uaW5lcnRpYXN0YXJ0KSkgeyB0aGlzLm9uKGAke2FjdGlvbk5hbWV9aW5lcnRpYXN0YXJ0YCwgcGhhc2VzLm9uaW5lcnRpYXN0YXJ0KSB9XG5cbiAgICByZXR1cm4gdGhpc1xuICB9XG5cbiAgdXBkYXRlUGVyQWN0aW9uTGlzdGVuZXJzIChhY3Rpb25OYW1lLCBwcmV2LCBjdXIpIHtcbiAgICBpZiAoaXMuYXJyYXkocHJldikpIHtcbiAgICAgIHRoaXMub2ZmKGFjdGlvbk5hbWUsIHByZXYpXG4gICAgfVxuXG4gICAgaWYgKGlzLmFycmF5KGN1cikpIHtcbiAgICAgIHRoaXMub24oYWN0aW9uTmFtZSwgY3VyKVxuICAgIH1cbiAgfVxuXG4gIHNldFBlckFjdGlvbiAoYWN0aW9uTmFtZSwgb3B0aW9uczogSW50ZXJhY3QuT3JCb29sZWFuPE9wdGlvbnM+KSB7XG4gICAgY29uc3QgZGVmYXVsdHMgPSB0aGlzLl9kZWZhdWx0c1xuXG4gICAgLy8gZm9yIGFsbCB0aGUgZGVmYXVsdCBwZXItYWN0aW9uIG9wdGlvbnNcbiAgICBmb3IgKGNvbnN0IG9wdGlvbk5hbWUgaW4gb3B0aW9ucykge1xuICAgICAgY29uc3QgYWN0aW9uT3B0aW9ucyA9IHRoaXMub3B0aW9uc1thY3Rpb25OYW1lXVxuICAgICAgY29uc3Qgb3B0aW9uVmFsdWUgPSBvcHRpb25zW29wdGlvbk5hbWVdXG4gICAgICBjb25zdCBpc0FycmF5ID0gaXMuYXJyYXkob3B0aW9uVmFsdWUpXG5cbiAgICAgIC8vIHJlbW92ZSBvbGQgZXZlbnQgbGlzdGVuZXJzIGFuZCBhZGQgbmV3IG9uZXNcbiAgICAgIGlmIChvcHRpb25OYW1lID09PSAnbGlzdGVuZXJzJykge1xuICAgICAgICB0aGlzLnVwZGF0ZVBlckFjdGlvbkxpc3RlbmVycyhhY3Rpb25OYW1lLCBhY3Rpb25PcHRpb25zLmxpc3RlbmVycywgb3B0aW9uVmFsdWUpXG4gICAgICB9XG5cbiAgICAgIC8vIGlmIHRoZSBvcHRpb24gdmFsdWUgaXMgYW4gYXJyYXlcbiAgICAgIGlmIChpc0FycmF5KSB7XG4gICAgICAgIGFjdGlvbk9wdGlvbnNbb3B0aW9uTmFtZV0gPSBhcnIuZnJvbShvcHRpb25WYWx1ZSlcbiAgICAgIH1cbiAgICAgIC8vIGlmIHRoZSBvcHRpb24gdmFsdWUgaXMgYW4gb2JqZWN0XG4gICAgICBlbHNlIGlmICghaXNBcnJheSAmJiBpcy5wbGFpbk9iamVjdChvcHRpb25WYWx1ZSkpIHtcbiAgICAgICAgLy8gY29weSB0aGUgb2JqZWN0XG4gICAgICAgIGFjdGlvbk9wdGlvbnNbb3B0aW9uTmFtZV0gPSBleHRlbmQoXG4gICAgICAgICAgYWN0aW9uT3B0aW9uc1tvcHRpb25OYW1lXSB8fCB7fSxcbiAgICAgICAgICBjbG9uZShvcHRpb25WYWx1ZSkpXG5cbiAgICAgICAgLy8gc2V0IGFuYWJsZWQgZmllbGQgdG8gdHJ1ZSBpZiBpdCBleGlzdHMgaW4gdGhlIGRlZmF1bHRzXG4gICAgICAgIGlmIChpcy5vYmplY3QoZGVmYXVsdHMucGVyQWN0aW9uW29wdGlvbk5hbWVdKSAmJiAnZW5hYmxlZCcgaW4gZGVmYXVsdHMucGVyQWN0aW9uW29wdGlvbk5hbWVdKSB7XG4gICAgICAgICAgYWN0aW9uT3B0aW9uc1tvcHRpb25OYW1lXS5lbmFibGVkID0gb3B0aW9uVmFsdWUuZW5hYmxlZCAhPT0gZmFsc2VcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgLy8gaWYgdGhlIG9wdGlvbiB2YWx1ZSBpcyBhIGJvb2xlYW4gYW5kIHRoZSBkZWZhdWx0IGlzIGFuIG9iamVjdFxuICAgICAgZWxzZSBpZiAoaXMuYm9vbChvcHRpb25WYWx1ZSkgJiYgaXMub2JqZWN0KGRlZmF1bHRzLnBlckFjdGlvbltvcHRpb25OYW1lXSkpIHtcbiAgICAgICAgYWN0aW9uT3B0aW9uc1tvcHRpb25OYW1lXS5lbmFibGVkID0gb3B0aW9uVmFsdWVcbiAgICAgIH1cbiAgICAgIC8vIGlmIGl0J3MgYW55dGhpbmcgZWxzZSwgZG8gYSBwbGFpbiBhc3NpZ25tZW50XG4gICAgICBlbHNlIHtcbiAgICAgICAgYWN0aW9uT3B0aW9uc1tvcHRpb25OYW1lXSA9IG9wdGlvblZhbHVlXG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFRoZSBkZWZhdWx0IGZ1bmN0aW9uIHRvIGdldCBhbiBJbnRlcmFjdGFibGVzIGJvdW5kaW5nIHJlY3QuIENhbiBiZVxuICAgKiBvdmVycmlkZGVuIHVzaW5nIHtAbGluayBJbnRlcmFjdGFibGUucmVjdENoZWNrZXJ9LlxuICAgKlxuICAgKiBAcGFyYW0ge0VsZW1lbnR9IFtlbGVtZW50XSBUaGUgZWxlbWVudCB0byBtZWFzdXJlLlxuICAgKiBAcmV0dXJuIHtvYmplY3R9IFRoZSBvYmplY3QncyBib3VuZGluZyByZWN0YW5nbGUuXG4gICAqL1xuICBnZXRSZWN0IChlbGVtZW50OiBFbGVtZW50KSB7XG4gICAgZWxlbWVudCA9IGVsZW1lbnQgfHwgKGlzLmVsZW1lbnQodGhpcy50YXJnZXQpXG4gICAgICA/IHRoaXMudGFyZ2V0XG4gICAgICA6IG51bGwpXG5cbiAgICBpZiAoaXMuc3RyaW5nKHRoaXMudGFyZ2V0KSkge1xuICAgICAgZWxlbWVudCA9IGVsZW1lbnQgfHwgdGhpcy5fY29udGV4dC5xdWVyeVNlbGVjdG9yKHRoaXMudGFyZ2V0KVxuICAgIH1cblxuICAgIHJldHVybiBnZXRFbGVtZW50UmVjdChlbGVtZW50KVxuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgb3Igc2V0cyB0aGUgZnVuY3Rpb24gdXNlZCB0byBjYWxjdWxhdGUgdGhlIGludGVyYWN0YWJsZSdzXG4gICAqIGVsZW1lbnQncyByZWN0YW5nbGVcbiAgICpcbiAgICogQHBhcmFtIHtmdW5jdGlvbn0gW2NoZWNrZXJdIEEgZnVuY3Rpb24gd2hpY2ggcmV0dXJucyB0aGlzIEludGVyYWN0YWJsZSdzXG4gICAqIGJvdW5kaW5nIHJlY3RhbmdsZS4gU2VlIHtAbGluayBJbnRlcmFjdGFibGUuZ2V0UmVjdH1cbiAgICogQHJldHVybiB7ZnVuY3Rpb24gfCBvYmplY3R9IFRoZSBjaGVja2VyIGZ1bmN0aW9uIG9yIHRoaXMgSW50ZXJhY3RhYmxlXG4gICAqL1xuICByZWN0Q2hlY2tlciAoY2hlY2tlcjogKGVsZW1lbnQ6IEVsZW1lbnQpID0+IGFueSkge1xuICAgIGlmIChpcy5mdW5jKGNoZWNrZXIpKSB7XG4gICAgICB0aGlzLmdldFJlY3QgPSBjaGVja2VyXG5cbiAgICAgIHJldHVybiB0aGlzXG4gICAgfVxuXG4gICAgaWYgKGNoZWNrZXIgPT09IG51bGwpIHtcbiAgICAgIGRlbGV0ZSB0aGlzLm9wdGlvbnMuZ2V0UmVjdFxuXG4gICAgICByZXR1cm4gdGhpc1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzLmdldFJlY3RcbiAgfVxuXG4gIF9iYWNrQ29tcGF0T3B0aW9uIChvcHRpb25OYW1lLCBuZXdWYWx1ZSkge1xuICAgIGlmICh0cnlTZWxlY3RvcihuZXdWYWx1ZSkgfHwgaXMub2JqZWN0KG5ld1ZhbHVlKSkge1xuICAgICAgdGhpcy5vcHRpb25zW29wdGlvbk5hbWVdID0gbmV3VmFsdWVcblxuICAgICAgZm9yIChjb25zdCBhY3Rpb24gb2YgdGhpcy5fYWN0aW9ucy5uYW1lcykge1xuICAgICAgICB0aGlzLm9wdGlvbnNbYWN0aW9uXVtvcHRpb25OYW1lXSA9IG5ld1ZhbHVlXG4gICAgICB9XG5cbiAgICAgIHJldHVybiB0aGlzXG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXMub3B0aW9uc1tvcHRpb25OYW1lXVxuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgb3Igc2V0cyB0aGUgb3JpZ2luIG9mIHRoZSBJbnRlcmFjdGFibGUncyBlbGVtZW50LiAgVGhlIHggYW5kIHlcbiAgICogb2YgdGhlIG9yaWdpbiB3aWxsIGJlIHN1YnRyYWN0ZWQgZnJvbSBhY3Rpb24gZXZlbnQgY29vcmRpbmF0ZXMuXG4gICAqXG4gICAqIEBwYXJhbSB7RWxlbWVudCB8IG9iamVjdCB8IHN0cmluZ30gW29yaWdpbl0gQW4gSFRNTCBvciBTVkcgRWxlbWVudCB3aG9zZVxuICAgKiByZWN0IHdpbGwgYmUgdXNlZCwgYW4gb2JqZWN0IGVnLiB7IHg6IDAsIHk6IDAgfSBvciBzdHJpbmcgJ3BhcmVudCcsICdzZWxmJ1xuICAgKiBvciBhbnkgQ1NTIHNlbGVjdG9yXG4gICAqXG4gICAqIEByZXR1cm4ge29iamVjdH0gVGhlIGN1cnJlbnQgb3JpZ2luIG9yIHRoaXMgSW50ZXJhY3RhYmxlXG4gICAqL1xuICBvcmlnaW4gKG5ld1ZhbHVlKSB7XG4gICAgcmV0dXJuIHRoaXMuX2JhY2tDb21wYXRPcHRpb24oJ29yaWdpbicsIG5ld1ZhbHVlKVxuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgb3Igc2V0cyB0aGUgbW91c2UgY29vcmRpbmF0ZSB0eXBlcyB1c2VkIHRvIGNhbGN1bGF0ZSB0aGVcbiAgICogbW92ZW1lbnQgb2YgdGhlIHBvaW50ZXIuXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBbbmV3VmFsdWVdIFVzZSAnY2xpZW50JyBpZiB5b3Ugd2lsbCBiZSBzY3JvbGxpbmcgd2hpbGVcbiAgICogaW50ZXJhY3Rpbmc7IFVzZSAncGFnZScgaWYgeW91IHdhbnQgYXV0b1Njcm9sbCB0byB3b3JrXG4gICAqIEByZXR1cm4ge3N0cmluZyB8IG9iamVjdH0gVGhlIGN1cnJlbnQgZGVsdGFTb3VyY2Ugb3IgdGhpcyBJbnRlcmFjdGFibGVcbiAgICovXG4gIGRlbHRhU291cmNlIChuZXdWYWx1ZSkge1xuICAgIGlmIChuZXdWYWx1ZSA9PT0gJ3BhZ2UnIHx8IG5ld1ZhbHVlID09PSAnY2xpZW50Jykge1xuICAgICAgdGhpcy5vcHRpb25zLmRlbHRhU291cmNlID0gbmV3VmFsdWVcblxuICAgICAgcmV0dXJuIHRoaXNcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy5vcHRpb25zLmRlbHRhU291cmNlXG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgc2VsZWN0b3IgY29udGV4dCBOb2RlIG9mIHRoZSBJbnRlcmFjdGFibGUuIFRoZSBkZWZhdWx0IGlzXG4gICAqIGB3aW5kb3cuZG9jdW1lbnRgLlxuICAgKlxuICAgKiBAcmV0dXJuIHtOb2RlfSBUaGUgY29udGV4dCBOb2RlIG9mIHRoaXMgSW50ZXJhY3RhYmxlXG4gICAqL1xuICBjb250ZXh0ICgpIHtcbiAgICByZXR1cm4gdGhpcy5fY29udGV4dFxuICB9XG5cbiAgaW5Db250ZXh0IChlbGVtZW50KSB7XG4gICAgcmV0dXJuICh0aGlzLl9jb250ZXh0ID09PSBlbGVtZW50Lm93bmVyRG9jdW1lbnQgfHxcbiAgICAgICAgICAgIG5vZGVDb250YWlucyh0aGlzLl9jb250ZXh0LCBlbGVtZW50KSlcbiAgfVxuXG4gIC8qKlxuICAgKiBDYWxscyBsaXN0ZW5lcnMgZm9yIHRoZSBnaXZlbiBJbnRlcmFjdEV2ZW50IHR5cGUgYm91bmQgZ2xvYmFsbHlcbiAgICogYW5kIGRpcmVjdGx5IHRvIHRoaXMgSW50ZXJhY3RhYmxlXG4gICAqXG4gICAqIEBwYXJhbSB7SW50ZXJhY3RFdmVudH0gaUV2ZW50IFRoZSBJbnRlcmFjdEV2ZW50IG9iamVjdCB0byBiZSBmaXJlZCBvbiB0aGlzXG4gICAqIEludGVyYWN0YWJsZVxuICAgKiBAcmV0dXJuIHtJbnRlcmFjdGFibGV9IHRoaXMgSW50ZXJhY3RhYmxlXG4gICAqL1xuICBmaXJlIChpRXZlbnQpIHtcbiAgICB0aGlzLmV2ZW50cy5maXJlKGlFdmVudClcblxuICAgIHJldHVybiB0aGlzXG4gIH1cblxuICBfb25PZmYgKG1ldGhvZDogJ29uJyB8ICdvZmYnLCB0eXBlQXJnOiBJbnRlcmFjdC5FdmVudFR5cGVzLCBsaXN0ZW5lckFyZz86IEludGVyYWN0Lkxpc3RlbmVyc0FyZyB8IG51bGwsIG9wdGlvbnM/OiBhbnkpIHtcbiAgICBpZiAoaXMub2JqZWN0KHR5cGVBcmcpICYmICFpcy5hcnJheSh0eXBlQXJnKSkge1xuICAgICAgb3B0aW9ucyA9IGxpc3RlbmVyQXJnXG4gICAgICBsaXN0ZW5lckFyZyA9IG51bGxcbiAgICB9XG5cbiAgICBjb25zdCBhZGRSZW1vdmUgPSBtZXRob2QgPT09ICdvbicgPyAnYWRkJyA6ICdyZW1vdmUnXG4gICAgY29uc3QgbGlzdGVuZXJzID0gbm9ybWFsaXplTGlzdGVuZXJzKHR5cGVBcmcsIGxpc3RlbmVyQXJnKVxuXG4gICAgZm9yIChsZXQgdHlwZSBpbiBsaXN0ZW5lcnMpIHtcbiAgICAgIGlmICh0eXBlID09PSAnd2hlZWwnKSB7IHR5cGUgPSBicm93c2VyLndoZWVsRXZlbnQgfVxuXG4gICAgICBmb3IgKGNvbnN0IGxpc3RlbmVyIG9mIGxpc3RlbmVyc1t0eXBlXSkge1xuICAgICAgICAvLyBpZiBpdCBpcyBhbiBhY3Rpb24gZXZlbnQgdHlwZVxuICAgICAgICBpZiAoYXJyLmNvbnRhaW5zKHRoaXMuX2FjdGlvbnMuZXZlbnRUeXBlcywgdHlwZSkpIHtcbiAgICAgICAgICB0aGlzLmV2ZW50c1ttZXRob2RdKHR5cGUsIGxpc3RlbmVyKVxuICAgICAgICB9XG4gICAgICAgIC8vIGRlbGVnYXRlZCBldmVudFxuICAgICAgICBlbHNlIGlmIChpcy5zdHJpbmcodGhpcy50YXJnZXQpKSB7XG4gICAgICAgICAgZXZlbnRzW2Ake2FkZFJlbW92ZX1EZWxlZ2F0ZWBdKHRoaXMudGFyZ2V0LCB0aGlzLl9jb250ZXh0LCB0eXBlLCBsaXN0ZW5lciwgb3B0aW9ucylcbiAgICAgICAgfVxuICAgICAgICAvLyByZW1vdmUgbGlzdGVuZXIgZnJvbSB0aGlzIEludGVyYXRhYmxlJ3MgZWxlbWVudFxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAoZXZlbnRzW2FkZFJlbW92ZV0gYXMgdHlwZW9mIGV2ZW50cy5yZW1vdmUpKHRoaXMudGFyZ2V0LCB0eXBlLCBsaXN0ZW5lciwgb3B0aW9ucylcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiB0aGlzXG4gIH1cblxuICAvKipcbiAgICogQmluZHMgYSBsaXN0ZW5lciBmb3IgYW4gSW50ZXJhY3RFdmVudCwgcG9pbnRlckV2ZW50IG9yIERPTSBldmVudC5cbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmcgfCBhcnJheSB8IG9iamVjdH0gdHlwZXMgVGhlIHR5cGVzIG9mIGV2ZW50cyB0byBsaXN0ZW5cbiAgICogZm9yXG4gICAqIEBwYXJhbSB7ZnVuY3Rpb24gfCBhcnJheSB8IG9iamVjdH0gW2xpc3RlbmVyXSBUaGUgZXZlbnQgbGlzdGVuZXIgZnVuY3Rpb24ocylcbiAgICogQHBhcmFtIHtvYmplY3QgfCBib29sZWFufSBbb3B0aW9uc10gb3B0aW9ucyBvYmplY3Qgb3IgdXNlQ2FwdHVyZSBmbGFnIGZvclxuICAgKiBhZGRFdmVudExpc3RlbmVyXG4gICAqIEByZXR1cm4ge0ludGVyYWN0YWJsZX0gVGhpcyBJbnRlcmFjdGFibGVcbiAgICovXG4gIG9uICh0eXBlczogSW50ZXJhY3QuRXZlbnRUeXBlcywgbGlzdGVuZXI/OiBJbnRlcmFjdC5MaXN0ZW5lcnNBcmcsIG9wdGlvbnM/OiBhbnkpIHtcbiAgICByZXR1cm4gdGhpcy5fb25PZmYoJ29uJywgdHlwZXMsIGxpc3RlbmVyLCBvcHRpb25zKVxuICB9XG5cbiAgLyoqXG4gICAqIFJlbW92ZXMgYW4gSW50ZXJhY3RFdmVudCwgcG9pbnRlckV2ZW50IG9yIERPTSBldmVudCBsaXN0ZW5lci5cbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmcgfCBhcnJheSB8IG9iamVjdH0gdHlwZXMgVGhlIHR5cGVzIG9mIGV2ZW50cyB0aGF0IHdlcmVcbiAgICogbGlzdGVuZWQgZm9yXG4gICAqIEBwYXJhbSB7ZnVuY3Rpb24gfCBhcnJheSB8IG9iamVjdH0gW2xpc3RlbmVyXSBUaGUgZXZlbnQgbGlzdGVuZXIgZnVuY3Rpb24ocylcbiAgICogQHBhcmFtIHtvYmplY3QgfCBib29sZWFufSBbb3B0aW9uc10gb3B0aW9ucyBvYmplY3Qgb3IgdXNlQ2FwdHVyZSBmbGFnIGZvclxuICAgKiByZW1vdmVFdmVudExpc3RlbmVyXG4gICAqIEByZXR1cm4ge0ludGVyYWN0YWJsZX0gVGhpcyBJbnRlcmFjdGFibGVcbiAgICovXG4gIG9mZiAodHlwZXM6IHN0cmluZyB8IHN0cmluZ1tdIHwgSW50ZXJhY3QuRXZlbnRUeXBlcywgbGlzdGVuZXI/OiBJbnRlcmFjdC5MaXN0ZW5lcnNBcmcsIG9wdGlvbnM/OiBhbnkpIHtcbiAgICByZXR1cm4gdGhpcy5fb25PZmYoJ29mZicsIHR5cGVzLCBsaXN0ZW5lciwgb3B0aW9ucylcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXNldCB0aGUgb3B0aW9ucyBvZiB0aGlzIEludGVyYWN0YWJsZVxuICAgKlxuICAgKiBAcGFyYW0ge29iamVjdH0gb3B0aW9ucyBUaGUgbmV3IHNldHRpbmdzIHRvIGFwcGx5XG4gICAqIEByZXR1cm4ge29iamVjdH0gVGhpcyBJbnRlcmFjdGFibGVcbiAgICovXG4gIHNldCAob3B0aW9uczogSW50ZXJhY3QuT3B0aW9uc0FyZykge1xuICAgIGNvbnN0IGRlZmF1bHRzID0gdGhpcy5fZGVmYXVsdHNcblxuICAgIGlmICghaXMub2JqZWN0KG9wdGlvbnMpKSB7XG4gICAgICBvcHRpb25zID0ge31cbiAgICB9XG5cbiAgICB0aGlzLm9wdGlvbnMgPSBjbG9uZShkZWZhdWx0cy5iYXNlKSBhcyBSZXF1aXJlZDxPcHRpb25zPlxuXG4gICAgZm9yIChjb25zdCBhY3Rpb25OYW1lIGluIHRoaXMuX2FjdGlvbnMubWV0aG9kRGljdCkge1xuICAgICAgY29uc3QgbWV0aG9kTmFtZSA9IHRoaXMuX2FjdGlvbnMubWV0aG9kRGljdFthY3Rpb25OYW1lXVxuXG4gICAgICB0aGlzLm9wdGlvbnNbYWN0aW9uTmFtZV0gPSB7fVxuICAgICAgdGhpcy5zZXRQZXJBY3Rpb24oYWN0aW9uTmFtZSwgZXh0ZW5kKGV4dGVuZCh7fSwgZGVmYXVsdHMucGVyQWN0aW9uKSwgZGVmYXVsdHMuYWN0aW9uc1thY3Rpb25OYW1lXSkpXG5cbiAgICAgIHRoaXNbbWV0aG9kTmFtZV0ob3B0aW9uc1thY3Rpb25OYW1lXSlcbiAgICB9XG5cbiAgICBmb3IgKGNvbnN0IHNldHRpbmcgaW4gb3B0aW9ucykge1xuICAgICAgaWYgKGlzLmZ1bmModGhpc1tzZXR0aW5nXSkpIHtcbiAgICAgICAgdGhpc1tzZXR0aW5nXShvcHRpb25zW3NldHRpbmddKVxuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiB0aGlzXG4gIH1cblxuICAvKipcbiAgICogUmVtb3ZlIHRoaXMgaW50ZXJhY3RhYmxlIGZyb20gdGhlIGxpc3Qgb2YgaW50ZXJhY3RhYmxlcyBhbmQgcmVtb3ZlIGl0J3NcbiAgICogYWN0aW9uIGNhcGFiaWxpdGllcyBhbmQgZXZlbnQgbGlzdGVuZXJzXG4gICAqXG4gICAqIEByZXR1cm4ge2ludGVyYWN0fVxuICAgKi9cbiAgdW5zZXQgKCkge1xuICAgIGV2ZW50cy5yZW1vdmUodGhpcy50YXJnZXQgYXMgTm9kZSwgJ2FsbCcpXG5cbiAgICBpZiAoaXMuc3RyaW5nKHRoaXMudGFyZ2V0KSkge1xuICAgICAgLy8gcmVtb3ZlIGRlbGVnYXRlZCBldmVudHNcbiAgICAgIGZvciAoY29uc3QgdHlwZSBpbiBldmVudHMuZGVsZWdhdGVkRXZlbnRzKSB7XG4gICAgICAgIGNvbnN0IGRlbGVnYXRlZCA9IGV2ZW50cy5kZWxlZ2F0ZWRFdmVudHNbdHlwZV1cblxuICAgICAgICBpZiAoZGVsZWdhdGVkLnNlbGVjdG9yc1swXSA9PT0gdGhpcy50YXJnZXQgJiZcbiAgICAgICAgICAgIGRlbGVnYXRlZC5jb250ZXh0c1swXSA9PT0gdGhpcy5fY29udGV4dCkge1xuICAgICAgICAgIGRlbGVnYXRlZC5zZWxlY3RvcnMuc3BsaWNlKDAsIDEpXG4gICAgICAgICAgZGVsZWdhdGVkLmNvbnRleHRzLnNwbGljZSgwLCAxKVxuICAgICAgICAgIGRlbGVnYXRlZC5saXN0ZW5lcnMuc3BsaWNlKDAsIDEpXG5cbiAgICAgICAgICAvLyByZW1vdmUgdGhlIGFycmF5cyBpZiB0aGV5IGFyZSBlbXB0eVxuICAgICAgICAgIGlmICghZGVsZWdhdGVkLnNlbGVjdG9ycy5sZW5ndGgpIHtcbiAgICAgICAgICAgIGRlbGVnYXRlZFt0eXBlXSA9IG51bGxcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBldmVudHMucmVtb3ZlKHRoaXMuX2NvbnRleHQsIHR5cGUsIGV2ZW50cy5kZWxlZ2F0ZUxpc3RlbmVyKVxuICAgICAgICBldmVudHMucmVtb3ZlKHRoaXMuX2NvbnRleHQsIHR5cGUsIGV2ZW50cy5kZWxlZ2F0ZVVzZUNhcHR1cmUsIHRydWUpXG4gICAgICB9XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgZXZlbnRzLnJlbW92ZSh0aGlzLnRhcmdldCBhcyBOb2RlLCAnYWxsJylcbiAgICB9XG4gIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgSW50ZXJhY3RhYmxlXG4iXX0=