[@interactjs](../README.md) / auto-scroll/plugin

# Module: auto-scroll/plugin

## Table of contents

### Interfaces

- [AutoScrollOptions](../interfaces/auto_scroll_plugin.AutoScrollOptions.md)

### Functions

- [getContainer](auto_scroll_plugin.md#getcontainer)
- [getScroll](auto_scroll_plugin.md#getscroll)
- [getScrollSize](auto_scroll_plugin.md#getscrollsize)
- [getScrollSizeDelta](auto_scroll_plugin.md#getscrollsizedelta)

## Functions

### getContainer

▸ **getContainer**(`value`, `interactable`, `element`): `any`

#### Parameters

| Name | Type |
| :------ | :------ |
| `value` | `any` |
| `interactable` | [`Interactable`](../classes/core_Interactable.Interactable.md) |
| `element` | `Element` |

#### Returns

`any`

#### Defined in

[auto-scroll/plugin.ts:207](https://github.com/taye/interact.js/blob/d3d47461/packages/@interactjs/auto-scroll/plugin.ts#L207)

___

### getScroll

▸ **getScroll**(`container`): `Object`

#### Parameters

| Name | Type |
| :------ | :------ |
| `container` | `any` |

#### Returns

`Object`

| Name | Type |
| :------ | :------ |
| `x` | `any` |
| `y` | `any` |

#### Defined in

[auto-scroll/plugin.ts:213](https://github.com/taye/interact.js/blob/d3d47461/packages/@interactjs/auto-scroll/plugin.ts#L213)

___

### getScrollSize

▸ **getScrollSize**(`container`): `Object`

#### Parameters

| Name | Type |
| :------ | :------ |
| `container` | `any` |

#### Returns

`Object`

| Name | Type |
| :------ | :------ |
| `x` | `any` |
| `y` | `any` |

#### Defined in

[auto-scroll/plugin.ts:221](https://github.com/taye/interact.js/blob/d3d47461/packages/@interactjs/auto-scroll/plugin.ts#L221)

___

### getScrollSizeDelta

▸ **getScrollSizeDelta**\<`T`\>(`«destructured»`, `func`): `Object`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `T` | extends keyof [`ActionMap`](../interfaces/core_types.ActionMap.md) |

#### Parameters

| Name | Type |
| :------ | :------ |
| `«destructured»` | `Object` |
| › `element` | `Element` |
| › `interaction` | `Partial`\<[`Interaction`](../classes/core_Interaction.Interaction.md)\<`T`\>\> |
| `func` | `any` |

#### Returns

`Object`

| Name | Type |
| :------ | :------ |
| `x` | `number` |
| `y` | `number` |

#### Defined in

[auto-scroll/plugin.ts:229](https://github.com/taye/interact.js/blob/d3d47461/packages/@interactjs/auto-scroll/plugin.ts#L229)
