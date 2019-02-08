import * as utils from '@interactjs/utils';
import InteractEvent, { EventPhase } from './InteractEvent';
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
            this.pointers.length < (action.name === 'gesture' ? 2 : 1)) {
            return;
        }
        utils.copyAction(this.prepared, action);
        this.target = target;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiSW50ZXJhY3Rpb24uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJJbnRlcmFjdGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEtBQUssS0FBSyxNQUFNLG1CQUFtQixDQUFBO0FBRTFDLE9BQU8sYUFBYSxFQUFFLEVBQUUsVUFBVSxFQUFFLE1BQU0saUJBQWlCLENBQUE7QUFDM0QsT0FBTyxXQUFXLE1BQU0sZUFBZSxDQUFBO0FBV3ZDLE1BQU0sT0FBTyxXQUFXO0lBd0V0QixNQUFNO0lBQ04sWUFBYSxFQUFFLFdBQVcsRUFBRSxPQUFPLEVBQW9EO1FBeEV2Riw2Q0FBNkM7UUFDN0MsV0FBTSxHQUFpQixJQUFJLENBQUE7UUFFM0IseUNBQXlDO1FBQ3pDLFlBQU8sR0FBWSxJQUFJLENBQUE7UUFJdkIscURBQXFEO1FBQ3JELGFBQVEsR0FBbUI7WUFDekIsSUFBSSxFQUFHLElBQUk7WUFDWCxJQUFJLEVBQUcsSUFBSTtZQUNYLEtBQUssRUFBRSxJQUFJO1NBQ1osQ0FBQTtRQUlELCtCQUErQjtRQUMvQixhQUFRLEdBQWtCLEVBQUUsQ0FBQTtRQUU1Qix5Q0FBeUM7UUFDekMsY0FBUyxHQUE4QixJQUFJLENBQUE7UUFFM0MsZ0JBQVcsR0FBeUIsRUFBMEIsQ0FBQTtRQUU5RCxtQkFBYyxHQUlWO1lBQ0YsT0FBTyxFQUFFLElBQUk7WUFDYixLQUFLLEVBQUUsSUFBSTtZQUNYLFdBQVcsRUFBRSxJQUFJO1NBQ2xCLENBQUE7UUFFRCx3QkFBd0I7UUFDeEIsY0FBUyxHQUFxQixJQUFJLENBQUE7UUFFbEMsa0JBQWEsR0FBRyxLQUFLLENBQUE7UUFDckIsb0JBQWUsR0FBRyxLQUFLLENBQUE7UUFDdkIsaUJBQVksR0FBRyxLQUFLLENBQUE7UUFDcEIsWUFBTyxHQUFHLEtBQUssQ0FBQTtRQUVmLGVBQVUsR0FBRyxJQUFJLENBQUE7UUFNakI7O1dBRUc7UUFDSCxXQUFNLEdBQUcsS0FBSyxDQUFDLFFBQVEsQ0FDckIsVUFBNkIsU0FBYztZQUN6QyxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFBO1FBQ3RCLENBQUMsRUFDRCx3RUFBd0UsQ0FBQyxDQUFBO1FBRTNFLFdBQU0sR0FBRztZQUNQLDZDQUE2QztZQUM3QyxLQUFLLEVBQUUsS0FBSyxDQUFDLE9BQU8sQ0FBQyxTQUFTLEVBQUU7WUFDaEMsaURBQWlEO1lBQ2pELElBQUksRUFBRSxLQUFLLENBQUMsT0FBTyxDQUFDLFNBQVMsRUFBRTtZQUMvQixnREFBZ0Q7WUFDaEQsR0FBRyxFQUFFLEtBQUssQ0FBQyxPQUFPLENBQUMsU0FBUyxFQUFFO1lBQzlCLGdEQUFnRDtZQUNoRCxLQUFLLEVBQUUsS0FBSyxDQUFDLE9BQU8sQ0FBQyxTQUFTLEVBQUU7WUFDaEMsbUJBQW1CO1lBQ25CLFFBQVEsRUFBRSxLQUFLLENBQUMsT0FBTyxDQUFDLFNBQVMsRUFBRTtTQUNwQyxDQUFBO1FBSUMsSUFBSSxDQUFDLFFBQVEsR0FBRyxPQUFPLENBQUE7UUFDdkIsSUFBSSxDQUFDLFdBQVcsR0FBRyxXQUFXLENBQUE7UUFFOUIsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFLEVBQUUsV0FBVyxFQUFFLElBQUksRUFBRSxDQUFDLENBQUE7SUFDbEQsQ0FBQztJQWhDRCxJQUFJLG9CQUFvQjtRQUN0QixPQUFPLENBQUMsQ0FBQTtJQUNWLENBQUM7SUFnQ0QsV0FBVyxDQUFFLE9BQU8sRUFBRSxLQUFLLEVBQUUsV0FBVztRQUN0QyxNQUFNLFlBQVksR0FBRyxJQUFJLENBQUMsYUFBYSxDQUFDLE9BQU8sRUFBRSxLQUFLLEVBQUUsV0FBVyxFQUFFLElBQUksQ0FBQyxDQUFBO1FBRTFFLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRTtZQUN6QixPQUFPO1lBQ1AsS0FBSztZQUNMLFdBQVc7WUFDWCxZQUFZO1lBQ1osV0FBVyxFQUFFLElBQUk7U0FDbEIsQ0FBQyxDQUFBO0lBQ0osQ0FBQztJQUVEOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7T0E4Qkc7SUFDSCxLQUFLLENBQUUsTUFBTSxFQUFFLE1BQU0sRUFBRSxPQUFPO1FBQzVCLElBQUksSUFBSSxDQUFDLFdBQVcsRUFBRTtZQUNsQixDQUFDLElBQUksQ0FBQyxhQUFhO1lBQ25CLElBQUksQ0FBQyxRQUFRLENBQUMsTUFBTSxHQUFHLENBQUMsTUFBTSxDQUFDLElBQUksS0FBSyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUU7WUFDOUQsT0FBTTtTQUNQO1FBRUQsS0FBSyxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLE1BQU0sQ0FBQyxDQUFBO1FBRXZDLElBQUksQ0FBQyxNQUFNLEdBQVMsTUFBTSxDQUFBO1FBQzFCLElBQUksQ0FBQyxPQUFPLEdBQVEsT0FBTyxDQUFBO1FBQzNCLElBQUksQ0FBQyxZQUFZLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQztZQUNoQyxXQUFXLEVBQUUsSUFBSTtZQUNqQixLQUFLLEVBQUUsSUFBSSxDQUFDLFNBQVM7WUFDckIsS0FBSyxFQUFFLFVBQVUsQ0FBQyxLQUFLO1NBQ3hCLENBQUMsQ0FBQTtJQUNKLENBQUM7SUFFRCxXQUFXLENBQUUsT0FBTyxFQUFFLEtBQUssRUFBRSxXQUFXO1FBQ3RDLElBQUksQ0FBQyxJQUFJLENBQUMsVUFBVSxFQUFFO1lBQ3BCLElBQUksQ0FBQyxhQUFhLENBQUMsT0FBTyxFQUFFLEtBQUssRUFBRSxXQUFXLEVBQUUsS0FBSyxDQUFDLENBQUE7WUFDdEQsS0FBSyxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLEVBQUUsSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFBO1NBQzlFO1FBRUQsTUFBTSxhQUFhLEdBQUcsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxLQUFLLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ2xELElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDLEtBQUssSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDbEQsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLENBQUMsS0FBSyxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUN0RCxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQyxLQUFLLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQTtRQUU5RSxJQUFJLEVBQUUsQ0FBQTtRQUNOLElBQUksRUFBRSxDQUFBO1FBRU4sc0RBQXNEO1FBQ3RELElBQUksSUFBSSxDQUFDLGFBQWEsSUFBSSxDQUFDLElBQUksQ0FBQyxlQUFlLEVBQUU7WUFDL0MsRUFBRSxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQTtZQUMxRCxFQUFFLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFBO1lBRTFELElBQUksQ0FBQyxlQUFlLEdBQUcsS0FBSyxDQUFDLEtBQUssQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEdBQUcsSUFBSSxDQUFDLG9CQUFvQixDQUFBO1NBQ3ZFO1FBRUQsTUFBTSxTQUFTLEdBQUc7WUFDaEIsT0FBTztZQUNQLFlBQVksRUFBRSxJQUFJLENBQUMsZUFBZSxDQUFDLE9BQU8sQ0FBQztZQUMzQyxLQUFLO1lBQ0wsV0FBVztZQUNYLEVBQUU7WUFDRixFQUFFO1lBQ0YsU0FBUyxFQUFFLGFBQWE7WUFDeEIsV0FBVyxFQUFFLElBQUk7U0FDbEIsQ0FBQTtRQUVELElBQUksQ0FBQyxhQUFhLEVBQUU7WUFDbEIsb0RBQW9EO1lBQ3BELEtBQUssQ0FBQyxPQUFPLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsS0FBSyxFQUFFLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUE7WUFDbEYsS0FBSyxDQUFDLE9BQU8sQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLFFBQVEsRUFBRSxJQUFJLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFBO1NBQ3hFO1FBRUQsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLFNBQVMsQ0FBQyxDQUFBO1FBRXJDLElBQUksQ0FBQyxhQUFhLEVBQUU7WUFDbEIsbURBQW1EO1lBQ25ELElBQUksSUFBSSxDQUFDLFdBQVcsRUFBRSxFQUFFO2dCQUN0QixJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFBO2FBQ3JCO1lBRUQsSUFBSSxJQUFJLENBQUMsZUFBZSxFQUFFO2dCQUN4QixLQUFLLENBQUMsT0FBTyxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFBO2FBQzVEO1NBQ0Y7SUFDSCxDQUFDO0lBRUQ7Ozs7Ozs7Ozs7Ozs7Ozs7O09BaUJHO0lBQ0gsSUFBSSxDQUFFLFNBQVU7UUFDZCxTQUFTLEdBQUcsS0FBSyxDQUFDLE1BQU0sQ0FBQztZQUN2QixPQUFPLEVBQUUsSUFBSSxDQUFDLGNBQWMsQ0FBQyxPQUFPO1lBQ3BDLEtBQUssRUFBRSxJQUFJLENBQUMsY0FBYyxDQUFDLEtBQUs7WUFDaEMsV0FBVyxFQUFFLElBQUksQ0FBQyxjQUFjLENBQUMsV0FBVztZQUM1QyxXQUFXLEVBQUUsSUFBSTtZQUNqQixRQUFRLEVBQUUsS0FBSztTQUNoQixFQUFFLFNBQVMsSUFBSSxFQUFFLENBQUMsQ0FBQTtRQUVuQixTQUFTLENBQUMsS0FBSyxHQUFHLFVBQVUsQ0FBQyxJQUFJLENBQUE7UUFFakMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxTQUFTLENBQUMsQ0FBQTtJQUMxQixDQUFDO0lBRUQsNkVBQTZFO0lBQzdFLFNBQVMsQ0FBRSxPQUFPLEVBQUUsS0FBSyxFQUFFLFdBQVcsRUFBRSxjQUFjO1FBQ3BELElBQUksWUFBWSxHQUFHLElBQUksQ0FBQyxlQUFlLENBQUMsT0FBTyxDQUFDLENBQUE7UUFFaEQsSUFBSSxZQUFZLEtBQUssQ0FBQyxDQUFDLEVBQUU7WUFDdkIsWUFBWSxHQUFHLElBQUksQ0FBQyxhQUFhLENBQUMsT0FBTyxFQUFFLEtBQUssRUFBRSxXQUFXLEVBQUUsS0FBSyxDQUFDLENBQUE7U0FDdEU7UUFFRCxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxJQUFJLEVBQUU7WUFDaEUsT0FBTztZQUNQLFlBQVk7WUFDWixLQUFLO1lBQ0wsV0FBVztZQUNYLGNBQWM7WUFDZCxXQUFXLEVBQUUsSUFBSTtTQUNsQixDQUFDLENBQUE7UUFFRixJQUFJLENBQUMsSUFBSSxDQUFDLFVBQVUsRUFBRTtZQUNwQixJQUFJLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFBO1NBQ2hCO1FBRUQsSUFBSSxDQUFDLGFBQWEsR0FBRyxLQUFLLENBQUE7UUFDMUIsSUFBSSxDQUFDLGFBQWEsQ0FBQyxPQUFPLEVBQUUsS0FBSyxDQUFDLENBQUE7SUFDcEMsQ0FBQztJQUVELFlBQVksQ0FBRSxLQUFLO1FBQ2pCLElBQUksQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUE7UUFDZixJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsRUFBRSxLQUFLLEVBQUUsV0FBVyxFQUFFLElBQUksRUFBRSxDQUFDLENBQUE7SUFDMUQsQ0FBQztJQUVEOzs7Ozs7Ozs7Ozs7Ozs7T0FlRztJQUNILEdBQUcsQ0FBRSxLQUFpQztRQUNwQyxJQUFJLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQTtRQUNuQixLQUFLLEdBQUcsS0FBSyxJQUFJLElBQUksQ0FBQyxjQUFjLENBQUMsS0FBSyxDQUFBO1FBQzFDLElBQUksY0FBYyxDQUFBO1FBRWxCLElBQUksSUFBSSxDQUFDLFdBQVcsRUFBRSxFQUFFO1lBQ3RCLGNBQWMsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDO2dCQUM3QixLQUFLO2dCQUNMLFdBQVcsRUFBRSxJQUFJO2dCQUNqQixLQUFLLEVBQUUsVUFBVSxDQUFDLEdBQUc7YUFDdEIsQ0FBQyxDQUFBO1NBQ0g7UUFFRCxJQUFJLENBQUMsT0FBTyxHQUFHLEtBQUssQ0FBQTtRQUVwQixJQUFJLGNBQWMsS0FBSyxJQUFJLEVBQUU7WUFDM0IsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFBO1NBQ1o7SUFDSCxDQUFDO0lBRUQsYUFBYTtRQUNYLE9BQU8sSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQTtJQUN0RCxDQUFDO0lBRUQsV0FBVztRQUNULE9BQU8sSUFBSSxDQUFDLFlBQVksQ0FBQTtJQUMxQixDQUFDO0lBRUQsTUFBTTtJQUNOLElBQUk7UUFDRixJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsRUFBRSxXQUFXLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQTtRQUVqRCxJQUFJLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFBO1FBRWpDLElBQUksQ0FBQyxZQUFZLEdBQUcsS0FBSyxDQUFBO1FBQ3pCLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFBO0lBQzVDLENBQUM7SUFFRCxlQUFlLENBQUUsT0FBTztRQUN0QixNQUFNLFNBQVMsR0FBRyxLQUFLLENBQUMsT0FBTyxDQUFDLFlBQVksQ0FBQyxPQUFPLENBQUMsQ0FBQTtRQUVyRCx1REFBdUQ7UUFDdkQsT0FBTyxDQUFDLElBQUksQ0FBQyxXQUFXLEtBQUssT0FBTyxJQUFJLElBQUksQ0FBQyxXQUFXLEtBQUssS0FBSyxDQUFDO1lBQ2pFLENBQUMsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLE1BQU0sR0FBRyxDQUFDO1lBQzFCLENBQUMsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUMsVUFBVSxFQUFFLEVBQUUsQ0FBQyxVQUFVLENBQUMsRUFBRSxLQUFLLFNBQVMsQ0FBQyxDQUFBO0lBQ3JGLENBQUM7SUFFRCxjQUFjLENBQUUsT0FBTztRQUNyQixPQUFPLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLGVBQWUsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFBO0lBQ3JELENBQUM7SUFFRCxhQUFhLENBQUUsT0FBNkIsRUFBRSxLQUFnQyxFQUFFLFdBQXdDLEVBQUUsSUFBYztRQUN0SSxNQUFNLEVBQUUsR0FBRyxLQUFLLENBQUMsT0FBTyxDQUFDLFlBQVksQ0FBQyxPQUFPLENBQUMsQ0FBQTtRQUM5QyxJQUFJLFlBQVksR0FBRyxJQUFJLENBQUMsZUFBZSxDQUFDLE9BQU8sQ0FBQyxDQUFBO1FBQ2hELElBQUksV0FBVyxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsWUFBWSxDQUFDLENBQUE7UUFFN0MsSUFBSSxHQUFHLElBQUksS0FBSyxLQUFLO1lBQ25CLENBQUMsQ0FBQyxLQUFLO1lBQ1AsQ0FBQyxDQUFDLElBQUksSUFBSSxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFBO1FBRTdDLElBQUksQ0FBQyxXQUFXLEVBQUU7WUFDaEIsV0FBVyxHQUFHLElBQUksV0FBVyxDQUMzQixFQUFFLEVBQ0YsT0FBTyxFQUNQLEtBQUssRUFDTCxJQUFJLEVBQ0osSUFBSSxDQUNMLENBQUE7WUFFRCxZQUFZLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUE7WUFDbkMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUE7U0FDaEM7YUFDSTtZQUNILFdBQVcsQ0FBQyxPQUFPLEdBQUcsT0FBTyxDQUFBO1NBQzlCO1FBRUQsSUFBSSxJQUFJLEVBQUU7WUFDUixJQUFJLENBQUMsYUFBYSxHQUFHLElBQUksQ0FBQTtZQUV6QixJQUFJLENBQUMsSUFBSSxDQUFDLFdBQVcsRUFBRSxFQUFFO2dCQUN2QixLQUFLLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLEtBQUssRUFBRSxJQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUE7Z0JBRS9FLEtBQUssQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxFQUFFLElBQUksQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUE7Z0JBQzVELEtBQUssQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUE7Z0JBQzdELEtBQUssQ0FBQyxPQUFPLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxXQUFXLEVBQUUsT0FBTyxDQUFDLENBQUE7Z0JBRXRELElBQUksQ0FBQyxTQUFTLEdBQUcsS0FBSyxDQUFBO2dCQUN0QixXQUFXLENBQUMsUUFBUSxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQTtnQkFDaEQsV0FBVyxDQUFDLFVBQVUsR0FBRyxXQUFXLENBQUE7Z0JBRXBDLElBQUksQ0FBQyxlQUFlLEdBQUcsS0FBSyxDQUFBO2FBQzdCO1NBQ0Y7UUFFRCxJQUFJLENBQUMsb0JBQW9CLENBQUMsT0FBTyxFQUFFLEtBQUssRUFBRSxXQUFXLENBQUMsQ0FBQTtRQUV0RCxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsRUFBRTtZQUNuQyxPQUFPO1lBQ1AsS0FBSztZQUNMLFdBQVc7WUFDWCxJQUFJO1lBQ0osV0FBVztZQUNYLFlBQVk7WUFDWixXQUFXLEVBQUUsSUFBSTtTQUNsQixDQUFDLENBQUE7UUFFRixPQUFPLFlBQVksQ0FBQTtJQUNyQixDQUFDO0lBRUQsYUFBYSxDQUFFLE9BQU8sRUFBRSxLQUFLO1FBQzNCLE1BQU0sWUFBWSxHQUFHLElBQUksQ0FBQyxlQUFlLENBQUMsT0FBTyxDQUFDLENBQUE7UUFFbEQsSUFBSSxZQUFZLEtBQUssQ0FBQyxDQUFDLEVBQUU7WUFBRSxPQUFNO1NBQUU7UUFFbkMsTUFBTSxXQUFXLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxZQUFZLENBQUMsQ0FBQTtRQUUvQyxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsRUFBRTtZQUNuQyxPQUFPO1lBQ1AsS0FBSztZQUNMLFlBQVk7WUFDWixXQUFXO1lBQ1gsV0FBVyxFQUFFLElBQUk7U0FDbEIsQ0FBQyxDQUFBO1FBRUYsSUFBSSxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsWUFBWSxFQUFFLENBQUMsQ0FBQyxDQUFBO0lBQ3ZDLENBQUM7SUFFRCxvQkFBb0IsQ0FBRSxPQUFPLEVBQUUsS0FBSyxFQUFFLFdBQVc7UUFDL0MsSUFBSSxDQUFDLGNBQWMsQ0FBQyxPQUFPLEdBQUcsT0FBTyxDQUFBO1FBQ3JDLElBQUksQ0FBQyxjQUFjLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQTtRQUNqQyxJQUFJLENBQUMsY0FBYyxDQUFDLFdBQVcsR0FBRyxXQUFXLENBQUE7SUFDL0MsQ0FBQztJQUVELG9CQUFvQixDQUFFLEtBQWdDLEVBQUUsS0FBaUIsRUFBRSxNQUFlLEVBQUUsSUFBWTtRQUN0RyxNQUFNLFVBQVUsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQTtRQUVyQyxPQUFPLElBQUksYUFBYSxDQUFDLElBQUksRUFBRSxLQUFLLEVBQUUsVUFBVSxFQUFFLEtBQUssRUFBRSxJQUFJLENBQUMsT0FBTyxFQUFFLElBQUksRUFBRSxNQUFNLEVBQUUsSUFBSSxDQUFDLENBQUE7SUFDNUYsQ0FBQztJQUVELFVBQVUsQ0FBRSxNQUFNO1FBQ2hCLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFBO1FBRXhCLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxJQUFJLE1BQU0sQ0FBQyxTQUFTLElBQUksSUFBSSxDQUFDLFNBQVMsQ0FBQyxTQUFTLEVBQUU7WUFDbkUsSUFBSSxDQUFDLFNBQVMsR0FBRyxNQUFNLENBQUE7U0FDeEI7SUFDSCxDQUFDO0lBRUQsUUFBUSxDQUFFLFNBQXNDO1FBQzlDLE1BQU0sRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsR0FBRyxTQUFTLENBQUE7UUFFaEQsSUFBSSxDQUFDLFNBQVMsQ0FBQyxRQUFRLEVBQUU7WUFDdkIsTUFBTSxZQUFZLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsaUJBQWlCLEtBQUssRUFBRSxFQUFFLFNBQVMsQ0FBQyxDQUFBO1lBRTVFLElBQUksWUFBWSxLQUFLLEtBQUssRUFBRTtnQkFDMUIsT0FBTyxLQUFLLENBQUE7YUFDYjtTQUNGO1FBRUQsTUFBTSxNQUFNLEdBQUcsU0FBUyxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUMsb0JBQW9CLENBQUMsS0FBSyxFQUFFLEtBQUssRUFBRSxNQUFNLEVBQUUsSUFBSSxDQUFDLENBQUE7UUFFdkYsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsVUFBVSxLQUFLLEVBQUUsRUFBRSxTQUFTLENBQUMsQ0FBQTtRQUVoRCxJQUFJLENBQUMsVUFBVSxDQUFDLE1BQU0sQ0FBQyxDQUFBO1FBRXZCLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLGdCQUFnQixLQUFLLEVBQUUsRUFBRSxTQUFTLENBQUMsQ0FBQTtRQUV0RCxPQUFPLElBQUksQ0FBQTtJQUNiLENBQUM7Q0FDRjtBQUVELGVBQWUsV0FBVyxDQUFBO0FBQzFCLE9BQU8sRUFBRSxXQUFXLEVBQUUsQ0FBQSIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIHV0aWxzIGZyb20gJ0BpbnRlcmFjdGpzL3V0aWxzJ1xuaW1wb3J0IEludGVyYWN0YWJsZSBmcm9tICcuL0ludGVyYWN0YWJsZSdcbmltcG9ydCBJbnRlcmFjdEV2ZW50LCB7IEV2ZW50UGhhc2UgfSBmcm9tICcuL0ludGVyYWN0RXZlbnQnXG5pbXBvcnQgUG9pbnRlckluZm8gZnJvbSAnLi9Qb2ludGVySW5mbydcbmltcG9ydCB7IEFjdGlvbk5hbWUgfSBmcm9tICcuL3Njb3BlJ1xuXG5leHBvcnQgaW50ZXJmYWNlIEFjdGlvblByb3BzPFQgZXh0ZW5kcyBBY3Rpb25OYW1lID0gYW55PiB7XG4gIG5hbWU6IFRcbiAgYXhpcz86ICd4JyB8ICd5JyB8ICd4eSdcbiAgZWRnZXM/OiB7XG4gICAgW2VkZ2UgaW4ga2V5b2YgSW50ZXJhY3QuUmVjdF0/OiBib29sZWFuXG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIEludGVyYWN0aW9uPFQgZXh0ZW5kcyBBY3Rpb25OYW1lID0gYW55PiB7XG4gIC8vIGN1cnJlbnQgaW50ZXJhY3RhYmxlIGJlaW5nIGludGVyYWN0ZWQgd2l0aFxuICB0YXJnZXQ6IEludGVyYWN0YWJsZSA9IG51bGxcblxuICAvLyB0aGUgdGFyZ2V0IGVsZW1lbnQgb2YgdGhlIGludGVyYWN0YWJsZVxuICBlbGVtZW50OiBFbGVtZW50ID0gbnVsbFxuXG4gIF9zaWduYWxzOiB1dGlscy5TaWduYWxzXG5cbiAgLy8gYWN0aW9uIHRoYXQncyByZWFkeSB0byBiZSBmaXJlZCBvbiBuZXh0IG1vdmUgZXZlbnRcbiAgcHJlcGFyZWQ6IEFjdGlvblByb3BzPFQ+ID0ge1xuICAgIG5hbWUgOiBudWxsLFxuICAgIGF4aXMgOiBudWxsLFxuICAgIGVkZ2VzOiBudWxsLFxuICB9XG5cbiAgcG9pbnRlclR5cGU6IHN0cmluZ1xuXG4gIC8vIGtlZXAgdHJhY2sgb2YgYWRkZWQgcG9pbnRlcnNcbiAgcG9pbnRlcnM6IFBvaW50ZXJJbmZvW10gPSBbXVxuXG4gIC8vIHBvaW50ZXJkb3duL21vdXNlZG93bi90b3VjaHN0YXJ0IGV2ZW50XG4gIGRvd25FdmVudDogSW50ZXJhY3QuUG9pbnRlckV2ZW50VHlwZSA9IG51bGxcblxuICBkb3duUG9pbnRlcjogSW50ZXJhY3QuUG9pbnRlclR5cGUgPSB7fSBhcyBJbnRlcmFjdC5Qb2ludGVyVHlwZVxuXG4gIF9sYXRlc3RQb2ludGVyOiB7XG4gICAgcG9pbnRlcjogRXZlbnRUYXJnZXRcbiAgICBldmVudDogSW50ZXJhY3QuUG9pbnRlckV2ZW50VHlwZVxuICAgIGV2ZW50VGFyZ2V0OiBOb2RlLFxuICB9ID0ge1xuICAgIHBvaW50ZXI6IG51bGwsXG4gICAgZXZlbnQ6IG51bGwsXG4gICAgZXZlbnRUYXJnZXQ6IG51bGwsXG4gIH1cblxuICAvLyBwcmV2aW91cyBhY3Rpb24gZXZlbnRcbiAgcHJldkV2ZW50OiBJbnRlcmFjdEV2ZW50PFQ+ID0gbnVsbFxuXG4gIHBvaW50ZXJJc0Rvd24gPSBmYWxzZVxuICBwb2ludGVyV2FzTW92ZWQgPSBmYWxzZVxuICBfaW50ZXJhY3RpbmcgPSBmYWxzZVxuICBfZW5kaW5nID0gZmFsc2VcblxuICBzaW11bGF0aW9uID0gbnVsbFxuXG4gIGdldCBwb2ludGVyTW92ZVRvbGVyYW5jZSAoKSB7XG4gICAgcmV0dXJuIDFcbiAgfVxuXG4gIC8qKlxuICAgKiBAYWxpYXMgSW50ZXJhY3Rpb24ucHJvdG90eXBlLm1vdmVcbiAgICovXG4gIGRvTW92ZSA9IHV0aWxzLndhcm5PbmNlKFxuICAgIGZ1bmN0aW9uICh0aGlzOiBJbnRlcmFjdGlvbiwgc2lnbmFsQXJnOiBhbnkpIHtcbiAgICAgIHRoaXMubW92ZShzaWduYWxBcmcpXG4gICAgfSxcbiAgICAnVGhlIGludGVyYWN0aW9uLmRvTW92ZSgpIG1ldGhvZCBoYXMgYmVlbiByZW5hbWVkIHRvIGludGVyYWN0aW9uLm1vdmUoKScpXG5cbiAgY29vcmRzID0ge1xuICAgIC8vIFN0YXJ0aW5nIEludGVyYWN0RXZlbnQgcG9pbnRlciBjb29yZGluYXRlc1xuICAgIHN0YXJ0OiB1dGlscy5wb2ludGVyLm5ld0Nvb3JkcygpLFxuICAgIC8vIFByZXZpb3VzIG5hdGl2ZSBwb2ludGVyIG1vdmUgZXZlbnQgY29vcmRpbmF0ZXNcbiAgICBwcmV2OiB1dGlscy5wb2ludGVyLm5ld0Nvb3JkcygpLFxuICAgIC8vIGN1cnJlbnQgbmF0aXZlIHBvaW50ZXIgbW92ZSBldmVudCBjb29yZGluYXRlc1xuICAgIGN1cjogdXRpbHMucG9pbnRlci5uZXdDb29yZHMoKSxcbiAgICAvLyBDaGFuZ2UgaW4gY29vcmRpbmF0ZXMgYW5kIHRpbWUgb2YgdGhlIHBvaW50ZXJcbiAgICBkZWx0YTogdXRpbHMucG9pbnRlci5uZXdDb29yZHMoKSxcbiAgICAvLyBwb2ludGVyIHZlbG9jaXR5XG4gICAgdmVsb2NpdHk6IHV0aWxzLnBvaW50ZXIubmV3Q29vcmRzKCksXG4gIH1cblxuICAvKiogKi9cbiAgY29uc3RydWN0b3IgKHsgcG9pbnRlclR5cGUsIHNpZ25hbHMgfTogeyBwb2ludGVyVHlwZT86IHN0cmluZywgc2lnbmFsczogdXRpbHMuU2lnbmFscyB9KSB7XG4gICAgdGhpcy5fc2lnbmFscyA9IHNpZ25hbHNcbiAgICB0aGlzLnBvaW50ZXJUeXBlID0gcG9pbnRlclR5cGVcblxuICAgIHRoaXMuX3NpZ25hbHMuZmlyZSgnbmV3JywgeyBpbnRlcmFjdGlvbjogdGhpcyB9KVxuICB9XG5cbiAgcG9pbnRlckRvd24gKHBvaW50ZXIsIGV2ZW50LCBldmVudFRhcmdldCkge1xuICAgIGNvbnN0IHBvaW50ZXJJbmRleCA9IHRoaXMudXBkYXRlUG9pbnRlcihwb2ludGVyLCBldmVudCwgZXZlbnRUYXJnZXQsIHRydWUpXG5cbiAgICB0aGlzLl9zaWduYWxzLmZpcmUoJ2Rvd24nLCB7XG4gICAgICBwb2ludGVyLFxuICAgICAgZXZlbnQsXG4gICAgICBldmVudFRhcmdldCxcbiAgICAgIHBvaW50ZXJJbmRleCxcbiAgICAgIGludGVyYWN0aW9uOiB0aGlzLFxuICAgIH0pXG4gIH1cblxuICAvKipcbiAgICogYGBganNcbiAgICogaW50ZXJhY3QodGFyZ2V0KVxuICAgKiAgIC5kcmFnZ2FibGUoe1xuICAgKiAgICAgLy8gZGlzYWJsZSB0aGUgZGVmYXVsdCBkcmFnIHN0YXJ0IGJ5IGRvd24tPm1vdmVcbiAgICogICAgIG1hbnVhbFN0YXJ0OiB0cnVlXG4gICAqICAgfSlcbiAgICogICAvLyBzdGFydCBkcmFnZ2luZyBhZnRlciB0aGUgdXNlciBob2xkcyB0aGUgcG9pbnRlciBkb3duXG4gICAqICAgLm9uKCdob2xkJywgZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAqICAgICB2YXIgaW50ZXJhY3Rpb24gPSBldmVudC5pbnRlcmFjdGlvbjtcbiAgICpcbiAgICogICAgIGlmICghaW50ZXJhY3Rpb24uaW50ZXJhY3RpbmcoKSkge1xuICAgKiAgICAgICBpbnRlcmFjdGlvbi5zdGFydCh7IG5hbWU6ICdkcmFnJyB9LFxuICAgKiAgICAgICAgICAgICAgICAgICAgICAgICBldmVudC5pbnRlcmFjdGFibGUsXG4gICAqICAgICAgICAgICAgICAgICAgICAgICAgIGV2ZW50LmN1cnJlbnRUYXJnZXQpO1xuICAgKiAgICAgfVxuICAgKiB9KTtcbiAgICogYGBgXG4gICAqXG4gICAqIFN0YXJ0IGFuIGFjdGlvbiB3aXRoIHRoZSBnaXZlbiBJbnRlcmFjdGFibGUgYW5kIEVsZW1lbnQgYXMgdGFydGdldHMuIFRoZVxuICAgKiBhY3Rpb24gbXVzdCBiZSBlbmFibGVkIGZvciB0aGUgdGFyZ2V0IEludGVyYWN0YWJsZSBhbmQgYW4gYXBwcm9wcmlhdGVcbiAgICogbnVtYmVyIG9mIHBvaW50ZXJzIG11c3QgYmUgaGVsZCBkb3duIC0gMSBmb3IgZHJhZy9yZXNpemUsIDIgZm9yIGdlc3R1cmUuXG4gICAqXG4gICAqIFVzZSBpdCB3aXRoIGBpbnRlcmFjdGFibGUuPGFjdGlvbj5hYmxlKHsgbWFudWFsU3RhcnQ6IGZhbHNlIH0pYCB0byBhbHdheXNcbiAgICogW3N0YXJ0IGFjdGlvbnMgbWFudWFsbHldKGh0dHBzOi8vZ2l0aHViLmNvbS90YXllL2ludGVyYWN0LmpzL2lzc3Vlcy8xMTQpXG4gICAqXG4gICAqIEBwYXJhbSB7b2JqZWN0fSBhY3Rpb24gICBUaGUgYWN0aW9uIHRvIGJlIHBlcmZvcm1lZCAtIGRyYWcsIHJlc2l6ZSwgZXRjLlxuICAgKiBAcGFyYW0ge0ludGVyYWN0YWJsZX0gdGFyZ2V0ICBUaGUgSW50ZXJhY3RhYmxlIHRvIHRhcmdldFxuICAgKiBAcGFyYW0ge0VsZW1lbnR9IGVsZW1lbnQgVGhlIERPTSBFbGVtZW50IHRvIHRhcmdldFxuICAgKiBAcmV0dXJuIHtvYmplY3R9IGludGVyYWN0XG4gICAqL1xuICBzdGFydCAoYWN0aW9uLCB0YXJnZXQsIGVsZW1lbnQpIHtcbiAgICBpZiAodGhpcy5pbnRlcmFjdGluZygpIHx8XG4gICAgICAgICF0aGlzLnBvaW50ZXJJc0Rvd24gfHxcbiAgICAgICAgdGhpcy5wb2ludGVycy5sZW5ndGggPCAoYWN0aW9uLm5hbWUgPT09ICdnZXN0dXJlJyA/IDIgOiAxKSkge1xuICAgICAgcmV0dXJuXG4gICAgfVxuXG4gICAgdXRpbHMuY29weUFjdGlvbih0aGlzLnByZXBhcmVkLCBhY3Rpb24pXG5cbiAgICB0aGlzLnRhcmdldCAgICAgICA9IHRhcmdldFxuICAgIHRoaXMuZWxlbWVudCAgICAgID0gZWxlbWVudFxuICAgIHRoaXMuX2ludGVyYWN0aW5nID0gdGhpcy5fZG9QaGFzZSh7XG4gICAgICBpbnRlcmFjdGlvbjogdGhpcyxcbiAgICAgIGV2ZW50OiB0aGlzLmRvd25FdmVudCxcbiAgICAgIHBoYXNlOiBFdmVudFBoYXNlLlN0YXJ0LFxuICAgIH0pXG4gIH1cblxuICBwb2ludGVyTW92ZSAocG9pbnRlciwgZXZlbnQsIGV2ZW50VGFyZ2V0KSB7XG4gICAgaWYgKCF0aGlzLnNpbXVsYXRpb24pIHtcbiAgICAgIHRoaXMudXBkYXRlUG9pbnRlcihwb2ludGVyLCBldmVudCwgZXZlbnRUYXJnZXQsIGZhbHNlKVxuICAgICAgdXRpbHMucG9pbnRlci5zZXRDb29yZHModGhpcy5jb29yZHMuY3VyLCB0aGlzLnBvaW50ZXJzLm1hcCgocCkgPT4gcC5wb2ludGVyKSlcbiAgICB9XG5cbiAgICBjb25zdCBkdXBsaWNhdGVNb3ZlID0gKHRoaXMuY29vcmRzLmN1ci5wYWdlLnggPT09IHRoaXMuY29vcmRzLnByZXYucGFnZS54ICYmXG4gICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmNvb3Jkcy5jdXIucGFnZS55ID09PSB0aGlzLmNvb3Jkcy5wcmV2LnBhZ2UueSAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5jb29yZHMuY3VyLmNsaWVudC54ID09PSB0aGlzLmNvb3Jkcy5wcmV2LmNsaWVudC54ICYmXG4gICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmNvb3Jkcy5jdXIuY2xpZW50LnkgPT09IHRoaXMuY29vcmRzLnByZXYuY2xpZW50LnkpXG5cbiAgICBsZXQgZHhcbiAgICBsZXQgZHlcblxuICAgIC8vIHJlZ2lzdGVyIG1vdmVtZW50IGdyZWF0ZXIgdGhhbiBwb2ludGVyTW92ZVRvbGVyYW5jZVxuICAgIGlmICh0aGlzLnBvaW50ZXJJc0Rvd24gJiYgIXRoaXMucG9pbnRlcldhc01vdmVkKSB7XG4gICAgICBkeCA9IHRoaXMuY29vcmRzLmN1ci5jbGllbnQueCAtIHRoaXMuY29vcmRzLnN0YXJ0LmNsaWVudC54XG4gICAgICBkeSA9IHRoaXMuY29vcmRzLmN1ci5jbGllbnQueSAtIHRoaXMuY29vcmRzLnN0YXJ0LmNsaWVudC55XG5cbiAgICAgIHRoaXMucG9pbnRlcldhc01vdmVkID0gdXRpbHMuaHlwb3QoZHgsIGR5KSA+IHRoaXMucG9pbnRlck1vdmVUb2xlcmFuY2VcbiAgICB9XG5cbiAgICBjb25zdCBzaWduYWxBcmcgPSB7XG4gICAgICBwb2ludGVyLFxuICAgICAgcG9pbnRlckluZGV4OiB0aGlzLmdldFBvaW50ZXJJbmRleChwb2ludGVyKSxcbiAgICAgIGV2ZW50LFxuICAgICAgZXZlbnRUYXJnZXQsXG4gICAgICBkeCxcbiAgICAgIGR5LFxuICAgICAgZHVwbGljYXRlOiBkdXBsaWNhdGVNb3ZlLFxuICAgICAgaW50ZXJhY3Rpb246IHRoaXMsXG4gICAgfVxuXG4gICAgaWYgKCFkdXBsaWNhdGVNb3ZlKSB7XG4gICAgICAvLyBzZXQgcG9pbnRlciBjb29yZGluYXRlLCB0aW1lIGNoYW5nZXMgYW5kIHZlbG9jaXR5XG4gICAgICB1dGlscy5wb2ludGVyLnNldENvb3JkRGVsdGFzKHRoaXMuY29vcmRzLmRlbHRhLCB0aGlzLmNvb3Jkcy5wcmV2LCB0aGlzLmNvb3Jkcy5jdXIpXG4gICAgICB1dGlscy5wb2ludGVyLnNldENvb3JkVmVsb2NpdHkodGhpcy5jb29yZHMudmVsb2NpdHksIHRoaXMuY29vcmRzLmRlbHRhKVxuICAgIH1cblxuICAgIHRoaXMuX3NpZ25hbHMuZmlyZSgnbW92ZScsIHNpZ25hbEFyZylcblxuICAgIGlmICghZHVwbGljYXRlTW92ZSkge1xuICAgICAgLy8gaWYgaW50ZXJhY3RpbmcsIGZpcmUgYW4gJ2FjdGlvbi1tb3ZlJyBzaWduYWwgZXRjXG4gICAgICBpZiAodGhpcy5pbnRlcmFjdGluZygpKSB7XG4gICAgICAgIHRoaXMubW92ZShzaWduYWxBcmcpXG4gICAgICB9XG5cbiAgICAgIGlmICh0aGlzLnBvaW50ZXJXYXNNb3ZlZCkge1xuICAgICAgICB1dGlscy5wb2ludGVyLmNvcHlDb29yZHModGhpcy5jb29yZHMucHJldiwgdGhpcy5jb29yZHMuY3VyKVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBgYGBqc1xuICAgKiBpbnRlcmFjdCh0YXJnZXQpXG4gICAqICAgLmRyYWdnYWJsZSh0cnVlKVxuICAgKiAgIC5vbignZHJhZ21vdmUnLCBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICogICAgIGlmIChzb21lQ29uZGl0aW9uKSB7XG4gICAqICAgICAgIC8vIGNoYW5nZSB0aGUgc25hcCBzZXR0aW5nc1xuICAgKiAgICAgICBldmVudC5pbnRlcmFjdGFibGUuZHJhZ2dhYmxlKHsgc25hcDogeyB0YXJnZXRzOiBbXSB9fSk7XG4gICAqICAgICAgIC8vIGZpcmUgYW5vdGhlciBtb3ZlIGV2ZW50IHdpdGggcmUtY2FsY3VsYXRlZCBzbmFwXG4gICAqICAgICAgIGV2ZW50LmludGVyYWN0aW9uLm1vdmUoKTtcbiAgICogICAgIH1cbiAgICogICB9KTtcbiAgICogYGBgXG4gICAqXG4gICAqIEZvcmNlIGEgbW92ZSBvZiB0aGUgY3VycmVudCBhY3Rpb24gYXQgdGhlIHNhbWUgY29vcmRpbmF0ZXMuIFVzZWZ1bCBpZlxuICAgKiBzbmFwL3Jlc3RyaWN0IGhhcyBiZWVuIGNoYW5nZWQgYW5kIHlvdSB3YW50IGEgbW92ZW1lbnQgd2l0aCB0aGUgbmV3XG4gICAqIHNldHRpbmdzLlxuICAgKi9cbiAgbW92ZSAoc2lnbmFsQXJnPykge1xuICAgIHNpZ25hbEFyZyA9IHV0aWxzLmV4dGVuZCh7XG4gICAgICBwb2ludGVyOiB0aGlzLl9sYXRlc3RQb2ludGVyLnBvaW50ZXIsXG4gICAgICBldmVudDogdGhpcy5fbGF0ZXN0UG9pbnRlci5ldmVudCxcbiAgICAgIGV2ZW50VGFyZ2V0OiB0aGlzLl9sYXRlc3RQb2ludGVyLmV2ZW50VGFyZ2V0LFxuICAgICAgaW50ZXJhY3Rpb246IHRoaXMsXG4gICAgICBub0JlZm9yZTogZmFsc2UsXG4gICAgfSwgc2lnbmFsQXJnIHx8IHt9KVxuXG4gICAgc2lnbmFsQXJnLnBoYXNlID0gRXZlbnRQaGFzZS5Nb3ZlXG5cbiAgICB0aGlzLl9kb1BoYXNlKHNpZ25hbEFyZylcbiAgfVxuXG4gIC8vIEVuZCBpbnRlcmFjdCBtb3ZlIGV2ZW50cyBhbmQgc3RvcCBhdXRvLXNjcm9sbCB1bmxlc3Mgc2ltdWxhdGlvbiBpcyBydW5uaW5nXG4gIHBvaW50ZXJVcCAocG9pbnRlciwgZXZlbnQsIGV2ZW50VGFyZ2V0LCBjdXJFdmVudFRhcmdldCkge1xuICAgIGxldCBwb2ludGVySW5kZXggPSB0aGlzLmdldFBvaW50ZXJJbmRleChwb2ludGVyKVxuXG4gICAgaWYgKHBvaW50ZXJJbmRleCA9PT0gLTEpIHtcbiAgICAgIHBvaW50ZXJJbmRleCA9IHRoaXMudXBkYXRlUG9pbnRlcihwb2ludGVyLCBldmVudCwgZXZlbnRUYXJnZXQsIGZhbHNlKVxuICAgIH1cblxuICAgIHRoaXMuX3NpZ25hbHMuZmlyZSgvY2FuY2VsJC9pLnRlc3QoZXZlbnQudHlwZSkgPyAnY2FuY2VsJyA6ICd1cCcsIHtcbiAgICAgIHBvaW50ZXIsXG4gICAgICBwb2ludGVySW5kZXgsXG4gICAgICBldmVudCxcbiAgICAgIGV2ZW50VGFyZ2V0LFxuICAgICAgY3VyRXZlbnRUYXJnZXQsXG4gICAgICBpbnRlcmFjdGlvbjogdGhpcyxcbiAgICB9KVxuXG4gICAgaWYgKCF0aGlzLnNpbXVsYXRpb24pIHtcbiAgICAgIHRoaXMuZW5kKGV2ZW50KVxuICAgIH1cblxuICAgIHRoaXMucG9pbnRlcklzRG93biA9IGZhbHNlXG4gICAgdGhpcy5yZW1vdmVQb2ludGVyKHBvaW50ZXIsIGV2ZW50KVxuICB9XG5cbiAgZG9jdW1lbnRCbHVyIChldmVudCkge1xuICAgIHRoaXMuZW5kKGV2ZW50KVxuICAgIHRoaXMuX3NpZ25hbHMuZmlyZSgnYmx1cicsIHsgZXZlbnQsIGludGVyYWN0aW9uOiB0aGlzIH0pXG4gIH1cblxuICAvKipcbiAgICogYGBganNcbiAgICogaW50ZXJhY3QodGFyZ2V0KVxuICAgKiAgIC5kcmFnZ2FibGUodHJ1ZSlcbiAgICogICAub24oJ21vdmUnLCBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICogICAgIGlmIChldmVudC5wYWdlWCA+IDEwMDApIHtcbiAgICogICAgICAgLy8gZW5kIHRoZSBjdXJyZW50IGFjdGlvblxuICAgKiAgICAgICBldmVudC5pbnRlcmFjdGlvbi5lbmQoKTtcbiAgICogICAgICAgLy8gc3RvcCBhbGwgZnVydGhlciBsaXN0ZW5lcnMgZnJvbSBiZWluZyBjYWxsZWRcbiAgICogICAgICAgZXZlbnQuc3RvcEltbWVkaWF0ZVByb3BhZ2F0aW9uKCk7XG4gICAqICAgICB9XG4gICAqICAgfSk7XG4gICAqIGBgYFxuICAgKlxuICAgKiBAcGFyYW0ge1BvaW50ZXJFdmVudH0gW2V2ZW50XVxuICAgKi9cbiAgZW5kIChldmVudD86IEludGVyYWN0LlBvaW50ZXJFdmVudFR5cGUpIHtcbiAgICB0aGlzLl9lbmRpbmcgPSB0cnVlXG4gICAgZXZlbnQgPSBldmVudCB8fCB0aGlzLl9sYXRlc3RQb2ludGVyLmV2ZW50XG4gICAgbGV0IGVuZFBoYXNlUmVzdWx0XG5cbiAgICBpZiAodGhpcy5pbnRlcmFjdGluZygpKSB7XG4gICAgICBlbmRQaGFzZVJlc3VsdCA9IHRoaXMuX2RvUGhhc2Uoe1xuICAgICAgICBldmVudCxcbiAgICAgICAgaW50ZXJhY3Rpb246IHRoaXMsXG4gICAgICAgIHBoYXNlOiBFdmVudFBoYXNlLkVuZCxcbiAgICAgIH0pXG4gICAgfVxuXG4gICAgdGhpcy5fZW5kaW5nID0gZmFsc2VcblxuICAgIGlmIChlbmRQaGFzZVJlc3VsdCA9PT0gdHJ1ZSkge1xuICAgICAgdGhpcy5zdG9wKClcbiAgICB9XG4gIH1cblxuICBjdXJyZW50QWN0aW9uICgpIHtcbiAgICByZXR1cm4gdGhpcy5faW50ZXJhY3RpbmcgPyB0aGlzLnByZXBhcmVkLm5hbWUgOiBudWxsXG4gIH1cblxuICBpbnRlcmFjdGluZyAoKSB7XG4gICAgcmV0dXJuIHRoaXMuX2ludGVyYWN0aW5nXG4gIH1cblxuICAvKiogKi9cbiAgc3RvcCAoKSB7XG4gICAgdGhpcy5fc2lnbmFscy5maXJlKCdzdG9wJywgeyBpbnRlcmFjdGlvbjogdGhpcyB9KVxuXG4gICAgdGhpcy50YXJnZXQgPSB0aGlzLmVsZW1lbnQgPSBudWxsXG5cbiAgICB0aGlzLl9pbnRlcmFjdGluZyA9IGZhbHNlXG4gICAgdGhpcy5wcmVwYXJlZC5uYW1lID0gdGhpcy5wcmV2RXZlbnQgPSBudWxsXG4gIH1cblxuICBnZXRQb2ludGVySW5kZXggKHBvaW50ZXIpIHtcbiAgICBjb25zdCBwb2ludGVySWQgPSB1dGlscy5wb2ludGVyLmdldFBvaW50ZXJJZChwb2ludGVyKVxuXG4gICAgLy8gbW91c2UgYW5kIHBlbiBpbnRlcmFjdGlvbnMgbWF5IGhhdmUgb25seSBvbmUgcG9pbnRlclxuICAgIHJldHVybiAodGhpcy5wb2ludGVyVHlwZSA9PT0gJ21vdXNlJyB8fCB0aGlzLnBvaW50ZXJUeXBlID09PSAncGVuJylcbiAgICAgID8gdGhpcy5wb2ludGVycy5sZW5ndGggLSAxXG4gICAgICA6IHV0aWxzLmFyci5maW5kSW5kZXgodGhpcy5wb2ludGVycywgKGN1clBvaW50ZXIpID0+IGN1clBvaW50ZXIuaWQgPT09IHBvaW50ZXJJZClcbiAgfVxuXG4gIGdldFBvaW50ZXJJbmZvIChwb2ludGVyKSB7XG4gICAgcmV0dXJuIHRoaXMucG9pbnRlcnNbdGhpcy5nZXRQb2ludGVySW5kZXgocG9pbnRlcildXG4gIH1cblxuICB1cGRhdGVQb2ludGVyIChwb2ludGVyOiBJbnRlcmFjdC5Qb2ludGVyVHlwZSwgZXZlbnQ6IEludGVyYWN0LlBvaW50ZXJFdmVudFR5cGUsIGV2ZW50VGFyZ2V0OiBXaW5kb3cgfCBEb2N1bWVudCB8IEVsZW1lbnQsIGRvd24/OiBib29sZWFuKSB7XG4gICAgY29uc3QgaWQgPSB1dGlscy5wb2ludGVyLmdldFBvaW50ZXJJZChwb2ludGVyKVxuICAgIGxldCBwb2ludGVySW5kZXggPSB0aGlzLmdldFBvaW50ZXJJbmRleChwb2ludGVyKVxuICAgIGxldCBwb2ludGVySW5mbyA9IHRoaXMucG9pbnRlcnNbcG9pbnRlckluZGV4XVxuXG4gICAgZG93biA9IGRvd24gPT09IGZhbHNlXG4gICAgICA/IGZhbHNlXG4gICAgICA6IGRvd24gfHwgLyhkb3dufHN0YXJ0KSQvaS50ZXN0KGV2ZW50LnR5cGUpXG5cbiAgICBpZiAoIXBvaW50ZXJJbmZvKSB7XG4gICAgICBwb2ludGVySW5mbyA9IG5ldyBQb2ludGVySW5mbyhcbiAgICAgICAgaWQsXG4gICAgICAgIHBvaW50ZXIsXG4gICAgICAgIGV2ZW50LFxuICAgICAgICBudWxsLFxuICAgICAgICBudWxsLFxuICAgICAgKVxuXG4gICAgICBwb2ludGVySW5kZXggPSB0aGlzLnBvaW50ZXJzLmxlbmd0aFxuICAgICAgdGhpcy5wb2ludGVycy5wdXNoKHBvaW50ZXJJbmZvKVxuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIHBvaW50ZXJJbmZvLnBvaW50ZXIgPSBwb2ludGVyXG4gICAgfVxuXG4gICAgaWYgKGRvd24pIHtcbiAgICAgIHRoaXMucG9pbnRlcklzRG93biA9IHRydWVcblxuICAgICAgaWYgKCF0aGlzLmludGVyYWN0aW5nKCkpIHtcbiAgICAgICAgdXRpbHMucG9pbnRlci5zZXRDb29yZHModGhpcy5jb29yZHMuc3RhcnQsIHRoaXMucG9pbnRlcnMubWFwKChwKSA9PiBwLnBvaW50ZXIpKVxuXG4gICAgICAgIHV0aWxzLnBvaW50ZXIuY29weUNvb3Jkcyh0aGlzLmNvb3Jkcy5jdXIsIHRoaXMuY29vcmRzLnN0YXJ0KVxuICAgICAgICB1dGlscy5wb2ludGVyLmNvcHlDb29yZHModGhpcy5jb29yZHMucHJldiwgdGhpcy5jb29yZHMuc3RhcnQpXG4gICAgICAgIHV0aWxzLnBvaW50ZXIucG9pbnRlckV4dGVuZCh0aGlzLmRvd25Qb2ludGVyLCBwb2ludGVyKVxuXG4gICAgICAgIHRoaXMuZG93bkV2ZW50ID0gZXZlbnRcbiAgICAgICAgcG9pbnRlckluZm8uZG93blRpbWUgPSB0aGlzLmNvb3Jkcy5jdXIudGltZVN0YW1wXG4gICAgICAgIHBvaW50ZXJJbmZvLmRvd25UYXJnZXQgPSBldmVudFRhcmdldFxuXG4gICAgICAgIHRoaXMucG9pbnRlcldhc01vdmVkID0gZmFsc2VcbiAgICAgIH1cbiAgICB9XG5cbiAgICB0aGlzLl91cGRhdGVMYXRlc3RQb2ludGVyKHBvaW50ZXIsIGV2ZW50LCBldmVudFRhcmdldClcblxuICAgIHRoaXMuX3NpZ25hbHMuZmlyZSgndXBkYXRlLXBvaW50ZXInLCB7XG4gICAgICBwb2ludGVyLFxuICAgICAgZXZlbnQsXG4gICAgICBldmVudFRhcmdldCxcbiAgICAgIGRvd24sXG4gICAgICBwb2ludGVySW5mbyxcbiAgICAgIHBvaW50ZXJJbmRleCxcbiAgICAgIGludGVyYWN0aW9uOiB0aGlzLFxuICAgIH0pXG5cbiAgICByZXR1cm4gcG9pbnRlckluZGV4XG4gIH1cblxuICByZW1vdmVQb2ludGVyIChwb2ludGVyLCBldmVudCkge1xuICAgIGNvbnN0IHBvaW50ZXJJbmRleCA9IHRoaXMuZ2V0UG9pbnRlckluZGV4KHBvaW50ZXIpXG5cbiAgICBpZiAocG9pbnRlckluZGV4ID09PSAtMSkgeyByZXR1cm4gfVxuXG4gICAgY29uc3QgcG9pbnRlckluZm8gPSB0aGlzLnBvaW50ZXJzW3BvaW50ZXJJbmRleF1cblxuICAgIHRoaXMuX3NpZ25hbHMuZmlyZSgncmVtb3ZlLXBvaW50ZXInLCB7XG4gICAgICBwb2ludGVyLFxuICAgICAgZXZlbnQsXG4gICAgICBwb2ludGVySW5kZXgsXG4gICAgICBwb2ludGVySW5mbyxcbiAgICAgIGludGVyYWN0aW9uOiB0aGlzLFxuICAgIH0pXG5cbiAgICB0aGlzLnBvaW50ZXJzLnNwbGljZShwb2ludGVySW5kZXgsIDEpXG4gIH1cblxuICBfdXBkYXRlTGF0ZXN0UG9pbnRlciAocG9pbnRlciwgZXZlbnQsIGV2ZW50VGFyZ2V0KSB7XG4gICAgdGhpcy5fbGF0ZXN0UG9pbnRlci5wb2ludGVyID0gcG9pbnRlclxuICAgIHRoaXMuX2xhdGVzdFBvaW50ZXIuZXZlbnQgPSBldmVudFxuICAgIHRoaXMuX2xhdGVzdFBvaW50ZXIuZXZlbnRUYXJnZXQgPSBldmVudFRhcmdldFxuICB9XG5cbiAgX2NyZWF0ZVByZXBhcmVkRXZlbnQgKGV2ZW50OiBJbnRlcmFjdC5Qb2ludGVyRXZlbnRUeXBlLCBwaGFzZTogRXZlbnRQaGFzZSwgcHJlRW5kOiBib29sZWFuLCB0eXBlOiBzdHJpbmcpIHtcbiAgICBjb25zdCBhY3Rpb25OYW1lID0gdGhpcy5wcmVwYXJlZC5uYW1lXG5cbiAgICByZXR1cm4gbmV3IEludGVyYWN0RXZlbnQodGhpcywgZXZlbnQsIGFjdGlvbk5hbWUsIHBoYXNlLCB0aGlzLmVsZW1lbnQsIG51bGwsIHByZUVuZCwgdHlwZSlcbiAgfVxuXG4gIF9maXJlRXZlbnQgKGlFdmVudCkge1xuICAgIHRoaXMudGFyZ2V0LmZpcmUoaUV2ZW50KVxuXG4gICAgaWYgKCF0aGlzLnByZXZFdmVudCB8fCBpRXZlbnQudGltZVN0YW1wID49IHRoaXMucHJldkV2ZW50LnRpbWVTdGFtcCkge1xuICAgICAgdGhpcy5wcmV2RXZlbnQgPSBpRXZlbnRcbiAgICB9XG4gIH1cblxuICBfZG9QaGFzZSAoc2lnbmFsQXJnOiBQYXJ0aWFsPEludGVyYWN0LlNpZ25hbEFyZz4pIHtcbiAgICBjb25zdCB7IGV2ZW50LCBwaGFzZSwgcHJlRW5kLCB0eXBlIH0gPSBzaWduYWxBcmdcblxuICAgIGlmICghc2lnbmFsQXJnLm5vQmVmb3JlKSB7XG4gICAgICBjb25zdCBiZWZvcmVSZXN1bHQgPSB0aGlzLl9zaWduYWxzLmZpcmUoYGJlZm9yZS1hY3Rpb24tJHtwaGFzZX1gLCBzaWduYWxBcmcpXG5cbiAgICAgIGlmIChiZWZvcmVSZXN1bHQgPT09IGZhbHNlKSB7XG4gICAgICAgIHJldHVybiBmYWxzZVxuICAgICAgfVxuICAgIH1cblxuICAgIGNvbnN0IGlFdmVudCA9IHNpZ25hbEFyZy5pRXZlbnQgPSB0aGlzLl9jcmVhdGVQcmVwYXJlZEV2ZW50KGV2ZW50LCBwaGFzZSwgcHJlRW5kLCB0eXBlKVxuXG4gICAgdGhpcy5fc2lnbmFscy5maXJlKGBhY3Rpb24tJHtwaGFzZX1gLCBzaWduYWxBcmcpXG5cbiAgICB0aGlzLl9maXJlRXZlbnQoaUV2ZW50KVxuXG4gICAgdGhpcy5fc2lnbmFscy5maXJlKGBhZnRlci1hY3Rpb24tJHtwaGFzZX1gLCBzaWduYWxBcmcpXG5cbiAgICByZXR1cm4gdHJ1ZVxuICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IEludGVyYWN0aW9uXG5leHBvcnQgeyBQb2ludGVySW5mbyB9XG4iXX0=