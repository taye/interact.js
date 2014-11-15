<img alt="interact.js" src="http://interactjs.io/repo/img/ijs-anim.svg" height="131px" width="100%">

Javascript drag and drop, resizing and gestures for modern desktop and mobile browsers.

Awesomeness includes:

 - **inertia**
 - [**snapping**](http://interactjs.io/repo/demo/snap.html) to a grid, custom
   anchors or paths.
 - cross browser and device, supporting the **desktop and mobile** versions of
   Chrome, Firefox and Opera as well as **Internet Explorer 8+**
 - interaction with [**SVG**](http://interactjs.io/repo/demo/star.svg) elements
 - being **lightweight and standalone** (not _yet another_ jQuery plugin)
 - **not modifying anything** it doesn't own (except to support IE8 and to
   change the cursor (but you can disable that))

Demos
-----

 - http://interactjs.io has some demos showing drag and drop, gestures,
   inertia, snap and some other things.
 - The [html & svg demo](http://interactjs.io/repo/demo/html_svg.html "drag, drop,
   resize and gesture demo") shows div elements which can be dragged and
   dropped onto each other and resized by dragging the bottom and right edges. The
   yellow elements are SVG elements (these won't show up on IE8).
 - [star.svg](http://interactjs.io/repo/demo/star.svg "editing an SVG document")
   demonstrates interact.js being used within an SVG document.
 - The [snapping demo](http://interactjs.io/repo/demo/snap.html "Oh snap!") shows
   how flexible the grid and anchor snapping system is and it's pretty fun.
 - This [blog post on path
   snapping](http://taye.me/blog/interact-js/snap/2013/09/29/interactjs-path-snapping.html)
   demonstrates and graphs some interesting path snapping functions.

interact.js began as a [Google Summer of Code 2012 project]("http://www.google-melange.com/gsoc/project/details/google/gsoc2012/taye/5668600916475904") for
[Biographer](https://code.google.com/p/biographer "Biographer on Google Code").

Example
-------

```javascript
var // x and y to keep the position that's been dragged to
    x = 0,
    y = 0,
    // vendor prefixes (prefices?)
    transformProp = 'transform' in document.body.style?
                'transform': 'webkitTransform' in document.body.style?
                    'webkitTransform': 'mozTransform' in document.body.style?
                        'mozTransform': 'oTransform' in document.body.style?
                            'oTransform': 'msTransform';

// make an Interactable of the document body element
interact(document.body)
    // make a draggable of the Interactable
    .draggable({
        // on(drag)move
        // could also have done interact(document.body).draggable(true).ondragmove = function...
        onmove: function (event) {
            x += event.dx;
            y += event.dy;

            // translate the document body by the change in pointer position
            document.body.style[transformProp] = 'translate(' + x + 'px, ' + y + 'px)';
        }
    })
    // you should really add listeners like this if you want to add multiple listeners
    .on('dragend', function (event) {
        console.log('dragged a distance of ' + 
            Math.sqrt(event.dx*event.dx + event.dy*event.dy) + 
            ' pixels to ' + event.pageX + ', ' + event.pageY);
    })
    // allow inertia throwing
    .inertia({
        resistance: 15,
        zeroResumeDelta: true
    });
    // snap to the corners of the specified grid
    .snap({
        mode: 'grid',
        grid: {
            x: 100,
            y: 5
        },
        gridOffset: {
            x: 20,
            y: 10
        },
        range: Infinity // can also use -1 which gets changed to Infinity
    });
    

// you can also listen to InteractEvents for every Interactable
interact.on('dragstart', function (event) {
    console.log('starting drag from ' + event.x0 + ', ' + event.y0);
});
```

Documentation
-------------
http://interactjs.io/docs

Usage
-----
Pass the element you want to interact with or a CSS selector string to
`interact`. That returns an object with methods, notably `draggable`,
`resizable`, `gesturable`, `dropzone` which let you allow or disallow the
related actions and `on` which let's you add event listeners for InteractEvents
and any DOM event.

Details
-------

### Interactables
The `interact` function takes an Element or CSS selector and an optional
`options` object.  This returns an `Interactable` object which has several
methods and properties to configure what events it can fire and to modify the
reported coordinates. These methods have a fluent interface so method calls can
be chained nicely.

For example, to make a DOM element fire drag and resize events you can do:

```javascript
interact(document.getElementById('anElement'))
        .draggable (true)
        .resizable(true);
```

### Acting
Now that the element has been made interactable, when it is clicked on or
touched and then dragged, an action is determined depending on the input type
and position of the event over the element. InteractEvents are then fired as
the pointer moves around the page until it is finally released or the
window loses focus.

When a sequence of user actions results in an InteractEvent, that event type is
fired and all listeners of that type which were bound to that Interactable or
bound globally are called.

Even though InteractEvents are being fired, the element is not actually
modified by interact.js at all. To do that, you need to add listeners for
InteractEvents either to each Interactable or globally for all Interacables and
style the element according to event data.

### Listening
  The `InteractEvent` types are:

 - Draggable: `dragstart`, `dragmove`, `draginertiastart`, `dragend`
 - Dropzone: `dropactivate`, `dropdeactivate`, `dragenter`, `dragleave`,
   `dropmove`, `drop`
 - Resizable: `resizestart`, `resizemove`, `resizeinertiastart`, `resizeend`
 - Gesturable: `gesturestart`, `gesturemove`, `gestureinertiastart`,
   `gestureend`

There are also the `tap` and `doubletap` events which are equivalent to `click`
and `doubleclik`.

To respond to an InteractEvent, you must add a listener for its event type
either directly to an interactable

``` javascript
Interactable#on(eventType, listenerFunction)
```

or globally for all events of that type

```javascript
interact.on('resizemove', resizeElement)`.
```

The `InteractEvent` object that was created is passed to these functions as the
first parameter.

InteractEvent properties include the usual properties of mouse/touch events
such as pageX/Y, clientX/Y, modifier keys etc. but also some properties
providing information about the change in coordinates and event specific data.
The table below displays all of these events.

#### InteractEvent properties
| Common                  |                                                   |
| ----------------------- | --------------------------------------------------|
| target                  | The element that is being interacted with         |
| `x0`, `y0`              | Page x and y coordinates of the starting event    |
| `clientX0`, `clientY0`  | Client x and y coordinates of the starting event  |
| `dx`, `dy`              | Change in coordinates of the mouse/touch          |
| `velocityX`, `velocityY`| The Velocity of the pointer                       |
| `speed`                 | The speed of the pointer                          |
| `timeStamp`             | The time of creation of the event object          |

| Draggables              |                                                   |
| ----------------------- | --------------------------------------------------|
| **dragmove**            |                                                   |
| `dragEnter`             | The dropzone this Interactable was dragged over   |
| `dragLeave`             | The dropzone this Interactable was dragged out of |
| **dragenter, dragLeave**|                                                   |
| `draggable`             | The draggable that's over this dropzone           |

| Dropzones               |                                                   |
| ----------------------- | --------------------------------------------------|
| **drop(de)activate**, **dropmove**, **drag(enter\|leave)**, **drop** |      |
| `draggable`             | The draggable element that was dropped into this dropzone |
|                         |                                                   |

| Resize                  |                                                   |
| ----------------------- | --------------------------------------------------|
| `axes`                  | The axes the resizing is constrained to (x/y/xy)  |

| Gesture                 |                                                   |
| ----------------------- | --------------------------------------------------|
| `touches`               | The array of touches that triggered the event     |
| `distance`              | The distance between the event's first two touches|
| `angle`                 | The angle of the line made by the two touches     |
| `da`                    | The change in angle since previous event          |
| `scale`                 | The ratio of the distance of the start event to the distance of the current event |
| `ds`                    | The change in scale since the previous event      |
| `box`                   | A box enclosing all touch points                  |

In gesture events, page and client coordinates are the averages of touch
coordinates. Velocity is calculated from these averages.

Tap and doubletap event coordinates are copied directly from the source
mouseup/touchend/pointerup event and are not modified – no snapping,
restriction or origin for tap and doubletap.

The [dropmove](https://github.com/taye/interact.js/issues/67) event is a plain
object created like this:

``` javascript
dropMoveEvent = {
    target       : dropElement,
    relatedTarget: dragEvent.target,
    dragmove     : dragEvent,
    type         : 'dropmove',
    timeStamp    : dragEvent.timeStamp
};
```

### Interacting
One way to move an element in response to a dragmove is to add a listener that
transforms the element according to `dy` and `dx` of the InteractEvent.

```javascript
// Set element and listen for dragmove events
interact('.drag-element')
    .draggable({
        onmove: function(event) {
            var target = event.target,
                // use data-x, data-y to record the drag position
                x = (parseFloat(target.dataset.x) || 0) + event.dx,
                y = (parseFloat(target.dataset.y) || 0) + event.dy;

            // update the CSS transform
            target.style.transform =
                'translate(' + x + 'px, ' + y + 'px)';

            // save the newly dragged position
            target.dataset.x = x;
            target.dataset.y = y;
        });
```

License
-------

interact.js is released under the [MIT License](http://taye.mit-license.org).
