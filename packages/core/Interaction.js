import * as utils from '@interactjs/utils';
import InteractEvent, { EventPhase } from './InteractEvent';
import PointerInfo from './PointerInfo';
import { ActionName } from './scope';
export var _ProxyValues;
(function (_ProxyValues) {
    _ProxyValues["interactable"] = "";
    _ProxyValues["element"] = "";
    _ProxyValues["prepared"] = "";
    _ProxyValues["pointerIsDown"] = "";
    _ProxyValues["pointerWasMoved"] = "";
    _ProxyValues["_proxy"] = "";
})(_ProxyValues || (_ProxyValues = {}));
export var _ProxyMethods;
(function (_ProxyMethods) {
    _ProxyMethods["start"] = "";
    _ProxyMethods["move"] = "";
    _ProxyMethods["end"] = "";
    _ProxyMethods["stop"] = "";
    _ProxyMethods["interacting"] = "";
})(_ProxyMethods || (_ProxyMethods = {}));
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
        this._stopped = true;
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
        this._proxy = {};
        for (const key in _ProxyValues) {
            Object.defineProperty(this._proxy, key, {
                get() { return that[key]; },
            });
        }
        for (const key in _ProxyMethods) {
            Object.defineProperty(this._proxy, key, {
                value: (...args) => that[key](...args),
            });
        }
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
        this._stopped = false;
        this._interacting = this._doPhase({
            interaction: this,
            event: this.downEvent,
            phase: EventPhase.Start,
        }) && !this._stopped;
        return this._interacting;
    }
    pointerMove(pointer, event, eventTarget) {
        if (!this.simulation && !(this.modifiers && this.modifiers.endPrevented)) {
            this.updatePointer(pointer, event, eventTarget, false);
            utils.pointer.setCoords(this.coords.cur, this.pointers.map(p => p.pointer), this._now());
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
        this._stopped = true;
        this.prepared.name = this.prevEvent = null;
    }
    getPointerIndex(pointer) {
        const pointerId = utils.pointer.getPointerId(pointer);
        // mouse and pen interactions may have only one pointer
        return (this.pointerType === 'mouse' || this.pointerType === 'pen')
            ? this.pointers.length - 1
            : utils.arr.findIndex(this.pointers, curPointer => curPointer.id === pointerId);
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
                utils.pointer.setCoords(this.coords.start, this.pointers.map(p => p.pointer), this._now());
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
    destroy() {
        this._latestPointer.pointer = null;
        this._latestPointer.event = null;
        this._latestPointer.eventTarget = null;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiSW50ZXJhY3Rpb24uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJJbnRlcmFjdGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEtBQUssS0FBSyxNQUFNLG1CQUFtQixDQUFBO0FBRTFDLE9BQU8sYUFBYSxFQUFFLEVBQUUsVUFBVSxFQUFFLE1BQU0saUJBQWlCLENBQUE7QUFDM0QsT0FBTyxXQUFXLE1BQU0sZUFBZSxDQUFBO0FBQ3ZDLE9BQU8sRUFBRSxVQUFVLEVBQUUsTUFBTSxTQUFTLENBQUE7QUFXcEMsTUFBTSxDQUFOLElBQVksWUFPWDtBQVBELFdBQVksWUFBWTtJQUN0QixpQ0FBaUIsQ0FBQTtJQUNqQiw0QkFBWSxDQUFBO0lBQ1osNkJBQWEsQ0FBQTtJQUNiLGtDQUFrQixDQUFBO0lBQ2xCLG9DQUFvQixDQUFBO0lBQ3BCLDJCQUFXLENBQUE7QUFDYixDQUFDLEVBUFcsWUFBWSxLQUFaLFlBQVksUUFPdkI7QUFFRCxNQUFNLENBQU4sSUFBWSxhQU1YO0FBTkQsV0FBWSxhQUFhO0lBQ3ZCLDJCQUFVLENBQUE7SUFDViwwQkFBUyxDQUFBO0lBQ1QseUJBQVEsQ0FBQTtJQUNSLDBCQUFTLENBQUE7SUFDVCxpQ0FBZ0IsQ0FBQTtBQUNsQixDQUFDLEVBTlcsYUFBYSxLQUFiLGFBQWEsUUFNeEI7QUFPRCxNQUFNLE9BQU8sV0FBVztJQThFdEIsTUFBTTtJQUNOLFlBQWEsRUFBRSxXQUFXLEVBQUUsT0FBTyxFQUFvRDtRQTlFdkYsNkNBQTZDO1FBQzdDLGlCQUFZLEdBQWlCLElBQUksQ0FBQTtRQUVqQyx5Q0FBeUM7UUFDekMsWUFBTyxHQUFxQixJQUFJLENBQUE7UUFRaEMscURBQXFEO1FBQ3JELGFBQVEsR0FBbUI7WUFDekIsSUFBSSxFQUFHLElBQUk7WUFDWCxJQUFJLEVBQUcsSUFBSTtZQUNYLEtBQUssRUFBRSxJQUFJO1NBQ1osQ0FBQTtRQUlELCtCQUErQjtRQUMvQixhQUFRLEdBQWtCLEVBQUUsQ0FBQTtRQUU1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SyxFQUFHO2dCQUFFLElBQUksQ0FBQyxLQUFLLElBQUssTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUE7YUFBRTtZQUVuRCxJQUFJLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQTtZQUNuQyxJQUFJLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQTtTQUNyQztRQUVELElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLFVBQVUsS0FBSyxFQUFFLEVBQUUsU0FBUyxDQUFDLENBQUE7UUFFaEQsSUFBSSxDQUFDLFVBQVUsQ0FBQyxNQUFNLENBQUMsQ0FBQTtRQUV2QixJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsS0FBSyxFQUFFLEVBQUUsU0FBUyxDQUFDLENBQUE7UUFFdEQsT0FBTyxJQUFJLENBQUE7SUFDYixDQUFDO0lBRUQsSUFBSSxLQUFNLE9BQU8sSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFBLENBQUMsQ0FBQztDQUM5QjtBQUVELGVBQWUsV0FBVyxDQUFBO0FBQzFCLE9BQU8sRUFBRSxXQUFXLEVBQUUsQ0FBQSIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIHV0aWxzIGZyb20gJ0BpbnRlcmFjdGpzL3V0aWxzJ1xuaW1wb3J0IEludGVyYWN0YWJsZSBmcm9tICcuL0ludGVyYWN0YWJsZSdcbmltcG9ydCBJbnRlcmFjdEV2ZW50LCB7IEV2ZW50UGhhc2UgfSBmcm9tICcuL0ludGVyYWN0RXZlbnQnXG5pbXBvcnQgUG9pbnRlckluZm8gZnJvbSAnLi9Qb2ludGVySW5mbydcbmltcG9ydCB7IEFjdGlvbk5hbWUgfSBmcm9tICcuL3Njb3BlJ1xuXG5leHBvcnQgaW50ZXJmYWNlIEFjdGlvblByb3BzPFQgZXh0ZW5kcyBBY3Rpb25OYW1lID0gYW55PiB7XG4gIG5hbWU6IFRcbiAgYXhpcz86ICd4JyB8ICd5JyB8ICd4eSdcbn1cblxuZXhwb3J0IGludGVyZmFjZSBTdGFydEFjdGlvbiBleHRlbmRzIEFjdGlvblByb3BzIHtcbiAgbmFtZTogQWN0aW9uTmFtZSB8IHN0cmluZ1xufVxuXG5leHBvcnQgZW51bSBfUHJveHlWYWx1ZXMge1xuICBpbnRlcmFjdGFibGUgPSAnJyxcbiAgZWxlbWVudCA9ICcnLFxuICBwcmVwYXJlZCA9ICcnLFxuICBwb2ludGVySXNEb3duID0gJycsXG4gIHBvaW50ZXJXYXNNb3ZlZCA9ICcnLFxuICBfcHJveHkgPSAnJ1xufVxuXG5leHBvcnQgZW51bSBfUHJveHlNZXRob2RzIHtcbiAgc3RhcnQgPSAnJyxcbiAgbW92ZSA9ICcnLFxuICBlbmQgPSAnJyxcbiAgc3RvcCA9ICcnLFxuICBpbnRlcmFjdGluZyA9ICcnXG59XG5cbmV4cG9ydCB0eXBlIF9JbnRlcmFjdGlvblByb3h5ID0gUGljazxcbkludGVyYWN0aW9uLFxua2V5b2YgdHlwZW9mIF9Qcm94eVZhbHVlcyB8IGtleW9mIHR5cGVvZiBfUHJveHlNZXRob2RzXG4+XG5cbmV4cG9ydCBjbGFzcyBJbnRlcmFjdGlvbjxUIGV4dGVuZHMgQWN0aW9uTmFtZSA9IGFueT4ge1xuICAvLyBjdXJyZW50IGludGVyYWN0YWJsZSBiZWluZyBpbnRlcmFjdGVkIHdpdGhcbiAgaW50ZXJhY3RhYmxlOiBJbnRlcmFjdGFibGUgPSBudWxsXG5cbiAgLy8gdGhlIHRhcmdldCBlbGVtZW50IG9mIHRoZSBpbnRlcmFjdGFibGVcbiAgZWxlbWVudDogSW50ZXJhY3QuRWxlbWVudCA9IG51bGxcbiAgcmVjdDogSW50ZXJhY3QuUmVjdCAmIEludGVyYWN0LlNpemVcbiAgZWRnZXM6IHtcbiAgICBbUCBpbiBrZXlvZiBJbnRlcmFjdC5SZWN0XT86IGJvb2xlYW5cbiAgfVxuXG4gIF9zaWduYWxzOiB1dGlscy5TaWduYWxzXG5cbiAgLy8gYWN0aW9uIHRoYXQncyByZWFkeSB0byBiZSBmaXJlZCBvbiBuZXh0IG1vdmUgZXZlbnRcbiAgcHJlcGFyZWQ6IEFjdGlvblByb3BzPFQ+ID0ge1xuICAgIG5hbWUgOiBudWxsLFxuICAgIGF4aXMgOiBudWxsLFxuICAgIGVkZ2VzOiBudWxsLFxuICB9XG5cbiAgcG9pbnRlclR5cGU6IHN0cmluZ1xuXG4gIC8vIGtlZXAgdHJhY2sgb2YgYWRkZWQgcG9pbnRlcnNcbiAgcG9pbnRlcnM6IFBvaW50ZXJJbmZvW10gPSBbXVxuXG4gIC8vIHBvaW50ZXJkb3duL21vdXNlZG93bi90b3VjaHN0YXJ0IGV2ZW50XG4gIGRvd25FdmVudDogSW50ZXJhY3QuUG9pbnRlckV2ZW50VHlwZSA9IG51bGxcblxuICBkb3duUG9pbnRlcjogSW50ZXJhY3QuUG9pbnRlclR5cGUgPSB7fSBhcyBJbnRlcmFjdC5Qb2ludGVyVHlwZVxuXG4gIF9sYXRlc3RQb2ludGVyOiB7XG4gICAgcG9pbnRlcjogSW50ZXJhY3QuRXZlbnRUYXJnZXRcbiAgICBldmVudDogSW50ZXJhY3QuUG9pbnRlckV2ZW50VHlwZVxuICAgIGV2ZW50VGFyZ2V0OiBOb2RlXG4gIH0gPSB7XG4gICAgcG9pbnRlcjogbnVsbCxcbiAgICBldmVudDogbnVsbCxcbiAgICBldmVudFRhcmdldDogbnVsbCxcbiAgfVxuXG4gIC8vIHByZXZpb3VzIGFjdGlvbiBldmVudFxuICBwcmV2RXZlbnQ6IEludGVyYWN0RXZlbnQ8VD4gPSBudWxsXG5cbiAgcG9pbnRlcklzRG93biA9IGZhbHNlXG4gIHBvaW50ZXJXYXNNb3ZlZCA9IGZhbHNlXG4gIF9pbnRlcmFjdGluZyA9IGZhbHNlXG4gIF9lbmRpbmcgPSBmYWxzZVxuICBfc3RvcHBlZCA9IHRydWVcbiAgX3Byb3h5OiBfSW50ZXJhY3Rpb25Qcm94eSA9IG51bGxcblxuICBzaW11bGF0aW9uID0gbnVsbFxuXG4gIGdldCBwb2ludGVyTW92ZVRvbGVyYW5jZSAoKSB7XG4gICAgcmV0dXJuIDFcbiAgfVxuXG4gIC8qKlxuICAgKiBAYWxpYXMgSW50ZXJhY3Rpb24ucHJvdG90eXBlLm1vdmVcbiAgICovXG4gIGRvTW92ZSA9IHV0aWxzLndhcm5PbmNlKFxuICAgIGZ1bmN0aW9uICh0aGlzOiBJbnRlcmFjdGlvbiwgc2lnbmFsQXJnOiBhbnkpIHtcbiAgICAgIHRoaXMubW92ZShzaWduYWxBcmcpXG4gICAgfSxcbiAgICAnVGhlIGludGVyYWN0aW9uLmRvTW92ZSgpIG1ldGhvZCBoYXMgYmVlbiByZW5hbWVkIHRvIGludGVyYWN0aW9uLm1vdmUoKScpXG5cbiAgY29vcmRzID0ge1xuICAgIC8vIFN0YXJ0aW5nIEludGVyYWN0RXZlbnQgcG9pbnRlciBjb29yZGluYXRlc1xuICAgIHN0YXJ0OiB1dGlscy5wb2ludGVyLm5ld0Nvb3JkcygpLFxuICAgIC8vIFByZXZpb3VzIG5hdGl2ZSBwb2ludGVyIG1vdmUgZXZlbnQgY29vcmRpbmF0ZXNcbiAgICBwcmV2OiB1dGlscy5wb2ludGVyLm5ld0Nvb3JkcygpLFxuICAgIC8vIGN1cnJlbnQgbmF0aXZlIHBvaW50ZXIgbW92ZSBldmVudCBjb29yZGluYXRlc1xuICAgIGN1cjogdXRpbHMucG9pbnRlci5uZXdDb29yZHMoKSxcbiAgICAvLyBDaGFuZ2UgaW4gY29vcmRpbmF0ZXMgYW5kIHRpbWUgb2YgdGhlIHBvaW50ZXJcbiAgICBkZWx0YTogdXRpbHMucG9pbnRlci5uZXdDb29yZHMoKSxcbiAgICAvLyBwb2ludGVyIHZlbG9jaXR5XG4gICAgdmVsb2NpdHk6IHV0aWxzLnBvaW50ZXIubmV3Q29vcmRzKCksXG4gIH1cblxuICAvKiogKi9cbiAgY29uc3RydWN0b3IgKHsgcG9pbnRlclR5cGUsIHNpZ25hbHMgfTogeyBwb2ludGVyVHlwZT86IHN0cmluZywgc2lnbmFsczogdXRpbHMuU2lnbmFscyB9KSB7XG4gICAgdGhpcy5fc2lnbmFscyA9IHNpZ25hbHNcbiAgICB0aGlzLnBvaW50ZXJUeXBlID0gcG9pbnRlclR5cGVcblxuICAgIGNvbnN0IHRoYXQgPSB0aGlzXG5cbiAgICB0aGlzLl9wcm94eSA9IHt9IGFzIF9JbnRlcmFjdGlvblByb3h5XG5cbiAgICBmb3IgKGNvbnN0IGtleSBpbiBfUHJveHlWYWx1ZXMpIHtcbiAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0aGlzLl9wcm94eSwga2V5LCB7XG4gICAgICAgIGdldCAoKSB7IHJldHVybiB0aGF0W2tleV0gfSxcbiAgICAgIH0pXG4gICAgfVxuXG4gICAgZm9yIChjb25zdCBrZXkgaW4gX1Byb3h5TWV0aG9kcykge1xuICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRoaXMuX3Byb3h5LCBrZXksIHtcbiAgICAgICAgdmFsdWU6ICguLi5hcmdzKSA9PiB0aGF0W2tleV0oLi4uYXJncyksXG4gICAgICB9KVxuICAgIH1cblxuICAgIHRoaXMuX3NpZ25hbHMuZmlyZSgnbmV3JywgeyBpbnRlcmFjdGlvbjogdGhpcyB9KVxuICB9XG5cbiAgcG9pbnRlckRvd24gKHBvaW50ZXI6IEludGVyYWN0LlBvaW50ZXJUeXBlLCBldmVudDogSW50ZXJhY3QuUG9pbnRlckV2ZW50VHlwZSwgZXZlbnRUYXJnZXQ6IE5vZGUpIHtcbiAgICBjb25zdCBwb2ludGVySW5kZXggPSB0aGlzLnVwZGF0ZVBvaW50ZXIocG9pbnRlciwgZXZlbnQsIGV2ZW50VGFyZ2V0LCB0cnVlKVxuXG4gICAgdGhpcy5fc2lnbmFscy5maXJlKCdkb3duJywge1xuICAgICAgcG9pbnRlcixcbiAgICAgIGV2ZW50LFxuICAgICAgZXZlbnRUYXJnZXQsXG4gICAgICBwb2ludGVySW5kZXgsXG4gICAgICBpbnRlcmFjdGlvbjogdGhpcyxcbiAgICB9KVxuICB9XG5cbiAgLyoqXG4gICAqIGBgYGpzXG4gICAqIGludGVyYWN0KHRhcmdldClcbiAgICogICAuZHJhZ2dhYmxlKHtcbiAgICogICAgIC8vIGRpc2FibGUgdGhlIGRlZmF1bHQgZHJhZyBzdGFydCBieSBkb3duLT5tb3ZlXG4gICAqICAgICBtYW51YWxTdGFydDogdHJ1ZVxuICAgKiAgIH0pXG4gICAqICAgLy8gc3RhcnQgZHJhZ2dpbmcgYWZ0ZXIgdGhlIHVzZXIgaG9sZHMgdGhlIHBvaW50ZXIgZG93blxuICAgKiAgIC5vbignaG9sZCcsIGZ1bmN0aW9uIChldmVudCkge1xuICAgKiAgICAgdmFyIGludGVyYWN0aW9uID0gZXZlbnQuaW50ZXJhY3Rpb25cbiAgICpcbiAgICogICAgIGlmICghaW50ZXJhY3Rpb24uaW50ZXJhY3RpbmcoKSkge1xuICAgKiAgICAgICBpbnRlcmFjdGlvbi5zdGFydCh7IG5hbWU6ICdkcmFnJyB9LFxuICAgKiAgICAgICAgICAgICAgICAgICAgICAgICBldmVudC5pbnRlcmFjdGFibGUsXG4gICAqICAgICAgICAgICAgICAgICAgICAgICAgIGV2ZW50LmN1cnJlbnRUYXJnZXQpXG4gICAqICAgICB9XG4gICAqIH0pXG4gICAqIGBgYFxuICAgKlxuICAgKiBTdGFydCBhbiBhY3Rpb24gd2l0aCB0aGUgZ2l2ZW4gSW50ZXJhY3RhYmxlIGFuZCBFbGVtZW50IGFzIHRhcnRnZXRzLiBUaGVcbiAgICogYWN0aW9uIG11c3QgYmUgZW5hYmxlZCBmb3IgdGhlIHRhcmdldCBJbnRlcmFjdGFibGUgYW5kIGFuIGFwcHJvcHJpYXRlXG4gICAqIG51bWJlciBvZiBwb2ludGVycyBtdXN0IGJlIGhlbGQgZG93biAtIDEgZm9yIGRyYWcvcmVzaXplLCAyIGZvciBnZXN0dXJlLlxuICAgKlxuICAgKiBVc2UgaXQgd2l0aCBgaW50ZXJhY3RhYmxlLjxhY3Rpb24+YWJsZSh7IG1hbnVhbFN0YXJ0OiBmYWxzZSB9KWAgdG8gYWx3YXlzXG4gICAqIFtzdGFydCBhY3Rpb25zIG1hbnVhbGx5XShodHRwczovL2dpdGh1Yi5jb20vdGF5ZS9pbnRlcmFjdC5qcy9pc3N1ZXMvMTE0KVxuICAgKlxuICAgKiBAcGFyYW0ge29iamVjdH0gYWN0aW9uICAgVGhlIGFjdGlvbiB0byBiZSBwZXJmb3JtZWQgLSBkcmFnLCByZXNpemUsIGV0Yy5cbiAgICogQHBhcmFtIHtJbnRlcmFjdGFibGV9IHRhcmdldCAgVGhlIEludGVyYWN0YWJsZSB0byB0YXJnZXRcbiAgICogQHBhcmFtIHtFbGVtZW50fSBlbGVtZW50IFRoZSBET00gRWxlbWVudCB0byB0YXJnZXRcbiAgICogQHJldHVybiB7b2JqZWN0fSBpbnRlcmFjdFxuICAgKi9cbiAgc3RhcnQgKGFjdGlvbjogU3RhcnRBY3Rpb24sIGludGVyYWN0YWJsZTogSW50ZXJhY3RhYmxlLCBlbGVtZW50OiBJbnRlcmFjdC5FbGVtZW50KSB7XG4gICAgaWYgKHRoaXMuaW50ZXJhY3RpbmcoKSB8fFxuICAgICAgICAhdGhpcy5wb2ludGVySXNEb3duIHx8XG4gICAgICAgIHRoaXMucG9pbnRlcnMubGVuZ3RoIDwgKGFjdGlvbi5uYW1lID09PSBBY3Rpb25OYW1lLkdlc3R1cmUgPyAyIDogMSkgfHxcbiAgICAgICAgIWludGVyYWN0YWJsZS5vcHRpb25zW2FjdGlvbi5uYW1lXS5lbmFibGVkKSB7XG4gICAgICByZXR1cm4gZmFsc2VcbiAgICB9XG5cbiAgICB1dGlscy5jb3B5QWN0aW9uKHRoaXMucHJlcGFyZWQsIGFjdGlvbilcblxuICAgIHRoaXMuaW50ZXJhY3RhYmxlID0gaW50ZXJhY3RhYmxlXG4gICAgdGhpcy5lbGVtZW50ICAgICAgPSBlbGVtZW50XG4gICAgdGhpcy5yZWN0ICAgICAgICAgPSBpbnRlcmFjdGFibGUuZ2V0UmVjdChlbGVtZW50KVxuICAgIHRoaXMuZWRnZXMgICAgICAgID0gdGhpcy5wcmVwYXJlZC5lZGdlc1xuICAgIHRoaXMuX3N0b3BwZWQgICAgID0gZmFsc2VcbiAgICB0aGlzLl9pbnRlcmFjdGluZyA9IHRoaXMuX2RvUGhhc2Uoe1xuICAgICAgaW50ZXJhY3Rpb246IHRoaXMsXG4gICAgICBldmVudDogdGhpcy5kb3duRXZlbnQsXG4gICAgICBwaGFzZTogRXZlbnRQaGFzZS5TdGFydCxcbiAgICB9KSAmJiAhdGhpcy5fc3RvcHBlZFxuXG4gICAgcmV0dXJuIHRoaXMuX2ludGVyYWN0aW5nXG4gIH1cblxuICBwb2ludGVyTW92ZSAocG9pbnRlcjogSW50ZXJhY3QuUG9pbnRlclR5cGUsIGV2ZW50OiBJbnRlcmFjdC5Qb2ludGVyRXZlbnRUeXBlLCBldmVudFRhcmdldDogTm9kZSkge1xuICAgIGlmICghdGhpcy5zaW11bGF0aW9uICYmICEodGhpcy5tb2RpZmllcnMgJiYgdGhpcy5tb2RpZmllcnMuZW5kUHJldmVudGVkKSkge1xuICAgICAgdGhpcy51cGRhdGVQb2ludGVyKHBvaW50ZXIsIGV2ZW50LCBldmVudFRhcmdldCwgZmFsc2UpXG4gICAgICB1dGlscy5wb2ludGVyLnNldENvb3Jkcyh0aGlzLmNvb3Jkcy5jdXIsIHRoaXMucG9pbnRlcnMubWFwKHAgPT4gcC5wb2ludGVyKSwgdGhpcy5fbm93KCkpXG4gICAgfVxuXG4gICAgY29uc3QgZHVwbGljYXRlTW92ZSA9ICh0aGlzLmNvb3Jkcy5jdXIucGFnZS54ID09PSB0aGlzLmNvb3Jkcy5wcmV2LnBhZ2UueCAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5jb29yZHMuY3VyLnBhZ2UueSA9PT0gdGhpcy5jb29yZHMucHJldi5wYWdlLnkgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuY29vcmRzLmN1ci5jbGllbnQueCA9PT0gdGhpcy5jb29yZHMucHJldi5jbGllbnQueCAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5jb29yZHMuY3VyLmNsaWVudC55ID09PSB0aGlzLmNvb3Jkcy5wcmV2LmNsaWVudC55KVxuXG4gICAgbGV0IGR4XG4gICAgbGV0IGR5XG5cbiAgICAvLyByZWdpc3RlciBtb3ZlbWVudCBncmVhdGVyIHRoYW4gcG9pbnRlck1vdmVUb2xlcmFuY2VcbiAgICBpZiAodGhpcy5wb2ludGVySXNEb3duICYmICF0aGlzLnBvaW50ZXJXYXNNb3ZlZCkge1xuICAgICAgZHggPSB0aGlzLmNvb3Jkcy5jdXIuY2xpZW50LnggLSB0aGlzLmNvb3Jkcy5zdGFydC5jbGllbnQueFxuICAgICAgZHkgPSB0aGlzLmNvb3Jkcy5jdXIuY2xpZW50LnkgLSB0aGlzLmNvb3Jkcy5zdGFydC5jbGllbnQueVxuXG4gICAgICB0aGlzLnBvaW50ZXJXYXNNb3ZlZCA9IHV0aWxzLmh5cG90KGR4LCBkeSkgPiB0aGlzLnBvaW50ZXJNb3ZlVG9sZXJhbmNlXG4gICAgfVxuXG4gICAgY29uc3Qgc2lnbmFsQXJnID0ge1xuICAgICAgcG9pbnRlcixcbiAgICAgIHBvaW50ZXJJbmRleDogdGhpcy5nZXRQb2ludGVySW5kZXgocG9pbnRlciksXG4gICAgICBldmVudCxcbiAgICAgIGV2ZW50VGFyZ2V0LFxuICAgICAgZHgsXG4gICAgICBkeSxcbiAgICAgIGR1cGxpY2F0ZTogZHVwbGljYXRlTW92ZSxcbiAgICAgIGludGVyYWN0aW9uOiB0aGlzLFxuICAgIH1cblxuICAgIGlmICghZHVwbGljYXRlTW92ZSkge1xuICAgICAgLy8gc2V0IHBvaW50ZXIgY29vcmRpbmF0ZSwgdGltZSBjaGFuZ2VzIGFuZCB2ZWxvY2l0eVxuICAgICAgdXRpbHMucG9pbnRlci5zZXRDb29yZERlbHRhcyh0aGlzLmNvb3Jkcy5kZWx0YSwgdGhpcy5jb29yZHMucHJldiwgdGhpcy5jb29yZHMuY3VyKVxuICAgICAgdXRpbHMucG9pbnRlci5zZXRDb29yZFZlbG9jaXR5KHRoaXMuY29vcmRzLnZlbG9jaXR5LCB0aGlzLmNvb3Jkcy5kZWx0YSlcbiAgICB9XG5cbiAgICB0aGlzLl9zaWduYWxzLmZpcmUoJ21vdmUnLCBzaWduYWxBcmcpXG5cbiAgICBpZiAoIWR1cGxpY2F0ZU1vdmUpIHtcbiAgICAgIC8vIGlmIGludGVyYWN0aW5nLCBmaXJlIGFuICdhY3Rpb24tbW92ZScgc2lnbmFsIGV0Y1xuICAgICAgaWYgKHRoaXMuaW50ZXJhY3RpbmcoKSkge1xuICAgICAgICB0aGlzLm1vdmUoc2lnbmFsQXJnKVxuICAgICAgfVxuXG4gICAgICBpZiAodGhpcy5wb2ludGVyV2FzTW92ZWQpIHtcbiAgICAgICAgdXRpbHMucG9pbnRlci5jb3B5Q29vcmRzKHRoaXMuY29vcmRzLnByZXYsIHRoaXMuY29vcmRzLmN1cilcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogYGBganNcbiAgICogaW50ZXJhY3QodGFyZ2V0KVxuICAgKiAgIC5kcmFnZ2FibGUodHJ1ZSlcbiAgICogICAub24oJ2RyYWdtb3ZlJywgZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAqICAgICBpZiAoc29tZUNvbmRpdGlvbikge1xuICAgKiAgICAgICAvLyBjaGFuZ2UgdGhlIHNuYXAgc2V0dGluZ3NcbiAgICogICAgICAgZXZlbnQuaW50ZXJhY3RhYmxlLmRyYWdnYWJsZSh7IHNuYXA6IHsgdGFyZ2V0czogW10gfX0pXG4gICAqICAgICAgIC8vIGZpcmUgYW5vdGhlciBtb3ZlIGV2ZW50IHdpdGggcmUtY2FsY3VsYXRlZCBzbmFwXG4gICAqICAgICAgIGV2ZW50LmludGVyYWN0aW9uLm1vdmUoKVxuICAgKiAgICAgfVxuICAgKiAgIH0pXG4gICAqIGBgYFxuICAgKlxuICAgKiBGb3JjZSBhIG1vdmUgb2YgdGhlIGN1cnJlbnQgYWN0aW9uIGF0IHRoZSBzYW1lIGNvb3JkaW5hdGVzLiBVc2VmdWwgaWZcbiAgICogc25hcC9yZXN0cmljdCBoYXMgYmVlbiBjaGFuZ2VkIGFuZCB5b3Ugd2FudCBhIG1vdmVtZW50IHdpdGggdGhlIG5ld1xuICAgKiBzZXR0aW5ncy5cbiAgICovXG4gIG1vdmUgKHNpZ25hbEFyZz8pIHtcbiAgICBzaWduYWxBcmcgPSB1dGlscy5leHRlbmQoe1xuICAgICAgcG9pbnRlcjogdGhpcy5fbGF0ZXN0UG9pbnRlci5wb2ludGVyLFxuICAgICAgZXZlbnQ6IHRoaXMuX2xhdGVzdFBvaW50ZXIuZXZlbnQsXG4gICAgICBldmVudFRhcmdldDogdGhpcy5fbGF0ZXN0UG9pbnRlci5ldmVudFRhcmdldCxcbiAgICAgIGludGVyYWN0aW9uOiB0aGlzLFxuICAgIH0sIHNpZ25hbEFyZyB8fCB7fSlcblxuICAgIHNpZ25hbEFyZy5waGFzZSA9IEV2ZW50UGhhc2UuTW92ZVxuXG4gICAgdGhpcy5fZG9QaGFzZShzaWduYWxBcmcpXG4gIH1cblxuICAvLyBFbmQgaW50ZXJhY3QgbW92ZSBldmVudHMgYW5kIHN0b3AgYXV0by1zY3JvbGwgdW5sZXNzIHNpbXVsYXRpb24gaXMgcnVubmluZ1xuICBwb2ludGVyVXAgKHBvaW50ZXI6IEludGVyYWN0LlBvaW50ZXJUeXBlLCBldmVudDogSW50ZXJhY3QuUG9pbnRlckV2ZW50VHlwZSwgZXZlbnRUYXJnZXQ6IE5vZGUsIGN1ckV2ZW50VGFyZ2V0OiBFdmVudFRhcmdldCkge1xuICAgIGxldCBwb2ludGVySW5kZXggPSB0aGlzLmdldFBvaW50ZXJJbmRleChwb2ludGVyKVxuXG4gICAgaWYgKHBvaW50ZXJJbmRleCA9PT0gLTEpIHtcbiAgICAgIHBvaW50ZXJJbmRleCA9IHRoaXMudXBkYXRlUG9pbnRlcihwb2ludGVyLCBldmVudCwgZXZlbnRUYXJnZXQsIGZhbHNlKVxuICAgIH1cblxuICAgIHRoaXMuX3NpZ25hbHMuZmlyZSgvY2FuY2VsJC9pLnRlc3QoZXZlbnQudHlwZSkgPyAnY2FuY2VsJyA6ICd1cCcsIHtcbiAgICAgIHBvaW50ZXIsXG4gICAgICBwb2ludGVySW5kZXgsXG4gICAgICBldmVudCxcbiAgICAgIGV2ZW50VGFyZ2V0LFxuICAgICAgY3VyRXZlbnRUYXJnZXQsXG4gICAgICBpbnRlcmFjdGlvbjogdGhpcyxcbiAgICB9KVxuXG4gICAgaWYgKCF0aGlzLnNpbXVsYXRpb24pIHtcbiAgICAgIHRoaXMuZW5kKGV2ZW50KVxuICAgIH1cblxuICAgIHRoaXMucG9pbnRlcklzRG93biA9IGZhbHNlXG4gICAgdGhpcy5yZW1vdmVQb2ludGVyKHBvaW50ZXIsIGV2ZW50KVxuICB9XG5cbiAgZG9jdW1lbnRCbHVyIChldmVudCkge1xuICAgIHRoaXMuZW5kKGV2ZW50KVxuICAgIHRoaXMuX3NpZ25hbHMuZmlyZSgnYmx1cicsIHsgZXZlbnQsIGludGVyYWN0aW9uOiB0aGlzIH0pXG4gIH1cblxuICAvKipcbiAgICogYGBganNcbiAgICogaW50ZXJhY3QodGFyZ2V0KVxuICAgKiAgIC5kcmFnZ2FibGUodHJ1ZSlcbiAgICogICAub24oJ21vdmUnLCBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICogICAgIGlmIChldmVudC5wYWdlWCA+IDEwMDApIHtcbiAgICogICAgICAgLy8gZW5kIHRoZSBjdXJyZW50IGFjdGlvblxuICAgKiAgICAgICBldmVudC5pbnRlcmFjdGlvbi5lbmQoKVxuICAgKiAgICAgICAvLyBzdG9wIGFsbCBmdXJ0aGVyIGxpc3RlbmVycyBmcm9tIGJlaW5nIGNhbGxlZFxuICAgKiAgICAgICBldmVudC5zdG9wSW1tZWRpYXRlUHJvcGFnYXRpb24oKVxuICAgKiAgICAgfVxuICAgKiAgIH0pXG4gICAqIGBgYFxuICAgKlxuICAgKiBAcGFyYW0ge1BvaW50ZXJFdmVudH0gW2V2ZW50XVxuICAgKi9cbiAgZW5kIChldmVudD86IEludGVyYWN0LlBvaW50ZXJFdmVudFR5cGUpIHtcbiAgICB0aGlzLl9lbmRpbmcgPSB0cnVlXG4gICAgZXZlbnQgPSBldmVudCB8fCB0aGlzLl9sYXRlc3RQb2ludGVyLmV2ZW50XG4gICAgbGV0IGVuZFBoYXNlUmVzdWx0XG5cbiAgICBpZiAodGhpcy5pbnRlcmFjdGluZygpKSB7XG4gICAgICBlbmRQaGFzZVJlc3VsdCA9IHRoaXMuX2RvUGhhc2Uoe1xuICAgICAgICBldmVudCxcbiAgICAgICAgaW50ZXJhY3Rpb246IHRoaXMsXG4gICAgICAgIHBoYXNlOiBFdmVudFBoYXNlLkVuZCxcbiAgICAgIH0pXG4gICAgfVxuXG4gICAgdGhpcy5fZW5kaW5nID0gZmFsc2VcblxuICAgIGlmIChlbmRQaGFzZVJlc3VsdCA9PT0gdHJ1ZSkge1xuICAgICAgdGhpcy5zdG9wKClcbiAgICB9XG4gIH1cblxuICBjdXJyZW50QWN0aW9uICgpIHtcbiAgICByZXR1cm4gdGhpcy5faW50ZXJhY3RpbmcgPyB0aGlzLnByZXBhcmVkLm5hbWUgOiBudWxsXG4gIH1cblxuICBpbnRlcmFjdGluZyAoKSB7XG4gICAgcmV0dXJuIHRoaXMuX2ludGVyYWN0aW5nXG4gIH1cblxuICAvKiogKi9cbiAgc3RvcCAoKSB7XG4gICAgdGhpcy5fc2lnbmFscy5maXJlKCdzdG9wJywgeyBpbnRlcmFjdGlvbjogdGhpcyB9KVxuXG4gICAgdGhpcy5pbnRlcmFjdGFibGUgPSB0aGlzLmVsZW1lbnQgPSBudWxsXG5cbiAgICB0aGlzLl9pbnRlcmFjdGluZyA9IGZhbHNlXG4gICAgdGhpcy5fc3RvcHBlZCA9IHRydWVcbiAgICB0aGlzLnByZXBhcmVkLm5hbWUgPSB0aGlzLnByZXZFdmVudCA9IG51bGxcbiAgfVxuXG4gIGdldFBvaW50ZXJJbmRleCAocG9pbnRlcikge1xuICAgIGNvbnN0IHBvaW50ZXJJZCA9IHV0aWxzLnBvaW50ZXIuZ2V0UG9pbnRlcklkKHBvaW50ZXIpXG5cbiAgICAvLyBtb3VzZSBhbmQgcGVuIGludGVyYWN0aW9ucyBtYXkgaGF2ZSBvbmx5IG9uZSBwb2ludGVyXG4gICAgcmV0dXJuICh0aGlzLnBvaW50ZXJUeXBlID09PSAnbW91c2UnIHx8IHRoaXMucG9pbnRlclR5cGUgPT09ICdwZW4nKVxuICAgICAgPyB0aGlzLnBvaW50ZXJzLmxlbmd0aCAtIDFcbiAgICAgIDogdXRpbHMuYXJyLmZpbmRJbmRleCh0aGlzLnBvaW50ZXJzLCBjdXJQb2ludGVyID0+IGN1clBvaW50ZXIuaWQgPT09IHBvaW50ZXJJZClcbiAgfVxuXG4gIGdldFBvaW50ZXJJbmZvIChwb2ludGVyKSB7XG4gICAgcmV0dXJuIHRoaXMucG9pbnRlcnNbdGhpcy5nZXRQb2ludGVySW5kZXgocG9pbnRlcildXG4gIH1cblxuICB1cGRhdGVQb2ludGVyIChwb2ludGVyOiBJbnRlcmFjdC5Qb2ludGVyVHlwZSwgZXZlbnQ6IEludGVyYWN0LlBvaW50ZXJFdmVudFR5cGUsIGV2ZW50VGFyZ2V0OiBOb2RlLCBkb3duPzogYm9vbGVhbikge1xuICAgIGNvbnN0IGlkID0gdXRpbHMucG9pbnRlci5nZXRQb2ludGVySWQocG9pbnRlcilcbiAgICBsZXQgcG9pbnRlckluZGV4ID0gdGhpcy5nZXRQb2ludGVySW5kZXgocG9pbnRlcilcbiAgICBsZXQgcG9pbnRlckluZm8gPSB0aGlzLnBvaW50ZXJzW3BvaW50ZXJJbmRleF1cblxuICAgIGRvd24gPSBkb3duID09PSBmYWxzZVxuICAgICAgPyBmYWxzZVxuICAgICAgOiBkb3duIHx8IC8oZG93bnxzdGFydCkkL2kudGVzdChldmVudC50eXBlKVxuXG4gICAgaWYgKCFwb2ludGVySW5mbykge1xuICAgICAgcG9pbnRlckluZm8gPSBuZXcgUG9pbnRlckluZm8oXG4gICAgICAgIGlkLFxuICAgICAgICBwb2ludGVyLFxuICAgICAgICBldmVudCxcbiAgICAgICAgbnVsbCxcbiAgICAgICAgbnVsbCxcbiAgICAgIClcblxuICAgICAgcG9pbnRlckluZGV4ID0gdGhpcy5wb2ludGVycy5sZW5ndGhcbiAgICAgIHRoaXMucG9pbnRlcnMucHVzaChwb2ludGVySW5mbylcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICBwb2ludGVySW5mby5wb2ludGVyID0gcG9pbnRlclxuICAgIH1cblxuICAgIGlmIChkb3duKSB7XG4gICAgICB0aGlzLnBvaW50ZXJJc0Rvd24gPSB0cnVlXG5cbiAgICAgIGlmICghdGhpcy5pbnRlcmFjdGluZygpKSB7XG4gICAgICAgIHV0aWxzLnBvaW50ZXIuc2V0Q29vcmRzKHRoaXMuY29vcmRzLnN0YXJ0LCB0aGlzLnBvaW50ZXJzLm1hcChwID0+IHAucG9pbnRlciksIHRoaXMuX25vdygpKVxuXG4gICAgICAgIHV0aWxzLnBvaW50ZXIuY29weUNvb3Jkcyh0aGlzLmNvb3Jkcy5jdXIsIHRoaXMuY29vcmRzLnN0YXJ0KVxuICAgICAgICB1dGlscy5wb2ludGVyLmNvcHlDb29yZHModGhpcy5jb29yZHMucHJldiwgdGhpcy5jb29yZHMuc3RhcnQpXG4gICAgICAgIHV0aWxzLnBvaW50ZXIucG9pbnRlckV4dGVuZCh0aGlzLmRvd25Qb2ludGVyLCBwb2ludGVyKVxuXG4gICAgICAgIHRoaXMuZG93bkV2ZW50ID0gZXZlbnRcbiAgICAgICAgcG9pbnRlckluZm8uZG93blRpbWUgPSB0aGlzLmNvb3Jkcy5jdXIudGltZVN0YW1wXG4gICAgICAgIHBvaW50ZXJJbmZvLmRvd25UYXJnZXQgPSBldmVudFRhcmdldFxuXG4gICAgICAgIHRoaXMucG9pbnRlcldhc01vdmVkID0gZmFsc2VcbiAgICAgIH1cbiAgICB9XG5cbiAgICB0aGlzLl91cGRhdGVMYXRlc3RQb2ludGVyKHBvaW50ZXIsIGV2ZW50LCBldmVudFRhcmdldClcblxuICAgIHRoaXMuX3NpZ25hbHMuZmlyZSgndXBkYXRlLXBvaW50ZXInLCB7XG4gICAgICBwb2ludGVyLFxuICAgICAgZXZlbnQsXG4gICAgICBldmVudFRhcmdldCxcbiAgICAgIGRvd24sXG4gICAgICBwb2ludGVySW5mbyxcbiAgICAgIHBvaW50ZXJJbmRleCxcbiAgICAgIGludGVyYWN0aW9uOiB0aGlzLFxuICAgIH0pXG5cbiAgICByZXR1cm4gcG9pbnRlckluZGV4XG4gIH1cblxuICByZW1vdmVQb2ludGVyIChwb2ludGVyOiBJbnRlcmFjdC5Qb2ludGVyVHlwZSwgZXZlbnQ6IEludGVyYWN0LlBvaW50ZXJFdmVudFR5cGUpIHtcbiAgICBjb25zdCBwb2ludGVySW5kZXggPSB0aGlzLmdldFBvaW50ZXJJbmRleChwb2ludGVyKVxuXG4gICAgaWYgKHBvaW50ZXJJbmRleCA9PT0gLTEpIHsgcmV0dXJuIH1cblxuICAgIGNvbnN0IHBvaW50ZXJJbmZvID0gdGhpcy5wb2ludGVyc1twb2ludGVySW5kZXhdXG5cbiAgICB0aGlzLl9zaWduYWxzLmZpcmUoJ3JlbW92ZS1wb2ludGVyJywge1xuICAgICAgcG9pbnRlcixcbiAgICAgIGV2ZW50LFxuICAgICAgcG9pbnRlckluZGV4LFxuICAgICAgcG9pbnRlckluZm8sXG4gICAgICBpbnRlcmFjdGlvbjogdGhpcyxcbiAgICB9KVxuXG4gICAgdGhpcy5wb2ludGVycy5zcGxpY2UocG9pbnRlckluZGV4LCAxKVxuICB9XG5cbiAgX3VwZGF0ZUxhdGVzdFBvaW50ZXIgKHBvaW50ZXIsIGV2ZW50LCBldmVudFRhcmdldCkge1xuICAgIHRoaXMuX2xhdGVzdFBvaW50ZXIucG9pbnRlciA9IHBvaW50ZXJcbiAgICB0aGlzLl9sYXRlc3RQb2ludGVyLmV2ZW50ID0gZXZlbnRcbiAgICB0aGlzLl9sYXRlc3RQb2ludGVyLmV2ZW50VGFyZ2V0ID0gZXZlbnRUYXJnZXRcbiAgfVxuXG4gIGRlc3Ryb3kgKCkge1xuICAgIHRoaXMuX2xhdGVzdFBvaW50ZXIucG9pbnRlciA9IG51bGxcbiAgICB0aGlzLl9sYXRlc3RQb2ludGVyLmV2ZW50ID0gbnVsbFxuICAgIHRoaXMuX2xhdGVzdFBvaW50ZXIuZXZlbnRUYXJnZXQgPSBudWxsXG4gIH1cblxuICBfY3JlYXRlUHJlcGFyZWRFdmVudCAoZXZlbnQ6IEludGVyYWN0LlBvaW50ZXJFdmVudFR5cGUsIHBoYXNlOiBFdmVudFBoYXNlLCBwcmVFbmQ6IGJvb2xlYW4sIHR5cGU6IHN0cmluZykge1xuICAgIGNvbnN0IGFjdGlvbk5hbWUgPSB0aGlzLnByZXBhcmVkLm5hbWVcblxuICAgIHJldHVybiBuZXcgSW50ZXJhY3RFdmVudCh0aGlzLCBldmVudCwgYWN0aW9uTmFtZSwgcGhhc2UsIHRoaXMuZWxlbWVudCwgbnVsbCwgcHJlRW5kLCB0eXBlKVxuICB9XG5cbiAgX2ZpcmVFdmVudCAoaUV2ZW50KSB7XG4gICAgdGhpcy5pbnRlcmFjdGFibGUuZmlyZShpRXZlbnQpXG5cbiAgICBpZiAoIXRoaXMucHJldkV2ZW50IHx8IGlFdmVudC50aW1lU3RhbXAgPj0gdGhpcy5wcmV2RXZlbnQudGltZVN0YW1wKSB7XG4gICAgICB0aGlzLnByZXZFdmVudCA9IGlFdmVudFxuICAgIH1cbiAgfVxuXG4gIF9kb1BoYXNlIChzaWduYWxBcmc6IFBhcnRpYWw8SW50ZXJhY3QuU2lnbmFsQXJnPikge1xuICAgIGNvbnN0IHsgZXZlbnQsIHBoYXNlLCBwcmVFbmQsIHR5cGUgfSA9IHNpZ25hbEFyZ1xuICAgIGNvbnN0IGJlZm9yZVJlc3VsdCA9IHRoaXMuX3NpZ25hbHMuZmlyZShgYmVmb3JlLWFjdGlvbi0ke3BoYXNlfWAsIHNpZ25hbEFyZylcblxuICAgIGlmIChiZWZvcmVSZXN1bHQgPT09IGZhbHNlKSB7XG4gICAgICByZXR1cm4gZmFsc2VcbiAgICB9XG5cbiAgICBjb25zdCBpRXZlbnQgPSBzaWduYWxBcmcuaUV2ZW50ID0gdGhpcy5fY3JlYXRlUHJlcGFyZWRFdmVudChldmVudCwgcGhhc2UsIHByZUVuZCwgdHlwZSlcbiAgICBjb25zdCB7IHJlY3QgfSA9IHRoaXNcblxuICAgIGlmIChyZWN0KSB7XG4gICAgICAvLyB1cGRhdGUgdGhlIHJlY3QgbW9kaWZpY2F0aW9uc1xuICAgICAgY29uc3QgZWRnZXMgPSB0aGlzLmVkZ2VzIHx8IHRoaXMucHJlcGFyZWQuZWRnZXMgfHwgeyBsZWZ0OiB0cnVlLCByaWdodDogdHJ1ZSwgdG9wOiB0cnVlLCBib3R0b206IHRydWUgfVxuXG4gICAgICBpZiAoZWRnZXMudG9wKSAgICB7IHJlY3QudG9wICAgICs9IGlFdmVudC5kZWx0YS55IH1cbiAgICAgIGlmIChlZGdlcy5ib3R0b20pIHsgcmVjdC5ib3R0b20gKz0gaUV2ZW50LmRlbHRhLnkgfVxuICAgICAgaWYgKGVkZ2VzLmxlZnQpICAgeyByZWN0LmxlZnQgICArPSBpRXZlbnQuZGVsdGEueCB9XG4gICAgICBpZiAoZWRnZXMucmlnaHQpICB7IHJlY3QucmlnaHQgICs9IGlFdmVudC5kZWx0YS54IH1cblxuICAgICAgcmVjdC53aWR0aCA9IHJlY3QucmlnaHQgLSByZWN0LmxlZnRcbiAgICAgIHJlY3QuaGVpZ2h0ID0gcmVjdC5ib3R0b20gLSByZWN0LnRvcFxuICAgIH1cblxuICAgIHRoaXMuX3NpZ25hbHMuZmlyZShgYWN0aW9uLSR7cGhhc2V9YCwgc2lnbmFsQXJnKVxuXG4gICAgdGhpcy5fZmlyZUV2ZW50KGlFdmVudClcblxuICAgIHRoaXMuX3NpZ25hbHMuZmlyZShgYWZ0ZXItYWN0aW9uLSR7cGhhc2V9YCwgc2lnbmFsQXJnKVxuXG4gICAgcmV0dXJuIHRydWVcbiAgfVxuXG4gIF9ub3cgKCkgeyByZXR1cm4gRGF0ZS5ub3coKSB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IEludGVyYWN0aW9uXG5leHBvcnQgeyBQb2ludGVySW5mbyB9XG4iXX0=