---
title: Draggable
---

Dragging is the simplest action interact.js provides. To make an element
draggable, create an interactable with your desired target then call the
`draggable` method with the options that you need.

<LiveDemo :demoHtml="import('@/demos/draggable/basic.html?raw')" :removeNext="3" hide-demo-only />

```html
<div class="draggable">Draggable Element</div>
```

```css
.draggable {
  touch-action: none;
  user-select: none;
}
```

```js
const position = { x: 0, y: 0 }

interact('.draggable').draggable({
  listeners: {
    start (event) {
      console.log(event.type, event.target)
    },
    move (event) {
      position.x += event.dx
      position.y += event.dy

      event.target.style.transform = `translate(${position.x}px, ${position.y}px)`
    },
  },
})
```

In addition to the common [`InteractEvent`](/docs/events#interactevents)
properties, `dragmove` events also have:

| Drag event property | Description                                       |
| ------------------- | ------------------------------------------------- |
| `dragEnter`         | The dropzone this Interactable was dragged over   |
| `dragLeave`         | The dropzone this Interactable was dragged out of |

Remember to use CSS `touch-action: none` to prevent the browser from panning
when the user drags with a touch pointer, and `user-select: none` to disable
text selection. {.notice .info}

## `lockAxis` and `startAxis`

```javascript
// lock the drag to the starting direction
interact(singleAxisTarget).draggable({
  startAxis: 'xy'
  lockAxis: 'start'
});

// only drag if the drag was started horizontally
interact(horizontalTarget).draggable({
  startAxis: 'x'
  lockAxis: 'x'
});
```

There are two options for controlling the axis of drag actions: `startAxis` and
`lockAxis`.

`startAxis` sets the direction that the initial movement must be in for the
action to start. Use `'x'` to require the user to start dragging horizontally or
`'y'` to start dragging vertically.

`lockAxis` causes the drag events to change only in the given axis. If a value
of `'start'` is used, then the drag will be locked to the starting direction.
