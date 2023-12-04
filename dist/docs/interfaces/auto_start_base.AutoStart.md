[@interactjs](../README.md) / [auto-start/base](../modules/auto_start_base.md) / AutoStart

# Interface: AutoStart

[auto-start/base](../modules/auto_start_base.md).AutoStart

## Table of contents

### Properties

- [cursorElement](auto_start_base.AutoStart.md#cursorelement)
- [maxInteractions](auto_start_base.AutoStart.md#maxinteractions)
- [withinInteractionLimit](auto_start_base.AutoStart.md#withininteractionlimit)

## Properties

### cursorElement

• **cursorElement**: [`Element`](../modules/core_types.md#element)

#### Defined in

[auto-start/base.ts:85](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/auto-start/base.ts#L85)

___

### maxInteractions

• **maxInteractions**: `number`

#### Defined in

[auto-start/base.ts:83](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/auto-start/base.ts#L83)

___

### withinInteractionLimit

• **withinInteractionLimit**: \<T\>(`interactable`: [`Interactable`](../classes/core_Interactable.Interactable.md), `element`: [`Element`](../modules/core_types.md#element), `action`: [`ActionProps`](core_types.ActionProps.md)\<`T`\>, `scope`: `Scope`) => `boolean`

#### Type declaration

▸ \<`T`\>(`interactable`, `element`, `action`, `scope`): `boolean`

##### Type parameters

| Name | Type |
| :------ | :------ |
| `T` | extends keyof [`ActionMap`](core_types.ActionMap.md) |

##### Parameters

| Name | Type |
| :------ | :------ |
| `interactable` | [`Interactable`](../classes/core_Interactable.Interactable.md) |
| `element` | [`Element`](../modules/core_types.md#element) |
| `action` | [`ActionProps`](core_types.ActionProps.md)\<`T`\> |
| `scope` | `Scope` |

##### Returns

`boolean`

#### Defined in

[auto-start/base.ts:84](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/auto-start/base.ts#L84)
