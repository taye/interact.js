InteractEvents
==============

``` javascript
function listener (event) {
  console.log(event.type, event.pageX, event.pageY)
}

interact(target)
  .on('dragstart', listener)
  .on('dragmove dragend', listener)
  .on(['resizemove', 'resizeend'], listener)
  .on({
    gesturestart: listener,
    gestureend: listener,
  })

interact(target).draggable({
  onstart: listener,
  onmove: listener,
  onend: listener,
})

interact(target).resizable({
  listeners: [{
    start: function (event) {
      console.log(event.type, event.pageX, event.pageY)
    },
  }],
})
```

`InteractEvent`s are fired for different actions. The event types include:

 - Draggable: `dragstart`, `dragmove`, `draginertiastart`, `dragend`
 - Resizable: `resizestart`, `resizemove`, `resizeinertiastart`, `resizeend`
 - Gesturable: `gesturestart`, `gesturemove`, `gestureend`

To respond to `InteractEvent`s, you must add listeners for the event types either
directly on an interactable or globally for all events of those types on the
`interact` object.

The event object that was created is passed to these functions as the first and
only parameter.

`InteractEvent` properties include the usual properties of mouse/touch events
such as `pageX/Y`, `clientX/Y`, modifier keys etc. but also some properties
providing information about the change in coordinates and event specific data.
The table below displays all of these events.

Common
------

| Property                | Description                                       |
| ----------------------- | --------------------------------------------------|
| `target`                | The element that is being interacted with         |
| `interactable`          | The Interactable that is being interacted with    |
| `interaction`           | The Interaction that the event belongs to         |
| `x0`, `y0`              | Page x and y coordinates of the starting event    |
| `clientX0`, `clientY0`  | Client x and y coordinates of the starting event  |
| `dx`, `dy`              | Change in coordinates of the mouse/touch          |
| `velocityX`, `velocityY`| The Velocity of the pointer                       |
| `speed`                 | The speed of the pointer                          |
| `timeStamp`             | The time of creation of the event object          |

Drag
----

| Property                | Description                                       |
| ----------------------- | --------------------------------------------------|
| **dragmove**            |                                                   |
| `dragEnter`             | The dropzone this Interactable was dragged over   |
| `dragLeave`             | The dropzone this Interactable was dragged out of |

Resize
------

| Property                | Description                                       |
| ----------------------- | --------------------------------------------------|
| `edges`                 | The edges of the element that are being changed   |
| `rect`                  | An object with the new dimensions of the target   |
| `deltaRect`             | The change in dimensions since the previous event |

Gesture
-------

| Property                | Description                                       |
| ----------------------- | --------------------------------------------------|
| `distance`              | The distance between the event's first two touches|
| `angle`                 | The angle of the line made by the two touches     |
| `da`                    | The change in angle since previous event          |
| `scale`                 | The ratio of the distance of the start event to the distance of the current event |
| `ds`                    | The change in scale since the previous event      |
| `box`                   | A box enclosing all touch points                  |

In gesture events, page and client coordinates are the averages of touch
coordinates and velocity is calculated from these averages.

Drop Events
===========

```javascript
interact(dropTarget)
  .dropzone({
    ondrop: function (event) {
      alert(event.relatedTarget.id
            + ' was dropped into '
            + event.target.id)
    }
  })
  .on('dropactivate', function (event) {
    event.target.classList.add('drop-activated')
  })
```

Dropzones can receive the following events: `dropactivate`, `dropdeactivate`,
`dragenter`, `dragleave`, `dropmove`, `drop`.

The dropzone events are plain objects with the following properties:

| Property                | Description                                       |
| ----------------------- | --------------------------------------------------|
| `target`                | The dropzone element                              |
| `dropzone`              | The dropzone Interactable                         |
| `relatedTarget`         | The element that's being dragged                  |
| `draggable`             | The Interactable that's being dragged             |
| `dragEvent`             | The related drag event – drag{start,move,end}     |
| `timeStamp`             | Time of the event                                 |
| `type`                  | The event type                                    |


Pointer Events
==============

```javascript
interact(target).on('hold', function (event) {
  console.log(event.type, event.target)
})
```

 - `down`
 - `move`
 - `up`
 - `cancel`
 - `tap`
 - `doubletap`
 - `hold`

I call these `pointerEvents` (with a lower case "p") because they present the
events roughly as the real `PointerEvent` interface does, specifically:

 - `event.pointerId` provides the `TouchEvent#identifier` or
 `PointerEvent#pointerId` or `undefined` for MouseEvents
 - `event.pointerType` provides the pointer type
 - There are no simulated mouse events after touch events

<aside class="notice">
  The properties of the events may vary across browsers and devices depending on
  which event interfaces are supported. For Example, a <code>down</code> event
  from a <code>touchstart</code> will not provide tilt or pressure as specified
  in the <code>PointerEvent</code> interface.
</aside>

Configuring pointer events
--------------------------

```javascript
interact(target).pointerEvents({
  holdDuration: 1000,
  ignoreFrom: '[no-pointer]',
  allowFrom: '.handle',
  origin: 'self',
})
```

`pointerEvent`s are not snapped or restricted, but can be modified with the
origin modifications. `tap` events have a `dt` property which is the time
between the related `down` and `up` events. For `doubletap` `dt` is the time
between the two previous taps.  `dt` for `hold` events is the length of time
that the pointer has been held down for (around 600ms).

Fast click
----------

```javascript
// fast click
interact('a[href]').on('tap', function (event) {
  window.location.href = event.currentTarget.href
  event.preventDefault()
})
```

`tap` and `doubletap` don't have the delay that `click` events have on mobile
devices so it works great for fast buttons and anchor links. Also, unlike
regular click events, a tap isn’t fired if the pointer is moved before being
released.
