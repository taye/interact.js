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

Installation
------------

Install with [Bower](http://bower.io/)

```shell
    $ bower install interact
```

or [npm](https://www.npmjs.org/)

```shell
    $ npm install interact.js
```

or download the script from http://interactjs.io/#download and add a `<script>` tag in your HTML that links to the file.

```html
    <script type="text/javascript" src="/path/to/interact.js"></script>
```

`interact` is exposed as an npm module, an AMD module, or a global object
depending on what the environment supports.

Documentation
-------------

Visit http://interactjs.io/docs for the API documentation.

License
-------

interact.js is released under the [MIT License](http://taye.mit-license.org).

[homepage]: http://interactjs.io
[ijs-mozhacks]: https://hacks.mozilla.org/2014/11/interact-js-for-drag-and-drop-resizing-and-multi-touch-gestures/
[upcoming-changes]: https://github.com/taye/interact.js/blob/master/CHANGELOG.md#upcoming-changes
[latest-readme]: https://github.com/taye/interact.js/blob/latest/README.md#readme
