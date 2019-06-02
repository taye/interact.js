Common Action Options
=====================

The Interactable methods `draggable`, `resizable` and `gesturable` take either
`true` or `false` to simply allow/disallow the action or an object with
properties to change certain settings.

`max`
-----

`max` is used to limit the number of concurrent interactions that can target an
interactable. By default, any number of interactions can target an
interactable.

`maxPerElement`
---------------

By default only 1 interaction can target the same interactable+element
combination. If you want to allow multiple interactions on the same target
element, set the `maxPerElement` property of your object to a value `>= 2`.

`manualStart`
-------------

If this is changed to `true` then drag, resize and gesture actions will have to
be started with a call to [`Interaction#start`][interaction-start] as the usual
`down`, `move`, `<action>start`... sequence will not start an action.

`hold`
------

The action will start after the pointer is held down for the given number of milliseconds.

`inertia`
---------

Change inertia settings for drag, and resize. See [docs/inertia](<%= url_for '/docs/inertia' %>).

`autoScroll`
------------

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

`allowFrom` (handle)
--------------------

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

`ignoreFrom`
------------

```html
<div id="movable-box">
  <div id="undraggable-when-on-this-element" />
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
```

Like `allowFrom`, `ignoreFrom` gives you the ability to avoid certain
elements in your interactable element. Which is good when certain
elements need to maintain default behavior when interacted with.

For example, dragging around a text/contentEditable, by wrapping this
object with a draggable element and ignoring the editable content you
maintain the ability to highlight text without moving the element.

`enabled`
---------

Enable the action for the Interactable. If the options object has no `enabled`
property or the property value is `true` then the action is enabled. If
`enabled` is false, the action is disabled.
