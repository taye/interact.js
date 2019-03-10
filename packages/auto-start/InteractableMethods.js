import { warnOnce } from '@interactjs/utils';
import * as domUtils from '@interactjs/utils/domUtils';
import * as is from '@interactjs/utils/is';
function install(scope) {
    const { 
    /** @lends Interactable */
    Interactable, // tslint:disable-line no-shadowed-variable
    actions, } = scope;
    Interactable.prototype.getAction = getAction;
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
    Interactable.prototype.ignoreFrom = warnOnce(function (newValue) {
        return this._backCompatOption('ignoreFrom', newValue);
    }, 'Interactable.ignoreFrom() has been deprecated. Use Interactble.draggable({ignoreFrom: newValue}).');
    /**
     * @deprecated
     *
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
    Interactable.prototype.allowFrom = warnOnce(function (newValue) {
        return this._backCompatOption('allowFrom', newValue);
    }, 'Interactable.allowFrom() has been deprecated. Use Interactble.draggable({allowFrom: newValue}).');
    Interactable.prototype.testIgnore = testIgnore;
    Interactable.prototype.testAllow = testAllow;
    Interactable.prototype.testIgnoreAllow = testIgnoreAllow;
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
    Interactable.prototype.actionChecker = actionChecker;
    /**
     * Returns or sets whether the the cursor should be changed depending on the
     * action that would be performed if the mouse were pressed and dragged.
     *
     * @param {boolean} [newValue]
     * @return {boolean | Interactable} The current setting or this Interactable
     */
    Interactable.prototype.styleCursor = styleCursor;
    Interactable.prototype.defaultActionChecker = function (pointer, event, interaction, element) {
        return defaultActionChecker(this, pointer, event, interaction, element, actions);
    };
}
function getAction(pointer, event, interaction, element) {
    const action = this.defaultActionChecker(pointer, event, interaction, element);
    if (this.options.actionChecker) {
        return this.options.actionChecker(pointer, event, action, this, element, interaction);
    }
    return action;
}
function defaultActionChecker(interactable, pointer, event, interaction, element, actions) {
    const rect = interactable.getRect(element);
    const buttons = event.buttons || ({
        0: 1,
        1: 4,
        3: 8,
        4: 16,
    })[event.button];
    let action = null;
    for (const actionName of actions.names) {
        // check mouseButton setting if the pointer is down
        if (interaction.pointerIsDown &&
            /mouse|pointer/.test(interaction.pointerType) &&
            (buttons & interactable.options[actionName].mouseButtons) === 0) {
            continue;
        }
        action = actions[actionName].checker(pointer, event, interactable, element, interaction, rect);
        if (action) {
            return action;
        }
    }
}
function styleCursor(newValue) {
    if (is.bool(newValue)) {
        this.options.styleCursor = newValue;
        return this;
    }
    if (newValue === null) {
        delete this.options.styleCursor;
        return this;
    }
    return this.options.styleCursor;
}
function actionChecker(checker) {
    if (is.func(checker)) {
        this.options.actionChecker = checker;
        return this;
    }
    if (checker === null) {
        delete this.options.actionChecker;
        return this;
    }
    return this.options.actionChecker;
}
function testIgnoreAllow(options, interactableElement, eventTarget) {
    return (!this.testIgnore(options.ignoreFrom, interactableElement, eventTarget) &&
        this.testAllow(options.allowFrom, interactableElement, eventTarget));
}
function testAllow(allowFrom, interactableElement, element) {
    if (!allowFrom) {
        return true;
    }
    if (!is.element(element)) {
        return false;
    }
    if (is.string(allowFrom)) {
        return domUtils.matchesUpTo(element, allowFrom, interactableElement);
    }
    else if (is.element(allowFrom)) {
        return domUtils.nodeContains(allowFrom, element);
    }
    return false;
}
function testIgnore(ignoreFrom, interactableElement, element) {
    if (!ignoreFrom || !is.element(element)) {
        return false;
    }
    if (is.string(ignoreFrom)) {
        return domUtils.matchesUpTo(element, ignoreFrom, interactableElement);
    }
    else if (is.element(ignoreFrom)) {
        return domUtils.nodeContains(ignoreFrom, element);
    }
    return false;
}
export default { install };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiSW50ZXJhY3RhYmxlTWV0aG9kcy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIkludGVyYWN0YWJsZU1ldGhvZHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUFFLFFBQVEsRUFBRSxNQUFNLG1CQUFtQixDQUFBO0FBQzVDLE9BQU8sS0FBSyxRQUFRLE1BQU0sNEJBQTRCLENBQUE7QUFDdEQsT0FBTyxLQUFLLEVBQUUsTUFBTSxzQkFBc0IsQ0FBQTtBQStCMUMsU0FBUyxPQUFPLENBQUUsS0FBWTtJQUM1QixNQUFNO0lBQ0osMEJBQTBCO0lBQzFCLFlBQVksRUFBRSwyQ0FBMkM7SUFDekQsT0FBTyxHQUNSLEdBQUcsS0FBSyxDQUFBO0lBRVQsWUFBWSxDQUFDLFNBQVMsQ0FBQyxTQUFTLEdBQUcsU0FBUyxDQUFBO0lBRTVDOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7T0EyQkc7SUFDSCxZQUFZLENBQUMsU0FBUyxDQUFDLFVBQVUsR0FBRyxRQUFRLENBQUMsVUFBOEIsUUFBUTtRQUNqRixPQUFPLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxZQUFZLEVBQUUsUUFBUSxDQUFDLENBQUE7SUFDdkQsQ0FBQyxFQUFFLG1HQUFtRyxDQUFDLENBQUE7SUFFdkc7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7T0FzQkc7SUFDSCxZQUFZLENBQUMsU0FBUyxDQUFDLFNBQVMsR0FBRyxRQUFRLENBQUMsVUFBOEIsUUFBUTtRQUNoRixPQUFPLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxXQUFXLEVBQUUsUUFBUSxDQUFDLENBQUE7SUFDdEQsQ0FBQyxFQUFFLGlHQUFpRyxDQUFDLENBQUE7SUFFckcsWUFBWSxDQUFDLFNBQVMsQ0FBQyxVQUFVLEdBQUcsVUFBVSxDQUFBO0lBRTlDLFlBQVksQ0FBQyxTQUFTLENBQUMsU0FBUyxHQUFHLFNBQVMsQ0FBQTtJQUU1QyxZQUFZLENBQUMsU0FBUyxDQUFDLGVBQWUsR0FBRyxlQUFlLENBQUE7SUFFeEQ7Ozs7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QzlHLElBQUksQ0FBQyxVQUFVLElBQUksQ0FBQyxFQUFFLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxFQUFFO1FBQUUsT0FBTyxLQUFLLENBQUE7S0FBRTtJQUV6RCxJQUFJLEVBQUUsQ0FBQyxNQUFNLENBQUMsVUFBVSxDQUFDLEVBQUU7UUFDekIsT0FBTyxRQUFRLENBQUMsV0FBVyxDQUFDLE9BQU8sRUFBRSxVQUFVLEVBQUUsbUJBQW1CLENBQUMsQ0FBQTtLQUN0RTtTQUNJLElBQUksRUFBRSxDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUMsRUFBRTtRQUMvQixPQUFPLFFBQVEsQ0FBQyxZQUFZLENBQUMsVUFBVSxFQUFFLE9BQU8sQ0FBQyxDQUFBO0tBQ2xEO0lBRUQsT0FBTyxLQUFLLENBQUE7QUFDZCxDQUFDO0FBRUQsZUFBZSxFQUFFLE9BQU8sRUFBRSxDQUFBIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgd2Fybk9uY2UgfSBmcm9tICdAaW50ZXJhY3Rqcy91dGlscydcbmltcG9ydCAqIGFzIGRvbVV0aWxzIGZyb20gJ0BpbnRlcmFjdGpzL3V0aWxzL2RvbVV0aWxzJ1xuaW1wb3J0ICogYXMgaXMgZnJvbSAnQGludGVyYWN0anMvdXRpbHMvaXMnXG5cbi8vIFRPRE86IHRoZXJlIHNlZW1zIHRvIGJlIGEgQGJhYmVsL3ByZXNldC10eXBlc2NyaXB0IGJ1ZyBjYXVzaW5nIHJlZ3VsYXIgaW1wb3J0XG4vLyBzeW50YXggdG8gcmVtYWluIGluIGpzIG91dHB1dFxudHlwZSBTY29wZSA9IGltcG9ydCAoJ0BpbnRlcmFjdGpzL2NvcmUvc2NvcGUnKS5TY29wZVxudHlwZSBBY3Rpb25zID0gaW1wb3J0ICgnQGludGVyYWN0anMvY29yZS9zY29wZScpLkFjdGlvbnNcbnR5cGUgSW50ZXJhY3Rpb24gPSBpbXBvcnQgKCdAaW50ZXJhY3Rqcy9jb3JlL0ludGVyYWN0aW9uJykuZGVmYXVsdFxudHlwZSBJbnRlcmFjdGFibGUgPSBpbXBvcnQgKCdAaW50ZXJhY3Rqcy9jb3JlL0ludGVyYWN0YWJsZScpLmRlZmF1bHRcblxudHlwZSBJZ25vcmVWYWx1ZSA9IHN0cmluZyB8IEVsZW1lbnQgfCBib29sZWFuXG5cbmRlY2xhcmUgbW9kdWxlICdAaW50ZXJhY3Rqcy9jb3JlL0ludGVyYWN0YWJsZScge1xuICBpbnRlcmZhY2UgSW50ZXJhY3RhYmxlIHtcbiAgICBnZXRBY3Rpb246IHR5cGVvZiBnZXRBY3Rpb25cbiAgICBkZWZhdWx0QWN0aW9uQ2hlY2tlcjogKHBvaW50ZXI6IGFueSwgZXZlbnQ6IGFueSwgaW50ZXJhY3Rpb246IGFueSwgZWxlbWVudDogYW55KSA9PiBhbnlcbiAgICBzdHlsZUN1cnNvcjogdHlwZW9mIHN0eWxlQ3Vyc29yXG4gICAgYWN0aW9uQ2hlY2tlcjogdHlwZW9mIGFjdGlvbkNoZWNrZXJcbiAgICB0ZXN0SWdub3JlQWxsb3c6IHR5cGVvZiB0ZXN0SWdub3JlQWxsb3dcbiAgICB0ZXN0QWxsb3c6IHR5cGVvZiB0ZXN0QWxsb3dcbiAgICB0ZXN0SWdub3JlOiB0eXBlb2YgdGVzdElnbm9yZVxuICAgIGlnbm9yZUZyb206ICguLi5hcmdzOiBhbnkpID0+IGJvb2xlYW5cbiAgICBhbGxvd0Zyb206ICguLi5hcmdzOiBhbnkpID0+IGJvb2xlYW5cbiAgfVxufVxuXG5kZWNsYXJlIG1vZHVsZSAnQGludGVyYWN0anMvY29yZS9JbnRlcmFjdGlvbicge1xuICBpbnRlcmZhY2UgSW50ZXJhY3Rpb24ge1xuICAgIHBvaW50ZXJJc0Rvd246IGJvb2xlYW5cbiAgfVxufVxuXG5mdW5jdGlvbiBpbnN0YWxsIChzY29wZTogU2NvcGUpIHtcbiAgY29uc3Qge1xuICAgIC8qKiBAbGVuZHMgSW50ZXJhY3RhYmxlICovXG4gICAgSW50ZXJhY3RhYmxlLCAvLyB0c2xpbnQ6ZGlzYWJsZS1saW5lIG5vLXNoYWRvd2VkLXZhcmlhYmxlXG4gICAgYWN0aW9ucyxcbiAgfSA9IHNjb3BlXG5cbiAgSW50ZXJhY3RhYmxlLnByb3RvdHlwZS5nZXRBY3Rpb24gPSBnZXRBY3Rpb25cblxuICAvKipcbiAgICogYGBganNcbiAgICogaW50ZXJhY3QoZWxlbWVudCwgeyBpZ25vcmVGcm9tOiBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbm8tYWN0aW9uJykgfSk7XG4gICAqIC8vIG9yXG4gICAqIGludGVyYWN0KGVsZW1lbnQpLmlnbm9yZUZyb20oJ2lucHV0LCB0ZXh0YXJlYSwgYScpO1xuICAgKiBgYGBcbiAgICogQGRlcHJlY2F0ZWRcbiAgICogSWYgdGhlIHRhcmdldCBvZiB0aGUgYG1vdXNlZG93bmAsIGBwb2ludGVyZG93bmAgb3IgYHRvdWNoc3RhcnRgIGV2ZW50IG9yIGFueVxuICAgKiBvZiBpdCdzIHBhcmVudHMgbWF0Y2ggdGhlIGdpdmVuIENTUyBzZWxlY3RvciBvciBFbGVtZW50LCBub1xuICAgKiBkcmFnL3Jlc2l6ZS9nZXN0dXJlIGlzIHN0YXJ0ZWQuXG4gICAqXG4gICAqIERvbid0IHVzZSB0aGlzIG1ldGhvZC4gSW5zdGVhZCBzZXQgdGhlIGBpZ25vcmVGcm9tYCBvcHRpb24gZm9yIGVhY2ggYWN0aW9uXG4gICAqIG9yIGZvciBgcG9pbnRlckV2ZW50c2BcbiAgICpcbiAgICogQGV4YW1wbGVcbiAgICogaW50ZXJhY3QodGFyZ2V0dClcbiAgICogICAuZHJhZ2dhYmxlKHtcbiAgICogICAgIGlnbm9yZUZyb206ICdpbnB1dCwgdGV4dGFyZWEsIGFbaHJlZl0nJyxcbiAgICogICB9KVxuICAgKiAgIC5wb2ludGVyRXZlbnRzKHtcbiAgICogICAgIGlnbm9yZUZyb206ICdbbm8tcG9pbnRlcl0nLFxuICAgKiAgIH0pO1xuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZyB8IEVsZW1lbnQgfCBudWxsfSBbbmV3VmFsdWVdIGEgQ1NTIHNlbGVjdG9yIHN0cmluZywgYW5cbiAgICogRWxlbWVudCBvciBgbnVsbGAgdG8gbm90IGlnbm9yZSBhbnkgZWxlbWVudHNcbiAgICogQHJldHVybiB7c3RyaW5nIHwgRWxlbWVudCB8IG9iamVjdH0gVGhlIGN1cnJlbnQgaWdub3JlRnJvbSB2YWx1ZSBvciB0aGlzXG4gICAqIEludGVyYWN0YWJsZVxuICAgKi9cbiAgSW50ZXJhY3RhYmxlLnByb3RvdHlwZS5pZ25vcmVGcm9tID0gd2Fybk9uY2UoZnVuY3Rpb24gKHRoaXM6IEludGVyYWN0YWJsZSwgbmV3VmFsdWUpIHtcbiAgICByZXR1cm4gdGhpcy5fYmFja0NvbXBhdE9wdGlvbignaWdub3JlRnJvbScsIG5ld1ZhbHVlKVxuICB9LCAnSW50ZXJhY3RhYmxlLmlnbm9yZUZyb20oKSBoYXMgYmVlbiBkZXByZWNhdGVkLiBVc2UgSW50ZXJhY3RibGUuZHJhZ2dhYmxlKHtpZ25vcmVGcm9tOiBuZXdWYWx1ZX0pLicpXG5cbiAgLyoqXG4gICAqIEBkZXByZWNhdGVkXG4gICAqXG4gICAqIEEgZHJhZy9yZXNpemUvZ2VzdHVyZSBpcyBzdGFydGVkIG9ubHkgSWYgdGhlIHRhcmdldCBvZiB0aGUgYG1vdXNlZG93bmAsXG4gICAqIGBwb2ludGVyZG93bmAgb3IgYHRvdWNoc3RhcnRgIGV2ZW50IG9yIGFueSBvZiBpdCdzIHBhcmVudHMgbWF0Y2ggdGhlIGdpdmVuXG4gICAqIENTUyBzZWxlY3RvciBvciBFbGVtZW50LlxuICAgKlxuICAgKiBEb24ndCB1c2UgdGhpcyBtZXRob2QuIEluc3RlYWQgc2V0IHRoZSBgYWxsb3dGcm9tYCBvcHRpb24gZm9yIGVhY2ggYWN0aW9uXG4gICAqIG9yIGZvciBgcG9pbnRlckV2ZW50c2BcbiAgICpcbiAgICogQGV4YW1wbGVcbiAgICogaW50ZXJhY3QodGFyZ2V0dClcbiAgICogICAucmVzaXphYmxlKHtcbiAgICogICAgIGFsbG93RnJvbTogJy5yZXNpemUtaGFuZGxlJyxcbiAgICogICAucG9pbnRlckV2ZW50cyh7XG4gICAqICAgICBhbGxvd0Zyb206ICcuaGFuZGxlJywsXG4gICAqICAgfSk7XG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nIHwgRWxlbWVudCB8IG51bGx9IFtuZXdWYWx1ZV0gYSBDU1Mgc2VsZWN0b3Igc3RyaW5nLCBhblxuICAgKiBFbGVtZW50IG9yIGBudWxsYCB0byBhbGxvdyBmcm9tIGFueSBlbGVtZW50XG4gICAqIEByZXR1cm4ge3N0cmluZyB8IEVsZW1lbnQgfCBvYmplY3R9IFRoZSBjdXJyZW50IGFsbG93RnJvbSB2YWx1ZSBvciB0aGlzXG4gICAqIEludGVyYWN0YWJsZVxuICAgKi9cbiAgSW50ZXJhY3RhYmxlLnByb3RvdHlwZS5hbGxvd0Zyb20gPSB3YXJuT25jZShmdW5jdGlvbiAodGhpczogSW50ZXJhY3RhYmxlLCBuZXdWYWx1ZSkge1xuICAgIHJldHVybiB0aGlzLl9iYWNrQ29tcGF0T3B0aW9uKCdhbGxvd0Zyb20nLCBuZXdWYWx1ZSlcbiAgfSwgJ0ludGVyYWN0YWJsZS5hbGxvd0Zyb20oKSBoYXMgYmVlbiBkZXByZWNhdGVkLiBVc2UgSW50ZXJhY3RibGUuZHJhZ2dhYmxlKHthbGxvd0Zyb206IG5ld1ZhbHVlfSkuJylcblxuICBJbnRlcmFjdGFibGUucHJvdG90eXBlLnRlc3RJZ25vcmUgPSB0ZXN0SWdub3JlXG5cbiAgSW50ZXJhY3RhYmxlLnByb3RvdHlwZS50ZXN0QWxsb3cgPSB0ZXN0QWxsb3dcblxuICBJbnRlcmFjdGFibGUucHJvdG90eXBlLnRlc3RJZ25vcmVBbGxvdyA9IHRlc3RJZ25vcmVBbGxvd1xuXG4gIC8qKlxuICAgKiBgYGBqc1xuICAgKiBpbnRlcmFjdCgnLnJlc2l6ZS1kcmFnJylcbiAgICogICAucmVzaXphYmxlKHRydWUpXG4gICAqICAgLmRyYWdnYWJsZSh0cnVlKVxuICAgKiAgIC5hY3Rpb25DaGVja2VyKGZ1bmN0aW9uIChwb2ludGVyLCBldmVudCwgYWN0aW9uLCBpbnRlcmFjdGFibGUsIGVsZW1lbnQsIGludGVyYWN0aW9uKSB7XG4gICAqXG4gICAqICAgaWYgKGludGVyYWN0Lm1hdGNoZXNTZWxlY3RvcihldmVudC50YXJnZXQsICcuZHJhZy1oYW5kbGUnKSB7XG4gICAqICAgICAvLyBmb3JjZSBkcmFnIHdpdGggaGFuZGxlIHRhcmdldFxuICAgKiAgICAgYWN0aW9uLm5hbWUgPSBkcmFnO1xuICAgKiAgIH1cbiAgICogICBlbHNlIHtcbiAgICogICAgIC8vIHJlc2l6ZSBmcm9tIHRoZSB0b3AgYW5kIHJpZ2h0IGVkZ2VzXG4gICAqICAgICBhY3Rpb24ubmFtZSAgPSAncmVzaXplJztcbiAgICogICAgIGFjdGlvbi5lZGdlcyA9IHsgdG9wOiB0cnVlLCByaWdodDogdHJ1ZSB9O1xuICAgKiAgIH1cbiAgICpcbiAgICogICByZXR1cm4gYWN0aW9uO1xuICAgKiB9KTtcbiAgICogYGBgXG4gICAqXG4gICAqIEdldHMgb3Igc2V0cyB0aGUgZnVuY3Rpb24gdXNlZCB0byBjaGVjayBhY3Rpb24gdG8gYmUgcGVyZm9ybWVkIG9uXG4gICAqIHBvaW50ZXJEb3duXG4gICAqXG4gICAqIEBwYXJhbSB7ZnVuY3Rpb24gfCBudWxsfSBbY2hlY2tlcl0gQSBmdW5jdGlvbiB3aGljaCB0YWtlcyBhIHBvaW50ZXIgZXZlbnQsXG4gICAqIGRlZmF1bHRBY3Rpb24gc3RyaW5nLCBpbnRlcmFjdGFibGUsIGVsZW1lbnQgYW5kIGludGVyYWN0aW9uIGFzIHBhcmFtZXRlcnNcbiAgICogYW5kIHJldHVybnMgYW4gb2JqZWN0IHdpdGggbmFtZSBwcm9wZXJ0eSAnZHJhZycgJ3Jlc2l6ZScgb3IgJ2dlc3R1cmUnIGFuZFxuICAgKiBvcHRpb25hbGx5IGFuIGBlZGdlc2Agb2JqZWN0IHdpdGggYm9vbGVhbiAndG9wJywgJ2xlZnQnLCAnYm90dG9tJyBhbmQgcmlnaHRcbiAgICogcHJvcHMuXG4gICAqIEByZXR1cm4ge0Z1bmN0aW9uIHwgSW50ZXJhY3RhYmxlfSBUaGUgY2hlY2tlciBmdW5jdGlvbiBvciB0aGlzIEludGVyYWN0YWJsZVxuICAgKi9cbiAgSW50ZXJhY3RhYmxlLnByb3RvdHlwZS5hY3Rpb25DaGVja2VyID0gYWN0aW9uQ2hlY2tlclxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIG9yIHNldHMgd2hldGhlciB0aGUgdGhlIGN1cnNvciBzaG91bGQgYmUgY2hhbmdlZCBkZXBlbmRpbmcgb24gdGhlXG4gICAqIGFjdGlvbiB0aGF0IHdvdWxkIGJlIHBlcmZvcm1lZCBpZiB0aGUgbW91c2Ugd2VyZSBwcmVzc2VkIGFuZCBkcmFnZ2VkLlxuICAgKlxuICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtuZXdWYWx1ZV1cbiAgICogQHJldHVybiB7Ym9vbGVhbiB8IEludGVyYWN0YWJsZX0gVGhlIGN1cnJlbnQgc2V0dGluZyBvciB0aGlzIEludGVyYWN0YWJsZVxuICAgKi9cbiAgSW50ZXJhY3RhYmxlLnByb3RvdHlwZS5zdHlsZUN1cnNvciA9IHN0eWxlQ3Vyc29yXG5cbiAgSW50ZXJhY3RhYmxlLnByb3RvdHlwZS5kZWZhdWx0QWN0aW9uQ2hlY2tlciA9IGZ1bmN0aW9uICh0aGlzOiBJbnRlcmFjdGFibGUsIHBvaW50ZXIsIGV2ZW50LCBpbnRlcmFjdGlvbiwgZWxlbWVudCkge1xuICAgIHJldHVybiBkZWZhdWx0QWN0aW9uQ2hlY2tlcih0aGlzLCBwb2ludGVyLCBldmVudCwgaW50ZXJhY3Rpb24sIGVsZW1lbnQsIGFjdGlvbnMpXG4gIH1cbn1cblxuZnVuY3Rpb24gZ2V0QWN0aW9uICh0aGlzOiBJbnRlcmFjdGFibGUsIHBvaW50ZXI6IEludGVyYWN0LlBvaW50ZXJUeXBlLCBldmVudDogSW50ZXJhY3QuUG9pbnRlckV2ZW50VHlwZSwgaW50ZXJhY3Rpb246IEludGVyYWN0aW9uLCBlbGVtZW50OiBFbGVtZW50KTogSW50ZXJhY3QuQWN0aW9uUHJvcHMge1xuICBjb25zdCBhY3Rpb24gPSB0aGlzLmRlZmF1bHRBY3Rpb25DaGVja2VyKHBvaW50ZXIsIGV2ZW50LCBpbnRlcmFjdGlvbiwgZWxlbWVudClcblxuICBpZiAodGhpcy5vcHRpb25zLmFjdGlvbkNoZWNrZXIpIHtcbiAgICByZXR1cm4gdGhpcy5vcHRpb25zLmFjdGlvbkNoZWNrZXIocG9pbnRlciwgZXZlbnQsIGFjdGlvbiwgdGhpcywgZWxlbWVudCwgaW50ZXJhY3Rpb24pXG4gIH1cblxuICByZXR1cm4gYWN0aW9uXG59XG5cbmZ1bmN0aW9uIGRlZmF1bHRBY3Rpb25DaGVja2VyIChpbnRlcmFjdGFibGU6IEludGVyYWN0YWJsZSwgcG9pbnRlcjogSW50ZXJhY3QuUG9pbnRlclR5cGUsIGV2ZW50OiBJbnRlcmFjdC5Qb2ludGVyRXZlbnRUeXBlLCBpbnRlcmFjdGlvbjogSW50ZXJhY3Rpb24sIGVsZW1lbnQ6IEVsZW1lbnQsIGFjdGlvbnM6IEFjdGlvbnMpIHtcbiAgY29uc3QgcmVjdCA9IGludGVyYWN0YWJsZS5nZXRSZWN0KGVsZW1lbnQpXG4gIGNvbnN0IGJ1dHRvbnMgPSAoZXZlbnQgYXMgTW91c2VFdmVudCkuYnV0dG9ucyB8fCAoe1xuICAgIDA6IDEsXG4gICAgMTogNCxcbiAgICAzOiA4LFxuICAgIDQ6IDE2LFxuICB9KVsoZXZlbnQgYXMgTW91c2VFdmVudCkuYnV0dG9uIGFzIDAgfCAxIHwgMyB8IDRdXG4gIGxldCBhY3Rpb24gPSBudWxsXG5cbiAgZm9yIChjb25zdCBhY3Rpb25OYW1lIG9mIGFjdGlvbnMubmFtZXMpIHtcbiAgICAvLyBjaGVjayBtb3VzZUJ1dHRvbiBzZXR0aW5nIGlmIHRoZSBwb2ludGVyIGlzIGRvd25cbiAgICBpZiAoaW50ZXJhY3Rpb24ucG9pbnRlcklzRG93biAmJlxuICAgICAgICAvbW91c2V8cG9pbnRlci8udGVzdChpbnRlcmFjdGlvbi5wb2ludGVyVHlwZSkgJiZcbiAgICAgIChidXR0b25zICYgaW50ZXJhY3RhYmxlLm9wdGlvbnNbYWN0aW9uTmFtZV0ubW91c2VCdXR0b25zKSA9PT0gMCkge1xuICAgICAgY29udGludWVcbiAgICB9XG5cbiAgICBhY3Rpb24gPSAoYWN0aW9uc1thY3Rpb25OYW1lIGFzIGtleW9mIEFjdGlvbnNdIGFzIGFueSkuY2hlY2tlcihwb2ludGVyLCBldmVudCwgaW50ZXJhY3RhYmxlLCBlbGVtZW50LCBpbnRlcmFjdGlvbiwgcmVjdClcblxuICAgIGlmIChhY3Rpb24pIHtcbiAgICAgIHJldHVybiBhY3Rpb25cbiAgICB9XG4gIH1cbn1cblxuZnVuY3Rpb24gc3R5bGVDdXJzb3IgKHRoaXM6IEludGVyYWN0YWJsZSwgbmV3VmFsdWU/OiBib29sZWFuKSB7XG4gIGlmIChpcy5ib29sKG5ld1ZhbHVlKSkge1xuICAgIHRoaXMub3B0aW9ucy5zdHlsZUN1cnNvciA9IG5ld1ZhbHVlXG5cbiAgICByZXR1cm4gdGhpc1xuICB9XG5cbiAgaWYgKG5ld1ZhbHVlID09PSBudWxsKSB7XG4gICAgZGVsZXRlIHRoaXMub3B0aW9ucy5zdHlsZUN1cnNvclxuXG4gICAgcmV0dXJuIHRoaXNcbiAgfVxuXG4gIHJldHVybiB0aGlzLm9wdGlvbnMuc3R5bGVDdXJzb3Jcbn1cblxuZnVuY3Rpb24gYWN0aW9uQ2hlY2tlciAodGhpczogSW50ZXJhY3RhYmxlLCBjaGVja2VyOiBhbnkpIHtcbiAgaWYgKGlzLmZ1bmMoY2hlY2tlcikpIHtcbiAgICB0aGlzLm9wdGlvbnMuYWN0aW9uQ2hlY2tlciA9IGNoZWNrZXJcblxuICAgIHJldHVybiB0aGlzXG4gIH1cblxuICBpZiAoY2hlY2tlciA9PT0gbnVsbCkge1xuICAgIGRlbGV0ZSB0aGlzLm9wdGlvbnMuYWN0aW9uQ2hlY2tlclxuXG4gICAgcmV0dXJuIHRoaXNcbiAgfVxuXG4gIHJldHVybiB0aGlzLm9wdGlvbnMuYWN0aW9uQ2hlY2tlclxufVxuXG5mdW5jdGlvbiB0ZXN0SWdub3JlQWxsb3cgKHRoaXM6IEludGVyYWN0YWJsZSwgb3B0aW9uczogeyBpZ25vcmVGcm9tOiBJZ25vcmVWYWx1ZSwgYWxsb3dGcm9tOiBJZ25vcmVWYWx1ZSB9LCBpbnRlcmFjdGFibGVFbGVtZW50OiBFbGVtZW50LCBldmVudFRhcmdldDogRWxlbWVudCkge1xuICByZXR1cm4gKCF0aGlzLnRlc3RJZ25vcmUob3B0aW9ucy5pZ25vcmVGcm9tLCBpbnRlcmFjdGFibGVFbGVtZW50LCBldmVudFRhcmdldCkgJiZcbiAgICAgICAgICB0aGlzLnRlc3RBbGxvdyhvcHRpb25zLmFsbG93RnJvbSwgaW50ZXJhY3RhYmxlRWxlbWVudCwgZXZlbnRUYXJnZXQpKVxufVxuXG5mdW5jdGlvbiB0ZXN0QWxsb3cgKHRoaXM6IEludGVyYWN0YWJsZSwgYWxsb3dGcm9tOiBJZ25vcmVWYWx1ZSwgaW50ZXJhY3RhYmxlRWxlbWVudDogRWxlbWVudCwgZWxlbWVudDogRWxlbWVudCkge1xuICBpZiAoIWFsbG93RnJvbSkgeyByZXR1cm4gdHJ1ZSB9XG5cbiAgaWYgKCFpcy5lbGVtZW50KGVsZW1lbnQpKSB7IHJldHVybiBmYWxzZSB9XG5cbiAgaWYgKGlzLnN0cmluZyhhbGxvd0Zyb20pKSB7XG4gICAgcmV0dXJuIGRvbVV0aWxzLm1hdGNoZXNVcFRvKGVsZW1lbnQsIGFsbG93RnJvbSwgaW50ZXJhY3RhYmxlRWxlbWVudClcbiAgfVxuICBlbHNlIGlmIChpcy5lbGVtZW50KGFsbG93RnJvbSkpIHtcbiAgICByZXR1cm4gZG9tVXRpbHMubm9kZUNvbnRhaW5zKGFsbG93RnJvbSwgZWxlbWVudClcbiAgfVxuXG4gIHJldHVybiBmYWxzZVxufVxuXG5mdW5jdGlvbiB0ZXN0SWdub3JlICh0aGlzOiBJbnRlcmFjdGFibGUsIGlnbm9yZUZyb206IElnbm9yZVZhbHVlLCBpbnRlcmFjdGFibGVFbGVtZW50OiBFbGVtZW50LCBlbGVtZW50OiBFbGVtZW50KSB7XG4gIGlmICghaWdub3JlRnJvbSB8fCAhaXMuZWxlbWVudChlbGVtZW50KSkgeyByZXR1cm4gZmFsc2UgfVxuXG4gIGlmIChpcy5zdHJpbmcoaWdub3JlRnJvbSkpIHtcbiAgICByZXR1cm4gZG9tVXRpbHMubWF0Y2hlc1VwVG8oZWxlbWVudCwgaWdub3JlRnJvbSwgaW50ZXJhY3RhYmxlRWxlbWVudClcbiAgfVxuICBlbHNlIGlmIChpcy5lbGVtZW50KGlnbm9yZUZyb20pKSB7XG4gICAgcmV0dXJuIGRvbVV0aWxzLm5vZGVDb250YWlucyhpZ25vcmVGcm9tLCBlbGVtZW50KVxuICB9XG5cbiAgcmV0dXJuIGZhbHNlXG59XG5cbmV4cG9ydCBkZWZhdWx0IHsgaW5zdGFsbCB9XG4iXX0=