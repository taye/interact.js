import test from '@interactjs/_dev/test/test';
import pointerUtils from '@interactjs/utils/pointerUtils';
import Signals from '@interactjs/utils/Signals';
import InteractEvent from './InteractEvent';
import Interaction from './Interaction';
import * as helpers from './tests/_helpers';
const makeInteractionAndSignals = () => new Interaction({ signals: new Signals() });
test('Interaction constructor', (t) => {
    const testType = 'test';
    const signals = new Signals();
    const interaction = new Interaction({
        pointerType: testType,
        signals,
    });
    const zeroCoords = {
        page: { x: 0, y: 0 },
        client: { x: 0, y: 0 },
        timeStamp: 0,
    };
    t.equal(interaction._signals, signals, 'signals option is set assigned to interaction._signals');
    t.ok(interaction.prepared instanceof Object, 'interaction.prepared is an object');
    t.ok(interaction.downPointer instanceof Object, 'interaction.downPointer is an object');
    for (const coordField in interaction.coords) {
        t.deepEqual(interaction.coords[coordField], zeroCoords, `interaction.coords.${coordField} set to zero`);
    }
    t.equal(interaction.pointerType, testType, 'interaction.pointerType is set');
    // pointerInfo properties
    t.deepEqual(interaction.pointers, [], 'interaction.pointers is initially an empty array');
    // false properties
    for (const prop of 'pointerIsDown pointerWasMoved _interacting mouse'.split(' ')) {
        t.notOk(interaction[prop], `interaction.${prop} is false`);
    }
    t.end();
});
test('Interaction destroy', (t) => {
    const interaction = makeInteractionAndSignals();
    const pointer = { pointerId: 10 };
    const event = {};
    interaction.updatePointer(pointer, event, null);
    interaction.destroy();
    t.strictEqual(interaction._latestPointer.pointer, null, 'interaction._latestPointer.pointer is null');
    t.strictEqual(interaction._latestPointer.event, null, 'interaction._latestPointer.event is null');
    t.strictEqual(interaction._latestPointer.eventTarget, null, 'interaction._latestPointer.eventTarget is null');
    t.end();
});
test('Interaction.getPointerIndex', (t) => {
    const interaction = makeInteractionAndSignals();
    interaction.pointers = [2, 4, 5, 0, -1].map((id) => ({ id }));
    interaction.pointers.forEach(({ id }, index) => {
        t.equal(interaction.getPointerIndex({ pointerId: id }), index);
    });
    t.end();
});
test('Interaction.updatePointer', (t) => {
    t.test('no existing pointers', (st) => {
        const interaction = makeInteractionAndSignals();
        const pointer = { pointerId: 10 };
        const event = {};
        const ret = interaction.updatePointer(pointer, event, null);
        st.deepEqual(interaction.pointers, [{
                id: pointer.pointerId,
                pointer,
                event,
                downTime: null,
                downTarget: null,
            }], 'interaction.pointers == [{ pointer, ... }]');
        st.equal(ret, 0, 'new pointer index is returned');
        st.end();
    });
    t.test('new pointer with exisiting pointer', (st) => {
        const interaction = makeInteractionAndSignals();
        const existing = { pointerId: 0 };
        const event = {};
        interaction.updatePointer(existing, event, null);
        const newPointer = { pointerId: 10 };
        const ret = interaction.updatePointer(newPointer, event, null);
        st.deepEqual(interaction.pointers, [
            {
                id: existing.pointerId,
                pointer: existing,
                event,
                downTime: null,
                downTarget: null,
            },
            {
                id: newPointer.pointerId,
                pointer: newPointer,
                event,
                downTime: null,
                downTarget: null,
            },
        ], 'interaction.pointers == [{ pointer: existing, ... }, { pointer: newPointer, ... }]');
        st.equal(ret, 1, 'second pointer index is 1');
        st.end();
    });
    t.test('update existing pointers', (st) => {
        const interaction = makeInteractionAndSignals();
        const oldPointers = [-3, 10, 2].map((pointerId) => ({ pointerId }));
        const newPointers = oldPointers.map((pointer) => ({ ...pointer, new: true }));
        oldPointers.forEach((pointer) => interaction.updatePointer(pointer, pointer, null));
        newPointers.forEach((pointer) => interaction.updatePointer(pointer, pointer, null));
        st.equal(interaction.pointers.length, oldPointers.length, 'number of pointers is unchanged');
        interaction.pointers.forEach((pointerInfo, i) => {
            st.equal(pointerInfo.id, oldPointers[i].pointerId, `pointer[${i}].id is the same`);
            st.notEqual(pointerInfo.pointer, oldPointers[i], `new pointer ${i} !== old pointer object`);
        });
        st.end();
    });
    t.end();
});
test('Interaction.removePointer', (t) => {
    const interaction = makeInteractionAndSignals();
    const ids = [0, 1, 2, 3];
    const removals = [
        { id: 0, remain: [1, 2, 3], message: 'first of 4' },
        { id: 2, remain: [1, 3], message: 'middle of 3' },
        { id: 3, remain: [1], message: 'last of 2' },
        { id: 1, remain: [], message: 'final' },
    ];
    ids.forEach((pointerId) => interaction.updatePointer({ pointerId }, {}, null));
    for (const removal of removals) {
        interaction.removePointer({ pointerId: removal.id }, null);
        t.deepEqual(interaction.pointers.map((p) => p.id), removal.remain, `${removal.message} - remaining interaction.pointers is correct`);
    }
    t.end();
});
test('Interaction.pointer{Down,Move,Up} updatePointer', (t) => {
    const signals = new Signals();
    const interaction = new Interaction({ signals });
    const eventTarget = {};
    const pointer = {
        target: eventTarget,
        pointerId: 0,
    };
    let info = {};
    signals.on('update-pointer', (arg) => { info.updated = arg.pointerInfo; });
    signals.on('remove-pointer', (arg) => { info.removed = arg.pointerInfo; });
    interaction.coords.cur.timeStamp = 0;
    const commonPointerInfo = {
        id: 0,
        pointer,
        event: pointer,
        downTime: null,
        downTarget: null,
    };
    interaction.pointerDown(pointer, pointer, eventTarget);
    t.deepEqual(info.updated, {
        ...commonPointerInfo,
        downTime: interaction.coords.cur.timeStamp,
        downTarget: eventTarget,
    }, 'interaction.pointerDown updates pointer');
    t.equal(info.removed, undefined, 'interaction.pointerDown doesn\'t remove pointer');
    interaction.removePointer(pointer, null);
    info = {};
    interaction.pointerMove(pointer, pointer, eventTarget);
    t.deepEqual(info.updated, commonPointerInfo, 'interaction.pointerMove updates pointer');
    t.equal(info.removed, undefined, 'interaction.pointerMove doesn\'t remove pointer');
    info = {};
    interaction.pointerUp(pointer, pointer, eventTarget, null);
    t.equal(info.updated, undefined, 'interaction.pointerUp doesn\'t update existing pointer');
    info = {};
    interaction.pointerUp(pointer, pointer, eventTarget, null);
    t.deepEqual(info.updated, commonPointerInfo, 'interaction.pointerUp updates non existing pointer');
    t.deepEqual(info.removed, commonPointerInfo, 'interaction.pointerUp also removes pointer');
    info = {};
    t.end();
});
test('Interaction.pointerDown', (t) => {
    const interaction = makeInteractionAndSignals();
    const coords = helpers.newCoordsSet();
    const eventTarget = {};
    const event = {
        type: 'down',
        target: eventTarget,
    };
    const pointer = helpers.newPointer();
    let signalArg;
    const signalListener = (arg) => {
        signalArg = arg;
    };
    interaction._signals.on('down', signalListener);
    const pointerCoords = { page: {}, client: {} };
    pointerUtils.setCoords(pointerCoords, [pointer], event.timeStamp);
    for (const prop in coords) {
        pointerUtils.copyCoords(interaction.coords[prop], coords[prop]);
    }
    // test while interacting
    interaction._interacting = true;
    interaction.pointerDown(pointer, event, eventTarget);
    t.equal(interaction.downEvent, null, 'downEvent is not updated');
    t.deepEqual(interaction.pointers, [{
            id: pointer.pointerId,
            pointer,
            event,
            downTime: null,
            downTarget: null,
        }], 'pointer is added');
    t.deepEqual(interaction.downPointer, {}, 'downPointer is not updated');
    t.deepEqual(interaction.coords.start, coords.start, 'coords.start are not modified');
    t.deepEqual(interaction.coords.cur, coords.cur, 'coords.cur   are not modified');
    t.deepEqual(interaction.coords.prev, coords.prev, 'coords.prev  are not modified');
    t.ok(interaction.pointerIsDown, 'pointerIsDown');
    t.notOk(interaction.pointerWasMoved, '!pointerWasMoved');
    t.equal(signalArg.pointer, pointer, 'pointer      in down signal arg');
    t.equal(signalArg.event, event, 'event        in down signal arg');
    t.equal(signalArg.eventTarget, eventTarget, 'eventTarget  in down signal arg');
    t.equal(signalArg.pointerIndex, 0, 'pointerIndex in down signal arg');
    // test while not interacting
    interaction._interacting = false;
    // reset pointerIsDown
    interaction.pointerIsDown = false;
    // pretend pointer was moved
    interaction.pointerWasMoved = true;
    // reset signalArg object
    signalArg = undefined;
    interaction.removePointer(pointer, null);
    interaction.pointerDown(pointer, event, eventTarget);
    // timeStamp is assigned with new Date.getTime()
    // don't let it cause deepEaual to fail
    pointerCoords.timeStamp = interaction.coords.start.timeStamp;
    t.equal(interaction.downEvent, event, 'downEvent is updated');
    t.deepEqual(interaction.pointers, [{
            id: pointer.pointerId,
            pointer,
            event,
            downTime: pointerCoords.timeStamp,
            downTarget: eventTarget,
        }], 'interaction.pointers is updated');
    t.deepEqual(interaction.coords.start, pointerCoords, 'coords.start are set to pointer');
    t.deepEqual(interaction.coords.cur, pointerCoords, 'coords.cur   are set to pointer');
    t.deepEqual(interaction.coords.prev, pointerCoords, 'coords.prev  are set to pointer');
    t.equal(typeof signalArg, 'object', 'down signal was fired again');
    t.ok(interaction.pointerIsDown, 'pointerIsDown');
    t.notOk(interaction.pointerWasMoved, 'pointerWasMoved should always change to false');
    t.end();
});
test('Interaction.start', (t) => {
    const interaction = makeInteractionAndSignals();
    const action = { name: 'TEST' };
    const interactable = helpers.mockInteractable();
    const element = {};
    const pointer = helpers.newPointer();
    const event = {};
    interaction.start(action, interactable, element);
    t.equal(interaction.prepared.name, null, 'do nothing if !pointerIsDown');
    // pointers is still empty
    interaction.pointerIsDown = true;
    interaction.start(action, interactable, element);
    t.equal(interaction.prepared.name, null, 'do nothing if too few pointers are down');
    interaction.pointerDown(pointer, event, null);
    interaction._interacting = true;
    interaction.start(action, interactable, element);
    t.equal(interaction.prepared.name, null, 'do nothing if already interacting');
    interaction._interacting = false;
    interactable.options[action.name] = { enabled: false };
    interaction.start(action, interactable, element);
    t.equal(interaction.prepared.name, null, 'do nothing if action is not enabled');
    interactable.options[action.name] = { enabled: true };
    let signalArg;
    // let interactingInStartListener
    const signalListener = (arg) => {
        signalArg = arg;
        // interactingInStartListener = arg.interaction.interacting()
    };
    interaction._signals.on('action-start', signalListener);
    interaction.start(action, interactable, element);
    t.equal(interaction.prepared.name, action.name, 'action is prepared');
    t.equal(interaction.interactable, interactable, 'interaction.interactable is updated');
    t.equal(interaction.element, element, 'interaction.element is updated');
    // t.assert(interactingInStartListener, 'interaction is interacting during action-start signal')
    t.assert(interaction.interacting(), 'interaction is interacting after start method');
    t.equal(signalArg.interaction, interaction, 'interaction in signal arg');
    t.equal(signalArg.event, event, 'event (interaction.downEvent) in signal arg');
    interaction._interacting = false;
    // interaction.start(action, target, element)
    // t.deepEqual(scope.interactions.list, [interaction], 'interaction is added back to scope')
    t.end();
});
test('stop interaction from start event', (t) => {
    const scope = helpers.mockScope();
    const interaction = scope.interactions.new({});
    const interactable = helpers.mockInteractable();
    interaction.interactable = interactable;
    interaction.element = interactable.element;
    interaction.prepared = { name: 'TEST' };
    interactable.events.on('TESTstart', (event) => {
        event.interaction.stop();
    });
    interaction._signals.fire('action-start', { interaction, event: {} });
    t.notOk(interaction.interacting(), 'interaction can be stopped from start event listener');
    t.end();
});
test('Interaction createPreparedEvent', (t) => {
    const scope = helpers.mockScope();
    const interaction = scope.interactions.new({});
    const interactable = helpers.mockInteractable();
    const action = { name: 'resize' };
    const phase = 'TEST_PHASE';
    interaction.prepared = action;
    interaction.interactable = interactable;
    interaction.element = interactable.element;
    interaction.prevEvent = { page: {}, client: {}, velocity: {} };
    const iEvent = interaction._createPreparedEvent({}, phase);
    t.ok(iEvent instanceof InteractEvent, 'InteractEvent is fired');
    t.equal(iEvent.type, action.name + phase, 'event type');
    t.equal(iEvent.interactable, interactable, 'event.interactable');
    t.equal(iEvent.target, interactable.element, 'event.target');
    t.end();
});
test('Interaction fireEvent', (t) => {
    const interaction = new Interaction({ signals: helpers.mockSignals() });
    const interactable = helpers.mockInteractable();
    const iEvent = {};
    let firedEvent;
    // this method should be called from actions.firePrepared
    interactable.fire = (event) => {
        firedEvent = event;
    };
    interaction.interactable = interactable;
    interaction._fireEvent(iEvent);
    t.equal(firedEvent, iEvent, 'target interactable\'s fire method is called');
    t.equal(interaction.prevEvent, iEvent, 'interaction.prevEvent is updated');
    t.end();
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiSW50ZXJhY3Rpb24uc3BlYy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIkludGVyYWN0aW9uLnNwZWMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxJQUFJLE1BQU0sNEJBQTRCLENBQUE7QUFDN0MsT0FBTyxZQUFZLE1BQU0sZ0NBQWdDLENBQUE7QUFDekQsT0FBTyxPQUFPLE1BQU0sMkJBQTJCLENBQUE7QUFDL0MsT0FBTyxhQUFhLE1BQU0saUJBQWlCLENBQUE7QUFDM0MsT0FBTyxXQUFXLE1BQU0sZUFBZSxDQUFBO0FBQ3ZDLE9BQU8sS0FBSyxPQUFPLE1BQU0sa0JBQWtCLENBQUE7QUFFM0MsTUFBTSx5QkFBeUIsR0FBRyxHQUFHLEVBQUUsQ0FBQyxJQUFJLFdBQVcsQ0FBQyxFQUFFLE9BQU8sRUFBRSxJQUFJLE9BQU8sRUFBRSxFQUFTLENBQUMsQ0FBQTtBQUUxRixJQUFJLENBQUMseUJBQXlCLEVBQUUsQ0FBQyxDQUFDLEVBQUUsRUFBRTtJQUNwQyxNQUFNLFFBQVEsR0FBRyxNQUFNLENBQUE7SUFDdkIsTUFBTSxPQUFPLEdBQUcsSUFBSSxPQUFPLEVBQUUsQ0FBQTtJQUM3QixNQUFNLFdBQVcsR0FBRyxJQUFJLFdBQVcsQ0FBQztRQUNsQyxXQUFXLEVBQUUsUUFBUTtRQUNyQixPQUFPO0tBQ1IsQ0FBQyxDQUFBO0lBQ0YsTUFBTSxVQUFVLEdBQUc7UUFDakIsSUFBSSxFQUFPLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFO1FBQ3pCLE1BQU0sRUFBSyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRTtRQUN6QixTQUFTLEVBQUUsQ0FBQztLQUNiLENBQUE7SUFFRCxDQUFDLENBQUMsS0FBSyxDQUFDLFdBQVcsQ0FBQyxRQUFRLEVBQUUsT0FBTyxFQUNuQyx3REFBd0QsQ0FBQyxDQUFBO0lBRTNELENBQUMsQ0FBQyxFQUFFLENBQUMsV0FBVyxDQUFDLFFB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LENBQUE7SUFFakIsQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFBO0FBQ1QsQ0FBQyxDQUFDLENBQUE7QUFFRixJQUFJLENBQUMsdUJBQXVCLEVBQUUsQ0FBQyxDQUFDLEVBQUUsRUFBRTtJQUNsQyxNQUFNLFdBQVcsR0FBRyxJQUFJLFdBQVcsQ0FBQyxFQUFFLE9BQU8sRUFBRSxPQUFPLENBQUMsV0FBVyxFQUFFLEVBQUUsQ0FBQyxDQUFBO0lBQ3ZFLE1BQU0sWUFBWSxHQUFHLE9BQU8sQ0FBQyxnQkFBZ0IsRUFBRSxDQUFBO0lBQy9DLE1BQU0sTUFBTSxHQUFHLEVBQTRCLENBQUE7SUFDM0MsSUFBSSxVQUFVLENBQUE7SUFFZCx5REFBeUQ7SUFDekQsWUFBWSxDQUFDLElBQUksR0FBRyxDQUFDLEtBQUssRUFBRSxFQUFFO1FBQzVCLFVBQVUsR0FBRyxLQUFLLENBQUE7SUFDcEIsQ0FBQyxDQUFBO0lBRUQsV0FBVyxDQUFDLFlBQVksR0FBRyxZQUFZLENBQUE7SUFDdkMsV0FBVyxDQUFDLFVBQVUsQ0FBQyxNQUFNLENBQUMsQ0FBQTtJQUU5QixDQUFDLENBQUMsS0FBSyxDQUFDLFVBQVUsRUFBRSxNQUFNLEVBQ3hCLDhDQUE4QyxDQUFDLENBQUE7SUFFakQsQ0FBQyxDQUFDLEtBQUssQ0FBQyxXQUFXLENBQUMsU0FBUyxFQUFFLE1BQU0sRUFDbkMsa0NBQWtDLENBQUMsQ0FBQTtJQUVyQyxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUE7QUFDVCxDQUFDLENBQUMsQ0FBQSIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB0ZXN0IGZyb20gJ0BpbnRlcmFjdGpzL19kZXYvdGVzdC90ZXN0J1xuaW1wb3J0IHBvaW50ZXJVdGlscyBmcm9tICdAaW50ZXJhY3Rqcy91dGlscy9wb2ludGVyVXRpbHMnXG5pbXBvcnQgU2lnbmFscyBmcm9tICdAaW50ZXJhY3Rqcy91dGlscy9TaWduYWxzJ1xuaW1wb3J0IEludGVyYWN0RXZlbnQgZnJvbSAnLi9JbnRlcmFjdEV2ZW50J1xuaW1wb3J0IEludGVyYWN0aW9uIGZyb20gJy4vSW50ZXJhY3Rpb24nXG5pbXBvcnQgKiBhcyBoZWxwZXJzIGZyb20gJy4vdGVzdHMvX2hlbHBlcnMnXG5cbmNvbnN0IG1ha2VJbnRlcmFjdGlvbkFuZFNpZ25hbHMgPSAoKSA9PiBuZXcgSW50ZXJhY3Rpb24oeyBzaWduYWxzOiBuZXcgU2lnbmFscygpIH0gYXMgYW55KVxuXG50ZXN0KCdJbnRlcmFjdGlvbiBjb25zdHJ1Y3RvcicsICh0KSA9PiB7XG4gIGNvbnN0IHRlc3RUeXBlID0gJ3Rlc3QnXG4gIGNvbnN0IHNpZ25hbHMgPSBuZXcgU2lnbmFscygpXG4gIGNvbnN0IGludGVyYWN0aW9uID0gbmV3IEludGVyYWN0aW9uKHtcbiAgICBwb2ludGVyVHlwZTogdGVzdFR5cGUsXG4gICAgc2lnbmFscyxcbiAgfSlcbiAgY29uc3QgemVyb0Nvb3JkcyA9IHtcbiAgICBwYWdlICAgICA6IHsgeDogMCwgeTogMCB9LFxuICAgIGNsaWVudCAgIDogeyB4OiAwLCB5OiAwIH0sXG4gICAgdGltZVN0YW1wOiAwLFxuICB9XG5cbiAgdC5lcXVhbChpbnRlcmFjdGlvbi5fc2lnbmFscywgc2lnbmFscyxcbiAgICAnc2lnbmFscyBvcHRpb24gaXMgc2V0IGFzc2lnbmVkIHRvIGludGVyYWN0aW9uLl9zaWduYWxzJylcblxuICB0Lm9rKGludGVyYWN0aW9uLnByZXBhcmVkIGluc3RhbmNlb2YgT2JqZWN0LFxuICAgICdpbnRlcmFjdGlvbi5wcmVwYXJlZCBpcyBhbiBvYmplY3QnKVxuICB0Lm9rKGludGVyYWN0aW9uLmRvd25Qb2ludGVyIGluc3RhbmNlb2YgT2JqZWN0LFxuICAgICdpbnRlcmFjdGlvbi5kb3duUG9pbnRlciBpcyBhbiBvYmplY3QnKVxuXG4gIGZvciAoY29uc3QgY29vcmRGaWVsZCBpbiBpbnRlcmFjdGlvbi5jb29yZHMpIHtcbiAgICB0LmRlZXBFcXVhbChpbnRlcmFjdGlvbi5jb29yZHNbY29vcmRGaWVsZF0sIHplcm9Db29yZHMsXG4gICAgICBgaW50ZXJhY3Rpb24uY29vcmRzLiR7Y29vcmRGaWVsZH0gc2V0IHRvIHplcm9gKVxuICB9XG5cbiAgdC5lcXVhbChpbnRlcmFjdGlvbi5wb2ludGVyVHlwZSwgdGVzdFR5cGUsXG4gICAgJ2ludGVyYWN0aW9uLnBvaW50ZXJUeXBlIGlzIHNldCcpXG5cbiAgLy8gcG9pbnRlckluZm8gcHJvcGVydGllc1xuICB0LmRlZXBFcXVhbChcbiAgICBpbnRlcmFjdGlvbi5wb2ludGVycyxcbiAgICBbXSxcbiAgICAnaW50ZXJhY3Rpb24ucG9pbnRlcnMgaXMgaW5pdGlhbGx5IGFuIGVtcHR5IGFycmF5JylcblxuICAvLyBmYWxzZSBwcm9wZXJ0aWVzXG4gIGZvciAoY29uc3QgcHJvcCBvZiAncG9pbnRlcklzRG93biBwb2ludGVyV2FzTW92ZWQgX2ludGVyYWN0aW5nIG1vdXNlJy5zcGxpdCgnICcpKSB7XG4gICAgdC5ub3RPayhpbnRlcmFjdGlvbltwcm9wXSwgYGludGVyYWN0aW9uLiR7cHJvcH0gaXMgZmFsc2VgKVxuICB9XG5cbiAgdC5lbmQoKVxufSlcblxudGVzdCgnSW50ZXJhY3Rpb24gZGVzdHJveScsICh0KSA9PiB7XG4gIGNvbnN0IGludGVyYWN0aW9uID0gbWFrZUludGVyYWN0aW9uQW5kU2lnbmFscygpXG4gIGNvbnN0IHBvaW50ZXIgPSB7IHBvaW50ZXJJZDogMTAgfSBhcyBhbnlcbiAgY29uc3QgZXZlbnQgPSB7fSBhcyBhbnlcblxuICBpbnRlcmFjdGlvbi51cGRhdGVQb2ludGVyKHBvaW50ZXIsIGV2ZW50LCBudWxsKVxuXG4gIGludGVyYWN0aW9uLmRlc3Ryb3koKVxuXG4gIHQuc3RyaWN0RXF1YWwoaW50ZXJhY3Rpb24uX2xhdGVzdFBvaW50ZXIucG9pbnRlciwgbnVsbCxcbiAgICAnaW50ZXJhY3Rpb24uX2xhdGVzdFBvaW50ZXIucG9pbnRlciBpcyBudWxsJylcblxuICB0LnN0cmljdEVxdWFsKGludGVyYWN0aW9uLl9sYXRlc3RQb2ludGVyLmV2ZW50LCBudWxsLFxuICAgICdpbnRlcmFjdGlvbi5fbGF0ZXN0UG9pbnRlci5ldmVudCBpcyBudWxsJylcblxuICB0LnN0cmljdEVxdWFsKGludGVyYWN0aW9uLl9sYXRlc3RQb2ludGVyLmV2ZW50VGFyZ2V0LCBudWxsLFxuICAgICdpbnRlcmFjdGlvbi5fbGF0ZXN0UG9pbnRlci5ldmVudFRhcmdldCBpcyBudWxsJylcblxuICB0LmVuZCgpXG59KVxuXG50ZXN0KCdJbnRlcmFjdGlvbi5nZXRQb2ludGVySW5kZXgnLCAodCkgPT4ge1xuICBjb25zdCBpbnRlcmFjdGlvbiA9IG1ha2VJbnRlcmFjdGlvbkFuZFNpZ25hbHMoKVxuXG4gIGludGVyYWN0aW9uLnBvaW50ZXJzID0gWzIsIDQsIDUsIDAsIC0xXS5tYXAoKGlkKSA9PiAoeyBpZCB9KSkgYXMgYW55XG5cbiAgaW50ZXJhY3Rpb24ucG9pbnRlcnMuZm9yRWFjaCgoeyBpZCB9LCBpbmRleCkgPT4ge1xuICAgIHQuZXF1YWwoaW50ZXJhY3Rpb24uZ2V0UG9pbnRlckluZGV4KHsgcG9pbnRlcklkOiBpZCB9KSwgaW5kZXgpXG4gIH0pXG5cbiAgdC5lbmQoKVxufSlcblxudGVzdCgnSW50ZXJhY3Rpb24udXBkYXRlUG9pbnRlcicsICh0KSA9PiB7XG4gIHQudGVzdCgnbm8gZXhpc3RpbmcgcG9pbnRlcnMnLCAoc3QpID0+IHtcbiAgICBjb25zdCBpbnRlcmFjdGlvbiA9IG1ha2VJbnRlcmFjdGlvbkFuZFNpZ25hbHMoKVxuICAgIGNvbnN0IHBvaW50ZXIgPSB7IHBvaW50ZXJJZDogMTAgfSBhcyBhbnlcbiAgICBjb25zdCBldmVudCA9IHt9IGFzIGFueVxuXG4gICAgY29uc3QgcmV0ID0gaW50ZXJhY3Rpb24udXBkYXRlUG9pbnRlcihwb2ludGVyLCBldmVudCwgbnVsbClcblxuICAgIHN0LmRlZXBFcXVhbChcbiAgICAgIGludGVyYWN0aW9uLnBvaW50ZXJzLFxuICAgICAgW3tcbiAgICAgICAgaWQ6IHBvaW50ZXIucG9pbnRlcklkLFxuICAgICAgICBwb2ludGVyLFxuICAgICAgICBldmVudCxcbiAgICAgICAgZG93blRpbWU6IG51bGwsXG4gICAgICAgIGRvd25UYXJnZXQ6IG51bGwsXG4gICAgICB9XSxcbiAgICAgICdpbnRlcmFjdGlvbi5wb2ludGVycyA9PSBbeyBwb2ludGVyLCAuLi4gfV0nKVxuICAgIHN0LmVxdWFsKHJldCwgMCwgJ25ldyBwb2ludGVyIGluZGV4IGlzIHJldHVybmVkJylcblxuICAgIHN0LmVuZCgpXG4gIH0pXG5cbiAgdC50ZXN0KCduZXcgcG9pbnRlciB3aXRoIGV4aXNpdGluZyBwb2ludGVyJywgKHN0KSA9PiB7XG4gICAgY29uc3QgaW50ZXJhY3Rpb24gPSBtYWtlSW50ZXJhY3Rpb25BbmRTaWduYWxzKClcbiAgICBjb25zdCBleGlzdGluZzogYW55ID0geyBwb2ludGVySWQ6IDAgfVxuICAgIGNvbnN0IGV2ZW50OiBhbnkgPSB7fVxuXG4gICAgaW50ZXJhY3Rpb24udXBkYXRlUG9pbnRlcihleGlzdGluZywgZXZlbnQsIG51bGwpXG5cbiAgICBjb25zdCBuZXdQb2ludGVyOiBhbnkgPSB7IHBvaW50ZXJJZDogMTAgfVxuICAgIGNvbnN0IHJldCA9IGludGVyYWN0aW9uLnVwZGF0ZVBvaW50ZXIobmV3UG9pbnRlciwgZXZlbnQsIG51bGwpXG5cbiAgICBzdC5kZWVwRXF1YWwoXG4gICAgICBpbnRlcmFjdGlvbi5wb2ludGVycywgW1xuICAgICAgICB7XG4gICAgICAgICAgaWQ6IGV4aXN0aW5nLnBvaW50ZXJJZCxcbiAgICAgICAgICBwb2ludGVyOiBleGlzdGluZyxcbiAgICAgICAgICBldmVudCxcbiAgICAgICAgICBkb3duVGltZTogbnVsbCxcbiAgICAgICAgICBkb3duVGFyZ2V0OiBudWxsLFxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgaWQ6IG5ld1BvaW50ZXIucG9pbnRlcklkLFxuICAgICAgICAgIHBvaW50ZXI6IG5ld1BvaW50ZXIsXG4gICAgICAgICAgZXZlbnQsXG4gICAgICAgICAgZG93blRpbWU6IG51bGwsXG4gICAgICAgICAgZG93blRhcmdldDogbnVsbCxcbiAgICAgICAgfSxcbiAgICAgIF0sXG4gICAgICAnaW50ZXJhY3Rpb24ucG9pbnRlcnMgPT0gW3sgcG9pbnRlcjogZXhpc3RpbmcsIC4uLiB9LCB7IHBvaW50ZXI6IG5ld1BvaW50ZXIsIC4uLiB9XScpXG5cbiAgICBzdC5lcXVhbChyZXQsIDEsICdzZWNvbmQgcG9pbnRlciBpbmRleCBpcyAxJylcblxuICAgIHN0LmVuZCgpXG4gIH0pXG5cbiAgdC50ZXN0KCd1cGRhdGUgZXhpc3RpbmcgcG9pbnRlcnMnLCAoc3QpID0+IHtcbiAgICBjb25zdCBpbnRlcmFjdGlvbiA9IG1ha2VJbnRlcmFjdGlvbkFuZFNpZ25hbHMoKVxuXG4gICAgY29uc3Qgb2xkUG9pbnRlcnMgPSBbLTMsIDEwLCAyXS5tYXAoKHBvaW50ZXJJZCkgPT4gKHsgcG9pbnRlcklkIH0pKVxuICAgIGNvbnN0IG5ld1BvaW50ZXJzID0gb2xkUG9pbnRlcnMubWFwKChwb2ludGVyKSA9PiAoeyAuLi5wb2ludGVyLCBuZXc6IHRydWUgfSkpXG5cbiAgICBvbGRQb2ludGVycy5mb3JFYWNoKChwb2ludGVyOiBhbnkpID0+IGludGVyYWN0aW9uLnVwZGF0ZVBvaW50ZXIocG9pbnRlciwgcG9pbnRlciwgbnVsbCkpXG4gICAgbmV3UG9pbnRlcnMuZm9yRWFjaCgocG9pbnRlcjogYW55KSA9PiBpbnRlcmFjdGlvbi51cGRhdGVQb2ludGVyKHBvaW50ZXIsIHBvaW50ZXIsIG51bGwpKVxuXG4gICAgc3QuZXF1YWwoaW50ZXJhY3Rpb24ucG9pbnRlcnMubGVuZ3RoLCBvbGRQb2ludGVycy5sZW5ndGgsXG4gICAgICAnbnVtYmVyIG9mIHBvaW50ZXJzIGlzIHVuY2hhbmdlZCcpXG5cbiAgICBpbnRlcmFjdGlvbi5wb2ludGVycy5mb3JFYWNoKChwb2ludGVySW5mbywgaSkgPT4ge1xuICAgICAgc3QuZXF1YWwocG9pbnRlckluZm8uaWQsIG9sZFBvaW50ZXJzW2ldLnBvaW50ZXJJZCxcbiAgICAgICAgYHBvaW50ZXJbJHtpfV0uaWQgaXMgdGhlIHNhbWVgKVxuICAgICAgc3Qubm90RXF1YWwocG9pbnRlckluZm8ucG9pbnRlciwgb2xkUG9pbnRlcnNbaV0sXG4gICAgICAgIGBuZXcgcG9pbnRlciAke2l9ICE9PSBvbGQgcG9pbnRlciBvYmplY3RgKVxuICAgIH0pXG5cbiAgICBzdC5lbmQoKVxuICB9KVxuXG4gIHQuZW5kKClcbn0pXG5cbnRlc3QoJ0ludGVyYWN0aW9uLnJlbW92ZVBvaW50ZXInLCAodCkgPT4ge1xuICBjb25zdCBpbnRlcmFjdGlvbiA9IG1ha2VJbnRlcmFjdGlvbkFuZFNpZ25hbHMoKVxuICBjb25zdCBpZHMgPSBbMCwgMSwgMiwgM11cbiAgY29uc3QgcmVtb3ZhbHMgPSBbXG4gICAgeyBpZDogMCwgcmVtYWluOiBbMSwgMiwgM10sIG1lc3NhZ2U6ICdmaXJzdCBvZiA0JyB9LFxuICAgIHsgaWQ6IDIsIHJlbWFpbjogWzEsICAgIDNdLCBtZXNzYWdlOiAnbWlkZGxlIG9mIDMnIH0sXG4gICAgeyBpZDogMywgcmVtYWluOiBbMSAgICAgIF0sIG1lc3NhZ2U6ICdsYXN0IG9mIDInIH0sXG4gICAgeyBpZDogMSwgcmVtYWluOiBbICAgICAgIF0sIG1lc3NhZ2U6ICdmaW5hbCcgfSxcbiAgXVxuXG4gIGlkcy5mb3JFYWNoKChwb2ludGVySWQpID0+IGludGVyYWN0aW9uLnVwZGF0ZVBvaW50ZXIoeyBwb2ludGVySWQgfSBhcyBhbnksIHt9IGFzIGFueSwgbnVsbCkpXG5cbiAgZm9yIChjb25zdCByZW1vdmFsIG9mIHJlbW92YWxzKSB7XG4gICAgaW50ZXJhY3Rpb24ucmVtb3ZlUG9pbnRlcih7IHBvaW50ZXJJZDogcmVtb3ZhbC5pZCB9IGFzIEludGVyYWN0LlBvaW50ZXJUeXBlLCBudWxsKVxuXG4gICAgdC5kZWVwRXF1YWwoXG4gICAgICBpbnRlcmFjdGlvbi5wb2ludGVycy5tYXAoKHApID0+IHAuaWQpLFxuICAgICAgcmVtb3ZhbC5yZW1haW4sXG4gICAgICBgJHtyZW1vdmFsLm1lc3NhZ2V9IC0gcmVtYWluaW5nIGludGVyYWN0aW9uLnBvaW50ZXJzIGlzIGNvcnJlY3RgKVxuICB9XG5cbiAgdC5lbmQoKVxufSlcblxudGVzdCgnSW50ZXJhY3Rpb24ucG9pbnRlcntEb3duLE1vdmUsVXB9IHVwZGF0ZVBvaW50ZXInLCAodCkgPT4ge1xuICBjb25zdCBzaWduYWxzID0gbmV3IFNpZ25hbHMoKVxuICBjb25zdCBpbnRlcmFjdGlvbiA9IG5ldyBJbnRlcmFjdGlvbih7IHNpZ25hbHMgfSBhcyBhbnkpXG4gIGNvbnN0IGV2ZW50VGFyZ2V0OiBhbnkgPSB7fVxuICBjb25zdCBwb2ludGVyOiBhbnkgPSB7XG4gICAgdGFyZ2V0OiBldmVudFRhcmdldCxcbiAgICBwb2ludGVySWQ6IDAsXG4gIH1cbiAgbGV0IGluZm86IGFueSA9IHt9XG5cbiAgc2lnbmFscy5vbigndXBkYXRlLXBvaW50ZXInLCAoYXJnKSA9PiB7IGluZm8udXBkYXRlZCA9IGFyZy5wb2ludGVySW5mbyB9KVxuICBzaWduYWxzLm9uKCdyZW1vdmUtcG9pbnRlcicsIChhcmcpID0+IHsgaW5mby5yZW1vdmVkID0gYXJnLnBvaW50ZXJJbmZvIH0pXG5cbiAgaW50ZXJhY3Rpb24uY29vcmRzLmN1ci50aW1lU3RhbXAgPSAwXG4gIGNvbnN0IGNvbW1vblBvaW50ZXJJbmZvID0ge1xuICAgIGlkOiAwLFxuICAgIHBvaW50ZXIsXG4gICAgZXZlbnQ6IHBvaW50ZXIsXG4gICAgZG93blRpbWU6IG51bGwsXG4gICAgZG93blRhcmdldDogbnVsbCxcbiAgfVxuXG4gIGludGVyYWN0aW9uLnBvaW50ZXJEb3duKHBvaW50ZXIsIHBvaW50ZXIsIGV2ZW50VGFyZ2V0KVxuICB0LmRlZXBFcXVhbChcbiAgICBpbmZvLnVwZGF0ZWQsXG4gICAge1xuICAgICAgLi4uY29tbW9uUG9pbnRlckluZm8sXG4gICAgICBkb3duVGltZTogaW50ZXJhY3Rpb24uY29vcmRzLmN1ci50aW1lU3RhbXAsXG4gICAgICBkb3duVGFyZ2V0OiBldmVudFRhcmdldCxcbiAgICB9LFxuICAgICdpbnRlcmFjdGlvbi5wb2ludGVyRG93biB1cGRhdGVzIHBvaW50ZXInXG4gIClcbiAgdC5lcXVhbChpbmZvLnJlbW92ZWQsIHVuZGVmaW5lZCwgJ2ludGVyYWN0aW9uLnBvaW50ZXJEb3duIGRvZXNuXFwndCByZW1vdmUgcG9pbnRlcicpXG4gIGludGVyYWN0aW9uLnJlbW92ZVBvaW50ZXIocG9pbnRlciwgbnVsbClcbiAgaW5mbyA9IHt9XG5cbiAgaW50ZXJhY3Rpb24ucG9pbnRlck1vdmUocG9pbnRlciwgcG9pbnRlciwgZXZlbnRUYXJnZXQpXG4gIHQuZGVlcEVxdWFsKFxuICAgIGluZm8udXBkYXRlZCxcbiAgICBjb21tb25Qb2ludGVySW5mbyxcbiAgICAnaW50ZXJhY3Rpb24ucG9pbnRlck1vdmUgdXBkYXRlcyBwb2ludGVyJ1xuICApXG4gIHQuZXF1YWwoaW5mby5yZW1vdmVkLCB1bmRlZmluZWQsICdpbnRlcmFjdGlvbi5wb2ludGVyTW92ZSBkb2VzblxcJ3QgcmVtb3ZlIHBvaW50ZXInKVxuICBpbmZvID0ge31cblxuICBpbnRlcmFjdGlvbi5wb2ludGVyVXAocG9pbnRlciwgcG9pbnRlciwgZXZlbnRUYXJnZXQsIG51bGwpXG4gIHQuZXF1YWwoaW5mby51cGRhdGVkLCB1bmRlZmluZWQsICdpbnRlcmFjdGlvbi5wb2ludGVyVXAgZG9lc25cXCd0IHVwZGF0ZSBleGlzdGluZyBwb2ludGVyJylcbiAgaW5mbyA9IHt9XG5cbiAgaW50ZXJhY3Rpb24ucG9pbnRlclVwKHBvaW50ZXIsIHBvaW50ZXIsIGV2ZW50VGFyZ2V0LCBudWxsKVxuICB0LmRlZXBFcXVhbChcbiAgICBpbmZvLnVwZGF0ZWQsXG4gICAgY29tbW9uUG9pbnRlckluZm8sXG4gICAgJ2ludGVyYWN0aW9uLnBvaW50ZXJVcCB1cGRhdGVzIG5vbiBleGlzdGluZyBwb2ludGVyJ1xuICApXG4gIHQuZGVlcEVxdWFsKGluZm8ucmVtb3ZlZCwgY29tbW9uUG9pbnRlckluZm8sICdpbnRlcmFjdGlvbi5wb2ludGVyVXAgYWxzbyByZW1vdmVzIHBvaW50ZXInKVxuICBpbmZvID0ge31cblxuICB0LmVuZCgpXG59KVxuXG50ZXN0KCdJbnRlcmFjdGlvbi5wb2ludGVyRG93bicsICh0KSA9PiB7XG4gIGNvbnN0IGludGVyYWN0aW9uID0gbWFrZUludGVyYWN0aW9uQW5kU2lnbmFscygpXG4gIGNvbnN0IGNvb3JkcyA9IGhlbHBlcnMubmV3Q29vcmRzU2V0KClcbiAgY29uc3QgZXZlbnRUYXJnZXQgPSB7fSBhcyBFbGVtZW50XG4gIGNvbnN0IGV2ZW50OiBhbnkgPSB7XG4gICAgdHlwZTogJ2Rvd24nLFxuICAgIHRhcmdldDogZXZlbnRUYXJnZXQsXG4gIH1cbiAgY29uc3QgcG9pbnRlcjogYW55ID0gaGVscGVycy5uZXdQb2ludGVyKClcbiAgbGV0IHNpZ25hbEFyZ1xuXG4gIGNvbnN0IHNpZ25hbExpc3RlbmVyID0gKGFyZykgPT4ge1xuICAgIHNpZ25hbEFyZyA9IGFyZ1xuICB9XG5cbiAgaW50ZXJhY3Rpb24uX3NpZ25hbHMub24oJ2Rvd24nLCBzaWduYWxMaXN0ZW5lcilcblxuICBjb25zdCBwb2ludGVyQ29vcmRzOiBhbnkgPSB7IHBhZ2U6IHt9LCBjbGllbnQ6IHt9IH1cbiAgcG9pbnRlclV0aWxzLnNldENvb3Jkcyhwb2ludGVyQ29vcmRzLCBbcG9pbnRlcl0sIGV2ZW50LnRpbWVTdGFtcClcblxuICBmb3IgKGNvbnN0IHByb3AgaW4gY29vcmRzKSB7XG4gICAgcG9pbnRlclV0aWxzLmNvcHlDb29yZHMoaW50ZXJhY3Rpb24uY29vcmRzW3Byb3BdLCBjb29yZHNbcHJvcF0pXG4gIH1cblxuICAvLyB0ZXN0IHdoaWxlIGludGVyYWN0aW5nXG4gIGludGVyYWN0aW9uLl9pbnRlcmFjdGluZyA9IHRydWVcbiAgaW50ZXJhY3Rpb24ucG9pbnRlckRvd24ocG9pbnRlciwgZXZlbnQsIGV2ZW50VGFyZ2V0KVxuXG4gIHQuZXF1YWwoaW50ZXJhY3Rpb24uZG93bkV2ZW50LCBudWxsLCAnZG93bkV2ZW50IGlzIG5vdCB1cGRhdGVkJylcbiAgdC5kZWVwRXF1YWwoXG4gICAgaW50ZXJhY3Rpb24ucG9pbnRlcnMsXG4gICAgW3tcbiAgICAgIGlkOiBwb2ludGVyLnBvaW50ZXJJZCxcbiAgICAgIHBvaW50ZXIsXG4gICAgICBldmVudCxcbiAgICAgIGRvd25UaW1lOiBudWxsLFxuICAgICAgZG93blRhcmdldDogbnVsbCxcbiAgICB9XSxcbiAgICAncG9pbnRlciBpcyBhZGRlZCdcbiAgKVxuXG4gIHQuZGVlcEVxdWFsKGludGVyYWN0aW9uLmRvd25Qb2ludGVyLCB7fSBhcyBhbnksICdkb3duUG9pbnRlciBpcyBub3QgdXBkYXRlZCcpXG5cbiAgdC5kZWVwRXF1YWwoaW50ZXJhY3Rpb24uY29vcmRzLnN0YXJ0LCBjb29yZHMuc3RhcnQsICdjb29yZHMuc3RhcnQgYXJlIG5vdCBtb2RpZmllZCcpXG4gIHQuZGVlcEVxdWFsKGludGVyYWN0aW9uLmNvb3Jkcy5jdXIsICAgY29vcmRzLmN1ciwgICAnY29vcmRzLmN1ciAgIGFyZSBub3QgbW9kaWZpZWQnKVxuICB0LmRlZXBFcXVhbChpbnRlcmFjdGlvbi5jb29yZHMucHJldiwgIGNvb3Jkcy5wcmV2LCAgJ2Nvb3Jkcy5wcmV2ICBhcmUgbm90IG1vZGlmaWVkJylcblxuICB0Lm9rKGludGVyYWN0aW9uLnBvaW50ZXJJc0Rvd24sICdwb2ludGVySXNEb3duJylcbiAgdC5ub3RPayhpbnRlcmFjdGlvbi5wb2ludGVyV2FzTW92ZWQsICchcG9pbnRlcldhc01vdmVkJylcblxuICB0LmVxdWFsKHNpZ25hbEFyZy5wb2ludGVyLCAgICAgIHBvaW50ZXIsICAgICAncG9pbnRlciAgICAgIGluIGRvd24gc2lnbmFsIGFyZycpXG4gIHQuZXF1YWwoc2lnbmFsQXJnLmV2ZW50LCAgICAgICAgZXZlbnQsICAgICAgICdldmVudCAgICAgICAgaW4gZG93biBzaWduYWwgYXJnJylcbiAgdC5lcXVhbChzaWduYWxBcmcuZXZlbnRUYXJnZXQsICBldmVudFRhcmdldCwgJ2V2ZW50VGFyZ2V0ICBpbiBkb3duIHNpZ25hbCBhcmcnKVxuICB0LmVxdWFsKHNpZ25hbEFyZy5wb2ludGVySW5kZXgsIDAsICAgICAgICAgICAncG9pbnRlckluZGV4IGluIGRvd24gc2lnbmFsIGFyZycpXG5cbiAgLy8gdGVzdCB3aGlsZSBub3QgaW50ZXJhY3RpbmdcbiAgaW50ZXJhY3Rpb24uX2ludGVyYWN0aW5nID0gZmFsc2VcbiAgLy8gcmVzZXQgcG9pbnRlcklzRG93blxuICBpbnRlcmFjdGlvbi5wb2ludGVySXNEb3duID0gZmFsc2VcbiAgLy8gcHJldGVuZCBwb2ludGVyIHdhcyBtb3ZlZFxuICBpbnRlcmFjdGlvbi5wb2ludGVyV2FzTW92ZWQgPSB0cnVlXG4gIC8vIHJlc2V0IHNpZ25hbEFyZyBvYmplY3RcbiAgc2lnbmFsQXJnID0gdW5kZWZpbmVkXG5cbiAgaW50ZXJhY3Rpb24ucmVtb3ZlUG9pbnRlcihwb2ludGVyLCBudWxsKVxuICBpbnRlcmFjdGlvbi5wb2ludGVyRG93bihwb2ludGVyLCBldmVudCwgZXZlbnRUYXJnZXQpXG5cbiAgLy8gdGltZVN0YW1wIGlzIGFzc2lnbmVkIHdpdGggbmV3IERhdGUuZ2V0VGltZSgpXG4gIC8vIGRvbid0IGxldCBpdCBjYXVzZSBkZWVwRWF1YWwgdG8gZmFpbFxuICBwb2ludGVyQ29vcmRzLnRpbWVTdGFtcCA9IGludGVyYWN0aW9uLmNvb3Jkcy5zdGFydC50aW1lU3RhbXBcblxuICB0LmVxdWFsKGludGVyYWN0aW9uLmRvd25FdmVudCwgZXZlbnQsICdkb3duRXZlbnQgaXMgdXBkYXRlZCcpXG5cbiAgdC5kZWVwRXF1YWwoXG4gICAgaW50ZXJhY3Rpb24ucG9pbnRlcnMsXG4gICAgW3tcbiAgICAgIGlkOiBwb2ludGVyLnBvaW50ZXJJZCxcbiAgICAgIHBvaW50ZXIsXG4gICAgICBldmVudCxcbiAgICAgIGRvd25UaW1lOiBwb2ludGVyQ29vcmRzLnRpbWVTdGFtcCxcbiAgICAgIGRvd25UYXJnZXQ6IGV2ZW50VGFyZ2V0LFxuICAgIH1dLFxuICAgICdpbnRlcmFjdGlvbi5wb2ludGVycyBpcyB1cGRhdGVkJylcblxuICB0LmRlZXBFcXVhbChpbnRlcmFjdGlvbi5jb29yZHMuc3RhcnQsIHBvaW50ZXJDb29yZHMsICdjb29yZHMuc3RhcnQgYXJlIHNldCB0byBwb2ludGVyJylcbiAgdC5kZWVwRXF1YWwoaW50ZXJhY3Rpb24uY29vcmRzLmN1ciwgICBwb2ludGVyQ29vcmRzLCAnY29vcmRzLmN1ciAgIGFyZSBzZXQgdG8gcG9pbnRlcicpXG4gIHQuZGVlcEVxdWFsKGludGVyYWN0aW9uLmNvb3Jkcy5wcmV2LCAgcG9pbnRlckNvb3JkcywgJ2Nvb3Jkcy5wcmV2ICBhcmUgc2V0IHRvIHBvaW50ZXInKVxuXG4gIHQuZXF1YWwodHlwZW9mIHNpZ25hbEFyZywgJ29iamVjdCcsICdkb3duIHNpZ25hbCB3YXMgZmlyZWQgYWdhaW4nKVxuICB0Lm9rKGludGVyYWN0aW9uLnBvaW50ZXJJc0Rvd24sICdwb2ludGVySXNEb3duJylcbiAgdC5ub3RPayhpbnRlcmFjdGlvbi5wb2ludGVyV2FzTW92ZWQsICdwb2ludGVyV2FzTW92ZWQgc2hvdWxkIGFsd2F5cyBjaGFuZ2UgdG8gZmFsc2UnKVxuXG4gIHQuZW5kKClcbn0pXG5cbnRlc3QoJ0ludGVyYWN0aW9uLnN0YXJ0JywgKHQpID0+IHtcbiAgY29uc3QgaW50ZXJhY3Rpb24gPSBtYWtlSW50ZXJhY3Rpb25BbmRTaWduYWxzKClcbiAgY29uc3QgYWN0aW9uID0geyBuYW1lOiAnVEVTVCcgfVxuICBjb25zdCBpbnRlcmFjdGFibGUgPSBoZWxwZXJzLm1vY2tJbnRlcmFjdGFibGUoKVxuICBjb25zdCBlbGVtZW50OiBhbnkgPSB7fVxuICBjb25zdCBwb2ludGVyID0gaGVscGVycy5uZXdQb2ludGVyKClcbiAgY29uc3QgZXZlbnQ6IGFueSA9IHt9XG5cbiAgaW50ZXJhY3Rpb24uc3RhcnQoYWN0aW9uLCBpbnRlcmFjdGFibGUsIGVsZW1lbnQpXG4gIHQuZXF1YWwoaW50ZXJhY3Rpb24ucHJlcGFyZWQubmFtZSwgbnVsbCwgJ2RvIG5vdGhpbmcgaWYgIXBvaW50ZXJJc0Rvd24nKVxuXG4gIC8vIHBvaW50ZXJzIGlzIHN0aWxsIGVtcHR5XG4gIGludGVyYWN0aW9uLnBvaW50ZXJJc0Rvd24gPSB0cnVlXG4gIGludGVyYWN0aW9uLnN0YXJ0KGFjdGlvbiwgaW50ZXJhY3RhYmxlLCBlbGVtZW50KVxuICB0LmVxdWFsKGludGVyYWN0aW9uLnByZXBhcmVkLm5hbWUsIG51bGwsICdkbyBub3RoaW5nIGlmIHRvbyBmZXcgcG9pbnRlcnMgYXJlIGRvd24nKVxuXG4gIGludGVyYWN0aW9uLnBvaW50ZXJEb3duKHBvaW50ZXIsIGV2ZW50LCBudWxsKVxuXG4gIGludGVyYWN0aW9uLl9pbnRlcmFjdGluZyA9IHRydWVcbiAgaW50ZXJhY3Rpb24uc3RhcnQoYWN0aW9uLCBpbnRlcmFjdGFibGUsIGVsZW1lbnQpXG4gIHQuZXF1YWwoaW50ZXJhY3Rpb24ucHJlcGFyZWQubmFtZSwgbnVsbCwgJ2RvIG5vdGhpbmcgaWYgYWxyZWFkeSBpbnRlcmFjdGluZycpXG5cbiAgaW50ZXJhY3Rpb24uX2ludGVyYWN0aW5nID0gZmFsc2VcblxuICBpbnRlcmFjdGFibGUub3B0aW9uc1thY3Rpb24ubmFtZV0gPSB7IGVuYWJsZWQ6IGZhbHNlIH1cbiAgaW50ZXJhY3Rpb24uc3RhcnQoYWN0aW9uLCBpbnRlcmFjdGFibGUsIGVsZW1lbnQpXG4gIHQuZXF1YWwoaW50ZXJhY3Rpb24ucHJlcGFyZWQubmFtZSwgbnVsbCwgJ2RvIG5vdGhpbmcgaWYgYWN0aW9uIGlzIG5vdCBlbmFibGVkJylcbiAgaW50ZXJhY3RhYmxlLm9wdGlvbnNbYWN0aW9uLm5hbWVdID0geyBlbmFibGVkOiB0cnVlIH1cblxuICBsZXQgc2lnbmFsQXJnXG4gIC8vIGxldCBpbnRlcmFjdGluZ0luU3RhcnRMaXN0ZW5lclxuICBjb25zdCBzaWduYWxMaXN0ZW5lciA9IChhcmcpID0+IHtcbiAgICBzaWduYWxBcmcgPSBhcmdcbiAgICAvLyBpbnRlcmFjdGluZ0luU3RhcnRMaXN0ZW5lciA9IGFyZy5pbnRlcmFjdGlvbi5pbnRlcmFjdGluZygpXG4gIH1cblxuICBpbnRlcmFjdGlvbi5fc2lnbmFscy5vbignYWN0aW9uLXN0YXJ0Jywgc2lnbmFsTGlzdGVuZXIpXG4gIGludGVyYWN0aW9uLnN0YXJ0KGFjdGlvbiwgaW50ZXJhY3RhYmxlLCBlbGVtZW50KVxuXG4gIHQuZXF1YWwoaW50ZXJhY3Rpb24ucHJlcGFyZWQubmFtZSwgYWN0aW9uLm5hbWUsICdhY3Rpb24gaXMgcHJlcGFyZWQnKVxuICB0LmVxdWFsKGludGVyYWN0aW9uLmludGVyYWN0YWJsZSwgaW50ZXJhY3RhYmxlLCAnaW50ZXJhY3Rpb24uaW50ZXJhY3RhYmxlIGlzIHVwZGF0ZWQnKVxuICB0LmVxdWFsKGludGVyYWN0aW9uLmVsZW1lbnQsIGVsZW1lbnQsICdpbnRlcmFjdGlvbi5lbGVtZW50IGlzIHVwZGF0ZWQnKVxuXG4gIC8vIHQuYXNzZXJ0KGludGVyYWN0aW5nSW5TdGFydExpc3RlbmVyLCAnaW50ZXJhY3Rpb24gaXMgaW50ZXJhY3RpbmcgZHVyaW5nIGFjdGlvbi1zdGFydCBzaWduYWwnKVxuICB0LmFzc2VydChpbnRlcmFjdGlvbi5pbnRlcmFjdGluZygpLCAnaW50ZXJhY3Rpb24gaXMgaW50ZXJhY3RpbmcgYWZ0ZXIgc3RhcnQgbWV0aG9kJylcbiAgdC5lcXVhbChzaWduYWxBcmcuaW50ZXJhY3Rpb24sIGludGVyYWN0aW9uLCAnaW50ZXJhY3Rpb24gaW4gc2lnbmFsIGFyZycpXG4gIHQuZXF1YWwoc2lnbmFsQXJnLmV2ZW50LCBldmVudCwgJ2V2ZW50IChpbnRlcmFjdGlvbi5kb3duRXZlbnQpIGluIHNpZ25hbCBhcmcnKVxuXG4gIGludGVyYWN0aW9uLl9pbnRlcmFjdGluZyA9IGZhbHNlXG5cbiAgLy8gaW50ZXJhY3Rpb24uc3RhcnQoYWN0aW9uLCB0YXJnZXQsIGVsZW1lbnQpXG4gIC8vIHQuZGVlcEVxdWFsKHNjb3BlLmludGVyYWN0aW9ucy5saXN0LCBbaW50ZXJhY3Rpb25dLCAnaW50ZXJhY3Rpb24gaXMgYWRkZWQgYmFjayB0byBzY29wZScpXG5cbiAgdC5lbmQoKVxufSlcblxudGVzdCgnc3RvcCBpbnRlcmFjdGlvbiBmcm9tIHN0YXJ0IGV2ZW50JywgKHQpID0+IHtcbiAgY29uc3Qgc2NvcGUgPSBoZWxwZXJzLm1vY2tTY29wZSgpXG5cbiAgY29uc3QgaW50ZXJhY3Rpb24gPSBzY29wZS5pbnRlcmFjdGlvbnMubmV3KHt9KVxuICBjb25zdCBpbnRlcmFjdGFibGUgPSBoZWxwZXJzLm1vY2tJbnRlcmFjdGFibGUoKVxuXG4gIGludGVyYWN0aW9uLmludGVyYWN0YWJsZSA9IGludGVyYWN0YWJsZVxuICBpbnRlcmFjdGlvbi5lbGVtZW50ID0gaW50ZXJhY3RhYmxlLmVsZW1lbnRcbiAgaW50ZXJhY3Rpb24ucHJlcGFyZWQgPSB7IG5hbWU6ICdURVNUJyB9XG5cbiAgaW50ZXJhY3RhYmxlLmV2ZW50cy5vbignVEVTVHN0YXJ0JywgKGV2ZW50KSA9PiB7XG4gICAgZXZlbnQuaW50ZXJhY3Rpb24uc3RvcCgpXG4gIH0pXG5cbiAgaW50ZXJhY3Rpb24uX3NpZ25hbHMuZmlyZSgnYWN0aW9uLXN0YXJ0JywgeyBpbnRlcmFjdGlvbiwgZXZlbnQ6IHt9IH0pXG5cbiAgdC5ub3RPayhpbnRlcmFjdGlvbi5pbnRlcmFjdGluZygpLCAnaW50ZXJhY3Rpb24gY2FuIGJlIHN0b3BwZWQgZnJvbSBzdGFydCBldmVudCBsaXN0ZW5lcicpXG5cbiAgdC5lbmQoKVxufSlcblxudGVzdCgnSW50ZXJhY3Rpb24gY3JlYXRlUHJlcGFyZWRFdmVudCcsICh0KSA9PiB7XG4gIGNvbnN0IHNjb3BlID0gaGVscGVycy5tb2NrU2NvcGUoKVxuXG4gIGNvbnN0IGludGVyYWN0aW9uID0gc2NvcGUuaW50ZXJhY3Rpb25zLm5ldyh7fSlcbiAgY29uc3QgaW50ZXJhY3RhYmxlID0gaGVscGVycy5tb2NrSW50ZXJhY3RhYmxlKClcbiAgY29uc3QgYWN0aW9uID0geyBuYW1lOiAncmVzaXplJyB9XG4gIGNvbnN0IHBoYXNlID0gJ1RFU1RfUEhBU0UnXG5cbiAgaW50ZXJhY3Rpb24ucHJlcGFyZWQgPSBhY3Rpb25cbiAgaW50ZXJhY3Rpb24uaW50ZXJhY3RhYmxlID0gaW50ZXJhY3RhYmxlXG4gIGludGVyYWN0aW9uLmVsZW1lbnQgPSBpbnRlcmFjdGFibGUuZWxlbWVudFxuICBpbnRlcmFjdGlvbi5wcmV2RXZlbnQgPSB7IHBhZ2U6IHt9LCBjbGllbnQ6IHt9LCB2ZWxvY2l0eToge30gfVxuXG4gIGNvbnN0IGlFdmVudCA9IGludGVyYWN0aW9uLl9jcmVhdGVQcmVwYXJlZEV2ZW50KHt9LCBwaGFzZSlcblxuICB0Lm9rKGlFdmVudCBpbnN0YW5jZW9mIEludGVyYWN0RXZlbnQsXG4gICAgJ0ludGVyYWN0RXZlbnQgaXMgZmlyZWQnKVxuXG4gIHQuZXF1YWwoaUV2ZW50LnR5cGUsIGFjdGlvbi5uYW1lICsgcGhhc2UsXG4gICAgJ2V2ZW50IHR5cGUnKVxuXG4gIHQuZXF1YWwoaUV2ZW50LmludGVyYWN0YWJsZSwgaW50ZXJhY3RhYmxlLFxuICAgICdldmVudC5pbnRlcmFjdGFibGUnKVxuXG4gIHQuZXF1YWwoaUV2ZW50LnRhcmdldCwgaW50ZXJhY3RhYmxlLmVsZW1lbnQsXG4gICAgJ2V2ZW50LnRhcmdldCcpXG5cbiAgdC5lbmQoKVxufSlcblxudGVzdCgnSW50ZXJhY3Rpb24gZmlyZUV2ZW50JywgKHQpID0+IHtcbiAgY29uc3QgaW50ZXJhY3Rpb24gPSBuZXcgSW50ZXJhY3Rpb24oeyBzaWduYWxzOiBoZWxwZXJzLm1vY2tTaWduYWxzKCkgfSlcbiAgY29uc3QgaW50ZXJhY3RhYmxlID0gaGVscGVycy5tb2NrSW50ZXJhY3RhYmxlKClcbiAgY29uc3QgaUV2ZW50ID0ge30gYXMgSW50ZXJhY3QuSW50ZXJhY3RFdmVudFxuICBsZXQgZmlyZWRFdmVudFxuXG4gIC8vIHRoaXMgbWV0aG9kIHNob3VsZCBiZSBjYWxsZWQgZnJvbSBhY3Rpb25zLmZpcmVQcmVwYXJlZFxuICBpbnRlcmFjdGFibGUuZmlyZSA9IChldmVudCkgPT4ge1xuICAgIGZpcmVkRXZlbnQgPSBldmVudFxuICB9XG5cbiAgaW50ZXJhY3Rpb24uaW50ZXJhY3RhYmxlID0gaW50ZXJhY3RhYmxlXG4gIGludGVyYWN0aW9uLl9maXJlRXZlbnQoaUV2ZW50KVxuXG4gIHQuZXF1YWwoZmlyZWRFdmVudCwgaUV2ZW50LFxuICAgICd0YXJnZXQgaW50ZXJhY3RhYmxlXFwncyBmaXJlIG1ldGhvZCBpcyBjYWxsZWQnKVxuXG4gIHQuZXF1YWwoaW50ZXJhY3Rpb24ucHJldkV2ZW50LCBpRXZlbnQsXG4gICAgJ2ludGVyYWN0aW9uLnByZXZFdmVudCBpcyB1cGRhdGVkJylcblxuICB0LmVuZCgpXG59KVxuIl19