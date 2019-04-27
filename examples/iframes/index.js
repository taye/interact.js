function setInteractables () {


  interact('.draggable', { context: document })
    .draggable({
      onmove: onMove,
      inertia: { enabled: true },
      restrict: {
        drag: 'parent',
        endOnly: true,
        elementRect: { top: 0, left: 0, bottom: 1, right: 1 },
      },
      autoScroll: true,
    });

  function onMove (event) {
    let target = event.target,
      x = (parseFloat(target.getAttribute('data-x')) || 0) + event.dx,
      y = (parseFloat(target.getAttribute('data-y')) || 0) + event.dy;

    if ('webkitTransform' in target.style || 'transform' in target.style) {
      target.style.webkitTransform =
            target.style.transform =
            'translate(' + x + 'px, ' + y + 'px)';
    }
    else {
      target.style.left = x + 'px';
      target.style.top  = y + 'px';
    }

    target.setAttribute('data-x', x);
    target.setAttribute('data-y', y);
  }
}
