/// <reference path="./interact.d.ts" />
import { interact } from 'interact.js/interact'

// Interactables
interact('.drag-and-resize')
  .draggable({
    snap: {
      targets: [
        { x: 100, y: 200 },
        function (x, y) { return { x: x % 20, y: y }; }
    ]}
  })
  .resizable({
    inertia: true
  });

// Selector context
var myList = document.querySelector('#my-list');

interact('li', {
    context: myList
  })
  .draggable({ /* ... */ });

// Action options
var target = 'li'
interact(target)
  .draggable({
    max          : 1,
    maxPerElement: 2,
    manualStart  : true,
    snap         : {/* ... */},
    restrict     : {/* ... */},
    inertia      : {/* ... */},
    autoScroll   : {/* ... */},

    axis         : 'x' || 'y'

  })
  .resizable({
    max          : 1,
    maxPerElement: 2,
    manualStart  : true,
    snap         : {/* ... */},
    restrict     : {/* ... */},
    inertia      : {/* ... */},
    autoScroll   : {/* ... */},

    square       : true || false,
    axis         : 'x' || 'y'
  })
  .gesturable({
    max          : 1,
    maxPerElement: 2,
    manualStart  : true,
    restrict     : {/* ... */}
  });

  // autoscroll
  var element = 'li'
  interact(element)
  .draggable({
    autoScroll: true,
  })
  .resizable({
    autoScroll: {
      container: document.body,
      margin: 50,
      distance: 5,
      interval: 10
    }
  });

// axis
interact(target).draggable({
  axis: 'x'
});

interact(target).resizable({
  axis: 'x'
});

var handleEl = 'li'
interact(target).resizable({
  edges: {
    top   : true,       // Use pointer coords to check for resize.
    left  : false,      // Disable resizing from left edge.
    bottom: '.resize-s',// Resize if pointer target matches selector
    right : handleEl    // Resize if pointer target is the given Element
  }
});

// resize invert
interact(target).resizable({
  edges: { bottom: true, right: true },
  invert: 'reposition'
});

// resize square
interact(target).resizable({
  squareResize: true
});

// dropzone  accept
interact(target).dropzone({
  accept: '.drag0, .drag1',
});

// dropzone overlap
interact(target).dropzone({
  overlap: 0.25
});

// dropzone checker
interact(target).dropzone({
  checker: function (dragEvent,         // related dragmove or dragend
                     event,             // Touch, Pointer or Mouse Event
                     dropped,           // bool default checker result
                     dropzone,          // dropzone Interactable
                     dropElement,       // dropzone elemnt
                     draggable,         // draggable Interactable
                     draggableElement) {// draggable element


// only allow drops into empty dropzone elements
    return dropped && !dropElement.hasChildNodes();
  }
});

// Events
function listener (event) {
  console.log(event.type, event.pageX, event.pageY);
}


interact(target)
  .on('dragstart', listener)
  // cannot type this. This option has been removed from type definition
  // .on('dragmove dragend', listener)
  .on(['resizemove', 'resizeend'], listener)
  .on({
    gesturestart: listener,
    gestureend: listener
  });



interact(target).draggable({
  onstart: listener,
  onmove: listener,
  onend: listener
});

interact.on(['dragmove', 'resizestart'], function (event) {
  console.log(event.type, event.pageX, event.pageY);
});

var dropTarget = 'div'
// Drop Events
interact(dropTarget)
  .dropzone({
    ondrop: function (event) {
      alert(event.relatedTarget.id
            + ' was dropped into '
            + event.target.id);
    }
  })
  .on('dropactivate', function (event) {
    event.target.classList.add('drop-activated');
  });

interact(target).on('up', function (event) {});

// fast click
interact('a[href]').on('tap', function (event) {
  window.location.href = event.currentTarget.href;

  event.preventDefault();
});
