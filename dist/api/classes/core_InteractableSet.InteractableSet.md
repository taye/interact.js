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

[core/InteractableSet.ts:24](https://github.com/taye/interact.js/blob/f56f1fa2/packages/@interactjs/core/InteractableSet.ts#L24)

___

### scope

• **scope**: `Scope`

#### Defined in

[core/InteractableSet.ts:30](https://github.com/taye/interact.js/blob/f56f1fa2/packages/@interactjs/core/InteractableSet.ts#L30)

___

### selectorMap

• **selectorMap**: `Object` = `{}`

#### Index signature

▪ [selector: `string`]: [`Interactable`](core_Interactable.Interactable.md)[]

#### Defined in

[core/InteractableSet.ts:26](https://github.com/taye/interact.js/blob/f56f1fa2/packages/@interactjs/core/InteractableSet.ts#L26)

## Methods

### forEachMatch

▸ **forEachMatch**\<`T`\>(`node`, `callback`): `void` \| `T`

#### Type parameters

| Name |
| :------ |
| `T` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `node` | `Node` |
| `callback` | (`interactable`: [`Interactable`](core_Interactable.Interactable.md)) => `T` |

#### Returns

`void` \| `T`

#### Defined in

[core/InteractableSet.ts:98](https://github.com/taye/interact.js/blob/f56f1fa2/packages/@interactjs/core/InteractableSet.ts#L98)

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

[core/InteractableSet.ts:82](https://github.com/taye/interact.js/blob/f56f1fa2/packages/@interactjs/core/InteractableSet.ts#L82)

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

[core/InteractableSet.ts:47](https://github.com/taye/interact.js/blob/f56f1fa2/packages/@interactjs/core/InteractableSet.ts#L47)
