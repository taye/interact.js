
'use strict';

window.interactDemo = (function() {
	/**
	 * @function
	 * @description Introduce random draggable, resizeable nodes to the document (for testing)
	 * @param {number} [n] The number of nodes to be added (default: 10)
	 * @param {object} [parent] An object with boolean properties (default: document.body)
	 */
	function randomNodes(n, parent) {
		var newDiv,
			i;

		n = n || 10;
		parent = parent || document.body;
		for (i = 0; i < n; i++) {
			newDiv = document.body.appendChild(document.createElement('div'));
			newDiv.className = 'interact-demo-node';
			newDiv.id = 'demo-node' + i;
			newDiv.interactDemo = true;

			interact.set(newDiv, {
				drag: true,
				resize: true,
				order: false,
				x: Math.random()*(window.innerWidth - 20),
				y: Math.random()*(window.innerHeight - 20)
			});
		}
	};
	function setSize(element, x, y) {
			element.style.setProperty('width', Math.max(x, 20) + 'px', '');
			element.style.setProperty('height', Math.max(y, 20) + 'px', '');
	}

	function position(element, x, y) {
		element.style.setProperty('left', x + 'px', '');
		element.style.setProperty('top', y + 'px', '');
	}

	function nodeEventDebug(e) {
		/** Display event properties for debugging */
		if ( e.target.interactDemo && e.type in interact.eventDict()) {
			e.target.innerHTML = '<br> ' + interact.eventDict(e.type) + ' x0, y0	:	(' + e.detail.x0 + ', ' + e.detail.y0 + ')';
			e.target.innerHTML += '<br> dx, dy		:	(' + e.detail.dx + ', ' + e.detail.dy + ')';
			e.target.innerHTML += '<br> pageX, pageY	:	(' + e.detail.pageX + ', ' + e.detail.pageY + ')';
		}
	}

	document.addEventListener('interactresizeend', function(e) {
		var clientRect = e.target.getClientRects()[0],
			newWidth = Math.max(clientRect.width + e.detail.dx, 0),
			newHeight = Math.max(clientRect.height + e.detail.dy, 0);

		if (e.detail.shiftKey) {
			newWidth = newHeight = Math.max(newWidth, newHeight);
		}
		setSize(e.target, newWidth, newHeight);
	});

	document.addEventListener('interactdragend', function(e) {
		var clientRect = e.target.getClientRects()[0];

		position(e.target, clientRect.left + (e.detail.pageX - e.detail.x0), clientRect.top + (e.detail.pageY - e.detail.y0));
	});

	/** Display event properties for debugging */
	document.addEventListener('interactresizestart', nodeEventDebug);
	document.addEventListener('interactresizemove', nodeEventDebug);
	document.addEventListener('interactresizeend', nodeEventDebug);
	document.addEventListener('interactdragstart', nodeEventDebug);
	document.addEventListener('interactdragmove', nodeEventDebug);
	document.addEventListener('interactdragend', nodeEventDebug);

	document.addEventListener('interactresizestart', function(e) {
		console.log( '<br> ' + interact.eventDict(e.type) + ' x0, y0 : (' + e.detail.x0 + ', ' + e.detail.y0 + ')');
		console.log('resizing node');
	});
	
	document.addEventListener('interactdragstart', function(e) {
		console.log( '<br> ' + interact.eventDict(e.type) + ' x0, y0 : (' + e.detail.x0 + ', ' + e.detail.y0 + ')');
		console.log('dragging node');
	});
	
	var interactDemo = {};
	
	interactDemo.randomNodes = randomNodes;
	interactDemo.setSize = setSize;
	interactDemo.position = position;
	interactDemo.nodeEventDebug = nodeEventDebug;
	
	return interactDemo;
}())

