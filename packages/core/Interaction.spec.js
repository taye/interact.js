import test from '@interactjs/_dev/test/test';
import drag from '@interactjs/actions/drag';
import autoStart from '@interactjs/auto-start/base';
import pointerUtils from '@interactjs/utils/pointerUtils';
import Signals from '@interactjs/utils/Signals';
import InteractEvent from './InteractEvent';
import Interaction from './Interaction';
import * as helpers from './tests/_helpers';
const makeInteractionAndSignals = () => new Interaction({ signals: new Signals() });
test('Interaction constructor', t => {
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
test('Interaction destroy', t => {
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
test('Interaction.getPointerIndex', t => {
    const interaction = makeInteractionAndSignals();
    interaction.pointers = [2, 4, 5, 0, -1].map(id => ({ id }));
    interaction.pointers.forEach(({ id }, index) => {
        t.equal(interaction.getPointerIndex({ pointerId: id }), index);
    });
    t.end();
});
test('Interaction.updatePointer', t => {
    t.test('no existing pointers', st => {
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
    t.test('new pointer with exisiting pointer', st => {
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
    t.test('update existing pointers', st => {
        const interaction = makeInteractionAndSignals();
        const oldPointers = [-3, 10, 2].map(pointerId => ({ pointerId }));
        const newPointers = oldPointers.map(pointer => ({ ...pointer, new: true }));
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
test('Interaction.removePointer', t => {
    const interaction = makeInteractionAndSignals();
    const ids = [0, 1, 2, 3];
    const removals = [
        { id: 0, remain: [1, 2, 3], message: 'first of 4' },
        { id: 2, remain: [1, 3], message: 'middle of 3' },
        { id: 3, remain: [1], message: 'last of 2' },
        { id: 1, remain: [], message: 'final' },
    ];
    ids.forEach(pointerId => interaction.updatePointer({ pointerId }, {}, null));
    for (const removal of removals) {
        interaction.removePointer({ pointerId: removal.id }, null);
        t.deepEqual(interaction.pointers.map(p => p.id), removal.remain, `${removal.message} - remaining interaction.pointers is correct`);
    }
    t.end();
});
test('Interaction.pointer{Down,Move,Up} updatePointer', t => {
    const signals = new Signals();
    const interaction = new Interaction({ signals });
    const eventTarget = {};
    const pointer = {
        target: eventTarget,
        pointerId: 0,
    };
    let info = {};
    signals.on('update-pointer', arg => { info.updated = arg.pointerInfo; });
    signals.on('remove-pointer', arg => { info.removed = arg.pointerInfo; });
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
test('Interaction.pointerDown', t => {
    const interaction = makeInteractionAndSignals();
    const coords = helpers.newCoordsSet();
    const eventTarget = {};
    const event = {
        type: 'down',
        target: eventTarget,
    };
    const pointer = helpers.newPointer();
    let signalArg;
    const signalListener = arg => {
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
test('Interaction.start', t => {
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
    const signalListener = arg => {
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
test('stop interaction from start event', t => {
    const { interaction, interactable, target, } = helpers.testEnv({ plugins: [drag, autoStart] });
    let stoppedBeforeStartFired;
    interactable.on('dragstart', event => {
        stoppedBeforeStartFired = interaction._stopped;
        event.interaction.stop();
    });
    interaction.start({ name: 'drag' }, interactable, target);
    t.notOk(stoppedBeforeStartFired, '!interaction._stopped in start listener');
    t.notOk(interaction.interacting(), 'interaction can be stopped from start event listener');
    t.ok(interaction._stopped, 'interaction._stopped after stop() in start listener');
    t.end();
});
test('Interaction createPreparedEvent', t => {
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
test('Interaction fireEvent', t => {
    const interaction = new Interaction({ signals: helpers.mockSignals() });
    const interactable = helpers.mockInteractable();
    const iEvent = {};
    let firedEvent;
    // this method should be called from actions.firePrepared
    interactable.fire = event => {
        firedEvent = event;
    };
    interaction.interactable = interactable;
    interaction._fireEvent(iEvent);
    t.equal(firedEvent, iEvent, 'target interactable\'s fire method is called');
    t.equal(interaction.prevEvent, iEvent, 'interaction.prevEvent is updated');
    t.end();
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiSW50ZXJhY3Rpb24uc3BlYy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIkludGVyYWN0aW9uLnNwZWMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxJQUFJLE1BQU0sNEJBQTRCLENBQUE7QUFDN0MsT0FBTyxJQUFJLE1BQU0sMEJBQTBCLENBQUE7QUFDM0MsT0FBTyxTQUFTLE1BQU0sNkJBQTZCLENBQUE7QUFDbkQsT0FBTyxZQUFZLE1BQU0sZ0NBQWdDLENBQUE7QUFDekQsT0FBTyxPQUFPLE1BQU0sMkJBQTJCLENBQUE7QUFDL0MsT0FBTyxhQUFhLE1BQU0saUJBQWlCLENBQUE7QUFDM0MsT0FBTyxXQUFXLE1BQU0sZUFBZSxDQUFBO0FBQ3ZDLE9BQU8sS0FBSyxPQUFPLE1BQU0sa0JBQWtCLENBQUE7QUFFM0MsTUFBTSx5QkFBeUIsR0FBRyxHQUFHLEVBQUUsQ0FBQyxJQUFJLFdBQVcsQ0FBQyxFQUFFLE9BQU8sRUFBRSxJQUFJLE9BQU8sRUFBRSxFQUFTLENBQUMsQ0FBQTtBQUUxRixJQUFJLENBQUMseUJBQXlCLEVBQUUsQ0FBQyxDQUFDLEVBQUU7SUFDbEMsTUFBTSxRQUFRLEdBQUcsTUFBTSxDQUFBO0lBQ3ZCLE1BQU0sT0FBTyxHQUFHLElBQUksT0FBTyxFQUFFLENBQUE7SUFDN0IsTUFBTSxXQUFXLEdBQUcsSUFBSSxXQUFXLENBQUM7UUFDbEMsV0FBVyxFQUFFLFFBQVE7UUFDckIsT0FBTztLQUNSLENBQUMsQ0FBQTtJQUNGLE1BQU0sVUFBVSxHQUFHO1FBQ2pCLElBQUksRUFBTyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRTtRQUN6QixNQUFNLEVBQUssRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUU7UUFDekIsU0FBUyxFQUFFLENBQUM7S0FDYixDQUFBO0lBRUQsQ0FBQyxDQUFDLEtBQUssQ0FBQyxXQUFXLENBQUMsUUFBUSxFQUFFLE9BQU8s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LElBQUksQ0FBQyx1QkFBdUIsRUFBRSxDQUFDLENBQUMsRUFBRTtJQUNoQyxNQUFNLFdBQVcsR0FBRyxJQUFJLFdBQVcsQ0FBQyxFQUFFLE9BQU8sRUFBRSxPQUFPLENBQUMsV0FBVyxFQUFFLEVBQUUsQ0FBQyxDQUFBO0lBQ3ZFLE1BQU0sWUFBWSxHQUFHLE9BQU8sQ0FBQyxnQkFBZ0IsRUFBRSxDQUFBO0lBQy9DLE1BQU0sTUFBTSxHQUFHLEVBQTRCLENBQUE7SUFDM0MsSUFBSSxVQUFVLENBQUE7SUFFZCx5REFBeUQ7SUFDekQsWUFBWSxDQUFDLElBQUksR0FBRyxLQUFLLENBQUMsRUFBRTtRQUMxQixVQUFVLEdBQUcsS0FBSyxDQUFBO0lBQ3BCLENBQUMsQ0FBQTtJQUVELFdBQVcsQ0FBQyxZQUFZLEdBQUcsWUFBWSxDQUFBO0lBQ3ZDLFdBQVcsQ0FBQyxVQUFVLENBQUMsTUFBTSxDQUFDLENBQUE7SUFFOUIsQ0FBQyxDQUFDLEtBQUssQ0FBQyxVQUFVLEVBQUUsTUFBTSxFQUN4Qiw4Q0FBOEMsQ0FBQyxDQUFBO0lBRWpELENBQUMsQ0FBQyxLQUFLLENBQUMsV0FBVyxDQUFDLFNBQVMsRUFBRSxNQUFNLEVBQ25DLGtDQUFrQyxDQUFDLENBQUE7SUFFckMsQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFBO0FBQ1QsQ0FBQyxDQUFDLENBQUEiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgdGVzdCBmcm9tICdAaW50ZXJhY3Rqcy9fZGV2L3Rlc3QvdGVzdCdcbmltcG9ydCBkcmFnIGZyb20gJ0BpbnRlcmFjdGpzL2FjdGlvbnMvZHJhZydcbmltcG9ydCBhdXRvU3RhcnQgZnJvbSAnQGludGVyYWN0anMvYXV0by1zdGFydC9iYXNlJ1xuaW1wb3J0IHBvaW50ZXJVdGlscyBmcm9tICdAaW50ZXJhY3Rqcy91dGlscy9wb2ludGVyVXRpbHMnXG5pbXBvcnQgU2lnbmFscyBmcm9tICdAaW50ZXJhY3Rqcy91dGlscy9TaWduYWxzJ1xuaW1wb3J0IEludGVyYWN0RXZlbnQgZnJvbSAnLi9JbnRlcmFjdEV2ZW50J1xuaW1wb3J0IEludGVyYWN0aW9uIGZyb20gJy4vSW50ZXJhY3Rpb24nXG5pbXBvcnQgKiBhcyBoZWxwZXJzIGZyb20gJy4vdGVzdHMvX2hlbHBlcnMnXG5cbmNvbnN0IG1ha2VJbnRlcmFjdGlvbkFuZFNpZ25hbHMgPSAoKSA9PiBuZXcgSW50ZXJhY3Rpb24oeyBzaWduYWxzOiBuZXcgU2lnbmFscygpIH0gYXMgYW55KVxuXG50ZXN0KCdJbnRlcmFjdGlvbiBjb25zdHJ1Y3RvcicsIHQgPT4ge1xuICBjb25zdCB0ZXN0VHlwZSA9ICd0ZXN0J1xuICBjb25zdCBzaWduYWxzID0gbmV3IFNpZ25hbHMoKVxuICBjb25zdCBpbnRlcmFjdGlvbiA9IG5ldyBJbnRlcmFjdGlvbih7XG4gICAgcG9pbnRlclR5cGU6IHRlc3RUeXBlLFxuICAgIHNpZ25hbHMsXG4gIH0pXG4gIGNvbnN0IHplcm9Db29yZHMgPSB7XG4gICAgcGFnZSAgICAgOiB7IHg6IDAsIHk6IDAgfSxcbiAgICBjbGllbnQgICA6IHsgeDogMCwgeTogMCB9LFxuICAgIHRpbWVTdGFtcDogMCxcbiAgfVxuXG4gIHQuZXF1YWwoaW50ZXJhY3Rpb24uX3NpZ25hbHMsIHNpZ25hbHMsXG4gICAgJ3NpZ25hbHMgb3B0aW9uIGlzIHNldCBhc3NpZ25lZCB0byBpbnRlcmFjdGlvbi5fc2lnbmFscycpXG5cbiAgdC5vayhpbnRlcmFjdGlvbi5wcmVwYXJlZCBpbnN0YW5jZW9mIE9iamVjdCxcbiAgICAnaW50ZXJhY3Rpb24ucHJlcGFyZWQgaXMgYW4gb2JqZWN0JylcbiAgdC5vayhpbnRlcmFjdGlvbi5kb3duUG9pbnRlciBpbnN0YW5jZW9mIE9iamVjdCxcbiAgICAnaW50ZXJhY3Rpb24uZG93blBvaW50ZXIgaXMgYW4gb2JqZWN0JylcblxuICBmb3IgKGNvbnN0IGNvb3JkRmllbGQgaW4gaW50ZXJhY3Rpb24uY29vcmRzKSB7XG4gICAgdC5kZWVwRXF1YWwoaW50ZXJhY3Rpb24uY29vcmRzW2Nvb3JkRmllbGRdLCB6ZXJvQ29vcmRzLFxuICAgICAgYGludGVyYWN0aW9uLmNvb3Jkcy4ke2Nvb3JkRmllbGR9IHNldCB0byB6ZXJvYClcbiAgfVxuXG4gIHQuZXF1YWwoaW50ZXJhY3Rpb24ucG9pbnRlclR5cGUsIHRlc3RUeXBlLFxuICAgICdpbnRlcmFjdGlvbi5wb2ludGVyVHlwZSBpcyBzZXQnKVxuXG4gIC8vIHBvaW50ZXJJbmZvIHByb3BlcnRpZXNcbiAgdC5kZWVwRXF1YWwoXG4gICAgaW50ZXJhY3Rpb24ucG9pbnRlcnMsXG4gICAgW10sXG4gICAgJ2ludGVyYWN0aW9uLnBvaW50ZXJzIGlzIGluaXRpYWxseSBhbiBlbXB0eSBhcnJheScpXG5cbiAgLy8gZmFsc2UgcHJvcGVydGllc1xuICBmb3IgKGNvbnN0IHByb3Agb2YgJ3BvaW50ZXJJc0Rvd24gcG9pbnRlcldhc01vdmVkIF9pbnRlcmFjdGluZyBtb3VzZScuc3BsaXQoJyAnKSkge1xuICAgIHQubm90T2soaW50ZXJhY3Rpb25bcHJvcF0sIGBpbnRlcmFjdGlvbi4ke3Byb3B9IGlzIGZhbHNlYClcbiAgfVxuXG4gIHQuZW5kKClcbn0pXG5cbnRlc3QoJ0ludGVyYWN0aW9uIGRlc3Ryb3knLCB0ID0+IHtcbiAgY29uc3QgaW50ZXJhY3Rpb24gPSBtYWtlSW50ZXJhY3Rpb25BbmRTaWduYWxzKClcbiAgY29uc3QgcG9pbnRlciA9IHsgcG9pbnRlcklkOiAxMCB9IGFzIGFueVxuICBjb25zdCBldmVudCA9IHt9IGFzIGFueVxuXG4gIGludGVyYWN0aW9uLnVwZGF0ZVBvaW50ZXIocG9pbnRlciwgZXZlbnQsIG51bGwpXG5cbiAgaW50ZXJhY3Rpb24uZGVzdHJveSgpXG5cbiAgdC5zdHJpY3RFcXVhbChpbnRlcmFjdGlvbi5fbGF0ZXN0UG9pbnRlci5wb2ludGVyLCBudWxsLFxuICAgICdpbnRlcmFjdGlvbi5fbGF0ZXN0UG9pbnRlci5wb2ludGVyIGlzIG51bGwnKVxuXG4gIHQuc3RyaWN0RXF1YWwoaW50ZXJhY3Rpb24uX2xhdGVzdFBvaW50ZXIuZXZlbnQsIG51bGwsXG4gICAgJ2ludGVyYWN0aW9uLl9sYXRlc3RQb2ludGVyLmV2ZW50IGlzIG51bGwnKVxuXG4gIHQuc3RyaWN0RXF1YWwoaW50ZXJhY3Rpb24uX2xhdGVzdFBvaW50ZXIuZXZlbnRUYXJnZXQsIG51bGwsXG4gICAgJ2ludGVyYWN0aW9uLl9sYXRlc3RQb2ludGVyLmV2ZW50VGFyZ2V0IGlzIG51bGwnKVxuXG4gIHQuZW5kKClcbn0pXG5cbnRlc3QoJ0ludGVyYWN0aW9uLmdldFBvaW50ZXJJbmRleCcsIHQgPT4ge1xuICBjb25zdCBpbnRlcmFjdGlvbiA9IG1ha2VJbnRlcmFjdGlvbkFuZFNpZ25hbHMoKVxuXG4gIGludGVyYWN0aW9uLnBvaW50ZXJzID0gWzIsIDQsIDUsIDAsIC0xXS5tYXAoaWQgPT4gKHsgaWQgfSkpIGFzIGFueVxuXG4gIGludGVyYWN0aW9uLnBvaW50ZXJzLmZvckVhY2goKHsgaWQgfSwgaW5kZXgpID0+IHtcbiAgICB0LmVxdWFsKGludGVyYWN0aW9uLmdldFBvaW50ZXJJbmRleCh7IHBvaW50ZXJJZDogaWQgfSksIGluZGV4KVxuICB9KVxuXG4gIHQuZW5kKClcbn0pXG5cbnRlc3QoJ0ludGVyYWN0aW9uLnVwZGF0ZVBvaW50ZXInLCB0ID0+IHtcbiAgdC50ZXN0KCdubyBleGlzdGluZyBwb2ludGVycycsIHN0ID0+IHtcbiAgICBjb25zdCBpbnRlcmFjdGlvbiA9IG1ha2VJbnRlcmFjdGlvbkFuZFNpZ25hbHMoKVxuICAgIGNvbnN0IHBvaW50ZXIgPSB7IHBvaW50ZXJJZDogMTAgfSBhcyBhbnlcbiAgICBjb25zdCBldmVudCA9IHt9IGFzIGFueVxuXG4gICAgY29uc3QgcmV0ID0gaW50ZXJhY3Rpb24udXBkYXRlUG9pbnRlcihwb2ludGVyLCBldmVudCwgbnVsbClcblxuICAgIHN0LmRlZXBFcXVhbChcbiAgICAgIGludGVyYWN0aW9uLnBvaW50ZXJzLFxuICAgICAgW3tcbiAgICAgICAgaWQ6IHBvaW50ZXIucG9pbnRlcklkLFxuICAgICAgICBwb2ludGVyLFxuICAgICAgICBldmVudCxcbiAgICAgICAgZG93blRpbWU6IG51bGwsXG4gICAgICAgIGRvd25UYXJnZXQ6IG51bGwsXG4gICAgICB9XSxcbiAgICAgICdpbnRlcmFjdGlvbi5wb2ludGVycyA9PSBbeyBwb2ludGVyLCAuLi4gfV0nKVxuICAgIHN0LmVxdWFsKHJldCwgMCwgJ25ldyBwb2ludGVyIGluZGV4IGlzIHJldHVybmVkJylcblxuICAgIHN0LmVuZCgpXG4gIH0pXG5cbiAgdC50ZXN0KCduZXcgcG9pbnRlciB3aXRoIGV4aXNpdGluZyBwb2ludGVyJywgc3QgPT4ge1xuICAgIGNvbnN0IGludGVyYWN0aW9uID0gbWFrZUludGVyYWN0aW9uQW5kU2lnbmFscygpXG4gICAgY29uc3QgZXhpc3Rpbmc6IGFueSA9IHsgcG9pbnRlcklkOiAwIH1cbiAgICBjb25zdCBldmVudDogYW55ID0ge31cblxuICAgIGludGVyYWN0aW9uLnVwZGF0ZVBvaW50ZXIoZXhpc3RpbmcsIGV2ZW50LCBudWxsKVxuXG4gICAgY29uc3QgbmV3UG9pbnRlcjogYW55ID0geyBwb2ludGVySWQ6IDEwIH1cbiAgICBjb25zdCByZXQgPSBpbnRlcmFjdGlvbi51cGRhdGVQb2ludGVyKG5ld1BvaW50ZXIsIGV2ZW50LCBudWxsKVxuXG4gICAgc3QuZGVlcEVxdWFsKFxuICAgICAgaW50ZXJhY3Rpb24ucG9pbnRlcnMsIFtcbiAgICAgICAge1xuICAgICAgICAgIGlkOiBleGlzdGluZy5wb2ludGVySWQsXG4gICAgICAgICAgcG9pbnRlcjogZXhpc3RpbmcsXG4gICAgICAgICAgZXZlbnQsXG4gICAgICAgICAgZG93blRpbWU6IG51bGwsXG4gICAgICAgICAgZG93blRhcmdldDogbnVsbCxcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIGlkOiBuZXdQb2ludGVyLnBvaW50ZXJJZCxcbiAgICAgICAgICBwb2ludGVyOiBuZXdQb2ludGVyLFxuICAgICAgICAgIGV2ZW50LFxuICAgICAgICAgIGRvd25UaW1lOiBudWxsLFxuICAgICAgICAgIGRvd25UYXJnZXQ6IG51bGwsXG4gICAgICAgIH0sXG4gICAgICBdLFxuICAgICAgJ2ludGVyYWN0aW9uLnBvaW50ZXJzID09IFt7IHBvaW50ZXI6IGV4aXN0aW5nLCAuLi4gfSwgeyBwb2ludGVyOiBuZXdQb2ludGVyLCAuLi4gfV0nKVxuXG4gICAgc3QuZXF1YWwocmV0LCAxLCAnc2Vjb25kIHBvaW50ZXIgaW5kZXggaXMgMScpXG5cbiAgICBzdC5lbmQoKVxuICB9KVxuXG4gIHQudGVzdCgndXBkYXRlIGV4aXN0aW5nIHBvaW50ZXJzJywgc3QgPT4ge1xuICAgIGNvbnN0IGludGVyYWN0aW9uID0gbWFrZUludGVyYWN0aW9uQW5kU2lnbmFscygpXG5cbiAgICBjb25zdCBvbGRQb2ludGVycyA9IFstMywgMTAsIDJdLm1hcChwb2ludGVySWQgPT4gKHsgcG9pbnRlcklkIH0pKVxuICAgIGNvbnN0IG5ld1BvaW50ZXJzID0gb2xkUG9pbnRlcnMubWFwKHBvaW50ZXIgPT4gKHsgLi4ucG9pbnRlciwgbmV3OiB0cnVlIH0pKVxuXG4gICAgb2xkUG9pbnRlcnMuZm9yRWFjaCgocG9pbnRlcjogYW55KSA9PiBpbnRlcmFjdGlvbi51cGRhdGVQb2ludGVyKHBvaW50ZXIsIHBvaW50ZXIsIG51bGwpKVxuICAgIG5ld1BvaW50ZXJzLmZvckVhY2goKHBvaW50ZXI6IGFueSkgPT4gaW50ZXJhY3Rpb24udXBkYXRlUG9pbnRlcihwb2ludGVyLCBwb2ludGVyLCBudWxsKSlcblxuICAgIHN0LmVxdWFsKGludGVyYWN0aW9uLnBvaW50ZXJzLmxlbmd0aCwgb2xkUG9pbnRlcnMubGVuZ3RoLFxuICAgICAgJ251bWJlciBvZiBwb2ludGVycyBpcyB1bmNoYW5nZWQnKVxuXG4gICAgaW50ZXJhY3Rpb24ucG9pbnRlcnMuZm9yRWFjaCgocG9pbnRlckluZm8sIGkpID0+IHtcbiAgICAgIHN0LmVxdWFsKHBvaW50ZXJJbmZvLmlkLCBvbGRQb2ludGVyc1tpXS5wb2ludGVySWQsXG4gICAgICAgIGBwb2ludGVyWyR7aX1dLmlkIGlzIHRoZSBzYW1lYClcbiAgICAgIHN0Lm5vdEVxdWFsKHBvaW50ZXJJbmZvLnBvaW50ZXIsIG9sZFBvaW50ZXJzW2ldLFxuICAgICAgICBgbmV3IHBvaW50ZXIgJHtpfSAhPT0gb2xkIHBvaW50ZXIgb2JqZWN0YClcbiAgICB9KVxuXG4gICAgc3QuZW5kKClcbiAgfSlcblxuICB0LmVuZCgpXG59KVxuXG50ZXN0KCdJbnRlcmFjdGlvbi5yZW1vdmVQb2ludGVyJywgdCA9PiB7XG4gIGNvbnN0IGludGVyYWN0aW9uID0gbWFrZUludGVyYWN0aW9uQW5kU2lnbmFscygpXG4gIGNvbnN0IGlkcyA9IFswLCAxLCAyLCAzXVxuICBjb25zdCByZW1vdmFscyA9IFtcbiAgICB7IGlkOiAwLCByZW1haW46IFsxLCAyLCAzXSwgbWVzc2FnZTogJ2ZpcnN0IG9mIDQnIH0sXG4gICAgeyBpZDogMiwgcmVtYWluOiBbMSwgICAgM10sIG1lc3NhZ2U6ICdtaWRkbGUgb2YgMycgfSxcbiAgICB7IGlkOiAzLCByZW1haW46IFsxICAgICAgXSwgbWVzc2FnZTogJ2xhc3Qgb2YgMicgfSxcbiAgICB7IGlkOiAxLCByZW1haW46IFsgICAgICAgXSwgbWVzc2FnZTogJ2ZpbmFsJyB9LFxuICBdXG5cbiAgaWRzLmZvckVhY2gocG9pbnRlcklkID0+IGludGVyYWN0aW9uLnVwZGF0ZVBvaW50ZXIoeyBwb2ludGVySWQgfSBhcyBhbnksIHt9IGFzIGFueSwgbnVsbCkpXG5cbiAgZm9yIChjb25zdCByZW1vdmFsIG9mIHJlbW92YWxzKSB7XG4gICAgaW50ZXJhY3Rpb24ucmVtb3ZlUG9pbnRlcih7IHBvaW50ZXJJZDogcmVtb3ZhbC5pZCB9IGFzIEludGVyYWN0LlBvaW50ZXJUeXBlLCBudWxsKVxuXG4gICAgdC5kZWVwRXF1YWwoXG4gICAgICBpbnRlcmFjdGlvbi5wb2ludGVycy5tYXAocCA9PiBwLmlkKSxcbiAgICAgIHJlbW92YWwucmVtYWluLFxuICAgICAgYCR7cmVtb3ZhbC5tZXNzYWdlfSAtIHJlbWFpbmluZyBpbnRlcmFjdGlvbi5wb2ludGVycyBpcyBjb3JyZWN0YClcbiAgfVxuXG4gIHQuZW5kKClcbn0pXG5cbnRlc3QoJ0ludGVyYWN0aW9uLnBvaW50ZXJ7RG93bixNb3ZlLFVwfSB1cGRhdGVQb2ludGVyJywgdCA9PiB7XG4gIGNvbnN0IHNpZ25hbHMgPSBuZXcgU2lnbmFscygpXG4gIGNvbnN0IGludGVyYWN0aW9uID0gbmV3IEludGVyYWN0aW9uKHsgc2lnbmFscyB9IGFzIGFueSlcbiAgY29uc3QgZXZlbnRUYXJnZXQ6IGFueSA9IHt9XG4gIGNvbnN0IHBvaW50ZXI6IGFueSA9IHtcbiAgICB0YXJnZXQ6IGV2ZW50VGFyZ2V0LFxuICAgIHBvaW50ZXJJZDogMCxcbiAgfVxuICBsZXQgaW5mbzogYW55ID0ge31cblxuICBzaWduYWxzLm9uKCd1cGRhdGUtcG9pbnRlcicsIGFyZyA9PiB7IGluZm8udXBkYXRlZCA9IGFyZy5wb2ludGVySW5mbyB9KVxuICBzaWduYWxzLm9uKCdyZW1vdmUtcG9pbnRlcicsIGFyZyA9PiB7IGluZm8ucmVtb3ZlZCA9IGFyZy5wb2ludGVySW5mbyB9KVxuXG4gIGludGVyYWN0aW9uLmNvb3Jkcy5jdXIudGltZVN0YW1wID0gMFxuICBjb25zdCBjb21tb25Qb2ludGVySW5mbyA9IHtcbiAgICBpZDogMCxcbiAgICBwb2ludGVyLFxuICAgIGV2ZW50OiBwb2ludGVyLFxuICAgIGRvd25UaW1lOiBudWxsLFxuICAgIGRvd25UYXJnZXQ6IG51bGwsXG4gIH1cblxuICBpbnRlcmFjdGlvbi5wb2ludGVyRG93bihwb2ludGVyLCBwb2ludGVyLCBldmVudFRhcmdldClcbiAgdC5kZWVwRXF1YWwoXG4gICAgaW5mby51cGRhdGVkLFxuICAgIHtcbiAgICAgIC4uLmNvbW1vblBvaW50ZXJJbmZvLFxuICAgICAgZG93blRpbWU6IGludGVyYWN0aW9uLmNvb3Jkcy5jdXIudGltZVN0YW1wLFxuICAgICAgZG93blRhcmdldDogZXZlbnRUYXJnZXQsXG4gICAgfSxcbiAgICAnaW50ZXJhY3Rpb24ucG9pbnRlckRvd24gdXBkYXRlcyBwb2ludGVyJ1xuICApXG4gIHQuZXF1YWwoaW5mby5yZW1vdmVkLCB1bmRlZmluZWQsICdpbnRlcmFjdGlvbi5wb2ludGVyRG93biBkb2VzblxcJ3QgcmVtb3ZlIHBvaW50ZXInKVxuICBpbnRlcmFjdGlvbi5yZW1vdmVQb2ludGVyKHBvaW50ZXIsIG51bGwpXG4gIGluZm8gPSB7fVxuXG4gIGludGVyYWN0aW9uLnBvaW50ZXJNb3ZlKHBvaW50ZXIsIHBvaW50ZXIsIGV2ZW50VGFyZ2V0KVxuICB0LmRlZXBFcXVhbChcbiAgICBpbmZvLnVwZGF0ZWQsXG4gICAgY29tbW9uUG9pbnRlckluZm8sXG4gICAgJ2ludGVyYWN0aW9uLnBvaW50ZXJNb3ZlIHVwZGF0ZXMgcG9pbnRlcidcbiAgKVxuICB0LmVxdWFsKGluZm8ucmVtb3ZlZCwgdW5kZWZpbmVkLCAnaW50ZXJhY3Rpb24ucG9pbnRlck1vdmUgZG9lc25cXCd0IHJlbW92ZSBwb2ludGVyJylcbiAgaW5mbyA9IHt9XG5cbiAgaW50ZXJhY3Rpb24ucG9pbnRlclVwKHBvaW50ZXIsIHBvaW50ZXIsIGV2ZW50VGFyZ2V0LCBudWxsKVxuICB0LmVxdWFsKGluZm8udXBkYXRlZCwgdW5kZWZpbmVkLCAnaW50ZXJhY3Rpb24ucG9pbnRlclVwIGRvZXNuXFwndCB1cGRhdGUgZXhpc3RpbmcgcG9pbnRlcicpXG4gIGluZm8gPSB7fVxuXG4gIGludGVyYWN0aW9uLnBvaW50ZXJVcChwb2ludGVyLCBwb2ludGVyLCBldmVudFRhcmdldCwgbnVsbClcbiAgdC5kZWVwRXF1YWwoXG4gICAgaW5mby51cGRhdGVkLFxuICAgIGNvbW1vblBvaW50ZXJJbmZvLFxuICAgICdpbnRlcmFjdGlvbi5wb2ludGVyVXAgdXBkYXRlcyBub24gZXhpc3RpbmcgcG9pbnRlcidcbiAgKVxuICB0LmRlZXBFcXVhbChpbmZvLnJlbW92ZWQsIGNvbW1vblBvaW50ZXJJbmZvLCAnaW50ZXJhY3Rpb24ucG9pbnRlclVwIGFsc28gcmVtb3ZlcyBwb2ludGVyJylcbiAgaW5mbyA9IHt9XG5cbiAgdC5lbmQoKVxufSlcblxudGVzdCgnSW50ZXJhY3Rpb24ucG9pbnRlckRvd24nLCB0ID0+IHtcbiAgY29uc3QgaW50ZXJhY3Rpb24gPSBtYWtlSW50ZXJhY3Rpb25BbmRTaWduYWxzKClcbiAgY29uc3QgY29vcmRzID0gaGVscGVycy5uZXdDb29yZHNTZXQoKVxuICBjb25zdCBldmVudFRhcmdldCA9IHt9IGFzIEVsZW1lbnRcbiAgY29uc3QgZXZlbnQ6IGFueSA9IHtcbiAgICB0eXBlOiAnZG93bicsXG4gICAgdGFyZ2V0OiBldmVudFRhcmdldCxcbiAgfVxuICBjb25zdCBwb2ludGVyOiBhbnkgPSBoZWxwZXJzLm5ld1BvaW50ZXIoKVxuICBsZXQgc2lnbmFsQXJnXG5cbiAgY29uc3Qgc2lnbmFsTGlzdGVuZXIgPSBhcmcgPT4ge1xuICAgIHNpZ25hbEFyZyA9IGFyZ1xuICB9XG5cbiAgaW50ZXJhY3Rpb24uX3NpZ25hbHMub24oJ2Rvd24nLCBzaWduYWxMaXN0ZW5lcilcblxuICBjb25zdCBwb2ludGVyQ29vcmRzOiBhbnkgPSB7IHBhZ2U6IHt9LCBjbGllbnQ6IHt9IH1cbiAgcG9pbnRlclV0aWxzLnNldENvb3Jkcyhwb2ludGVyQ29vcmRzLCBbcG9pbnRlcl0sIGV2ZW50LnRpbWVTdGFtcClcblxuICBmb3IgKGNvbnN0IHByb3AgaW4gY29vcmRzKSB7XG4gICAgcG9pbnRlclV0aWxzLmNvcHlDb29yZHMoaW50ZXJhY3Rpb24uY29vcmRzW3Byb3BdLCBjb29yZHNbcHJvcF0pXG4gIH1cblxuICAvLyB0ZXN0IHdoaWxlIGludGVyYWN0aW5nXG4gIGludGVyYWN0aW9uLl9pbnRlcmFjdGluZyA9IHRydWVcbiAgaW50ZXJhY3Rpb24ucG9pbnRlckRvd24ocG9pbnRlciwgZXZlbnQsIGV2ZW50VGFyZ2V0KVxuXG4gIHQuZXF1YWwoaW50ZXJhY3Rpb24uZG93bkV2ZW50LCBudWxsLCAnZG93bkV2ZW50IGlzIG5vdCB1cGRhdGVkJylcbiAgdC5kZWVwRXF1YWwoXG4gICAgaW50ZXJhY3Rpb24ucG9pbnRlcnMsXG4gICAgW3tcbiAgICAgIGlkOiBwb2ludGVyLnBvaW50ZXJJZCxcbiAgICAgIHBvaW50ZXIsXG4gICAgICBldmVudCxcbiAgICAgIGRvd25UaW1lOiBudWxsLFxuICAgICAgZG93blRhcmdldDogbnVsbCxcbiAgICB9XSxcbiAgICAncG9pbnRlciBpcyBhZGRlZCdcbiAgKVxuXG4gIHQuZGVlcEVxdWFsKGludGVyYWN0aW9uLmRvd25Qb2ludGVyLCB7fSBhcyBhbnksICdkb3duUG9pbnRlciBpcyBub3QgdXBkYXRlZCcpXG5cbiAgdC5kZWVwRXF1YWwoaW50ZXJhY3Rpb24uY29vcmRzLnN0YXJ0LCBjb29yZHMuc3RhcnQsICdjb29yZHMuc3RhcnQgYXJlIG5vdCBtb2RpZmllZCcpXG4gIHQuZGVlcEVxdWFsKGludGVyYWN0aW9uLmNvb3Jkcy5jdXIsICAgY29vcmRzLmN1ciwgICAnY29vcmRzLmN1ciAgIGFyZSBub3QgbW9kaWZpZWQnKVxuICB0LmRlZXBFcXVhbChpbnRlcmFjdGlvbi5jb29yZHMucHJldiwgIGNvb3Jkcy5wcmV2LCAgJ2Nvb3Jkcy5wcmV2ICBhcmUgbm90IG1vZGlmaWVkJylcblxuICB0Lm9rKGludGVyYWN0aW9uLnBvaW50ZXJJc0Rvd24sICdwb2ludGVySXNEb3duJylcbiAgdC5ub3RPayhpbnRlcmFjdGlvbi5wb2ludGVyV2FzTW92ZWQsICchcG9pbnRlcldhc01vdmVkJylcblxuICB0LmVxdWFsKHNpZ25hbEFyZy5wb2ludGVyLCAgICAgIHBvaW50ZXIsICAgICAncG9pbnRlciAgICAgIGluIGRvd24gc2lnbmFsIGFyZycpXG4gIHQuZXF1YWwoc2lnbmFsQXJnLmV2ZW50LCAgICAgICAgZXZlbnQsICAgICAgICdldmVudCAgICAgICAgaW4gZG93biBzaWduYWwgYXJnJylcbiAgdC5lcXVhbChzaWduYWxBcmcuZXZlbnRUYXJnZXQsICBldmVudFRhcmdldCwgJ2V2ZW50VGFyZ2V0ICBpbiBkb3duIHNpZ25hbCBhcmcnKVxuICB0LmVxdWFsKHNpZ25hbEFyZy5wb2ludGVySW5kZXgsIDAsICAgICAgICAgICAncG9pbnRlckluZGV4IGluIGRvd24gc2lnbmFsIGFyZycpXG5cbiAgLy8gdGVzdCB3aGlsZSBub3QgaW50ZXJhY3RpbmdcbiAgaW50ZXJhY3Rpb24uX2ludGVyYWN0aW5nID0gZmFsc2VcbiAgLy8gcmVzZXQgcG9pbnRlcklzRG93blxuICBpbnRlcmFjdGlvbi5wb2ludGVySXNEb3duID0gZmFsc2VcbiAgLy8gcHJldGVuZCBwb2ludGVyIHdhcyBtb3ZlZFxuICBpbnRlcmFjdGlvbi5wb2ludGVyV2FzTW92ZWQgPSB0cnVlXG4gIC8vIHJlc2V0IHNpZ25hbEFyZyBvYmplY3RcbiAgc2lnbmFsQXJnID0gdW5kZWZpbmVkXG5cbiAgaW50ZXJhY3Rpb24ucmVtb3ZlUG9pbnRlcihwb2ludGVyLCBudWxsKVxuICBpbnRlcmFjdGlvbi5wb2ludGVyRG93bihwb2ludGVyLCBldmVudCwgZXZlbnRUYXJnZXQpXG5cbiAgLy8gdGltZVN0YW1wIGlzIGFzc2lnbmVkIHdpdGggbmV3IERhdGUuZ2V0VGltZSgpXG4gIC8vIGRvbid0IGxldCBpdCBjYXVzZSBkZWVwRWF1YWwgdG8gZmFpbFxuICBwb2ludGVyQ29vcmRzLnRpbWVTdGFtcCA9IGludGVyYWN0aW9uLmNvb3Jkcy5zdGFydC50aW1lU3RhbXBcblxuICB0LmVxdWFsKGludGVyYWN0aW9uLmRvd25FdmVudCwgZXZlbnQsICdkb3duRXZlbnQgaXMgdXBkYXRlZCcpXG5cbiAgdC5kZWVwRXF1YWwoXG4gICAgaW50ZXJhY3Rpb24ucG9pbnRlcnMsXG4gICAgW3tcbiAgICAgIGlkOiBwb2ludGVyLnBvaW50ZXJJZCxcbiAgICAgIHBvaW50ZXIsXG4gICAgICBldmVudCxcbiAgICAgIGRvd25UaW1lOiBwb2ludGVyQ29vcmRzLnRpbWVTdGFtcCxcbiAgICAgIGRvd25UYXJnZXQ6IGV2ZW50VGFyZ2V0LFxuICAgIH1dLFxuICAgICdpbnRlcmFjdGlvbi5wb2ludGVycyBpcyB1cGRhdGVkJylcblxuICB0LmRlZXBFcXVhbChpbnRlcmFjdGlvbi5jb29yZHMuc3RhcnQsIHBvaW50ZXJDb29yZHMsICdjb29yZHMuc3RhcnQgYXJlIHNldCB0byBwb2ludGVyJylcbiAgdC5kZWVwRXF1YWwoaW50ZXJhY3Rpb24uY29vcmRzLmN1ciwgICBwb2ludGVyQ29vcmRzLCAnY29vcmRzLmN1ciAgIGFyZSBzZXQgdG8gcG9pbnRlcicpXG4gIHQuZGVlcEVxdWFsKGludGVyYWN0aW9uLmNvb3Jkcy5wcmV2LCAgcG9pbnRlckNvb3JkcywgJ2Nvb3Jkcy5wcmV2ICBhcmUgc2V0IHRvIHBvaW50ZXInKVxuXG4gIHQuZXF1YWwodHlwZW9mIHNpZ25hbEFyZywgJ29iamVjdCcsICdkb3duIHNpZ25hbCB3YXMgZmlyZWQgYWdhaW4nKVxuICB0Lm9rKGludGVyYWN0aW9uLnBvaW50ZXJJc0Rvd24sICdwb2ludGVySXNEb3duJylcbiAgdC5ub3RPayhpbnRlcmFjdGlvbi5wb2ludGVyV2FzTW92ZWQsICdwb2ludGVyV2FzTW92ZWQgc2hvdWxkIGFsd2F5cyBjaGFuZ2UgdG8gZmFsc2UnKVxuXG4gIHQuZW5kKClcbn0pXG5cbnRlc3QoJ0ludGVyYWN0aW9uLnN0YXJ0JywgdCA9PiB7XG4gIGNvbnN0IGludGVyYWN0aW9uID0gbWFrZUludGVyYWN0aW9uQW5kU2lnbmFscygpXG4gIGNvbnN0IGFjdGlvbiA9IHsgbmFtZTogJ1RFU1QnIH1cbiAgY29uc3QgaW50ZXJhY3RhYmxlID0gaGVscGVycy5tb2NrSW50ZXJhY3RhYmxlKClcbiAgY29uc3QgZWxlbWVudDogYW55ID0ge31cbiAgY29uc3QgcG9pbnRlciA9IGhlbHBlcnMubmV3UG9pbnRlcigpXG4gIGNvbnN0IGV2ZW50OiBhbnkgPSB7fVxuXG4gIGludGVyYWN0aW9uLnN0YXJ0KGFjdGlvbiwgaW50ZXJhY3RhYmxlLCBlbGVtZW50KVxuICB0LmVxdWFsKGludGVyYWN0aW9uLnByZXBhcmVkLm5hbWUsIG51bGwsICdkbyBub3RoaW5nIGlmICFwb2ludGVySXNEb3duJylcblxuICAvLyBwb2ludGVycyBpcyBzdGlsbCBlbXB0eVxuICBpbnRlcmFjdGlvbi5wb2ludGVySXNEb3duID0gdHJ1ZVxuICBpbnRlcmFjdGlvbi5zdGFydChhY3Rpb24sIGludGVyYWN0YWJsZSwgZWxlbWVudClcbiAgdC5lcXVhbChpbnRlcmFjdGlvbi5wcmVwYXJlZC5uYW1lLCBudWxsLCAnZG8gbm90aGluZyBpZiB0b28gZmV3IHBvaW50ZXJzIGFyZSBkb3duJylcblxuICBpbnRlcmFjdGlvbi5wb2ludGVyRG93bihwb2ludGVyLCBldmVudCwgbnVsbClcblxuICBpbnRlcmFjdGlvbi5faW50ZXJhY3RpbmcgPSB0cnVlXG4gIGludGVyYWN0aW9uLnN0YXJ0KGFjdGlvbiwgaW50ZXJhY3RhYmxlLCBlbGVtZW50KVxuICB0LmVxdWFsKGludGVyYWN0aW9uLnByZXBhcmVkLm5hbWUsIG51bGwsICdkbyBub3RoaW5nIGlmIGFscmVhZHkgaW50ZXJhY3RpbmcnKVxuXG4gIGludGVyYWN0aW9uLl9pbnRlcmFjdGluZyA9IGZhbHNlXG5cbiAgaW50ZXJhY3RhYmxlLm9wdGlvbnNbYWN0aW9uLm5hbWVdID0geyBlbmFibGVkOiBmYWxzZSB9XG4gIGludGVyYWN0aW9uLnN0YXJ0KGFjdGlvbiwgaW50ZXJhY3RhYmxlLCBlbGVtZW50KVxuICB0LmVxdWFsKGludGVyYWN0aW9uLnByZXBhcmVkLm5hbWUsIG51bGwsICdkbyBub3RoaW5nIGlmIGFjdGlvbiBpcyBub3QgZW5hYmxlZCcpXG4gIGludGVyYWN0YWJsZS5vcHRpb25zW2FjdGlvbi5uYW1lXSA9IHsgZW5hYmxlZDogdHJ1ZSB9XG5cbiAgbGV0IHNpZ25hbEFyZ1xuICAvLyBsZXQgaW50ZXJhY3RpbmdJblN0YXJ0TGlzdGVuZXJcbiAgY29uc3Qgc2lnbmFsTGlzdGVuZXIgPSBhcmcgPT4ge1xuICAgIHNpZ25hbEFyZyA9IGFyZ1xuICAgIC8vIGludGVyYWN0aW5nSW5TdGFydExpc3RlbmVyID0gYXJnLmludGVyYWN0aW9uLmludGVyYWN0aW5nKClcbiAgfVxuXG4gIGludGVyYWN0aW9uLl9zaWduYWxzLm9uKCdhY3Rpb24tc3RhcnQnLCBzaWduYWxMaXN0ZW5lcilcbiAgaW50ZXJhY3Rpb24uc3RhcnQoYWN0aW9uLCBpbnRlcmFjdGFibGUsIGVsZW1lbnQpXG5cbiAgdC5lcXVhbChpbnRlcmFjdGlvbi5wcmVwYXJlZC5uYW1lLCBhY3Rpb24ubmFtZSwgJ2FjdGlvbiBpcyBwcmVwYXJlZCcpXG4gIHQuZXF1YWwoaW50ZXJhY3Rpb24uaW50ZXJhY3RhYmxlLCBpbnRlcmFjdGFibGUsICdpbnRlcmFjdGlvbi5pbnRlcmFjdGFibGUgaXMgdXBkYXRlZCcpXG4gIHQuZXF1YWwoaW50ZXJhY3Rpb24uZWxlbWVudCwgZWxlbWVudCwgJ2ludGVyYWN0aW9uLmVsZW1lbnQgaXMgdXBkYXRlZCcpXG5cbiAgLy8gdC5hc3NlcnQoaW50ZXJhY3RpbmdJblN0YXJ0TGlzdGVuZXIsICdpbnRlcmFjdGlvbiBpcyBpbnRlcmFjdGluZyBkdXJpbmcgYWN0aW9uLXN0YXJ0IHNpZ25hbCcpXG4gIHQuYXNzZXJ0KGludGVyYWN0aW9uLmludGVyYWN0aW5nKCksICdpbnRlcmFjdGlvbiBpcyBpbnRlcmFjdGluZyBhZnRlciBzdGFydCBtZXRob2QnKVxuICB0LmVxdWFsKHNpZ25hbEFyZy5pbnRlcmFjdGlvbiwgaW50ZXJhY3Rpb24sICdpbnRlcmFjdGlvbiBpbiBzaWduYWwgYXJnJylcbiAgdC5lcXVhbChzaWduYWxBcmcuZXZlbnQsIGV2ZW50LCAnZXZlbnQgKGludGVyYWN0aW9uLmRvd25FdmVudCkgaW4gc2lnbmFsIGFyZycpXG5cbiAgaW50ZXJhY3Rpb24uX2ludGVyYWN0aW5nID0gZmFsc2VcblxuICAvLyBpbnRlcmFjdGlvbi5zdGFydChhY3Rpb24sIHRhcmdldCwgZWxlbWVudClcbiAgLy8gdC5kZWVwRXF1YWwoc2NvcGUuaW50ZXJhY3Rpb25zLmxpc3QsIFtpbnRlcmFjdGlvbl0sICdpbnRlcmFjdGlvbiBpcyBhZGRlZCBiYWNrIHRvIHNjb3BlJylcblxuICB0LmVuZCgpXG59KVxuXG50ZXN0KCdzdG9wIGludGVyYWN0aW9uIGZyb20gc3RhcnQgZXZlbnQnLCB0ID0+IHtcbiAgY29uc3Qge1xuICAgIGludGVyYWN0aW9uLFxuICAgIGludGVyYWN0YWJsZSxcbiAgICB0YXJnZXQsXG4gIH0gPSBoZWxwZXJzLnRlc3RFbnYoeyBwbHVnaW5zOiBbZHJhZywgYXV0b1N0YXJ0XSB9KVxuXG4gIGxldCBzdG9wcGVkQmVmb3JlU3RhcnRGaXJlZFxuXG4gIGludGVyYWN0YWJsZS5vbignZHJhZ3N0YXJ0JywgZXZlbnQgPT4ge1xuICAgIHN0b3BwZWRCZWZvcmVTdGFydEZpcmVkID0gaW50ZXJhY3Rpb24uX3N0b3BwZWRcblxuICAgIGV2ZW50LmludGVyYWN0aW9uLnN0b3AoKVxuICB9KVxuXG4gIGludGVyYWN0aW9uLnN0YXJ0KHsgbmFtZTogJ2RyYWcnIH0sIGludGVyYWN0YWJsZSwgdGFyZ2V0IGFzIEhUTUxFbGVtZW50KVxuXG4gIHQubm90T2soc3RvcHBlZEJlZm9yZVN0YXJ0RmlyZWQsICchaW50ZXJhY3Rpb24uX3N0b3BwZWQgaW4gc3RhcnQgbGlzdGVuZXInKVxuICB0Lm5vdE9rKGludGVyYWN0aW9uLmludGVyYWN0aW5nKCksICdpbnRlcmFjdGlvbiBjYW4gYmUgc3RvcHBlZCBmcm9tIHN0YXJ0IGV2ZW50IGxpc3RlbmVyJylcbiAgdC5vayhpbnRlcmFjdGlvbi5fc3RvcHBlZCwgJ2ludGVyYWN0aW9uLl9zdG9wcGVkIGFmdGVyIHN0b3AoKSBpbiBzdGFydCBsaXN0ZW5lcicpXG5cbiAgdC5lbmQoKVxufSlcblxudGVzdCgnSW50ZXJhY3Rpb24gY3JlYXRlUHJlcGFyZWRFdmVudCcsIHQgPT4ge1xuICBjb25zdCBzY29wZSA9IGhlbHBlcnMubW9ja1Njb3BlKClcblxuICBjb25zdCBpbnRlcmFjdGlvbiA9IHNjb3BlLmludGVyYWN0aW9ucy5uZXcoe30pXG4gIGNvbnN0IGludGVyYWN0YWJsZSA9IGhlbHBlcnMubW9ja0ludGVyYWN0YWJsZSgpXG4gIGNvbnN0IGFjdGlvbiA9IHsgbmFtZTogJ3Jlc2l6ZScgfVxuICBjb25zdCBwaGFzZSA9ICdURVNUX1BIQVNFJ1xuXG4gIGludGVyYWN0aW9uLnByZXBhcmVkID0gYWN0aW9uXG4gIGludGVyYWN0aW9uLmludGVyYWN0YWJsZSA9IGludGVyYWN0YWJsZVxuICBpbnRlcmFjdGlvbi5lbGVtZW50ID0gaW50ZXJhY3RhYmxlLmVsZW1lbnRcbiAgaW50ZXJhY3Rpb24ucHJldkV2ZW50ID0geyBwYWdlOiB7fSwgY2xpZW50OiB7fSwgdmVsb2NpdHk6IHt9IH1cblxuICBjb25zdCBpRXZlbnQgPSBpbnRlcmFjdGlvbi5fY3JlYXRlUHJlcGFyZWRFdmVudCh7fSwgcGhhc2UpXG5cbiAgdC5vayhpRXZlbnQgaW5zdGFuY2VvZiBJbnRlcmFjdEV2ZW50LFxuICAgICdJbnRlcmFjdEV2ZW50IGlzIGZpcmVkJylcblxuICB0LmVxdWFsKGlFdmVudC50eXBlLCBhY3Rpb24ubmFtZSArIHBoYXNlLFxuICAgICdldmVudCB0eXBlJylcblxuICB0LmVxdWFsKGlFdmVudC5pbnRlcmFjdGFibGUsIGludGVyYWN0YWJsZSxcbiAgICAnZXZlbnQuaW50ZXJhY3RhYmxlJylcblxuICB0LmVxdWFsKGlFdmVudC50YXJnZXQsIGludGVyYWN0YWJsZS5lbGVtZW50LFxuICAgICdldmVudC50YXJnZXQnKVxuXG4gIHQuZW5kKClcbn0pXG5cbnRlc3QoJ0ludGVyYWN0aW9uIGZpcmVFdmVudCcsIHQgPT4ge1xuICBjb25zdCBpbnRlcmFjdGlvbiA9IG5ldyBJbnRlcmFjdGlvbih7IHNpZ25hbHM6IGhlbHBlcnMubW9ja1NpZ25hbHMoKSB9KVxuICBjb25zdCBpbnRlcmFjdGFibGUgPSBoZWxwZXJzLm1vY2tJbnRlcmFjdGFibGUoKVxuICBjb25zdCBpRXZlbnQgPSB7fSBhcyBJbnRlcmFjdC5JbnRlcmFjdEV2ZW50XG4gIGxldCBmaXJlZEV2ZW50XG5cbiAgLy8gdGhpcyBtZXRob2Qgc2hvdWxkIGJlIGNhbGxlZCBmcm9tIGFjdGlvbnMuZmlyZVByZXBhcmVkXG4gIGludGVyYWN0YWJsZS5maXJlID0gZXZlbnQgPT4ge1xuICAgIGZpcmVkRXZlbnQgPSBldmVudFxuICB9XG5cbiAgaW50ZXJhY3Rpb24uaW50ZXJhY3RhYmxlID0gaW50ZXJhY3RhYmxlXG4gIGludGVyYWN0aW9uLl9maXJlRXZlbnQoaUV2ZW50KVxuXG4gIHQuZXF1YWwoZmlyZWRFdmVudCwgaUV2ZW50LFxuICAgICd0YXJnZXQgaW50ZXJhY3RhYmxlXFwncyBmaXJlIG1ldGhvZCBpcyBjYWxsZWQnKVxuXG4gIHQuZXF1YWwoaW50ZXJhY3Rpb24ucHJldkV2ZW50LCBpRXZlbnQsXG4gICAgJ2ludGVyYWN0aW9uLnByZXZFdmVudCBpcyB1cGRhdGVkJylcblxuICB0LmVuZCgpXG59KVxuIl19