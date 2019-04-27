FAQ
===

This page contains questions and issues that are frequently raised on [Gitter
chat][gitter] and [Github issues][gh-issues].

Start action after hold
=======================

Use the `hold` option which takes the number of milliseconds that the pointer
must be held down for.

```javascript
interact(target)
  .draggable({
    // start dragging after the pointer is held down for 1 second
    hold: 1000
  })
```

If you are having problems with default browser behaviour like scrolling,
context menus, etc. have a look at the
[`Interactable#preventDefault`][prevent-default] method and this [thread on
Github](https://github.com/taye/interact.js/issues/138).

Clone target draggable
======================

```html
<div class="item"></div>
```

```javascript
interact('.item')
  .draggable({ manualStart: true })
  .on('move', function (event) {
    var interaction = event.interaction;

    // if the pointer was moved while being held down
    // and an interaction hasn't started yet
    if (interaction.pointerIsDown && !interaction.interacting()) {
      var original = event.currentTarget,
          // create a clone of the currentTarget element
          clone = event.currentTarget.cloneNode(true);

      // insert the clone to the page
      // TODO: position the clone appropriately
      document.body.appendChild(clone);

      // start a drag interaction targeting the clone
      interaction.start({ name: 'drag' },
                        event.interactable,
                        clone);
    }
  });
```

There's no direct API to drag a clone of the target element. However, you can
use [`Interaction#start`][interaction-start] to change the target of an
interaction to any element that you create.

Remove / destroy / release
==========================

```javascript
interact(target)
  .draggable(true)
  .resizable(true);

interact.isSet(target);         // true

interact(target).unset();

interact.isSet(target);         // false
interact(target).draggable();   // false
interact(target).resizable();   // false
```

To remove an Interactable, use `interact(target).unset()`. That should remove
all event listeners and make interact.js forget completely about the target.

Changing dropzones while dragging
=================================

```javascript
interact.dynamicDrop(true);
```

If you're adding or removing dropzone elements or changing their dimensions
while dragging, you may need to change the [`dynamicDrop`][dynamic-drop] setting
to true so that the dropzones rects are recalculated after every `dragmove`.

Drag handle
===========


```html
<div class="item">
  A draggable item
  <div class="handle"> Handle </div>
</div>
```

```javascript
interact('.item')
  .draggable({
    allowFrom: '.handle',
  });
```

To make an element be the handle of a parent draggable, use the allowFrom
setting option to allow an action to start only if the element matches a
certain CSS selector or is a specific element.

Prevent actions on child
========================

```html
<div class="resizable">
  A resizable item
  <textarea></textarea>
</div>
```

```javascript
interact('.item')
  .draggable({
    // don't drag from textarea elments
    ignoreFrom: 'textarea',
  });
```

Use the `ignoreFrom` option to prevent actions from starting if the pointer
went down on an element matching the given selector or HTMLElement.

Revert / restore / undo drag position
=====================================

There's no direct API to revert a dragged element to it's position before the
drag. To do this, you must store the position at `dragstart` and change the
element's style so that it returns to the start position on `dragend`. You can
use CSS transitions to animate change in position.

Dragging scrolls instead
========================

```css
.draggable, .resizable, .gesturable {
  -ms-touch-action: none;
  touch-action: none;
  user-select: none;
}
```

To allow touch interactions without scrolling or zooming, use the [`touch-action` CSS
property][touch-action].

Dragging between iFrames
=======================

There is [limited support][iframe-pr] for using interact.js across iFrames. There are
currently browser inconsistencies and other issues which have yet to be
addressed.

[gitter]: https://gitter.im/taye/interact.js
[gh-issues]: http://git.io/srWhdg
[manual-start]: /docs#manualstart
[interaction-start]: /api/Interaction.html#start
[prevent-default]: /api/Interactable.html#preventDefault
[dynamic-drop]: /api/module-interact.html#.dynamicDrop
[touch-action]: https://developer.mozilla.org/en-US/docs/Web/CSS/touch-action
[iframe-pr]: https://github.com/taye/interact.js/pull/98
