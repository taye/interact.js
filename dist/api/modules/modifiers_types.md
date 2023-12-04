[@interactjs](../README.md) / modifiers/types

# Module: modifiers/types

## Table of contents

### Interfaces

- [Modifier](../interfaces/modifiers_types.Modifier.md)
- [ModifierArg](../interfaces/modifiers_types.ModifierArg.md)
- [ModifierFunction](../interfaces/modifiers_types.ModifierFunction.md)
- [ModifierModule](../interfaces/modifiers_types.ModifierModule.md)

### Type Aliases

- [ModifierState](modifiers_types.md#modifierstate)

## Type Aliases

### ModifierState

Ƭ **ModifierState**\<`Defaults`, `StateProps`, `Name`\>: \{ `index?`: `number` ; `methods?`: [`Modifier`](../interfaces/modifiers_types.Modifier.md)\<`Defaults`\>[``"methods"``] ; `name?`: `Name` ; `options`: `Defaults`  } & `StateProps`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `Defaults` | `unknown` |
| `StateProps` | `unknown` |
| `Name` | extends `string` = `any` |

#### Defined in

[modifiers/types.ts:24](https://github.com/taye/interact.js/blob/f56f1fa2/packages/@interactjs/modifiers/types.ts#L24)
