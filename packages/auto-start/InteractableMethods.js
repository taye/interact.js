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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiSW50ZXJhY3RhYmxlTWV0aG9kcy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIkludGVyYWN0YWJsZU1ldGhvZHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUFFLFFBQVEsRUFBRSxNQUFNLG1CQUFtQixDQUFBO0FBQzVDLE9BQU8sS0FBSyxRQUFRLE1BQU0sNEJBQTRCLENBQUE7QUFDdEQsT0FBTyxLQUFLLEVBQUUsTUFBTSxzQkFBc0IsQ0FBQTtBQStCMUMsU0FBUyxPQUFPLENBQUUsS0FBWTtJQUM1QixNQUFNO0lBQ0osMEJBQTBCO0lBQzFCLFlBQVksRUFBRSwyQ0FBMkM7SUFDekQsT0FBTyxHQUNSLEdBQUcsS0FBSyxDQUFBO0lBRVQsWUFBWSxDQUFDLFNBQVMsQ0FBQyxTQUFTLEdBQUcsU0FBUyxDQUFBO0lBRTVDOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7T0EyQkc7SUFDSCxZQUFZLENBQUMsU0FBUyxDQUFDLFVBQVUsR0FBRyxRQUFRLENBQUMsVUFBOEIsUUFBUTtRQUNqRixPQUFPLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxZQUFZLEVBQUUsUUFBUSxDQUFDLENBQUE7SUFDdkQsQ0FBQyxFQUFFLG1HQUFtRyxDQUFDLENBQUE7SUFFdkc7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7T0FzQkc7SUFDSCxZQUFZLENBQUMsU0FBUyxDQUFDLFNBQVMsR0FBRyxRQUFRLENBQUMsVUFBOEIsUUFBUTtRQUNoRixPQUFPLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxXQUFXLEVBQUUsUUFBUSxDQUFDLENBQUE7SUFDdEQsQ0FBQyxFQUFFLGlHQUFpRyxDQUFDLENBQUE7SUFFckcsWUFBWSxDQUFDLFNBQVMsQ0FBQyxVQUFVLEdBQUcsVUFBVSxDQUFBO0lBRTlDLFlBQVksQ0FBQyxTQUFTLENBQUMsU0FBUyxHQUFHLFNBQVMsQ0FBQTtJQUU1QyxZQUFZLENBQUMsU0FBUyxDQUFDLGVBQWUsR0FBRyxlQUFlLENBQUE7SUFFeEQ7Ozs7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QzlHLElBQUksQ0FBQyxVQUFVLElBQUksQ0FBQyxFQUFFLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxFQUFFO1FBQUUsT0FBTyxLQUFLLENBQUE7S0FBRTtJQUV6RCxJQUFJLEVBQUUsQ0FBQyxNQUFNLENBQUMsVUFBVSxDQUFDLEVBQUU7UUFDekIsT0FBTyxRQUFRLENBQUMsV0FBVyxDQUFDLE9BQU8sRUFBRSxVQUFVLEVBQUUsbUJBQW1CLENBQUMsQ0FBQTtLQUN0RTtTQUNJLElBQUksRUFBRSxDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUMsRUFBRTtRQUMvQixPQUFPLFFBQVEsQ0FBQyxZQUFZLENBQUMsVUFBVSxFQUFFLE9BQU8sQ0FBQyxDQUFBO0tBQ2xEO0lBRUQsT0FBTyxLQUFLLENBQUE7QUFDZCxDQUFDO0FBRUQsZUFBZSxFQUFFLE9BQU8sRUFBRSxDQUFBIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgd2Fybk9uY2UgfSBmcm9tICdAaW50ZXJhY3Rqcy91dGlscydcbmltcG9ydCAqIGFzIGRvbVV0aWxzIGZyb20gJ0BpbnRlcmFjdGpzL3V0aWxzL2RvbVV0aWxzJ1xuaW1wb3J0ICogYXMgaXMgZnJvbSAnQGludGVyYWN0anMvdXRpbHMvaXMnXG5cbi8vIFRPRE86IHRoZXJlIHNlZW1zIHRvIGJlIGEgQGJhYmVsL3ByZXNldC10eXBlc2NyaXB0IGJ1ZyBjYXVzaW5nIHJlZ3VsYXIgaW1wb3J0XG4vLyBzeW50YXggdG8gcmVtYWluIGluIGpzIG91dHB1dFxudHlwZSBTY29wZSA9IGltcG9ydCAoJ0BpbnRlcmFjdGpzL2NvcmUvc2NvcGUnKS5TY29wZVxudHlwZSBBY3Rpb25zID0gaW1wb3J0ICgnQGludGVyYWN0anMvY29yZS9zY29wZScpLkFjdGlvbnNcbnR5cGUgSW50ZXJhY3Rpb24gPSBpbXBvcnQgKCdAaW50ZXJhY3Rqcy9jb3JlL0ludGVyYWN0aW9uJykuZGVmYXVsdFxudHlwZSBJbnRlcmFjdGFibGUgPSBpbXBvcnQgKCdAaW50ZXJhY3Rqcy9jb3JlL0ludGVyYWN0YWJsZScpLmRlZmF1bHRcblxudHlwZSBJZ25vcmVWYWx1ZSA9IHN0cmluZyB8IEVsZW1lbnQgfCBib29sZWFuXG5cbmRlY2xhcmUgbW9kdWxlICdAaW50ZXJhY3Rqcy9jb3JlL0ludGVyYWN0YWJsZScge1xuICBpbnRlcmZhY2UgSW50ZXJhY3RhYmxlIHtcbiAgICBnZXRBY3Rpb246IHR5cGVvZiBnZXRBY3Rpb25cbiAgICBkZWZhdWx0QWN0aW9uQ2hlY2tlcjogKHBvaW50ZXI6IGFueSwgZXZlbnQ6IGFueSwgaW50ZXJhY3Rpb246IGFueSwgZWxlbWVudDogYW55KSA9PiBhbnlcbiAgICBzdHlsZUN1cnNvcjogdHlwZW9mIHN0eWxlQ3Vyc29yXG4gICAgYWN0aW9uQ2hlY2tlcjogdHlwZW9mIGFjdGlvbkNoZWNrZXJcbiAgICB0ZXN0SWdub3JlQWxsb3c6IHR5cGVvZiB0ZXN0SWdub3JlQWxsb3dcbiAgICB0ZXN0QWxsb3c6IHR5cGVvZiB0ZXN0QWxsb3dcbiAgICB0ZXN0SWdub3JlOiB0eXBlb2YgdGVzdElnbm9yZVxuICAgIGlnbm9yZUZyb206ICguLi5hcmdzOiBhbnkpID0+IGJvb2xlYW5cbiAgICBhbGxvd0Zyb206ICguLi5hcmdzOiBhbnkpID0+IGJvb2xlYW5cbiAgfVxufVxuXG5kZWNsYXJlIG1vZHVsZSAnQGludGVyYWN0anMvY29yZS9JbnRlcmFjdGlvbicge1xuICBpbnRlcmZhY2UgSW50ZXJhY3Rpb24ge1xuICAgIHBvaW50ZXJJc0Rvd246IGJvb2xlYW5cbiAgfVxufVxuXG5mdW5jdGlvbiBpbnN0YWxsIChzY29wZTogU2NvcGUpIHtcbiAgY29uc3Qge1xuICAgIC8qKiBAbGVuZHMgSW50ZXJhY3RhYmxlICovXG4gICAgSW50ZXJhY3RhYmxlLCAvLyB0c2xpbnQ6ZGlzYWJsZS1saW5lIG5vLXNoYWRvd2VkLXZhcmlhYmxlXG4gICAgYWN0aW9ucyxcbiAgfSA9IHNjb3BlXG5cbiAgSW50ZXJhY3RhYmxlLnByb3RvdHlwZS5nZXRBY3Rpb24gPSBnZXRBY3Rpb25cblxuICAvKipcbiAgICogYGBganNcbiAgICogaW50ZXJhY3QoZWxlbWVudCwgeyBpZ25vcmVGcm9tOiBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbm8tYWN0aW9uJykgfSk7XG4gICAqIC8vIG9yXG4gICAqIGludGVyYWN0KGVsZW1lbnQpLmlnbm9yZUZyb20oJ2lucHV0LCB0ZXh0YXJlYSwgYScpO1xuICAgKiBgYGBcbiAgICogQGRlcHJlY2F0ZWRcbiAgICogSWYgdGhlIHRhcmdldCBvZiB0aGUgYG1vdXNlZG93bmAsIGBwb2ludGVyZG93bmAgb3IgYHRvdWNoc3RhcnRgIGV2ZW50IG9yIGFueVxuICAgKiBvZiBpdCdzIHBhcmVudHMgbWF0Y2ggdGhlIGdpdmVuIENTUyBzZWxlY3RvciBvciBFbGVtZW50LCBub1xuICAgKiBkcmFnL3Jlc2l6ZS9nZXN0dXJlIGlzIHN0YXJ0ZWQuXG4gICAqXG4gICAqIERvbid0IHVzZSB0aGlzIG1ldGhvZC4gSW5zdGVhZCBzZXQgdGhlIGBpZ25vcmVGcm9tYCBvcHRpb24gZm9yIGVhY2ggYWN0aW9uXG4gICAqIG9yIGZvciBgcG9pbnRlckV2ZW50c2BcbiAgICpcbiAgICogQGV4YW1wbGVcbiAgICogaW50ZXJhY3QodGFyZ2V0dClcbiAgICogICAuZHJhZ2dhYmxlKHtcbiAgICogICAgIGlnbm9yZUZyb206ICdpbnB1dCwgdGV4dGFyZWEsIGFbaHJlZl0nJyxcbiAgICogICB9KVxuICAgKiAgIC5wb2ludGVyRXZlbnRzKHtcbiAgICogICAgIGlnbm9yZUZyb206ICdbbm8tcG9pbnRlcl0nLFxuICAgKiAgIH0pO1xuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZyB8IEVsZW1lbnQgfCBudWxsfSBbbmV3VmFsdWVdIGEgQ1NTIHNlbGVjdG9yIHN0cmluZywgYW5cbiAgICogRWxlbWVudCBvciBgbnVsbGAgdG8gbm90IGlnbm9yZSBhbnkgZWxlbWVudHNcbiAgICogQHJldHVybiB7c3RyaW5nIHwgRWxlbWVudCB8IG9iamVjdH0gVGhlIGN1cnJlbnQgaWdub3JlRnJvbSB2YWx1ZSBvciB0aGlzXG4gICAqIEludGVyYWN0YWJsZVxuICAgKi9cbiAgSW50ZXJhY3RhYmxlLnByb3RvdHlwZS5pZ25vcmVGcm9tID0gd2Fybk9uY2UoZnVuY3Rpb24gKHRoaXM6IEludGVyYWN0YWJsZSwgbmV3VmFsdWUpIHtcbiAgICByZXR1cm4gdGhpcy5fYmFja0NvbXBhdE9wdGlvbignaWdub3JlRnJvbScsIG5ld1ZhbHVlKVxuICB9LCAnSW50ZXJhY3RhYmxlLmlnbm9yZUZyb20oKSBoYXMgYmVlbiBkZXByZWNhdGVkLiBVc2UgSW50ZXJhY3RibGUuZHJhZ2dhYmxlKHtpZ25vcmVGcm9tOiBuZXdWYWx1ZX0pLicpXG5cbiAgLyoqXG4gICAqIEBkZXByZWNhdGVkXG4gICAqXG4gICAqIEEgZHJhZy9yZXNpemUvZ2VzdHVyZSBpcyBzdGFydGVkIG9ubHkgSWYgdGhlIHRhcmdldCBvZiB0aGUgYG1vdXNlZG93bmAsXG4gICAqIGBwb2ludGVyZG93bmAgb3IgYHRvdWNoc3RhcnRgIGV2ZW50IG9yIGFueSBvZiBpdCdzIHBhcmVudHMgbWF0Y2ggdGhlIGdpdmVuXG4gICAqIENTUyBzZWxlY3RvciBvciBFbGVtZW50LlxuICAgKlxuICAgKiBEb24ndCB1c2UgdGhpcyBtZXRob2QuIEluc3RlYWQgc2V0IHRoZSBgYWxsb3dGcm9tYCBvcHRpb24gZm9yIGVhY2ggYWN0aW9uXG4gICAqIG9yIGZvciBgcG9pbnRlckV2ZW50c2BcbiAgICpcbiAgICogQGV4YW1wbGVcbiAgICogaW50ZXJhY3QodGFyZ2V0dClcbiAgICogICAucmVzaXphYmxlKHtcbiAgICogICAgIGFsbG93RnJvbTogJy5yZXNpemUtaGFuZGxlJyxcbiAgICogICAucG9pbnRlckV2ZW50cyh7XG4gICAqICAgICBhbGxvd0Zyb206ICcuaGFuZGxlJywsXG4gICAqICAgfSk7XG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nIHwgRWxlbWVudCB8IG51bGx9IFtuZXdWYWx1ZV0gYSBDU1Mgc2VsZWN0b3Igc3RyaW5nLCBhblxuICAgKiBFbGVtZW50IG9yIGBudWxsYCB0byBhbGxvdyBmcm9tIGFueSBlbGVtZW50XG4gICAqIEByZXR1cm4ge3N0cmluZyB8IEVsZW1lbnQgfCBvYmplY3R9IFRoZSBjdXJyZW50IGFsbG93RnJvbSB2YWx1ZSBvciB0aGlzXG4gICAqIEludGVyYWN0YWJsZVxuICAgKi9cbiAgSW50ZXJhY3RhYmxlLnByb3RvdHlwZS5hbGxvd0Zyb20gPSB3YXJuT25jZShmdW5jdGlvbiAodGhpczogSW50ZXJhY3RhYmxlLCBuZXdWYWx1ZSkge1xuICAgIHJldHVybiB0aGlzLl9iYWNrQ29tcGF0T3B0aW9uKCdhbGxvd0Zyb20nLCBuZXdWYWx1ZSlcbiAgfSwgJ0ludGVyYWN0YWJsZS5hbGxvd0Zyb20oKSBoYXMgYmVlbiBkZXByZWNhdGVkLiBVc2UgSW50ZXJhY3RibGUuZHJhZ2dhYmxlKHthbGxvd0Zyb206IG5ld1ZhbHVlfSkuJylcblxuICBJbnRlcmFjdGFibGUucHJvdG90eXBlLnRlc3RJZ25vcmUgPSB0ZXN0SWdub3JlXG5cbiAgSW50ZXJhY3RhYmxlLnByb3RvdHlwZS50ZXN0QWxsb3cgPSB0ZXN0QWxsb3dcblxuICBJbnRlcmFjdGFibGUucHJvdG90eXBlLnRlc3RJZ25vcmVBbGxvdyA9IHRlc3RJZ25vcmVBbGxvd1xuXG4gIC8qKlxuICAgKiBgYGBqc1xuICAgKiBpbnRlcmFjdCgnLnJlc2l6ZS1kcmFnJylcbiAgICogICAucmVzaXphYmxlKHRydWUpXG4gICAqICAgLmRyYWdnYWJsZSh0cnVlKVxuICAgKiAgIC5hY3Rpb25DaGVja2VyKGZ1bmN0aW9uIChwb2ludGVyLCBldmVudCwgYWN0aW9uLCBpbnRlcmFjdGFibGUsIGVsZW1lbnQsIGludGVyYWN0aW9uKSB7XG4gICAqXG4gICAqICAgaWYgKGludGVyYWN0Lm1hdGNoZXNTZWxlY3RvcihldmVudC50YXJnZXQsICcuZHJhZy1oYW5kbGUnKSB7XG4gICAqICAgICAvLyBmb3JjZSBkcmFnIHdpdGggaGFuZGxlIHRhcmdldFxuICAgKiAgICAgYWN0aW9uLm5hbWUgPSBkcmFnO1xuICAgKiAgIH1cbiAgICogICBlbHNlIHtcbiAgICogICAgIC8vIHJlc2l6ZSBmcm9tIHRoZSB0b3AgYW5kIHJpZ2h0IGVkZ2VzXG4gICAqICAgICBhY3Rpb24ubmFtZSAgPSAncmVzaXplJztcbiAgICogICAgIGFjdGlvbi5lZGdlcyA9IHsgdG9wOiB0cnVlLCByaWdodDogdHJ1ZSB9O1xuICAgKiAgIH1cbiAgICpcbiAgICogICByZXR1cm4gYWN0aW9uO1xuICAgKiB9KTtcbiAgICogYGBgXG4gICAqXG4gICAqIEdldHMgb3Igc2V0cyB0aGUgZnVuY3Rpb24gdXNlZCB0byBjaGVjayBhY3Rpb24gdG8gYmUgcGVyZm9ybWVkIG9uXG4gICAqIHBvaW50ZXJEb3duXG4gICAqXG4gICAqIEBwYXJhbSB7ZnVuY3Rpb24gfCBudWxsfSBbY2hlY2tlcl0gQSBmdW5jdGlvbiB3aGljaCB0YWtlcyBhIHBvaW50ZXIgZXZlbnQsXG4gICAqIGRlZmF1bHRBY3Rpb24gc3RyaW5nLCBpbnRlcmFjdGFibGUsIGVsZW1lbnQgYW5kIGludGVyYWN0aW9uIGFzIHBhcmFtZXRlcnNcbiAgICogYW5kIHJldHVybnMgYW4gb2JqZWN0IHdpdGggbmFtZSBwcm9wZXJ0eSAnZHJhZycgJ3Jlc2l6ZScgb3IgJ2dlc3R1cmUnIGFuZFxuICAgKiBvcHRpb25hbGx5IGFuIGBlZGdlc2Agb2JqZWN0IHdpdGggYm9vbGVhbiAndG9wJywgJ2xlZnQnLCAnYm90dG9tJyBhbmQgcmlnaHRcbiAgICogcHJvcHMuXG4gICAqIEByZXR1cm4ge0Z1bmN0aW9uIHwgSW50ZXJhY3RhYmxlfSBUaGUgY2hlY2tlciBmdW5jdGlvbiBvciB0aGlzIEludGVyYWN0YWJsZVxuICAgKi9cbiAgSW50ZXJhY3RhYmxlLnByb3RvdHlwZS5hY3Rpb25DaGVja2VyID0gYWN0aW9uQ2hlY2tlclxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIG9yIHNldHMgd2hldGhlciB0aGUgdGhlIGN1cnNvciBzaG91bGQgYmUgY2hhbmdlZCBkZXBlbmRpbmcgb24gdGhlXG4gICAqIGFjdGlvbiB0aGF0IHdvdWxkIGJlIHBlcmZvcm1lZCBpZiB0aGUgbW91c2Ugd2VyZSBwcmVzc2VkIGFuZCBkcmFnZ2VkLlxuICAgKlxuICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtuZXdWYWx1ZV1cbiAgICogQHJldHVybiB7Ym9vbGVhbiB8IEludGVyYWN0YWJsZX0gVGhlIGN1cnJlbnQgc2V0dGluZyBvciB0aGlzIEludGVyYWN0YWJsZVxuICAgKi9cbiAgSW50ZXJhY3RhYmxlLnByb3RvdHlwZS5zdHlsZUN1cnNvciA9IHN0eWxlQ3Vyc29yXG5cbiAgSW50ZXJhY3RhYmxlLnByb3RvdHlwZS5kZWZhdWx0QWN0aW9uQ2hlY2tlciA9IGZ1bmN0aW9uICh0aGlzOiBJbnRlcmFjdGFibGUsIHBvaW50ZXIsIGV2ZW50LCBpbnRlcmFjdGlvbiwgZWxlbWVudCkge1xuICAgIHJldHVybiBkZWZhdWx0QWN0aW9uQ2hlY2tlcih0aGlzLCBwb2ludGVyLCBldmVudCwgaW50ZXJhY3Rpb24sIGVsZW1lbnQsIGFjdGlvbnMpXG4gIH1cbn1cblxuZnVuY3Rpb24gZ2V0QWN0aW9uICh0aGlzOiBJbnRlcmFjdGFibGUsIHBvaW50ZXI6IEludGVyYWN0LlBvaW50ZXJUeXBlLCBldmVudDogSW50ZXJhY3QuUG9pbnRlckV2ZW50VHlwZSwgaW50ZXJhY3Rpb246IEludGVyYWN0aW9uLCBlbGVtZW50OiBFbGVtZW50KSB7XG4gIGNvbnN0IGFjdGlvbiA9IHRoaXMuZGVmYXVsdEFjdGlvbkNoZWNrZXIocG9pbnRlciwgZXZlbnQsIGludGVyYWN0aW9uLCBlbGVtZW50KVxuXG4gIGlmICh0aGlzLm9wdGlvbnMuYWN0aW9uQ2hlY2tlcikge1xuICAgIHJldHVybiB0aGlzLm9wdGlvbnMuYWN0aW9uQ2hlY2tlcihwb2ludGVyLCBldmVudCwgYWN0aW9uLCB0aGlzLCBlbGVtZW50LCBpbnRlcmFjdGlvbilcbiAgfVxuXG4gIHJldHVybiBhY3Rpb25cbn1cblxuZnVuY3Rpb24gZGVmYXVsdEFjdGlvbkNoZWNrZXIgKGludGVyYWN0YWJsZTogSW50ZXJhY3RhYmxlLCBwb2ludGVyOiBJbnRlcmFjdC5Qb2ludGVyVHlwZSwgZXZlbnQ6IEludGVyYWN0LlBvaW50ZXJFdmVudFR5cGUsIGludGVyYWN0aW9uOiBJbnRlcmFjdGlvbiwgZWxlbWVudDogRWxlbWVudCwgYWN0aW9uczogQWN0aW9ucykge1xuICBjb25zdCByZWN0ID0gaW50ZXJhY3RhYmxlLmdldFJlY3QoZWxlbWVudClcbiAgY29uc3QgYnV0dG9ucyA9IChldmVudCBhcyBNb3VzZUV2ZW50KS5idXR0b25zIHx8ICh7XG4gICAgMDogMSxcbiAgICAxOiA0LFxuICAgIDM6IDgsXG4gICAgNDogMTYsXG4gIH0pWyhldmVudCBhcyBNb3VzZUV2ZW50KS5idXR0b24gYXMgMCB8IDEgfCAzIHwgNF1cbiAgbGV0IGFjdGlvbiA9IG51bGxcblxuICBmb3IgKGNvbnN0IGFjdGlvbk5hbWUgb2YgYWN0aW9ucy5uYW1lcykge1xuICAgIC8vIGNoZWNrIG1vdXNlQnV0dG9uIHNldHRpbmcgaWYgdGhlIHBvaW50ZXIgaXMgZG93blxuICAgIGlmIChpbnRlcmFjdGlvbi5wb2ludGVySXNEb3duICYmXG4gICAgICAgIC9tb3VzZXxwb2ludGVyLy50ZXN0KGludGVyYWN0aW9uLnBvaW50ZXJUeXBlKSAmJlxuICAgICAgKGJ1dHRvbnMgJiBpbnRlcmFjdGFibGUub3B0aW9uc1thY3Rpb25OYW1lXS5tb3VzZUJ1dHRvbnMpID09PSAwKSB7XG4gICAgICBjb250aW51ZVxuICAgIH1cblxuICAgIGFjdGlvbiA9IChhY3Rpb25zW2FjdGlvbk5hbWUgYXMga2V5b2YgQWN0aW9uc10gYXMgYW55KS5jaGVja2VyKHBvaW50ZXIsIGV2ZW50LCBpbnRlcmFjdGFibGUsIGVsZW1lbnQsIGludGVyYWN0aW9uLCByZWN0KVxuXG4gICAgaWYgKGFjdGlvbikge1xuICAgICAgcmV0dXJuIGFjdGlvblxuICAgIH1cbiAgfVxufVxuXG5mdW5jdGlvbiBzdHlsZUN1cnNvciAodGhpczogSW50ZXJhY3RhYmxlLCBuZXdWYWx1ZT86IGJvb2xlYW4pIHtcbiAgaWYgKGlzLmJvb2wobmV3VmFsdWUpKSB7XG4gICAgdGhpcy5vcHRpb25zLnN0eWxlQ3Vyc29yID0gbmV3VmFsdWVcblxuICAgIHJldHVybiB0aGlzXG4gIH1cblxuICBpZiAobmV3VmFsdWUgPT09IG51bGwpIHtcbiAgICBkZWxldGUgdGhpcy5vcHRpb25zLnN0eWxlQ3Vyc29yXG5cbiAgICByZXR1cm4gdGhpc1xuICB9XG5cbiAgcmV0dXJuIHRoaXMub3B0aW9ucy5zdHlsZUN1cnNvclxufVxuXG5mdW5jdGlvbiBhY3Rpb25DaGVja2VyICh0aGlzOiBJbnRlcmFjdGFibGUsIGNoZWNrZXI6IGFueSkge1xuICBpZiAoaXMuZnVuYyhjaGVja2VyKSkge1xuICAgIHRoaXMub3B0aW9ucy5hY3Rpb25DaGVja2VyID0gY2hlY2tlclxuXG4gICAgcmV0dXJuIHRoaXNcbiAgfVxuXG4gIGlmIChjaGVja2VyID09PSBudWxsKSB7XG4gICAgZGVsZXRlIHRoaXMub3B0aW9ucy5hY3Rpb25DaGVja2VyXG5cbiAgICByZXR1cm4gdGhpc1xuICB9XG5cbiAgcmV0dXJuIHRoaXMub3B0aW9ucy5hY3Rpb25DaGVja2VyXG59XG5cbmZ1bmN0aW9uIHRlc3RJZ25vcmVBbGxvdyAodGhpczogSW50ZXJhY3RhYmxlLCBvcHRpb25zOiB7IGlnbm9yZUZyb206IElnbm9yZVZhbHVlLCBhbGxvd0Zyb206IElnbm9yZVZhbHVlIH0sIGludGVyYWN0YWJsZUVsZW1lbnQ6IEVsZW1lbnQsIGV2ZW50VGFyZ2V0OiBFbGVtZW50KSB7XG4gIHJldHVybiAoIXRoaXMudGVzdElnbm9yZShvcHRpb25zLmlnbm9yZUZyb20sIGludGVyYWN0YWJsZUVsZW1lbnQsIGV2ZW50VGFyZ2V0KSAmJlxuICAgICAgICAgIHRoaXMudGVzdEFsbG93KG9wdGlvbnMuYWxsb3dGcm9tLCBpbnRlcmFjdGFibGVFbGVtZW50LCBldmVudFRhcmdldCkpXG59XG5cbmZ1bmN0aW9uIHRlc3RBbGxvdyAodGhpczogSW50ZXJhY3RhYmxlLCBhbGxvd0Zyb206IElnbm9yZVZhbHVlLCBpbnRlcmFjdGFibGVFbGVtZW50OiBFbGVtZW50LCBlbGVtZW50OiBFbGVtZW50KSB7XG4gIGlmICghYWxsb3dGcm9tKSB7IHJldHVybiB0cnVlIH1cblxuICBpZiAoIWlzLmVsZW1lbnQoZWxlbWVudCkpIHsgcmV0dXJuIGZhbHNlIH1cblxuICBpZiAoaXMuc3RyaW5nKGFsbG93RnJvbSkpIHtcbiAgICByZXR1cm4gZG9tVXRpbHMubWF0Y2hlc1VwVG8oZWxlbWVudCwgYWxsb3dGcm9tLCBpbnRlcmFjdGFibGVFbGVtZW50KVxuICB9XG4gIGVsc2UgaWYgKGlzLmVsZW1lbnQoYWxsb3dGcm9tKSkge1xuICAgIHJldHVybiBkb21VdGlscy5ub2RlQ29udGFpbnMoYWxsb3dGcm9tLCBlbGVtZW50KVxuICB9XG5cbiAgcmV0dXJuIGZhbHNlXG59XG5cbmZ1bmN0aW9uIHRlc3RJZ25vcmUgKHRoaXM6IEludGVyYWN0YWJsZSwgaWdub3JlRnJvbTogSWdub3JlVmFsdWUsIGludGVyYWN0YWJsZUVsZW1lbnQ6IEVsZW1lbnQsIGVsZW1lbnQ6IEVsZW1lbnQpIHtcbiAgaWYgKCFpZ25vcmVGcm9tIHx8ICFpcy5lbGVtZW50KGVsZW1lbnQpKSB7IHJldHVybiBmYWxzZSB9XG5cbiAgaWYgKGlzLnN0cmluZyhpZ25vcmVGcm9tKSkge1xuICAgIHJldHVybiBkb21VdGlscy5tYXRjaGVzVXBUbyhlbGVtZW50LCBpZ25vcmVGcm9tLCBpbnRlcmFjdGFibGVFbGVtZW50KVxuICB9XG4gIGVsc2UgaWYgKGlzLmVsZW1lbnQoaWdub3JlRnJvbSkpIHtcbiAgICByZXR1cm4gZG9tVXRpbHMubm9kZUNvbnRhaW5zKGlnbm9yZUZyb20sIGVsZW1lbnQpXG4gIH1cblxuICByZXR1cm4gZmFsc2Vcbn1cblxuZXhwb3J0IGRlZmF1bHQgeyBpbnN0YWxsIH1cbiJdfQ==