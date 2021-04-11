---
title: 'AutoStart (manualStart: false)'
---

The [pre-bundled](/docs/installation) package includes the `auto-start` plugin
which will start interactions when the pointer goes down and then moves on
enabled target elements. You can disable this for an action by setting the
`manualStart` option to `true`.

```js
interact(target)
  .draggable({
    manualStart: true,
  })
  .on('doubletap', function (event) {
    var interaction = event.interaction

    if (!interaction.interacting()) {
      interaction.start(
        { name: 'drag' },
        event.interactable,
        event.currentTarget,
      )
    }
  })
```

With `manualStart: true`, you will need to start the action from a pointer event
listener by calling `event.interaction.start(actionInfo)`. Because the library
no longer decides when to start actions, the cursor will not be set
automatically.
