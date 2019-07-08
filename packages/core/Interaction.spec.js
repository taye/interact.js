import test from '@interactjs/_dev/test/test';
import drag from '@interactjs/actions/drag';
import autoStart from '@interactjs/auto-start/base';
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
    const { interaction, interactable, target, } = helpers.testEnv({ plugins: [drag, autoStart] });
    let stoppedBeforeStartFired;
    interactable.on('dragstart', (event) => {
        stoppedBeforeStartFired = interaction._stopped;
        event.interaction.stop();
    });
    interaction.start({ name: 'drag' }, interactable, target);
    t.notOk(stoppedBeforeStartFired, '!interaction._stopped in start listener');
    t.notOk(interaction.interacting(), 'interaction can be stopped from start event listener');
    t.ok(interaction._stopped, 'interaction._stopped after stop() in start listener');
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiSW50ZXJhY3Rpb24uc3BlYy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIkludGVyYWN0aW9uLnNwZWMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxJQUFJLE1BQU0sNEJBQTRCLENBQUE7QUFDN0MsT0FBTyxJQUFJLE1BQU0sMEJBQTBCLENBQUE7QUFDM0MsT0FBTyxTQUFTLE1BQU0sNkJBQTZCLENBQUE7QUFDbkQsT0FBTyxZQUFZLE1BQU0sZ0NBQWdDLENBQUE7QUFDekQsT0FBTyxPQUFPLE1BQU0sMkJBQTJCLENBQUE7QUFDL0MsT0FBTyxhQUFhLE1BQU0saUJBQWlCLENBQUE7QUFDM0MsT0FBTyxXQUFXLE1BQU0sZUFBZSxDQUFBO0FBQ3ZDLE9BQU8sS0FBSyxPQUFPLE1BQU0sa0JBQWtCLENBQUE7QUFFM0MsTUFBTSx5QkFBeUIsR0FBRyxHQUFHLEVBQUUsQ0FBQyxJQUFJLFdBQVcsQ0FBQyxFQUFFLE9BQU8sRUFBRSxJQUFJLE9BQU8sRUFBRSxFQUFTLENBQUMsQ0FBQTtBQUUxRixJQUFJLENBQUMseUJBQXlCLEVBQUUsQ0FBQyxDQUFDLEVBQUUsRUFBRTtJQUNwQyxNQUFNLFFBQVEsR0FBRyxNQUFNLENBQUE7SUFDdkIsTUFBTSxPQUFPLEdBQUcsSUFBSSxPQUFPLEVBQUUsQ0FBQTtJQUM3QixNQUFNLFdBQVcsR0FBRyxJQUFJLFdBQVcsQ0FBQztRQUNsQyxXQUFXLEVBQUUsUUFBUTtRQUNyQixPQUFPO0tBQ1IsQ0FBQyxDQUFBO0lBQ0YsTUFBTSxVQUFVLEdBQUc7UUFDakIsSUFBSSxFQUFPLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFO1FBQ3pCLE1BQU0sRUFBSyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRTtRQUN6QixTQUFTLEVBQUUsQ0FBQztLQUNiLENBQUE7SUFFRCxDQUFDLENBQUMsS0FBSyxDQUFDLFdBQVcsQ0FBQyxRQUFRLEVBQUUs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QUFDLE1BQU0sQ0FBQyxNQUFNLEVBQUUsWUFBWSxDQUFDLE9BQU8sRUFDekMsY0FBYyxDQUFDLENBQUE7SUFFakIsQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFBO0FBQ1QsQ0FBQyxDQUFDLENBQUE7QUFFRixJQUFJLENBQUMsdUJBQXVCLEVBQUUsQ0FBQyxDQUFDLEVBQUUsRUFBRTtJQUNsQyxNQUFNLFdBQVcsR0FBRyxJQUFJLFdBQVcsQ0FBQyxFQUFFLE9BQU8sRUFBRSxPQUFPLENBQUMsV0FBVyxFQUFFLEVBQUUsQ0FBQyxDQUFBO0lBQ3ZFLE1BQU0sWUFBWSxHQUFHLE9BQU8sQ0FBQyxnQkFBZ0IsRUFBRSxDQUFBO0lBQy9DLE1BQU0sTUFBTSxHQUFHLEVBQTRCLENBQUE7SUFDM0MsSUFBSSxVQUFVLENBQUE7SUFFZCx5REFBeUQ7SUFDekQsWUFBWSxDQUFDLElBQUksR0FBRyxDQUFDLEtBQUssRUFBRSxFQUFFO1FBQzVCLFVBQVUsR0FBRyxLQUFLLENBQUE7SUFDcEIsQ0FBQyxDQUFBO0lBRUQsV0FBVyxDQUFDLFlBQVksR0FBRyxZQUFZLENBQUE7SUFDdkMsV0FBVyxDQUFDLFVBQVUsQ0FBQyxNQUFNLENBQUMsQ0FBQTtJQUU5QixDQUFDLENBQUMsS0FBSyxDQUFDLFVBQVUsRUFBRSxNQUFNLEVBQ3hCLDhDQUE4QyxDQUFDLENBQUE7SUFFakQsQ0FBQyxDQUFDLEtBQUssQ0FBQyxXQUFXLENBQUMsU0FBUyxFQUFFLE1BQU0sRUFDbkMsa0NBQWtDLENBQUMsQ0FBQTtJQUVyQyxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUE7QUFDVCxDQUFDLENBQUMsQ0FBQSIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB0ZXN0IGZyb20gJ0BpbnRlcmFjdGpzL19kZXYvdGVzdC90ZXN0J1xuaW1wb3J0IGRyYWcgZnJvbSAnQGludGVyYWN0anMvYWN0aW9ucy9kcmFnJ1xuaW1wb3J0IGF1dG9TdGFydCBmcm9tICdAaW50ZXJhY3Rqcy9hdXRvLXN0YXJ0L2Jhc2UnXG5pbXBvcnQgcG9pbnRlclV0aWxzIGZyb20gJ0BpbnRlcmFjdGpzL3V0aWxzL3BvaW50ZXJVdGlscydcbmltcG9ydCBTaWduYWxzIGZyb20gJ0BpbnRlcmFjdGpzL3V0aWxzL1NpZ25hbHMnXG5pbXBvcnQgSW50ZXJhY3RFdmVudCBmcm9tICcuL0ludGVyYWN0RXZlbnQnXG5pbXBvcnQgSW50ZXJhY3Rpb24gZnJvbSAnLi9JbnRlcmFjdGlvbidcbmltcG9ydCAqIGFzIGhlbHBlcnMgZnJvbSAnLi90ZXN0cy9faGVscGVycydcblxuY29uc3QgbWFrZUludGVyYWN0aW9uQW5kU2lnbmFscyA9ICgpID0+IG5ldyBJbnRlcmFjdGlvbih7IHNpZ25hbHM6IG5ldyBTaWduYWxzKCkgfSBhcyBhbnkpXG5cbnRlc3QoJ0ludGVyYWN0aW9uIGNvbnN0cnVjdG9yJywgKHQpID0+IHtcbiAgY29uc3QgdGVzdFR5cGUgPSAndGVzdCdcbiAgY29uc3Qgc2lnbmFscyA9IG5ldyBTaWduYWxzKClcbiAgY29uc3QgaW50ZXJhY3Rpb24gPSBuZXcgSW50ZXJhY3Rpb24oe1xuICAgIHBvaW50ZXJUeXBlOiB0ZXN0VHlwZSxcbiAgICBzaWduYWxzLFxuICB9KVxuICBjb25zdCB6ZXJvQ29vcmRzID0ge1xuICAgIHBhZ2UgICAgIDogeyB4OiAwLCB5OiAwIH0sXG4gICAgY2xpZW50ICAgOiB7IHg6IDAsIHk6IDAgfSxcbiAgICB0aW1lU3RhbXA6IDAsXG4gIH1cblxuICB0LmVxdWFsKGludGVyYWN0aW9uLl9zaWduYWxzLCBzaWduYWxzLFxuICAgICdzaWduYWxzIG9wdGlvbiBpcyBzZXQgYXNzaWduZWQgdG8gaW50ZXJhY3Rpb24uX3NpZ25hbHMnKVxuXG4gIHQub2soaW50ZXJhY3Rpb24ucHJlcGFyZWQgaW5zdGFuY2VvZiBPYmplY3QsXG4gICAgJ2ludGVyYWN0aW9uLnByZXBhcmVkIGlzIGFuIG9iamVjdCcpXG4gIHQub2soaW50ZXJhY3Rpb24uZG93blBvaW50ZXIgaW5zdGFuY2VvZiBPYmplY3QsXG4gICAgJ2ludGVyYWN0aW9uLmRvd25Qb2ludGVyIGlzIGFuIG9iamVjdCcpXG5cbiAgZm9yIChjb25zdCBjb29yZEZpZWxkIGluIGludGVyYWN0aW9uLmNvb3Jkcykge1xuICAgIHQuZGVlcEVxdWFsKGludGVyYWN0aW9uLmNvb3Jkc1tjb29yZEZpZWxkXSwgemVyb0Nvb3JkcyxcbiAgICAgIGBpbnRlcmFjdGlvbi5jb29yZHMuJHtjb29yZEZpZWxkfSBzZXQgdG8gemVyb2ApXG4gIH1cblxuICB0LmVxdWFsKGludGVyYWN0aW9uLnBvaW50ZXJUeXBlLCB0ZXN0VHlwZSxcbiAgICAnaW50ZXJhY3Rpb24ucG9pbnRlclR5cGUgaXMgc2V0JylcblxuICAvLyBwb2ludGVySW5mbyBwcm9wZXJ0aWVzXG4gIHQuZGVlcEVxdWFsKFxuICAgIGludGVyYWN0aW9uLnBvaW50ZXJzLFxuICAgIFtdLFxuICAgICdpbnRlcmFjdGlvbi5wb2ludGVycyBpcyBpbml0aWFsbHkgYW4gZW1wdHkgYXJyYXknKVxuXG4gIC8vIGZhbHNlIHByb3BlcnRpZXNcbiAgZm9yIChjb25zdCBwcm9wIG9mICdwb2ludGVySXNEb3duIHBvaW50ZXJXYXNNb3ZlZCBfaW50ZXJhY3RpbmcgbW91c2UnLnNwbGl0KCcgJykpIHtcbiAgICB0Lm5vdE9rKGludGVyYWN0aW9uW3Byb3BdLCBgaW50ZXJhY3Rpb24uJHtwcm9wfSBpcyBmYWxzZWApXG4gIH1cblxuICB0LmVuZCgpXG59KVxuXG50ZXN0KCdJbnRlcmFjdGlvbiBkZXN0cm95JywgKHQpID0+IHtcbiAgY29uc3QgaW50ZXJhY3Rpb24gPSBtYWtlSW50ZXJhY3Rpb25BbmRTaWduYWxzKClcbiAgY29uc3QgcG9pbnRlciA9IHsgcG9pbnRlcklkOiAxMCB9IGFzIGFueVxuICBjb25zdCBldmVudCA9IHt9IGFzIGFueVxuXG4gIGludGVyYWN0aW9uLnVwZGF0ZVBvaW50ZXIocG9pbnRlciwgZXZlbnQsIG51bGwpXG5cbiAgaW50ZXJhY3Rpb24uZGVzdHJveSgpXG5cbiAgdC5zdHJpY3RFcXVhbChpbnRlcmFjdGlvbi5fbGF0ZXN0UG9pbnRlci5wb2ludGVyLCBudWxsLFxuICAgICdpbnRlcmFjdGlvbi5fbGF0ZXN0UG9pbnRlci5wb2ludGVyIGlzIG51bGwnKVxuXG4gIHQuc3RyaWN0RXF1YWwoaW50ZXJhY3Rpb24uX2xhdGVzdFBvaW50ZXIuZXZlbnQsIG51bGwsXG4gICAgJ2ludGVyYWN0aW9uLl9sYXRlc3RQb2ludGVyLmV2ZW50IGlzIG51bGwnKVxuXG4gIHQuc3RyaWN0RXF1YWwoaW50ZXJhY3Rpb24uX2xhdGVzdFBvaW50ZXIuZXZlbnRUYXJnZXQsIG51bGwsXG4gICAgJ2ludGVyYWN0aW9uLl9sYXRlc3RQb2ludGVyLmV2ZW50VGFyZ2V0IGlzIG51bGwnKVxuXG4gIHQuZW5kKClcbn0pXG5cbnRlc3QoJ0ludGVyYWN0aW9uLmdldFBvaW50ZXJJbmRleCcsICh0KSA9PiB7XG4gIGNvbnN0IGludGVyYWN0aW9uID0gbWFrZUludGVyYWN0aW9uQW5kU2lnbmFscygpXG5cbiAgaW50ZXJhY3Rpb24ucG9pbnRlcnMgPSBbMiwgNCwgNSwgMCwgLTFdLm1hcCgoaWQpID0+ICh7IGlkIH0pKSBhcyBhbnlcblxuICBpbnRlcmFjdGlvbi5wb2ludGVycy5mb3JFYWNoKCh7IGlkIH0sIGluZGV4KSA9PiB7XG4gICAgdC5lcXVhbChpbnRlcmFjdGlvbi5nZXRQb2ludGVySW5kZXgoeyBwb2ludGVySWQ6IGlkIH0pLCBpbmRleClcbiAgfSlcblxuICB0LmVuZCgpXG59KVxuXG50ZXN0KCdJbnRlcmFjdGlvbi51cGRhdGVQb2ludGVyJywgKHQpID0+IHtcbiAgdC50ZXN0KCdubyBleGlzdGluZyBwb2ludGVycycsIChzdCkgPT4ge1xuICAgIGNvbnN0IGludGVyYWN0aW9uID0gbWFrZUludGVyYWN0aW9uQW5kU2lnbmFscygpXG4gICAgY29uc3QgcG9pbnRlciA9IHsgcG9pbnRlcklkOiAxMCB9IGFzIGFueVxuICAgIGNvbnN0IGV2ZW50ID0ge30gYXMgYW55XG5cbiAgICBjb25zdCByZXQgPSBpbnRlcmFjdGlvbi51cGRhdGVQb2ludGVyKHBvaW50ZXIsIGV2ZW50LCBudWxsKVxuXG4gICAgc3QuZGVlcEVxdWFsKFxuICAgICAgaW50ZXJhY3Rpb24ucG9pbnRlcnMsXG4gICAgICBbe1xuICAgICAgICBpZDogcG9pbnRlci5wb2ludGVySWQsXG4gICAgICAgIHBvaW50ZXIsXG4gICAgICAgIGV2ZW50LFxuICAgICAgICBkb3duVGltZTogbnVsbCxcbiAgICAgICAgZG93blRhcmdldDogbnVsbCxcbiAgICAgIH1dLFxuICAgICAgJ2ludGVyYWN0aW9uLnBvaW50ZXJzID09IFt7IHBvaW50ZXIsIC4uLiB9XScpXG4gICAgc3QuZXF1YWwocmV0LCAwLCAnbmV3IHBvaW50ZXIgaW5kZXggaXMgcmV0dXJuZWQnKVxuXG4gICAgc3QuZW5kKClcbiAgfSlcblxuICB0LnRlc3QoJ25ldyBwb2ludGVyIHdpdGggZXhpc2l0aW5nIHBvaW50ZXInLCAoc3QpID0+IHtcbiAgICBjb25zdCBpbnRlcmFjdGlvbiA9IG1ha2VJbnRlcmFjdGlvbkFuZFNpZ25hbHMoKVxuICAgIGNvbnN0IGV4aXN0aW5nOiBhbnkgPSB7IHBvaW50ZXJJZDogMCB9XG4gICAgY29uc3QgZXZlbnQ6IGFueSA9IHt9XG5cbiAgICBpbnRlcmFjdGlvbi51cGRhdGVQb2ludGVyKGV4aXN0aW5nLCBldmVudCwgbnVsbClcblxuICAgIGNvbnN0IG5ld1BvaW50ZXI6IGFueSA9IHsgcG9pbnRlcklkOiAxMCB9XG4gICAgY29uc3QgcmV0ID0gaW50ZXJhY3Rpb24udXBkYXRlUG9pbnRlcihuZXdQb2ludGVyLCBldmVudCwgbnVsbClcblxuICAgIHN0LmRlZXBFcXVhbChcbiAgICAgIGludGVyYWN0aW9uLnBvaW50ZXJzLCBbXG4gICAgICAgIHtcbiAgICAgICAgICBpZDogZXhpc3RpbmcucG9pbnRlcklkLFxuICAgICAgICAgIHBvaW50ZXI6IGV4aXN0aW5nLFxuICAgICAgICAgIGV2ZW50LFxuICAgICAgICAgIGRvd25UaW1lOiBudWxsLFxuICAgICAgICAgIGRvd25UYXJnZXQ6IG51bGwsXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICBpZDogbmV3UG9pbnRlci5wb2ludGVySWQsXG4gICAgICAgICAgcG9pbnRlcjogbmV3UG9pbnRlcixcbiAgICAgICAgICBldmVudCxcbiAgICAgICAgICBkb3duVGltZTogbnVsbCxcbiAgICAgICAgICBkb3duVGFyZ2V0OiBudWxsLFxuICAgICAgICB9LFxuICAgICAgXSxcbiAgICAgICdpbnRlcmFjdGlvbi5wb2ludGVycyA9PSBbeyBwb2ludGVyOiBleGlzdGluZywgLi4uIH0sIHsgcG9pbnRlcjogbmV3UG9pbnRlciwgLi4uIH1dJylcblxuICAgIHN0LmVxdWFsKHJldCwgMSwgJ3NlY29uZCBwb2ludGVyIGluZGV4IGlzIDEnKVxuXG4gICAgc3QuZW5kKClcbiAgfSlcblxuICB0LnRlc3QoJ3VwZGF0ZSBleGlzdGluZyBwb2ludGVycycsIChzdCkgPT4ge1xuICAgIGNvbnN0IGludGVyYWN0aW9uID0gbWFrZUludGVyYWN0aW9uQW5kU2lnbmFscygpXG5cbiAgICBjb25zdCBvbGRQb2ludGVycyA9IFstMywgMTAsIDJdLm1hcCgocG9pbnRlcklkKSA9PiAoeyBwb2ludGVySWQgfSkpXG4gICAgY29uc3QgbmV3UG9pbnRlcnMgPSBvbGRQb2ludGVycy5tYXAoKHBvaW50ZXIpID0+ICh7IC4uLnBvaW50ZXIsIG5ldzogdHJ1ZSB9KSlcblxuICAgIG9sZFBvaW50ZXJzLmZvckVhY2goKHBvaW50ZXI6IGFueSkgPT4gaW50ZXJhY3Rpb24udXBkYXRlUG9pbnRlcihwb2ludGVyLCBwb2ludGVyLCBudWxsKSlcbiAgICBuZXdQb2ludGVycy5mb3JFYWNoKChwb2ludGVyOiBhbnkpID0+IGludGVyYWN0aW9uLnVwZGF0ZVBvaW50ZXIocG9pbnRlciwgcG9pbnRlciwgbnVsbCkpXG5cbiAgICBzdC5lcXVhbChpbnRlcmFjdGlvbi5wb2ludGVycy5sZW5ndGgsIG9sZFBvaW50ZXJzLmxlbmd0aCxcbiAgICAgICdudW1iZXIgb2YgcG9pbnRlcnMgaXMgdW5jaGFuZ2VkJylcblxuICAgIGludGVyYWN0aW9uLnBvaW50ZXJzLmZvckVhY2goKHBvaW50ZXJJbmZvLCBpKSA9PiB7XG4gICAgICBzdC5lcXVhbChwb2ludGVySW5mby5pZCwgb2xkUG9pbnRlcnNbaV0ucG9pbnRlcklkLFxuICAgICAgICBgcG9pbnRlclske2l9XS5pZCBpcyB0aGUgc2FtZWApXG4gICAgICBzdC5ub3RFcXVhbChwb2ludGVySW5mby5wb2ludGVyLCBvbGRQb2ludGVyc1tpXSxcbiAgICAgICAgYG5ldyBwb2ludGVyICR7aX0gIT09IG9sZCBwb2ludGVyIG9iamVjdGApXG4gICAgfSlcblxuICAgIHN0LmVuZCgpXG4gIH0pXG5cbiAgdC5lbmQoKVxufSlcblxudGVzdCgnSW50ZXJhY3Rpb24ucmVtb3ZlUG9pbnRlcicsICh0KSA9PiB7XG4gIGNvbnN0IGludGVyYWN0aW9uID0gbWFrZUludGVyYWN0aW9uQW5kU2lnbmFscygpXG4gIGNvbnN0IGlkcyA9IFswLCAxLCAyLCAzXVxuICBjb25zdCByZW1vdmFscyA9IFtcbiAgICB7IGlkOiAwLCByZW1haW46IFsxLCAyLCAzXSwgbWVzc2FnZTogJ2ZpcnN0IG9mIDQnIH0sXG4gICAgeyBpZDogMiwgcmVtYWluOiBbMSwgICAgM10sIG1lc3NhZ2U6ICdtaWRkbGUgb2YgMycgfSxcbiAgICB7IGlkOiAzLCByZW1haW46IFsxICAgICAgXSwgbWVzc2FnZTogJ2xhc3Qgb2YgMicgfSxcbiAgICB7IGlkOiAxLCByZW1haW46IFsgICAgICAgXSwgbWVzc2FnZTogJ2ZpbmFsJyB9LFxuICBdXG5cbiAgaWRzLmZvckVhY2goKHBvaW50ZXJJZCkgPT4gaW50ZXJhY3Rpb24udXBkYXRlUG9pbnRlcih7IHBvaW50ZXJJZCB9IGFzIGFueSwge30gYXMgYW55LCBudWxsKSlcblxuICBmb3IgKGNvbnN0IHJlbW92YWwgb2YgcmVtb3ZhbHMpIHtcbiAgICBpbnRlcmFjdGlvbi5yZW1vdmVQb2ludGVyKHsgcG9pbnRlcklkOiByZW1vdmFsLmlkIH0gYXMgSW50ZXJhY3QuUG9pbnRlclR5cGUsIG51bGwpXG5cbiAgICB0LmRlZXBFcXVhbChcbiAgICAgIGludGVyYWN0aW9uLnBvaW50ZXJzLm1hcCgocCkgPT4gcC5pZCksXG4gICAgICByZW1vdmFsLnJlbWFpbixcbiAgICAgIGAke3JlbW92YWwubWVzc2FnZX0gLSByZW1haW5pbmcgaW50ZXJhY3Rpb24ucG9pbnRlcnMgaXMgY29ycmVjdGApXG4gIH1cblxuICB0LmVuZCgpXG59KVxuXG50ZXN0KCdJbnRlcmFjdGlvbi5wb2ludGVye0Rvd24sTW92ZSxVcH0gdXBkYXRlUG9pbnRlcicsICh0KSA9PiB7XG4gIGNvbnN0IHNpZ25hbHMgPSBuZXcgU2lnbmFscygpXG4gIGNvbnN0IGludGVyYWN0aW9uID0gbmV3IEludGVyYWN0aW9uKHsgc2lnbmFscyB9IGFzIGFueSlcbiAgY29uc3QgZXZlbnRUYXJnZXQ6IGFueSA9IHt9XG4gIGNvbnN0IHBvaW50ZXI6IGFueSA9IHtcbiAgICB0YXJnZXQ6IGV2ZW50VGFyZ2V0LFxuICAgIHBvaW50ZXJJZDogMCxcbiAgfVxuICBsZXQgaW5mbzogYW55ID0ge31cblxuICBzaWduYWxzLm9uKCd1cGRhdGUtcG9pbnRlcicsIChhcmcpID0+IHsgaW5mby51cGRhdGVkID0gYXJnLnBvaW50ZXJJbmZvIH0pXG4gIHNpZ25hbHMub24oJ3JlbW92ZS1wb2ludGVyJywgKGFyZykgPT4geyBpbmZvLnJlbW92ZWQgPSBhcmcucG9pbnRlckluZm8gfSlcblxuICBpbnRlcmFjdGlvbi5jb29yZHMuY3VyLnRpbWVTdGFtcCA9IDBcbiAgY29uc3QgY29tbW9uUG9pbnRlckluZm8gPSB7XG4gICAgaWQ6IDAsXG4gICAgcG9pbnRlcixcbiAgICBldmVudDogcG9pbnRlcixcbiAgICBkb3duVGltZTogbnVsbCxcbiAgICBkb3duVGFyZ2V0OiBudWxsLFxuICB9XG5cbiAgaW50ZXJhY3Rpb24ucG9pbnRlckRvd24ocG9pbnRlciwgcG9pbnRlciwgZXZlbnRUYXJnZXQpXG4gIHQuZGVlcEVxdWFsKFxuICAgIGluZm8udXBkYXRlZCxcbiAgICB7XG4gICAgICAuLi5jb21tb25Qb2ludGVySW5mbyxcbiAgICAgIGRvd25UaW1lOiBpbnRlcmFjdGlvbi5jb29yZHMuY3VyLnRpbWVTdGFtcCxcbiAgICAgIGRvd25UYXJnZXQ6IGV2ZW50VGFyZ2V0LFxuICAgIH0sXG4gICAgJ2ludGVyYWN0aW9uLnBvaW50ZXJEb3duIHVwZGF0ZXMgcG9pbnRlcidcbiAgKVxuICB0LmVxdWFsKGluZm8ucmVtb3ZlZCwgdW5kZWZpbmVkLCAnaW50ZXJhY3Rpb24ucG9pbnRlckRvd24gZG9lc25cXCd0IHJlbW92ZSBwb2ludGVyJylcbiAgaW50ZXJhY3Rpb24ucmVtb3ZlUG9pbnRlcihwb2ludGVyLCBudWxsKVxuICBpbmZvID0ge31cblxuICBpbnRlcmFjdGlvbi5wb2ludGVyTW92ZShwb2ludGVyLCBwb2ludGVyLCBldmVudFRhcmdldClcbiAgdC5kZWVwRXF1YWwoXG4gICAgaW5mby51cGRhdGVkLFxuICAgIGNvbW1vblBvaW50ZXJJbmZvLFxuICAgICdpbnRlcmFjdGlvbi5wb2ludGVyTW92ZSB1cGRhdGVzIHBvaW50ZXInXG4gIClcbiAgdC5lcXVhbChpbmZvLnJlbW92ZWQsIHVuZGVmaW5lZCwgJ2ludGVyYWN0aW9uLnBvaW50ZXJNb3ZlIGRvZXNuXFwndCByZW1vdmUgcG9pbnRlcicpXG4gIGluZm8gPSB7fVxuXG4gIGludGVyYWN0aW9uLnBvaW50ZXJVcChwb2ludGVyLCBwb2ludGVyLCBldmVudFRhcmdldCwgbnVsbClcbiAgdC5lcXVhbChpbmZvLnVwZGF0ZWQsIHVuZGVmaW5lZCwgJ2ludGVyYWN0aW9uLnBvaW50ZXJVcCBkb2VzblxcJ3QgdXBkYXRlIGV4aXN0aW5nIHBvaW50ZXInKVxuICBpbmZvID0ge31cblxuICBpbnRlcmFjdGlvbi5wb2ludGVyVXAocG9pbnRlciwgcG9pbnRlciwgZXZlbnRUYXJnZXQsIG51bGwpXG4gIHQuZGVlcEVxdWFsKFxuICAgIGluZm8udXBkYXRlZCxcbiAgICBjb21tb25Qb2ludGVySW5mbyxcbiAgICAnaW50ZXJhY3Rpb24ucG9pbnRlclVwIHVwZGF0ZXMgbm9uIGV4aXN0aW5nIHBvaW50ZXInXG4gIClcbiAgdC5kZWVwRXF1YWwoaW5mby5yZW1vdmVkLCBjb21tb25Qb2ludGVySW5mbywgJ2ludGVyYWN0aW9uLnBvaW50ZXJVcCBhbHNvIHJlbW92ZXMgcG9pbnRlcicpXG4gIGluZm8gPSB7fVxuXG4gIHQuZW5kKClcbn0pXG5cbnRlc3QoJ0ludGVyYWN0aW9uLnBvaW50ZXJEb3duJywgKHQpID0+IHtcbiAgY29uc3QgaW50ZXJhY3Rpb24gPSBtYWtlSW50ZXJhY3Rpb25BbmRTaWduYWxzKClcbiAgY29uc3QgY29vcmRzID0gaGVscGVycy5uZXdDb29yZHNTZXQoKVxuICBjb25zdCBldmVudFRhcmdldCA9IHt9IGFzIEVsZW1lbnRcbiAgY29uc3QgZXZlbnQ6IGFueSA9IHtcbiAgICB0eXBlOiAnZG93bicsXG4gICAgdGFyZ2V0OiBldmVudFRhcmdldCxcbiAgfVxuICBjb25zdCBwb2ludGVyOiBhbnkgPSBoZWxwZXJzLm5ld1BvaW50ZXIoKVxuICBsZXQgc2lnbmFsQXJnXG5cbiAgY29uc3Qgc2lnbmFsTGlzdGVuZXIgPSAoYXJnKSA9PiB7XG4gICAgc2lnbmFsQXJnID0gYXJnXG4gIH1cblxuICBpbnRlcmFjdGlvbi5fc2lnbmFscy5vbignZG93bicsIHNpZ25hbExpc3RlbmVyKVxuXG4gIGNvbnN0IHBvaW50ZXJDb29yZHM6IGFueSA9IHsgcGFnZToge30sIGNsaWVudDoge30gfVxuICBwb2ludGVyVXRpbHMuc2V0Q29vcmRzKHBvaW50ZXJDb29yZHMsIFtwb2ludGVyXSwgZXZlbnQudGltZVN0YW1wKVxuXG4gIGZvciAoY29uc3QgcHJvcCBpbiBjb29yZHMpIHtcbiAgICBwb2ludGVyVXRpbHMuY29weUNvb3JkcyhpbnRlcmFjdGlvbi5jb29yZHNbcHJvcF0sIGNvb3Jkc1twcm9wXSlcbiAgfVxuXG4gIC8vIHRlc3Qgd2hpbGUgaW50ZXJhY3RpbmdcbiAgaW50ZXJhY3Rpb24uX2ludGVyYWN0aW5nID0gdHJ1ZVxuICBpbnRlcmFjdGlvbi5wb2ludGVyRG93bihwb2ludGVyLCBldmVudCwgZXZlbnRUYXJnZXQpXG5cbiAgdC5lcXVhbChpbnRlcmFjdGlvbi5kb3duRXZlbnQsIG51bGwsICdkb3duRXZlbnQgaXMgbm90IHVwZGF0ZWQnKVxuICB0LmRlZXBFcXVhbChcbiAgICBpbnRlcmFjdGlvbi5wb2ludGVycyxcbiAgICBbe1xuICAgICAgaWQ6IHBvaW50ZXIucG9pbnRlcklkLFxuICAgICAgcG9pbnRlcixcbiAgICAgIGV2ZW50LFxuICAgICAgZG93blRpbWU6IG51bGwsXG4gICAgICBkb3duVGFyZ2V0OiBudWxsLFxuICAgIH1dLFxuICAgICdwb2ludGVyIGlzIGFkZGVkJ1xuICApXG5cbiAgdC5kZWVwRXF1YWwoaW50ZXJhY3Rpb24uZG93blBvaW50ZXIsIHt9IGFzIGFueSwgJ2Rvd25Qb2ludGVyIGlzIG5vdCB1cGRhdGVkJylcblxuICB0LmRlZXBFcXVhbChpbnRlcmFjdGlvbi5jb29yZHMuc3RhcnQsIGNvb3Jkcy5zdGFydCwgJ2Nvb3Jkcy5zdGFydCBhcmUgbm90IG1vZGlmaWVkJylcbiAgdC5kZWVwRXF1YWwoaW50ZXJhY3Rpb24uY29vcmRzLmN1ciwgICBjb29yZHMuY3VyLCAgICdjb29yZHMuY3VyICAgYXJlIG5vdCBtb2RpZmllZCcpXG4gIHQuZGVlcEVxdWFsKGludGVyYWN0aW9uLmNvb3Jkcy5wcmV2LCAgY29vcmRzLnByZXYsICAnY29vcmRzLnByZXYgIGFyZSBub3QgbW9kaWZpZWQnKVxuXG4gIHQub2soaW50ZXJhY3Rpb24ucG9pbnRlcklzRG93biwgJ3BvaW50ZXJJc0Rvd24nKVxuICB0Lm5vdE9rKGludGVyYWN0aW9uLnBvaW50ZXJXYXNNb3ZlZCwgJyFwb2ludGVyV2FzTW92ZWQnKVxuXG4gIHQuZXF1YWwoc2lnbmFsQXJnLnBvaW50ZXIsICAgICAgcG9pbnRlciwgICAgICdwb2ludGVyICAgICAgaW4gZG93biBzaWduYWwgYXJnJylcbiAgdC5lcXVhbChzaWduYWxBcmcuZXZlbnQsICAgICAgICBldmVudCwgICAgICAgJ2V2ZW50ICAgICAgICBpbiBkb3duIHNpZ25hbCBhcmcnKVxuICB0LmVxdWFsKHNpZ25hbEFyZy5ldmVudFRhcmdldCwgIGV2ZW50VGFyZ2V0LCAnZXZlbnRUYXJnZXQgIGluIGRvd24gc2lnbmFsIGFyZycpXG4gIHQuZXF1YWwoc2lnbmFsQXJnLnBvaW50ZXJJbmRleCwgMCwgICAgICAgICAgICdwb2ludGVySW5kZXggaW4gZG93biBzaWduYWwgYXJnJylcblxuICAvLyB0ZXN0IHdoaWxlIG5vdCBpbnRlcmFjdGluZ1xuICBpbnRlcmFjdGlvbi5faW50ZXJhY3RpbmcgPSBmYWxzZVxuICAvLyByZXNldCBwb2ludGVySXNEb3duXG4gIGludGVyYWN0aW9uLnBvaW50ZXJJc0Rvd24gPSBmYWxzZVxuICAvLyBwcmV0ZW5kIHBvaW50ZXIgd2FzIG1vdmVkXG4gIGludGVyYWN0aW9uLnBvaW50ZXJXYXNNb3ZlZCA9IHRydWVcbiAgLy8gcmVzZXQgc2lnbmFsQXJnIG9iamVjdFxuICBzaWduYWxBcmcgPSB1bmRlZmluZWRcblxuICBpbnRlcmFjdGlvbi5yZW1vdmVQb2ludGVyKHBvaW50ZXIsIG51bGwpXG4gIGludGVyYWN0aW9uLnBvaW50ZXJEb3duKHBvaW50ZXIsIGV2ZW50LCBldmVudFRhcmdldClcblxuICAvLyB0aW1lU3RhbXAgaXMgYXNzaWduZWQgd2l0aCBuZXcgRGF0ZS5nZXRUaW1lKClcbiAgLy8gZG9uJ3QgbGV0IGl0IGNhdXNlIGRlZXBFYXVhbCB0byBmYWlsXG4gIHBvaW50ZXJDb29yZHMudGltZVN0YW1wID0gaW50ZXJhY3Rpb24uY29vcmRzLnN0YXJ0LnRpbWVTdGFtcFxuXG4gIHQuZXF1YWwoaW50ZXJhY3Rpb24uZG93bkV2ZW50LCBldmVudCwgJ2Rvd25FdmVudCBpcyB1cGRhdGVkJylcblxuICB0LmRlZXBFcXVhbChcbiAgICBpbnRlcmFjdGlvbi5wb2ludGVycyxcbiAgICBbe1xuICAgICAgaWQ6IHBvaW50ZXIucG9pbnRlcklkLFxuICAgICAgcG9pbnRlcixcbiAgICAgIGV2ZW50LFxuICAgICAgZG93blRpbWU6IHBvaW50ZXJDb29yZHMudGltZVN0YW1wLFxuICAgICAgZG93blRhcmdldDogZXZlbnRUYXJnZXQsXG4gICAgfV0sXG4gICAgJ2ludGVyYWN0aW9uLnBvaW50ZXJzIGlzIHVwZGF0ZWQnKVxuXG4gIHQuZGVlcEVxdWFsKGludGVyYWN0aW9uLmNvb3Jkcy5zdGFydCwgcG9pbnRlckNvb3JkcywgJ2Nvb3Jkcy5zdGFydCBhcmUgc2V0IHRvIHBvaW50ZXInKVxuICB0LmRlZXBFcXVhbChpbnRlcmFjdGlvbi5jb29yZHMuY3VyLCAgIHBvaW50ZXJDb29yZHMsICdjb29yZHMuY3VyICAgYXJlIHNldCB0byBwb2ludGVyJylcbiAgdC5kZWVwRXF1YWwoaW50ZXJhY3Rpb24uY29vcmRzLnByZXYsICBwb2ludGVyQ29vcmRzLCAnY29vcmRzLnByZXYgIGFyZSBzZXQgdG8gcG9pbnRlcicpXG5cbiAgdC5lcXVhbCh0eXBlb2Ygc2lnbmFsQXJnLCAnb2JqZWN0JywgJ2Rvd24gc2lnbmFsIHdhcyBmaXJlZCBhZ2FpbicpXG4gIHQub2soaW50ZXJhY3Rpb24ucG9pbnRlcklzRG93biwgJ3BvaW50ZXJJc0Rvd24nKVxuICB0Lm5vdE9rKGludGVyYWN0aW9uLnBvaW50ZXJXYXNNb3ZlZCwgJ3BvaW50ZXJXYXNNb3ZlZCBzaG91bGQgYWx3YXlzIGNoYW5nZSB0byBmYWxzZScpXG5cbiAgdC5lbmQoKVxufSlcblxudGVzdCgnSW50ZXJhY3Rpb24uc3RhcnQnLCAodCkgPT4ge1xuICBjb25zdCBpbnRlcmFjdGlvbiA9IG1ha2VJbnRlcmFjdGlvbkFuZFNpZ25hbHMoKVxuICBjb25zdCBhY3Rpb24gPSB7IG5hbWU6ICdURVNUJyB9XG4gIGNvbnN0IGludGVyYWN0YWJsZSA9IGhlbHBlcnMubW9ja0ludGVyYWN0YWJsZSgpXG4gIGNvbnN0IGVsZW1lbnQ6IGFueSA9IHt9XG4gIGNvbnN0IHBvaW50ZXIgPSBoZWxwZXJzLm5ld1BvaW50ZXIoKVxuICBjb25zdCBldmVudDogYW55ID0ge31cblxuICBpbnRlcmFjdGlvbi5zdGFydChhY3Rpb24sIGludGVyYWN0YWJsZSwgZWxlbWVudClcbiAgdC5lcXVhbChpbnRlcmFjdGlvbi5wcmVwYXJlZC5uYW1lLCBudWxsLCAnZG8gbm90aGluZyBpZiAhcG9pbnRlcklzRG93bicpXG5cbiAgLy8gcG9pbnRlcnMgaXMgc3RpbGwgZW1wdHlcbiAgaW50ZXJhY3Rpb24ucG9pbnRlcklzRG93biA9IHRydWVcbiAgaW50ZXJhY3Rpb24uc3RhcnQoYWN0aW9uLCBpbnRlcmFjdGFibGUsIGVsZW1lbnQpXG4gIHQuZXF1YWwoaW50ZXJhY3Rpb24ucHJlcGFyZWQubmFtZSwgbnVsbCwgJ2RvIG5vdGhpbmcgaWYgdG9vIGZldyBwb2ludGVycyBhcmUgZG93bicpXG5cbiAgaW50ZXJhY3Rpb24ucG9pbnRlckRvd24ocG9pbnRlciwgZXZlbnQsIG51bGwpXG5cbiAgaW50ZXJhY3Rpb24uX2ludGVyYWN0aW5nID0gdHJ1ZVxuICBpbnRlcmFjdGlvbi5zdGFydChhY3Rpb24sIGludGVyYWN0YWJsZSwgZWxlbWVudClcbiAgdC5lcXVhbChpbnRlcmFjdGlvbi5wcmVwYXJlZC5uYW1lLCBudWxsLCAnZG8gbm90aGluZyBpZiBhbHJlYWR5IGludGVyYWN0aW5nJylcblxuICBpbnRlcmFjdGlvbi5faW50ZXJhY3RpbmcgPSBmYWxzZVxuXG4gIGludGVyYWN0YWJsZS5vcHRpb25zW2FjdGlvbi5uYW1lXSA9IHsgZW5hYmxlZDogZmFsc2UgfVxuICBpbnRlcmFjdGlvbi5zdGFydChhY3Rpb24sIGludGVyYWN0YWJsZSwgZWxlbWVudClcbiAgdC5lcXVhbChpbnRlcmFjdGlvbi5wcmVwYXJlZC5uYW1lLCBudWxsLCAnZG8gbm90aGluZyBpZiBhY3Rpb24gaXMgbm90IGVuYWJsZWQnKVxuICBpbnRlcmFjdGFibGUub3B0aW9uc1thY3Rpb24ubmFtZV0gPSB7IGVuYWJsZWQ6IHRydWUgfVxuXG4gIGxldCBzaWduYWxBcmdcbiAgLy8gbGV0IGludGVyYWN0aW5nSW5TdGFydExpc3RlbmVyXG4gIGNvbnN0IHNpZ25hbExpc3RlbmVyID0gKGFyZykgPT4ge1xuICAgIHNpZ25hbEFyZyA9IGFyZ1xuICAgIC8vIGludGVyYWN0aW5nSW5TdGFydExpc3RlbmVyID0gYXJnLmludGVyYWN0aW9uLmludGVyYWN0aW5nKClcbiAgfVxuXG4gIGludGVyYWN0aW9uLl9zaWduYWxzLm9uKCdhY3Rpb24tc3RhcnQnLCBzaWduYWxMaXN0ZW5lcilcbiAgaW50ZXJhY3Rpb24uc3RhcnQoYWN0aW9uLCBpbnRlcmFjdGFibGUsIGVsZW1lbnQpXG5cbiAgdC5lcXVhbChpbnRlcmFjdGlvbi5wcmVwYXJlZC5uYW1lLCBhY3Rpb24ubmFtZSwgJ2FjdGlvbiBpcyBwcmVwYXJlZCcpXG4gIHQuZXF1YWwoaW50ZXJhY3Rpb24uaW50ZXJhY3RhYmxlLCBpbnRlcmFjdGFibGUsICdpbnRlcmFjdGlvbi5pbnRlcmFjdGFibGUgaXMgdXBkYXRlZCcpXG4gIHQuZXF1YWwoaW50ZXJhY3Rpb24uZWxlbWVudCwgZWxlbWVudCwgJ2ludGVyYWN0aW9uLmVsZW1lbnQgaXMgdXBkYXRlZCcpXG5cbiAgLy8gdC5hc3NlcnQoaW50ZXJhY3RpbmdJblN0YXJ0TGlzdGVuZXIsICdpbnRlcmFjdGlvbiBpcyBpbnRlcmFjdGluZyBkdXJpbmcgYWN0aW9uLXN0YXJ0IHNpZ25hbCcpXG4gIHQuYXNzZXJ0KGludGVyYWN0aW9uLmludGVyYWN0aW5nKCksICdpbnRlcmFjdGlvbiBpcyBpbnRlcmFjdGluZyBhZnRlciBzdGFydCBtZXRob2QnKVxuICB0LmVxdWFsKHNpZ25hbEFyZy5pbnRlcmFjdGlvbiwgaW50ZXJhY3Rpb24sICdpbnRlcmFjdGlvbiBpbiBzaWduYWwgYXJnJylcbiAgdC5lcXVhbChzaWduYWxBcmcuZXZlbnQsIGV2ZW50LCAnZXZlbnQgKGludGVyYWN0aW9uLmRvd25FdmVudCkgaW4gc2lnbmFsIGFyZycpXG5cbiAgaW50ZXJhY3Rpb24uX2ludGVyYWN0aW5nID0gZmFsc2VcblxuICAvLyBpbnRlcmFjdGlvbi5zdGFydChhY3Rpb24sIHRhcmdldCwgZWxlbWVudClcbiAgLy8gdC5kZWVwRXF1YWwoc2NvcGUuaW50ZXJhY3Rpb25zLmxpc3QsIFtpbnRlcmFjdGlvbl0sICdpbnRlcmFjdGlvbiBpcyBhZGRlZCBiYWNrIHRvIHNjb3BlJylcblxuICB0LmVuZCgpXG59KVxuXG50ZXN0KCdzdG9wIGludGVyYWN0aW9uIGZyb20gc3RhcnQgZXZlbnQnLCAodCkgPT4ge1xuICBjb25zdCB7XG4gICAgaW50ZXJhY3Rpb24sXG4gICAgaW50ZXJhY3RhYmxlLFxuICAgIHRhcmdldCxcbiAgfSA9IGhlbHBlcnMudGVzdEVudih7IHBsdWdpbnM6IFtkcmFnLCBhdXRvU3RhcnRdIH0pXG5cbiAgbGV0IHN0b3BwZWRCZWZvcmVTdGFydEZpcmVkXG5cbiAgaW50ZXJhY3RhYmxlLm9uKCdkcmFnc3RhcnQnLCAoZXZlbnQpID0+IHtcbiAgICBzdG9wcGVkQmVmb3JlU3RhcnRGaXJlZCA9IGludGVyYWN0aW9uLl9zdG9wcGVkXG5cbiAgICBldmVudC5pbnRlcmFjdGlvbi5zdG9wKClcbiAgfSlcblxuICBpbnRlcmFjdGlvbi5zdGFydCh7IG5hbWU6ICdkcmFnJyB9LCBpbnRlcmFjdGFibGUsIHRhcmdldCBhcyBIVE1MRWxlbWVudClcblxuICB0Lm5vdE9rKHN0b3BwZWRCZWZvcmVTdGFydEZpcmVkLCAnIWludGVyYWN0aW9uLl9zdG9wcGVkIGluIHN0YXJ0IGxpc3RlbmVyJylcbiAgdC5ub3RPayhpbnRlcmFjdGlvbi5pbnRlcmFjdGluZygpLCAnaW50ZXJhY3Rpb24gY2FuIGJlIHN0b3BwZWQgZnJvbSBzdGFydCBldmVudCBsaXN0ZW5lcicpXG4gIHQub2soaW50ZXJhY3Rpb24uX3N0b3BwZWQsICdpbnRlcmFjdGlvbi5fc3RvcHBlZCBhZnRlciBzdG9wKCkgaW4gc3RhcnQgbGlzdGVuZXInKVxuXG4gIHQuZW5kKClcbn0pXG5cbnRlc3QoJ0ludGVyYWN0aW9uIGNyZWF0ZVByZXBhcmVkRXZlbnQnLCAodCkgPT4ge1xuICBjb25zdCBzY29wZSA9IGhlbHBlcnMubW9ja1Njb3BlKClcblxuICBjb25zdCBpbnRlcmFjdGlvbiA9IHNjb3BlLmludGVyYWN0aW9ucy5uZXcoe30pXG4gIGNvbnN0IGludGVyYWN0YWJsZSA9IGhlbHBlcnMubW9ja0ludGVyYWN0YWJsZSgpXG4gIGNvbnN0IGFjdGlvbiA9IHsgbmFtZTogJ3Jlc2l6ZScgfVxuICBjb25zdCBwaGFzZSA9ICdURVNUX1BIQVNFJ1xuXG4gIGludGVyYWN0aW9uLnByZXBhcmVkID0gYWN0aW9uXG4gIGludGVyYWN0aW9uLmludGVyYWN0YWJsZSA9IGludGVyYWN0YWJsZVxuICBpbnRlcmFjdGlvbi5lbGVtZW50ID0gaW50ZXJhY3RhYmxlLmVsZW1lbnRcbiAgaW50ZXJhY3Rpb24ucHJldkV2ZW50ID0geyBwYWdlOiB7fSwgY2xpZW50OiB7fSwgdmVsb2NpdHk6IHt9IH1cblxuICBjb25zdCBpRXZlbnQgPSBpbnRlcmFjdGlvbi5fY3JlYXRlUHJlcGFyZWRFdmVudCh7fSwgcGhhc2UpXG5cbiAgdC5vayhpRXZlbnQgaW5zdGFuY2VvZiBJbnRlcmFjdEV2ZW50LFxuICAgICdJbnRlcmFjdEV2ZW50IGlzIGZpcmVkJylcblxuICB0LmVxdWFsKGlFdmVudC50eXBlLCBhY3Rpb24ubmFtZSArIHBoYXNlLFxuICAgICdldmVudCB0eXBlJylcblxuICB0LmVxdWFsKGlFdmVudC5pbnRlcmFjdGFibGUsIGludGVyYWN0YWJsZSxcbiAgICAnZXZlbnQuaW50ZXJhY3RhYmxlJylcblxuICB0LmVxdWFsKGlFdmVudC50YXJnZXQsIGludGVyYWN0YWJsZS5lbGVtZW50LFxuICAgICdldmVudC50YXJnZXQnKVxuXG4gIHQuZW5kKClcbn0pXG5cbnRlc3QoJ0ludGVyYWN0aW9uIGZpcmVFdmVudCcsICh0KSA9PiB7XG4gIGNvbnN0IGludGVyYWN0aW9uID0gbmV3IEludGVyYWN0aW9uKHsgc2lnbmFsczogaGVscGVycy5tb2NrU2lnbmFscygpIH0pXG4gIGNvbnN0IGludGVyYWN0YWJsZSA9IGhlbHBlcnMubW9ja0ludGVyYWN0YWJsZSgpXG4gIGNvbnN0IGlFdmVudCA9IHt9IGFzIEludGVyYWN0LkludGVyYWN0RXZlbnRcbiAgbGV0IGZpcmVkRXZlbnRcblxuICAvLyB0aGlzIG1ldGhvZCBzaG91bGQgYmUgY2FsbGVkIGZyb20gYWN0aW9ucy5maXJlUHJlcGFyZWRcbiAgaW50ZXJhY3RhYmxlLmZpcmUgPSAoZXZlbnQpID0+IHtcbiAgICBmaXJlZEV2ZW50ID0gZXZlbnRcbiAgfVxuXG4gIGludGVyYWN0aW9uLmludGVyYWN0YWJsZSA9IGludGVyYWN0YWJsZVxuICBpbnRlcmFjdGlvbi5fZmlyZUV2ZW50KGlFdmVudClcblxuICB0LmVxdWFsKGZpcmVkRXZlbnQsIGlFdmVudCxcbiAgICAndGFyZ2V0IGludGVyYWN0YWJsZVxcJ3MgZmlyZSBtZXRob2QgaXMgY2FsbGVkJylcblxuICB0LmVxdWFsKGludGVyYWN0aW9uLnByZXZFdmVudCwgaUV2ZW50LFxuICAgICdpbnRlcmFjdGlvbi5wcmV2RXZlbnQgaXMgdXBkYXRlZCcpXG5cbiAgdC5lbmQoKVxufSlcbiJdfQ==