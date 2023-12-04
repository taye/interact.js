[@interactjs](../README.md) / modifiers/base

# Module: modifiers/base

## Table of contents

### Functions

- [addEventModifiers](modifiers_base.md#addeventmodifiers)
- [makeModifier](modifiers_base.md#makemodifier)

## Functions

### addEventModifiers

▸ **addEventModifiers**(`«destructured»`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `«destructured»` | `Object` |
| › `iEvent` | [`InteractEvent`](../classes/core_InteractEvent.InteractEvent.md)\<`any`, keyof [`PhaseMap`](../interfaces/core_InteractEvent.PhaseMap.md)\> |
| › `interaction` | [`Interaction`](../classes/core_Interaction.Interaction.md)\<`any`\> |

#### Returns

`void`

#### Defined in

[modifiers/base.ts:81](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/modifiers/base.ts#L81)

___

### makeModifier

▸ **makeModifier**\<`Defaults`, `State`, `Name`, `Result`\>(`module`, `name?`): (`_options?`: `Partial`\<`Defaults`\>) => [`Modifier`](../interfaces/modifiers_types.Modifier.md)\<`Defaults`, `State`, `Name`, `Result`\>

#### Type parameters

| Name | Type |
| :------ | :------ |
| `Defaults` | extends `Object` |
| `State` | extends `Object` |
| `Name` | extends `string` |
| `Result` | `Result` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `module` | [`ModifierModule`](../interfaces/modifiers_types.ModifierModule.md)\<`Defaults`, `State`, `Result`\> |
| `name?` | `Name` |

#### Returns

`fn`

▸ (`_options?`): [`Modifier`](../interfaces/modifiers_types.Modifier.md)\<`Defaults`, `State`, `Name`, `Result`\>

##### Parameters

| Name | Type |
| :------ | :------ |
| `_options?` | `Partial`\<`Defaults`\> |

##### Returns

[`Modifier`](../interfaces/modifiers_types.Modifier.md)\<`Defaults`, `State`, `Name`, `Result`\>

| Name | Type |
| :------ | :------ |
| `_defaults` | `Defaults` |
| `_methods` | \{ `beforeEnd`: (`arg`: [`ModifierArg`](../interfaces/modifiers_types.ModifierArg.md)\<`State`\>) => `void` \| [`Point`](../interfaces/core_types.Point.md) = module.beforeEnd; `set`: (`arg`: [`ModifierArg`](../interfaces/modifiers_types.ModifierArg.md)\<`State`\>) => `Result` = module.set; `start`: (`arg`: [`ModifierArg`](../interfaces/modifiers_types.ModifierArg.md)\<`State`\>) => `void` = module.start; `stop`: (`arg`: [`ModifierArg`](../interfaces/modifiers_types.ModifierArg.md)\<`State`\>) => `void` = module.stop } |
| `_methods.beforeEnd` | (`arg`: [`ModifierArg`](../interfaces/modifiers_types.ModifierArg.md)\<`State`\>) => `void` \| [`Point`](../interfaces/core_types.Point.md) |
| `_methods.set` | (`arg`: [`ModifierArg`](../interfaces/modifiers_types.ModifierArg.md)\<`State`\>) => `Result` |
| `_methods.start` | (`arg`: [`ModifierArg`](../interfaces/modifiers_types.ModifierArg.md)\<`State`\>) => `void` |
| `_methods.stop` | (`arg`: [`ModifierArg`](../interfaces/modifiers_types.ModifierArg.md)\<`State`\>) => `void` |

#### Defined in

[modifiers/base.ts:29](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/modifiers/base.ts#L29)
