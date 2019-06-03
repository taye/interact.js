<p class="title is-3">
interact.js is a JavaScript library for drag and drop, resizing and multi-touch
gestures with inertia and snapping for modern browsers (and also IE9+).
</p>

Its aim is to **present pointer input data consistently** across different
browsers and devices and provide convenient ways to **pretend that the user's
pointer moved in a way that it wasn't really moved** (snapping, inertia, etc.).

The `interact` function takes an element or a CSS selector string returns an
`Interactable` object which has various methods to configure actions and event
listeners. A sequence of pointer down, move and up inputs can lead to
`InteractEvent`s being fired. If you add event listeners for an event type,
those listener functions are given an `InteractEvent` object which provides
pointer coordinates and speed and, in gesture events, scale, distance, angle,
etc.

Note that **interact.js doesn't move elements for you**.  Styling an
element so that it moves while a drag happens has to be done from your own event
listeners. This way, you’re in control of everything that happens.

The basic steps to setting up your targets are:

 1. Create an `Interactable` target.
 2. Configure it to enable actions and add modifiers, inertia, etc.
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
        restriction: 'self'            // keep the drag coords within the element
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

Installation
============

NPM
---

```sh
$ npm install --save interactjs
```

```js
import interact from 'interactjs'

// or if using commonjs or AMD
const interact = require('interactjs')
```

If you're using [npm](https://docs.npmjs.com/about-npm/), install the package as
a dependency with `npm install interactjs` then import or require the
package in your JavaScript files.

CDN
---

```html
<script src="https://cdn.jsdelivr.net/npm/interactjs/dist/interact.min.js"></script>
<!-- or -->
<script src="https://unpkg.com/interactjs/dist/interact.min.js"></script>
```

You can also use the [jsDelivr](https://www.jsdelivr.com/package/npm/interactjs)
or [unpkg](https://unpkg.com/interactjs) CDNs by adding a `<script>` tag
pointing to their servers.

`interact` is exposed as a CommonJS module, an AMD module, or a global variable
depending on what the environment supports.

```sh
# install just the type definitions
$ npm install --save-dev @interactjs/types
```

If you're using the library only through a CDN and want the TypeScript type
definitions for development, you can install the `@interactjs/types` package as
a dev dependency.

Ruby on Rails
-------------

[Rails 5.1+](https://rubyonrails.org/) supports the [yarn](http://yarnpkg.com/)
package manager, so you can add interact.js to you app by running `yarn install
interactjs`. Then require the library with:

```rb
//= require interactjs/interact
```

Drag, Resize and Gesture Actions
================================

The `Interactable` methods `draggable()`, `resizable()` and `gesturable()` are
used to enable and configure actions for target elements. They all have some
common options as well as some action-specific options and event properties.

The common options for all actions include:

 - A `modifiers` array for applying snap, restrict, etc. to the action events
 - A `listeners` array or object for adding action event listener functions.
 - `onstart`, `onmove` and `onend` functions to add single listeners for action
   start, move and end events respectively.

Drag and resize actions (but not gesture) can also have an `inertia`
property which may be a `boolean` to enable or disable inertia, or an object with
inertia configuration.

`InteractEvent`s have the following properties common to all action types:

| InteractEvent property  | Description                                       |
| ----------------------- | --------------------------------------------------|
| `target`                | The element that is being interacted with         |
| `interactable`          | The Interactable that is being interacted with    |
| `interaction`           | The Interaction that the event belongs to         |
| `x0`, `y0`              | Page x and y coordinates of the starting event    |
| `clientX0`, `clientY0`  | Client x and y coordinates of the starting event  |
| `dx`, `dy`              | Change in coordinates of the mouse/touch          |
| `velocityX`, `velocityY`| The Velocity of the pointer                       |
| `speed`                 | The speed of the pointer                          |
| `timeStamp`             | The time of creation of the event object          |

<h2 class="title is-3"><router-link to="draggable">Draggable</router-link></h2>

<!-- TODO -->
 - for watching the pointer go down, move, then go back up
 - combined with dropzones

<h2 class="title is-3"><router-link to="dropzone">Dropzone</router-link></h2>

<!-- TODO -->
 - use this to define elements that other draggable elements can be moved into
 - doesn't actually re-parent the draggable elements; that's up to you

<h2 class="title is-3"><router-link to="resizable">Resizable</router-link></h2>

<!-- TODO -->
 - for watching the size and position of an element while the pointer is used to
   move one or two of the element's edges
 - `event.rect` and `event.deltaRect`
 - there are some modifiers that are specifically for resizing which change the
   way the element's edges and size are updated in response to the pointer

<h2 class="title is-3"><router-link to="gesturable">Gesturable</router-link></h2>

<!-- TODO -->
 - for 2-finger gestures
 - provide angle, scale and distance
