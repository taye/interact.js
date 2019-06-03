Dropzone
========

Dropzones define elements that draggable targets can be "dropped" into and which
elements will be accepted. Like with drag events, drop events don't modify the
DOM to re-parent elements. You will have to do this in your own event listeners
if you need this.

```javascript
interact(dropTarget)
  .dropzone({
    ondrop: function (event) {
      alert(event.relatedTarget.id
            + ' was dropped into '
            + event.target.id)
    }
  })
  .on('dropactivate', function (event) {
    event.target.classList.add('drop-activated')
  })
```

Dropzone Events
---------------

Dropzone events are plain objects with the following properties:

| Property                | Description                                       |
| ----------------------- | --------------------------------------------------|
| `target`                | The dropzone element                              |
| `dropzone`              | The dropzone Interactable                         |
| `relatedTarget`         | The element that's being dragged                  |
| `draggable`             | The Interactable that's being dragged             |
| `dragEvent`             | The related drag event – drag{start,move,end}     |
| `timeStamp`             | Time of the event                                 |
| `type`                  | The event type                                    |

```javascript
interact('.dropzone').dropzone({
  accept: '.drag0, .drag1',
});
```

`accept`
--------

The dropzone `accept` option is a CSS selector or element which must match the
dragged element in order for drop events to be fired.

```javascript
interact(target).dropzone({
  overlap: 0.25
});
```

The `overlap` option sets how drops are checked for. The allowed values are:

 - `'pointer'` – the pointer must be over the dropzone (default)
 - `'center'` – the draggable element's center must be over the dropzone
 - a number from 0-1 which is the (intersection area) / (draggable area).  e.g.
 `0.5` for drop to happen when half of the area of the draggable is over the
 dropzone

`checker`
---------

The `checker` option is a function that you set to additionally check if a
dragged element can be dropped into a dropzone.

```javascript
interact(target).dropzone({
  checker: function (dragEvent,         // related dragmove or dragend
                     event,             // Touch, Pointer or Mouse Event
                     dropped,           // bool default checker result
                     dropzone,          // dropzone Interactable
                     dropElement,       // dropzone element
                     draggable,         // draggable Interactable
                     draggableElement) {// draggable element

    // only allow drops into empty dropzone elements
    return dropped && !dropElement.hasChildNodes();
  }
});
 ```

The checker function takes the following arguments:

| Arg                     | Description                                       |
| ----------------------- | --------------------------------------------------|
| `dragEvent`             | related dragmove or dragend event                 |
| `event`                 | The user move/up/end Event related to the dragEvent
| `dropped`               | The value from the default drop checker           |
| `dropzone`              | The dropzone interactable                         |
| `dropElement`           | The dropzone element                              |
| `draggable`             | The Interactable being dragged                    |
| `draggableElement`      | The actual element that's being dragged           |
