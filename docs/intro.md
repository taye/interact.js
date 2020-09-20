---
title: Intro
---

What is interact.js?
--------------------

<p class="title is-4">
interact.js is a JavaScript library for drag and drop, resizing and multi-touch
gestures with inertia and snapping for modern browsers (and also IE9+).
</p>

Its aim is to **present pointer input data consistently** across different
browsers and devices and provide convenient ways to **pretend that the user's
pointer moved in a way that it wasn't really moved** (snapping, inertia, etc.).

The `interact` function takes an element or a CSS selector string and returns an
`Interactable` object which has various methods to configure actions and event
listeners. Pointer interactions of down -> move -> up sequences begin drag,
resize, or gesture actions. By adding event listener functions for these action,
you can respond to `InteractEvent`s which provide pointer coordinates, speed,
element size, etc.

Note that **interact.js doesn't move elements for you**. Styling an element so
that it moves while a drag happens has to be done from your own event listeners.
This way, you’re in control of everything that happens.

Getting Started
---------------

After [installing the library](/docs/installation), the basic steps to setting
up your targets and interactions are:

 1. Create an `Interactable` target.
 2. Configure it to enable actions and add [modifiers](/docs/modifiers), [inertia](/docs/inertia), etc.
 3. Add event listeners to provide visual feedback and update your app's state.

For example, here's some code for [a very simple slider
input](https://codepen.io/taye/pen/GgpxNq):

<LiveDemo :demoHtml="require('@/demos/slider.html')" :removeNext="1" class="box"/>

```js
// Step 1
const slider = interact('.slider')    // target elements with the "slider" class

slider
  // Step 2
  .draggable({                        // make the element fire drag events
    origin: 'self',                   // (0, 0) will be the element's top-left
    inertia: true,                    // start inertial movement if thrown
    modifiers: [
      interact.modifiers.restrict({
        restriction: 'self'           // keep the drag coords within the element
      })
    ]
  })
  // Step 3
  .on('dragmove', function (event) {  // call this listener on every dragmove
    const sliderWidth = interact.getElementRect(event.target.parentNode).width
    const value = event.pageX / sliderWidth

    event.target.style.paddingLeft = (value * 100) + '%'
    event.target.setAttribute('data-value', value.toFixed(2))
  })
```

Actions
-------

interact.js supports 3 types of actions which are triggered by pointer down ->
move -> up sequences:

  - [Draggable](/docs/draggable) for moving elements or drawing on a canvas. This can be combined with [dropzones](/docs/dropzone) to implement drag and drop applications.
  - [Resizable](/docs/resizable) for watching the size and position of an element while the pointer is used to move one or two of the element's edges.
  - [Gesturable](/docs/gesturable) for 2-finger gestures with angle, scale, etc. data.
