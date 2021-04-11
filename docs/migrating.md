---
title: Migrating from v1.2
---

The latest versions fix several bugs, allows setting more options on a
per-action basis, add configuration options to `pointerEvents` and add several
new methods and options. The [changelog][changelog] lists all the major changes.

### Per-action modifiers array

Modifiers are now created with `interact.modifiers[modifierName](options)`
methods. The return values returned by these methods go into the
`actionOptions.modifiers` array. The lets you more easily reuse modifier
configurations and specify their execution order.

```js
// create a restrict modifier to prevent dragging an element out of its parent
const restrictToParent = interact.modifiers.restrict({
  restriction: 'parent',
  elementRect: { left: 0, right: 0, top: 1, bottom: 1 },
})

// create a snap modifier which changes the event coordinates to the closest
// corner of a grid
const snap100x100 = interact.modifiers.snap({
  targets: [interact.snappers.grid({ x: 100, y: 100 })],
  relativePoints: [{ x: 0.5, y: 0.5 }],
})

interact(target)
  .draggable({
    // apply the restrict and then the snap modifiers to drag events
    modifiers: [restrictToParent, snap100x100],
  })
  .on('dragmove', event => console.log(event.pageX, event.pageY))
```

### Improved resize snap and restrict

There are a few new snap and restrict modifiers for resize actions:

[Restrictions](/docs/restriction):

- pointer coordinate-based `restrict`
- element rect-based restriction `restrictRect`
- element size-based `restrictSize` (resize only)
- and element edge-based `restrictEdges` (resize only)

[Snapping](/docs/snapping):

- pointer coordinate-based `snap` which is best suited to drag actions,
- `snapSize` which works only on resize actions and let's you set targets for
  the size of the target element,
- and `snapEdges` which is similar to `snapSize`, but let's you set the target
  positions of the edges of the target element.

```js
interact(target).resize({
  edges: { bottom: true, right: true },

  // sizes at fixed grid points
  snapSize: {
    targets: [
      interact.snappers.grid({ x: 25, y: 25, range: Infinity }),
    ],
  },

  // minimum size
  restrictSize: {
    min: { width: 100, height: 50 },
  },

  // keep the edges inside the parent
  restrictEdges: {
    outer: 'parent',
    endOnly: true,
  },
})
```

### Resize `aspectRatio` modifier

The resize `preserveAspectRatio` and `square` options have been replaced by an
`aspectRatio` modifier which can cooperate with other modifiers.

```js
interact(target).resizable({
  edges: { left: true, bottom: true },
  modifiers: [
    interact.modifiers.aspectRatio({
      // ratio may be the string 'preserve' to maintain the starting aspect ratio,
      // or any number to force a width/height ratio
      ratio: 'preserve',
      // To add other modifiers that respect the aspect ratio,
      // put them in the aspectRatio.modifiers array
      modifiers: [interact.modifiers.restrictSize({ max: 'parent' })],
    }),
  ],
})
```

```js
interact(target).resizable({
  modifiers: [
    interact.modifiers.aspectRatio({
      // The equalDelta option replaces the old resize.square option
      equalDelta: true,
    }),
  ],
})
```

### Removed Methods

The methods in the table below were removed and replaced with action method
options and modifier methods for the new modifiers array API:

| Method                                                     | Replaced with                                          |
| ---------------------------------------------------------- | ------------------------------------------------------ |
| `interactable.squareResize(bool)`                          | `interact.modifiers.aspectRatio({ equalDelta: true })` |
| `interactable.snap({ actions: ['drag'], ...snapOptions })` | `interact.modifiers.snap(snapOptions)`                 |
| `interactable.restrict(restrictOptions)`                   | `interact.modifiers.restrict(restrictOptions)`         |
| `interactable.inertia(true)`                               | `interactable.draggable({ inertia: true })`            |
| `interactable.accept('.can-be-dropped')`                   | `interactable.dropzone({ accept: '.can-be-dropped' })` |
| `interact.margin(50)`                                      | `interactable.resizable({ margin: 50 })`               |

### Action end event dx/dy

The `dx` and `dy` fields on `dragend`, `resizeend` and `gestureend` events were
formally the difference between the start and end coordinates. Now they are
always `0` (the difference between the end and the last move event). Use
`event.X0` and `event.Y0` (or `event.clientX0` and `event.clientY0`) to get the
starting coordinates and subtract them from the end event coordinates.

```js
interact(target).draggable({
  onend: function (event) {
    console.log(event.pageX - event.X0, event.pageY - event.Y0)
  },
})
```

### Drop events

`dragend` events are now fired _before_ `drop` events. Use
`dragendEvent.relatedTarget` to get the dropzone element if there will be a drop
event.

### Mouse buttons

By default, only the left mouse button can start actions. The `mouseButtons`
action option can be used to change this.

[changelog]: https://github.com/taye/interact.js/blob/master/CHANGELOG.md
