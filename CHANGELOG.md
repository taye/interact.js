## Upcomming Changes

### Changed parameters to actionChecker and drop.checker

 - Added `event` as the first argument to actionCheckers. See commit [88dc583](https://github.com/taye/interact.js/commit/88dc583)
 - Added `dragEvent` as the first parameter to drop.checker functions. See
   commits [16d74d4](https://github.com/taye/interact.js/commit/16d74d4) and [d0c4b69](https://github.com/taye/interact.js/commit/d0c4b69)

### Deprecated methods

interactable.accept - instead, use:

```javascript
interact(target).dropzone({ accept: stringOrElement })
```

interactable.dropChecker - instead, use:

```javascript
interact(target).dropzone({ checker: function () {} })
```

### Added resize.margin

See https://github.com/taye/interact.js/issues/166#issuecomment-91234390

### Fixes

 - touch coords on Presto Opera Mobile - see commits [886e54c](https://github.com/taye/interact.js/commit/886e54c) and [5a3a850](https://github.com/taye/interact.js/commit/5a3a850)
 - avoid accessing some recently deprecated event properties in Blink - see
   commits [e91fbc6](https://github.com/taye/interact.js/commit/e91fbc6) and [195cfe9](https://github.com/taye/interact.js/commit/195cfe9)
 - dropzones with `accept: 'pointer'` in scrolled pages on iOS6 and lower - see
   commit [0b94aac](https://github.com/taye/interact.js/commit/0b94aac)
 - setting styleCursor through Interactable options object - see [PR
   #270](https://github.com/taye/interact.js/pull/270)
 - one missed interaction element on stop triggered - see [PR
   #258](https://github.com/taye/interact.js/pull/258)
 - pointer dt on touchscreen devices - see [PR
   #215](https://github.com/taye/interact.js/pull/215)
 - autoScroll with containers with fixed position - see commit [3635840](https://github.com/taye/interact.js/commit/3635840)
 - autoScroll for mobile - see #180
 - preventDefault - see commits [1984c80](https://github.com/taye/interact.js/commit/1984c80) and [6913959](https://github.com/taye/interact.js/commit/6913959)
 - occasional error - see [issue
   #183](https://github.com/taye/interact.js/issue/183)
 - Interactable#unset - see [PR
   #178](https://github.com/taye/interact.js/pull/178)
 - coords of start event after manual start - see commit [fec73b2](https://github.com/taye/interact.js/commit/fec73b2)
 - bug with touch and selector interactables - see commit [d8df3de](https://github.com/taye/interact.js/commit/d8df3de)
 - touch doubletap bug - see [273f461](https://github.com/taye/interact.js/commit/273f461)
 - event x0/y0 with origin - see [PR
   #167](https://github.com/taye/interact.js/pull/167)

## 1.2.4

### Resizing from all edges

With the new [resize edges API](https://github.com/taye/interact.js/pull/145),
you can resize from the top and left edges of an element in addition to the
bottom and right. It also allows you to specify CSS selectors, regions or
elements as the resize handles.

### Better `dropChecker` arguments

The arguments to `dropChecker` functions have been expanded to include the
value of the default drop check and some other useful objects. See [PR
161](https://github.com/taye/interact.js/pull/161)

### Improved `preventDefault('auto')`

If manuanStart is `true`, default prevention will happen only while
interacting. Related to [Issue
138](https://github.com/taye/interact.js/issues/138).

### Fixed inaccurate snapping

This removes a small inaccuracy when snapping with one or more
`relativeOffsets`.

### Fixed bugs with multiple pointers

## 1.2.3

### ShadowDOM

Basic support for ShadowDOM was implemented in [PR
143](https://github.com/taye/interact.js/pull/143)

### Fixed some issues with events

Fixed Interactable#on({ type: listener }). b8a5e89

Added a `double` property to tap events. `tap.double === true` if the tap will
be followed by a `doubletap` event. See [issue
155](https://github.com/taye/interact.js/issues/155#issuecomment-71202352).

Fixed [issue 150](https://github.com/taye/interact.js/issues/150).

## 1.2.2

### Fixed DOM event removal

See [issue 149](https://github.com/taye/interact.js/issues/149).

## 1.2.1

### Fixed Gestures

Gestures were completely [broken in
v1.2.0](https://github.com/taye/interact.js/issues/146). They're fixed now.

### Restriction

Fixed restriction to an element when the element doesn't have a rect (`display:
none`, not in DOM, etc.). [Issue
144](https://github.com/taye/interact.js/issues/144).

## 1.2.0

### Multiple interactions

Multiple interactions have been enabled by default. For example:

```javascript
interact('.drag-element').draggable({
    enabled: true,
 // max          : Infinity,  // default
 // maxPerElement: 1,         // default
});
```

will allow multiple `.drag-element` to be dragged simultaneously without having
to explicitly set <code>max:&nbsp;integerGreaterThan1</code>. The default
`maxPerElement` value is still 1 so only one drag would be able to happen on
each `.drag-element` unless the `maxPerElement` is changed.

If you don't want multiple interactions, call `interact.maxInteractions(1)`.

### Snapping

#### Unified snap modes
Snap modes have been
[unified](https://github.com/taye/interact.js/pull/127). A `targets` array
now holds all the snap objects and functions for snapping.
`interact.createSnapGrid(gridObject)` returns a function that snaps to the
dimensions of the given grid.

#### `relativePoints` and `origin`

```javascript
interact(target).draggable({
  snap: {
    targets: [ {x: 300, y: 300} ],
    relativePoints: [
      { x: 0, y: 0 },  // snap relative to the top left of the element
      { x: 1, y: 1 },  // and also to the bottom right
    ],  

    // offset the snap target coordinates
    // can be an object with x/y or 'startCoords'
    offset: { x: 50, y: 50 }
  }
});
```

#### snap function interaction arg

The current `Interaction` is now passed as the third parameter to snap functions.

```javascript
interact(target).draggable({
  snap: {
    targets: [ function (x, y, interaction) {
      if (!interaction.dropTarget) {
        return { x: 0, y: 0 };
      }
    } ]
  });
```

#### snap.relativePoints and offset

The `snap.relativePoints` array succeeds the snap.elementOriign object. But
backwards compatibility with `elementOrigin` and the old snapping interface is
maintained.

`snap.offset` lets you offset all snap target coords.

See [this PR](https://github.com/taye/interact.js/pull/133) for more info.

#### slight change to snap range calculation

Snapping now occurs if the distance to the snap target is [less than or
equal](https://github.com/taye/interact.js/commit/430c28c) to the target's
range.

### Inertia

`inertia.zeroResumeDelta` is now `true` by default.

### Per-action settings

Snap, restrict, inertia, autoScroll can be different for drag, restrict and
gesture. See [PR 115](https://github.com/taye/interact.js/pull/115).

Methods for these settings on the `interact` object (`interact.snap()`,
`interact.autoScroll()`, etc.) have been removed.

### Space-separated string and array event list and eventType:listener object

```javascript
function logEventType (event) {
  console.log(event.type, event.target);
}

interact(target).on('down tap dragstart gestureend', logEventType);

interact(target).on(['move', 'resizestart'], logEventType);

interact(target).on({
  dragmove: logEvent,
  keydown : logEvent
});
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

### Interactable.preventDefault('always' || 'never' || 'auto')

The method takes one of the above string values. It will still accept
`true`/`false` parameters which are changed to `'always'`/`'never'`.

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
