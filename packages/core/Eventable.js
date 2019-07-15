import * as arr from '@interactjs/utils/arr';
import extend from '@interactjs/utils/extend';
import normalize from '@interactjs/utils/normalizeListeners';
function fireUntilImmediateStopped(event, listeners) {
    for (const listener of listeners) {
        if (event.immediatePropagationStopped) {
            break;
        }
        listener(event);
    }
}
class Eventable {
    constructor(options) {
        this.types = {};
        this.propagationStopped = false;
        this.immediatePropagationStopped = false;
        this.options = extend({}, options || {});
    }
    fire(event) {
        let listeners;
        const global = this.global;
        // Interactable#on() listeners
        // tslint:disable no-conditional-assignment
        if ((listeners = this.types[event.type])) {
            fireUntilImmediateStopped(event, listeners);
        }
        // interact.on() listeners
        if (!event.propagationStopped && global && (listeners = global[event.type])) {
            fireUntilImmediateStopped(event, listeners);
        }
    }
    on(type, listener) {
        const listeners = normalize(type, listener);
        for (type in listeners) {
            this.types[type] = arr.merge(this.types[type] || [], listeners[type]);
        }
    }
    off(type, listener) {
        const listeners = normalize(type, listener);
        for (type in listeners) {
            const eventList = this.types[type];
            if (!eventList || !eventList.length) {
                continue;
            }
            for (const subListener of listeners[type]) {
                const index = eventList.indexOf(subListener);
                if (index !== -1) {
                    eventList.splice(index, 1);
                }
            }
        }
    }
}
export default Eventable;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiRXZlbnRhYmxlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiRXZlbnRhYmxlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sS0FBSyxHQUFHLE1BQU0sdUJBQXVCLENBQUE7QUFDNUMsT0FBTyxNQUFNLE1BQU0sMEJBQTBCLENBQUE7QUFDN0MsT0FBTyxTQUFrQyxNQUFNLHNDQUFzQyxDQUFBO0FBSXJGLFNBQVMseUJBQXlCLENBRy9CLEtBQTBCLEVBQUUsU0FBOEI7SUFDM0QsS0FBSyxNQUFNLFFBQVEsSUFBSSxTQUFTLEVBQUU7UUFDaEMsSUFBSSxLQUFLLENBQUMsMkJBQTJCLEVBQUU7WUFBRSxNQUFLO1NBQUU7UUFFaEQsUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFBO0tBQ2hCO0FBQ0gsQ0FBQztBQUVELE1BQU0sU0FBUztJQU9iLFlBQWEsT0FBa0M7UUFML0MsVUFBSyxHQUF3QixFQUFFLENBQUE7UUFDL0IsdUJBQWtCLEdBQUcsS0FBSyxDQUFBO1FBQzFCLGdDQUEyQixHQUFHLEtBQUssQ0FBQTtRQUlqQyxJQUFJLENBQUMsT0FBTyxHQUFHLE1BQU0sQ0FBQyxFQUFFLEVBQUUsT0FBTyxJQUFJLEVBQUUsQ0FBQyxDQUFBO0lBQzFDLENBQUM7SUFFRCxJQUFJLENBQUUsS0FBVTtRQUNkLElBQUksU0FBUyxDQUFBO1FBQ2IsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQTtRQUUxQiw4QkFBOEI7UUFDOUIsMkNBQTJDO1FBQzNDLElBQUksQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUMsRUFBRTtZQUN4Qyx5QkFBeUIsQ0FBQyxLQUFLLEVBQUUsU0FBUyxDQUFDLENBQUE7U0FDNUM7UUFFRCwwQkFBMEI7UUFDMUIsSUFBSSxDQUFDLEtBQUssQ0FBQyxrQkFBa0IsSUFBSSxNQUFNLElBQUksQ0FBQyxTQUFTLEdBQUcsTUFBTSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQyxFQUFHO1lBQzVFLHlCQUF5QixDQUFDLEtBQUssRUFBRSxTQUFTLENBQUMsQ0FBQTtTQUM1QztJQUNILENBQUM7SUFFRCxFQUFFLENBQUUsSUFBWSxFQUFFLFFBQStCO1FBQy9DLE1BQU0sU0FBUyxHQUFHLFNBQVMsQ0FBQyxJQUFJLEVBQUUsUUFBUSxDQUFDLENBQUE7UUFFM0MsS0FBSyxJQUFJLElBQUksU0FBUyxFQUFFO1lBQ3RCLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLEdBQUcsR0FBRyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsRUFBRSxTQUFTLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQTtTQUN0RTtJQUNILENBQUM7SUFFRCxHQUFHLENBQUUsSUFBWSxFQUFFLFFBQStCO1FBQ2hELE1BQU0sU0FBUyxHQUFHLFNBQVMsQ0FBQyxJQUFJLEVBQUUsUUFBUSxDQUFDLENBQUE7UUFFM0MsS0FBSyxJQUFJLElBQUksU0FBUyxFQUFFO1lBQ3RCLE1BQU0sU0FBUyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUE7WUFFbEMsSUFBSSxDQUFDLFNBQVMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLEVBQUU7Z0JBQUUsU0FBUTthQUFFO1lBRWpELEtBQUssTUFBTSxXQUFXLElBQUksU0FBUyxDQUFDLElBQUksQ0FBQyxFQUFFO2dCQUN6QyxNQUFNLEtBQUssR0FBRyxTQUFTLENBQUMsT0FBTyxDQUFDLFdBQVcsQ0FBQyxDQUFBO2dCQUU1QyxJQUFJLEtBQUssS0FBSyxDQUFDLENBQUMsRUFBRTtvQkFDaEIsU0FBUyxDQUFDLE1BQU0sQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDLENBQUE7aUJBQzNCO2FBQ0Y7U0FDRjtJQUNILENBQUM7Q0FDRjtBQUVELGVBQWUsU0FBUyxDQUFBIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgYXJyIGZyb20gJ0BpbnRlcmFjdGpzL3V0aWxzL2FycidcbmltcG9ydCBleHRlbmQgZnJvbSAnQGludGVyYWN0anMvdXRpbHMvZXh0ZW5kJ1xuaW1wb3J0IG5vcm1hbGl6ZSwgeyBOb3JtYWxpemVkTGlzdGVuZXJzIH0gZnJvbSAnQGludGVyYWN0anMvdXRpbHMvbm9ybWFsaXplTGlzdGVuZXJzJ1xuaW1wb3J0IHsgRXZlbnRQaGFzZSwgSW50ZXJhY3RFdmVudCB9IGZyb20gJy4vSW50ZXJhY3RFdmVudCdcbmltcG9ydCB7IEFjdGlvbk5hbWUgfSBmcm9tICcuL3Njb3BlJ1xuXG5mdW5jdGlvbiBmaXJlVW50aWxJbW1lZGlhdGVTdG9wcGVkPFxuICBUIGV4dGVuZHMgQWN0aW9uTmFtZSxcbiAgUCBleHRlbmRzIEV2ZW50UGhhc2UsXG4+IChldmVudDogSW50ZXJhY3RFdmVudDxULCBQPiwgbGlzdGVuZXJzOiBJbnRlcmFjdC5MaXN0ZW5lcltdKSB7XG4gIGZvciAoY29uc3QgbGlzdGVuZXIgb2YgbGlzdGVuZXJzKSB7XG4gICAgaWYgKGV2ZW50LmltbWVkaWF0ZVByb3BhZ2F0aW9uU3RvcHBlZCkgeyBicmVhayB9XG5cbiAgICBsaXN0ZW5lcihldmVudClcbiAgfVxufVxuXG5jbGFzcyBFdmVudGFibGUge1xuICBvcHRpb25zOiBhbnlcbiAgdHlwZXM6IE5vcm1hbGl6ZWRMaXN0ZW5lcnMgPSB7fVxuICBwcm9wYWdhdGlvblN0b3BwZWQgPSBmYWxzZVxuICBpbW1lZGlhdGVQcm9wYWdhdGlvblN0b3BwZWQgPSBmYWxzZVxuICBnbG9iYWw6IGFueVxuXG4gIGNvbnN0cnVjdG9yIChvcHRpb25zPzogeyBbaW5kZXg6IHN0cmluZ106IGFueSB9KSB7XG4gICAgdGhpcy5vcHRpb25zID0gZXh0ZW5kKHt9LCBvcHRpb25zIHx8IHt9KVxuICB9XG5cbiAgZmlyZSAoZXZlbnQ6IGFueSkge1xuICAgIGxldCBsaXN0ZW5lcnNcbiAgICBjb25zdCBnbG9iYWwgPSB0aGlzLmdsb2JhbFxuXG4gICAgLy8gSW50ZXJhY3RhYmxlI29uKCkgbGlzdGVuZXJzXG4gICAgLy8gdHNsaW50OmRpc2FibGUgbm8tY29uZGl0aW9uYWwtYXNzaWdubWVudFxuICAgIGlmICgobGlzdGVuZXJzID0gdGhpcy50eXBlc1tldmVudC50eXBlXSkpIHtcbiAgICAgIGZpcmVVbnRpbEltbWVkaWF0ZVN0b3BwZWQoZXZlbnQsIGxpc3RlbmVycylcbiAgICB9XG5cbiAgICAvLyBpbnRlcmFjdC5vbigpIGxpc3RlbmVyc1xuICAgIGlmICghZXZlbnQucHJvcGFnYXRpb25TdG9wcGVkICYmIGdsb2JhbCAmJiAobGlzdGVuZXJzID0gZ2xvYmFsW2V2ZW50LnR5cGVdKSkgIHtcbiAgICAgIGZpcmVVbnRpbEltbWVkaWF0ZVN0b3BwZWQoZXZlbnQsIGxpc3RlbmVycylcbiAgICB9XG4gIH1cblxuICBvbiAodHlwZTogc3RyaW5nLCBsaXN0ZW5lcjogSW50ZXJhY3QuTGlzdGVuZXJzQXJnKSB7XG4gICAgY29uc3QgbGlzdGVuZXJzID0gbm9ybWFsaXplKHR5cGUsIGxpc3RlbmVyKVxuXG4gICAgZm9yICh0eXBlIGluIGxpc3RlbmVycykge1xuICAgICAgdGhpcy50eXBlc1t0eXBlXSA9IGFyci5tZXJnZSh0aGlzLnR5cGVzW3R5cGVdIHx8IFtdLCBsaXN0ZW5lcnNbdHlwZV0pXG4gICAgfVxuICB9XG5cbiAgb2ZmICh0eXBlOiBzdHJpbmcsIGxpc3RlbmVyOiBJbnRlcmFjdC5MaXN0ZW5lcnNBcmcpIHtcbiAgICBjb25zdCBsaXN0ZW5lcnMgPSBub3JtYWxpemUodHlwZSwgbGlzdGVuZXIpXG5cbiAgICBmb3IgKHR5cGUgaW4gbGlzdGVuZXJzKSB7XG4gICAgICBjb25zdCBldmVudExpc3QgPSB0aGlzLnR5cGVzW3R5cGVdXG5cbiAgICAgIGlmICghZXZlbnRMaXN0IHx8ICFldmVudExpc3QubGVuZ3RoKSB7IGNvbnRpbnVlIH1cblxuICAgICAgZm9yIChjb25zdCBzdWJMaXN0ZW5lciBvZiBsaXN0ZW5lcnNbdHlwZV0pIHtcbiAgICAgICAgY29uc3QgaW5kZXggPSBldmVudExpc3QuaW5kZXhPZihzdWJMaXN0ZW5lcilcblxuICAgICAgICBpZiAoaW5kZXggIT09IC0xKSB7XG4gICAgICAgICAgZXZlbnRMaXN0LnNwbGljZShpbmRleCwgMSlcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBFdmVudGFibGVcbiJdfQ==