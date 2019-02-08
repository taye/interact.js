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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiSW50ZXJhY3RhYmxlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiSW50ZXJhY3RhYmxlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sS0FBSyxHQUFHLE1BQU0sdUJBQXVCLENBQUE7QUFDNUMsT0FBTyxPQUFPLE1BQU0sMkJBQTJCLENBQUE7QUFDL0MsT0FBTyxLQUFLLE1BQU0seUJBQXlCLENBQUE7QUFDM0MsT0FBTyxFQUFFLGNBQWMsRUFBRSxZQUFZLEVBQUUsV0FBVyxFQUFFLE1BQU0sNEJBQTRCLENBQUE7QUFDdEYsT0FBTyxNQUFNLE1BQU0sMEJBQTBCLENBQUE7QUFDN0MsT0FBTyxNQUFNLE1BQU0sMEJBQTBCLENBQUE7QUFDN0MsT0FBTyxLQUFLLEVBQUUsTUFBTSxzQkFBc0IsQ0FBQTtBQUMxQyxPQUFPLGtCQUFrQixNQUFNLHNDQUFzQyxDQUFBO0FBQ3JFLE9BQU8sRUFBRSxTQUFTLEVBQUUsTUFBTSwwQkFBMEIsQ0FBQTtBQUVwRCxPQUFPLFNBQVMsTUFBTSxhQUFhLENBQUE7QUFHbkMsTUFBTTtBQUNOLE1BQU0sT0FBTyxZQUFZO0lBaUJ2QixNQUFNO0lBQ04sWUFBYSxNQUF1QixFQUFFLE9BQVksRUFBRSxjQUFrQztRQU43RSxXQUFNLEdBQUcsSUFBSSxTQUFTLEVBQUUsQ0FBQTtRQU8vQixJQUFJLENBQUMsUUFBUSxHQUFHLE9BQU8sQ0FBQyxPQUFPLENBQUE7UUFDL0IsSUFBSSxDQUFDLE1BQU0sR0FBSyxNQUFNLENBQUE7UUFDdEIsSUFBSSxDQUFDLFFBQVEsR0FBRyxPQUFPLENBQUMsT0FBTyxJQUFJLGNBQWMsQ0FBQTtRQUNqRCxJQUFJLENBQUMsSUFBSSxHQUFPLFNBQVMsQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFBO1FBQ3ZFLElBQUksQ0FBQyxJQUFJLEdBQU8sSUFBSSxDQUFDLElBQUksQ0FB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b0JBQzNDLFNBQVMsQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQTtvQkFDaEMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFBO29CQUMvQixTQUFTLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUE7b0JBRWhDLHNDQUFzQztvQkFDdEMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsTUFBTSxFQUFFO3dCQUMvQixTQUFTLENBQUMsSUFBSSxDQUFDLEdBQUcsSUFBSSxDQUFBO3FCQUN2QjtpQkFDRjtnQkFFRCxNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsSUFBSSxFQUFFLE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFBO2dCQUMzRCxNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsSUFBSSxFQUFFLE1BQU0sQ0FBQyxrQkFBa0IsRUFBRSxJQUFJLENBQUMsQ0FBQTthQUNwRTtTQUNGO2FBQ0k7WUFDSCxNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxNQUFjLEVBQUUsS0FBSyxDQUFDLENBQUE7U0FDMUM7SUFDSCxDQUFDO0NBQ0Y7QUFFRCxlQUFlLFlBQVksQ0FBQSIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGFyciBmcm9tICdAaW50ZXJhY3Rqcy91dGlscy9hcnInXG5pbXBvcnQgYnJvd3NlciBmcm9tICdAaW50ZXJhY3Rqcy91dGlscy9icm93c2VyJ1xuaW1wb3J0IGNsb25lIGZyb20gJ0BpbnRlcmFjdGpzL3V0aWxzL2Nsb25lJ1xuaW1wb3J0IHsgZ2V0RWxlbWVudFJlY3QsIG5vZGVDb250YWlucywgdHJ5U2VsZWN0b3IgfSBmcm9tICdAaW50ZXJhY3Rqcy91dGlscy9kb21VdGlscydcbmltcG9ydCBldmVudHMgZnJvbSAnQGludGVyYWN0anMvdXRpbHMvZXZlbnRzJ1xuaW1wb3J0IGV4dGVuZCBmcm9tICdAaW50ZXJhY3Rqcy91dGlscy9leHRlbmQnXG5pbXBvcnQgKiBhcyBpcyBmcm9tICdAaW50ZXJhY3Rqcy91dGlscy9pcydcbmltcG9ydCBub3JtYWxpemVMaXN0ZW5lcnMgZnJvbSAnQGludGVyYWN0anMvdXRpbHMvbm9ybWFsaXplTGlzdGVuZXJzJ1xuaW1wb3J0IHsgZ2V0V2luZG93IH0gZnJvbSAnQGludGVyYWN0anMvdXRpbHMvd2luZG93J1xuaW1wb3J0IHsgQWN0aW9uRGVmYXVsdHMsIERlZmF1bHRzLCBPcHRpb25zIH0gZnJvbSAnLi9kZWZhdWx0T3B0aW9ucydcbmltcG9ydCBFdmVudGFibGUgZnJvbSAnLi9FdmVudGFibGUnXG5pbXBvcnQgeyBBY3Rpb25zIH0gZnJvbSAnLi9zY29wZSdcblxuLyoqICovXG5leHBvcnQgY2xhc3MgSW50ZXJhY3RhYmxlIGltcGxlbWVudHMgUGFydGlhbDxFdmVudGFibGU+IHtcbiAgcHJvdGVjdGVkIGdldCBfZGVmYXVsdHMgKCk6IERlZmF1bHRzIHtcbiAgICByZXR1cm4ge1xuICAgICAgYmFzZToge30sXG4gICAgICBwZXJBY3Rpb246IHt9LFxuICAgICAgYWN0aW9uczoge30gYXMgQWN0aW9uRGVmYXVsdHMsXG4gICAgfVxuICB9XG5cbiAgcmVhZG9ubHkgb3B0aW9ucyE6IFJlcXVpcmVkPE9wdGlvbnM+XG4gIHJlYWRvbmx5IF9hY3Rpb25zOiBBY3Rpb25zXG4gIHJlYWRvbmx5IHRhcmdldDogSW50ZXJhY3QuVGFyZ2V0XG4gIHJlYWRvbmx5IGV2ZW50cyA9IG5ldyBFdmVudGFibGUoKVxuICByZWFkb25seSBfY29udGV4dDogRG9jdW1lbnQgfCBFbGVtZW50XG4gIHJlYWRvbmx5IF93aW46IFdpbmRvd1xuICByZWFkb25seSBfZG9jOiBEb2N1bWVudFxuXG4gIC8qKiAqL1xuICBjb25zdHJ1Y3RvciAodGFyZ2V0OiBJbnRlcmFjdC5UYXJnZXQsIG9wdGlvbnM6IGFueSwgZGVmYXVsdENvbnRleHQ6IERvY3VtZW50IHwgRWxlbWVudCkge1xuICAgIHRoaXMuX2FjdGlvbnMgPSBvcHRpb25zLmFjdGlvbnNcbiAgICB0aGlzLnRhcmdldCAgID0gdGFyZ2V0XG4gICAgdGhpcy5fY29udGV4dCA9IG9wdGlvbnMuY29udGV4dCB8fCBkZWZhdWx0Q29udGV4dFxuICAgIHRoaXMuX3dpbiAgICAgPSBnZXRXaW5kb3codHJ5U2VsZWN0b3IodGFyZ2V0KSA/IHRoaXMuX2NvbnRleHQgOiB0YXJnZXQpXG4gICAgdGhpcy5fZG9jICAgICA9IHRoaXMuX3dpbi5kb2N1bWVudFxuXG4gICAgdGhpcy5zZXQob3B0aW9ucylcbiAgfVxuXG4gIHNldE9uRXZlbnRzIChhY3Rpb25OYW1lOiBzdHJpbmcsIHBoYXNlczogTm9uTnVsbGFibGU8YW55Pikge1xuICAgIGlmIChpcy5mdW5jKHBoYXNlcy5vbnN0YXJ0KSkgeyB0aGlzLm9uKGAke2FjdGlvbk5hbWV9c3RhcnRgLCBwaGFzZXMub25zdGFydCkgfVxuICAgIGlmIChpcy5mdW5jKHBoYXNlcy5vbm1vdmUpKSB7IHRoaXMub24oYCR7YWN0aW9uTmFtZX1tb3ZlYCwgcGhhc2VzLm9ubW92ZSkgfVxuICAgIGlmIChpcy5mdW5jKHBoYXNlcy5vbmVuZCkpIHsgdGhpcy5vbihgJHthY3Rpb25OYW1lfWVuZGAsIHBoYXNlcy5vbmVuZCkgfVxuICAgIGlmIChpcy5mdW5jKHBoYXNlcy5vbmluZXJ0aWFzdGFydCkpIHsgdGhpcy5vbihgJHthY3Rpb25OYW1lfWluZXJ0aWFzdGFydGAsIHBoYXNlcy5vbmluZXJ0aWFzdGFydCkgfVxuXG4gICAgcmV0dXJuIHRoaXNcbiAgfVxuXG4gIHVwZGF0ZVBlckFjdGlvbkxpc3RlbmVycyAoYWN0aW9uTmFtZSwgcHJldiwgY3VyKSB7XG4gICAgaWYgKGlzLmFycmF5KHByZXYpKSB7XG4gICAgICB0aGlzLm9mZihhY3Rpb25OYW1lLCBwcmV2KVxuICAgIH1cblxuICAgIGlmIChpcy5hcnJheShjdXIpKSB7XG4gICAgICB0aGlzLm9uKGFjdGlvbk5hbWUsIGN1cilcbiAgICB9XG4gIH1cblxuICBzZXRQZXJBY3Rpb24gKGFjdGlvbk5hbWUsIG9wdGlvbnM6IEludGVyYWN0Lk9yQm9vbGVhbjxPcHRpb25zPikge1xuICAgIGNvbnN0IGRlZmF1bHRzID0gdGhpcy5fZGVmYXVsdHNcblxuICAgIC8vIGZvciBhbGwgdGhlIGRlZmF1bHQgcGVyLWFjdGlvbiBvcHRpb25zXG4gICAgZm9yIChjb25zdCBvcHRpb25OYW1lIGluIG9wdGlvbnMpIHtcbiAgICAgIGNvbnN0IGFjdGlvbk9wdGlvbnMgPSB0aGlzLm9wdGlvbnNbYWN0aW9uTmFtZV1cbiAgICAgIGNvbnN0IG9wdGlvblZhbHVlID0gb3B0aW9uc1tvcHRpb25OYW1lXVxuICAgICAgY29uc3QgaXNBcnJheSA9IGlzLmFycmF5KG9wdGlvblZhbHVlKVxuXG4gICAgICAvLyByZW1vdmUgb2xkIGV2ZW50IGxpc3RlbmVycyBhbmQgYWRkIG5ldyBvbmVzXG4gICAgICBpZiAob3B0aW9uTmFtZSA9PT0gJ2xpc3RlbmVycycpIHtcbiAgICAgICAgdGhpcy51cGRhdGVQZXJBY3Rpb25MaXN0ZW5lcnMoYWN0aW9uTmFtZSwgYWN0aW9uT3B0aW9ucy5saXN0ZW5lcnMsIG9wdGlvblZhbHVlKVxuICAgICAgfVxuXG4gICAgICAvLyBpZiB0aGUgb3B0aW9uIHZhbHVlIGlzIGFuIGFycmF5XG4gICAgICBpZiAoaXNBcnJheSkge1xuICAgICAgICBhY3Rpb25PcHRpb25zW29wdGlvbk5hbWVdID0gYXJyLmZyb20ob3B0aW9uVmFsdWUpXG4gICAgICB9XG4gICAgICAvLyBpZiB0aGUgb3B0aW9uIHZhbHVlIGlzIGFuIG9iamVjdFxuICAgICAgZWxzZSBpZiAoIWlzQXJyYXkgJiYgaXMucGxhaW5PYmplY3Qob3B0aW9uVmFsdWUpKSB7XG4gICAgICAgIC8vIGNvcHkgdGhlIG9iamVjdFxuICAgICAgICBhY3Rpb25PcHRpb25zW29wdGlvbk5hbWVdID0gZXh0ZW5kKFxuICAgICAgICAgIGFjdGlvbk9wdGlvbnNbb3B0aW9uTmFtZV0gfHwge30sXG4gICAgICAgICAgY2xvbmUob3B0aW9uVmFsdWUpKVxuXG4gICAgICAgIC8vIHNldCBhbmFibGVkIGZpZWxkIHRvIHRydWUgaWYgaXQgZXhpc3RzIGluIHRoZSBkZWZhdWx0c1xuICAgICAgICBpZiAoaXMub2JqZWN0KGRlZmF1bHRzLnBlckFjdGlvbltvcHRpb25OYW1lXSkgJiYgJ2VuYWJsZWQnIGluIGRlZmF1bHRzLnBlckFjdGlvbltvcHRpb25OYW1lXSkge1xuICAgICAgICAgIGFjdGlvbk9wdGlvbnNbb3B0aW9uTmFtZV0uZW5hYmxlZCA9IG9wdGlvblZhbHVlLmVuYWJsZWQgIT09IGZhbHNlXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIC8vIGlmIHRoZSBvcHRpb24gdmFsdWUgaXMgYSBib29sZWFuIGFuZCB0aGUgZGVmYXVsdCBpcyBhbiBvYmplY3RcbiAgICAgIGVsc2UgaWYgKGlzLmJvb2wob3B0aW9uVmFsdWUpICYmIGlzLm9iamVjdChkZWZhdWx0cy5wZXJBY3Rpb25bb3B0aW9uTmFtZV0pKSB7XG4gICAgICAgIGFjdGlvbk9wdGlvbnNbb3B0aW9uTmFtZV0uZW5hYmxlZCA9IG9wdGlvblZhbHVlXG4gICAgICB9XG4gICAgICAvLyBpZiBpdCdzIGFueXRoaW5nIGVsc2UsIGRvIGEgcGxhaW4gYXNzaWdubWVudFxuICAgICAgZWxzZSB7XG4gICAgICAgIGFjdGlvbk9wdGlvbnNbb3B0aW9uTmFtZV0gPSBvcHRpb25WYWx1ZVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBUaGUgZGVmYXVsdCBmdW5jdGlvbiB0byBnZXQgYW4gSW50ZXJhY3RhYmxlcyBib3VuZGluZyByZWN0LiBDYW4gYmVcbiAgICogb3ZlcnJpZGRlbiB1c2luZyB7QGxpbmsgSW50ZXJhY3RhYmxlLnJlY3RDaGVja2VyfS5cbiAgICpcbiAgICogQHBhcmFtIHtFbGVtZW50fSBbZWxlbWVudF0gVGhlIGVsZW1lbnQgdG8gbWVhc3VyZS5cbiAgICogQHJldHVybiB7b2JqZWN0fSBUaGUgb2JqZWN0J3MgYm91bmRpbmcgcmVjdGFuZ2xlLlxuICAgKi9cbiAgZ2V0UmVjdCAoZWxlbWVudDogRWxlbWVudCkge1xuICAgIGVsZW1lbnQgPSBlbGVtZW50IHx8IChpcy5lbGVtZW50KHRoaXMudGFyZ2V0KVxuICAgICAgPyB0aGlzLnRhcmdldFxuICAgICAgOiBudWxsKVxuXG4gICAgaWYgKGlzLnN0cmluZyh0aGlzLnRhcmdldCkpIHtcbiAgICAgIGVsZW1lbnQgPSBlbGVtZW50IHx8IHRoaXMuX2NvbnRleHQucXVlcnlTZWxlY3Rvcih0aGlzLnRhcmdldClcbiAgICB9XG5cbiAgICByZXR1cm4gZ2V0RWxlbWVudFJlY3QoZWxlbWVudClcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIG9yIHNldHMgdGhlIGZ1bmN0aW9uIHVzZWQgdG8gY2FsY3VsYXRlIHRoZSBpbnRlcmFjdGFibGUnc1xuICAgKiBlbGVtZW50J3MgcmVjdGFuZ2xlXG4gICAqXG4gICAqIEBwYXJhbSB7ZnVuY3Rpb259IFtjaGVja2VyXSBBIGZ1bmN0aW9uIHdoaWNoIHJldHVybnMgdGhpcyBJbnRlcmFjdGFibGUnc1xuICAgKiBib3VuZGluZyByZWN0YW5nbGUuIFNlZSB7QGxpbmsgSW50ZXJhY3RhYmxlLmdldFJlY3R9XG4gICAqIEByZXR1cm4ge2Z1bmN0aW9uIHwgb2JqZWN0fSBUaGUgY2hlY2tlciBmdW5jdGlvbiBvciB0aGlzIEludGVyYWN0YWJsZVxuICAgKi9cbiAgcmVjdENoZWNrZXIgKGNoZWNrZXI6IChlbGVtZW50OiBFbGVtZW50KSA9PiBhbnkpIHtcbiAgICBpZiAoaXMuZnVuYyhjaGVja2VyKSkge1xuICAgICAgdGhpcy5nZXRSZWN0ID0gY2hlY2tlclxuXG4gICAgICByZXR1cm4gdGhpc1xuICAgIH1cblxuICAgIGlmIChjaGVja2VyID09PSBudWxsKSB7XG4gICAgICBkZWxldGUgdGhpcy5nZXRSZWN0XG5cbiAgICAgIHJldHVybiB0aGlzXG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXMuZ2V0UmVjdFxuICB9XG5cbiAgX2JhY2tDb21wYXRPcHRpb24gKG9wdGlvbk5hbWUsIG5ld1ZhbHVlKSB7XG4gICAgaWYgKHRyeVNlbGVjdG9yKG5ld1ZhbHVlKSB8fCBpcy5vYmplY3QobmV3VmFsdWUpKSB7XG4gICAgICB0aGlzLm9wdGlvbnNbb3B0aW9uTmFtZV0gPSBuZXdWYWx1ZVxuXG4gICAgICBmb3IgKGNvbnN0IGFjdGlvbiBvZiB0aGlzLl9hY3Rpb25zLm5hbWVzKSB7XG4gICAgICAgIHRoaXMub3B0aW9uc1thY3Rpb25dW29wdGlvbk5hbWVdID0gbmV3VmFsdWVcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHRoaXNcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy5vcHRpb25zW29wdGlvbk5hbWVdXG4gIH1cblxuICAvKipcbiAgICogR2V0cyBvciBzZXRzIHRoZSBvcmlnaW4gb2YgdGhlIEludGVyYWN0YWJsZSdzIGVsZW1lbnQuICBUaGUgeCBhbmQgeVxuICAgKiBvZiB0aGUgb3JpZ2luIHdpbGwgYmUgc3VidHJhY3RlZCBmcm9tIGFjdGlvbiBldmVudCBjb29yZGluYXRlcy5cbiAgICpcbiAgICogQHBhcmFtIHtFbGVtZW50IHwgb2JqZWN0IHwgc3RyaW5nfSBbb3JpZ2luXSBBbiBIVE1MIG9yIFNWRyBFbGVtZW50IHdob3NlXG4gICAqIHJlY3Qgd2lsbCBiZSB1c2VkLCBhbiBvYmplY3QgZWcuIHsgeDogMCwgeTogMCB9IG9yIHN0cmluZyAncGFyZW50JywgJ3NlbGYnXG4gICAqIG9yIGFueSBDU1Mgc2VsZWN0b3JcbiAgICpcbiAgICogQHJldHVybiB7b2JqZWN0fSBUaGUgY3VycmVudCBvcmlnaW4gb3IgdGhpcyBJbnRlcmFjdGFibGVcbiAgICovXG4gIG9yaWdpbiAobmV3VmFsdWUpIHtcbiAgICByZXR1cm4gdGhpcy5fYmFja0NvbXBhdE9wdGlvbignb3JpZ2luJywgbmV3VmFsdWUpXG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyBvciBzZXRzIHRoZSBtb3VzZSBjb29yZGluYXRlIHR5cGVzIHVzZWQgdG8gY2FsY3VsYXRlIHRoZVxuICAgKiBtb3ZlbWVudCBvZiB0aGUgcG9pbnRlci5cbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IFtuZXdWYWx1ZV0gVXNlICdjbGllbnQnIGlmIHlvdSB3aWxsIGJlIHNjcm9sbGluZyB3aGlsZVxuICAgKiBpbnRlcmFjdGluZzsgVXNlICdwYWdlJyBpZiB5b3Ugd2FudCBhdXRvU2Nyb2xsIHRvIHdvcmtcbiAgICogQHJldHVybiB7c3RyaW5nIHwgb2JqZWN0fSBUaGUgY3VycmVudCBkZWx0YVNvdXJjZSBvciB0aGlzIEludGVyYWN0YWJsZVxuICAgKi9cbiAgZGVsdGFTb3VyY2UgKG5ld1ZhbHVlKSB7XG4gICAgaWYgKG5ld1ZhbHVlID09PSAncGFnZScgfHwgbmV3VmFsdWUgPT09ICdjbGllbnQnKSB7XG4gICAgICB0aGlzLm9wdGlvbnMuZGVsdGFTb3VyY2UgPSBuZXdWYWx1ZVxuXG4gICAgICByZXR1cm4gdGhpc1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzLm9wdGlvbnMuZGVsdGFTb3VyY2VcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBzZWxlY3RvciBjb250ZXh0IE5vZGUgb2YgdGhlIEludGVyYWN0YWJsZS4gVGhlIGRlZmF1bHQgaXNcbiAgICogYHdpbmRvdy5kb2N1bWVudGAuXG4gICAqXG4gICAqIEByZXR1cm4ge05vZGV9IFRoZSBjb250ZXh0IE5vZGUgb2YgdGhpcyBJbnRlcmFjdGFibGVcbiAgICovXG4gIGNvbnRleHQgKCkge1xuICAgIHJldHVybiB0aGlzLl9jb250ZXh0XG4gIH1cblxuICBpbkNvbnRleHQgKGVsZW1lbnQpIHtcbiAgICByZXR1cm4gKHRoaXMuX2NvbnRleHQgPT09IGVsZW1lbnQub3duZXJEb2N1bWVudCB8fFxuICAgICAgICAgICAgbm9kZUNvbnRhaW5zKHRoaXMuX2NvbnRleHQsIGVsZW1lbnQpKVxuICB9XG5cbiAgLyoqXG4gICAqIENhbGxzIGxpc3RlbmVycyBmb3IgdGhlIGdpdmVuIEludGVyYWN0RXZlbnQgdHlwZSBib3VuZCBnbG9iYWxseVxuICAgKiBhbmQgZGlyZWN0bHkgdG8gdGhpcyBJbnRlcmFjdGFibGVcbiAgICpcbiAgICogQHBhcmFtIHtJbnRlcmFjdEV2ZW50fSBpRXZlbnQgVGhlIEludGVyYWN0RXZlbnQgb2JqZWN0IHRvIGJlIGZpcmVkIG9uIHRoaXNcbiAgICogSW50ZXJhY3RhYmxlXG4gICAqIEByZXR1cm4ge0ludGVyYWN0YWJsZX0gdGhpcyBJbnRlcmFjdGFibGVcbiAgICovXG4gIGZpcmUgKGlFdmVudCkge1xuICAgIHRoaXMuZXZlbnRzLmZpcmUoaUV2ZW50KVxuXG4gICAgcmV0dXJuIHRoaXNcbiAgfVxuXG4gIF9vbk9mZiAobWV0aG9kOiAnb24nIHwgJ29mZicsIHR5cGVBcmc6IEludGVyYWN0LkV2ZW50VHlwZXMsIGxpc3RlbmVyQXJnPzogSW50ZXJhY3QuTGlzdGVuZXJzQXJnIHwgbnVsbCwgb3B0aW9ucz86IGFueSkge1xuICAgIGlmIChpcy5vYmplY3QodHlwZUFyZykgJiYgIWlzLmFycmF5KHR5cGVBcmcpKSB7XG4gICAgICBvcHRpb25zID0gbGlzdGVuZXJBcmdcbiAgICAgIGxpc3RlbmVyQXJnID0gbnVsbFxuICAgIH1cblxuICAgIGNvbnN0IGFkZFJlbW92ZSA9IG1ldGhvZCA9PT0gJ29uJyA/ICdhZGQnIDogJ3JlbW92ZSdcbiAgICBjb25zdCBsaXN0ZW5lcnMgPSBub3JtYWxpemVMaXN0ZW5lcnModHlwZUFyZywgbGlzdGVuZXJBcmcpXG5cbiAgICBmb3IgKGxldCB0eXBlIGluIGxpc3RlbmVycykge1xuICAgICAgaWYgKHR5cGUgPT09ICd3aGVlbCcpIHsgdHlwZSA9IGJyb3dzZXIud2hlZWxFdmVudCB9XG5cbiAgICAgIGZvciAoY29uc3QgbGlzdGVuZXIgb2YgbGlzdGVuZXJzW3R5cGVdKSB7XG4gICAgICAgIC8vIGlmIGl0IGlzIGFuIGFjdGlvbiBldmVudCB0eXBlXG4gICAgICAgIGlmIChhcnIuY29udGFpbnModGhpcy5fYWN0aW9ucy5ldmVudFR5cGVzLCB0eXBlKSkge1xuICAgICAgICAgIHRoaXMuZXZlbnRzW21ldGhvZF0odHlwZSwgbGlzdGVuZXIpXG4gICAgICAgIH1cbiAgICAgICAgLy8gZGVsZWdhdGVkIGV2ZW50XG4gICAgICAgIGVsc2UgaWYgKGlzLnN0cmluZyh0aGlzLnRhcmdldCkpIHtcbiAgICAgICAgICBldmVudHNbYCR7YWRkUmVtb3ZlfURlbGVnYXRlYF0odGhpcy50YXJnZXQsIHRoaXMuX2NvbnRleHQsIHR5cGUsIGxpc3RlbmVyLCBvcHRpb25zKVxuICAgICAgICB9XG4gICAgICAgIC8vIHJlbW92ZSBsaXN0ZW5lciBmcm9tIHRoaXMgSW50ZXJhdGFibGUncyBlbGVtZW50XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgIChldmVudHNbYWRkUmVtb3ZlXSBhcyB0eXBlb2YgZXZlbnRzLnJlbW92ZSkodGhpcy50YXJnZXQsIHR5cGUsIGxpc3RlbmVyLCBvcHRpb25zKVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXNcbiAgfVxuXG4gIC8qKlxuICAgKiBCaW5kcyBhIGxpc3RlbmVyIGZvciBhbiBJbnRlcmFjdEV2ZW50LCBwb2ludGVyRXZlbnQgb3IgRE9NIGV2ZW50LlxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZyB8IGFycmF5IHwgb2JqZWN0fSB0eXBlcyBUaGUgdHlwZXMgb2YgZXZlbnRzIHRvIGxpc3RlblxuICAgKiBmb3JcbiAgICogQHBhcmFtIHtmdW5jdGlvbiB8IGFycmF5IHwgb2JqZWN0fSBbbGlzdGVuZXJdIFRoZSBldmVudCBsaXN0ZW5lciBmdW5jdGlvbihzKVxuICAgKiBAcGFyYW0ge29iamVjdCB8IGJvb2xlYW59IFtvcHRpb25zXSBvcHRpb25zIG9iamVjdCBvciB1c2VDYXB0dXJlIGZsYWcgZm9yXG4gICAqIGFkZEV2ZW50TGlzdGVuZXJcbiAgICogQHJldHVybiB7SW50ZXJhY3RhYmxlfSBUaGlzIEludGVyYWN0YWJsZVxuICAgKi9cbiAgb24gKHR5cGVzOiBJbnRlcmFjdC5FdmVudFR5cGVzLCBsaXN0ZW5lcj86IEludGVyYWN0Lkxpc3RlbmVyc0FyZywgb3B0aW9ucz86IGFueSkge1xuICAgIHJldHVybiB0aGlzLl9vbk9mZignb24nLCB0eXBlcywgbGlzdGVuZXIsIG9wdGlvbnMpXG4gIH1cblxuICAvKipcbiAgICogUmVtb3ZlcyBhbiBJbnRlcmFjdEV2ZW50LCBwb2ludGVyRXZlbnQgb3IgRE9NIGV2ZW50IGxpc3RlbmVyLlxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZyB8IGFycmF5IHwgb2JqZWN0fSB0eXBlcyBUaGUgdHlwZXMgb2YgZXZlbnRzIHRoYXQgd2VyZVxuICAgKiBsaXN0ZW5lZCBmb3JcbiAgICogQHBhcmFtIHtmdW5jdGlvbiB8IGFycmF5IHwgb2JqZWN0fSBbbGlzdGVuZXJdIFRoZSBldmVudCBsaXN0ZW5lciBmdW5jdGlvbihzKVxuICAgKiBAcGFyYW0ge29iamVjdCB8IGJvb2xlYW59IFtvcHRpb25zXSBvcHRpb25zIG9iamVjdCBvciB1c2VDYXB0dXJlIGZsYWcgZm9yXG4gICAqIHJlbW92ZUV2ZW50TGlzdGVuZXJcbiAgICogQHJldHVybiB7SW50ZXJhY3RhYmxlfSBUaGlzIEludGVyYWN0YWJsZVxuICAgKi9cbiAgb2ZmICh0eXBlczogc3RyaW5nIHwgc3RyaW5nW10gfCBJbnRlcmFjdC5FdmVudFR5cGVzLCBsaXN0ZW5lcj86IEludGVyYWN0Lkxpc3RlbmVyc0FyZywgb3B0aW9ucz86IGFueSkge1xuICAgIHJldHVybiB0aGlzLl9vbk9mZignb2ZmJywgdHlwZXMsIGxpc3RlbmVyLCBvcHRpb25zKVxuICB9XG5cbiAgLyoqXG4gICAqIFJlc2V0IHRoZSBvcHRpb25zIG9mIHRoaXMgSW50ZXJhY3RhYmxlXG4gICAqXG4gICAqIEBwYXJhbSB7b2JqZWN0fSBvcHRpb25zIFRoZSBuZXcgc2V0dGluZ3MgdG8gYXBwbHlcbiAgICogQHJldHVybiB7b2JqZWN0fSBUaGlzIEludGVyYWN0YWJsZVxuICAgKi9cbiAgc2V0IChvcHRpb25zOiBJbnRlcmFjdC5PcHRpb25zQXJnKSB7XG4gICAgY29uc3QgZGVmYXVsdHMgPSB0aGlzLl9kZWZhdWx0c1xuXG4gICAgaWYgKCFpcy5vYmplY3Qob3B0aW9ucykpIHtcbiAgICAgIG9wdGlvbnMgPSB7fVxuICAgIH1cblxuICAgICh0aGlzLm9wdGlvbnMgYXMgUmVxdWlyZWQ8T3B0aW9ucz4pID0gY2xvbmUoZGVmYXVsdHMuYmFzZSkgYXMgUmVxdWlyZWQ8T3B0aW9ucz5cblxuICAgIGZvciAoY29uc3QgYWN0aW9uTmFtZSBpbiB0aGlzLl9hY3Rpb25zLm1ldGhvZERpY3QpIHtcbiAgICAgIGNvbnN0IG1ldGhvZE5hbWUgPSB0aGlzLl9hY3Rpb25zLm1ldGhvZERpY3RbYWN0aW9uTmFtZV1cblxuICAgICAgdGhpcy5vcHRpb25zW2FjdGlvbk5hbWVdID0ge31cbiAgICAgIHRoaXMuc2V0UGVyQWN0aW9uKGFjdGlvbk5hbWUsIGV4dGVuZChleHRlbmQoe30sIGRlZmF1bHRzLnBlckFjdGlvbiksIGRlZmF1bHRzLmFjdGlvbnNbYWN0aW9uTmFtZV0pKVxuXG4gICAgICB0aGlzW21ldGhvZE5hbWVdKG9wdGlvbnNbYWN0aW9uTmFtZV0pXG4gICAgfVxuXG4gICAgZm9yIChjb25zdCBzZXR0aW5nIGluIG9wdGlvbnMpIHtcbiAgICAgIGlmIChpcy5mdW5jKHRoaXNbc2V0dGluZ10pKSB7XG4gICAgICAgIHRoaXNbc2V0dGluZ10ob3B0aW9uc1tzZXR0aW5nXSlcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gdGhpc1xuICB9XG5cbiAgLyoqXG4gICAqIFJlbW92ZSB0aGlzIGludGVyYWN0YWJsZSBmcm9tIHRoZSBsaXN0IG9mIGludGVyYWN0YWJsZXMgYW5kIHJlbW92ZSBpdCdzXG4gICAqIGFjdGlvbiBjYXBhYmlsaXRpZXMgYW5kIGV2ZW50IGxpc3RlbmVyc1xuICAgKlxuICAgKiBAcmV0dXJuIHtpbnRlcmFjdH1cbiAgICovXG4gIHVuc2V0ICgpIHtcbiAgICBldmVudHMucmVtb3ZlKHRoaXMudGFyZ2V0IGFzIE5vZGUsICdhbGwnKVxuXG4gICAgaWYgKGlzLnN0cmluZyh0aGlzLnRhcmdldCkpIHtcbiAgICAgIC8vIHJlbW92ZSBkZWxlZ2F0ZWQgZXZlbnRzXG4gICAgICBmb3IgKGNvbnN0IHR5cGUgaW4gZXZlbnRzLmRlbGVnYXRlZEV2ZW50cykge1xuICAgICAgICBjb25zdCBkZWxlZ2F0ZWQgPSBldmVudHMuZGVsZWdhdGVkRXZlbnRzW3R5cGVdXG5cbiAgICAgICAgaWYgKGRlbGVnYXRlZC5zZWxlY3RvcnNbMF0gPT09IHRoaXMudGFyZ2V0ICYmXG4gICAgICAgICAgICBkZWxlZ2F0ZWQuY29udGV4dHNbMF0gPT09IHRoaXMuX2NvbnRleHQpIHtcbiAgICAgICAgICBkZWxlZ2F0ZWQuc2VsZWN0b3JzLnNwbGljZSgwLCAxKVxuICAgICAgICAgIGRlbGVnYXRlZC5jb250ZXh0cy5zcGxpY2UoMCwgMSlcbiAgICAgICAgICBkZWxlZ2F0ZWQubGlzdGVuZXJzLnNwbGljZSgwLCAxKVxuXG4gICAgICAgICAgLy8gcmVtb3ZlIHRoZSBhcnJheXMgaWYgdGhleSBhcmUgZW1wdHlcbiAgICAgICAgICBpZiAoIWRlbGVnYXRlZC5zZWxlY3RvcnMubGVuZ3RoKSB7XG4gICAgICAgICAgICBkZWxlZ2F0ZWRbdHlwZV0gPSBudWxsXG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgZXZlbnRzLnJlbW92ZSh0aGlzLl9jb250ZXh0LCB0eXBlLCBldmVudHMuZGVsZWdhdGVMaXN0ZW5lcilcbiAgICAgICAgZXZlbnRzLnJlbW92ZSh0aGlzLl9jb250ZXh0LCB0eXBlLCBldmVudHMuZGVsZWdhdGVVc2VDYXB0dXJlLCB0cnVlKVxuICAgICAgfVxuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIGV2ZW50cy5yZW1vdmUodGhpcy50YXJnZXQgYXMgTm9kZSwgJ2FsbCcpXG4gICAgfVxuICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IEludGVyYWN0YWJsZVxuIl19