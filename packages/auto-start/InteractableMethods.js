import { warnOnce } from '@interactjs/utils';
import * as is from '@interactjs/utils/is';
function install(scope) {
    const { 
    /** @lends Interactable */
    Interactable, // tslint:disable-line no-shadowed-variable
    actions, } = scope;
    Interactable.prototype.getAction = getAction;
    /**
     * ```js
     * interact(element, { ignoreFrom: document.getElementById('no-action') })
     * // or
     * interact(element).ignoreFrom('input, textarea, a')
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
     *   })
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
     *   })
     *
     * @param {string | Element | null} [newValue] a CSS selector string, an
     * Element or `null` to allow from any element
     * @return {string | Element | object} The current allowFrom value or this
     * Interactable
     */
    Interactable.prototype.allowFrom = warnOnce(function (newValue) {
        return this._backCompatOption('allowFrom', newValue);
    }, 'Interactable.allowFrom() has been deprecated. Use Interactble.draggable({allowFrom: newValue}).');
    /**
     * ```js
     * interact('.resize-drag')
     *   .resizable(true)
     *   .draggable(true)
     *   .actionChecker(function (pointer, event, action, interactable, element, interaction) {
     *
     *   if (interact.matchesSelector(event.target, '.drag-handle') {
     *     // force drag with handle target
     *     action.name = drag
     *   }
     *   else {
     *     // resize from the top and right edges
     *     action.name  = 'resize'
     *     action.edges = { top: true, right: true }
     *   }
     *
     *   return action
     * })
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
export default {
    id: 'auto-start/interactableMethods',
    install,
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiSW50ZXJhY3RhYmxlTWV0aG9kcy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIkludGVyYWN0YWJsZU1ldGhvZHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUFFLFFBQVEsRUFBRSxNQUFNLG1CQUFtQixDQUFBO0FBQzVDLE9BQU8sS0FBSyxFQUFFLE1BQU0sc0JBQXNCLENBQUE7QUEwQjFDLFNBQVMsT0FBTyxDQUFFLEtBQVk7SUFDNUIsTUFBTTtJQUNKLDBCQUEwQjtJQUMxQixZQUFZLEVBQUUsMkNBQTJDO0lBQ3pELE9BQU8sR0FDUixHQUFHLEtBQUssQ0FBQTtJQUVULFlBQVksQ0FBQyxTQUFTLENBQUMsU0FBUyxHQUFHLFNBQVMsQ0FBQTtJQUU1Qzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O09BMkJHO0lBQ0gsWUFBWSxDQUFDLFNBQVMsQ0FBQyxVQUFVLEdBQUcsUUFBUSxDQUFDLFVBQThCLFFBQVE7UUFDakYsT0FBTyxJQUFJLENBQUMsaUJBQWlCLENBQUMsWUFBWSxFQUFFLFFBQVEsQ0FBQyxDQUFBO0lBQ3ZELENBQUMsRUFBRSxtR0FBbUcsQ0FBQyxDQUFBO0lBRXZHOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O09Bc0JHO0lBQ0gsWUFBWSxDQUFDLFNBQVMsQ0FBQyxTQUFTLEdBQUcsUUFBUSxDQUFDLFVBQThCLFFBQVE7UUFDaEYsT0FBTyxJQUFJLENBQUMsaUJBQWlCLENBQUMsV0FBVyxFQUFFLFFBQVEsQ0FBQyxDQUFBO0lBQ3RELENBQUMsRUFBRSxpR0FBaUcsQ0FBQyxDQUFBO0lBRXJHOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7T0E4Qkc7SUFDSCxZQUFZLENBQUMsU0FBUyxDQUFDLGFBQWEsR0FBRyxhQUFhLENBQUE7SUFFcEQ7Ozs7OztPQU1HO0lBQ0gsWUFBWSxDQUFDLFNBQVMsQ0FBQyxXQUFXLEdBQUcsV0FBVyxDQUFBO0lBRWhELFlBQVksQ0FBQyxTQUFTLENBQUMsb0JBQW9CLEdBQUcs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Q0FBQTtBQUNuQyxDQUFDO0FBRUQsZUFBZTtJQUNiLEVBQUUsRUFBRSxnQ0FBZ0M7SUFDcEMsT0FBTztDQUNSLENBQUEiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyB3YXJuT25jZSB9IGZyb20gJ0BpbnRlcmFjdGpzL3V0aWxzJ1xuaW1wb3J0ICogYXMgaXMgZnJvbSAnQGludGVyYWN0anMvdXRpbHMvaXMnXG5cbi8vIFRPRE86IHRoZXJlIHNlZW1zIHRvIGJlIGEgQGJhYmVsL3ByZXNldC10eXBlc2NyaXB0IGJ1ZyBjYXVzaW5nIHJlZ3VsYXIgaW1wb3J0XG4vLyBzeW50YXggdG8gcmVtYWluIGluIGpzIG91dHB1dFxudHlwZSBTY29wZSA9IGltcG9ydCAoJ0BpbnRlcmFjdGpzL2NvcmUvc2NvcGUnKS5TY29wZVxudHlwZSBBY3Rpb25zID0gaW1wb3J0ICgnQGludGVyYWN0anMvY29yZS9zY29wZScpLkFjdGlvbnNcbnR5cGUgSW50ZXJhY3Rpb24gPSBpbXBvcnQgKCdAaW50ZXJhY3Rqcy9jb3JlL0ludGVyYWN0aW9uJykuZGVmYXVsdFxudHlwZSBJbnRlcmFjdGFibGUgPSBpbXBvcnQgKCdAaW50ZXJhY3Rqcy9jb3JlL0ludGVyYWN0YWJsZScpLmRlZmF1bHRcblxuZGVjbGFyZSBtb2R1bGUgJ0BpbnRlcmFjdGpzL2NvcmUvSW50ZXJhY3RhYmxlJyB7XG4gIGludGVyZmFjZSBJbnRlcmFjdGFibGUge1xuICAgIGdldEFjdGlvbjogdHlwZW9mIGdldEFjdGlvblxuICAgIGRlZmF1bHRBY3Rpb25DaGVja2VyOiAocG9pbnRlcjogYW55LCBldmVudDogYW55LCBpbnRlcmFjdGlvbjogYW55LCBlbGVtZW50OiBhbnkpID0+IGFueVxuICAgIHN0eWxlQ3Vyc29yOiB0eXBlb2Ygc3R5bGVDdXJzb3JcbiAgICBhY3Rpb25DaGVja2VyOiB0eXBlb2YgYWN0aW9uQ2hlY2tlclxuICAgIGlnbm9yZUZyb206ICguLi5hcmdzOiBhbnkpID0+IGJvb2xlYW5cbiAgICBhbGxvd0Zyb206ICguLi5hcmdzOiBhbnkpID0+IGJvb2xlYW5cbiAgfVxufVxuXG5kZWNsYXJlIG1vZHVsZSAnQGludGVyYWN0anMvY29yZS9JbnRlcmFjdGlvbicge1xuICBpbnRlcmZhY2UgSW50ZXJhY3Rpb24ge1xuICAgIHBvaW50ZXJJc0Rvd246IGJvb2xlYW5cbiAgfVxufVxuXG5mdW5jdGlvbiBpbnN0YWxsIChzY29wZTogU2NvcGUpIHtcbiAgY29uc3Qge1xuICAgIC8qKiBAbGVuZHMgSW50ZXJhY3RhYmxlICovXG4gICAgSW50ZXJhY3RhYmxlLCAvLyB0c2xpbnQ6ZGlzYWJsZS1saW5lIG5vLXNoYWRvd2VkLXZhcmlhYmxlXG4gICAgYWN0aW9ucyxcbiAgfSA9IHNjb3BlXG5cbiAgSW50ZXJhY3RhYmxlLnByb3RvdHlwZS5nZXRBY3Rpb24gPSBnZXRBY3Rpb25cblxuICAvKipcbiAgICogYGBganNcbiAgICogaW50ZXJhY3QoZWxlbWVudCwgeyBpZ25vcmVGcm9tOiBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbm8tYWN0aW9uJykgfSlcbiAgICogLy8gb3JcbiAgICogaW50ZXJhY3QoZWxlbWVudCkuaWdub3JlRnJvbSgnaW5wdXQsIHRleHRhcmVhLCBhJylcbiAgICogYGBgXG4gICAqIEBkZXByZWNhdGVkXG4gICAqIElmIHRoZSB0YXJnZXQgb2YgdGhlIGBtb3VzZWRvd25gLCBgcG9pbnRlcmRvd25gIG9yIGB0b3VjaHN0YXJ0YCBldmVudCBvciBhbnlcbiAgICogb2YgaXQncyBwYXJlbnRzIG1hdGNoIHRoZSBnaXZlbiBDU1Mgc2VsZWN0b3Igb3IgRWxlbWVudCwgbm9cbiAgICogZHJhZy9yZXNpemUvZ2VzdHVyZSBpcyBzdGFydGVkLlxuICAgKlxuICAgKiBEb24ndCB1c2UgdGhpcyBtZXRob2QuIEluc3RlYWQgc2V0IHRoZSBgaWdub3JlRnJvbWAgb3B0aW9uIGZvciBlYWNoIGFjdGlvblxuICAgKiBvciBmb3IgYHBvaW50ZXJFdmVudHNgXG4gICAqXG4gICAqIEBleGFtcGxlXG4gICAqIGludGVyYWN0KHRhcmdldHQpXG4gICAqICAgLmRyYWdnYWJsZSh7XG4gICAqICAgICBpZ25vcmVGcm9tOiAnaW5wdXQsIHRleHRhcmVhLCBhW2hyZWZdJycsXG4gICAqICAgfSlcbiAgICogICAucG9pbnRlckV2ZW50cyh7XG4gICAqICAgICBpZ25vcmVGcm9tOiAnW25vLXBvaW50ZXJdJyxcbiAgICogICB9KVxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZyB8IEVsZW1lbnQgfCBudWxsfSBbbmV3VmFsdWVdIGEgQ1NTIHNlbGVjdG9yIHN0cmluZywgYW5cbiAgICogRWxlbWVudCBvciBgbnVsbGAgdG8gbm90IGlnbm9yZSBhbnkgZWxlbWVudHNcbiAgICogQHJldHVybiB7c3RyaW5nIHwgRWxlbWVudCB8IG9iamVjdH0gVGhlIGN1cnJlbnQgaWdub3JlRnJvbSB2YWx1ZSBvciB0aGlzXG4gICAqIEludGVyYWN0YWJsZVxuICAgKi9cbiAgSW50ZXJhY3RhYmxlLnByb3RvdHlwZS5pZ25vcmVGcm9tID0gd2Fybk9uY2UoZnVuY3Rpb24gKHRoaXM6IEludGVyYWN0YWJsZSwgbmV3VmFsdWUpIHtcbiAgICByZXR1cm4gdGhpcy5fYmFja0NvbXBhdE9wdGlvbignaWdub3JlRnJvbScsIG5ld1ZhbHVlKVxuICB9LCAnSW50ZXJhY3RhYmxlLmlnbm9yZUZyb20oKSBoYXMgYmVlbiBkZXByZWNhdGVkLiBVc2UgSW50ZXJhY3RibGUuZHJhZ2dhYmxlKHtpZ25vcmVGcm9tOiBuZXdWYWx1ZX0pLicpXG5cbiAgLyoqXG4gICAqIEBkZXByZWNhdGVkXG4gICAqXG4gICAqIEEgZHJhZy9yZXNpemUvZ2VzdHVyZSBpcyBzdGFydGVkIG9ubHkgSWYgdGhlIHRhcmdldCBvZiB0aGUgYG1vdXNlZG93bmAsXG4gICAqIGBwb2ludGVyZG93bmAgb3IgYHRvdWNoc3RhcnRgIGV2ZW50IG9yIGFueSBvZiBpdCdzIHBhcmVudHMgbWF0Y2ggdGhlIGdpdmVuXG4gICAqIENTUyBzZWxlY3RvciBvciBFbGVtZW50LlxuICAgKlxuICAgKiBEb24ndCB1c2UgdGhpcyBtZXRob2QuIEluc3RlYWQgc2V0IHRoZSBgYWxsb3dGcm9tYCBvcHRpb24gZm9yIGVhY2ggYWN0aW9uXG4gICAqIG9yIGZvciBgcG9pbnRlckV2ZW50c2BcbiAgICpcbiAgICogQGV4YW1wbGVcbiAgICogaW50ZXJhY3QodGFyZ2V0dClcbiAgICogICAucmVzaXphYmxlKHtcbiAgICogICAgIGFsbG93RnJvbTogJy5yZXNpemUtaGFuZGxlJyxcbiAgICogICAucG9pbnRlckV2ZW50cyh7XG4gICAqICAgICBhbGxvd0Zyb206ICcuaGFuZGxlJywsXG4gICAqICAgfSlcbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmcgfCBFbGVtZW50IHwgbnVsbH0gW25ld1ZhbHVlXSBhIENTUyBzZWxlY3RvciBzdHJpbmcsIGFuXG4gICAqIEVsZW1lbnQgb3IgYG51bGxgIHRvIGFsbG93IGZyb20gYW55IGVsZW1lbnRcbiAgICogQHJldHVybiB7c3RyaW5nIHwgRWxlbWVudCB8IG9iamVjdH0gVGhlIGN1cnJlbnQgYWxsb3dGcm9tIHZhbHVlIG9yIHRoaXNcbiAgICogSW50ZXJhY3RhYmxlXG4gICAqL1xuICBJbnRlcmFjdGFibGUucHJvdG90eXBlLmFsbG93RnJvbSA9IHdhcm5PbmNlKGZ1bmN0aW9uICh0aGlzOiBJbnRlcmFjdGFibGUsIG5ld1ZhbHVlKSB7XG4gICAgcmV0dXJuIHRoaXMuX2JhY2tDb21wYXRPcHRpb24oJ2FsbG93RnJvbScsIG5ld1ZhbHVlKVxuICB9LCAnSW50ZXJhY3RhYmxlLmFsbG93RnJvbSgpIGhhcyBiZWVuIGRlcHJlY2F0ZWQuIFVzZSBJbnRlcmFjdGJsZS5kcmFnZ2FibGUoe2FsbG93RnJvbTogbmV3VmFsdWV9KS4nKVxuXG4gIC8qKlxuICAgKiBgYGBqc1xuICAgKiBpbnRlcmFjdCgnLnJlc2l6ZS1kcmFnJylcbiAgICogICAucmVzaXphYmxlKHRydWUpXG4gICAqICAgLmRyYWdnYWJsZSh0cnVlKVxuICAgKiAgIC5hY3Rpb25DaGVja2VyKGZ1bmN0aW9uIChwb2ludGVyLCBldmVudCwgYWN0aW9uLCBpbnRlcmFjdGFibGUsIGVsZW1lbnQsIGludGVyYWN0aW9uKSB7XG4gICAqXG4gICAqICAgaWYgKGludGVyYWN0Lm1hdGNoZXNTZWxlY3RvcihldmVudC50YXJnZXQsICcuZHJhZy1oYW5kbGUnKSB7XG4gICAqICAgICAvLyBmb3JjZSBkcmFnIHdpdGggaGFuZGxlIHRhcmdldFxuICAgKiAgICAgYWN0aW9uLm5hbWUgPSBkcmFnXG4gICAqICAgfVxuICAgKiAgIGVsc2Uge1xuICAgKiAgICAgLy8gcmVzaXplIGZyb20gdGhlIHRvcCBhbmQgcmlnaHQgZWRnZXNcbiAgICogICAgIGFjdGlvbi5uYW1lICA9ICdyZXNpemUnXG4gICAqICAgICBhY3Rpb24uZWRnZXMgPSB7IHRvcDogdHJ1ZSwgcmlnaHQ6IHRydWUgfVxuICAgKiAgIH1cbiAgICpcbiAgICogICByZXR1cm4gYWN0aW9uXG4gICAqIH0pXG4gICAqIGBgYFxuICAgKlxuICAgKiBHZXRzIG9yIHNldHMgdGhlIGZ1bmN0aW9uIHVzZWQgdG8gY2hlY2sgYWN0aW9uIHRvIGJlIHBlcmZvcm1lZCBvblxuICAgKiBwb2ludGVyRG93blxuICAgKlxuICAgKiBAcGFyYW0ge2Z1bmN0aW9uIHwgbnVsbH0gW2NoZWNrZXJdIEEgZnVuY3Rpb24gd2hpY2ggdGFrZXMgYSBwb2ludGVyIGV2ZW50LFxuICAgKiBkZWZhdWx0QWN0aW9uIHN0cmluZywgaW50ZXJhY3RhYmxlLCBlbGVtZW50IGFuZCBpbnRlcmFjdGlvbiBhcyBwYXJhbWV0ZXJzXG4gICAqIGFuZCByZXR1cm5zIGFuIG9iamVjdCB3aXRoIG5hbWUgcHJvcGVydHkgJ2RyYWcnICdyZXNpemUnIG9yICdnZXN0dXJlJyBhbmRcbiAgICogb3B0aW9uYWxseSBhbiBgZWRnZXNgIG9iamVjdCB3aXRoIGJvb2xlYW4gJ3RvcCcsICdsZWZ0JywgJ2JvdHRvbScgYW5kIHJpZ2h0XG4gICAqIHByb3BzLlxuICAgKiBAcmV0dXJuIHtGdW5jdGlvbiB8IEludGVyYWN0YWJsZX0gVGhlIGNoZWNrZXIgZnVuY3Rpb24gb3IgdGhpcyBJbnRlcmFjdGFibGVcbiAgICovXG4gIEludGVyYWN0YWJsZS5wcm90b3R5cGUuYWN0aW9uQ2hlY2tlciA9IGFjdGlvbkNoZWNrZXJcblxuICAvKipcbiAgICogUmV0dXJucyBvciBzZXRzIHdoZXRoZXIgdGhlIHRoZSBjdXJzb3Igc2hvdWxkIGJlIGNoYW5nZWQgZGVwZW5kaW5nIG9uIHRoZVxuICAgKiBhY3Rpb24gdGhhdCB3b3VsZCBiZSBwZXJmb3JtZWQgaWYgdGhlIG1vdXNlIHdlcmUgcHJlc3NlZCBhbmQgZHJhZ2dlZC5cbiAgICpcbiAgICogQHBhcmFtIHtib29sZWFufSBbbmV3VmFsdWVdXG4gICAqIEByZXR1cm4ge2Jvb2xlYW4gfCBJbnRlcmFjdGFibGV9IFRoZSBjdXJyZW50IHNldHRpbmcgb3IgdGhpcyBJbnRlcmFjdGFibGVcbiAgICovXG4gIEludGVyYWN0YWJsZS5wcm90b3R5cGUuc3R5bGVDdXJzb3IgPSBzdHlsZUN1cnNvclxuXG4gIEludGVyYWN0YWJsZS5wcm90b3R5cGUuZGVmYXVsdEFjdGlvbkNoZWNrZXIgPSBmdW5jdGlvbiAodGhpczogSW50ZXJhY3RhYmxlLCBwb2ludGVyLCBldmVudCwgaW50ZXJhY3Rpb24sIGVsZW1lbnQpIHtcbiAgICByZXR1cm4gZGVmYXVsdEFjdGlvbkNoZWNrZXIodGhpcywgcG9pbnRlciwgZXZlbnQsIGludGVyYWN0aW9uLCBlbGVtZW50LCBhY3Rpb25zKVxuICB9XG59XG5cbmZ1bmN0aW9uIGdldEFjdGlvbiAodGhpczogSW50ZXJhY3RhYmxlLCBwb2ludGVyOiBJbnRlcmFjdC5Qb2ludGVyVHlwZSwgZXZlbnQ6IEludGVyYWN0LlBvaW50ZXJFdmVudFR5cGUsIGludGVyYWN0aW9uOiBJbnRlcmFjdGlvbiwgZWxlbWVudDogRWxlbWVudCk6IEludGVyYWN0LkFjdGlvblByb3BzIHtcbiAgY29uc3QgYWN0aW9uID0gdGhpcy5kZWZhdWx0QWN0aW9uQ2hlY2tlcihwb2ludGVyLCBldmVudCwgaW50ZXJhY3Rpb24sIGVsZW1lbnQpXG5cbiAgaWYgKHRoaXMub3B0aW9ucy5hY3Rpb25DaGVja2VyKSB7XG4gICAgcmV0dXJuIHRoaXMub3B0aW9ucy5hY3Rpb25DaGVja2VyKHBvaW50ZXIsIGV2ZW50LCBhY3Rpb24sIHRoaXMsIGVsZW1lbnQsIGludGVyYWN0aW9uKVxuICB9XG5cbiAgcmV0dXJuIGFjdGlvblxufVxuXG5mdW5jdGlvbiBkZWZhdWx0QWN0aW9uQ2hlY2tlciAoaW50ZXJhY3RhYmxlOiBJbnRlcmFjdGFibGUsIHBvaW50ZXI6IEludGVyYWN0LlBvaW50ZXJUeXBlLCBldmVudDogSW50ZXJhY3QuUG9pbnRlckV2ZW50VHlwZSwgaW50ZXJhY3Rpb246IEludGVyYWN0aW9uLCBlbGVtZW50OiBFbGVtZW50LCBhY3Rpb25zOiBBY3Rpb25zKSB7XG4gIGNvbnN0IHJlY3QgPSBpbnRlcmFjdGFibGUuZ2V0UmVjdChlbGVtZW50KVxuICBjb25zdCBidXR0b25zID0gKGV2ZW50IGFzIE1vdXNlRXZlbnQpLmJ1dHRvbnMgfHwgKHtcbiAgICAwOiAxLFxuICAgIDE6IDQsXG4gICAgMzogOCxcbiAgICA0OiAxNixcbiAgfSlbKGV2ZW50IGFzIE1vdXNlRXZlbnQpLmJ1dHRvbiBhcyAwIHwgMSB8IDMgfCA0XVxuICBsZXQgYWN0aW9uID0gbnVsbFxuXG4gIGZvciAoY29uc3QgYWN0aW9uTmFtZSBvZiBhY3Rpb25zLm5hbWVzKSB7XG4gICAgLy8gY2hlY2sgbW91c2VCdXR0b24gc2V0dGluZyBpZiB0aGUgcG9pbnRlciBpcyBkb3duXG4gICAgaWYgKGludGVyYWN0aW9uLnBvaW50ZXJJc0Rvd24gJiZcbiAgICAgICAgL21vdXNlfHBvaW50ZXIvLnRlc3QoaW50ZXJhY3Rpb24ucG9pbnRlclR5cGUpICYmXG4gICAgICAoYnV0dG9ucyAmIGludGVyYWN0YWJsZS5vcHRpb25zW2FjdGlvbk5hbWVdLm1vdXNlQnV0dG9ucykgPT09IDApIHtcbiAgICAgIGNvbnRpbnVlXG4gICAgfVxuXG4gICAgYWN0aW9uID0gKGFjdGlvbnNbYWN0aW9uTmFtZSBhcyBrZXlvZiBBY3Rpb25zXSBhcyBhbnkpLmNoZWNrZXIocG9pbnRlciwgZXZlbnQsIGludGVyYWN0YWJsZSwgZWxlbWVudCwgaW50ZXJhY3Rpb24sIHJlY3QpXG5cbiAgICBpZiAoYWN0aW9uKSB7XG4gICAgICByZXR1cm4gYWN0aW9uXG4gICAgfVxuICB9XG59XG5cbmZ1bmN0aW9uIHN0eWxlQ3Vyc29yICh0aGlzOiBJbnRlcmFjdGFibGUsIG5ld1ZhbHVlPzogYm9vbGVhbikge1xuICBpZiAoaXMuYm9vbChuZXdWYWx1ZSkpIHtcbiAgICB0aGlzLm9wdGlvbnMuc3R5bGVDdXJzb3IgPSBuZXdWYWx1ZVxuXG4gICAgcmV0dXJuIHRoaXNcbiAgfVxuXG4gIGlmIChuZXdWYWx1ZSA9PT0gbnVsbCkge1xuICAgIGRlbGV0ZSB0aGlzLm9wdGlvbnMuc3R5bGVDdXJzb3JcblxuICAgIHJldHVybiB0aGlzXG4gIH1cblxuICByZXR1cm4gdGhpcy5vcHRpb25zLnN0eWxlQ3Vyc29yXG59XG5cbmZ1bmN0aW9uIGFjdGlvbkNoZWNrZXIgKHRoaXM6IEludGVyYWN0YWJsZSwgY2hlY2tlcjogYW55KSB7XG4gIGlmIChpcy5mdW5jKGNoZWNrZXIpKSB7XG4gICAgdGhpcy5vcHRpb25zLmFjdGlvbkNoZWNrZXIgPSBjaGVja2VyXG5cbiAgICByZXR1cm4gdGhpc1xuICB9XG5cbiAgaWYgKGNoZWNrZXIgPT09IG51bGwpIHtcbiAgICBkZWxldGUgdGhpcy5vcHRpb25zLmFjdGlvbkNoZWNrZXJcblxuICAgIHJldHVybiB0aGlzXG4gIH1cblxuICByZXR1cm4gdGhpcy5vcHRpb25zLmFjdGlvbkNoZWNrZXJcbn1cblxuZXhwb3J0IGRlZmF1bHQge1xuICBpZDogJ2F1dG8tc3RhcnQvaW50ZXJhY3RhYmxlTWV0aG9kcycsXG4gIGluc3RhbGwsXG59XG4iXX0=