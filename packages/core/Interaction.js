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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiSW50ZXJhY3Rpb24uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJJbnRlcmFjdGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEtBQUssS0FBSyxNQUFNLG1CQUFtQixDQUFBO0FBRTFDLE9BQU8sYUFBYSxFQUFFLEVBQUUsVUFBVSxFQUFFLE1BQU0saUJBQWlCLENBQUE7QUFDM0QsT0FBTyxXQUFXLE1BQU0sZUFBZSxDQUFBO0FBQ3ZDLE9BQU8sRUFBRSxVQUFVLEVBQUUsTUFBTSxTQUFTLENBQUE7QUFjcEMsTUFBTSxDQUFOLElBQVksWUFPWDtBQVBELFdBQVksWUFBWTtJQUN0QixpQ0FBaUIsQ0FBQTtJQUNqQiw0QkFBWSxDQUFBO0lBQ1osNkJBQWEsQ0FBQTtJQUNiLGtDQUFrQixDQUFBO0lBQ2xCLG9DQUFvQixDQUFBO0lBQ3BCLDJCQUFXLENBQUE7QUFDYixDQUFDLEVBUFcsWUFBWSxLQUFaLFlBQVksUUFPdkI7QUFFRCxNQUFNLENBQU4sSUFBWSxhQU1YO0FBTkQsV0FBWSxhQUFhO0lBQ3ZCLDJCQUFVLENBQUE7SUFDViwwQkFBUyxDQUFBO0lBQ1QseUJBQVEsQ0FBQTtJQUNSLDBCQUFTLENBQUE7SUFDVCxpQ0FBZ0IsQ0FBQTtBQUNsQixDQUFDLEVBTlcsYUFBYSxLQUFiLGFBQWEsUUFNeEI7QUFPRCxNQUFNLE9BQU8sV0FBVztJQTZFdEIsTUFBTTtJQUNOLFlBQWEsRUFBRSxXQUFXLEVBQUUsT0FBTyxFQUFvRDtRQTdFdkYsNkNBQTZDO1FBQzdDLGlCQUFZLEdBQWlCLElBQUksQ0FBQTtRQUVqQyx5Q0FBeUM7UUFDekMsWUFBTyxHQUFZLElBQUksQ0FBQTtRQVF2QixxREFBcUQ7UUFDckQsYUFBUSxHQUFtQjtZQUN6QixJQUFJLEVBQUcsSUFBSTtZQUNYLElBQUksRUFBRyxJQUFJO1lBQ1gsS0FBSyxFQUFFLElBQUk7U0FDWixDQUFBO1FBSUQsK0JBQStCO1FBQy9CLGFBQVEsR0FBa0IsRUFBRSxDQUFBO1FBRTVC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QUFNLENBQUMsR0FBRyxFQUFFLElBQUksQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLEVBQUUsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDLENBQUE7U0FDM0Y7UUFFRCxNQUFNLGFBQWEsR0FBRyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDLEtBQUssSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDbEQsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUMsS0FBSyxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUNsRCxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQyxLQUFLLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQ3RELElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDLEtBQUssSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFBO1FBRTlFLElBQUksRUFBRSxDQUFBO1FBQ04sSUFBSSxFQUFFLENBQUE7UUFFTixzREFBc0Q7UUFDdEQsSUFBSSxJQUFJLENBQUMsYUFBYSxJQUFJLENBQUMsSUFBSSxDQUFDLGVBQWUsRUFBRTtZQUMvQyxFQUFFLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFBO1lBQzFELEVBQUUsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxD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QUFHLElBQUksQ0FBQyxHQUFHLENBQUE7U0FDckM7UUFFRCxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxVQUFVLEtBQUssRUFBRSxFQUFFLFNBQVMsQ0FBQyxDQUFBO1FBRWhELElBQUksQ0FBQyxVQUFVLENBQUMsTUFBTSxDQUFDLENBQUE7UUFFdkIsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLEtBQUssRUFBRSxFQUFFLFNBQVMsQ0FBQyxDQUFBO1FBRXRELE9BQU8sSUFBSSxDQUFBO0lBQ2IsQ0FBQztJQUVELElBQUksS0FBTSxPQUFPLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQSxDQUFDLENBQUM7Q0FDOUI7QUFFRCxlQUFlLFdBQVcsQ0FBQTtBQUMxQixPQUFPLEVBQUUsV0FBVyxFQUFFLENBQUEiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyB1dGlscyBmcm9tICdAaW50ZXJhY3Rqcy91dGlscydcbmltcG9ydCBJbnRlcmFjdGFibGUgZnJvbSAnLi9JbnRlcmFjdGFibGUnXG5pbXBvcnQgSW50ZXJhY3RFdmVudCwgeyBFdmVudFBoYXNlIH0gZnJvbSAnLi9JbnRlcmFjdEV2ZW50J1xuaW1wb3J0IFBvaW50ZXJJbmZvIGZyb20gJy4vUG9pbnRlckluZm8nXG5pbXBvcnQgeyBBY3Rpb25OYW1lIH0gZnJvbSAnLi9zY29wZSdcblxuZXhwb3J0IGludGVyZmFjZSBBY3Rpb25Qcm9wczxUIGV4dGVuZHMgQWN0aW9uTmFtZSA9IGFueT4ge1xuICBuYW1lOiBUXG4gIGF4aXM/OiAneCcgfCAneScgfCAneHknXG4gIGVkZ2VzPzoge1xuICAgIFtlZGdlIGluIGtleW9mIEludGVyYWN0LlJlY3RdPzogYm9vbGVhblxuICB9XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgU3RhcnRBY3Rpb24gZXh0ZW5kcyBBY3Rpb25Qcm9wcyB7XG4gIG5hbWU6IEFjdGlvbk5hbWUgfCBzdHJpbmdcbn1cblxuZXhwb3J0IGVudW0gX1Byb3h5VmFsdWVzIHtcbiAgaW50ZXJhY3RhYmxlID0gJycsXG4gIGVsZW1lbnQgPSAnJyxcbiAgcHJlcGFyZWQgPSAnJyxcbiAgcG9pbnRlcklzRG93biA9ICcnLFxuICBwb2ludGVyV2FzTW92ZWQgPSAnJyxcbiAgX3Byb3h5ID0gJydcbn1cblxuZXhwb3J0IGVudW0gX1Byb3h5TWV0aG9kcyB7XG4gIHN0YXJ0ID0gJycsXG4gIG1vdmUgPSAnJyxcbiAgZW5kID0gJycsXG4gIHN0b3AgPSAnJyxcbiAgaW50ZXJhY3RpbmcgPSAnJ1xufVxuXG5leHBvcnQgdHlwZSBfSW50ZXJhY3Rpb25Qcm94eSA9IFBpY2s8XG4gIEludGVyYWN0aW9uLFxuICBrZXlvZiB0eXBlb2YgX1Byb3h5VmFsdWVzIHwga2V5b2YgdHlwZW9mIF9Qcm94eU1ldGhvZHNcbj5cblxuZXhwb3J0IGNsYXNzIEludGVyYWN0aW9uPFQgZXh0ZW5kcyBBY3Rpb25OYW1lID0gYW55PiB7XG4gIC8vIGN1cnJlbnQgaW50ZXJhY3RhYmxlIGJlaW5nIGludGVyYWN0ZWQgd2l0aFxuICBpbnRlcmFjdGFibGU6IEludGVyYWN0YWJsZSA9IG51bGxcblxuICAvLyB0aGUgdGFyZ2V0IGVsZW1lbnQgb2YgdGhlIGludGVyYWN0YWJsZVxuICBlbGVtZW50OiBFbGVtZW50ID0gbnVsbFxuICByZWN0OiBJbnRlcmFjdC5SZWN0ICYgSW50ZXJhY3QuU2l6ZVxuICBlZGdlczoge1xuICAgIFtQIGluIGtleW9mIEludGVyYWN0LlJlY3RdPzogYm9vbGVhblxuICB9XG5cbiAgX3NpZ25hbHM6IHV0aWxzLlNpZ25hbHNcblxuICAvLyBhY3Rpb24gdGhhdCdzIHJlYWR5IHRvIGJlIGZpcmVkIG9uIG5leHQgbW92ZSBldmVudFxuICBwcmVwYXJlZDogQWN0aW9uUHJvcHM8VD4gPSB7XG4gICAgbmFtZSA6IG51bGwsXG4gICAgYXhpcyA6IG51bGwsXG4gICAgZWRnZXM6IG51bGwsXG4gIH1cblxuICBwb2ludGVyVHlwZTogc3RyaW5nXG5cbiAgLy8ga2VlcCB0cmFjayBvZiBhZGRlZCBwb2ludGVyc1xuICBwb2ludGVyczogUG9pbnRlckluZm9bXSA9IFtdXG5cbiAgLy8gcG9pbnRlcmRvd24vbW91c2Vkb3duL3RvdWNoc3RhcnQgZXZlbnRcbiAgZG93bkV2ZW50OiBJbnRlcmFjdC5Qb2ludGVyRXZlbnRUeXBlID0gbnVsbFxuXG4gIGRvd25Qb2ludGVyOiBJbnRlcmFjdC5Qb2ludGVyVHlwZSA9IHt9IGFzIEludGVyYWN0LlBvaW50ZXJUeXBlXG5cbiAgX2xhdGVzdFBvaW50ZXI6IHtcbiAgICBwb2ludGVyOiBJbnRlcmFjdC5FdmVudFRhcmdldFxuICAgIGV2ZW50OiBJbnRlcmFjdC5Qb2ludGVyRXZlbnRUeXBlXG4gICAgZXZlbnRUYXJnZXQ6IE5vZGUsXG4gIH0gPSB7XG4gICAgcG9pbnRlcjogbnVsbCxcbiAgICBldmVudDogbnVsbCxcbiAgICBldmVudFRhcmdldDogbnVsbCxcbiAgfVxuXG4gIC8vIHByZXZpb3VzIGFjdGlvbiBldmVudFxuICBwcmV2RXZlbnQ6IEludGVyYWN0RXZlbnQ8VD4gPSBudWxsXG5cbiAgcG9pbnRlcklzRG93biA9IGZhbHNlXG4gIHBvaW50ZXJXYXNNb3ZlZCA9IGZhbHNlXG4gIF9pbnRlcmFjdGluZyA9IGZhbHNlXG4gIF9lbmRpbmcgPSBmYWxzZVxuICBfcHJveHk6IF9JbnRlcmFjdGlvblByb3h5ID0gbnVsbFxuXG4gIHNpbXVsYXRpb24gPSBudWxsXG5cbiAgZ2V0IHBvaW50ZXJNb3ZlVG9sZXJhbmNlICgpIHtcbiAgICByZXR1cm4gMVxuICB9XG5cbiAgLyoqXG4gICAqIEBhbGlhcyBJbnRlcmFjdGlvbi5wcm90b3R5cGUubW92ZVxuICAgKi9cbiAgZG9Nb3ZlID0gdXRpbHMud2Fybk9uY2UoXG4gICAgZnVuY3Rpb24gKHRoaXM6IEludGVyYWN0aW9uLCBzaWduYWxBcmc6IGFueSkge1xuICAgICAgdGhpcy5tb3ZlKHNpZ25hbEFyZylcbiAgICB9LFxuICAgICdUaGUgaW50ZXJhY3Rpb24uZG9Nb3ZlKCkgbWV0aG9kIGhhcyBiZWVuIHJlbmFtZWQgdG8gaW50ZXJhY3Rpb24ubW92ZSgpJylcblxuICBjb29yZHMgPSB7XG4gICAgLy8gU3RhcnRpbmcgSW50ZXJhY3RFdmVudCBwb2ludGVyIGNvb3JkaW5hdGVzXG4gICAgc3RhcnQ6IHV0aWxzLnBvaW50ZXIubmV3Q29vcmRzKCksXG4gICAgLy8gUHJldmlvdXMgbmF0aXZlIHBvaW50ZXIgbW92ZSBldmVudCBjb29yZGluYXRlc1xuICAgIHByZXY6IHV0aWxzLnBvaW50ZXIubmV3Q29vcmRzKCksXG4gICAgLy8gY3VycmVudCBuYXRpdmUgcG9pbnRlciBtb3ZlIGV2ZW50IGNvb3JkaW5hdGVzXG4gICAgY3VyOiB1dGlscy5wb2ludGVyLm5ld0Nvb3JkcygpLFxuICAgIC8vIENoYW5nZSBpbiBjb29yZGluYXRlcyBhbmQgdGltZSBvZiB0aGUgcG9pbnRlclxuICAgIGRlbHRhOiB1dGlscy5wb2ludGVyLm5ld0Nvb3JkcygpLFxuICAgIC8vIHBvaW50ZXIgdmVsb2NpdHlcbiAgICB2ZWxvY2l0eTogdXRpbHMucG9pbnRlci5uZXdDb29yZHMoKSxcbiAgfVxuXG4gIC8qKiAqL1xuICBjb25zdHJ1Y3RvciAoeyBwb2ludGVyVHlwZSwgc2lnbmFscyB9OiB7IHBvaW50ZXJUeXBlPzogc3RyaW5nLCBzaWduYWxzOiB1dGlscy5TaWduYWxzIH0pIHtcbiAgICB0aGlzLl9zaWduYWxzID0gc2lnbmFsc1xuICAgIHRoaXMucG9pbnRlclR5cGUgPSBwb2ludGVyVHlwZVxuXG4gICAgY29uc3QgdGhhdCA9IHRoaXNcblxuICAgIHRoaXMuX3Byb3h5ID0ge30gYXMgX0ludGVyYWN0aW9uUHJveHlcblxuICAgIGZvciAoY29uc3Qga2V5IGluIF9Qcm94eVZhbHVlcykge1xuICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRoaXMuX3Byb3h5LCBrZXksIHtcbiAgICAgICAgZ2V0ICgpIHsgcmV0dXJuIHRoYXRba2V5XSB9LFxuICAgICAgfSlcbiAgICB9XG5cbiAgICBmb3IgKGNvbnN0IGtleSBpbiBfUHJveHlNZXRob2RzKSB7XG4gICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkodGhpcy5fcHJveHksIGtleSwge1xuICAgICAgICB2YWx1ZTogKC4uLmFyZ3MpID0+IHRoYXRba2V5XSguLi5hcmdzKSxcbiAgICAgIH0pXG4gICAgfVxuXG4gICAgdGhpcy5fc2lnbmFscy5maXJlKCduZXcnLCB7IGludGVyYWN0aW9uOiB0aGlzIH0pXG4gIH1cblxuICBwb2ludGVyRG93biAocG9pbnRlcjogSW50ZXJhY3QuUG9pbnRlclR5cGUsIGV2ZW50OiBJbnRlcmFjdC5Qb2ludGVyRXZlbnRUeXBlLCBldmVudFRhcmdldDogRXZlbnRUYXJnZXQpIHtcbiAgICBjb25zdCBwb2ludGVySW5kZXggPSB0aGlzLnVwZGF0ZVBvaW50ZXIocG9pbnRlciwgZXZlbnQsIGV2ZW50VGFyZ2V0LCB0cnVlKVxuXG4gICAgdGhpcy5fc2lnbmFscy5maXJlKCdkb3duJywge1xuICAgICAgcG9pbnRlcixcbiAgICAgIGV2ZW50LFxuICAgICAgZXZlbnRUYXJnZXQsXG4gICAgICBwb2ludGVySW5kZXgsXG4gICAgICBpbnRlcmFjdGlvbjogdGhpcyxcbiAgICB9KVxuICB9XG5cbiAgLyoqXG4gICAqIGBgYGpzXG4gICAqIGludGVyYWN0KHRhcmdldClcbiAgICogICAuZHJhZ2dhYmxlKHtcbiAgICogICAgIC8vIGRpc2FibGUgdGhlIGRlZmF1bHQgZHJhZyBzdGFydCBieSBkb3duLT5tb3ZlXG4gICAqICAgICBtYW51YWxTdGFydDogdHJ1ZVxuICAgKiAgIH0pXG4gICAqICAgLy8gc3RhcnQgZHJhZ2dpbmcgYWZ0ZXIgdGhlIHVzZXIgaG9sZHMgdGhlIHBvaW50ZXIgZG93blxuICAgKiAgIC5vbignaG9sZCcsIGZ1bmN0aW9uIChldmVudCkge1xuICAgKiAgICAgdmFyIGludGVyYWN0aW9uID0gZXZlbnQuaW50ZXJhY3Rpb25cbiAgICpcbiAgICogICAgIGlmICghaW50ZXJhY3Rpb24uaW50ZXJhY3RpbmcoKSkge1xuICAgKiAgICAgICBpbnRlcmFjdGlvbi5zdGFydCh7IG5hbWU6ICdkcmFnJyB9LFxuICAgKiAgICAgICAgICAgICAgICAgICAgICAgICBldmVudC5pbnRlcmFjdGFibGUsXG4gICAqICAgICAgICAgICAgICAgICAgICAgICAgIGV2ZW50LmN1cnJlbnRUYXJnZXQpXG4gICAqICAgICB9XG4gICAqIH0pXG4gICAqIGBgYFxuICAgKlxuICAgKiBTdGFydCBhbiBhY3Rpb24gd2l0aCB0aGUgZ2l2ZW4gSW50ZXJhY3RhYmxlIGFuZCBFbGVtZW50IGFzIHRhcnRnZXRzLiBUaGVcbiAgICogYWN0aW9uIG11c3QgYmUgZW5hYmxlZCBmb3IgdGhlIHRhcmdldCBJbnRlcmFjdGFibGUgYW5kIGFuIGFwcHJvcHJpYXRlXG4gICAqIG51bWJlciBvZiBwb2ludGVycyBtdXN0IGJlIGhlbGQgZG93biAtIDEgZm9yIGRyYWcvcmVzaXplLCAyIGZvciBnZXN0dXJlLlxuICAgKlxuICAgKiBVc2UgaXQgd2l0aCBgaW50ZXJhY3RhYmxlLjxhY3Rpb24+YWJsZSh7IG1hbnVhbFN0YXJ0OiBmYWxzZSB9KWAgdG8gYWx3YXlzXG4gICAqIFtzdGFydCBhY3Rpb25zIG1hbnVhbGx5XShodHRwczovL2dpdGh1Yi5jb20vdGF5ZS9pbnRlcmFjdC5qcy9pc3N1ZXMvMTE0KVxuICAgKlxuICAgKiBAcGFyYW0ge29iamVjdH0gYWN0aW9uICAgVGhlIGFjdGlvbiB0byBiZSBwZXJmb3JtZWQgLSBkcmFnLCByZXNpemUsIGV0Yy5cbiAgICogQHBhcmFtIHtJbnRlcmFjdGFibGV9IHRhcmdldCAgVGhlIEludGVyYWN0YWJsZSB0byB0YXJnZXRcbiAgICogQHBhcmFtIHtFbGVtZW50fSBlbGVtZW50IFRoZSBET00gRWxlbWVudCB0byB0YXJnZXRcbiAgICogQHJldHVybiB7b2JqZWN0fSBpbnRlcmFjdFxuICAgKi9cbiAgc3RhcnQgKGFjdGlvbjogU3RhcnRBY3Rpb24sIGludGVyYWN0YWJsZTogSW50ZXJhY3RhYmxlLCBlbGVtZW50OiBFbGVtZW50KSB7XG4gICAgaWYgKHRoaXMuaW50ZXJhY3RpbmcoKSB8fFxuICAgICAgICAhdGhpcy5wb2ludGVySXNEb3duIHx8XG4gICAgICAgIHRoaXMucG9pbnRlcnMubGVuZ3RoIDwgKGFjdGlvbi5uYW1lID09PSBBY3Rpb25OYW1lLkdlc3R1cmUgPyAyIDogMSkgfHxcbiAgICAgICAgIWludGVyYWN0YWJsZS5vcHRpb25zW2FjdGlvbi5uYW1lXS5lbmFibGVkKSB7XG4gICAgICByZXR1cm4gZmFsc2VcbiAgICB9XG5cbiAgICB1dGlscy5jb3B5QWN0aW9uKHRoaXMucHJlcGFyZWQsIGFjdGlvbilcblxuICAgIHRoaXMuaW50ZXJhY3RhYmxlID0gaW50ZXJhY3RhYmxlXG4gICAgdGhpcy5lbGVtZW50ICAgICAgPSBlbGVtZW50XG4gICAgdGhpcy5yZWN0ICAgICAgICAgPSBpbnRlcmFjdGFibGUuZ2V0UmVjdChlbGVtZW50KVxuICAgIHRoaXMuZWRnZXMgICAgICAgID0gdGhpcy5wcmVwYXJlZC5lZGdlc1xuICAgIHRoaXMuX2ludGVyYWN0aW5nID0gdGhpcy5fZG9QaGFzZSh7XG4gICAgICBpbnRlcmFjdGlvbjogdGhpcyxcbiAgICAgIGV2ZW50OiB0aGlzLmRvd25FdmVudCxcbiAgICAgIHBoYXNlOiBFdmVudFBoYXNlLlN0YXJ0LFxuICAgIH0pXG5cbiAgICByZXR1cm4gdGhpcy5faW50ZXJhY3RpbmdcbiAgfVxuXG4gIHBvaW50ZXJNb3ZlIChwb2ludGVyOiBJbnRlcmFjdC5Qb2ludGVyVHlwZSwgZXZlbnQ6IEludGVyYWN0LlBvaW50ZXJFdmVudFR5cGUsIGV2ZW50VGFyZ2V0OiBFdmVudFRhcmdldCkge1xuICAgIGlmICghdGhpcy5zaW11bGF0aW9uKSB7XG4gICAgICB0aGlzLnVwZGF0ZVBvaW50ZXIocG9pbnRlciwgZXZlbnQsIGV2ZW50VGFyZ2V0LCBmYWxzZSlcbiAgICAgIHV0aWxzLnBvaW50ZXIuc2V0Q29vcmRzKHRoaXMuY29vcmRzLmN1ciwgdGhpcy5wb2ludGVycy5tYXAoKHApID0+IHAucG9pbnRlciksIHRoaXMuX25vdygpKVxuICAgIH1cblxuICAgIGNvbnN0IGR1cGxpY2F0ZU1vdmUgPSAodGhpcy5jb29yZHMuY3VyLnBhZ2UueCA9PT0gdGhpcy5jb29yZHMucHJldi5wYWdlLnggJiZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuY29vcmRzLmN1ci5wYWdlLnkgPT09IHRoaXMuY29vcmRzLnByZXYucGFnZS55ICYmXG4gICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmNvb3Jkcy5jdXIuY2xpZW50LnggPT09IHRoaXMuY29vcmRzLnByZXYuY2xpZW50LnggJiZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuY29vcmRzLmN1ci5jbGllbnQueSA9PT0gdGhpcy5jb29yZHMucHJldi5jbGllbnQueSlcblxuICAgIGxldCBkeFxuICAgIGxldCBkeVxuXG4gICAgLy8gcmVnaXN0ZXIgbW92ZW1lbnQgZ3JlYXRlciB0aGFuIHBvaW50ZXJNb3ZlVG9sZXJhbmNlXG4gICAgaWYgKHRoaXMucG9pbnRlcklzRG93biAmJiAhdGhpcy5wb2ludGVyV2FzTW92ZWQpIHtcbiAgICAgIGR4ID0gdGhpcy5jb29yZHMuY3VyLmNsaWVudC54IC0gdGhpcy5jb29yZHMuc3RhcnQuY2xpZW50LnhcbiAgICAgIGR5ID0gdGhpcy5jb29yZHMuY3VyLmNsaWVudC55IC0gdGhpcy5jb29yZHMuc3RhcnQuY2xpZW50LnlcblxuICAgICAgdGhpcy5wb2ludGVyV2FzTW92ZWQgPSB1dGlscy5oeXBvdChkeCwgZHkpID4gdGhpcy5wb2ludGVyTW92ZVRvbGVyYW5jZVxuICAgIH1cblxuICAgIGNvbnN0IHNpZ25hbEFyZyA9IHtcbiAgICAgIHBvaW50ZXIsXG4gICAgICBwb2ludGVySW5kZXg6IHRoaXMuZ2V0UG9pbnRlckluZGV4KHBvaW50ZXIpLFxuICAgICAgZXZlbnQsXG4gICAgICBldmVudFRhcmdldCxcbiAgICAgIGR4LFxuICAgICAgZHksXG4gICAgICBkdXBsaWNhdGU6IGR1cGxpY2F0ZU1vdmUsXG4gICAgICBpbnRlcmFjdGlvbjogdGhpcyxcbiAgICB9XG5cbiAgICBpZiAoIWR1cGxpY2F0ZU1vdmUpIHtcbiAgICAgIC8vIHNldCBwb2ludGVyIGNvb3JkaW5hdGUsIHRpbWUgY2hhbmdlcyBhbmQgdmVsb2NpdHlcbiAgICAgIHV0aWxzLnBvaW50ZXIuc2V0Q29vcmREZWx0YXModGhpcy5jb29yZHMuZGVsdGEsIHRoaXMuY29vcmRzLnByZXYsIHRoaXMuY29vcmRzLmN1cilcbiAgICAgIHV0aWxzLnBvaW50ZXIuc2V0Q29vcmRWZWxvY2l0eSh0aGlzLmNvb3Jkcy52ZWxvY2l0eSwgdGhpcy5jb29yZHMuZGVsdGEpXG4gICAgfVxuXG4gICAgdGhpcy5fc2lnbmFscy5maXJlKCdtb3ZlJywgc2lnbmFsQXJnKVxuXG4gICAgaWYgKCFkdXBsaWNhdGVNb3ZlKSB7XG4gICAgICAvLyBpZiBpbnRlcmFjdGluZywgZmlyZSBhbiAnYWN0aW9uLW1vdmUnIHNpZ25hbCBldGNcbiAgICAgIGlmICh0aGlzLmludGVyYWN0aW5nKCkpIHtcbiAgICAgICAgdGhpcy5tb3ZlKHNpZ25hbEFyZylcbiAgICAgIH1cblxuICAgICAgaWYgKHRoaXMucG9pbnRlcldhc01vdmVkKSB7XG4gICAgICAgIHV0aWxzLnBvaW50ZXIuY29weUNvb3Jkcyh0aGlzLmNvb3Jkcy5wcmV2LCB0aGlzLmNvb3Jkcy5jdXIpXG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIGBgYGpzXG4gICAqIGludGVyYWN0KHRhcmdldClcbiAgICogICAuZHJhZ2dhYmxlKHRydWUpXG4gICAqICAgLm9uKCdkcmFnbW92ZScsIGZ1bmN0aW9uIChldmVudCkge1xuICAgKiAgICAgaWYgKHNvbWVDb25kaXRpb24pIHtcbiAgICogICAgICAgLy8gY2hhbmdlIHRoZSBzbmFwIHNldHRpbmdzXG4gICAqICAgICAgIGV2ZW50LmludGVyYWN0YWJsZS5kcmFnZ2FibGUoeyBzbmFwOiB7IHRhcmdldHM6IFtdIH19KVxuICAgKiAgICAgICAvLyBmaXJlIGFub3RoZXIgbW92ZSBldmVudCB3aXRoIHJlLWNhbGN1bGF0ZWQgc25hcFxuICAgKiAgICAgICBldmVudC5pbnRlcmFjdGlvbi5tb3ZlKClcbiAgICogICAgIH1cbiAgICogICB9KVxuICAgKiBgYGBcbiAgICpcbiAgICogRm9yY2UgYSBtb3ZlIG9mIHRoZSBjdXJyZW50IGFjdGlvbiBhdCB0aGUgc2FtZSBjb29yZGluYXRlcy4gVXNlZnVsIGlmXG4gICAqIHNuYXAvcmVzdHJpY3QgaGFzIGJlZW4gY2hhbmdlZCBhbmQgeW91IHdhbnQgYSBtb3ZlbWVudCB3aXRoIHRoZSBuZXdcbiAgICogc2V0dGluZ3MuXG4gICAqL1xuICBtb3ZlIChzaWduYWxBcmc/KSB7XG4gICAgc2lnbmFsQXJnID0gdXRpbHMuZXh0ZW5kKHtcbiAgICAgIHBvaW50ZXI6IHRoaXMuX2xhdGVzdFBvaW50ZXIucG9pbnRlcixcbiAgICAgIGV2ZW50OiB0aGlzLl9sYXRlc3RQb2ludGVyLmV2ZW50LFxuICAgICAgZXZlbnRUYXJnZXQ6IHRoaXMuX2xhdGVzdFBvaW50ZXIuZXZlbnRUYXJnZXQsXG4gICAgICBpbnRlcmFjdGlvbjogdGhpcyxcbiAgICB9LCBzaWduYWxBcmcgfHwge30pXG5cbiAgICBzaWduYWxBcmcucGhhc2UgPSBFdmVudFBoYXNlLk1vdmVcblxuICAgIHRoaXMuX2RvUGhhc2Uoc2lnbmFsQXJnKVxuICB9XG5cbiAgLy8gRW5kIGludGVyYWN0IG1vdmUgZXZlbnRzIGFuZCBzdG9wIGF1dG8tc2Nyb2xsIHVubGVzcyBzaW11bGF0aW9uIGlzIHJ1bm5pbmdcbiAgcG9pbnRlclVwIChwb2ludGVyOiBJbnRlcmFjdC5Qb2ludGVyVHlwZSwgZXZlbnQ6IEludGVyYWN0LlBvaW50ZXJFdmVudFR5cGUsIGV2ZW50VGFyZ2V0OiBFdmVudFRhcmdldCwgY3VyRXZlbnRUYXJnZXQ6IEV2ZW50VGFyZ2V0KSB7XG4gICAgbGV0IHBvaW50ZXJJbmRleCA9IHRoaXMuZ2V0UG9pbnRlckluZGV4KHBvaW50ZXIpXG5cbiAgICBpZiAocG9pbnRlckluZGV4ID09PSAtMSkge1xuICAgICAgcG9pbnRlckluZGV4ID0gdGhpcy51cGRhdGVQb2ludGVyKHBvaW50ZXIsIGV2ZW50LCBldmVudFRhcmdldCwgZmFsc2UpXG4gICAgfVxuXG4gICAgdGhpcy5fc2lnbmFscy5maXJlKC9jYW5jZWwkL2kudGVzdChldmVudC50eXBlKSA/ICdjYW5jZWwnIDogJ3VwJywge1xuICAgICAgcG9pbnRlcixcbiAgICAgIHBvaW50ZXJJbmRleCxcbiAgICAgIGV2ZW50LFxuICAgICAgZXZlbnRUYXJnZXQsXG4gICAgICBjdXJFdmVudFRhcmdldCxcbiAgICAgIGludGVyYWN0aW9uOiB0aGlzLFxuICAgIH0pXG5cbiAgICBpZiAoIXRoaXMuc2ltdWxhdGlvbikge1xuICAgICAgdGhpcy5lbmQoZXZlbnQpXG4gICAgfVxuXG4gICAgdGhpcy5wb2ludGVySXNEb3duID0gZmFsc2VcbiAgICB0aGlzLnJlbW92ZVBvaW50ZXIocG9pbnRlciwgZXZlbnQpXG4gIH1cblxuICBkb2N1bWVudEJsdXIgKGV2ZW50KSB7XG4gICAgdGhpcy5lbmQoZXZlbnQpXG4gICAgdGhpcy5fc2lnbmFscy5maXJlKCdibHVyJywgeyBldmVudCwgaW50ZXJhY3Rpb246IHRoaXMgfSlcbiAgfVxuXG4gIC8qKlxuICAgKiBgYGBqc1xuICAgKiBpbnRlcmFjdCh0YXJnZXQpXG4gICAqICAgLmRyYWdnYWJsZSh0cnVlKVxuICAgKiAgIC5vbignbW92ZScsIGZ1bmN0aW9uIChldmVudCkge1xuICAgKiAgICAgaWYgKGV2ZW50LnBhZ2VYID4gMTAwMCkge1xuICAgKiAgICAgICAvLyBlbmQgdGhlIGN1cnJlbnQgYWN0aW9uXG4gICAqICAgICAgIGV2ZW50LmludGVyYWN0aW9uLmVuZCgpXG4gICAqICAgICAgIC8vIHN0b3AgYWxsIGZ1cnRoZXIgbGlzdGVuZXJzIGZyb20gYmVpbmcgY2FsbGVkXG4gICAqICAgICAgIGV2ZW50LnN0b3BJbW1lZGlhdGVQcm9wYWdhdGlvbigpXG4gICAqICAgICB9XG4gICAqICAgfSlcbiAgICogYGBgXG4gICAqXG4gICAqIEBwYXJhbSB7UG9pbnRlckV2ZW50fSBbZXZlbnRdXG4gICAqL1xuICBlbmQgKGV2ZW50PzogSW50ZXJhY3QuUG9pbnRlckV2ZW50VHlwZSkge1xuICAgIHRoaXMuX2VuZGluZyA9IHRydWVcbiAgICBldmVudCA9IGV2ZW50IHx8IHRoaXMuX2xhdGVzdFBvaW50ZXIuZXZlbnRcbiAgICBsZXQgZW5kUGhhc2VSZXN1bHRcblxuICAgIGlmICh0aGlzLmludGVyYWN0aW5nKCkpIHtcbiAgICAgIGVuZFBoYXNlUmVzdWx0ID0gdGhpcy5fZG9QaGFzZSh7XG4gICAgICAgIGV2ZW50LFxuICAgICAgICBpbnRlcmFjdGlvbjogdGhpcyxcbiAgICAgICAgcGhhc2U6IEV2ZW50UGhhc2UuRW5kLFxuICAgICAgfSlcbiAgICB9XG5cbiAgICB0aGlzLl9lbmRpbmcgPSBmYWxzZVxuXG4gICAgaWYgKGVuZFBoYXNlUmVzdWx0ID09PSB0cnVlKSB7XG4gICAgICB0aGlzLnN0b3AoKVxuICAgIH1cbiAgfVxuXG4gIGN1cnJlbnRBY3Rpb24gKCkge1xuICAgIHJldHVybiB0aGlzLl9pbnRlcmFjdGluZyA/IHRoaXMucHJlcGFyZWQubmFtZSA6IG51bGxcbiAgfVxuXG4gIGludGVyYWN0aW5nICgpIHtcbiAgICByZXR1cm4gdGhpcy5faW50ZXJhY3RpbmdcbiAgfVxuXG4gIC8qKiAqL1xuICBzdG9wICgpIHtcbiAgICB0aGlzLl9zaWduYWxzLmZpcmUoJ3N0b3AnLCB7IGludGVyYWN0aW9uOiB0aGlzIH0pXG5cbiAgICB0aGlzLmludGVyYWN0YWJsZSA9IHRoaXMuZWxlbWVudCA9IG51bGxcblxuICAgIHRoaXMuX2ludGVyYWN0aW5nID0gZmFsc2VcbiAgICB0aGlzLnByZXBhcmVkLm5hbWUgPSB0aGlzLnByZXZFdmVudCA9IG51bGxcbiAgfVxuXG4gIGdldFBvaW50ZXJJbmRleCAocG9pbnRlcikge1xuICAgIGNvbnN0IHBvaW50ZXJJZCA9IHV0aWxzLnBvaW50ZXIuZ2V0UG9pbnRlcklkKHBvaW50ZXIpXG5cbiAgICAvLyBtb3VzZSBhbmQgcGVuIGludGVyYWN0aW9ucyBtYXkgaGF2ZSBvbmx5IG9uZSBwb2ludGVyXG4gICAgcmV0dXJuICh0aGlzLnBvaW50ZXJUeXBlID09PSAnbW91c2UnIHx8IHRoaXMucG9pbnRlclR5cGUgPT09ICdwZW4nKVxuICAgICAgPyB0aGlzLnBvaW50ZXJzLmxlbmd0aCAtIDFcbiAgICAgIDogdXRpbHMuYXJyLmZpbmRJbmRleCh0aGlzLnBvaW50ZXJzLCAoY3VyUG9pbnRlcikgPT4gY3VyUG9pbnRlci5pZCA9PT0gcG9pbnRlcklkKVxuICB9XG5cbiAgZ2V0UG9pbnRlckluZm8gKHBvaW50ZXIpIHtcbiAgICByZXR1cm4gdGhpcy5wb2ludGVyc1t0aGlzLmdldFBvaW50ZXJJbmRleChwb2ludGVyKV1cbiAgfVxuXG4gIHVwZGF0ZVBvaW50ZXIgKHBvaW50ZXI6IEludGVyYWN0LlBvaW50ZXJUeXBlLCBldmVudDogSW50ZXJhY3QuUG9pbnRlckV2ZW50VHlwZSwgZXZlbnRUYXJnZXQ6IEV2ZW50VGFyZ2V0LCBkb3duPzogYm9vbGVhbikge1xuICAgIGNvbnN0IGlkID0gdXRpbHMucG9pbnRlci5nZXRQb2ludGVySWQocG9pbnRlcilcbiAgICBsZXQgcG9pbnRlckluZGV4ID0gdGhpcy5nZXRQb2ludGVySW5kZXgocG9pbnRlcilcbiAgICBsZXQgcG9pbnRlckluZm8gPSB0aGlzLnBvaW50ZXJzW3BvaW50ZXJJbmRleF1cblxuICAgIGRvd24gPSBkb3duID09PSBmYWxzZVxuICAgICAgPyBmYWxzZVxuICAgICAgOiBkb3duIHx8IC8oZG93bnxzdGFydCkkL2kudGVzdChldmVudC50eXBlKVxuXG4gICAgaWYgKCFwb2ludGVySW5mbykge1xuICAgICAgcG9pbnRlckluZm8gPSBuZXcgUG9pbnRlckluZm8oXG4gICAgICAgIGlkLFxuICAgICAgICBwb2ludGVyLFxuICAgICAgICBldmVudCxcbiAgICAgICAgbnVsbCxcbiAgICAgICAgbnVsbCxcbiAgICAgIClcblxuICAgICAgcG9pbnRlckluZGV4ID0gdGhpcy5wb2ludGVycy5sZW5ndGhcbiAgICAgIHRoaXMucG9pbnRlcnMucHVzaChwb2ludGVySW5mbylcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICBwb2ludGVySW5mby5wb2ludGVyID0gcG9pbnRlclxuICAgIH1cblxuICAgIGlmIChkb3duKSB7XG4gICAgICB0aGlzLnBvaW50ZXJJc0Rvd24gPSB0cnVlXG5cbiAgICAgIGlmICghdGhpcy5pbnRlcmFjdGluZygpKSB7XG4gICAgICAgIHV0aWxzLnBvaW50ZXIuc2V0Q29vcmRzKHRoaXMuY29vcmRzLnN0YXJ0LCB0aGlzLnBvaW50ZXJzLm1hcCgocCkgPT4gcC5wb2ludGVyKSwgdGhpcy5fbm93KCkpXG5cbiAgICAgICAgdXRpbHMucG9pbnRlci5jb3B5Q29vcmRzKHRoaXMuY29vcmRzLmN1ciwgdGhpcy5jb29yZHMuc3RhcnQpXG4gICAgICAgIHV0aWxzLnBvaW50ZXIuY29weUNvb3Jkcyh0aGlzLmNvb3Jkcy5wcmV2LCB0aGlzLmNvb3Jkcy5zdGFydClcbiAgICAgICAgdXRpbHMucG9pbnRlci5wb2ludGVyRXh0ZW5kKHRoaXMuZG93blBvaW50ZXIsIHBvaW50ZXIpXG5cbiAgICAgICAgdGhpcy5kb3duRXZlbnQgPSBldmVudFxuICAgICAgICBwb2ludGVySW5mby5kb3duVGltZSA9IHRoaXMuY29vcmRzLmN1ci50aW1lU3RhbXBcbiAgICAgICAgcG9pbnRlckluZm8uZG93blRhcmdldCA9IGV2ZW50VGFyZ2V0XG5cbiAgICAgICAgdGhpcy5wb2ludGVyV2FzTW92ZWQgPSBmYWxzZVxuICAgICAgfVxuICAgIH1cblxuICAgIHRoaXMuX3VwZGF0ZUxhdGVzdFBvaW50ZXIocG9pbnRlciwgZXZlbnQsIGV2ZW50VGFyZ2V0KVxuXG4gICAgdGhpcy5fc2lnbmFscy5maXJlKCd1cGRhdGUtcG9pbnRlcicsIHtcbiAgICAgIHBvaW50ZXIsXG4gICAgICBldmVudCxcbiAgICAgIGV2ZW50VGFyZ2V0LFxuICAgICAgZG93bixcbiAgICAgIHBvaW50ZXJJbmZvLFxuICAgICAgcG9pbnRlckluZGV4LFxuICAgICAgaW50ZXJhY3Rpb246IHRoaXMsXG4gICAgfSlcblxuICAgIHJldHVybiBwb2ludGVySW5kZXhcbiAgfVxuXG4gIHJlbW92ZVBvaW50ZXIgKHBvaW50ZXIsIGV2ZW50KSB7XG4gICAgY29uc3QgcG9pbnRlckluZGV4ID0gdGhpcy5nZXRQb2ludGVySW5kZXgocG9pbnRlcilcblxuICAgIGlmIChwb2ludGVySW5kZXggPT09IC0xKSB7IHJldHVybiB9XG5cbiAgICBjb25zdCBwb2ludGVySW5mbyA9IHRoaXMucG9pbnRlcnNbcG9pbnRlckluZGV4XVxuXG4gICAgdGhpcy5fc2lnbmFscy5maXJlKCdyZW1vdmUtcG9pbnRlcicsIHtcbiAgICAgIHBvaW50ZXIsXG4gICAgICBldmVudCxcbiAgICAgIHBvaW50ZXJJbmRleCxcbiAgICAgIHBvaW50ZXJJbmZvLFxuICAgICAgaW50ZXJhY3Rpb246IHRoaXMsXG4gICAgfSlcblxuICAgIHRoaXMucG9pbnRlcnMuc3BsaWNlKHBvaW50ZXJJbmRleCwgMSlcbiAgfVxuXG4gIF91cGRhdGVMYXRlc3RQb2ludGVyIChwb2ludGVyLCBldmVudCwgZXZlbnRUYXJnZXQpIHtcbiAgICB0aGlzLl9sYXRlc3RQb2ludGVyLnBvaW50ZXIgPSBwb2ludGVyXG4gICAgdGhpcy5fbGF0ZXN0UG9pbnRlci5ldmVudCA9IGV2ZW50XG4gICAgdGhpcy5fbGF0ZXN0UG9pbnRlci5ldmVudFRhcmdldCA9IGV2ZW50VGFyZ2V0XG4gIH1cblxuICBkZXN0cm95ICgpIHtcbiAgICB0aGlzLl9sYXRlc3RQb2ludGVyLnBvaW50ZXIgPSBudWxsXG4gICAgdGhpcy5fbGF0ZXN0UG9pbnRlci5ldmVudCA9IG51bGxcbiAgICB0aGlzLl9sYXRlc3RQb2ludGVyLmV2ZW50VGFyZ2V0ID0gbnVsbFxuICB9XG5cbiAgX2NyZWF0ZVByZXBhcmVkRXZlbnQgKGV2ZW50OiBJbnRlcmFjdC5Qb2ludGVyRXZlbnRUeXBlLCBwaGFzZTogRXZlbnRQaGFzZSwgcHJlRW5kOiBib29sZWFuLCB0eXBlOiBzdHJpbmcpIHtcbiAgICBjb25zdCBhY3Rpb25OYW1lID0gdGhpcy5wcmVwYXJlZC5uYW1lXG5cbiAgICByZXR1cm4gbmV3IEludGVyYWN0RXZlbnQodGhpcywgZXZlbnQsIGFjdGlvbk5hbWUsIHBoYXNlLCB0aGlzLmVsZW1lbnQsIG51bGwsIHByZUVuZCwgdHlwZSlcbiAgfVxuXG4gIF9maXJlRXZlbnQgKGlFdmVudCkge1xuICAgIHRoaXMuaW50ZXJhY3RhYmxlLmZpcmUoaUV2ZW50KVxuXG4gICAgaWYgKCF0aGlzLnByZXZFdmVudCB8fCBpRXZlbnQudGltZVN0YW1wID49IHRoaXMucHJldkV2ZW50LnRpbWVTdGFtcCkge1xuICAgICAgdGhpcy5wcmV2RXZlbnQgPSBpRXZlbnRcbiAgICB9XG4gIH1cblxuICBfZG9QaGFzZSAoc2lnbmFsQXJnOiBQYXJ0aWFsPEludGVyYWN0LlNpZ25hbEFyZz4pIHtcbiAgICBjb25zdCB7IGV2ZW50LCBwaGFzZSwgcHJlRW5kLCB0eXBlIH0gPSBzaWduYWxBcmdcbiAgICBjb25zdCBiZWZvcmVSZXN1bHQgPSB0aGlzLl9zaWduYWxzLmZpcmUoYGJlZm9yZS1hY3Rpb24tJHtwaGFzZX1gLCBzaWduYWxBcmcpXG5cbiAgICBpZiAoYmVmb3JlUmVzdWx0ID09PSBmYWxzZSkge1xuICAgICAgcmV0dXJuIGZhbHNlXG4gICAgfVxuXG4gICAgY29uc3QgaUV2ZW50ID0gc2lnbmFsQXJnLmlFdmVudCA9IHRoaXMuX2NyZWF0ZVByZXBhcmVkRXZlbnQoZXZlbnQsIHBoYXNlLCBwcmVFbmQsIHR5cGUpXG4gICAgY29uc3QgeyByZWN0IH0gPSB0aGlzXG5cbiAgICBpZiAocmVjdCkge1xuICAgICAgLy8gdXBkYXRlIHRoZSByZWN0IG1vZGlmaWNhdGlvbnNcbiAgICAgIGNvbnN0IGVkZ2VzID0gdGhpcy5lZGdlcyB8fCB0aGlzLnByZXBhcmVkLmVkZ2VzIHx8IHsgbGVmdDogdHJ1ZSwgcmlnaHQ6IHRydWUsIHRvcDogdHJ1ZSwgYm90dG9tOiB0cnVlIH1cblxuICAgICAgaWYgKGVkZ2VzLnRvcCkgICAgeyByZWN0LnRvcCAgICArPSBpRXZlbnQuZGVsdGEueSB9XG4gICAgICBpZiAoZWRnZXMuYm90dG9tKSB7IHJlY3QuYm90dG9tICs9IGlFdmVudC5kZWx0YS55IH1cbiAgICAgIGlmIChlZGdlcy5sZWZ0KSAgIHsgcmVjdC5sZWZ0ICAgKz0gaUV2ZW50LmRlbHRhLnggfVxuICAgICAgaWYgKGVkZ2VzLnJpZ2h0KSAgeyByZWN0LnJpZ2h0ICArPSBpRXZlbnQuZGVsdGEueCB9XG5cbiAgICAgIHJlY3Qud2lkdGggPSByZWN0LnJpZ2h0IC0gcmVjdC5sZWZ0XG4gICAgICByZWN0LmhlaWdodCA9IHJlY3QuYm90dG9tIC0gcmVjdC50b3BcbiAgICB9XG5cbiAgICB0aGlzLl9zaWduYWxzLmZpcmUoYGFjdGlvbi0ke3BoYXNlfWAsIHNpZ25hbEFyZylcblxuICAgIHRoaXMuX2ZpcmVFdmVudChpRXZlbnQpXG5cbiAgICB0aGlzLl9zaWduYWxzLmZpcmUoYGFmdGVyLWFjdGlvbi0ke3BoYXNlfWAsIHNpZ25hbEFyZylcblxuICAgIHJldHVybiB0cnVlXG4gIH1cblxuICBfbm93ICgpIHsgcmV0dXJuIERhdGUubm93KCkgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBJbnRlcmFjdGlvblxuZXhwb3J0IHsgUG9pbnRlckluZm8gfVxuIl19