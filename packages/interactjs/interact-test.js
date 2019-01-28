import interact from './index';
// Interactables
interact('.drag-and-resize')
    .draggable({
    snap: {
        targets: [
            { x: 100, y: 200 },
            function (x, y) { return { x: x % 20, y: y }; }
        ]
    }
})
    .resizable({
    inertia: true
});
// Selector context
const myList = document.querySelector('#my-list');
interact('li', {
    context: myList
})
    .draggable({ /* ... */});
// Action options
const target = 'li';
interact(target)
    .draggable({
    max: 1,
    maxPerElement: 2,
    manualStart: true,
    snap: { /* ... */},
    restrict: { /* ... */},
    inertia: { /* ... */},
    autoScroll: { /* ... */},
    axis: 'x' || 'y'
})
    .resizable({
    max: 1,
    maxPerElement: 2,
    manualStart: true,
    snap: { /* ... */},
    restrict: { /* ... */},
    inertia: { /* ... */},
    autoScroll: { /* ... */},
    square: true || false,
    axis: 'x' || 'y'
})
    .gesturable({
    max: 1,
    maxPerElement: 2,
    manualStart: true,
    restrict: { /* ... */}
});
// autoscroll
const element = 'li';
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
const handleEl = 'li';
interact(target).resizable({
    edges: {
        top: true,
        left: false,
        bottom: '.resize-s',
        right: handleEl // Resize if pointer target is the given Element
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
    checker: function (_dragEvent, // related dragmove or dragend
    _event, // Touch, Pointer or Mouse Event
    dropped, // bool default checker result
    _dropzone, // dropzone Interactable
    dropElement, // dropzone elemnt
    _draggable, // draggable Interactable
    _draggableElement) {
        // only allow drops into empty dropzone elements
        return dropped && !dropElement.hasChildNodes();
    }
});
interact.dynamicDrop();
interact.dynamicDrop(false);
// Events
function listener(event) {
    const { type, pageX, pageY } = event;
    alert({ type, pageX, pageY });
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
interact.on(['dragmove', 'resizestart'], listener);
const dropTarget = 'div';
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
interact(target).on('up', function (_event) { });
// fast click
interact('a[href]').on('tap', function (event) {
    window.location.href = event.currentTarget.href;
    event.preventDefault();
});
//# sourceMappingURL=interact-test.js.map