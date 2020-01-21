---
title: Migrating from `v1.2` to `v1.3`
---

`v1.3` fixes several bugs, allows setting more options on a per-action basis,
adds configuration options to `pointerEvents` and adds several new methods and
options. The [changelog][changelog-v1.3.0] lists all the major changes.

Removed Methods
---------------

The methods in the table below were removed and replaced with action method options:

| Method                                                      | Replaced with                                                    |
| ----------------------------------------------------------- | ---------------------------------------------------------------- |
| `interactable .squareResize(bool)`                          | `interactable .resizable({ square: bool })`                      |
| `interactable .snap({ actions: ['drag'], ...snapOptions })` | `interactable .draggable({ snap: snapOptions })`                 |
| `interactable .restrict({ restriction: 'self' })`           | `interactable .draggable({ restrict: { restriction: 'self' } })` |
| `interactable .inertia(true)`                               | `interactable .draggable({ inertia: true })`                     |
| `interactable .accept('.can-be-dropped')`                   | `interactable .dropzone({ accept: '.can-be-dropped' })`          |
| `interact .margin(50)`                                      | `interactable .resizable({ margin: 60 })`                        |

Improved resize snap and restrict
--------------------------

There's 1 new snap modifier and 2 new resize modifiers for resize actions:

 - `snapSize: { min: rectLike, max: rectLink }`
 - `restrictSize: { min: rectLike, max: rectLink }`
 - `restrictEdges: { outer: rectLike, inner: rectLink }`

```js
interact(target).resize({
  edges: { bottom: true, right: true },

  // sizes at fixed grid points
  snapSize: {
    targets: [
      interact.createSnapGrid({ x: 25, y: 25, range: Infinity }),
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
});
```

Action end event dx/dy
----------------------

The `dx` and `dy` fields on `dragend`, `resizeend` and `gestureend` events were
formally the difference between the start and end coordinates. Now they are
always `0` (the difference between the end and the last move event). Use
`event.X0` and `event.Y0` (or `event.clientX0` and `event.clientY0`) to get the
starting coordinates and subtract them from the end event coordinates.

```js
interact(target).draggable({
  onend: function (event) {
    console.log(event.pageX - event.X0, event.pageY - event.Y0);
  },
});
```

Drop events
-----------

`dragend` events are now fired *before* `drop` events. Use
`dragendEvent.relatedTarget` to get the dropzone element if there will be a drop
event.

Mouse buttons
-------------

By default, only the left mouse button can start actions. The `mouseButtons`
action option can be used to change this.

[changelog-v1.3.0]: https://github.com/taye/interact.js/blob/master/CHANGELOG.md#v130
