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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiSW50ZXJhY3Rpb24uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJJbnRlcmFjdGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEtBQUssS0FBSyxNQUFNLG1CQUFtQixDQUFBO0FBRTFDLE9BQU8sYUFBNkIsTUFBTSxpQkFBaUIsQ0FBQTtBQUMzRCxPQUFPLFdBQVcsTUFBTSxlQUFlLENBQUE7QUFRdkMsTUFBTSxPQUFPLFdBQVc7SUF3RXRCLE1BQU07SUFDTixZQUFhLEVBQUUsV0FBVyxFQUFFLE9BQU8sRUFBbUQ7UUF4RXRGLDZDQUE2QztRQUM3QyxXQUFNLEdBQWlCLElBQUksQ0FBQTtRQUUzQix5Q0FBeUM7UUFDekMsWUFBTyxHQUFZLElBQUksQ0FBQTtRQUl2QixxREFBcUQ7UUFDckQsYUFBUSxHQUFXO1lBQ2pCLElBQUksRUFBRyxJQUFJO1lBQ1gsSUFBSSxFQUFHLElBQUk7WUFDWCxLQUFLLEVBQUUsSUFBSTtTQUNaLENBQUE7UUFJRCwrQkFBK0I7UUFDL0IsYUFBUSxHQUFrQixFQUFFLENBQUE7UUFFNUIseUNBQXlDO1FBQ3pDLGNBQVMsR0FBOEIsSUFBSSxDQUFBO1FBRTNDLGdCQUFXLEdBQXlCLEVBQTBCLENBQUE7UUFFOUQsbUJBQWMsR0FJVjtZQUNGLE9BQU8sRUFBRSxJQUFJO1lBQ2IsS0FBSyxFQUFFLElBQUk7WUFDWCxXQUFXLEVBQUUsSUFBSTtTQUNsQixDQUFBO1FBRUQsd0JBQXdCO1FBQ3hCLGNBQVMsR0FBa0IsSUFBSSxDQUFBO1FBRS9CLGtCQUFhLEdBQUcsS0FBSyxDQUFBO1FBQ3JCLG9CQUFlLEdBQUcsS0FBSyxDQUFBO1FBQ3ZCLGlCQUFZLEdBQUcsS0FBSyxDQUFBO1FBQ3BCLFlBQU8sR0FBRyxLQUFLLENBQUE7UUFFZixlQUFVLEdBQUcsSUFBSSxDQUFBO1FBTWpCOztXQUVHO1FBQ0gsV0FBTSxHQUFHLEtBQUssQ0FBQyxRQUFRLENBQ3JCLFVBQTZCLFNBQWM7WUFDekMsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQTtRQUN0QixDQUFDLEVBQ0Qsd0VBQXdFLENBQUMsQ0FBQTtRQUUzRSxXQUFNLEdBQUc7WUFDUCw2Q0FBNkM7WUFDN0MsS0FBSyxFQUFFLEtBQUssQ0FBQyxPQUFPLENBQUMsU0FBUyxFQUFFO1lBQ2hDLGlEQUFpRDtZQUNqRCxJQUFJLEVBQUUsS0FBSyxDQUFDLE9BQU8sQ0FBQyxTQUFTLEVBQUU7WUFDL0IsZ0RBQWdEO1lBQ2hELEdBQUcsRUFBRSxLQUFLLENBQUMsT0FBTyxDQUFDLFNBQVMsRUFBRTtZQUM5QixnREFBZ0Q7WUFDaEQsS0FBSyxFQUFFLEtBQUssQ0FBQyxPQUFPLENBQUMsU0FBUyxFQUFFO1lBQ2hDLG1CQUFtQjtZQUNuQixRQUFRLEVBQUUsS0FBSyxDQUFDLE9BQU8sQ0FBQyxTQUFTLEVBQUU7U0FDcEMsQ0FBQTtRQUlDLElBQUksQ0FBQyxRQUFRLEdBQUcsT0FBTyxDQUFBO1FBQ3ZCLElBQUksQ0FBQyxXQUFXLEdBQUcsV0FBVyxDQUFBO1FBRTlCLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRSxJQUFJLENBQUMsQ0FBQTtJQUNqQyxDQUFDO0lBaENELElBQUksb0JBQW9CO1FBQ3RCLE9BQU8sQ0FBQyxDQUFBO0lBQ1YsQ0FBQztJQWdDRCxXQUFXLENBQUUsT0FBTyxFQUFFLEtBQUssRUFBRSxXQUFXO1FBQ3RDLE1BQU0sWUFBWSxHQUFHLElBQUksQ0FBQyxhQUFhLENBQUMsT0FBTyxFQUFFLEtBQUssRUFBRSxXQUFXLEVBQUUsSUFBSSxDQUFDLENBQUE7UUFFMUUsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFO1lBQ3pCLE9BQU87WUFDUCxLQUFLO1lBQ0wsV0FBVztZQUNYLFlBQVk7WUFDWixXQUFXLEVBQUUsSUFBSTtTQUNsQixDQUFDLENBQUE7SUFDSixDQUFDO0lBRUQ7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztPQThCRztJQUNILEtBQUssQ0FBRSxNQUFNLEVBQUUsTUFBTSxFQUFFLE9BQU87UUFDNUIsSUFBSSxJQUFJLENBQUMsV0FBVyxFQUFFO1lBQ2xCLENBQUMsSUFBSSxDQUFDLGFBQWE7WUFDbkIsSUFBSSxDQUFDLFFBQVEsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxNQUFNLENBQUMsSUFBSSxLQUFLLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRTtZQUM5RCxPQUFNO1NBQ1A7UUFFRCxLQUFLLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsTUFBTSxDQUFDLENBQUE7UUFFdkMsSUFBSSxDQUFDLE1BQU0sR0FBUyxNQUFNLENBQUE7UUFDMUIsSUFBSSxDQUFDLE9BQU8sR0FBUSxPQUFPLENBQUE7UUFDM0IsSUFBSSxDQUFDLFlBQVksR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDO1lBQ2hDLFdBQVcsRUFBRSxJQUFJO1lBQ2pCLEtBQUssRUFBRSxJQUFJLENBQUMsU0FBUztZQUNyQixLQUFLLEVBQUUsT0FBTztTQUNmLENBQUMsQ0FBQTtJQUNKLENBQUM7SUFFRCxXQUFXLENBQUUsT0FBTyxFQUFFLEtBQUssRUFBRSxXQUFXO1FBQ3RDLElBQUksQ0FBQyxJQUFJLENBQUMsVUFBVSxFQUFFO1lBQ3BCLElBQUksQ0FBQyxhQUFhLENBQUMsT0FBTyxFQUFFLEtBQUssRUFBRSxXQUFXLEVBQUUsS0FBSyxDQUFDLENBQUE7WUFDdEQsS0FBSyxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLEVBQUUsSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFBO1NBQzlFO1FBRUQsTUFBTSxhQUFhLEdBQUcsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxLQUFLLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ2xELElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDLEtBQUssSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDbEQsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLENBQUMsS0FBSyxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUN0RCxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQyxLQUFLLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQTtRQUU5RSxJQUFJLEVBQUUsQ0FBQTtRQUNOLElBQUksRUFBRSxDQUFBO1FBRU4sc0RBQXNEO1FBQ3RELElBQUksSUFBSSxDQUFDLGFBQWEsSUFBSSxDQUFDLElBQUksQ0FBQyxlQUFlLEVBQUU7WUFDL0MsRUFBRSxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQTtZQUMxRCxFQUFFLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFBO1lBRTFELElBQUksQ0FBQyxlQUFlLEdBQUcsS0FBSyxDQUFDLEtBQUssQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEdBQUcsSUFBSSxDQUFDLG9CQUFvQixDQUFBO1NBQ3ZFO1FBRUQsTUFBTSxTQUFTLEdBQUc7WUFDaEIsT0FBTztZQUNQLFlBQVksRUFBRSxJQUFJLENBQUMsZUFBZSxDQUFDLE9BQU8sQ0FBQztZQUMzQyxLQUFLO1lBQ0wsV0FBVztZQUNYLEVBQUU7WUFDRixFQUFFO1lBQ0YsU0FBUyxFQUFFLGFBQWE7WUFDeEIsV0FBVyxFQUFFLElBQUk7U0FDbEIsQ0FBQTtRQUVELElBQUksQ0FBQyxhQUFhLEVBQUU7WUFDbEIsb0RBQW9EO1lBQ3BELEtBQUssQ0FBQyxPQUFPLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsS0FBSyxFQUFFLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUE7WUFDbEYsS0FBSyxDQUFDLE9BQU8sQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLFFBQVEsRUFBRSxJQUFJLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFBO1NBQ3hFO1FBRUQsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLFNBQVMsQ0FBQyxDQUFBO1FBRXJDLElBQUksQ0FBQyxhQUFhLEVBQUU7WUFDbEIsbURBQW1EO1lBQ25ELElBQUksSUFBSSxDQUFDLFdBQVcsRUFBRSxFQUFFO2dCQUN0QixJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFBO2FBQ3JCO1lBRUQsSUFBSSxJQUFJLENBQUMsZUFBZSxFQUFFO2dCQUN4QixLQUFLLENBQUMsT0FBTyxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFBO2FBQzVEO1NBQ0Y7SUFDSCxDQUFDO0lBRUQ7Ozs7Ozs7Ozs7Ozs7Ozs7O09BaUJHO0lBQ0gsSUFBSSxDQUFFLFNBQVU7UUFDZCxTQUFTLEdBQUcsS0FBSyxDQUFDLE1BQU0sQ0FBQztZQUN2QixPQUFPLEVBQUUsSUFBSSxDQUFDLGNBQWMsQ0FBQyxPQUFPO1lBQ3BDLEtBQUssRUFBRSxJQUFJLENBQUMsY0FBYyxDQUFDLEtBQUs7WUFDaEMsV0FBVyxFQUFFLElBQUksQ0FBQyxjQUFjLENBQUMsV0FBVztZQUM1QyxXQUFXLEVBQUUsSUFBSTtZQUNqQixRQUFRLEVBQUUsS0FBSztTQUNoQixFQUFFLFNBQVMsSUFBSSxFQUFFLENBQUMsQ0FBQTtRQUVuQixTQUFTLENBQUMsS0FBSyxHQUFHLE1BQU0sQ0FBQTtRQUV4QixJQUFJLENBQUMsUUFBUSxDQUFDLFNBQVMsQ0FBQyxDQUFBO0lBQzFCLENBQUM7SUFFRCw2RUFBNkU7SUFDN0UsU0FBUyxDQUFFLE9BQU8sRUFBRSxLQUFLLEVBQUUsV0FBVyxFQUFFLGNBQWM7UUFDcEQsSUFBSSxZQUFZLEdBQUcsSUFBSSxDQUFDLGVBQWUsQ0FBQyxPQUFPLENBQUMsQ0FBQTtRQUVoRCxJQUFJLFlBQVksS0FBSyxDQUFDLENBQUMsRUFBRTtZQUN2QixZQUFZLEdBQUcsSUFBSSxDQUFDLGFBQWEsQ0FBQyxPQUFPLEVBQUUsS0FBSyxFQUFFLFdBQVcsRUFBRSxLQUFLLENBQUMsQ0FBQTtTQUN0RTtRQUVELElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLElBQUksRUFBRTtZQUNoRSxPQUFPO1lBQ1AsWUFBWTtZQUNaLEtBQUs7WUFDTCxXQUFXO1lBQ1gsY0FBYztZQUNkLFdBQVcsRUFBRSxJQUFJO1NBQ2xCLENBQUMsQ0FBQTtRQUVGLElBQUksQ0FBQyxJQUFJLENBQUMsVUFBVSxFQUFFO1lBQ3BCLElBQUksQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUE7U0FDaEI7UUFFRCxJQUFJLENBQUMsYUFBYSxHQUFHLEtBQUssQ0FBQTtRQUMxQixJQUFJLENBQUMsYUFBYSxDQUFDLE9BQU8sRUFBRSxLQUFLLENBQUMsQ0FBQTtJQUNwQyxDQUFDO0lBRUQsWUFBWSxDQUFFLEtBQUs7UUFDakIsSUFBSSxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQTtRQUNmLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxFQUFFLEtBQUssRUFBRSxXQUFXLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQTtJQUMxRCxDQUFDO0lBRUQ7Ozs7Ozs7Ozs7Ozs7OztPQWVHO0lBQ0gsR0FBRyxDQUFFLEtBQUs7UUFDUixJQUFJLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQTtRQUNuQixLQUFLLEdBQUcsS0FBSyxJQUFJLElBQUksQ0FBQyxjQUFjLENBQUMsS0FBSyxDQUFBO1FBQzFDLElBQUksY0FBYyxDQUFBO1FBRWxCLElBQUksSUFBSSxDQUFDLFdBQVcsRUFBRSxFQUFFO1lBQ3RCLGNBQWMsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDO2dCQUM3QixLQUFLO2dCQUNMLFdBQVcsRUFBRSxJQUFJO2dCQUNqQixLQUFLLEVBQUUsS0FBSzthQUNiLENBQUMsQ0FBQTtTQUNIO1FBRUQsSUFBSSxDQUFDLE9BQU8sR0FBRyxLQUFLLENBQUE7UUFFcEIsSUFBSSxjQUFjLEtBQUssSUFBSSxFQUFFO1lBQzNCLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQTtTQUNaO0lBQ0gsQ0FBQztJQUVELGFBQWE7UUFDWCxPQUFPLElBQUksQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUE7SUFDdEQsQ0FBQztJQUVELFdBQVc7UUFDVCxPQUFPLElBQUksQ0FBQyxZQUFZLENBQUE7SUFDMUIsQ0FBQztJQUVELE1BQU07SUFDTixJQUFJO1FBQ0YsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLEVBQUUsV0FBVyxFQUFFLElBQUksRUFBRSxDQUFDLENBQUE7UUFFakQsSUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQTtRQUVqQyxJQUFJLENBQUMsWUFBWSxHQUFHLEtBQUssQ0FBQTtRQUN6QixJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQTtJQUM1QyxDQUFDO0lBRUQsZUFBZSxDQUFFLE9BQU87UUFDdEIsTUFBTSxTQUFTLEdBQUcsS0FBSyxDQUFDLE9BQU8sQ0FBQyxZQUFZLENBQUMsT0FBTyxDQUFDLENBQUE7UUFFckQsdURBQXVEO1FBQ3ZELE9BQU8sQ0FBQyxJQUFJLENBQUMsV0FBVyxLQUFLLE9BQU8sSUFBSSxJQUFJLENBQUMsV0FBVyxLQUFLLEtBQUssQ0FBQztZQUNqRSxDQUFDLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxNQUFNLEdBQUcsQ0FBQztZQUMxQixDQUFDLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDLFVBQVUsRUFBRSxFQUFFLENBQUMsVUFBVSxDQUFDLEVBQUUsS0FBSyxTQUFTLENBQUMsQ0FBQTtJQUNyRixDQUFDO0lBRUQsY0FBYyxDQUFFLE9BQU87UUFDckIsT0FBTyxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxlQUFlLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQTtJQUNyRCxDQUFDO0lBRUQsYUFBYSxDQUFFLE9BQU8sRUFBRSxLQUFLLEVBQUUsV0FBVyxFQUFFLElBQUk7UUFDOUMsTUFBTSxFQUFFLEdBQUcsS0FBSyxDQUFDLE9BQU8sQ0FBQyxZQUFZLENBQUMsT0FBTyxDQUFDLENBQUE7UUFDOUMsSUFBSSxZQUFZLEdBQUcsSUFBSSxDQUFDLGVBQWUsQ0FBQyxPQUFPLENBQUMsQ0FBQTtRQUNoRCxJQUFJLFdBQVcsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLFlBQVksQ0FBQyxDQUFBO1FBRTdDLElBQUksR0FBRyxJQUFJLEtBQUssS0FBSztZQUNuQixDQUFDLENBQUMsS0FBSztZQUNQLENBQUMsQ0FBQyxJQUFJLElBQUksZ0JBQWdCLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQTtRQUU3QyxJQUFJLENBQUMsV0FBVyxFQUFFO1lBQ2hCLFdBQVcsR0FBRyxJQUFJLFdBQVcsQ0FDM0IsRUFBRSxFQUNGLE9BQU8sRUFDUCxLQUFLLEVBQ0wsSUFBSSxFQUNKLElBQUksQ0FDTCxDQUFBO1lBRUQsWUFBWSxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFBO1lBQ25DLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFBO1NBQ2hDO2FBQ0k7WUFDSCxXQUFXLENBQUMsT0FBTyxHQUFHLE9BQU8sQ0FBQTtTQUM5QjtRQUVELElBQUksSUFBSSxFQUFFO1lBQ1IsSUFBSSxDQUFDLGFBQWEsR0FBRyxJQUFJLENBQUE7WUFFekIsSUFBSSxDQUFDLElBQUksQ0FBQyxXQUFXLEVBQUUsRUFBRTtnQkFDdkIsS0FBSyxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxLQUFLLEVBQUUsSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFBO2dCQUUvRSxLQUFLLENBQUMsT0FBTyxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsRUFBRSxJQUFJLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFBO2dCQUM1RCxLQUFLLENBQUMsT0FBTyxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFBO2dCQUM3RCxLQUFLLENBQUMsT0FBTyxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsV0FBVyxFQUFFLE9BQU8sQ0FBQyxDQUFBO2dCQUV0RCxJQUFJLENBQUMsU0FBUyxHQUFHLEtBQUssQ0FBQTtnQkFDdEIsV0FBVyxDQUFDLFFBQVEsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUE7Z0JBQ2hELFdBQVcsQ0FBQyxVQUFVLEdBQUcsV0FBVyxDQUFBO2dCQUVwQyxJQUFJLENBQUMsZUFBZSxHQUFHLEtBQUssQ0FBQTthQUM3QjtTQUNGO1FBRUQsSUFBSSxDQUFDLG9CQUFvQixDQUFDLE9BQU8sRUFBRSxLQUFLLEVBQUUsV0FBVyxDQUFDLENBQUE7UUFFdEQsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLEVBQUU7WUFDbkMsT0FBTztZQUNQLEtBQUs7WUFDTCxXQUFXO1lBQ1gsSUFBSTtZQUNKLFdBQVc7WUFDWCxZQUFZO1lBQ1osV0FBVyxFQUFFLElBQUk7U0FDbEIsQ0FBQyxDQUFBO1FBRUYsT0FBTyxZQUFZLENBQUE7SUFDckIsQ0FBQztJQUVELGFBQWEsQ0FBRSxPQUFPLEVBQUUsS0FBSztRQUMzQixNQUFNLFlBQVksR0FBRyxJQUFJLENBQUMsZUFBZSxDQUFDLE9BQU8sQ0FBQyxDQUFBO1FBRWxELElBQUksWUFBWSxLQUFLLENBQUMsQ0FBQyxFQUFFO1lBQUUsT0FBTTtTQUFFO1FBRW5DLE1BQU0sV0FBVyxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsWUFBWSxDQUFDLENBQUE7UUFFL0MsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLEVBQUU7WUFDbkMsT0FBTztZQUNQLEtBQUs7WUFDTCxZQUFZO1lBQ1osV0FBVztZQUNYLFdBQVcsRUFBRSxJQUFJO1NBQ2xCLENBQUMsQ0FBQTtRQUVGLElBQUksQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLFlBQVksRUFBRSxDQUFDLENBQUMsQ0FBQTtJQUN2QyxDQUFDO0lBRUQsb0JBQW9CLENBQUUsT0FBTyxFQUFFLEtBQUssRUFBRSxXQUFXO1FBQy9DLElBQUksQ0FBQyxjQUFjLENBQUMsT0FBTyxHQUFHLE9BQU8sQ0FBQTtRQUNyQyxJQUFJLENBQUMsY0FBYyxDQUFDLEtBQUssR0FBRyxLQUFLLENBQUE7UUFDakMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxXQUFXLEdBQUcsV0FBVyxDQUFBO0lBQy9DLENBQUM7SUFFRCxvQkFBb0IsQ0FBRSxLQUFnQyxFQUFFLEtBQWlCLEVBQUUsTUFBZSxFQUFFLElBQVk7UUFDdEcsTUFBTSxVQUFVLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUE7UUFFckMsT0FBTyxJQUFJLGFBQWEsQ0FBQyxJQUFJLEVBQUUsS0FBSyxFQUFFLFVBQVUsRUFBRSxLQUFLLEVBQUUsSUFBSSxDQUFDLE9BQU8sRUFBRSxJQUFJLEVBQUUsTUFBTSxFQUFFLElBQUksQ0FBQyxDQUFBO0lBQzVGLENBQUM7SUFFRCxVQUFVLENBQUUsTUFBTTtRQUNoQixJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQTtRQUV4QixJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsSUFBSSxNQUFNLENBQUMsU0FBUyxJQUFJLElBQUksQ0FBQyxTQUFTLENBQUMsU0FBUyxFQUFFO1lBQ25FLElBQUksQ0FBQyxTQUFTLEdBQUcsTUFBTSxDQUFBO1NBQ3hCO0lBQ0gsQ0FBQztJQUVELFFBQVEsQ0FBRSxTQUFTO1FBQ2pCLE1BQU0sRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsR0FBRyxTQUFTLENBQUE7UUFFaEQsSUFBSSxDQUFDLFNBQVMsQ0FBQyxRQUFRLEVBQUU7WUFDdkIsTUFBTSxZQUFZLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsaUJBQWlCLEtBQUssRUFBRSxFQUFFLFNBQVMsQ0FBQyxDQUFBO1lBRTVFLElBQUksWUFBWSxLQUFLLEtBQUssRUFBRTtnQkFDMUIsT0FBTyxLQUFLLENBQUE7YUFDYjtTQUNGO1FBRUQsTUFBTSxNQUFNLEdBQUcsU0FBUyxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUMsb0JBQW9CLENBQUMsS0FBSyxFQUFFLEtBQUssRUFBRSxNQUFNLEVBQUUsSUFBSSxDQUFDLENBQUE7UUFFdkYsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsVUFBVSxLQUFLLEVBQUUsRUFBRSxTQUFTLENBQUMsQ0FBQTtRQUVoRCxJQUFJLENBQUMsVUFBVSxDQUFDLE1BQU0sQ0FBQyxDQUFBO1FBRXZCLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLGdCQUFnQixLQUFLLEVBQUUsRUFBRSxTQUFTLENBQUMsQ0FBQTtRQUV0RCxPQUFPLElBQUksQ0FBQTtJQUNiLENBQUM7Q0FDRjtBQUVELGVBQWUsV0FBVyxDQUFBO0FBQzFCLE9BQU8sRUFBRSxXQUFXLEVBQUUsQ0FBQSIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIHV0aWxzIGZyb20gJ0BpbnRlcmFjdGpzL3V0aWxzJ1xuaW1wb3J0IEludGVyYWN0YWJsZSBmcm9tICcuL0ludGVyYWN0YWJsZSdcbmltcG9ydCBJbnRlcmFjdEV2ZW50LCB7IEV2ZW50UGhhc2UgfSBmcm9tICcuL0ludGVyYWN0RXZlbnQnXG5pbXBvcnQgUG9pbnRlckluZm8gZnJvbSAnLi9Qb2ludGVySW5mbydcblxuZXhwb3J0IGludGVyZmFjZSBBY3Rpb24ge1xuICBuYW1lOiBJbnRlcmFjdC5BY3Rpb25OYW1lXG4gIGF4aXM/OiAneCcgfCAneScgfCAneHknXG4gIGVkZ2VzPzogUGFydGlhbDxJbnRlcmFjdC5SZWN0PlxufVxuXG5leHBvcnQgY2xhc3MgSW50ZXJhY3Rpb24ge1xuICAvLyBjdXJyZW50IGludGVyYWN0YWJsZSBiZWluZyBpbnRlcmFjdGVkIHdpdGhcbiAgdGFyZ2V0OiBJbnRlcmFjdGFibGUgPSBudWxsXG5cbiAgLy8gdGhlIHRhcmdldCBlbGVtZW50IG9mIHRoZSBpbnRlcmFjdGFibGVcbiAgZWxlbWVudDogRWxlbWVudCA9IG51bGxcblxuICBfc2lnbmFsczogdXRpbHMuU2lnbmFsc1xuXG4gIC8vIGFjdGlvbiB0aGF0J3MgcmVhZHkgdG8gYmUgZmlyZWQgb24gbmV4dCBtb3ZlIGV2ZW50XG4gIHByZXBhcmVkOiBBY3Rpb24gPSB7XG4gICAgbmFtZSA6IG51bGwsXG4gICAgYXhpcyA6IG51bGwsXG4gICAgZWRnZXM6IG51bGwsXG4gIH1cblxuICBwb2ludGVyVHlwZTogc3RyaW5nXG5cbiAgLy8ga2VlcCB0cmFjayBvZiBhZGRlZCBwb2ludGVyc1xuICBwb2ludGVyczogUG9pbnRlckluZm9bXSA9IFtdXG5cbiAgLy8gcG9pbnRlcmRvd24vbW91c2Vkb3duL3RvdWNoc3RhcnQgZXZlbnRcbiAgZG93bkV2ZW50OiBJbnRlcmFjdC5Qb2ludGVyRXZlbnRUeXBlID0gbnVsbFxuXG4gIGRvd25Qb2ludGVyOiBJbnRlcmFjdC5Qb2ludGVyVHlwZSA9IHt9IGFzIEludGVyYWN0LlBvaW50ZXJUeXBlXG5cbiAgX2xhdGVzdFBvaW50ZXI6IHtcbiAgICBwb2ludGVyOiBFdmVudFRhcmdldFxuICAgIGV2ZW50OiBJbnRlcmFjdC5Qb2ludGVyRXZlbnRUeXBlXG4gICAgZXZlbnRUYXJnZXQ6IE5vZGUsXG4gIH0gPSB7XG4gICAgcG9pbnRlcjogbnVsbCxcbiAgICBldmVudDogbnVsbCxcbiAgICBldmVudFRhcmdldDogbnVsbCxcbiAgfVxuXG4gIC8vIHByZXZpb3VzIGFjdGlvbiBldmVudFxuICBwcmV2RXZlbnQ6IEludGVyYWN0RXZlbnQgPSBudWxsXG5cbiAgcG9pbnRlcklzRG93biA9IGZhbHNlXG4gIHBvaW50ZXJXYXNNb3ZlZCA9IGZhbHNlXG4gIF9pbnRlcmFjdGluZyA9IGZhbHNlXG4gIF9lbmRpbmcgPSBmYWxzZVxuXG4gIHNpbXVsYXRpb24gPSBudWxsXG5cbiAgZ2V0IHBvaW50ZXJNb3ZlVG9sZXJhbmNlICgpIHtcbiAgICByZXR1cm4gMVxuICB9XG5cbiAgLyoqXG4gICAqIEBhbGlhcyBJbnRlcmFjdGlvbi5wcm90b3R5cGUubW92ZVxuICAgKi9cbiAgZG9Nb3ZlID0gdXRpbHMud2Fybk9uY2UoXG4gICAgZnVuY3Rpb24gKHRoaXM6IEludGVyYWN0aW9uLCBzaWduYWxBcmc6IGFueSkge1xuICAgICAgdGhpcy5tb3ZlKHNpZ25hbEFyZylcbiAgICB9LFxuICAgICdUaGUgaW50ZXJhY3Rpb24uZG9Nb3ZlKCkgbWV0aG9kIGhhcyBiZWVuIHJlbmFtZWQgdG8gaW50ZXJhY3Rpb24ubW92ZSgpJylcblxuICBjb29yZHMgPSB7XG4gICAgLy8gU3RhcnRpbmcgSW50ZXJhY3RFdmVudCBwb2ludGVyIGNvb3JkaW5hdGVzXG4gICAgc3RhcnQ6IHV0aWxzLnBvaW50ZXIubmV3Q29vcmRzKCksXG4gICAgLy8gUHJldmlvdXMgbmF0aXZlIHBvaW50ZXIgbW92ZSBldmVudCBjb29yZGluYXRlc1xuICAgIHByZXY6IHV0aWxzLnBvaW50ZXIubmV3Q29vcmRzKCksXG4gICAgLy8gY3VycmVudCBuYXRpdmUgcG9pbnRlciBtb3ZlIGV2ZW50IGNvb3JkaW5hdGVzXG4gICAgY3VyOiB1dGlscy5wb2ludGVyLm5ld0Nvb3JkcygpLFxuICAgIC8vIENoYW5nZSBpbiBjb29yZGluYXRlcyBhbmQgdGltZSBvZiB0aGUgcG9pbnRlclxuICAgIGRlbHRhOiB1dGlscy5wb2ludGVyLm5ld0Nvb3JkcygpLFxuICAgIC8vIHBvaW50ZXIgdmVsb2NpdHlcbiAgICB2ZWxvY2l0eTogdXRpbHMucG9pbnRlci5uZXdDb29yZHMoKSxcbiAgfVxuXG4gIC8qKiAqL1xuICBjb25zdHJ1Y3RvciAoeyBwb2ludGVyVHlwZSwgc2lnbmFscyB9OiB7IHBvaW50ZXJUeXBlOiBzdHJpbmcsIHNpZ25hbHM6IHV0aWxzLlNpZ25hbHMgfSkge1xuICAgIHRoaXMuX3NpZ25hbHMgPSBzaWduYWxzXG4gICAgdGhpcy5wb2ludGVyVHlwZSA9IHBvaW50ZXJUeXBlXG5cbiAgICB0aGlzLl9zaWduYWxzLmZpcmUoJ25ldycsIHRoaXMpXG4gIH1cblxuICBwb2ludGVyRG93biAocG9pbnRlciwgZXZlbnQsIGV2ZW50VGFyZ2V0KSB7XG4gICAgY29uc3QgcG9pbnRlckluZGV4ID0gdGhpcy51cGRhdGVQb2ludGVyKHBvaW50ZXIsIGV2ZW50LCBldmVudFRhcmdldCwgdHJ1ZSlcblxuICAgIHRoaXMuX3NpZ25hbHMuZmlyZSgnZG93bicsIHtcbiAgICAgIHBvaW50ZXIsXG4gICAgICBldmVudCxcbiAgICAgIGV2ZW50VGFyZ2V0LFxuICAgICAgcG9pbnRlckluZGV4LFxuICAgICAgaW50ZXJhY3Rpb246IHRoaXMsXG4gICAgfSlcbiAgfVxuXG4gIC8qKlxuICAgKiBgYGBqc1xuICAgKiBpbnRlcmFjdCh0YXJnZXQpXG4gICAqICAgLmRyYWdnYWJsZSh7XG4gICAqICAgICAvLyBkaXNhYmxlIHRoZSBkZWZhdWx0IGRyYWcgc3RhcnQgYnkgZG93bi0+bW92ZVxuICAgKiAgICAgbWFudWFsU3RhcnQ6IHRydWVcbiAgICogICB9KVxuICAgKiAgIC8vIHN0YXJ0IGRyYWdnaW5nIGFmdGVyIHRoZSB1c2VyIGhvbGRzIHRoZSBwb2ludGVyIGRvd25cbiAgICogICAub24oJ2hvbGQnLCBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICogICAgIHZhciBpbnRlcmFjdGlvbiA9IGV2ZW50LmludGVyYWN0aW9uO1xuICAgKlxuICAgKiAgICAgaWYgKCFpbnRlcmFjdGlvbi5pbnRlcmFjdGluZygpKSB7XG4gICAqICAgICAgIGludGVyYWN0aW9uLnN0YXJ0KHsgbmFtZTogJ2RyYWcnIH0sXG4gICAqICAgICAgICAgICAgICAgICAgICAgICAgIGV2ZW50LmludGVyYWN0YWJsZSxcbiAgICogICAgICAgICAgICAgICAgICAgICAgICAgZXZlbnQuY3VycmVudFRhcmdldCk7XG4gICAqICAgICB9XG4gICAqIH0pO1xuICAgKiBgYGBcbiAgICpcbiAgICogU3RhcnQgYW4gYWN0aW9uIHdpdGggdGhlIGdpdmVuIEludGVyYWN0YWJsZSBhbmQgRWxlbWVudCBhcyB0YXJ0Z2V0cy4gVGhlXG4gICAqIGFjdGlvbiBtdXN0IGJlIGVuYWJsZWQgZm9yIHRoZSB0YXJnZXQgSW50ZXJhY3RhYmxlIGFuZCBhbiBhcHByb3ByaWF0ZVxuICAgKiBudW1iZXIgb2YgcG9pbnRlcnMgbXVzdCBiZSBoZWxkIGRvd24gLSAxIGZvciBkcmFnL3Jlc2l6ZSwgMiBmb3IgZ2VzdHVyZS5cbiAgICpcbiAgICogVXNlIGl0IHdpdGggYGludGVyYWN0YWJsZS48YWN0aW9uPmFibGUoeyBtYW51YWxTdGFydDogZmFsc2UgfSlgIHRvIGFsd2F5c1xuICAgKiBbc3RhcnQgYWN0aW9ucyBtYW51YWxseV0oaHR0cHM6Ly9naXRodWIuY29tL3RheWUvaW50ZXJhY3QuanMvaXNzdWVzLzExNClcbiAgICpcbiAgICogQHBhcmFtIHtvYmplY3R9IGFjdGlvbiAgIFRoZSBhY3Rpb24gdG8gYmUgcGVyZm9ybWVkIC0gZHJhZywgcmVzaXplLCBldGMuXG4gICAqIEBwYXJhbSB7SW50ZXJhY3RhYmxlfSB0YXJnZXQgIFRoZSBJbnRlcmFjdGFibGUgdG8gdGFyZ2V0XG4gICAqIEBwYXJhbSB7RWxlbWVudH0gZWxlbWVudCBUaGUgRE9NIEVsZW1lbnQgdG8gdGFyZ2V0XG4gICAqIEByZXR1cm4ge29iamVjdH0gaW50ZXJhY3RcbiAgICovXG4gIHN0YXJ0IChhY3Rpb24sIHRhcmdldCwgZWxlbWVudCkge1xuICAgIGlmICh0aGlzLmludGVyYWN0aW5nKCkgfHxcbiAgICAgICAgIXRoaXMucG9pbnRlcklzRG93biB8fFxuICAgICAgICB0aGlzLnBvaW50ZXJzLmxlbmd0aCA8IChhY3Rpb24ubmFtZSA9PT0gJ2dlc3R1cmUnID8gMiA6IDEpKSB7XG4gICAgICByZXR1cm5cbiAgICB9XG5cbiAgICB1dGlscy5jb3B5QWN0aW9uKHRoaXMucHJlcGFyZWQsIGFjdGlvbilcblxuICAgIHRoaXMudGFyZ2V0ICAgICAgID0gdGFyZ2V0XG4gICAgdGhpcy5lbGVtZW50ICAgICAgPSBlbGVtZW50XG4gICAgdGhpcy5faW50ZXJhY3RpbmcgPSB0aGlzLl9kb1BoYXNlKHtcbiAgICAgIGludGVyYWN0aW9uOiB0aGlzLFxuICAgICAgZXZlbnQ6IHRoaXMuZG93bkV2ZW50LFxuICAgICAgcGhhc2U6ICdzdGFydCcsXG4gICAgfSlcbiAgfVxuXG4gIHBvaW50ZXJNb3ZlIChwb2ludGVyLCBldmVudCwgZXZlbnRUYXJnZXQpIHtcbiAgICBpZiAoIXRoaXMuc2ltdWxhdGlvbikge1xuICAgICAgdGhpcy51cGRhdGVQb2ludGVyKHBvaW50ZXIsIGV2ZW50LCBldmVudFRhcmdldCwgZmFsc2UpXG4gICAgICB1dGlscy5wb2ludGVyLnNldENvb3Jkcyh0aGlzLmNvb3Jkcy5jdXIsIHRoaXMucG9pbnRlcnMubWFwKChwKSA9PiBwLnBvaW50ZXIpKVxuICAgIH1cblxuICAgIGNvbnN0IGR1cGxpY2F0ZU1vdmUgPSAodGhpcy5jb29yZHMuY3VyLnBhZ2UueCA9PT0gdGhpcy5jb29yZHMucHJldi5wYWdlLnggJiZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuY29vcmRzLmN1ci5wYWdlLnkgPT09IHRoaXMuY29vcmRzLnByZXYucGFnZS55ICYmXG4gICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmNvb3Jkcy5jdXIuY2xpZW50LnggPT09IHRoaXMuY29vcmRzLnByZXYuY2xpZW50LnggJiZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuY29vcmRzLmN1ci5jbGllbnQueSA9PT0gdGhpcy5jb29yZHMucHJldi5jbGllbnQueSlcblxuICAgIGxldCBkeFxuICAgIGxldCBkeVxuXG4gICAgLy8gcmVnaXN0ZXIgbW92ZW1lbnQgZ3JlYXRlciB0aGFuIHBvaW50ZXJNb3ZlVG9sZXJhbmNlXG4gICAgaWYgKHRoaXMucG9pbnRlcklzRG93biAmJiAhdGhpcy5wb2ludGVyV2FzTW92ZWQpIHtcbiAgICAgIGR4ID0gdGhpcy5jb29yZHMuY3VyLmNsaWVudC54IC0gdGhpcy5jb29yZHMuc3RhcnQuY2xpZW50LnhcbiAgICAgIGR5ID0gdGhpcy5jb29yZHMuY3VyLmNsaWVudC55IC0gdGhpcy5jb29yZHMuc3RhcnQuY2xpZW50LnlcblxuICAgICAgdGhpcy5wb2ludGVyV2FzTW92ZWQgPSB1dGlscy5oeXBvdChkeCwgZHkpID4gdGhpcy5wb2ludGVyTW92ZVRvbGVyYW5jZVxuICAgIH1cblxuICAgIGNvbnN0IHNpZ25hbEFyZyA9IHtcbiAgICAgIHBvaW50ZXIsXG4gICAgICBwb2ludGVySW5kZXg6IHRoaXMuZ2V0UG9pbnRlckluZGV4KHBvaW50ZXIpLFxuICAgICAgZXZlbnQsXG4gICAgICBldmVudFRhcmdldCxcbiAgICAgIGR4LFxuICAgICAgZHksXG4gICAgICBkdXBsaWNhdGU6IGR1cGxpY2F0ZU1vdmUsXG4gICAgICBpbnRlcmFjdGlvbjogdGhpcyxcbiAgICB9XG5cbiAgICBpZiAoIWR1cGxpY2F0ZU1vdmUpIHtcbiAgICAgIC8vIHNldCBwb2ludGVyIGNvb3JkaW5hdGUsIHRpbWUgY2hhbmdlcyBhbmQgdmVsb2NpdHlcbiAgICAgIHV0aWxzLnBvaW50ZXIuc2V0Q29vcmREZWx0YXModGhpcy5jb29yZHMuZGVsdGEsIHRoaXMuY29vcmRzLnByZXYsIHRoaXMuY29vcmRzLmN1cilcbiAgICAgIHV0aWxzLnBvaW50ZXIuc2V0Q29vcmRWZWxvY2l0eSh0aGlzLmNvb3Jkcy52ZWxvY2l0eSwgdGhpcy5jb29yZHMuZGVsdGEpXG4gICAgfVxuXG4gICAgdGhpcy5fc2lnbmFscy5maXJlKCdtb3ZlJywgc2lnbmFsQXJnKVxuXG4gICAgaWYgKCFkdXBsaWNhdGVNb3ZlKSB7XG4gICAgICAvLyBpZiBpbnRlcmFjdGluZywgZmlyZSBhbiAnYWN0aW9uLW1vdmUnIHNpZ25hbCBldGNcbiAgICAgIGlmICh0aGlzLmludGVyYWN0aW5nKCkpIHtcbiAgICAgICAgdGhpcy5tb3ZlKHNpZ25hbEFyZylcbiAgICAgIH1cblxuICAgICAgaWYgKHRoaXMucG9pbnRlcldhc01vdmVkKSB7XG4gICAgICAgIHV0aWxzLnBvaW50ZXIuY29weUNvb3Jkcyh0aGlzLmNvb3Jkcy5wcmV2LCB0aGlzLmNvb3Jkcy5jdXIpXG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIGBgYGpzXG4gICAqIGludGVyYWN0KHRhcmdldClcbiAgICogICAuZHJhZ2dhYmxlKHRydWUpXG4gICAqICAgLm9uKCdkcmFnbW92ZScsIGZ1bmN0aW9uIChldmVudCkge1xuICAgKiAgICAgaWYgKHNvbWVDb25kaXRpb24pIHtcbiAgICogICAgICAgLy8gY2hhbmdlIHRoZSBzbmFwIHNldHRpbmdzXG4gICAqICAgICAgIGV2ZW50LmludGVyYWN0YWJsZS5kcmFnZ2FibGUoeyBzbmFwOiB7IHRhcmdldHM6IFtdIH19KTtcbiAgICogICAgICAgLy8gZmlyZSBhbm90aGVyIG1vdmUgZXZlbnQgd2l0aCByZS1jYWxjdWxhdGVkIHNuYXBcbiAgICogICAgICAgZXZlbnQuaW50ZXJhY3Rpb24ubW92ZSgpO1xuICAgKiAgICAgfVxuICAgKiAgIH0pO1xuICAgKiBgYGBcbiAgICpcbiAgICogRm9yY2UgYSBtb3ZlIG9mIHRoZSBjdXJyZW50IGFjdGlvbiBhdCB0aGUgc2FtZSBjb29yZGluYXRlcy4gVXNlZnVsIGlmXG4gICAqIHNuYXAvcmVzdHJpY3QgaGFzIGJlZW4gY2hhbmdlZCBhbmQgeW91IHdhbnQgYSBtb3ZlbWVudCB3aXRoIHRoZSBuZXdcbiAgICogc2V0dGluZ3MuXG4gICAqL1xuICBtb3ZlIChzaWduYWxBcmc/KSB7XG4gICAgc2lnbmFsQXJnID0gdXRpbHMuZXh0ZW5kKHtcbiAgICAgIHBvaW50ZXI6IHRoaXMuX2xhdGVzdFBvaW50ZXIucG9pbnRlcixcbiAgICAgIGV2ZW50OiB0aGlzLl9sYXRlc3RQb2ludGVyLmV2ZW50LFxuICAgICAgZXZlbnRUYXJnZXQ6IHRoaXMuX2xhdGVzdFBvaW50ZXIuZXZlbnRUYXJnZXQsXG4gICAgICBpbnRlcmFjdGlvbjogdGhpcyxcbiAgICAgIG5vQmVmb3JlOiBmYWxzZSxcbiAgICB9LCBzaWduYWxBcmcgfHwge30pXG5cbiAgICBzaWduYWxBcmcucGhhc2UgPSAnbW92ZSdcblxuICAgIHRoaXMuX2RvUGhhc2Uoc2lnbmFsQXJnKVxuICB9XG5cbiAgLy8gRW5kIGludGVyYWN0IG1vdmUgZXZlbnRzIGFuZCBzdG9wIGF1dG8tc2Nyb2xsIHVubGVzcyBzaW11bGF0aW9uIGlzIHJ1bm5pbmdcbiAgcG9pbnRlclVwIChwb2ludGVyLCBldmVudCwgZXZlbnRUYXJnZXQsIGN1ckV2ZW50VGFyZ2V0KSB7XG4gICAgbGV0IHBvaW50ZXJJbmRleCA9IHRoaXMuZ2V0UG9pbnRlckluZGV4KHBvaW50ZXIpXG5cbiAgICBpZiAocG9pbnRlckluZGV4ID09PSAtMSkge1xuICAgICAgcG9pbnRlckluZGV4ID0gdGhpcy51cGRhdGVQb2ludGVyKHBvaW50ZXIsIGV2ZW50LCBldmVudFRhcmdldCwgZmFsc2UpXG4gICAgfVxuXG4gICAgdGhpcy5fc2lnbmFscy5maXJlKC9jYW5jZWwkL2kudGVzdChldmVudC50eXBlKSA/ICdjYW5jZWwnIDogJ3VwJywge1xuICAgICAgcG9pbnRlcixcbiAgICAgIHBvaW50ZXJJbmRleCxcbiAgICAgIGV2ZW50LFxuICAgICAgZXZlbnRUYXJnZXQsXG4gICAgICBjdXJFdmVudFRhcmdldCxcbiAgICAgIGludGVyYWN0aW9uOiB0aGlzLFxuICAgIH0pXG5cbiAgICBpZiAoIXRoaXMuc2ltdWxhdGlvbikge1xuICAgICAgdGhpcy5lbmQoZXZlbnQpXG4gICAgfVxuXG4gICAgdGhpcy5wb2ludGVySXNEb3duID0gZmFsc2VcbiAgICB0aGlzLnJlbW92ZVBvaW50ZXIocG9pbnRlciwgZXZlbnQpXG4gIH1cblxuICBkb2N1bWVudEJsdXIgKGV2ZW50KSB7XG4gICAgdGhpcy5lbmQoZXZlbnQpXG4gICAgdGhpcy5fc2lnbmFscy5maXJlKCdibHVyJywgeyBldmVudCwgaW50ZXJhY3Rpb246IHRoaXMgfSlcbiAgfVxuXG4gIC8qKlxuICAgKiBgYGBqc1xuICAgKiBpbnRlcmFjdCh0YXJnZXQpXG4gICAqICAgLmRyYWdnYWJsZSh0cnVlKVxuICAgKiAgIC5vbignbW92ZScsIGZ1bmN0aW9uIChldmVudCkge1xuICAgKiAgICAgaWYgKGV2ZW50LnBhZ2VYID4gMTAwMCkge1xuICAgKiAgICAgICAvLyBlbmQgdGhlIGN1cnJlbnQgYWN0aW9uXG4gICAqICAgICAgIGV2ZW50LmludGVyYWN0aW9uLmVuZCgpO1xuICAgKiAgICAgICAvLyBzdG9wIGFsbCBmdXJ0aGVyIGxpc3RlbmVycyBmcm9tIGJlaW5nIGNhbGxlZFxuICAgKiAgICAgICBldmVudC5zdG9wSW1tZWRpYXRlUHJvcGFnYXRpb24oKTtcbiAgICogICAgIH1cbiAgICogICB9KTtcbiAgICogYGBgXG4gICAqXG4gICAqIEBwYXJhbSB7UG9pbnRlckV2ZW50fSBbZXZlbnRdXG4gICAqL1xuICBlbmQgKGV2ZW50KSB7XG4gICAgdGhpcy5fZW5kaW5nID0gdHJ1ZVxuICAgIGV2ZW50ID0gZXZlbnQgfHwgdGhpcy5fbGF0ZXN0UG9pbnRlci5ldmVudFxuICAgIGxldCBlbmRQaGFzZVJlc3VsdFxuXG4gICAgaWYgKHRoaXMuaW50ZXJhY3RpbmcoKSkge1xuICAgICAgZW5kUGhhc2VSZXN1bHQgPSB0aGlzLl9kb1BoYXNlKHtcbiAgICAgICAgZXZlbnQsXG4gICAgICAgIGludGVyYWN0aW9uOiB0aGlzLFxuICAgICAgICBwaGFzZTogJ2VuZCcsXG4gICAgICB9KVxuICAgIH1cblxuICAgIHRoaXMuX2VuZGluZyA9IGZhbHNlXG5cbiAgICBpZiAoZW5kUGhhc2VSZXN1bHQgPT09IHRydWUpIHtcbiAgICAgIHRoaXMuc3RvcCgpXG4gICAgfVxuICB9XG5cbiAgY3VycmVudEFjdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXMuX2ludGVyYWN0aW5nID8gdGhpcy5wcmVwYXJlZC5uYW1lIDogbnVsbFxuICB9XG5cbiAgaW50ZXJhY3RpbmcgKCkge1xuICAgIHJldHVybiB0aGlzLl9pbnRlcmFjdGluZ1xuICB9XG5cbiAgLyoqICovXG4gIHN0b3AgKCkge1xuICAgIHRoaXMuX3NpZ25hbHMuZmlyZSgnc3RvcCcsIHsgaW50ZXJhY3Rpb246IHRoaXMgfSlcblxuICAgIHRoaXMudGFyZ2V0ID0gdGhpcy5lbGVtZW50ID0gbnVsbFxuXG4gICAgdGhpcy5faW50ZXJhY3RpbmcgPSBmYWxzZVxuICAgIHRoaXMucHJlcGFyZWQubmFtZSA9IHRoaXMucHJldkV2ZW50ID0gbnVsbFxuICB9XG5cbiAgZ2V0UG9pbnRlckluZGV4IChwb2ludGVyKSB7XG4gICAgY29uc3QgcG9pbnRlcklkID0gdXRpbHMucG9pbnRlci5nZXRQb2ludGVySWQocG9pbnRlcilcblxuICAgIC8vIG1vdXNlIGFuZCBwZW4gaW50ZXJhY3Rpb25zIG1heSBoYXZlIG9ubHkgb25lIHBvaW50ZXJcbiAgICByZXR1cm4gKHRoaXMucG9pbnRlclR5cGUgPT09ICdtb3VzZScgfHwgdGhpcy5wb2ludGVyVHlwZSA9PT0gJ3BlbicpXG4gICAgICA/IHRoaXMucG9pbnRlcnMubGVuZ3RoIC0gMVxuICAgICAgOiB1dGlscy5hcnIuZmluZEluZGV4KHRoaXMucG9pbnRlcnMsIChjdXJQb2ludGVyKSA9PiBjdXJQb2ludGVyLmlkID09PSBwb2ludGVySWQpXG4gIH1cblxuICBnZXRQb2ludGVySW5mbyAocG9pbnRlcikge1xuICAgIHJldHVybiB0aGlzLnBvaW50ZXJzW3RoaXMuZ2V0UG9pbnRlckluZGV4KHBvaW50ZXIpXVxuICB9XG5cbiAgdXBkYXRlUG9pbnRlciAocG9pbnRlciwgZXZlbnQsIGV2ZW50VGFyZ2V0LCBkb3duKSB7XG4gICAgY29uc3QgaWQgPSB1dGlscy5wb2ludGVyLmdldFBvaW50ZXJJZChwb2ludGVyKVxuICAgIGxldCBwb2ludGVySW5kZXggPSB0aGlzLmdldFBvaW50ZXJJbmRleChwb2ludGVyKVxuICAgIGxldCBwb2ludGVySW5mbyA9IHRoaXMucG9pbnRlcnNbcG9pbnRlckluZGV4XVxuXG4gICAgZG93biA9IGRvd24gPT09IGZhbHNlXG4gICAgICA/IGZhbHNlXG4gICAgICA6IGRvd24gfHwgLyhkb3dufHN0YXJ0KSQvaS50ZXN0KGV2ZW50LnR5cGUpXG5cbiAgICBpZiAoIXBvaW50ZXJJbmZvKSB7XG4gICAgICBwb2ludGVySW5mbyA9IG5ldyBQb2ludGVySW5mbyhcbiAgICAgICAgaWQsXG4gICAgICAgIHBvaW50ZXIsXG4gICAgICAgIGV2ZW50LFxuICAgICAgICBudWxsLFxuICAgICAgICBudWxsLFxuICAgICAgKVxuXG4gICAgICBwb2ludGVySW5kZXggPSB0aGlzLnBvaW50ZXJzLmxlbmd0aFxuICAgICAgdGhpcy5wb2ludGVycy5wdXNoKHBvaW50ZXJJbmZvKVxuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIHBvaW50ZXJJbmZvLnBvaW50ZXIgPSBwb2ludGVyXG4gICAgfVxuXG4gICAgaWYgKGRvd24pIHtcbiAgICAgIHRoaXMucG9pbnRlcklzRG93biA9IHRydWVcblxuICAgICAgaWYgKCF0aGlzLmludGVyYWN0aW5nKCkpIHtcbiAgICAgICAgdXRpbHMucG9pbnRlci5zZXRDb29yZHModGhpcy5jb29yZHMuc3RhcnQsIHRoaXMucG9pbnRlcnMubWFwKChwKSA9PiBwLnBvaW50ZXIpKVxuXG4gICAgICAgIHV0aWxzLnBvaW50ZXIuY29weUNvb3Jkcyh0aGlzLmNvb3Jkcy5jdXIsIHRoaXMuY29vcmRzLnN0YXJ0KVxuICAgICAgICB1dGlscy5wb2ludGVyLmNvcHlDb29yZHModGhpcy5jb29yZHMucHJldiwgdGhpcy5jb29yZHMuc3RhcnQpXG4gICAgICAgIHV0aWxzLnBvaW50ZXIucG9pbnRlckV4dGVuZCh0aGlzLmRvd25Qb2ludGVyLCBwb2ludGVyKVxuXG4gICAgICAgIHRoaXMuZG93bkV2ZW50ID0gZXZlbnRcbiAgICAgICAgcG9pbnRlckluZm8uZG93blRpbWUgPSB0aGlzLmNvb3Jkcy5jdXIudGltZVN0YW1wXG4gICAgICAgIHBvaW50ZXJJbmZvLmRvd25UYXJnZXQgPSBldmVudFRhcmdldFxuXG4gICAgICAgIHRoaXMucG9pbnRlcldhc01vdmVkID0gZmFsc2VcbiAgICAgIH1cbiAgICB9XG5cbiAgICB0aGlzLl91cGRhdGVMYXRlc3RQb2ludGVyKHBvaW50ZXIsIGV2ZW50LCBldmVudFRhcmdldClcblxuICAgIHRoaXMuX3NpZ25hbHMuZmlyZSgndXBkYXRlLXBvaW50ZXInLCB7XG4gICAgICBwb2ludGVyLFxuICAgICAgZXZlbnQsXG4gICAgICBldmVudFRhcmdldCxcbiAgICAgIGRvd24sXG4gICAgICBwb2ludGVySW5mbyxcbiAgICAgIHBvaW50ZXJJbmRleCxcbiAgICAgIGludGVyYWN0aW9uOiB0aGlzLFxuICAgIH0pXG5cbiAgICByZXR1cm4gcG9pbnRlckluZGV4XG4gIH1cblxuICByZW1vdmVQb2ludGVyIChwb2ludGVyLCBldmVudCkge1xuICAgIGNvbnN0IHBvaW50ZXJJbmRleCA9IHRoaXMuZ2V0UG9pbnRlckluZGV4KHBvaW50ZXIpXG5cbiAgICBpZiAocG9pbnRlckluZGV4ID09PSAtMSkgeyByZXR1cm4gfVxuXG4gICAgY29uc3QgcG9pbnRlckluZm8gPSB0aGlzLnBvaW50ZXJzW3BvaW50ZXJJbmRleF1cblxuICAgIHRoaXMuX3NpZ25hbHMuZmlyZSgncmVtb3ZlLXBvaW50ZXInLCB7XG4gICAgICBwb2ludGVyLFxuICAgICAgZXZlbnQsXG4gICAgICBwb2ludGVySW5kZXgsXG4gICAgICBwb2ludGVySW5mbyxcbiAgICAgIGludGVyYWN0aW9uOiB0aGlzLFxuICAgIH0pXG5cbiAgICB0aGlzLnBvaW50ZXJzLnNwbGljZShwb2ludGVySW5kZXgsIDEpXG4gIH1cblxuICBfdXBkYXRlTGF0ZXN0UG9pbnRlciAocG9pbnRlciwgZXZlbnQsIGV2ZW50VGFyZ2V0KSB7XG4gICAgdGhpcy5fbGF0ZXN0UG9pbnRlci5wb2ludGVyID0gcG9pbnRlclxuICAgIHRoaXMuX2xhdGVzdFBvaW50ZXIuZXZlbnQgPSBldmVudFxuICAgIHRoaXMuX2xhdGVzdFBvaW50ZXIuZXZlbnRUYXJnZXQgPSBldmVudFRhcmdldFxuICB9XG5cbiAgX2NyZWF0ZVByZXBhcmVkRXZlbnQgKGV2ZW50OiBJbnRlcmFjdC5Qb2ludGVyRXZlbnRUeXBlLCBwaGFzZTogRXZlbnRQaGFzZSwgcHJlRW5kOiBib29sZWFuLCB0eXBlOiBzdHJpbmcpIHtcbiAgICBjb25zdCBhY3Rpb25OYW1lID0gdGhpcy5wcmVwYXJlZC5uYW1lXG5cbiAgICByZXR1cm4gbmV3IEludGVyYWN0RXZlbnQodGhpcywgZXZlbnQsIGFjdGlvbk5hbWUsIHBoYXNlLCB0aGlzLmVsZW1lbnQsIG51bGwsIHByZUVuZCwgdHlwZSlcbiAgfVxuXG4gIF9maXJlRXZlbnQgKGlFdmVudCkge1xuICAgIHRoaXMudGFyZ2V0LmZpcmUoaUV2ZW50KVxuXG4gICAgaWYgKCF0aGlzLnByZXZFdmVudCB8fCBpRXZlbnQudGltZVN0YW1wID49IHRoaXMucHJldkV2ZW50LnRpbWVTdGFtcCkge1xuICAgICAgdGhpcy5wcmV2RXZlbnQgPSBpRXZlbnRcbiAgICB9XG4gIH1cblxuICBfZG9QaGFzZSAoc2lnbmFsQXJnKSB7XG4gICAgY29uc3QgeyBldmVudCwgcGhhc2UsIHByZUVuZCwgdHlwZSB9ID0gc2lnbmFsQXJnXG5cbiAgICBpZiAoIXNpZ25hbEFyZy5ub0JlZm9yZSkge1xuICAgICAgY29uc3QgYmVmb3JlUmVzdWx0ID0gdGhpcy5fc2lnbmFscy5maXJlKGBiZWZvcmUtYWN0aW9uLSR7cGhhc2V9YCwgc2lnbmFsQXJnKVxuXG4gICAgICBpZiAoYmVmb3JlUmVzdWx0ID09PSBmYWxzZSkge1xuICAgICAgICByZXR1cm4gZmFsc2VcbiAgICAgIH1cbiAgICB9XG5cbiAgICBjb25zdCBpRXZlbnQgPSBzaWduYWxBcmcuaUV2ZW50ID0gdGhpcy5fY3JlYXRlUHJlcGFyZWRFdmVudChldmVudCwgcGhhc2UsIHByZUVuZCwgdHlwZSlcblxuICAgIHRoaXMuX3NpZ25hbHMuZmlyZShgYWN0aW9uLSR7cGhhc2V9YCwgc2lnbmFsQXJnKVxuXG4gICAgdGhpcy5fZmlyZUV2ZW50KGlFdmVudClcblxuICAgIHRoaXMuX3NpZ25hbHMuZmlyZShgYWZ0ZXItYWN0aW9uLSR7cGhhc2V9YCwgc2lnbmFsQXJnKVxuXG4gICAgcmV0dXJuIHRydWVcbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBJbnRlcmFjdGlvblxuZXhwb3J0IHsgUG9pbnRlckluZm8gfVxuIl19