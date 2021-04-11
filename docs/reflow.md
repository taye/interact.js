---
title: Reflow
---

The reflow method lets you trigger an action start -> move -> end sequence which
runs modifiers and does drop calculations, etc. If your interactable target is a
CSS selector, an interaction will be run for each matching element.

<LiveDemo :demoHtml="import('@/demos/reflow.html?raw')"/>

If the elements have inertia, `endOnly` modifiers and `smoothEndDuration`, then
the interactions may not end immediately. The reflow method returns a `Promise`
which is resolved when all interactions are complete. So you can `await` or
`.then()` multiple reflows

```js
const interactable = interact(target).draggable({}).resizable({})

async function onWindowResize () {
  // start a resize action and wait for inertia to finish
  await interactable.reflow({ name: drag, axis: 'x' })

  // start a drag action
  await interactable.reflow({
    name: 'resize',
    edges: { left: true, bottom: true },
  })
}

window.addEventListener(onWindowResize, 'resize')
```
