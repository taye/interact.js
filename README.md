<a href="http://interactjs.io"><img alt="interact.js" src="http://interactjs.io/repo/img/ijs-anim.svg" height="131px" width="100%"></a>

Javascript drag and drop, resizing and gestures for modern desktop and mobile browsers.

Features include:

 - **inertia** and **snapping**
 - **multiple interactions**
 - cross browser and device, supporting the **desktop and mobile** versions of
   Chrome, Firefox and Opera as well as **Internet Explorer 8+**
 - interaction with [**SVG**](http://interactjs.io/repo/demo/star.svg) elements
 - being **lightweight and standalone** (not _yet another_ jQuery plugin)
 - **not modifying anything** it doesn't own (except to support IE8 and to
   change the cursor (but you can disable that))

## This README features [changes][upcoming-changes] that are currently in development.

The README of the latest release can be found [here][latest-readme].

Follow [@interactjs][ijs-twitter] on twitter and keep an eye on the [CHANGELOG](CHANGELOG.md) to stay updated.

Installation
------------

Install with [Bower](http://bower.io/) or [npm](https://www.npmjs.org/) or download the latest version from http://interactjs.io/#download.

```shell
    $ bower install interact
    $ npm install interact.js
```

Documentation
-------------

Visit http://interactjs.io/docs for the API documentation.

Example
-------

```javascript
var pixelSize = 16;

interact('.rainbow-pixel-canvas')
  .origin('self')
  .draggable({
    snap: {
        targets: [ interact.createSnapGrid({
          x: pixelSize, y: pixelSize
        }) ]
    },
    max: Infinity,
    maxPerElement: Infinity
  })
  // draw colored squares on move
  .on('dragmove', function (event) {
    var context = event.target.getContext('2d'),
        // calculate the angle of the drag direction
        dragAngle = 180 * Math.atan2(event.dx, event.dy) / Math.PI;

    // set color based on drag angle and speed
    context.fillStyle = 'hsl(' + dragAngle + ', 86%, '
                        + (30 + Math.min(event.speed / 1000, 1) * 50) + '%)';

    // draw squares
    context.fillRect(event.pageX - pixelSize / 2, event.pageY - pixelSize / 2,
                     pixelSize, pixelSize);
  })
  // clear the canvas on doubletap
  .on('doubletap', function (event) {
    var context = event.target.getContext('2d');

    context.clearRect(0, 0, context.canvas.width, context.canvas.height);
  });

  function resizeCanvases () {
    [].forEach.call(document.querySelectorAll('.rainbow-pixel-canvas'), function (canvas) {
      canvas.width = document.body.clientWidth;
      canvas.height = window.innerHeight * 0.7;
    });
  }

  // interact.js can also add DOM event listeners
  interact(document).on('DOMContentLoaded', resizeCanvases);
  interact(window).on('resize', resizeCanvases);

interact.maxInteractions(Infinity);
```

See the above code in action at http://codepen.io/taye/pen/YPyLxE

License
-------

interact.js is released under the [MIT License](http://taye.mit-license.org).

[ijs-twitter]: https://twitter.com/interactjs
[upcoming-changes]: https://github.com/taye/interact.js/blob/master/CHANGELOG.md#upcoming-changes
[latest-readme]: https://github.com/taye/interact.js/blob/latest/README.md#readme
