interact.js
===========
Javascript drag, drop, resizing and gestures for modern desktop and mobile browsers.

Usage
----------

### Interactables
 
Before interact.js pays attention to any element, it must individually be **set**. To set a DOM element as an Interactable, call
```javascript
interact.set(element, options);
```
where options is an object whose properties specify how you want the element to be interacted with. For example:
```javascript
var options = {
    draggable: true,
    dropzone: true,
    resizeable: false,
    gestureable: true
};
var element = document.getElementById('anElement');
interact.set(element, options);
```
The interact.set function adds mouse or touch event listeners to the object and returns a new _Interactable_ object which has several methods and properties to configure how it behaves. These methods have a fluent interface so method calls can be chained nicely. So, to do what the code above did, you could also use
```javascript
var element = document.getElementById('anElement');
interact.set(element)
    .draggable(true)
    .dropzone(true)
    .resizeable(false)
    .gestureable(true);
```

### Acting
Now that the element has been made interactable, when it is clicked on or touched and then dragged, an action is determined depending on the input type and position of the event over the element. Interact custom events are then dispatched as the mouse/touch moves around the page until it is finally released or the window loses focus.

Even though interact events are being dispatched, the element is not actually modified by interact.js (apart from styling the cursor and setting classes). To do that, you need to add event listeners for interact events in the document and style the element according to event data.

### Listening
The event types are _interactdrag_, _interactresize_ and _interactgesture_ suffixed with "start", "move" or "end" depending on the current phase of the action.

Interact event data are stored in their event.detail property. These include the usual properties of mouse/touch events such as pageX/Y, clientX/Y, modifier keys etc. but also **dx** and **dy**. In interact move events, these are the change in coordinates since the previous interact event. However, in end events, these are the distance from the position of the start event to that of the end event.
With interactgesture events, the coordinates of all touches are averaged. There are also some other properties calculated from the touch data including
 * **distance** - the distance between the first two touches of the _event.touches_ array
 * **angle** - the angle between the line made by the two touches and the x-axis
 * **rotation** - the change in angle since previous event (similar to dx and dy)
 * **scale** - the ratio of the distance of the start event to the distance of the current event
 * **ds** - the change in scale since the previous event (follows the same pattern as the other differential properties)
 * **box** - a box enclosing all touch points

### Interacting
For moving an element around, it is easiest to have it positioned _absolute_, _fixed_ or _relative_ so that the top and left style attributes can be used for positioning. The position of the element can then be changed by adding the change in position of the mouse to the position of the element.

The above demo can be summarised as
```javascript
// Set element
interact.set(element, {
        draggable: true
    });
// Listen for interactdragmove
document.addEventListener('interactdragmove', function(event) {
    // Add the change in mouse/touch coordinates to the element's current position
        event.target.style.left =
            event.target.offsetLeft + event.detail.dx + "px";

        event.target.style.top =
            event.target.offsetTop + event.detail.dy + "px";
    });
```
### Further Demonstration
The demo in this repository is live [here](http://t1.netsoc.ie/interact.js "interact.js drag, drop, resize and gesture demo"). The blue elements are divs which can be dragged and dropped onto each other, resized by dragging the botom and right edges and also by "pinching" on a multi-touch device. The yellow elements are SVG elements. These can be as interactable as regular HTML elements but are not in this example.

[Biographer](https://code.google.com/p/biographer "Biographer on Google Code"), a biological network layout and visualization tool, uses interact.js to modify SVG elements and to pan and zoom the viewport using a mouse or touch screen device. The applicatin can be viewed [here](http://t1.netsoc.ie/biographer/test/showcase.html "Biographer Showcase").
