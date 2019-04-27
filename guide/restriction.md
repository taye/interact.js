Restrict
========

interact.js has 3 restriction modifiers:

  - pointer coordinate-based `restrict`
  - element size-based `restrictSize` (resize only)
  - and element edge-based `restrictEdges` (resize only)

`restrict()`
============

```javascript
interact(target)
  .draggable({
    modifiers: [
      interact.modifiers.restrict({
        restriction: 'parent',
        endOnly: true
      })
    ]
  })
```

The `restriction` value specifies the area that the action will be confined to.
The value can be:

 - a rect object with `top`, `left`, `bottom` and `right` or `x`, `y`,
 `width` and `height`,
 - an element whose dimensions will be used as the restriction area,
 - a function which takes `(x, y, element)` and returns a rect or an element
 - one of these strings:
  - `'self'` – restrict to the target element's rect
  - `'parent'` – restrict to the rect of the element's parentNode or
 - a CSS selector string – if one of the parents of the target element matches
 this selector, it's rect will be used as the restriction area.

`elementRect`
-------------

With the `restrict` variant, restricting is by default relative to the pointer
coordinates so that the action coordinates, not the element's dimensions, will
be kept within the restriction area. The `elementRect` option changes this so
that the element's edges are considered while dragging.

```javascript
interact(target).draggable({
    modifiers: [
      interact.modifiers.restrict({
        elementRect: { left: 0, right: 0, top: 1, bottom: 1 }
      })
    ]
  })
```

For the left and right properties, 0 means the left edge of the element and 1
means the right edge. For top and bottom, 0 means the top edge of the element
and 1 means the bottom.

`{ top: 0.25, left: 0.25, bottom: 0.75, right: 0.75 }` would result in a quarter
of the element being allowed to hang over the restriction edges.

`restrictSize()`
================

```javascript
interact(target).resizable({
    modifiers: [
      interact.modifiers.restrictSize({
        min: { width: 100, height: 100 },
        max: { width: 500, height: 500 },
      })
    ]
  })
```

`restrictSize` lets you specify the minimum and maximum dimensions that the
target element must have when resizing.

`restrictEdges()`
=================

```javascript
interact(target).resizable({
    modifiers: [
      interact.modifiers.restrictEdges({
        inner: {
          left: 100, // the left edge must be <= 100
          right: 200, // the right edge must be >= 200
        },
        outer: {
          left: 0, // the left edge must be >= 0
          right: 300, // the right edge must be <= 300
        },
      })
    ]
  })
```

`restrictEdges` lets you specify `inner` and `outer` dimensions that the target
element must have when resizing. You can think of `inner` as setting the minimum
size of the element and `outer` as the maximum size.
