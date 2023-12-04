[@interactjs](../README.md) / core/Interaction

# Module: core/Interaction

## Table of contents

### Enumerations

- [\_ProxyMethods](../enums/core_Interaction._ProxyMethods.md)
- [\_ProxyValues](../enums/core_Interaction._ProxyValues.md)

### Classes

- [Interaction](../classes/core_Interaction.Interaction.md)
- [PointerInfo](../classes/core_Interaction.PointerInfo.md)

### Interfaces

- [DoPhaseArg](../interfaces/core_Interaction.DoPhaseArg.md)

### Type Aliases

- [DoAnyPhaseArg](core_Interaction.md#doanyphasearg)
- [InteractionProxy](core_Interaction.md#interactionproxy)
- [PointerArgProps](core_Interaction.md#pointerargprops)

## Type Aliases

### DoAnyPhaseArg

Ƭ **DoAnyPhaseArg**: [`DoPhaseArg`](../interfaces/core_Interaction.DoPhaseArg.md)\<[`ActionName`](core_types.md#actionname), [`EventPhase`](core_InteractEvent.md#eventphase)\>

#### Defined in

[core/Interaction.ts:61](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/core/Interaction.ts#L61)

___

### InteractionProxy

Ƭ **InteractionProxy**\<`T`\>: `Pick`\<[`Interaction`](../classes/core_Interaction.Interaction.md)\<`T`\>, keyof typeof [`_ProxyValues`](../enums/core_Interaction._ProxyValues.md) \| keyof typeof [`_ProxyMethods`](../enums/core_Interaction._ProxyMethods.md)\>

#### Type parameters

| Name | Type |
| :------ | :------ |
| `T` | extends [`ActionName`](core_types.md#actionname) \| ``null`` = `never` |

#### Defined in

[core/Interaction.ts:101](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/core/Interaction.ts#L101)

___

### PointerArgProps

Ƭ **PointerArgProps**\<`T`\>: \{ `event`: [`PointerEventType`](core_types.md#pointereventtype) ; `eventTarget`: `Node` ; `interaction`: [`Interaction`](../classes/core_Interaction.Interaction.md)\<`never`\> ; `pointer`: [`PointerType`](core_types.md#pointertype) ; `pointerIndex`: `number` ; `pointerInfo`: [`PointerInfo`](../classes/core_Interaction.PointerInfo.md)  } & `T`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `T` | extends `Object` = {} |

#### Defined in

[core/Interaction.ts:43](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/core/Interaction.ts#L43)
