---
title: Inertia
---

```javascript
interact(target)
  .draggable({
    inertia: true
  })
  .resizable({
    inertia: {
      resistance: 30,
      minSpeed: 200,
      endSpeed: 100
    }
  })
```

Inertia allows drag and resize actions to continue after the user releases the
pointer at a fast enough speed. The required launch speed, end speed and
resistance can optionally be configured with the settings below.

If an action ends without inertia but is snapped or restricted with the
`endOnly` option, then the the coordinates are interpolated from the end coords
to the snapped/restricted coords.

## Options

- **`resistance`** is a number greater than zero which sets the rate at which
  the action slows down. Higher values slow it down more quickly.

- **`endSpeed`** is the speed (pixels per second) at which the action is
  considered to have stopped.

- **`allowResume`** is a `boolean` value which indicates whether the user
  should be allowed to resume an action while it is in the inertia phase.

- **`smoothEndDuration`** is the duration (milliseconds) of the interpolated
  movement from the actual end coords to the modified coords with `endOnly`.
  Set the value to `0` to disable end transitions with `endOnly` snap/restrict.

When inertia is resumed, the difference between the start and resume coordinates
relative to the target's top left corner, isn't reflected in the next
`{action}move` events. Instead, an `{action}resume` event is fired when the
pointer goes back down during inertia before regular "{action}move" events are
fired again. If you need the difference in coords, you should listen to this
event and respond to it as you would to an `{action}move` event.
