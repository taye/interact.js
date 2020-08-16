---
title: Intro
---

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

Installation
============

interact.js offers two sets of packages that you can add to your project:

 1. To get started quickly, you can use the package named `interactjs` on npm.
 This package contains all the features of the library already pre-bundled.
  2. If you'd like to keep your JS payload small, there are npm packages under
 the `@interactjs/` scope which let you choose which features to include. These
 packages are distributed as ES6 modules and may need to be transpiled for older
 browsers.

npm pre-bundled
---------------

```sh
# install pre-bundled package with all features
$ npm install --save interactjs
```

```js
// es6 import
import interact from 'interactjs'
// or if using commonjs or AMD
const interact = require('interactjs')
```

To use the pre-bundled package with [npm](https://docs.npmjs.com/about-npm/),
install the package as a dependency with `npm install interactjs` then import or
require the package in your JavaScript files.

CDN pre-bundled
---------------

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

npm streamlined
---------------

```sh
# install only the features you need
$ npm install --save @interactjs/interact \
  @interactjs/auto-start \
  @interactjs/actions \
  @interactjs/modifiers \
  @interactjs/dev-tools
```

```js
// vendors.js
import '@interactjs/auto-start'
import '@interactjs/actions/drag'
import '@interactjs/actions/resize'
import '@interactjs/modifiers'
import '@interactjs/dev-tools'

// component.js
import interact from '@interactjs/interact'

interact('.item').draggable({
  listeners: {
    move (event) {
      console.log(event.pageX, event.pageY)
    }
  }
})
```

For a more streamlined JS payload, you can install and import the package for
each feature you need:

| Package name                            | Description                                            |
| --------------------------------------- | ------------------------------------------------------ |
| `@interactjs/interact`                  |**(required)** provides the `interact()` method         |
| [`@interactjs/actions`](action-options) | Drag, resize, gesture actions                          |
| [`@interactjs/auto-start`](auto-start)  | Start actions with pointer down, move sequence         |
| [`@interactjs/modifiers`](modifiers)    | Snap, restrict, etc. modifiers                         |
| `@interactjs/snappers`                  | Provides `interact.snappers.grid()` utility            |
| [`@interactjs/inertia`](inertia)        | Drag and resize inertia-like throwing                  |
| [`@interactjs/reflow`](reflow)          | `interactable.reflow(action)` method to trigger modifiers and event listeners |
| `@interactjs/dev-tools`                 | Console warnings for common mistakes (optimized out when `NODE_ENV === 'production'`) |

CDN streamlined
---------------

```html
<script type="module">
import 'https://cdn.interactjs.io/v1.9.20/auto-start/index.js'
import 'https://cdn.interactjs.io/v1.9.20/actions/drag/index.js'
import 'https://cdn.interactjs.io/v1.9.20/actions/resize/index.js'
import 'https://cdn.interactjs.io/v1.9.20/modifiers/index.js'
import 'https://cdn.interactjs.io/v1.9.20/dev-tools/index.js'
import interact from 'https://cdn.interactjs.io/v1.9.20/interactjs/index.js'

interact('.item').draggable({
  onmove(event) {
    console.log(event.pageX,
                event.pageY)
  }
})
</script>
```

The packages above are also available on
`https://cdn.interactjs.io/v[VERSION]/[UNSCOPED_NAME]`. You can import them in
modern browser which support ES6 `import`s.

Ruby on Rails
-------------

[Rails 5.1+](https://rubyonrails.org/) supports the [yarn](http://yarnpkg.com/)
package manager, so you can add interact.js to you app by running `yarn add
interactjs`. Then require the library with:

```rb
//= require interactjs/interact
```

Actions
=======

<h2 id="draggable" class="title is-4"><router-link to="/docs/draggable">Draggable</router-link></h2>

<!-- TODO -->
 - for watching the pointer go down, move, then go back up
 - combined with dropzones

<h2 id="dropzone" class="title is-4"><router-link to="/docs/dropzone">Dropzone</router-link></h2>

<!-- TODO -->
 - use this to define elements that other draggable elements can be moved into
 - doesn't actually re-parent the draggable elements; that's up to you

<h2 id="resizable" class="title is-4"><router-link to="/docs/resizable">Resizable</router-link></h2>

<!-- TODO -->
 - for watching the size and position of an element while the pointer is used to
   move one or two of the element's edges
 - `event.rect` and `event.deltaRect`
 - there are some modifiers that are specifically for resizing which change the
   way the element's edges and size are updated in response to the pointer

<h2 id="gesturable" class="title is-4"><router-link to="/docs/gesturable">Gesturable</router-link></h2>

<!-- TODO -->
 - for 2-finger gestures
 - provide angle, scale and distance
