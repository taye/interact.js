[@interactjs](../README.md) / [core/Interaction](../modules/core_Interaction.md) / DoPhaseArg

# Interface: DoPhaseArg\<T, P\>

[core/Interaction](../modules/core_Interaction.md).DoPhaseArg

## Type parameters

| Name | Type |
| :------ | :------ |
| `T` | extends [`ActionName`](../modules/core_types.md#actionname) |
| `P` | extends [`EventPhase`](../modules/core_InteractEvent.md#eventphase) |

## Table of contents

### Properties

- [event](core_Interaction.DoPhaseArg.md#event)
- [iEvent](core_Interaction.DoPhaseArg.md#ievent)
- [interaction](core_Interaction.DoPhaseArg.md#interaction)
- [phase](core_Interaction.DoPhaseArg.md#phase)
- [preEnd](core_Interaction.DoPhaseArg.md#preend)
- [type](core_Interaction.DoPhaseArg.md#type)

## Properties

### event

• **event**: [`PointerEventType`](../modules/core_types.md#pointereventtype)

#### Defined in

[core/Interaction.ts:53](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/core/Interaction.ts#L53)

___

### iEvent

• **iEvent**: [`InteractEvent`](../classes/core_InteractEvent.InteractEvent.md)\<`T`, `P`\>

#### Defined in

[core/Interaction.ts:56](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/core/Interaction.ts#L56)

___

### interaction

• **interaction**: [`Interaction`](../classes/core_Interaction.Interaction.md)\<`T`\>

#### Defined in

[core/Interaction.ts:55](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/core/Interaction.ts#L55)

___

### phase

• **phase**: keyof [`PhaseMap`](core_InteractEvent.PhaseMap.md)

#### Defined in

[core/Interaction.ts:54](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/core/Interaction.ts#L54)

___

### preEnd

• `Optional` **preEnd**: `boolean`

#### Defined in

[core/Interaction.ts:57](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/core/Interaction.ts#L57)

___

### type

• `Optional` **type**: `string`

#### Defined in

[core/Interaction.ts:58](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/core/Interaction.ts#L58)
