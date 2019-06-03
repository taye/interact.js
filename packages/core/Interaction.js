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
        this._interacting = this._doPhase({
            interaction: this,
            event: this.downEvent,
            phase: EventPhase.Start,
        });
        return this._interacting;
    }
    pointerMove(pointer, event, eventTarget) {
        if (!this.simulation && !(this.modifiers && this.modifiers.endPrevented)) {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiSW50ZXJhY3Rpb24uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJJbnRlcmFjdGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEtBQUssS0FBSyxNQUFNLG1CQUFtQixDQUFBO0FBRTFDLE9BQU8sYUFBYSxFQUFFLEVBQUUsVUFBVSxFQUFFLE1BQU0saUJBQWlCLENBQUE7QUFDM0QsT0FBTyxXQUFXLE1BQU0sZUFBZSxDQUFBO0FBQ3ZDLE9BQU8sRUFBRSxVQUFVLEVBQUUsTUFBTSxTQUFTLENBQUE7QUFjcEMsTUFBTSxDQUFOLElBQVksWUFPWDtBQVBELFdBQVksWUFBWTtJQUN0QixpQ0FBaUIsQ0FBQTtJQUNqQiw0QkFBWSxDQUFBO0lBQ1osNkJBQWEsQ0FBQTtJQUNiLGtDQUFrQixDQUFBO0lBQ2xCLG9DQUFvQixDQUFBO0lBQ3BCLDJCQUFXLENBQUE7QUFDYixDQUFDLEVBUFcsWUFBWSxLQUFaLFlBQVksUUFPdkI7QUFFRCxNQUFNLENBQU4sSUFBWSxhQU1YO0FBTkQsV0FBWSxhQUFhO0lBQ3ZCLDJCQUFVLENBQUE7SUFDViwwQkFBUyxDQUFBO0lBQ1QseUJBQVEsQ0FBQTtJQUNSLDBCQUFTLENBQUE7SUFDVCxpQ0FBZ0IsQ0FBQTtBQUNsQixDQUFDLEVBTlcsYUFBYSxLQUFiLGFBQWEsUUFNeEI7QUFPRCxNQUFNLE9BQU8sV0FBVztJQTZFdEIsTUFBTTtJQUNOLFlBQWEsRUFBRSxXQUFXLEVBQUUsT0FBTyxFQUFvRDtRQTdFdkYsNkNBQTZDO1FBQzdDLGlCQUFZLEdBQWlCLElBQUksQ0FBQTtRQUVqQyx5Q0FBeUM7UUFDekMsWUFBTyxHQUFZLElBQUksQ0FBQTtRQVF2QixxREFBcUQ7UUFDckQsYUFBUSxHQUFtQjtZQUN6QixJQUFJLEVBQUcsSUFBSTtZQUNYLElBQUksRUFBRyxJQUFJO1lBQ1gsS0FBSyxFQUFFLElBQUk7U0FDWixDQUFBO1FBSUQsK0JBQStCO1FBQy9CLGFBQVEsR0FBa0IsRUFBRSxDQUFBO1FBRTVC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QUUsS0FBSyxDQUFDLENBQUE7WUFDdEQsS0FBSyxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLEVBQUUsSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsRUFBRSxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQTtTQUMzRjtRQUVELE1BQU0sYUFBYSxHQUFHLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUMsS0FBSyxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUNsRCxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxLQUFLLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ2xELElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDLEtBQUssSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDdEQsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLENBQUMsS0FBSyxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUE7UUFFOUUsSUFBSSxFQUFFLENBQUE7UUFDTixJQUFJLEVBQUUsQ0FBQTtRQUVOLHNEQUFzRDtRQUN0RCxJQUFJLElBQUksQ0FBQyxhQUFhLElBQUksQ0FBQyxJQUFJLENBQUMsZUFBZSxFQUFFO1lBQy9DLEVBQUUsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUE7WUFDMUQsRUFBRSxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxD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R0FBRyxJQUFJLENBQUMsSUFBSSxDQUFBO1lBQ25DLElBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFBO1NBQ3JDO1FBRUQsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsVUFBVSxLQUFLLEVBQUUsRUFBRSxTQUFTLENBQUMsQ0FBQTtRQUVoRCxJQUFJLENBQUMsVUFBVSxDQUFDLE1BQU0sQ0FBQyxDQUFBO1FBRXZCLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLGdCQUFnQixLQUFLLEVBQUUsRUFBRSxTQUFTLENBQUMsQ0FBQTtRQUV0RCxPQUFPLElBQUksQ0FBQTtJQUNiLENBQUM7SUFFRCxJQUFJLEtBQU0sT0FBTyxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUEsQ0FBQyxDQUFDO0NBQzlCO0FBRUQsZUFBZSxXQUFXLENBQUE7QUFDMUIsT0FBTyxFQUFFLFdBQVcsRUFBRSxDQUFBIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgdXRpbHMgZnJvbSAnQGludGVyYWN0anMvdXRpbHMnXG5pbXBvcnQgSW50ZXJhY3RhYmxlIGZyb20gJy4vSW50ZXJhY3RhYmxlJ1xuaW1wb3J0IEludGVyYWN0RXZlbnQsIHsgRXZlbnRQaGFzZSB9IGZyb20gJy4vSW50ZXJhY3RFdmVudCdcbmltcG9ydCBQb2ludGVySW5mbyBmcm9tICcuL1BvaW50ZXJJbmZvJ1xuaW1wb3J0IHsgQWN0aW9uTmFtZSB9IGZyb20gJy4vc2NvcGUnXG5cbmV4cG9ydCBpbnRlcmZhY2UgQWN0aW9uUHJvcHM8VCBleHRlbmRzIEFjdGlvbk5hbWUgPSBhbnk+IHtcbiAgbmFtZTogVFxuICBheGlzPzogJ3gnIHwgJ3knIHwgJ3h5J1xuICBlZGdlcz86IHtcbiAgICBbZWRnZSBpbiBrZXlvZiBJbnRlcmFjdC5SZWN0XT86IGJvb2xlYW5cbiAgfVxufVxuXG5leHBvcnQgaW50ZXJmYWNlIFN0YXJ0QWN0aW9uIGV4dGVuZHMgQWN0aW9uUHJvcHMge1xuICBuYW1lOiBBY3Rpb25OYW1lIHwgc3RyaW5nXG59XG5cbmV4cG9ydCBlbnVtIF9Qcm94eVZhbHVlcyB7XG4gIGludGVyYWN0YWJsZSA9ICcnLFxuICBlbGVtZW50ID0gJycsXG4gIHByZXBhcmVkID0gJycsXG4gIHBvaW50ZXJJc0Rvd24gPSAnJyxcbiAgcG9pbnRlcldhc01vdmVkID0gJycsXG4gIF9wcm94eSA9ICcnXG59XG5cbmV4cG9ydCBlbnVtIF9Qcm94eU1ldGhvZHMge1xuICBzdGFydCA9ICcnLFxuICBtb3ZlID0gJycsXG4gIGVuZCA9ICcnLFxuICBzdG9wID0gJycsXG4gIGludGVyYWN0aW5nID0gJydcbn1cblxuZXhwb3J0IHR5cGUgX0ludGVyYWN0aW9uUHJveHkgPSBQaWNrPFxuICBJbnRlcmFjdGlvbixcbiAga2V5b2YgdHlwZW9mIF9Qcm94eVZhbHVlcyB8IGtleW9mIHR5cGVvZiBfUHJveHlNZXRob2RzXG4+XG5cbmV4cG9ydCBjbGFzcyBJbnRlcmFjdGlvbjxUIGV4dGVuZHMgQWN0aW9uTmFtZSA9IGFueT4ge1xuICAvLyBjdXJyZW50IGludGVyYWN0YWJsZSBiZWluZyBpbnRlcmFjdGVkIHdpdGhcbiAgaW50ZXJhY3RhYmxlOiBJbnRlcmFjdGFibGUgPSBudWxsXG5cbiAgLy8gdGhlIHRhcmdldCBlbGVtZW50IG9mIHRoZSBpbnRlcmFjdGFibGVcbiAgZWxlbWVudDogRWxlbWVudCA9IG51bGxcbiAgcmVjdDogSW50ZXJhY3QuUmVjdCAmIEludGVyYWN0LlNpemVcbiAgZWRnZXM6IHtcbiAgICBbUCBpbiBrZXlvZiBJbnRlcmFjdC5SZWN0XT86IGJvb2xlYW5cbiAgfVxuXG4gIF9zaWduYWxzOiB1dGlscy5TaWduYWxzXG5cbiAgLy8gYWN0aW9uIHRoYXQncyByZWFkeSB0byBiZSBmaXJlZCBvbiBuZXh0IG1vdmUgZXZlbnRcbiAgcHJlcGFyZWQ6IEFjdGlvblByb3BzPFQ+ID0ge1xuICAgIG5hbWUgOiBudWxsLFxuICAgIGF4aXMgOiBudWxsLFxuICAgIGVkZ2VzOiBudWxsLFxuICB9XG5cbiAgcG9pbnRlclR5cGU6IHN0cmluZ1xuXG4gIC8vIGtlZXAgdHJhY2sgb2YgYWRkZWQgcG9pbnRlcnNcbiAgcG9pbnRlcnM6IFBvaW50ZXJJbmZvW10gPSBbXVxuXG4gIC8vIHBvaW50ZXJkb3duL21vdXNlZG93bi90b3VjaHN0YXJ0IGV2ZW50XG4gIGRvd25FdmVudDogSW50ZXJhY3QuUG9pbnRlckV2ZW50VHlwZSA9IG51bGxcblxuICBkb3duUG9pbnRlcjogSW50ZXJhY3QuUG9pbnRlclR5cGUgPSB7fSBhcyBJbnRlcmFjdC5Qb2ludGVyVHlwZVxuXG4gIF9sYXRlc3RQb2ludGVyOiB7XG4gICAgcG9pbnRlcjogSW50ZXJhY3QuRXZlbnRUYXJnZXRcbiAgICBldmVudDogSW50ZXJhY3QuUG9pbnRlckV2ZW50VHlwZVxuICAgIGV2ZW50VGFyZ2V0OiBOb2RlLFxuICB9ID0ge1xuICAgIHBvaW50ZXI6IG51bGwsXG4gICAgZXZlbnQ6IG51bGwsXG4gICAgZXZlbnRUYXJnZXQ6IG51bGwsXG4gIH1cblxuICAvLyBwcmV2aW91cyBhY3Rpb24gZXZlbnRcbiAgcHJldkV2ZW50OiBJbnRlcmFjdEV2ZW50PFQ+ID0gbnVsbFxuXG4gIHBvaW50ZXJJc0Rvd24gPSBmYWxzZVxuICBwb2ludGVyV2FzTW92ZWQgPSBmYWxzZVxuICBfaW50ZXJhY3RpbmcgPSBmYWxzZVxuICBfZW5kaW5nID0gZmFsc2VcbiAgX3Byb3h5OiBfSW50ZXJhY3Rpb25Qcm94eSA9IG51bGxcblxuICBzaW11bGF0aW9uID0gbnVsbFxuXG4gIGdldCBwb2ludGVyTW92ZVRvbGVyYW5jZSAoKSB7XG4gICAgcmV0dXJuIDFcbiAgfVxuXG4gIC8qKlxuICAgKiBAYWxpYXMgSW50ZXJhY3Rpb24ucHJvdG90eXBlLm1vdmVcbiAgICovXG4gIGRvTW92ZSA9IHV0aWxzLndhcm5PbmNlKFxuICAgIGZ1bmN0aW9uICh0aGlzOiBJbnRlcmFjdGlvbiwgc2lnbmFsQXJnOiBhbnkpIHtcbiAgICAgIHRoaXMubW92ZShzaWduYWxBcmcpXG4gICAgfSxcbiAgICAnVGhlIGludGVyYWN0aW9uLmRvTW92ZSgpIG1ldGhvZCBoYXMgYmVlbiByZW5hbWVkIHRvIGludGVyYWN0aW9uLm1vdmUoKScpXG5cbiAgY29vcmRzID0ge1xuICAgIC8vIFN0YXJ0aW5nIEludGVyYWN0RXZlbnQgcG9pbnRlciBjb29yZGluYXRlc1xuICAgIHN0YXJ0OiB1dGlscy5wb2ludGVyLm5ld0Nvb3JkcygpLFxuICAgIC8vIFByZXZpb3VzIG5hdGl2ZSBwb2ludGVyIG1vdmUgZXZlbnQgY29vcmRpbmF0ZXNcbiAgICBwcmV2OiB1dGlscy5wb2ludGVyLm5ld0Nvb3JkcygpLFxuICAgIC8vIGN1cnJlbnQgbmF0aXZlIHBvaW50ZXIgbW92ZSBldmVudCBjb29yZGluYXRlc1xuICAgIGN1cjogdXRpbHMucG9pbnRlci5uZXdDb29yZHMoKSxcbiAgICAvLyBDaGFuZ2UgaW4gY29vcmRpbmF0ZXMgYW5kIHRpbWUgb2YgdGhlIHBvaW50ZXJcbiAgICBkZWx0YTogdXRpbHMucG9pbnRlci5uZXdDb29yZHMoKSxcbiAgICAvLyBwb2ludGVyIHZlbG9jaXR5XG4gICAgdmVsb2NpdHk6IHV0aWxzLnBvaW50ZXIubmV3Q29vcmRzKCksXG4gIH1cblxuICAvKiogKi9cbiAgY29uc3RydWN0b3IgKHsgcG9pbnRlclR5cGUsIHNpZ25hbHMgfTogeyBwb2ludGVyVHlwZT86IHN0cmluZywgc2lnbmFsczogdXRpbHMuU2lnbmFscyB9KSB7XG4gICAgdGhpcy5fc2lnbmFscyA9IHNpZ25hbHNcbiAgICB0aGlzLnBvaW50ZXJUeXBlID0gcG9pbnRlclR5cGVcblxuICAgIGNvbnN0IHRoYXQgPSB0aGlzXG5cbiAgICB0aGlzLl9wcm94eSA9IHt9IGFzIF9JbnRlcmFjdGlvblByb3h5XG5cbiAgICBmb3IgKGNvbnN0IGtleSBpbiBfUHJveHlWYWx1ZXMpIHtcbiAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0aGlzLl9wcm94eSwga2V5LCB7XG4gICAgICAgIGdldCAoKSB7IHJldHVybiB0aGF0W2tleV0gfSxcbiAgICAgIH0pXG4gICAgfVxuXG4gICAgZm9yIChjb25zdCBrZXkgaW4gX1Byb3h5TWV0aG9kcykge1xuICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRoaXMuX3Byb3h5LCBrZXksIHtcbiAgICAgICAgdmFsdWU6ICguLi5hcmdzKSA9PiB0aGF0W2tleV0oLi4uYXJncyksXG4gICAgICB9KVxuICAgIH1cblxuICAgIHRoaXMuX3NpZ25hbHMuZmlyZSgnbmV3JywgeyBpbnRlcmFjdGlvbjogdGhpcyB9KVxuICB9XG5cbiAgcG9pbnRlckRvd24gKHBvaW50ZXI6IEludGVyYWN0LlBvaW50ZXJUeXBlLCBldmVudDogSW50ZXJhY3QuUG9pbnRlckV2ZW50VHlwZSwgZXZlbnRUYXJnZXQ6IE5vZGUpIHtcbiAgICBjb25zdCBwb2ludGVySW5kZXggPSB0aGlzLnVwZGF0ZVBvaW50ZXIocG9pbnRlciwgZXZlbnQsIGV2ZW50VGFyZ2V0LCB0cnVlKVxuXG4gICAgdGhpcy5fc2lnbmFscy5maXJlKCdkb3duJywge1xuICAgICAgcG9pbnRlcixcbiAgICAgIGV2ZW50LFxuICAgICAgZXZlbnRUYXJnZXQsXG4gICAgICBwb2ludGVySW5kZXgsXG4gICAgICBpbnRlcmFjdGlvbjogdGhpcyxcbiAgICB9KVxuICB9XG5cbiAgLyoqXG4gICAqIGBgYGpzXG4gICAqIGludGVyYWN0KHRhcmdldClcbiAgICogICAuZHJhZ2dhYmxlKHtcbiAgICogICAgIC8vIGRpc2FibGUgdGhlIGRlZmF1bHQgZHJhZyBzdGFydCBieSBkb3duLT5tb3ZlXG4gICAqICAgICBtYW51YWxTdGFydDogdHJ1ZVxuICAgKiAgIH0pXG4gICAqICAgLy8gc3RhcnQgZHJhZ2dpbmcgYWZ0ZXIgdGhlIHVzZXIgaG9sZHMgdGhlIHBvaW50ZXIgZG93blxuICAgKiAgIC5vbignaG9sZCcsIGZ1bmN0aW9uIChldmVudCkge1xuICAgKiAgICAgdmFyIGludGVyYWN0aW9uID0gZXZlbnQuaW50ZXJhY3Rpb25cbiAgICpcbiAgICogICAgIGlmICghaW50ZXJhY3Rpb24uaW50ZXJhY3RpbmcoKSkge1xuICAgKiAgICAgICBpbnRlcmFjdGlvbi5zdGFydCh7IG5hbWU6ICdkcmFnJyB9LFxuICAgKiAgICAgICAgICAgICAgICAgICAgICAgICBldmVudC5pbnRlcmFjdGFibGUsXG4gICAqICAgICAgICAgICAgICAgICAgICAgICAgIGV2ZW50LmN1cnJlbnRUYXJnZXQpXG4gICAqICAgICB9XG4gICAqIH0pXG4gICAqIGBgYFxuICAgKlxuICAgKiBTdGFydCBhbiBhY3Rpb24gd2l0aCB0aGUgZ2l2ZW4gSW50ZXJhY3RhYmxlIGFuZCBFbGVtZW50IGFzIHRhcnRnZXRzLiBUaGVcbiAgICogYWN0aW9uIG11c3QgYmUgZW5hYmxlZCBmb3IgdGhlIHRhcmdldCBJbnRlcmFjdGFibGUgYW5kIGFuIGFwcHJvcHJpYXRlXG4gICAqIG51bWJlciBvZiBwb2ludGVycyBtdXN0IGJlIGhlbGQgZG93biAtIDEgZm9yIGRyYWcvcmVzaXplLCAyIGZvciBnZXN0dXJlLlxuICAgKlxuICAgKiBVc2UgaXQgd2l0aCBgaW50ZXJhY3RhYmxlLjxhY3Rpb24+YWJsZSh7IG1hbnVhbFN0YXJ0OiBmYWxzZSB9KWAgdG8gYWx3YXlzXG4gICAqIFtzdGFydCBhY3Rpb25zIG1hbnVhbGx5XShodHRwczovL2dpdGh1Yi5jb20vdGF5ZS9pbnRlcmFjdC5qcy9pc3N1ZXMvMTE0KVxuICAgKlxuICAgKiBAcGFyYW0ge29iamVjdH0gYWN0aW9uICAgVGhlIGFjdGlvbiB0byBiZSBwZXJmb3JtZWQgLSBkcmFnLCByZXNpemUsIGV0Yy5cbiAgICogQHBhcmFtIHtJbnRlcmFjdGFibGV9IHRhcmdldCAgVGhlIEludGVyYWN0YWJsZSB0byB0YXJnZXRcbiAgICogQHBhcmFtIHtFbGVtZW50fSBlbGVtZW50IFRoZSBET00gRWxlbWVudCB0byB0YXJnZXRcbiAgICogQHJldHVybiB7b2JqZWN0fSBpbnRlcmFjdFxuICAgKi9cbiAgc3RhcnQgKGFjdGlvbjogU3RhcnRBY3Rpb24sIGludGVyYWN0YWJsZTogSW50ZXJhY3RhYmxlLCBlbGVtZW50OiBFbGVtZW50KSB7XG4gICAgaWYgKHRoaXMuaW50ZXJhY3RpbmcoKSB8fFxuICAgICAgICAhdGhpcy5wb2ludGVySXNEb3duIHx8XG4gICAgICAgIHRoaXMucG9pbnRlcnMubGVuZ3RoIDwgKGFjdGlvbi5uYW1lID09PSBBY3Rpb25OYW1lLkdlc3R1cmUgPyAyIDogMSkgfHxcbiAgICAgICAgIWludGVyYWN0YWJsZS5vcHRpb25zW2FjdGlvbi5uYW1lXS5lbmFibGVkKSB7XG4gICAgICByZXR1cm4gZmFsc2VcbiAgICB9XG5cbiAgICB1dGlscy5jb3B5QWN0aW9uKHRoaXMucHJlcGFyZWQsIGFjdGlvbilcblxuICAgIHRoaXMuaW50ZXJhY3RhYmxlID0gaW50ZXJhY3RhYmxlXG4gICAgdGhpcy5lbGVtZW50ICAgICAgPSBlbGVtZW50XG4gICAgdGhpcy5yZWN0ICAgICAgICAgPSBpbnRlcmFjdGFibGUuZ2V0UmVjdChlbGVtZW50KVxuICAgIHRoaXMuZWRnZXMgICAgICAgID0gdGhpcy5wcmVwYXJlZC5lZGdlc1xuICAgIHRoaXMuX2ludGVyYWN0aW5nID0gdGhpcy5fZG9QaGFzZSh7XG4gICAgICBpbnRlcmFjdGlvbjogdGhpcyxcbiAgICAgIGV2ZW50OiB0aGlzLmRvd25FdmVudCxcbiAgICAgIHBoYXNlOiBFdmVudFBoYXNlLlN0YXJ0LFxuICAgIH0pXG5cbiAgICByZXR1cm4gdGhpcy5faW50ZXJhY3RpbmdcbiAgfVxuXG4gIHBvaW50ZXJNb3ZlIChwb2ludGVyOiBJbnRlcmFjdC5Qb2ludGVyVHlwZSwgZXZlbnQ6IEludGVyYWN0LlBvaW50ZXJFdmVudFR5cGUsIGV2ZW50VGFyZ2V0OiBOb2RlKSB7XG4gICAgaWYgKCF0aGlzLnNpbXVsYXRpb24gJiYgISh0aGlzLm1vZGlmaWVycyAmJiB0aGlzLm1vZGlmaWVycy5lbmRQcmV2ZW50ZWQpKSB7XG4gICAgICB0aGlzLnVwZGF0ZVBvaW50ZXIocG9pbnRlciwgZXZlbnQsIGV2ZW50VGFyZ2V0LCBmYWxzZSlcbiAgICAgIHV0aWxzLnBvaW50ZXIuc2V0Q29vcmRzKHRoaXMuY29vcmRzLmN1ciwgdGhpcy5wb2ludGVycy5tYXAoKHApID0+IHAucG9pbnRlciksIHRoaXMuX25vdygpKVxuICAgIH1cblxuICAgIGNvbnN0IGR1cGxpY2F0ZU1vdmUgPSAodGhpcy5jb29yZHMuY3VyLnBhZ2UueCA9PT0gdGhpcy5jb29yZHMucHJldi5wYWdlLnggJiZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuY29vcmRzLmN1ci5wYWdlLnkgPT09IHRoaXMuY29vcmRzLnByZXYucGFnZS55ICYmXG4gICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmNvb3Jkcy5jdXIuY2xpZW50LnggPT09IHRoaXMuY29vcmRzLnByZXYuY2xpZW50LnggJiZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuY29vcmRzLmN1ci5jbGllbnQueSA9PT0gdGhpcy5jb29yZHMucHJldi5jbGllbnQueSlcblxuICAgIGxldCBkeFxuICAgIGxldCBkeVxuXG4gICAgLy8gcmVnaXN0ZXIgbW92ZW1lbnQgZ3JlYXRlciB0aGFuIHBvaW50ZXJNb3ZlVG9sZXJhbmNlXG4gICAgaWYgKHRoaXMucG9pbnRlcklzRG93biAmJiAhdGhpcy5wb2ludGVyV2FzTW92ZWQpIHtcbiAgICAgIGR4ID0gdGhpcy5jb29yZHMuY3VyLmNsaWVudC54IC0gdGhpcy5jb29yZHMuc3RhcnQuY2xpZW50LnhcbiAgICAgIGR5ID0gdGhpcy5jb29yZHMuY3VyLmNsaWVudC55IC0gdGhpcy5jb29yZHMuc3RhcnQuY2xpZW50LnlcblxuICAgICAgdGhpcy5wb2ludGVyV2FzTW92ZWQgPSB1dGlscy5oeXBvdChkeCwgZHkpID4gdGhpcy5wb2ludGVyTW92ZVRvbGVyYW5jZVxuICAgIH1cblxuICAgIGNvbnN0IHNpZ25hbEFyZyA9IHtcbiAgICAgIHBvaW50ZXIsXG4gICAgICBwb2ludGVySW5kZXg6IHRoaXMuZ2V0UG9pbnRlckluZGV4KHBvaW50ZXIpLFxuICAgICAgZXZlbnQsXG4gICAgICBldmVudFRhcmdldCxcbiAgICAgIGR4LFxuICAgICAgZHksXG4gICAgICBkdXBsaWNhdGU6IGR1cGxpY2F0ZU1vdmUsXG4gICAgICBpbnRlcmFjdGlvbjogdGhpcyxcbiAgICB9XG5cbiAgICBpZiAoIWR1cGxpY2F0ZU1vdmUpIHtcbiAgICAgIC8vIHNldCBwb2ludGVyIGNvb3JkaW5hdGUsIHRpbWUgY2hhbmdlcyBhbmQgdmVsb2NpdHlcbiAgICAgIHV0aWxzLnBvaW50ZXIuc2V0Q29vcmREZWx0YXModGhpcy5jb29yZHMuZGVsdGEsIHRoaXMuY29vcmRzLnByZXYsIHRoaXMuY29vcmRzLmN1cilcbiAgICAgIHV0aWxzLnBvaW50ZXIuc2V0Q29vcmRWZWxvY2l0eSh0aGlzLmNvb3Jkcy52ZWxvY2l0eSwgdGhpcy5jb29yZHMuZGVsdGEpXG4gICAgfVxuXG4gICAgdGhpcy5fc2lnbmFscy5maXJlKCdtb3ZlJywgc2lnbmFsQXJnKVxuXG4gICAgaWYgKCFkdXBsaWNhdGVNb3ZlKSB7XG4gICAgICAvLyBpZiBpbnRlcmFjdGluZywgZmlyZSBhbiAnYWN0aW9uLW1vdmUnIHNpZ25hbCBldGNcbiAgICAgIGlmICh0aGlzLmludGVyYWN0aW5nKCkpIHtcbiAgICAgICAgdGhpcy5tb3ZlKHNpZ25hbEFyZylcbiAgICAgIH1cblxuICAgICAgaWYgKHRoaXMucG9pbnRlcldhc01vdmVkKSB7XG4gICAgICAgIHV0aWxzLnBvaW50ZXIuY29weUNvb3Jkcyh0aGlzLmNvb3Jkcy5wcmV2LCB0aGlzLmNvb3Jkcy5jdXIpXG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIGBgYGpzXG4gICAqIGludGVyYWN0KHRhcmdldClcbiAgICogICAuZHJhZ2dhYmxlKHRydWUpXG4gICAqICAgLm9uKCdkcmFnbW92ZScsIGZ1bmN0aW9uIChldmVudCkge1xuICAgKiAgICAgaWYgKHNvbWVDb25kaXRpb24pIHtcbiAgICogICAgICAgLy8gY2hhbmdlIHRoZSBzbmFwIHNldHRpbmdzXG4gICAqICAgICAgIGV2ZW50LmludGVyYWN0YWJsZS5kcmFnZ2FibGUoeyBzbmFwOiB7IHRhcmdldHM6IFtdIH19KVxuICAgKiAgICAgICAvLyBmaXJlIGFub3RoZXIgbW92ZSBldmVudCB3aXRoIHJlLWNhbGN1bGF0ZWQgc25hcFxuICAgKiAgICAgICBldmVudC5pbnRlcmFjdGlvbi5tb3ZlKClcbiAgICogICAgIH1cbiAgICogICB9KVxuICAgKiBgYGBcbiAgICpcbiAgICogRm9yY2UgYSBtb3ZlIG9mIHRoZSBjdXJyZW50IGFjdGlvbiBhdCB0aGUgc2FtZSBjb29yZGluYXRlcy4gVXNlZnVsIGlmXG4gICAqIHNuYXAvcmVzdHJpY3QgaGFzIGJlZW4gY2hhbmdlZCBhbmQgeW91IHdhbnQgYSBtb3ZlbWVudCB3aXRoIHRoZSBuZXdcbiAgICogc2V0dGluZ3MuXG4gICAqL1xuICBtb3ZlIChzaWduYWxBcmc/KSB7XG4gICAgc2lnbmFsQXJnID0gdXRpbHMuZXh0ZW5kKHtcbiAgICAgIHBvaW50ZXI6IHRoaXMuX2xhdGVzdFBvaW50ZXIucG9pbnRlcixcbiAgICAgIGV2ZW50OiB0aGlzLl9sYXRlc3RQb2ludGVyLmV2ZW50LFxuICAgICAgZXZlbnRUYXJnZXQ6IHRoaXMuX2xhdGVzdFBvaW50ZXIuZXZlbnRUYXJnZXQsXG4gICAgICBpbnRlcmFjdGlvbjogdGhpcyxcbiAgICB9LCBzaWduYWxBcmcgfHwge30pXG5cbiAgICBzaWduYWxBcmcucGhhc2UgPSBFdmVudFBoYXNlLk1vdmVcblxuICAgIHRoaXMuX2RvUGhhc2Uoc2lnbmFsQXJnKVxuICB9XG5cbiAgLy8gRW5kIGludGVyYWN0IG1vdmUgZXZlbnRzIGFuZCBzdG9wIGF1dG8tc2Nyb2xsIHVubGVzcyBzaW11bGF0aW9uIGlzIHJ1bm5pbmdcbiAgcG9pbnRlclVwIChwb2ludGVyOiBJbnRlcmFjdC5Qb2ludGVyVHlwZSwgZXZlbnQ6IEludGVyYWN0LlBvaW50ZXJFdmVudFR5cGUsIGV2ZW50VGFyZ2V0OiBOb2RlLCBjdXJFdmVudFRhcmdldDogRXZlbnRUYXJnZXQpIHtcbiAgICBsZXQgcG9pbnRlckluZGV4ID0gdGhpcy5nZXRQb2ludGVySW5kZXgocG9pbnRlcilcblxuICAgIGlmIChwb2ludGVySW5kZXggPT09IC0xKSB7XG4gICAgICBwb2ludGVySW5kZXggPSB0aGlzLnVwZGF0ZVBvaW50ZXIocG9pbnRlciwgZXZlbnQsIGV2ZW50VGFyZ2V0LCBmYWxzZSlcbiAgICB9XG5cbiAgICB0aGlzLl9zaWduYWxzLmZpcmUoL2NhbmNlbCQvaS50ZXN0KGV2ZW50LnR5cGUpID8gJ2NhbmNlbCcgOiAndXAnLCB7XG4gICAgICBwb2ludGVyLFxuICAgICAgcG9pbnRlckluZGV4LFxuICAgICAgZXZlbnQsXG4gICAgICBldmVudFRhcmdldCxcbiAgICAgIGN1ckV2ZW50VGFyZ2V0LFxuICAgICAgaW50ZXJhY3Rpb246IHRoaXMsXG4gICAgfSlcblxuICAgIGlmICghdGhpcy5zaW11bGF0aW9uKSB7XG4gICAgICB0aGlzLmVuZChldmVudClcbiAgICB9XG5cbiAgICB0aGlzLnBvaW50ZXJJc0Rvd24gPSBmYWxzZVxuICAgIHRoaXMucmVtb3ZlUG9pbnRlcihwb2ludGVyLCBldmVudClcbiAgfVxuXG4gIGRvY3VtZW50Qmx1ciAoZXZlbnQpIHtcbiAgICB0aGlzLmVuZChldmVudClcbiAgICB0aGlzLl9zaWduYWxzLmZpcmUoJ2JsdXInLCB7IGV2ZW50LCBpbnRlcmFjdGlvbjogdGhpcyB9KVxuICB9XG5cbiAgLyoqXG4gICAqIGBgYGpzXG4gICAqIGludGVyYWN0KHRhcmdldClcbiAgICogICAuZHJhZ2dhYmxlKHRydWUpXG4gICAqICAgLm9uKCdtb3ZlJywgZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAqICAgICBpZiAoZXZlbnQucGFnZVggPiAxMDAwKSB7XG4gICAqICAgICAgIC8vIGVuZCB0aGUgY3VycmVudCBhY3Rpb25cbiAgICogICAgICAgZXZlbnQuaW50ZXJhY3Rpb24uZW5kKClcbiAgICogICAgICAgLy8gc3RvcCBhbGwgZnVydGhlciBsaXN0ZW5lcnMgZnJvbSBiZWluZyBjYWxsZWRcbiAgICogICAgICAgZXZlbnQuc3RvcEltbWVkaWF0ZVByb3BhZ2F0aW9uKClcbiAgICogICAgIH1cbiAgICogICB9KVxuICAgKiBgYGBcbiAgICpcbiAgICogQHBhcmFtIHtQb2ludGVyRXZlbnR9IFtldmVudF1cbiAgICovXG4gIGVuZCAoZXZlbnQ/OiBJbnRlcmFjdC5Qb2ludGVyRXZlbnRUeXBlKSB7XG4gICAgdGhpcy5fZW5kaW5nID0gdHJ1ZVxuICAgIGV2ZW50ID0gZXZlbnQgfHwgdGhpcy5fbGF0ZXN0UG9pbnRlci5ldmVudFxuICAgIGxldCBlbmRQaGFzZVJlc3VsdFxuXG4gICAgaWYgKHRoaXMuaW50ZXJhY3RpbmcoKSkge1xuICAgICAgZW5kUGhhc2VSZXN1bHQgPSB0aGlzLl9kb1BoYXNlKHtcbiAgICAgICAgZXZlbnQsXG4gICAgICAgIGludGVyYWN0aW9uOiB0aGlzLFxuICAgICAgICBwaGFzZTogRXZlbnRQaGFzZS5FbmQsXG4gICAgICB9KVxuICAgIH1cblxuICAgIHRoaXMuX2VuZGluZyA9IGZhbHNlXG5cbiAgICBpZiAoZW5kUGhhc2VSZXN1bHQgPT09IHRydWUpIHtcbiAgICAgIHRoaXMuc3RvcCgpXG4gICAgfVxuICB9XG5cbiAgY3VycmVudEFjdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXMuX2ludGVyYWN0aW5nID8gdGhpcy5wcmVwYXJlZC5uYW1lIDogbnVsbFxuICB9XG5cbiAgaW50ZXJhY3RpbmcgKCkge1xuICAgIHJldHVybiB0aGlzLl9pbnRlcmFjdGluZ1xuICB9XG5cbiAgLyoqICovXG4gIHN0b3AgKCkge1xuICAgIHRoaXMuX3NpZ25hbHMuZmlyZSgnc3RvcCcsIHsgaW50ZXJhY3Rpb246IHRoaXMgfSlcblxuICAgIHRoaXMuaW50ZXJhY3RhYmxlID0gdGhpcy5lbGVtZW50ID0gbnVsbFxuXG4gICAgdGhpcy5faW50ZXJhY3RpbmcgPSBmYWxzZVxuICAgIHRoaXMucHJlcGFyZWQubmFtZSA9IHRoaXMucHJldkV2ZW50ID0gbnVsbFxuICB9XG5cbiAgZ2V0UG9pbnRlckluZGV4IChwb2ludGVyKSB7XG4gICAgY29uc3QgcG9pbnRlcklkID0gdXRpbHMucG9pbnRlci5nZXRQb2ludGVySWQocG9pbnRlcilcblxuICAgIC8vIG1vdXNlIGFuZCBwZW4gaW50ZXJhY3Rpb25zIG1heSBoYXZlIG9ubHkgb25lIHBvaW50ZXJcbiAgICByZXR1cm4gKHRoaXMucG9pbnRlclR5cGUgPT09ICdtb3VzZScgfHwgdGhpcy5wb2ludGVyVHlwZSA9PT0gJ3BlbicpXG4gICAgICA/IHRoaXMucG9pbnRlcnMubGVuZ3RoIC0gMVxuICAgICAgOiB1dGlscy5hcnIuZmluZEluZGV4KHRoaXMucG9pbnRlcnMsIChjdXJQb2ludGVyKSA9PiBjdXJQb2ludGVyLmlkID09PSBwb2ludGVySWQpXG4gIH1cblxuICBnZXRQb2ludGVySW5mbyAocG9pbnRlcikge1xuICAgIHJldHVybiB0aGlzLnBvaW50ZXJzW3RoaXMuZ2V0UG9pbnRlckluZGV4KHBvaW50ZXIpXVxuICB9XG5cbiAgdXBkYXRlUG9pbnRlciAocG9pbnRlcjogSW50ZXJhY3QuUG9pbnRlclR5cGUsIGV2ZW50OiBJbnRlcmFjdC5Qb2ludGVyRXZlbnRUeXBlLCBldmVudFRhcmdldDogTm9kZSwgZG93bj86IGJvb2xlYW4pIHtcbiAgICBjb25zdCBpZCA9IHV0aWxzLnBvaW50ZXIuZ2V0UG9pbnRlcklkKHBvaW50ZXIpXG4gICAgbGV0IHBvaW50ZXJJbmRleCA9IHRoaXMuZ2V0UG9pbnRlckluZGV4KHBvaW50ZXIpXG4gICAgbGV0IHBvaW50ZXJJbmZvID0gdGhpcy5wb2ludGVyc1twb2ludGVySW5kZXhdXG5cbiAgICBkb3duID0gZG93biA9PT0gZmFsc2VcbiAgICAgID8gZmFsc2VcbiAgICAgIDogZG93biB8fCAvKGRvd258c3RhcnQpJC9pLnRlc3QoZXZlbnQudHlwZSlcblxuICAgIGlmICghcG9pbnRlckluZm8pIHtcbiAgICAgIHBvaW50ZXJJbmZvID0gbmV3IFBvaW50ZXJJbmZvKFxuICAgICAgICBpZCxcbiAgICAgICAgcG9pbnRlcixcbiAgICAgICAgZXZlbnQsXG4gICAgICAgIG51bGwsXG4gICAgICAgIG51bGwsXG4gICAgICApXG5cbiAgICAgIHBvaW50ZXJJbmRleCA9IHRoaXMucG9pbnRlcnMubGVuZ3RoXG4gICAgICB0aGlzLnBvaW50ZXJzLnB1c2gocG9pbnRlckluZm8pXG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgcG9pbnRlckluZm8ucG9pbnRlciA9IHBvaW50ZXJcbiAgICB9XG5cbiAgICBpZiAoZG93bikge1xuICAgICAgdGhpcy5wb2ludGVySXNEb3duID0gdHJ1ZVxuXG4gICAgICBpZiAoIXRoaXMuaW50ZXJhY3RpbmcoKSkge1xuICAgICAgICB1dGlscy5wb2ludGVyLnNldENvb3Jkcyh0aGlzLmNvb3Jkcy5zdGFydCwgdGhpcy5wb2ludGVycy5tYXAoKHApID0+IHAucG9pbnRlciksIHRoaXMuX25vdygpKVxuXG4gICAgICAgIHV0aWxzLnBvaW50ZXIuY29weUNvb3Jkcyh0aGlzLmNvb3Jkcy5jdXIsIHRoaXMuY29vcmRzLnN0YXJ0KVxuICAgICAgICB1dGlscy5wb2ludGVyLmNvcHlDb29yZHModGhpcy5jb29yZHMucHJldiwgdGhpcy5jb29yZHMuc3RhcnQpXG4gICAgICAgIHV0aWxzLnBvaW50ZXIucG9pbnRlckV4dGVuZCh0aGlzLmRvd25Qb2ludGVyLCBwb2ludGVyKVxuXG4gICAgICAgIHRoaXMuZG93bkV2ZW50ID0gZXZlbnRcbiAgICAgICAgcG9pbnRlckluZm8uZG93blRpbWUgPSB0aGlzLmNvb3Jkcy5jdXIudGltZVN0YW1wXG4gICAgICAgIHBvaW50ZXJJbmZvLmRvd25UYXJnZXQgPSBldmVudFRhcmdldFxuXG4gICAgICAgIHRoaXMucG9pbnRlcldhc01vdmVkID0gZmFsc2VcbiAgICAgIH1cbiAgICB9XG5cbiAgICB0aGlzLl91cGRhdGVMYXRlc3RQb2ludGVyKHBvaW50ZXIsIGV2ZW50LCBldmVudFRhcmdldClcblxuICAgIHRoaXMuX3NpZ25hbHMuZmlyZSgndXBkYXRlLXBvaW50ZXInLCB7XG4gICAgICBwb2ludGVyLFxuICAgICAgZXZlbnQsXG4gICAgICBldmVudFRhcmdldCxcbiAgICAgIGRvd24sXG4gICAgICBwb2ludGVySW5mbyxcbiAgICAgIHBvaW50ZXJJbmRleCxcbiAgICAgIGludGVyYWN0aW9uOiB0aGlzLFxuICAgIH0pXG5cbiAgICByZXR1cm4gcG9pbnRlckluZGV4XG4gIH1cblxuICByZW1vdmVQb2ludGVyIChwb2ludGVyOiBJbnRlcmFjdC5Qb2ludGVyVHlwZSwgZXZlbnQ6IEludGVyYWN0LlBvaW50ZXJFdmVudFR5cGUpIHtcbiAgICBjb25zdCBwb2ludGVySW5kZXggPSB0aGlzLmdldFBvaW50ZXJJbmRleChwb2ludGVyKVxuXG4gICAgaWYgKHBvaW50ZXJJbmRleCA9PT0gLTEpIHsgcmV0dXJuIH1cblxuICAgIGNvbnN0IHBvaW50ZXJJbmZvID0gdGhpcy5wb2ludGVyc1twb2ludGVySW5kZXhdXG5cbiAgICB0aGlzLl9zaWduYWxzLmZpcmUoJ3JlbW92ZS1wb2ludGVyJywge1xuICAgICAgcG9pbnRlcixcbiAgICAgIGV2ZW50LFxuICAgICAgcG9pbnRlckluZGV4LFxuICAgICAgcG9pbnRlckluZm8sXG4gICAgICBpbnRlcmFjdGlvbjogdGhpcyxcbiAgICB9KVxuXG4gICAgdGhpcy5wb2ludGVycy5zcGxpY2UocG9pbnRlckluZGV4LCAxKVxuICB9XG5cbiAgX3VwZGF0ZUxhdGVzdFBvaW50ZXIgKHBvaW50ZXIsIGV2ZW50LCBldmVudFRhcmdldCkge1xuICAgIHRoaXMuX2xhdGVzdFBvaW50ZXIucG9pbnRlciA9IHBvaW50ZXJcbiAgICB0aGlzLl9sYXRlc3RQb2ludGVyLmV2ZW50ID0gZXZlbnRcbiAgICB0aGlzLl9sYXRlc3RQb2ludGVyLmV2ZW50VGFyZ2V0ID0gZXZlbnRUYXJnZXRcbiAgfVxuXG4gIGRlc3Ryb3kgKCkge1xuICAgIHRoaXMuX2xhdGVzdFBvaW50ZXIucG9pbnRlciA9IG51bGxcbiAgICB0aGlzLl9sYXRlc3RQb2ludGVyLmV2ZW50ID0gbnVsbFxuICAgIHRoaXMuX2xhdGVzdFBvaW50ZXIuZXZlbnRUYXJnZXQgPSBudWxsXG4gIH1cblxuICBfY3JlYXRlUHJlcGFyZWRFdmVudCAoZXZlbnQ6IEludGVyYWN0LlBvaW50ZXJFdmVudFR5cGUsIHBoYXNlOiBFdmVudFBoYXNlLCBwcmVFbmQ6IGJvb2xlYW4sIHR5cGU6IHN0cmluZykge1xuICAgIGNvbnN0IGFjdGlvbk5hbWUgPSB0aGlzLnByZXBhcmVkLm5hbWVcblxuICAgIHJldHVybiBuZXcgSW50ZXJhY3RFdmVudCh0aGlzLCBldmVudCwgYWN0aW9uTmFtZSwgcGhhc2UsIHRoaXMuZWxlbWVudCwgbnVsbCwgcHJlRW5kLCB0eXBlKVxuICB9XG5cbiAgX2ZpcmVFdmVudCAoaUV2ZW50KSB7XG4gICAgdGhpcy5pbnRlcmFjdGFibGUuZmlyZShpRXZlbnQpXG5cbiAgICBpZiAoIXRoaXMucHJldkV2ZW50IHx8IGlFdmVudC50aW1lU3RhbXAgPj0gdGhpcy5wcmV2RXZlbnQudGltZVN0YW1wKSB7XG4gICAgICB0aGlzLnByZXZFdmVudCA9IGlFdmVudFxuICAgIH1cbiAgfVxuXG4gIF9kb1BoYXNlIChzaWduYWxBcmc6IFBhcnRpYWw8SW50ZXJhY3QuU2lnbmFsQXJnPikge1xuICAgIGNvbnN0IHsgZXZlbnQsIHBoYXNlLCBwcmVFbmQsIHR5cGUgfSA9IHNpZ25hbEFyZ1xuICAgIGNvbnN0IGJlZm9yZVJlc3VsdCA9IHRoaXMuX3NpZ25hbHMuZmlyZShgYmVmb3JlLWFjdGlvbi0ke3BoYXNlfWAsIHNpZ25hbEFyZylcblxuICAgIGlmIChiZWZvcmVSZXN1bHQgPT09IGZhbHNlKSB7XG4gICAgICByZXR1cm4gZmFsc2VcbiAgICB9XG5cbiAgICBjb25zdCBpRXZlbnQgPSBzaWduYWxBcmcuaUV2ZW50ID0gdGhpcy5fY3JlYXRlUHJlcGFyZWRFdmVudChldmVudCwgcGhhc2UsIHByZUVuZCwgdHlwZSlcbiAgICBjb25zdCB7IHJlY3QgfSA9IHRoaXNcblxuICAgIGlmIChyZWN0KSB7XG4gICAgICAvLyB1cGRhdGUgdGhlIHJlY3QgbW9kaWZpY2F0aW9uc1xuICAgICAgY29uc3QgZWRnZXMgPSB0aGlzLmVkZ2VzIHx8IHRoaXMucHJlcGFyZWQuZWRnZXMgfHwgeyBsZWZ0OiB0cnVlLCByaWdodDogdHJ1ZSwgdG9wOiB0cnVlLCBib3R0b206IHRydWUgfVxuXG4gICAgICBpZiAoZWRnZXMudG9wKSAgICB7IHJlY3QudG9wICAgICs9IGlFdmVudC5kZWx0YS55IH1cbiAgICAgIGlmIChlZGdlcy5ib3R0b20pIHsgcmVjdC5ib3R0b20gKz0gaUV2ZW50LmRlbHRhLnkgfVxuICAgICAgaWYgKGVkZ2VzLmxlZnQpICAgeyByZWN0LmxlZnQgICArPSBpRXZlbnQuZGVsdGEueCB9XG4gICAgICBpZiAoZWRnZXMucmlnaHQpICB7IHJlY3QucmlnaHQgICs9IGlFdmVudC5kZWx0YS54IH1cblxuICAgICAgcmVjdC53aWR0aCA9IHJlY3QucmlnaHQgLSByZWN0LmxlZnRcbiAgICAgIHJlY3QuaGVpZ2h0ID0gcmVjdC5ib3R0b20gLSByZWN0LnRvcFxuICAgIH1cblxuICAgIHRoaXMuX3NpZ25hbHMuZmlyZShgYWN0aW9uLSR7cGhhc2V9YCwgc2lnbmFsQXJnKVxuXG4gICAgdGhpcy5fZmlyZUV2ZW50KGlFdmVudClcblxuICAgIHRoaXMuX3NpZ25hbHMuZmlyZShgYWZ0ZXItYWN0aW9uLSR7cGhhc2V9YCwgc2lnbmFsQXJnKVxuXG4gICAgcmV0dXJuIHRydWVcbiAgfVxuXG4gIF9ub3cgKCkgeyByZXR1cm4gRGF0ZS5ub3coKSB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IEludGVyYWN0aW9uXG5leHBvcnQgeyBQb2ludGVySW5mbyB9XG4iXX0=