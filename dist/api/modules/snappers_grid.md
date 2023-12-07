[@interactjs](../README.md) / snappers/grid

# Module: snappers/grid

## Table of contents

### Interfaces

- [GridOptionsBase](../interfaces/snappers_grid.GridOptionsBase.md)
- [GridOptionsBottomRight](../interfaces/snappers_grid.GridOptionsBottomRight.md)
- [GridOptionsTopLeft](../interfaces/snappers_grid.GridOptionsTopLeft.md)
- [GridOptionsWidthHeight](../interfaces/snappers_grid.GridOptionsWidthHeight.md)
- [GridOptionsXY](../interfaces/snappers_grid.GridOptionsXY.md)

### Type Aliases

- [GridOptions](snappers_grid.md#gridoptions)

### Functions

- [default](snappers_grid.md#default)

## Type Aliases

### GridOptions

Ƭ **GridOptions**: [`GridOptionsXY`](../interfaces/snappers_grid.GridOptionsXY.md) \| [`GridOptionsTopLeft`](../interfaces/snappers_grid.GridOptionsTopLeft.md) \| [`GridOptionsBottomRight`](../interfaces/snappers_grid.GridOptionsBottomRight.md) \| [`GridOptionsWidthHeight`](../interfaces/snappers_grid.GridOptionsWidthHeight.md)

#### Defined in

[snappers/grid.ts:26](https://github.com/taye/interact.js/blob/24fdee86/packages/@interactjs/snappers/grid.ts#L26)

## Functions

### default

▸ **default**(`grid`): `SnapFunction` & \{ `coordFields`: (readonly [``"x"``, ``"y"``] \| readonly [``"left"``, ``"top"``] \| readonly [``"right"``, ``"bottom"``] \| readonly [``"width"``, ``"height"``])[] ; `grid`: [`GridOptions`](snappers_grid.md#gridoptions)  }

#### Parameters

| Name | Type |
| :------ | :------ |
| `grid` | [`GridOptions`](snappers_grid.md#gridoptions) |

#### Returns

`SnapFunction` & \{ `coordFields`: (readonly [``"x"``, ``"y"``] \| readonly [``"left"``, ``"top"``] \| readonly [``"right"``, ``"bottom"``] \| readonly [``"width"``, ``"height"``])[] ; `grid`: [`GridOptions`](snappers_grid.md#gridoptions)  }

#### Defined in

[snappers/grid.ts:28](https://github.com/taye/interact.js/blob/24fdee86/packages/@interactjs/snappers/grid.ts#L28)
