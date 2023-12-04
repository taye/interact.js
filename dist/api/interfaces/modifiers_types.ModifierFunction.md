[@interactjs](../README.md) / [modifiers/types](../modules/modifiers_types.md) / ModifierFunction

# Interface: ModifierFunction\<Defaults, State, Name\>

[modifiers/types](../modules/modifiers_types.md).ModifierFunction

## Type parameters

| Name | Type |
| :------ | :------ |
| `Defaults` | extends `Object` |
| `State` | extends [`ModifierState`](../modules/modifiers_types.md#modifierstate) |
| `Name` | extends `string` |

## Callable

### ModifierFunction

▸ **ModifierFunction**(`_options?`): [`Modifier`](modifiers_types.Modifier.md)\<`Defaults`, `State`, `Name`, `any`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `_options?` | `Partial`\<`Defaults`\> |

#### Returns

[`Modifier`](modifiers_types.Modifier.md)\<`Defaults`, `State`, `Name`, `any`\>

#### Defined in

[modifiers/types.ts:64](https://github.com/taye/interact.js/blob/f56f1fa2/packages/@interactjs/modifiers/types.ts#L64)

## Table of contents

### Properties

- [\_defaults](modifiers_types.ModifierFunction.md#_defaults)
- [\_methods](modifiers_types.ModifierFunction.md#_methods)

## Properties

### \_defaults

• **\_defaults**: `Defaults`

#### Defined in

[modifiers/types.ts:65](https://github.com/taye/interact.js/blob/f56f1fa2/packages/@interactjs/modifiers/types.ts#L65)

___

### \_methods

• **\_methods**: [`ModifierModule`](modifiers_types.ModifierModule.md)\<`Defaults`, `State`, `unknown`\>

#### Defined in

[modifiers/types.ts:66](https://github.com/taye/interact.js/blob/f56f1fa2/packages/@interactjs/modifiers/types.ts#L66)
