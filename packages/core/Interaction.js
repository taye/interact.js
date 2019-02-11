import * as utils from '@interactjs/utils';
import InteractEvent, { EventPhase } from './InteractEvent';
import PointerInfo from './PointerInfo';
import { ActionName } from './scope';
export class Interaction {
    /** */
    constructor({ pointerType, signals }) {
        // current interactable being interacted with
        this.interactable = null;
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
        this._signals.fire('new', { interaction: this });
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
            this.pointers.length < (action.name === ActionName.Gesture ? 2 : 1)) {
            return;
        }
        utils.copyAction(this.prepared, action);
        this.interactable = target;
        this.element = element;
        this._interacting = this._doPhase({
            interaction: this,
            event: this.downEvent,
            phase: EventPhase.Start,
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
        signalArg.phase = EventPhase.Move;
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
                phase: EventPhase.End,
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
        this.interactable = this.element = null;
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
        this.interactable.fire(iEvent);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiSW50ZXJhY3Rpb24uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJJbnRlcmFjdGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEtBQUssS0FBSyxNQUFNLG1CQUFtQixDQUFBO0FBRTFDLE9BQU8sYUFBYSxFQUFFLEVBQUUsVUFBVSxFQUFFLE1BQU0saUJBQWlCLENBQUE7QUFDM0QsT0FBTyxXQUFXLE1BQU0sZUFBZSxDQUFBO0FBQ3ZDLE9BQU8sRUFBRSxVQUFVLEVBQUUsTUFBTSxTQUFTLENBQUE7QUFjcEMsTUFBTSxPQUFPLFdBQVc7SUF3RXRCLE1BQU07SUFDTixZQUFhLEVBQUUsV0FBVyxFQUFFLE9BQU8sRUFBb0Q7UUF4RXZGLDZDQUE2QztRQUM3QyxpQkFBWSxHQUFpQixJQUFJLENBQUE7UUFFakMseUNBQXlDO1FBQ3pDLFlBQU8sR0FBWSxJQUFJLENBQUE7UUFJdkIscURBQXFEO1FBQ3JELGFBQVEsR0FBbUI7WUFDekIsSUFBSSxFQUFHLElBQUk7WUFDWCxJQUFJLEVBQUcsSUFBSTtZQUNYLEtBQUssRUFBRSxJQUFJO1NBQ1osQ0FBQTtRQUlELCtCQUErQjtRQUMvQixhQUFRLEdBQWtCLEVBQUUsQ0FBQTtRQUU1Qix5Q0FBeUM7UUFDekMsY0FBUyxHQUE4QixJQUFJLENBQUE7UUFFM0MsZ0JBQVcsR0FBeUIsRUFBMEIsQ0FBQTtRQUU5RCxtQkFBYyxHQUlWO1lBQ0YsT0FBTyxFQUFFLElBQUk7WUFDYixLQUFLLEVBQUUsSUFBSTtZQUNYLFdBQVcsRUFBRSxJQUFJO1NBQ2xCLENBQUE7UUFFRCx3QkFBd0I7UUFDeEIsY0FBUyxHQUFxQixJQUFJLENBQUE7UUFFbEMsa0JBQWEsR0FBRyxLQUFLLENBQUE7UUFDckIsb0JBQWUsR0FBRyxLQUFLLENBQUE7UUFDdkIsaUJBQVksR0FBRyxLQUFLLENBQUE7UUFDcEIsWUFBTyxHQUFHLEtBQUssQ0FBQTtRQUVmLGVBQVUsR0FBRyxJQUFJLENBQUE7UUFNakI7O1dBRUc7UUFD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LElBQUksQ0FBQyxVQUFVLENBQUMsTUFBTSxDQUFDLENBQUE7UUFFdkIsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLEtBQUssRUFBRSxFQUFFLFNBQVMsQ0FBQyxDQUFBO1FBRXRELE9BQU8sSUFBSSxDQUFBO0lBQ2IsQ0FBQztDQUNGO0FBRUQsZUFBZSxXQUFXLENBQUE7QUFDMUIsT0FBTyxFQUFFLFdBQVcsRUFBRSxDQUFBIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgdXRpbHMgZnJvbSAnQGludGVyYWN0anMvdXRpbHMnXG5pbXBvcnQgSW50ZXJhY3RhYmxlIGZyb20gJy4vSW50ZXJhY3RhYmxlJ1xuaW1wb3J0IEludGVyYWN0RXZlbnQsIHsgRXZlbnRQaGFzZSB9IGZyb20gJy4vSW50ZXJhY3RFdmVudCdcbmltcG9ydCBQb2ludGVySW5mbyBmcm9tICcuL1BvaW50ZXJJbmZvJ1xuaW1wb3J0IHsgQWN0aW9uTmFtZSB9IGZyb20gJy4vc2NvcGUnXG5cbmV4cG9ydCBpbnRlcmZhY2UgQWN0aW9uUHJvcHM8VCBleHRlbmRzIEFjdGlvbk5hbWUgPSBhbnk+IHtcbiAgbmFtZTogVFxuICBheGlzPzogJ3gnIHwgJ3knIHwgJ3h5J1xuICBlZGdlcz86IHtcbiAgICBbZWRnZSBpbiBrZXlvZiBJbnRlcmFjdC5SZWN0XT86IGJvb2xlYW5cbiAgfVxufVxuXG5leHBvcnQgaW50ZXJmYWNlIFN0YXJ0QWN0aW9uIGV4dGVuZHMgQWN0aW9uUHJvcHMge1xuICBuYW1lOiBBY3Rpb25OYW1lIHwgc3RyaW5nXG59XG5cbmV4cG9ydCBjbGFzcyBJbnRlcmFjdGlvbjxUIGV4dGVuZHMgQWN0aW9uTmFtZSA9IGFueT4ge1xuICAvLyBjdXJyZW50IGludGVyYWN0YWJsZSBiZWluZyBpbnRlcmFjdGVkIHdpdGhcbiAgaW50ZXJhY3RhYmxlOiBJbnRlcmFjdGFibGUgPSBudWxsXG5cbiAgLy8gdGhlIHRhcmdldCBlbGVtZW50IG9mIHRoZSBpbnRlcmFjdGFibGVcbiAgZWxlbWVudDogRWxlbWVudCA9IG51bGxcblxuICBfc2lnbmFsczogdXRpbHMuU2lnbmFsc1xuXG4gIC8vIGFjdGlvbiB0aGF0J3MgcmVhZHkgdG8gYmUgZmlyZWQgb24gbmV4dCBtb3ZlIGV2ZW50XG4gIHByZXBhcmVkOiBBY3Rpb25Qcm9wczxUPiA9IHtcbiAgICBuYW1lIDogbnVsbCxcbiAgICBheGlzIDogbnVsbCxcbiAgICBlZGdlczogbnVsbCxcbiAgfVxuXG4gIHBvaW50ZXJUeXBlOiBzdHJpbmdcblxuICAvLyBrZWVwIHRyYWNrIG9mIGFkZGVkIHBvaW50ZXJzXG4gIHBvaW50ZXJzOiBQb2ludGVySW5mb1tdID0gW11cblxuICAvLyBwb2ludGVyZG93bi9tb3VzZWRvd24vdG91Y2hzdGFydCBldmVudFxuICBkb3duRXZlbnQ6IEludGVyYWN0LlBvaW50ZXJFdmVudFR5cGUgPSBudWxsXG5cbiAgZG93blBvaW50ZXI6IEludGVyYWN0LlBvaW50ZXJUeXBlID0ge30gYXMgSW50ZXJhY3QuUG9pbnRlclR5cGVcblxuICBfbGF0ZXN0UG9pbnRlcjoge1xuICAgIHBvaW50ZXI6IEV2ZW50VGFyZ2V0XG4gICAgZXZlbnQ6IEludGVyYWN0LlBvaW50ZXJFdmVudFR5cGVcbiAgICBldmVudFRhcmdldDogTm9kZSxcbiAgfSA9IHtcbiAgICBwb2ludGVyOiBudWxsLFxuICAgIGV2ZW50OiBudWxsLFxuICAgIGV2ZW50VGFyZ2V0OiBudWxsLFxuICB9XG5cbiAgLy8gcHJldmlvdXMgYWN0aW9uIGV2ZW50XG4gIHByZXZFdmVudDogSW50ZXJhY3RFdmVudDxUPiA9IG51bGxcblxuICBwb2ludGVySXNEb3duID0gZmFsc2VcbiAgcG9pbnRlcldhc01vdmVkID0gZmFsc2VcbiAgX2ludGVyYWN0aW5nID0gZmFsc2VcbiAgX2VuZGluZyA9IGZhbHNlXG5cbiAgc2ltdWxhdGlvbiA9IG51bGxcblxuICBnZXQgcG9pbnRlck1vdmVUb2xlcmFuY2UgKCkge1xuICAgIHJldHVybiAxXG4gIH1cblxuICAvKipcbiAgICogQGFsaWFzIEludGVyYWN0aW9uLnByb3RvdHlwZS5tb3ZlXG4gICAqL1xuICBkb01vdmUgPSB1dGlscy53YXJuT25jZShcbiAgICBmdW5jdGlvbiAodGhpczogSW50ZXJhY3Rpb24sIHNpZ25hbEFyZzogYW55KSB7XG4gICAgICB0aGlzLm1vdmUoc2lnbmFsQXJnKVxuICAgIH0sXG4gICAgJ1RoZSBpbnRlcmFjdGlvbi5kb01vdmUoKSBtZXRob2QgaGFzIGJlZW4gcmVuYW1lZCB0byBpbnRlcmFjdGlvbi5tb3ZlKCknKVxuXG4gIGNvb3JkcyA9IHtcbiAgICAvLyBTdGFydGluZyBJbnRlcmFjdEV2ZW50IHBvaW50ZXIgY29vcmRpbmF0ZXNcbiAgICBzdGFydDogdXRpbHMucG9pbnRlci5uZXdDb29yZHMoKSxcbiAgICAvLyBQcmV2aW91cyBuYXRpdmUgcG9pbnRlciBtb3ZlIGV2ZW50IGNvb3JkaW5hdGVzXG4gICAgcHJldjogdXRpbHMucG9pbnRlci5uZXdDb29yZHMoKSxcbiAgICAvLyBjdXJyZW50IG5hdGl2ZSBwb2ludGVyIG1vdmUgZXZlbnQgY29vcmRpbmF0ZXNcbiAgICBjdXI6IHV0aWxzLnBvaW50ZXIubmV3Q29vcmRzKCksXG4gICAgLy8gQ2hhbmdlIGluIGNvb3JkaW5hdGVzIGFuZCB0aW1lIG9mIHRoZSBwb2ludGVyXG4gICAgZGVsdGE6IHV0aWxzLnBvaW50ZXIubmV3Q29vcmRzKCksXG4gICAgLy8gcG9pbnRlciB2ZWxvY2l0eVxuICAgIHZlbG9jaXR5OiB1dGlscy5wb2ludGVyLm5ld0Nvb3JkcygpLFxuICB9XG5cbiAgLyoqICovXG4gIGNvbnN0cnVjdG9yICh7IHBvaW50ZXJUeXBlLCBzaWduYWxzIH06IHsgcG9pbnRlclR5cGU/OiBzdHJpbmcsIHNpZ25hbHM6IHV0aWxzLlNpZ25hbHMgfSkge1xuICAgIHRoaXMuX3NpZ25hbHMgPSBzaWduYWxzXG4gICAgdGhpcy5wb2ludGVyVHlwZSA9IHBvaW50ZXJUeXBlXG5cbiAgICB0aGlzLl9zaWduYWxzLmZpcmUoJ25ldycsIHsgaW50ZXJhY3Rpb246IHRoaXMgfSlcbiAgfVxuXG4gIHBvaW50ZXJEb3duIChwb2ludGVyOiBJbnRlcmFjdC5Qb2ludGVyVHlwZSwgZXZlbnQ6IEludGVyYWN0LlBvaW50ZXJFdmVudFR5cGUsIGV2ZW50VGFyZ2V0OiBFdmVudFRhcmdldCkge1xuICAgIGNvbnN0IHBvaW50ZXJJbmRleCA9IHRoaXMudXBkYXRlUG9pbnRlcihwb2ludGVyLCBldmVudCwgZXZlbnRUYXJnZXQsIHRydWUpXG5cbiAgICB0aGlzLl9zaWduYWxzLmZpcmUoJ2Rvd24nLCB7XG4gICAgICBwb2ludGVyLFxuICAgICAgZXZlbnQsXG4gICAgICBldmVudFRhcmdldCxcbiAgICAgIHBvaW50ZXJJbmRleCxcbiAgICAgIGludGVyYWN0aW9uOiB0aGlzLFxuICAgIH0pXG4gIH1cblxuICAvKipcbiAgICogYGBganNcbiAgICogaW50ZXJhY3QodGFyZ2V0KVxuICAgKiAgIC5kcmFnZ2FibGUoe1xuICAgKiAgICAgLy8gZGlzYWJsZSB0aGUgZGVmYXVsdCBkcmFnIHN0YXJ0IGJ5IGRvd24tPm1vdmVcbiAgICogICAgIG1hbnVhbFN0YXJ0OiB0cnVlXG4gICAqICAgfSlcbiAgICogICAvLyBzdGFydCBkcmFnZ2luZyBhZnRlciB0aGUgdXNlciBob2xkcyB0aGUgcG9pbnRlciBkb3duXG4gICAqICAgLm9uKCdob2xkJywgZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAqICAgICB2YXIgaW50ZXJhY3Rpb24gPSBldmVudC5pbnRlcmFjdGlvbjtcbiAgICpcbiAgICogICAgIGlmICghaW50ZXJhY3Rpb24uaW50ZXJhY3RpbmcoKSkge1xuICAgKiAgICAgICBpbnRlcmFjdGlvbi5zdGFydCh7IG5hbWU6ICdkcmFnJyB9LFxuICAgKiAgICAgICAgICAgICAgICAgICAgICAgICBldmVudC5pbnRlcmFjdGFibGUsXG4gICAqICAgICAgICAgICAgICAgICAgICAgICAgIGV2ZW50LmN1cnJlbnRUYXJnZXQpO1xuICAgKiAgICAgfVxuICAgKiB9KTtcbiAgICogYGBgXG4gICAqXG4gICAqIFN0YXJ0IGFuIGFjdGlvbiB3aXRoIHRoZSBnaXZlbiBJbnRlcmFjdGFibGUgYW5kIEVsZW1lbnQgYXMgdGFydGdldHMuIFRoZVxuICAgKiBhY3Rpb24gbXVzdCBiZSBlbmFibGVkIGZvciB0aGUgdGFyZ2V0IEludGVyYWN0YWJsZSBhbmQgYW4gYXBwcm9wcmlhdGVcbiAgICogbnVtYmVyIG9mIHBvaW50ZXJzIG11c3QgYmUgaGVsZCBkb3duIC0gMSBmb3IgZHJhZy9yZXNpemUsIDIgZm9yIGdlc3R1cmUuXG4gICAqXG4gICAqIFVzZSBpdCB3aXRoIGBpbnRlcmFjdGFibGUuPGFjdGlvbj5hYmxlKHsgbWFudWFsU3RhcnQ6IGZhbHNlIH0pYCB0byBhbHdheXNcbiAgICogW3N0YXJ0IGFjdGlvbnMgbWFudWFsbHldKGh0dHBzOi8vZ2l0aHViLmNvbS90YXllL2ludGVyYWN0LmpzL2lzc3Vlcy8xMTQpXG4gICAqXG4gICAqIEBwYXJhbSB7b2JqZWN0fSBhY3Rpb24gICBUaGUgYWN0aW9uIHRvIGJlIHBlcmZvcm1lZCAtIGRyYWcsIHJlc2l6ZSwgZXRjLlxuICAgKiBAcGFyYW0ge0ludGVyYWN0YWJsZX0gdGFyZ2V0ICBUaGUgSW50ZXJhY3RhYmxlIHRvIHRhcmdldFxuICAgKiBAcGFyYW0ge0VsZW1lbnR9IGVsZW1lbnQgVGhlIERPTSBFbGVtZW50IHRvIHRhcmdldFxuICAgKiBAcmV0dXJuIHtvYmplY3R9IGludGVyYWN0XG4gICAqL1xuICBzdGFydCAoYWN0aW9uOiBTdGFydEFjdGlvbiwgdGFyZ2V0OiBJbnRlcmFjdGFibGUsIGVsZW1lbnQ6IEVsZW1lbnQpIHtcbiAgICBpZiAodGhpcy5pbnRlcmFjdGluZygpIHx8XG4gICAgICAgICF0aGlzLnBvaW50ZXJJc0Rvd24gfHxcbiAgICAgICAgdGhpcy5wb2ludGVycy5sZW5ndGggPCAoYWN0aW9uLm5hbWUgPT09IEFjdGlvbk5hbWUuR2VzdHVyZSA/IDIgOiAxKSkge1xuICAgICAgcmV0dXJuXG4gICAgfVxuXG4gICAgdXRpbHMuY29weUFjdGlvbih0aGlzLnByZXBhcmVkLCBhY3Rpb24pXG5cbiAgICB0aGlzLmludGVyYWN0YWJsZSA9IHRhcmdldFxuICAgIHRoaXMuZWxlbWVudCAgICAgID0gZWxlbWVudFxuICAgIHRoaXMuX2ludGVyYWN0aW5nID0gdGhpcy5fZG9QaGFzZSh7XG4gICAgICBpbnRlcmFjdGlvbjogdGhpcyxcbiAgICAgIGV2ZW50OiB0aGlzLmRvd25FdmVudCxcbiAgICAgIHBoYXNlOiBFdmVudFBoYXNlLlN0YXJ0LFxuICAgIH0pXG4gIH1cblxuICBwb2ludGVyTW92ZSAocG9pbnRlcjogSW50ZXJhY3QuUG9pbnRlclR5cGUsIGV2ZW50OiBJbnRlcmFjdC5Qb2ludGVyRXZlbnRUeXBlLCBldmVudFRhcmdldDogRXZlbnRUYXJnZXQpIHtcbiAgICBpZiAoIXRoaXMuc2ltdWxhdGlvbikge1xuICAgICAgdGhpcy51cGRhdGVQb2ludGVyKHBvaW50ZXIsIGV2ZW50LCBldmVudFRhcmdldCwgZmFsc2UpXG4gICAgICB1dGlscy5wb2ludGVyLnNldENvb3Jkcyh0aGlzLmNvb3Jkcy5jdXIsIHRoaXMucG9pbnRlcnMubWFwKChwKSA9PiBwLnBvaW50ZXIpKVxuICAgIH1cblxuICAgIGNvbnN0IGR1cGxpY2F0ZU1vdmUgPSAodGhpcy5jb29yZHMuY3VyLnBhZ2UueCA9PT0gdGhpcy5jb29yZHMucHJldi5wYWdlLnggJiZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuY29vcmRzLmN1ci5wYWdlLnkgPT09IHRoaXMuY29vcmRzLnByZXYucGFnZS55ICYmXG4gICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmNvb3Jkcy5jdXIuY2xpZW50LnggPT09IHRoaXMuY29vcmRzLnByZXYuY2xpZW50LnggJiZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuY29vcmRzLmN1ci5jbGllbnQueSA9PT0gdGhpcy5jb29yZHMucHJldi5jbGllbnQueSlcblxuICAgIGxldCBkeFxuICAgIGxldCBkeVxuXG4gICAgLy8gcmVnaXN0ZXIgbW92ZW1lbnQgZ3JlYXRlciB0aGFuIHBvaW50ZXJNb3ZlVG9sZXJhbmNlXG4gICAgaWYgKHRoaXMucG9pbnRlcklzRG93biAmJiAhdGhpcy5wb2ludGVyV2FzTW92ZWQpIHtcbiAgICAgIGR4ID0gdGhpcy5jb29yZHMuY3VyLmNsaWVudC54IC0gdGhpcy5jb29yZHMuc3RhcnQuY2xpZW50LnhcbiAgICAgIGR5ID0gdGhpcy5jb29yZHMuY3VyLmNsaWVudC55IC0gdGhpcy5jb29yZHMuc3RhcnQuY2xpZW50LnlcblxuICAgICAgdGhpcy5wb2ludGVyV2FzTW92ZWQgPSB1dGlscy5oeXBvdChkeCwgZHkpID4gdGhpcy5wb2ludGVyTW92ZVRvbGVyYW5jZVxuICAgIH1cblxuICAgIGNvbnN0IHNpZ25hbEFyZyA9IHtcbiAgICAgIHBvaW50ZXIsXG4gICAgICBwb2ludGVySW5kZXg6IHRoaXMuZ2V0UG9pbnRlckluZGV4KHBvaW50ZXIpLFxuICAgICAgZXZlbnQsXG4gICAgICBldmVudFRhcmdldCxcbiAgICAgIGR4LFxuICAgICAgZHksXG4gICAgICBkdXBsaWNhdGU6IGR1cGxpY2F0ZU1vdmUsXG4gICAgICBpbnRlcmFjdGlvbjogdGhpcyxcbiAgICB9XG5cbiAgICBpZiAoIWR1cGxpY2F0ZU1vdmUpIHtcbiAgICAgIC8vIHNldCBwb2ludGVyIGNvb3JkaW5hdGUsIHRpbWUgY2hhbmdlcyBhbmQgdmVsb2NpdHlcbiAgICAgIHV0aWxzLnBvaW50ZXIuc2V0Q29vcmREZWx0YXModGhpcy5jb29yZHMuZGVsdGEsIHRoaXMuY29vcmRzLnByZXYsIHRoaXMuY29vcmRzLmN1cilcbiAgICAgIHV0aWxzLnBvaW50ZXIuc2V0Q29vcmRWZWxvY2l0eSh0aGlzLmNvb3Jkcy52ZWxvY2l0eSwgdGhpcy5jb29yZHMuZGVsdGEpXG4gICAgfVxuXG4gICAgdGhpcy5fc2lnbmFscy5maXJlKCdtb3ZlJywgc2lnbmFsQXJnKVxuXG4gICAgaWYgKCFkdXBsaWNhdGVNb3ZlKSB7XG4gICAgICAvLyBpZiBpbnRlcmFjdGluZywgZmlyZSBhbiAnYWN0aW9uLW1vdmUnIHNpZ25hbCBldGNcbiAgICAgIGlmICh0aGlzLmludGVyYWN0aW5nKCkpIHtcbiAgICAgICAgdGhpcy5tb3ZlKHNpZ25hbEFyZylcbiAgICAgIH1cblxuICAgICAgaWYgKHRoaXMucG9pbnRlcldhc01vdmVkKSB7XG4gICAgICAgIHV0aWxzLnBvaW50ZXIuY29weUNvb3Jkcyh0aGlzLmNvb3Jkcy5wcmV2LCB0aGlzLmNvb3Jkcy5jdXIpXG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIGBgYGpzXG4gICAqIGludGVyYWN0KHRhcmdldClcbiAgICogICAuZHJhZ2dhYmxlKHRydWUpXG4gICAqICAgLm9uKCdkcmFnbW92ZScsIGZ1bmN0aW9uIChldmVudCkge1xuICAgKiAgICAgaWYgKHNvbWVDb25kaXRpb24pIHtcbiAgICogICAgICAgLy8gY2hhbmdlIHRoZSBzbmFwIHNldHRpbmdzXG4gICAqICAgICAgIGV2ZW50LmludGVyYWN0YWJsZS5kcmFnZ2FibGUoeyBzbmFwOiB7IHRhcmdldHM6IFtdIH19KTtcbiAgICogICAgICAgLy8gZmlyZSBhbm90aGVyIG1vdmUgZXZlbnQgd2l0aCByZS1jYWxjdWxhdGVkIHNuYXBcbiAgICogICAgICAgZXZlbnQuaW50ZXJhY3Rpb24ubW92ZSgpO1xuICAgKiAgICAgfVxuICAgKiAgIH0pO1xuICAgKiBgYGBcbiAgICpcbiAgICogRm9yY2UgYSBtb3ZlIG9mIHRoZSBjdXJyZW50IGFjdGlvbiBhdCB0aGUgc2FtZSBjb29yZGluYXRlcy4gVXNlZnVsIGlmXG4gICAqIHNuYXAvcmVzdHJpY3QgaGFzIGJlZW4gY2hhbmdlZCBhbmQgeW91IHdhbnQgYSBtb3ZlbWVudCB3aXRoIHRoZSBuZXdcbiAgICogc2V0dGluZ3MuXG4gICAqL1xuICBtb3ZlIChzaWduYWxBcmc/KSB7XG4gICAgc2lnbmFsQXJnID0gdXRpbHMuZXh0ZW5kKHtcbiAgICAgIHBvaW50ZXI6IHRoaXMuX2xhdGVzdFBvaW50ZXIucG9pbnRlcixcbiAgICAgIGV2ZW50OiB0aGlzLl9sYXRlc3RQb2ludGVyLmV2ZW50LFxuICAgICAgZXZlbnRUYXJnZXQ6IHRoaXMuX2xhdGVzdFBvaW50ZXIuZXZlbnRUYXJnZXQsXG4gICAgICBpbnRlcmFjdGlvbjogdGhpcyxcbiAgICAgIG5vQmVmb3JlOiBmYWxzZSxcbiAgICB9LCBzaWduYWxBcmcgfHwge30pXG5cbiAgICBzaWduYWxBcmcucGhhc2UgPSBFdmVudFBoYXNlLk1vdmVcblxuICAgIHRoaXMuX2RvUGhhc2Uoc2lnbmFsQXJnKVxuICB9XG5cbiAgLy8gRW5kIGludGVyYWN0IG1vdmUgZXZlbnRzIGFuZCBzdG9wIGF1dG8tc2Nyb2xsIHVubGVzcyBzaW11bGF0aW9uIGlzIHJ1bm5pbmdcbiAgcG9pbnRlclVwIChwb2ludGVyOiBJbnRlcmFjdC5Qb2ludGVyVHlwZSwgZXZlbnQ6IEludGVyYWN0LlBvaW50ZXJFdmVudFR5cGUsIGV2ZW50VGFyZ2V0OiBFdmVudFRhcmdldCwgY3VyRXZlbnRUYXJnZXQ6IEV2ZW50VGFyZ2V0KSB7XG4gICAgbGV0IHBvaW50ZXJJbmRleCA9IHRoaXMuZ2V0UG9pbnRlckluZGV4KHBvaW50ZXIpXG5cbiAgICBpZiAocG9pbnRlckluZGV4ID09PSAtMSkge1xuICAgICAgcG9pbnRlckluZGV4ID0gdGhpcy51cGRhdGVQb2ludGVyKHBvaW50ZXIsIGV2ZW50LCBldmVudFRhcmdldCwgZmFsc2UpXG4gICAgfVxuXG4gICAgdGhpcy5fc2lnbmFscy5maXJlKC9jYW5jZWwkL2kudGVzdChldmVudC50eXBlKSA/ICdjYW5jZWwnIDogJ3VwJywge1xuICAgICAgcG9pbnRlcixcbiAgICAgIHBvaW50ZXJJbmRleCxcbiAgICAgIGV2ZW50LFxuICAgICAgZXZlbnRUYXJnZXQsXG4gICAgICBjdXJFdmVudFRhcmdldCxcbiAgICAgIGludGVyYWN0aW9uOiB0aGlzLFxuICAgIH0pXG5cbiAgICBpZiAoIXRoaXMuc2ltdWxhdGlvbikge1xuICAgICAgdGhpcy5lbmQoZXZlbnQpXG4gICAgfVxuXG4gICAgdGhpcy5wb2ludGVySXNEb3duID0gZmFsc2VcbiAgICB0aGlzLnJlbW92ZVBvaW50ZXIocG9pbnRlciwgZXZlbnQpXG4gIH1cblxuICBkb2N1bWVudEJsdXIgKGV2ZW50KSB7XG4gICAgdGhpcy5lbmQoZXZlbnQpXG4gICAgdGhpcy5fc2lnbmFscy5maXJlKCdibHVyJywgeyBldmVudCwgaW50ZXJhY3Rpb246IHRoaXMgfSlcbiAgfVxuXG4gIC8qKlxuICAgKiBgYGBqc1xuICAgKiBpbnRlcmFjdCh0YXJnZXQpXG4gICAqICAgLmRyYWdnYWJsZSh0cnVlKVxuICAgKiAgIC5vbignbW92ZScsIGZ1bmN0aW9uIChldmVudCkge1xuICAgKiAgICAgaWYgKGV2ZW50LnBhZ2VYID4gMTAwMCkge1xuICAgKiAgICAgICAvLyBlbmQgdGhlIGN1cnJlbnQgYWN0aW9uXG4gICAqICAgICAgIGV2ZW50LmludGVyYWN0aW9uLmVuZCgpO1xuICAgKiAgICAgICAvLyBzdG9wIGFsbCBmdXJ0aGVyIGxpc3RlbmVycyBmcm9tIGJlaW5nIGNhbGxlZFxuICAgKiAgICAgICBldmVudC5zdG9wSW1tZWRpYXRlUHJvcGFnYXRpb24oKTtcbiAgICogICAgIH1cbiAgICogICB9KTtcbiAgICogYGBgXG4gICAqXG4gICAqIEBwYXJhbSB7UG9pbnRlckV2ZW50fSBbZXZlbnRdXG4gICAqL1xuICBlbmQgKGV2ZW50PzogSW50ZXJhY3QuUG9pbnRlckV2ZW50VHlwZSkge1xuICAgIHRoaXMuX2VuZGluZyA9IHRydWVcbiAgICBldmVudCA9IGV2ZW50IHx8IHRoaXMuX2xhdGVzdFBvaW50ZXIuZXZlbnRcbiAgICBsZXQgZW5kUGhhc2VSZXN1bHRcblxuICAgIGlmICh0aGlzLmludGVyYWN0aW5nKCkpIHtcbiAgICAgIGVuZFBoYXNlUmVzdWx0ID0gdGhpcy5fZG9QaGFzZSh7XG4gICAgICAgIGV2ZW50LFxuICAgICAgICBpbnRlcmFjdGlvbjogdGhpcyxcbiAgICAgICAgcGhhc2U6IEV2ZW50UGhhc2UuRW5kLFxuICAgICAgfSlcbiAgICB9XG5cbiAgICB0aGlzLl9lbmRpbmcgPSBmYWxzZVxuXG4gICAgaWYgKGVuZFBoYXNlUmVzdWx0ID09PSB0cnVlKSB7XG4gICAgICB0aGlzLnN0b3AoKVxuICAgIH1cbiAgfVxuXG4gIGN1cnJlbnRBY3Rpb24gKCkge1xuICAgIHJldHVybiB0aGlzLl9pbnRlcmFjdGluZyA/IHRoaXMucHJlcGFyZWQubmFtZSA6IG51bGxcbiAgfVxuXG4gIGludGVyYWN0aW5nICgpIHtcbiAgICByZXR1cm4gdGhpcy5faW50ZXJhY3RpbmdcbiAgfVxuXG4gIC8qKiAqL1xuICBzdG9wICgpIHtcbiAgICB0aGlzLl9zaWduYWxzLmZpcmUoJ3N0b3AnLCB7IGludGVyYWN0aW9uOiB0aGlzIH0pXG5cbiAgICB0aGlzLmludGVyYWN0YWJsZSA9IHRoaXMuZWxlbWVudCA9IG51bGxcblxuICAgIHRoaXMuX2ludGVyYWN0aW5nID0gZmFsc2VcbiAgICB0aGlzLnByZXBhcmVkLm5hbWUgPSB0aGlzLnByZXZFdmVudCA9IG51bGxcbiAgfVxuXG4gIGdldFBvaW50ZXJJbmRleCAocG9pbnRlcikge1xuICAgIGNvbnN0IHBvaW50ZXJJZCA9IHV0aWxzLnBvaW50ZXIuZ2V0UG9pbnRlcklkKHBvaW50ZXIpXG5cbiAgICAvLyBtb3VzZSBhbmQgcGVuIGludGVyYWN0aW9ucyBtYXkgaGF2ZSBvbmx5IG9uZSBwb2ludGVyXG4gICAgcmV0dXJuICh0aGlzLnBvaW50ZXJUeXBlID09PSAnbW91c2UnIHx8IHRoaXMucG9pbnRlclR5cGUgPT09ICdwZW4nKVxuICAgICAgPyB0aGlzLnBvaW50ZXJzLmxlbmd0aCAtIDFcbiAgICAgIDogdXRpbHMuYXJyLmZpbmRJbmRleCh0aGlzLnBvaW50ZXJzLCAoY3VyUG9pbnRlcikgPT4gY3VyUG9pbnRlci5pZCA9PT0gcG9pbnRlcklkKVxuICB9XG5cbiAgZ2V0UG9pbnRlckluZm8gKHBvaW50ZXIpIHtcbiAgICByZXR1cm4gdGhpcy5wb2ludGVyc1t0aGlzLmdldFBvaW50ZXJJbmRleChwb2ludGVyKV1cbiAgfVxuXG4gIHVwZGF0ZVBvaW50ZXIgKHBvaW50ZXI6IEludGVyYWN0LlBvaW50ZXJUeXBlLCBldmVudDogSW50ZXJhY3QuUG9pbnRlckV2ZW50VHlwZSwgZXZlbnRUYXJnZXQ6IEV2ZW50VGFyZ2V0LCBkb3duPzogYm9vbGVhbikge1xuICAgIGNvbnN0IGlkID0gdXRpbHMucG9pbnRlci5nZXRQb2ludGVySWQocG9pbnRlcilcbiAgICBsZXQgcG9pbnRlckluZGV4ID0gdGhpcy5nZXRQb2ludGVySW5kZXgocG9pbnRlcilcbiAgICBsZXQgcG9pbnRlckluZm8gPSB0aGlzLnBvaW50ZXJzW3BvaW50ZXJJbmRleF1cblxuICAgIGRvd24gPSBkb3duID09PSBmYWxzZVxuICAgICAgPyBmYWxzZVxuICAgICAgOiBkb3duIHx8IC8oZG93bnxzdGFydCkkL2kudGVzdChldmVudC50eXBlKVxuXG4gICAgaWYgKCFwb2ludGVySW5mbykge1xuICAgICAgcG9pbnRlckluZm8gPSBuZXcgUG9pbnRlckluZm8oXG4gICAgICAgIGlkLFxuICAgICAgICBwb2ludGVyLFxuICAgICAgICBldmVudCxcbiAgICAgICAgbnVsbCxcbiAgICAgICAgbnVsbCxcbiAgICAgIClcblxuICAgICAgcG9pbnRlckluZGV4ID0gdGhpcy5wb2ludGVycy5sZW5ndGhcbiAgICAgIHRoaXMucG9pbnRlcnMucHVzaChwb2ludGVySW5mbylcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICBwb2ludGVySW5mby5wb2ludGVyID0gcG9pbnRlclxuICAgIH1cblxuICAgIGlmIChkb3duKSB7XG4gICAgICB0aGlzLnBvaW50ZXJJc0Rvd24gPSB0cnVlXG5cbiAgICAgIGlmICghdGhpcy5pbnRlcmFjdGluZygpKSB7XG4gICAgICAgIHV0aWxzLnBvaW50ZXIuc2V0Q29vcmRzKHRoaXMuY29vcmRzLnN0YXJ0LCB0aGlzLnBvaW50ZXJzLm1hcCgocCkgPT4gcC5wb2ludGVyKSlcblxuICAgICAgICB1dGlscy5wb2ludGVyLmNvcHlDb29yZHModGhpcy5jb29yZHMuY3VyLCB0aGlzLmNvb3Jkcy5zdGFydClcbiAgICAgICAgdXRpbHMucG9pbnRlci5jb3B5Q29vcmRzKHRoaXMuY29vcmRzLnByZXYsIHRoaXMuY29vcmRzLnN0YXJ0KVxuICAgICAgICB1dGlscy5wb2ludGVyLnBvaW50ZXJFeHRlbmQodGhpcy5kb3duUG9pbnRlciwgcG9pbnRlcilcblxuICAgICAgICB0aGlzLmRvd25FdmVudCA9IGV2ZW50XG4gICAgICAgIHBvaW50ZXJJbmZvLmRvd25UaW1lID0gdGhpcy5jb29yZHMuY3VyLnRpbWVTdGFtcFxuICAgICAgICBwb2ludGVySW5mby5kb3duVGFyZ2V0ID0gZXZlbnRUYXJnZXRcblxuICAgICAgICB0aGlzLnBvaW50ZXJXYXNNb3ZlZCA9IGZhbHNlXG4gICAgICB9XG4gICAgfVxuXG4gICAgdGhpcy5fdXBkYXRlTGF0ZXN0UG9pbnRlcihwb2ludGVyLCBldmVudCwgZXZlbnRUYXJnZXQpXG5cbiAgICB0aGlzLl9zaWduYWxzLmZpcmUoJ3VwZGF0ZS1wb2ludGVyJywge1xuICAgICAgcG9pbnRlcixcbiAgICAgIGV2ZW50LFxuICAgICAgZXZlbnRUYXJnZXQsXG4gICAgICBkb3duLFxuICAgICAgcG9pbnRlckluZm8sXG4gICAgICBwb2ludGVySW5kZXgsXG4gICAgICBpbnRlcmFjdGlvbjogdGhpcyxcbiAgICB9KVxuXG4gICAgcmV0dXJuIHBvaW50ZXJJbmRleFxuICB9XG5cbiAgcmVtb3ZlUG9pbnRlciAocG9pbnRlciwgZXZlbnQpIHtcbiAgICBjb25zdCBwb2ludGVySW5kZXggPSB0aGlzLmdldFBvaW50ZXJJbmRleChwb2ludGVyKVxuXG4gICAgaWYgKHBvaW50ZXJJbmRleCA9PT0gLTEpIHsgcmV0dXJuIH1cblxuICAgIGNvbnN0IHBvaW50ZXJJbmZvID0gdGhpcy5wb2ludGVyc1twb2ludGVySW5kZXhdXG5cbiAgICB0aGlzLl9zaWduYWxzLmZpcmUoJ3JlbW92ZS1wb2ludGVyJywge1xuICAgICAgcG9pbnRlcixcbiAgICAgIGV2ZW50LFxuICAgICAgcG9pbnRlckluZGV4LFxuICAgICAgcG9pbnRlckluZm8sXG4gICAgICBpbnRlcmFjdGlvbjogdGhpcyxcbiAgICB9KVxuXG4gICAgdGhpcy5wb2ludGVycy5zcGxpY2UocG9pbnRlckluZGV4LCAxKVxuICB9XG5cbiAgX3VwZGF0ZUxhdGVzdFBvaW50ZXIgKHBvaW50ZXIsIGV2ZW50LCBldmVudFRhcmdldCkge1xuICAgIHRoaXMuX2xhdGVzdFBvaW50ZXIucG9pbnRlciA9IHBvaW50ZXJcbiAgICB0aGlzLl9sYXRlc3RQb2ludGVyLmV2ZW50ID0gZXZlbnRcbiAgICB0aGlzLl9sYXRlc3RQb2ludGVyLmV2ZW50VGFyZ2V0ID0gZXZlbnRUYXJnZXRcbiAgfVxuXG4gIF9jcmVhdGVQcmVwYXJlZEV2ZW50IChldmVudDogSW50ZXJhY3QuUG9pbnRlckV2ZW50VHlwZSwgcGhhc2U6IEV2ZW50UGhhc2UsIHByZUVuZDogYm9vbGVhbiwgdHlwZTogc3RyaW5nKSB7XG4gICAgY29uc3QgYWN0aW9uTmFtZSA9IHRoaXMucHJlcGFyZWQubmFtZVxuXG4gICAgcmV0dXJuIG5ldyBJbnRlcmFjdEV2ZW50KHRoaXMsIGV2ZW50LCBhY3Rpb25OYW1lLCBwaGFzZSwgdGhpcy5lbGVtZW50LCBudWxsLCBwcmVFbmQsIHR5cGUpXG4gIH1cblxuICBfZmlyZUV2ZW50IChpRXZlbnQpIHtcbiAgICB0aGlzLmludGVyYWN0YWJsZS5maXJlKGlFdmVudClcblxuICAgIGlmICghdGhpcy5wcmV2RXZlbnQgfHwgaUV2ZW50LnRpbWVTdGFtcCA+PSB0aGlzLnByZXZFdmVudC50aW1lU3RhbXApIHtcbiAgICAgIHRoaXMucHJldkV2ZW50ID0gaUV2ZW50XG4gICAgfVxuICB9XG5cbiAgX2RvUGhhc2UgKHNpZ25hbEFyZzogUGFydGlhbDxJbnRlcmFjdC5TaWduYWxBcmc+KSB7XG4gICAgY29uc3QgeyBldmVudCwgcGhhc2UsIHByZUVuZCwgdHlwZSB9ID0gc2lnbmFsQXJnXG5cbiAgICBpZiAoIXNpZ25hbEFyZy5ub0JlZm9yZSkge1xuICAgICAgY29uc3QgYmVmb3JlUmVzdWx0ID0gdGhpcy5fc2lnbmFscy5maXJlKGBiZWZvcmUtYWN0aW9uLSR7cGhhc2V9YCwgc2lnbmFsQXJnKVxuXG4gICAgICBpZiAoYmVmb3JlUmVzdWx0ID09PSBmYWxzZSkge1xuICAgICAgICByZXR1cm4gZmFsc2VcbiAgICAgIH1cbiAgICB9XG5cbiAgICBjb25zdCBpRXZlbnQgPSBzaWduYWxBcmcuaUV2ZW50ID0gdGhpcy5fY3JlYXRlUHJlcGFyZWRFdmVudChldmVudCwgcGhhc2UsIHByZUVuZCwgdHlwZSlcblxuICAgIHRoaXMuX3NpZ25hbHMuZmlyZShgYWN0aW9uLSR7cGhhc2V9YCwgc2lnbmFsQXJnKVxuXG4gICAgdGhpcy5fZmlyZUV2ZW50KGlFdmVudClcblxuICAgIHRoaXMuX3NpZ25hbHMuZmlyZShgYWZ0ZXItYWN0aW9uLSR7cGhhc2V9YCwgc2lnbmFsQXJnKVxuXG4gICAgcmV0dXJuIHRydWVcbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBJbnRlcmFjdGlvblxuZXhwb3J0IHsgUG9pbnRlckluZm8gfVxuIl19