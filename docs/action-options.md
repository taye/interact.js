---
title: Action Options
---

The `Interactable` methods `draggable()`, `resizable()` and `gesturable()` are
used to enable and configure actions for target elements. They all have some
common options as well as some action-specific options and event properties.

Drag, resizem and gesture interactions fire `InteractEvent`s which have the
following properties common to all action types:

| InteractEvent property   | Description                                      |
| ------------------------ | ------------------------------------------------ |
| `target`                 | The element that is being interacted with        |
| `interactable`           | The Interactable that is being interacted with   |
| `interaction`            | The Interaction that the event belongs to        |
| `x0`, `y0`               | Page x and y coordinates of the starting event   |
| `clientX0`, `clientY0`   | Client x and y coordinates of the starting event |
| `dx`, `dy`               | Change in coordinates of the mouse/touch         |
| `velocityX`, `velocityY` | The Velocity of the pointer                      |
| `speed`                  | The speed of the pointer                         |
| `timeStamp`              | The time of creation of the event object         |

## Common Action Options

The Interactable methods `draggable`, `resizable` and `gesturable` take either
`true` or `false` to simply allow/disallow the action or an object with
properties to change certain settings.

### `max`

`max` is used to limit the number of concurrent interactions that can target an
interactable. By default, any number of interactions can target an
interactable.

### `maxPerElement`

By default only 1 interaction can target the same interactable+element
combination. If you want to allow multiple interactions on the same target
element, set the `maxPerElement` property of your object to a value `>= 2`.

### `manualStart`

If this is changed to `true` then drag, resize and gesture actions will have to
be started with a call to [`Interaction#start`][interaction-start] as the usual
`down`, `move`, `<action>start`... sequence will not start an action. See
[auto-start](/docs/auto-start).

### `hold`

The action will start after the pointer is held down for the given number of milliseconds.

### `inertia`

Change inertia settings for drag, and resize. See [docs/inertia](/docs/inertia).

### `styleCursor`

If the [auto-start](/docs/auto-start) feature is enabled, interact will style
the cursor of draggable and resizable elements as you hover over them.

```js
interact(target).styleCursor(false)
```

To disable this for all actions, set the `styleCursor` option to `false`

### `cursorChecker`

```js
interact(target)
  .resizable({
    edges: { left: true, right: true },
    cursorChecker (action, interactable, element, interacting) {
      // the library uses biderectional arrows <-> by default,
      // but we want specific arrows (<- or ->) for each diriection
      if (action.edges.left) { return 'w-resize' }
      if (action.edges.right) { return 'e-resize' }
    },
  })
  .draggable({
    cursorChecker () {
      // don't set a cursor for drag actions
      return null
    },
  })
```

You can disable default cursors with `interact(target).styleCursor(false)`, but
that will disable cursor styling for all actions. To disable or change the
cursor for each action, you can set a `cursorChecker` function which takes info
about the current interaction and returns the CSS cursor value to set on the
target element.

### `autoScroll`

```javascript
interact(element)
  .draggable({
    autoScroll: true,
  })
  .resizable({
    autoScroll: {
      container: document.body,
      margin: 50,
      distance: 5,
      interval: 10,
      speed: 300,
    }
  })
```

Scroll a container (`window` or an HTMLElement) when a drag or resize move
happens at the edge of the container.

### `allowFrom` (handle)

```html
<div class="movable-box">
  <div class="drag-handle" />
  Content
  <div class="resize-handle" />
</div>
```

```javascript
interact('.movable-box')
  .draggable({
    allowFrom: '.drag-handle',
  })
  .resizable({
    allowFrom: '.resize-handle',
  })
  .pointerEvents({
    allowFrom: '*',
  })
```

The `allowFrom` option lets you specify a target CSS selector or Element which
must be the target of the pointer down event in order for the action to start.
This option available for drag, resize and gesture, as well as `pointerEvents`
(down, move, hold, etc.). Using the `allowFrom` option, you may specify handles
for each action separately and for all your pointerEvents listeners.

The `allowFrom` elements **must** be children of the target interactable
element. {.notice .info}

### `ignoreFrom`

```html
<div id="movable-box">
  <p class="content">Selectable text</p>
  <div no-pointer-event>Should not fire tap, hold, etc. events</div>
</div>
```

```javascript
var movable = document.querySelector('#movable-box')

interact(movable)
  .draggable({
    ignoreFrom: '.content',
    onmove: function (event) {
      /* ... */
    }
  })
  .pointerEvents({
    ignoreFrom: '[no-pointer-event]',
  })
  .on('tap', function (event) {
  })
```

The compliment to `allowFrom`, `ignoreFrom` lets you specify elements within
your target with which to avoid starting actions. This is useful when certain
elements need to maintain default behavior when interacted with. For example,
dragging around a text/contentEditable, by wrapping this object with a
draggable element and ignoring the editable content you maintain the ability to
highlight text without moving the element.

### `enabled`

Enable the action for the Interactable. If the options object has no `enabled`
property or the property value is `true` then the action is enabled. If
`enabled` is false, the action is disabled.

[interaction-start]: /docs/auto-start
