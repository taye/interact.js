import BaseEvent from '@interactjs/core/BaseEvent';
import * as arr from '@interactjs/utils/arr';
class DropEvent extends BaseEvent {
    /**
     * Class of events fired on dropzones during drags with acceptable targets.
     */
    constructor(dropState, dragEvent, type) {
        super(dragEvent._interaction);
        this.propagationStopped = false;
        this.immediatePropagationStopped = false;
        const { element, dropzone } = type === 'dragleave'
            ? dropState.prev
            : dropState.cur;
        this.type = type;
        this.target = element;
        this.currentTarget = element;
        this.dropzone = dropzone;
        this.dragEvent = dragEvent;
        this.relatedTarget = dragEvent.target;
        this.draggable = dragEvent.interactable;
        this.timeStamp = dragEvent.timeStamp;
    }
    /**
     * If this is a `dropactivate` event, the dropzone element will be
     * deactivated.
     *
     * If this is a `dragmove` or `dragenter`, a `dragleave` will be fired on the
     * dropzone element and more.
     */
    reject() {
        const { dropState } = this._interaction;
        if ((this.type !== 'dropactivate') && (!this.dropzone ||
            dropState.cur.dropzone !== this.dropzone ||
            dropState.cur.element !== this.target)) {
            return;
        }
        dropState.prev.dropzone = this.dropzone;
        dropState.prev.element = this.target;
        dropState.rejected = true;
        dropState.events.enter = null;
        this.stopImmediatePropagation();
        if (this.type === 'dropactivate') {
            const activeDrops = dropState.activeDrops;
            const index = arr.findIndex(activeDrops, ({ dropzone, element }) => dropzone === this.dropzone && element === this.target);
            dropState.activeDrops = [
                ...activeDrops.slice(0, index),
                ...activeDrops.slice(index + 1),
            ];
            const deactivateEvent = new DropEvent(dropState, this.dragEvent, 'dropdeactivate');
            deactivateEvent.dropzone = this.dropzone;
            deactivateEvent.target = this.target;
            this.dropzone.fire(deactivateEvent);
        }
        else {
            this.dropzone.fire(new DropEvent(dropState, this.dragEvent, 'dragleave'));
        }
    }
    preventDefault() { }
    stopPropagation() {
        this.propagationStopped = true;
    }
    stopImmediatePropagation() {
        this.immediatePropagationStopped = this.propagationStopped = true;
    }
}
export default DropEvent;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiRHJvcEV2ZW50LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiRHJvcEV2ZW50LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sU0FBUyxNQUFNLDRCQUE0QixDQUFBO0FBS2xELE9BQU8sS0FBSyxHQUFHLE1BQU0sdUJBQXVCLENBQUE7QUFFNUMsTUFBTSxTQUFVLFNBQVEsU0FBUztJQVUvQjs7T0FFRztJQUNILFlBQWEsU0FBbUMsRUFBRSxTQUF3QixFQUFFLElBQVk7UUFDdEYsS0FBSyxDQUFDLFNBQVMsQ0FBQyxZQUFZLENBQUMsQ0FBQTtRQVAvQix1QkFBa0IsR0FBRyxLQUFLLENBQUE7UUFDMUIsZ0NBQTJCLEdBQUcsS0FBSyxDQUFBO1FBUWpDLE1BQU0sRUFBRSxPQUFPLEVBQUUsUUFBUSxFQUFFLEdBQUcsSUFBSSxLQUFLLFdBQVc7WUFDaEQsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxJQUFJO1lBQ2hCLENBQUMsQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFBO1FBRWpCLElBQUksQ0FBQyxJQUFJLEdBQVksSUFBSSxDQUFBO1FBQ3pCLElBQUksQ0FBQyxNQUFNLEdBQVUsT0FBTyxDQUFBO1FBQzVCLElBQUksQ0FBQyxhQUFhLEdBQUcsT0FBTyxDQUFBO1FBQzVCLElBQUksQ0FBQyxRQUFRLEdBQVEsUUFBUSxDQUFBO1FBQzdCLElBQUksQ0FBQyxTQUFTLEdBQU8sU0FBUyxDQUFBO1FBQzlCLElBQUksQ0FBQyxhQUFhLEdBQUcsU0FBUyxDQUFDLE1BQU0sQ0FBQTtRQUNyQyxJQUFJLENBQUMsU0FBUyxHQUFPLFNBQVMsQ0FBQyxZQUFZLENBQUE7UUFDM0MsSUFBSSxDQUFDLFNBQVMsR0FBTyxTQUFTLENBQUMsU0FBUyxDQUFBO0lBQzFDLENBQUM7SUFFRDs7Ozs7O09BTUc7SUFDSCxNQUFNO1FBQ0osTUFBTSxFQUFFLFNBQVMsRUFBRSxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUE7UUFFdkMsSUFDRSxDQUFDLElBQUksQ0FBQyxJQUFJLEtBQUssY0FBYyxDQUFDLElBQUksQ0FDaEMsQ0FBQyxJQUFJLENBQUMsUUFBUTtZQUNkLFNBQVMsQ0FBQyxHQUFHLENBQUMsUUFBUSxLQUFLLElBQUksQ0FBQyxRQUFRO1lBQ3hDLFNBQVMsQ0FBQyxHQUFHLENBQUMsT0FBTyxLQUFLLElBQUksQ0FBQyxNQUFNLENBQUMsRUFBRTtZQUMxQyxPQUFNO1NBQ1A7UUFFRCxTQUFTLENBQUMsSUFBSSxDQUFDLFFBQVEsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFBO1FBQ3ZDLFNBQVMsQ0FBQyxJQUFJLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUE7UUFFcEMsU0FBUyxDQUFDLFFBQVEsR0FBRyxJQUFJLENBQUE7UUFDekIsU0FBUyxDQUFDLE1BQU0sQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFBO1FBRTdCLElBQUksQ0FBQyx3QkFBd0IsRUFBRSxDQUFBO1FBRS9CLElBQUksSUFBSSxDQUFDLElBQUksS0FBSyxjQUFjLEVBQUU7WUFDaEMsTUFBTSxXQUFXLEdBQUcsU0FBUyxDQUFDLFdBQVcsQ0FBQTtZQUN6QyxNQUFNLEtBQUssR0FBRyxHQUFHLENBQUMsU0FBUyxDQUFDLFdBQVcsRUFBRSxDQUFDLEVBQUUsUUFBUSxFQUFFLE9BQU8sRUFBRSxFQUFFLEVBQUUsQ0FDakUsUUFBUSxLQUFLLElBQUksQ0FBQyxRQUFRLElBQUksT0FBTyxLQUFLLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQTtZQUV4RCxTQUFTLENBQUMsV0FBVyxHQUFHO2dCQUN0QixHQUFHLFdBQVcsQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLEtBQUssQ0FBQztnQkFDOUIsR0FBRyxXQUFXLENBQUMsS0FBSyxDQUFDLEtBQUssR0FBRyxDQUFDLENBQUM7YUFDaEMsQ0FBQTtZQUVELE1BQU0sZUFBZSxHQUFHLElBQUksU0FBUyxDQUFDLFNBQVMsRUFBRSxJQUFJLENBQUMsU0FBUyxFQUFFLGdCQUFnQixDQUFDLENBQUE7WUFFbEYsZUFBZSxDQUFDLFFBQVEsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFBO1lBQ3hDLGVBQWUsQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQTtZQUVwQyxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxlQUFlLENBQUMsQ0FBQTtTQUNwQzthQUNJO1lBQ0gsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsSUFBSSxTQUFTLENBQUMsU0FBUyxFQUFFLElBQUksQ0FBQyxTQUFTLEVBQUUsV0FBVyxDQUFDLENBQUMsQ0FBQTtTQUMxRTtJQUNILENBQUM7SUFFRCxjQUFjLEtBQUssQ0FBQztJQUVwQixlQUFlO1FBQ2IsSUFBSSxDQUFDLGtCQUFrQixHQUFHLElBQUksQ0FBQTtJQUNoQyxDQUFDO0lBRUQsd0JBQXdCO1FBQ3RCLElBQUksQ0FBQywyQkFBMkIsR0FBRyxJQUFJLENBQUMsa0JBQWtCLEdBQUcsSUFBSSxDQUFBO0lBQ25FLENBQUM7Q0FDRjtBQUVELGVBQWUsU0FBUyxDQUFBIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IEJhc2VFdmVudCBmcm9tICdAaW50ZXJhY3Rqcy9jb3JlL0Jhc2VFdmVudCdcbmltcG9ydCBJbnRlcmFjdGFibGUgZnJvbSAnQGludGVyYWN0anMvY29yZS9JbnRlcmFjdGFibGUnXG5pbXBvcnQgSW50ZXJhY3RFdmVudCBmcm9tICdAaW50ZXJhY3Rqcy9jb3JlL0ludGVyYWN0RXZlbnQnXG5pbXBvcnQgSW50ZXJhY3Rpb24gZnJvbSAnQGludGVyYWN0anMvY29yZS9JbnRlcmFjdGlvbidcbmltcG9ydCB7IEFjdGlvbk5hbWUgfSBmcm9tICdAaW50ZXJhY3Rqcy9jb3JlL3Njb3BlJ1xuaW1wb3J0ICogYXMgYXJyIGZyb20gJ0BpbnRlcmFjdGpzL3V0aWxzL2FycidcblxuY2xhc3MgRHJvcEV2ZW50IGV4dGVuZHMgQmFzZUV2ZW50IHtcbiAgdGFyZ2V0OiBFbGVtZW50XG4gIGRyb3B6b25lOiBJbnRlcmFjdGFibGVcbiAgZHJhZ0V2ZW50OiBJbnRlcmFjdEV2ZW50PEFjdGlvbk5hbWUuRHJhZz5cbiAgcmVsYXRlZFRhcmdldDogRWxlbWVudFxuICBkcmFnZ2FibGU6IEludGVyYWN0YWJsZVxuICB0aW1lU3RhbXA6IG51bWJlclxuICBwcm9wYWdhdGlvblN0b3BwZWQgPSBmYWxzZVxuICBpbW1lZGlhdGVQcm9wYWdhdGlvblN0b3BwZWQgPSBmYWxzZVxuXG4gIC8qKlxuICAgKiBDbGFzcyBvZiBldmVudHMgZmlyZWQgb24gZHJvcHpvbmVzIGR1cmluZyBkcmFncyB3aXRoIGFjY2VwdGFibGUgdGFyZ2V0cy5cbiAgICovXG4gIGNvbnN0cnVjdG9yIChkcm9wU3RhdGU6IEludGVyYWN0aW9uWydkcm9wU3RhdGUnXSwgZHJhZ0V2ZW50OiBJbnRlcmFjdEV2ZW50LCB0eXBlOiBzdHJpbmcpIHtcbiAgICBzdXBlcihkcmFnRXZlbnQuX2ludGVyYWN0aW9uKVxuXG4gICAgY29uc3QgeyBlbGVtZW50LCBkcm9wem9uZSB9ID0gdHlwZSA9PT0gJ2RyYWdsZWF2ZSdcbiAgICAgID8gZHJvcFN0YXRlLnByZXZcbiAgICAgIDogZHJvcFN0YXRlLmN1clxuXG4gICAgdGhpcy50eXBlICAgICAgICAgID0gdHlwZVxuICAgIHRoaXMudGFyZ2V0ICAgICAgICA9IGVsZW1lbnRcbiAgICB0aGlzLmN1cnJlbnRUYXJnZXQgPSBlbGVtZW50XG4gICAgdGhpcy5kcm9wem9uZSAgICAgID0gZHJvcHpvbmVcbiAgICB0aGlzLmRyYWdFdmVudCAgICAgPSBkcmFnRXZlbnRcbiAgICB0aGlzLnJlbGF0ZWRUYXJnZXQgPSBkcmFnRXZlbnQudGFyZ2V0XG4gICAgdGhpcy5kcmFnZ2FibGUgICAgID0gZHJhZ0V2ZW50LmludGVyYWN0YWJsZVxuICAgIHRoaXMudGltZVN0YW1wICAgICA9IGRyYWdFdmVudC50aW1lU3RhbXBcbiAgfVxuXG4gIC8qKlxuICAgKiBJZiB0aGlzIGlzIGEgYGRyb3BhY3RpdmF0ZWAgZXZlbnQsIHRoZSBkcm9wem9uZSBlbGVtZW50IHdpbGwgYmVcbiAgICogZGVhY3RpdmF0ZWQuXG4gICAqXG4gICAqIElmIHRoaXMgaXMgYSBgZHJhZ21vdmVgIG9yIGBkcmFnZW50ZXJgLCBhIGBkcmFnbGVhdmVgIHdpbGwgYmUgZmlyZWQgb24gdGhlXG4gICAqIGRyb3B6b25lIGVsZW1lbnQgYW5kIG1vcmUuXG4gICAqL1xuICByZWplY3QgKCkge1xuICAgIGNvbnN0IHsgZHJvcFN0YXRlIH0gPSB0aGlzLl9pbnRlcmFjdGlvblxuXG4gICAgaWYgKFxuICAgICAgKHRoaXMudHlwZSAhPT0gJ2Ryb3BhY3RpdmF0ZScpICYmIChcbiAgICAgICAgIXRoaXMuZHJvcHpvbmUgfHxcbiAgICAgICAgZHJvcFN0YXRlLmN1ci5kcm9wem9uZSAhPT0gdGhpcy5kcm9wem9uZSB8fFxuICAgICAgICBkcm9wU3RhdGUuY3VyLmVsZW1lbnQgIT09IHRoaXMudGFyZ2V0KSkge1xuICAgICAgcmV0dXJuXG4gICAgfVxuXG4gICAgZHJvcFN0YXRlLnByZXYuZHJvcHpvbmUgPSB0aGlzLmRyb3B6b25lXG4gICAgZHJvcFN0YXRlLnByZXYuZWxlbWVudCA9IHRoaXMudGFyZ2V0XG5cbiAgICBkcm9wU3RhdGUucmVqZWN0ZWQgPSB0cnVlXG4gICAgZHJvcFN0YXRlLmV2ZW50cy5lbnRlciA9IG51bGxcblxuICAgIHRoaXMuc3RvcEltbWVkaWF0ZVByb3BhZ2F0aW9uKClcblxuICAgIGlmICh0aGlzLnR5cGUgPT09ICdkcm9wYWN0aXZhdGUnKSB7XG4gICAgICBjb25zdCBhY3RpdmVEcm9wcyA9IGRyb3BTdGF0ZS5hY3RpdmVEcm9wc1xuICAgICAgY29uc3QgaW5kZXggPSBhcnIuZmluZEluZGV4KGFjdGl2ZURyb3BzLCAoeyBkcm9wem9uZSwgZWxlbWVudCB9KSA9PlxuICAgICAgICBkcm9wem9uZSA9PT0gdGhpcy5kcm9wem9uZSAmJiBlbGVtZW50ID09PSB0aGlzLnRhcmdldClcblxuICAgICAgZHJvcFN0YXRlLmFjdGl2ZURyb3BzID0gW1xuICAgICAgICAuLi5hY3RpdmVEcm9wcy5zbGljZSgwLCBpbmRleCksXG4gICAgICAgIC4uLmFjdGl2ZURyb3BzLnNsaWNlKGluZGV4ICsgMSksXG4gICAgICBdXG5cbiAgICAgIGNvbnN0IGRlYWN0aXZhdGVFdmVudCA9IG5ldyBEcm9wRXZlbnQoZHJvcFN0YXRlLCB0aGlzLmRyYWdFdmVudCwgJ2Ryb3BkZWFjdGl2YXRlJylcblxuICAgICAgZGVhY3RpdmF0ZUV2ZW50LmRyb3B6b25lID0gdGhpcy5kcm9wem9uZVxuICAgICAgZGVhY3RpdmF0ZUV2ZW50LnRhcmdldCA9IHRoaXMudGFyZ2V0XG5cbiAgICAgIHRoaXMuZHJvcHpvbmUuZmlyZShkZWFjdGl2YXRlRXZlbnQpXG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgdGhpcy5kcm9wem9uZS5maXJlKG5ldyBEcm9wRXZlbnQoZHJvcFN0YXRlLCB0aGlzLmRyYWdFdmVudCwgJ2RyYWdsZWF2ZScpKVxuICAgIH1cbiAgfVxuXG4gIHByZXZlbnREZWZhdWx0ICgpIHt9XG5cbiAgc3RvcFByb3BhZ2F0aW9uICgpIHtcbiAgICB0aGlzLnByb3BhZ2F0aW9uU3RvcHBlZCA9IHRydWVcbiAgfVxuXG4gIHN0b3BJbW1lZGlhdGVQcm9wYWdhdGlvbiAoKSB7XG4gICAgdGhpcy5pbW1lZGlhdGVQcm9wYWdhdGlvblN0b3BwZWQgPSB0aGlzLnByb3BhZ2F0aW9uU3RvcHBlZCA9IHRydWVcbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBEcm9wRXZlbnRcbiJdfQ==