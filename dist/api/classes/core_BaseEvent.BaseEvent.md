[@interactjs](../README.md) / [core/BaseEvent](../modules/core_BaseEvent.md) / BaseEvent

# Class: BaseEvent\<T\>

[core/BaseEvent](../modules/core_BaseEvent.md).BaseEvent

## Type parameters

| Name | Type |
| :------ | :------ |
| `T` | extends [`ActionName`](../modules/core_types.md#actionname) \| ``null`` = `never` |

## Hierarchy

- **`BaseEvent`**

  ↳ [`InteractEvent`](core_InteractEvent.InteractEvent.md)

  ↳ [`PointerEvent`](pointer_events_PointerEvent.PointerEvent.md)

## Table of contents

### Properties

- [currentTarget](core_BaseEvent.BaseEvent.md#currenttarget)
- [immediatePropagationStopped](core_BaseEvent.BaseEvent.md#immediatepropagationstopped)
- [interactable](core_BaseEvent.BaseEvent.md#interactable)
- [interaction](core_BaseEvent.BaseEvent.md#interaction)
- [propagationStopped](core_BaseEvent.BaseEvent.md#propagationstopped)
- [target](core_BaseEvent.BaseEvent.md#target)
- [timeStamp](core_BaseEvent.BaseEvent.md#timestamp)
- [type](core_BaseEvent.BaseEvent.md#type)

### Methods

- [preventDefault](core_BaseEvent.BaseEvent.md#preventdefault)
- [stopImmediatePropagation](core_BaseEvent.BaseEvent.md#stopimmediatepropagation)
- [stopPropagation](core_BaseEvent.BaseEvent.md#stoppropagation)

## Properties

### currentTarget

• **currentTarget**: `Node`

#### Defined in

[core/BaseEvent.ts:8](https://github.com/taye/interact.js/blob/f56f1fa2/packages/@interactjs/core/BaseEvent.ts#L8)

___

### immediatePropagationStopped

• **immediatePropagationStopped**: `boolean` = `false`

#### Defined in

[core/BaseEvent.ts:13](https://github.com/taye/interact.js/blob/f56f1fa2/packages/@interactjs/core/BaseEvent.ts#L13)

___

### interactable

• **interactable**: [`Interactable`](core_Interactable.Interactable.md)

#### Defined in

[core/BaseEvent.ts:9](https://github.com/taye/interact.js/blob/f56f1fa2/packages/@interactjs/core/BaseEvent.ts#L9)

___

### interaction

• **interaction**: [`InteractionProxy`](../modules/core_Interaction.md#interactionproxy)\<`T`\>

#### Defined in

[core/BaseEvent.ts:40](https://github.com/taye/interact.js/blob/f56f1fa2/packages/@interactjs/core/BaseEvent.ts#L40)

___

### propagationStopped

• **propagationStopped**: `boolean` = `false`

#### Defined in

[core/BaseEvent.ts:14](https://github.com/taye/interact.js/blob/f56f1fa2/packages/@interactjs/core/BaseEvent.ts#L14)

___

### target

• **target**: `EventTarget`

#### Defined in

[core/BaseEvent.ts:7](https://github.com/taye/interact.js/blob/f56f1fa2/packages/@interactjs/core/BaseEvent.ts#L7)

___

### timeStamp

• **timeStamp**: `number`

#### Defined in

[core/BaseEvent.ts:12](https://github.com/taye/interact.js/blob/f56f1fa2/packages/@interactjs/core/BaseEvent.ts#L12)

___

### type

• **type**: `string`

#### Defined in

[core/BaseEvent.ts:6](https://github.com/taye/interact.js/blob/f56f1fa2/packages/@interactjs/core/BaseEvent.ts#L6)

## Methods

### preventDefault

▸ **preventDefault**(): `void`

#### Returns

`void`

#### Defined in

[core/BaseEvent.ts:20](https://github.com/taye/interact.js/blob/f56f1fa2/packages/@interactjs/core/BaseEvent.ts#L20)

___

### stopImmediatePropagation

▸ **stopImmediatePropagation**(): `void`

Don't call listeners on the remaining targets

#### Returns

`void`

#### Defined in

[core/BaseEvent.ts:32](https://github.com/taye/interact.js/blob/f56f1fa2/packages/@interactjs/core/BaseEvent.ts#L32)

___

### stopPropagation

▸ **stopPropagation**(): `void`

Don't call any other listeners (even on the current target)

#### Returns

`void`

#### Defined in

[core/BaseEvent.ts:25](https://github.com/taye/interact.js/blob/f56f1fa2/packages/@interactjs/core/BaseEvent.ts#L25)
