[@interactjs](../README.md) / modifiers/aspectRatio

# Module: modifiers/aspectRatio

**`Description`**

This modifier forces elements to be resized with a specified dx/dy ratio.

```js
interact(target).resizable({
  modifiers: [
    interact.modifiers.snapSize({
      targets: [ interact.snappers.grid({ x: 20, y: 20 }) ],
    }),
    interact.aspectRatio({ ratio: 'preserve' }),
  ],
});
```

## Table of contents

### Namespaces

- [default](modifiers_aspectRatio.default.md)

### Interfaces

- [AspectRatioOptions](../interfaces/modifiers_aspectRatio.AspectRatioOptions.md)

### Type Aliases

- [AspectRatioState](modifiers_aspectRatio.md#aspectratiostate)

### Functions

- [default](modifiers_aspectRatio.md#default)

## Type Aliases

### AspectRatioState

Ƭ **AspectRatioState**: [`ModifierState`](modifiers_types.md#modifierstate)\<[`AspectRatioOptions`](../interfaces/modifiers_aspectRatio.AspectRatioOptions.md), \{ `edgeSign`: \{ `x`: `number` ; `y`: `number`  } ; `equalDelta`: `boolean` ; `linkedEdges`: [`EdgeOptions`](../interfaces/core_types.EdgeOptions.md) ; `ratio`: `number` ; `startCoords`: [`Point`](../interfaces/core_types.Point.md) ; `startRect`: [`Rect`](../interfaces/core_types.Rect.md) ; `subModification`: [`Modification`](../classes/modifiers_Modification.Modification.md) ; `xIsPrimaryAxis`: `boolean`  }\>

#### Defined in

[modifiers/aspectRatio.ts:34](https://github.com/taye/interact.js/blob/d3d47461/packages/@interactjs/modifiers/aspectRatio.ts#L34)

## Functions

### default

▸ **default**(`_options?`): [`Modifier`](../interfaces/modifiers_types.Modifier.md)\<[`AspectRatioOptions`](../interfaces/modifiers_aspectRatio.AspectRatioOptions.md), [`AspectRatioState`](modifiers_aspectRatio.md#aspectratiostate), ``"aspectRatio"``, `unknown`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `_options?` | `Partial`\<[`AspectRatioOptions`](../interfaces/modifiers_aspectRatio.AspectRatioOptions.md)\> |

#### Returns

[`Modifier`](../interfaces/modifiers_types.Modifier.md)\<[`AspectRatioOptions`](../interfaces/modifiers_aspectRatio.AspectRatioOptions.md), [`AspectRatioState`](modifiers_aspectRatio.md#aspectratiostate), ``"aspectRatio"``, `unknown`\>

#### Defined in

[modifiers/base.ts:43](https://github.com/taye/interact.js/blob/d3d47461/packages/@interactjs/modifiers/base.ts#L43)
