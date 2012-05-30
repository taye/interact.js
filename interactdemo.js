/*
 * Copyright (c) 2012 Taye Adeyemi
 * Open source under the MIT License.
 * https://raw.github.com/biographer/interact.js/master/LICENSE
 */
/*jshint smarttabs:true */

window.interactDemo = (function() {
	'use strict';

	var interact = window.interact,
		interactDemo = {};

	function parseStyleLength(string) {
		var lastChar = string[string.length - 1];

		if (lastChar === 'x') {
			return Number(string.substring(string.length - 2, 0));
		}
		else if (lastChar === '%') {
			return parseStyleLength(element.parent) * Number(string.substring(string.length - 1, 0)) / 100;
		}
		else if (lastChar === 'm') {
			// Not Ready ***
			return Number(string.substring(string.length - 2, 0));
		}
	}

	function getWidth(element) {
		/* I should use this to get the width of the element
		 * by looking through the stylesheets for a width value
		 *
		 * I should also take into account the top and left margin, border and padding
		 *

		var sheets = document.styleSheets,
			rules,
			sheetInd,
			ruleInd;

		for (sheetInd = 0; sheetInd < sheets.length; sheetInd ++) {
			rules = sheets[sheetInd].cssRules;
			for (ruleInd = 0;ruleInd < rules.length; ruleInd ++) {
				rules;
				// document.querySelectorAll....
			}
		}
		*/
		var width = element.style.width;

		if(width !== '') {
			return parseStyleLength(width, element);
		}
		else {
			return element.offsetWidth;
		}
	}

	function getHeight(element) {
		var height = element.style.height;

		if(height !== '') {
			return parseStyleLength(height, element);
		}
		else {
			return element.offsetHeight;
		}
	}
	/**
	 * @function
	 * @description Introduce random draggable, resizeable nodes to the document (for testing)
	 * @param {number} [n] The number of nodes to be added (default: 10)
	 * @param {object} [parent] An object with boolean properties (default: document.body)
	 */
	function randomNodes(n, parent) {
		var newDiv,
			text,
			button,
			i,
			buttunFunction = function (e) {
				e.target.innerHTML = e.type;
			};

		n = n || 10;
		parent = parent || document.body;
		
		for (i = 0; i < n; i++) {
			newDiv = document.body.appendChild(document.createElement('div'));
			newDiv.className = 'interact-demo-node';
			newDiv.id = 'node' + i;
			newDiv.interactDemo = true;

			text = newDiv.appendChild(document.createElement('p'));
			newDiv.text = text;
			newDiv.appendChild(document.createElement('br'));

			button = newDiv.appendChild(document.createElement('button'));
			button.innerHTML = 'button gets event?';
			button.addEventListener('click', buttunFunction);
			button.addEventListener('mousedown', buttunFunction);
			button.addEventListener('mouseenter', buttunFunction);
			button.addEventListener('mouseleave', buttunFunction);
			button.addEventListener('touchstart', buttunFunction);
			button.addEventListener('touchmove', buttunFunction);
			button.addEventListener('mouseup', buttunFunction);

			interact.set(newDiv, {
				drag: true,
				resize: true,
				order: false,
				x: Math.random()*(window.innerWidth - 200),
				y: Math.random()*(window.innerHeight - 200)
			});
		}
	}

	function setSize(element, x, y) {
		if (typeof x === 'number' ) {
			element.style.setProperty('width', Math.max(x, 20) + 'px', '');
		}
		if (typeof y === 'number' ) {
			element.style.setProperty('height', Math.max(y, 20) + 'px', '');
		}
		if (typeof x === 'string' ) {
			element.style.setProperty('width', Math.max(x, 20), '');
		}
		if (typeof y === 'string' ) {
			element.style.setProperty('height', Math.max(y, 20), '');
		}
	}

	function position(element, x, y) {
		if (typeof x === 'number' ) {
			element.style.setProperty('left', x + 'px', '');
		}
		if (typeof y === 'number' ) {
			element.style.setProperty('top', y + 'px', '');
		}
	}

	function nodeEventDebug(e) {
		/** Display event properties for debugging */
		if ( e.target.interactDemo && e.type in interact.eventDict()) {
			e.target.text.innerHTML = '<br> ' + interact.eventDict(e.type) + ' x0, y0	:	(' + e.detail.x0 + ', ' + e.detail.y0 + ')';
			e.target.text.innerHTML += '<br> dx, dy		:	(' + e.detail.dx + ', ' + e.detail.dy + ')';
			e.target.text.innerHTML += '<br> pageX, pageY	:	(' + e.detail.pageX + ', ' + e.detail.pageY + ')';
		}
	}

	function eventProperties(e) {
		var debug = '',
			prop;
		if (typeof e.detail === 'object') {
			debug += 'event.detail: ';
			for (prop in e.detail) {
				if (e.detail.hasOwnProperty(prop)) {
					debug += '\n    ' + prop + ' : ' + e.detail[prop];
				}
			}
		}

		if (event.touches && event.touches.length) {
			debug += 'touches[0]: ';
			for (prop in e.touches[0]) {
				if (e.touches[0].hasOwnProperty(prop)) {
					debug += '\n\t' + prop + ' : ' + e.touches[0][prop];
				}
			}
		}
		for (prop in e) {
			if (e.hasOwnProperty(prop)) {
				debug += '\n ' + prop + ' : ' + e[prop];
			}
		}

		return debug;
	}

	document.addEventListener('interactresizeend', function(e) {
		var clientRect = e.target.getClientRects()[0],
			newWidth = Math.max((getWidth(e.target) + e.detail.dx), 0),
			newHeight = Math.max((getHeight(e.target) + e.detail.dy), 0);

		if (e.detail.shiftKey) {
			newWidth = newHeight = Math.max(newWidth, newHeight);
		}
		
	//	alert(eventProperties(e));

		setSize(e.target, newWidth, newHeight);
	});

	document.addEventListener('interactdragend', function(e) {
		var clientRect = e.target.getClientRects()[0],
			left = clientRect.left + (e.detail.pageX - e.detail.x0),
			top = clientRect.top + (e.detail.pageY - e.detail.y0),
			debug = '';


		position(e.target, left, top);

		debug += 'new position : ' + left + ', ' + top + '\n\n';
	//	alert( debug + eventProperties(e));
	});

	/** Display event properties for debugging */
	document.addEventListener('interactresizestart', nodeEventDebug);
	document.addEventListener('interactresizemove', nodeEventDebug);
	document.addEventListener('interactresizeend', nodeEventDebug);
	document.addEventListener('interactdragstart', nodeEventDebug);
	document.addEventListener('interactdragmove', nodeEventDebug);
	document.addEventListener('interactdragend', nodeEventDebug);

	document.addEventListener('interactresizestart', function(e) {
		console.log('\n' + interact.eventDict(e.type) + ' x0, y0 : (' + e.detail.x0 + ', ' + e.detail.y0 + ')');
	});

	document.addEventListener('interactdragstart', function(e) {
		console.log('\n' + interact.eventDict(e.type) + ' x0, y0 : (' + e.detail.x0 + ', ' + e.detail.y0 + ')');
	});

	interactDemo.randomNodes = randomNodes;
	interactDemo.setSize = setSize;
	interactDemo.position = position;
	interactDemo.nodeEventDebug = nodeEventDebug;
	
	if (!$ in window) {
		window.$ = function (id) {
			return document.getElementById(id);
		};
	}
	return interactDemo;
}());


