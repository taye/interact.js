[@interactjs](../README.md) / [core/InteractableSet](../modules/core_InteractableSet.md) / InteractableSet

# Class: InteractableSet

[core/InteractableSet](../modules/core_InteractableSet.md).InteractableSet

## Table of contents

### Properties

- [list](core_InteractableSet.InteractableSet.md#list)
- [scope](core_InteractableSet.InteractableSet.md#scope)
- [selectorMap](core_InteractableSet.InteractableSet.md#selectormap)

### Methods

- [forEachMatch](core_InteractableSet.InteractableSet.md#foreachmatch)
- [getExisting](core_InteractableSet.InteractableSet.md#getexisting)
- [new](core_InteractableSet.InteractableSet.md#new)

## Properties

### list

• **list**: [`Interactable`](core_Interactable.Interactable.md)[] = `[]`

#### Defined in

[core/InteractableSet.ts:23](https://github.com/taye/interact.js/blob/97a553d8/packages/@interactjs/core/InteractableSet.ts#L23)

___

### scope

• **scope**: `Scope`

#### Defined in

[core/InteractableSet.ts:29](https://github.com/taye/interact.js/blob/97a553d8/packages/@interactjs/core/InteractableSet.ts#L29)

___

### selectorMap

• **selectorMap**: `Object` = `{}`

#### Index signature

▪ [selector: `string`]: [`Interactable`](core_Interactable.Interactable.md)[]

#### Defined in

[core/InteractableSet.ts:25](https://github.com/taye/interact.js/blob/97a553d8/packages/@interactjs/core/InteractableSet.ts#L25)

## Methods

### forEachMatch

▸ **forEachMatch**\<`T`\>(`target`, `callback`): `void` \| `T`

#### Type parameters

| Name |
| :------ |
| `T` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `target` | [`Target`](../modules/core_types.md#target) |
| `callback` | (`interactable`: [`Interactable`](core_Interactable.Interactable.md)) => `T` |

#### Returns

`void` \| `T`

#### Defined in

[core/InteractableSet.ts:101](https://github.com/taye/interact.js/blob/97a553d8/packages/@interactjs/core/InteractableSet.ts#L101)

___

### getExisting

▸ **getExisting**(`target`, `options?`): [`Interactable`](core_Interactable.Interactable.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `target` | [`Target`](../modules/core_types.md#target) |
| `options?` | [`Options`](../modules/core_options.md#options) |

#### Returns

[`Interactable`](core_Interactable.Interactable.md)

#### Defined in

[core/InteractableSet.ts:81](https://github.com/taye/interact.js/blob/97a553d8/packages/@interactjs/core/InteractableSet.ts#L81)

___

### new

▸ **new**(`target`, `options?`): [`Interactable`](core_Interactable.Interactable.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `target` | [`Target`](../modules/core_types.md#target) |
| `options?` | `any` |

#### Returns

[`Interactable`](core_Interactable.Interactable.md)

#### Defined in

[core/InteractableSet.ts:46](https://github.com/taye/interact.js/blob/97a553d8/packages/@interactjs/core/InteractableSet.ts#L46)
