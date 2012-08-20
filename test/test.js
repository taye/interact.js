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

test('interact.set', function () {
    var interactObject,
        expectedDrag = true,
        expectedResize = true,
        expectedGesture = true,
        expectedAutoScroll = false,
        expectedClassName = 'interact-node interact-draggable interact-resizeable interact-gestureable' ,
        nodes,
        expectedActionChecker = interact.debug().defaultActionChecker;
    
    interact.set(div0, {
            drag: expectedDrag,
            resize: expectedResize,
            gesture: expectedGesture,
            autoScroll: expectedAutoScroll
        });
    nodes = interact.debug().nodes;
    interactObject = interact(div0);
    
    equal(interactObject, nodes[0], 'interact(element) returns correct object');
    equal(interactObject.element, div0);
    equal(interactObject.drag, expectedDrag, 'Drag option set correctly');
    equal(interactObject.resize, expectedResize, 'Resize option set correctly');
    equal(interactObject.gesture, expectedGesture, 'Gesture option set correctly');
    equal(interactObject.autoScroll, expectedAutoScroll, 'AutoScroll option set correctly');
    equal(interactObject.actionChecker, expectedActionChecker, 'Gesture option set correctly');
    equal(div0.className, expectedClassName, 'Element classes added correctly');
    
    interact.set(div0);
    nodes = interact.debug().nodes;
    interactObject = interact(div0);
    
    equal(nodes.length, 1, 'Node reset - number of nodes does not change');
    equal(interactObject.drag, expectedDrag = false, 'Drag option set to default');
    equal(interactObject.resize, expectedResize = false, 'Resize option set to default');
    equal(interactObject.gesture, expectedGesture = false, 'Gesture option set to default');
    equal(interactObject.autoScroll, expectedAutoScroll = true, 'AutoScroll option set to default');
    equal(interactObject.actionChecker, expectedActionChecker, 'Gesture option set to default');
    
    interact.set(div1);
    nodes = interact.debug().nodes;
    equal(nodes.length, 2, 'Second node added correctly');
    
});

test('interact.unset', function () {
    var interactObject,
        expectedClassName = '';

    interact.set(div0);
    interact.set(div1);
    interact.set(div2);
    interact.unset(div0);
    
    nodes = interact.debug().nodes;
    interactObject = interact(div0);
    
    equal(nodes.length, 2, 'Element is removed from list');
    equal(nodes[0].element, div1, 'node is spliced from array correctly');
    equal(div0.className, expectedClassName, 'Element classes are removed correctly');
    equal(interact(div0), undefined, 'unset element no longer recognised as an interactable');
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
        
        equal(event.type, 'interactdragstart', 'Event type');
        equal(interact.debug().target.element, div0, 'interact\'s target element');
        equal(event.target, div0, 'Event is targeting the element correctly');
        equal(debug.x0, expectedX0);
        equal(debug.y0, expectedY0);
        equal(event.detail.x0, expectedX0, 'Starting x coordinate of event detail');
        equal(event.detail.y0, expectedY0, 'Starting x coordinate of event detail');
        equal(event.detail.dx, expectedDx, 'Distance moved in x coordinate of event detail');
        equal(event.detail.dy, expectedDy, 'Distance moved in x coordinate of event detail');
    };
    
    document.body.appendChild(div0);
    interact.set(div0, {
            drag: true,
            actionChecker: function () {
                return 'drag';
            }
        });
    
    expect(9);
    
    div0.addEventListener('interactdragstart', listener);
    div0.addEventListener('interactdragmove', listener);
    
    debug.mouseDown(mouseDownEvent);
    debug.dragMove(moveEvent);
    debug.mouseUp(mouseUpEvent);
    
    div0.removeEventListener('interactdragstart', listener);
    div0.removeEventListener('interactdragmove', listener);
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
        
        equal(event.type, 'interactdragmove', 'Event type');
        equal(event.target, div0, 'Event target element');
        equal(debug.x0, expectedX0);
        equal(debug.y0, expectedY0);
        equal(event.detail.x0, expectedX0, 'Starting x coordinate of event detail');
        equal(event.detail.y0, expectedY0, 'Starting x coordinate of event detail');
        equal(event.detail.dx, expectedDx, 'Distance moved in x coordinate of event detail');
        equal(event.detail.dy, expectedDy, 'Distance moved in x coordinate of event detail');
    };
    
    document.body.appendChild(div0);
    interact.set(div0, {
            drag: true,
            actionChecker: function () {
                return 'drag';
            }
        });
    
    div0.addEventListener('interactdragmove', listener);
    
    expect(8);
    
    debug.mouseDown(mouseDownEvent);
    debug.dragMove(mouseDownEvent);
    debug.dragMove(moveEvent);
    debug.mouseUp(mouseUpEvent);
    
    div0.removeEventListener('interactdragmove', listener);
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
        
        equal(event.type, 'interactdragend', 'Event type');
        equal(event.target, div0, 'Event target element');
        equal(debug.x0, expectedX0);
        equal(debug.y0, expectedY0);
        equal(event.detail.x0, expectedX0, 'Starting x coordinate of event detail');
        equal(event.detail.y0, expectedY0, 'Starting x coordinate of event detail');
        equal(event.detail.dx, expectedDx, 'Distance moved in x coordinate of event detail');
        equal(event.detail.dy, expectedDy, 'Distance moved in x coordinate of event detail');
    };
    
    document.body.appendChild(div0);
    interact.set(div0, {
            drag: true,
            actionChecker: function () {
                return 'drag';
            }
        });
    
    div0.addEventListener('interactdragend', listener);
    
    expect(8);
    
    debug.mouseDown(mouseDownEvent);
    debug.dragMove(moveEvent0);
    debug.dragMove(moveEvent1);
    debug.dragMove(moveEvent2);
    debug.mouseUp(mouseUpEvent);
    
    div0.removeEventListener('interactdragend', listener);
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
        
        equal(event.type, 'interactresizestart', 'Event type');
        equal(interact.debug().target.element, div0, 'interact\'s target element');
        equal(event.target, div0, 'Event target element');
        equal(debug.x0, expectedX0);
        equal(debug.y0, expectedY0);
        equal(event.detail.x0, expectedX0, 'Starting x coordinate of event detail');
        equal(event.detail.y0, expectedY0, 'Starting x coordinate of event detail');
        equal(event.detail.dx, expectedDx, 'Distance moved in x coordinate of event detail');
        equal(event.detail.dy, expectedDy, 'Distance moved in x coordinate of event detail');
    };
    
    document.body.appendChild(div0);
    interact.set(div0, {
            resize: true,
            actionChecker: function () {
                return 'resize';
            }
        });
    
    expect(9);
    
    div0.addEventListener('interactresizestart', listener);
    div0.addEventListener('interactresizemove', listener);
    
    debug.mouseDown(mouseDownEvent);
    debug.resizeMove(moveEvent);
    debug.mouseUp(mouseUpEvent);
    
    div0.removeEventListener('interactresizestart', listener);
    div0.removeEventListener('interactresizemove', listener);
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
        
        equal(event.type, 'interactresizemove', 'Event type');
        equal(event.target, div0, 'Event target element');
        equal(debug.x0, expectedX0);
        equal(debug.y0, expectedY0);
        equal(event.detail.x0, expectedX0, 'Starting x coordinate of event detail');
        equal(event.detail.y0, expectedY0, 'Starting x coordinate of event detail');
        equal(event.detail.dx, expectedDx, 'Distance moved in x coordinate of event detail');
        equal(event.detail.dy, expectedDy, 'Distance moved in x coordinate of event detail');
    };
    
    document.body.appendChild(div0);
    interact.set(div0, {
            resize: true,
            actionChecker: function () {
                return 'resize';
            }
        });
    
    div0.addEventListener('interactresizemove', listener);
    
    expect(8);
    
    debug.mouseDown(mouseDownEvent);
    debug.resizeMove(mouseDownEvent);
    debug.resizeMove(moveEvent);
    debug.mouseUp(mouseUpEvent);
    
    div0.removeEventListener('interactresizemove', listener);
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
        
        equal(event.type, 'interactresizeend', 'Event type');
        equal(event.target, div0, 'Event target element');
        equal(debug.x0, expectedX0);
        equal(debug.y0, expectedY0);
        equal(event.detail.x0, expectedX0, 'Starting x coordinate of event detail');
        equal(event.detail.y0, expectedY0, 'Starting x coordinate of event detail');
        equal(event.detail.dx, expectedDx, 'Distance moved in x coordinate of event detail');
        equal(event.detail.dy, expectedDy, 'Distance moved in x coordinate of event detail');
    };
    
    document.body.appendChild(div0);
    interact.set(div0, {
            resize: true,
            actionChecker: function () {
                return 'resize';
            }
        });
    
    div0.addEventListener('interactresizeend', listener);
    
    expect(8);
    
    debug.mouseDown(mouseDownEvent);
    debug.resizeMove(moveEvent0);
    debug.resizeMove(moveEvent1);
    debug.resizeMove(moveEvent2);
    debug.mouseUp(mouseUpEvent);
    
    div0.removeEventListener('interactresizeend', listener);
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
    mouseUpEvent = {
        target: div0,
        currentTarget: document,
        preventDefault: function () {},
        pageX: expectedDx,
        pageY: expectedDy
    };
    
    var listener = function (event) {
        var debug = interact.debug();
        
        equal(event.type, 'interactgesturestart', 'Event type');
        equal(interact.debug().target.element, div0, 'interact\'s target element');
        equal(event.target, div0, 'Event target element');
        equal(debug.x0, expectedX0);
        equal(debug.y0, expectedY0);
        equal(event.detail.x0, expectedX0, 'Starting x coordinate of event detail');
        equal(event.detail.y0, expectedY0, 'Starting x coordinate of event detail');
        equal(event.detail.dx, expectedDx, 'Distance moved in x coordinate of event detail');
        equal(event.detail.dy, expectedDy, 'Distance moved in x coordinate of event detail');
    };
    
    document.body.appendChild(div0);
    interact.set(div0, {
            gesture: true,
            actionChecker: function () {
                return 'gesture';
            }
        });
    
    expect(9);
    
    div0.addEventListener('interactgesturestart', listener);
    div0.addEventListener('interactgesturemove', listener);
    
    debug.mouseDown(touchStartEvent);
    debug.gestureMove(moveEvent);
    debug.mouseUp(mouseUpEvent);
    
    div0.removeEventListener('interactgesturestart', listener);
    div0.removeEventListener('interactgesturemove', listener);
});

test('gesture move', function() {
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
                pageX: 0,
                pageY: 0
            },
            {
                pageX: 0,
                pageY: 0
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
    mouseUpEvent = {
        target: div0,
        currentTarget: document,
        preventDefault: function () {},
        pageX: expectedDx,
        pageY: expectedDy
    };
    
    var listener = function (event) {
        var debug = interact.debug();
        
        equal(event.type, 'interactgesturemove', 'Event type');
        equal(event.target, div0, 'Event target element');
        equal(debug.x0, expectedX0);
        equal(debug.y0, expectedY0);
        equal(event.detail.x0, expectedX0, 'Starting x coordinate of event detail');
        equal(event.detail.y0, expectedY0, 'Starting x coordinate of event detail');
        equal(event.detail.dx, expectedDx, 'Distance moved in x coordinate of event detail');
        equal(event.detail.dy, expectedDy, 'Distance moved in x coordinate of event detail');
    };
    
    document.body.appendChild(div0);
    interact.set(div0, {
            gesture: true,
            actionChecker: function () {
                return 'gesture';
            }
        });
    
    div0.addEventListener('interactgesturemove', listener);
    
    expect(8);
    
    debug.mouseDown(touchStartEvent);
    debug.gestureMove(moveEvent0);
    debug.gestureMove(moveEvent1);
    debug.mouseUp(mouseUpEvent);
    
    div0.removeEventListener('interactgesturemove', listener);
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
    mouseUpEvent = {
        target: div0,
        currentTarget: document,
        preventDefault: function () {},
        pageX: expectedDx,
        pageY: expectedDy
    };
    
    var listener = function (event) {
        var debug = interact.debug();
        
        equal(event.type, 'interactgestureend', 'Event type');
        equal(event.target, div0, 'Event target element');
        equal(debug.x0, expectedX0);
        equal(debug.y0, expectedY0);
        equal(event.detail.x0, expectedX0, 'Starting x coordinate of event detail');
        equal(event.detail.y0, expectedY0, 'Starting x coordinate of event detail');
        equal(event.detail.dx, expectedDx, 'Distance moved in x coordinate of event detail');
        equal(event.detail.dy, expectedDy, 'Distance moved in x coordinate of event detail');
    };
    
    document.body.appendChild(div0);
    interact.set(div0, {
            gesture: true,
            actionChecker: function () {
                return 'gesture';
            }
        });
    
    div0.addEventListener('interactgestureend', listener);
    
    expect(8);
    
    debug.mouseDown(touchStartEvent);
    debug.gestureMove(moveEvent0);
    debug.gestureMove(moveEvent1);
    debug.mouseUp(mouseUpEvent);
    
    div0.removeEventListener('interactgestureend', listener);
});

