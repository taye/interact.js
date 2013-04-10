interact.js
===========
Javascript drag, drop, resizing and gestures for HTML and SVG elements on modern desktop and mobile browsers.

```javascript
var x = 0, y = 0;

interact(document.body).draggable({
    onmove: function (event) {
        x += event.dx;
        y += event.dy;

        document.body.style.transform = 'translate(' + x + 'px, ' + y + 'px)';
    }
});
```

Usage
-------

### Interactables
The `interact` function adds mouse or touch event listeners to the object and returns an `Interactable` object which has several methods and properties to configure how it behaves and what it can do. These methods have a fluent interface so method calls can be chained nicely.

 For example, to make a DOM element dragagble and resizeable you can call the `Interactable#set` with an object with the properties you want to set
```javascript
interact(document.getElementById('anElement'))
    .set({
        draggable: true,
        resizeable: true
    });
```
or you can call each {action}able method with the options for each.
```jacascript
interact(document.getElementById('anElement'))
        .draggable (true)
        .resizeable(true);
```

### Acting
Now that the element has been made interactable, when it is clicked on or touched and then dragged, an action is determined depending on the input type and position of the event over the element. InteractEvents are then fired as the mouse/touch moves around the page until it is finally released or the window loses focus.

When a sequence of user actions results in an InteractEvent, that event type is fired and all listeners of that type which were bound to that Interactable or bound globally are called.

Even though InteractEvents are being fired, the element is not actually modified by interact.js at all. To do that, you need to bind listeners for InteractEvents either to each Interactable or globally for all Interacables and style the element according to event data.

### Listening
The `InteractEvent` types are {`drag`,`resize`,`gesture`}{`start`,`move`,`end`}, `dragenter`, `dragleave` and `drop` when dragging over dropzones.

To respond to an InteractEvent, you must `bind` a listener for its event type either directly to an interactable `Interactable#bind(eventType, listenerFunction)` or globally for all events of that type `interact.bind('resizemove', resizeElement)`. The InteractEvent object that was created is passed to these functions as the first parameter.

InteractEvent properties include the usual properties of mouse/touch events such as pageX/Y, clientX/Y, modifier keys etc. but also some properties providing information about the change in cordinates and event specific data. The table below displays all of these events.

#### InteractEvent properties
| Common                  |                                                   |
| ----------------------- | --------------------------------------------------|
| `x0`, `y0`              | Page x and y coordinates of the starting event    |
| `clientX0`, `clientY0`  | Client x and y coordinates of the starting event  |
| `dx`, `dy`              | Change in coordinates of the mouse/touch *        |
| target                  | The element that is being interacted with         |

| Drag                    |                                                   |
| ----------------------- | --------------------------------------------------|
| **dragmove**            |                                                   |
| `dragEnter`             | The dropzone this Interactable was dragged over   |
| `dragLeave`             | The dropzone this Interactable was dragged out of |
| **dragenter, dragLeave**|                                                   |
| `draggable`             | The draggable that over this dropzone             |

| Drop                    |                                                   |
| ----------------------- | --------------------------------------------------|
| `draggable`             | The dragagble that was dropped into this dropzone |

| Resize                  |                                                   |
| ----------------------- | --------------------------------------------------|
| `axes`                  | The axes the resizing is constrained to (x/y/xy)  |

| Gesture                 |                                                   |
| ----------------------- | --------------------------------------------------|
| `touches`               | The array of touches that triggered the event     |
| `distance`              | The distance between the event's first two touches|
| `angle`                 | The angle of the line made by the two touches     |
| `rotation`              | The change in angle since previous event          |
| `scale`                 | The ratio of the distance of the start event to the distance of the current event |
| `ds`                    | The change in scale since the previous even       |
| `box`                   | A box enclosing all touch points                  |

\* In interact move events, these are the changes since the previous InteractEvent. However, in end events, these are the changes from the position of the start event to the end event. In gesture events, coordinates are the averages of touch coordinates.


### Interacting
To move an element in response to a dragmove, a listener can be bound that transforms the element accoding to `dy` and `dx` of the InteractEvent. It can also be done by having the element positioned `absolute`, `fixed` or `relative` and adding the change in coordinates to the `top` and `left` position of the element.

```javascript

// Set element and listen for dragmove events
interact(element)
    .draggable({
        onmove: function(event) {
            // Add the change in mouse/touch coordinates to the element's current position
            event.target.style.left =
                event.target.offsetLeft + event.detail.dx + "px";

            event.target.style.top =
                event.target.offsetTop + event.detail.dy + "px";
        });
```
### interact.js in use

interact.js was written as a Google Summer of Code 2012 project for [Biographer](https://code.google.com/p/biographer "Biographer on Google Code"), a biological network layout and visualization tool. It uses interact.js to modify SVG elements and to pan and zoom the viewport using a mouse or touch screen device. A small demonstration can be viewed [here](http://t1.netsoc.ie/biographer/test/showcase.html "Biographer Showcase").

The demo in this repository is live [here](http://t1.netsoc.ie/interact.js "interact.js drag, drop, resize and gesture demo"). The blue elements are divs which can be dragged and dropped onto each other, resized by dragging the botom and right edges and also by "pinching" on a multi-touch device. The yellow elements are SVG elements.
