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
    start(action, interactable, element) {
        if (this.interacting() ||
            !this.pointerIsDown ||
            this.pointers.length < (action.name === ActionName.Gesture ? 2 : 1) ||
            !interactable.options[action.name].enabled) {
            return;
        }
        utils.copyAction(this.prepared, action);
        this.interactable = interactable;
        this.element = element;
        this.rect = interactable.getRect(element);
        this.edges = this.prepared.edges;
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
        const { rect } = this;
        if (rect) {
            // update the rect modifications
            const edges = this.edges || this.prepared.edges || { left: true, right: true, top: true, bottom: true };
            if (edges.top) {
                rect.top += iEvent.delta.y;
            }
            if (edges.bottom) {
                rect.bottom += iEvent.delta.y;
            }
            if (edges.left) {
                rect.left += iEvent.delta.x;
            }
            if (edges.right) {
                rect.right += iEvent.delta.x;
            }
        }
        this._signals.fire(`action-${phase}`, signalArg);
        this._fireEvent(iEvent);
        this._signals.fire(`after-action-${phase}`, signalArg);
        return true;
    }
}
export default Interaction;
export { PointerInfo };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiSW50ZXJhY3Rpb24uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJJbnRlcmFjdGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEtBQUssS0FBSyxNQUFNLG1CQUFtQixDQUFBO0FBRTFDLE9BQU8sYUFBYSxFQUFFLEVBQUUsVUFBVSxFQUFFLE1BQU0saUJBQWlCLENBQUE7QUFDM0QsT0FBTyxXQUFXLE1BQU0sZUFBZSxDQUFBO0FBQ3ZDLE9BQU8sRUFBRSxVQUFVLEVBQUUsTUFBTSxTQUFTLENBQUE7QUFjcEMsTUFBTSxPQUFPLFdBQVc7SUE0RXRCLE1BQU07SUFDTixZQUFhLEVBQUUsV0FBVyxFQUFFLE9BQU8sRUFBb0Q7UUE1RXZGLDZDQUE2QztRQUM3QyxpQkFBWSxHQUFpQixJQUFJLENBQUE7UUFFakMseUNBQXlDO1FBQ3pDLFlBQU8sR0FBWSxJQUFJLENBQUE7UUFRdkIscURBQXFEO1FBQ3JELGFBQVEsR0FBbUI7WUFDekIsSUFBSSxFQUFHLElBQUk7WUFDWCxJQUFJLEVBQUcsSUFBSTtZQUNYLEtBQUssRUFBRSxJQUFJO1NBQ1osQ0FBQTtRQUlELCtCQUErQjtRQUMvQixhQUFRLEdBQWtCLEVBQUUsQ0FBQTtRQUU1Qix5Q0FBeUM7UUFDekMsY0FBUyxHQUE4QixJQUFJLENBQUE7UUFFM0MsZ0JBQVcsR0FBeUIsRUFBMEIsQ0FBQTtRQUU5RCxtQkFBYyxHQUlWO1lBQ0YsT0FBTyxFQUFFLElBQUk7WUFDYixLQUFLLEVBQUUsSUFBSTtZQUNYLFdBQVcsRUFBRSxJQUFJO1NBQ2xCLENBQUE7UUFFRCx3QkFBd0I7UUFDeEIsY0FBUyxHQUFxQixJQUFJLENBQUE7UUFFbEMsa0JBQWEsR0FBRyxLQUFLLENBQUE7UUFDckIsb0JBQWUsR0FBRyxLQUFLLENBQUE7UUFDdkIsaUJBQVksR0FBRyxLQUFLLENBQUE7UUFDcEIsWUFBTyxHQUFHLEtBQUssQ0FBQTtRQUVmLGVBQVUsR0FBRyxJQUFJLENBQUE7UUFNakI7O1dBRUc7UUFD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LE9BQU8sSUFBSSxDQUFBO0lBQ2IsQ0FBQztDQUNGO0FBRUQsZUFBZSxXQUFXLENBQUE7QUFDMUIsT0FBTyxFQUFFLFdBQVcsRUFBRSxDQUFBIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgdXRpbHMgZnJvbSAnQGludGVyYWN0anMvdXRpbHMnXG5pbXBvcnQgSW50ZXJhY3RhYmxlIGZyb20gJy4vSW50ZXJhY3RhYmxlJ1xuaW1wb3J0IEludGVyYWN0RXZlbnQsIHsgRXZlbnRQaGFzZSB9IGZyb20gJy4vSW50ZXJhY3RFdmVudCdcbmltcG9ydCBQb2ludGVySW5mbyBmcm9tICcuL1BvaW50ZXJJbmZvJ1xuaW1wb3J0IHsgQWN0aW9uTmFtZSB9IGZyb20gJy4vc2NvcGUnXG5cbmV4cG9ydCBpbnRlcmZhY2UgQWN0aW9uUHJvcHM8VCBleHRlbmRzIEFjdGlvbk5hbWUgPSBhbnk+IHtcbiAgbmFtZTogVFxuICBheGlzPzogJ3gnIHwgJ3knIHwgJ3h5J1xuICBlZGdlcz86IHtcbiAgICBbZWRnZSBpbiBrZXlvZiBJbnRlcmFjdC5SZWN0XT86IGJvb2xlYW5cbiAgfVxufVxuXG5leHBvcnQgaW50ZXJmYWNlIFN0YXJ0QWN0aW9uIGV4dGVuZHMgQWN0aW9uUHJvcHMge1xuICBuYW1lOiBBY3Rpb25OYW1lIHwgc3RyaW5nXG59XG5cbmV4cG9ydCBjbGFzcyBJbnRlcmFjdGlvbjxUIGV4dGVuZHMgQWN0aW9uTmFtZSA9IGFueT4ge1xuICAvLyBjdXJyZW50IGludGVyYWN0YWJsZSBiZWluZyBpbnRlcmFjdGVkIHdpdGhcbiAgaW50ZXJhY3RhYmxlOiBJbnRlcmFjdGFibGUgPSBudWxsXG5cbiAgLy8gdGhlIHRhcmdldCBlbGVtZW50IG9mIHRoZSBpbnRlcmFjdGFibGVcbiAgZWxlbWVudDogRWxlbWVudCA9IG51bGxcbiAgcmVjdDogSW50ZXJhY3QuUmVjdCAmIEludGVyYWN0LlJlY3QzXG4gIGVkZ2VzOiB7XG4gICAgW1AgaW4ga2V5b2YgSW50ZXJhY3QuUmVjdF0/OiBib29sZWFuXG4gIH1cblxuICBfc2lnbmFsczogdXRpbHMuU2lnbmFsc1xuXG4gIC8vIGFjdGlvbiB0aGF0J3MgcmVhZHkgdG8gYmUgZmlyZWQgb24gbmV4dCBtb3ZlIGV2ZW50XG4gIHByZXBhcmVkOiBBY3Rpb25Qcm9wczxUPiA9IHtcbiAgICBuYW1lIDogbnVsbCxcbiAgICBheGlzIDogbnVsbCxcbiAgICBlZGdlczogbnVsbCxcbiAgfVxuXG4gIHBvaW50ZXJUeXBlOiBzdHJpbmdcblxuICAvLyBrZWVwIHRyYWNrIG9mIGFkZGVkIHBvaW50ZXJzXG4gIHBvaW50ZXJzOiBQb2ludGVySW5mb1tdID0gW11cblxuICAvLyBwb2ludGVyZG93bi9tb3VzZWRvd24vdG91Y2hzdGFydCBldmVudFxuICBkb3duRXZlbnQ6IEludGVyYWN0LlBvaW50ZXJFdmVudFR5cGUgPSBudWxsXG5cbiAgZG93blBvaW50ZXI6IEludGVyYWN0LlBvaW50ZXJUeXBlID0ge30gYXMgSW50ZXJhY3QuUG9pbnRlclR5cGVcblxuICBfbGF0ZXN0UG9pbnRlcjoge1xuICAgIHBvaW50ZXI6IEV2ZW50VGFyZ2V0XG4gICAgZXZlbnQ6IEludGVyYWN0LlBvaW50ZXJFdmVudFR5cGVcbiAgICBldmVudFRhcmdldDogTm9kZSxcbiAgfSA9IHtcbiAgICBwb2ludGVyOiBudWxsLFxuICAgIGV2ZW50OiBudWxsLFxuICAgIGV2ZW50VGFyZ2V0OiBudWxsLFxuICB9XG5cbiAgLy8gcHJldmlvdXMgYWN0aW9uIGV2ZW50XG4gIHByZXZFdmVudDogSW50ZXJhY3RFdmVudDxUPiA9IG51bGxcblxuICBwb2ludGVySXNEb3duID0gZmFsc2VcbiAgcG9pbnRlcldhc01vdmVkID0gZmFsc2VcbiAgX2ludGVyYWN0aW5nID0gZmFsc2VcbiAgX2VuZGluZyA9IGZhbHNlXG5cbiAgc2ltdWxhdGlvbiA9IG51bGxcblxuICBnZXQgcG9pbnRlck1vdmVUb2xlcmFuY2UgKCkge1xuICAgIHJldHVybiAxXG4gIH1cblxuICAvKipcbiAgICogQGFsaWFzIEludGVyYWN0aW9uLnByb3RvdHlwZS5tb3ZlXG4gICAqL1xuICBkb01vdmUgPSB1dGlscy53YXJuT25jZShcbiAgICBmdW5jdGlvbiAodGhpczogSW50ZXJhY3Rpb24sIHNpZ25hbEFyZzogYW55KSB7XG4gICAgICB0aGlzLm1vdmUoc2lnbmFsQXJnKVxuICAgIH0sXG4gICAgJ1RoZSBpbnRlcmFjdGlvbi5kb01vdmUoKSBtZXRob2QgaGFzIGJlZW4gcmVuYW1lZCB0byBpbnRlcmFjdGlvbi5tb3ZlKCknKVxuXG4gIGNvb3JkcyA9IHtcbiAgICAvLyBTdGFydGluZyBJbnRlcmFjdEV2ZW50IHBvaW50ZXIgY29vcmRpbmF0ZXNcbiAgICBzdGFydDogdXRpbHMucG9pbnRlci5uZXdDb29yZHMoKSxcbiAgICAvLyBQcmV2aW91cyBuYXRpdmUgcG9pbnRlciBtb3ZlIGV2ZW50IGNvb3JkaW5hdGVzXG4gICAgcHJldjogdXRpbHMucG9pbnRlci5uZXdDb29yZHMoKSxcbiAgICAvLyBjdXJyZW50IG5hdGl2ZSBwb2ludGVyIG1vdmUgZXZlbnQgY29vcmRpbmF0ZXNcbiAgICBjdXI6IHV0aWxzLnBvaW50ZXIubmV3Q29vcmRzKCksXG4gICAgLy8gQ2hhbmdlIGluIGNvb3JkaW5hdGVzIGFuZCB0aW1lIG9mIHRoZSBwb2ludGVyXG4gICAgZGVsdGE6IHV0aWxzLnBvaW50ZXIubmV3Q29vcmRzKCksXG4gICAgLy8gcG9pbnRlciB2ZWxvY2l0eVxuICAgIHZlbG9jaXR5OiB1dGlscy5wb2ludGVyLm5ld0Nvb3JkcygpLFxuICB9XG5cbiAgLyoqICovXG4gIGNvbnN0cnVjdG9yICh7IHBvaW50ZXJUeXBlLCBzaWduYWxzIH06IHsgcG9pbnRlclR5cGU/OiBzdHJpbmcsIHNpZ25hbHM6IHV0aWxzLlNpZ25hbHMgfSkge1xuICAgIHRoaXMuX3NpZ25hbHMgPSBzaWduYWxzXG4gICAgdGhpcy5wb2ludGVyVHlwZSA9IHBvaW50ZXJUeXBlXG5cbiAgICB0aGlzLl9zaWduYWxzLmZpcmUoJ25ldycsIHsgaW50ZXJhY3Rpb246IHRoaXMgfSlcbiAgfVxuXG4gIHBvaW50ZXJEb3duIChwb2ludGVyOiBJbnRlcmFjdC5Qb2ludGVyVHlwZSwgZXZlbnQ6IEludGVyYWN0LlBvaW50ZXJFdmVudFR5cGUsIGV2ZW50VGFyZ2V0OiBFdmVudFRhcmdldCkge1xuICAgIGNvbnN0IHBvaW50ZXJJbmRleCA9IHRoaXMudXBkYXRlUG9pbnRlcihwb2ludGVyLCBldmVudCwgZXZlbnRUYXJnZXQsIHRydWUpXG5cbiAgICB0aGlzLl9zaWduYWxzLmZpcmUoJ2Rvd24nLCB7XG4gICAgICBwb2ludGVyLFxuICAgICAgZXZlbnQsXG4gICAgICBldmVudFRhcmdldCxcbiAgICAgIHBvaW50ZXJJbmRleCxcbiAgICAgIGludGVyYWN0aW9uOiB0aGlzLFxuICAgIH0pXG4gIH1cblxuICAvKipcbiAgICogYGBganNcbiAgICogaW50ZXJhY3QodGFyZ2V0KVxuICAgKiAgIC5kcmFnZ2FibGUoe1xuICAgKiAgICAgLy8gZGlzYWJsZSB0aGUgZGVmYXVsdCBkcmFnIHN0YXJ0IGJ5IGRvd24tPm1vdmVcbiAgICogICAgIG1hbnVhbFN0YXJ0OiB0cnVlXG4gICAqICAgfSlcbiAgICogICAvLyBzdGFydCBkcmFnZ2luZyBhZnRlciB0aGUgdXNlciBob2xkcyB0aGUgcG9pbnRlciBkb3duXG4gICAqICAgLm9uKCdob2xkJywgZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAqICAgICB2YXIgaW50ZXJhY3Rpb24gPSBldmVudC5pbnRlcmFjdGlvbjtcbiAgICpcbiAgICogICAgIGlmICghaW50ZXJhY3Rpb24uaW50ZXJhY3RpbmcoKSkge1xuICAgKiAgICAgICBpbnRlcmFjdGlvbi5zdGFydCh7IG5hbWU6ICdkcmFnJyB9LFxuICAgKiAgICAgICAgICAgICAgICAgICAgICAgICBldmVudC5pbnRlcmFjdGFibGUsXG4gICAqICAgICAgICAgICAgICAgICAgICAgICAgIGV2ZW50LmN1cnJlbnRUYXJnZXQpO1xuICAgKiAgICAgfVxuICAgKiB9KTtcbiAgICogYGBgXG4gICAqXG4gICAqIFN0YXJ0IGFuIGFjdGlvbiB3aXRoIHRoZSBnaXZlbiBJbnRlcmFjdGFibGUgYW5kIEVsZW1lbnQgYXMgdGFydGdldHMuIFRoZVxuICAgKiBhY3Rpb24gbXVzdCBiZSBlbmFibGVkIGZvciB0aGUgdGFyZ2V0IEludGVyYWN0YWJsZSBhbmQgYW4gYXBwcm9wcmlhdGVcbiAgICogbnVtYmVyIG9mIHBvaW50ZXJzIG11c3QgYmUgaGVsZCBkb3duIC0gMSBmb3IgZHJhZy9yZXNpemUsIDIgZm9yIGdlc3R1cmUuXG4gICAqXG4gICAqIFVzZSBpdCB3aXRoIGBpbnRlcmFjdGFibGUuPGFjdGlvbj5hYmxlKHsgbWFudWFsU3RhcnQ6IGZhbHNlIH0pYCB0byBhbHdheXNcbiAgICogW3N0YXJ0IGFjdGlvbnMgbWFudWFsbHldKGh0dHBzOi8vZ2l0aHViLmNvbS90YXllL2ludGVyYWN0LmpzL2lzc3Vlcy8xMTQpXG4gICAqXG4gICAqIEBwYXJhbSB7b2JqZWN0fSBhY3Rpb24gICBUaGUgYWN0aW9uIHRvIGJlIHBlcmZvcm1lZCAtIGRyYWcsIHJlc2l6ZSwgZXRjLlxuICAgKiBAcGFyYW0ge0ludGVyYWN0YWJsZX0gdGFyZ2V0ICBUaGUgSW50ZXJhY3RhYmxlIHRvIHRhcmdldFxuICAgKiBAcGFyYW0ge0VsZW1lbnR9IGVsZW1lbnQgVGhlIERPTSBFbGVtZW50IHRvIHRhcmdldFxuICAgKiBAcmV0dXJuIHtvYmplY3R9IGludGVyYWN0XG4gICAqL1xuICBzdGFydCAoYWN0aW9uOiBTdGFydEFjdGlvbiwgaW50ZXJhY3RhYmxlOiBJbnRlcmFjdGFibGUsIGVsZW1lbnQ6IEVsZW1lbnQpIHtcbiAgICBpZiAodGhpcy5pbnRlcmFjdGluZygpIHx8XG4gICAgICAgICF0aGlzLnBvaW50ZXJJc0Rvd24gfHxcbiAgICAgICAgdGhpcy5wb2ludGVycy5sZW5ndGggPCAoYWN0aW9uLm5hbWUgPT09IEFjdGlvbk5hbWUuR2VzdHVyZSA/IDIgOiAxKSB8fFxuICAgICAgICAhaW50ZXJhY3RhYmxlLm9wdGlvbnNbYWN0aW9uLm5hbWVdLmVuYWJsZWQpIHtcbiAgICAgIHJldHVyblxuICAgIH1cblxuICAgIHV0aWxzLmNvcHlBY3Rpb24odGhpcy5wcmVwYXJlZCwgYWN0aW9uKVxuXG4gICAgdGhpcy5pbnRlcmFjdGFibGUgPSBpbnRlcmFjdGFibGVcbiAgICB0aGlzLmVsZW1lbnQgICAgICA9IGVsZW1lbnRcbiAgICB0aGlzLnJlY3QgICAgICAgICA9IGludGVyYWN0YWJsZS5nZXRSZWN0KGVsZW1lbnQpXG4gICAgdGhpcy5lZGdlcyAgICAgICAgPSB0aGlzLnByZXBhcmVkLmVkZ2VzXG4gICAgdGhpcy5faW50ZXJhY3RpbmcgPSB0aGlzLl9kb1BoYXNlKHtcbiAgICAgIGludGVyYWN0aW9uOiB0aGlzLFxuICAgICAgZXZlbnQ6IHRoaXMuZG93bkV2ZW50LFxuICAgICAgcGhhc2U6IEV2ZW50UGhhc2UuU3RhcnQsXG4gICAgfSlcbiAgfVxuXG4gIHBvaW50ZXJNb3ZlIChwb2ludGVyOiBJbnRlcmFjdC5Qb2ludGVyVHlwZSwgZXZlbnQ6IEludGVyYWN0LlBvaW50ZXJFdmVudFR5cGUsIGV2ZW50VGFyZ2V0OiBFdmVudFRhcmdldCkge1xuICAgIGlmICghdGhpcy5zaW11bGF0aW9uKSB7XG4gICAgICB0aGlzLnVwZGF0ZVBvaW50ZXIocG9pbnRlciwgZXZlbnQsIGV2ZW50VGFyZ2V0LCBmYWxzZSlcbiAgICAgIHV0aWxzLnBvaW50ZXIuc2V0Q29vcmRzKHRoaXMuY29vcmRzLmN1ciwgdGhpcy5wb2ludGVycy5tYXAoKHApID0+IHAucG9pbnRlcikpXG4gICAgfVxuXG4gICAgY29uc3QgZHVwbGljYXRlTW92ZSA9ICh0aGlzLmNvb3Jkcy5jdXIucGFnZS54ID09PSB0aGlzLmNvb3Jkcy5wcmV2LnBhZ2UueCAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5jb29yZHMuY3VyLnBhZ2UueSA9PT0gdGhpcy5jb29yZHMucHJldi5wYWdlLnkgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuY29vcmRzLmN1ci5jbGllbnQueCA9PT0gdGhpcy5jb29yZHMucHJldi5jbGllbnQueCAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5jb29yZHMuY3VyLmNsaWVudC55ID09PSB0aGlzLmNvb3Jkcy5wcmV2LmNsaWVudC55KVxuXG4gICAgbGV0IGR4XG4gICAgbGV0IGR5XG5cbiAgICAvLyByZWdpc3RlciBtb3ZlbWVudCBncmVhdGVyIHRoYW4gcG9pbnRlck1vdmVUb2xlcmFuY2VcbiAgICBpZiAodGhpcy5wb2ludGVySXNEb3duICYmICF0aGlzLnBvaW50ZXJXYXNNb3ZlZCkge1xuICAgICAgZHggPSB0aGlzLmNvb3Jkcy5jdXIuY2xpZW50LnggLSB0aGlzLmNvb3Jkcy5zdGFydC5jbGllbnQueFxuICAgICAgZHkgPSB0aGlzLmNvb3Jkcy5jdXIuY2xpZW50LnkgLSB0aGlzLmNvb3Jkcy5zdGFydC5jbGllbnQueVxuXG4gICAgICB0aGlzLnBvaW50ZXJXYXNNb3ZlZCA9IHV0aWxzLmh5cG90KGR4LCBkeSkgPiB0aGlzLnBvaW50ZXJNb3ZlVG9sZXJhbmNlXG4gICAgfVxuXG4gICAgY29uc3Qgc2lnbmFsQXJnID0ge1xuICAgICAgcG9pbnRlcixcbiAgICAgIHBvaW50ZXJJbmRleDogdGhpcy5nZXRQb2ludGVySW5kZXgocG9pbnRlciksXG4gICAgICBldmVudCxcbiAgICAgIGV2ZW50VGFyZ2V0LFxuICAgICAgZHgsXG4gICAgICBkeSxcbiAgICAgIGR1cGxpY2F0ZTogZHVwbGljYXRlTW92ZSxcbiAgICAgIGludGVyYWN0aW9uOiB0aGlzLFxuICAgIH1cblxuICAgIGlmICghZHVwbGljYXRlTW92ZSkge1xuICAgICAgLy8gc2V0IHBvaW50ZXIgY29vcmRpbmF0ZSwgdGltZSBjaGFuZ2VzIGFuZCB2ZWxvY2l0eVxuICAgICAgdXRpbHMucG9pbnRlci5zZXRDb29yZERlbHRhcyh0aGlzLmNvb3Jkcy5kZWx0YSwgdGhpcy5jb29yZHMucHJldiwgdGhpcy5jb29yZHMuY3VyKVxuICAgICAgdXRpbHMucG9pbnRlci5zZXRDb29yZFZlbG9jaXR5KHRoaXMuY29vcmRzLnZlbG9jaXR5LCB0aGlzLmNvb3Jkcy5kZWx0YSlcbiAgICB9XG5cbiAgICB0aGlzLl9zaWduYWxzLmZpcmUoJ21vdmUnLCBzaWduYWxBcmcpXG5cbiAgICBpZiAoIWR1cGxpY2F0ZU1vdmUpIHtcbiAgICAgIC8vIGlmIGludGVyYWN0aW5nLCBmaXJlIGFuICdhY3Rpb24tbW92ZScgc2lnbmFsIGV0Y1xuICAgICAgaWYgKHRoaXMuaW50ZXJhY3RpbmcoKSkge1xuICAgICAgICB0aGlzLm1vdmUoc2lnbmFsQXJnKVxuICAgICAgfVxuXG4gICAgICBpZiAodGhpcy5wb2ludGVyV2FzTW92ZWQpIHtcbiAgICAgICAgdXRpbHMucG9pbnRlci5jb3B5Q29vcmRzKHRoaXMuY29vcmRzLnByZXYsIHRoaXMuY29vcmRzLmN1cilcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogYGBganNcbiAgICogaW50ZXJhY3QodGFyZ2V0KVxuICAgKiAgIC5kcmFnZ2FibGUodHJ1ZSlcbiAgICogICAub24oJ2RyYWdtb3ZlJywgZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAqICAgICBpZiAoc29tZUNvbmRpdGlvbikge1xuICAgKiAgICAgICAvLyBjaGFuZ2UgdGhlIHNuYXAgc2V0dGluZ3NcbiAgICogICAgICAgZXZlbnQuaW50ZXJhY3RhYmxlLmRyYWdnYWJsZSh7IHNuYXA6IHsgdGFyZ2V0czogW10gfX0pO1xuICAgKiAgICAgICAvLyBmaXJlIGFub3RoZXIgbW92ZSBldmVudCB3aXRoIHJlLWNhbGN1bGF0ZWQgc25hcFxuICAgKiAgICAgICBldmVudC5pbnRlcmFjdGlvbi5tb3ZlKCk7XG4gICAqICAgICB9XG4gICAqICAgfSk7XG4gICAqIGBgYFxuICAgKlxuICAgKiBGb3JjZSBhIG1vdmUgb2YgdGhlIGN1cnJlbnQgYWN0aW9uIGF0IHRoZSBzYW1lIGNvb3JkaW5hdGVzLiBVc2VmdWwgaWZcbiAgICogc25hcC9yZXN0cmljdCBoYXMgYmVlbiBjaGFuZ2VkIGFuZCB5b3Ugd2FudCBhIG1vdmVtZW50IHdpdGggdGhlIG5ld1xuICAgKiBzZXR0aW5ncy5cbiAgICovXG4gIG1vdmUgKHNpZ25hbEFyZz8pIHtcbiAgICBzaWduYWxBcmcgPSB1dGlscy5leHRlbmQoe1xuICAgICAgcG9pbnRlcjogdGhpcy5fbGF0ZXN0UG9pbnRlci5wb2ludGVyLFxuICAgICAgZXZlbnQ6IHRoaXMuX2xhdGVzdFBvaW50ZXIuZXZlbnQsXG4gICAgICBldmVudFRhcmdldDogdGhpcy5fbGF0ZXN0UG9pbnRlci5ldmVudFRhcmdldCxcbiAgICAgIGludGVyYWN0aW9uOiB0aGlzLFxuICAgICAgbm9CZWZvcmU6IGZhbHNlLFxuICAgIH0sIHNpZ25hbEFyZyB8fCB7fSlcblxuICAgIHNpZ25hbEFyZy5waGFzZSA9IEV2ZW50UGhhc2UuTW92ZVxuXG4gICAgdGhpcy5fZG9QaGFzZShzaWduYWxBcmcpXG4gIH1cblxuICAvLyBFbmQgaW50ZXJhY3QgbW92ZSBldmVudHMgYW5kIHN0b3AgYXV0by1zY3JvbGwgdW5sZXNzIHNpbXVsYXRpb24gaXMgcnVubmluZ1xuICBwb2ludGVyVXAgKHBvaW50ZXI6IEludGVyYWN0LlBvaW50ZXJUeXBlLCBldmVudDogSW50ZXJhY3QuUG9pbnRlckV2ZW50VHlwZSwgZXZlbnRUYXJnZXQ6IEV2ZW50VGFyZ2V0LCBjdXJFdmVudFRhcmdldDogRXZlbnRUYXJnZXQpIHtcbiAgICBsZXQgcG9pbnRlckluZGV4ID0gdGhpcy5nZXRQb2ludGVySW5kZXgocG9pbnRlcilcblxuICAgIGlmIChwb2ludGVySW5kZXggPT09IC0xKSB7XG4gICAgICBwb2ludGVySW5kZXggPSB0aGlzLnVwZGF0ZVBvaW50ZXIocG9pbnRlciwgZXZlbnQsIGV2ZW50VGFyZ2V0LCBmYWxzZSlcbiAgICB9XG5cbiAgICB0aGlzLl9zaWduYWxzLmZpcmUoL2NhbmNlbCQvaS50ZXN0KGV2ZW50LnR5cGUpID8gJ2NhbmNlbCcgOiAndXAnLCB7XG4gICAgICBwb2ludGVyLFxuICAgICAgcG9pbnRlckluZGV4LFxuICAgICAgZXZlbnQsXG4gICAgICBldmVudFRhcmdldCxcbiAgICAgIGN1ckV2ZW50VGFyZ2V0LFxuICAgICAgaW50ZXJhY3Rpb246IHRoaXMsXG4gICAgfSlcblxuICAgIGlmICghdGhpcy5zaW11bGF0aW9uKSB7XG4gICAgICB0aGlzLmVuZChldmVudClcbiAgICB9XG5cbiAgICB0aGlzLnBvaW50ZXJJc0Rvd24gPSBmYWxzZVxuICAgIHRoaXMucmVtb3ZlUG9pbnRlcihwb2ludGVyLCBldmVudClcbiAgfVxuXG4gIGRvY3VtZW50Qmx1ciAoZXZlbnQpIHtcbiAgICB0aGlzLmVuZChldmVudClcbiAgICB0aGlzLl9zaWduYWxzLmZpcmUoJ2JsdXInLCB7IGV2ZW50LCBpbnRlcmFjdGlvbjogdGhpcyB9KVxuICB9XG5cbiAgLyoqXG4gICAqIGBgYGpzXG4gICAqIGludGVyYWN0KHRhcmdldClcbiAgICogICAuZHJhZ2dhYmxlKHRydWUpXG4gICAqICAgLm9uKCdtb3ZlJywgZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAqICAgICBpZiAoZXZlbnQucGFnZVggPiAxMDAwKSB7XG4gICAqICAgICAgIC8vIGVuZCB0aGUgY3VycmVudCBhY3Rpb25cbiAgICogICAgICAgZXZlbnQuaW50ZXJhY3Rpb24uZW5kKCk7XG4gICAqICAgICAgIC8vIHN0b3AgYWxsIGZ1cnRoZXIgbGlzdGVuZXJzIGZyb20gYmVpbmcgY2FsbGVkXG4gICAqICAgICAgIGV2ZW50LnN0b3BJbW1lZGlhdGVQcm9wYWdhdGlvbigpO1xuICAgKiAgICAgfVxuICAgKiAgIH0pO1xuICAgKiBgYGBcbiAgICpcbiAgICogQHBhcmFtIHtQb2ludGVyRXZlbnR9IFtldmVudF1cbiAgICovXG4gIGVuZCAoZXZlbnQ/OiBJbnRlcmFjdC5Qb2ludGVyRXZlbnRUeXBlKSB7XG4gICAgdGhpcy5fZW5kaW5nID0gdHJ1ZVxuICAgIGV2ZW50ID0gZXZlbnQgfHwgdGhpcy5fbGF0ZXN0UG9pbnRlci5ldmVudFxuICAgIGxldCBlbmRQaGFzZVJlc3VsdFxuXG4gICAgaWYgKHRoaXMuaW50ZXJhY3RpbmcoKSkge1xuICAgICAgZW5kUGhhc2VSZXN1bHQgPSB0aGlzLl9kb1BoYXNlKHtcbiAgICAgICAgZXZlbnQsXG4gICAgICAgIGludGVyYWN0aW9uOiB0aGlzLFxuICAgICAgICBwaGFzZTogRXZlbnRQaGFzZS5FbmQsXG4gICAgICB9KVxuICAgIH1cblxuICAgIHRoaXMuX2VuZGluZyA9IGZhbHNlXG5cbiAgICBpZiAoZW5kUGhhc2VSZXN1bHQgPT09IHRydWUpIHtcbiAgICAgIHRoaXMuc3RvcCgpXG4gICAgfVxuICB9XG5cbiAgY3VycmVudEFjdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXMuX2ludGVyYWN0aW5nID8gdGhpcy5wcmVwYXJlZC5uYW1lIDogbnVsbFxuICB9XG5cbiAgaW50ZXJhY3RpbmcgKCkge1xuICAgIHJldHVybiB0aGlzLl9pbnRlcmFjdGluZ1xuICB9XG5cbiAgLyoqICovXG4gIHN0b3AgKCkge1xuICAgIHRoaXMuX3NpZ25hbHMuZmlyZSgnc3RvcCcsIHsgaW50ZXJhY3Rpb246IHRoaXMgfSlcblxuICAgIHRoaXMuaW50ZXJhY3RhYmxlID0gdGhpcy5lbGVtZW50ID0gbnVsbFxuXG4gICAgdGhpcy5faW50ZXJhY3RpbmcgPSBmYWxzZVxuICAgIHRoaXMucHJlcGFyZWQubmFtZSA9IHRoaXMucHJldkV2ZW50ID0gbnVsbFxuICB9XG5cbiAgZ2V0UG9pbnRlckluZGV4IChwb2ludGVyKSB7XG4gICAgY29uc3QgcG9pbnRlcklkID0gdXRpbHMucG9pbnRlci5nZXRQb2ludGVySWQocG9pbnRlcilcblxuICAgIC8vIG1vdXNlIGFuZCBwZW4gaW50ZXJhY3Rpb25zIG1heSBoYXZlIG9ubHkgb25lIHBvaW50ZXJcbiAgICByZXR1cm4gKHRoaXMucG9pbnRlclR5cGUgPT09ICdtb3VzZScgfHwgdGhpcy5wb2ludGVyVHlwZSA9PT0gJ3BlbicpXG4gICAgICA/IHRoaXMucG9pbnRlcnMubGVuZ3RoIC0gMVxuICAgICAgOiB1dGlscy5hcnIuZmluZEluZGV4KHRoaXMucG9pbnRlcnMsIChjdXJQb2ludGVyKSA9PiBjdXJQb2ludGVyLmlkID09PSBwb2ludGVySWQpXG4gIH1cblxuICBnZXRQb2ludGVySW5mbyAocG9pbnRlcikge1xuICAgIHJldHVybiB0aGlzLnBvaW50ZXJzW3RoaXMuZ2V0UG9pbnRlckluZGV4KHBvaW50ZXIpXVxuICB9XG5cbiAgdXBkYXRlUG9pbnRlciAocG9pbnRlcjogSW50ZXJhY3QuUG9pbnRlclR5cGUsIGV2ZW50OiBJbnRlcmFjdC5Qb2ludGVyRXZlbnRUeXBlLCBldmVudFRhcmdldDogRXZlbnRUYXJnZXQsIGRvd24/OiBib29sZWFuKSB7XG4gICAgY29uc3QgaWQgPSB1dGlscy5wb2ludGVyLmdldFBvaW50ZXJJZChwb2ludGVyKVxuICAgIGxldCBwb2ludGVySW5kZXggPSB0aGlzLmdldFBvaW50ZXJJbmRleChwb2ludGVyKVxuICAgIGxldCBwb2ludGVySW5mbyA9IHRoaXMucG9pbnRlcnNbcG9pbnRlckluZGV4XVxuXG4gICAgZG93biA9IGRvd24gPT09IGZhbHNlXG4gICAgICA/IGZhbHNlXG4gICAgICA6IGRvd24gfHwgLyhkb3dufHN0YXJ0KSQvaS50ZXN0KGV2ZW50LnR5cGUpXG5cbiAgICBpZiAoIXBvaW50ZXJJbmZvKSB7XG4gICAgICBwb2ludGVySW5mbyA9IG5ldyBQb2ludGVySW5mbyhcbiAgICAgICAgaWQsXG4gICAgICAgIHBvaW50ZXIsXG4gICAgICAgIGV2ZW50LFxuICAgICAgICBudWxsLFxuICAgICAgICBudWxsLFxuICAgICAgKVxuXG4gICAgICBwb2ludGVySW5kZXggPSB0aGlzLnBvaW50ZXJzLmxlbmd0aFxuICAgICAgdGhpcy5wb2ludGVycy5wdXNoKHBvaW50ZXJJbmZvKVxuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIHBvaW50ZXJJbmZvLnBvaW50ZXIgPSBwb2ludGVyXG4gICAgfVxuXG4gICAgaWYgKGRvd24pIHtcbiAgICAgIHRoaXMucG9pbnRlcklzRG93biA9IHRydWVcblxuICAgICAgaWYgKCF0aGlzLmludGVyYWN0aW5nKCkpIHtcbiAgICAgICAgdXRpbHMucG9pbnRlci5zZXRDb29yZHModGhpcy5jb29yZHMuc3RhcnQsIHRoaXMucG9pbnRlcnMubWFwKChwKSA9PiBwLnBvaW50ZXIpKVxuXG4gICAgICAgIHV0aWxzLnBvaW50ZXIuY29weUNvb3Jkcyh0aGlzLmNvb3Jkcy5jdXIsIHRoaXMuY29vcmRzLnN0YXJ0KVxuICAgICAgICB1dGlscy5wb2ludGVyLmNvcHlDb29yZHModGhpcy5jb29yZHMucHJldiwgdGhpcy5jb29yZHMuc3RhcnQpXG4gICAgICAgIHV0aWxzLnBvaW50ZXIucG9pbnRlckV4dGVuZCh0aGlzLmRvd25Qb2ludGVyLCBwb2ludGVyKVxuXG4gICAgICAgIHRoaXMuZG93bkV2ZW50ID0gZXZlbnRcbiAgICAgICAgcG9pbnRlckluZm8uZG93blRpbWUgPSB0aGlzLmNvb3Jkcy5jdXIudGltZVN0YW1wXG4gICAgICAgIHBvaW50ZXJJbmZvLmRvd25UYXJnZXQgPSBldmVudFRhcmdldFxuXG4gICAgICAgIHRoaXMucG9pbnRlcldhc01vdmVkID0gZmFsc2VcbiAgICAgIH1cbiAgICB9XG5cbiAgICB0aGlzLl91cGRhdGVMYXRlc3RQb2ludGVyKHBvaW50ZXIsIGV2ZW50LCBldmVudFRhcmdldClcblxuICAgIHRoaXMuX3NpZ25hbHMuZmlyZSgndXBkYXRlLXBvaW50ZXInLCB7XG4gICAgICBwb2ludGVyLFxuICAgICAgZXZlbnQsXG4gICAgICBldmVudFRhcmdldCxcbiAgICAgIGRvd24sXG4gICAgICBwb2ludGVySW5mbyxcbiAgICAgIHBvaW50ZXJJbmRleCxcbiAgICAgIGludGVyYWN0aW9uOiB0aGlzLFxuICAgIH0pXG5cbiAgICByZXR1cm4gcG9pbnRlckluZGV4XG4gIH1cblxuICByZW1vdmVQb2ludGVyIChwb2ludGVyLCBldmVudCkge1xuICAgIGNvbnN0IHBvaW50ZXJJbmRleCA9IHRoaXMuZ2V0UG9pbnRlckluZGV4KHBvaW50ZXIpXG5cbiAgICBpZiAocG9pbnRlckluZGV4ID09PSAtMSkgeyByZXR1cm4gfVxuXG4gICAgY29uc3QgcG9pbnRlckluZm8gPSB0aGlzLnBvaW50ZXJzW3BvaW50ZXJJbmRleF1cblxuICAgIHRoaXMuX3NpZ25hbHMuZmlyZSgncmVtb3ZlLXBvaW50ZXInLCB7XG4gICAgICBwb2ludGVyLFxuICAgICAgZXZlbnQsXG4gICAgICBwb2ludGVySW5kZXgsXG4gICAgICBwb2ludGVySW5mbyxcbiAgICAgIGludGVyYWN0aW9uOiB0aGlzLFxuICAgIH0pXG5cbiAgICB0aGlzLnBvaW50ZXJzLnNwbGljZShwb2ludGVySW5kZXgsIDEpXG4gIH1cblxuICBfdXBkYXRlTGF0ZXN0UG9pbnRlciAocG9pbnRlciwgZXZlbnQsIGV2ZW50VGFyZ2V0KSB7XG4gICAgdGhpcy5fbGF0ZXN0UG9pbnRlci5wb2ludGVyID0gcG9pbnRlclxuICAgIHRoaXMuX2xhdGVzdFBvaW50ZXIuZXZlbnQgPSBldmVudFxuICAgIHRoaXMuX2xhdGVzdFBvaW50ZXIuZXZlbnRUYXJnZXQgPSBldmVudFRhcmdldFxuICB9XG5cbiAgX2NyZWF0ZVByZXBhcmVkRXZlbnQgKGV2ZW50OiBJbnRlcmFjdC5Qb2ludGVyRXZlbnRUeXBlLCBwaGFzZTogRXZlbnRQaGFzZSwgcHJlRW5kOiBib29sZWFuLCB0eXBlOiBzdHJpbmcpIHtcbiAgICBjb25zdCBhY3Rpb25OYW1lID0gdGhpcy5wcmVwYXJlZC5uYW1lXG5cbiAgICByZXR1cm4gbmV3IEludGVyYWN0RXZlbnQodGhpcywgZXZlbnQsIGFjdGlvbk5hbWUsIHBoYXNlLCB0aGlzLmVsZW1lbnQsIG51bGwsIHByZUVuZCwgdHlwZSlcbiAgfVxuXG4gIF9maXJlRXZlbnQgKGlFdmVudCkge1xuICAgIHRoaXMuaW50ZXJhY3RhYmxlLmZpcmUoaUV2ZW50KVxuXG4gICAgaWYgKCF0aGlzLnByZXZFdmVudCB8fCBpRXZlbnQudGltZVN0YW1wID49IHRoaXMucHJldkV2ZW50LnRpbWVTdGFtcCkge1xuICAgICAgdGhpcy5wcmV2RXZlbnQgPSBpRXZlbnRcbiAgICB9XG4gIH1cblxuICBfZG9QaGFzZSAoc2lnbmFsQXJnOiBQYXJ0aWFsPEludGVyYWN0LlNpZ25hbEFyZz4pIHtcbiAgICBjb25zdCB7IGV2ZW50LCBwaGFzZSwgcHJlRW5kLCB0eXBlIH0gPSBzaWduYWxBcmdcblxuICAgIGlmICghc2lnbmFsQXJnLm5vQmVmb3JlKSB7XG4gICAgICBjb25zdCBiZWZvcmVSZXN1bHQgPSB0aGlzLl9zaWduYWxzLmZpcmUoYGJlZm9yZS1hY3Rpb24tJHtwaGFzZX1gLCBzaWduYWxBcmcpXG5cbiAgICAgIGlmIChiZWZvcmVSZXN1bHQgPT09IGZhbHNlKSB7XG4gICAgICAgIHJldHVybiBmYWxzZVxuICAgICAgfVxuICAgIH1cblxuICAgIGNvbnN0IGlFdmVudCA9IHNpZ25hbEFyZy5pRXZlbnQgPSB0aGlzLl9jcmVhdGVQcmVwYXJlZEV2ZW50KGV2ZW50LCBwaGFzZSwgcHJlRW5kLCB0eXBlKVxuICAgIGNvbnN0IHsgcmVjdCB9ID0gdGhpc1xuXG4gICAgaWYgKHJlY3QpIHtcbiAgICAgIC8vIHVwZGF0ZSB0aGUgcmVjdCBtb2RpZmljYXRpb25zXG4gICAgICBjb25zdCBlZGdlcyA9IHRoaXMuZWRnZXMgfHwgdGhpcy5wcmVwYXJlZC5lZGdlcyB8fCB7IGxlZnQ6IHRydWUsIHJpZ2h0OiB0cnVlLCB0b3A6IHRydWUsIGJvdHRvbTogdHJ1ZSB9XG5cbiAgICAgIGlmIChlZGdlcy50b3ApICAgIHsgcmVjdC50b3AgICAgKz0gaUV2ZW50LmRlbHRhLnkgfVxuICAgICAgaWYgKGVkZ2VzLmJvdHRvbSkgeyByZWN0LmJvdHRvbSArPSBpRXZlbnQuZGVsdGEueSB9XG4gICAgICBpZiAoZWRnZXMubGVmdCkgICB7IHJlY3QubGVmdCAgICs9IGlFdmVudC5kZWx0YS54IH1cbiAgICAgIGlmIChlZGdlcy5yaWdodCkgIHsgcmVjdC5yaWdodCAgKz0gaUV2ZW50LmRlbHRhLnggfVxuICAgIH1cblxuICAgIHRoaXMuX3NpZ25hbHMuZmlyZShgYWN0aW9uLSR7cGhhc2V9YCwgc2lnbmFsQXJnKVxuXG4gICAgdGhpcy5fZmlyZUV2ZW50KGlFdmVudClcblxuICAgIHRoaXMuX3NpZ25hbHMuZmlyZShgYWZ0ZXItYWN0aW9uLSR7cGhhc2V9YCwgc2lnbmFsQXJnKVxuXG4gICAgcmV0dXJuIHRydWVcbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBJbnRlcmFjdGlvblxuZXhwb3J0IHsgUG9pbnRlckluZm8gfVxuIl19