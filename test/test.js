var eventTypes = {
        click: 'MouseEvents',
        dbclick: 'MouseEvents',
        mousedown: 'MouseEvents',
        mousemove: 'MouseEvents',
        mouseover: 'MouseEvents',
        mouseout: 'MouseEvents',
        mouseleave: 'MouseEvents',
        mouseenter: 'MouseEvents',
        mouseup: 'MouseEvents',
    
        touchstart: 'TouchEvents',
        touchmove: 'TouchEvents',
        touchend: 'TouchEvents',
    
        keydown: 'KeyboardEvents',
        keyup: 'KeyboardEvents',
        keypress: 'KeyboardEvents',
    
        change: 'Events',
        focus: 'Events',
        focusin: 'Events',
        focusout: 'Events',
        select: 'Events'
    },
    div0 = document.createElement('div'),
    div1 = document.createElement('div'),
    div2 = document.createElement('div');
    
    div0.id = 'div0';
    div0.style.cssText = [
            'position: absolute;',
            'top: 0;',
            'left: 0;',
            'width: 50px;',
            'height: 50px;',
            'margin: 0;',
            'padding: 0;',
            'border: none;'
        ].join('\n');

// Dispatch event to this element
function simulate(eventType, eventProps) {
    var event;
    
    if (!eventProps) {
        eventProps = {};
    }
    
    if (eventTypes[eventType] === 'MouseEvents') {
        event = document.createEvent('MouseEvents');
        event.initMouseEvent(eventType, true, false, window, 0,
            eventProps.screenX || 0,
            eventProps.screenY || 0,
            eventProps.clientX || 0,
            eventProps.clientY || 0,
            eventProps.ctrlKey || false,
            eventProps.altKey  || false,
            eventProps.shiftKey|| false,
            eventProps.metaKey || false,
            eventProps.button  || 0,
            this);

    } else if (eventTypes[eventType] === 'KeyboardEvents') {
        event.initKeyboardEvent(eventType, eventProps.canBubble, eventProps.cancelable, window,
            eventProps.charArg, eventProps.keyArg, eventProps.locationArg, eventProps.modifiersList,
            eventProps.repeat, eventProps.localeArg);
    } else {
        event = document.createEvent(eventTypes[eventType]);
        event.initEvent(eventProps.type, eventProps.canBubble, eventProps.cancelable);
    }
    
    return this.dispatchEvent(event);
}

document.simulate = div0.simulate = simulate;

test('Interactable', function () {
    var interactable,
        expectedDrag = true,
        expectedResize = true,
        expectedGesture = true,
        expectedAutoScroll = false,
        expectedClassName = 'interactable interact-draggable interact-resizeable interact-gestureable' ,
        interactables,
        expectedActionChecker = interact.debug().defaultActionChecker;
    
    interact(div0).set({
            draggable: expectedDrag,
            resizeable: expectedResize,
            gestureable: expectedGesture,
            autoScroll: expectedAutoScroll
        });
    interactables = interact.debug().interactables;
    interactable = interact(div0);
    
    equal(interactable, interactables[0], 'interact(element) returns correct object');
    equal(interactable.element(), div0);
    equal(interactable.draggable(), expectedDrag, 'Drag option');
    equal(interactable.resizeable(), expectedResize, 'Resize option');
    equal(interactable.gestureable(), expectedGesture, 'Gesture option');
    equal(interactable.autoScroll(), expectedAutoScroll, 'AutoScroll option');
    equal(interactable.actionChecker(), expectedActionChecker, 'Action checker');
    equal(div0.className, expectedClassName, 'Element classes added correctly');
    
    interact(div0).unset()(div0);
    interactables = interact.debug().interactables;
    interactable = interact(div0);
    
    equal(interactables.length, 1, 'interactable reset - number of interactables does not change');
    equal(interactable.draggable(), expectedDrag = false, 'Drag option set to default');
    equal(interactable.resizeable(), expectedResize = false, 'Resize option set to default');
    equal(interactable.gestureable(), expectedGesture = false, 'Gesture option set to default');
    equal(interactable.autoScroll(), expectedAutoScroll = true, 'AutoScroll option set to default');
    equal(interactable.actionChecker(), expectedActionChecker, 'Gesture option set to default');
    
    interact(div1);
    interactables = interact.debug().interactables;
    equal(interactables.length, 2, 'Second interactable added correctly');
    
});

test('interact.unset', function () {
    var expectedClassName = '';

    interact(div0).set();
    interact(div1).set();
    interact(div2).set();
    interact(div0).unset();
    
    interactables = interact.debug().interactables;
    
    equal(interactables.length, 2, 'Element is removed from list');
    equal(interactables[0].element(), div1, 'interactable is spliced from array correctly');
    equal(div0.className, expectedClassName, 'Element classes are removed correctly');
    equal(interact.isSet(div0), false, 'unset element no longer recognised as an interactable');
});

//test('defaultActionChecker', function () {

module('interact drag');

test('drag start', function() {
var debug = interact.debug(),
    expectedX0 = 0,
    expectedY0 = 0,
    expectedDx = 50,
    expectedDy = 100,
    mouseDownEvent = {
        target: div0,
        currentTarget: document,
        preventDefault: function () {},
        stopPropagation: function () {},
        pageX: 0,
        pageY: 0
    },
    moveEvent = {
        target: div0,
        currentTarget: document,
        preventDefault: function () {},
        pageX: expectedDx,
        pageY: expectedDy
    },
    mouseUpEvent = {
        target: div0,
        currentTarget: document,
        preventDefault: function () {},
        pageX: expectedDx,
        pageY: expectedDy
    };
    
    var listener = function (event) {
        var debug = interact.debug();
        
        equal(event.type, 'dragstart', 'Event type');
        equal(interact.debug().target.element(), div0, 'interact\'s target element');
        equal(event.target, div0, 'Event is targeting the element correctly');
        equal(debug.x0, expectedX0);
        equal(debug.y0, expectedY0);
        equal(event.x0, expectedX0, 'Starting x coordinate of event');
        equal(event.y0, expectedY0, 'Starting y coordinate of event');
        equal(event.dx, expectedDx, 'Distance moved in x-axis of event');
        equal(event.dy, expectedDy, 'Distance moved in y-axis of event');
    };
    
    document.body.appendChild(div0);
    interact(div0).set({
            draggable: true,
            actionChecker: function () {
                return 'drag';
            }
        });
    
    expect(9);
    
    interact(div0).bind('dragstart', listener);
    interact(div0).bind('dragmove', listener);
    
    debug.mouseDown.call(div0, mouseDownEvent);
    debug.dragMove.call(div0, moveEvent);
    debug.mouseUp.call(div0, mouseUpEvent);
    
    interact(div0).unbind('dragstart', listener);
    interact(div0).unbind('dragmove', listener);
});

test('drag move', function() {
var debug = interact.debug(),
    expectedX0 = 0,
    expectedY0 = 0,
    expectedDx = 50,
    expectedDy = 100,
    mouseDownEvent = {
        target: div0,
        currentTarget: document,
        preventDefault: function () {},
        stopPropagation: function () {},
        pageX: 0,
        pageY: 0
    },
    moveEvent = {
        preventDefault: function () {},
        pageX: expectedDx,
        pageY: expectedDy
    },
    mouseUpEvent = {
        preventDefault: function () {},
        pageX: expectedDx,
        pageY: expectedDy
    };
    
    var listener = function (event) {
        var debug = interact.debug();
        
        equal(event.type, 'dragmove', 'Event type');
        equal(event.target, div0, 'Event target element');
        equal(debug.x0, expectedX0);
        equal(debug.y0, expectedY0);
        equal(event.x0, expectedX0, 'Starting x coordinate of event');
        equal(event.y0, expectedY0, 'Starting y coordinate of event');
        equal(event.dx, expectedDx, 'Distance moved in x-axis of event');
        equal(event.dy, expectedDy, 'Distance moved in y-axis of event');
    };
    
    document.body.appendChild(div0);
    interact(div0).set({
            draggable: true,
            actionChecker: function () {
                return 'drag';
            }
        });
    
    interact(div0).bind('dragmove', listener);
    
    expect(8);
    
    debug.mouseDown.call(div0, mouseDownEvent);
    debug.dragMove.call(div0, mouseDownEvent);
    debug.dragMove.call(div0, moveEvent);
    debug.mouseUp.call(div0, mouseUpEvent);
    
    interact(div0).unbind('dragmove', listener);
});

test('drag end', function() {
var debug = interact.debug(),
    expectedX0 = 0,
    expectedY0 = 0,
    expectedDx = 50,
    expectedDy = 100,
    mouseDownEvent = {
        target: div0,
        currentTarget: document,
        preventDefault: function () {},
        stopPropagation: function () {},
        pageX: 0,
        pageY: 0
    },
    moveEvent0 = {
        preventDefault: function () {},
        pageX: 0,
        pageY: 0
    },
    moveEvent1 = {
        preventDefault: function () {},
        pageX: expectedDx / 3,
        pageY: expectedDy * 2
    },
    moveEvent2 = {
        preventDefault: function () {},
        pageX: expectedDx,
        pageY: expectedDy
    },
    mouseUpEvent = {
        preventDefault: function () {},
        pageX: expectedDx,
        pageY: expectedDy
    };
    
    var listener = function (event) {
        var debug = interact.debug();
        
        equal(event.type, 'dragend', 'Event type');
        equal(event.target, div0, 'Event target element');
        equal(debug.x0, expectedX0);
        equal(debug.y0, expectedY0);
        equal(event.x0, expectedX0, 'Starting x coordinate of event');
        equal(event.y0, expectedY0, 'Starting y coordinate of event');
        equal(event.dx, expectedDx, 'Distance moved in x-axis of event');
        equal(event.dy, expectedDy, 'Distance moved in y-axis of event');
    };
    
    document.body.appendChild(div0);
    interact(div0).set({
            draggable: true,
            actionChecker: function () {
                return 'drag';
            }
        });
    
    interact(div0).bind('dragend', listener);
    
    expect(8);
    
    debug.mouseDown.call(div0, mouseDownEvent);
    debug.dragMove.call(div0, moveEvent0);
    debug.dragMove.call(div0, moveEvent1);
    debug.dragMove.call(div0, moveEvent2);
    debug.mouseUp.call(div0, mouseUpEvent);
    
    interact(div0).unbind('dragend', listener);
});


module('interact resize');

test('resize start', function() {
var debug = interact.debug(),
    expectedX0 = 0,
    expectedY0 = 0,
    expectedDx = 50,
    expectedDy = 100,
    mouseDownEvent = {
        target: div0,
        currentTarget: document,
        preventDefault: function () {},
        stopPropagation: function () {},
        pageX: expectedX0,
        pageY: expectedY0
    },
    moveEvent = {
        target: div0,
        currentTarget: document,
        preventDefault: function () {},
        pageX: expectedX0 + expectedDx,
        pageY: expectedY0 + expectedDy
    },
    mouseUpEvent = {
        target: div0,
        currentTarget: document,
        preventDefault: function () {},
        pageX: expectedX0 + expectedDx,
        pageY: expectedY0 + expectedDy
    };
    
    var listener = function (event) {
        var debug = interact.debug();
        
        equal(event.type, 'resizestart', 'Event type');
        equal(interact.debug().target.element(), div0, 'interact\'s target element');
        equal(event.target, div0, 'Event target element');
        equal(debug.x0, expectedX0);
        equal(debug.y0, expectedY0);
        equal(event.x0, expectedX0, 'Starting x coordinate of event');
        equal(event.y0, expectedY0, 'Starting y coordinate of event');
        equal(event.dx, expectedDx, 'Distance moved in x-axis of event');
        equal(event.dy, expectedDy, 'Distance moved in y-axis of event');
    };
    
    document.body.appendChild(div0);
    interact(div0).set({
            resizeable: true,
            actionChecker: function () {
                return 'resize';
            }
        });
    
    expect(9);
    
    interact(div0).bind('resizestart', listener);
    interact(div0).bind('resizemove', listener);
    
    debug.mouseDown.call(div0, mouseDownEvent);
    debug.resizeMove.call(div0, moveEvent);
    debug.mouseUp.call(div0, mouseUpEvent);
    
    interact(div0).unbind('resizestart', listener);
    interact(div0).unbind('resizemove', listener);
});

test('resize move', function() {
var debug = interact.debug(),
    expectedX0 = 0,
    expectedY0 = 0,
    expectedDx = 50,
    expectedDy = 100,
    mouseDownEvent = {
        target: div0,
        currentTarget: document,
        preventDefault: function () {},
        stopPropagation: function () {},
        pageX: 0,
        pageY: 0
    },
    moveEvent = {
        preventDefault: function () {},
        pageX: expectedDx,
        pageY: expectedDy
    },
    mouseUpEvent = {
        preventDefault: function () {},
        pageX: expectedDx,
        pageY: expectedDy
    };
    
    var listener = function (event) {
        var debug = interact.debug();
        
        equal(event.type, 'resizemove', 'Event type');
        equal(event.target, div0, 'Event target element');
        equal(debug.x0, expectedX0);
        equal(debug.y0, expectedY0);
        equal(event.x0, expectedX0, 'Starting x coordinate of event');
        equal(event.y0, expectedY0, 'Starting y coordinate of event');
        equal(event.dx, expectedDx, 'Distance moved in x-axis of event');
        equal(event.dy, expectedDy, 'Distance moved in y-axis of event');
    };
    
    document.body.appendChild(div0);
    interact(div0).set({
            resizeable: true,
            actionChecker: function () {
                return 'resize';
            }
        });
    
    interact(div0).bind('resizemove', listener);
    
    expect(8);
    
    debug.mouseDown.call(div0, mouseDownEvent);
    debug.resizeMove.call(div0, mouseDownEvent);
    debug.resizeMove.call(div0, moveEvent);
    debug.mouseUp.call(div0, mouseUpEvent);
    
    interact(div0).unbind('resizemove', listener);
});

test('resize end', function() {
var debug = interact.debug(),
    expectedX0 = 0,
    expectedY0 = 0,
    expectedDx = 50,
    expectedDy = 100,
    mouseDownEvent = {
        target: div0,
        currentTarget: document,
        preventDefault: function () {},
        stopPropagation: function () {},
        pageX: 0,
        pageY: 0
    },
    moveEvent0 = {
        preventDefault: function () {},
        pageX: 0,
        pageY: 0
    },
    moveEvent1 = {
        preventDefault: function () {},
        pageX: expectedDx / 3,
        pageY: expectedDy * 2
    },
    moveEvent2 = {
        preventDefault: function () {},
        pageX: expectedDx,
        pageY: expectedDy
    },
    mouseUpEvent = {
        preventDefault: function () {},
        pageX: expectedDx,
        pageY: expectedDy
    };
    
    var listener = function (event) {
        var debug = interact.debug();
        
        equal(event.type, 'resizeend', 'Event type');
        equal(event.target, div0, 'Event target element');
        equal(debug.x0, expectedX0);
        equal(debug.y0, expectedY0);
        equal(event.x0, expectedX0, 'Starting x coordinate of event');
        equal(event.y0, expectedY0, 'Starting y coordinate of event');
        equal(event.dx, expectedDx, 'Distance moved in x-axis of event');
        equal(event.dy, expectedDy, 'Distance moved in x-axis of event');
    };
    
    document.body.appendChild(div0);
    interact(div0).set({
            resizeable: true,
            actionChecker: function () {
                return 'resize';
            }
        });
    
    interact(div0).bind('resizeend', listener);
    
    expect(8);
    
    debug.mouseDown.call(div0, mouseDownEvent);
    debug.resizeMove.call(div0, moveEvent0);
    debug.resizeMove.call(div0, moveEvent1);
    debug.resizeMove.call(div0, moveEvent2);
    debug.mouseUp.call(div0, mouseUpEvent);
    
    interact(div0).unbind('resizeend', listener);
});


module('interact gesture');

test('gesture start', function() {
var debug = interact.debug(),
    expectedX0 = 0,
    expectedY0 = 0,
    expectedDx = 50,
    expectedDy = 100,
    touchStartEvent = {
        target: div0,
        currentTarget: document,
        preventDefault: function () {},
        stopPropagation: function () {},
        touches: [
            {
                pageX: expectedX0 + 10,
                pageY: expectedY0 + 10
            },
            {
                pageX: expectedX0 - 10,
                pageY: expectedY0 - 10
            }
        ]
    },
    moveEvent = {
        target: div0,
        currentTarget: document,
        preventDefault: function () {},
        touches: [
            {
                pageX: 0,
                pageY: 0
            },
            {
                pageX: expectedDx * 2,
                pageY: expectedDy * 2
            }
        ]
    },
    mouseUpEvent = moveEvent;
    
    var listener = function (event) {
        var debug = interact.debug();
        
        equal(event.type, 'gesturestart', 'Event type');
        equal(interact.debug().target.element(), div0, 'interact\'s target element');
        equal(event.target, div0, 'Event target element');
        equal(debug.x0, expectedX0);
        equal(debug.y0, expectedY0);
        equal(event.x0, expectedX0, 'Starting x coordinate of event');
        equal(event.y0, expectedY0, 'Starting y coordinate of event');
        equal(event.dx, expectedDx, 'Distance moved in x-axis of event');
        equal(event.dy, expectedDy, 'Distance moved in y-axis of event');
    };
    
    document.body.appendChild(div0);
    interact(div0).set({
            gestureable: true,
            actionChecker: function () {
                return 'gesture';
            }
        });
    
    expect(9);
    
    interact(div0).bind('gesturestart', listener);
    interact(div0).bind('gesturemove', listener);
    
    debug.mouseDown.call(div0, touchStartEvent);
    debug.gestureMove.call(div0, moveEvent);
    debug.mouseUp.call(div0, mouseUpEvent);
    
    interact(div0).unbind('gesturestart', listener);
    interact(div0).unbind('gesturemove', listener);
});

test('gesture move', function() {
var debug = interact.debug(),
    expectedX0 = 0,
    expectedY0 = 0,
    expectedDx = 300,
    expectedDy = 400,
    
    // offset from average
    offset = [20, -20, -10, 10],
    
    d1 = offset[0] - offset[1],
    d2 = offset[2] - offset[3],
    
    startDistance = Math.sqrt(2 * d1 * d1),
    expectedDistance = Math.sqrt(2 * d2 * d2),
    startAngle = -Math.atan(d1 / d1),
    expectedAngle = -Math.atan(d2 / d2),
    expectedRotation = expectedAngle - startAngle,
    touchStartEvent = {
        target: div0,
        currentTarget: document,
        preventDefault: function () {},
        stopPropagation: function () {},
        touches: [
            {
                pageX: expectedX0 + offset[0],
                pageY: expectedX0 + offset[0]
            },
            {
                pageX: expectedY0 + offset[1],
                pageY: expectedY0 + offset[1]
            }
        ]
    },
    moveEvent0 = {
        target: div0,
        currentTarget: document,
        preventDefault: function () {},
        touches: [
            {
                pageX: expectedX0 + offset[0],
                pageY: expectedY0 + offset[0]
            },
            {
                pageX: expectedX0 + offset[1],
                pageY: expectedY0 + offset[1]
            }
        ]
    },
    moveEvent1 = {
        target: div0,
        currentTarget: document,
        preventDefault: function () {},
        touches: [
            {
                pageX: expectedDx + offset[2],
                pageY: expectedDy + offset[2]
            },
            {
                pageX: expectedDx + offset[3],
                pageY: expectedDy + offset[3]
            }
        ]
    },
    mouseUpEvent = moveEvent1;

    if (expectedRotation > Math.PI) {
        expectedRotation -= 2 * Math.PI;
    }else if (expectedRotation < -Math.PI) {
        expectedRotation += 2 * Math.PI;
    }
    // Convert to degrees from radians
    expectedAngle = 180 * expectedAngle / Math.PI;
    expectedRotation = 180 * expectedRotation / Math.PI;
    
    var listener = function (event) {
        var debug = interact.debug();
        
        equal(event.type, 'gesturemove', 'Event type');
        equal(event.target, div0, 'Event target element');
        equal(debug.x0, expectedX0);
        equal(debug.y0, expectedY0);
        equal(event.x0, expectedX0, 'Starting x coordinate of event');
        equal(event.y0, expectedY0, 'Starting y coordinate of event');
        equal(event.dx, expectedDx, 'Distance moved in x-axis of event');
        equal(event.dy, expectedDy, 'Distance moved in y-axis of event');
        equal(event.distance, expectedDistance, 'Gesture distance');
        equal(event.angle, expectedAngle, 'Gesture angle');
        equal(event.rotation, expectedRotation, 'Gesture rotation');
    };
    
    document.body.appendChild(div0);
    interact(div0).set({
            gestureable: true,
            actionChecker: function () {
                return 'gesture';
            }
        });
    
    interact(div0).bind('gesturemove', listener);
    
    debug.mouseDown.call(div0, touchStartEvent);
    debug.gestureMove.call(div0, moveEvent0);
    debug.gestureMove.call(div0, moveEvent1);
    debug.mouseUp.call(div0, mouseUpEvent);
    
    interact(div0).unbind('gesturemove', listener);
});

test('gesture end', function() {
var debug = interact.debug(),
    expectedX0 = 0,
    expectedY0 = 0,
    expectedDx = 89,
    expectedDy = 63,
    touchStartEvent = {
        target: div0,
        currentTarget: document,
        preventDefault: function () {},
        stopPropagation: function () {},
        touches: [
            {
                pageX: 0,
                pageY: 0
            },
            {
                pageX: 0,
                pageY: 0
            }
        ]
    },
    moveEvent0 = {
        target: div0,
        currentTarget: document,
        preventDefault: function () {},
        touches: [
            {
                pageX: 102,
                pageY: 564
            },
            {
                pageX: 41,
                pageY: 2
            }
        ]
    },
    moveEvent1 = {
        target: div0,
        currentTarget: document,
        preventDefault: function () {},
        touches: [
            {
                pageX: expectedDx,
                pageY: expectedDy
            },
            {
                pageX: expectedDx,
                pageY: expectedDy
            }
        ]
    },
    mouseUpEvent = moveEvent1;
    
    var listener = function (event) {
        var debug = interact.debug();
        
        equal(event.type, 'gestureend', 'Event type');
        equal(event.target, div0, 'Event target element');
        equal(debug.x0, expectedX0);
        equal(debug.y0, expectedY0);
        equal(event.x0, expectedX0, 'Starting x coordinate of event');
        equal(event.y0, expectedY0, 'Starting y coordinate of event');
        equal(event.dx, expectedDx, 'Distance moved in x-axis of event');
        equal(event.dy, expectedDy, 'Distance moved in y-axis of event');
    };
    
    document.body.appendChild(div0);
    interact(div0).set({
            gestureable: true,
            actionChecker: function () {
                return 'gesture';
            }
        });
    
    interact(div0).bind('gestureend', listener);
    
    expect(8);
    
    debug.mouseDown.call(div0, touchStartEvent);
    debug.gestureMove.call(div0, moveEvent0);
    debug.gestureMove.call(div0, moveEvent1);
    debug.mouseUp.call(div0, mouseUpEvent);
    
    interact(div0).unbind('gestureend', listener);
});

