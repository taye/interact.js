Snapping
========

interact.js has 3 snap modifiers:

 - pointer coordinate-based `snap` which is best suited to drag actions,
 - `snapSize` which works only on resize actions and let's you set targets for
   the size of the target element,
 - and `snapEdges` which is similar to `snapSize`, but let's you set the target
   positions of the edges of the target element.

When creating snap modifiers the options have an array of `targets`. The action
events will be snapped to the closest target of this array which is within
range.

`snap()`
========

The `snap` modifier changes the pointer coordinates to specified targets when
they are within range.

```js
const mySnap = interact.modifiers.snap({
  targets: [
    { x: 200, y: 200 },
    { x: 250, y: 350 }
  ]
})
```

Using the `snap` modifier while dragging, The coordinates of the pointer that
the drag event listeners receive will be modified to meet the coordinates of the
snap targets. This option may also be used with resizable targets, but may not
yield intuitive results.

`snap` targets have `x` and `y` number props and an optional `range` number
property.

`relativePoints`
----------------

```javascript
interact(element).draggable({
  modifiers: [
    interact.modifiers.snap({
      targets: [ { x: 300, y: 300 } ],
      relativePoints: [
        { x: 0  , y: 0   },   // snap relative to the element's top-left,
        { x: 0.5, y: 0.5 },   // to the center
        { x: 1  , y: 1   }    // and to the bottom-right
      ]
    })
  ]
})
```

If you want to specify for `snap` (not `snapSize` or `snapEdges`) the points on
the element which snapping should be relative to, then use an array of
`relativePoints`. Each item in the array should be an object with `x` and `y`
properties which are scalars specifying the position on the element to which
snapping should be relative. If no `relativePoints` array is specified or the
array is empty then snapping is relative to the pointer coordinates (default).

There are effectively `targets.length * max( relativePoints.length, 1 )` snap
targets while snap calculations are done. Snap functions are called multiple
times with the coordinates at each `relativePoint`.

`offset`
--------

```javascript
interact(element1).draggable({
  modifiers: [
    interact.modifiers.snap({
      targets: [ { x: 300, y: 300 } ],
      offset: { x: 20, y: 20 }
    })
  ]
})

interact(element2).resizable({
  modifiers: [
    interact.modifiers.snap({
      targets: [ { x: 300, y: 300 } ],
      offset: 'startCoords'
    })
  ]
})
```

The `offset` option lets you shift the coordinates of the targets of a `snap`
modifier. The value may be:

 - an object with `x` and `y` properties,
 - `'startCoords'` which will then use the `pageX` and `pageY` at the start of
   the action,
 - `'self'` which will use the target element's top-left coordinates,
 - or `'parent'` which will use the top-left coordinates of the target's parent
   element

`snapSize()`
============

```js
interact(target).resizable({
  edges: { top: true, left: true },
  modifiers: [
    interact.modifiers.snapSize({
      targets: [
        { width: 100 },
        interact.createSnapGrid({ width: 100, height: 100 })
      ]
    })
  ]
})
```

The `snapSize` modifier snaps the *dimensions* of targets when resizing. A
`snapSize` target is an object with `x` and `y` number props *or* `width` and
`height` number props as well as an optional `range`.  Its targets have `x` and
`y` number props *or* `width` and `height` number props as well as an optional
`range`.

`snapEdges()`
=============

```js
interact(target).resizable({
  edges: { top: true, left: true },
  modifiers: [
    interact.modifiers.snapEdges({
      targets: [
        interact.createSnapGrid({ top: 100, left: 100 })
      ]
    })
  ]
})
```

The `snapSize` modifier snaps the *edges* of targets when resizing.  Its targets
have either `x` and `y` number props to snap the left/right and top/bottom edges
respectively, `top`, `left`, `width` and `height` number props to snap each edge
and an optional `range`.

`targets` option
----------------

The coordinates of action events are compared to the targets of the provided snap
modifiers. If multiple targets are within range, the closest target is used.

```js
interact.modifiers.snap({
  targets: [
    function (
      // the x and y page coordinates,
      x, y,
      // the current interaction
      interaction,
      // the offset information with relativePoint if set
      { x: offsetX, y: offsetY, relativePoint, index: relativePointIndex },
      // the index of this function in the options.targets array
      index) {
      return {
        x: x,
        y: (75 + 50 * Math.sin(x * 0.04)),
        range: 40,
      }
    }
  ]
})
```

You can use functions in the `targets` array. If a snap target is a function,
then it is called and given the `x` and `y` coordinates of the event as the
first two parameters and the interaction as the third parameter.  The return
value of the function is used as a target.

If a target omits an axis or edge prop, then the corresponding axis will not be
changed. For example, if a target is defined as `{ y: 100, range Infinity }`
then the snapped movement will be horizontal at `(100, pointerEventPageX)`.

Snap grids
----------

```javascript
var gridTarget = interact.createSnapGrid({
  // can be a pair of x and y, left and top,
  // right and bottom, or width, and height
  x: 50,
  y: 50,

  // optional
  range: 10,

  // optional
  offset: { x: 5, y: 10 },

  // optional
  limits: {
    top: 0,
    left: 0,
    bottom: 500,
    height: 500
  }
})

interact(element).draggable({
  modifiers: [
    interact.modifiers.snap({ targets: [gridTarget] })
  ]
})
```

You can use the `interact.createSnapGrid()` method to create a target that snaps
to a grid. The method takes an object describing a grid and returns a function
that snaps to the corners of that grid.

The properties of the grid are:

 - `x`, `y`: the spacing between the horizontal and vertical grid lines.
 - `range` (optional): the distance from the grid corners within which the
   pointer coords will be snapped.
 - `offset` (optional): an object with `x` and `y` props to offset the grid
   lines
 - `limits` (optional): an object with `top`, `left`, `bottom` and `right` props
   to set the bounds of the grid

`range`
-------

```javascript
interact(element).draggable({
  modifiers: [
    interact.modifiers.snap({
      targets: [
        { x: 20, y: 450, range: 50 }
        { x: 10, y: 0 /* use default range below */}
      ],
      range: 300 // for targets that don't specify a range
    })
  ]
})
```

A range can be specified in the snap modifier options and each target may
optionally have its own range. The `range` of a snap target is the distance the
pointer must be from the target's coordinates for a snap to be possible.

i.e. `inRange = distance <= range`.
