<a href="http://interactjs.io"><img alt="interact.js" src="https://c4d6f7d727e094887e93-4ea74b676357550bd514a6a5b344c625.ssl.cf2.rackcdn.com/ijs-solid.svg" height="70px" width="100%"></a>

<h2>
  JavaScript drag and drop, resizing and multi-touch gestures with inertia and snapping for modern browsers (and also IE9+).
</h2>

<div align="center">
<a href="https://gitter.im/taye/interact.js"><img src="https://badges.gitter.im/taye/interact.js.svg" alt="Gitter"></a>
<a href="https://www.jsdelivr.com/package/npm/interactjs"><img src="https://data.jsdelivr.com/v1/package/npm/interactjs/badge" alt="jsDelivr"></a>
<a href="https://github.com/taye/interact.js/actions/workflows/workflow.yml"><img src="https://github.com/taye/interact.js/actions/workflows/workflow.yml/badge.svg" alt="Build Status"></a>
<a href="https://codeclimate.com/github/taye/interact.js/test_coverage"><img src="https://api.codeclimate.com/v1/badges/0168aeaeed781a949088/test_coverage"/></a>
</div>
<br>

Features include:

- **inertia** and **snapping**
- **multi-touch**, simultaneous interactions
- cross browser and device, supporting the **desktop and mobile** versions of
  Chrome, Firefox and Opera as well as **Internet Explorer 9+**
- interaction with [**SVG**](http://interactjs.io/#use_in_svg_files) elements
- being **standalone and customizable**
- **not modifying the DOM** except to change the cursor (but you can disable
  that)

## Installation

- [npm](https://www.npmjs.org/): `npm install interactjs`
- [jsDelivr CDN](https://cdn.jsdelivr.net/npm/interactjs/): `<script src="https://cdn.jsdelivr.net/npm/interactjs/dist/interact.min.js"></script>`
- [unpkg CDN](https://unpkg.com/interactjs/): `<script src="https://unpkg.com/interactjs/dist/interact.min.js"></script>`
- [Rails 5.1+](https://rubyonrails.org/):
  1. `yarn add interactjs`
  2. `//= require interactjs/interact`
- [Webjars SBT/Play 2](https://www.webjars.org/): `libraryDependencies ++= Seq("org.webjars.npm" % "interactjs" % version)`

### Typescript definitions

The project is written in Typescript and the npm package includes the type
definitions, but if you need the typings alone, you can install them with:

```
npm install --save-dev @interactjs/types
```

## Documentation

http://interactjs.io/docs

## Example

```javascript
var pixelSize = 16;

interact('.rainbow-pixel-canvas')
  .origin('self')
  .draggable({
    modifiers: [
      interact.modifiers.snap({
        // snap to the corners of a grid
        targets: [
          interact.snappers.grid({ x: pixelSize, y: pixelSize }),
        ],
      })
    ],
    listeners: {
      // draw colored squares on move
      move: function (event) {
        var context = event.target.getContext('2d'),
            // calculate the angle of the drag direction
            dragAngle = 180 * Math.atan2(event.dx, event.dy) / Math.PI;

        // set color based on drag angle and speed
        context.fillStyle = 'hsl(' + dragAngle + ', 86%, '
                            + (30 + Math.min(event.speed / 1000, 1) * 50) + '%)';

        // draw squares
        context.fillRect(event.pageX - pixelSize / 2, event.pageY - pixelSize / 2,
                         pixelSize, pixelSize);
      }
    }
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
```

See the above code in action at https://codepen.io/taye/pen/tCKAm

## License

interact.js is released under the [MIT License](http://taye.mit-license.org).

[ijs-twitter]: https://twitter.com/interactjs
[upcoming-changes]: https://github.com/taye/interact.js/blob/main/CHANGELOG.md#upcoming-changes
