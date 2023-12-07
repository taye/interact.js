[@interactjs](../README.md) / [pointer-events/PointerEvent](../modules/pointer_events_PointerEvent.md) / PointerEvent

# Class: PointerEvent\<T\>

[pointer-events/PointerEvent](../modules/pointer_events_PointerEvent.md).PointerEvent

## Type parameters

| Name | Type |
| :------ | :------ |
| `T` | extends `string` = `any` |

## Hierarchy

- [`BaseEvent`](core_BaseEvent.BaseEvent.md)\<`never`\>

  ↳ **`PointerEvent`**

## Table of contents

### Properties

- [clientX](pointer_events_PointerEvent.PointerEvent.md#clientx)
- [clientY](pointer_events_PointerEvent.PointerEvent.md#clienty)
- [count](pointer_events_PointerEvent.PointerEvent.md#count)
- [currentTarget](pointer_events_PointerEvent.PointerEvent.md#currenttarget)
- [double](pointer_events_PointerEvent.PointerEvent.md#double)
- [dt](pointer_events_PointerEvent.PointerEvent.md#dt)
- [eventable](pointer_events_PointerEvent.PointerEvent.md#eventable)
- [immediatePropagationStopped](pointer_events_PointerEvent.PointerEvent.md#immediatepropagationstopped)
- [interactable](pointer_events_PointerEvent.PointerEvent.md#interactable)
- [interaction](pointer_events_PointerEvent.PointerEvent.md#interaction)
- [originalEvent](pointer_events_PointerEvent.PointerEvent.md#originalevent)
- [pageX](pointer_events_PointerEvent.PointerEvent.md#pagex)
- [pageY](pointer_events_PointerEvent.PointerEvent.md#pagey)
- [pointerId](pointer_events_PointerEvent.PointerEvent.md#pointerid)
- [pointerType](pointer_events_PointerEvent.PointerEvent.md#pointertype)
- [propagationStopped](pointer_events_PointerEvent.PointerEvent.md#propagationstopped)
- [target](pointer_events_PointerEvent.PointerEvent.md#target)
- [timeStamp](pointer_events_PointerEvent.PointerEvent.md#timestamp)
- [type](pointer_events_PointerEvent.PointerEvent.md#type)

### Methods

- [\_addOrigin](pointer_events_PointerEvent.PointerEvent.md#_addorigin)
- [\_subtractOrigin](pointer_events_PointerEvent.PointerEvent.md#_subtractorigin)
- [preventDefault](pointer_events_PointerEvent.PointerEvent.md#preventdefault)
- [stopImmediatePropagation](pointer_events_PointerEvent.PointerEvent.md#stopimmediatepropagation)
- [stopPropagation](pointer_events_PointerEvent.PointerEvent.md#stoppropagation)

## Properties

### clientX

• **clientX**: `number`

#### Defined in

[pointer-events/PointerEvent.ts:14](https://github.com/taye/interact.js/blob/24fdee86/packages/@interactjs/pointer-events/PointerEvent.ts#L14)

___

### clientY

• **clientY**: `number`

#### Defined in

[pointer-events/PointerEvent.ts:15](https://github.com/taye/interact.js/blob/24fdee86/packages/@interactjs/pointer-events/PointerEvent.ts#L15)

___

### count

• `Optional` **count**: `number`

#### Defined in

[pointer-events/holdRepeat.ts:18](https://github.com/taye/interact.js/blob/24fdee86/packages/@interactjs/pointer-events/holdRepeat.ts#L18)

___

### currentTarget

• **currentTarget**: `Node`

#### Inherited from

[BaseEvent](core_BaseEvent.BaseEvent.md).[currentTarget](core_BaseEvent.BaseEvent.md#currenttarget)

#### Defined in

[core/BaseEvent.ts:8](https://github.com/taye/interact.js/blob/24fdee86/packages/@interactjs/core/BaseEvent.ts#L8)

___

### double

• **double**: `boolean`

#### Defined in

[pointer-events/PointerEvent.ts:11](https://github.com/taye/interact.js/blob/24fdee86/packages/@interactjs/pointer-events/PointerEvent.ts#L11)

___

### dt

• **dt**: `number`

#### Defined in

[pointer-events/PointerEvent.ts:16](https://github.com/taye/interact.js/blob/24fdee86/packages/@interactjs/pointer-events/PointerEvent.ts#L16)

___

### eventable

• **eventable**: `any`

#### Defined in

[pointer-events/PointerEvent.ts:17](https://github.com/taye/interact.js/blob/24fdee86/packages/@interactjs/pointer-events/PointerEvent.ts#L17)

___

### immediatePropagationStopped

• **immediatePropagationStopped**: `boolean` = `false`

#### Inherited from

[BaseEvent](core_BaseEvent.BaseEvent.md).[immediatePropagationStopped](core_BaseEvent.BaseEvent.md#immediatepropagationstopped)

#### Defined in

[core/BaseEvent.ts:13](https://github.com/taye/interact.js/blob/24fdee86/packages/@interactjs/core/BaseEvent.ts#L13)

___

### interactable

• **interactable**: [`Interactable`](core_Interactable.Interactable.md)

#### Inherited from

[BaseEvent](core_BaseEvent.BaseEvent.md).[interactable](core_BaseEvent.BaseEvent.md#interactable)

#### Defined in

[core/BaseEvent.ts:9](https://github.com/taye/interact.js/blob/24fdee86/packages/@interactjs/core/BaseEvent.ts#L9)

___

### interaction

• **interaction**: [`InteractionProxy`](../modules/core_Interaction.md#interactionproxy)\<`never`\>

#### Inherited from

[BaseEvent](core_BaseEvent.BaseEvent.md).[interaction](core_BaseEvent.BaseEvent.md#interaction)

#### Defined in

[core/BaseEvent.ts:40](https://github.com/taye/interact.js/blob/24fdee86/packages/@interactjs/core/BaseEvent.ts#L40)

___

### originalEvent

• **originalEvent**: [`PointerEventType`](../modules/core_types.md#pointereventtype)

#### Defined in

[pointer-events/PointerEvent.ts:8](https://github.com/taye/interact.js/blob/24fdee86/packages/@interactjs/pointer-events/PointerEvent.ts#L8)

___

### pageX

• **pageX**: `number`

#### Defined in

[pointer-events/PointerEvent.ts:12](https://github.com/taye/interact.js/blob/24fdee86/packages/@interactjs/pointer-events/PointerEvent.ts#L12)

___

### pageY

• **pageY**: `number`

#### Defined in

[pointer-events/PointerEvent.ts:13](https://github.com/taye/interact.js/blob/24fdee86/packages/@interactjs/pointer-events/PointerEvent.ts#L13)

___

### pointerId

• **pointerId**: `number`

#### Defined in

[pointer-events/PointerEvent.ts:9](https://github.com/taye/interact.js/blob/24fdee86/packages/@interactjs/pointer-events/PointerEvent.ts#L9)

___

### pointerType

• **pointerType**: `string`

#### Defined in

[pointer-events/PointerEvent.ts:10](https://github.com/taye/interact.js/blob/24fdee86/packages/@interactjs/pointer-events/PointerEvent.ts#L10)

___

### propagationStopped

• **propagationStopped**: `boolean` = `false`

#### Inherited from

[BaseEvent](core_BaseEvent.BaseEvent.md).[propagationStopped](core_BaseEvent.BaseEvent.md#propagationstopped)

#### Defined in

[core/BaseEvent.ts:14](https://github.com/taye/interact.js/blob/24fdee86/packages/@interactjs/core/BaseEvent.ts#L14)

___

### target

• **target**: `EventTarget`

#### Inherited from

[BaseEvent](core_BaseEvent.BaseEvent.md).[target](core_BaseEvent.BaseEvent.md#target)

#### Defined in

[core/BaseEvent.ts:7](https://github.com/taye/interact.js/blob/24fdee86/packages/@interactjs/core/BaseEvent.ts#L7)

___

### timeStamp

• **timeStamp**: `number`

#### Inherited from

[BaseEvent](core_BaseEvent.BaseEvent.md).[timeStamp](core_BaseEvent.BaseEvent.md#timestamp)

#### Defined in

[core/BaseEvent.ts:12](https://github.com/taye/interact.js/blob/24fdee86/packages/@interactjs/core/BaseEvent.ts#L12)

___

### type

• **type**: `T`

#### Overrides

[BaseEvent](core_BaseEvent.BaseEvent.md).[type](core_BaseEvent.BaseEvent.md#type)

#### Defined in

[pointer-events/PointerEvent.ts:7](https://github.com/taye/interact.js/blob/24fdee86/packages/@interactjs/pointer-events/PointerEvent.ts#L7)

## Methods

### \_addOrigin

▸ **_addOrigin**(`«destructured»`): [`PointerEvent`](pointer_events_PointerEvent.PointerEvent.md)\<`T`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `«destructured»` | [`Point`](../interfaces/core_types.Point.md) |

#### Returns

[`PointerEvent`](pointer_events_PointerEvent.PointerEvent.md)\<`T`\>

#### Defined in

[pointer-events/PointerEvent.ts:69](https://github.com/taye/interact.js/blob/24fdee86/packages/@interactjs/pointer-events/PointerEvent.ts#L69)

___

### \_subtractOrigin

▸ **_subtractOrigin**(`«destructured»`): [`PointerEvent`](pointer_events_PointerEvent.PointerEvent.md)\<`T`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `«destructured»` | [`Point`](../interfaces/core_types.Point.md) |

#### Returns

[`PointerEvent`](pointer_events_PointerEvent.PointerEvent.md)\<`T`\>

#### Defined in

[pointer-events/PointerEvent.ts:60](https://github.com/taye/interact.js/blob/24fdee86/packages/@interactjs/pointer-events/PointerEvent.ts#L60)

___

### preventDefault

▸ **preventDefault**(): `void`

Prevent the default behaviour of the original Event

#### Returns

`void`

#### Overrides

[BaseEvent](core_BaseEvent.BaseEvent.md).[preventDefault](core_BaseEvent.BaseEvent.md#preventdefault)

#### Defined in

[pointer-events/PointerEvent.ts:81](https://github.com/taye/interact.js/blob/24fdee86/packages/@interactjs/pointer-events/PointerEvent.ts#L81)

___

### stopImmediatePropagation

▸ **stopImmediatePropagation**(): `void`

Don't call listeners on the remaining targets

#### Returns

`void`

#### Inherited from

[BaseEvent](core_BaseEvent.BaseEvent.md).[stopImmediatePropagation](core_BaseEvent.BaseEvent.md#stopimmediatepropagation)

#### Defined in

[core/BaseEvent.ts:32](https://github.com/taye/interact.js/blob/24fdee86/packages/@interactjs/core/BaseEvent.ts#L32)

___

### stopPropagation

▸ **stopPropagation**(): `void`

Don't call any other listeners (even on the current target)

#### Returns

`void`

#### Inherited from

[BaseEvent](core_BaseEvent.BaseEvent.md).[stopPropagation](core_BaseEvent.BaseEvent.md#stoppropagation)

#### Defined in

[core/BaseEvent.ts:25](https://github.com/taye/interact.js/blob/24fdee86/packages/@interactjs/core/BaseEvent.ts#L25)
