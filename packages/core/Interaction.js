import * as utils from '@interactjs/utils';
import InteractEvent from './InteractEvent';
import PointerInfo from './PointerInfo';
export class Interaction {
    /** */
    constructor({ pointerType, signals }) {
        // current interactable being interacted with
        this.target = null;
        // the target element of the interactable
        this.element = null;
        // action that's ready to be fired on next move event
        this.prepared = {
            name: null,
            axis: null,
            edges: null,
        };
        // keep track of added pointers
        this.pointers = [];
        // pointerdown/mousedown/touchstart event
        this.downEvent = null;
        this.downPointer = {};
        this._latestPointer = {
            pointer: null,
            event: null,
            eventTarget: null,
        };
        // previous action event
        this.prevEvent = null;
        this.pointerIsDown = false;
        this.pointerWasMoved = false;
        this._interacting = false;
        this._ending = false;
        this.simulation = null;
        /**
         * @alias Interaction.prototype.move
         */
        this.doMove = utils.warnOnce(function (signalArg) {
            this.move(signalArg);
        }, 'The interaction.doMove() method has been renamed to interaction.move()');
        this.coords = {
            // Starting InteractEvent pointer coordinates
            start: utils.pointer.newCoords(),
            // Previous native pointer move event coordinates
            prev: utils.pointer.newCoords(),
            // current native pointer move event coordinates
            cur: utils.pointer.newCoords(),
            // Change in coordinates and time of the pointer
            delta: utils.pointer.newCoords(),
            // pointer velocity
            velocity: utils.pointer.newCoords(),
        };
        this._signals = signals;
        this.pointerType = pointerType;
        this._signals.fire('new', this);
    }
    get pointerMoveTolerance() {
        return 1;
    }
    pointerDown(pointer, event, eventTarget) {
        const pointerIndex = this.updatePointer(pointer, event, eventTarget, true);
        this._signals.fire('down', {
            pointer,
            event,
            eventTarget,
            pointerIndex,
            interaction: this,
        });
    }
    /**
     * ```js
     * interact(target)
     *   .draggable({
     *     // disable the default drag start by down->move
     *     manualStart: true
     *   })
     *   // start dragging after the user holds the pointer down
     *   .on('hold', function (event) {
     *     var interaction = event.interaction;
     *
     *     if (!interaction.interacting()) {
     *       interaction.start({ name: 'drag' },
     *                         event.interactable,
     *                         event.currentTarget);
     *     }
     * });
     * ```
     *
     * Start an action with the given Interactable and Element as tartgets. The
     * action must be enabled for the target Interactable and an appropriate
     * number of pointers must be held down - 1 for drag/resize, 2 for gesture.
     *
     * Use it with `interactable.<action>able({ manualStart: false })` to always
     * [start actions manually](https://github.com/taye/interact.js/issues/114)
     *
     * @param {object} action   The action to be performed - drag, resize, etc.
     * @param {Interactable} target  The Interactable to target
     * @param {Element} element The DOM Element to target
     * @return {object} interact
     */
    start(action, target, element) {
        if (this.interacting() ||
            !this.pointerIsDown ||
            this.pointers.length < (action.name === 'gesture' ? 2 : 1)) {
            return;
        }
        utils.copyAction(this.prepared, action);
        this.target = target;
        this.element = element;
        this._interacting = this._doPhase({
            interaction: this,
            event: this.downEvent,
            phase: 'start',
        });
    }
    pointerMove(pointer, event, eventTarget) {
        if (!this.simulation) {
            this.updatePointer(pointer, event, eventTarget, false);
            utils.pointer.setCoords(this.coords.cur, this.pointers.map((p) => p.pointer));
        }
        const duplicateMove = (this.coords.cur.page.x === this.coords.prev.page.x &&
            this.coords.cur.page.y === this.coords.prev.page.y &&
            this.coords.cur.client.x === this.coords.prev.client.x &&
            this.coords.cur.client.y === this.coords.prev.client.y);
        let dx;
        let dy;
        // register movement greater than pointerMoveTolerance
        if (this.pointerIsDown && !this.pointerWasMoved) {
            dx = this.coords.cur.client.x - this.coords.start.client.x;
            dy = this.coords.cur.client.y - this.coords.start.client.y;
            this.pointerWasMoved = utils.hypot(dx, dy) > this.pointerMoveTolerance;
        }
        const signalArg = {
            pointer,
            pointerIndex: this.getPointerIndex(pointer),
            event,
            eventTarget,
            dx,
            dy,
            duplicate: duplicateMove,
            interaction: this,
        };
        if (!duplicateMove) {
            // set pointer coordinate, time changes and velocity
            utils.pointer.setCoordDeltas(this.coords.delta, this.coords.prev, this.coords.cur);
            utils.pointer.setCoordVelocity(this.coords.velocity, this.coords.delta);
        }
        this._signals.fire('move', signalArg);
        if (!duplicateMove) {
            // if interacting, fire an 'action-move' signal etc
            if (this.interacting()) {
                this.move(signalArg);
            }
            if (this.pointerWasMoved) {
                utils.pointer.copyCoords(this.coords.prev, this.coords.cur);
            }
        }
    }
    /**
     * ```js
     * interact(target)
     *   .draggable(true)
     *   .on('dragmove', function (event) {
     *     if (someCondition) {
     *       // change the snap settings
     *       event.interactable.draggable({ snap: { targets: [] }});
     *       // fire another move event with re-calculated snap
     *       event.interaction.move();
     *     }
     *   });
     * ```
     *
     * Force a move of the current action at the same coordinates. Useful if
     * snap/restrict has been changed and you want a movement with the new
     * settings.
     */
    move(signalArg) {
        signalArg = utils.extend({
            pointer: this._latestPointer.pointer,
            event: this._latestPointer.event,
            eventTarget: this._latestPointer.eventTarget,
            interaction: this,
            noBefore: false,
        }, signalArg || {});
        signalArg.phase = 'move';
        this._doPhase(signalArg);
    }
    // End interact move events and stop auto-scroll unless simulation is running
    pointerUp(pointer, event, eventTarget, curEventTarget) {
        let pointerIndex = this.getPointerIndex(pointer);
        if (pointerIndex === -1) {
            pointerIndex = this.updatePointer(pointer, event, eventTarget, false);
        }
        this._signals.fire(/cancel$/i.test(event.type) ? 'cancel' : 'up', {
            pointer,
            pointerIndex,
            event,
            eventTarget,
            curEventTarget,
            interaction: this,
        });
        if (!this.simulation) {
            this.end(event);
        }
        this.pointerIsDown = false;
        this.removePointer(pointer, event);
    }
    documentBlur(event) {
        this.end(event);
        this._signals.fire('blur', { event, interaction: this });
    }
    /**
     * ```js
     * interact(target)
     *   .draggable(true)
     *   .on('move', function (event) {
     *     if (event.pageX > 1000) {
     *       // end the current action
     *       event.interaction.end();
     *       // stop all further listeners from being called
     *       event.stopImmediatePropagation();
     *     }
     *   });
     * ```
     *
     * @param {PointerEvent} [event]
     */
    end(event) {
        this._ending = true;
        event = event || this._latestPointer.event;
        let endPhaseResult;
        if (this.interacting()) {
            endPhaseResult = this._doPhase({
                event,
                interaction: this,
                phase: 'end',
            });
        }
        this._ending = false;
        if (endPhaseResult === true) {
            this.stop();
        }
    }
    currentAction() {
        return this._interacting ? this.prepared.name : null;
    }
    interacting() {
        return this._interacting;
    }
    /** */
    stop() {
        this._signals.fire('stop', { interaction: this });
        this.target = this.element = null;
        this._interacting = false;
        this.prepared.name = this.prevEvent = null;
    }
    getPointerIndex(pointer) {
        const pointerId = utils.pointer.getPointerId(pointer);
        // mouse and pen interactions may have only one pointer
        return (this.pointerType === 'mouse' || this.pointerType === 'pen')
            ? this.pointers.length - 1
            : utils.arr.findIndex(this.pointers, (curPointer) => curPointer.id === pointerId);
    }
    getPointerInfo(pointer) {
        return this.pointers[this.getPointerIndex(pointer)];
    }
    updatePointer(pointer, event, eventTarget, down) {
        const id = utils.pointer.getPointerId(pointer);
        let pointerIndex = this.getPointerIndex(pointer);
        let pointerInfo = this.pointers[pointerIndex];
        down = down === false
            ? false
            : down || /(down|start)$/i.test(event.type);
        if (!pointerInfo) {
            pointerInfo = new PointerInfo(id, pointer, event, null, null);
            pointerIndex = this.pointers.length;
            this.pointers.push(pointerInfo);
        }
        else {
            pointerInfo.pointer = pointer;
        }
        if (down) {
            this.pointerIsDown = true;
            if (!this.interacting()) {
                utils.pointer.setCoords(this.coords.start, this.pointers.map((p) => p.pointer));
                utils.pointer.copyCoords(this.coords.cur, this.coords.start);
                utils.pointer.copyCoords(this.coords.prev, this.coords.start);
                utils.pointer.pointerExtend(this.downPointer, pointer);
                this.downEvent = event;
                pointerInfo.downTime = this.coords.cur.timeStamp;
                pointerInfo.downTarget = eventTarget;
                this.pointerWasMoved = false;
            }
        }
        this._updateLatestPointer(pointer, event, eventTarget);
        this._signals.fire('update-pointer', {
            pointer,
            event,
            eventTarget,
            down,
            pointerInfo,
            pointerIndex,
            interaction: this,
        });
        return pointerIndex;
    }
    removePointer(pointer, event) {
        const pointerIndex = this.getPointerIndex(pointer);
        if (pointerIndex === -1) {
            return;
        }
        const pointerInfo = this.pointers[pointerIndex];
        this._signals.fire('remove-pointer', {
            pointer,
            event,
            pointerIndex,
            pointerInfo,
            interaction: this,
        });
        this.pointers.splice(pointerIndex, 1);
    }
    _updateLatestPointer(pointer, event, eventTarget) {
        this._latestPointer.pointer = pointer;
        this._latestPointer.event = event;
        this._latestPointer.eventTarget = eventTarget;
    }
    _createPreparedEvent(event, phase, preEnd, type) {
        const actionName = this.prepared.name;
        return new InteractEvent(this, event, actionName, phase, this.element, null, preEnd, type);
    }
    _fireEvent(iEvent) {
        this.target.fire(iEvent);
        if (!this.prevEvent || iEvent.timeStamp >= this.prevEvent.timeStamp) {
            this.prevEvent = iEvent;
        }
    }
    _doPhase(signalArg) {
        const { event, phase, preEnd, type } = signalArg;
        if (!signalArg.noBefore) {
            const beforeResult = this._signals.fire(`before-action-${phase}`, signalArg);
            if (beforeResult === false) {
                return false;
            }
        }
        const iEvent = signalArg.iEvent = this._createPreparedEvent(event, phase, preEnd, type);
        this._signals.fire(`action-${phase}`, signalArg);
        this._fireEvent(iEvent);
        this._signals.fire(`after-action-${phase}`, signalArg);
        return true;
    }
}
export default Interaction;
export { PointerInfo };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiSW50ZXJhY3Rpb24uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJJbnRlcmFjdGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEtBQUssS0FBSyxNQUFNLG1CQUFtQixDQUFBO0FBRTFDLE9BQU8sYUFBNkIsTUFBTSxpQkFBaUIsQ0FBQTtBQUMzRCxPQUFPLFdBQVcsTUFBTSxlQUFlLENBQUE7QUFTdkMsTUFBTSxPQUFPLFdBQVc7SUF3RXRCLE1BQU07SUFDTixZQUFhLEVBQUUsV0FBVyxFQUFFLE9BQU8sRUFBbUQ7UUF4RXRGLDZDQUE2QztRQUM3QyxXQUFNLEdBQWlCLElBQUksQ0FBQTtRQUUzQix5Q0FBeUM7UUFDekMsWUFBTyxHQUFZLElBQUksQ0FBQTtRQUl2QixxREFBcUQ7UUFDckQsYUFBUSxHQUFXO1lBQ2pCLElBQUksRUFBRyxJQUFJO1lBQ1gsSUFBSSxFQUFHLElBQUk7WUFDWCxLQUFLLEVBQUUsSUFBSTtTQUNaLENBQUE7UUFJRCwrQkFBK0I7UUFDL0IsYUFBUSxHQUFrQixFQUFFLENBQUE7UUFFNUIseUNBQXlDO1FBQ3pDLGNBQVMsR0FBOEIsSUFBSSxDQUFBO1FBRTNDLGdCQUFXLEdBQXlCLEVBQTBCLENBQUE7UUFFOUQsbUJBQWMsR0FJVjtZQUNGLE9BQU8sRUFBRSxJQUFJO1lBQ2IsS0FBSyxFQUFFLElBQUk7WUFDWCxXQUFXLEVBQUUsSUFBSTtTQUNsQixDQUFBO1FBRUQsd0JBQXdCO1FBQ3hCLGNBQVMsR0FBa0IsSUFBSSxDQUFBO1FBRS9CLGtCQUFhLEdBQUcsS0FBSyxDQUFBO1FBQ3JCLG9CQUFlLEdBQUcsS0FBSyxDQUFBO1FBQ3ZCLGlCQUFZLEdBQUcsS0FBSyxDQUFBO1FBQ3BCLFlBQU8sR0FBRyxLQUFLLENBQUE7UUFFZixlQUFVLEdBQUcsSUFBSSxDQUFBO1FBTWpCOztXQUVHO1FBQ0gsV0FBTSxHQUFHLEtBQUssQ0FBQyxRQUFRLENBQ3JCLFVBQTZCLFNBQWM7WUFDekMsSUFBSSxDQUFDLElB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RjtBQUVELGVBQWUsV0FBVyxDQUFBO0FBQzFCLE9BQU8sRUFBRSxXQUFXLEVBQUUsQ0FBQSIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIHV0aWxzIGZyb20gJ0BpbnRlcmFjdGpzL3V0aWxzJ1xuaW1wb3J0IEludGVyYWN0YWJsZSBmcm9tICcuL0ludGVyYWN0YWJsZSdcbmltcG9ydCBJbnRlcmFjdEV2ZW50LCB7IEV2ZW50UGhhc2UgfSBmcm9tICcuL0ludGVyYWN0RXZlbnQnXG5pbXBvcnQgUG9pbnRlckluZm8gZnJvbSAnLi9Qb2ludGVySW5mbydcbmltcG9ydCB7IEFjdGlvbk5hbWUgfSBmcm9tICcuL3Njb3BlJ1xuXG5leHBvcnQgaW50ZXJmYWNlIEFjdGlvbiB7XG4gIG5hbWU6IEFjdGlvbk5hbWVcbiAgYXhpcz86ICd4JyB8ICd5JyB8ICd4eSdcbiAgZWRnZXM/OiBQYXJ0aWFsPEludGVyYWN0LlJlY3Q+XG59XG5cbmV4cG9ydCBjbGFzcyBJbnRlcmFjdGlvbiB7XG4gIC8vIGN1cnJlbnQgaW50ZXJhY3RhYmxlIGJlaW5nIGludGVyYWN0ZWQgd2l0aFxuICB0YXJnZXQ6IEludGVyYWN0YWJsZSA9IG51bGxcblxuICAvLyB0aGUgdGFyZ2V0IGVsZW1lbnQgb2YgdGhlIGludGVyYWN0YWJsZVxuICBlbGVtZW50OiBFbGVtZW50ID0gbnVsbFxuXG4gIF9zaWduYWxzOiB1dGlscy5TaWduYWxzXG5cbiAgLy8gYWN0aW9uIHRoYXQncyByZWFkeSB0byBiZSBmaXJlZCBvbiBuZXh0IG1vdmUgZXZlbnRcbiAgcHJlcGFyZWQ6IEFjdGlvbiA9IHtcbiAgICBuYW1lIDogbnVsbCxcbiAgICBheGlzIDogbnVsbCxcbiAgICBlZGdlczogbnVsbCxcbiAgfVxuXG4gIHBvaW50ZXJUeXBlOiBzdHJpbmdcblxuICAvLyBrZWVwIHRyYWNrIG9mIGFkZGVkIHBvaW50ZXJzXG4gIHBvaW50ZXJzOiBQb2ludGVySW5mb1tdID0gW11cblxuICAvLyBwb2ludGVyZG93bi9tb3VzZWRvd24vdG91Y2hzdGFydCBldmVudFxuICBkb3duRXZlbnQ6IEludGVyYWN0LlBvaW50ZXJFdmVudFR5cGUgPSBudWxsXG5cbiAgZG93blBvaW50ZXI6IEludGVyYWN0LlBvaW50ZXJUeXBlID0ge30gYXMgSW50ZXJhY3QuUG9pbnRlclR5cGVcblxuICBfbGF0ZXN0UG9pbnRlcjoge1xuICAgIHBvaW50ZXI6IEV2ZW50VGFyZ2V0XG4gICAgZXZlbnQ6IEludGVyYWN0LlBvaW50ZXJFdmVudFR5cGVcbiAgICBldmVudFRhcmdldDogTm9kZSxcbiAgfSA9IHtcbiAgICBwb2ludGVyOiBudWxsLFxuICAgIGV2ZW50OiBudWxsLFxuICAgIGV2ZW50VGFyZ2V0OiBudWxsLFxuICB9XG5cbiAgLy8gcHJldmlvdXMgYWN0aW9uIGV2ZW50XG4gIHByZXZFdmVudDogSW50ZXJhY3RFdmVudCA9IG51bGxcblxuICBwb2ludGVySXNEb3duID0gZmFsc2VcbiAgcG9pbnRlcldhc01vdmVkID0gZmFsc2VcbiAgX2ludGVyYWN0aW5nID0gZmFsc2VcbiAgX2VuZGluZyA9IGZhbHNlXG5cbiAgc2ltdWxhdGlvbiA9IG51bGxcblxuICBnZXQgcG9pbnRlck1vdmVUb2xlcmFuY2UgKCkge1xuICAgIHJldHVybiAxXG4gIH1cblxuICAvKipcbiAgICogQGFsaWFzIEludGVyYWN0aW9uLnByb3RvdHlwZS5tb3ZlXG4gICAqL1xuICBkb01vdmUgPSB1dGlscy53YXJuT25jZShcbiAgICBmdW5jdGlvbiAodGhpczogSW50ZXJhY3Rpb24sIHNpZ25hbEFyZzogYW55KSB7XG4gICAgICB0aGlzLm1vdmUoc2lnbmFsQXJnKVxuICAgIH0sXG4gICAgJ1RoZSBpbnRlcmFjdGlvbi5kb01vdmUoKSBtZXRob2QgaGFzIGJlZW4gcmVuYW1lZCB0byBpbnRlcmFjdGlvbi5tb3ZlKCknKVxuXG4gIGNvb3JkcyA9IHtcbiAgICAvLyBTdGFydGluZyBJbnRlcmFjdEV2ZW50IHBvaW50ZXIgY29vcmRpbmF0ZXNcbiAgICBzdGFydDogdXRpbHMucG9pbnRlci5uZXdDb29yZHMoKSxcbiAgICAvLyBQcmV2aW91cyBuYXRpdmUgcG9pbnRlciBtb3ZlIGV2ZW50IGNvb3JkaW5hdGVzXG4gICAgcHJldjogdXRpbHMucG9pbnRlci5uZXdDb29yZHMoKSxcbiAgICAvLyBjdXJyZW50IG5hdGl2ZSBwb2ludGVyIG1vdmUgZXZlbnQgY29vcmRpbmF0ZXNcbiAgICBjdXI6IHV0aWxzLnBvaW50ZXIubmV3Q29vcmRzKCksXG4gICAgLy8gQ2hhbmdlIGluIGNvb3JkaW5hdGVzIGFuZCB0aW1lIG9mIHRoZSBwb2ludGVyXG4gICAgZGVsdGE6IHV0aWxzLnBvaW50ZXIubmV3Q29vcmRzKCksXG4gICAgLy8gcG9pbnRlciB2ZWxvY2l0eVxuICAgIHZlbG9jaXR5OiB1dGlscy5wb2ludGVyLm5ld0Nvb3JkcygpLFxuICB9XG5cbiAgLyoqICovXG4gIGNvbnN0cnVjdG9yICh7IHBvaW50ZXJUeXBlLCBzaWduYWxzIH06IHsgcG9pbnRlclR5cGU6IHN0cmluZywgc2lnbmFsczogdXRpbHMuU2lnbmFscyB9KSB7XG4gICAgdGhpcy5fc2lnbmFscyA9IHNpZ25hbHNcbiAgICB0aGlzLnBvaW50ZXJUeXBlID0gcG9pbnRlclR5cGVcblxuICAgIHRoaXMuX3NpZ25hbHMuZmlyZSgnbmV3JywgdGhpcylcbiAgfVxuXG4gIHBvaW50ZXJEb3duIChwb2ludGVyLCBldmVudCwgZXZlbnRUYXJnZXQpIHtcbiAgICBjb25zdCBwb2ludGVySW5kZXggPSB0aGlzLnVwZGF0ZVBvaW50ZXIocG9pbnRlciwgZXZlbnQsIGV2ZW50VGFyZ2V0LCB0cnVlKVxuXG4gICAgdGhpcy5fc2lnbmFscy5maXJlKCdkb3duJywge1xuICAgICAgcG9pbnRlcixcbiAgICAgIGV2ZW50LFxuICAgICAgZXZlbnRUYXJnZXQsXG4gICAgICBwb2ludGVySW5kZXgsXG4gICAgICBpbnRlcmFjdGlvbjogdGhpcyxcbiAgICB9KVxuICB9XG5cbiAgLyoqXG4gICAqIGBgYGpzXG4gICAqIGludGVyYWN0KHRhcmdldClcbiAgICogICAuZHJhZ2dhYmxlKHtcbiAgICogICAgIC8vIGRpc2FibGUgdGhlIGRlZmF1bHQgZHJhZyBzdGFydCBieSBkb3duLT5tb3ZlXG4gICAqICAgICBtYW51YWxTdGFydDogdHJ1ZVxuICAgKiAgIH0pXG4gICAqICAgLy8gc3RhcnQgZHJhZ2dpbmcgYWZ0ZXIgdGhlIHVzZXIgaG9sZHMgdGhlIHBvaW50ZXIgZG93blxuICAgKiAgIC5vbignaG9sZCcsIGZ1bmN0aW9uIChldmVudCkge1xuICAgKiAgICAgdmFyIGludGVyYWN0aW9uID0gZXZlbnQuaW50ZXJhY3Rpb247XG4gICAqXG4gICAqICAgICBpZiAoIWludGVyYWN0aW9uLmludGVyYWN0aW5nKCkpIHtcbiAgICogICAgICAgaW50ZXJhY3Rpb24uc3RhcnQoeyBuYW1lOiAnZHJhZycgfSxcbiAgICogICAgICAgICAgICAgICAgICAgICAgICAgZXZlbnQuaW50ZXJhY3RhYmxlLFxuICAgKiAgICAgICAgICAgICAgICAgICAgICAgICBldmVudC5jdXJyZW50VGFyZ2V0KTtcbiAgICogICAgIH1cbiAgICogfSk7XG4gICAqIGBgYFxuICAgKlxuICAgKiBTdGFydCBhbiBhY3Rpb24gd2l0aCB0aGUgZ2l2ZW4gSW50ZXJhY3RhYmxlIGFuZCBFbGVtZW50IGFzIHRhcnRnZXRzLiBUaGVcbiAgICogYWN0aW9uIG11c3QgYmUgZW5hYmxlZCBmb3IgdGhlIHRhcmdldCBJbnRlcmFjdGFibGUgYW5kIGFuIGFwcHJvcHJpYXRlXG4gICAqIG51bWJlciBvZiBwb2ludGVycyBtdXN0IGJlIGhlbGQgZG93biAtIDEgZm9yIGRyYWcvcmVzaXplLCAyIGZvciBnZXN0dXJlLlxuICAgKlxuICAgKiBVc2UgaXQgd2l0aCBgaW50ZXJhY3RhYmxlLjxhY3Rpb24+YWJsZSh7IG1hbnVhbFN0YXJ0OiBmYWxzZSB9KWAgdG8gYWx3YXlzXG4gICAqIFtzdGFydCBhY3Rpb25zIG1hbnVhbGx5XShodHRwczovL2dpdGh1Yi5jb20vdGF5ZS9pbnRlcmFjdC5qcy9pc3N1ZXMvMTE0KVxuICAgKlxuICAgKiBAcGFyYW0ge29iamVjdH0gYWN0aW9uICAgVGhlIGFjdGlvbiB0byBiZSBwZXJmb3JtZWQgLSBkcmFnLCByZXNpemUsIGV0Yy5cbiAgICogQHBhcmFtIHtJbnRlcmFjdGFibGV9IHRhcmdldCAgVGhlIEludGVyYWN0YWJsZSB0byB0YXJnZXRcbiAgICogQHBhcmFtIHtFbGVtZW50fSBlbGVtZW50IFRoZSBET00gRWxlbWVudCB0byB0YXJnZXRcbiAgICogQHJldHVybiB7b2JqZWN0fSBpbnRlcmFjdFxuICAgKi9cbiAgc3RhcnQgKGFjdGlvbiwgdGFyZ2V0LCBlbGVtZW50KSB7XG4gICAgaWYgKHRoaXMuaW50ZXJhY3RpbmcoKSB8fFxuICAgICAgICAhdGhpcy5wb2ludGVySXNEb3duIHx8XG4gICAgICAgIHRoaXMucG9pbnRlcnMubGVuZ3RoIDwgKGFjdGlvbi5uYW1lID09PSAnZ2VzdHVyZScgPyAyIDogMSkpIHtcbiAgICAgIHJldHVyblxuICAgIH1cblxuICAgIHV0aWxzLmNvcHlBY3Rpb24odGhpcy5wcmVwYXJlZCwgYWN0aW9uKVxuXG4gICAgdGhpcy50YXJnZXQgICAgICAgPSB0YXJnZXRcbiAgICB0aGlzLmVsZW1lbnQgICAgICA9IGVsZW1lbnRcbiAgICB0aGlzLl9pbnRlcmFjdGluZyA9IHRoaXMuX2RvUGhhc2Uoe1xuICAgICAgaW50ZXJhY3Rpb246IHRoaXMsXG4gICAgICBldmVudDogdGhpcy5kb3duRXZlbnQsXG4gICAgICBwaGFzZTogJ3N0YXJ0JyxcbiAgICB9KVxuICB9XG5cbiAgcG9pbnRlck1vdmUgKHBvaW50ZXIsIGV2ZW50LCBldmVudFRhcmdldCkge1xuICAgIGlmICghdGhpcy5zaW11bGF0aW9uKSB7XG4gICAgICB0aGlzLnVwZGF0ZVBvaW50ZXIocG9pbnRlciwgZXZlbnQsIGV2ZW50VGFyZ2V0LCBmYWxzZSlcbiAgICAgIHV0aWxzLnBvaW50ZXIuc2V0Q29vcmRzKHRoaXMuY29vcmRzLmN1ciwgdGhpcy5wb2ludGVycy5tYXAoKHApID0+IHAucG9pbnRlcikpXG4gICAgfVxuXG4gICAgY29uc3QgZHVwbGljYXRlTW92ZSA9ICh0aGlzLmNvb3Jkcy5jdXIucGFnZS54ID09PSB0aGlzLmNvb3Jkcy5wcmV2LnBhZ2UueCAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5jb29yZHMuY3VyLnBhZ2UueSA9PT0gdGhpcy5jb29yZHMucHJldi5wYWdlLnkgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuY29vcmRzLmN1ci5jbGllbnQueCA9PT0gdGhpcy5jb29yZHMucHJldi5jbGllbnQueCAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5jb29yZHMuY3VyLmNsaWVudC55ID09PSB0aGlzLmNvb3Jkcy5wcmV2LmNsaWVudC55KVxuXG4gICAgbGV0IGR4XG4gICAgbGV0IGR5XG5cbiAgICAvLyByZWdpc3RlciBtb3ZlbWVudCBncmVhdGVyIHRoYW4gcG9pbnRlck1vdmVUb2xlcmFuY2VcbiAgICBpZiAodGhpcy5wb2ludGVySXNEb3duICYmICF0aGlzLnBvaW50ZXJXYXNNb3ZlZCkge1xuICAgICAgZHggPSB0aGlzLmNvb3Jkcy5jdXIuY2xpZW50LnggLSB0aGlzLmNvb3Jkcy5zdGFydC5jbGllbnQueFxuICAgICAgZHkgPSB0aGlzLmNvb3Jkcy5jdXIuY2xpZW50LnkgLSB0aGlzLmNvb3Jkcy5zdGFydC5jbGllbnQueVxuXG4gICAgICB0aGlzLnBvaW50ZXJXYXNNb3ZlZCA9IHV0aWxzLmh5cG90KGR4LCBkeSkgPiB0aGlzLnBvaW50ZXJNb3ZlVG9sZXJhbmNlXG4gICAgfVxuXG4gICAgY29uc3Qgc2lnbmFsQXJnID0ge1xuICAgICAgcG9pbnRlcixcbiAgICAgIHBvaW50ZXJJbmRleDogdGhpcy5nZXRQb2ludGVySW5kZXgocG9pbnRlciksXG4gICAgICBldmVudCxcbiAgICAgIGV2ZW50VGFyZ2V0LFxuICAgICAgZHgsXG4gICAgICBkeSxcbiAgICAgIGR1cGxpY2F0ZTogZHVwbGljYXRlTW92ZSxcbiAgICAgIGludGVyYWN0aW9uOiB0aGlzLFxuICAgIH1cblxuICAgIGlmICghZHVwbGljYXRlTW92ZSkge1xuICAgICAgLy8gc2V0IHBvaW50ZXIgY29vcmRpbmF0ZSwgdGltZSBjaGFuZ2VzIGFuZCB2ZWxvY2l0eVxuICAgICAgdXRpbHMucG9pbnRlci5zZXRDb29yZERlbHRhcyh0aGlzLmNvb3Jkcy5kZWx0YSwgdGhpcy5jb29yZHMucHJldiwgdGhpcy5jb29yZHMuY3VyKVxuICAgICAgdXRpbHMucG9pbnRlci5zZXRDb29yZFZlbG9jaXR5KHRoaXMuY29vcmRzLnZlbG9jaXR5LCB0aGlzLmNvb3Jkcy5kZWx0YSlcbiAgICB9XG5cbiAgICB0aGlzLl9zaWduYWxzLmZpcmUoJ21vdmUnLCBzaWduYWxBcmcpXG5cbiAgICBpZiAoIWR1cGxpY2F0ZU1vdmUpIHtcbiAgICAgIC8vIGlmIGludGVyYWN0aW5nLCBmaXJlIGFuICdhY3Rpb24tbW92ZScgc2lnbmFsIGV0Y1xuICAgICAgaWYgKHRoaXMuaW50ZXJhY3RpbmcoKSkge1xuICAgICAgICB0aGlzLm1vdmUoc2lnbmFsQXJnKVxuICAgICAgfVxuXG4gICAgICBpZiAodGhpcy5wb2ludGVyV2FzTW92ZWQpIHtcbiAgICAgICAgdXRpbHMucG9pbnRlci5jb3B5Q29vcmRzKHRoaXMuY29vcmRzLnByZXYsIHRoaXMuY29vcmRzLmN1cilcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogYGBganNcbiAgICogaW50ZXJhY3QodGFyZ2V0KVxuICAgKiAgIC5kcmFnZ2FibGUodHJ1ZSlcbiAgICogICAub24oJ2RyYWdtb3ZlJywgZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAqICAgICBpZiAoc29tZUNvbmRpdGlvbikge1xuICAgKiAgICAgICAvLyBjaGFuZ2UgdGhlIHNuYXAgc2V0dGluZ3NcbiAgICogICAgICAgZXZlbnQuaW50ZXJhY3RhYmxlLmRyYWdnYWJsZSh7IHNuYXA6IHsgdGFyZ2V0czogW10gfX0pO1xuICAgKiAgICAgICAvLyBmaXJlIGFub3RoZXIgbW92ZSBldmVudCB3aXRoIHJlLWNhbGN1bGF0ZWQgc25hcFxuICAgKiAgICAgICBldmVudC5pbnRlcmFjdGlvbi5tb3ZlKCk7XG4gICAqICAgICB9XG4gICAqICAgfSk7XG4gICAqIGBgYFxuICAgKlxuICAgKiBGb3JjZSBhIG1vdmUgb2YgdGhlIGN1cnJlbnQgYWN0aW9uIGF0IHRoZSBzYW1lIGNvb3JkaW5hdGVzLiBVc2VmdWwgaWZcbiAgICogc25hcC9yZXN0cmljdCBoYXMgYmVlbiBjaGFuZ2VkIGFuZCB5b3Ugd2FudCBhIG1vdmVtZW50IHdpdGggdGhlIG5ld1xuICAgKiBzZXR0aW5ncy5cbiAgICovXG4gIG1vdmUgKHNpZ25hbEFyZz8pIHtcbiAgICBzaWduYWxBcmcgPSB1dGlscy5leHRlbmQoe1xuICAgICAgcG9pbnRlcjogdGhpcy5fbGF0ZXN0UG9pbnRlci5wb2ludGVyLFxuICAgICAgZXZlbnQ6IHRoaXMuX2xhdGVzdFBvaW50ZXIuZXZlbnQsXG4gICAgICBldmVudFRhcmdldDogdGhpcy5fbGF0ZXN0UG9pbnRlci5ldmVudFRhcmdldCxcbiAgICAgIGludGVyYWN0aW9uOiB0aGlzLFxuICAgICAgbm9CZWZvcmU6IGZhbHNlLFxuICAgIH0sIHNpZ25hbEFyZyB8fCB7fSlcblxuICAgIHNpZ25hbEFyZy5waGFzZSA9ICdtb3ZlJ1xuXG4gICAgdGhpcy5fZG9QaGFzZShzaWduYWxBcmcpXG4gIH1cblxuICAvLyBFbmQgaW50ZXJhY3QgbW92ZSBldmVudHMgYW5kIHN0b3AgYXV0by1zY3JvbGwgdW5sZXNzIHNpbXVsYXRpb24gaXMgcnVubmluZ1xuICBwb2ludGVyVXAgKHBvaW50ZXIsIGV2ZW50LCBldmVudFRhcmdldCwgY3VyRXZlbnRUYXJnZXQpIHtcbiAgICBsZXQgcG9pbnRlckluZGV4ID0gdGhpcy5nZXRQb2ludGVySW5kZXgocG9pbnRlcilcblxuICAgIGlmIChwb2ludGVySW5kZXggPT09IC0xKSB7XG4gICAgICBwb2ludGVySW5kZXggPSB0aGlzLnVwZGF0ZVBvaW50ZXIocG9pbnRlciwgZXZlbnQsIGV2ZW50VGFyZ2V0LCBmYWxzZSlcbiAgICB9XG5cbiAgICB0aGlzLl9zaWduYWxzLmZpcmUoL2NhbmNlbCQvaS50ZXN0KGV2ZW50LnR5cGUpID8gJ2NhbmNlbCcgOiAndXAnLCB7XG4gICAgICBwb2ludGVyLFxuICAgICAgcG9pbnRlckluZGV4LFxuICAgICAgZXZlbnQsXG4gICAgICBldmVudFRhcmdldCxcbiAgICAgIGN1ckV2ZW50VGFyZ2V0LFxuICAgICAgaW50ZXJhY3Rpb246IHRoaXMsXG4gICAgfSlcblxuICAgIGlmICghdGhpcy5zaW11bGF0aW9uKSB7XG4gICAgICB0aGlzLmVuZChldmVudClcbiAgICB9XG5cbiAgICB0aGlzLnBvaW50ZXJJc0Rvd24gPSBmYWxzZVxuICAgIHRoaXMucmVtb3ZlUG9pbnRlcihwb2ludGVyLCBldmVudClcbiAgfVxuXG4gIGRvY3VtZW50Qmx1ciAoZXZlbnQpIHtcbiAgICB0aGlzLmVuZChldmVudClcbiAgICB0aGlzLl9zaWduYWxzLmZpcmUoJ2JsdXInLCB7IGV2ZW50LCBpbnRlcmFjdGlvbjogdGhpcyB9KVxuICB9XG5cbiAgLyoqXG4gICAqIGBgYGpzXG4gICAqIGludGVyYWN0KHRhcmdldClcbiAgICogICAuZHJhZ2dhYmxlKHRydWUpXG4gICAqICAgLm9uKCdtb3ZlJywgZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAqICAgICBpZiAoZXZlbnQucGFnZVggPiAxMDAwKSB7XG4gICAqICAgICAgIC8vIGVuZCB0aGUgY3VycmVudCBhY3Rpb25cbiAgICogICAgICAgZXZlbnQuaW50ZXJhY3Rpb24uZW5kKCk7XG4gICAqICAgICAgIC8vIHN0b3AgYWxsIGZ1cnRoZXIgbGlzdGVuZXJzIGZyb20gYmVpbmcgY2FsbGVkXG4gICAqICAgICAgIGV2ZW50LnN0b3BJbW1lZGlhdGVQcm9wYWdhdGlvbigpO1xuICAgKiAgICAgfVxuICAgKiAgIH0pO1xuICAgKiBgYGBcbiAgICpcbiAgICogQHBhcmFtIHtQb2ludGVyRXZlbnR9IFtldmVudF1cbiAgICovXG4gIGVuZCAoZXZlbnQpIHtcbiAgICB0aGlzLl9lbmRpbmcgPSB0cnVlXG4gICAgZXZlbnQgPSBldmVudCB8fCB0aGlzLl9sYXRlc3RQb2ludGVyLmV2ZW50XG4gICAgbGV0IGVuZFBoYXNlUmVzdWx0XG5cbiAgICBpZiAodGhpcy5pbnRlcmFjdGluZygpKSB7XG4gICAgICBlbmRQaGFzZVJlc3VsdCA9IHRoaXMuX2RvUGhhc2Uoe1xuICAgICAgICBldmVudCxcbiAgICAgICAgaW50ZXJhY3Rpb246IHRoaXMsXG4gICAgICAgIHBoYXNlOiAnZW5kJyxcbiAgICAgIH0pXG4gICAgfVxuXG4gICAgdGhpcy5fZW5kaW5nID0gZmFsc2VcblxuICAgIGlmIChlbmRQaGFzZVJlc3VsdCA9PT0gdHJ1ZSkge1xuICAgICAgdGhpcy5zdG9wKClcbiAgICB9XG4gIH1cblxuICBjdXJyZW50QWN0aW9uICgpIHtcbiAgICByZXR1cm4gdGhpcy5faW50ZXJhY3RpbmcgPyB0aGlzLnByZXBhcmVkLm5hbWUgOiBudWxsXG4gIH1cblxuICBpbnRlcmFjdGluZyAoKSB7XG4gICAgcmV0dXJuIHRoaXMuX2ludGVyYWN0aW5nXG4gIH1cblxuICAvKiogKi9cbiAgc3RvcCAoKSB7XG4gICAgdGhpcy5fc2lnbmFscy5maXJlKCdzdG9wJywgeyBpbnRlcmFjdGlvbjogdGhpcyB9KVxuXG4gICAgdGhpcy50YXJnZXQgPSB0aGlzLmVsZW1lbnQgPSBudWxsXG5cbiAgICB0aGlzLl9pbnRlcmFjdGluZyA9IGZhbHNlXG4gICAgdGhpcy5wcmVwYXJlZC5uYW1lID0gdGhpcy5wcmV2RXZlbnQgPSBudWxsXG4gIH1cblxuICBnZXRQb2ludGVySW5kZXggKHBvaW50ZXIpIHtcbiAgICBjb25zdCBwb2ludGVySWQgPSB1dGlscy5wb2ludGVyLmdldFBvaW50ZXJJZChwb2ludGVyKVxuXG4gICAgLy8gbW91c2UgYW5kIHBlbiBpbnRlcmFjdGlvbnMgbWF5IGhhdmUgb25seSBvbmUgcG9pbnRlclxuICAgIHJldHVybiAodGhpcy5wb2ludGVyVHlwZSA9PT0gJ21vdXNlJyB8fCB0aGlzLnBvaW50ZXJUeXBlID09PSAncGVuJylcbiAgICAgID8gdGhpcy5wb2ludGVycy5sZW5ndGggLSAxXG4gICAgICA6IHV0aWxzLmFyci5maW5kSW5kZXgodGhpcy5wb2ludGVycywgKGN1clBvaW50ZXIpID0+IGN1clBvaW50ZXIuaWQgPT09IHBvaW50ZXJJZClcbiAgfVxuXG4gIGdldFBvaW50ZXJJbmZvIChwb2ludGVyKSB7XG4gICAgcmV0dXJuIHRoaXMucG9pbnRlcnNbdGhpcy5nZXRQb2ludGVySW5kZXgocG9pbnRlcildXG4gIH1cblxuICB1cGRhdGVQb2ludGVyIChwb2ludGVyLCBldmVudCwgZXZlbnRUYXJnZXQsIGRvd24pIHtcbiAgICBjb25zdCBpZCA9IHV0aWxzLnBvaW50ZXIuZ2V0UG9pbnRlcklkKHBvaW50ZXIpXG4gICAgbGV0IHBvaW50ZXJJbmRleCA9IHRoaXMuZ2V0UG9pbnRlckluZGV4KHBvaW50ZXIpXG4gICAgbGV0IHBvaW50ZXJJbmZvID0gdGhpcy5wb2ludGVyc1twb2ludGVySW5kZXhdXG5cbiAgICBkb3duID0gZG93biA9PT0gZmFsc2VcbiAgICAgID8gZmFsc2VcbiAgICAgIDogZG93biB8fCAvKGRvd258c3RhcnQpJC9pLnRlc3QoZXZlbnQudHlwZSlcblxuICAgIGlmICghcG9pbnRlckluZm8pIHtcbiAgICAgIHBvaW50ZXJJbmZvID0gbmV3IFBvaW50ZXJJbmZvKFxuICAgICAgICBpZCxcbiAgICAgICAgcG9pbnRlcixcbiAgICAgICAgZXZlbnQsXG4gICAgICAgIG51bGwsXG4gICAgICAgIG51bGwsXG4gICAgICApXG5cbiAgICAgIHBvaW50ZXJJbmRleCA9IHRoaXMucG9pbnRlcnMubGVuZ3RoXG4gICAgICB0aGlzLnBvaW50ZXJzLnB1c2gocG9pbnRlckluZm8pXG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgcG9pbnRlckluZm8ucG9pbnRlciA9IHBvaW50ZXJcbiAgICB9XG5cbiAgICBpZiAoZG93bikge1xuICAgICAgdGhpcy5wb2ludGVySXNEb3duID0gdHJ1ZVxuXG4gICAgICBpZiAoIXRoaXMuaW50ZXJhY3RpbmcoKSkge1xuICAgICAgICB1dGlscy5wb2ludGVyLnNldENvb3Jkcyh0aGlzLmNvb3Jkcy5zdGFydCwgdGhpcy5wb2ludGVycy5tYXAoKHApID0+IHAucG9pbnRlcikpXG5cbiAgICAgICAgdXRpbHMucG9pbnRlci5jb3B5Q29vcmRzKHRoaXMuY29vcmRzLmN1ciwgdGhpcy5jb29yZHMuc3RhcnQpXG4gICAgICAgIHV0aWxzLnBvaW50ZXIuY29weUNvb3Jkcyh0aGlzLmNvb3Jkcy5wcmV2LCB0aGlzLmNvb3Jkcy5zdGFydClcbiAgICAgICAgdXRpbHMucG9pbnRlci5wb2ludGVyRXh0ZW5kKHRoaXMuZG93blBvaW50ZXIsIHBvaW50ZXIpXG5cbiAgICAgICAgdGhpcy5kb3duRXZlbnQgPSBldmVudFxuICAgICAgICBwb2ludGVySW5mby5kb3duVGltZSA9IHRoaXMuY29vcmRzLmN1ci50aW1lU3RhbXBcbiAgICAgICAgcG9pbnRlckluZm8uZG93blRhcmdldCA9IGV2ZW50VGFyZ2V0XG5cbiAgICAgICAgdGhpcy5wb2ludGVyV2FzTW92ZWQgPSBmYWxzZVxuICAgICAgfVxuICAgIH1cblxuICAgIHRoaXMuX3VwZGF0ZUxhdGVzdFBvaW50ZXIocG9pbnRlciwgZXZlbnQsIGV2ZW50VGFyZ2V0KVxuXG4gICAgdGhpcy5fc2lnbmFscy5maXJlKCd1cGRhdGUtcG9pbnRlcicsIHtcbiAgICAgIHBvaW50ZXIsXG4gICAgICBldmVudCxcbiAgICAgIGV2ZW50VGFyZ2V0LFxuICAgICAgZG93bixcbiAgICAgIHBvaW50ZXJJbmZvLFxuICAgICAgcG9pbnRlckluZGV4LFxuICAgICAgaW50ZXJhY3Rpb246IHRoaXMsXG4gICAgfSlcblxuICAgIHJldHVybiBwb2ludGVySW5kZXhcbiAgfVxuXG4gIHJlbW92ZVBvaW50ZXIgKHBvaW50ZXIsIGV2ZW50KSB7XG4gICAgY29uc3QgcG9pbnRlckluZGV4ID0gdGhpcy5nZXRQb2ludGVySW5kZXgocG9pbnRlcilcblxuICAgIGlmIChwb2ludGVySW5kZXggPT09IC0xKSB7IHJldHVybiB9XG5cbiAgICBjb25zdCBwb2ludGVySW5mbyA9IHRoaXMucG9pbnRlcnNbcG9pbnRlckluZGV4XVxuXG4gICAgdGhpcy5fc2lnbmFscy5maXJlKCdyZW1vdmUtcG9pbnRlcicsIHtcbiAgICAgIHBvaW50ZXIsXG4gICAgICBldmVudCxcbiAgICAgIHBvaW50ZXJJbmRleCxcbiAgICAgIHBvaW50ZXJJbmZvLFxuICAgICAgaW50ZXJhY3Rpb246IHRoaXMsXG4gICAgfSlcblxuICAgIHRoaXMucG9pbnRlcnMuc3BsaWNlKHBvaW50ZXJJbmRleCwgMSlcbiAgfVxuXG4gIF91cGRhdGVMYXRlc3RQb2ludGVyIChwb2ludGVyLCBldmVudCwgZXZlbnRUYXJnZXQpIHtcbiAgICB0aGlzLl9sYXRlc3RQb2ludGVyLnBvaW50ZXIgPSBwb2ludGVyXG4gICAgdGhpcy5fbGF0ZXN0UG9pbnRlci5ldmVudCA9IGV2ZW50XG4gICAgdGhpcy5fbGF0ZXN0UG9pbnRlci5ldmVudFRhcmdldCA9IGV2ZW50VGFyZ2V0XG4gIH1cblxuICBfY3JlYXRlUHJlcGFyZWRFdmVudCAoZXZlbnQ6IEludGVyYWN0LlBvaW50ZXJFdmVudFR5cGUsIHBoYXNlOiBFdmVudFBoYXNlLCBwcmVFbmQ6IGJvb2xlYW4sIHR5cGU6IHN0cmluZykge1xuICAgIGNvbnN0IGFjdGlvbk5hbWUgPSB0aGlzLnByZXBhcmVkLm5hbWVcblxuICAgIHJldHVybiBuZXcgSW50ZXJhY3RFdmVudCh0aGlzLCBldmVudCwgYWN0aW9uTmFtZSwgcGhhc2UsIHRoaXMuZWxlbWVudCwgbnVsbCwgcHJlRW5kLCB0eXBlKVxuICB9XG5cbiAgX2ZpcmVFdmVudCAoaUV2ZW50KSB7XG4gICAgdGhpcy50YXJnZXQuZmlyZShpRXZlbnQpXG5cbiAgICBpZiAoIXRoaXMucHJldkV2ZW50IHx8IGlFdmVudC50aW1lU3RhbXAgPj0gdGhpcy5wcmV2RXZlbnQudGltZVN0YW1wKSB7XG4gICAgICB0aGlzLnByZXZFdmVudCA9IGlFdmVudFxuICAgIH1cbiAgfVxuXG4gIF9kb1BoYXNlIChzaWduYWxBcmcpIHtcbiAgICBjb25zdCB7IGV2ZW50LCBwaGFzZSwgcHJlRW5kLCB0eXBlIH0gPSBzaWduYWxBcmdcblxuICAgIGlmICghc2lnbmFsQXJnLm5vQmVmb3JlKSB7XG4gICAgICBjb25zdCBiZWZvcmVSZXN1bHQgPSB0aGlzLl9zaWduYWxzLmZpcmUoYGJlZm9yZS1hY3Rpb24tJHtwaGFzZX1gLCBzaWduYWxBcmcpXG5cbiAgICAgIGlmIChiZWZvcmVSZXN1bHQgPT09IGZhbHNlKSB7XG4gICAgICAgIHJldHVybiBmYWxzZVxuICAgICAgfVxuICAgIH1cblxuICAgIGNvbnN0IGlFdmVudCA9IHNpZ25hbEFyZy5pRXZlbnQgPSB0aGlzLl9jcmVhdGVQcmVwYXJlZEV2ZW50KGV2ZW50LCBwaGFzZSwgcHJlRW5kLCB0eXBlKVxuXG4gICAgdGhpcy5fc2lnbmFscy5maXJlKGBhY3Rpb24tJHtwaGFzZX1gLCBzaWduYWxBcmcpXG5cbiAgICB0aGlzLl9maXJlRXZlbnQoaUV2ZW50KVxuXG4gICAgdGhpcy5fc2lnbmFscy5maXJlKGBhZnRlci1hY3Rpb24tJHtwaGFzZX1gLCBzaWduYWxBcmcpXG5cbiAgICByZXR1cm4gdHJ1ZVxuICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IEludGVyYWN0aW9uXG5leHBvcnQgeyBQb2ludGVySW5mbyB9XG4iXX0=