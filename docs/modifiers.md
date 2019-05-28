Modifiers
=========

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
}),

interact(target)
  .draggable({
    // apply the restrict and then the snap modifiers to drag events
    modifiers: [restrictToParent, snap100x100],
  })
  .on('dragmove', event => console.log(event.pageX, event.pageY))
```

`interact`'s `modifiers` let you change the coordinates of action events. The
options object passed to action methods can have a `modifiers` array which will
be applied to events of that action type. **Modifiers in the array are applied
sequentially** and their order may affect the final result.

```js
const snapAtEnd = interact.modifiers.snap({
  endOnly: true,
  targets: [/* ... */],
})
```

Modifiers can be set to apply only to the last move event in an interaction by
setting their `endOnly` option to `true`. When an `endOnly` modifier is used
with an action that has `inertia` enabled, the event coordinates will be
smoothly moved from the up coords to the modified coords.

interact.js comes with a vew different types of modifiers for
<router-link to="snapping">snapping</router-link> and
<router-link to="restriction">restricting</router-link>
elements.
