// Taye Adeyemi
/**
 * @namespace interact.js module
 * @name interact
 */
window.interact = (function () {
	'use strict';

	var	prevX = 0,
		prevY = 0,
		x0 = 0,
		y0 = 0,
		interactNodes = [],
		nodeStyle,
		target = null,
		supportsTouch = 'createTouch' in document,
		mouseIsDown = false,
		dragHasStarted = false,
		resizeHasStarted = false,
		downEvent,
		upEvent,
		moveEvent,
		margin = supportsTouch ? 30 : 10,
		typeErr = new TypeError('Type Error'),
		docTarget = {
			element: document,
			events: []
		},
		/** interactNode events wrapper */
		events = {
			add: function (target, type, listener, useCapture) {
				if (target.events === undefined) {
					target.events = {};
				}
				if (target.events[type] === undefined) {
					target.events[type] = [];
				}
				target.events[type].push(listener);

				return target.element.addEventListener(type, listener, useCapture || false);
			},
			remove: function (target, type, listener, useCapture) {
				if (target && target.events && target.events[type]) {
					var i;

					if (listener === 'all') {
						for (i = 0; i < target.events[type].length; i++) {
							target.element.removeEventListener(type, target.events[type][i], useCapture || false);
							target.events[type].splice(i, 1);
						}
					}
					else {
						for (i = 0; i < target.events[type].length; i++) {
							if (target.events[type][i] === listener) {
								target.element.removeEventListener(type, target.events[type][i], useCapture || false);
								target.events[type].splice(i, 1);
							}
						}
					}
				}
			},
			removeAll: function (target) {
				for (var type in target.evetns) {
					if (target.events.hasOwnProperty(type)) {
						events.remove(target, type, 'all');
					}
				}
			}
		};

	/** Should change this so devices with mouse and touch can use both */
	if (supportsTouch) {
		downEvent = 'touchstart',
		upEvent = 'touchend',
		moveEvent = 'touchmove';
	}
	else {
		downEvent = 'mousedown',
		upEvent = 'mouseup',
		moveEvent = 'mousemove';
	}

	/**
	 * @private
	 * @event
	 */
	function xResize(event) {
		if (!resizeHasStarted) {

			/*
			 * @static
			 * @type MouseEvent
			 * @memberOf interact
			 * @description ...
			 */
			var resizeStart = document.createEvent('MouseEvents');

			resizeStart.initMouseEvent('interactresizestart', false, false, window,
				1, event.screenX, event.screenY, event.clientX, event.clientY,
				event.ctrlKey, event.altKey, event.shiftKey, event.metaKey,
				event.button, null);
			target.element.dispatchEvent(resizeStart);
			x0 = event.pageX;
			y0 = event.pageY;
			console.log('resizing on x axis');
			resizeHasStarted = true;
			addClass(target.element, 'interact-resize-target');
		}
		else {
			var resizeMove = document.createEvent('CustomEvent'),
				detail = {
					x0: x0,
					y0: y0,
					dx: event.pageX - x0,
					dy: 0,
					pageX: event.pageX,
					pageY: event.pageY
				};
			resizeMove.initCustomEvent('interactresizemove', false, false, detail);
			target.element.dispatchEvent(resizeMove);
		}
		event.preventDefault();
		if (mouseIsDown && target.resize) {
					var x = event.pageX,
			newWidth = ( event.pageX > target.x)? target.width + (x - prevX) : 0 ;

			addClass(target.element, 'interact-target');
			setSize(target, newWidth, target.height);
			prevX = x;
		}
	}


	/**
	 * @private
	 * @event
	 */
	function yResize(event) {
		if (!resizeHasStarted) {
			var resizeStart = document.createEvent('MouseEvents');

			resizeStart.initMouseEvent('interactresizestart', false, false, window,
				1, event.screenX, event.screenY, event.clientX, event.clientY,
				event.ctrlKey, event.altKey, event.shiftKey, event.metaKey,
				event.button, null);
			target.element.dispatchEvent(resizeStart);
			x0 = event.pageX;
			y0 = event.pageY;
			console.log('resizing on y axis');
			resizeHasStarted = true;
			addClass(target.element, 'interact-resize-target');
		}
		else {
			var resizeMove = document.createEvent('CustomEvent'),
				detail = {
					x0: x0,
					y0: y0,
					dx: 0,
					dy: event.pageY - y0,
					pageX: event.pageX,
					pageY: event.pageY
				};
			resizeMove.initCustomEvent('interactresizemove', false, false, detail);
			target.element.dispatchEvent(resizeMove);
		}
		event.preventDefault();
		if (mouseIsDown && target.resize) {
			addClass(target.element, 'interact-target');
			var y = event.pageY,
			newHeight = ( event.pageY > target.y)? target.height + (y - prevY) : 0 ;

			setSize(target, target.width, newHeight);
			prevY = y;
		}
	}


	/**
	 * @private
	 * @event
	 */
	function xyResize(event) {
		if (!resizeHasStarted) {
			var resizeStart = document.createEvent('MouseEvents');

			resizeStart.initMouseEvent('interactresizestart', false, false, window,
				1, event.screenX, event.screenY, event.clientX, event.clientY,
				event.ctrlKey, event.altKey, event.shiftKey, event.metaKey,
				event.button, null);
			target.element.dispatchEvent(resizeStart);
			x0 = event.pageX;
			y0 = event.pageY;
			console.log('resizing on x and y axes');
			resizeHasStarted = true;
			addClass(target.element, 'interact-resize-target');
		}
		else {
			var resizeMove = document.createEvent('CustomEvent'),
				detail = {
					x0: x0,
					y0: y0,
					dx: event.pageX - x0,
					dy: event.pageY - y0,
					pageX: event.pageX,
					pageY: event.pageY
				};
			resizeMove.initCustomEvent('interactresizemove', false, false, detail);
			target.element.dispatchEvent(resizeMove);
		}
		event.preventDefault();
		if (mouseIsDown && target.resize) {
			var x = event.pageX,
				y = event.pageY,
			newWidth = ( event.pageX > target.x)? target.width + (x - prevX) : 0 ,
			newHeight = ( event.pageY > target.y)? target.height + (y - prevY) : 0 ;

			setSize(target, newWidth, newHeight);
			prevX = x;
			prevY = y;
		}
	}


	/**
	 * @private
	 * @event
	 */
	function xyDrag(event) {
		if (!dragHasStarted) {
			var dragStart = document.createEvent('MouseEvents');

			dragStart.initMouseEvent('interactdragstart', false, false, window,
				1, event.screenX, event.screenY, event.clientX, event.clientY,
				event.ctrlKey, event.altKey, event.shiftKey, event.metaKey,
				event.button, null);
			target.element.dispatchEvent(dragStart);
			x0 = event.pageX;
			y0 = event.pageY;
			console.log('dragging node' );
			dragHasStarted = true;
		}
		else {
			var dragMove = document.createEvent('CustomEvent'),
				detail = {
					x0: x0,
					y0: y0,
					dx: event.pageX - x0,
					dy: event.pageY - y0,
					pageX: event.pageX,
					pageY: event.pageY
				};
			dragMove.initCustomEvent('interactdragmove', false, false, detail);
			target.element.dispatchEvent(dragMove);
		}
		if (mouseIsDown && target.drag) {
		//	event.preventDefault();

			addClass(target.element, 'interact-target');
			var x = event.pageX,
				y = event.pageY;

			position(target, target.x + x - prevX , target.y + (y - prevY));
			prevX = x;
			prevY = y;
		}
	}


	/**
	 * @private
	 * @event
	 */
	function mouseMove(event) {
		if ( !mouseIsDown && (target = getInteractNode(event.currentTarget))) {
			if (target.resize) {
				var	x = event.pageX,
					y = event.pageY,
					clientRect = target.element.getClientRects()[0],
					right = ((x - clientRect.left) > (clientRect.width - margin)),
					bottom = ((y - clientRect.top) > (clientRect.height - margin));

				if (right) {
					target.element.style.cursor = bottom?'se-resize' : 'e-resize';
				}
				else {
					target.element.style.cursor = bottom?'s-resize' : '';
				}
			}
			else {
				target.element.style.cursor = '';
			}
		}
	}


	/**
	 * @private
	 * @event
	 */
	function mouseDown(event) {
		mouseIsDown = true;
		if ((target = getInteractNode(event.currentTarget))) {
			var	right,
				bottom,
				clientRect = target.element.getClientRects()[0];

				prevX = event.pageX;
				prevY = event.pageY;
				right = ((prevX - clientRect.left) > (clientRect.width - margin)),
				bottom = ((prevY - clientRect.top) > (clientRect.height - margin));

			if (right) {
				event.preventDefault();

				events.remove(docTarget, moveEvent, 'all');
				if (bottom) {
					events.add(docTarget, moveEvent, xyResize);
				}
				else {
					events.add(docTarget, moveEvent, xResize) ;
				}
			}
			else if (bottom) {
				event.preventDefault();

				events.remove(docTarget, moveEvent, 'all');
				events.add(docTarget, moveEvent, yResize);
			}
			else if (target.drag) {
				event.preventDefault();

				bringToFront(target.element);
				events.remove(docTarget, moveEvent, 'all');
				events.add(docTarget, moveEvent, xyDrag);
				addClass(target.element, 'ineract-dragging');
			}
		}
	}


	/**
	 * @private
	 * @event
	 */
	function docMouseUp (event) {
		var detail;

		if (dragHasStarted) {
			var drop = document.createEvent('CustomEvent');

			detail = {
				x0: x0,
				y0: y0,
				dx: event.pageX - x0,
				dy: event.pageY - y0,
				pageX: event.pageX,
				pageY: event.pageY
			};
			drop.initCustomEvent('interactdrop', true, false, detail);
			target.element.dispatchEvent(drop);
			dragHasStarted = false;
		}
		else if (resizeHasStarted) {
			var resizeEnd = document.createEvent('CustomEvent');

			detail = {
				x0: x0,
				y0: y0,
				dx: event.pageX - x0,
				dy: event.pageY - y0,
				pageX: event.pageX,
				pageY: event.pageY
			};
			resizeEnd.initCustomEvent('interactdrop', true, false, detail);
			target.element.dispatchEvent(resizeEnd);
			resizeHasStarted = false;
		}

		events.remove(docTarget, moveEvent, xResize);
		events.remove(docTarget, moveEvent, yResize);
		events.remove(docTarget, moveEvent, xyResize);
		events.remove(docTarget, moveEvent, xyDrag);
		events.add(docTarget, moveEvent, mouseMove);
		mouseIsDown = false;
		clearTarget();
	}

	/** @private */
	function getInteractNode(element) {
		for(var i=0; i < interactNodes.length; i++) {
			if (interactNodes[i].element === element) {
				return interactNodes[i];
			}
		}
		return null;
	}

	/** @private */
	function give(parent, child) {
		return parent.appendChild(child);
	}

	/** @private */
	function make(tag, parent) {
		return parent?	parent.appendChild(document.createElement(tag)):
				parent.createElement(tag);
	}

	/** @private */
	function disown(element) {
		return element.parentElement.removeChild(element);
	}

	/** @private */
	function removeClass(element, classNames) {
		classNames = classNames.split(' ');
		for (var i = 0; i < classNames.length; i++) {
			element.className =
				element.className.replace( new RegExp( '(?:^|\\s)' + classNames[i] + '(?!\\S)' ) , '' );
		}
	}

	/** @private */
	function addClass(element, classNames) {
		classNames = classNames.split(' ');
		for (var i = 0; i < classNames.length; i++) {
			if (!element.className.match( new RegExp( '(?:^|\\s)' + classNames + '(?!\\S)' )) ) {
				element.className += ' ' + classNames[i];
			}
		}
	}

	/**
	 * @class Node for demonstrating interact functionality
	 * @private
	 * @returns object HTMLDivElement
	 */
	function DemoNode() {
		var newNode = document.createElement('div');

		newNode.className += ' interact-demo-node interact-node';
		
		return newNode;
	}

	/**
	 * @private
	 * @event
	 */
	function nodeEventDebug(e) {
		/** Display event properties for debugging */
		if (e.type === 'interactresizestart') {
			e.target.innerHTML = '<br> resizestart x0, y0	:	(' + e.pageX + ', ' + e.pageY + ')';
		}

		else if (e.type === 'interactresizemove') {
			e.target.innerHTML = '<br> resizestart x0, y0	:	(' + e.detail.x0 + ', ' + e.detail.y0 + ')';
			e.target.innerHTML += '<br> dx, dy			:	(' + e.detail.dx + ', ' + e.detail.dy + ')';
			e.target.innerHTML += '<br> pageX, pageY		:	(' + e.detail.pageX + ', ' + e.detail.pageY + ')';
		}

		else if (e.type === 'interactdragstart') {
			e.target.innerHTML = '<br> dragstart x0, y0	:	(' + e.pageX + ', ' + e.pageY + ') <br>';
		}

		else if (e.type === 'interactdragmove') {
			e.target.innerHTML = '<br> dragstart x0, y0	:	(' + e.detail.x0 + ', ' + e.detail.y0 + ')';
			e.target.innerHTML += '<br> dx, dy			:	(' + e.detail.dx + ', ' + e.detail.dy + ')';
			e.target.innerHTML += '<br> pageX, pageY		:	(' + e.detail.pageX + ', ' + e.detail.pageY + ')';
		}
	}

	/**
	 * @throws typeError
	 */
	function setSize(node, x, y) {
		if (typeof x !== 'number' || typeof y !== 'number') {
			typeErr.name = 'Incorrect parameter types';
			typeErr.message = 'setSize parameters must be a node and two numbers.';
			throw (typeErr);
		}
		node.width = x;
		node.height = y;
		node.element.style.setProperty('width', Math.max(x, 20) + 'px', '');
		node.element.style.setProperty('height', Math.max(y, 20) + 'px', '');
	}

	/**
	 * @throws typeError
	 */
	function position(node, x, y) {
		if (typeof x !== 'number' || typeof y !== 'number') {
			typeErr.name = 'Incorrect parameter types';
			typeErr.message = 'setSize parameters must be a node and two numbers.';
			throw (typeErr);
		}
		node.x = x;
		node.y = y;
		node.element.style.setProperty('left', x + 'px', '');
		node.element.style.setProperty('top', y + 'px', '');
	}

	/** @private */
	function bringToFront(element) {
		// Very lazy
		var parent = element.parentElement;
		give(parent, disown(element));
	}

	/** @private */
	function clearTarget() {
		if (target) {
			removeClass(target.element, 'interact-target interact-dragging interact-resizing');
		}
		target = null;
	}
	/**
	 * @description Global interact object
	 */
	var interact = {};

	/**
	 * @description Array of interact nodes
	 */
	interact.nodes = [];

	/**
	 * @function
	 * @description Displays debugging data in the browser console
	 */
	interact.debug = function () {
		console.log('target         :  ' + target);
		console.log('prevX, prevY   :  (' + prevX + ', ' + prevY);
		console.log('x0, y0         :  (' + x0 + ', ' + y0);
		console.log('nodes          : ' + interact.nodes.length);
		console.log('supportsTouch  :  ' + supportsTouch);

		return {
			target: target,
			prevX: prevX,
			prevY: prevY,
			startX: x0,
			startY: y0,
			nodes: interact.nodes,
			supportsTouch: supportsTouch
		};


	};

	/**
	 * @function
	 * @description Add an element to the list of interact nodes
	 * @param {object HTMLElement} element The DOM Element that will be added
	 * @param {object} options An object whose properties are the drag/resize options
	 */
	interact.set = function (element, options) {
		var nodeAlreadySet = false,
			i = 0,
			newNode,
			styleClass = 'interact-node',
			clientRect = element.getClientRects()[0];

		if (typeof options !== 'object') {
			options = {};
		}

		/** Check if element is already set */
		for (; i < interactNodes.length; i++) {
			if (interactNodes[i].element === element) {
				nodeAlreadySet = true;
				break;
			}
		}
		newNode = {
				element: element,
				x: (options.x)? options.x : clientRect.left,
				y: (options.y)? options.y : clientRect.top,
				width: clientRect.width,
				height: clientRect.height,
				drag: (options.drag !== undefined)? options.drag : false,
				resize: (options.resize !== undefined)? options.resize : false
			};
		if (nodeAlreadySet) {
			interactNodes[i] = newNode;
		}
		else {
			interactNodes.push(newNode);
			position(newNode, newNode.x, newNode.y);
			events.add(newNode, moveEvent, mouseMove);
			events.add(newNode, downEvent, mouseDown, true);
		}
		if (newNode.drag) {
			styleClass += ' interact-draggable';
		}
		if (newNode.resize) {
			styleClass += ' interact-resizeable';
		}
		addClass(element, styleClass);
	};

	/**
	 * @function
	 * @description Remove an element from the list of interact nodes
	 * @param {object HTMLElement} element The DOM Element that will be removed
	 */
	interact.unset = function (element) {
		var i;

		for (i = 0; i < interactNodes.length; i++) {
			if (interactNodes[i].element === element) {
				interactNodes.splice(i, 1);
				events.removeAll(interactNodes[i]);
			}
		}
		removeClass(element, 'interact-node interact-target interact-dragging interact-resizing interact-draggable interact-resizeable');
	};

	/**
	 * @function
	 * @description Check if an element has been set
	 * @param {object HTMLElement} element The DOM Element that will be searched for
	 * @returns bool
	 */
	interact.isSet = function(element) {
		for(var i=0; i < interactNodes.length; i++) {
			if (interactNodes[i].element === element) {
				return true;
			}
		}
		return false;
	};

	/**
	 * @function
	 * @description Introduce random draggable, resizeable nodes to the document (for testing)
	 * @param {number} [n] The number of nodes to be added (default: 10)
	 * @param {object} [parent] An object with boolean properties (default: document.body)
	 */
	interact.randomNodes = function (n, parent) {
		var i;

		n = n || 10;
		parent = parent || document.body;
		for (i = 0; i < n; i++) {
			if (interact.nodes[i]!==undefined && interact.nodes[i].element.parentNode === parent) {
				var par = interact.nodes[i].element.parentNode;

				par.removeChild(interact.nodes[i].element);
				//interact.nodes[i] = new DemoNode(Math.random()*(window.screen.width - 20), Math.random()*(window.screen.height - 20), Math.random()* 200, Math.random()* 200);
				interact.nodes[i] = new DemoNode();
				give(par, interact.nodes[i].element);
			}
			else {
				interact.nodes.push(new DemoNode());
				give(document.body, interact.nodes[i]);
			}
			interact.set(interact.nodes[i], {drag:true, resize:true, x:Math.random()*(window.innerWidth - 20), y:Math.random()*(window.innerHeight - 20)});

			/** Display event properties for debugging */
			events.add(interactNodes[i], 'interactresizestart', nodeEventDebug);
			events.add(interactNodes[i], 'interactresizemove', nodeEventDebug);
			events.add(interactNodes[i], 'interactdragstart', nodeEventDebug);
			events.add(interactNodes[i], 'interactdragmove', nodeEventDebug);

			if (i === 0) {
				interact.nodes[0].style.backgroundColor = '#ff0';
				interact.nodes[0].id = 'node0';
			}
		}
	};
	events.add(docTarget, upEvent, docMouseUp);

	/**
	 * Used for debugging
	 * @type Array
	 */
	interact.inodes = interactNodes;

	return interact;
}());

