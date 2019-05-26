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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiSW50ZXJhY3Rpb24uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJJbnRlcmFjdGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEtBQUssS0FBSyxNQUFNLG1CQUFtQixDQUFBO0FBRTFDLE9BQU8sYUFBYSxFQUFFLEVBQUUsVUFBVSxFQUFFLE1BQU0saUJBQWlCLENBQUE7QUFDM0QsT0FBTyxXQUFXLE1BQU0sZUFBZSxDQUFBO0FBQ3ZDLE9BQU8sRUFBRSxVQUFVLEVBQUUsTUFBTSxTQUFTLENBQUE7QUFjcEMsTUFBTSxDQUFOLElBQVksWUFPWDtBQVBELFdBQVksWUFBWTtJQUN0QixpQ0FBaUIsQ0FBQTtJQUNqQiw0QkFBWSxDQUFBO0lBQ1osNkJBQWEsQ0FBQTtJQUNiLGtDQUFrQixDQUFBO0lBQ2xCLG9DQUFvQixDQUFBO0lBQ3BCLDJCQUFXLENBQUE7QUFDYixDQUFDLEVBUFcsWUFBWSxLQUFaLFlBQVksUUFPdkI7QUFFRCxNQUFNLENBQU4sSUFBWSxhQU1YO0FBTkQsV0FBWSxhQUFhO0lBQ3ZCLDJCQUFVLENBQUE7SUFDViwwQkFBUyxDQUFBO0lBQ1QseUJBQVEsQ0FBQTtJQUNSLDBCQUFTLENBQUE7SUFDVCxpQ0FBZ0IsQ0FBQTtBQUNsQixDQUFDLEVBTlcsYUFBYSxLQUFiLGFBQWEsUUFNeEI7QUFPRCxNQUFNLE9BQU8sV0FBVztJQTZFdEIsTUFBTTtJQUNOLFlBQWEsRUFBRSxXQUFXLEVBQUUsT0FBTyxFQUFvRDtRQTdFdkYsNkNBQTZDO1FBQzdDLGlCQUFZLEdBQWlCLElBQUksQ0FBQTtRQUVqQyx5Q0FBeUM7UUFDekMsWUFBTyxHQUFZLElBQUksQ0FBQTtRQVF2QixxREFBcUQ7UUFDckQsYUFBUSxHQUFtQjtZQUN6QixJQUFJLEVBQUcsSUFBSTtZQUNYLElBQUksRUFBRyxJQUFJO1lBQ1gsS0FBSyxFQUFFLElBQUk7U0FDWixDQUFBO1FBSUQsK0JBQStCO1FBQy9CLGFBQVEsR0FBa0IsRUFBRSxDQUFBO1FBRTVC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QUFNLENBQUMsR0FBRyxFQUFFLElBQUksQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLEVBQUUsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDLENBQUE7U0FDM0Y7UUFFRCxNQUFNLGFBQWEsR0FBRyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDLEtBQUssSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDbEQsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUMsS0FBSyxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUNsRCxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQyxLQUFLLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQ3RELElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDLEtBQUssSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFBO1FBRTlFLElBQUksRUFBRSxDQUFBO1FBQ04sSUFBSSxFQUFFLENBQUE7UUFFTixzREFBc0Q7UUFDdEQsSUFBSSxJQUFJLENBQUMsYUFBYSxJQUFJLENBQUMsSUFBSSxDQUFDLGVBQWUsRUFBRTtZQUMvQyxFQUFFLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFBO1lBQzFELEVBQUUsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxD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LEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQTtTQUNyQztRQUVELElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLFVBQVUsS0FBSyxFQUFFLEVBQUUsU0FBUyxDQUFDLENBQUE7UUFFaEQsSUFBSSxDQUFDLFVBQVUsQ0FBQyxNQUFNLENBQUMsQ0FBQTtRQUV2QixJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsS0FBSyxFQUFFLEVBQUUsU0FBUyxDQUFDLENBQUE7UUFFdEQsT0FBTyxJQUFJLENBQUE7SUFDYixDQUFDO0lBRUQsSUFBSSxLQUFNLE9BQU8sSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFBLENBQUMsQ0FBQztDQUM5QjtBQUVELGVBQWUsV0FBVyxDQUFBO0FBQzFCLE9BQU8sRUFBRSxXQUFXLEVBQUUsQ0FBQSIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIHV0aWxzIGZyb20gJ0BpbnRlcmFjdGpzL3V0aWxzJ1xuaW1wb3J0IEludGVyYWN0YWJsZSBmcm9tICcuL0ludGVyYWN0YWJsZSdcbmltcG9ydCBJbnRlcmFjdEV2ZW50LCB7IEV2ZW50UGhhc2UgfSBmcm9tICcuL0ludGVyYWN0RXZlbnQnXG5pbXBvcnQgUG9pbnRlckluZm8gZnJvbSAnLi9Qb2ludGVySW5mbydcbmltcG9ydCB7IEFjdGlvbk5hbWUgfSBmcm9tICcuL3Njb3BlJ1xuXG5leHBvcnQgaW50ZXJmYWNlIEFjdGlvblByb3BzPFQgZXh0ZW5kcyBBY3Rpb25OYW1lID0gYW55PiB7XG4gIG5hbWU6IFRcbiAgYXhpcz86ICd4JyB8ICd5JyB8ICd4eSdcbiAgZWRnZXM/OiB7XG4gICAgW2VkZ2UgaW4ga2V5b2YgSW50ZXJhY3QuUmVjdF0/OiBib29sZWFuXG4gIH1cbn1cblxuZXhwb3J0IGludGVyZmFjZSBTdGFydEFjdGlvbiBleHRlbmRzIEFjdGlvblByb3BzIHtcbiAgbmFtZTogQWN0aW9uTmFtZSB8IHN0cmluZ1xufVxuXG5leHBvcnQgZW51bSBfUHJveHlWYWx1ZXMge1xuICBpbnRlcmFjdGFibGUgPSAnJyxcbiAgZWxlbWVudCA9ICcnLFxuICBwcmVwYXJlZCA9ICcnLFxuICBwb2ludGVySXNEb3duID0gJycsXG4gIHBvaW50ZXJXYXNNb3ZlZCA9ICcnLFxuICBfcHJveHkgPSAnJ1xufVxuXG5leHBvcnQgZW51bSBfUHJveHlNZXRob2RzIHtcbiAgc3RhcnQgPSAnJyxcbiAgbW92ZSA9ICcnLFxuICBlbmQgPSAnJyxcbiAgc3RvcCA9ICcnLFxuICBpbnRlcmFjdGluZyA9ICcnXG59XG5cbmV4cG9ydCB0eXBlIF9JbnRlcmFjdGlvblByb3h5ID0gUGljazxcbiAgSW50ZXJhY3Rpb24sXG4gIGtleW9mIHR5cGVvZiBfUHJveHlWYWx1ZXMgfCBrZXlvZiB0eXBlb2YgX1Byb3h5TWV0aG9kc1xuPlxuXG5leHBvcnQgY2xhc3MgSW50ZXJhY3Rpb248VCBleHRlbmRzIEFjdGlvbk5hbWUgPSBhbnk+IHtcbiAgLy8gY3VycmVudCBpbnRlcmFjdGFibGUgYmVpbmcgaW50ZXJhY3RlZCB3aXRoXG4gIGludGVyYWN0YWJsZTogSW50ZXJhY3RhYmxlID0gbnVsbFxuXG4gIC8vIHRoZSB0YXJnZXQgZWxlbWVudCBvZiB0aGUgaW50ZXJhY3RhYmxlXG4gIGVsZW1lbnQ6IEVsZW1lbnQgPSBudWxsXG4gIHJlY3Q6IEludGVyYWN0LlJlY3QgJiBJbnRlcmFjdC5TaXplXG4gIGVkZ2VzOiB7XG4gICAgW1AgaW4ga2V5b2YgSW50ZXJhY3QuUmVjdF0/OiBib29sZWFuXG4gIH1cblxuICBfc2lnbmFsczogdXRpbHMuU2lnbmFsc1xuXG4gIC8vIGFjdGlvbiB0aGF0J3MgcmVhZHkgdG8gYmUgZmlyZWQgb24gbmV4dCBtb3ZlIGV2ZW50XG4gIHByZXBhcmVkOiBBY3Rpb25Qcm9wczxUPiA9IHtcbiAgICBuYW1lIDogbnVsbCxcbiAgICBheGlzIDogbnVsbCxcbiAgICBlZGdlczogbnVsbCxcbiAgfVxuXG4gIHBvaW50ZXJUeXBlOiBzdHJpbmdcblxuICAvLyBrZWVwIHRyYWNrIG9mIGFkZGVkIHBvaW50ZXJzXG4gIHBvaW50ZXJzOiBQb2ludGVySW5mb1tdID0gW11cblxuICAvLyBwb2ludGVyZG93bi9tb3VzZWRvd24vdG91Y2hzdGFydCBldmVudFxuICBkb3duRXZlbnQ6IEludGVyYWN0LlBvaW50ZXJFdmVudFR5cGUgPSBudWxsXG5cbiAgZG93blBvaW50ZXI6IEludGVyYWN0LlBvaW50ZXJUeXBlID0ge30gYXMgSW50ZXJhY3QuUG9pbnRlclR5cGVcblxuICBfbGF0ZXN0UG9pbnRlcjoge1xuICAgIHBvaW50ZXI6IEludGVyYWN0LkV2ZW50VGFyZ2V0XG4gICAgZXZlbnQ6IEludGVyYWN0LlBvaW50ZXJFdmVudFR5cGVcbiAgICBldmVudFRhcmdldDogTm9kZSxcbiAgfSA9IHtcbiAgICBwb2ludGVyOiBudWxsLFxuICAgIGV2ZW50OiBudWxsLFxuICAgIGV2ZW50VGFyZ2V0OiBudWxsLFxuICB9XG5cbiAgLy8gcHJldmlvdXMgYWN0aW9uIGV2ZW50XG4gIHByZXZFdmVudDogSW50ZXJhY3RFdmVudDxUPiA9IG51bGxcblxuICBwb2ludGVySXNEb3duID0gZmFsc2VcbiAgcG9pbnRlcldhc01vdmVkID0gZmFsc2VcbiAgX2ludGVyYWN0aW5nID0gZmFsc2VcbiAgX2VuZGluZyA9IGZhbHNlXG4gIF9wcm94eTogX0ludGVyYWN0aW9uUHJveHkgPSBudWxsXG5cbiAgc2ltdWxhdGlvbiA9IG51bGxcblxuICBnZXQgcG9pbnRlck1vdmVUb2xlcmFuY2UgKCkge1xuICAgIHJldHVybiAxXG4gIH1cblxuICAvKipcbiAgICogQGFsaWFzIEludGVyYWN0aW9uLnByb3RvdHlwZS5tb3ZlXG4gICAqL1xuICBkb01vdmUgPSB1dGlscy53YXJuT25jZShcbiAgICBmdW5jdGlvbiAodGhpczogSW50ZXJhY3Rpb24sIHNpZ25hbEFyZzogYW55KSB7XG4gICAgICB0aGlzLm1vdmUoc2lnbmFsQXJnKVxuICAgIH0sXG4gICAgJ1RoZSBpbnRlcmFjdGlvbi5kb01vdmUoKSBtZXRob2QgaGFzIGJlZW4gcmVuYW1lZCB0byBpbnRlcmFjdGlvbi5tb3ZlKCknKVxuXG4gIGNvb3JkcyA9IHtcbiAgICAvLyBTdGFydGluZyBJbnRlcmFjdEV2ZW50IHBvaW50ZXIgY29vcmRpbmF0ZXNcbiAgICBzdGFydDogdXRpbHMucG9pbnRlci5uZXdDb29yZHMoKSxcbiAgICAvLyBQcmV2aW91cyBuYXRpdmUgcG9pbnRlciBtb3ZlIGV2ZW50IGNvb3JkaW5hdGVzXG4gICAgcHJldjogdXRpbHMucG9pbnRlci5uZXdDb29yZHMoKSxcbiAgICAvLyBjdXJyZW50IG5hdGl2ZSBwb2ludGVyIG1vdmUgZXZlbnQgY29vcmRpbmF0ZXNcbiAgICBjdXI6IHV0aWxzLnBvaW50ZXIubmV3Q29vcmRzKCksXG4gICAgLy8gQ2hhbmdlIGluIGNvb3JkaW5hdGVzIGFuZCB0aW1lIG9mIHRoZSBwb2ludGVyXG4gICAgZGVsdGE6IHV0aWxzLnBvaW50ZXIubmV3Q29vcmRzKCksXG4gICAgLy8gcG9pbnRlciB2ZWxvY2l0eVxuICAgIHZlbG9jaXR5OiB1dGlscy5wb2ludGVyLm5ld0Nvb3JkcygpLFxuICB9XG5cbiAgLyoqICovXG4gIGNvbnN0cnVjdG9yICh7IHBvaW50ZXJUeXBlLCBzaWduYWxzIH06IHsgcG9pbnRlclR5cGU/OiBzdHJpbmcsIHNpZ25hbHM6IHV0aWxzLlNpZ25hbHMgfSkge1xuICAgIHRoaXMuX3NpZ25hbHMgPSBzaWduYWxzXG4gICAgdGhpcy5wb2ludGVyVHlwZSA9IHBvaW50ZXJUeXBlXG5cbiAgICBjb25zdCB0aGF0ID0gdGhpc1xuXG4gICAgdGhpcy5fcHJveHkgPSB7fSBhcyBfSW50ZXJhY3Rpb25Qcm94eVxuXG4gICAgZm9yIChjb25zdCBrZXkgaW4gX1Byb3h5VmFsdWVzKSB7XG4gICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkodGhpcy5fcHJveHksIGtleSwge1xuICAgICAgICBnZXQgKCkgeyByZXR1cm4gdGhhdFtrZXldIH0sXG4gICAgICB9KVxuICAgIH1cblxuICAgIGZvciAoY29uc3Qga2V5IGluIF9Qcm94eU1ldGhvZHMpIHtcbiAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0aGlzLl9wcm94eSwga2V5LCB7XG4gICAgICAgIHZhbHVlOiAoLi4uYXJncykgPT4gdGhhdFtrZXldKC4uLmFyZ3MpLFxuICAgICAgfSlcbiAgICB9XG5cbiAgICB0aGlzLl9zaWduYWxzLmZpcmUoJ25ldycsIHsgaW50ZXJhY3Rpb246IHRoaXMgfSlcbiAgfVxuXG4gIHBvaW50ZXJEb3duIChwb2ludGVyOiBJbnRlcmFjdC5Qb2ludGVyVHlwZSwgZXZlbnQ6IEludGVyYWN0LlBvaW50ZXJFdmVudFR5cGUsIGV2ZW50VGFyZ2V0OiBOb2RlKSB7XG4gICAgY29uc3QgcG9pbnRlckluZGV4ID0gdGhpcy51cGRhdGVQb2ludGVyKHBvaW50ZXIsIGV2ZW50LCBldmVudFRhcmdldCwgdHJ1ZSlcblxuICAgIHRoaXMuX3NpZ25hbHMuZmlyZSgnZG93bicsIHtcbiAgICAgIHBvaW50ZXIsXG4gICAgICBldmVudCxcbiAgICAgIGV2ZW50VGFyZ2V0LFxuICAgICAgcG9pbnRlckluZGV4LFxuICAgICAgaW50ZXJhY3Rpb246IHRoaXMsXG4gICAgfSlcbiAgfVxuXG4gIC8qKlxuICAgKiBgYGBqc1xuICAgKiBpbnRlcmFjdCh0YXJnZXQpXG4gICAqICAgLmRyYWdnYWJsZSh7XG4gICAqICAgICAvLyBkaXNhYmxlIHRoZSBkZWZhdWx0IGRyYWcgc3RhcnQgYnkgZG93bi0+bW92ZVxuICAgKiAgICAgbWFudWFsU3RhcnQ6IHRydWVcbiAgICogICB9KVxuICAgKiAgIC8vIHN0YXJ0IGRyYWdnaW5nIGFmdGVyIHRoZSB1c2VyIGhvbGRzIHRoZSBwb2ludGVyIGRvd25cbiAgICogICAub24oJ2hvbGQnLCBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICogICAgIHZhciBpbnRlcmFjdGlvbiA9IGV2ZW50LmludGVyYWN0aW9uXG4gICAqXG4gICAqICAgICBpZiAoIWludGVyYWN0aW9uLmludGVyYWN0aW5nKCkpIHtcbiAgICogICAgICAgaW50ZXJhY3Rpb24uc3RhcnQoeyBuYW1lOiAnZHJhZycgfSxcbiAgICogICAgICAgICAgICAgICAgICAgICAgICAgZXZlbnQuaW50ZXJhY3RhYmxlLFxuICAgKiAgICAgICAgICAgICAgICAgICAgICAgICBldmVudC5jdXJyZW50VGFyZ2V0KVxuICAgKiAgICAgfVxuICAgKiB9KVxuICAgKiBgYGBcbiAgICpcbiAgICogU3RhcnQgYW4gYWN0aW9uIHdpdGggdGhlIGdpdmVuIEludGVyYWN0YWJsZSBhbmQgRWxlbWVudCBhcyB0YXJ0Z2V0cy4gVGhlXG4gICAqIGFjdGlvbiBtdXN0IGJlIGVuYWJsZWQgZm9yIHRoZSB0YXJnZXQgSW50ZXJhY3RhYmxlIGFuZCBhbiBhcHByb3ByaWF0ZVxuICAgKiBudW1iZXIgb2YgcG9pbnRlcnMgbXVzdCBiZSBoZWxkIGRvd24gLSAxIGZvciBkcmFnL3Jlc2l6ZSwgMiBmb3IgZ2VzdHVyZS5cbiAgICpcbiAgICogVXNlIGl0IHdpdGggYGludGVyYWN0YWJsZS48YWN0aW9uPmFibGUoeyBtYW51YWxTdGFydDogZmFsc2UgfSlgIHRvIGFsd2F5c1xuICAgKiBbc3RhcnQgYWN0aW9ucyBtYW51YWxseV0oaHR0cHM6Ly9naXRodWIuY29tL3RheWUvaW50ZXJhY3QuanMvaXNzdWVzLzExNClcbiAgICpcbiAgICogQHBhcmFtIHtvYmplY3R9IGFjdGlvbiAgIFRoZSBhY3Rpb24gdG8gYmUgcGVyZm9ybWVkIC0gZHJhZywgcmVzaXplLCBldGMuXG4gICAqIEBwYXJhbSB7SW50ZXJhY3RhYmxlfSB0YXJnZXQgIFRoZSBJbnRlcmFjdGFibGUgdG8gdGFyZ2V0XG4gICAqIEBwYXJhbSB7RWxlbWVudH0gZWxlbWVudCBUaGUgRE9NIEVsZW1lbnQgdG8gdGFyZ2V0XG4gICAqIEByZXR1cm4ge29iamVjdH0gaW50ZXJhY3RcbiAgICovXG4gIHN0YXJ0IChhY3Rpb246IFN0YXJ0QWN0aW9uLCBpbnRlcmFjdGFibGU6IEludGVyYWN0YWJsZSwgZWxlbWVudDogRWxlbWVudCkge1xuICAgIGlmICh0aGlzLmludGVyYWN0aW5nKCkgfHxcbiAgICAgICAgIXRoaXMucG9pbnRlcklzRG93biB8fFxuICAgICAgICB0aGlzLnBvaW50ZXJzLmxlbmd0aCA8IChhY3Rpb24ubmFtZSA9PT0gQWN0aW9uTmFtZS5HZXN0dXJlID8gMiA6IDEpIHx8XG4gICAgICAgICFpbnRlcmFjdGFibGUub3B0aW9uc1thY3Rpb24ubmFtZV0uZW5hYmxlZCkge1xuICAgICAgcmV0dXJuIGZhbHNlXG4gICAgfVxuXG4gICAgdXRpbHMuY29weUFjdGlvbih0aGlzLnByZXBhcmVkLCBhY3Rpb24pXG5cbiAgICB0aGlzLmludGVyYWN0YWJsZSA9IGludGVyYWN0YWJsZVxuICAgIHRoaXMuZWxlbWVudCAgICAgID0gZWxlbWVudFxuICAgIHRoaXMucmVjdCAgICAgICAgID0gaW50ZXJhY3RhYmxlLmdldFJlY3QoZWxlbWVudClcbiAgICB0aGlzLmVkZ2VzICAgICAgICA9IHRoaXMucHJlcGFyZWQuZWRnZXNcbiAgICB0aGlzLl9pbnRlcmFjdGluZyA9IHRoaXMuX2RvUGhhc2Uoe1xuICAgICAgaW50ZXJhY3Rpb246IHRoaXMsXG4gICAgICBldmVudDogdGhpcy5kb3duRXZlbnQsXG4gICAgICBwaGFzZTogRXZlbnRQaGFzZS5TdGFydCxcbiAgICB9KVxuXG4gICAgcmV0dXJuIHRoaXMuX2ludGVyYWN0aW5nXG4gIH1cblxuICBwb2ludGVyTW92ZSAocG9pbnRlcjogSW50ZXJhY3QuUG9pbnRlclR5cGUsIGV2ZW50OiBJbnRlcmFjdC5Qb2ludGVyRXZlbnRUeXBlLCBldmVudFRhcmdldDogTm9kZSkge1xuICAgIGlmICghdGhpcy5zaW11bGF0aW9uKSB7XG4gICAgICB0aGlzLnVwZGF0ZVBvaW50ZXIocG9pbnRlciwgZXZlbnQsIGV2ZW50VGFyZ2V0LCBmYWxzZSlcbiAgICAgIHV0aWxzLnBvaW50ZXIuc2V0Q29vcmRzKHRoaXMuY29vcmRzLmN1ciwgdGhpcy5wb2ludGVycy5tYXAoKHApID0+IHAucG9pbnRlciksIHRoaXMuX25vdygpKVxuICAgIH1cblxuICAgIGNvbnN0IGR1cGxpY2F0ZU1vdmUgPSAodGhpcy5jb29yZHMuY3VyLnBhZ2UueCA9PT0gdGhpcy5jb29yZHMucHJldi5wYWdlLnggJiZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuY29vcmRzLmN1ci5wYWdlLnkgPT09IHRoaXMuY29vcmRzLnByZXYucGFnZS55ICYmXG4gICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmNvb3Jkcy5jdXIuY2xpZW50LnggPT09IHRoaXMuY29vcmRzLnByZXYuY2xpZW50LnggJiZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuY29vcmRzLmN1ci5jbGllbnQueSA9PT0gdGhpcy5jb29yZHMucHJldi5jbGllbnQueSlcblxuICAgIGxldCBkeFxuICAgIGxldCBkeVxuXG4gICAgLy8gcmVnaXN0ZXIgbW92ZW1lbnQgZ3JlYXRlciB0aGFuIHBvaW50ZXJNb3ZlVG9sZXJhbmNlXG4gICAgaWYgKHRoaXMucG9pbnRlcklzRG93biAmJiAhdGhpcy5wb2ludGVyV2FzTW92ZWQpIHtcbiAgICAgIGR4ID0gdGhpcy5jb29yZHMuY3VyLmNsaWVudC54IC0gdGhpcy5jb29yZHMuc3RhcnQuY2xpZW50LnhcbiAgICAgIGR5ID0gdGhpcy5jb29yZHMuY3VyLmNsaWVudC55IC0gdGhpcy5jb29yZHMuc3RhcnQuY2xpZW50LnlcblxuICAgICAgdGhpcy5wb2ludGVyV2FzTW92ZWQgPSB1dGlscy5oeXBvdChkeCwgZHkpID4gdGhpcy5wb2ludGVyTW92ZVRvbGVyYW5jZVxuICAgIH1cblxuICAgIGNvbnN0IHNpZ25hbEFyZyA9IHtcbiAgICAgIHBvaW50ZXIsXG4gICAgICBwb2ludGVySW5kZXg6IHRoaXMuZ2V0UG9pbnRlckluZGV4KHBvaW50ZXIpLFxuICAgICAgZXZlbnQsXG4gICAgICBldmVudFRhcmdldCxcbiAgICAgIGR4LFxuICAgICAgZHksXG4gICAgICBkdXBsaWNhdGU6IGR1cGxpY2F0ZU1vdmUsXG4gICAgICBpbnRlcmFjdGlvbjogdGhpcyxcbiAgICB9XG5cbiAgICBpZiAoIWR1cGxpY2F0ZU1vdmUpIHtcbiAgICAgIC8vIHNldCBwb2ludGVyIGNvb3JkaW5hdGUsIHRpbWUgY2hhbmdlcyBhbmQgdmVsb2NpdHlcbiAgICAgIHV0aWxzLnBvaW50ZXIuc2V0Q29vcmREZWx0YXModGhpcy5jb29yZHMuZGVsdGEsIHRoaXMuY29vcmRzLnByZXYsIHRoaXMuY29vcmRzLmN1cilcbiAgICAgIHV0aWxzLnBvaW50ZXIuc2V0Q29vcmRWZWxvY2l0eSh0aGlzLmNvb3Jkcy52ZWxvY2l0eSwgdGhpcy5jb29yZHMuZGVsdGEpXG4gICAgfVxuXG4gICAgdGhpcy5fc2lnbmFscy5maXJlKCdtb3ZlJywgc2lnbmFsQXJnKVxuXG4gICAgaWYgKCFkdXBsaWNhdGVNb3ZlKSB7XG4gICAgICAvLyBpZiBpbnRlcmFjdGluZywgZmlyZSBhbiAnYWN0aW9uLW1vdmUnIHNpZ25hbCBldGNcbiAgICAgIGlmICh0aGlzLmludGVyYWN0aW5nKCkpIHtcbiAgICAgICAgdGhpcy5tb3ZlKHNpZ25hbEFyZylcbiAgICAgIH1cblxuICAgICAgaWYgKHRoaXMucG9pbnRlcldhc01vdmVkKSB7XG4gICAgICAgIHV0aWxzLnBvaW50ZXIuY29weUNvb3Jkcyh0aGlzLmNvb3Jkcy5wcmV2LCB0aGlzLmNvb3Jkcy5jdXIpXG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIGBgYGpzXG4gICAqIGludGVyYWN0KHRhcmdldClcbiAgICogICAuZHJhZ2dhYmxlKHRydWUpXG4gICAqICAgLm9uKCdkcmFnbW92ZScsIGZ1bmN0aW9uIChldmVudCkge1xuICAgKiAgICAgaWYgKHNvbWVDb25kaXRpb24pIHtcbiAgICogICAgICAgLy8gY2hhbmdlIHRoZSBzbmFwIHNldHRpbmdzXG4gICAqICAgICAgIGV2ZW50LmludGVyYWN0YWJsZS5kcmFnZ2FibGUoeyBzbmFwOiB7IHRhcmdldHM6IFtdIH19KVxuICAgKiAgICAgICAvLyBmaXJlIGFub3RoZXIgbW92ZSBldmVudCB3aXRoIHJlLWNhbGN1bGF0ZWQgc25hcFxuICAgKiAgICAgICBldmVudC5pbnRlcmFjdGlvbi5tb3ZlKClcbiAgICogICAgIH1cbiAgICogICB9KVxuICAgKiBgYGBcbiAgICpcbiAgICogRm9yY2UgYSBtb3ZlIG9mIHRoZSBjdXJyZW50IGFjdGlvbiBhdCB0aGUgc2FtZSBjb29yZGluYXRlcy4gVXNlZnVsIGlmXG4gICAqIHNuYXAvcmVzdHJpY3QgaGFzIGJlZW4gY2hhbmdlZCBhbmQgeW91IHdhbnQgYSBtb3ZlbWVudCB3aXRoIHRoZSBuZXdcbiAgICogc2V0dGluZ3MuXG4gICAqL1xuICBtb3ZlIChzaWduYWxBcmc/KSB7XG4gICAgc2lnbmFsQXJnID0gdXRpbHMuZXh0ZW5kKHtcbiAgICAgIHBvaW50ZXI6IHRoaXMuX2xhdGVzdFBvaW50ZXIucG9pbnRlcixcbiAgICAgIGV2ZW50OiB0aGlzLl9sYXRlc3RQb2ludGVyLmV2ZW50LFxuICAgICAgZXZlbnRUYXJnZXQ6IHRoaXMuX2xhdGVzdFBvaW50ZXIuZXZlbnRUYXJnZXQsXG4gICAgICBpbnRlcmFjdGlvbjogdGhpcyxcbiAgICB9LCBzaWduYWxBcmcgfHwge30pXG5cbiAgICBzaWduYWxBcmcucGhhc2UgPSBFdmVudFBoYXNlLk1vdmVcblxuICAgIHRoaXMuX2RvUGhhc2Uoc2lnbmFsQXJnKVxuICB9XG5cbiAgLy8gRW5kIGludGVyYWN0IG1vdmUgZXZlbnRzIGFuZCBzdG9wIGF1dG8tc2Nyb2xsIHVubGVzcyBzaW11bGF0aW9uIGlzIHJ1bm5pbmdcbiAgcG9pbnRlclVwIChwb2ludGVyOiBJbnRlcmFjdC5Qb2ludGVyVHlwZSwgZXZlbnQ6IEludGVyYWN0LlBvaW50ZXJFdmVudFR5cGUsIGV2ZW50VGFyZ2V0OiBOb2RlLCBjdXJFdmVudFRhcmdldDogRXZlbnRUYXJnZXQpIHtcbiAgICBsZXQgcG9pbnRlckluZGV4ID0gdGhpcy5nZXRQb2ludGVySW5kZXgocG9pbnRlcilcblxuICAgIGlmIChwb2ludGVySW5kZXggPT09IC0xKSB7XG4gICAgICBwb2ludGVySW5kZXggPSB0aGlzLnVwZGF0ZVBvaW50ZXIocG9pbnRlciwgZXZlbnQsIGV2ZW50VGFyZ2V0LCBmYWxzZSlcbiAgICB9XG5cbiAgICB0aGlzLl9zaWduYWxzLmZpcmUoL2NhbmNlbCQvaS50ZXN0KGV2ZW50LnR5cGUpID8gJ2NhbmNlbCcgOiAndXAnLCB7XG4gICAgICBwb2ludGVyLFxuICAgICAgcG9pbnRlckluZGV4LFxuICAgICAgZXZlbnQsXG4gICAgICBldmVudFRhcmdldCxcbiAgICAgIGN1ckV2ZW50VGFyZ2V0LFxuICAgICAgaW50ZXJhY3Rpb246IHRoaXMsXG4gICAgfSlcblxuICAgIGlmICghdGhpcy5zaW11bGF0aW9uKSB7XG4gICAgICB0aGlzLmVuZChldmVudClcbiAgICB9XG5cbiAgICB0aGlzLnBvaW50ZXJJc0Rvd24gPSBmYWxzZVxuICAgIHRoaXMucmVtb3ZlUG9pbnRlcihwb2ludGVyLCBldmVudClcbiAgfVxuXG4gIGRvY3VtZW50Qmx1ciAoZXZlbnQpIHtcbiAgICB0aGlzLmVuZChldmVudClcbiAgICB0aGlzLl9zaWduYWxzLmZpcmUoJ2JsdXInLCB7IGV2ZW50LCBpbnRlcmFjdGlvbjogdGhpcyB9KVxuICB9XG5cbiAgLyoqXG4gICAqIGBgYGpzXG4gICAqIGludGVyYWN0KHRhcmdldClcbiAgICogICAuZHJhZ2dhYmxlKHRydWUpXG4gICAqICAgLm9uKCdtb3ZlJywgZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAqICAgICBpZiAoZXZlbnQucGFnZVggPiAxMDAwKSB7XG4gICAqICAgICAgIC8vIGVuZCB0aGUgY3VycmVudCBhY3Rpb25cbiAgICogICAgICAgZXZlbnQuaW50ZXJhY3Rpb24uZW5kKClcbiAgICogICAgICAgLy8gc3RvcCBhbGwgZnVydGhlciBsaXN0ZW5lcnMgZnJvbSBiZWluZyBjYWxsZWRcbiAgICogICAgICAgZXZlbnQuc3RvcEltbWVkaWF0ZVByb3BhZ2F0aW9uKClcbiAgICogICAgIH1cbiAgICogICB9KVxuICAgKiBgYGBcbiAgICpcbiAgICogQHBhcmFtIHtQb2ludGVyRXZlbnR9IFtldmVudF1cbiAgICovXG4gIGVuZCAoZXZlbnQ/OiBJbnRlcmFjdC5Qb2ludGVyRXZlbnRUeXBlKSB7XG4gICAgdGhpcy5fZW5kaW5nID0gdHJ1ZVxuICAgIGV2ZW50ID0gZXZlbnQgfHwgdGhpcy5fbGF0ZXN0UG9pbnRlci5ldmVudFxuICAgIGxldCBlbmRQaGFzZVJlc3VsdFxuXG4gICAgaWYgKHRoaXMuaW50ZXJhY3RpbmcoKSkge1xuICAgICAgZW5kUGhhc2VSZXN1bHQgPSB0aGlzLl9kb1BoYXNlKHtcbiAgICAgICAgZXZlbnQsXG4gICAgICAgIGludGVyYWN0aW9uOiB0aGlzLFxuICAgICAgICBwaGFzZTogRXZlbnRQaGFzZS5FbmQsXG4gICAgICB9KVxuICAgIH1cblxuICAgIHRoaXMuX2VuZGluZyA9IGZhbHNlXG5cbiAgICBpZiAoZW5kUGhhc2VSZXN1bHQgPT09IHRydWUpIHtcbiAgICAgIHRoaXMuc3RvcCgpXG4gICAgfVxuICB9XG5cbiAgY3VycmVudEFjdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXMuX2ludGVyYWN0aW5nID8gdGhpcy5wcmVwYXJlZC5uYW1lIDogbnVsbFxuICB9XG5cbiAgaW50ZXJhY3RpbmcgKCkge1xuICAgIHJldHVybiB0aGlzLl9pbnRlcmFjdGluZ1xuICB9XG5cbiAgLyoqICovXG4gIHN0b3AgKCkge1xuICAgIHRoaXMuX3NpZ25hbHMuZmlyZSgnc3RvcCcsIHsgaW50ZXJhY3Rpb246IHRoaXMgfSlcblxuICAgIHRoaXMuaW50ZXJhY3RhYmxlID0gdGhpcy5lbGVtZW50ID0gbnVsbFxuXG4gICAgdGhpcy5faW50ZXJhY3RpbmcgPSBmYWxzZVxuICAgIHRoaXMucHJlcGFyZWQubmFtZSA9IHRoaXMucHJldkV2ZW50ID0gbnVsbFxuICB9XG5cbiAgZ2V0UG9pbnRlckluZGV4IChwb2ludGVyKSB7XG4gICAgY29uc3QgcG9pbnRlcklkID0gdXRpbHMucG9pbnRlci5nZXRQb2ludGVySWQocG9pbnRlcilcblxuICAgIC8vIG1vdXNlIGFuZCBwZW4gaW50ZXJhY3Rpb25zIG1heSBoYXZlIG9ubHkgb25lIHBvaW50ZXJcbiAgICByZXR1cm4gKHRoaXMucG9pbnRlclR5cGUgPT09ICdtb3VzZScgfHwgdGhpcy5wb2ludGVyVHlwZSA9PT0gJ3BlbicpXG4gICAgICA/IHRoaXMucG9pbnRlcnMubGVuZ3RoIC0gMVxuICAgICAgOiB1dGlscy5hcnIuZmluZEluZGV4KHRoaXMucG9pbnRlcnMsIChjdXJQb2ludGVyKSA9PiBjdXJQb2ludGVyLmlkID09PSBwb2ludGVySWQpXG4gIH1cblxuICBnZXRQb2ludGVySW5mbyAocG9pbnRlcikge1xuICAgIHJldHVybiB0aGlzLnBvaW50ZXJzW3RoaXMuZ2V0UG9pbnRlckluZGV4KHBvaW50ZXIpXVxuICB9XG5cbiAgdXBkYXRlUG9pbnRlciAocG9pbnRlcjogSW50ZXJhY3QuUG9pbnRlclR5cGUsIGV2ZW50OiBJbnRlcmFjdC5Qb2ludGVyRXZlbnRUeXBlLCBldmVudFRhcmdldDogTm9kZSwgZG93bj86IGJvb2xlYW4pIHtcbiAgICBjb25zdCBpZCA9IHV0aWxzLnBvaW50ZXIuZ2V0UG9pbnRlcklkKHBvaW50ZXIpXG4gICAgbGV0IHBvaW50ZXJJbmRleCA9IHRoaXMuZ2V0UG9pbnRlckluZGV4KHBvaW50ZXIpXG4gICAgbGV0IHBvaW50ZXJJbmZvID0gdGhpcy5wb2ludGVyc1twb2ludGVySW5kZXhdXG5cbiAgICBkb3duID0gZG93biA9PT0gZmFsc2VcbiAgICAgID8gZmFsc2VcbiAgICAgIDogZG93biB8fCAvKGRvd258c3RhcnQpJC9pLnRlc3QoZXZlbnQudHlwZSlcblxuICAgIGlmICghcG9pbnRlckluZm8pIHtcbiAgICAgIHBvaW50ZXJJbmZvID0gbmV3IFBvaW50ZXJJbmZvKFxuICAgICAgICBpZCxcbiAgICAgICAgcG9pbnRlcixcbiAgICAgICAgZXZlbnQsXG4gICAgICAgIG51bGwsXG4gICAgICAgIG51bGwsXG4gICAgICApXG5cbiAgICAgIHBvaW50ZXJJbmRleCA9IHRoaXMucG9pbnRlcnMubGVuZ3RoXG4gICAgICB0aGlzLnBvaW50ZXJzLnB1c2gocG9pbnRlckluZm8pXG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgcG9pbnRlckluZm8ucG9pbnRlciA9IHBvaW50ZXJcbiAgICB9XG5cbiAgICBpZiAoZG93bikge1xuICAgICAgdGhpcy5wb2ludGVySXNEb3duID0gdHJ1ZVxuXG4gICAgICBpZiAoIXRoaXMuaW50ZXJhY3RpbmcoKSkge1xuICAgICAgICB1dGlscy5wb2ludGVyLnNldENvb3Jkcyh0aGlzLmNvb3Jkcy5zdGFydCwgdGhpcy5wb2ludGVycy5tYXAoKHApID0+IHAucG9pbnRlciksIHRoaXMuX25vdygpKVxuXG4gICAgICAgIHV0aWxzLnBvaW50ZXIuY29weUNvb3Jkcyh0aGlzLmNvb3Jkcy5jdXIsIHRoaXMuY29vcmRzLnN0YXJ0KVxuICAgICAgICB1dGlscy5wb2ludGVyLmNvcHlDb29yZHModGhpcy5jb29yZHMucHJldiwgdGhpcy5jb29yZHMuc3RhcnQpXG4gICAgICAgIHV0aWxzLnBvaW50ZXIucG9pbnRlckV4dGVuZCh0aGlzLmRvd25Qb2ludGVyLCBwb2ludGVyKVxuXG4gICAgICAgIHRoaXMuZG93bkV2ZW50ID0gZXZlbnRcbiAgICAgICAgcG9pbnRlckluZm8uZG93blRpbWUgPSB0aGlzLmNvb3Jkcy5jdXIudGltZVN0YW1wXG4gICAgICAgIHBvaW50ZXJJbmZvLmRvd25UYXJnZXQgPSBldmVudFRhcmdldFxuXG4gICAgICAgIHRoaXMucG9pbnRlcldhc01vdmVkID0gZmFsc2VcbiAgICAgIH1cbiAgICB9XG5cbiAgICB0aGlzLl91cGRhdGVMYXRlc3RQb2ludGVyKHBvaW50ZXIsIGV2ZW50LCBldmVudFRhcmdldClcblxuICAgIHRoaXMuX3NpZ25hbHMuZmlyZSgndXBkYXRlLXBvaW50ZXInLCB7XG4gICAgICBwb2ludGVyLFxuICAgICAgZXZlbnQsXG4gICAgICBldmVudFRhcmdldCxcbiAgICAgIGRvd24sXG4gICAgICBwb2ludGVySW5mbyxcbiAgICAgIHBvaW50ZXJJbmRleCxcbiAgICAgIGludGVyYWN0aW9uOiB0aGlzLFxuICAgIH0pXG5cbiAgICByZXR1cm4gcG9pbnRlckluZGV4XG4gIH1cblxuICByZW1vdmVQb2ludGVyIChwb2ludGVyOiBJbnRlcmFjdC5Qb2ludGVyVHlwZSwgZXZlbnQ6IEludGVyYWN0LlBvaW50ZXJFdmVudFR5cGUpIHtcbiAgICBjb25zdCBwb2ludGVySW5kZXggPSB0aGlzLmdldFBvaW50ZXJJbmRleChwb2ludGVyKVxuXG4gICAgaWYgKHBvaW50ZXJJbmRleCA9PT0gLTEpIHsgcmV0dXJuIH1cblxuICAgIGNvbnN0IHBvaW50ZXJJbmZvID0gdGhpcy5wb2ludGVyc1twb2ludGVySW5kZXhdXG5cbiAgICB0aGlzLl9zaWduYWxzLmZpcmUoJ3JlbW92ZS1wb2ludGVyJywge1xuICAgICAgcG9pbnRlcixcbiAgICAgIGV2ZW50LFxuICAgICAgcG9pbnRlckluZGV4LFxuICAgICAgcG9pbnRlckluZm8sXG4gICAgICBpbnRlcmFjdGlvbjogdGhpcyxcbiAgICB9KVxuXG4gICAgdGhpcy5wb2ludGVycy5zcGxpY2UocG9pbnRlckluZGV4LCAxKVxuICB9XG5cbiAgX3VwZGF0ZUxhdGVzdFBvaW50ZXIgKHBvaW50ZXIsIGV2ZW50LCBldmVudFRhcmdldCkge1xuICAgIHRoaXMuX2xhdGVzdFBvaW50ZXIucG9pbnRlciA9IHBvaW50ZXJcbiAgICB0aGlzLl9sYXRlc3RQb2ludGVyLmV2ZW50ID0gZXZlbnRcbiAgICB0aGlzLl9sYXRlc3RQb2ludGVyLmV2ZW50VGFyZ2V0ID0gZXZlbnRUYXJnZXRcbiAgfVxuXG4gIGRlc3Ryb3kgKCkge1xuICAgIHRoaXMuX2xhdGVzdFBvaW50ZXIucG9pbnRlciA9IG51bGxcbiAgICB0aGlzLl9sYXRlc3RQb2ludGVyLmV2ZW50ID0gbnVsbFxuICAgIHRoaXMuX2xhdGVzdFBvaW50ZXIuZXZlbnRUYXJnZXQgPSBudWxsXG4gIH1cblxuICBfY3JlYXRlUHJlcGFyZWRFdmVudCAoZXZlbnQ6IEludGVyYWN0LlBvaW50ZXJFdmVudFR5cGUsIHBoYXNlOiBFdmVudFBoYXNlLCBwcmVFbmQ6IGJvb2xlYW4sIHR5cGU6IHN0cmluZykge1xuICAgIGNvbnN0IGFjdGlvbk5hbWUgPSB0aGlzLnByZXBhcmVkLm5hbWVcblxuICAgIHJldHVybiBuZXcgSW50ZXJhY3RFdmVudCh0aGlzLCBldmVudCwgYWN0aW9uTmFtZSwgcGhhc2UsIHRoaXMuZWxlbWVudCwgbnVsbCwgcHJlRW5kLCB0eXBlKVxuICB9XG5cbiAgX2ZpcmVFdmVudCAoaUV2ZW50KSB7XG4gICAgdGhpcy5pbnRlcmFjdGFibGUuZmlyZShpRXZlbnQpXG5cbiAgICBpZiAoIXRoaXMucHJldkV2ZW50IHx8IGlFdmVudC50aW1lU3RhbXAgPj0gdGhpcy5wcmV2RXZlbnQudGltZVN0YW1wKSB7XG4gICAgICB0aGlzLnByZXZFdmVudCA9IGlFdmVudFxuICAgIH1cbiAgfVxuXG4gIF9kb1BoYXNlIChzaWduYWxBcmc6IFBhcnRpYWw8SW50ZXJhY3QuU2lnbmFsQXJnPikge1xuICAgIGNvbnN0IHsgZXZlbnQsIHBoYXNlLCBwcmVFbmQsIHR5cGUgfSA9IHNpZ25hbEFyZ1xuICAgIGNvbnN0IGJlZm9yZVJlc3VsdCA9IHRoaXMuX3NpZ25hbHMuZmlyZShgYmVmb3JlLWFjdGlvbi0ke3BoYXNlfWAsIHNpZ25hbEFyZylcblxuICAgIGlmIChiZWZvcmVSZXN1bHQgPT09IGZhbHNlKSB7XG4gICAgICByZXR1cm4gZmFsc2VcbiAgICB9XG5cbiAgICBjb25zdCBpRXZlbnQgPSBzaWduYWxBcmcuaUV2ZW50ID0gdGhpcy5fY3JlYXRlUHJlcGFyZWRFdmVudChldmVudCwgcGhhc2UsIHByZUVuZCwgdHlwZSlcbiAgICBjb25zdCB7IHJlY3QgfSA9IHRoaXNcblxuICAgIGlmIChyZWN0KSB7XG4gICAgICAvLyB1cGRhdGUgdGhlIHJlY3QgbW9kaWZpY2F0aW9uc1xuICAgICAgY29uc3QgZWRnZXMgPSB0aGlzLmVkZ2VzIHx8IHRoaXMucHJlcGFyZWQuZWRnZXMgfHwgeyBsZWZ0OiB0cnVlLCByaWdodDogdHJ1ZSwgdG9wOiB0cnVlLCBib3R0b206IHRydWUgfVxuXG4gICAgICBpZiAoZWRnZXMudG9wKSAgICB7IHJlY3QudG9wICAgICs9IGlFdmVudC5kZWx0YS55IH1cbiAgICAgIGlmIChlZGdlcy5ib3R0b20pIHsgcmVjdC5ib3R0b20gKz0gaUV2ZW50LmRlbHRhLnkgfVxuICAgICAgaWYgKGVkZ2VzLmxlZnQpICAgeyByZWN0LmxlZnQgICArPSBpRXZlbnQuZGVsdGEueCB9XG4gICAgICBpZiAoZWRnZXMucmlnaHQpICB7IHJlY3QucmlnaHQgICs9IGlFdmVudC5kZWx0YS54IH1cblxuICAgICAgcmVjdC53aWR0aCA9IHJlY3QucmlnaHQgLSByZWN0LmxlZnRcbiAgICAgIHJlY3QuaGVpZ2h0ID0gcmVjdC5ib3R0b20gLSByZWN0LnRvcFxuICAgIH1cblxuICAgIHRoaXMuX3NpZ25hbHMuZmlyZShgYWN0aW9uLSR7cGhhc2V9YCwgc2lnbmFsQXJnKVxuXG4gICAgdGhpcy5fZmlyZUV2ZW50KGlFdmVudClcblxuICAgIHRoaXMuX3NpZ25hbHMuZmlyZShgYWZ0ZXItYWN0aW9uLSR7cGhhc2V9YCwgc2lnbmFsQXJnKVxuXG4gICAgcmV0dXJuIHRydWVcbiAgfVxuXG4gIF9ub3cgKCkgeyByZXR1cm4gRGF0ZS5ub3coKSB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IEludGVyYWN0aW9uXG5leHBvcnQgeyBQb2ludGVySW5mbyB9XG4iXX0=