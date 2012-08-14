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

module('interact functions');

test('interact.set', function() {
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

test('interact.unset', function() {
    var interactObject,
        interactDebug,
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

module('interact drag');

// Dispatch event to this element
function simulate(eventType, eventProps) {
	var event;
	
	if (eventTypes[eventType] === 'MouseEvents') {
		event = document.createEvent('MouseEvents');
		event.initMouseEvent(eventType, true, false, window, 0,
		    eventProps.screenX || 0,
			eventProps.screenY || 0,
			eventProps.clientX || 0,
			eventProps.clientY || 0,
			eventProps.ctrlKey || false,
			eventProps.altKey || false,
			eventProps.shiftKey || false,
			eventProps.metaKey || false,
			eventProps.button || 0,
			this);

	} else if (eventTypes[eventType] === 'KeyboardEvents') {
	    event.initKeyboardEvent(eventType, eventProps.canBubble, eventProps.cancelable, window,
		    eventProps.charArg, eventProps.keyArg, eventProps.locationArg, eventProps.modifiersList,
    	    eventProps.repeat, eventProps.localeArg);
	} else {
		event = document.createEvent(eventTypes[eventType]);
		event.initEvent(eventProps.type, eventProps.canBubble, eventProps.cancelable);
	}
	
	return this.dispatch(event);
}
        

