# modifiers

Use modifiers to change the coordinates of drag, resize and gesture events.

The `options` object passed to the action methods can have a `modifiers` array
which will be applied to events of that action type.

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
}),

// apply the restrict and then the snap modifiers to drag events
interact(target).draggable({
  modifiers: [restrictToParent, snap100x100],
})
```

Modifers in the array are applied sequentially and the order may affect the
result.
