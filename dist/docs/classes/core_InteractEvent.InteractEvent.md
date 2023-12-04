[@interactjs](../README.md) / [core/InteractEvent](../modules/core_InteractEvent.md) / InteractEvent

# Class: InteractEvent\<T, P\>

[core/InteractEvent](../modules/core_InteractEvent.md).InteractEvent

## Type parameters

| Name | Type |
| :------ | :------ |
| `T` | extends [`ActionName`](../modules/core_types.md#actionname) = `never` |
| `P` | extends [`EventPhase`](../modules/core_InteractEvent.md#eventphase) = [`EventPhase`](../modules/core_InteractEvent.md#eventphase) |

## Hierarchy

- [`BaseEvent`](core_BaseEvent.BaseEvent.md)\<`T`\>

  ↳ **`InteractEvent`**

## Table of contents

### Properties

- [altKey](core_InteractEvent.InteractEvent.md#altkey)
- [axes](core_InteractEvent.InteractEvent.md#axes)
- [button](core_InteractEvent.InteractEvent.md#button)
- [buttons](core_InteractEvent.InteractEvent.md#buttons)
- [client](core_InteractEvent.InteractEvent.md#client)
- [clientX](core_InteractEvent.InteractEvent.md#clientx)
- [clientX0](core_InteractEvent.InteractEvent.md#clientx0)
- [clientY](core_InteractEvent.InteractEvent.md#clienty)
- [clientY0](core_InteractEvent.InteractEvent.md#clienty0)
- [ctrlKey](core_InteractEvent.InteractEvent.md#ctrlkey)
- [currentTarget](core_InteractEvent.InteractEvent.md#currenttarget)
- [delta](core_InteractEvent.InteractEvent.md#delta)
- [dragEnter](core_InteractEvent.InteractEvent.md#dragenter)
- [dragLeave](core_InteractEvent.InteractEvent.md#dragleave)
- [dropzone](core_InteractEvent.InteractEvent.md#dropzone)
- [dt](core_InteractEvent.InteractEvent.md#dt)
- [duration](core_InteractEvent.InteractEvent.md#duration)
- [dx](core_InteractEvent.InteractEvent.md#dx)
- [dy](core_InteractEvent.InteractEvent.md#dy)
- [immediatePropagationStopped](core_InteractEvent.InteractEvent.md#immediatepropagationstopped)
- [interactable](core_InteractEvent.InteractEvent.md#interactable)
- [interaction](core_InteractEvent.InteractEvent.md#interaction)
- [metaKey](core_InteractEvent.InteractEvent.md#metakey)
- [modifiers](core_InteractEvent.InteractEvent.md#modifiers)
- [page](core_InteractEvent.InteractEvent.md#page)
- [pageX](core_InteractEvent.InteractEvent.md#pagex)
- [pageY](core_InteractEvent.InteractEvent.md#pagey)
- [propagationStopped](core_InteractEvent.InteractEvent.md#propagationstopped)
- [rect](core_InteractEvent.InteractEvent.md#rect)
- [relatedTarget](core_InteractEvent.InteractEvent.md#relatedtarget)
- [screenX](core_InteractEvent.InteractEvent.md#screenx)
- [screenY](core_InteractEvent.InteractEvent.md#screeny)
- [shiftKey](core_InteractEvent.InteractEvent.md#shiftkey)
- [speed](core_InteractEvent.InteractEvent.md#speed)
- [swipe](core_InteractEvent.InteractEvent.md#swipe)
- [t0](core_InteractEvent.InteractEvent.md#t0)
- [target](core_InteractEvent.InteractEvent.md#target)
- [timeStamp](core_InteractEvent.InteractEvent.md#timestamp)
- [type](core_InteractEvent.InteractEvent.md#type)
- [velocity](core_InteractEvent.InteractEvent.md#velocity)
- [velocityX](core_InteractEvent.InteractEvent.md#velocityx)
- [velocityY](core_InteractEvent.InteractEvent.md#velocityy)
- [x0](core_InteractEvent.InteractEvent.md#x0)
- [y0](core_InteractEvent.InteractEvent.md#y0)

### Methods

- [getSwipe](core_InteractEvent.InteractEvent.md#getswipe)
- [preventDefault](core_InteractEvent.InteractEvent.md#preventdefault)
- [stopImmediatePropagation](core_InteractEvent.InteractEvent.md#stopimmediatepropagation)
- [stopPropagation](core_InteractEvent.InteractEvent.md#stoppropagation)

## Properties

### altKey

• **altKey**: `boolean`

#### Defined in

[core/InteractEvent.ts:48](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/core/InteractEvent.ts#L48)

___

### axes

• `Optional` **axes**: ``"x"`` \| ``"y"`` \| ``"xy"``

#### Defined in

[core/InteractEvent.ts:65](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/core/InteractEvent.ts#L65)

___

### button

• **button**: `number`

#### Defined in

[core/InteractEvent.ts:44](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/core/InteractEvent.ts#L44)

___

### buttons

• **buttons**: `number`

#### Defined in

[core/InteractEvent.ts:45](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/core/InteractEvent.ts#L45)

___

### client

• **client**: [`Point`](../interfaces/core_types.Point.md)

#### Defined in

[core/InteractEvent.ts:51](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/core/InteractEvent.ts#L51)

___

### clientX

• **clientX**: `number`

#### Defined in

[core/InteractEvent.ts:25](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/core/InteractEvent.ts#L25)

___

### clientX0

• **clientX0**: `number`

#### Defined in

[core/InteractEvent.ts:59](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/core/InteractEvent.ts#L59)

___

### clientY

• **clientY**: `number`

#### Defined in

[core/InteractEvent.ts:26](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/core/InteractEvent.ts#L26)

___

### clientY0

• **clientY0**: `number`

#### Defined in

[core/InteractEvent.ts:60](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/core/InteractEvent.ts#L60)

___

### ctrlKey

• **ctrlKey**: `boolean`

#### Defined in

[core/InteractEvent.ts:46](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/core/InteractEvent.ts#L46)

___

### currentTarget

• **currentTarget**: [`Element`](../modules/core_types.md#element)

#### Inherited from

[BaseEvent](core_BaseEvent.BaseEvent.md).[currentTarget](core_BaseEvent.BaseEvent.md#currenttarget)

#### Defined in

[core/InteractEvent.ts:40](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/core/InteractEvent.ts#L40)

___

### delta

• **delta**: [`Point`](../interfaces/core_types.Point.md)

#### Defined in

[core/InteractEvent.ts:52](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/core/InteractEvent.ts#L52)

___

### dragEnter

• `Optional` **dragEnter**: [`Element`](../modules/core_types.md#element)

#### Defined in

[actions/drop/plugin.ts:137](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/actions/drop/plugin.ts#L137)

___

### dragLeave

• `Optional` **dragLeave**: [`Element`](../modules/core_types.md#element)

#### Defined in

[actions/drop/plugin.ts:138](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/actions/drop/plugin.ts#L138)

___

### dropzone

• `Optional` **dropzone**: [`Interactable`](core_Interactable.Interactable.md)

#### Defined in

[actions/drop/plugin.ts:136](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/actions/drop/plugin.ts#L136)

___

### dt

• **dt**: `number`

#### Defined in

[core/InteractEvent.ts:57](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/core/InteractEvent.ts#L57)

___

### duration

• **duration**: `number`

#### Defined in

[core/InteractEvent.ts:58](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/core/InteractEvent.ts#L58)

___

### dx

• **dx**: `number`

#### Defined in

[core/InteractEvent.ts:28](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/core/InteractEvent.ts#L28)

___

### dy

• **dy**: `number`

#### Defined in

[core/InteractEvent.ts:29](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/core/InteractEvent.ts#L29)

___

### immediatePropagationStopped

• **immediatePropagationStopped**: `boolean` = `false`

#### Inherited from

[BaseEvent](core_BaseEvent.BaseEvent.md).[immediatePropagationStopped](core_BaseEvent.BaseEvent.md#immediatepropagationstopped)

#### Defined in

[core/BaseEvent.ts:13](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/core/BaseEvent.ts#L13)

___

### interactable

• **interactable**: [`Interactable`](core_Interactable.Interactable.md)

#### Inherited from

[BaseEvent](core_BaseEvent.BaseEvent.md).[interactable](core_BaseEvent.BaseEvent.md#interactable)

#### Defined in

[core/BaseEvent.ts:9](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/core/BaseEvent.ts#L9)

___

### interaction

• **interaction**: [`InteractionProxy`](../modules/core_Interaction.md#interactionproxy)\<`T`\>

#### Inherited from

[BaseEvent](core_BaseEvent.BaseEvent.md).[interaction](core_BaseEvent.BaseEvent.md#interaction)

#### Defined in

[core/BaseEvent.ts:40](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/core/BaseEvent.ts#L40)

___

### metaKey

• **metaKey**: `boolean`

#### Defined in

[core/InteractEvent.ts:49](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/core/InteractEvent.ts#L49)

___

### modifiers

• `Optional` **modifiers**: \{ `[key: string]`: `any`; `name`: `string`  }[]

#### Defined in

[modifiers/base.ts:16](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/modifiers/base.ts#L16)

___

### page

• **page**: [`Point`](../interfaces/core_types.Point.md)

#### Defined in

[core/InteractEvent.ts:50](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/core/InteractEvent.ts#L50)

___

### pageX

• **pageX**: `number`

#### Defined in

[core/InteractEvent.ts:22](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/core/InteractEvent.ts#L22)

___

### pageY

• **pageY**: `number`

#### Defined in

[core/InteractEvent.ts:23](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/core/InteractEvent.ts#L23)

___

### propagationStopped

• **propagationStopped**: `boolean` = `false`

#### Inherited from

[BaseEvent](core_BaseEvent.BaseEvent.md).[propagationStopped](core_BaseEvent.BaseEvent.md#propagationstopped)

#### Defined in

[core/BaseEvent.ts:14](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/core/BaseEvent.ts#L14)

___

### rect

• **rect**: `Required`\<[`Rect`](../interfaces/core_types.Rect.md)\>

#### Defined in

[core/InteractEvent.ts:53](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/core/InteractEvent.ts#L53)

___

### relatedTarget

• **relatedTarget**: [`Element`](../modules/core_types.md#element) = `null`

#### Defined in

[core/InteractEvent.ts:41](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/core/InteractEvent.ts#L41)

___

### screenX

• `Optional` **screenX**: `number`

#### Defined in

[core/InteractEvent.ts:42](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/core/InteractEvent.ts#L42)

___

### screenY

• `Optional` **screenY**: `number`

#### Defined in

[core/InteractEvent.ts:43](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/core/InteractEvent.ts#L43)

___

### shiftKey

• **shiftKey**: `boolean`

#### Defined in

[core/InteractEvent.ts:47](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/core/InteractEvent.ts#L47)

___

### speed

• **speed**: `number`

#### Defined in

[core/InteractEvent.ts:62](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/core/InteractEvent.ts#L62)

___

### swipe

• **swipe**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `angle` | `number` |
| `down` | `boolean` |
| `left` | `boolean` |
| `right` | `boolean` |
| `speed` | `number` |
| `up` | `boolean` |
| `velocity` | \{ `x`: `number` = interaction.prevEvent.velocityX; `y`: `number` = interaction.prevEvent.velocityY } |
| `velocity.x` | `number` |
| `velocity.y` | `number` |

#### Defined in

[core/InteractEvent.ts:63](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/core/InteractEvent.ts#L63)

___

### t0

• **t0**: `number`

#### Defined in

[core/InteractEvent.ts:56](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/core/InteractEvent.ts#L56)

___

### target

• **target**: [`Element`](../modules/core_types.md#element)

#### Inherited from

[BaseEvent](core_BaseEvent.BaseEvent.md).[target](core_BaseEvent.BaseEvent.md#target)

#### Defined in

[core/InteractEvent.ts:39](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/core/InteractEvent.ts#L39)

___

### timeStamp

• **timeStamp**: `number`

#### Inherited from

[BaseEvent](core_BaseEvent.BaseEvent.md).[timeStamp](core_BaseEvent.BaseEvent.md#timestamp)

#### Defined in

[core/BaseEvent.ts:12](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/core/BaseEvent.ts#L12)

___

### type

• **type**: `string`

#### Inherited from

[BaseEvent](core_BaseEvent.BaseEvent.md).[type](core_BaseEvent.BaseEvent.md#type)

#### Defined in

[core/BaseEvent.ts:6](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/core/BaseEvent.ts#L6)

___

### velocity

• **velocity**: [`Point`](../interfaces/core_types.Point.md)

#### Defined in

[core/InteractEvent.ts:61](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/core/InteractEvent.ts#L61)

___

### velocityX

• **velocityX**: `number`

#### Defined in

[core/InteractEvent.ts:31](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/core/InteractEvent.ts#L31)

___

### velocityY

• **velocityY**: `number`

#### Defined in

[core/InteractEvent.ts:32](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/core/InteractEvent.ts#L32)

___

### x0

• **x0**: `number`

#### Defined in

[core/InteractEvent.ts:54](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/core/InteractEvent.ts#L54)

___

### y0

• **y0**: `number`

#### Defined in

[core/InteractEvent.ts:55](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/core/InteractEvent.ts#L55)

## Methods

### getSwipe

▸ **getSwipe**(): `Object`

#### Returns

`Object`

| Name | Type |
| :------ | :------ |
| `angle` | `number` |
| `down` | `boolean` |
| `left` | `boolean` |
| `right` | `boolean` |
| `speed` | `number` |
| `up` | `boolean` |
| `velocity` | \{ `x`: `number` = interaction.prevEvent.velocityX; `y`: `number` = interaction.prevEvent.velocityY } |
| `velocity.x` | `number` |
| `velocity.y` | `number` |

#### Defined in

[core/InteractEvent.ts:145](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/core/InteractEvent.ts#L145)

___

### preventDefault

▸ **preventDefault**(): `void`

#### Returns

`void`

#### Inherited from

[BaseEvent](core_BaseEvent.BaseEvent.md).[preventDefault](core_BaseEvent.BaseEvent.md#preventdefault)

#### Defined in

[core/InteractEvent.ts:179](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/core/InteractEvent.ts#L179)

___

### stopImmediatePropagation

▸ **stopImmediatePropagation**(): `void`

Don't call listeners on the remaining targets

#### Returns

`void`

#### Inherited from

[BaseEvent](core_BaseEvent.BaseEvent.md).[stopImmediatePropagation](core_BaseEvent.BaseEvent.md#stopimmediatepropagation)

#### Defined in

[core/InteractEvent.ts:184](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/core/InteractEvent.ts#L184)

___

### stopPropagation

▸ **stopPropagation**(): `void`

Don't call any other listeners (even on the current target)

#### Returns

`void`

#### Inherited from

[BaseEvent](core_BaseEvent.BaseEvent.md).[stopPropagation](core_BaseEvent.BaseEvent.md#stoppropagation)

#### Defined in

[core/InteractEvent.ts:191](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/core/InteractEvent.ts#L191)
