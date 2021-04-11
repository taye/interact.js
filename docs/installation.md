---
title: Installation
---

interact.js offers two sets of free packages that you can add to your project:

1.  To get started quickly, you can use the package named `interactjs` on npm.
    This package contains all the features of the library as an _ES5 bundled_.
2.  If you'd like to keep your JS payload small, there are npm packages under
    the `@interactjs/` scope which let you choose which features to include.
    These packages are distributed as _ES6 modules_ and may need to be
    transpiled for older browsers.

### npm pre-bundled

```sh
# install pre-bundled package with all features
$ npm install --save interactjs
```

```js
// es6 import
import interact from 'interactjs'
```

```js
// or if using commonjs or AMD
const interact = require('interactjs')
```

To use the pre-bundled package with [npm](https://docs.npmjs.com/about-npm/),
install the package as a dependency with `npm install interactjs` then import or
require the package in your JavaScript files.

### CDN pre-bundled

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

### npm streamlined

```sh
# install only the features you need
$ npm install --save @interactjs/interact \
  @interactjs/auto-start \
  @interactjs/actions \
  @interactjs/modifiers \
  @interactjs/dev-tools
```

```js
import '@interactjs/auto-start'
import '@interactjs/actions/drag'
import '@interactjs/actions/resize'
import '@interactjs/modifiers'
import '@interactjs/dev-tools'
import interact from '@interactjs/interact'

interact('.item').draggable({
  listeners: {
    move (event) {
      console.log(event.pageX, event.pageY)
    },
  },
})
```

For a more streamlined JS payload, you can install and import the package for
each feature you need:

| Package name                                           | Description                                                                                                                              |
| ------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `@interactjs/interact`                                 | **(required)** provides the `interact()` method                                                                                          |
| [`@interactjs/actions`](action-options)                | Drag, resize, gesture actions                                                                                                            |
| [`@interactjs/auto-start`](auto-start)                 | Start actions with pointer down, move sequence                                                                                           |
| [`@interactjs/modifiers`](modifiers)                   | Snap, restrict, etc. modifiers                                                                                                           |
| `@interactjs/snappers`                                 | Provides `interact.snappers.grid()` utility                                                                                              |
| [`@interactjs/inertia`](inertia)                       | Drag and resize inertia-like throwing                                                                                                    |
| [`@interactjs/reflow`](reflow)                         | `interactable.reflow(action)` method to trigger modifiers and event listeners                                                            |
| [`@interactjs/dev-tools`](tooling#interactjsdev-tools) | Console warnings for common mistakes (optimized out when `NODE_ENV === 'production'`) and a babel plugin for optimized production builds |

### CDN streamlined

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
      console.log(event.pageX, event.pageY)
    },
  })
</script>
```

The packages above are also available on
`https://cdn.interactjs.io/v[VERSION]/[UNSCOPED_NAME]`. You can import them in
modern browser which support ES6 `import`s.

### Ruby on Rails

[Rails 5.1+](https://rubyonrails.org/) supports the [yarn](http://yarnpkg.com/)
package manager, so you can add interact.js to you app by running `yarn add interactjs`. Then require the library with:

```rb
//= require interactjs/interact
```
