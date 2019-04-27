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
        this._proxy = null;
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
        const that = this;
        this._proxy = {
            get pointerIsDown() { return that.pointerIsDown; },
            get pointerWasMoved() { return that.pointerWasMoved; },
            start(action, i, e) { return that.start(action, i, e); },
            move(arg) { return that.move(arg); },
            end(event) { return that.end(event); },
            stop() { return that.stop(); },
            interacting() { return that.interacting(); },
            get _proxy() { return this; },
        };
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
     *     var interaction = event.interaction
     *
     *     if (!interaction.interacting()) {
     *       interaction.start({ name: 'drag' },
     *                         event.interactable,
     *                         event.currentTarget)
     *     }
     * })
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
            return false;
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
        return this._interacting;
    }
    pointerMove(pointer, event, eventTarget) {
        if (!this.simulation) {
            this.updatePointer(pointer, event, eventTarget, false);
            utils.pointer.setCoords(this.coords.cur, this.pointers.map((p) => p.pointer), this._now());
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
     *       event.interactable.draggable({ snap: { targets: [] }})
     *       // fire another move event with re-calculated snap
     *       event.interaction.move()
     *     }
     *   })
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
     *       event.interaction.end()
     *       // stop all further listeners from being called
     *       event.stopImmediatePropagation()
     *     }
     *   })
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
                utils.pointer.setCoords(this.coords.start, this.pointers.map((p) => p.pointer), this._now());
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
        const beforeResult = this._signals.fire(`before-action-${phase}`, signalArg);
        if (beforeResult === false) {
            return false;
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
            rect.width = rect.right - rect.left;
            rect.height = rect.bottom - rect.top;
        }
        this._signals.fire(`action-${phase}`, signalArg);
        this._fireEvent(iEvent);
        this._signals.fire(`after-action-${phase}`, signalArg);
        return true;
    }
    _now() { return Date.now(); }
}
export default Interaction;
export { PointerInfo };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiSW50ZXJhY3Rpb24uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJJbnRlcmFjdGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEtBQUssS0FBSyxNQUFNLG1CQUFtQixDQUFBO0FBRTFDLE9BQU8sYUFBYSxFQUFFLEVBQUUsVUFBVSxFQUFFLE1BQU0saUJBQWlCLENBQUE7QUFDM0QsT0FBTyxXQUFXLE1BQU0sZUFBZSxDQUFBO0FBQ3ZDLE9BQU8sRUFBRSxVQUFVLEVBQUUsTUFBTSxTQUFTLENBQUE7QUF5QnBDLE1BQU0sT0FBTyxXQUFXO0lBNkV0QixNQUFNO0lBQ04sWUFBYSxFQUFFLFdBQVcsRUFBRSxPQUFPLEVBQW9EO1FBN0V2Riw2Q0FBNkM7UUFDN0MsaUJBQVksR0FBaUIsSUFBSSxDQUFBO1FBRWpDLHlDQUF5QztRQUN6QyxZQUFPLEdBQVksSUFBSSxDQUFBO1FBUXZCLHFEQUFxRDtRQUNyRCxhQUFRLEdBQW1CO1lBQ3pCLElBQUksRUFBRyxJQUFJO1lBQ1gsSUFBSSxFQUFHLElBQUk7WUFDWCxLQUFLLEVBQUUsSUFBSTtTQUNaLENBQUE7UUFJRCwrQkFBK0I7UUFDL0IsYUFBUSxHQUFrQixFQUFFLENBQUE7UUFFNUIseUNBQXlDO1FBQ3pDLGNBQVMsR0FBOEIsSUFBSSxDQUFBO1FBRTNDLGdCQUFXLEdBQXlCLEVBQTBCLENBQUE7UUFFOUQsbUJBQWMsR0FJVjtZQUNGLE9BQU8sRUFBRSxJQUFJO1lBQ2IsS0FBSyxFQUFFLElBQUk7WUFDWCxXQUFXLEVBQUUsSUFBSTtTQUNsQixDQUFBO1FBRUQsd0JBQXdCO1FBQ3hCLGNBQVMsR0FBcUIsSUFBSSxDQUFBO1FBRWxDLGtCQUFhLEdBQUcsS0FBSyxDQUFBO1FBQ3JCLG9CQUFlLEdBQUcsS0FBSyxDQUFBO1FBQ3ZCLGlCQUFZLEdBQUcsS0FBSyxDQUFBO1FBQ3BCLFlBQU8sR0FBRyxLQUFLLENBQUE7UUFDZixXQUFNLEdBQXFCLElBQUksQ0FBQTtRQUUvQixlQUFVLEdB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QUMxQixPQUFPLEVBQUUsV0FBVyxFQUFFLENBQUEiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyB1dGlscyBmcm9tICdAaW50ZXJhY3Rqcy91dGlscydcbmltcG9ydCBJbnRlcmFjdGFibGUgZnJvbSAnLi9JbnRlcmFjdGFibGUnXG5pbXBvcnQgSW50ZXJhY3RFdmVudCwgeyBFdmVudFBoYXNlIH0gZnJvbSAnLi9JbnRlcmFjdEV2ZW50J1xuaW1wb3J0IFBvaW50ZXJJbmZvIGZyb20gJy4vUG9pbnRlckluZm8nXG5pbXBvcnQgeyBBY3Rpb25OYW1lIH0gZnJvbSAnLi9zY29wZSdcblxuZXhwb3J0IGludGVyZmFjZSBBY3Rpb25Qcm9wczxUIGV4dGVuZHMgQWN0aW9uTmFtZSA9IGFueT4ge1xuICBuYW1lOiBUXG4gIGF4aXM/OiAneCcgfCAneScgfCAneHknXG4gIGVkZ2VzPzoge1xuICAgIFtlZGdlIGluIGtleW9mIEludGVyYWN0LlJlY3RdPzogYm9vbGVhblxuICB9XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgU3RhcnRBY3Rpb24gZXh0ZW5kcyBBY3Rpb25Qcm9wcyB7XG4gIG5hbWU6IEFjdGlvbk5hbWUgfCBzdHJpbmdcbn1cblxuZXhwb3J0IHR5cGUgSW50ZXJhY3Rpb25Qcm94eSA9IFBpY2s8SW50ZXJhY3Rpb24sXG4gICdwb2ludGVySXNEb3duJyB8XG4gICdwb2ludGVyV2FzTW92ZWQnIHxcbiAgJ3N0YXJ0JyB8XG4gICdtb3ZlJyB8XG4gICdlbmQnIHxcbiAgJ3N0b3AnIHxcbiAgJ2ludGVyYWN0aW5nJyB8XG4gICdfcHJveHknXG4+XG5cbmV4cG9ydCBjbGFzcyBJbnRlcmFjdGlvbjxUIGV4dGVuZHMgQWN0aW9uTmFtZSA9IGFueT4ge1xuICAvLyBjdXJyZW50IGludGVyYWN0YWJsZSBiZWluZyBpbnRlcmFjdGVkIHdpdGhcbiAgaW50ZXJhY3RhYmxlOiBJbnRlcmFjdGFibGUgPSBudWxsXG5cbiAgLy8gdGhlIHRhcmdldCBlbGVtZW50IG9mIHRoZSBpbnRlcmFjdGFibGVcbiAgZWxlbWVudDogRWxlbWVudCA9IG51bGxcbiAgcmVjdDogSW50ZXJhY3QuUmVjdCAmIEludGVyYWN0LlNpemVcbiAgZWRnZXM6IHtcbiAgICBbUCBpbiBrZXlvZiBJbnRlcmFjdC5SZWN0XT86IGJvb2xlYW5cbiAgfVxuXG4gIF9zaWduYWxzOiB1dGlscy5TaWduYWxzXG5cbiAgLy8gYWN0aW9uIHRoYXQncyByZWFkeSB0byBiZSBmaXJlZCBvbiBuZXh0IG1vdmUgZXZlbnRcbiAgcHJlcGFyZWQ6IEFjdGlvblByb3BzPFQ+ID0ge1xuICAgIG5hbWUgOiBudWxsLFxuICAgIGF4aXMgOiBudWxsLFxuICAgIGVkZ2VzOiBudWxsLFxuICB9XG5cbiAgcG9pbnRlclR5cGU6IHN0cmluZ1xuXG4gIC8vIGtlZXAgdHJhY2sgb2YgYWRkZWQgcG9pbnRlcnNcbiAgcG9pbnRlcnM6IFBvaW50ZXJJbmZvW10gPSBbXVxuXG4gIC8vIHBvaW50ZXJkb3duL21vdXNlZG93bi90b3VjaHN0YXJ0IGV2ZW50XG4gIGRvd25FdmVudDogSW50ZXJhY3QuUG9pbnRlckV2ZW50VHlwZSA9IG51bGxcblxuICBkb3duUG9pbnRlcjogSW50ZXJhY3QuUG9pbnRlclR5cGUgPSB7fSBhcyBJbnRlcmFjdC5Qb2ludGVyVHlwZVxuXG4gIF9sYXRlc3RQb2ludGVyOiB7XG4gICAgcG9pbnRlcjogSW50ZXJhY3QuRXZlbnRUYXJnZXRcbiAgICBldmVudDogSW50ZXJhY3QuUG9pbnRlckV2ZW50VHlwZVxuICAgIGV2ZW50VGFyZ2V0OiBOb2RlLFxuICB9ID0ge1xuICAgIHBvaW50ZXI6IG51bGwsXG4gICAgZXZlbnQ6IG51bGwsXG4gICAgZXZlbnRUYXJnZXQ6IG51bGwsXG4gIH1cblxuICAvLyBwcmV2aW91cyBhY3Rpb24gZXZlbnRcbiAgcHJldkV2ZW50OiBJbnRlcmFjdEV2ZW50PFQ+ID0gbnVsbFxuXG4gIHBvaW50ZXJJc0Rvd24gPSBmYWxzZVxuICBwb2ludGVyV2FzTW92ZWQgPSBmYWxzZVxuICBfaW50ZXJhY3RpbmcgPSBmYWxzZVxuICBfZW5kaW5nID0gZmFsc2VcbiAgX3Byb3h5OiBJbnRlcmFjdGlvblByb3h5ID0gbnVsbFxuXG4gIHNpbXVsYXRpb24gPSBudWxsXG5cbiAgZ2V0IHBvaW50ZXJNb3ZlVG9sZXJhbmNlICgpIHtcbiAgICByZXR1cm4gMVxuICB9XG5cbiAgLyoqXG4gICAqIEBhbGlhcyBJbnRlcmFjdGlvbi5wcm90b3R5cGUubW92ZVxuICAgKi9cbiAgZG9Nb3ZlID0gdXRpbHMud2Fybk9uY2UoXG4gICAgZnVuY3Rpb24gKHRoaXM6IEludGVyYWN0aW9uLCBzaWduYWxBcmc6IGFueSkge1xuICAgICAgdGhpcy5tb3ZlKHNpZ25hbEFyZylcbiAgICB9LFxuICAgICdUaGUgaW50ZXJhY3Rpb24uZG9Nb3ZlKCkgbWV0aG9kIGhhcyBiZWVuIHJlbmFtZWQgdG8gaW50ZXJhY3Rpb24ubW92ZSgpJylcblxuICBjb29yZHMgPSB7XG4gICAgLy8gU3RhcnRpbmcgSW50ZXJhY3RFdmVudCBwb2ludGVyIGNvb3JkaW5hdGVzXG4gICAgc3RhcnQ6IHV0aWxzLnBvaW50ZXIubmV3Q29vcmRzKCksXG4gICAgLy8gUHJldmlvdXMgbmF0aXZlIHBvaW50ZXIgbW92ZSBldmVudCBjb29yZGluYXRlc1xuICAgIHByZXY6IHV0aWxzLnBvaW50ZXIubmV3Q29vcmRzKCksXG4gICAgLy8gY3VycmVudCBuYXRpdmUgcG9pbnRlciBtb3ZlIGV2ZW50IGNvb3JkaW5hdGVzXG4gICAgY3VyOiB1dGlscy5wb2ludGVyLm5ld0Nvb3JkcygpLFxuICAgIC8vIENoYW5nZSBpbiBjb29yZGluYXRlcyBhbmQgdGltZSBvZiB0aGUgcG9pbnRlclxuICAgIGRlbHRhOiB1dGlscy5wb2ludGVyLm5ld0Nvb3JkcygpLFxuICAgIC8vIHBvaW50ZXIgdmVsb2NpdHlcbiAgICB2ZWxvY2l0eTogdXRpbHMucG9pbnRlci5uZXdDb29yZHMoKSxcbiAgfVxuXG4gIC8qKiAqL1xuICBjb25zdHJ1Y3RvciAoeyBwb2ludGVyVHlwZSwgc2lnbmFscyB9OiB7IHBvaW50ZXJUeXBlPzogc3RyaW5nLCBzaWduYWxzOiB1dGlscy5TaWduYWxzIH0pIHtcbiAgICB0aGlzLl9zaWduYWxzID0gc2lnbmFsc1xuICAgIHRoaXMucG9pbnRlclR5cGUgPSBwb2ludGVyVHlwZVxuXG4gICAgY29uc3QgdGhhdCA9IHRoaXNcblxuICAgIHRoaXMuX3Byb3h5ID0ge1xuICAgICAgZ2V0IHBvaW50ZXJJc0Rvd24gKCkgeyByZXR1cm4gdGhhdC5wb2ludGVySXNEb3duIH0sXG4gICAgICBnZXQgcG9pbnRlcldhc01vdmVkICgpIHsgcmV0dXJuIHRoYXQucG9pbnRlcldhc01vdmVkIH0sXG4gICAgICBzdGFydCAoYWN0aW9uLCBpLCBlKSB7IHJldHVybiB0aGF0LnN0YXJ0KGFjdGlvbiwgaSwgZSkgfSxcbiAgICAgIG1vdmUgKGFyZykgeyByZXR1cm4gdGhhdC5tb3ZlKGFyZykgfSxcbiAgICAgIGVuZCAoZXZlbnQpIHsgcmV0dXJuIHRoYXQuZW5kKGV2ZW50KSB9LFxuICAgICAgc3RvcCAoKSB7IHJldHVybiB0aGF0LnN0b3AoKSB9LFxuICAgICAgaW50ZXJhY3RpbmcgKCkgeyByZXR1cm4gdGhhdC5pbnRlcmFjdGluZygpIH0sXG4gICAgICBnZXQgX3Byb3h5ICgpIHsgcmV0dXJuIHRoaXMgfSxcbiAgICB9XG5cbiAgICB0aGlzLl9zaWduYWxzLmZpcmUoJ25ldycsIHsgaW50ZXJhY3Rpb246IHRoaXMgfSlcbiAgfVxuXG4gIHBvaW50ZXJEb3duIChwb2ludGVyOiBJbnRlcmFjdC5Qb2ludGVyVHlwZSwgZXZlbnQ6IEludGVyYWN0LlBvaW50ZXJFdmVudFR5cGUsIGV2ZW50VGFyZ2V0OiBFdmVudFRhcmdldCkge1xuICAgIGNvbnN0IHBvaW50ZXJJbmRleCA9IHRoaXMudXBkYXRlUG9pbnRlcihwb2ludGVyLCBldmVudCwgZXZlbnRUYXJnZXQsIHRydWUpXG5cbiAgICB0aGlzLl9zaWduYWxzLmZpcmUoJ2Rvd24nLCB7XG4gICAgICBwb2ludGVyLFxuICAgICAgZXZlbnQsXG4gICAgICBldmVudFRhcmdldCxcbiAgICAgIHBvaW50ZXJJbmRleCxcbiAgICAgIGludGVyYWN0aW9uOiB0aGlzLFxuICAgIH0pXG4gIH1cblxuICAvKipcbiAgICogYGBganNcbiAgICogaW50ZXJhY3QodGFyZ2V0KVxuICAgKiAgIC5kcmFnZ2FibGUoe1xuICAgKiAgICAgLy8gZGlzYWJsZSB0aGUgZGVmYXVsdCBkcmFnIHN0YXJ0IGJ5IGRvd24tPm1vdmVcbiAgICogICAgIG1hbnVhbFN0YXJ0OiB0cnVlXG4gICAqICAgfSlcbiAgICogICAvLyBzdGFydCBkcmFnZ2luZyBhZnRlciB0aGUgdXNlciBob2xkcyB0aGUgcG9pbnRlciBkb3duXG4gICAqICAgLm9uKCdob2xkJywgZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAqICAgICB2YXIgaW50ZXJhY3Rpb24gPSBldmVudC5pbnRlcmFjdGlvblxuICAgKlxuICAgKiAgICAgaWYgKCFpbnRlcmFjdGlvbi5pbnRlcmFjdGluZygpKSB7XG4gICAqICAgICAgIGludGVyYWN0aW9uLnN0YXJ0KHsgbmFtZTogJ2RyYWcnIH0sXG4gICAqICAgICAgICAgICAgICAgICAgICAgICAgIGV2ZW50LmludGVyYWN0YWJsZSxcbiAgICogICAgICAgICAgICAgICAgICAgICAgICAgZXZlbnQuY3VycmVudFRhcmdldClcbiAgICogICAgIH1cbiAgICogfSlcbiAgICogYGBgXG4gICAqXG4gICAqIFN0YXJ0IGFuIGFjdGlvbiB3aXRoIHRoZSBnaXZlbiBJbnRlcmFjdGFibGUgYW5kIEVsZW1lbnQgYXMgdGFydGdldHMuIFRoZVxuICAgKiBhY3Rpb24gbXVzdCBiZSBlbmFibGVkIGZvciB0aGUgdGFyZ2V0IEludGVyYWN0YWJsZSBhbmQgYW4gYXBwcm9wcmlhdGVcbiAgICogbnVtYmVyIG9mIHBvaW50ZXJzIG11c3QgYmUgaGVsZCBkb3duIC0gMSBmb3IgZHJhZy9yZXNpemUsIDIgZm9yIGdlc3R1cmUuXG4gICAqXG4gICAqIFVzZSBpdCB3aXRoIGBpbnRlcmFjdGFibGUuPGFjdGlvbj5hYmxlKHsgbWFudWFsU3RhcnQ6IGZhbHNlIH0pYCB0byBhbHdheXNcbiAgICogW3N0YXJ0IGFjdGlvbnMgbWFudWFsbHldKGh0dHBzOi8vZ2l0aHViLmNvbS90YXllL2ludGVyYWN0LmpzL2lzc3Vlcy8xMTQpXG4gICAqXG4gICAqIEBwYXJhbSB7b2JqZWN0fSBhY3Rpb24gICBUaGUgYWN0aW9uIHRvIGJlIHBlcmZvcm1lZCAtIGRyYWcsIHJlc2l6ZSwgZXRjLlxuICAgKiBAcGFyYW0ge0ludGVyYWN0YWJsZX0gdGFyZ2V0ICBUaGUgSW50ZXJhY3RhYmxlIHRvIHRhcmdldFxuICAgKiBAcGFyYW0ge0VsZW1lbnR9IGVsZW1lbnQgVGhlIERPTSBFbGVtZW50IHRvIHRhcmdldFxuICAgKiBAcmV0dXJuIHtvYmplY3R9IGludGVyYWN0XG4gICAqL1xuICBzdGFydCAoYWN0aW9uOiBTdGFydEFjdGlvbiwgaW50ZXJhY3RhYmxlOiBJbnRlcmFjdGFibGUsIGVsZW1lbnQ6IEVsZW1lbnQpIHtcbiAgICBpZiAodGhpcy5pbnRlcmFjdGluZygpIHx8XG4gICAgICAgICF0aGlzLnBvaW50ZXJJc0Rvd24gfHxcbiAgICAgICAgdGhpcy5wb2ludGVycy5sZW5ndGggPCAoYWN0aW9uLm5hbWUgPT09IEFjdGlvbk5hbWUuR2VzdHVyZSA/IDIgOiAxKSB8fFxuICAgICAgICAhaW50ZXJhY3RhYmxlLm9wdGlvbnNbYWN0aW9uLm5hbWVdLmVuYWJsZWQpIHtcbiAgICAgIHJldHVybiBmYWxzZVxuICAgIH1cblxuICAgIHV0aWxzLmNvcHlBY3Rpb24odGhpcy5wcmVwYXJlZCwgYWN0aW9uKVxuXG4gICAgdGhpcy5pbnRlcmFjdGFibGUgPSBpbnRlcmFjdGFibGVcbiAgICB0aGlzLmVsZW1lbnQgICAgICA9IGVsZW1lbnRcbiAgICB0aGlzLnJlY3QgICAgICAgICA9IGludGVyYWN0YWJsZS5nZXRSZWN0KGVsZW1lbnQpXG4gICAgdGhpcy5lZGdlcyAgICAgICAgPSB0aGlzLnByZXBhcmVkLmVkZ2VzXG4gICAgdGhpcy5faW50ZXJhY3RpbmcgPSB0aGlzLl9kb1BoYXNlKHtcbiAgICAgIGludGVyYWN0aW9uOiB0aGlzLFxuICAgICAgZXZlbnQ6IHRoaXMuZG93bkV2ZW50LFxuICAgICAgcGhhc2U6IEV2ZW50UGhhc2UuU3RhcnQsXG4gICAgfSlcblxuICAgIHJldHVybiB0aGlzLl9pbnRlcmFjdGluZ1xuICB9XG5cbiAgcG9pbnRlck1vdmUgKHBvaW50ZXI6IEludGVyYWN0LlBvaW50ZXJUeXBlLCBldmVudDogSW50ZXJhY3QuUG9pbnRlckV2ZW50VHlwZSwgZXZlbnRUYXJnZXQ6IEV2ZW50VGFyZ2V0KSB7XG4gICAgaWYgKCF0aGlzLnNpbXVsYXRpb24pIHtcbiAgICAgIHRoaXMudXBkYXRlUG9pbnRlcihwb2ludGVyLCBldmVudCwgZXZlbnRUYXJnZXQsIGZhbHNlKVxuICAgICAgdXRpbHMucG9pbnRlci5zZXRDb29yZHModGhpcy5jb29yZHMuY3VyLCB0aGlzLnBvaW50ZXJzLm1hcCgocCkgPT4gcC5wb2ludGVyKSwgdGhpcy5fbm93KCkpXG4gICAgfVxuXG4gICAgY29uc3QgZHVwbGljYXRlTW92ZSA9ICh0aGlzLmNvb3Jkcy5jdXIucGFnZS54ID09PSB0aGlzLmNvb3Jkcy5wcmV2LnBhZ2UueCAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5jb29yZHMuY3VyLnBhZ2UueSA9PT0gdGhpcy5jb29yZHMucHJldi5wYWdlLnkgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuY29vcmRzLmN1ci5jbGllbnQueCA9PT0gdGhpcy5jb29yZHMucHJldi5jbGllbnQueCAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5jb29yZHMuY3VyLmNsaWVudC55ID09PSB0aGlzLmNvb3Jkcy5wcmV2LmNsaWVudC55KVxuXG4gICAgbGV0IGR4XG4gICAgbGV0IGR5XG5cbiAgICAvLyByZWdpc3RlciBtb3ZlbWVudCBncmVhdGVyIHRoYW4gcG9pbnRlck1vdmVUb2xlcmFuY2VcbiAgICBpZiAodGhpcy5wb2ludGVySXNEb3duICYmICF0aGlzLnBvaW50ZXJXYXNNb3ZlZCkge1xuICAgICAgZHggPSB0aGlzLmNvb3Jkcy5jdXIuY2xpZW50LnggLSB0aGlzLmNvb3Jkcy5zdGFydC5jbGllbnQueFxuICAgICAgZHkgPSB0aGlzLmNvb3Jkcy5jdXIuY2xpZW50LnkgLSB0aGlzLmNvb3Jkcy5zdGFydC5jbGllbnQueVxuXG4gICAgICB0aGlzLnBvaW50ZXJXYXNNb3ZlZCA9IHV0aWxzLmh5cG90KGR4LCBkeSkgPiB0aGlzLnBvaW50ZXJNb3ZlVG9sZXJhbmNlXG4gICAgfVxuXG4gICAgY29uc3Qgc2lnbmFsQXJnID0ge1xuICAgICAgcG9pbnRlcixcbiAgICAgIHBvaW50ZXJJbmRleDogdGhpcy5nZXRQb2ludGVySW5kZXgocG9pbnRlciksXG4gICAgICBldmVudCxcbiAgICAgIGV2ZW50VGFyZ2V0LFxuICAgICAgZHgsXG4gICAgICBkeSxcbiAgICAgIGR1cGxpY2F0ZTogZHVwbGljYXRlTW92ZSxcbiAgICAgIGludGVyYWN0aW9uOiB0aGlzLFxuICAgIH1cblxuICAgIGlmICghZHVwbGljYXRlTW92ZSkge1xuICAgICAgLy8gc2V0IHBvaW50ZXIgY29vcmRpbmF0ZSwgdGltZSBjaGFuZ2VzIGFuZCB2ZWxvY2l0eVxuICAgICAgdXRpbHMucG9pbnRlci5zZXRDb29yZERlbHRhcyh0aGlzLmNvb3Jkcy5kZWx0YSwgdGhpcy5jb29yZHMucHJldiwgdGhpcy5jb29yZHMuY3VyKVxuICAgICAgdXRpbHMucG9pbnRlci5zZXRDb29yZFZlbG9jaXR5KHRoaXMuY29vcmRzLnZlbG9jaXR5LCB0aGlzLmNvb3Jkcy5kZWx0YSlcbiAgICB9XG5cbiAgICB0aGlzLl9zaWduYWxzLmZpcmUoJ21vdmUnLCBzaWduYWxBcmcpXG5cbiAgICBpZiAoIWR1cGxpY2F0ZU1vdmUpIHtcbiAgICAgIC8vIGlmIGludGVyYWN0aW5nLCBmaXJlIGFuICdhY3Rpb24tbW92ZScgc2lnbmFsIGV0Y1xuICAgICAgaWYgKHRoaXMuaW50ZXJhY3RpbmcoKSkge1xuICAgICAgICB0aGlzLm1vdmUoc2lnbmFsQXJnKVxuICAgICAgfVxuXG4gICAgICBpZiAodGhpcy5wb2ludGVyV2FzTW92ZWQpIHtcbiAgICAgICAgdXRpbHMucG9pbnRlci5jb3B5Q29vcmRzKHRoaXMuY29vcmRzLnByZXYsIHRoaXMuY29vcmRzLmN1cilcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogYGBganNcbiAgICogaW50ZXJhY3QodGFyZ2V0KVxuICAgKiAgIC5kcmFnZ2FibGUodHJ1ZSlcbiAgICogICAub24oJ2RyYWdtb3ZlJywgZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAqICAgICBpZiAoc29tZUNvbmRpdGlvbikge1xuICAgKiAgICAgICAvLyBjaGFuZ2UgdGhlIHNuYXAgc2V0dGluZ3NcbiAgICogICAgICAgZXZlbnQuaW50ZXJhY3RhYmxlLmRyYWdnYWJsZSh7IHNuYXA6IHsgdGFyZ2V0czogW10gfX0pXG4gICAqICAgICAgIC8vIGZpcmUgYW5vdGhlciBtb3ZlIGV2ZW50IHdpdGggcmUtY2FsY3VsYXRlZCBzbmFwXG4gICAqICAgICAgIGV2ZW50LmludGVyYWN0aW9uLm1vdmUoKVxuICAgKiAgICAgfVxuICAgKiAgIH0pXG4gICAqIGBgYFxuICAgKlxuICAgKiBGb3JjZSBhIG1vdmUgb2YgdGhlIGN1cnJlbnQgYWN0aW9uIGF0IHRoZSBzYW1lIGNvb3JkaW5hdGVzLiBVc2VmdWwgaWZcbiAgICogc25hcC9yZXN0cmljdCBoYXMgYmVlbiBjaGFuZ2VkIGFuZCB5b3Ugd2FudCBhIG1vdmVtZW50IHdpdGggdGhlIG5ld1xuICAgKiBzZXR0aW5ncy5cbiAgICovXG4gIG1vdmUgKHNpZ25hbEFyZz8pIHtcbiAgICBzaWduYWxBcmcgPSB1dGlscy5leHRlbmQoe1xuICAgICAgcG9pbnRlcjogdGhpcy5fbGF0ZXN0UG9pbnRlci5wb2ludGVyLFxuICAgICAgZXZlbnQ6IHRoaXMuX2xhdGVzdFBvaW50ZXIuZXZlbnQsXG4gICAgICBldmVudFRhcmdldDogdGhpcy5fbGF0ZXN0UG9pbnRlci5ldmVudFRhcmdldCxcbiAgICAgIGludGVyYWN0aW9uOiB0aGlzLFxuICAgIH0sIHNpZ25hbEFyZyB8fCB7fSlcblxuICAgIHNpZ25hbEFyZy5waGFzZSA9IEV2ZW50UGhhc2UuTW92ZVxuXG4gICAgdGhpcy5fZG9QaGFzZShzaWduYWxBcmcpXG4gIH1cblxuICAvLyBFbmQgaW50ZXJhY3QgbW92ZSBldmVudHMgYW5kIHN0b3AgYXV0by1zY3JvbGwgdW5sZXNzIHNpbXVsYXRpb24gaXMgcnVubmluZ1xuICBwb2ludGVyVXAgKHBvaW50ZXI6IEludGVyYWN0LlBvaW50ZXJUeXBlLCBldmVudDogSW50ZXJhY3QuUG9pbnRlckV2ZW50VHlwZSwgZXZlbnRUYXJnZXQ6IEV2ZW50VGFyZ2V0LCBjdXJFdmVudFRhcmdldDogRXZlbnRUYXJnZXQpIHtcbiAgICBsZXQgcG9pbnRlckluZGV4ID0gdGhpcy5nZXRQb2ludGVySW5kZXgocG9pbnRlcilcblxuICAgIGlmIChwb2ludGVySW5kZXggPT09IC0xKSB7XG4gICAgICBwb2ludGVySW5kZXggPSB0aGlzLnVwZGF0ZVBvaW50ZXIocG9pbnRlciwgZXZlbnQsIGV2ZW50VGFyZ2V0LCBmYWxzZSlcbiAgICB9XG5cbiAgICB0aGlzLl9zaWduYWxzLmZpcmUoL2NhbmNlbCQvaS50ZXN0KGV2ZW50LnR5cGUpID8gJ2NhbmNlbCcgOiAndXAnLCB7XG4gICAgICBwb2ludGVyLFxuICAgICAgcG9pbnRlckluZGV4LFxuICAgICAgZXZlbnQsXG4gICAgICBldmVudFRhcmdldCxcbiAgICAgIGN1ckV2ZW50VGFyZ2V0LFxuICAgICAgaW50ZXJhY3Rpb246IHRoaXMsXG4gICAgfSlcblxuICAgIGlmICghdGhpcy5zaW11bGF0aW9uKSB7XG4gICAgICB0aGlzLmVuZChldmVudClcbiAgICB9XG5cbiAgICB0aGlzLnBvaW50ZXJJc0Rvd24gPSBmYWxzZVxuICAgIHRoaXMucmVtb3ZlUG9pbnRlcihwb2ludGVyLCBldmVudClcbiAgfVxuXG4gIGRvY3VtZW50Qmx1ciAoZXZlbnQpIHtcbiAgICB0aGlzLmVuZChldmVudClcbiAgICB0aGlzLl9zaWduYWxzLmZpcmUoJ2JsdXInLCB7IGV2ZW50LCBpbnRlcmFjdGlvbjogdGhpcyB9KVxuICB9XG5cbiAgLyoqXG4gICAqIGBgYGpzXG4gICAqIGludGVyYWN0KHRhcmdldClcbiAgICogICAuZHJhZ2dhYmxlKHRydWUpXG4gICAqICAgLm9uKCdtb3ZlJywgZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAqICAgICBpZiAoZXZlbnQucGFnZVggPiAxMDAwKSB7XG4gICAqICAgICAgIC8vIGVuZCB0aGUgY3VycmVudCBhY3Rpb25cbiAgICogICAgICAgZXZlbnQuaW50ZXJhY3Rpb24uZW5kKClcbiAgICogICAgICAgLy8gc3RvcCBhbGwgZnVydGhlciBsaXN0ZW5lcnMgZnJvbSBiZWluZyBjYWxsZWRcbiAgICogICAgICAgZXZlbnQuc3RvcEltbWVkaWF0ZVByb3BhZ2F0aW9uKClcbiAgICogICAgIH1cbiAgICogICB9KVxuICAgKiBgYGBcbiAgICpcbiAgICogQHBhcmFtIHtQb2ludGVyRXZlbnR9IFtldmVudF1cbiAgICovXG4gIGVuZCAoZXZlbnQ/OiBJbnRlcmFjdC5Qb2ludGVyRXZlbnRUeXBlKSB7XG4gICAgdGhpcy5fZW5kaW5nID0gdHJ1ZVxuICAgIGV2ZW50ID0gZXZlbnQgfHwgdGhpcy5fbGF0ZXN0UG9pbnRlci5ldmVudFxuICAgIGxldCBlbmRQaGFzZVJlc3VsdFxuXG4gICAgaWYgKHRoaXMuaW50ZXJhY3RpbmcoKSkge1xuICAgICAgZW5kUGhhc2VSZXN1bHQgPSB0aGlzLl9kb1BoYXNlKHtcbiAgICAgICAgZXZlbnQsXG4gICAgICAgIGludGVyYWN0aW9uOiB0aGlzLFxuICAgICAgICBwaGFzZTogRXZlbnRQaGFzZS5FbmQsXG4gICAgICB9KVxuICAgIH1cblxuICAgIHRoaXMuX2VuZGluZyA9IGZhbHNlXG5cbiAgICBpZiAoZW5kUGhhc2VSZXN1bHQgPT09IHRydWUpIHtcbiAgICAgIHRoaXMuc3RvcCgpXG4gICAgfVxuICB9XG5cbiAgY3VycmVudEFjdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXMuX2ludGVyYWN0aW5nID8gdGhpcy5wcmVwYXJlZC5uYW1lIDogbnVsbFxuICB9XG5cbiAgaW50ZXJhY3RpbmcgKCkge1xuICAgIHJldHVybiB0aGlzLl9pbnRlcmFjdGluZ1xuICB9XG5cbiAgLyoqICovXG4gIHN0b3AgKCkge1xuICAgIHRoaXMuX3NpZ25hbHMuZmlyZSgnc3RvcCcsIHsgaW50ZXJhY3Rpb246IHRoaXMgfSlcblxuICAgIHRoaXMuaW50ZXJhY3RhYmxlID0gdGhpcy5lbGVtZW50ID0gbnVsbFxuXG4gICAgdGhpcy5faW50ZXJhY3RpbmcgPSBmYWxzZVxuICAgIHRoaXMucHJlcGFyZWQubmFtZSA9IHRoaXMucHJldkV2ZW50ID0gbnVsbFxuICB9XG5cbiAgZ2V0UG9pbnRlckluZGV4IChwb2ludGVyKSB7XG4gICAgY29uc3QgcG9pbnRlcklkID0gdXRpbHMucG9pbnRlci5nZXRQb2ludGVySWQocG9pbnRlcilcblxuICAgIC8vIG1vdXNlIGFuZCBwZW4gaW50ZXJhY3Rpb25zIG1heSBoYXZlIG9ubHkgb25lIHBvaW50ZXJcbiAgICByZXR1cm4gKHRoaXMucG9pbnRlclR5cGUgPT09ICdtb3VzZScgfHwgdGhpcy5wb2ludGVyVHlwZSA9PT0gJ3BlbicpXG4gICAgICA/IHRoaXMucG9pbnRlcnMubGVuZ3RoIC0gMVxuICAgICAgOiB1dGlscy5hcnIuZmluZEluZGV4KHRoaXMucG9pbnRlcnMsIChjdXJQb2ludGVyKSA9PiBjdXJQb2ludGVyLmlkID09PSBwb2ludGVySWQpXG4gIH1cblxuICBnZXRQb2ludGVySW5mbyAocG9pbnRlcikge1xuICAgIHJldHVybiB0aGlzLnBvaW50ZXJzW3RoaXMuZ2V0UG9pbnRlckluZGV4KHBvaW50ZXIpXVxuICB9XG5cbiAgdXBkYXRlUG9pbnRlciAocG9pbnRlcjogSW50ZXJhY3QuUG9pbnRlclR5cGUsIGV2ZW50OiBJbnRlcmFjdC5Qb2ludGVyRXZlbnRUeXBlLCBldmVudFRhcmdldDogRXZlbnRUYXJnZXQsIGRvd24/OiBib29sZWFuKSB7XG4gICAgY29uc3QgaWQgPSB1dGlscy5wb2ludGVyLmdldFBvaW50ZXJJZChwb2ludGVyKVxuICAgIGxldCBwb2ludGVySW5kZXggPSB0aGlzLmdldFBvaW50ZXJJbmRleChwb2ludGVyKVxuICAgIGxldCBwb2ludGVySW5mbyA9IHRoaXMucG9pbnRlcnNbcG9pbnRlckluZGV4XVxuXG4gICAgZG93biA9IGRvd24gPT09IGZhbHNlXG4gICAgICA/IGZhbHNlXG4gICAgICA6IGRvd24gfHwgLyhkb3dufHN0YXJ0KSQvaS50ZXN0KGV2ZW50LnR5cGUpXG5cbiAgICBpZiAoIXBvaW50ZXJJbmZvKSB7XG4gICAgICBwb2ludGVySW5mbyA9IG5ldyBQb2ludGVySW5mbyhcbiAgICAgICAgaWQsXG4gICAgICAgIHBvaW50ZXIsXG4gICAgICAgIGV2ZW50LFxuICAgICAgICBudWxsLFxuICAgICAgICBudWxsLFxuICAgICAgKVxuXG4gICAgICBwb2ludGVySW5kZXggPSB0aGlzLnBvaW50ZXJzLmxlbmd0aFxuICAgICAgdGhpcy5wb2ludGVycy5wdXNoKHBvaW50ZXJJbmZvKVxuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIHBvaW50ZXJJbmZvLnBvaW50ZXIgPSBwb2ludGVyXG4gICAgfVxuXG4gICAgaWYgKGRvd24pIHtcbiAgICAgIHRoaXMucG9pbnRlcklzRG93biA9IHRydWVcblxuICAgICAgaWYgKCF0aGlzLmludGVyYWN0aW5nKCkpIHtcbiAgICAgICAgdXRpbHMucG9pbnRlci5zZXRDb29yZHModGhpcy5jb29yZHMuc3RhcnQsIHRoaXMucG9pbnRlcnMubWFwKChwKSA9PiBwLnBvaW50ZXIpLCB0aGlzLl9ub3coKSlcblxuICAgICAgICB1dGlscy5wb2ludGVyLmNvcHlDb29yZHModGhpcy5jb29yZHMuY3VyLCB0aGlzLmNvb3Jkcy5zdGFydClcbiAgICAgICAgdXRpbHMucG9pbnRlci5jb3B5Q29vcmRzKHRoaXMuY29vcmRzLnByZXYsIHRoaXMuY29vcmRzLnN0YXJ0KVxuICAgICAgICB1dGlscy5wb2ludGVyLnBvaW50ZXJFeHRlbmQodGhpcy5kb3duUG9pbnRlciwgcG9pbnRlcilcblxuICAgICAgICB0aGlzLmRvd25FdmVudCA9IGV2ZW50XG4gICAgICAgIHBvaW50ZXJJbmZvLmRvd25UaW1lID0gdGhpcy5jb29yZHMuY3VyLnRpbWVTdGFtcFxuICAgICAgICBwb2ludGVySW5mby5kb3duVGFyZ2V0ID0gZXZlbnRUYXJnZXRcblxuICAgICAgICB0aGlzLnBvaW50ZXJXYXNNb3ZlZCA9IGZhbHNlXG4gICAgICB9XG4gICAgfVxuXG4gICAgdGhpcy5fdXBkYXRlTGF0ZXN0UG9pbnRlcihwb2ludGVyLCBldmVudCwgZXZlbnRUYXJnZXQpXG5cbiAgICB0aGlzLl9zaWduYWxzLmZpcmUoJ3VwZGF0ZS1wb2ludGVyJywge1xuICAgICAgcG9pbnRlcixcbiAgICAgIGV2ZW50LFxuICAgICAgZXZlbnRUYXJnZXQsXG4gICAgICBkb3duLFxuICAgICAgcG9pbnRlckluZm8sXG4gICAgICBwb2ludGVySW5kZXgsXG4gICAgICBpbnRlcmFjdGlvbjogdGhpcyxcbiAgICB9KVxuXG4gICAgcmV0dXJuIHBvaW50ZXJJbmRleFxuICB9XG5cbiAgcmVtb3ZlUG9pbnRlciAocG9pbnRlciwgZXZlbnQpIHtcbiAgICBjb25zdCBwb2ludGVySW5kZXggPSB0aGlzLmdldFBvaW50ZXJJbmRleChwb2ludGVyKVxuXG4gICAgaWYgKHBvaW50ZXJJbmRleCA9PT0gLTEpIHsgcmV0dXJuIH1cblxuICAgIGNvbnN0IHBvaW50ZXJJbmZvID0gdGhpcy5wb2ludGVyc1twb2ludGVySW5kZXhdXG5cbiAgICB0aGlzLl9zaWduYWxzLmZpcmUoJ3JlbW92ZS1wb2ludGVyJywge1xuICAgICAgcG9pbnRlcixcbiAgICAgIGV2ZW50LFxuICAgICAgcG9pbnRlckluZGV4LFxuICAgICAgcG9pbnRlckluZm8sXG4gICAgICBpbnRlcmFjdGlvbjogdGhpcyxcbiAgICB9KVxuXG4gICAgdGhpcy5wb2ludGVycy5zcGxpY2UocG9pbnRlckluZGV4LCAxKVxuICB9XG5cbiAgX3VwZGF0ZUxhdGVzdFBvaW50ZXIgKHBvaW50ZXIsIGV2ZW50LCBldmVudFRhcmdldCkge1xuICAgIHRoaXMuX2xhdGVzdFBvaW50ZXIucG9pbnRlciA9IHBvaW50ZXJcbiAgICB0aGlzLl9sYXRlc3RQb2ludGVyLmV2ZW50ID0gZXZlbnRcbiAgICB0aGlzLl9sYXRlc3RQb2ludGVyLmV2ZW50VGFyZ2V0ID0gZXZlbnRUYXJnZXRcbiAgfVxuXG4gIF9jcmVhdGVQcmVwYXJlZEV2ZW50IChldmVudDogSW50ZXJhY3QuUG9pbnRlckV2ZW50VHlwZSwgcGhhc2U6IEV2ZW50UGhhc2UsIHByZUVuZDogYm9vbGVhbiwgdHlwZTogc3RyaW5nKSB7XG4gICAgY29uc3QgYWN0aW9uTmFtZSA9IHRoaXMucHJlcGFyZWQubmFtZVxuXG4gICAgcmV0dXJuIG5ldyBJbnRlcmFjdEV2ZW50KHRoaXMsIGV2ZW50LCBhY3Rpb25OYW1lLCBwaGFzZSwgdGhpcy5lbGVtZW50LCBudWxsLCBwcmVFbmQsIHR5cGUpXG4gIH1cblxuICBfZmlyZUV2ZW50IChpRXZlbnQpIHtcbiAgICB0aGlzLmludGVyYWN0YWJsZS5maXJlKGlFdmVudClcblxuICAgIGlmICghdGhpcy5wcmV2RXZlbnQgfHwgaUV2ZW50LnRpbWVTdGFtcCA+PSB0aGlzLnByZXZFdmVudC50aW1lU3RhbXApIHtcbiAgICAgIHRoaXMucHJldkV2ZW50ID0gaUV2ZW50XG4gICAgfVxuICB9XG5cbiAgX2RvUGhhc2UgKHNpZ25hbEFyZzogUGFydGlhbDxJbnRlcmFjdC5TaWduYWxBcmc+KSB7XG4gICAgY29uc3QgeyBldmVudCwgcGhhc2UsIHByZUVuZCwgdHlwZSB9ID0gc2lnbmFsQXJnXG4gICAgY29uc3QgYmVmb3JlUmVzdWx0ID0gdGhpcy5fc2lnbmFscy5maXJlKGBiZWZvcmUtYWN0aW9uLSR7cGhhc2V9YCwgc2lnbmFsQXJnKVxuXG4gICAgaWYgKGJlZm9yZVJlc3VsdCA9PT0gZmFsc2UpIHtcbiAgICAgIHJldHVybiBmYWxzZVxuICAgIH1cblxuICAgIGNvbnN0IGlFdmVudCA9IHNpZ25hbEFyZy5pRXZlbnQgPSB0aGlzLl9jcmVhdGVQcmVwYXJlZEV2ZW50KGV2ZW50LCBwaGFzZSwgcHJlRW5kLCB0eXBlKVxuICAgIGNvbnN0IHsgcmVjdCB9ID0gdGhpc1xuXG4gICAgaWYgKHJlY3QpIHtcbiAgICAgIC8vIHVwZGF0ZSB0aGUgcmVjdCBtb2RpZmljYXRpb25zXG4gICAgICBjb25zdCBlZGdlcyA9IHRoaXMuZWRnZXMgfHwgdGhpcy5wcmVwYXJlZC5lZGdlcyB8fCB7IGxlZnQ6IHRydWUsIHJpZ2h0OiB0cnVlLCB0b3A6IHRydWUsIGJvdHRvbTogdHJ1ZSB9XG5cbiAgICAgIGlmIChlZGdlcy50b3ApICAgIHsgcmVjdC50b3AgICAgKz0gaUV2ZW50LmRlbHRhLnkgfVxuICAgICAgaWYgKGVkZ2VzLmJvdHRvbSkgeyByZWN0LmJvdHRvbSArPSBpRXZlbnQuZGVsdGEueSB9XG4gICAgICBpZiAoZWRnZXMubGVmdCkgICB7IHJlY3QubGVmdCAgICs9IGlFdmVudC5kZWx0YS54IH1cbiAgICAgIGlmIChlZGdlcy5yaWdodCkgIHsgcmVjdC5yaWdodCAgKz0gaUV2ZW50LmRlbHRhLnggfVxuXG4gICAgICByZWN0LndpZHRoID0gcmVjdC5yaWdodCAtIHJlY3QubGVmdFxuICAgICAgcmVjdC5oZWlnaHQgPSByZWN0LmJvdHRvbSAtIHJlY3QudG9wXG4gICAgfVxuXG4gICAgdGhpcy5fc2lnbmFscy5maXJlKGBhY3Rpb24tJHtwaGFzZX1gLCBzaWduYWxBcmcpXG5cbiAgICB0aGlzLl9maXJlRXZlbnQoaUV2ZW50KVxuXG4gICAgdGhpcy5fc2lnbmFscy5maXJlKGBhZnRlci1hY3Rpb24tJHtwaGFzZX1gLCBzaWduYWxBcmcpXG5cbiAgICByZXR1cm4gdHJ1ZVxuICB9XG5cbiAgX25vdyAoKSB7IHJldHVybiBEYXRlLm5vdygpIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgSW50ZXJhY3Rpb25cbmV4cG9ydCB7IFBvaW50ZXJJbmZvIH1cbiJdfQ==