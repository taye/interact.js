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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiSW50ZXJhY3Rpb24uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJJbnRlcmFjdGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEtBQUssS0FBSyxNQUFNLG1CQUFtQixDQUFBO0FBRTFDLE9BQU8sYUFBYSxNQUFNLGlCQUFpQixDQUFBO0FBQzNDLE9BQU8sV0FBVyxNQUFNLGVBQWUsQ0FBQTtBQVF2QyxNQUFNLE9BQU8sV0FBVztJQXdFdEIsTUFBTTtJQUNOLFlBQWEsRUFBRSxXQUFXLEVBQUUsT0FBTyxFQUFtRDtRQXhFdEYsNkNBQTZDO1FBQzdDLFdBQU0sR0FBaUIsSUFBVyxDQUFBO1FBRWxDLHlDQUF5QztRQUN6QyxZQUFPLEdBQVMsSUFBVyxDQUFBO1FBSTNCLHFEQUFxRDtRQUNyRCxhQUFRLEdBQVc7WUFDakIsSUFBSSxFQUFHLElBQVc7WUFDbEIsSUFBSSxFQUFHLElBQVc7WUFDbEIsS0FBSyxFQUFFLElBQVc7U0FDbkIsQ0FBQTtRQUlELCtCQUErQjtRQUMvQixhQUFRLEdBQWtCLEVBQUUsQ0FBQTtRQUU1Qix5Q0FBeUM7UUFDekMsY0FBUyxHQUE4QixJQUFXLENBQUE7UUFFbEQsZ0JBQVcsR0FBeUIsRUFBMEIsQ0FBQTtRQUU5RCxtQkFBYyxHQUlWO1lBQ0YsT0FBTyxFQUFFLElBQVc7WUFDcEIsS0FBSyxFQUFFLElBQVc7WUFDbEIsV0FBVyxFQUFFLElBQVc7U0FDekIsQ0FBQTtRQUVELHdCQUF3QjtRQUN4QixjQUFTLEdBQWtCLElBQVcsQ0FBQTtRQUV0QyxrQkFBYSxHQUFHLEtBQUssQ0FBQTtRQUNyQixvQkFBZSxHQUFHLEtBQUssQ0FBQTtRQUN2QixpQkFBWSxHQUFHLEtBQUssQ0FBQTtRQUNwQixZQUFPLEdBQUcsS0FBSyxDQUFBO1FBRWYsZUFBVSxHQUFHLElBQUksQ0FBQTtRQU1qQjs7V0FFRztRQUNILFdBQU0sR0FBRyxLQUFLLENBQUMsUUFBUSxDQUNyQixVQUE2QixTQUFjO1lBQ3pDLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUE7UUFDdEIsQ0FBQyxFQUNELHdFQUF3RSxDQUFDLENBQUE7UUFFM0UsV0FBTSxHQUFHO1lBQ1AsNkNBQTZDO1lBQzdDLEtBQUssRUFBRSxLQUFLLENBQUMsT0FBTyxDQUFDLFNBQVMsRUFBRTtZQUNoQyxpREFBaUQ7WUFDakQsSUFBSSxFQUFFLEtBQUssQ0FBQyxPQUFPLENBQUMsU0FBUyxFQUFFO1lBQy9CLGdEQUFnRDtZQUNoRCxHQUFHLEVBQUUsS0FBSyxDQUFDLE9BQU8sQ0FBQyxTQUFTLEVBQUU7WUFDOUIsZ0RBQWdEO1lBQ2hELEtBQUssRUFBRSxLQUFLLENBQUMsT0FBTyxDQUFDLFNBQVMsRUFBRTtZQUNoQyxtQkFBbUI7WUFDbkIsUUFBUSxFQUFFLEtBQUssQ0FBQyxPQUFPLENBQUMsU0FBUyxFQUFFO1NBQ3BDLENBQUE7UUFJQyxJQUFJLENBQUMsUUFBUSxHQUFHLE9BQU8sQ0FBQTtRQUN2QixJQUFJLENBQUMsV0FBVyxHQUFHLFdBQVcsQ0FBQTtRQUU5QixJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUUsSUFBSSxDQUFDLENBQUE7SUFDakMsQ0FBQztJQWhDRCxJQUFJLG9CQUFvQjtRQUN0QixPQUFPLENBQUMsQ0FBQTtJQUNWLENBQUM7SUFnQ0QsV0FBVyxDQUFFLE9BQU8sRUFBRSxLQUFLLEVBQUUsV0FBVztRQUN0QyxNQUFNLFlBQVksR0FBRyxJQUFJLENBQUMsYUFBYSxDQUFDLE9BQU8sRUFBRSxLQUFLLEVBQUUsV0FBVyxFQUFFLElBQUksQ0FBQyxDQUFBO1FBRTFFLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRTtZQUN6QixPQUFPO1lBQ1AsS0FBSztZQUNMLFdBQVc7WUFDWCxZQUFZO1lBQ1osV0FBVyxFQUFFLElBQUk7U0FDbEIsQ0FBQyxDQUFBO0lBQ0osQ0FBQztJQUVEOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7T0E4Qkc7SUFDSCxLQUFLLENBQUUsTUFBTSxFQUFFLE1BQU0sRUFBRSxPQUFPO1FBQzVCLElBQUksSUFBSSxDQUFDLFdBQVcsRUFBRTtZQUNsQixDQUFDLElBQUksQ0FBQyxhQUFhO1lBQ25CLElBQUksQ0FBQyxRQUFRLENBQUMsTUFBTSxHQUFHLENBQUMsTUFBTSxDQUFDLElBQUksS0FBSyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUU7WUFDOUQsT0FBTTtTQUNQO1FBRUQsS0FBSyxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLE1BQU0sQ0FBQyxDQUFBO1FBRXZDLElBQUksQ0FBQyxNQUFNLEdBQVMsTUFBTSxDQUFBO1FBQzFCLElBQUksQ0FBQyxPQUFPLEdBQVEsT0FBTyxDQUFBO1FBQzNCLElBQUksQ0FBQyxZQUFZLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQztZQUNoQyxXQUFXLEVBQUUsSUFBSTtZQUNqQixLQUFLLEVBQUUsSUFBSSxDQUFDLFNBQVM7WUFDckIsS0FBSyxFQUFFLE9BQU87U0FDZixDQUFDLENBQUE7SUFDSixDQUFDO0lBRUQsV0FBVyxDQUFFLE9BQU8sRUFBRSxLQUFLLEVBQUUsV0FBVztRQUN0QyxJQUFJLENBQUMsSUFBSSxDQUFDLFVBQVUsRUFBRTtZQUNwQixJQUFJLENBQUMsYUFBYSxDQUFDLE9BQU8sRUFBRSxLQUFLLEVBQUUsV0FBVyxFQUFFLEtBQUssQ0FBQyxDQUFBO1lBQ3RELEtBQUssQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxFQUFFLElBQUksQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQTtTQUM5RTtRQUVELE1BQU0sYUFBYSxHQUFHLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUMsS0FBSyxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUNsRCxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxLQUFLLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ2xELElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDLEtBQUssSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDdEQsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLENBQUMsS0FBSyxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUE7UUFFOUUsSUFBSSxFQUFFLENBQUE7UUFDTixJQUFJLEVBQUUsQ0FBQTtRQUVOLHNEQUFzRDtRQUN0RCxJQUFJLElBQUksQ0FBQyxhQUFhLElBQUksQ0FBQyxJQUFJLENBQUMsZUFBZSxFQUFFO1lBQy9DLEVBQUUsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUE7WUFDMUQsRUFBRSxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQTtZQUUxRCxJQUFJLENBQUMsZUFBZSxHQUFHLEtBQUssQ0FBQyxLQUFLLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxHQUFHLElBQUksQ0FBQyxvQkFBb0IsQ0FBQTtTQUN2RTtRQUVELE1BQU0sU0FBUyxHQUFHO1lBQ2hCLE9BQU87WUFDUCxZQUFZLEVBQUUsSUFBSSxDQUFDLGVBQWUsQ0FBQyxPQUFPLENBQUM7WUFDM0MsS0FBSztZQUNMLFdBQVc7WUFDWCxFQUFFO1lBQ0YsRUFBRTtZQUNGLFNBQVMsRUFBRSxhQUFhO1lBQ3hCLFdBQVcsRUFBRSxJQUFJO1NBQ2xCLENBQUE7UUFFRCxJQUFJLENBQUMsYUFBYSxFQUFFO1lBQ2xCLG9EQUFvRDtZQUNwRCxLQUFLLENBQUMsT0FBTyxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLEtBQUssRUFBRSxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFBO1lBQ2xGLEtBQUssQ0FBQyxPQUFPLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxRQUFRLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQTtTQUN4RTtRQUVELElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxTQUFTLENBQUMsQ0FBQTtRQUVyQyxJQUFJLENBQUMsYUFBYSxFQUFFO1lBQ2xCLG1EQUFtRDtZQUNuRCxJQUFJLElBQUksQ0FBQyxXQUFXLEVBQUUsRUFBRTtnQkFDdEIsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQTthQUNyQjtZQUVELElBQUksSUFBSSxDQUFDLGVBQWUsRUFBRTtnQkFDeEIsS0FBSyxDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQTthQUM1RDtTQUNGO0lBQ0gsQ0FBQztJQUVEOzs7Ozs7Ozs7Ozs7Ozs7OztPQWlCRztJQUNILElBQUksQ0FBRSxTQUFTO1FBQ2IsU0FBUyxHQUFHLEtBQUssQ0FBQyxNQUFNLENBQUM7WUFDdkIsT0FBTyxFQUFFLElBQUksQ0FBQyxjQUFjLENBQUMsT0FBTztZQUNwQyxLQUFLLEVBQUUsSUFBSSxDQUFDLGNBQWMsQ0FBQyxLQUFLO1lBQ2hDLFdBQVcsRUFBRSxJQUFJLENBQUMsY0FBYyxDQUFDLFdBQVc7WUFDNUMsV0FBVyxFQUFFLElBQUk7WUFDakIsUUFBUSxFQUFFLEtBQUs7U0FDaEIsRUFBRSxTQUFTLElBQUksRUFBRSxDQUFDLENBQUE7UUFFbkIsU0FBUyxDQUFDLEtBQUssR0FBRyxNQUFNLENBQUE7UUFFeEIsSUFBSSxDQUFDLFFBQVEsQ0FBQyxTQUFTLENBQUMsQ0FBQTtJQUMxQixDQUFDO0lBRUQsNkVBQTZFO0lBQzdFLFNBQVMsQ0FBRSxPQUFPLEVBQUUsS0FBSyxFQUFFLFdBQVcsRUFBRSxjQUFjO1FBQ3BELElBQUksWUFBWSxHQUFHLElBQUksQ0FBQyxlQUFlLENBQUMsT0FBTyxDQUFDLENBQUE7UUFFaEQsSUFBSSxZQUFZLEtBQUssQ0FBQyxDQUFDLEVBQUU7WUFDdkIsWUFBWSxHQUFHLElBQUksQ0FBQyxhQUFhLENBQUMsT0FBTyxFQUFFLEtBQUssRUFBRSxXQUFXLEVBQUUsS0FBSyxDQUFDLENBQUE7U0FDdEU7UUFFRCxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxJQUFJLEVBQUU7WUFDaEUsT0FBTztZQUNQLFlBQVk7WUFDWixLQUFLO1lBQ0wsV0FBVztZQUNYLGNBQWM7WUFDZCxXQUFXLEVBQUUsSUFBSTtTQUNsQixDQUFDLENBQUE7UUFFRixJQUFJLENBQUMsSUFBSSxDQUFDLFVBQVUsRUFBRTtZQUNwQixJQUFJLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFBO1NBQ2hCO1FBRUQsSUFBSSxDQUFDLGFBQWEsR0FBRyxLQUFLLENBQUE7UUFDMUIsSUFBSSxDQUFDLGFBQWEsQ0FBQyxPQUFPLEVBQUUsS0FBSyxDQUFDLENBQUE7SUFDcEMsQ0FBQztJQUVELFlBQVksQ0FBRSxLQUFLO1FBQ2pCLElBQUksQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUE7UUFDZixJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsRUFBRSxLQUFLLEVBQUUsV0FBVyxFQUFFLElBQUksRUFBRSxDQUFDLENBQUE7SUFDMUQsQ0FBQztJQUVEOzs7Ozs7Ozs7Ozs7Ozs7T0FlRztJQUNILEdBQUcsQ0FBRSxLQUFLO1FBQ1IsSUFBSSxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUE7UUFDbkIsS0FBSyxHQUFHLEtBQUssSUFBSSxJQUFJLENBQUMsY0FBYyxDQUFDLEtBQUssQ0FBQTtRQUMxQyxJQUFJLGNBQWMsQ0FBQTtRQUVsQixJQUFJLElBQUksQ0FBQyxXQUFXLEVBQUUsRUFBRTtZQUN0QixjQUFjLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQztnQkFDN0IsS0FBSztnQkFDTCxXQUFXLEVBQUUsSUFBSTtnQkFDakIsS0FBSyxFQUFFLEtBQUs7YUFDYixDQUFDLENBQUE7U0FDSDtRQUVELElBQUksQ0FBQyxPQUFPLEdBQUcsS0FBSyxDQUFBO1FBRXBCLElBQUksY0FBYyxLQUFLLElBQUksRUFBRTtZQUMzQixJQUFJLENBQUMsSUFBSSxFQUFFLENBQUE7U0FDWjtJQUNILENBQUM7SUFFRCxhQUFhO1FBQ1gsT0FBTyxJQUFJLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFBO0lBQ3RELENBQUM7SUFFRCxXQUFXO1FBQ1QsT0FBTyxJQUFJLENBQUMsWUFBWSxDQUFBO0lBQzFCLENBQUM7SUFFRCxNQUFNO0lBQ04sSUFBSTtRQUNGLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxFQUFFLFdBQVcsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFBO1FBRWpELElBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUE7UUFFakMsSUFBSSxDQUFDLFlBQVksR0FBRyxLQUFLLENBQUE7UUFDekIsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUE7SUFDNUMsQ0FBQztJQUVELGVBQWUsQ0FBRSxPQUFPO1FBQ3RCLE1BQU0sU0FBUyxHQUFHLEtBQUssQ0FBQyxPQUFPLENBQUMsWUFBWSxDQUFDLE9BQU8sQ0FBQyxDQUFBO1FBRXJELHVEQUF1RDtRQUN2RCxPQUFPLENBQUMsSUFBSSxDQUFDLFdBQVcsS0FBSyxPQUFPLElBQUksSUFBSSxDQUFDLFdBQVcsS0FBSyxLQUFLLENBQUM7WUFDakUsQ0FBQyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsTUFBTSxHQUFHLENBQUM7WUFDMUIsQ0FBQyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQyxVQUFVLEVBQUUsRUFBRSxDQUFDLFVBQVUsQ0FBQyxFQUFFLEtBQUssU0FBUyxDQUFDLENBQUE7SUFDckYsQ0FBQztJQUVELGNBQWMsQ0FBRSxPQUFPO1FBQ3JCLE9BQU8sSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsZUFBZSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUE7SUFDckQsQ0FBQztJQUVELGFBQWEsQ0FBRSxPQUFPLEVBQUUsS0FBSyxFQUFFLFdBQVcsRUFBRSxJQUFJO1FBQzlDLE1BQU0sRUFBRSxHQUFHLEtBQUssQ0FBQyxPQUFPLENBQUMsWUFBWSxDQUFDLE9BQU8sQ0FBQyxDQUFBO1FBQzlDLElBQUksWUFBWSxHQUFHLElBQUksQ0FBQyxlQUFlLENBQUMsT0FBTyxDQUFDLENBQUE7UUFDaEQsSUFBSSxXQUFXLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxZQUFZLENBQUMsQ0FBQTtRQUU3QyxJQUFJLEdBQUcsSUFBSSxLQUFLLEtBQUs7WUFDbkIsQ0FBQyxDQUFDLEtBQUs7WUFDUCxDQUFDLENBQUMsSUFBSSxJQUFJLGdCQUFnQixDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUE7UUFFN0MsSUFBSSxDQUFDLFdBQVcsRUFBRTtZQUNoQixXQUFXLEdBQUcsSUFBSSxXQUFXLENBQzNCLEVBQUUsRUFDRixPQUFPLEVBQ1AsS0FBSyxFQUNMLElBQUksRUFDSixJQUFJLENBQ0wsQ0FBQTtZQUVELFlBQVksR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQTtZQUNuQyxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQTtTQUNoQzthQUNJO1lBQ0gsV0FBVyxDQUFDLE9BQU8sR0FBRyxPQUFPLENBQUE7U0FDOUI7UUFFRCxJQUFJLElBQUksRUFBRTtZQUNSLElBQUksQ0FBQyxhQUFhLEdBQUcsSUFBSSxDQUFBO1lBRXpCLElBQUksQ0FBQyxJQUFJLENBQUMsV0FBVyxFQUFFLEVBQUU7Z0JBQ3ZCLEtBQUssQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsS0FBSyxFQUFFLElBQUksQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQTtnQkFFL0UsS0FBSyxDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQTtnQkFDNUQsS0FBSyxDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQTtnQkFDN0QsS0FBSyxDQUFDLE9BQU8sQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLFdBQVcsRUFBRSxPQUFPLENBQUMsQ0FBQTtnQkFFdEQsSUFBSSxDQUFDLFNBQVMsR0FBRyxLQUFLLENBQUE7Z0JBQ3RCLFdBQVcsQ0FBQyxRQUFRLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFBO2dCQUNoRCxXQUFXLENBQUMsVUFBVSxHQUFHLFdBQVcsQ0FBQTtnQkFFcEMsSUFBSSxDQUFDLGVBQWUsR0FBRyxLQUFLLENBQUE7YUFDN0I7U0FDRjtRQUVELElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxPQUFPLEVBQUUsS0FBSyxFQUFFLFdBQVcsQ0FBQyxDQUFBO1FBRXRELElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLGdCQUFnQixFQUFFO1lBQ25DLE9BQU87WUFDUCxLQUFLO1lBQ0wsV0FBVztZQUNYLElBQUk7WUFDSixXQUFXO1lBQ1gsWUFBWTtZQUNaLFdBQVcsRUFBRSxJQUFJO1NBQ2xCLENBQUMsQ0FBQTtRQUVGLE9BQU8sWUFBWSxDQUFBO0lBQ3JCLENBQUM7SUFFRCxhQUFhLENBQUUsT0FBTyxFQUFFLEtBQUs7UUFDM0IsTUFBTSxZQUFZLEdBQUcsSUFBSSxDQUFDLGVBQWUsQ0FBQyxPQUFPLENBQUMsQ0FBQTtRQUVsRCxJQUFJLFlBQVksS0FBSyxDQUFDLENBQUMsRUFBRTtZQUFFLE9BQU07U0FBRTtRQUVuQyxNQUFNLFdBQVcsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLFlBQVksQ0FBQyxDQUFBO1FBRS9DLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLGdCQUFnQixFQUFFO1lBQ25DLE9BQU87WUFDUCxLQUFLO1lBQ0wsWUFBWTtZQUNaLFdBQVc7WUFDWCxXQUFXLEVBQUUsSUFBSTtTQUNsQixDQUFDLENBQUE7UUFFRixJQUFJLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxZQUFZLEVBQUUsQ0FBQyxDQUFDLENBQUE7SUFDdkMsQ0FBQztJQUVELG9CQUFvQixDQUFFLE9BQU8sRUFBRSxLQUFLLEVBQUUsV0FBVztRQUMvQyxJQUFJLENBQUMsY0FBYyxDQUFDLE9BQU8sR0FBRyxPQUFPLENBQUE7UUFDckMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxLQUFLLEdBQUcsS0FBSyxDQUFBO1FBQ2pDLElBQUksQ0FBQyxjQUFjLENBQUMsV0FBVyxHQUFHLFdBQVcsQ0FBQTtJQUMvQyxDQUFDO0lBRUQsb0JBQW9CLENBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxNQUFNLEVBQUUsSUFBSTtRQUM5QyxNQUFNLFVBQVUsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQTtRQUVyQyxPQUFPLElBQUksYUFBYSxDQUFDLElBQUksRUFBRSxLQUFLLEVBQUUsVUFBVSxFQUFFLEtBQUssRUFBRSxJQUFJLENBQUMsT0FBa0IsRUFBRSxJQUFJLEVBQUUsTUFBTSxFQUFFLElBQUksQ0FBQyxDQUFBO0lBQ3ZHLENBQUM7SUFFRCxVQUFVLENBQUUsTUFBTTtRQUNoQixJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQTtRQUV4QixJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsSUFBSSxNQUFNLENBQUMsU0FBUyxJQUFJLElBQUksQ0FBQyxTQUFTLENBQUMsU0FBUyxFQUFFO1lBQ25FLElBQUksQ0FBQyxTQUFTLEdBQUcsTUFBTSxDQUFBO1NBQ3hCO0lBQ0gsQ0FBQztJQUVELFFBQVEsQ0FBRSxTQUFTO1FBQ2pCLE1BQU0sRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsR0FBRyxTQUFTLENBQUE7UUFFaEQsSUFBSSxDQUFDLFNBQVMsQ0FBQyxRQUFRLEVBQUU7WUFDdkIsTUFBTSxZQUFZLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsaUJBQWlCLEtBQUssRUFBRSxFQUFFLFNBQVMsQ0FBQyxDQUFBO1lBRTVFLElBQUksWUFBWSxLQUFLLEtBQUssRUFBRTtnQkFDMUIsT0FBTyxLQUFLLENBQUE7YUFDYjtTQUNGO1FBRUQsTUFBTSxNQUFNLEdBQUcsU0FBUyxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUMsb0JBQW9CLENBQUMsS0FBSyxFQUFFLEtBQUssRUFBRSxNQUFNLEVBQUUsSUFBSSxDQUFDLENBQUE7UUFFdkYsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsVUFBVSxLQUFLLEVBQUUsRUFBRSxTQUFTLENBQUMsQ0FBQTtRQUVoRCxJQUFJLENBQUMsVUFBVSxDQUFDLE1BQU0sQ0FBQyxDQUFBO1FBRXZCLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLGdCQUFnQixLQUFLLEVBQUUsRUFBRSxTQUFTLENBQUMsQ0FBQTtRQUV0RCxPQUFPLElBQUksQ0FBQTtJQUNiLENBQUM7Q0FDRjtBQUVELGVBQWUsV0FBVyxDQUFBO0FBQzFCLE9BQU8sRUFBRSxXQUFXLEVBQUUsQ0FBQSIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIHV0aWxzIGZyb20gJ0BpbnRlcmFjdGpzL3V0aWxzJ1xuaW1wb3J0IEludGVyYWN0YWJsZSBmcm9tICcuL0ludGVyYWN0YWJsZSdcbmltcG9ydCBJbnRlcmFjdEV2ZW50IGZyb20gJy4vSW50ZXJhY3RFdmVudCdcbmltcG9ydCBQb2ludGVySW5mbyBmcm9tICcuL1BvaW50ZXJJbmZvJ1xuXG5leHBvcnQgaW50ZXJmYWNlIEFjdGlvbiB7XG4gIG5hbWU6ICdkcmFnJyB8ICdyZXNpemUnIHwgJ2dlc3R1cmUnXG4gIGF4aXM/OiAneCcgfCAneScgfCAneHknXG4gIGVkZ2VzPzogUGFydGlhbDxJbnRlcmFjdC5SZWN0PlxufVxuXG5leHBvcnQgY2xhc3MgSW50ZXJhY3Rpb24ge1xuICAvLyBjdXJyZW50IGludGVyYWN0YWJsZSBiZWluZyBpbnRlcmFjdGVkIHdpdGhcbiAgdGFyZ2V0OiBJbnRlcmFjdGFibGUgPSBudWxsIGFzIGFueVxuXG4gIC8vIHRoZSB0YXJnZXQgZWxlbWVudCBvZiB0aGUgaW50ZXJhY3RhYmxlXG4gIGVsZW1lbnQ6IE5vZGUgPSBudWxsIGFzIGFueVxuXG4gIF9zaWduYWxzOiB1dGlscy5TaWduYWxzXG5cbiAgLy8gYWN0aW9uIHRoYXQncyByZWFkeSB0byBiZSBmaXJlZCBvbiBuZXh0IG1vdmUgZXZlbnRcbiAgcHJlcGFyZWQ6IEFjdGlvbiA9IHtcbiAgICBuYW1lIDogbnVsbCBhcyBhbnksXG4gICAgYXhpcyA6IG51bGwgYXMgYW55LFxuICAgIGVkZ2VzOiBudWxsIGFzIGFueSxcbiAgfVxuXG4gIHBvaW50ZXJUeXBlOiBzdHJpbmdcblxuICAvLyBrZWVwIHRyYWNrIG9mIGFkZGVkIHBvaW50ZXJzXG4gIHBvaW50ZXJzOiBQb2ludGVySW5mb1tdID0gW11cblxuICAvLyBwb2ludGVyZG93bi9tb3VzZWRvd24vdG91Y2hzdGFydCBldmVudFxuICBkb3duRXZlbnQ6IEludGVyYWN0LlBvaW50ZXJFdmVudFR5cGUgPSBudWxsIGFzIGFueVxuXG4gIGRvd25Qb2ludGVyOiBJbnRlcmFjdC5Qb2ludGVyVHlwZSA9IHt9IGFzIEludGVyYWN0LlBvaW50ZXJUeXBlXG5cbiAgX2xhdGVzdFBvaW50ZXI6IHtcbiAgICBwb2ludGVyOiBFdmVudFRhcmdldFxuICAgIGV2ZW50OiBJbnRlcmFjdC5Qb2ludGVyRXZlbnRUeXBlXG4gICAgZXZlbnRUYXJnZXQ6IE5vZGUsXG4gIH0gPSB7XG4gICAgcG9pbnRlcjogbnVsbCBhcyBhbnksXG4gICAgZXZlbnQ6IG51bGwgYXMgYW55LFxuICAgIGV2ZW50VGFyZ2V0OiBudWxsIGFzIGFueSxcbiAgfVxuXG4gIC8vIHByZXZpb3VzIGFjdGlvbiBldmVudFxuICBwcmV2RXZlbnQ6IEludGVyYWN0RXZlbnQgPSBudWxsIGFzIGFueVxuXG4gIHBvaW50ZXJJc0Rvd24gPSBmYWxzZVxuICBwb2ludGVyV2FzTW92ZWQgPSBmYWxzZVxuICBfaW50ZXJhY3RpbmcgPSBmYWxzZVxuICBfZW5kaW5nID0gZmFsc2VcblxuICBzaW11bGF0aW9uID0gbnVsbFxuXG4gIGdldCBwb2ludGVyTW92ZVRvbGVyYW5jZSAoKSB7XG4gICAgcmV0dXJuIDFcbiAgfVxuXG4gIC8qKlxuICAgKiBAYWxpYXMgSW50ZXJhY3Rpb24ucHJvdG90eXBlLm1vdmVcbiAgICovXG4gIGRvTW92ZSA9IHV0aWxzLndhcm5PbmNlKFxuICAgIGZ1bmN0aW9uICh0aGlzOiBJbnRlcmFjdGlvbiwgc2lnbmFsQXJnOiBhbnkpIHtcbiAgICAgIHRoaXMubW92ZShzaWduYWxBcmcpXG4gICAgfSxcbiAgICAnVGhlIGludGVyYWN0aW9uLmRvTW92ZSgpIG1ldGhvZCBoYXMgYmVlbiByZW5hbWVkIHRvIGludGVyYWN0aW9uLm1vdmUoKScpXG5cbiAgY29vcmRzID0ge1xuICAgIC8vIFN0YXJ0aW5nIEludGVyYWN0RXZlbnQgcG9pbnRlciBjb29yZGluYXRlc1xuICAgIHN0YXJ0OiB1dGlscy5wb2ludGVyLm5ld0Nvb3JkcygpLFxuICAgIC8vIFByZXZpb3VzIG5hdGl2ZSBwb2ludGVyIG1vdmUgZXZlbnQgY29vcmRpbmF0ZXNcbiAgICBwcmV2OiB1dGlscy5wb2ludGVyLm5ld0Nvb3JkcygpLFxuICAgIC8vIGN1cnJlbnQgbmF0aXZlIHBvaW50ZXIgbW92ZSBldmVudCBjb29yZGluYXRlc1xuICAgIGN1cjogdXRpbHMucG9pbnRlci5uZXdDb29yZHMoKSxcbiAgICAvLyBDaGFuZ2UgaW4gY29vcmRpbmF0ZXMgYW5kIHRpbWUgb2YgdGhlIHBvaW50ZXJcbiAgICBkZWx0YTogdXRpbHMucG9pbnRlci5uZXdDb29yZHMoKSxcbiAgICAvLyBwb2ludGVyIHZlbG9jaXR5XG4gICAgdmVsb2NpdHk6IHV0aWxzLnBvaW50ZXIubmV3Q29vcmRzKCksXG4gIH1cblxuICAvKiogKi9cbiAgY29uc3RydWN0b3IgKHsgcG9pbnRlclR5cGUsIHNpZ25hbHMgfTogeyBwb2ludGVyVHlwZTogc3RyaW5nLCBzaWduYWxzOiB1dGlscy5TaWduYWxzIH0pIHtcbiAgICB0aGlzLl9zaWduYWxzID0gc2lnbmFsc1xuICAgIHRoaXMucG9pbnRlclR5cGUgPSBwb2ludGVyVHlwZVxuXG4gICAgdGhpcy5fc2lnbmFscy5maXJlKCduZXcnLCB0aGlzKVxuICB9XG5cbiAgcG9pbnRlckRvd24gKHBvaW50ZXIsIGV2ZW50LCBldmVudFRhcmdldCkge1xuICAgIGNvbnN0IHBvaW50ZXJJbmRleCA9IHRoaXMudXBkYXRlUG9pbnRlcihwb2ludGVyLCBldmVudCwgZXZlbnRUYXJnZXQsIHRydWUpXG5cbiAgICB0aGlzLl9zaWduYWxzLmZpcmUoJ2Rvd24nLCB7XG4gICAgICBwb2ludGVyLFxuICAgICAgZXZlbnQsXG4gICAgICBldmVudFRhcmdldCxcbiAgICAgIHBvaW50ZXJJbmRleCxcbiAgICAgIGludGVyYWN0aW9uOiB0aGlzLFxuICAgIH0pXG4gIH1cblxuICAvKipcbiAgICogYGBganNcbiAgICogaW50ZXJhY3QodGFyZ2V0KVxuICAgKiAgIC5kcmFnZ2FibGUoe1xuICAgKiAgICAgLy8gZGlzYWJsZSB0aGUgZGVmYXVsdCBkcmFnIHN0YXJ0IGJ5IGRvd24tPm1vdmVcbiAgICogICAgIG1hbnVhbFN0YXJ0OiB0cnVlXG4gICAqICAgfSlcbiAgICogICAvLyBzdGFydCBkcmFnZ2luZyBhZnRlciB0aGUgdXNlciBob2xkcyB0aGUgcG9pbnRlciBkb3duXG4gICAqICAgLm9uKCdob2xkJywgZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAqICAgICB2YXIgaW50ZXJhY3Rpb24gPSBldmVudC5pbnRlcmFjdGlvbjtcbiAgICpcbiAgICogICAgIGlmICghaW50ZXJhY3Rpb24uaW50ZXJhY3RpbmcoKSkge1xuICAgKiAgICAgICBpbnRlcmFjdGlvbi5zdGFydCh7IG5hbWU6ICdkcmFnJyB9LFxuICAgKiAgICAgICAgICAgICAgICAgICAgICAgICBldmVudC5pbnRlcmFjdGFibGUsXG4gICAqICAgICAgICAgICAgICAgICAgICAgICAgIGV2ZW50LmN1cnJlbnRUYXJnZXQpO1xuICAgKiAgICAgfVxuICAgKiB9KTtcbiAgICogYGBgXG4gICAqXG4gICAqIFN0YXJ0IGFuIGFjdGlvbiB3aXRoIHRoZSBnaXZlbiBJbnRlcmFjdGFibGUgYW5kIEVsZW1lbnQgYXMgdGFydGdldHMuIFRoZVxuICAgKiBhY3Rpb24gbXVzdCBiZSBlbmFibGVkIGZvciB0aGUgdGFyZ2V0IEludGVyYWN0YWJsZSBhbmQgYW4gYXBwcm9wcmlhdGVcbiAgICogbnVtYmVyIG9mIHBvaW50ZXJzIG11c3QgYmUgaGVsZCBkb3duIC0gMSBmb3IgZHJhZy9yZXNpemUsIDIgZm9yIGdlc3R1cmUuXG4gICAqXG4gICAqIFVzZSBpdCB3aXRoIGBpbnRlcmFjdGFibGUuPGFjdGlvbj5hYmxlKHsgbWFudWFsU3RhcnQ6IGZhbHNlIH0pYCB0byBhbHdheXNcbiAgICogW3N0YXJ0IGFjdGlvbnMgbWFudWFsbHldKGh0dHBzOi8vZ2l0aHViLmNvbS90YXllL2ludGVyYWN0LmpzL2lzc3Vlcy8xMTQpXG4gICAqXG4gICAqIEBwYXJhbSB7b2JqZWN0fSBhY3Rpb24gICBUaGUgYWN0aW9uIHRvIGJlIHBlcmZvcm1lZCAtIGRyYWcsIHJlc2l6ZSwgZXRjLlxuICAgKiBAcGFyYW0ge0ludGVyYWN0YWJsZX0gdGFyZ2V0ICBUaGUgSW50ZXJhY3RhYmxlIHRvIHRhcmdldFxuICAgKiBAcGFyYW0ge0VsZW1lbnR9IGVsZW1lbnQgVGhlIERPTSBFbGVtZW50IHRvIHRhcmdldFxuICAgKiBAcmV0dXJuIHtvYmplY3R9IGludGVyYWN0XG4gICAqL1xuICBzdGFydCAoYWN0aW9uLCB0YXJnZXQsIGVsZW1lbnQpIHtcbiAgICBpZiAodGhpcy5pbnRlcmFjdGluZygpIHx8XG4gICAgICAgICF0aGlzLnBvaW50ZXJJc0Rvd24gfHxcbiAgICAgICAgdGhpcy5wb2ludGVycy5sZW5ndGggPCAoYWN0aW9uLm5hbWUgPT09ICdnZXN0dXJlJyA/IDIgOiAxKSkge1xuICAgICAgcmV0dXJuXG4gICAgfVxuXG4gICAgdXRpbHMuY29weUFjdGlvbih0aGlzLnByZXBhcmVkLCBhY3Rpb24pXG5cbiAgICB0aGlzLnRhcmdldCAgICAgICA9IHRhcmdldFxuICAgIHRoaXMuZWxlbWVudCAgICAgID0gZWxlbWVudFxuICAgIHRoaXMuX2ludGVyYWN0aW5nID0gdGhpcy5fZG9QaGFzZSh7XG4gICAgICBpbnRlcmFjdGlvbjogdGhpcyxcbiAgICAgIGV2ZW50OiB0aGlzLmRvd25FdmVudCxcbiAgICAgIHBoYXNlOiAnc3RhcnQnLFxuICAgIH0pXG4gIH1cblxuICBwb2ludGVyTW92ZSAocG9pbnRlciwgZXZlbnQsIGV2ZW50VGFyZ2V0KSB7XG4gICAgaWYgKCF0aGlzLnNpbXVsYXRpb24pIHtcbiAgICAgIHRoaXMudXBkYXRlUG9pbnRlcihwb2ludGVyLCBldmVudCwgZXZlbnRUYXJnZXQsIGZhbHNlKVxuICAgICAgdXRpbHMucG9pbnRlci5zZXRDb29yZHModGhpcy5jb29yZHMuY3VyLCB0aGlzLnBvaW50ZXJzLm1hcCgocCkgPT4gcC5wb2ludGVyKSlcbiAgICB9XG5cbiAgICBjb25zdCBkdXBsaWNhdGVNb3ZlID0gKHRoaXMuY29vcmRzLmN1ci5wYWdlLnggPT09IHRoaXMuY29vcmRzLnByZXYucGFnZS54ICYmXG4gICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmNvb3Jkcy5jdXIucGFnZS55ID09PSB0aGlzLmNvb3Jkcy5wcmV2LnBhZ2UueSAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5jb29yZHMuY3VyLmNsaWVudC54ID09PSB0aGlzLmNvb3Jkcy5wcmV2LmNsaWVudC54ICYmXG4gICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmNvb3Jkcy5jdXIuY2xpZW50LnkgPT09IHRoaXMuY29vcmRzLnByZXYuY2xpZW50LnkpXG5cbiAgICBsZXQgZHhcbiAgICBsZXQgZHlcblxuICAgIC8vIHJlZ2lzdGVyIG1vdmVtZW50IGdyZWF0ZXIgdGhhbiBwb2ludGVyTW92ZVRvbGVyYW5jZVxuICAgIGlmICh0aGlzLnBvaW50ZXJJc0Rvd24gJiYgIXRoaXMucG9pbnRlcldhc01vdmVkKSB7XG4gICAgICBkeCA9IHRoaXMuY29vcmRzLmN1ci5jbGllbnQueCAtIHRoaXMuY29vcmRzLnN0YXJ0LmNsaWVudC54XG4gICAgICBkeSA9IHRoaXMuY29vcmRzLmN1ci5jbGllbnQueSAtIHRoaXMuY29vcmRzLnN0YXJ0LmNsaWVudC55XG5cbiAgICAgIHRoaXMucG9pbnRlcldhc01vdmVkID0gdXRpbHMuaHlwb3QoZHgsIGR5KSA+IHRoaXMucG9pbnRlck1vdmVUb2xlcmFuY2VcbiAgICB9XG5cbiAgICBjb25zdCBzaWduYWxBcmcgPSB7XG4gICAgICBwb2ludGVyLFxuICAgICAgcG9pbnRlckluZGV4OiB0aGlzLmdldFBvaW50ZXJJbmRleChwb2ludGVyKSxcbiAgICAgIGV2ZW50LFxuICAgICAgZXZlbnRUYXJnZXQsXG4gICAgICBkeCxcbiAgICAgIGR5LFxuICAgICAgZHVwbGljYXRlOiBkdXBsaWNhdGVNb3ZlLFxuICAgICAgaW50ZXJhY3Rpb246IHRoaXMsXG4gICAgfVxuXG4gICAgaWYgKCFkdXBsaWNhdGVNb3ZlKSB7XG4gICAgICAvLyBzZXQgcG9pbnRlciBjb29yZGluYXRlLCB0aW1lIGNoYW5nZXMgYW5kIHZlbG9jaXR5XG4gICAgICB1dGlscy5wb2ludGVyLnNldENvb3JkRGVsdGFzKHRoaXMuY29vcmRzLmRlbHRhLCB0aGlzLmNvb3Jkcy5wcmV2LCB0aGlzLmNvb3Jkcy5jdXIpXG4gICAgICB1dGlscy5wb2ludGVyLnNldENvb3JkVmVsb2NpdHkodGhpcy5jb29yZHMudmVsb2NpdHksIHRoaXMuY29vcmRzLmRlbHRhKVxuICAgIH1cblxuICAgIHRoaXMuX3NpZ25hbHMuZmlyZSgnbW92ZScsIHNpZ25hbEFyZylcblxuICAgIGlmICghZHVwbGljYXRlTW92ZSkge1xuICAgICAgLy8gaWYgaW50ZXJhY3RpbmcsIGZpcmUgYW4gJ2FjdGlvbi1tb3ZlJyBzaWduYWwgZXRjXG4gICAgICBpZiAodGhpcy5pbnRlcmFjdGluZygpKSB7XG4gICAgICAgIHRoaXMubW92ZShzaWduYWxBcmcpXG4gICAgICB9XG5cbiAgICAgIGlmICh0aGlzLnBvaW50ZXJXYXNNb3ZlZCkge1xuICAgICAgICB1dGlscy5wb2ludGVyLmNvcHlDb29yZHModGhpcy5jb29yZHMucHJldiwgdGhpcy5jb29yZHMuY3VyKVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBgYGBqc1xuICAgKiBpbnRlcmFjdCh0YXJnZXQpXG4gICAqICAgLmRyYWdnYWJsZSh0cnVlKVxuICAgKiAgIC5vbignZHJhZ21vdmUnLCBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICogICAgIGlmIChzb21lQ29uZGl0aW9uKSB7XG4gICAqICAgICAgIC8vIGNoYW5nZSB0aGUgc25hcCBzZXR0aW5nc1xuICAgKiAgICAgICBldmVudC5pbnRlcmFjdGFibGUuZHJhZ2dhYmxlKHsgc25hcDogeyB0YXJnZXRzOiBbXSB9fSk7XG4gICAqICAgICAgIC8vIGZpcmUgYW5vdGhlciBtb3ZlIGV2ZW50IHdpdGggcmUtY2FsY3VsYXRlZCBzbmFwXG4gICAqICAgICAgIGV2ZW50LmludGVyYWN0aW9uLm1vdmUoKTtcbiAgICogICAgIH1cbiAgICogICB9KTtcbiAgICogYGBgXG4gICAqXG4gICAqIEZvcmNlIGEgbW92ZSBvZiB0aGUgY3VycmVudCBhY3Rpb24gYXQgdGhlIHNhbWUgY29vcmRpbmF0ZXMuIFVzZWZ1bCBpZlxuICAgKiBzbmFwL3Jlc3RyaWN0IGhhcyBiZWVuIGNoYW5nZWQgYW5kIHlvdSB3YW50IGEgbW92ZW1lbnQgd2l0aCB0aGUgbmV3XG4gICAqIHNldHRpbmdzLlxuICAgKi9cbiAgbW92ZSAoc2lnbmFsQXJnKSB7XG4gICAgc2lnbmFsQXJnID0gdXRpbHMuZXh0ZW5kKHtcbiAgICAgIHBvaW50ZXI6IHRoaXMuX2xhdGVzdFBvaW50ZXIucG9pbnRlcixcbiAgICAgIGV2ZW50OiB0aGlzLl9sYXRlc3RQb2ludGVyLmV2ZW50LFxuICAgICAgZXZlbnRUYXJnZXQ6IHRoaXMuX2xhdGVzdFBvaW50ZXIuZXZlbnRUYXJnZXQsXG4gICAgICBpbnRlcmFjdGlvbjogdGhpcyxcbiAgICAgIG5vQmVmb3JlOiBmYWxzZSxcbiAgICB9LCBzaWduYWxBcmcgfHwge30pXG5cbiAgICBzaWduYWxBcmcucGhhc2UgPSAnbW92ZSdcblxuICAgIHRoaXMuX2RvUGhhc2Uoc2lnbmFsQXJnKVxuICB9XG5cbiAgLy8gRW5kIGludGVyYWN0IG1vdmUgZXZlbnRzIGFuZCBzdG9wIGF1dG8tc2Nyb2xsIHVubGVzcyBzaW11bGF0aW9uIGlzIHJ1bm5pbmdcbiAgcG9pbnRlclVwIChwb2ludGVyLCBldmVudCwgZXZlbnRUYXJnZXQsIGN1ckV2ZW50VGFyZ2V0KSB7XG4gICAgbGV0IHBvaW50ZXJJbmRleCA9IHRoaXMuZ2V0UG9pbnRlckluZGV4KHBvaW50ZXIpXG5cbiAgICBpZiAocG9pbnRlckluZGV4ID09PSAtMSkge1xuICAgICAgcG9pbnRlckluZGV4ID0gdGhpcy51cGRhdGVQb2ludGVyKHBvaW50ZXIsIGV2ZW50LCBldmVudFRhcmdldCwgZmFsc2UpXG4gICAgfVxuXG4gICAgdGhpcy5fc2lnbmFscy5maXJlKC9jYW5jZWwkL2kudGVzdChldmVudC50eXBlKSA/ICdjYW5jZWwnIDogJ3VwJywge1xuICAgICAgcG9pbnRlcixcbiAgICAgIHBvaW50ZXJJbmRleCxcbiAgICAgIGV2ZW50LFxuICAgICAgZXZlbnRUYXJnZXQsXG4gICAgICBjdXJFdmVudFRhcmdldCxcbiAgICAgIGludGVyYWN0aW9uOiB0aGlzLFxuICAgIH0pXG5cbiAgICBpZiAoIXRoaXMuc2ltdWxhdGlvbikge1xuICAgICAgdGhpcy5lbmQoZXZlbnQpXG4gICAgfVxuXG4gICAgdGhpcy5wb2ludGVySXNEb3duID0gZmFsc2VcbiAgICB0aGlzLnJlbW92ZVBvaW50ZXIocG9pbnRlciwgZXZlbnQpXG4gIH1cblxuICBkb2N1bWVudEJsdXIgKGV2ZW50KSB7XG4gICAgdGhpcy5lbmQoZXZlbnQpXG4gICAgdGhpcy5fc2lnbmFscy5maXJlKCdibHVyJywgeyBldmVudCwgaW50ZXJhY3Rpb246IHRoaXMgfSlcbiAgfVxuXG4gIC8qKlxuICAgKiBgYGBqc1xuICAgKiBpbnRlcmFjdCh0YXJnZXQpXG4gICAqICAgLmRyYWdnYWJsZSh0cnVlKVxuICAgKiAgIC5vbignbW92ZScsIGZ1bmN0aW9uIChldmVudCkge1xuICAgKiAgICAgaWYgKGV2ZW50LnBhZ2VYID4gMTAwMCkge1xuICAgKiAgICAgICAvLyBlbmQgdGhlIGN1cnJlbnQgYWN0aW9uXG4gICAqICAgICAgIGV2ZW50LmludGVyYWN0aW9uLmVuZCgpO1xuICAgKiAgICAgICAvLyBzdG9wIGFsbCBmdXJ0aGVyIGxpc3RlbmVycyBmcm9tIGJlaW5nIGNhbGxlZFxuICAgKiAgICAgICBldmVudC5zdG9wSW1tZWRpYXRlUHJvcGFnYXRpb24oKTtcbiAgICogICAgIH1cbiAgICogICB9KTtcbiAgICogYGBgXG4gICAqXG4gICAqIEBwYXJhbSB7UG9pbnRlckV2ZW50fSBbZXZlbnRdXG4gICAqL1xuICBlbmQgKGV2ZW50KSB7XG4gICAgdGhpcy5fZW5kaW5nID0gdHJ1ZVxuICAgIGV2ZW50ID0gZXZlbnQgfHwgdGhpcy5fbGF0ZXN0UG9pbnRlci5ldmVudFxuICAgIGxldCBlbmRQaGFzZVJlc3VsdFxuXG4gICAgaWYgKHRoaXMuaW50ZXJhY3RpbmcoKSkge1xuICAgICAgZW5kUGhhc2VSZXN1bHQgPSB0aGlzLl9kb1BoYXNlKHtcbiAgICAgICAgZXZlbnQsXG4gICAgICAgIGludGVyYWN0aW9uOiB0aGlzLFxuICAgICAgICBwaGFzZTogJ2VuZCcsXG4gICAgICB9KVxuICAgIH1cblxuICAgIHRoaXMuX2VuZGluZyA9IGZhbHNlXG5cbiAgICBpZiAoZW5kUGhhc2VSZXN1bHQgPT09IHRydWUpIHtcbiAgICAgIHRoaXMuc3RvcCgpXG4gICAgfVxuICB9XG5cbiAgY3VycmVudEFjdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXMuX2ludGVyYWN0aW5nID8gdGhpcy5wcmVwYXJlZC5uYW1lIDogbnVsbFxuICB9XG5cbiAgaW50ZXJhY3RpbmcgKCkge1xuICAgIHJldHVybiB0aGlzLl9pbnRlcmFjdGluZ1xuICB9XG5cbiAgLyoqICovXG4gIHN0b3AgKCkge1xuICAgIHRoaXMuX3NpZ25hbHMuZmlyZSgnc3RvcCcsIHsgaW50ZXJhY3Rpb246IHRoaXMgfSlcblxuICAgIHRoaXMudGFyZ2V0ID0gdGhpcy5lbGVtZW50ID0gbnVsbFxuXG4gICAgdGhpcy5faW50ZXJhY3RpbmcgPSBmYWxzZVxuICAgIHRoaXMucHJlcGFyZWQubmFtZSA9IHRoaXMucHJldkV2ZW50ID0gbnVsbFxuICB9XG5cbiAgZ2V0UG9pbnRlckluZGV4IChwb2ludGVyKSB7XG4gICAgY29uc3QgcG9pbnRlcklkID0gdXRpbHMucG9pbnRlci5nZXRQb2ludGVySWQocG9pbnRlcilcblxuICAgIC8vIG1vdXNlIGFuZCBwZW4gaW50ZXJhY3Rpb25zIG1heSBoYXZlIG9ubHkgb25lIHBvaW50ZXJcbiAgICByZXR1cm4gKHRoaXMucG9pbnRlclR5cGUgPT09ICdtb3VzZScgfHwgdGhpcy5wb2ludGVyVHlwZSA9PT0gJ3BlbicpXG4gICAgICA/IHRoaXMucG9pbnRlcnMubGVuZ3RoIC0gMVxuICAgICAgOiB1dGlscy5hcnIuZmluZEluZGV4KHRoaXMucG9pbnRlcnMsIChjdXJQb2ludGVyKSA9PiBjdXJQb2ludGVyLmlkID09PSBwb2ludGVySWQpXG4gIH1cblxuICBnZXRQb2ludGVySW5mbyAocG9pbnRlcikge1xuICAgIHJldHVybiB0aGlzLnBvaW50ZXJzW3RoaXMuZ2V0UG9pbnRlckluZGV4KHBvaW50ZXIpXVxuICB9XG5cbiAgdXBkYXRlUG9pbnRlciAocG9pbnRlciwgZXZlbnQsIGV2ZW50VGFyZ2V0LCBkb3duKSB7XG4gICAgY29uc3QgaWQgPSB1dGlscy5wb2ludGVyLmdldFBvaW50ZXJJZChwb2ludGVyKVxuICAgIGxldCBwb2ludGVySW5kZXggPSB0aGlzLmdldFBvaW50ZXJJbmRleChwb2ludGVyKVxuICAgIGxldCBwb2ludGVySW5mbyA9IHRoaXMucG9pbnRlcnNbcG9pbnRlckluZGV4XVxuXG4gICAgZG93biA9IGRvd24gPT09IGZhbHNlXG4gICAgICA/IGZhbHNlXG4gICAgICA6IGRvd24gfHwgLyhkb3dufHN0YXJ0KSQvaS50ZXN0KGV2ZW50LnR5cGUpXG5cbiAgICBpZiAoIXBvaW50ZXJJbmZvKSB7XG4gICAgICBwb2ludGVySW5mbyA9IG5ldyBQb2ludGVySW5mbyhcbiAgICAgICAgaWQsXG4gICAgICAgIHBvaW50ZXIsXG4gICAgICAgIGV2ZW50LFxuICAgICAgICBudWxsLFxuICAgICAgICBudWxsLFxuICAgICAgKVxuXG4gICAgICBwb2ludGVySW5kZXggPSB0aGlzLnBvaW50ZXJzLmxlbmd0aFxuICAgICAgdGhpcy5wb2ludGVycy5wdXNoKHBvaW50ZXJJbmZvKVxuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIHBvaW50ZXJJbmZvLnBvaW50ZXIgPSBwb2ludGVyXG4gICAgfVxuXG4gICAgaWYgKGRvd24pIHtcbiAgICAgIHRoaXMucG9pbnRlcklzRG93biA9IHRydWVcblxuICAgICAgaWYgKCF0aGlzLmludGVyYWN0aW5nKCkpIHtcbiAgICAgICAgdXRpbHMucG9pbnRlci5zZXRDb29yZHModGhpcy5jb29yZHMuc3RhcnQsIHRoaXMucG9pbnRlcnMubWFwKChwKSA9PiBwLnBvaW50ZXIpKVxuXG4gICAgICAgIHV0aWxzLnBvaW50ZXIuY29weUNvb3Jkcyh0aGlzLmNvb3Jkcy5jdXIsIHRoaXMuY29vcmRzLnN0YXJ0KVxuICAgICAgICB1dGlscy5wb2ludGVyLmNvcHlDb29yZHModGhpcy5jb29yZHMucHJldiwgdGhpcy5jb29yZHMuc3RhcnQpXG4gICAgICAgIHV0aWxzLnBvaW50ZXIucG9pbnRlckV4dGVuZCh0aGlzLmRvd25Qb2ludGVyLCBwb2ludGVyKVxuXG4gICAgICAgIHRoaXMuZG93bkV2ZW50ID0gZXZlbnRcbiAgICAgICAgcG9pbnRlckluZm8uZG93blRpbWUgPSB0aGlzLmNvb3Jkcy5jdXIudGltZVN0YW1wXG4gICAgICAgIHBvaW50ZXJJbmZvLmRvd25UYXJnZXQgPSBldmVudFRhcmdldFxuXG4gICAgICAgIHRoaXMucG9pbnRlcldhc01vdmVkID0gZmFsc2VcbiAgICAgIH1cbiAgICB9XG5cbiAgICB0aGlzLl91cGRhdGVMYXRlc3RQb2ludGVyKHBvaW50ZXIsIGV2ZW50LCBldmVudFRhcmdldClcblxuICAgIHRoaXMuX3NpZ25hbHMuZmlyZSgndXBkYXRlLXBvaW50ZXInLCB7XG4gICAgICBwb2ludGVyLFxuICAgICAgZXZlbnQsXG4gICAgICBldmVudFRhcmdldCxcbiAgICAgIGRvd24sXG4gICAgICBwb2ludGVySW5mbyxcbiAgICAgIHBvaW50ZXJJbmRleCxcbiAgICAgIGludGVyYWN0aW9uOiB0aGlzLFxuICAgIH0pXG5cbiAgICByZXR1cm4gcG9pbnRlckluZGV4XG4gIH1cblxuICByZW1vdmVQb2ludGVyIChwb2ludGVyLCBldmVudCkge1xuICAgIGNvbnN0IHBvaW50ZXJJbmRleCA9IHRoaXMuZ2V0UG9pbnRlckluZGV4KHBvaW50ZXIpXG5cbiAgICBpZiAocG9pbnRlckluZGV4ID09PSAtMSkgeyByZXR1cm4gfVxuXG4gICAgY29uc3QgcG9pbnRlckluZm8gPSB0aGlzLnBvaW50ZXJzW3BvaW50ZXJJbmRleF1cblxuICAgIHRoaXMuX3NpZ25hbHMuZmlyZSgncmVtb3ZlLXBvaW50ZXInLCB7XG4gICAgICBwb2ludGVyLFxuICAgICAgZXZlbnQsXG4gICAgICBwb2ludGVySW5kZXgsXG4gICAgICBwb2ludGVySW5mbyxcbiAgICAgIGludGVyYWN0aW9uOiB0aGlzLFxuICAgIH0pXG5cbiAgICB0aGlzLnBvaW50ZXJzLnNwbGljZShwb2ludGVySW5kZXgsIDEpXG4gIH1cblxuICBfdXBkYXRlTGF0ZXN0UG9pbnRlciAocG9pbnRlciwgZXZlbnQsIGV2ZW50VGFyZ2V0KSB7XG4gICAgdGhpcy5fbGF0ZXN0UG9pbnRlci5wb2ludGVyID0gcG9pbnRlclxuICAgIHRoaXMuX2xhdGVzdFBvaW50ZXIuZXZlbnQgPSBldmVudFxuICAgIHRoaXMuX2xhdGVzdFBvaW50ZXIuZXZlbnRUYXJnZXQgPSBldmVudFRhcmdldFxuICB9XG5cbiAgX2NyZWF0ZVByZXBhcmVkRXZlbnQgKGV2ZW50LCBwaGFzZSwgcHJlRW5kLCB0eXBlKSB7XG4gICAgY29uc3QgYWN0aW9uTmFtZSA9IHRoaXMucHJlcGFyZWQubmFtZVxuXG4gICAgcmV0dXJuIG5ldyBJbnRlcmFjdEV2ZW50KHRoaXMsIGV2ZW50LCBhY3Rpb25OYW1lLCBwaGFzZSwgdGhpcy5lbGVtZW50IGFzIEVsZW1lbnQsIG51bGwsIHByZUVuZCwgdHlwZSlcbiAgfVxuXG4gIF9maXJlRXZlbnQgKGlFdmVudCkge1xuICAgIHRoaXMudGFyZ2V0LmZpcmUoaUV2ZW50KVxuXG4gICAgaWYgKCF0aGlzLnByZXZFdmVudCB8fCBpRXZlbnQudGltZVN0YW1wID49IHRoaXMucHJldkV2ZW50LnRpbWVTdGFtcCkge1xuICAgICAgdGhpcy5wcmV2RXZlbnQgPSBpRXZlbnRcbiAgICB9XG4gIH1cblxuICBfZG9QaGFzZSAoc2lnbmFsQXJnKSB7XG4gICAgY29uc3QgeyBldmVudCwgcGhhc2UsIHByZUVuZCwgdHlwZSB9ID0gc2lnbmFsQXJnXG5cbiAgICBpZiAoIXNpZ25hbEFyZy5ub0JlZm9yZSkge1xuICAgICAgY29uc3QgYmVmb3JlUmVzdWx0ID0gdGhpcy5fc2lnbmFscy5maXJlKGBiZWZvcmUtYWN0aW9uLSR7cGhhc2V9YCwgc2lnbmFsQXJnKVxuXG4gICAgICBpZiAoYmVmb3JlUmVzdWx0ID09PSBmYWxzZSkge1xuICAgICAgICByZXR1cm4gZmFsc2VcbiAgICAgIH1cbiAgICB9XG5cbiAgICBjb25zdCBpRXZlbnQgPSBzaWduYWxBcmcuaUV2ZW50ID0gdGhpcy5fY3JlYXRlUHJlcGFyZWRFdmVudChldmVudCwgcGhhc2UsIHByZUVuZCwgdHlwZSlcblxuICAgIHRoaXMuX3NpZ25hbHMuZmlyZShgYWN0aW9uLSR7cGhhc2V9YCwgc2lnbmFsQXJnKVxuXG4gICAgdGhpcy5fZmlyZUV2ZW50KGlFdmVudClcblxuICAgIHRoaXMuX3NpZ25hbHMuZmlyZShgYWZ0ZXItYWN0aW9uLSR7cGhhc2V9YCwgc2lnbmFsQXJnKVxuXG4gICAgcmV0dXJuIHRydWVcbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBJbnRlcmFjdGlvblxuZXhwb3J0IHsgUG9pbnRlckluZm8gfVxuIl19