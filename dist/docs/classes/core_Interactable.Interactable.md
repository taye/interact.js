[@interactjs](../README.md) / [core/Interactable](../modules/core_Interactable.md) / Interactable

# Class: Interactable

[core/Interactable](../modules/core_Interactable.md).Interactable

```ts
const interactable = interact('.cards')
  .draggable({
    listeners: { move: event => console.log(event.type, event.pageX, event.pageY) }
  })
  .resizable({
    listeners: { move: event => console.log(event.rect) },
    modifiers: [interact.modifiers.restrictEdges({ outer: 'parent' })]
  })
```

## Implements

- `Partial`\<[`Eventable`](core_Eventable.Eventable.md)\>

## Table of contents

### Properties

- [devTools](core_Interactable.Interactable.md#devtools)
- [getAction](core_Interactable.Interactable.md#getaction)
- [target](core_Interactable.Interactable.md#target)

### Methods

- [actionChecker](core_Interactable.Interactable.md#actionchecker)
- [allowFrom](core_Interactable.Interactable.md#allowfrom)
- [checkAndPreventDefault](core_Interactable.Interactable.md#checkandpreventdefault)
- [context](core_Interactable.Interactable.md#context)
- [deltaSource](core_Interactable.Interactable.md#deltasource)
- [draggable](core_Interactable.Interactable.md#draggable)
- [dropCheck](core_Interactable.Interactable.md#dropcheck)
- [dropzone](core_Interactable.Interactable.md#dropzone)
- [fire](core_Interactable.Interactable.md#fire)
- [gesturable](core_Interactable.Interactable.md#gesturable)
- [getRect](core_Interactable.Interactable.md#getrect)
- [ignoreFrom](core_Interactable.Interactable.md#ignorefrom)
- [inContext](core_Interactable.Interactable.md#incontext)
- [off](core_Interactable.Interactable.md#off)
- [on](core_Interactable.Interactable.md#on)
- [origin](core_Interactable.Interactable.md#origin)
- [pointerEvents](core_Interactable.Interactable.md#pointerevents)
- [preventDefault](core_Interactable.Interactable.md#preventdefault)
- [rectChecker](core_Interactable.Interactable.md#rectchecker)
- [reflow](core_Interactable.Interactable.md#reflow)
- [resizable](core_Interactable.Interactable.md#resizable)
- [set](core_Interactable.Interactable.md#set)
- [setOnEvents](core_Interactable.Interactable.md#setonevents)
- [setPerAction](core_Interactable.Interactable.md#setperaction)
- [styleCursor](core_Interactable.Interactable.md#stylecursor)
- [unset](core_Interactable.Interactable.md#unset)
- [updatePerActionListeners](core_Interactable.Interactable.md#updateperactionlisteners)

## Properties

### devTools

• **devTools**: [`OptionMethod`](../interfaces/core_types.OptionMethod.md)\<[`DevToolsOptions`](../interfaces/dev_tools_plugin.DevToolsOptions.md)\>

#### Defined in

[dev-tools/plugin.ts:37](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/dev-tools/plugin.ts#L37)

___

### getAction

• **getAction**: (`this`: [`Interactable`](core_Interactable.Interactable.md), `pointer`: [`PointerType`](../modules/core_types.md#pointertype), `event`: [`PointerEventType`](../modules/core_types.md#pointereventtype), `interaction`: [`Interaction`](core_Interaction.Interaction.md)\<keyof [`ActionMap`](../interfaces/core_types.ActionMap.md)\>, `element`: [`Element`](../modules/core_types.md#element)) => [`ActionProps`](../interfaces/core_types.ActionProps.md)\<`never`\>

#### Type declaration

▸ (`this`, `pointer`, `event`, `interaction`, `element`): [`ActionProps`](../interfaces/core_types.ActionProps.md)\<`never`\>

##### Parameters

| Name | Type |
| :------ | :------ |
| `this` | [`Interactable`](core_Interactable.Interactable.md) |
| `pointer` | [`PointerType`](../modules/core_types.md#pointertype) |
| `event` | [`PointerEventType`](../modules/core_types.md#pointereventtype) |
| `interaction` | [`Interaction`](core_Interaction.Interaction.md)\<keyof [`ActionMap`](../interfaces/core_types.ActionMap.md)\> |
| `element` | [`Element`](../modules/core_types.md#element) |

##### Returns

[`ActionProps`](../interfaces/core_types.ActionProps.md)\<`never`\>

#### Defined in

[auto-start/InteractableMethods.ts:10](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/auto-start/InteractableMethods.ts#L10)

___

### target

• `Readonly` **target**: [`Target`](../modules/core_types.md#target)

#### Defined in

[core/Interactable.ts:59](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/core/Interactable.ts#L59)

## Methods

### actionChecker

▸ **actionChecker**(`checker`): [`Interactable`](core_Interactable.Interactable.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `checker` | `Function` |

#### Returns

[`Interactable`](core_Interactable.Interactable.md)

#### Defined in

[auto-start/InteractableMethods.ts:27](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/auto-start/InteractableMethods.ts#L27)

▸ **actionChecker**(): `Function`

#### Returns

`Function`

#### Defined in

[auto-start/InteractableMethods.ts:28](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/auto-start/InteractableMethods.ts#L28)

▸ **actionChecker**(`checker?`): `Function` \| [`Interactable`](core_Interactable.Interactable.md)

```js
interact('.resize-drag')
  .resizable(true)
  .draggable(true)
  .actionChecker(function (pointer, event, action, interactable, element, interaction) {

    if (interact.matchesSelector(event.target, '.drag-handle')) {
      // force drag with handle target
      action.name = drag
    }
    else {
      // resize from the top and right edges
      action.name  = 'resize'
      action.edges = { top: true, right: true }
    }

    return action
})
```

Returns or sets the function used to check action to be performed on
pointerDown

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `checker?` | `Function` | A function which takes a pointer event, defaultAction string, interactable, element and interaction as parameters and returns an object with name property 'drag' 'resize' or 'gesture' and optionally an `edges` object with boolean 'top', 'left', 'bottom' and right props. |

#### Returns

`Function` \| [`Interactable`](core_Interactable.Interactable.md)

The checker function or this Interactable

#### Defined in

[auto-start/InteractableMethods.ts:60](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/auto-start/InteractableMethods.ts#L60)

___

### allowFrom

▸ **allowFrom**(): `boolean`

#### Returns

`boolean`

#### Defined in

[auto-start/InteractableMethods.ts:89](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/auto-start/InteractableMethods.ts#L89)

▸ **allowFrom**(`newValue?`): [`Interactable`](core_Interactable.Interactable.md)

A drag/resize/gesture is started only If the target of the `mousedown`,
`pointerdown` or `touchstart` event or any of it's parents match the given
CSS selector or Element.

#### Parameters

| Name | Type |
| :------ | :------ |
| `newValue?` | `string` \| [`Element`](../modules/core_types.md#element) |

#### Returns

[`Interactable`](core_Interactable.Interactable.md)

The current allowFrom value or this
Interactable

**`Deprecated`**

Don't use this method. Instead set the `allowFrom` option for each action
or for `pointerEvents`

```js
interact(targett)
  .resizable({
    allowFrom: '.resize-handle',
  .pointerEvents({
    allowFrom: '.handle',,
  })
```

#### Defined in

[auto-start/InteractableMethods.ts:113](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/auto-start/InteractableMethods.ts#L113)

___

### checkAndPreventDefault

▸ **checkAndPreventDefault**(`event`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | `Event` |

#### Returns

`void`

#### Defined in

[core/interactablePreventDefault.ts:27](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/core/interactablePreventDefault.ts#L27)

___

### context

▸ **context**(): [`Context`](../modules/core_types.md#context)

Gets the selector context Node of the Interactable. The default is
`window.document`.

#### Returns

[`Context`](../modules/core_types.md#context)

The context Node of this Interactable

#### Defined in

[core/Interactable.ts:283](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/core/Interactable.ts#L283)

___

### deltaSource

▸ **deltaSource**(): `DeltaSource`

Returns or sets the mouse coordinate types used to calculate the
movement of the pointer.

#### Returns

`DeltaSource`

The current deltaSource or this Interactable

#### Defined in

[core/Interactable.ts:250](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/core/Interactable.ts#L250)

▸ **deltaSource**(`newValue`): [`Interactable`](core_Interactable.Interactable.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `newValue` | `DeltaSource` |

#### Returns

[`Interactable`](core_Interactable.Interactable.md)

#### Defined in

[core/Interactable.ts:251](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/core/Interactable.ts#L251)

___

### draggable

▸ **draggable**(`options`): [`Interactable`](core_Interactable.Interactable.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `options` | `boolean` \| `Partial`\<[`OrBoolean`](../modules/core_types.md#orboolean)\<`DraggableOptions`\>\> |

#### Returns

[`Interactable`](core_Interactable.Interactable.md)

#### Defined in

[actions/drag/plugin.ts:10](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/actions/drag/plugin.ts#L10)

▸ **draggable**(): `DraggableOptions`

#### Returns

`DraggableOptions`

#### Defined in

[actions/drag/plugin.ts:11](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/actions/drag/plugin.ts#L11)

▸ **draggable**(`options?`): [`Interactable`](core_Interactable.Interactable.md) \| `DraggableOptions`

```js
interact(element).draggable({
    onstart: function (event) {},
    onmove : function (event) {},
    onend  : function (event) {},

    // the axis in which the first movement must be
    // for the drag sequence to start
    // 'xy' by default - any direction
    startAxis: 'x' || 'y' || 'xy',

    // 'xy' by default - don't restrict to one axis (move in any direction)
    // 'x' or 'y' to restrict movement to either axis
    // 'start' to restrict movement to the axis the drag started in
    lockAxis: 'x' || 'y' || 'xy' || 'start',

    // max number of drags that can happen concurrently
    // with elements of this Interactable. Infinity by default
    max: Infinity,

    // max number of drags that can target the same element+Interactable
    // 1 by default
    maxPerElement: 2
})

var isDraggable = interact('element').draggable(); // true
```

Get or set whether drag actions can be performed on the target

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `options?` | `boolean` \| `Partial`\<[`OrBoolean`](../modules/core_types.md#orboolean)\<`DraggableOptions`\>\> | true/false or An object with event listeners to be fired on drag events (object makes the Interactable draggable) |

#### Returns

[`Interactable`](core_Interactable.Interactable.md) \| `DraggableOptions`

#### Defined in

[actions/drag/plugin.ts:47](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/actions/drag/plugin.ts#L47)

___

### dropCheck

▸ **dropCheck**(`dragEvent`, `event`, `draggable`, `draggableElement`, `dropElemen`, `rect`): `boolean`

```js
interact(target)
.dropChecker(function(dragEvent,         // related dragmove or dragend event
                      event,             // TouchEvent/PointerEvent/MouseEvent
                      dropped,           // bool result of the default checker
                      dropzone,          // dropzone Interactable
                      dropElement,       // dropzone elemnt
                      draggable,         // draggable Interactable
                      draggableElement) {// draggable element

  return dropped && event.target.hasAttribute('allow-drop')
}
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `dragEvent` | [`InteractEvent`](core_InteractEvent.InteractEvent.md)\<`never`, keyof [`PhaseMap`](../interfaces/core_InteractEvent.PhaseMap.md)\> |
| `event` | [`PointerEventType`](../modules/core_types.md#pointereventtype) |
| `draggable` | [`Interactable`](core_Interactable.Interactable.md) |
| `draggableElement` | [`Element`](../modules/core_types.md#element) |
| `dropElemen` | [`Element`](../modules/core_types.md#element) |
| `rect` | `any` |

#### Returns

`boolean`

#### Defined in

[actions/drop/plugin.ts:115](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/actions/drop/plugin.ts#L115)

___

### dropzone

▸ **dropzone**(`options`): [`Interactable`](core_Interactable.Interactable.md)

```js
interact('.drop').dropzone({
  accept: '.can-drop' || document.getElementById('single-drop'),
  overlap: 'pointer' || 'center' || zeroToOne
}
```

Returns or sets whether draggables can be dropped onto this target to
trigger drop events

Dropzones can receive the following events:
 - `dropactivate` and `dropdeactivate` when an acceptable drag starts and ends
 - `dragenter` and `dragleave` when a draggable enters and leaves the dropzone
 - `dragmove` when a draggable that has entered the dropzone is moved
 - `drop` when a draggable is dropped into this dropzone

Use the `accept` option to allow only elements that match the given CSS
selector or element. The value can be:

 - **an Element** - only that element can be dropped into this dropzone.
 - **a string**, - the element being dragged must match it as a CSS selector.
 - **`null`** - accept options is cleared - it accepts any element.

Use the `overlap` option to set how drops are checked for. The allowed
values are:

  - `'pointer'`, the pointer must be over the dropzone (default)
  - `'center'`, the draggable element's center must be over the dropzone
  - a number from 0-1 which is the `(intersection area) / (draggable area)`.
  e.g. `0.5` for drop to happen when half of the area of the draggable is
  over the dropzone

Use the `checker` option to specify a function to check if a dragged element
is over this Interactable.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `options` | `boolean` \| `DropzoneOptions` | The new options to be set |

#### Returns

[`Interactable`](core_Interactable.Interactable.md)

#### Defined in

[actions/drop/plugin.ts:96](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/actions/drop/plugin.ts#L96)

▸ **dropzone**(): `DropzoneOptions`

#### Returns

`DropzoneOptions`

The current setting

#### Defined in

[actions/drop/plugin.ts:98](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/actions/drop/plugin.ts#L98)

___

### fire

▸ **fire**\<`E`\>(`iEvent`): [`Interactable`](core_Interactable.Interactable.md)

Calls listeners for the given InteractEvent type bound globally
and directly to this Interactable

#### Type parameters

| Name | Type |
| :------ | :------ |
| `E` | extends `Object` |

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `iEvent` | `E` | The InteractEvent object to be fired on this Interactable |

#### Returns

[`Interactable`](core_Interactable.Interactable.md)

this Interactable

#### Implementation of

Partial.fire

#### Defined in

[core/Interactable.ts:346](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/core/Interactable.ts#L346)

___

### gesturable

▸ **gesturable**(`options`): [`Interactable`](core_Interactable.Interactable.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `options` | `boolean` \| `Partial`\<[`OrBoolean`](../modules/core_types.md#orboolean)\<`GesturableOptions`\>\> |

#### Returns

[`Interactable`](core_Interactable.Interactable.md)

#### Defined in

[actions/gesture/plugin.ts:24](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/actions/gesture/plugin.ts#L24)

▸ **gesturable**(): `GesturableOptions`

#### Returns

`GesturableOptions`

#### Defined in

[actions/gesture/plugin.ts:25](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/actions/gesture/plugin.ts#L25)

▸ **gesturable**(`options?`): [`Interactable`](core_Interactable.Interactable.md) \| `GesturableOptions`

```js
interact(element).gesturable({
    onstart: function (event) {},
    onmove : function (event) {},
    onend  : function (event) {},

    // limit multiple gestures.
    // See the explanation in {@link Interactable.draggable} example
    max: Infinity,
    maxPerElement: 1,
})

var isGestureable = interact(element).gesturable()
```

Gets or sets whether multitouch gestures can be performed on the target

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `options?` | `boolean` \| `Partial`\<[`OrBoolean`](../modules/core_types.md#orboolean)\<`GesturableOptions`\>\> | true/false or An object with event listeners to be fired on gesture events (makes the Interactable gesturable) |

#### Returns

[`Interactable`](core_Interactable.Interactable.md) \| `GesturableOptions`

A boolean indicating if this can be the target of gesture events, or this Interactable

#### Defined in

[actions/gesture/plugin.ts:47](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/actions/gesture/plugin.ts#L47)

___

### getRect

▸ **getRect**(`element?`): `Required`\<[`Rect`](../interfaces/core_types.Rect.md)\>

The default function to get an Interactables bounding rect. Can be
overridden using [Interactable.rectChecker](core_Interactable.Interactable.md#rectchecker).

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `element?` | [`Element`](../modules/core_types.md#element) | The element to measure. |

#### Returns

`Required`\<[`Rect`](../interfaces/core_types.Rect.md)\>

The object's bounding rectangle.

#### Implementation of

Partial.getRect

#### Defined in

[core/Interactable.ts:168](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/core/Interactable.ts#L168)

___

### ignoreFrom

▸ **ignoreFrom**(`newValue`): [`Interactable`](core_Interactable.Interactable.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `newValue` | `string` \| [`Element`](../modules/core_types.md#element) |

#### Returns

[`Interactable`](core_Interactable.Interactable.md)

This interactable

#### Defined in

[auto-start/InteractableMethods.ts:62](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/auto-start/InteractableMethods.ts#L62)

▸ **ignoreFrom**(): `string` \| [`Element`](../modules/core_types.md#element)

#### Returns

`string` \| [`Element`](../modules/core_types.md#element)

The current ignoreFrom value

#### Defined in

[auto-start/InteractableMethods.ts:64](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/auto-start/InteractableMethods.ts#L64)

▸ **ignoreFrom**(`newValue?`): `string` \| [`Element`](../modules/core_types.md#element) \| [`Interactable`](core_Interactable.Interactable.md)

If the target of the `mousedown`, `pointerdown` or `touchstart` event or any
of it's parents match the given CSS selector or Element, no
drag/resize/gesture is started.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `newValue?` | `string` \| [`Element`](../modules/core_types.md#element) | a CSS selector string, an Element or `null` to not ignore any elements |

#### Returns

`string` \| [`Element`](../modules/core_types.md#element) \| [`Interactable`](core_Interactable.Interactable.md)

**`Deprecated`**

Don't use this method. Instead set the `ignoreFrom` option for each action
or for `pointerEvents`

```js
interact(targett)
  .draggable({
    ignoreFrom: 'input, textarea, a[href]'',
  })
  .pointerEvents({
    ignoreFrom: '[no-pointer]',
  })
```
Interactable

#### Defined in

[auto-start/InteractableMethods.ts:85](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/auto-start/InteractableMethods.ts#L85)

___

### inContext

▸ **inContext**(`element`): `boolean`

#### Parameters

| Name | Type |
| :------ | :------ |
| `element` | `Document` \| `Node` |

#### Returns

`boolean`

#### Defined in

[core/Interactable.ts:287](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/core/Interactable.ts#L287)

___

### off

▸ **off**(`types`, `listener?`, `options?`): [`Interactable`](core_Interactable.Interactable.md)

Removes an InteractEvent, pointerEvent or DOM event listener.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `types` | `string`[] \| [`EventTypes`](../modules/core_types.md#eventtypes) | The types of events that were listened for |
| `listener?` | [`ListenersArg`](../modules/core_types.md#listenersarg) | The event listener function(s) |
| `options?` | `any` | options object or useCapture flag for removeEventListener |

#### Returns

[`Interactable`](core_Interactable.Interactable.md)

This Interactable

#### Implementation of

Partial.off

#### Defined in

[core/Interactable.ts:426](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/core/Interactable.ts#L426)

___

### on

▸ **on**(`types`, `listener?`, `options?`): [`Interactable`](core_Interactable.Interactable.md)

Binds a listener for an InteractEvent, pointerEvent or DOM event.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `types` | [`EventTypes`](../modules/core_types.md#eventtypes) | The types of events to listen for |
| `listener?` | [`ListenersArg`](../modules/core_types.md#listenersarg) | The event listener function(s) |
| `options?` | `any` | options object or useCapture flag for addEventListener |

#### Returns

[`Interactable`](core_Interactable.Interactable.md)

This Interactable

#### Implementation of

Partial.on

#### Defined in

[core/Interactable.ts:412](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/core/Interactable.ts#L412)

___

### origin

▸ **origin**(`newValue`): `any`

Gets or sets the origin of the Interactable's element.  The x and y
of the origin will be subtracted from action event coordinates.

#### Parameters

| Name | Type |
| :------ | :------ |
| `newValue` | `any` |

#### Returns

`any`

The current origin or this Interactable

#### Defined in

[core/Interactable.ts:238](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/core/Interactable.ts#L238)

___

### pointerEvents

▸ **pointerEvents**(`options`): [`Interactable`](core_Interactable.Interactable.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `options` | `Partial`\<[`PointerEventOptions`](../interfaces/pointer_events_base.PointerEventOptions.md)\> |

#### Returns

[`Interactable`](core_Interactable.Interactable.md)

#### Defined in

[pointer-events/interactableTargets.ts:10](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/pointer-events/interactableTargets.ts#L10)

___

### preventDefault

▸ **preventDefault**(`newValue`): [`Interactable`](core_Interactable.Interactable.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `newValue` | `PreventDefaultValue` |

#### Returns

[`Interactable`](core_Interactable.Interactable.md)

#### Defined in

[core/interactablePreventDefault.ts:14](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/core/interactablePreventDefault.ts#L14)

▸ **preventDefault**(): `PreventDefaultValue`

#### Returns

`PreventDefaultValue`

#### Defined in

[core/interactablePreventDefault.ts:15](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/core/interactablePreventDefault.ts#L15)

▸ **preventDefault**(`newValue?`): [`Interactable`](core_Interactable.Interactable.md) \| `PreventDefaultValue`

Returns or sets whether to prevent the browser's default behaviour in
response to pointer events. Can be set to:
 - `'always'` to always prevent
 - `'never'` to never prevent
 - `'auto'` to let interact.js try to determine what would be best

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `newValue?` | `PreventDefaultValue` | `'always'`, `'never'` or `'auto'` |

#### Returns

[`Interactable`](core_Interactable.Interactable.md) \| `PreventDefaultValue`

The current setting or this Interactable

#### Defined in

[core/interactablePreventDefault.ts:26](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/core/interactablePreventDefault.ts#L26)

___

### rectChecker

▸ **rectChecker**(): (`element`: [`Element`](../modules/core_types.md#element)) => `any`

Returns or sets the function used to calculate the interactable's
element's rectangle

#### Returns

`fn`

The checker function or this Interactable

▸ (`element`): `any`

Returns or sets the function used to calculate the interactable's
element's rectangle

##### Parameters

| Name | Type |
| :------ | :------ |
| `element` | [`Element`](../modules/core_types.md#element) |

##### Returns

`any`

The checker function or this Interactable

#### Defined in

[core/Interactable.ts:186](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/core/Interactable.ts#L186)

▸ **rectChecker**(`checker`): [`Interactable`](core_Interactable.Interactable.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `checker` | (`element`: [`Element`](../modules/core_types.md#element)) => `any` |

#### Returns

[`Interactable`](core_Interactable.Interactable.md)

#### Defined in

[core/Interactable.ts:187](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/core/Interactable.ts#L187)

___

### reflow

▸ **reflow**\<`T`\>(`action`): `Promise`\<[`Interactable`](core_Interactable.Interactable.md)\>

```js
const interactable = interact(target)
const drag = { name: drag, axis: 'x' }
const resize = { name: resize, edges: { left: true, bottom: true }

interactable.reflow(drag)
interactable.reflow(resize)
```

Start an action sequence to re-apply modifiers, check drops, etc.

#### Type parameters

| Name | Type |
| :------ | :------ |
| `T` | extends keyof [`ActionMap`](../interfaces/core_types.ActionMap.md) |

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `action` | [`ActionProps`](../interfaces/core_types.ActionProps.md)\<`T`\> | The action to begin |

#### Returns

`Promise`\<[`Interactable`](core_Interactable.Interactable.md)\>

A promise that resolves to the `Interactable` when actions on all targets have ended

#### Defined in

[reflow/plugin.ts:36](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/reflow/plugin.ts#L36)

___

### resizable

▸ **resizable**(): `ResizableOptions`

#### Returns

`ResizableOptions`

#### Defined in

[actions/resize/plugin.ts:24](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/actions/resize/plugin.ts#L24)

▸ **resizable**(`options`): [`Interactable`](core_Interactable.Interactable.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `options` | `boolean` \| `Partial`\<[`OrBoolean`](../modules/core_types.md#orboolean)\<`ResizableOptions`\>\> |

#### Returns

[`Interactable`](core_Interactable.Interactable.md)

#### Defined in

[actions/resize/plugin.ts:25](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/actions/resize/plugin.ts#L25)

▸ **resizable**(`options?`): [`Interactable`](core_Interactable.Interactable.md) \| `ResizableOptions`

```js
interact(element).resizable({
  onstart: function (event) {},
  onmove : function (event) {},
  onend  : function (event) {},

  edges: {
    top   : true,       // Use pointer coords to check for resize.
    left  : false,      // Disable resizing from left edge.
    bottom: '.resize-s',// Resize if pointer target matches selector
    right : handleEl    // Resize if pointer target is the given Element
  },

  // Width and height can be adjusted independently. When `true`, width and
  // height are adjusted at a 1:1 ratio.
  square: false,

  // Width and height can be adjusted independently. When `true`, width and
  // height maintain the aspect ratio they had when resizing started.
  preserveAspectRatio: false,

  // a value of 'none' will limit the resize rect to a minimum of 0x0
  // 'negate' will allow the rect to have negative width/height
  // 'reposition' will keep the width/height positive by swapping
  // the top and bottom edges and/or swapping the left and right edges
  invert: 'none' || 'negate' || 'reposition'

  // limit multiple resizes.
  // See the explanation in the {@link Interactable.draggable} example
  max: Infinity,
  maxPerElement: 1,
})

var isResizeable = interact(element).resizable()
```

Gets or sets whether resize actions can be performed on the target

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `options?` | `boolean` \| `Partial`\<[`OrBoolean`](../modules/core_types.md#orboolean)\<`ResizableOptions`\>\> | true/false or An object with event listeners to be fired on resize events (object makes the Interactable resizable) |

#### Returns

[`Interactable`](core_Interactable.Interactable.md) \| `ResizableOptions`

A boolean indicating if this can be the
target of resize elements, or this Interactable

#### Defined in

[actions/resize/plugin.ts:71](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/actions/resize/plugin.ts#L71)

___

### set

▸ **set**(`options`): [`Interactable`](core_Interactable.Interactable.md)

Reset the options of this Interactable

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `options` | [`OptionsArg`](../interfaces/core_options.OptionsArg.md) | The new settings to apply |

#### Returns

[`Interactable`](core_Interactable.Interactable.md)

This Interactable

#### Defined in

[core/Interactable.ts:436](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/core/Interactable.ts#L436)

___

### setOnEvents

▸ **setOnEvents**(`actionName`, `phases`): [`Interactable`](core_Interactable.Interactable.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `actionName` | keyof [`ActionMap`](../interfaces/core_types.ActionMap.md) |
| `phases` | `any` |

#### Returns

[`Interactable`](core_Interactable.Interactable.md)

#### Defined in

[core/Interactable.ts:84](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/core/Interactable.ts#L84)

___

### setPerAction

▸ **setPerAction**(`actionName`, `options`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `actionName` | keyof [`ActionMap`](../interfaces/core_types.ActionMap.md) |
| `options` | [`OrBoolean`](../modules/core_types.md#orboolean)\<[`Options`](../modules/core_options.md#options)\> |

#### Returns

`void`

#### Defined in

[core/Interactable.ts:116](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/core/Interactable.ts#L116)

___

### styleCursor

▸ **styleCursor**(`newValue`): [`Interactable`](core_Interactable.Interactable.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `newValue` | `boolean` |

#### Returns

[`Interactable`](core_Interactable.Interactable.md)

#### Defined in

[auto-start/InteractableMethods.ts:17](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/auto-start/InteractableMethods.ts#L17)

▸ **styleCursor**(): `boolean`

#### Returns

`boolean`

#### Defined in

[auto-start/InteractableMethods.ts:18](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/auto-start/InteractableMethods.ts#L18)

▸ **styleCursor**(`newValue?`): `boolean` \| [`Interactable`](core_Interactable.Interactable.md)

Returns or sets whether the the cursor should be changed depending on the
action that would be performed if the mouse were pressed and dragged.

#### Parameters

| Name | Type |
| :------ | :------ |
| `newValue?` | `boolean` |

#### Returns

`boolean` \| [`Interactable`](core_Interactable.Interactable.md)

The current setting or this Interactable

#### Defined in

[auto-start/InteractableMethods.ts:26](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/auto-start/InteractableMethods.ts#L26)

___

### unset

▸ **unset**(): `void`

Remove this interactable from the list of interactables and remove it's
action capabilities and event listeners

#### Returns

`void`

#### Defined in

[core/Interactable.ts:472](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/core/Interactable.ts#L472)

___

### updatePerActionListeners

▸ **updatePerActionListeners**(`actionName`, `prev`, `cur`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `actionName` | keyof [`ActionMap`](../interfaces/core_types.ActionMap.md) |
| `prev` | [`Listeners`](../modules/core_types.md#listeners) |
| `cur` | [`Listeners`](../modules/core_types.md#listeners) |

#### Returns

`void`

#### Defined in

[core/Interactable.ts:101](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/core/Interactable.ts#L101)
