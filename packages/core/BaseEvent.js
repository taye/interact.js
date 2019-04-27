export var EventPhase;
(function (EventPhase) {
    EventPhase["Start"] = "start";
    EventPhase["Move"] = "move";
    EventPhase["End"] = "end";
    EventPhase["_NONE"] = "";
})(EventPhase || (EventPhase = {}));
export class BaseEvent {
    constructor(interaction) {
        this.immediatePropagationStopped = false;
        this.propagationStopped = false;
        this._interaction = interaction;
    }
    get interaction() {
        return this._interaction._proxy;
    }
    preventDefault() { }
    /**
     * Don't call any other listeners (even on the current target)
     */
    stopPropagation() {
        this.propagationStopped = true;
    }
    /**
     * Don't call listeners on the remaining targets
     */
    stopImmediatePropagation() {
        this.immediatePropagationStopped = this.propagationStopped = true;
    }
}
export default BaseEvent;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQmFzZUV2ZW50LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiQmFzZUV2ZW50LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUlBLE1BQU0sQ0FBTixJQUFZLFVBS1g7QUFMRCxXQUFZLFVBQVU7SUFDcEIsNkJBQWUsQ0FBQTtJQUNmLDJCQUFhLENBQUE7SUFDYix5QkFBVyxDQUFBO0lBQ1gsd0JBQVUsQ0FBQTtBQUNaLENBQUMsRUFMVyxVQUFVLEtBQVYsVUFBVSxRQUtyQjtBQUVELE1BQU0sT0FBTyxTQUFTO0lBY3BCLFlBQWEsV0FBVztRQVB4QixnQ0FBMkIsR0FBRyxLQUFLLENBQUE7UUFDbkMsdUJBQWtCLEdBQUcsS0FBSyxDQUFBO1FBT3hCLElBQUksQ0FBQyxZQUFZLEdBQUcsV0FBVyxDQUFBO0lBQ2pDLENBQUM7SUFORCxJQUFJLFdBQVc7UUFDYixPQUFPLElBQUksQ0FBQyxZQUFZLENBQUMsTUFBTSxDQUFBO0lBQ2pDLENBQUM7SUFNRCxjQUFjLEtBQUssQ0FBQztJQUVwQjs7T0FFRztJQUNILGVBQWU7UUFDYixJQUFJLENBQUMsa0JBQWtCLEdBQUcsSUFBSSxDQUFBO0lBQ2hDLENBQUM7SUFFRDs7T0FFRztJQUNILHdCQUF3QjtRQUN0QixJQUFJLENBQUMsMkJBQTJCLEdBQUcsSUFBSSxDQUFDLGtCQUFrQixHQUFHLElBQUksQ0FBQTtJQUNuRSxDQUFDO0NBQ0Y7QUFFRCxlQUFlLFNBQVMsQ0FBQSIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBJbnRlcmFjdGFibGUgZnJvbSAnLi9JbnRlcmFjdGFibGUnXG5pbXBvcnQgSW50ZXJhY3Rpb24gZnJvbSAnLi9JbnRlcmFjdGlvbidcbmltcG9ydCB7IEFjdGlvbk5hbWUgfSBmcm9tICcuL3Njb3BlJ1xuXG5leHBvcnQgZW51bSBFdmVudFBoYXNlIHtcbiAgU3RhcnQgPSAnc3RhcnQnLFxuICBNb3ZlID0gJ21vdmUnLFxuICBFbmQgPSAnZW5kJyxcbiAgX05PTkUgPSAnJyxcbn1cblxuZXhwb3J0IGNsYXNzIEJhc2VFdmVudDxUIGV4dGVuZHMgQWN0aW9uTmFtZSA9IGFueT4ge1xuICB0eXBlOiBzdHJpbmdcbiAgdGFyZ2V0OiBFdmVudFRhcmdldFxuICBjdXJyZW50VGFyZ2V0OiBFdmVudFRhcmdldFxuICBpbnRlcmFjdGFibGU6IEludGVyYWN0YWJsZVxuICBfaW50ZXJhY3Rpb246IEludGVyYWN0aW9uPFQ+XG4gIHRpbWVTdGFtcDogYW55XG4gIGltbWVkaWF0ZVByb3BhZ2F0aW9uU3RvcHBlZCA9IGZhbHNlXG4gIHByb3BhZ2F0aW9uU3RvcHBlZCA9IGZhbHNlXG5cbiAgZ2V0IGludGVyYWN0aW9uICgpIHtcbiAgICByZXR1cm4gdGhpcy5faW50ZXJhY3Rpb24uX3Byb3h5XG4gIH1cblxuICBjb25zdHJ1Y3RvciAoaW50ZXJhY3Rpb24pIHtcbiAgICB0aGlzLl9pbnRlcmFjdGlvbiA9IGludGVyYWN0aW9uXG4gIH1cblxuICBwcmV2ZW50RGVmYXVsdCAoKSB7fVxuXG4gIC8qKlxuICAgKiBEb24ndCBjYWxsIGFueSBvdGhlciBsaXN0ZW5lcnMgKGV2ZW4gb24gdGhlIGN1cnJlbnQgdGFyZ2V0KVxuICAgKi9cbiAgc3RvcFByb3BhZ2F0aW9uICgpIHtcbiAgICB0aGlzLnByb3BhZ2F0aW9uU3RvcHBlZCA9IHRydWVcbiAgfVxuXG4gIC8qKlxuICAgKiBEb24ndCBjYWxsIGxpc3RlbmVycyBvbiB0aGUgcmVtYWluaW5nIHRhcmdldHNcbiAgICovXG4gIHN0b3BJbW1lZGlhdGVQcm9wYWdhdGlvbiAoKSB7XG4gICAgdGhpcy5pbW1lZGlhdGVQcm9wYWdhdGlvblN0b3BwZWQgPSB0aGlzLnByb3BhZ2F0aW9uU3RvcHBlZCA9IHRydWVcbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBCYXNlRXZlbnRcbiJdfQ==