[@interactjs](../README.md) / [modifiers/types](../modules/modifiers_types.md) / ModifierModule

# Interface: ModifierModule\<Defaults, State, Result\>

[modifiers/types](../modules/modifiers_types.md).ModifierModule

## Type parameters

| Name | Type |
| :------ | :------ |
| `Defaults` | extends `Object` |
| `State` | extends [`ModifierState`](../modules/modifiers_types.md#modifierstate) |
| `Result` | `unknown` |

## Table of contents

### Properties

- [defaults](modifiers_types.ModifierModule.md#defaults)

### Methods

- [beforeEnd](modifiers_types.ModifierModule.md#beforeend)
- [set](modifiers_types.ModifierModule.md#set)
- [start](modifiers_types.ModifierModule.md#start)
- [stop](modifiers_types.ModifierModule.md#stop)

## Properties

### defaults

• `Optional` **defaults**: `Defaults`

#### Defined in

[modifiers/types.ts:52](https://github.com/taye/interact.js/blob/24fdee86/packages/@interactjs/modifiers/types.ts#L52)

## Methods

### beforeEnd

▸ **beforeEnd**(`arg`): `void` \| [`Point`](core_types.Point.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `arg` | [`ModifierArg`](modifiers_types.ModifierArg.md)\<`State`\> |

#### Returns

`void` \| [`Point`](core_types.Point.md)

#### Defined in

[modifiers/types.ts:55](https://github.com/taye/interact.js/blob/24fdee86/packages/@interactjs/modifiers/types.ts#L55)

___

### set

▸ **set**(`arg`): `Result`

#### Parameters

| Name | Type |
| :------ | :------ |
| `arg` | [`ModifierArg`](modifiers_types.ModifierArg.md)\<`State`\> |

#### Returns

`Result`

#### Defined in

[modifiers/types.ts:54](https://github.com/taye/interact.js/blob/24fdee86/packages/@interactjs/modifiers/types.ts#L54)

___

### start

▸ **start**(`arg`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `arg` | [`ModifierArg`](modifiers_types.ModifierArg.md)\<`State`\> |

#### Returns

`void`

#### Defined in

[modifiers/types.ts:53](https://github.com/taye/interact.js/blob/24fdee86/packages/@interactjs/modifiers/types.ts#L53)

___

### stop

▸ **stop**(`arg`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `arg` | [`ModifierArg`](modifiers_types.ModifierArg.md)\<`State`\> |

#### Returns

`void`

#### Defined in

[modifiers/types.ts:56](https://github.com/taye/interact.js/blob/24fdee86/packages/@interactjs/modifiers/types.ts#L56)
