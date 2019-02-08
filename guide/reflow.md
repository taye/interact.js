Reflow
======

```js
const interactable = interact(target);
const drag = { name: drag, axis: 'x' };
const resize = { name: resize, edges: { left: true, bottom: true };

interactable.reflow(drag);
interactable.reflow(resize);

```

The reflow method lets you trigger an action start -> move -> end sequence which
runs modifiers and does drop calculations, etc.
