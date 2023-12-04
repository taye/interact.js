[@interactjs](../README.md) / [modifiers/types](../modules/modifiers_types.md) / ModifierArg

# Interface: ModifierArg\<State\>

[modifiers/types](../modules/modifiers_types.md).ModifierArg

## Type parameters

| Name | Type |
| :------ | :------ |
| `State` | extends [`ModifierState`](../modules/modifiers_types.md#modifierstate) = [`ModifierState`](../modules/modifiers_types.md#modifierstate) |

## Table of contents

### Properties

- [coords](modifiers_types.ModifierArg.md#coords)
- [edges](modifiers_types.ModifierArg.md#edges)
- [element](modifiers_types.ModifierArg.md#element)
- [interactable](modifiers_types.ModifierArg.md#interactable)
- [interaction](modifiers_types.ModifierArg.md#interaction)
- [pageCoords](modifiers_types.ModifierArg.md#pagecoords)
- [phase](modifiers_types.ModifierArg.md#phase)
- [preEnd](modifiers_types.ModifierArg.md#preend)
- [prevCoords](modifiers_types.ModifierArg.md#prevcoords)
- [prevRect](modifiers_types.ModifierArg.md#prevrect)
- [rect](modifiers_types.ModifierArg.md#rect)
- [startOffset](modifiers_types.ModifierArg.md#startoffset)
- [state](modifiers_types.ModifierArg.md#state)

## Properties

### coords

• **coords**: [`Point`](core_types.Point.md)

#### Defined in

[modifiers/types.ts:42](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/modifiers/types.ts#L42)

___

### edges

• **edges**: [`EdgeOptions`](core_types.EdgeOptions.md)

#### Defined in

[modifiers/types.ts:36](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/modifiers/types.ts#L36)

___

### element

• **element**: `Element`

#### Defined in

[modifiers/types.ts:38](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/modifiers/types.ts#L38)

___

### interactable

• **interactable**: [`Interactable`](../classes/core_Interactable.Interactable.md)

#### Defined in

[modifiers/types.ts:33](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/modifiers/types.ts#L33)

___

### interaction

• **interaction**: [`Interaction`](../classes/core_Interaction.Interaction.md)\<keyof [`ActionMap`](core_types.ActionMap.md)\>

#### Defined in

[modifiers/types.ts:32](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/modifiers/types.ts#L32)

___

### pageCoords

• **pageCoords**: [`Point`](core_types.Point.md)

#### Defined in

[modifiers/types.ts:39](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/modifiers/types.ts#L39)

___

### phase

• **phase**: keyof [`PhaseMap`](core_InteractEvent.PhaseMap.md)

#### Defined in

[modifiers/types.ts:34](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/modifiers/types.ts#L34)

___

### preEnd

• `Optional` **preEnd**: `boolean`

#### Defined in

[modifiers/types.ts:44](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/modifiers/types.ts#L44)

___

### prevCoords

• **prevCoords**: [`Point`](core_types.Point.md)

#### Defined in

[modifiers/types.ts:40](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/modifiers/types.ts#L40)

___

### prevRect

• `Optional` **prevRect**: `Required`\<[`Rect`](core_types.Rect.md)\>

#### Defined in

[modifiers/types.ts:41](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/modifiers/types.ts#L41)

___

### rect

• **rect**: `Required`\<[`Rect`](core_types.Rect.md)\>

#### Defined in

[modifiers/types.ts:35](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/modifiers/types.ts#L35)

___

### startOffset

• **startOffset**: [`Rect`](core_types.Rect.md)

#### Defined in

[modifiers/types.ts:43](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/modifiers/types.ts#L43)

___

### state

• **state**: `State`

#### Defined in

[modifiers/types.ts:37](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/modifiers/types.ts#L37)
