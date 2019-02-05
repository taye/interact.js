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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiSW50ZXJhY3RhYmxlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiSW50ZXJhY3RhYmxlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sS0FBSyxHQUFHLE1BQU0sdUJBQXVCLENBQUE7QUFDNUMsT0FBTyxPQUFPLE1BQU0sMkJBQTJCLENBQUE7QUFDL0MsT0FBTyxLQUFLLE1BQU0seUJBQXlCLENBQUE7QUFDM0MsT0FBTyxFQUFFLGNBQWMsRUFBRSxZQUFZLEVBQUUsV0FBVyxFQUFFLE1BQU0sNEJBQTRCLENBQUE7QUFDdEYsT0FBTyxNQUFNLE1BQU0sMEJBQTBCLENBQUE7QUFDN0MsT0FBTyxNQUFNLE1BQU0sMEJBQTBCLENBQUE7QUFDN0MsT0FBTyxLQUFLLEVBQUUsTUFBTSxzQkFBc0IsQ0FBQTtBQUMxQyxPQUFPLGtCQUFrQixNQUFNLHNDQUFzQyxDQUFBO0FBQ3JFLE9BQU8sRUFBRSxTQUFTLEVBQUUsTUFBTSwwQkFBMEIsQ0FBQTtBQUVwRCxPQUFPLFNBQVMsTUFBTSxhQUFhLENBQUE7QUFHbkMsTUFBTTtBQUNOLE1BQU0sT0FBTyxZQUFZO0lBaUJ2QixNQUFNO0lBQ04sWUFBYSxNQUF1QixFQUFFLE9BQVksRUFBRSxjQUE4QjtRQU56RSxXQUFNLEdBQUcsSUFBSSxTQUFTLEVBQUUsQ0FBQTtRQU8vQixJQUFJLENBQUMsUUFBUSxHQUFHLE9BQU8sQ0FBQyxPQUFPLENBQUE7UUFDL0IsSUFBSSxDQUFDLE1BQU0sR0FBSyxNQUFNLENBQUE7UUFDdEIsSUFBSSxDQUFDLFFBQVEsR0FBRyxPQUFPLENBQUMsT0FBTyxJQUFJLGNBQWMsQ0FBQTtRQUNqRCxJQUFJLENBQUMsSUFBSSxHQUFPLFNBQVMsQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFBO1FBQ3ZFLElBQUksQ0FBQyxJQUFJLEdBQU8sSUFBSSxDQUFDLElBQUksQ0FB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QUFRLEVBQUU7b0JBQzNDLFNBQVMsQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQTtvQkFDaEMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFBO29CQUMvQixTQUFTLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUE7b0JBRWhDLHNDQUFzQztvQkFDdEMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsTUFBTSxFQUFFO3dCQUMvQixTQUFTLENBQUMsSUFBSSxDQUFDLEdBQUcsSUFBSSxDQUFBO3FCQUN2QjtpQkFDRjtnQkFFRCxNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsSUFBSSxFQUFFLE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFBO2dCQUMzRCxNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsSUFBSSxFQUFFLE1BQU0sQ0FBQyxrQkFBa0IsRUFBRSxJQUFJLENBQUMsQ0FBQTthQUNwRTtTQUNGO2FBQ0k7WUFDSCxNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxNQUFjLEVBQUUsS0FBSyxDQUFDLENBQUE7U0FDMUM7SUFDSCxDQUFDO0NBQ0Y7QUFFRCxlQUFlLFlBQVksQ0FBQSIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGFyciBmcm9tICdAaW50ZXJhY3Rqcy91dGlscy9hcnInXG5pbXBvcnQgYnJvd3NlciBmcm9tICdAaW50ZXJhY3Rqcy91dGlscy9icm93c2VyJ1xuaW1wb3J0IGNsb25lIGZyb20gJ0BpbnRlcmFjdGpzL3V0aWxzL2Nsb25lJ1xuaW1wb3J0IHsgZ2V0RWxlbWVudFJlY3QsIG5vZGVDb250YWlucywgdHJ5U2VsZWN0b3IgfSBmcm9tICdAaW50ZXJhY3Rqcy91dGlscy9kb21VdGlscydcbmltcG9ydCBldmVudHMgZnJvbSAnQGludGVyYWN0anMvdXRpbHMvZXZlbnRzJ1xuaW1wb3J0IGV4dGVuZCBmcm9tICdAaW50ZXJhY3Rqcy91dGlscy9leHRlbmQnXG5pbXBvcnQgKiBhcyBpcyBmcm9tICdAaW50ZXJhY3Rqcy91dGlscy9pcydcbmltcG9ydCBub3JtYWxpemVMaXN0ZW5lcnMgZnJvbSAnQGludGVyYWN0anMvdXRpbHMvbm9ybWFsaXplTGlzdGVuZXJzJ1xuaW1wb3J0IHsgZ2V0V2luZG93IH0gZnJvbSAnQGludGVyYWN0anMvdXRpbHMvd2luZG93J1xuaW1wb3J0IHsgQWN0aW9uRGVmYXVsdHMsIERlZmF1bHRzLCBPcHRpb25zIH0gZnJvbSAnLi9kZWZhdWx0T3B0aW9ucydcbmltcG9ydCBFdmVudGFibGUgZnJvbSAnLi9FdmVudGFibGUnXG5pbXBvcnQgeyBBY3Rpb25zIH0gZnJvbSAnLi9zY29wZSdcblxuLyoqICovXG5leHBvcnQgY2xhc3MgSW50ZXJhY3RhYmxlIGltcGxlbWVudHMgUGFydGlhbDxFdmVudGFibGU+IHtcbiAgcHJvdGVjdGVkIGdldCBfZGVmYXVsdHMgKCk6IERlZmF1bHRzIHtcbiAgICByZXR1cm4ge1xuICAgICAgYmFzZToge30sXG4gICAgICBwZXJBY3Rpb246IHt9LFxuICAgICAgYWN0aW9uczoge30gYXMgQWN0aW9uRGVmYXVsdHMsXG4gICAgfVxuICB9XG5cbiAgb3B0aW9ucyE6IFJlcXVpcmVkPE9wdGlvbnM+XG4gIHJlYWRvbmx5IF9hY3Rpb25zOiBBY3Rpb25zXG4gIHJlYWRvbmx5IHRhcmdldDogSW50ZXJhY3QuVGFyZ2V0XG4gIHJlYWRvbmx5IGV2ZW50cyA9IG5ldyBFdmVudGFibGUoKVxuICByZWFkb25seSBfY29udGV4dDogRWxlbWVudFxuICByZWFkb25seSBfd2luOiBXaW5kb3dcbiAgcmVhZG9ubHkgX2RvYzogRG9jdW1lbnRcblxuICAvKiogKi9cbiAgY29uc3RydWN0b3IgKHRhcmdldDogSW50ZXJhY3QuVGFyZ2V0LCBvcHRpb25zOiBhbnksIGRlZmF1bHRDb250ZXh0OiBFbGVtZW50IHwgTm9kZSkge1xuICAgIHRoaXMuX2FjdGlvbnMgPSBvcHRpb25zLmFjdGlvbnNcbiAgICB0aGlzLnRhcmdldCAgID0gdGFyZ2V0XG4gICAgdGhpcy5fY29udGV4dCA9IG9wdGlvbnMuY29udGV4dCB8fCBkZWZhdWx0Q29udGV4dFxuICAgIHRoaXMuX3dpbiAgICAgPSBnZXRXaW5kb3codHJ5U2VsZWN0b3IodGFyZ2V0KSA/IHRoaXMuX2NvbnRleHQgOiB0YXJnZXQpXG4gICAgdGhpcy5fZG9jICAgICA9IHRoaXMuX3dpbi5kb2N1bWVudFxuXG4gICAgdGhpcy5zZXQob3B0aW9ucylcbiAgfVxuXG4gIHNldE9uRXZlbnRzIChhY3Rpb25OYW1lOiBzdHJpbmcsIHBoYXNlczogeyBbcGhhc2U6IHN0cmluZ106IEludGVyYWN0Lkxpc3RlbmVyc0FyZyB9KSB7XG4gICAgaWYgKGlzLmZ1bmMocGhhc2VzLm9uc3RhcnQpKSB7IHRoaXMub24oYCR7YWN0aW9uTmFtZX1zdGFydGAsIHBoYXNlcy5vbnN0YXJ0KSB9XG4gICAgaWYgKGlzLmZ1bmMocGhhc2VzLm9ubW92ZSkpIHsgdGhpcy5vbihgJHthY3Rpb25OYW1lfW1vdmVgLCBwaGFzZXMub25tb3ZlKSB9XG4gICAgaWYgKGlzLmZ1bmMocGhhc2VzLm9uZW5kKSkgeyB0aGlzLm9uKGAke2FjdGlvbk5hbWV9ZW5kYCwgcGhhc2VzLm9uZW5kKSB9XG4gICAgaWYgKGlzLmZ1bmMocGhhc2VzLm9uaW5lcnRpYXN0YXJ0KSkgeyB0aGlzLm9uKGAke2FjdGlvbk5hbWV9aW5lcnRpYXN0YXJ0YCwgcGhhc2VzLm9uaW5lcnRpYXN0YXJ0KSB9XG5cbiAgICByZXR1cm4gdGhpc1xuICB9XG5cbiAgdXBkYXRlUGVyQWN0aW9uTGlzdGVuZXJzIChhY3Rpb25OYW1lLCBwcmV2LCBjdXIpIHtcbiAgICBpZiAoaXMuYXJyYXkocHJldikpIHtcbiAgICAgIHRoaXMub2ZmKGFjdGlvbk5hbWUsIHByZXYpXG4gICAgfVxuXG4gICAgaWYgKGlzLmFycmF5KGN1cikpIHtcbiAgICAgIHRoaXMub24oYWN0aW9uTmFtZSwgY3VyKVxuICAgIH1cbiAgfVxuXG4gIHNldFBlckFjdGlvbiAoYWN0aW9uTmFtZSwgb3B0aW9uczogSW50ZXJhY3QuT3JCb29sZWFuPE9wdGlvbnM+KSB7XG4gICAgY29uc3QgZGVmYXVsdHMgPSB0aGlzLl9kZWZhdWx0c1xuXG4gICAgLy8gZm9yIGFsbCB0aGUgZGVmYXVsdCBwZXItYWN0aW9uIG9wdGlvbnNcbiAgICBmb3IgKGNvbnN0IG9wdGlvbk5hbWUgaW4gb3B0aW9ucykge1xuICAgICAgY29uc3QgYWN0aW9uT3B0aW9ucyA9IHRoaXMub3B0aW9uc1thY3Rpb25OYW1lXVxuICAgICAgY29uc3Qgb3B0aW9uVmFsdWUgPSBvcHRpb25zW29wdGlvbk5hbWVdXG4gICAgICBjb25zdCBpc0FycmF5ID0gaXMuYXJyYXkob3B0aW9uVmFsdWUpXG5cbiAgICAgIC8vIHJlbW92ZSBvbGQgZXZlbnQgbGlzdGVuZXJzIGFuZCBhZGQgbmV3IG9uZXNcbiAgICAgIGlmIChvcHRpb25OYW1lID09PSAnbGlzdGVuZXJzJykge1xuICAgICAgICB0aGlzLnVwZGF0ZVBlckFjdGlvbkxpc3RlbmVycyhhY3Rpb25OYW1lLCBhY3Rpb25PcHRpb25zLmxpc3RlbmVycywgb3B0aW9uVmFsdWUpXG4gICAgICB9XG5cbiAgICAgIC8vIGlmIHRoZSBvcHRpb24gdmFsdWUgaXMgYW4gYXJyYXlcbiAgICAgIGlmIChpc0FycmF5KSB7XG4gICAgICAgIGFjdGlvbk9wdGlvbnNbb3B0aW9uTmFtZV0gPSBhcnIuZnJvbShvcHRpb25WYWx1ZSlcbiAgICAgIH1cbiAgICAgIC8vIGlmIHRoZSBvcHRpb24gdmFsdWUgaXMgYW4gb2JqZWN0XG4gICAgICBlbHNlIGlmICghaXNBcnJheSAmJiBpcy5wbGFpbk9iamVjdChvcHRpb25WYWx1ZSkpIHtcbiAgICAgICAgLy8gY29weSB0aGUgb2JqZWN0XG4gICAgICAgIGFjdGlvbk9wdGlvbnNbb3B0aW9uTmFtZV0gPSBleHRlbmQoXG4gICAgICAgICAgYWN0aW9uT3B0aW9uc1tvcHRpb25OYW1lXSB8fCB7fSxcbiAgICAgICAgICBjbG9uZShvcHRpb25WYWx1ZSkpXG5cbiAgICAgICAgLy8gc2V0IGFuYWJsZWQgZmllbGQgdG8gdHJ1ZSBpZiBpdCBleGlzdHMgaW4gdGhlIGRlZmF1bHRzXG4gICAgICAgIGlmIChpcy5vYmplY3QoZGVmYXVsdHMucGVyQWN0aW9uW29wdGlvbk5hbWVdKSAmJiAnZW5hYmxlZCcgaW4gZGVmYXVsdHMucGVyQWN0aW9uW29wdGlvbk5hbWVdKSB7XG4gICAgICAgICAgYWN0aW9uT3B0aW9uc1tvcHRpb25OYW1lXS5lbmFibGVkID0gb3B0aW9uVmFsdWUuZW5hYmxlZCAhPT0gZmFsc2VcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgLy8gaWYgdGhlIG9wdGlvbiB2YWx1ZSBpcyBhIGJvb2xlYW4gYW5kIHRoZSBkZWZhdWx0IGlzIGFuIG9iamVjdFxuICAgICAgZWxzZSBpZiAoaXMuYm9vbChvcHRpb25WYWx1ZSkgJiYgaXMub2JqZWN0KGRlZmF1bHRzLnBlckFjdGlvbltvcHRpb25OYW1lXSkpIHtcbiAgICAgICAgYWN0aW9uT3B0aW9uc1tvcHRpb25OYW1lXS5lbmFibGVkID0gb3B0aW9uVmFsdWVcbiAgICAgIH1cbiAgICAgIC8vIGlmIGl0J3MgYW55dGhpbmcgZWxzZSwgZG8gYSBwbGFpbiBhc3NpZ25tZW50XG4gICAgICBlbHNlIHtcbiAgICAgICAgYWN0aW9uT3B0aW9uc1tvcHRpb25OYW1lXSA9IG9wdGlvblZhbHVlXG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFRoZSBkZWZhdWx0IGZ1bmN0aW9uIHRvIGdldCBhbiBJbnRlcmFjdGFibGVzIGJvdW5kaW5nIHJlY3QuIENhbiBiZVxuICAgKiBvdmVycmlkZGVuIHVzaW5nIHtAbGluayBJbnRlcmFjdGFibGUucmVjdENoZWNrZXJ9LlxuICAgKlxuICAgKiBAcGFyYW0ge0VsZW1lbnR9IFtlbGVtZW50XSBUaGUgZWxlbWVudCB0byBtZWFzdXJlLlxuICAgKiBAcmV0dXJuIHtvYmplY3R9IFRoZSBvYmplY3QncyBib3VuZGluZyByZWN0YW5nbGUuXG4gICAqL1xuICBnZXRSZWN0IChlbGVtZW50OiBFbGVtZW50KSB7XG4gICAgZWxlbWVudCA9IGVsZW1lbnQgfHwgKGlzLmVsZW1lbnQodGhpcy50YXJnZXQpXG4gICAgICA/IHRoaXMudGFyZ2V0XG4gICAgICA6IG51bGwpXG5cbiAgICBpZiAoaXMuc3RyaW5nKHRoaXMudGFyZ2V0KSkge1xuICAgICAgZWxlbWVudCA9IGVsZW1lbnQgfHwgdGhpcy5fY29udGV4dC5xdWVyeVNlbGVjdG9yKHRoaXMudGFyZ2V0KVxuICAgIH1cblxuICAgIHJldHVybiBnZXRFbGVtZW50UmVjdChlbGVtZW50KVxuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgb3Igc2V0cyB0aGUgZnVuY3Rpb24gdXNlZCB0byBjYWxjdWxhdGUgdGhlIGludGVyYWN0YWJsZSdzXG4gICAqIGVsZW1lbnQncyByZWN0YW5nbGVcbiAgICpcbiAgICogQHBhcmFtIHtmdW5jdGlvbn0gW2NoZWNrZXJdIEEgZnVuY3Rpb24gd2hpY2ggcmV0dXJucyB0aGlzIEludGVyYWN0YWJsZSdzXG4gICAqIGJvdW5kaW5nIHJlY3RhbmdsZS4gU2VlIHtAbGluayBJbnRlcmFjdGFibGUuZ2V0UmVjdH1cbiAgICogQHJldHVybiB7ZnVuY3Rpb24gfCBvYmplY3R9IFRoZSBjaGVja2VyIGZ1bmN0aW9uIG9yIHRoaXMgSW50ZXJhY3RhYmxlXG4gICAqL1xuICByZWN0Q2hlY2tlciAoY2hlY2tlcjogKGVsZW1lbnQ6IEVsZW1lbnQpID0+IGFueSkge1xuICAgIGlmIChpcy5mdW5jKGNoZWNrZXIpKSB7XG4gICAgICB0aGlzLmdldFJlY3QgPSBjaGVja2VyXG5cbiAgICAgIHJldHVybiB0aGlzXG4gICAgfVxuXG4gICAgaWYgKGNoZWNrZXIgPT09IG51bGwpIHtcbiAgICAgIGRlbGV0ZSB0aGlzLm9wdGlvbnMuZ2V0UmVjdFxuXG4gICAgICByZXR1cm4gdGhpc1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzLmdldFJlY3RcbiAgfVxuXG4gIF9iYWNrQ29tcGF0T3B0aW9uIChvcHRpb25OYW1lLCBuZXdWYWx1ZSkge1xuICAgIGlmICh0cnlTZWxlY3RvcihuZXdWYWx1ZSkgfHwgaXMub2JqZWN0KG5ld1ZhbHVlKSkge1xuICAgICAgdGhpcy5vcHRpb25zW29wdGlvbk5hbWVdID0gbmV3VmFsdWVcblxuICAgICAgZm9yIChjb25zdCBhY3Rpb24gb2YgdGhpcy5fYWN0aW9ucy5uYW1lcykge1xuICAgICAgICB0aGlzLm9wdGlvbnNbYWN0aW9uXVtvcHRpb25OYW1lXSA9IG5ld1ZhbHVlXG4gICAgICB9XG5cbiAgICAgIHJldHVybiB0aGlzXG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXMub3B0aW9uc1tvcHRpb25OYW1lXVxuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgb3Igc2V0cyB0aGUgb3JpZ2luIG9mIHRoZSBJbnRlcmFjdGFibGUncyBlbGVtZW50LiAgVGhlIHggYW5kIHlcbiAgICogb2YgdGhlIG9yaWdpbiB3aWxsIGJlIHN1YnRyYWN0ZWQgZnJvbSBhY3Rpb24gZXZlbnQgY29vcmRpbmF0ZXMuXG4gICAqXG4gICAqIEBwYXJhbSB7RWxlbWVudCB8IG9iamVjdCB8IHN0cmluZ30gW29yaWdpbl0gQW4gSFRNTCBvciBTVkcgRWxlbWVudCB3aG9zZVxuICAgKiByZWN0IHdpbGwgYmUgdXNlZCwgYW4gb2JqZWN0IGVnLiB7IHg6IDAsIHk6IDAgfSBvciBzdHJpbmcgJ3BhcmVudCcsICdzZWxmJ1xuICAgKiBvciBhbnkgQ1NTIHNlbGVjdG9yXG4gICAqXG4gICAqIEByZXR1cm4ge29iamVjdH0gVGhlIGN1cnJlbnQgb3JpZ2luIG9yIHRoaXMgSW50ZXJhY3RhYmxlXG4gICAqL1xuICBvcmlnaW4gKG5ld1ZhbHVlKSB7XG4gICAgcmV0dXJuIHRoaXMuX2JhY2tDb21wYXRPcHRpb24oJ29yaWdpbicsIG5ld1ZhbHVlKVxuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgb3Igc2V0cyB0aGUgbW91c2UgY29vcmRpbmF0ZSB0eXBlcyB1c2VkIHRvIGNhbGN1bGF0ZSB0aGVcbiAgICogbW92ZW1lbnQgb2YgdGhlIHBvaW50ZXIuXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBbbmV3VmFsdWVdIFVzZSAnY2xpZW50JyBpZiB5b3Ugd2lsbCBiZSBzY3JvbGxpbmcgd2hpbGVcbiAgICogaW50ZXJhY3Rpbmc7IFVzZSAncGFnZScgaWYgeW91IHdhbnQgYXV0b1Njcm9sbCB0byB3b3JrXG4gICAqIEByZXR1cm4ge3N0cmluZyB8IG9iamVjdH0gVGhlIGN1cnJlbnQgZGVsdGFTb3VyY2Ugb3IgdGhpcyBJbnRlcmFjdGFibGVcbiAgICovXG4gIGRlbHRhU291cmNlIChuZXdWYWx1ZSkge1xuICAgIGlmIChuZXdWYWx1ZSA9PT0gJ3BhZ2UnIHx8IG5ld1ZhbHVlID09PSAnY2xpZW50Jykge1xuICAgICAgdGhpcy5vcHRpb25zLmRlbHRhU291cmNlID0gbmV3VmFsdWVcblxuICAgICAgcmV0dXJuIHRoaXNcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy5vcHRpb25zLmRlbHRhU291cmNlXG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgc2VsZWN0b3IgY29udGV4dCBOb2RlIG9mIHRoZSBJbnRlcmFjdGFibGUuIFRoZSBkZWZhdWx0IGlzXG4gICAqIGB3aW5kb3cuZG9jdW1lbnRgLlxuICAgKlxuICAgKiBAcmV0dXJuIHtOb2RlfSBUaGUgY29udGV4dCBOb2RlIG9mIHRoaXMgSW50ZXJhY3RhYmxlXG4gICAqL1xuICBjb250ZXh0ICgpIHtcbiAgICByZXR1cm4gdGhpcy5fY29udGV4dFxuICB9XG5cbiAgaW5Db250ZXh0IChlbGVtZW50KSB7XG4gICAgcmV0dXJuICh0aGlzLl9jb250ZXh0ID09PSBlbGVtZW50Lm93bmVyRG9jdW1lbnQgfHxcbiAgICAgICAgICAgIG5vZGVDb250YWlucyh0aGlzLl9jb250ZXh0LCBlbGVtZW50KSlcbiAgfVxuXG4gIC8qKlxuICAgKiBDYWxscyBsaXN0ZW5lcnMgZm9yIHRoZSBnaXZlbiBJbnRlcmFjdEV2ZW50IHR5cGUgYm91bmQgZ2xvYmFsbHlcbiAgICogYW5kIGRpcmVjdGx5IHRvIHRoaXMgSW50ZXJhY3RhYmxlXG4gICAqXG4gICAqIEBwYXJhbSB7SW50ZXJhY3RFdmVudH0gaUV2ZW50IFRoZSBJbnRlcmFjdEV2ZW50IG9iamVjdCB0byBiZSBmaXJlZCBvbiB0aGlzXG4gICAqIEludGVyYWN0YWJsZVxuICAgKiBAcmV0dXJuIHtJbnRlcmFjdGFibGV9IHRoaXMgSW50ZXJhY3RhYmxlXG4gICAqL1xuICBmaXJlIChpRXZlbnQpIHtcbiAgICB0aGlzLmV2ZW50cy5maXJlKGlFdmVudClcblxuICAgIHJldHVybiB0aGlzXG4gIH1cblxuICBfb25PZmYgKG1ldGhvZDogJ29uJyB8ICdvZmYnLCB0eXBlQXJnOiBJbnRlcmFjdC5FdmVudFR5cGVzLCBsaXN0ZW5lckFyZz86IEludGVyYWN0Lkxpc3RlbmVyc0FyZyB8IG51bGwsIG9wdGlvbnM/OiBhbnkpIHtcbiAgICBpZiAoaXMub2JqZWN0KHR5cGVBcmcpICYmICFpcy5hcnJheSh0eXBlQXJnKSkge1xuICAgICAgb3B0aW9ucyA9IGxpc3RlbmVyQXJnXG4gICAgICBsaXN0ZW5lckFyZyA9IG51bGxcbiAgICB9XG5cbiAgICBjb25zdCBhZGRSZW1vdmUgPSBtZXRob2QgPT09ICdvbicgPyAnYWRkJyA6ICdyZW1vdmUnXG4gICAgY29uc3QgbGlzdGVuZXJzID0gbm9ybWFsaXplTGlzdGVuZXJzKHR5cGVBcmcsIGxpc3RlbmVyQXJnKVxuXG4gICAgZm9yIChsZXQgdHlwZSBpbiBsaXN0ZW5lcnMpIHtcbiAgICAgIGlmICh0eXBlID09PSAnd2hlZWwnKSB7IHR5cGUgPSBicm93c2VyLndoZWVsRXZlbnQgfVxuXG4gICAgICBmb3IgKGNvbnN0IGxpc3RlbmVyIG9mIGxpc3RlbmVyc1t0eXBlXSkge1xuICAgICAgICAvLyBpZiBpdCBpcyBhbiBhY3Rpb24gZXZlbnQgdHlwZVxuICAgICAgICBpZiAoYXJyLmNvbnRhaW5zKHRoaXMuX2FjdGlvbnMuZXZlbnRUeXBlcywgdHlwZSkpIHtcbiAgICAgICAgICB0aGlzLmV2ZW50c1ttZXRob2RdKHR5cGUsIGxpc3RlbmVyKVxuICAgICAgICB9XG4gICAgICAgIC8vIGRlbGVnYXRlZCBldmVudFxuICAgICAgICBlbHNlIGlmIChpcy5zdHJpbmcodGhpcy50YXJnZXQpKSB7XG4gICAgICAgICAgZXZlbnRzW2Ake2FkZFJlbW92ZX1EZWxlZ2F0ZWBdKHRoaXMudGFyZ2V0LCB0aGlzLl9jb250ZXh0LCB0eXBlLCBsaXN0ZW5lciwgb3B0aW9ucylcbiAgICAgICAgfVxuICAgICAgICAvLyByZW1vdmUgbGlzdGVuZXIgZnJvbSB0aGlzIEludGVyYXRhYmxlJ3MgZWxlbWVudFxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAoZXZlbnRzW2FkZFJlbW92ZV0gYXMgdHlwZW9mIGV2ZW50cy5yZW1vdmUpKHRoaXMudGFyZ2V0LCB0eXBlLCBsaXN0ZW5lciwgb3B0aW9ucylcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiB0aGlzXG4gIH1cblxuICAvKipcbiAgICogQmluZHMgYSBsaXN0ZW5lciBmb3IgYW4gSW50ZXJhY3RFdmVudCwgcG9pbnRlckV2ZW50IG9yIERPTSBldmVudC5cbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmcgfCBhcnJheSB8IG9iamVjdH0gdHlwZXMgVGhlIHR5cGVzIG9mIGV2ZW50cyB0byBsaXN0ZW5cbiAgICogZm9yXG4gICAqIEBwYXJhbSB7ZnVuY3Rpb24gfCBhcnJheSB8IG9iamVjdH0gW2xpc3RlbmVyXSBUaGUgZXZlbnQgbGlzdGVuZXIgZnVuY3Rpb24ocylcbiAgICogQHBhcmFtIHtvYmplY3QgfCBib29sZWFufSBbb3B0aW9uc10gb3B0aW9ucyBvYmplY3Qgb3IgdXNlQ2FwdHVyZSBmbGFnIGZvclxuICAgKiBhZGRFdmVudExpc3RlbmVyXG4gICAqIEByZXR1cm4ge0ludGVyYWN0YWJsZX0gVGhpcyBJbnRlcmFjdGFibGVcbiAgICovXG4gIG9uICh0eXBlczogSW50ZXJhY3QuRXZlbnRUeXBlcywgbGlzdGVuZXI/OiBJbnRlcmFjdC5MaXN0ZW5lcnNBcmcsIG9wdGlvbnM/OiBhbnkpIHtcbiAgICByZXR1cm4gdGhpcy5fb25PZmYoJ29uJywgdHlwZXMsIGxpc3RlbmVyLCBvcHRpb25zKVxuICB9XG5cbiAgLyoqXG4gICAqIFJlbW92ZXMgYW4gSW50ZXJhY3RFdmVudCwgcG9pbnRlckV2ZW50IG9yIERPTSBldmVudCBsaXN0ZW5lci5cbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmcgfCBhcnJheSB8IG9iamVjdH0gdHlwZXMgVGhlIHR5cGVzIG9mIGV2ZW50cyB0aGF0IHdlcmVcbiAgICogbGlzdGVuZWQgZm9yXG4gICAqIEBwYXJhbSB7ZnVuY3Rpb24gfCBhcnJheSB8IG9iamVjdH0gW2xpc3RlbmVyXSBUaGUgZXZlbnQgbGlzdGVuZXIgZnVuY3Rpb24ocylcbiAgICogQHBhcmFtIHtvYmplY3QgfCBib29sZWFufSBbb3B0aW9uc10gb3B0aW9ucyBvYmplY3Qgb3IgdXNlQ2FwdHVyZSBmbGFnIGZvclxuICAgKiByZW1vdmVFdmVudExpc3RlbmVyXG4gICAqIEByZXR1cm4ge0ludGVyYWN0YWJsZX0gVGhpcyBJbnRlcmFjdGFibGVcbiAgICovXG4gIG9mZiAodHlwZXM6IHN0cmluZyB8IHN0cmluZ1tdIHwgSW50ZXJhY3QuRXZlbnRUeXBlcywgbGlzdGVuZXI/OiBJbnRlcmFjdC5MaXN0ZW5lcnNBcmcsIG9wdGlvbnM/OiBhbnkpIHtcbiAgICByZXR1cm4gdGhpcy5fb25PZmYoJ29mZicsIHR5cGVzLCBsaXN0ZW5lciwgb3B0aW9ucylcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXNldCB0aGUgb3B0aW9ucyBvZiB0aGlzIEludGVyYWN0YWJsZVxuICAgKlxuICAgKiBAcGFyYW0ge29iamVjdH0gb3B0aW9ucyBUaGUgbmV3IHNldHRpbmdzIHRvIGFwcGx5XG4gICAqIEByZXR1cm4ge29iamVjdH0gVGhpcyBJbnRlcmFjdGFibGVcbiAgICovXG4gIHNldCAob3B0aW9uczogSW50ZXJhY3QuT3B0aW9uc0FyZykge1xuICAgIGNvbnN0IGRlZmF1bHRzID0gdGhpcy5fZGVmYXVsdHNcblxuICAgIGlmICghaXMub2JqZWN0KG9wdGlvbnMpKSB7XG4gICAgICBvcHRpb25zID0ge31cbiAgICB9XG5cbiAgICB0aGlzLm9wdGlvbnMgPSBjbG9uZShkZWZhdWx0cy5iYXNlKSBhcyBSZXF1aXJlZDxPcHRpb25zPlxuXG4gICAgZm9yIChjb25zdCBhY3Rpb25OYW1lIGluIHRoaXMuX2FjdGlvbnMubWV0aG9kRGljdCkge1xuICAgICAgY29uc3QgbWV0aG9kTmFtZSA9IHRoaXMuX2FjdGlvbnMubWV0aG9kRGljdFthY3Rpb25OYW1lXVxuXG4gICAgICB0aGlzLm9wdGlvbnNbYWN0aW9uTmFtZV0gPSB7fVxuICAgICAgdGhpcy5zZXRQZXJBY3Rpb24oYWN0aW9uTmFtZSwgZXh0ZW5kKGV4dGVuZCh7fSwgZGVmYXVsdHMucGVyQWN0aW9uKSwgZGVmYXVsdHMuYWN0aW9uc1thY3Rpb25OYW1lXSkpXG5cbiAgICAgIHRoaXNbbWV0aG9kTmFtZV0ob3B0aW9uc1thY3Rpb25OYW1lXSlcbiAgICB9XG5cbiAgICBmb3IgKGNvbnN0IHNldHRpbmcgaW4gb3B0aW9ucykge1xuICAgICAgaWYgKGlzLmZ1bmModGhpc1tzZXR0aW5nXSkpIHtcbiAgICAgICAgdGhpc1tzZXR0aW5nXShvcHRpb25zW3NldHRpbmddKVxuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiB0aGlzXG4gIH1cblxuICAvKipcbiAgICogUmVtb3ZlIHRoaXMgaW50ZXJhY3RhYmxlIGZyb20gdGhlIGxpc3Qgb2YgaW50ZXJhY3RhYmxlcyBhbmQgcmVtb3ZlIGl0J3NcbiAgICogYWN0aW9uIGNhcGFiaWxpdGllcyBhbmQgZXZlbnQgbGlzdGVuZXJzXG4gICAqXG4gICAqIEByZXR1cm4ge2ludGVyYWN0fVxuICAgKi9cbiAgdW5zZXQgKCkge1xuICAgIGV2ZW50cy5yZW1vdmUodGhpcy50YXJnZXQgYXMgTm9kZSwgJ2FsbCcpXG5cbiAgICBpZiAoaXMuc3RyaW5nKHRoaXMudGFyZ2V0KSkge1xuICAgICAgLy8gcmVtb3ZlIGRlbGVnYXRlZCBldmVudHNcbiAgICAgIGZvciAoY29uc3QgdHlwZSBpbiBldmVudHMuZGVsZWdhdGVkRXZlbnRzKSB7XG4gICAgICAgIGNvbnN0IGRlbGVnYXRlZCA9IGV2ZW50cy5kZWxlZ2F0ZWRFdmVudHNbdHlwZV1cblxuICAgICAgICBpZiAoZGVsZWdhdGVkLnNlbGVjdG9yc1swXSA9PT0gdGhpcy50YXJnZXQgJiZcbiAgICAgICAgICAgIGRlbGVnYXRlZC5jb250ZXh0c1swXSA9PT0gdGhpcy5fY29udGV4dCkge1xuICAgICAgICAgIGRlbGVnYXRlZC5zZWxlY3RvcnMuc3BsaWNlKDAsIDEpXG4gICAgICAgICAgZGVsZWdhdGVkLmNvbnRleHRzLnNwbGljZSgwLCAxKVxuICAgICAgICAgIGRlbGVnYXRlZC5saXN0ZW5lcnMuc3BsaWNlKDAsIDEpXG5cbiAgICAgICAgICAvLyByZW1vdmUgdGhlIGFycmF5cyBpZiB0aGV5IGFyZSBlbXB0eVxuICAgICAgICAgIGlmICghZGVsZWdhdGVkLnNlbGVjdG9ycy5sZW5ndGgpIHtcbiAgICAgICAgICAgIGRlbGVnYXRlZFt0eXBlXSA9IG51bGxcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBldmVudHMucmVtb3ZlKHRoaXMuX2NvbnRleHQsIHR5cGUsIGV2ZW50cy5kZWxlZ2F0ZUxpc3RlbmVyKVxuICAgICAgICBldmVudHMucmVtb3ZlKHRoaXMuX2NvbnRleHQsIHR5cGUsIGV2ZW50cy5kZWxlZ2F0ZVVzZUNhcHR1cmUsIHRydWUpXG4gICAgICB9XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgZXZlbnRzLnJlbW92ZSh0aGlzLnRhcmdldCBhcyBOb2RlLCAnYWxsJylcbiAgICB9XG4gIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgSW50ZXJhY3RhYmxlXG4iXX0=