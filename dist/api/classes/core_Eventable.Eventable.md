[@interactjs](../README.md) / [core/Eventable](../modules/core_Eventable.md) / Eventable

# Class: Eventable

[core/Eventable](../modules/core_Eventable.md).Eventable

## Table of contents

### Properties

- [global](core_Eventable.Eventable.md#global)
- [immediatePropagationStopped](core_Eventable.Eventable.md#immediatepropagationstopped)
- [options](core_Eventable.Eventable.md#options)
- [propagationStopped](core_Eventable.Eventable.md#propagationstopped)
- [types](core_Eventable.Eventable.md#types)

### Methods

- [fire](core_Eventable.Eventable.md#fire)
- [getRect](core_Eventable.Eventable.md#getrect)
- [off](core_Eventable.Eventable.md#off)
- [on](core_Eventable.Eventable.md#on)

## Properties

### global

• **global**: `any`

#### Defined in

[core/Eventable.ts:23](https://github.com/taye/interact.js/blob/f56f1fa2/packages/@interactjs/core/Eventable.ts#L23)

___

### immediatePropagationStopped

• **immediatePropagationStopped**: `boolean` = `false`

#### Defined in

[core/Eventable.ts:22](https://github.com/taye/interact.js/blob/f56f1fa2/packages/@interactjs/core/Eventable.ts#L22)

___

### options

• **options**: `any`

#### Defined in

[core/Eventable.ts:19](https://github.com/taye/interact.js/blob/f56f1fa2/packages/@interactjs/core/Eventable.ts#L19)

___

### propagationStopped

• **propagationStopped**: `boolean` = `false`

#### Defined in

[core/Eventable.ts:21](https://github.com/taye/interact.js/blob/f56f1fa2/packages/@interactjs/core/Eventable.ts#L21)

___

### types

• **types**: `NormalizedListeners` = `{}`

#### Defined in

[core/Eventable.ts:20](https://github.com/taye/interact.js/blob/f56f1fa2/packages/@interactjs/core/Eventable.ts#L20)

## Methods

### fire

▸ **fire**\<`T`\>(`event`): `void`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `T` | extends `Object` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | `T` |

#### Returns

`void`

#### Defined in

[core/Eventable.ts:29](https://github.com/taye/interact.js/blob/f56f1fa2/packages/@interactjs/core/Eventable.ts#L29)

___

### getRect

▸ **getRect**(`_element`): [`Rect`](../interfaces/core_types.Rect.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `_element` | `Element` |

#### Returns

[`Rect`](../interfaces/core_types.Rect.md)

#### Defined in

[core/Eventable.ts:73](https://github.com/taye/interact.js/blob/f56f1fa2/packages/@interactjs/core/Eventable.ts#L73)

___

### off

▸ **off**(`type`, `listener`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `type` | `string` |
| `listener` | [`ListenersArg`](../modules/core_types.md#listenersarg) |

#### Returns

`void`

#### Defined in

[core/Eventable.ts:53](https://github.com/taye/interact.js/blob/f56f1fa2/packages/@interactjs/core/Eventable.ts#L53)

___

### on

▸ **on**(`type`, `listener`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `type` | `string` |
| `listener` | [`ListenersArg`](../modules/core_types.md#listenersarg) |

#### Returns

`void`

#### Defined in

[core/Eventable.ts:45](https://github.com/taye/interact.js/blob/f56f1fa2/packages/@interactjs/core/Eventable.ts#L45)
