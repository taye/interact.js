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
export default { install };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiSW50ZXJhY3RhYmxlTWV0aG9kcy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIkludGVyYWN0YWJsZU1ldGhvZHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUFFLFFBQVEsRUFBRSxNQUFNLG1CQUFtQixDQUFBO0FBQzVDLE9BQU8sS0FBSyxFQUFFLE1BQU0sc0JBQXNCLENBQUE7QUEwQjFDLFNBQVMsT0FBTyxDQUFFLEtBQVk7SUFDNUIsTUFBTTtJQUNKLDBCQUEwQjtJQUMxQixZQUFZLEVBQUUsMkNBQTJDO0lBQ3pELE9BQU8sR0FDUixHQUFHLEtBQUssQ0FBQTtJQUVULFlBQVksQ0FBQyxTQUFTLENBQUMsU0FBUyxHQUFHLFNBQVMsQ0FBQTtJQUU1Qzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O09BMkJHO0lBQ0gsWUFBWSxDQUFDLFNBQVMsQ0FBQyxVQUFVLEdBQUcsUUFBUSxDQUFDLFVBQThCLFFBQVE7UUFDakYsT0FBTyxJQUFJLENBQUMsaUJBQWlCLENBQUMsWUFBWSxFQUFFLFFBQVEsQ0FBQyxDQUFBO0lBQ3ZELENBQUMsRUFBRSxtR0FBbUcsQ0FBQyxDQUFBO0lBRXZHOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O09Bc0JHO0lBQ0gsWUFBWSxDQUFDLFNBQVMsQ0FBQyxTQUFTLEdBQUcsUUFBUSxDQUFDLFVBQThCLFFBQVE7UUFDaEYsT0FBTyxJQUFJLENBQUMsaUJBQWlCLENBQUMsV0FBVyxFQUFFLFFBQVEsQ0FBQyxDQUFBO0lBQ3RELENBQUMsRUFBRSxpR0FBaUcsQ0FBQyxDQUFBO0lBRXJHOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7T0E4Qkc7SUFDSCxZQUFZLENBQUMsU0FBUyxDQUFDLGFBQWEsR0FBRyxhQUFhLENBQUE7SUFFcEQ7Ozs7OztPQU1HO0lBQ0gsWUFBWSxDQUFDLFNBQVMsQ0FBQyxXQUFXLEdBQUcsV0FBVyxDQUFBO0lBRWhELFlBQVksQ0FBQyxTQUFTLENBQUMsb0JBQW9CLEdBQUcs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Q0FBQTtBQUNuQyxDQUFDO0FBRUQsZUFBZSxFQUFFLE9BQU8sRUFBRSxDQUFBIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgd2Fybk9uY2UgfSBmcm9tICdAaW50ZXJhY3Rqcy91dGlscydcbmltcG9ydCAqIGFzIGlzIGZyb20gJ0BpbnRlcmFjdGpzL3V0aWxzL2lzJ1xuXG4vLyBUT0RPOiB0aGVyZSBzZWVtcyB0byBiZSBhIEBiYWJlbC9wcmVzZXQtdHlwZXNjcmlwdCBidWcgY2F1c2luZyByZWd1bGFyIGltcG9ydFxuLy8gc3ludGF4IHRvIHJlbWFpbiBpbiBqcyBvdXRwdXRcbnR5cGUgU2NvcGUgPSBpbXBvcnQgKCdAaW50ZXJhY3Rqcy9jb3JlL3Njb3BlJykuU2NvcGVcbnR5cGUgQWN0aW9ucyA9IGltcG9ydCAoJ0BpbnRlcmFjdGpzL2NvcmUvc2NvcGUnKS5BY3Rpb25zXG50eXBlIEludGVyYWN0aW9uID0gaW1wb3J0ICgnQGludGVyYWN0anMvY29yZS9JbnRlcmFjdGlvbicpLmRlZmF1bHRcbnR5cGUgSW50ZXJhY3RhYmxlID0gaW1wb3J0ICgnQGludGVyYWN0anMvY29yZS9JbnRlcmFjdGFibGUnKS5kZWZhdWx0XG5cbmRlY2xhcmUgbW9kdWxlICdAaW50ZXJhY3Rqcy9jb3JlL0ludGVyYWN0YWJsZScge1xuICBpbnRlcmZhY2UgSW50ZXJhY3RhYmxlIHtcbiAgICBnZXRBY3Rpb246IHR5cGVvZiBnZXRBY3Rpb25cbiAgICBkZWZhdWx0QWN0aW9uQ2hlY2tlcjogKHBvaW50ZXI6IGFueSwgZXZlbnQ6IGFueSwgaW50ZXJhY3Rpb246IGFueSwgZWxlbWVudDogYW55KSA9PiBhbnlcbiAgICBzdHlsZUN1cnNvcjogdHlwZW9mIHN0eWxlQ3Vyc29yXG4gICAgYWN0aW9uQ2hlY2tlcjogdHlwZW9mIGFjdGlvbkNoZWNrZXJcbiAgICBpZ25vcmVGcm9tOiAoLi4uYXJnczogYW55KSA9PiBib29sZWFuXG4gICAgYWxsb3dGcm9tOiAoLi4uYXJnczogYW55KSA9PiBib29sZWFuXG4gIH1cbn1cblxuZGVjbGFyZSBtb2R1bGUgJ0BpbnRlcmFjdGpzL2NvcmUvSW50ZXJhY3Rpb24nIHtcbiAgaW50ZXJmYWNlIEludGVyYWN0aW9uIHtcbiAgICBwb2ludGVySXNEb3duOiBib29sZWFuXG4gIH1cbn1cblxuZnVuY3Rpb24gaW5zdGFsbCAoc2NvcGU6IFNjb3BlKSB7XG4gIGNvbnN0IHtcbiAgICAvKiogQGxlbmRzIEludGVyYWN0YWJsZSAqL1xuICAgIEludGVyYWN0YWJsZSwgLy8gdHNsaW50OmRpc2FibGUtbGluZSBuby1zaGFkb3dlZC12YXJpYWJsZVxuICAgIGFjdGlvbnMsXG4gIH0gPSBzY29wZVxuXG4gIEludGVyYWN0YWJsZS5wcm90b3R5cGUuZ2V0QWN0aW9uID0gZ2V0QWN0aW9uXG5cbiAgLyoqXG4gICAqIGBgYGpzXG4gICAqIGludGVyYWN0KGVsZW1lbnQsIHsgaWdub3JlRnJvbTogZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ25vLWFjdGlvbicpIH0pO1xuICAgKiAvLyBvclxuICAgKiBpbnRlcmFjdChlbGVtZW50KS5pZ25vcmVGcm9tKCdpbnB1dCwgdGV4dGFyZWEsIGEnKTtcbiAgICogYGBgXG4gICAqIEBkZXByZWNhdGVkXG4gICAqIElmIHRoZSB0YXJnZXQgb2YgdGhlIGBtb3VzZWRvd25gLCBgcG9pbnRlcmRvd25gIG9yIGB0b3VjaHN0YXJ0YCBldmVudCBvciBhbnlcbiAgICogb2YgaXQncyBwYXJlbnRzIG1hdGNoIHRoZSBnaXZlbiBDU1Mgc2VsZWN0b3Igb3IgRWxlbWVudCwgbm9cbiAgICogZHJhZy9yZXNpemUvZ2VzdHVyZSBpcyBzdGFydGVkLlxuICAgKlxuICAgKiBEb24ndCB1c2UgdGhpcyBtZXRob2QuIEluc3RlYWQgc2V0IHRoZSBgaWdub3JlRnJvbWAgb3B0aW9uIGZvciBlYWNoIGFjdGlvblxuICAgKiBvciBmb3IgYHBvaW50ZXJFdmVudHNgXG4gICAqXG4gICAqIEBleGFtcGxlXG4gICAqIGludGVyYWN0KHRhcmdldHQpXG4gICAqICAgLmRyYWdnYWJsZSh7XG4gICAqICAgICBpZ25vcmVGcm9tOiAnaW5wdXQsIHRleHRhcmVhLCBhW2hyZWZdJycsXG4gICAqICAgfSlcbiAgICogICAucG9pbnRlckV2ZW50cyh7XG4gICAqICAgICBpZ25vcmVGcm9tOiAnW25vLXBvaW50ZXJdJyxcbiAgICogICB9KTtcbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmcgfCBFbGVtZW50IHwgbnVsbH0gW25ld1ZhbHVlXSBhIENTUyBzZWxlY3RvciBzdHJpbmcsIGFuXG4gICAqIEVsZW1lbnQgb3IgYG51bGxgIHRvIG5vdCBpZ25vcmUgYW55IGVsZW1lbnRzXG4gICAqIEByZXR1cm4ge3N0cmluZyB8IEVsZW1lbnQgfCBvYmplY3R9IFRoZSBjdXJyZW50IGlnbm9yZUZyb20gdmFsdWUgb3IgdGhpc1xuICAgKiBJbnRlcmFjdGFibGVcbiAgICovXG4gIEludGVyYWN0YWJsZS5wcm90b3R5cGUuaWdub3JlRnJvbSA9IHdhcm5PbmNlKGZ1bmN0aW9uICh0aGlzOiBJbnRlcmFjdGFibGUsIG5ld1ZhbHVlKSB7XG4gICAgcmV0dXJuIHRoaXMuX2JhY2tDb21wYXRPcHRpb24oJ2lnbm9yZUZyb20nLCBuZXdWYWx1ZSlcbiAgfSwgJ0ludGVyYWN0YWJsZS5pZ25vcmVGcm9tKCkgaGFzIGJlZW4gZGVwcmVjYXRlZC4gVXNlIEludGVyYWN0YmxlLmRyYWdnYWJsZSh7aWdub3JlRnJvbTogbmV3VmFsdWV9KS4nKVxuXG4gIC8qKlxuICAgKiBAZGVwcmVjYXRlZFxuICAgKlxuICAgKiBBIGRyYWcvcmVzaXplL2dlc3R1cmUgaXMgc3RhcnRlZCBvbmx5IElmIHRoZSB0YXJnZXQgb2YgdGhlIGBtb3VzZWRvd25gLFxuICAgKiBgcG9pbnRlcmRvd25gIG9yIGB0b3VjaHN0YXJ0YCBldmVudCBvciBhbnkgb2YgaXQncyBwYXJlbnRzIG1hdGNoIHRoZSBnaXZlblxuICAgKiBDU1Mgc2VsZWN0b3Igb3IgRWxlbWVudC5cbiAgICpcbiAgICogRG9uJ3QgdXNlIHRoaXMgbWV0aG9kLiBJbnN0ZWFkIHNldCB0aGUgYGFsbG93RnJvbWAgb3B0aW9uIGZvciBlYWNoIGFjdGlvblxuICAgKiBvciBmb3IgYHBvaW50ZXJFdmVudHNgXG4gICAqXG4gICAqIEBleGFtcGxlXG4gICAqIGludGVyYWN0KHRhcmdldHQpXG4gICAqICAgLnJlc2l6YWJsZSh7XG4gICAqICAgICBhbGxvd0Zyb206ICcucmVzaXplLWhhbmRsZScsXG4gICAqICAgLnBvaW50ZXJFdmVudHMoe1xuICAgKiAgICAgYWxsb3dGcm9tOiAnLmhhbmRsZScsLFxuICAgKiAgIH0pO1xuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZyB8IEVsZW1lbnQgfCBudWxsfSBbbmV3VmFsdWVdIGEgQ1NTIHNlbGVjdG9yIHN0cmluZywgYW5cbiAgICogRWxlbWVudCBvciBgbnVsbGAgdG8gYWxsb3cgZnJvbSBhbnkgZWxlbWVudFxuICAgKiBAcmV0dXJuIHtzdHJpbmcgfCBFbGVtZW50IHwgb2JqZWN0fSBUaGUgY3VycmVudCBhbGxvd0Zyb20gdmFsdWUgb3IgdGhpc1xuICAgKiBJbnRlcmFjdGFibGVcbiAgICovXG4gIEludGVyYWN0YWJsZS5wcm90b3R5cGUuYWxsb3dGcm9tID0gd2Fybk9uY2UoZnVuY3Rpb24gKHRoaXM6IEludGVyYWN0YWJsZSwgbmV3VmFsdWUpIHtcbiAgICByZXR1cm4gdGhpcy5fYmFja0NvbXBhdE9wdGlvbignYWxsb3dGcm9tJywgbmV3VmFsdWUpXG4gIH0sICdJbnRlcmFjdGFibGUuYWxsb3dGcm9tKCkgaGFzIGJlZW4gZGVwcmVjYXRlZC4gVXNlIEludGVyYWN0YmxlLmRyYWdnYWJsZSh7YWxsb3dGcm9tOiBuZXdWYWx1ZX0pLicpXG5cbiAgLyoqXG4gICAqIGBgYGpzXG4gICAqIGludGVyYWN0KCcucmVzaXplLWRyYWcnKVxuICAgKiAgIC5yZXNpemFibGUodHJ1ZSlcbiAgICogICAuZHJhZ2dhYmxlKHRydWUpXG4gICAqICAgLmFjdGlvbkNoZWNrZXIoZnVuY3Rpb24gKHBvaW50ZXIsIGV2ZW50LCBhY3Rpb24sIGludGVyYWN0YWJsZSwgZWxlbWVudCwgaW50ZXJhY3Rpb24pIHtcbiAgICpcbiAgICogICBpZiAoaW50ZXJhY3QubWF0Y2hlc1NlbGVjdG9yKGV2ZW50LnRhcmdldCwgJy5kcmFnLWhhbmRsZScpIHtcbiAgICogICAgIC8vIGZvcmNlIGRyYWcgd2l0aCBoYW5kbGUgdGFyZ2V0XG4gICAqICAgICBhY3Rpb24ubmFtZSA9IGRyYWc7XG4gICAqICAgfVxuICAgKiAgIGVsc2Uge1xuICAgKiAgICAgLy8gcmVzaXplIGZyb20gdGhlIHRvcCBhbmQgcmlnaHQgZWRnZXNcbiAgICogICAgIGFjdGlvbi5uYW1lICA9ICdyZXNpemUnO1xuICAgKiAgICAgYWN0aW9uLmVkZ2VzID0geyB0b3A6IHRydWUsIHJpZ2h0OiB0cnVlIH07XG4gICAqICAgfVxuICAgKlxuICAgKiAgIHJldHVybiBhY3Rpb247XG4gICAqIH0pO1xuICAgKiBgYGBcbiAgICpcbiAgICogR2V0cyBvciBzZXRzIHRoZSBmdW5jdGlvbiB1c2VkIHRvIGNoZWNrIGFjdGlvbiB0byBiZSBwZXJmb3JtZWQgb25cbiAgICogcG9pbnRlckRvd25cbiAgICpcbiAgICogQHBhcmFtIHtmdW5jdGlvbiB8IG51bGx9IFtjaGVja2VyXSBBIGZ1bmN0aW9uIHdoaWNoIHRha2VzIGEgcG9pbnRlciBldmVudCxcbiAgICogZGVmYXVsdEFjdGlvbiBzdHJpbmcsIGludGVyYWN0YWJsZSwgZWxlbWVudCBhbmQgaW50ZXJhY3Rpb24gYXMgcGFyYW1ldGVyc1xuICAgKiBhbmQgcmV0dXJucyBhbiBvYmplY3Qgd2l0aCBuYW1lIHByb3BlcnR5ICdkcmFnJyAncmVzaXplJyBvciAnZ2VzdHVyZScgYW5kXG4gICAqIG9wdGlvbmFsbHkgYW4gYGVkZ2VzYCBvYmplY3Qgd2l0aCBib29sZWFuICd0b3AnLCAnbGVmdCcsICdib3R0b20nIGFuZCByaWdodFxuICAgKiBwcm9wcy5cbiAgICogQHJldHVybiB7RnVuY3Rpb24gfCBJbnRlcmFjdGFibGV9IFRoZSBjaGVja2VyIGZ1bmN0aW9uIG9yIHRoaXMgSW50ZXJhY3RhYmxlXG4gICAqL1xuICBJbnRlcmFjdGFibGUucHJvdG90eXBlLmFjdGlvbkNoZWNrZXIgPSBhY3Rpb25DaGVja2VyXG5cbiAgLyoqXG4gICAqIFJldHVybnMgb3Igc2V0cyB3aGV0aGVyIHRoZSB0aGUgY3Vyc29yIHNob3VsZCBiZSBjaGFuZ2VkIGRlcGVuZGluZyBvbiB0aGVcbiAgICogYWN0aW9uIHRoYXQgd291bGQgYmUgcGVyZm9ybWVkIGlmIHRoZSBtb3VzZSB3ZXJlIHByZXNzZWQgYW5kIGRyYWdnZWQuXG4gICAqXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gW25ld1ZhbHVlXVxuICAgKiBAcmV0dXJuIHtib29sZWFuIHwgSW50ZXJhY3RhYmxlfSBUaGUgY3VycmVudCBzZXR0aW5nIG9yIHRoaXMgSW50ZXJhY3RhYmxlXG4gICAqL1xuICBJbnRlcmFjdGFibGUucHJvdG90eXBlLnN0eWxlQ3Vyc29yID0gc3R5bGVDdXJzb3JcblxuICBJbnRlcmFjdGFibGUucHJvdG90eXBlLmRlZmF1bHRBY3Rpb25DaGVja2VyID0gZnVuY3Rpb24gKHRoaXM6IEludGVyYWN0YWJsZSwgcG9pbnRlciwgZXZlbnQsIGludGVyYWN0aW9uLCBlbGVtZW50KSB7XG4gICAgcmV0dXJuIGRlZmF1bHRBY3Rpb25DaGVja2VyKHRoaXMsIHBvaW50ZXIsIGV2ZW50LCBpbnRlcmFjdGlvbiwgZWxlbWVudCwgYWN0aW9ucylcbiAgfVxufVxuXG5mdW5jdGlvbiBnZXRBY3Rpb24gKHRoaXM6IEludGVyYWN0YWJsZSwgcG9pbnRlcjogSW50ZXJhY3QuUG9pbnRlclR5cGUsIGV2ZW50OiBJbnRlcmFjdC5Qb2ludGVyRXZlbnRUeXBlLCBpbnRlcmFjdGlvbjogSW50ZXJhY3Rpb24sIGVsZW1lbnQ6IEVsZW1lbnQpOiBJbnRlcmFjdC5BY3Rpb25Qcm9wcyB7XG4gIGNvbnN0IGFjdGlvbiA9IHRoaXMuZGVmYXVsdEFjdGlvbkNoZWNrZXIocG9pbnRlciwgZXZlbnQsIGludGVyYWN0aW9uLCBlbGVtZW50KVxuXG4gIGlmICh0aGlzLm9wdGlvbnMuYWN0aW9uQ2hlY2tlcikge1xuICAgIHJldHVybiB0aGlzLm9wdGlvbnMuYWN0aW9uQ2hlY2tlcihwb2ludGVyLCBldmVudCwgYWN0aW9uLCB0aGlzLCBlbGVtZW50LCBpbnRlcmFjdGlvbilcbiAgfVxuXG4gIHJldHVybiBhY3Rpb25cbn1cblxuZnVuY3Rpb24gZGVmYXVsdEFjdGlvbkNoZWNrZXIgKGludGVyYWN0YWJsZTogSW50ZXJhY3RhYmxlLCBwb2ludGVyOiBJbnRlcmFjdC5Qb2ludGVyVHlwZSwgZXZlbnQ6IEludGVyYWN0LlBvaW50ZXJFdmVudFR5cGUsIGludGVyYWN0aW9uOiBJbnRlcmFjdGlvbiwgZWxlbWVudDogRWxlbWVudCwgYWN0aW9uczogQWN0aW9ucykge1xuICBjb25zdCByZWN0ID0gaW50ZXJhY3RhYmxlLmdldFJlY3QoZWxlbWVudClcbiAgY29uc3QgYnV0dG9ucyA9IChldmVudCBhcyBNb3VzZUV2ZW50KS5idXR0b25zIHx8ICh7XG4gICAgMDogMSxcbiAgICAxOiA0LFxuICAgIDM6IDgsXG4gICAgNDogMTYsXG4gIH0pWyhldmVudCBhcyBNb3VzZUV2ZW50KS5idXR0b24gYXMgMCB8IDEgfCAzIHwgNF1cbiAgbGV0IGFjdGlvbiA9IG51bGxcblxuICBmb3IgKGNvbnN0IGFjdGlvbk5hbWUgb2YgYWN0aW9ucy5uYW1lcykge1xuICAgIC8vIGNoZWNrIG1vdXNlQnV0dG9uIHNldHRpbmcgaWYgdGhlIHBvaW50ZXIgaXMgZG93blxuICAgIGlmIChpbnRlcmFjdGlvbi5wb2ludGVySXNEb3duICYmXG4gICAgICAgIC9tb3VzZXxwb2ludGVyLy50ZXN0KGludGVyYWN0aW9uLnBvaW50ZXJUeXBlKSAmJlxuICAgICAgKGJ1dHRvbnMgJiBpbnRlcmFjdGFibGUub3B0aW9uc1thY3Rpb25OYW1lXS5tb3VzZUJ1dHRvbnMpID09PSAwKSB7XG4gICAgICBjb250aW51ZVxuICAgIH1cblxuICAgIGFjdGlvbiA9IChhY3Rpb25zW2FjdGlvbk5hbWUgYXMga2V5b2YgQWN0aW9uc10gYXMgYW55KS5jaGVja2VyKHBvaW50ZXIsIGV2ZW50LCBpbnRlcmFjdGFibGUsIGVsZW1lbnQsIGludGVyYWN0aW9uLCByZWN0KVxuXG4gICAgaWYgKGFjdGlvbikge1xuICAgICAgcmV0dXJuIGFjdGlvblxuICAgIH1cbiAgfVxufVxuXG5mdW5jdGlvbiBzdHlsZUN1cnNvciAodGhpczogSW50ZXJhY3RhYmxlLCBuZXdWYWx1ZT86IGJvb2xlYW4pIHtcbiAgaWYgKGlzLmJvb2wobmV3VmFsdWUpKSB7XG4gICAgdGhpcy5vcHRpb25zLnN0eWxlQ3Vyc29yID0gbmV3VmFsdWVcblxuICAgIHJldHVybiB0aGlzXG4gIH1cblxuICBpZiAobmV3VmFsdWUgPT09IG51bGwpIHtcbiAgICBkZWxldGUgdGhpcy5vcHRpb25zLnN0eWxlQ3Vyc29yXG5cbiAgICByZXR1cm4gdGhpc1xuICB9XG5cbiAgcmV0dXJuIHRoaXMub3B0aW9ucy5zdHlsZUN1cnNvclxufVxuXG5mdW5jdGlvbiBhY3Rpb25DaGVja2VyICh0aGlzOiBJbnRlcmFjdGFibGUsIGNoZWNrZXI6IGFueSkge1xuICBpZiAoaXMuZnVuYyhjaGVja2VyKSkge1xuICAgIHRoaXMub3B0aW9ucy5hY3Rpb25DaGVja2VyID0gY2hlY2tlclxuXG4gICAgcmV0dXJuIHRoaXNcbiAgfVxuXG4gIGlmIChjaGVja2VyID09PSBudWxsKSB7XG4gICAgZGVsZXRlIHRoaXMub3B0aW9ucy5hY3Rpb25DaGVja2VyXG5cbiAgICByZXR1cm4gdGhpc1xuICB9XG5cbiAgcmV0dXJuIHRoaXMub3B0aW9ucy5hY3Rpb25DaGVja2VyXG59XG5cbmV4cG9ydCBkZWZhdWx0IHsgaW5zdGFsbCB9XG4iXX0=