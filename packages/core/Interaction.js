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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiSW50ZXJhY3Rpb24uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJJbnRlcmFjdGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEtBQUssS0FBSyxNQUFNLG1CQUFtQixDQUFBO0FBRTFDLE9BQU8sYUFBYSxFQUFFLEVBQUUsVUFBVSxFQUFFLE1BQU0saUJBQWlCLENBQUE7QUFDM0QsT0FBTyxXQUFXLE1BQU0sZUFBZSxDQUFBO0FBQ3ZDLE9BQU8sRUFBRSxVQUFVLEVBQUUsTUFBTSxTQUFTLENBQUE7QUFXcEMsTUFBTSxDQUFOLElBQVksWUFPWDtBQVBELFdBQVksWUFBWTtJQUN0QixpQ0FBaUIsQ0FBQTtJQUNqQiw0QkFBWSxDQUFBO0lBQ1osNkJBQWEsQ0FBQTtJQUNiLGtDQUFrQixDQUFBO0lBQ2xCLG9DQUFvQixDQUFBO0lBQ3BCLDJCQUFXLENBQUE7QUFDYixDQUFDLEVBUFcsWUFBWSxLQUFaLFlBQVksUUFPdkI7QUFFRCxNQUFNLENBQU4sSUFBWSxhQU1YO0FBTkQsV0FBWSxhQUFhO0lBQ3ZCLDJCQUFVLENBQUE7SUFDViwwQkFBUyxDQUFBO0lBQ1QseUJBQVEsQ0FBQTtJQUNSLDBCQUFTLENBQUE7SUFDVCxpQ0FBZ0IsQ0FBQTtBQUNsQixDQUFDLEVBTlcsYUFBYSxLQUFiLGFBQWEsUUFNeEI7QUFPRCxNQUFNLE9BQU8sV0FBVztJQThFdEIsTUFBTTtJQUNOLFlBQWEsRUFBRSxXQUFXLEVBQUUsT0FBTyxFQUFvRDtRQTlFdkYsNkNBQTZDO1FBQzdDLGlCQUFZLEdBQWlCLElBQUksQ0FBQTtRQUVqQyx5Q0FBeUM7UUFDekMsWUFBTyxHQUFZLElBQUksQ0FBQTtRQVF2QixxREFBcUQ7UUFDckQsYUFBUSxHQUFtQjtZQUN6QixJQUFJLEVBQUcsSUFBSTtZQUNYLElBQUksRUFBRyxJQUFJO1lBQ1gsS0FBSyxFQUFFLElBQUk7U0FDWixDQUFBO1FBSUQsK0JBQStCO1FBQy9CLGFBQVEsR0FBa0IsRUFBRSxDQUFBO1FBRTVC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LEVBQUc7Z0JBQUUsSUFBSSxDQUFDLEtBQUssSUFBSyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQTthQUFFO1lBRW5ELElBQUksQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFBO1lBQ25DLElBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFBO1NBQ3JDO1FBRUQsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsVUFBVSxLQUFLLEVBQUUsRUFBRSxTQUFTLENBQUMsQ0FBQTtRQUVoRCxJQUFJLENBQUMsVUFBVSxDQUFDLE1BQU0sQ0FBQyxDQUFBO1FBRXZCLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLGdCQUFnQixLQUFLLEVBQUUsRUFBRSxTQUFTLENBQUMsQ0FBQTtRQUV0RCxPQUFPLElBQUksQ0FBQTtJQUNiLENBQUM7SUFFRCxJQUFJLEtBQU0sT0FBTyxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUEsQ0FBQyxDQUFDO0NBQzlCO0FBRUQsZUFBZSxXQUFXLENBQUE7QUFDMUIsT0FBTyxFQUFFLFdBQVcsRUFBRSxDQUFBIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgdXRpbHMgZnJvbSAnQGludGVyYWN0anMvdXRpbHMnXG5pbXBvcnQgSW50ZXJhY3RhYmxlIGZyb20gJy4vSW50ZXJhY3RhYmxlJ1xuaW1wb3J0IEludGVyYWN0RXZlbnQsIHsgRXZlbnRQaGFzZSB9IGZyb20gJy4vSW50ZXJhY3RFdmVudCdcbmltcG9ydCBQb2ludGVySW5mbyBmcm9tICcuL1BvaW50ZXJJbmZvJ1xuaW1wb3J0IHsgQWN0aW9uTmFtZSB9IGZyb20gJy4vc2NvcGUnXG5cbmV4cG9ydCBpbnRlcmZhY2UgQWN0aW9uUHJvcHM8VCBleHRlbmRzIEFjdGlvbk5hbWUgPSBhbnk+IHtcbiAgbmFtZTogVFxuICBheGlzPzogJ3gnIHwgJ3knIHwgJ3h5J1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFN0YXJ0QWN0aW9uIGV4dGVuZHMgQWN0aW9uUHJvcHMge1xuICBuYW1lOiBBY3Rpb25OYW1lIHwgc3RyaW5nXG59XG5cbmV4cG9ydCBlbnVtIF9Qcm94eVZhbHVlcyB7XG4gIGludGVyYWN0YWJsZSA9ICcnLFxuICBlbGVtZW50ID0gJycsXG4gIHByZXBhcmVkID0gJycsXG4gIHBvaW50ZXJJc0Rvd24gPSAnJyxcbiAgcG9pbnRlcldhc01vdmVkID0gJycsXG4gIF9wcm94eSA9ICcnXG59XG5cbmV4cG9ydCBlbnVtIF9Qcm94eU1ldGhvZHMge1xuICBzdGFydCA9ICcnLFxuICBtb3ZlID0gJycsXG4gIGVuZCA9ICcnLFxuICBzdG9wID0gJycsXG4gIGludGVyYWN0aW5nID0gJydcbn1cblxuZXhwb3J0IHR5cGUgX0ludGVyYWN0aW9uUHJveHkgPSBQaWNrPFxuSW50ZXJhY3Rpb24sXG5rZXlvZiB0eXBlb2YgX1Byb3h5VmFsdWVzIHwga2V5b2YgdHlwZW9mIF9Qcm94eU1ldGhvZHNcbj5cblxuZXhwb3J0IGNsYXNzIEludGVyYWN0aW9uPFQgZXh0ZW5kcyBBY3Rpb25OYW1lID0gYW55PiB7XG4gIC8vIGN1cnJlbnQgaW50ZXJhY3RhYmxlIGJlaW5nIGludGVyYWN0ZWQgd2l0aFxuICBpbnRlcmFjdGFibGU6IEludGVyYWN0YWJsZSA9IG51bGxcblxuICAvLyB0aGUgdGFyZ2V0IGVsZW1lbnQgb2YgdGhlIGludGVyYWN0YWJsZVxuICBlbGVtZW50OiBFbGVtZW50ID0gbnVsbFxuICByZWN0OiBJbnRlcmFjdC5SZWN0ICYgSW50ZXJhY3QuU2l6ZVxuICBlZGdlczoge1xuICAgIFtQIGluIGtleW9mIEludGVyYWN0LlJlY3RdPzogYm9vbGVhblxuICB9XG5cbiAgX3NpZ25hbHM6IHV0aWxzLlNpZ25hbHNcblxuICAvLyBhY3Rpb24gdGhhdCdzIHJlYWR5IHRvIGJlIGZpcmVkIG9uIG5leHQgbW92ZSBldmVudFxuICBwcmVwYXJlZDogQWN0aW9uUHJvcHM8VD4gPSB7XG4gICAgbmFtZSA6IG51bGwsXG4gICAgYXhpcyA6IG51bGwsXG4gICAgZWRnZXM6IG51bGwsXG4gIH1cblxuICBwb2ludGVyVHlwZTogc3RyaW5nXG5cbiAgLy8ga2VlcCB0cmFjayBvZiBhZGRlZCBwb2ludGVyc1xuICBwb2ludGVyczogUG9pbnRlckluZm9bXSA9IFtdXG5cbiAgLy8gcG9pbnRlcmRvd24vbW91c2Vkb3duL3RvdWNoc3RhcnQgZXZlbnRcbiAgZG93bkV2ZW50OiBJbnRlcmFjdC5Qb2ludGVyRXZlbnRUeXBlID0gbnVsbFxuXG4gIGRvd25Qb2ludGVyOiBJbnRlcmFjdC5Qb2ludGVyVHlwZSA9IHt9IGFzIEludGVyYWN0LlBvaW50ZXJUeXBlXG5cbiAgX2xhdGVzdFBvaW50ZXI6IHtcbiAgICBwb2ludGVyOiBJbnRlcmFjdC5FdmVudFRhcmdldFxuICAgIGV2ZW50OiBJbnRlcmFjdC5Qb2ludGVyRXZlbnRUeXBlXG4gICAgZXZlbnRUYXJnZXQ6IE5vZGVcbiAgfSA9IHtcbiAgICBwb2ludGVyOiBudWxsLFxuICAgIGV2ZW50OiBudWxsLFxuICAgIGV2ZW50VGFyZ2V0OiBudWxsLFxuICB9XG5cbiAgLy8gcHJldmlvdXMgYWN0aW9uIGV2ZW50XG4gIHByZXZFdmVudDogSW50ZXJhY3RFdmVudDxUPiA9IG51bGxcblxuICBwb2ludGVySXNEb3duID0gZmFsc2VcbiAgcG9pbnRlcldhc01vdmVkID0gZmFsc2VcbiAgX2ludGVyYWN0aW5nID0gZmFsc2VcbiAgX2VuZGluZyA9IGZhbHNlXG4gIF9zdG9wcGVkID0gdHJ1ZVxuICBfcHJveHk6IF9JbnRlcmFjdGlvblByb3h5ID0gbnVsbFxuXG4gIHNpbXVsYXRpb24gPSBudWxsXG5cbiAgZ2V0IHBvaW50ZXJNb3ZlVG9sZXJhbmNlICgpIHtcbiAgICByZXR1cm4gMVxuICB9XG5cbiAgLyoqXG4gICAqIEBhbGlhcyBJbnRlcmFjdGlvbi5wcm90b3R5cGUubW92ZVxuICAgKi9cbiAgZG9Nb3ZlID0gdXRpbHMud2Fybk9uY2UoXG4gICAgZnVuY3Rpb24gKHRoaXM6IEludGVyYWN0aW9uLCBzaWduYWxBcmc6IGFueSkge1xuICAgICAgdGhpcy5tb3ZlKHNpZ25hbEFyZylcbiAgICB9LFxuICAgICdUaGUgaW50ZXJhY3Rpb24uZG9Nb3ZlKCkgbWV0aG9kIGhhcyBiZWVuIHJlbmFtZWQgdG8gaW50ZXJhY3Rpb24ubW92ZSgpJylcblxuICBjb29yZHMgPSB7XG4gICAgLy8gU3RhcnRpbmcgSW50ZXJhY3RFdmVudCBwb2ludGVyIGNvb3JkaW5hdGVzXG4gICAgc3RhcnQ6IHV0aWxzLnBvaW50ZXIubmV3Q29vcmRzKCksXG4gICAgLy8gUHJldmlvdXMgbmF0aXZlIHBvaW50ZXIgbW92ZSBldmVudCBjb29yZGluYXRlc1xuICAgIHByZXY6IHV0aWxzLnBvaW50ZXIubmV3Q29vcmRzKCksXG4gICAgLy8gY3VycmVudCBuYXRpdmUgcG9pbnRlciBtb3ZlIGV2ZW50IGNvb3JkaW5hdGVzXG4gICAgY3VyOiB1dGlscy5wb2ludGVyLm5ld0Nvb3JkcygpLFxuICAgIC8vIENoYW5nZSBpbiBjb29yZGluYXRlcyBhbmQgdGltZSBvZiB0aGUgcG9pbnRlclxuICAgIGRlbHRhOiB1dGlscy5wb2ludGVyLm5ld0Nvb3JkcygpLFxuICAgIC8vIHBvaW50ZXIgdmVsb2NpdHlcbiAgICB2ZWxvY2l0eTogdXRpbHMucG9pbnRlci5uZXdDb29yZHMoKSxcbiAgfVxuXG4gIC8qKiAqL1xuICBjb25zdHJ1Y3RvciAoeyBwb2ludGVyVHlwZSwgc2lnbmFscyB9OiB7IHBvaW50ZXJUeXBlPzogc3RyaW5nLCBzaWduYWxzOiB1dGlscy5TaWduYWxzIH0pIHtcbiAgICB0aGlzLl9zaWduYWxzID0gc2lnbmFsc1xuICAgIHRoaXMucG9pbnRlclR5cGUgPSBwb2ludGVyVHlwZVxuXG4gICAgY29uc3QgdGhhdCA9IHRoaXNcblxuICAgIHRoaXMuX3Byb3h5ID0ge30gYXMgX0ludGVyYWN0aW9uUHJveHlcblxuICAgIGZvciAoY29uc3Qga2V5IGluIF9Qcm94eVZhbHVlcykge1xuICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRoaXMuX3Byb3h5LCBrZXksIHtcbiAgICAgICAgZ2V0ICgpIHsgcmV0dXJuIHRoYXRba2V5XSB9LFxuICAgICAgfSlcbiAgICB9XG5cbiAgICBmb3IgKGNvbnN0IGtleSBpbiBfUHJveHlNZXRob2RzKSB7XG4gICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkodGhpcy5fcHJveHksIGtleSwge1xuICAgICAgICB2YWx1ZTogKC4uLmFyZ3MpID0+IHRoYXRba2V5XSguLi5hcmdzKSxcbiAgICAgIH0pXG4gICAgfVxuXG4gICAgdGhpcy5fc2lnbmFscy5maXJlKCduZXcnLCB7IGludGVyYWN0aW9uOiB0aGlzIH0pXG4gIH1cblxuICBwb2ludGVyRG93biAocG9pbnRlcjogSW50ZXJhY3QuUG9pbnRlclR5cGUsIGV2ZW50OiBJbnRlcmFjdC5Qb2ludGVyRXZlbnRUeXBlLCBldmVudFRhcmdldDogTm9kZSkge1xuICAgIGNvbnN0IHBvaW50ZXJJbmRleCA9IHRoaXMudXBkYXRlUG9pbnRlcihwb2ludGVyLCBldmVudCwgZXZlbnRUYXJnZXQsIHRydWUpXG5cbiAgICB0aGlzLl9zaWduYWxzLmZpcmUoJ2Rvd24nLCB7XG4gICAgICBwb2ludGVyLFxuICAgICAgZXZlbnQsXG4gICAgICBldmVudFRhcmdldCxcbiAgICAgIHBvaW50ZXJJbmRleCxcbiAgICAgIGludGVyYWN0aW9uOiB0aGlzLFxuICAgIH0pXG4gIH1cblxuICAvKipcbiAgICogYGBganNcbiAgICogaW50ZXJhY3QodGFyZ2V0KVxuICAgKiAgIC5kcmFnZ2FibGUoe1xuICAgKiAgICAgLy8gZGlzYWJsZSB0aGUgZGVmYXVsdCBkcmFnIHN0YXJ0IGJ5IGRvd24tPm1vdmVcbiAgICogICAgIG1hbnVhbFN0YXJ0OiB0cnVlXG4gICAqICAgfSlcbiAgICogICAvLyBzdGFydCBkcmFnZ2luZyBhZnRlciB0aGUgdXNlciBob2xkcyB0aGUgcG9pbnRlciBkb3duXG4gICAqICAgLm9uKCdob2xkJywgZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAqICAgICB2YXIgaW50ZXJhY3Rpb24gPSBldmVudC5pbnRlcmFjdGlvblxuICAgKlxuICAgKiAgICAgaWYgKCFpbnRlcmFjdGlvbi5pbnRlcmFjdGluZygpKSB7XG4gICAqICAgICAgIGludGVyYWN0aW9uLnN0YXJ0KHsgbmFtZTogJ2RyYWcnIH0sXG4gICAqICAgICAgICAgICAgICAgICAgICAgICAgIGV2ZW50LmludGVyYWN0YWJsZSxcbiAgICogICAgICAgICAgICAgICAgICAgICAgICAgZXZlbnQuY3VycmVudFRhcmdldClcbiAgICogICAgIH1cbiAgICogfSlcbiAgICogYGBgXG4gICAqXG4gICAqIFN0YXJ0IGFuIGFjdGlvbiB3aXRoIHRoZSBnaXZlbiBJbnRlcmFjdGFibGUgYW5kIEVsZW1lbnQgYXMgdGFydGdldHMuIFRoZVxuICAgKiBhY3Rpb24gbXVzdCBiZSBlbmFibGVkIGZvciB0aGUgdGFyZ2V0IEludGVyYWN0YWJsZSBhbmQgYW4gYXBwcm9wcmlhdGVcbiAgICogbnVtYmVyIG9mIHBvaW50ZXJzIG11c3QgYmUgaGVsZCBkb3duIC0gMSBmb3IgZHJhZy9yZXNpemUsIDIgZm9yIGdlc3R1cmUuXG4gICAqXG4gICAqIFVzZSBpdCB3aXRoIGBpbnRlcmFjdGFibGUuPGFjdGlvbj5hYmxlKHsgbWFudWFsU3RhcnQ6IGZhbHNlIH0pYCB0byBhbHdheXNcbiAgICogW3N0YXJ0IGFjdGlvbnMgbWFudWFsbHldKGh0dHBzOi8vZ2l0aHViLmNvbS90YXllL2ludGVyYWN0LmpzL2lzc3Vlcy8xMTQpXG4gICAqXG4gICAqIEBwYXJhbSB7b2JqZWN0fSBhY3Rpb24gICBUaGUgYWN0aW9uIHRvIGJlIHBlcmZvcm1lZCAtIGRyYWcsIHJlc2l6ZSwgZXRjLlxuICAgKiBAcGFyYW0ge0ludGVyYWN0YWJsZX0gdGFyZ2V0ICBUaGUgSW50ZXJhY3RhYmxlIHRvIHRhcmdldFxuICAgKiBAcGFyYW0ge0VsZW1lbnR9IGVsZW1lbnQgVGhlIERPTSBFbGVtZW50IHRvIHRhcmdldFxuICAgKiBAcmV0dXJuIHtvYmplY3R9IGludGVyYWN0XG4gICAqL1xuICBzdGFydCAoYWN0aW9uOiBTdGFydEFjdGlvbiwgaW50ZXJhY3RhYmxlOiBJbnRlcmFjdGFibGUsIGVsZW1lbnQ6IEVsZW1lbnQpIHtcbiAgICBpZiAodGhpcy5pbnRlcmFjdGluZygpIHx8XG4gICAgICAgICF0aGlzLnBvaW50ZXJJc0Rvd24gfHxcbiAgICAgICAgdGhpcy5wb2ludGVycy5sZW5ndGggPCAoYWN0aW9uLm5hbWUgPT09IEFjdGlvbk5hbWUuR2VzdHVyZSA/IDIgOiAxKSB8fFxuICAgICAgICAhaW50ZXJhY3RhYmxlLm9wdGlvbnNbYWN0aW9uLm5hbWVdLmVuYWJsZWQpIHtcbiAgICAgIHJldHVybiBmYWxzZVxuICAgIH1cblxuICAgIHV0aWxzLmNvcHlBY3Rpb24odGhpcy5wcmVwYXJlZCwgYWN0aW9uKVxuXG4gICAgdGhpcy5pbnRlcmFjdGFibGUgPSBpbnRlcmFjdGFibGVcbiAgICB0aGlzLmVsZW1lbnQgICAgICA9IGVsZW1lbnRcbiAgICB0aGlzLnJlY3QgICAgICAgICA9IGludGVyYWN0YWJsZS5nZXRSZWN0KGVsZW1lbnQpXG4gICAgdGhpcy5lZGdlcyAgICAgICAgPSB0aGlzLnByZXBhcmVkLmVkZ2VzXG4gICAgdGhpcy5fc3RvcHBlZCAgICAgPSBmYWxzZVxuICAgIHRoaXMuX2ludGVyYWN0aW5nID0gdGhpcy5fZG9QaGFzZSh7XG4gICAgICBpbnRlcmFjdGlvbjogdGhpcyxcbiAgICAgIGV2ZW50OiB0aGlzLmRvd25FdmVudCxcbiAgICAgIHBoYXNlOiBFdmVudFBoYXNlLlN0YXJ0LFxuICAgIH0pICYmICF0aGlzLl9zdG9wcGVkXG5cbiAgICByZXR1cm4gdGhpcy5faW50ZXJhY3RpbmdcbiAgfVxuXG4gIHBvaW50ZXJNb3ZlIChwb2ludGVyOiBJbnRlcmFjdC5Qb2ludGVyVHlwZSwgZXZlbnQ6IEludGVyYWN0LlBvaW50ZXJFdmVudFR5cGUsIGV2ZW50VGFyZ2V0OiBOb2RlKSB7XG4gICAgaWYgKCF0aGlzLnNpbXVsYXRpb24gJiYgISh0aGlzLm1vZGlmaWVycyAmJiB0aGlzLm1vZGlmaWVycy5lbmRQcmV2ZW50ZWQpKSB7XG4gICAgICB0aGlzLnVwZGF0ZVBvaW50ZXIocG9pbnRlciwgZXZlbnQsIGV2ZW50VGFyZ2V0LCBmYWxzZSlcbiAgICAgIHV0aWxzLnBvaW50ZXIuc2V0Q29vcmRzKHRoaXMuY29vcmRzLmN1ciwgdGhpcy5wb2ludGVycy5tYXAocCA9PiBwLnBvaW50ZXIpLCB0aGlzLl9ub3coKSlcbiAgICB9XG5cbiAgICBjb25zdCBkdXBsaWNhdGVNb3ZlID0gKHRoaXMuY29vcmRzLmN1ci5wYWdlLnggPT09IHRoaXMuY29vcmRzLnByZXYucGFnZS54ICYmXG4gICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmNvb3Jkcy5jdXIucGFnZS55ID09PSB0aGlzLmNvb3Jkcy5wcmV2LnBhZ2UueSAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5jb29yZHMuY3VyLmNsaWVudC54ID09PSB0aGlzLmNvb3Jkcy5wcmV2LmNsaWVudC54ICYmXG4gICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmNvb3Jkcy5jdXIuY2xpZW50LnkgPT09IHRoaXMuY29vcmRzLnByZXYuY2xpZW50LnkpXG5cbiAgICBsZXQgZHhcbiAgICBsZXQgZHlcblxuICAgIC8vIHJlZ2lzdGVyIG1vdmVtZW50IGdyZWF0ZXIgdGhhbiBwb2ludGVyTW92ZVRvbGVyYW5jZVxuICAgIGlmICh0aGlzLnBvaW50ZXJJc0Rvd24gJiYgIXRoaXMucG9pbnRlcldhc01vdmVkKSB7XG4gICAgICBkeCA9IHRoaXMuY29vcmRzLmN1ci5jbGllbnQueCAtIHRoaXMuY29vcmRzLnN0YXJ0LmNsaWVudC54XG4gICAgICBkeSA9IHRoaXMuY29vcmRzLmN1ci5jbGllbnQueSAtIHRoaXMuY29vcmRzLnN0YXJ0LmNsaWVudC55XG5cbiAgICAgIHRoaXMucG9pbnRlcldhc01vdmVkID0gdXRpbHMuaHlwb3QoZHgsIGR5KSA+IHRoaXMucG9pbnRlck1vdmVUb2xlcmFuY2VcbiAgICB9XG5cbiAgICBjb25zdCBzaWduYWxBcmcgPSB7XG4gICAgICBwb2ludGVyLFxuICAgICAgcG9pbnRlckluZGV4OiB0aGlzLmdldFBvaW50ZXJJbmRleChwb2ludGVyKSxcbiAgICAgIGV2ZW50LFxuICAgICAgZXZlbnRUYXJnZXQsXG4gICAgICBkeCxcbiAgICAgIGR5LFxuICAgICAgZHVwbGljYXRlOiBkdXBsaWNhdGVNb3ZlLFxuICAgICAgaW50ZXJhY3Rpb246IHRoaXMsXG4gICAgfVxuXG4gICAgaWYgKCFkdXBsaWNhdGVNb3ZlKSB7XG4gICAgICAvLyBzZXQgcG9pbnRlciBjb29yZGluYXRlLCB0aW1lIGNoYW5nZXMgYW5kIHZlbG9jaXR5XG4gICAgICB1dGlscy5wb2ludGVyLnNldENvb3JkRGVsdGFzKHRoaXMuY29vcmRzLmRlbHRhLCB0aGlzLmNvb3Jkcy5wcmV2LCB0aGlzLmNvb3Jkcy5jdXIpXG4gICAgICB1dGlscy5wb2ludGVyLnNldENvb3JkVmVsb2NpdHkodGhpcy5jb29yZHMudmVsb2NpdHksIHRoaXMuY29vcmRzLmRlbHRhKVxuICAgIH1cblxuICAgIHRoaXMuX3NpZ25hbHMuZmlyZSgnbW92ZScsIHNpZ25hbEFyZylcblxuICAgIGlmICghZHVwbGljYXRlTW92ZSkge1xuICAgICAgLy8gaWYgaW50ZXJhY3RpbmcsIGZpcmUgYW4gJ2FjdGlvbi1tb3ZlJyBzaWduYWwgZXRjXG4gICAgICBpZiAodGhpcy5pbnRlcmFjdGluZygpKSB7XG4gICAgICAgIHRoaXMubW92ZShzaWduYWxBcmcpXG4gICAgICB9XG5cbiAgICAgIGlmICh0aGlzLnBvaW50ZXJXYXNNb3ZlZCkge1xuICAgICAgICB1dGlscy5wb2ludGVyLmNvcHlDb29yZHModGhpcy5jb29yZHMucHJldiwgdGhpcy5jb29yZHMuY3VyKVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBgYGBqc1xuICAgKiBpbnRlcmFjdCh0YXJnZXQpXG4gICAqICAgLmRyYWdnYWJsZSh0cnVlKVxuICAgKiAgIC5vbignZHJhZ21vdmUnLCBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICogICAgIGlmIChzb21lQ29uZGl0aW9uKSB7XG4gICAqICAgICAgIC8vIGNoYW5nZSB0aGUgc25hcCBzZXR0aW5nc1xuICAgKiAgICAgICBldmVudC5pbnRlcmFjdGFibGUuZHJhZ2dhYmxlKHsgc25hcDogeyB0YXJnZXRzOiBbXSB9fSlcbiAgICogICAgICAgLy8gZmlyZSBhbm90aGVyIG1vdmUgZXZlbnQgd2l0aCByZS1jYWxjdWxhdGVkIHNuYXBcbiAgICogICAgICAgZXZlbnQuaW50ZXJhY3Rpb24ubW92ZSgpXG4gICAqICAgICB9XG4gICAqICAgfSlcbiAgICogYGBgXG4gICAqXG4gICAqIEZvcmNlIGEgbW92ZSBvZiB0aGUgY3VycmVudCBhY3Rpb24gYXQgdGhlIHNhbWUgY29vcmRpbmF0ZXMuIFVzZWZ1bCBpZlxuICAgKiBzbmFwL3Jlc3RyaWN0IGhhcyBiZWVuIGNoYW5nZWQgYW5kIHlvdSB3YW50IGEgbW92ZW1lbnQgd2l0aCB0aGUgbmV3XG4gICAqIHNldHRpbmdzLlxuICAgKi9cbiAgbW92ZSAoc2lnbmFsQXJnPykge1xuICAgIHNpZ25hbEFyZyA9IHV0aWxzLmV4dGVuZCh7XG4gICAgICBwb2ludGVyOiB0aGlzLl9sYXRlc3RQb2ludGVyLnBvaW50ZXIsXG4gICAgICBldmVudDogdGhpcy5fbGF0ZXN0UG9pbnRlci5ldmVudCxcbiAgICAgIGV2ZW50VGFyZ2V0OiB0aGlzLl9sYXRlc3RQb2ludGVyLmV2ZW50VGFyZ2V0LFxuICAgICAgaW50ZXJhY3Rpb246IHRoaXMsXG4gICAgfSwgc2lnbmFsQXJnIHx8IHt9KVxuXG4gICAgc2lnbmFsQXJnLnBoYXNlID0gRXZlbnRQaGFzZS5Nb3ZlXG5cbiAgICB0aGlzLl9kb1BoYXNlKHNpZ25hbEFyZylcbiAgfVxuXG4gIC8vIEVuZCBpbnRlcmFjdCBtb3ZlIGV2ZW50cyBhbmQgc3RvcCBhdXRvLXNjcm9sbCB1bmxlc3Mgc2ltdWxhdGlvbiBpcyBydW5uaW5nXG4gIHBvaW50ZXJVcCAocG9pbnRlcjogSW50ZXJhY3QuUG9pbnRlclR5cGUsIGV2ZW50OiBJbnRlcmFjdC5Qb2ludGVyRXZlbnRUeXBlLCBldmVudFRhcmdldDogTm9kZSwgY3VyRXZlbnRUYXJnZXQ6IEV2ZW50VGFyZ2V0KSB7XG4gICAgbGV0IHBvaW50ZXJJbmRleCA9IHRoaXMuZ2V0UG9pbnRlckluZGV4KHBvaW50ZXIpXG5cbiAgICBpZiAocG9pbnRlckluZGV4ID09PSAtMSkge1xuICAgICAgcG9pbnRlckluZGV4ID0gdGhpcy51cGRhdGVQb2ludGVyKHBvaW50ZXIsIGV2ZW50LCBldmVudFRhcmdldCwgZmFsc2UpXG4gICAgfVxuXG4gICAgdGhpcy5fc2lnbmFscy5maXJlKC9jYW5jZWwkL2kudGVzdChldmVudC50eXBlKSA/ICdjYW5jZWwnIDogJ3VwJywge1xuICAgICAgcG9pbnRlcixcbiAgICAgIHBvaW50ZXJJbmRleCxcbiAgICAgIGV2ZW50LFxuICAgICAgZXZlbnRUYXJnZXQsXG4gICAgICBjdXJFdmVudFRhcmdldCxcbiAgICAgIGludGVyYWN0aW9uOiB0aGlzLFxuICAgIH0pXG5cbiAgICBpZiAoIXRoaXMuc2ltdWxhdGlvbikge1xuICAgICAgdGhpcy5lbmQoZXZlbnQpXG4gICAgfVxuXG4gICAgdGhpcy5wb2ludGVySXNEb3duID0gZmFsc2VcbiAgICB0aGlzLnJlbW92ZVBvaW50ZXIocG9pbnRlciwgZXZlbnQpXG4gIH1cblxuICBkb2N1bWVudEJsdXIgKGV2ZW50KSB7XG4gICAgdGhpcy5lbmQoZXZlbnQpXG4gICAgdGhpcy5fc2lnbmFscy5maXJlKCdibHVyJywgeyBldmVudCwgaW50ZXJhY3Rpb246IHRoaXMgfSlcbiAgfVxuXG4gIC8qKlxuICAgKiBgYGBqc1xuICAgKiBpbnRlcmFjdCh0YXJnZXQpXG4gICAqICAgLmRyYWdnYWJsZSh0cnVlKVxuICAgKiAgIC5vbignbW92ZScsIGZ1bmN0aW9uIChldmVudCkge1xuICAgKiAgICAgaWYgKGV2ZW50LnBhZ2VYID4gMTAwMCkge1xuICAgKiAgICAgICAvLyBlbmQgdGhlIGN1cnJlbnQgYWN0aW9uXG4gICAqICAgICAgIGV2ZW50LmludGVyYWN0aW9uLmVuZCgpXG4gICAqICAgICAgIC8vIHN0b3AgYWxsIGZ1cnRoZXIgbGlzdGVuZXJzIGZyb20gYmVpbmcgY2FsbGVkXG4gICAqICAgICAgIGV2ZW50LnN0b3BJbW1lZGlhdGVQcm9wYWdhdGlvbigpXG4gICAqICAgICB9XG4gICAqICAgfSlcbiAgICogYGBgXG4gICAqXG4gICAqIEBwYXJhbSB7UG9pbnRlckV2ZW50fSBbZXZlbnRdXG4gICAqL1xuICBlbmQgKGV2ZW50PzogSW50ZXJhY3QuUG9pbnRlckV2ZW50VHlwZSkge1xuICAgIHRoaXMuX2VuZGluZyA9IHRydWVcbiAgICBldmVudCA9IGV2ZW50IHx8IHRoaXMuX2xhdGVzdFBvaW50ZXIuZXZlbnRcbiAgICBsZXQgZW5kUGhhc2VSZXN1bHRcblxuICAgIGlmICh0aGlzLmludGVyYWN0aW5nKCkpIHtcbiAgICAgIGVuZFBoYXNlUmVzdWx0ID0gdGhpcy5fZG9QaGFzZSh7XG4gICAgICAgIGV2ZW50LFxuICAgICAgICBpbnRlcmFjdGlvbjogdGhpcyxcbiAgICAgICAgcGhhc2U6IEV2ZW50UGhhc2UuRW5kLFxuICAgICAgfSlcbiAgICB9XG5cbiAgICB0aGlzLl9lbmRpbmcgPSBmYWxzZVxuXG4gICAgaWYgKGVuZFBoYXNlUmVzdWx0ID09PSB0cnVlKSB7XG4gICAgICB0aGlzLnN0b3AoKVxuICAgIH1cbiAgfVxuXG4gIGN1cnJlbnRBY3Rpb24gKCkge1xuICAgIHJldHVybiB0aGlzLl9pbnRlcmFjdGluZyA/IHRoaXMucHJlcGFyZWQubmFtZSA6IG51bGxcbiAgfVxuXG4gIGludGVyYWN0aW5nICgpIHtcbiAgICByZXR1cm4gdGhpcy5faW50ZXJhY3RpbmdcbiAgfVxuXG4gIC8qKiAqL1xuICBzdG9wICgpIHtcbiAgICB0aGlzLl9zaWduYWxzLmZpcmUoJ3N0b3AnLCB7IGludGVyYWN0aW9uOiB0aGlzIH0pXG5cbiAgICB0aGlzLmludGVyYWN0YWJsZSA9IHRoaXMuZWxlbWVudCA9IG51bGxcblxuICAgIHRoaXMuX2ludGVyYWN0aW5nID0gZmFsc2VcbiAgICB0aGlzLl9zdG9wcGVkID0gdHJ1ZVxuICAgIHRoaXMucHJlcGFyZWQubmFtZSA9IHRoaXMucHJldkV2ZW50ID0gbnVsbFxuICB9XG5cbiAgZ2V0UG9pbnRlckluZGV4IChwb2ludGVyKSB7XG4gICAgY29uc3QgcG9pbnRlcklkID0gdXRpbHMucG9pbnRlci5nZXRQb2ludGVySWQocG9pbnRlcilcblxuICAgIC8vIG1vdXNlIGFuZCBwZW4gaW50ZXJhY3Rpb25zIG1heSBoYXZlIG9ubHkgb25lIHBvaW50ZXJcbiAgICByZXR1cm4gKHRoaXMucG9pbnRlclR5cGUgPT09ICdtb3VzZScgfHwgdGhpcy5wb2ludGVyVHlwZSA9PT0gJ3BlbicpXG4gICAgICA/IHRoaXMucG9pbnRlcnMubGVuZ3RoIC0gMVxuICAgICAgOiB1dGlscy5hcnIuZmluZEluZGV4KHRoaXMucG9pbnRlcnMsIGN1clBvaW50ZXIgPT4gY3VyUG9pbnRlci5pZCA9PT0gcG9pbnRlcklkKVxuICB9XG5cbiAgZ2V0UG9pbnRlckluZm8gKHBvaW50ZXIpIHtcbiAgICByZXR1cm4gdGhpcy5wb2ludGVyc1t0aGlzLmdldFBvaW50ZXJJbmRleChwb2ludGVyKV1cbiAgfVxuXG4gIHVwZGF0ZVBvaW50ZXIgKHBvaW50ZXI6IEludGVyYWN0LlBvaW50ZXJUeXBlLCBldmVudDogSW50ZXJhY3QuUG9pbnRlckV2ZW50VHlwZSwgZXZlbnRUYXJnZXQ6IE5vZGUsIGRvd24/OiBib29sZWFuKSB7XG4gICAgY29uc3QgaWQgPSB1dGlscy5wb2ludGVyLmdldFBvaW50ZXJJZChwb2ludGVyKVxuICAgIGxldCBwb2ludGVySW5kZXggPSB0aGlzLmdldFBvaW50ZXJJbmRleChwb2ludGVyKVxuICAgIGxldCBwb2ludGVySW5mbyA9IHRoaXMucG9pbnRlcnNbcG9pbnRlckluZGV4XVxuXG4gICAgZG93biA9IGRvd24gPT09IGZhbHNlXG4gICAgICA/IGZhbHNlXG4gICAgICA6IGRvd24gfHwgLyhkb3dufHN0YXJ0KSQvaS50ZXN0KGV2ZW50LnR5cGUpXG5cbiAgICBpZiAoIXBvaW50ZXJJbmZvKSB7XG4gICAgICBwb2ludGVySW5mbyA9IG5ldyBQb2ludGVySW5mbyhcbiAgICAgICAgaWQsXG4gICAgICAgIHBvaW50ZXIsXG4gICAgICAgIGV2ZW50LFxuICAgICAgICBudWxsLFxuICAgICAgICBudWxsLFxuICAgICAgKVxuXG4gICAgICBwb2ludGVySW5kZXggPSB0aGlzLnBvaW50ZXJzLmxlbmd0aFxuICAgICAgdGhpcy5wb2ludGVycy5wdXNoKHBvaW50ZXJJbmZvKVxuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIHBvaW50ZXJJbmZvLnBvaW50ZXIgPSBwb2ludGVyXG4gICAgfVxuXG4gICAgaWYgKGRvd24pIHtcbiAgICAgIHRoaXMucG9pbnRlcklzRG93biA9IHRydWVcblxuICAgICAgaWYgKCF0aGlzLmludGVyYWN0aW5nKCkpIHtcbiAgICAgICAgdXRpbHMucG9pbnRlci5zZXRDb29yZHModGhpcy5jb29yZHMuc3RhcnQsIHRoaXMucG9pbnRlcnMubWFwKHAgPT4gcC5wb2ludGVyKSwgdGhpcy5fbm93KCkpXG5cbiAgICAgICAgdXRpbHMucG9pbnRlci5jb3B5Q29vcmRzKHRoaXMuY29vcmRzLmN1ciwgdGhpcy5jb29yZHMuc3RhcnQpXG4gICAgICAgIHV0aWxzLnBvaW50ZXIuY29weUNvb3Jkcyh0aGlzLmNvb3Jkcy5wcmV2LCB0aGlzLmNvb3Jkcy5zdGFydClcbiAgICAgICAgdXRpbHMucG9pbnRlci5wb2ludGVyRXh0ZW5kKHRoaXMuZG93blBvaW50ZXIsIHBvaW50ZXIpXG5cbiAgICAgICAgdGhpcy5kb3duRXZlbnQgPSBldmVudFxuICAgICAgICBwb2ludGVySW5mby5kb3duVGltZSA9IHRoaXMuY29vcmRzLmN1ci50aW1lU3RhbXBcbiAgICAgICAgcG9pbnRlckluZm8uZG93blRhcmdldCA9IGV2ZW50VGFyZ2V0XG5cbiAgICAgICAgdGhpcy5wb2ludGVyV2FzTW92ZWQgPSBmYWxzZVxuICAgICAgfVxuICAgIH1cblxuICAgIHRoaXMuX3VwZGF0ZUxhdGVzdFBvaW50ZXIocG9pbnRlciwgZXZlbnQsIGV2ZW50VGFyZ2V0KVxuXG4gICAgdGhpcy5fc2lnbmFscy5maXJlKCd1cGRhdGUtcG9pbnRlcicsIHtcbiAgICAgIHBvaW50ZXIsXG4gICAgICBldmVudCxcbiAgICAgIGV2ZW50VGFyZ2V0LFxuICAgICAgZG93bixcbiAgICAgIHBvaW50ZXJJbmZvLFxuICAgICAgcG9pbnRlckluZGV4LFxuICAgICAgaW50ZXJhY3Rpb246IHRoaXMsXG4gICAgfSlcblxuICAgIHJldHVybiBwb2ludGVySW5kZXhcbiAgfVxuXG4gIHJlbW92ZVBvaW50ZXIgKHBvaW50ZXI6IEludGVyYWN0LlBvaW50ZXJUeXBlLCBldmVudDogSW50ZXJhY3QuUG9pbnRlckV2ZW50VHlwZSkge1xuICAgIGNvbnN0IHBvaW50ZXJJbmRleCA9IHRoaXMuZ2V0UG9pbnRlckluZGV4KHBvaW50ZXIpXG5cbiAgICBpZiAocG9pbnRlckluZGV4ID09PSAtMSkgeyByZXR1cm4gfVxuXG4gICAgY29uc3QgcG9pbnRlckluZm8gPSB0aGlzLnBvaW50ZXJzW3BvaW50ZXJJbmRleF1cblxuICAgIHRoaXMuX3NpZ25hbHMuZmlyZSgncmVtb3ZlLXBvaW50ZXInLCB7XG4gICAgICBwb2ludGVyLFxuICAgICAgZXZlbnQsXG4gICAgICBwb2ludGVySW5kZXgsXG4gICAgICBwb2ludGVySW5mbyxcbiAgICAgIGludGVyYWN0aW9uOiB0aGlzLFxuICAgIH0pXG5cbiAgICB0aGlzLnBvaW50ZXJzLnNwbGljZShwb2ludGVySW5kZXgsIDEpXG4gIH1cblxuICBfdXBkYXRlTGF0ZXN0UG9pbnRlciAocG9pbnRlciwgZXZlbnQsIGV2ZW50VGFyZ2V0KSB7XG4gICAgdGhpcy5fbGF0ZXN0UG9pbnRlci5wb2ludGVyID0gcG9pbnRlclxuICAgIHRoaXMuX2xhdGVzdFBvaW50ZXIuZXZlbnQgPSBldmVudFxuICAgIHRoaXMuX2xhdGVzdFBvaW50ZXIuZXZlbnRUYXJnZXQgPSBldmVudFRhcmdldFxuICB9XG5cbiAgZGVzdHJveSAoKSB7XG4gICAgdGhpcy5fbGF0ZXN0UG9pbnRlci5wb2ludGVyID0gbnVsbFxuICAgIHRoaXMuX2xhdGVzdFBvaW50ZXIuZXZlbnQgPSBudWxsXG4gICAgdGhpcy5fbGF0ZXN0UG9pbnRlci5ldmVudFRhcmdldCA9IG51bGxcbiAgfVxuXG4gIF9jcmVhdGVQcmVwYXJlZEV2ZW50IChldmVudDogSW50ZXJhY3QuUG9pbnRlckV2ZW50VHlwZSwgcGhhc2U6IEV2ZW50UGhhc2UsIHByZUVuZDogYm9vbGVhbiwgdHlwZTogc3RyaW5nKSB7XG4gICAgY29uc3QgYWN0aW9uTmFtZSA9IHRoaXMucHJlcGFyZWQubmFtZVxuXG4gICAgcmV0dXJuIG5ldyBJbnRlcmFjdEV2ZW50KHRoaXMsIGV2ZW50LCBhY3Rpb25OYW1lLCBwaGFzZSwgdGhpcy5lbGVtZW50LCBudWxsLCBwcmVFbmQsIHR5cGUpXG4gIH1cblxuICBfZmlyZUV2ZW50IChpRXZlbnQpIHtcbiAgICB0aGlzLmludGVyYWN0YWJsZS5maXJlKGlFdmVudClcblxuICAgIGlmICghdGhpcy5wcmV2RXZlbnQgfHwgaUV2ZW50LnRpbWVTdGFtcCA+PSB0aGlzLnByZXZFdmVudC50aW1lU3RhbXApIHtcbiAgICAgIHRoaXMucHJldkV2ZW50ID0gaUV2ZW50XG4gICAgfVxuICB9XG5cbiAgX2RvUGhhc2UgKHNpZ25hbEFyZzogUGFydGlhbDxJbnRlcmFjdC5TaWduYWxBcmc+KSB7XG4gICAgY29uc3QgeyBldmVudCwgcGhhc2UsIHByZUVuZCwgdHlwZSB9ID0gc2lnbmFsQXJnXG4gICAgY29uc3QgYmVmb3JlUmVzdWx0ID0gdGhpcy5fc2lnbmFscy5maXJlKGBiZWZvcmUtYWN0aW9uLSR7cGhhc2V9YCwgc2lnbmFsQXJnKVxuXG4gICAgaWYgKGJlZm9yZVJlc3VsdCA9PT0gZmFsc2UpIHtcbiAgICAgIHJldHVybiBmYWxzZVxuICAgIH1cblxuICAgIGNvbnN0IGlFdmVudCA9IHNpZ25hbEFyZy5pRXZlbnQgPSB0aGlzLl9jcmVhdGVQcmVwYXJlZEV2ZW50KGV2ZW50LCBwaGFzZSwgcHJlRW5kLCB0eXBlKVxuICAgIGNvbnN0IHsgcmVjdCB9ID0gdGhpc1xuXG4gICAgaWYgKHJlY3QpIHtcbiAgICAgIC8vIHVwZGF0ZSB0aGUgcmVjdCBtb2RpZmljYXRpb25zXG4gICAgICBjb25zdCBlZGdlcyA9IHRoaXMuZWRnZXMgfHwgdGhpcy5wcmVwYXJlZC5lZGdlcyB8fCB7IGxlZnQ6IHRydWUsIHJpZ2h0OiB0cnVlLCB0b3A6IHRydWUsIGJvdHRvbTogdHJ1ZSB9XG5cbiAgICAgIGlmIChlZGdlcy50b3ApICAgIHsgcmVjdC50b3AgICAgKz0gaUV2ZW50LmRlbHRhLnkgfVxuICAgICAgaWYgKGVkZ2VzLmJvdHRvbSkgeyByZWN0LmJvdHRvbSArPSBpRXZlbnQuZGVsdGEueSB9XG4gICAgICBpZiAoZWRnZXMubGVmdCkgICB7IHJlY3QubGVmdCAgICs9IGlFdmVudC5kZWx0YS54IH1cbiAgICAgIGlmIChlZGdlcy5yaWdodCkgIHsgcmVjdC5yaWdodCAgKz0gaUV2ZW50LmRlbHRhLnggfVxuXG4gICAgICByZWN0LndpZHRoID0gcmVjdC5yaWdodCAtIHJlY3QubGVmdFxuICAgICAgcmVjdC5oZWlnaHQgPSByZWN0LmJvdHRvbSAtIHJlY3QudG9wXG4gICAgfVxuXG4gICAgdGhpcy5fc2lnbmFscy5maXJlKGBhY3Rpb24tJHtwaGFzZX1gLCBzaWduYWxBcmcpXG5cbiAgICB0aGlzLl9maXJlRXZlbnQoaUV2ZW50KVxuXG4gICAgdGhpcy5fc2lnbmFscy5maXJlKGBhZnRlci1hY3Rpb24tJHtwaGFzZX1gLCBzaWduYWxBcmcpXG5cbiAgICByZXR1cm4gdHJ1ZVxuICB9XG5cbiAgX25vdyAoKSB7IHJldHVybiBEYXRlLm5vdygpIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgSW50ZXJhY3Rpb25cbmV4cG9ydCB7IFBvaW50ZXJJbmZvIH1cbiJdfQ==