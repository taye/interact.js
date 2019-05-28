Reflow
======

```js
const interactable = interact(target)
const drag = { name: drag, axis: 'x' }
const resize = {
  name: resize,
  edges: { left: true, bottom: true }
}

interactable.reflow(drag)
interactable.reflow(resize)
```

The reflow method lets you trigger an action start -> move -> end sequence which
runs modifiers and does drop calculations, etc. If your interactable target is a
CSS selector, an interaction will be run for each matching element. If the
elements have inertia, `endOnly` modifiers and `smoothEndDuration`, then the
interactions may be run asynchronously. The reflow method returns a `Promise`
which is resolved when all interactions are complete.
