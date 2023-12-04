[@interactjs](../README.md) / [core/Interaction](../modules/core_Interaction.md) / Interaction

# Class: Interaction\<T\>

[core/Interaction](../modules/core_Interaction.md).Interaction

## Type parameters

| Name | Type |
| :------ | :------ |
| `T` | extends [`ActionName`](../modules/core_types.md#actionname) \| ``null`` = [`ActionName`](../modules/core_types.md#actionname) |

## Table of contents

### Properties

- [\_reflowPromise](core_Interaction.Interaction.md#_reflowpromise)
- [\_reflowResolve](core_Interaction.Interaction.md#_reflowresolve)
- [autoScroll](core_Interaction.Interaction.md#autoscroll)
- [autoStartHoldTimer](core_Interaction.Interaction.md#autostartholdtimer)
- [coords](core_Interaction.Interaction.md#coords)
- [doMove](core_Interaction.Interaction.md#domove)
- [dropState](core_Interaction.Interaction.md#dropstate)
- [element](core_Interaction.Interaction.md#element)
- [gesture](core_Interaction.Interaction.md#gesture)
- [holdIntervalHandle](core_Interaction.Interaction.md#holdintervalhandle)
- [inertia](core_Interaction.Interaction.md#inertia)
- [interactable](core_Interaction.Interaction.md#interactable)
- [modification](core_Interaction.Interaction.md#modification)
- [offset](core_Interaction.Interaction.md#offset)
- [offsetBy](core_Interaction.Interaction.md#offsetby)
- [pointerIsDown](core_Interaction.Interaction.md#pointerisdown)
- [pointerType](core_Interaction.Interaction.md#pointertype)
- [pointerWasMoved](core_Interaction.Interaction.md#pointerwasmoved)
- [prepared](core_Interaction.Interaction.md#prepared)
- [prevTap](core_Interaction.Interaction.md#prevtap)
- [rect](core_Interaction.Interaction.md#rect)
- [resizeAxes](core_Interaction.Interaction.md#resizeaxes)
- [resizeStartAspectRatio](core_Interaction.Interaction.md#resizestartaspectratio)
- [tapTime](core_Interaction.Interaction.md#taptime)

### Methods

- [currentAction](core_Interaction.Interaction.md#currentaction)
- [destroy](core_Interaction.Interaction.md#destroy)
- [end](core_Interaction.Interaction.md#end)
- [interacting](core_Interaction.Interaction.md#interacting)
- [move](core_Interaction.Interaction.md#move)
- [pointerDown](core_Interaction.Interaction.md#pointerdown)
- [pointerMove](core_Interaction.Interaction.md#pointermove)
- [start](core_Interaction.Interaction.md#start)
- [stop](core_Interaction.Interaction.md#stop)
- [styleCursor](core_Interaction.Interaction.md#stylecursor)

## Properties

### \_reflowPromise

• **\_reflowPromise**: `Promise`\<`void`\>

#### Defined in

[reflow/plugin.ts:42](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/reflow/plugin.ts#L42)

___

### \_reflowResolve

• **\_reflowResolve**: (...`args`: `unknown`[]) => `void`

#### Type declaration

▸ (`...args`): `void`

##### Parameters

| Name | Type |
| :------ | :------ |
| `...args` | `unknown`[] |

##### Returns

`void`

#### Defined in

[reflow/plugin.ts:43](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/reflow/plugin.ts#L43)

___

### autoScroll

• `Optional` **autoScroll**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `defaults` | [`AutoScrollOptions`](../interfaces/auto_scroll_plugin.AutoScrollOptions.md) |
| `i` | `number` |
| `interaction` | [`Interaction`](core_Interaction.Interaction.md)\<keyof [`ActionMap`](../interfaces/core_types.ActionMap.md)\> |
| `isScrolling` | `boolean` |
| `margin` | `number` |
| `now` | () => `number` |
| `prevTime` | `number` |
| `speed` | `number` |
| `x` | `number` |
| `y` | `number` |
| `check` | (`interactable`: [`Interactable`](core_Interactable.Interactable.md), `actionName`: keyof [`ActionMap`](../interfaces/core_types.ActionMap.md)) => `boolean` |
| `onInteractionMove` | \<T\>(`__namedParameters`: \{ `interaction`: [`Interaction`](core_Interaction.Interaction.md)\<`T`\> ; `pointer`: [`PointerType`](../modules/core_types.md#pointertype)  }) => `void` |
| `scroll` | () => `void` |
| `start` | (`interaction`: [`Interaction`](core_Interaction.Interaction.md)\<keyof [`ActionMap`](../interfaces/core_types.ActionMap.md)\>) => `void` |
| `stop` | () => `void` |

#### Defined in

[auto-scroll/plugin.ts:19](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/auto-scroll/plugin.ts#L19)

___

### autoStartHoldTimer

• `Optional` **autoStartHoldTimer**: `any`

#### Defined in

[auto-start/hold.ts:18](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/auto-start/hold.ts#L18)

___

### coords

• **coords**: [`CoordsSet`](../interfaces/core_types.CoordsSet.md)

#### Defined in

[core/Interaction.ts:175](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/core/Interaction.ts#L175)

___

### doMove

• **doMove**: (`this`: `void`) => `any`

#### Type declaration

▸ (`this`): `any`

##### Parameters

| Name | Type |
| :------ | :------ |
| `this` | `void` |

##### Returns

`any`

#### Defined in

[core/Interaction.ts:171](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/core/Interaction.ts#L171)

___

### dropState

• `Optional` **dropState**: `DropState`

#### Defined in

[actions/drop/plugin.ts:128](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/actions/drop/plugin.ts#L128)

___

### element

• **element**: [`Element`](../modules/core_types.md#element) = `null`

the target element of the interactable

#### Defined in

[core/Interaction.ts:113](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/core/Interaction.ts#L113)

___

### gesture

• `Optional` **gesture**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `angle` | `number` |
| `distance` | `number` |
| `scale` | `number` |
| `startAngle` | `number` |
| `startDistance` | `number` |

#### Defined in

[actions/gesture/plugin.ts:12](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/actions/gesture/plugin.ts#L12)

___

### holdIntervalHandle

• `Optional` **holdIntervalHandle**: `any`

#### Defined in

[pointer-events/holdRepeat.ts:12](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/pointer-events/holdRepeat.ts#L12)

___

### inertia

• `Optional` **inertia**: [`InertiaState`](inertia_plugin.InertiaState.md)

#### Defined in

[inertia/plugin.ts:27](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/inertia/plugin.ts#L27)

___

### interactable

• **interactable**: [`Interactable`](core_Interactable.Interactable.md) = `null`

current interactable being interacted with

#### Defined in

[core/Interaction.ts:110](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/core/Interaction.ts#L110)

___

### modification

• `Optional` **modification**: [`Modification`](modifiers_Modification.Modification.md)

#### Defined in

[modifiers/base.ts:10](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/modifiers/base.ts#L10)

___

### offset

• **offset**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `pending` | [`Point`](../interfaces/core_types.Point.md) |
| `total` | [`Point`](../interfaces/core_types.Point.md) |

#### Defined in

[offset/plugin.ts:10](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/offset/plugin.ts#L10)

___

### offsetBy

• `Optional` **offsetBy**: (`this`: [`Interaction`](core_Interaction.Interaction.md)\<keyof [`ActionMap`](../interfaces/core_types.ActionMap.md)\>, `__namedParameters`: [`Point`](../interfaces/core_types.Point.md)) => `void`

#### Type declaration

▸ (`this`, `«destructured»`): `void`

##### Parameters

| Name | Type |
| :------ | :------ |
| `this` | [`Interaction`](core_Interaction.Interaction.md)\<keyof [`ActionMap`](../interfaces/core_types.ActionMap.md)\> |
| `«destructured»` | [`Point`](../interfaces/core_types.Point.md) |

##### Returns

`void`

#### Defined in

[offset/plugin.ts:9](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/offset/plugin.ts#L9)

___

### pointerIsDown

• **pointerIsDown**: `boolean` = `false`

#### Defined in

[core/Interaction.ts:158](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/core/Interaction.ts#L158)

___

### pointerType

• **pointerType**: `string`

#### Defined in

[core/Interaction.ts:135](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/core/Interaction.ts#L135)

___

### pointerWasMoved

• **pointerWasMoved**: `boolean` = `false`

#### Defined in

[core/Interaction.ts:159](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/core/Interaction.ts#L159)

___

### prepared

• **prepared**: [`ActionProps`](../interfaces/core_types.ActionProps.md)\<`T`\>

#### Defined in

[core/Interaction.ts:129](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/core/Interaction.ts#L129)

___

### prevTap

• `Optional` **prevTap**: [`PointerEvent`](pointer_events_PointerEvent.PointerEvent.md)\<`string`\>

#### Defined in

[pointer-events/base.ts:34](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/pointer-events/base.ts#L34)

___

### rect

• **rect**: `Required`\<[`Rect`](../interfaces/core_types.Rect.md)\> = `null`

#### Defined in

[core/Interaction.ts:114](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/core/Interaction.ts#L114)

___

### resizeAxes

• **resizeAxes**: ``"x"`` \| ``"y"`` \| ``"xy"``

#### Defined in

[actions/resize/plugin.ts:77](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/actions/resize/plugin.ts#L77)

___

### resizeStartAspectRatio

• **resizeStartAspectRatio**: `number`

#### Defined in

[actions/resize/plugin.ts:80](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/actions/resize/plugin.ts#L80)

___

### tapTime

• `Optional` **tapTime**: `number`

#### Defined in

[pointer-events/base.ts:35](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/pointer-events/base.ts#L35)

## Methods

### currentAction

▸ **currentAction**(): `T`

#### Returns

`T`

#### Defined in

[core/Interaction.ts:459](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/core/Interaction.ts#L459)

___

### destroy

▸ **destroy**(): `void`

#### Returns

`void`

#### Defined in

[core/Interaction.ts:575](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/core/Interaction.ts#L575)

___

### end

▸ **end**(`event?`): `void`

```js
interact(target)
  .draggable(true)
  .on('move', function (event) {
    if (event.pageX > 1000) {
      // end the current action
      event.interaction.end()
      // stop all further listeners from being called
      event.stopImmediatePropagation()
    }
  })
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `event?` | [`PointerEventType`](../modules/core_types.md#pointereventtype) |

#### Returns

`void`

#### Defined in

[core/Interaction.ts:439](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/core/Interaction.ts#L439)

___

### interacting

▸ **interacting**(): `boolean`

#### Returns

`boolean`

#### Defined in

[core/Interaction.ts:463](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/core/Interaction.ts#L463)

___

### move

▸ **move**(`signalArg?`): `void`

```js
interact(target)
  .draggable(true)
  .on('dragmove', function (event) {
    if (someCondition) {
      // change the snap settings
      event.interactable.draggable({ snap: { targets: [] }})
      // fire another move event with re-calculated snap
      event.interaction.move()
    }
  })
```

Force a move of the current action at the same coordinates. Useful if
snap/restrict has been changed and you want a movement with the new
settings.

#### Parameters

| Name | Type |
| :------ | :------ |
| `signalArg?` | `any` |

#### Returns

`void`

#### Defined in

[core/Interaction.ts:364](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/core/Interaction.ts#L364)

___

### pointerDown

▸ **pointerDown**(`pointer`, `event`, `eventTarget`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `pointer` | [`PointerType`](../modules/core_types.md#pointertype) |
| `event` | [`PointerEventType`](../modules/core_types.md#pointereventtype) |
| `eventTarget` | `Node` |

#### Returns

`void`

#### Defined in

[core/Interaction.ts:215](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/core/Interaction.ts#L215)

___

### pointerMove

▸ **pointerMove**(`pointer`, `event`, `eventTarget`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `pointer` | [`PointerType`](../modules/core_types.md#pointertype) |
| `event` | [`PointerEventType`](../modules/core_types.md#pointereventtype) |
| `eventTarget` | `Node` |

#### Returns

`void`

#### Defined in

[core/Interaction.ts:290](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/core/Interaction.ts#L290)

___

### start

▸ **start**\<`A`\>(`action`, `interactable`, `element`): `boolean`

```js
interact(target)
  .draggable({
    // disable the default drag start by down->move
    manualStart: true
  })
  // start dragging after the user holds the pointer down
  .on('hold', function (event) {
    var interaction = event.interaction

    if (!interaction.interacting()) {
      interaction.start({ name: 'drag' },
                        event.interactable,
                        event.currentTarget)
    }
})
```

Start an action with the given Interactable and Element as tartgets. The
action must be enabled for the target Interactable and an appropriate
number of pointers must be held down - 1 for drag/resize, 2 for gesture.

Use it with `interactable.<action>able({ manualStart: false })` to always
[start actions manually](https://github.com/taye/interact.js/issues/114)

#### Type parameters

| Name | Type |
| :------ | :------ |
| `A` | extends keyof [`ActionMap`](../interfaces/core_types.ActionMap.md) |

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `action` | [`ActionProps`](../interfaces/core_types.ActionProps.md)\<`A`\> | The action to be performed - drag, resize, etc. |
| `interactable` | [`Interactable`](core_Interactable.Interactable.md) | - |
| `element` | [`Element`](../modules/core_types.md#element) | The DOM Element to target |

#### Returns

`boolean`

Whether the interaction was successfully started

#### Defined in

[core/Interaction.ts:261](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/core/Interaction.ts#L261)

___

### stop

▸ **stop**(): `void`

#### Returns

`void`

#### Defined in

[core/Interaction.ts:467](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/core/Interaction.ts#L467)

___

### styleCursor

▸ **styleCursor**(`newValue`): [`Interaction`](core_Interaction.Interaction.md)\<`T`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `newValue` | `boolean` |

#### Returns

[`Interaction`](core_Interaction.Interaction.md)\<`T`\>

#### Defined in

[actions/resize/plugin.ts:78](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/actions/resize/plugin.ts#L78)

▸ **styleCursor**(): `boolean`

#### Returns

`boolean`

#### Defined in

[actions/resize/plugin.ts:79](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/actions/resize/plugin.ts#L79)
