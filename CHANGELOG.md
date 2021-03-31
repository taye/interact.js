## v1.10.11

 - fixed incorrect "module" field in package.json https://github.com/taye/interact.js/issues/894#issuecomment-811046898

## v1.10.10

 - fixed issue with unresolved stub files #894
 - fixed commonjs import of `interactjs` package

## v1.10.9

 - improved support for SSR environments

## v1.10.8

 - fixed imports of missing modules #891

## v1.10.7

 - correctly replace `process.env.npm_package_version` in min bundle #890

## v1.10.6

 - fix packaging error

## v1.10.5

 - fix packaging error

## v1.10.4

 - fix NPE in indexOfDeepestElement if first element has no parent #887
 - improve babel-plugin-prod on windows #885

## v1.10.3

 - fixed issue with TS strict null checks #882
 - fixed issue with type imports being emitted in JS modules #881

## v1.10.2

 - marked interact.{on,off} methods as deprecated

## v1.10.1

 - fixed mouseButtons option typings #865
 - removed plugin index module warnings

## v1.10.0

 - changed production files extension from '.min.js' to '.prod.js' #857
 - added experimental `@interactjs/dev-tools/babel-plugin-prod` babel plugin to
   change `@interactjs/*` imports to production versions
 - added `sideEffects` fields to package.json files

## v1.9.22

 - fixed inertia issue with arbitrary plugin order #834
 - fixed inertia regression #853

## v1.9.21

 - used findIndex polyfill to support 1E11 #852
 - fixed issue where resize reflow increased element size #817
 - fixed drop event order: fire `dropmove` after `dragenter` #841 and final
   drop events before `dragend` #842
 - updated docs #844 #829

## v1.9.20

 - fixed ordering of plugins

## v1.9.19

 - exposed `DropEvent` type

## v1.9.18

 - fixed further issues with types

## v1.9.17

 - fixed missing types for interactjs package

## v1.9.16

 - fixed missing types for interactjs package

## v1.9.15

 - fixed missing types for interactjs package

## v1.9.15

 - fixed further regression breaking typescript builds #816

## v1.9.14

 - fixed regression breaking typescript builds #816

## v1.9.13

 - fixed regression breaking es5 compatibility of .min.js bundle #814

## v1.9.12

 - fixed regression breaking commonjs imports withotu .default

## v1.9.11

 - fixed issue with missing width/height on rectChecker result
 - fixed resize checker with negative sizes
 - moved generated plugin use modules to @interactjs/*/{use/,}*/index.ts #800
 - changed snap function args to provide interaction proxy
 - restored dev-tools helpers in development bundle

## v1.9.10

 - fixed issue with uninitialized scope in non browser env #803

## v1.9.9

 - fixed typescript issue #807

## v1.9.8

 - fixed minified bundle #802
 - fixed issue with removing delegated events #801

## v1.9.7

 - fixed typing issues

## v1.9.6

 - improved package dependencies

## v1.9.5

 - made `core` and `utils` packages dependencies of `interact`

## v1.9.4

 - restored `@interactjs/*/use/*.js*` builds

## v1.9.2

  - fixed imports within generated modules

## v1.9.1

 - added `@interactjs/*/use/*.min.js` builds
 - fixed issue with webpack minifier #800
 - fixed typescript issues

## v1.9.0

 - added various `@interactjs/*/use` packages for simpler selective imports
   #800
 - fixed endOnly modifiers without inertia

## v1.8.5

 - fixed a but causing incorrect modifications after resuming inertia #790

## v1.8.4

 - fixed bug when calling interaction.move() from start event #791

## v1.8.3

 - fixed bug when calling interaction.move() from start event #791
 - fixed invalid non-array argument spread types #789
 - fixed missing typescript definition of some interactable methods #788
 - disabled `.d.ts.map` files output since the `.ts` source files are not
   published
 - fixed typings for modifiers

## v1.8.2

 - enabled `.d.ts.map` files output
 - added license field to @interactjs/interact package.json

## v1.8.1

 - fixed an issue causing flickering a cursor on Firefox for Windows #781

## v1.8.0

Changes from prerelease versions listed below. See
https://github.com/taye/interact.js/projects/4#column-7093512 for a list of
issues and pull requests.

## v1.8.0-rc.3

 - fixed incorrect publish

## v1.8.0-rc.2

 - refactoring

## v1.8.0-rc.1

 - fixed `interact.snappers.grid` arg typings
   (https://twitter.com/ksumarine/status/1204457347856424960)
 - removed "?" from definitions for interact.{modifiers,snappers,createSnapGrid}

## v1.8.0-rc.0

 - fixed `modifiers.restrictSize` #779
 - fixed option types in typescript and fixed devTools options #776

## v1.8.0-alpha.7

 - reverted to typescript@3.6 to avoid backwards compatibility issues #775

## v1.8.0-alpha.6

 - fixed dev scripts

## v1.8.0-alpha.5

 - moved `interact.dynamicDrop` definition in order to avoid compilation errors

## v1.8.0-alpha.4

 - added `main` field to interactjs package.json #774
 - removed baseUrl from project tsconfig to avoid relative imports in generated
   declarations

## v1.8.0-alpha.3

 - added missing typescript declaration files

## v1.8.0-alpha.2

 - used non relative imports in .ts files with correct config for
   babel-plugin-bare-import-rewrite

## v1.8.0-alpha.1

 - added `event.modifiers` array #772

## v1.8.0-alpha.0

 - added `aspectRatio` modifier #638

## v1.7.4

 - fixed `interact.snappers.grid` arg typings
   (https://twitter.com/ksumarine/status/1204457347856424960)
 - removed "?" from definitions for interact.{modifiers,snappers,createSnapGrid}

## v1.7.3

 - fixed interactjs package main and browser fields #774
 - reverted to typescript@3.6 to avoid backwards compatibility issues #775

## v1.7.2

 - fixed typescript definition files #771

## v1.7.1

 - reorganized modules for esnext resolution

## v1.7.0

 - fixed hold repeat `event.count`
 - added esnext js builds #769

## v1.6.3

 - fixed issue with inertia resume with `endOnly: false` #765

## v1.6.2

 - @mlucool added license field to package.json of sub modules #755
 - added `rect`, `deltaRect` and `edges` to resizestart and resizeend events #754

## v1.6.1

 - fixed resize without invert

## v1.6.0

 - avoided accessing deprecated event.mozPressure #751
 - changed typings to use `HTMLElement | SVGElement` for `event.target` #747
 - added `interacting` arg to cursorChecker #739
 - added zIndex compare for sibling dropzones

## v1.5.4

 - fixed broken modifiers #746

## v1.5.3

 - fixed issues with old modifiers API

## v1.5.2

 - fixed null restriction issue #737
 - improved typings for modifiers

## v1.5.1

 - fixed typing issues #738

## v1.5.0

 - added `cursorChecker` option for drag and resize #736
 - allowed restrictions larger than the target element #735
 - added `interact.modifiers.restrictRect` with pre-set elementRect #735

## v1.4.14

 - fixed issue with string restriction values that don't resolve to a rect
   #731
 - changed plugin order so that `pointer-events` is installed before `inertia`

## v1.4.13

 - fixed restrictSize min and max function restrictions

## v1.4.12

 - fixed errors from calling `interaction.stop()` in start event #725

## v1.4.11

 - fixed hold events #730

## v1.4.10

 - fixed regression of preventing native drag behaviour #729

## v1.4.9

 - fixed modifiers with inertia action-resume #728
 - fixed docs for snap grid limits #717

## v1.4.8

 - fixed exports in generated typings #727

## v1.4.7

 - fixed exports in generated typings #726

## v1.4.6

 - fixed pointerEvents currentTarget

## v1.4.5

 - @0xflotus fixed typos in docs #724
 - fixed error on iOS #682

## v1.4.4

 - fixed an issue with interactions lingering on removed elements #723

## v1.4.3

 - destroy only relevant interactions on interactable.unset()

## v1.4.2

 - @jf-m fixed memory leaks and a bug on interactions stop [PR #715](https://github.com/taye/interact.js/pull/715)
 - fixed dropzones in shadow DOM [PR #722](https://github.com/taye/interact.js/pull/722)

## v1.4.1

 - fixed scripts to run bundle optimizations and fix issues with browserify

# v1.4.0

Most notablly:

 - `interactable.reflow(action)` to re-run modifiers, drop, etc [PR #610](https://github.com/taye/interact.js/pull/610)
 - `dropEvent.reject()` [PR #613](https://github.com/taye/interact.js/pull/613)
 - snapEdges modifier [PR #620](https://github.com/taye/interact.js/pull/620)
 - per-action modifiers array [PR #625](https://github.com/taye/interact.js/pull/625)
 - autoStart set cursor on both target and &lt;html&gt; [PR #639](https://github.com/taye/interact.js/pull/639)
 - inertia: rename resume event to `${action}resume`
 - `interactable.reflow(action)` to re-run modifiers, drop, etc [PR #610](https://github.com/taye/interact.js/pull/610)
 - added `options.listeners` array/object for actions
 - `snapEdges` modifier [PR #620](https://github.com/taye/interact.js/pull/620)
 - fixed iOS preventDefault passive event issue ([issue #631](https://github.com/taye/interact.js/issues/631))
 - added `console.warn` messages for common, easily detected issues
 - improved docs
 - various fixes

Full list of [changes on Github](https://github.com/taye/interact.js/compare/1.3.4...v1.4.0).

## v1.3.3
 - fixed issues with action options ([PR #567](https://github.com/taye/interact.js/pull/567), [issue #570](https://github.com/taye/interact.js/issues/570))

## v1.3.2
 - fixed iOS preventDefault passive event issue ([issue #561](https://github.com/taye/interact.js/issues/561))

## v1.3.1
 - allowed calling `draggable.unset()` during `dragend` and `drop` event
   listeners ([issue #560](https://github.com/taye/interact.js/issues/560))
 - allowed snap to be enabled with falsey targets value [issue #562](https://github.com/taye/interact.js/issues/562)

## v1.3.0

Most notably:

 - changed the npm and bower package names to "interactjs" ([issue
   #399](https://github.com/taye/interact.js/issues/399)
 - major refactor with [PR #231](https://github.com/taye/interact.js/pull/231).
 - removed deprecated methods:
   - `Interactable`: `squareResize`, `snap`, `restrict`, `inertia`,
     `autoScroll`, `accept`
   - `interact`: `enabbleDragging`, `enableResizing`, `enableGesturing`,
     `margin`
 - new `hold` option for starting actions
 - new `interaction.end()` method
   ([df963b0](https://github.com/taye/interact.js/commit/df963b0))
 - `snap.offset` `self` option ([issue
   #204](https://github.com/taye/interact.js/issues/204/#issuecomment-154879052))
 - `interaction.doMove()`
   ([3489ee1](https://github.com/taye/interact.js/commit/3489ee1))
   ([c5c658a](https://github.com/taye/interact.js/commit/c5c658a))
 - snap grid limits
   ([d549672](https://github.com/taye/interact.js/commit/d549672))
 - improved iframe support ([PR
   #313](https://github.com/taye/interact.js/pull/313))
 - `actionend` event dx/dy are now `0`, not the difference between start and
   end coords ([cbfaf00](https://github.com/taye/interact.js/commit/cbfaf00))
 - replaced drag `axis` option with `startAxis` and `lockAxis`
 - added pointerEvents options:
   - `holdDuration`
     ([1c58f92](https://github.com/taye/interact.js/commit/1c58f927)),
   - `ignoreFrom` and `allowFrom`
     ([6cbaad6](https://github.com/taye/interact.js/commit/6cbaad6d))
   - `origin` ([7823bb9](https://github.com/taye/interact.js/commit/7823bb95))
 - action events set with action method options (eg.
   `target.draggable({onmove})` are removed when that action is disabled with a
   method call ([cca4e26](https://github.com/taye/interact.js/commit/cca4e260))
 - `context` option now works for Element targets
   ([8f64a7a](https://github.com/taye/interact.js/commit/8f64a7a4))
 - added an action `mouseButtons` option and allowed actions only with the left
   mouse button by default
   ([54ebdc3](https://github.com/taye/interact.js/commit/54ebdc3e))
 - added repeating `hold` events
   ([fe11a8e](https://github.com/taye/interact.js/commit/fe11a8e5))
 - fixed `Interactable.off` ([PR
   #477](https://github.com/taye/interact.js/pull/477))
 - added `restrictEdges`, `restrictSize` and `snapSize` resize modifiers ([PR
   #455](https://github.com/taye/interact.js/pull/455))

Full list of [changes on Github](https://github.com/taye/interact.js/compare/v1.2.6...v1.3.0).

## 1.2.6

### resize.preserveAspectRatio

```javascript
interact(target).resizable({ preserveAspectRatio: true });
```

See [PR #260](https://github.com/taye/interact.js/pull/260).

### Deprecated
 - `interact.margin(number)` - Use `interact(target).resizable({ margin: number });` instead

### Fixed

 - incorrect coordinates of the first movement of every action ([5e5a040](https://github.com/taye/interact.js/commit/5e5a040))
 - warning about deprecated "webkitForce" event property ([0943290](https://github.com/taye/interact.js/commit/0943290))
 - bugs with multiple concurrent interactions ([ed53aee](http://github.com/taye/interact.js/commit/ed53aee))
 - iPad 1, iOS 5.1.1 error "undefined is not a function" when autoScroll is set
   to true ([PR #194](https://github.com/taye/interact.js/pull/194))

Full list of [changes on Github](https://github.com/taye/interact.js/compare/v1.2.5...v1.2.6)

## 1.2.5

### Changed parameters to actionChecker and drop.checker

 - Added `event` as the first argument to actionCheckers. See commit [88dc583](https://github.com/taye/interact.js/commit/88dc583)
 - Added `dragEvent` as the first parameter to drop.checker functions. See
   commits [16d74d4](https://github.com/taye/interact.js/commit/16d74d4) and [d0c4b69](https://github.com/taye/interact.js/commit/d0c4b69)

### Deprecated methods

interactable.accept - instead, use:

```javascript
interact(target).dropzone({ accept: stringOrElement })
```

interactable.dropChecker - instead, use:

```javascript
interact(target).dropzone({ checker: function () {} })
```

### Added resize.margin

See https://github.com/taye/interact.js/issues/166#issuecomment-91234390

### Fixes

 - touch coords on Presto Opera Mobile - see commits [886e54c](https://github.com/taye/interact.js/commit/886e54c) and [5a3a850](https://github.com/taye/interact.js/commit/5a3a850)
 - bug with multiple pointers - see commit [64882d3](https://github.com/taye/interact.js/commit/64882d3)
 - accessing certain recently deprecated event properties in Blink - see
   commits [e91fbc6](https://github.com/taye/interact.js/commit/e91fbc6) and [195cfe9](https://github.com/taye/interact.js/commit/195cfe9)
 - dropzones with `accept: 'pointer'` in scrolled pages on iOS6 and lower - see
   commit [0b94aac](https://github.com/taye/interact.js/commit/0b94aac)
 - setting styleCursor through Interactable options object - see [PR
   #270](https://github.com/taye/interact.js/pull/270)
 - one missed interaction element on stop triggered - see [PR
   #258](https://github.com/taye/interact.js/pull/258)
 - pointer dt on touchscreen devices - see [PR
   #215](https://github.com/taye/interact.js/pull/215)
 - autoScroll with containers with fixed position - see commit [3635840](https://github.com/taye/interact.js/commit/3635840)
 - autoScroll for mobile - see #180
 - preventDefault - see commits [1984c80](https://github.com/taye/interact.js/commit/1984c80) and [6913959](https://github.com/taye/interact.js/commit/6913959)
 - occasional error - see [issue
   #183](https://github.com/taye/interact.js/issue/183)
 - Interactable#unset - see [PR
   #178](https://github.com/taye/interact.js/pull/178)
 - coords of start event after manual start - see commit [fec73b2](https://github.com/taye/interact.js/commit/fec73b2)
 - bug with touch and selector interactables - see commit [d8df3de](https://github.com/taye/interact.js/commit/d8df3de)
 - touch doubletap bug - see [273f461](https://github.com/taye/interact.js/commit/273f461)
 - event x0/y0 with origin - see [PR
   #167](https://github.com/taye/interact.js/pull/167)

## 1.2.4

### Resizing from all edges

With the new [resize edges API](https://github.com/taye/interact.js/pull/145),
you can resize from the top and left edges of an element in addition to the
bottom and right. It also allows you to specify CSS selectors, regions or
elements as the resize handles.

### Better `dropChecker` arguments

The arguments to `dropChecker` functions have been expanded to include the
value of the default drop check and some other useful objects. See [PR
161](https://github.com/taye/interact.js/pull/161)

### Improved `preventDefault('auto')`

If manuanStart is `true`, default prevention will happen only while
interacting. Related to [Issue
138](https://github.com/taye/interact.js/issues/138).

### Fixed inaccurate snapping

This removes a small inaccuracy when snapping with one or more
`relativeOffsets`.

### Fixed bugs with multiple pointers

## 1.2.3

### ShadowDOM

Basic support for ShadowDOM was implemented in [PR
143](https://github.com/taye/interact.js/pull/143)

### Fixed some issues with events

Fixed Interactable#on({ type: listener }). b8a5e89

Added a `double` property to tap events. `tap.double === true` if the tap will
be followed by a `doubletap` event. See [issue
155](https://github.com/taye/interact.js/issues/155#issuecomment-71202352).

Fixed [issue 150](https://github.com/taye/interact.js/issues/150).

## 1.2.2

### Fixed DOM event removal

See [issue 149](https://github.com/taye/interact.js/issues/149).

## 1.2.1

### Fixed Gestures

Gestures were completely [broken in
v1.2.0](https://github.com/taye/interact.js/issues/146). They're fixed now.

### Restriction

Fixed restriction to an element when the element doesn't have a rect (`display:
none`, not in DOM, etc.). [Issue
144](https://github.com/taye/interact.js/issues/144).

## 1.2.0

### Multiple interactions

Multiple interactions have been enabled by default. For example:

```javascript
interact('.drag-element').draggable({
    enabled: true,
 // max          : Infinity,  // default
 // maxPerElement: 1,         // default
});
```

will allow multiple `.drag-element` to be dragged simultaneously without having
to explicitly set <code>max:&nbsp;integerGreaterThan1</code>. The default
`maxPerElement` value is still 1 so only one drag would be able to happen on
each `.drag-element` unless the `maxPerElement` is changed.

If you don't want multiple interactions, call `interact.maxInteractions(1)`.

### Snapping

#### Unified snap modes
Snap modes have been
[unified](https://github.com/taye/interact.js/pull/127). A `targets` array
now holds all the snap objects and functions for snapping.
`interact.createSnapGrid(gridObject)` returns a function that snaps to the
dimensions of the given grid.

#### `relativePoints` and `origin`

```javascript
interact(target).draggable({
  snap: {
    targets: [ {x: 300, y: 300} ],
    relativePoints: [
      { x: 0, y: 0 },  // snap relative to the top left of the element
      { x: 1, y: 1 },  // and also to the bottom right
    ],  

    // offset the snap target coordinates
    // can be an object with x/y or 'startCoords'
    offset: { x: 50, y: 50 }
  }
});
```

#### snap function interaction arg

The current `Interaction` is now passed as the third parameter to snap functions.

```js
interact(target).draggable({
  snap: {
    targets: [ function (x, y, interaction) {
      if (!interaction.dropTarget) {
        return { x: 0, y: 0 };
      }
    } ]
  }
});
```

#### snap.relativePoints and offset

The `snap.relativePoints` array succeeds the snap.elementOriign object. But
backwards compatibility with `elementOrigin` and the old snapping interface is
maintained.

`snap.offset` lets you offset all snap target coords.

See [this PR](https://github.com/taye/interact.js/pull/133) for more info.

#### slight change to snap range calculation

Snapping now occurs if the distance to the snap target is [less than or
equal](https://github.com/taye/interact.js/commit/430c28c) to the target's
range.

### Inertia

`inertia.zeroResumeDelta` is now `true` by default.

### Per-action settings

Snap, restrict, inertia, autoScroll can be different for drag, restrict and
gesture. See [PR 115](https://github.com/taye/interact.js/pull/115).

Methods for these settings on the `interact` object (`interact.snap()`,
`interact.autoScroll()`, etc.) have been removed.

### Space-separated string and array event list and eventType:listener object

```javascript
function logEventType (event) {
  console.log(event.type, event.target);
}

interact(target).on('down tap dragstart gestureend', logEventType);

interact(target).on(['move', 'resizestart'], logEventType);

interact(target).on({
  dragmove: logEvent,
  keydown : logEvent
});
```

### Interactable actionChecker

The expected return value from an action checker has changed from a string to
an object. The object should have a `name` and can also have an `axis`
property. For example, to resize horizontally:

```javascript
interact(target).resizeable(true)
  .actionChecker(function (pointer, defaultAction, interactable, element) {
    return {
      name: 'resize',
      axis: 'x',
    };
  });
```

### Plain drop event objects

All drop-related events are [now plain
objects](https://github.com/taye/interact.js/issues/122). The related drag
events are referenced in their `dragEvent` property.

### Interactable.preventDefault('always' || 'never' || 'auto')

The method takes one of the above string values. It will still accept
`true`/`false` parameters which are changed to `'always'`/`'never'`.

## 1.1.3

### Better Events

Adding a function as a listener for an InteractEvent or pointerEvent type
multiple times will cause that function to be fired multiple times for the
event. Previously, adding the event type + function combination again had no
effect.

Added new event types [down, move, up, cancel,
hold](https://github.com/taye/interact.js/pull/101).

Tap and doubletap with multiple pointers was improved.

Added a workaround for IE8's unusual [dblclick event
sequence](http://www.quirksmode.org/dom/events/click.html) so that doubletap
events are fired.

Fixed a [tapping issue](https://github.com/taye/interact.js/issues/104) on
Windows Phone/RT.

Fixed a bug that caused the origins of all elements with tap listeners to be
subtracted successively as a tap event propagated.

[Fixed delegated events](https://github.com/taye/interact.js/commit/e972154)
when different contexts have been used.

### iFrames

[Added basic support](https://github.com/taye/interact.js/pull/98) for sharing
one instance of interact.js between multiplie windows/frames. There are still
some issues.
