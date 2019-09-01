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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiSW50ZXJhY3Rpb24uc3BlYy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIkludGVyYWN0aW9uLnNwZWMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxJQUFJLE1BQU0sNEJBQTRCLENBQUE7QUFDN0MsT0FBTyxJQUFJLE1BQU0sMEJBQTBCLENBQUE7QUFDM0MsT0FBTyxTQUFTLE1BQU0sNkJBQTZCLENBQUE7QUFDbkQsT0FBTyxZQUFZLE1BQU0sZ0NBQWdDLENBQUE7QUFDekQsT0FBTyxPQUFPLE1BQU0sMkJBQTJCLENBQUE7QUFDL0MsT0FBTyxhQUFhLE1BQU0saUJBQWlCLENBQUE7QUFDM0MsT0FBTyxXQUFXLE1BQU0sZUFBZSxDQUFBO0FBQ3ZDLE9BQU8sS0FBSyxPQUFPLE1BQU0sa0JBQWtCLENBQUE7QUFFM0MsTUFBTSx5QkFBeUIsR0FBRyxHQUFHLEVBQUUsQ0FBQyxJQUFJLFdBQVcsQ0FBQyxFQUFFLE9BQU8sRUFBRSxJQUFJLE9BQU8sRUFBRSxFQUFTLENBQUMsQ0FBQTtBQUUxRixJQUFJLENBQUMseUJBQXlCLEVBQUUsQ0FBQyxDQUFDLEVBQUU7SUFDbEMsTUFBTSxRQUFRLEdBQUcsTUFBTSxDQUFBO0lBQ3ZCLE1BQU0sT0FBTyxHQUFHLElBQUksT0FBTyxFQUFFLENBQUE7SUFDN0IsTUFBTSxXQUFXLEdBQUcsSUFBSSxXQUFXLENBQUM7UUFDbEMsV0FBVyxFQUFFLFFBQVE7UUFDckIsT0FBTztLQUNSLENBQUMsQ0FBQTtJQUNGLE1BQU0sVUFBVSxHQUFHO1FBQ2pCLElBQUksRUFBTyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRTtRQUN6QixNQUFNLEVBQUssRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUU7UUFDekIsU0FBUyxFQUFFLENBQUM7S0FDYixDQUFBO0lBRUQsQ0FBQyxDQUFDLEtBQUssQ0FBQyxXQUFXLENBQUMsUUFBUSxFQUFFLE9BQU8sRUFDbkMsd0RBQXdELENBQUMsQ0FBQTtJQUUzRCxDQUFDLENBQUMsRUFBRSxDQUFDLFdBQVcsQ0FBQyxRQUFRLFlBQVksTUFBTSxFQUN6QyxtQ0FBbUMsQ0FBQyxDQUFBO0lBQ3RDLENBQUMsQ0FBQyxFQUFFLENBQUMsV0FBVyxDQUFDLFdBQVcsWUFBWSxNQUFNLEVBQzVDLHNDQUFzQyxDQUFDLENBQUE7SUFFekMsS0FBSyxNQUFNLFVBQVUsSUFBSSxXQUFXLENBQUMsTUFBTSxFQUFFO1FBQzNDLENBQUMsQ0FBQyxTQUFTLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxVQUFVLENBQUMsRUFBRSxVQUFVLEVBQ3BELHNCQUFzQixVQUFVLGNBQWMsQ0FBQyxDQUFBO0tBQ2xEO0lBRUQsQ0FBQyxDQUFDLEtBQUssQ0FBQyxXQUFXLENBQUMsV0FBVyxFQUFFLFFBQVEsRUFDdkMsZ0NBQWdDLENBQUMsQ0FBQTtJQUVuQyx5QkFBeUI7SUFDekIsQ0FBQyxDQUFDLFNBQVMsQ0FDVCxXQUFXLENBQUMsUUFBUSxFQUNwQixFQUFFLEVBQ0Ysa0RBQWtELENBQUMsQ0FBQTtJQUVyRCxtQkFBbUI7SUFDbkIsS0FBSyxNQUFNLElBQUksSUFBSSxrREFBa0QsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLEVBQUU7UUFDaEYsQ0FBQyxDQUFDLEtBQUssQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLEVBQUUsZUFBZSxJQUFJLFdBQVcsQ0FBQyxDQUFBO0tBQzNEO0lBRUQsQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFBO0FBQ1QsQ0FBQyxDQUFDLENBQUE7QUFFRixJQUFJLENBQUMscUJBQXFCLEVBQUUsQ0FBQyxDQUFDLEVBQUU7SUFDOUIsTUFBTSxXQUFXLEdBQUcseUJBQXlCLEVBQUUsQ0FBQTtJQUMvQyxNQUFNLE9BQU8sR0FBRyxFQUFFLFNBQVMsRUFBRSxFQUFFLEVBQVMsQ0FBQTtJQUN4QyxNQUFNLEtBQUssR0FBRyxFQUFTLENBQUE7SUFFdkIsV0FBVyxDQUFDLGFBQWEsQ0FBQyxPQUFPLEVBQUUsS0FBSyxFQUFFLElBQUksQ0FBQyxDQUFBO0lBRS9DLFdBQVcsQ0FBQyxPQUFPLEVBQUUsQ0FBQTtJQUVyQixDQUFDLENBQUMsV0FBVyxDQUFDLFdBQVcsQ0FBQyxjQUFjLENBQUMsT0FBTyxFQUFFLElBQUksRUFDcEQsNENBQTRDLENBQUMsQ0FBQTtJQUUvQyxDQUFDLENBQUMsV0FBVyxDQUFDLFdBQVcsQ0FBQyxjQUFjLENBQUMsS0FBSyxFQUFFLElBQUksRUFDbEQsMENBQTBDLENBQUMsQ0FBQTtJQUU3QyxDQUFDLENBQUMsV0FBVyxDQUFDLFdBQVcsQ0FBQyxjQUFjLENBQUMsV0FBVyxFQUFFLElBQUksRUFDeEQsZ0RBQWdELENBQUMsQ0FBQTtJQUVuRCxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUE7QUFDVCxDQUFDLENBQUMsQ0FBQTtBQUVGLElBQUksQ0FBQyw2QkFBNkIsRUFBRSxDQUFDLENBQUMsRUFBRTtJQUN0QyxNQUFNLFdBQVcsR0FBRyx5QkFBeUIsRUFBRSxDQUFBO0lBRS9DLFdBQVcsQ0FBQyxRQUFRLEdBQUcsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBUSxDQUFBO0lBRWxFLFdBQVcsQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLENBQUMsRUFBRSxFQUFFLEVBQUUsRUFBRSxLQUFLLEVBQUUsRUFBRTtRQUM3QyxDQUFDLENBQUMsS0FBSyxDQUFDLFdBQVcsQ0FBQyxlQUFlLENBQUMsRUFBRSxTQUFTLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQTtJQUNoRSxDQUFDLENBQUMsQ0FBQTtJQUVGLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQTtBQUNULENBQUMsQ0FBQyxDQUFBO0FBRUYsSUFBSSxDQUFDLDJCQUEyQixFQUFFLENBQUMsQ0FBQyxFQUFFO0lBQ3BDLENBQUMsQ0FBQyxJQUFJLENBQUMsc0JBQXNCLEVBQUUsRUFBRSxDQUFDLEVBQUU7UUFDbEMsTUFBTSxXQUFXLEdBQUcseUJBQXlCLEVBQUUsQ0FBQTtRQUMvQyxNQUFNLE9BQU8sR0FBRyxFQUFFLFNBQVMsRUFBRSxFQUFFLEVBQVMsQ0FBQTtRQUN4QyxNQUFNLEtBQUssR0FBRyxFQUFTLENBQUE7UUFFdkIsTUFBTSxHQUFHLEdBQUcsV0FBVyxDQUFDLGFBQWEsQ0FBQyxPQUFPLEVBQUUsS0FBSyxFQUFFLElBQUksQ0FBQyxDQUFBO1FBRTNELEVBQUUsQ0FBQyxTQUFTLENBQ1YsV0FBVyxDQUFDLFFBQVEsRUFDcEIsQ0FBQztnQkFDQyxFQUFFLEVBQUUsT0FBTyxDQUFDLFNBQVM7Z0JBQ3JCLE9BQU87Z0JBQ1AsS0FBSztnQkFDTCxRQUFRLEVBQUUsSUFBSTtnQkFDZCxVQUFVLEVBQUUsSUFBSTthQUNqQixDQUFDLEVBQ0YsNENBQTRDLENBQUMsQ0FBQTtRQUMvQyxFQUFFLENBQUMsS0FBSyxDQUFDLEdBQUcsRUFBRSxDQUFDLEVBQUUsK0JBQStCLENBQUMsQ0FBQTtRQUVqRCxFQUFFLENBQUMsR0FBRyxFQUFFLENBQUE7SUFDVixDQUFDLENBQUMsQ0FBQTtJQUVGLENBQUMsQ0FBQyxJQUFJLENBQUMsb0NBQW9DLEVBQUUsRUFBRSxDQUFDLEVBQUU7UUFDaEQsTUFBTSxXQUFXLEdBQUcseUJBQXlCLEVBQUUsQ0FBQTtRQUMvQyxNQUFNLFFBQVEsR0FBUSxFQUFFLFNBQVMsRUFBRSxDQUFDLEVBQUUsQ0FBQTtRQUN0QyxNQUFNLEtBQUssR0FBUSxFQUFFLENBQUE7UUFFckIsV0FBVyxDQUFDLGFBQWEsQ0FBQyxRQUFRLEVBQUUsS0FBSyxFQUFFLElBQUksQ0FBQyxDQUFBO1FBRWhELE1BQU0sVUFBVSxHQUFRLEVBQUUsU0FBUyxFQUFFLEVBQUUsRUFBRSxDQUFBO1FBQ3pDLE1BQU0sR0FBRyxHQUFHLFdBQVcsQ0FBQyxhQUFhLENBQUMsVUFBVSxFQUFFLEtBQUssRUFBRSxJQUFJLENBQUMsQ0FBQTtRQUU5RCxFQUFFLENBQUMsU0FBUyxDQUNWLFdBQVcsQ0FBQyxRQUFRLEVBQUU7WUFDcEI7Z0JBQ0UsRUFBRSxFQUFFLFFBQVEsQ0FBQyxTQUFTO2dCQUN0QixPQUFPLEVBQUUsUUFBUTtnQkFDakIsS0FBSztnQkFDTCxRQUFRLEVBQUUsSUFBSTtnQkFDZCxVQUFVLEVBQUUsSUFBSTthQUNqQjtZQUNEO2dCQUNFLEVBQUUsRUFBRSxVQUFVLENBQUMsU0FBUztnQkFDeEIsT0FBTyxFQUFFLFVBQVU7Z0JBQ25CLEtBQUs7Z0JBQ0wsUUFBUSxFQUFFLElBQUk7Z0JBQ2QsVUFBVSxFQUFFLElBQUk7YUFDakI7U0FDRixFQUNELG9GQUFvRixDQUFDLENBQUE7UUFFdkYsRUFBRSxDQUFDLEtBQUssQ0FBQyxHQUFHLEVBQUUsQ0FBQyxFQUFFLDJCQUEyQixDQUFDLENBQUE7UUFFN0MsRUFBRSxDQUFDLEdBQUcsRUFBRSxDQUFBO0lBQ1YsQ0FBQyxDQUFDLENBQUE7SUFFRixDQUFDLENBQUMsSUFBSSxDQUFDLDBCQUEwQixFQUFFLEVBQUUsQ0FBQyxFQUFFO1FBQ3RDLE1BQU0sV0FBVyxHQUFHLHlCQUF5QixFQUFFLENBQUE7UUFFL0MsTUFBTSxXQUFXLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLFNBQVMsRUFBRSxDQUFDLENBQUMsQ0FBQTtRQUNqRSxNQUFNLFdBQVcsR0FBRyxXQUFXLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLEdBQUcsT0FBTyxFQUFFLEdBQUcsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUE7UUFFM0UsV0FBVyxDQUFDLE9BQU8sQ0FBQyxDQUFDLE9BQVksRUFBRSxFQUFFLENBQUMsV0FBVyxDQUFDLGFBQWEsQ0FBQyxPQUFPLEVBQUUsT0FBTyxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUE7UUFDeEYsV0FBVyxDQUFDLE9BQU8sQ0FBQyxDQUFDLE9BQVksRUFBRSxFQUFFLENBQUMsV0FBVyxDQUFDLGFBQWEsQ0FBQyxPQUFPLEVBQUUsT0FBTyxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUE7UUFFeEYsRUFBRSxDQUFDLEtBQUssQ0FBQyxXQUFXLENBQUMsUUFBUSxDQUFDLE1BQU0sRUFBRSxXQUFXLENBQUMsTUFBTSxFQUN0RCxpQ0FBaUMsQ0FBQyxDQUFBO1FBRXBDLFdBQVcsQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLENBQUMsV0FBVyxFQUFFLENBQUMsRUFBRSxFQUFFO1lBQzlDLEVBQUUsQ0FBQyxLQUFLLENBQUMsV0FBVyxDQUFDLEVBQUUsRUFBRSxXQUFXLENBQUMsQ0FBQyxDQUFDLENBQUMsU0FBUyxFQUMvQyxXQUFXLENBQUMsa0JBQWtCLENBQUMsQ0FBQTtZQUNqQyxFQUFFLENBQUMsUUFBUSxDQUFDLFdBQVcsQ0FBQyxPQUFPLEVBQUUsV0FBVyxDQUFDLENBQUMsQ0FBQyxFQUM3QyxlQUFlLENBQUMseUJBQXlCLENBQUMsQ0FBQTtRQUM5QyxDQUFDLENBQUMsQ0FBQTtRQUVGLEVBQUUsQ0FBQyxHQUFHLEVBQUUsQ0FBQTtJQUNWLENBQUMsQ0FBQyxDQUFBO0lBRUYsQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFBO0FBQ1QsQ0FBQyxDQUFDLENBQUE7QUFFRixJQUFJLENBQUMsMkJBQTJCLEVBQUUsQ0FBQyxDQUFDLEVBQUU7SUFDcEMsTUFBTSxXQUFXLEdBQUcseUJBQXlCLEVBQUUsQ0FBQTtJQUMvQyxNQUFNLEdBQUcsR0FBRyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFBO0lBQ3hCLE1BQU0sUUFBUSxHQUFHO1FBQ2YsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLE1BQU0sRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsT0FBTyxFQUFFLFlBQVksRUFBRTtRQUNuRCxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsTUFBTSxFQUFFLENBQUMsQ0FBQyxFQUFLLENBQUMsQ0FBQyxFQUFFLE9BQU8sRUFBRSxhQUFhLEVBQUU7UUFDcEQsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLE1BQU0sRUFBRSxDQUFDLENBQUMsQ0FBTyxFQUFFLE9BQU8sRUFBRSxXQUFXLEVBQUU7UUFDbEQsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLE1BQU0sRUFBRSxFQUFTLEVBQUUsT0FBTyxFQUFFLE9BQU8sRUFBRTtLQUMvQyxDQUFBO0lBRUQsR0FBRyxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsRUFBRSxDQUFDLFdBQVcsQ0FBQyxhQUFhLENBQUMsRUFBRSxTQUFTLEVBQVMsRUFBRSxFQUFTLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQTtJQUUxRixLQUFLLE1BQU0sT0FBTyxJQUFJLFFBQVEsRUFBRTtRQUM5QixXQUFXLENBQUMsYUFBYSxDQUFDLEVBQUUsU0FBUyxFQUFFLE9BQU8sQ0FBQyxFQUFFLEVBQTBCLEVBQUUsSUFBSSxDQUFDLENBQUE7UUFFbEYsQ0FBQyxDQUFDLFNBQVMsQ0FDVCxXQUFXLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFDbkMsT0FBTyxDQUFDLE1BQU0sRUFDZCxHQUFHLE9BQU8sQ0FBQyxPQUFPLDhDQUE4QyxDQUFDLENBQUE7S0FDcEU7SUFFRCxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUE7QUFDVCxDQUFDLENBQUMsQ0FBQTtBQUVGLElBQUksQ0FBQyxpREFBaUQsRUFBRSxDQUFDLENBQUMsRUFBRTtJQUMxRCxNQUFNLE9BQU8sR0FBRyxJQUFJLE9BQU8sRUFBRSxDQUFBO0lBQzdCLE1BQU0sV0FBVyxHQUFHLElBQUksV0FBVyxDQUFDLEVBQUUsT0FBTyxFQUFTLENBQUMsQ0FBQTtJQUN2RCxNQUFNLFdBQVcsR0FBUSxFQUFFLENBQUE7SUFDM0IsTUFBTSxPQUFPLEdBQVE7UUFDbkIsTUFBTSxFQUFFLFdBQVc7UUFDbkIsU0FBUyxFQUFFLENBQUM7S0FDYixDQUFBO0lBQ0QsSUFBSSxJQUFJLEdBQVEsRUFBRSxDQUFBO0lBRWxCLE9BQU8sQ0FBQyxFQUFFLENBQUMsZ0JBQWdCLEVBQUUsR0FBRyxDQUFDLEVBQUUsR0FBRyxJQUFJLENBQUMsT0FBTyxHQUFHLEdBQUcsQ0FBQyxXQUFXLENBQUEsQ0FBQyxDQUFDLENBQUMsQ0FBQTtJQUN2RSxPQUFPLENBQUMsRUFBRSxDQUFDLGdCQUFnQixFQUFFLEdBQUcsQ0FBQyxFQUFFLEdBQUcsSUFBSSxDQUFDLE9BQU8sR0FBRyxHQUFHLENBQUMsV0FBVyxDQUFBLENBQUMsQ0FBQyxDQUFDLENBQUE7SUFFdkUsV0FBVyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsU0FBUyxHQUFHLENBQUMsQ0FBQTtJQUNwQyxNQUFNLGlCQUFpQixHQUFHO1FBQ3hCLEVBQUUsRUFBRSxDQUFDO1FBQ0wsT0FBTztRQUNQLEtBQUssRUFBRSxPQUFPO1FBQ2QsUUFBUSxFQUFFLElBQUk7UUFDZCxVQUFVLEVBQUUsSUFBSTtLQUNqQixDQUFBO0lBRUQsV0FBVyxDQUFDLFdBQVcsQ0FBQyxPQUFPLEVBQUUsT0FBTyxFQUFFLFdBQVcsQ0FBQyxDQUFBO0lBQ3RELENBQUMsQ0FBQyxTQUFTLENBQ1QsSUFBSSxDQUFDLE9BQU8sRUFDWjtRQUNFLEdBQUcsaUJBQWlCO1FBQ3BCLFFBQVEsRUFBRSxXQUFXLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxTQUFTO1FBQzFDLFVBQVUsRUFBRSxXQUFXO0tBQ3hCLEVBQ0QseUNBQXlDLENBQzFDLENBQUE7SUFDRCxDQUFDLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsU0FBUyxFQUFFLGlEQUFpRCxDQUFDLENBQUE7SUFDbkYsV0FBVyxDQUFDLGFBQWEsQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLENBQUE7SUFDeEMsSUFBSSxHQUFHLEVBQUUsQ0FBQTtJQUVULFdBQVcsQ0FBQyxXQUFXLENBQUMsT0FBTyxFQUFFLE9BQU8sRUFBRSxXQUFXLENBQUMsQ0FBQTtJQUN0RCxDQUFDLENBQUMsU0FBUyxDQUNULElBQUksQ0FBQyxPQUFPLEVBQ1osaUJBQWlCLEVBQ2pCLHlDQUF5QyxDQUMxQyxDQUFBO0lBQ0QsQ0FBQyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLFNBQVMsRUFBRSxpREFBaUQsQ0FBQyxDQUFBO0lBQ25GLElBQUksR0FBRyxFQUFFLENBQUE7SUFFVCxXQUFXLENBQUMsU0FBUyxDQUFDLE9BQU8sRUFBRSxPQUFPLEVBQUUsV0FBVyxFQUFFLElBQUksQ0FBQyxDQUFBO0lBQzFELENBQUMsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxTQUFTLEVBQUUsd0RBQXdELENBQUMsQ0FBQTtJQUMxRixJQUFJLEdBQUcsRUFBRSxDQUFBO0lBRVQsV0FBVyxDQUFDLFNBQVMsQ0FBQyxPQUFPLEVBQUUsT0FBTyxFQUFFLFdBQVcsRUFBRSxJQUFJLENBQUMsQ0FBQTtJQUMxRCxDQUFDLENBQUMsU0FBUyxDQUNULElBQUksQ0FBQyxPQUFPLEVBQ1osaUJBQWlCLEVBQ2pCLG9EQUFvRCxDQUNyRCxDQUFBO0lBQ0QsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLGlCQUFpQixFQUFFLDRDQUE0QyxDQUFDLENBQUE7SUFDMUYsSUFBSSxHQUFHLEVBQUUsQ0FBQTtJQUVULENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQTtBQUNULENBQUMsQ0FBQyxDQUFBO0FBRUYsSUFBSSxDQUFDLHlCQUF5QixFQUFFLENBQUMsQ0FBQyxFQUFFO0lBQ2xDLE1BQU0sV0FBVyxHQUFHLHlCQUF5QixFQUFFLENBQUE7SUFDL0MsTUFBTSxNQUFNLEdBQUcsT0FBTyxDQUFDLFlBQVksRUFBRSxDQUFBO0lBQ3JDLE1BQU0sV0FBVyxHQUFHLEVBQXNCLENBQUE7SUFDMUMsTUFBTSxLQUFLLEdBQVE7UUFDakIsSUFBSSxFQUFFLE1BQU07UUFDWixNQUFNLEVBQUUsV0FBVztLQUNwQixDQUFBO0lBQ0QsTUFBTSxPQUFPLEdBQVEsT0FBTyxDQUFDLFVBQVUsRUFBRSxDQUFBO0lBQ3pDLElBQUksU0FBUyxDQUFBO0lBRWIsTUFBTSxjQUFjLEdBQUcsR0FBRyxDQUFDLEVBQUU7UUFDM0IsU0FBUyxHQUFHLEdBQUcsQ0FBQTtJQUNqQixDQUFDLENBQUE7SUFFRCxXQUFXLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQyxNQUFNLEVBQUUsY0FBYyxDQUFDLENBQUE7SUFFL0MsTUFBTSxhQUFhLEdBQVEsRUFBRSxJQUFJLEVBQUUsRUFBRSxFQUFFLE1BQU0sRUFBRSxFQUFFLEVBQUUsQ0FBQTtJQUNuRCxZQUFZLENBQUMsU0FBUyxDQUFDLGFBQWEsRUFBRSxDQUFDLE9BQU8sQ0FBQyxFQUFFLEtBQUssQ0FBQyxTQUFTLENBQUMsQ0FBQTtJQUVqRSxLQUFLLE1BQU0sSUFBSSxJQUFJLE1BQU0sRUFBRTtRQUN6QixZQUFZLENBQUMsVUFBVSxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUE7S0FDaEU7SUFFRCx5QkFBeUI7SUFDekIsV0FBVyxDQUFDLFlBQVksR0FBRyxJQUFJLENBQUE7SUFDL0IsV0FBVyxDQUFDLFdBQVcsQ0FBQyxPQUFPLEVBQUUsS0FBSyxFQUFFLFdBQVcsQ0FBQyxDQUFBO0lBRXBELENBQUMsQ0FBQyxLQUFLLENBQUMsV0FBVyxDQUFDLFNBQVMsRUFBRSxJQUFJLEVBQUUsMEJBQTBCLENBQUMsQ0FBQTtJQUNoRSxDQUFDLENBQUMsU0FBUyxDQUNULFdBQVcsQ0FBQyxRQUFRLEVBQ3BCLENBQUM7WUFDQyxFQUFFLEVBQUUsT0FBTyxDQUFDLFNBQVM7WUFDckIsT0FBTztZQUNQLEtBQUs7WUFDTCxRQUFRLEVBQUUsSUFBSTtZQUNkLFVBQVUsRUFBRSxJQUFJO1NBQ2pCLENBQUMsRUFDRixrQkFBa0IsQ0FDbkIsQ0FBQTtJQUVELENBQUMsQ0FBQyxTQUFTLENBQUMsV0FBVyxDQUFDLFdBQVcsRUFBRSxFQUFTLEVBQUUsNEJBQTRCLENBQUMsQ0FBQTtJQUU3RSxDQUFDLENBQUMsU0FBUyxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsS0FBSyxFQUFFLE1BQU0sQ0FBQyxLQUFLLEVBQUUsK0JBQStCLENBQUMsQ0FBQTtJQUNwRixDQUFDLENBQUMsU0FBUyxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsR0FBRyxFQUFJLE1BQU0sQ0FBQyxHQUFHLEVBQUksK0JBQStCLENBQUMsQ0FBQTtJQUNwRixDQUFDLENBQUMsU0FBUyxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsSUFBSSxFQUFHLE1BQU0sQ0FBQyxJQUFJLEVBQUcsK0JBQStCLENBQUMsQ0FBQTtJQUVwRixDQUFDLENBQUMsRUFBRSxDQUFDLFdBQVcsQ0FBQyxhQUFhLEVBQUUsZUFBZSxDQUFDLENBQUE7SUFDaEQsQ0FBQyxDQUFDLEtBQUssQ0FBQyxXQUFXLENBQUMsZUFBZSxFQUFFLGtCQUFrQixDQUFDLENBQUE7SUFFeEQsQ0FBQyxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsT0FBTyxFQUFPLE9BQU8sRUFBTSxpQ0FBaUMsQ0FBQyxDQUFBO0lBQy9FLENBQUMsQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLEtBQUssRUFBUyxLQUFLLEVBQVEsaUNBQWlDLENBQUMsQ0FBQTtJQUMvRSxDQUFDLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxXQUFXLEVBQUcsV0FBVyxFQUFFLGlDQUFpQyxDQUFDLENBQUE7SUFDL0UsQ0FBQyxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsWUFBWSxFQUFFLENBQUMsRUFBWSxpQ0FBaUMsQ0FBQyxDQUFBO0lBRS9FLDZCQUE2QjtJQUM3QixXQUFXLENBQUMsWUFBWSxHQUFHLEtBQUssQ0FBQTtJQUNoQyxzQkFBc0I7SUFDdEIsV0FBVyxDQUFDLGFBQWEsR0FBRyxLQUFLLENBQUE7SUFDakMsNEJBQTRCO0lBQzVCLFdBQVcsQ0FBQyxlQUFlLEdBQUcsSUFBSSxDQUFBO0lBQ2xDLHlCQUF5QjtJQUN6QixTQUFTLEdBQUcsU0FBUyxDQUFBO0lBRXJCLFdBQVcsQ0FBQyxhQUFhLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxDQUFBO0lBQ3hDLFdBQVcsQ0FBQyxXQUFXLENBQUMsT0FBTyxFQUFFLEtBQUssRUFBRSxXQUFXLENBQUMsQ0FBQTtJQUVwRCxnREFBZ0Q7SUFDaEQsdUNBQXVDO0lBQ3ZDLGFBQWEsQ0FBQyxTQUFTLEdBQUcsV0FBVyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFBO0lBRTVELENBQUMsQ0FBQyxLQUFLLENBQUMsV0FBVyxDQUFDLFNBQVMsRUFBRSxLQUFLLEVBQUUsc0JBQXNCLENBQUMsQ0FBQTtJQUU3RCxDQUFDLENBQUMsU0FBUyxDQUNULFdBQVcsQ0FBQyxRQUFRLEVBQ3BCLENBQUM7WUFDQyxFQUFFLEVBQUUsT0FBTyxDQUFDLFNBQVM7WUFDckIsT0FBTztZQUNQLEtBQUs7WUFDTCxRQUFRLEVBQUUsYUFBYSxDQUFDLFNBQVM7WUFDakMsVUFBVSxFQUFFLFdBQVc7U0FDeEIsQ0FBQyxFQUNGLGlDQUFpQyxDQUFDLENBQUE7SUFFcEMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLEtBQUssRUFBRSxhQUFhLEVBQUUsaUNBQWlDLENBQUMsQ0FBQTtJQUN2RixDQUFDLENBQUMsU0FBUyxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsR0FBRyxFQUFJLGFBQWEsRUFBRSxpQ0FBaUMsQ0FBQyxDQUFBO0lBQ3ZGLENBQUMsQ0FBQyxTQUFTLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxJQUFJLEVBQUcsYUFBYSxFQUFFLGlDQUFpQyxDQUFDLENBQUE7SUFFdkYsQ0FBQyxDQUFDLEtBQUssQ0FBQyxPQUFPLFNBQVMsRUFBRSxRQUFRLEVBQUUsNkJBQTZCLENBQUMsQ0FBQTtJQUNsRSxDQUFDLENBQUMsRUFBRSxDQUFDLFdBQVcsQ0FBQyxhQUFhLEVBQUUsZUFBZSxDQUFDLENBQUE7SUFDaEQsQ0FBQyxDQUFDLEtBQUssQ0FBQyxXQUFXLENBQUMsZUFBZSxFQUFFLCtDQUErQyxDQUFDLENBQUE7SUFFckYsQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFBO0FBQ1QsQ0FBQyxDQUFDLENBQUE7QUFFRixJQUFJLENBQUMsbUJBQW1CLEVBQUUsQ0FBQyxDQUFDLEVBQUU7SUFDNUIsTUFBTSxXQUFXLEdBQUcseUJBQXlCLEVBQUUsQ0FBQTtJQUMvQyxNQUFNLE1BQU0sR0FBRyxFQUFFLElBQUksRUFBRSxNQUFNLEVBQUUsQ0FBQTtJQUMvQixNQUFNLFlBQVksR0FBRyxPQUFPLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQTtJQUMvQyxNQUFNLE9BQU8sR0FBUSxFQUFFLENBQUE7SUFDdkIsTUFBTSxPQUFPLEdBQUcsT0FBTyxDQUFDLFVBQVUsRUFBRSxDQUFBO0lBQ3BDLE1BQU0sS0FBSyxHQUFRLEVBQUUsQ0FBQTtJQUVyQixXQUFXLENBQUMsS0FBSyxDQUFDLE1BQU0sRUFBRSxZQUFZLEVBQUUsT0FBTyxDQUFDLENBQUE7SUFDaEQsQ0FBQyxDQUFDLEtBQUssQ0FBQyxXQUFXLENBQUMsUUFBUSxDQUFDLElBQUksRUFBRSxJQUFJLEVBQUUsOEJBQThCLENBQUMsQ0FBQTtJQUV4RSwwQkFBMEI7SUFDMUIsV0FBVyxDQUFDLGFBQWEsR0FBRyxJQUFJLENBQUE7SUFDaEMsV0FBVyxDQUFDLEtBQUssQ0FBQyxNQUFNLEVBQUUsWUFBWSxFQUFFLE9BQU8sQ0FBQyxDQUFBO0lBQ2hELENBQUMsQ0FBQyxLQUFLLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQyxJQUFJLEVBQUUsSUFBSSxFQUFFLHlDQUF5QyxDQUFDLENBQUE7SUFFbkYsV0FBVyxDQUFDLFdBQVcsQ0FBQyxPQUFPLEVBQUUsS0FBSyxFQUFFLElBQUksQ0FBQyxDQUFBO0lBRTdDLFdBQVcsQ0FBQyxZQUFZLEdBQUcsSUFBSSxDQUFBO0lBQy9CLFdBQVcsQ0FBQyxLQUFLLENBQUMsTUFBTSxFQUFFLFlBQVksRUFBRSxPQUFPLENBQUMsQ0FBQTtJQUNoRCxDQUFDLENBQUMsS0FBSyxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUMsSUFBSSxFQUFFLElBQUksRUFBRSxtQ0FBbUMsQ0FBQyxDQUFBO0lBRTdFLFdBQVcsQ0FBQyxZQUFZLEdBQUcsS0FBSyxDQUFBO0lBRWhDLFlBQVksQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsT0FBTyxFQUFFLEtBQUssRUFBRSxDQUFBO0lBQ3RELFdBQVcsQ0FBQyxLQUFLLENBQUMsTUFBTSxFQUFFLFlBQVksRUFBRSxPQUFPLENBQUMsQ0FBQTtJQUNoRCxDQUFDLENBQUMsS0FBSyxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUMsSUFBSSxFQUFFLElBQUksRUFBRSxxQ0FBcUMsQ0FBQyxDQUFBO0lBQy9FLFlBQVksQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsT0FBTyxFQUFFLElBQUksRUFBRSxDQUFBO0lBRXJELElBQUksU0FBUyxDQUFBO0lBQ2IsaUNBQWlDO0lBQ2pDLE1BQU0sY0FBYyxHQUFHLEdBQUcsQ0FBQyxFQUFFO1FBQzNCLFNBQVMsR0FBRyxHQUFHLENBQUE7UUFDZiw2REFBNkQ7SUFDL0QsQ0FBQyxDQUFBO0lBRUQsV0FBVyxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUMsY0FBYyxFQUFFLGNBQWMsQ0FBQyxDQUFBO0lBQ3ZELFdBQVcsQ0FBQyxLQUFLLENBQUMsTUFBTSxFQUFFLFlBQVksRUFBRSxPQUFPLENBQUMsQ0FBQTtJQUVoRCxDQUFDLENBQUMsS0FBSyxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUMsSUFBSSxFQUFFLE1BQU0sQ0FBQyxJQUFJLEVBQUUsb0JBQW9CLENBQUMsQ0FBQTtJQUNyRSxDQUFDLENBQUMsS0FBSyxDQUFDLFdBQVcsQ0FBQyxZQUFZLEVBQUUsWUFBWSxFQUFFLHFDQUFxQyxDQUFDLENBQUE7SUFDdEYsQ0FBQyxDQUFDLEtBQUssQ0FBQyxXQUFXLENBQUMsT0FBTyxFQUFFLE9BQU8sRUFBRSxnQ0FBZ0MsQ0FBQyxDQUFBO0lBRXZFLGdHQUFnRztJQUNoRyxDQUFDLENBQUMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxXQUFXLEVBQUUsRUFBRSwrQ0FBK0MsQ0FBQyxDQUFBO0lBQ3BGLENBQUMsQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLFdBQVcsRUFBRSxXQUFXLEVBQUUsMkJBQTJCLENBQUMsQ0FBQTtJQUN4RSxDQUFDLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxLQUFLLEVBQUUsS0FBSyxFQUFFLDZDQUE2QyxDQUFDLENBQUE7SUFFOUUsV0FBVyxDQUFDLFlBQVksR0FBRyxLQUFLLENBQUE7SUFFaEMsNkNBQTZDO0lBQzdDLDRGQUE0RjtJQUU1RixDQUFDLENBQUMsR0FBRyxFQUFFLENBQUE7QUFDVCxDQUFDLENBQUMsQ0FBQTtBQUVGLElBQUksQ0FBQyxtQ0FBbUMsRUFBRSxDQUFDLENBQUMsRUFBRTtJQUM1QyxNQUFNLEVBQ0osV0FBVyxFQUNYLFlBQVksRUFDWixNQUFNLEdBQ1AsR0FBRyxPQUFPLENBQUMsT0FBTyxDQUFDLEVBQUUsT0FBTyxFQUFFLENBQUMsSUFBSSxFQUFFLFNBQVMsQ0FBQyxFQUFFLENBQUMsQ0FBQTtJQUVuRCxJQUFJLHVCQUF1QixDQUFBO0lBRTNCLFlBQVksQ0FBQyxFQUFFLENBQUMsV0FBVyxFQUFFLEtBQUssQ0FBQyxFQUFFO1FBQ25DLHVCQUF1QixHQUFHLFdBQVcsQ0FBQyxRQUFRLENBQUE7UUFFOUMsS0FBSyxDQUFDLFdBQVcsQ0FBQyxJQUFJLEVBQUUsQ0FBQTtJQUMxQixDQUFDLENBQUMsQ0FBQTtJQUVGLFdBQVcsQ0FBQyxLQUFLLENBQUMsRUFBRSxJQUFJLEVBQUUsTUFBTSxFQUFFLEVBQUUsWUFBWSxFQUFFLE1BQXFCLENBQUMsQ0FBQTtJQUV4RSxDQUFDLENBQUMsS0FBSyxDQUFDLHVCQUF1QixFQUFFLHlDQUF5QyxDQUFDLENBQUE7SUFDM0UsQ0FBQyxDQUFDLEtBQUssQ0FBQyxXQUFXLENBQUMsV0FBVyxFQUFFLEVBQUUsc0RBQXNELENBQUMsQ0FBQTtJQUMxRixDQUFDLENBQUMsRUFBRSxDQUFDLFdBQVcsQ0FBQyxRQUFRLEVBQUUscURBQXFELENBQUMsQ0FBQTtJQUVqRixDQUFDLENBQUMsR0FBRyxFQUFFLENBQUE7QUFDVCxDQUFDLENBQUMsQ0FBQTtBQUVGLElBQUksQ0FBQyxpQ0FBaUMsRUFBRSxDQUFDLENBQUMsRUFBRTtJQUMxQyxNQUFNLEtBQUssR0FBRyxPQUFPLENBQUMsU0FBUyxFQUFFLENBQUE7SUFFakMsTUFBTSxXQUFXLEdBQUcsS0FBSyxDQUFDLFlBQVksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUE7SUFDOUMsTUFBTSxZQUFZLEdBQUcsT0FBTyxDQUFDLGdCQUFnQixFQUFFLENBQUE7SUFDL0MsTUFBTSxNQUFNLEdBQUcsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFLENBQUE7SUFDakMsTUFBTSxLQUFLLEdBQUcsWUFBWSxDQUFBO0lBRTFCLFdBQVcsQ0FBQyxRQUFRLEdBQUcsTUFBTSxDQUFBO0lBQzdCLFdBQVcsQ0FBQyxZQUFZLEdBQUcsWUFBWSxDQUFBO0lBQ3ZDLFdBQVcsQ0FBQyxPQUFPLEdBQUcsWUFBWSxDQUFDLE9BQU8sQ0FBQTtJQUMxQyxXQUFXLENBQUMsU0FBUyxHQUFHLEVBQUUsSUFBSSxFQUFFLEVBQUUsRUFBRSxNQUFNLEVBQUUsRUFBRSxFQUFFLFFBQVEsRUFBRSxFQUFFLEVBQUUsQ0FBQTtJQUU5RCxNQUFNLE1BQU0sR0FBRyxXQUFXLENBQUMsb0JBQW9CLENBQUMsRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFBO0lBRTFELENBQUMsQ0FBQyxFQUFFLENBQUMsTUFBTSxZQUFZLGFBQWEsRUFDbEMsd0JBQXdCLENBQUMsQ0FBQTtJQUUzQixDQUFDLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxJQUFJLEVBQUUsTUFBTSxDQUFDLElBQUksR0FBRyxLQUFLLEVBQ3RDLFlBQVksQ0FBQyxDQUFBO0lBRWYsQ0FBQyxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsWUFBWSxFQUFFLFlBQVksRUFDdkMsb0JBQW9CLENBQUMsQ0FBQTtJQUV2QixDQUFDLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxNQUFNLEVBQUUsWUFBWSxDQUFDLE9BQU8sRUFDekMsY0FBYyxDQUFDLENBQUE7SUFFakIsQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFBO0FBQ1QsQ0FBQyxDQUFDLENBQUE7QUFFRixJQUFJLENBQUMsdUJBQXVCLEVBQUUsQ0FBQyxDQUFDLEVBQUU7SUFDaEMsTUFBTSxXQUFXLEdBQUcsSUFBSSxXQUFXLENBQUMsRUFBRSxPQUFPLEVBQUUsT0FBTyxDQUFDLFdBQVcsRUFBRSxFQUFFLENBQUMsQ0FBQTtJQUN2RSxNQUFNLFlBQVksR0FBRyxPQUFPLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQTtJQUMvQyxNQUFNLE1BQU0sR0FBRyxFQUE0QixDQUFBO0lBQzNDLElBQUksVUFBVSxDQUFBO0lBRWQseURBQXlEO0lBQ3pELFlBQVksQ0FBQyxJQUFJLEdBQUcsS0FBSyxDQUFDLEVBQUU7UUFDMUIsVUFBVSxHQUFHLEtBQUssQ0FBQTtJQUNwQixDQUFDLENBQUE7SUFFRCxXQUFXLENBQUMsWUFBWSxHQUFHLFlBQVksQ0FBQTtJQUN2QyxXQUFXLENBQUMsVUFBVSxDQUFDLE1BQU0sQ0FBQyxDQUFBO0lBRTlCLENBQUMsQ0FBQyxLQUFLLENBQUMsVUFBVSxFQUFFLE1BQU0sRUFDeEIsOENBQThDLENBQUMsQ0FBQTtJQUVqRCxDQUFDLENBQUMsS0FBSyxDQUFDLFdBQVcsQ0FBQyxTQUFTLEVBQUUsTUFBTSxFQUNuQyxrQ0FBa0MsQ0FBQyxDQUFBO0lBRXJDLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQTtBQUNULENBQUMsQ0FBQyxDQUFBIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHRlc3QgZnJvbSAnQGludGVyYWN0anMvX2Rldi90ZXN0L3Rlc3QnXG5pbXBvcnQgZHJhZyBmcm9tICdAaW50ZXJhY3Rqcy9hY3Rpb25zL2RyYWcnXG5pbXBvcnQgYXV0b1N0YXJ0IGZyb20gJ0BpbnRlcmFjdGpzL2F1dG8tc3RhcnQvYmFzZSdcbmltcG9ydCBwb2ludGVyVXRpbHMgZnJvbSAnQGludGVyYWN0anMvdXRpbHMvcG9pbnRlclV0aWxzJ1xuaW1wb3J0IFNpZ25hbHMgZnJvbSAnQGludGVyYWN0anMvdXRpbHMvU2lnbmFscydcbmltcG9ydCBJbnRlcmFjdEV2ZW50IGZyb20gJy4vSW50ZXJhY3RFdmVudCdcbmltcG9ydCBJbnRlcmFjdGlvbiBmcm9tICcuL0ludGVyYWN0aW9uJ1xuaW1wb3J0ICogYXMgaGVscGVycyBmcm9tICcuL3Rlc3RzL19oZWxwZXJzJ1xuXG5jb25zdCBtYWtlSW50ZXJhY3Rpb25BbmRTaWduYWxzID0gKCkgPT4gbmV3IEludGVyYWN0aW9uKHsgc2lnbmFsczogbmV3IFNpZ25hbHMoKSB9IGFzIGFueSlcblxudGVzdCgnSW50ZXJhY3Rpb24gY29uc3RydWN0b3InLCB0ID0+IHtcbiAgY29uc3QgdGVzdFR5cGUgPSAndGVzdCdcbiAgY29uc3Qgc2lnbmFscyA9IG5ldyBTaWduYWxzKClcbiAgY29uc3QgaW50ZXJhY3Rpb24gPSBuZXcgSW50ZXJhY3Rpb24oe1xuICAgIHBvaW50ZXJUeXBlOiB0ZXN0VHlwZSxcbiAgICBzaWduYWxzLFxuICB9KVxuICBjb25zdCB6ZXJvQ29vcmRzID0ge1xuICAgIHBhZ2UgICAgIDogeyB4OiAwLCB5OiAwIH0sXG4gICAgY2xpZW50ICAgOiB7IHg6IDAsIHk6IDAgfSxcbiAgICB0aW1lU3RhbXA6IDAsXG4gIH1cblxuICB0LmVxdWFsKGludGVyYWN0aW9uLl9zaWduYWxzLCBzaWduYWxzLFxuICAgICdzaWduYWxzIG9wdGlvbiBpcyBzZXQgYXNzaWduZWQgdG8gaW50ZXJhY3Rpb24uX3NpZ25hbHMnKVxuXG4gIHQub2soaW50ZXJhY3Rpb24ucHJlcGFyZWQgaW5zdGFuY2VvZiBPYmplY3QsXG4gICAgJ2ludGVyYWN0aW9uLnByZXBhcmVkIGlzIGFuIG9iamVjdCcpXG4gIHQub2soaW50ZXJhY3Rpb24uZG93blBvaW50ZXIgaW5zdGFuY2VvZiBPYmplY3QsXG4gICAgJ2ludGVyYWN0aW9uLmRvd25Qb2ludGVyIGlzIGFuIG9iamVjdCcpXG5cbiAgZm9yIChjb25zdCBjb29yZEZpZWxkIGluIGludGVyYWN0aW9uLmNvb3Jkcykge1xuICAgIHQuZGVlcEVxdWFsKGludGVyYWN0aW9uLmNvb3Jkc1tjb29yZEZpZWxkXSwgemVyb0Nvb3JkcyxcbiAgICAgIGBpbnRlcmFjdGlvbi5jb29yZHMuJHtjb29yZEZpZWxkfSBzZXQgdG8gemVyb2ApXG4gIH1cblxuICB0LmVxdWFsKGludGVyYWN0aW9uLnBvaW50ZXJUeXBlLCB0ZXN0VHlwZSxcbiAgICAnaW50ZXJhY3Rpb24ucG9pbnRlclR5cGUgaXMgc2V0JylcblxuICAvLyBwb2ludGVySW5mbyBwcm9wZXJ0aWVzXG4gIHQuZGVlcEVxdWFsKFxuICAgIGludGVyYWN0aW9uLnBvaW50ZXJzLFxuICAgIFtdLFxuICAgICdpbnRlcmFjdGlvbi5wb2ludGVycyBpcyBpbml0aWFsbHkgYW4gZW1wdHkgYXJyYXknKVxuXG4gIC8vIGZhbHNlIHByb3BlcnRpZXNcbiAgZm9yIChjb25zdCBwcm9wIG9mICdwb2ludGVySXNEb3duIHBvaW50ZXJXYXNNb3ZlZCBfaW50ZXJhY3RpbmcgbW91c2UnLnNwbGl0KCcgJykpIHtcbiAgICB0Lm5vdE9rKGludGVyYWN0aW9uW3Byb3BdLCBgaW50ZXJhY3Rpb24uJHtwcm9wfSBpcyBmYWxzZWApXG4gIH1cblxuICB0LmVuZCgpXG59KVxuXG50ZXN0KCdJbnRlcmFjdGlvbiBkZXN0cm95JywgdCA9PiB7XG4gIGNvbnN0IGludGVyYWN0aW9uID0gbWFrZUludGVyYWN0aW9uQW5kU2lnbmFscygpXG4gIGNvbnN0IHBvaW50ZXIgPSB7IHBvaW50ZXJJZDogMTAgfSBhcyBhbnlcbiAgY29uc3QgZXZlbnQgPSB7fSBhcyBhbnlcblxuICBpbnRlcmFjdGlvbi51cGRhdGVQb2ludGVyKHBvaW50ZXIsIGV2ZW50LCBudWxsKVxuXG4gIGludGVyYWN0aW9uLmRlc3Ryb3koKVxuXG4gIHQuc3RyaWN0RXF1YWwoaW50ZXJhY3Rpb24uX2xhdGVzdFBvaW50ZXIucG9pbnRlciwgbnVsbCxcbiAgICAnaW50ZXJhY3Rpb24uX2xhdGVzdFBvaW50ZXIucG9pbnRlciBpcyBudWxsJylcblxuICB0LnN0cmljdEVxdWFsKGludGVyYWN0aW9uLl9sYXRlc3RQb2ludGVyLmV2ZW50LCBudWxsLFxuICAgICdpbnRlcmFjdGlvbi5fbGF0ZXN0UG9pbnRlci5ldmVudCBpcyBudWxsJylcblxuICB0LnN0cmljdEVxdWFsKGludGVyYWN0aW9uLl9sYXRlc3RQb2ludGVyLmV2ZW50VGFyZ2V0LCBudWxsLFxuICAgICdpbnRlcmFjdGlvbi5fbGF0ZXN0UG9pbnRlci5ldmVudFRhcmdldCBpcyBudWxsJylcblxuICB0LmVuZCgpXG59KVxuXG50ZXN0KCdJbnRlcmFjdGlvbi5nZXRQb2ludGVySW5kZXgnLCB0ID0+IHtcbiAgY29uc3QgaW50ZXJhY3Rpb24gPSBtYWtlSW50ZXJhY3Rpb25BbmRTaWduYWxzKClcblxuICBpbnRlcmFjdGlvbi5wb2ludGVycyA9IFsyLCA0LCA1LCAwLCAtMV0ubWFwKGlkID0+ICh7IGlkIH0pKSBhcyBhbnlcblxuICBpbnRlcmFjdGlvbi5wb2ludGVycy5mb3JFYWNoKCh7IGlkIH0sIGluZGV4KSA9PiB7XG4gICAgdC5lcXVhbChpbnRlcmFjdGlvbi5nZXRQb2ludGVySW5kZXgoeyBwb2ludGVySWQ6IGlkIH0pLCBpbmRleClcbiAgfSlcblxuICB0LmVuZCgpXG59KVxuXG50ZXN0KCdJbnRlcmFjdGlvbi51cGRhdGVQb2ludGVyJywgdCA9PiB7XG4gIHQudGVzdCgnbm8gZXhpc3RpbmcgcG9pbnRlcnMnLCBzdCA9PiB7XG4gICAgY29uc3QgaW50ZXJhY3Rpb24gPSBtYWtlSW50ZXJhY3Rpb25BbmRTaWduYWxzKClcbiAgICBjb25zdCBwb2ludGVyID0geyBwb2ludGVySWQ6IDEwIH0gYXMgYW55XG4gICAgY29uc3QgZXZlbnQgPSB7fSBhcyBhbnlcblxuICAgIGNvbnN0IHJldCA9IGludGVyYWN0aW9uLnVwZGF0ZVBvaW50ZXIocG9pbnRlciwgZXZlbnQsIG51bGwpXG5cbiAgICBzdC5kZWVwRXF1YWwoXG4gICAgICBpbnRlcmFjdGlvbi5wb2ludGVycyxcbiAgICAgIFt7XG4gICAgICAgIGlkOiBwb2ludGVyLnBvaW50ZXJJZCxcbiAgICAgICAgcG9pbnRlcixcbiAgICAgICAgZXZlbnQsXG4gICAgICAgIGRvd25UaW1lOiBudWxsLFxuICAgICAgICBkb3duVGFyZ2V0OiBudWxsLFxuICAgICAgfV0sXG4gICAgICAnaW50ZXJhY3Rpb24ucG9pbnRlcnMgPT0gW3sgcG9pbnRlciwgLi4uIH1dJylcbiAgICBzdC5lcXVhbChyZXQsIDAsICduZXcgcG9pbnRlciBpbmRleCBpcyByZXR1cm5lZCcpXG5cbiAgICBzdC5lbmQoKVxuICB9KVxuXG4gIHQudGVzdCgnbmV3IHBvaW50ZXIgd2l0aCBleGlzaXRpbmcgcG9pbnRlcicsIHN0ID0+IHtcbiAgICBjb25zdCBpbnRlcmFjdGlvbiA9IG1ha2VJbnRlcmFjdGlvbkFuZFNpZ25hbHMoKVxuICAgIGNvbnN0IGV4aXN0aW5nOiBhbnkgPSB7IHBvaW50ZXJJZDogMCB9XG4gICAgY29uc3QgZXZlbnQ6IGFueSA9IHt9XG5cbiAgICBpbnRlcmFjdGlvbi51cGRhdGVQb2ludGVyKGV4aXN0aW5nLCBldmVudCwgbnVsbClcblxuICAgIGNvbnN0IG5ld1BvaW50ZXI6IGFueSA9IHsgcG9pbnRlcklkOiAxMCB9XG4gICAgY29uc3QgcmV0ID0gaW50ZXJhY3Rpb24udXBkYXRlUG9pbnRlcihuZXdQb2ludGVyLCBldmVudCwgbnVsbClcblxuICAgIHN0LmRlZXBFcXVhbChcbiAgICAgIGludGVyYWN0aW9uLnBvaW50ZXJzLCBbXG4gICAgICAgIHtcbiAgICAgICAgICBpZDogZXhpc3RpbmcucG9pbnRlcklkLFxuICAgICAgICAgIHBvaW50ZXI6IGV4aXN0aW5nLFxuICAgICAgICAgIGV2ZW50LFxuICAgICAgICAgIGRvd25UaW1lOiBudWxsLFxuICAgICAgICAgIGRvd25UYXJnZXQ6IG51bGwsXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICBpZDogbmV3UG9pbnRlci5wb2ludGVySWQsXG4gICAgICAgICAgcG9pbnRlcjogbmV3UG9pbnRlcixcbiAgICAgICAgICBldmVudCxcbiAgICAgICAgICBkb3duVGltZTogbnVsbCxcbiAgICAgICAgICBkb3duVGFyZ2V0OiBudWxsLFxuICAgICAgICB9LFxuICAgICAgXSxcbiAgICAgICdpbnRlcmFjdGlvbi5wb2ludGVycyA9PSBbeyBwb2ludGVyOiBleGlzdGluZywgLi4uIH0sIHsgcG9pbnRlcjogbmV3UG9pbnRlciwgLi4uIH1dJylcblxuICAgIHN0LmVxdWFsKHJldCwgMSwgJ3NlY29uZCBwb2ludGVyIGluZGV4IGlzIDEnKVxuXG4gICAgc3QuZW5kKClcbiAgfSlcblxuICB0LnRlc3QoJ3VwZGF0ZSBleGlzdGluZyBwb2ludGVycycsIHN0ID0+IHtcbiAgICBjb25zdCBpbnRlcmFjdGlvbiA9IG1ha2VJbnRlcmFjdGlvbkFuZFNpZ25hbHMoKVxuXG4gICAgY29uc3Qgb2xkUG9pbnRlcnMgPSBbLTMsIDEwLCAyXS5tYXAocG9pbnRlcklkID0+ICh7IHBvaW50ZXJJZCB9KSlcbiAgICBjb25zdCBuZXdQb2ludGVycyA9IG9sZFBvaW50ZXJzLm1hcChwb2ludGVyID0+ICh7IC4uLnBvaW50ZXIsIG5ldzogdHJ1ZSB9KSlcblxuICAgIG9sZFBvaW50ZXJzLmZvckVhY2goKHBvaW50ZXI6IGFueSkgPT4gaW50ZXJhY3Rpb24udXBkYXRlUG9pbnRlcihwb2ludGVyLCBwb2ludGVyLCBudWxsKSlcbiAgICBuZXdQb2ludGVycy5mb3JFYWNoKChwb2ludGVyOiBhbnkpID0+IGludGVyYWN0aW9uLnVwZGF0ZVBvaW50ZXIocG9pbnRlciwgcG9pbnRlciwgbnVsbCkpXG5cbiAgICBzdC5lcXVhbChpbnRlcmFjdGlvbi5wb2ludGVycy5sZW5ndGgsIG9sZFBvaW50ZXJzLmxlbmd0aCxcbiAgICAgICdudW1iZXIgb2YgcG9pbnRlcnMgaXMgdW5jaGFuZ2VkJylcblxuICAgIGludGVyYWN0aW9uLnBvaW50ZXJzLmZvckVhY2goKHBvaW50ZXJJbmZvLCBpKSA9PiB7XG4gICAgICBzdC5lcXVhbChwb2ludGVySW5mby5pZCwgb2xkUG9pbnRlcnNbaV0ucG9pbnRlcklkLFxuICAgICAgICBgcG9pbnRlclske2l9XS5pZCBpcyB0aGUgc2FtZWApXG4gICAgICBzdC5ub3RFcXVhbChwb2ludGVySW5mby5wb2ludGVyLCBvbGRQb2ludGVyc1tpXSxcbiAgICAgICAgYG5ldyBwb2ludGVyICR7aX0gIT09IG9sZCBwb2ludGVyIG9iamVjdGApXG4gICAgfSlcblxuICAgIHN0LmVuZCgpXG4gIH0pXG5cbiAgdC5lbmQoKVxufSlcblxudGVzdCgnSW50ZXJhY3Rpb24ucmVtb3ZlUG9pbnRlcicsIHQgPT4ge1xuICBjb25zdCBpbnRlcmFjdGlvbiA9IG1ha2VJbnRlcmFjdGlvbkFuZFNpZ25hbHMoKVxuICBjb25zdCBpZHMgPSBbMCwgMSwgMiwgM11cbiAgY29uc3QgcmVtb3ZhbHMgPSBbXG4gICAgeyBpZDogMCwgcmVtYWluOiBbMSwgMiwgM10sIG1lc3NhZ2U6ICdmaXJzdCBvZiA0JyB9LFxuICAgIHsgaWQ6IDIsIHJlbWFpbjogWzEsICAgIDNdLCBtZXNzYWdlOiAnbWlkZGxlIG9mIDMnIH0sXG4gICAgeyBpZDogMywgcmVtYWluOiBbMSAgICAgIF0sIG1lc3NhZ2U6ICdsYXN0IG9mIDInIH0sXG4gICAgeyBpZDogMSwgcmVtYWluOiBbICAgICAgIF0sIG1lc3NhZ2U6ICdmaW5hbCcgfSxcbiAgXVxuXG4gIGlkcy5mb3JFYWNoKHBvaW50ZXJJZCA9PiBpbnRlcmFjdGlvbi51cGRhdGVQb2ludGVyKHsgcG9pbnRlcklkIH0gYXMgYW55LCB7fSBhcyBhbnksIG51bGwpKVxuXG4gIGZvciAoY29uc3QgcmVtb3ZhbCBvZiByZW1vdmFscykge1xuICAgIGludGVyYWN0aW9uLnJlbW92ZVBvaW50ZXIoeyBwb2ludGVySWQ6IHJlbW92YWwuaWQgfSBhcyBJbnRlcmFjdC5Qb2ludGVyVHlwZSwgbnVsbClcblxuICAgIHQuZGVlcEVxdWFsKFxuICAgICAgaW50ZXJhY3Rpb24ucG9pbnRlcnMubWFwKHAgPT4gcC5pZCksXG4gICAgICByZW1vdmFsLnJlbWFpbixcbiAgICAgIGAke3JlbW92YWwubWVzc2FnZX0gLSByZW1haW5pbmcgaW50ZXJhY3Rpb24ucG9pbnRlcnMgaXMgY29ycmVjdGApXG4gIH1cblxuICB0LmVuZCgpXG59KVxuXG50ZXN0KCdJbnRlcmFjdGlvbi5wb2ludGVye0Rvd24sTW92ZSxVcH0gdXBkYXRlUG9pbnRlcicsIHQgPT4ge1xuICBjb25zdCBzaWduYWxzID0gbmV3IFNpZ25hbHMoKVxuICBjb25zdCBpbnRlcmFjdGlvbiA9IG5ldyBJbnRlcmFjdGlvbih7IHNpZ25hbHMgfSBhcyBhbnkpXG4gIGNvbnN0IGV2ZW50VGFyZ2V0OiBhbnkgPSB7fVxuICBjb25zdCBwb2ludGVyOiBhbnkgPSB7XG4gICAgdGFyZ2V0OiBldmVudFRhcmdldCxcbiAgICBwb2ludGVySWQ6IDAsXG4gIH1cbiAgbGV0IGluZm86IGFueSA9IHt9XG5cbiAgc2lnbmFscy5vbigndXBkYXRlLXBvaW50ZXInLCBhcmcgPT4geyBpbmZvLnVwZGF0ZWQgPSBhcmcucG9pbnRlckluZm8gfSlcbiAgc2lnbmFscy5vbigncmVtb3ZlLXBvaW50ZXInLCBhcmcgPT4geyBpbmZvLnJlbW92ZWQgPSBhcmcucG9pbnRlckluZm8gfSlcblxuICBpbnRlcmFjdGlvbi5jb29yZHMuY3VyLnRpbWVTdGFtcCA9IDBcbiAgY29uc3QgY29tbW9uUG9pbnRlckluZm8gPSB7XG4gICAgaWQ6IDAsXG4gICAgcG9pbnRlcixcbiAgICBldmVudDogcG9pbnRlcixcbiAgICBkb3duVGltZTogbnVsbCxcbiAgICBkb3duVGFyZ2V0OiBudWxsLFxuICB9XG5cbiAgaW50ZXJhY3Rpb24ucG9pbnRlckRvd24ocG9pbnRlciwgcG9pbnRlciwgZXZlbnRUYXJnZXQpXG4gIHQuZGVlcEVxdWFsKFxuICAgIGluZm8udXBkYXRlZCxcbiAgICB7XG4gICAgICAuLi5jb21tb25Qb2ludGVySW5mbyxcbiAgICAgIGRvd25UaW1lOiBpbnRlcmFjdGlvbi5jb29yZHMuY3VyLnRpbWVTdGFtcCxcbiAgICAgIGRvd25UYXJnZXQ6IGV2ZW50VGFyZ2V0LFxuICAgIH0sXG4gICAgJ2ludGVyYWN0aW9uLnBvaW50ZXJEb3duIHVwZGF0ZXMgcG9pbnRlcidcbiAgKVxuICB0LmVxdWFsKGluZm8ucmVtb3ZlZCwgdW5kZWZpbmVkLCAnaW50ZXJhY3Rpb24ucG9pbnRlckRvd24gZG9lc25cXCd0IHJlbW92ZSBwb2ludGVyJylcbiAgaW50ZXJhY3Rpb24ucmVtb3ZlUG9pbnRlcihwb2ludGVyLCBudWxsKVxuICBpbmZvID0ge31cblxuICBpbnRlcmFjdGlvbi5wb2ludGVyTW92ZShwb2ludGVyLCBwb2ludGVyLCBldmVudFRhcmdldClcbiAgdC5kZWVwRXF1YWwoXG4gICAgaW5mby51cGRhdGVkLFxuICAgIGNvbW1vblBvaW50ZXJJbmZvLFxuICAgICdpbnRlcmFjdGlvbi5wb2ludGVyTW92ZSB1cGRhdGVzIHBvaW50ZXInXG4gIClcbiAgdC5lcXVhbChpbmZvLnJlbW92ZWQsIHVuZGVmaW5lZCwgJ2ludGVyYWN0aW9uLnBvaW50ZXJNb3ZlIGRvZXNuXFwndCByZW1vdmUgcG9pbnRlcicpXG4gIGluZm8gPSB7fVxuXG4gIGludGVyYWN0aW9uLnBvaW50ZXJVcChwb2ludGVyLCBwb2ludGVyLCBldmVudFRhcmdldCwgbnVsbClcbiAgdC5lcXVhbChpbmZvLnVwZGF0ZWQsIHVuZGVmaW5lZCwgJ2ludGVyYWN0aW9uLnBvaW50ZXJVcCBkb2VzblxcJ3QgdXBkYXRlIGV4aXN0aW5nIHBvaW50ZXInKVxuICBpbmZvID0ge31cblxuICBpbnRlcmFjdGlvbi5wb2ludGVyVXAocG9pbnRlciwgcG9pbnRlciwgZXZlbnRUYXJnZXQsIG51bGwpXG4gIHQuZGVlcEVxdWFsKFxuICAgIGluZm8udXBkYXRlZCxcbiAgICBjb21tb25Qb2ludGVySW5mbyxcbiAgICAnaW50ZXJhY3Rpb24ucG9pbnRlclVwIHVwZGF0ZXMgbm9uIGV4aXN0aW5nIHBvaW50ZXInXG4gIClcbiAgdC5kZWVwRXF1YWwoaW5mby5yZW1vdmVkLCBjb21tb25Qb2ludGVySW5mbywgJ2ludGVyYWN0aW9uLnBvaW50ZXJVcCBhbHNvIHJlbW92ZXMgcG9pbnRlcicpXG4gIGluZm8gPSB7fVxuXG4gIHQuZW5kKClcbn0pXG5cbnRlc3QoJ0ludGVyYWN0aW9uLnBvaW50ZXJEb3duJywgdCA9PiB7XG4gIGNvbnN0IGludGVyYWN0aW9uID0gbWFrZUludGVyYWN0aW9uQW5kU2lnbmFscygpXG4gIGNvbnN0IGNvb3JkcyA9IGhlbHBlcnMubmV3Q29vcmRzU2V0KClcbiAgY29uc3QgZXZlbnRUYXJnZXQgPSB7fSBhcyBJbnRlcmFjdC5FbGVtZW50XG4gIGNvbnN0IGV2ZW50OiBhbnkgPSB7XG4gICAgdHlwZTogJ2Rvd24nLFxuICAgIHRhcmdldDogZXZlbnRUYXJnZXQsXG4gIH1cbiAgY29uc3QgcG9pbnRlcjogYW55ID0gaGVscGVycy5uZXdQb2ludGVyKClcbiAgbGV0IHNpZ25hbEFyZ1xuXG4gIGNvbnN0IHNpZ25hbExpc3RlbmVyID0gYXJnID0+IHtcbiAgICBzaWduYWxBcmcgPSBhcmdcbiAgfVxuXG4gIGludGVyYWN0aW9uLl9zaWduYWxzLm9uKCdkb3duJywgc2lnbmFsTGlzdGVuZXIpXG5cbiAgY29uc3QgcG9pbnRlckNvb3JkczogYW55ID0geyBwYWdlOiB7fSwgY2xpZW50OiB7fSB9XG4gIHBvaW50ZXJVdGlscy5zZXRDb29yZHMocG9pbnRlckNvb3JkcywgW3BvaW50ZXJdLCBldmVudC50aW1lU3RhbXApXG5cbiAgZm9yIChjb25zdCBwcm9wIGluIGNvb3Jkcykge1xuICAgIHBvaW50ZXJVdGlscy5jb3B5Q29vcmRzKGludGVyYWN0aW9uLmNvb3Jkc1twcm9wXSwgY29vcmRzW3Byb3BdKVxuICB9XG5cbiAgLy8gdGVzdCB3aGlsZSBpbnRlcmFjdGluZ1xuICBpbnRlcmFjdGlvbi5faW50ZXJhY3RpbmcgPSB0cnVlXG4gIGludGVyYWN0aW9uLnBvaW50ZXJEb3duKHBvaW50ZXIsIGV2ZW50LCBldmVudFRhcmdldClcblxuICB0LmVxdWFsKGludGVyYWN0aW9uLmRvd25FdmVudCwgbnVsbCwgJ2Rvd25FdmVudCBpcyBub3QgdXBkYXRlZCcpXG4gIHQuZGVlcEVxdWFsKFxuICAgIGludGVyYWN0aW9uLnBvaW50ZXJzLFxuICAgIFt7XG4gICAgICBpZDogcG9pbnRlci5wb2ludGVySWQsXG4gICAgICBwb2ludGVyLFxuICAgICAgZXZlbnQsXG4gICAgICBkb3duVGltZTogbnVsbCxcbiAgICAgIGRvd25UYXJnZXQ6IG51bGwsXG4gICAgfV0sXG4gICAgJ3BvaW50ZXIgaXMgYWRkZWQnXG4gIClcblxuICB0LmRlZXBFcXVhbChpbnRlcmFjdGlvbi5kb3duUG9pbnRlciwge30gYXMgYW55LCAnZG93blBvaW50ZXIgaXMgbm90IHVwZGF0ZWQnKVxuXG4gIHQuZGVlcEVxdWFsKGludGVyYWN0aW9uLmNvb3Jkcy5zdGFydCwgY29vcmRzLnN0YXJ0LCAnY29vcmRzLnN0YXJ0IGFyZSBub3QgbW9kaWZpZWQnKVxuICB0LmRlZXBFcXVhbChpbnRlcmFjdGlvbi5jb29yZHMuY3VyLCAgIGNvb3Jkcy5jdXIsICAgJ2Nvb3Jkcy5jdXIgICBhcmUgbm90IG1vZGlmaWVkJylcbiAgdC5kZWVwRXF1YWwoaW50ZXJhY3Rpb24uY29vcmRzLnByZXYsICBjb29yZHMucHJldiwgICdjb29yZHMucHJldiAgYXJlIG5vdCBtb2RpZmllZCcpXG5cbiAgdC5vayhpbnRlcmFjdGlvbi5wb2ludGVySXNEb3duLCAncG9pbnRlcklzRG93bicpXG4gIHQubm90T2soaW50ZXJhY3Rpb24ucG9pbnRlcldhc01vdmVkLCAnIXBvaW50ZXJXYXNNb3ZlZCcpXG5cbiAgdC5lcXVhbChzaWduYWxBcmcucG9pbnRlciwgICAgICBwb2ludGVyLCAgICAgJ3BvaW50ZXIgICAgICBpbiBkb3duIHNpZ25hbCBhcmcnKVxuICB0LmVxdWFsKHNpZ25hbEFyZy5ldmVudCwgICAgICAgIGV2ZW50LCAgICAgICAnZXZlbnQgICAgICAgIGluIGRvd24gc2lnbmFsIGFyZycpXG4gIHQuZXF1YWwoc2lnbmFsQXJnLmV2ZW50VGFyZ2V0LCAgZXZlbnRUYXJnZXQsICdldmVudFRhcmdldCAgaW4gZG93biBzaWduYWwgYXJnJylcbiAgdC5lcXVhbChzaWduYWxBcmcucG9pbnRlckluZGV4LCAwLCAgICAgICAgICAgJ3BvaW50ZXJJbmRleCBpbiBkb3duIHNpZ25hbCBhcmcnKVxuXG4gIC8vIHRlc3Qgd2hpbGUgbm90IGludGVyYWN0aW5nXG4gIGludGVyYWN0aW9uLl9pbnRlcmFjdGluZyA9IGZhbHNlXG4gIC8vIHJlc2V0IHBvaW50ZXJJc0Rvd25cbiAgaW50ZXJhY3Rpb24ucG9pbnRlcklzRG93biA9IGZhbHNlXG4gIC8vIHByZXRlbmQgcG9pbnRlciB3YXMgbW92ZWRcbiAgaW50ZXJhY3Rpb24ucG9pbnRlcldhc01vdmVkID0gdHJ1ZVxuICAvLyByZXNldCBzaWduYWxBcmcgb2JqZWN0XG4gIHNpZ25hbEFyZyA9IHVuZGVmaW5lZFxuXG4gIGludGVyYWN0aW9uLnJlbW92ZVBvaW50ZXIocG9pbnRlciwgbnVsbClcbiAgaW50ZXJhY3Rpb24ucG9pbnRlckRvd24ocG9pbnRlciwgZXZlbnQsIGV2ZW50VGFyZ2V0KVxuXG4gIC8vIHRpbWVTdGFtcCBpcyBhc3NpZ25lZCB3aXRoIG5ldyBEYXRlLmdldFRpbWUoKVxuICAvLyBkb24ndCBsZXQgaXQgY2F1c2UgZGVlcEVhdWFsIHRvIGZhaWxcbiAgcG9pbnRlckNvb3Jkcy50aW1lU3RhbXAgPSBpbnRlcmFjdGlvbi5jb29yZHMuc3RhcnQudGltZVN0YW1wXG5cbiAgdC5lcXVhbChpbnRlcmFjdGlvbi5kb3duRXZlbnQsIGV2ZW50LCAnZG93bkV2ZW50IGlzIHVwZGF0ZWQnKVxuXG4gIHQuZGVlcEVxdWFsKFxuICAgIGludGVyYWN0aW9uLnBvaW50ZXJzLFxuICAgIFt7XG4gICAgICBpZDogcG9pbnRlci5wb2ludGVySWQsXG4gICAgICBwb2ludGVyLFxuICAgICAgZXZlbnQsXG4gICAgICBkb3duVGltZTogcG9pbnRlckNvb3Jkcy50aW1lU3RhbXAsXG4gICAgICBkb3duVGFyZ2V0OiBldmVudFRhcmdldCxcbiAgICB9XSxcbiAgICAnaW50ZXJhY3Rpb24ucG9pbnRlcnMgaXMgdXBkYXRlZCcpXG5cbiAgdC5kZWVwRXF1YWwoaW50ZXJhY3Rpb24uY29vcmRzLnN0YXJ0LCBwb2ludGVyQ29vcmRzLCAnY29vcmRzLnN0YXJ0IGFyZSBzZXQgdG8gcG9pbnRlcicpXG4gIHQuZGVlcEVxdWFsKGludGVyYWN0aW9uLmNvb3Jkcy5jdXIsICAgcG9pbnRlckNvb3JkcywgJ2Nvb3Jkcy5jdXIgICBhcmUgc2V0IHRvIHBvaW50ZXInKVxuICB0LmRlZXBFcXVhbChpbnRlcmFjdGlvbi5jb29yZHMucHJldiwgIHBvaW50ZXJDb29yZHMsICdjb29yZHMucHJldiAgYXJlIHNldCB0byBwb2ludGVyJylcblxuICB0LmVxdWFsKHR5cGVvZiBzaWduYWxBcmcsICdvYmplY3QnLCAnZG93biBzaWduYWwgd2FzIGZpcmVkIGFnYWluJylcbiAgdC5vayhpbnRlcmFjdGlvbi5wb2ludGVySXNEb3duLCAncG9pbnRlcklzRG93bicpXG4gIHQubm90T2soaW50ZXJhY3Rpb24ucG9pbnRlcldhc01vdmVkLCAncG9pbnRlcldhc01vdmVkIHNob3VsZCBhbHdheXMgY2hhbmdlIHRvIGZhbHNlJylcblxuICB0LmVuZCgpXG59KVxuXG50ZXN0KCdJbnRlcmFjdGlvbi5zdGFydCcsIHQgPT4ge1xuICBjb25zdCBpbnRlcmFjdGlvbiA9IG1ha2VJbnRlcmFjdGlvbkFuZFNpZ25hbHMoKVxuICBjb25zdCBhY3Rpb24gPSB7IG5hbWU6ICdURVNUJyB9XG4gIGNvbnN0IGludGVyYWN0YWJsZSA9IGhlbHBlcnMubW9ja0ludGVyYWN0YWJsZSgpXG4gIGNvbnN0IGVsZW1lbnQ6IGFueSA9IHt9XG4gIGNvbnN0IHBvaW50ZXIgPSBoZWxwZXJzLm5ld1BvaW50ZXIoKVxuICBjb25zdCBldmVudDogYW55ID0ge31cblxuICBpbnRlcmFjdGlvbi5zdGFydChhY3Rpb24sIGludGVyYWN0YWJsZSwgZWxlbWVudClcbiAgdC5lcXVhbChpbnRlcmFjdGlvbi5wcmVwYXJlZC5uYW1lLCBudWxsLCAnZG8gbm90aGluZyBpZiAhcG9pbnRlcklzRG93bicpXG5cbiAgLy8gcG9pbnRlcnMgaXMgc3RpbGwgZW1wdHlcbiAgaW50ZXJhY3Rpb24ucG9pbnRlcklzRG93biA9IHRydWVcbiAgaW50ZXJhY3Rpb24uc3RhcnQoYWN0aW9uLCBpbnRlcmFjdGFibGUsIGVsZW1lbnQpXG4gIHQuZXF1YWwoaW50ZXJhY3Rpb24ucHJlcGFyZWQubmFtZSwgbnVsbCwgJ2RvIG5vdGhpbmcgaWYgdG9vIGZldyBwb2ludGVycyBhcmUgZG93bicpXG5cbiAgaW50ZXJhY3Rpb24ucG9pbnRlckRvd24ocG9pbnRlciwgZXZlbnQsIG51bGwpXG5cbiAgaW50ZXJhY3Rpb24uX2ludGVyYWN0aW5nID0gdHJ1ZVxuICBpbnRlcmFjdGlvbi5zdGFydChhY3Rpb24sIGludGVyYWN0YWJsZSwgZWxlbWVudClcbiAgdC5lcXVhbChpbnRlcmFjdGlvbi5wcmVwYXJlZC5uYW1lLCBudWxsLCAnZG8gbm90aGluZyBpZiBhbHJlYWR5IGludGVyYWN0aW5nJylcblxuICBpbnRlcmFjdGlvbi5faW50ZXJhY3RpbmcgPSBmYWxzZVxuXG4gIGludGVyYWN0YWJsZS5vcHRpb25zW2FjdGlvbi5uYW1lXSA9IHsgZW5hYmxlZDogZmFsc2UgfVxuICBpbnRlcmFjdGlvbi5zdGFydChhY3Rpb24sIGludGVyYWN0YWJsZSwgZWxlbWVudClcbiAgdC5lcXVhbChpbnRlcmFjdGlvbi5wcmVwYXJlZC5uYW1lLCBudWxsLCAnZG8gbm90aGluZyBpZiBhY3Rpb24gaXMgbm90IGVuYWJsZWQnKVxuICBpbnRlcmFjdGFibGUub3B0aW9uc1thY3Rpb24ubmFtZV0gPSB7IGVuYWJsZWQ6IHRydWUgfVxuXG4gIGxldCBzaWduYWxBcmdcbiAgLy8gbGV0IGludGVyYWN0aW5nSW5TdGFydExpc3RlbmVyXG4gIGNvbnN0IHNpZ25hbExpc3RlbmVyID0gYXJnID0+IHtcbiAgICBzaWduYWxBcmcgPSBhcmdcbiAgICAvLyBpbnRlcmFjdGluZ0luU3RhcnRMaXN0ZW5lciA9IGFyZy5pbnRlcmFjdGlvbi5pbnRlcmFjdGluZygpXG4gIH1cblxuICBpbnRlcmFjdGlvbi5fc2lnbmFscy5vbignYWN0aW9uLXN0YXJ0Jywgc2lnbmFsTGlzdGVuZXIpXG4gIGludGVyYWN0aW9uLnN0YXJ0KGFjdGlvbiwgaW50ZXJhY3RhYmxlLCBlbGVtZW50KVxuXG4gIHQuZXF1YWwoaW50ZXJhY3Rpb24ucHJlcGFyZWQubmFtZSwgYWN0aW9uLm5hbWUsICdhY3Rpb24gaXMgcHJlcGFyZWQnKVxuICB0LmVxdWFsKGludGVyYWN0aW9uLmludGVyYWN0YWJsZSwgaW50ZXJhY3RhYmxlLCAnaW50ZXJhY3Rpb24uaW50ZXJhY3RhYmxlIGlzIHVwZGF0ZWQnKVxuICB0LmVxdWFsKGludGVyYWN0aW9uLmVsZW1lbnQsIGVsZW1lbnQsICdpbnRlcmFjdGlvbi5lbGVtZW50IGlzIHVwZGF0ZWQnKVxuXG4gIC8vIHQuYXNzZXJ0KGludGVyYWN0aW5nSW5TdGFydExpc3RlbmVyLCAnaW50ZXJhY3Rpb24gaXMgaW50ZXJhY3RpbmcgZHVyaW5nIGFjdGlvbi1zdGFydCBzaWduYWwnKVxuICB0LmFzc2VydChpbnRlcmFjdGlvbi5pbnRlcmFjdGluZygpLCAnaW50ZXJhY3Rpb24gaXMgaW50ZXJhY3RpbmcgYWZ0ZXIgc3RhcnQgbWV0aG9kJylcbiAgdC5lcXVhbChzaWduYWxBcmcuaW50ZXJhY3Rpb24sIGludGVyYWN0aW9uLCAnaW50ZXJhY3Rpb24gaW4gc2lnbmFsIGFyZycpXG4gIHQuZXF1YWwoc2lnbmFsQXJnLmV2ZW50LCBldmVudCwgJ2V2ZW50IChpbnRlcmFjdGlvbi5kb3duRXZlbnQpIGluIHNpZ25hbCBhcmcnKVxuXG4gIGludGVyYWN0aW9uLl9pbnRlcmFjdGluZyA9IGZhbHNlXG5cbiAgLy8gaW50ZXJhY3Rpb24uc3RhcnQoYWN0aW9uLCB0YXJnZXQsIGVsZW1lbnQpXG4gIC8vIHQuZGVlcEVxdWFsKHNjb3BlLmludGVyYWN0aW9ucy5saXN0LCBbaW50ZXJhY3Rpb25dLCAnaW50ZXJhY3Rpb24gaXMgYWRkZWQgYmFjayB0byBzY29wZScpXG5cbiAgdC5lbmQoKVxufSlcblxudGVzdCgnc3RvcCBpbnRlcmFjdGlvbiBmcm9tIHN0YXJ0IGV2ZW50JywgdCA9PiB7XG4gIGNvbnN0IHtcbiAgICBpbnRlcmFjdGlvbixcbiAgICBpbnRlcmFjdGFibGUsXG4gICAgdGFyZ2V0LFxuICB9ID0gaGVscGVycy50ZXN0RW52KHsgcGx1Z2luczogW2RyYWcsIGF1dG9TdGFydF0gfSlcblxuICBsZXQgc3RvcHBlZEJlZm9yZVN0YXJ0RmlyZWRcblxuICBpbnRlcmFjdGFibGUub24oJ2RyYWdzdGFydCcsIGV2ZW50ID0+IHtcbiAgICBzdG9wcGVkQmVmb3JlU3RhcnRGaXJlZCA9IGludGVyYWN0aW9uLl9zdG9wcGVkXG5cbiAgICBldmVudC5pbnRlcmFjdGlvbi5zdG9wKClcbiAgfSlcblxuICBpbnRlcmFjdGlvbi5zdGFydCh7IG5hbWU6ICdkcmFnJyB9LCBpbnRlcmFjdGFibGUsIHRhcmdldCBhcyBIVE1MRWxlbWVudClcblxuICB0Lm5vdE9rKHN0b3BwZWRCZWZvcmVTdGFydEZpcmVkLCAnIWludGVyYWN0aW9uLl9zdG9wcGVkIGluIHN0YXJ0IGxpc3RlbmVyJylcbiAgdC5ub3RPayhpbnRlcmFjdGlvbi5pbnRlcmFjdGluZygpLCAnaW50ZXJhY3Rpb24gY2FuIGJlIHN0b3BwZWQgZnJvbSBzdGFydCBldmVudCBsaXN0ZW5lcicpXG4gIHQub2soaW50ZXJhY3Rpb24uX3N0b3BwZWQsICdpbnRlcmFjdGlvbi5fc3RvcHBlZCBhZnRlciBzdG9wKCkgaW4gc3RhcnQgbGlzdGVuZXInKVxuXG4gIHQuZW5kKClcbn0pXG5cbnRlc3QoJ0ludGVyYWN0aW9uIGNyZWF0ZVByZXBhcmVkRXZlbnQnLCB0ID0+IHtcbiAgY29uc3Qgc2NvcGUgPSBoZWxwZXJzLm1vY2tTY29wZSgpXG5cbiAgY29uc3QgaW50ZXJhY3Rpb24gPSBzY29wZS5pbnRlcmFjdGlvbnMubmV3KHt9KVxuICBjb25zdCBpbnRlcmFjdGFibGUgPSBoZWxwZXJzLm1vY2tJbnRlcmFjdGFibGUoKVxuICBjb25zdCBhY3Rpb24gPSB7IG5hbWU6ICdyZXNpemUnIH1cbiAgY29uc3QgcGhhc2UgPSAnVEVTVF9QSEFTRSdcblxuICBpbnRlcmFjdGlvbi5wcmVwYXJlZCA9IGFjdGlvblxuICBpbnRlcmFjdGlvbi5pbnRlcmFjdGFibGUgPSBpbnRlcmFjdGFibGVcbiAgaW50ZXJhY3Rpb24uZWxlbWVudCA9IGludGVyYWN0YWJsZS5lbGVtZW50XG4gIGludGVyYWN0aW9uLnByZXZFdmVudCA9IHsgcGFnZToge30sIGNsaWVudDoge30sIHZlbG9jaXR5OiB7fSB9XG5cbiAgY29uc3QgaUV2ZW50ID0gaW50ZXJhY3Rpb24uX2NyZWF0ZVByZXBhcmVkRXZlbnQoe30sIHBoYXNlKVxuXG4gIHQub2soaUV2ZW50IGluc3RhbmNlb2YgSW50ZXJhY3RFdmVudCxcbiAgICAnSW50ZXJhY3RFdmVudCBpcyBmaXJlZCcpXG5cbiAgdC5lcXVhbChpRXZlbnQudHlwZSwgYWN0aW9uLm5hbWUgKyBwaGFzZSxcbiAgICAnZXZlbnQgdHlwZScpXG5cbiAgdC5lcXVhbChpRXZlbnQuaW50ZXJhY3RhYmxlLCBpbnRlcmFjdGFibGUsXG4gICAgJ2V2ZW50LmludGVyYWN0YWJsZScpXG5cbiAgdC5lcXVhbChpRXZlbnQudGFyZ2V0LCBpbnRlcmFjdGFibGUuZWxlbWVudCxcbiAgICAnZXZlbnQudGFyZ2V0JylcblxuICB0LmVuZCgpXG59KVxuXG50ZXN0KCdJbnRlcmFjdGlvbiBmaXJlRXZlbnQnLCB0ID0+IHtcbiAgY29uc3QgaW50ZXJhY3Rpb24gPSBuZXcgSW50ZXJhY3Rpb24oeyBzaWduYWxzOiBoZWxwZXJzLm1vY2tTaWduYWxzKCkgfSlcbiAgY29uc3QgaW50ZXJhY3RhYmxlID0gaGVscGVycy5tb2NrSW50ZXJhY3RhYmxlKClcbiAgY29uc3QgaUV2ZW50ID0ge30gYXMgSW50ZXJhY3QuSW50ZXJhY3RFdmVudFxuICBsZXQgZmlyZWRFdmVudFxuXG4gIC8vIHRoaXMgbWV0aG9kIHNob3VsZCBiZSBjYWxsZWQgZnJvbSBhY3Rpb25zLmZpcmVQcmVwYXJlZFxuICBpbnRlcmFjdGFibGUuZmlyZSA9IGV2ZW50ID0+IHtcbiAgICBmaXJlZEV2ZW50ID0gZXZlbnRcbiAgfVxuXG4gIGludGVyYWN0aW9uLmludGVyYWN0YWJsZSA9IGludGVyYWN0YWJsZVxuICBpbnRlcmFjdGlvbi5fZmlyZUV2ZW50KGlFdmVudClcblxuICB0LmVxdWFsKGZpcmVkRXZlbnQsIGlFdmVudCxcbiAgICAndGFyZ2V0IGludGVyYWN0YWJsZVxcJ3MgZmlyZSBtZXRob2QgaXMgY2FsbGVkJylcblxuICB0LmVxdWFsKGludGVyYWN0aW9uLnByZXZFdmVudCwgaUV2ZW50LFxuICAgICdpbnRlcmFjdGlvbi5wcmV2RXZlbnQgaXMgdXBkYXRlZCcpXG5cbiAgdC5lbmQoKVxufSlcbiJdfQ==