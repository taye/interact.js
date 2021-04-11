---
title: Tooling & Optimization
---

## Feature selection

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

Adding the unscoped `interactjs` npm package to your project is the easiest way
to get started with the library as it includes all features already pre-bundled
and compiled to ES5 syntax. However, this might result in a lot of unused
features increasing the size of your JS payload.

For a more streamlined build, you can add import the packages for each feature
you need. See the [npm streamlined installation
docs](/docs/installation#npm-streamlined) for more details including a list of
available packages.

## `@interactjs/dev-tools`

The `@interactjs/dev-tools` package provides hints that can help you avoid
common issues (eg. missing event handlers and useful CSS styles) while
developing your application. Although these hints can be helpful, it's best to
avoid including them in your production deployment. There are some ways to do
this below.

## Optimizing for production

### Babel plugin

```json
// babel config
{
  "env": {
    "production": {
      "plugins": [
        "@interactjs/dev-tools/babel-plugin-prod",
      ]
    }
  }
}
```

```js
// source file
import '@interactjs/actions/drag'
import interact from '@interactjs/interact'
```

```js
// result
import '@interactjs/actions/drag/index.prod'
import interact from '@interactjs/interact/index.prod'
```

If you use babel in your deployment workflow, you can simply add
`@interactjs/dev-tools/babel-plugin-prod` to the plugins section of your
production babel config and all `@interactjs/**` imports will be changed to the
optimized, production versions with development hints optimized out.

### Without build tools

```js
import '@interactjs/actions/drag/index.prod'
import interact from '@interactjs/interact/index.prod'
```

If you're not using babel, then you'll need to change your imports to include
the `.prod` extension. For index files of directories you'll need to add the
filename (eg. `@interactjs/actions -> @interactjs/actions/index.prod`).
