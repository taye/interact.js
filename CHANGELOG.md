## Upcoming Changes

### Per-action settings

Snap, restrict, inertia, autoScroll can be different for drag, restrict and
gesture. See [PR 115](https://github.com/taye/interact.js/pull/115).

### Space-separated string and array event list

```javascript
function logEventType (event) {
  console.log(event.type, event.target);
}

interact(target).on('down tap dragstart gestureend', logEventType);

interact(target).on(['move', 'resizestart'], logEventType);
```

### Interactable actionChecker

The expected return value from an action checker has changed from a string to
an object. The object should have a `name` and can also have an `axis`
property. For example, to resize horizontally:

```javascript
interact(target).resizeable(true)
  .actionChecker(function (pointer, defaultAction, interactable, element) {
    return {
      name: 'resize',
      axis: 'x',
    };
  });
```

### Plain drop event objects

All drop-related events are [now plain
objects](https://github.com/taye/interact.js/issues/122). The related drag
events are referenced in their `dragEvent` property.

## 1.1.3

### Better Events

Adding a function as a listener for an InteractEvent or pointerEvent type
multiple times will cause that function to be fired multiple times for the
event. Previously, adding the event type + function combination again had no
effect.

Added new event types [down, move, up, cancel,
hold](https://github.com/taye/interact.js/pull/101).

Tap and doubletap with multiple pointers was improved.

Added a workaround for IE8's unusual [dblclick event
sequence](http://www.quirksmode.org/dom/events/click.html) so that doubletap
events are fired.

Fixed a [tapping issue](https://github.com/taye/interact.js/issues/104) on
Windows Phone/RT.

Fixed a bug that caused the origins of all elements with tap listeners to be
subtracted successively as a tap event propagated.

[Fixed delegated events](https://github.com/taye/interact.js/commit/e972154)
when different contexts have been used.

### iFrames

[Added basic support](https://github.com/taye/interact.js/pull/98) for sharing
one instance of interact.js between multiplie windows/frames. There are still
some issues.
