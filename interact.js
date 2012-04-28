// Taye Adeyemi

interact = (function () {

// Private:
	var prevX = 0,
		prevY = 0,
		resizeTarget = [],
		dragTarget = [],
		supportsTouch = 'createTouch' in document,
		mouseIsDown = false;
		
	if (supportsTouch) {
		var downEvent = 'touchstart',
			upEvent = 'touchend',
			moveEvent = 'touchmove';
	} else {
		var downEvent = 'mousedown',
			upEvent = 'mouseup',
			moveEvent = 'mousemove';
	}
	
	function $give (target, child) {
		target.appendChild(child);
	}

	// Vector Class Function
	function Vector(x, y) {
		this.x = x || 0;
		this.y = y || 0;
	}
	Vector.prototype.set = function (x, y) {
			this.x = x;
			this.y = y || x;
	};

	Vector.prototype.setX = function (x) {
			this.x = x;
	};

	Vector.prototype.setY = function (y) {
			this.y = y;
	};

	Vector.prototype.copy = function (other) {
			this.x = other.x;
			this.y = other.y;
	};
	
	// Node Class Function
	function DivNode(x, y, w, h) {
		this.location = new Vector(x, y);
		this.width = w || 0;
		this.height = h || 0;
		this.actions = {resize: true, drag: true};

		
		this.element = document.createElement('div');
		this.element.actions = this.actions;
		this.element.object = this;
		
		// might use DivNode.template.cloneNode() to copy node styling
		this.element.style.setProperty('border-radius', '10px', '');
		this.element.style.setProperty('border', 'solid', '');
		this.element.style.setProperty('border-width', '5px', '');
		this.element.style.setProperty('border-color', '#333', '');
		this.element.style.setProperty('position', 'absolute', '');
		this.element.style.setProperty('background-color', '#2288ff', '');
		
		this.element.style.setProperty('width', this.width + 'px', '');
		this.element.style.setProperty('height', this.height + 'px', '');
		this.element.style.setProperty('left', x + 'px', '');
		this.element.style.setProperty('top', y + 'px', '');
	}

	DivNode.prototype.setSize = Node.prototype.setSize = function (x, y) {
		this.width =  x;
		this.height =  y;
		this.element.style.setProperty('width', Math.max(x, 20) + 'px', ''); 
		this.element.style.setProperty('height', Math.max(y, 20) + 'px', ''); 
	}

	DivNode.prototype.position = Node.prototype.position = function (x, y) {
		this.location.set(x, y);
		this.element.style.setProperty('left', x + 'px', '');
		this.element.style.setProperty('top', y + 'px', '');
	}
	
	function bringToFront(element) {
		// Very lazy
		var parent = element.parentElement;
		parent.removeChild(element);
		parent.appendChild(element);
	}
	
// Public:
	var interact = {
		nodes: [],
		mouseMove: function (event) {
			//console.log(event.pageX + ' ' + event.pageY);
			if (event.target.actions && event.target.actions.resize) {		
				var 	x = event.pageX, y = event.pageY, target = event.target.object,
			
					right = (x - target.location.x > target.width - interact.resize.margin),
					bottom = (y - target.location.y > target.height - interact.resize.margin);
	
				if (right) {
					target.element.style.cursor = bottom?'se-resize' : 'e-resize';
				}
				else {
					target.element.style.cursor = bottom?'s-resize' : target.actions.drag? 'pointer' : 'default';
				}
			}
		},
		mouseDown: function (event) {
			mouseIsDown = true;
			if (event.target.actions && event.target.actions.resize) {		
				var	x = event.pageX,
					y = event.pageY,
					target = event.target.object,
					right = (x - target.location.x > target.width - interact.resize.margin),
					bottom = (y - target.location.y > target.height - interact.resize.margin);

					prevX = x;
					prevY = y;

	
				if (right) {
					event.preventDefault();
					resizeTarget[0] = target;

					interact.events.remove(document, moveEvent);
					console.log('resizing on right');
					bottom? interact.events.add( document, moveEvent, interact.resize.xyResize ):
						interact.events.add( document, moveEvent, interact.resize.xResize ) ;
				}
				else if (bottom) {
					resizeTarget[0] = target;

					console.log('resizing on bottom');
					interact.events.remove(document, moveEvent);
					interact.events.add( document, moveEvent, interact.resize.yResize );
				}
				else if (target.actions.drag) {
					event.preventDefault();
					dragTarget[0] = target;

					bringToFront(target.element);
					console.log('moving node');
					interact.events.remove(document, moveEvent);
					interact.events.add( document, moveEvent, interact.drag.xyDrag );
					target.element.style.cursor = 'move';					
				}
			return false;
			}
		},
		resize: {
			margin: (this.supportsTouch? 30 : 10),			// greater margin for touch device
			xResize: function (event) {
				event.preventDefault();
				var target = resizeTarget[0];
				if (mouseIsDown && target.actions.resize) {		
					var x = event.pageX,
					newWidth = ( event.pageX > target.location.x)? target.width + (x - prevX) : 0 ;
	
					target.setSize(newWidth, target.height);
					prevX = x;
				}
			},
			yResize: function (event) {
				event.preventDefault();
				var target = resizeTarget[0];
				if (mouseIsDown && target.actions.resize) {
					var y = event.pageY,
					newHeight = ( event.pageY > target.location.y)? target.height + (y - prevY) : 0 ;
	
					target.setSize(target.width, newHeight);
					prevY = y;
				}
			},
			xyResize: function (event) {
				var target = resizeTarget[0];
				if (mouseIsDown && target.actions.resize) {		
					var x = event.pageX, y = event.pageY,
					newWidth = ( event.pageX > target.location.x)? target.width + (x - prevX) : 0 ,
					newHeight = ( event.pageY > target.location.y)? target.height + (y - prevY) : 0 ;
	
					target.setSize(newWidth, newHeight);
					prevX = x;
					prevY = y;
				}
			}
		},
		drag: {
			xyDrag: function (event) {
				event.preventDefault();
				var target = dragTarget[0];
				if (mouseIsDown && target.actions.resize) {		
					var x = event.pageX, y = event.pageY;
	
					target.position(target.location.x + x - prevX , target.location.y + (y - prevY));
					prevX = x;
					prevY = y;
				}
			}
		},
		events: {
			add: function (target, type, listener, useCapture) {
				if (target.events === undefined)
					target.events = [];
				if (target.events[type] === undefined)
					target.events[type] = new Array();

				target.addEventListener(type, listener, useCapture || false);
				target.events[type].push(listener);
				return listener;
			},
			remove: function (target, type, listener, useCapture) {
				if (target && target.events && target.events[type])
					if (listener === undefined)
						for (var n in target.events[type]) {
							target.removeEventListener(type, target.events[type][n], useCapture || false);
							target.events[type].splice(n-1, 1);
						}
					else 
						for (var n in target.events[type])
							if (target.events[type][n] === listener) {
								target.removeEventListener(type, listener, useCapture || false);
								target.events[type].splice(n-1, 1);
							}
			}
		},
		docMouseUp: function (event) {
			interact.events.remove(document, moveEvent, interact.resize.xResize);
			interact.events.remove(document, moveEvent, interact.resize.yResize);
			interact.events.remove(document, moveEvent, interact.resize.xyResize);
			interact.events.remove(document, moveEvent, interact.drag.xyDrag);
			
			mouseIsDown = false;
			interact.events.add(document, moveEvent, interact.mouseMove);
			resizeTarget[0] = dragTarget[0] = null;
		},
		randomNodes: function (n, parent) {
			n = n || 10;
			parent = parent || document.body;
			
			for (var i = 0; i < n; i++) {
				if (interact.nodes[i] && interact.nodes[i].element.parentNode == parent) {
					var par = interact.nodes[i].element.parentNode;
					par.removeChild(interact.nodes[i].element);
					interact.nodes[i] = new DivNode(Math.random()*(window.screen.width - 20), Math.random()*(window.screen.height - 20), Math.random()* 200, Math.random()* 200);
					$give(par, interact.nodes[interact].element);
				}
				else {
					interact.nodes.push(new DivNode(Math.random()*(window.screen.width - 20), Math.random()*(window.screen.height - 20), Math.random()* 200, Math.random()* 200));
					$give(document.body, interact.nodes[i].element);
				}
			}
		}
	};
	interact.events.add( document, moveEvent, interact.mouseMove);
	interact.events.add( document, downEvent, interact.mouseDown);
	interact.events.add( document, 'dragenter', function (event) {event.preventDefault();});

	interact.events.add(document, upEvent, interact.docMouseUp);
	return interact;
}());

