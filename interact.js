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
					evetnst.remove(target, type, 'all');
				}
			}
		};

	/** @private */
	function xResize(event) {
		event.preventDefault();
		if (mouseIsDown && target.resize) {
			addClass(target.element, 'interact-target');
					var x = event.pageX,
			newWidth = ( event.pageX > target.location.x)? target.width + (x - prevX) : 0 ;

			setSize(target, newWidth, target.height);
			prevX = x;
		}
	}

	/** @private */
	function yResize(event) {
		event.preventDefault();
		if (mouseIsDown && target.resize) {
			addClass(target.element, 'interact-target');
			var y = event.pageY,
			newHeight = ( event.pageY > target.location.y)? target.height + (y - prevY) : 0 ;

			setSize(target, target.width, newHeight);
			prevY = y;
		}
	}

	/** @private */
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
			console.log('resizing node' );
			resizeHasStarted = true;
		}
		event.preventDefault();
		if (mouseIsDown && target.resize) {
			var x = event.pageX,
				y = event.pageY,
			newWidth = ( event.pageX > target.location.x)? target.width + (x - prevX) : 0 ,
			newHeight = ( event.pageY > target.location.y)? target.height + (y - prevY) : 0 ;

			addClass(target.element, 'interact-target');
			setSize(target, newWidth, newHeight);
			prevX = x;
			prevY = y;
		}
	}
	
	/** @private */
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

			position(target, target.location.x + x - prevX , target.location.y + (y - prevY));
			prevX = x;
			prevY = y;
		}
	}
	
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

	/** @private */
	function mouseMove(event) {
		if ( !dragHasStarted && !resizeHasStarted && (target = getInteractNode(event.target))) {
			if (target.resize) {
				var	x = event.pageX,
					y = event.pageY,
					right = (x - target.location.x > target.width - margin),
					bottom = (y - target.location.y > target.height - margin);

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

	/** @private */
	function mouseDown(event) {
		mouseIsDown = true;
		if (target = getInteractNode(event.target)) {
			var	right,
				bottom;

				prevX = event.pageX;
				prevY = event.pageY;
				right = (prevX - target.location.x > target.width - margin),
				bottom = (prevY - target.location.y > target.height - margin);

			if (right) {
				event.preventDefault();

				events.remove(docTarget, moveEvent, 'all');
				console.log('resizing on right');
				if (bottom) {
					events.add(docTarget, moveEvent, xyResize);
				}
				else {
					events.add(docTarget, moveEvent, xResize) ;
				}
			}
			else if (bottom) {
				event.preventDefault();
				
				console.log('resizing on bottom');
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

	/** @private */
	function docMouseUp (event) {
		if (dragHasStarted) {
			var drop = document.createEvent('CustomEvent'),
				detail = {
					x0: x0,
					y0: y0,
					dx: event.pageX - x0,
					dy: event.pageY - y0,
					pageX: event.pageX,
					pageY: event.pageY
				};
			drop.initCustomEvent('interactdrop', false, false, detail);
			target.element.dispatchEvent(drop);
			dragHasStarted = false;
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
				element.className += ' ' + classNames;
			}
		}
	}

	/**
	 * @class Vector Class for locations and dimensions
	 * @private
	 * @param {number} x Value of X ordinate
	 * @param {number} y Value of Y ordinate
	 */
	function Vector(x, y) {
		this.x = x || 0;
		this.y = y || 0;
	}

	/** @private */
	Vector.prototype.set = function (x, y) {
		this.x = x;
		this.y = y || x;
	};

	/** @private */
	Vector.prototype.copy = function (other) {
		if (!other.x && other.y) {
			return;
		}
		this.x = other.x;
		this.y = other.y;
	};

	/**
	 * @class Node for demonstrating interact functionality
	 * @private
	 * @returns object HTMLDivElement
	 * @param {number} x Horizontal position
	 * @param {number} y Vertical position
	 * @param {number} w Element width
	 * @param {number} h Element height
	 */
	function DemoNode(x, y, w, h) {
		var newNode = document.createElement('div');

		newNode.style.setProperty('width', w + 'px', '');
		newNode.style.setProperty('height', h + 'px', '');
		newNode.style.setProperty('left', x + 'px', '');
		newNode.style.setProperty('top', y + 'px', '');
		newNode.className += ' interact-demo-node';
		if (!nodeStyle) {
			nodeStyle = document.createElement('style');
			nodeStyle.type = 'text/css';
			nodeStyle.innerHTML = ' .interact-node { background-color:#2288FF; border:5px solid #333333; border-radius:10px; cursor:move; position:absolute; width:100px; height: 100px}';
			nodeStyle.innerHTML += ' .interact-node:hover { border-color: #AAAAAA; }';
			nodeStyle.innerHTML += ' .interact-target { border-style: dashed; border-color: #AAAAAA; }';
			document.body.appendChild(nodeStyle);
		}
		return newNode;
	}

	/**
	 * @throws typeError
	 */
	function setSize(node, x, y) {
		if (x && x.constructor.name === 'Vector') {
			node.width =  x.x;
			node.height =  x.y;
		}
		else {
			if (typeof x !== 'number' || typeof y !== 'number') {
				typeErr.name = 'Incorrect parameter types';
				typeErr.message = 'DemoNode.setSize parameters must be a single Vector or two numbers.';
				throw (typeErr);
			}
			node.width = x;
			node.height = y;
		}
		node.element.style.setProperty('width', Math.max(x, 20) + 'px', '');
		node.element.style.setProperty('height', Math.max(y, 20) + 'px', '');
	};

	/**
	 * @throws typeError
	 */
	function position(node, x, y) {
		if (x && x.constructor.name === 'Vector') {
		node.location.copy(x);
		}
		else {
			if (typeof x !== 'number' || typeof y !== 'number') {
				typeErr.name = 'Incorrect parameter types';
				typeErr.message = 'DemoNode.position parameters must be a single Vector or two numbers.';
				throw (typeErr);
			}
			node.location.set(x, y);
		}
		node.element.style.setProperty('left', x + 'px', '');
		node.element.style.setProperty('top', y + 'px', '');
	};

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
			prevCoords: new Vector(prevX, prevY),
			dragStartLocation: new Vector(x0, y0),
			nodes: interact.nodes,
			supportsTouch: supportsTouch
		};


	};

	function getElementLocation(element) {
		return new Vector( Number(element.style.left.match(/[0-9]*/)[0]), Number(element.style.top.match(/[0-9]*/)[0]));
	}

	function getElementDimensions(element) {
		return new Vector( Number(element.style.width.match(/[0-9]*/)[0]), Number(element.style.height.match(/[0-9]*/)[0]) );
	}

	/**
	 * @function
	 * @description Add an element to the list of interact nodes
	 * @param {object HTMLElement} element The DOM Element that will be added
	 * @param {object} options An object whose properties are the drag/resize options
	 */
	interact.set = function (element, options) {
		var nodeAlreadySet = false,
			i = 0,
			newNode;

		options = options || {};

		/** Check if element was already set */
		for (; i < interactNodes.length; i++) {
			if (interactNodes[i].element === element) {
				nodeAlreadySet = true;
				break;
			}
		}
		newNode = {
				element: element,
				location: getElementLocation(element),
				width: getElementDimensions(element).x,
				height: getElementDimensions(element).y,
				drag: options.drag || true,
				resize: options.resize || true,
				axis: options.axis || 'xy',
			};
		if (nodeAlreadySet) {
			interactNodes[i] = newNode;
			events.add(newNode, moveEvent, mouseMove);
		}
		else {
			interactNodes.push(newNode);
			events.add(newNode, moveEvent, mouseMove);
		}
		addClass(element, 'interact-node');
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
		removeClass(element, 'interact-node interact-target interact-dragging interact-resizing');
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
	}

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
				interact.nodes[i] = new DemoNode(Math.random()*(window.screen.width - 20), Math.random()*(window.screen.height - 20), 200, 200);
				give(par, interact.nodes[i].element);
			}
			else {
				interact.nodes.push(new DemoNode(Math.random()*(window.screen.width - 20), Math.random()*(window.screen.height - 20), 200, 200));
				give(document.body, interact.nodes[i]);
			}
			interact.set(interact.nodes[i], {drag:true, resize:true});
			if (i === 0) {
				interact.nodes[0].style.backgroundColor = '#ff0';
				interact.nodes[0].id = 'node0';
			}
		}
	};
//	events.add(docTarget, moveEvent, mouseMove);
	events.add(docTarget, downEvent, mouseDown);
//	events.add(docTarget, 'dragenter', function (event) { event.preventDefault(); });
	events.add(docTarget, upEvent, docMouseUp);
	
	/**
	 * Used for debugging
	 * @type Array
	 */
	interact.inodes = interactNodes;
	interact.position = position;
	
	return interact;
}());

