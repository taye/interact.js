[@interactjs](../README.md) / [modifiers/types](../modules/modifiers_types.md) / Modifier

# Interface: Modifier\<Defaults, State, Name, Result\>

[modifiers/types](../modules/modifiers_types.md).Modifier

## Type parameters

| Name | Type |
| :------ | :------ |
| `Defaults` | `any` |
| `State` | extends [`ModifierState`](../modules/modifiers_types.md#modifierstate) = `any` |
| `Name` | extends `string` = `any` |
| `Result` | `any` |

## Table of contents

### Properties

- [disable](modifiers_types.Modifier.md#disable)
- [enable](modifiers_types.Modifier.md#enable)
- [methods](modifiers_types.Modifier.md#methods)
- [name](modifiers_types.Modifier.md#name)
- [options](modifiers_types.Modifier.md#options)

## Properties

### disable

• **disable**: () => [`Modifier`](modifiers_types.Modifier.md)\<`Defaults`, `State`, `Name`, `Result`\>

#### Type declaration

▸ (): [`Modifier`](modifiers_types.Modifier.md)\<`Defaults`, `State`, `Name`, `Result`\>

##### Returns

[`Modifier`](modifiers_types.Modifier.md)\<`Defaults`, `State`, `Name`, `Result`\>

#### Defined in

[modifiers/types.ts:21](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/modifiers/types.ts#L21)

___

### enable

• **enable**: () => [`Modifier`](modifiers_types.Modifier.md)\<`Defaults`, `State`, `Name`, `Result`\>

#### Type declaration

▸ (): [`Modifier`](modifiers_types.Modifier.md)\<`Defaults`, `State`, `Name`, `Result`\>

##### Returns

[`Modifier`](modifiers_types.Modifier.md)\<`Defaults`, `State`, `Name`, `Result`\>

#### Defined in

[modifiers/types.ts:20](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/modifiers/types.ts#L20)

___

### methods

• **methods**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `beforeEnd?` | (`arg`: [`ModifierArg`](modifiers_types.ModifierArg.md)\<`State`\>) => `void` \| [`Point`](core_types.Point.md) |
| `set?` | (`arg`: [`ModifierArg`](modifiers_types.ModifierArg.md)\<`State`\>) => `Result` |
| `start?` | (`arg`: [`ModifierArg`](modifiers_types.ModifierArg.md)\<`State`\>) => `void` |
| `stop?` | (`arg`: [`ModifierArg`](modifiers_types.ModifierArg.md)\<`State`\>) => `void` |

#### Defined in

[modifiers/types.ts:13](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/modifiers/types.ts#L13)

___

### name

• `Optional` **name**: `Name`

#### Defined in

[modifiers/types.ts:19](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/modifiers/types.ts#L19)

___

### options

• **options**: `Defaults`

#### Defined in

[modifiers/types.ts:12](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/modifiers/types.ts#L12)
