Resizable
=========

```javascript
interact(target)
  .resizable({
    edges: {
      top   : true,       // Use pointer coords to check for resize.
      left  : false,      // Disable resizing from left edge.
      bottom: '.resize-s',// Resize if pointer target matches selector
      right : handleEl    // Resize if pointer target is the given Element
    }
  })
```

Resize events have `rect` and `deltaRect` properties. `rect` is updated on each
`resizemove` event and the values in `deltaRect` reflect the changes. In
`resizestart`, `rect` will be identical to the rect returned by
`interactable.getRect(element)` and `deltaRect` will have all-zero properties.

| Resize Event property   | Description                                       |
| ----------------------- | --------------------------------------------------|
| `edges`                 | The edges of the element that are being changed   |
| `rect`                  | An object with the new dimensions of the target   |
| `deltaRect`             | The change in dimensions since the previous event |

Resizable options have an `edges` property which specifies the edges of the
element which can be resized from (top, left, bottom or right).

<aside class="notice">
Remember to use CSS `touch-action: none` to prevent the browser from panning
when the user drags with a touch pointer, and `user-select: none` to disable
text selection.
</aside>

```html
<div data-x=0 data-y=0 class="resizable">
  <!-- top-left resize handle -->
  <div class="resize-top resize-left"></div>

  <!-- bottom-right resize handle -->
  <div class="resize-bottom resize-right"></div>
</div>
```
```js
interact('.resizable')
  .resizable({
    edges: {
      top   : '.resize-top',
      left  : '.resize-left',
      bottom: '.resize-bottom',
      right : '.resize-right'
    },
  })
  .on('resizemove', event => {
    let { x, y } = event.target.dataset

    x = parseFloat(x) || 0
    y = parseFloat(y) || 0

    Object.assign(event.target.style, {
      width: `${event.rect.width}px`,
      height: `${event.rect.height}px`,
      transform: `translate(${event.deltaRect.left}px, ${event.deltaRect.top}px)`
    })

    Object.assign(event.target.dataset, { x, y })
  })
```

If you'd like an element to behave as a resize corner, let it match the
selectors of two adjacent edges.

Resize handle elements must be children of the resizable element. If you need
the handles to be outside the target element, then you will need to use
[`Interaction#start`](interaction-start).

`invert`
--------

```javascript
interact(target).resizable({
  edges: { bottom: true, right: true },
  invert: 'reposition'
})
```

By default, resize actions can't make the `event.rect` smaller than `0x0`. Use
the `invert` option to specify what should happen if the target would be resized
to dimensions less than `0x0`. The possible values are:

 - `'none'` (default) will limit the resize rect to a minimum of `0x0`
 - `'negate'` will allow the rect to have negative width/height
 - `'reposition'` will keep the width/height positive by swapping the top and
 bottom edges and/or swapping the left and right edges

[Demo on Codepen][resize-codepen]

[interaction-start]: http://interactjs.io/api/#Interaction.start
[resize-codepen]: http://codepen.io/taye/pen/LEpmOL
