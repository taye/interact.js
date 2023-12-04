[@interactjs](../README.md) / [core/options](../modules/core_options.md) / BaseDefaults

# Interface: BaseDefaults

[core/options](../modules/core_options.md).BaseDefaults

## Hierarchy

- **`BaseDefaults`**

  ↳ [`OptionsArg`](core_options.OptionsArg.md)

## Table of contents

### Properties

- [actionChecker](core_options.BaseDefaults.md#actionchecker)
- [context](core_options.BaseDefaults.md#context)
- [cursorChecker](core_options.BaseDefaults.md#cursorchecker)
- [deltaSource](core_options.BaseDefaults.md#deltasource)
- [devTools](core_options.BaseDefaults.md#devtools)
- [getRect](core_options.BaseDefaults.md#getrect)
- [preventDefault](core_options.BaseDefaults.md#preventdefault)
- [styleCursor](core_options.BaseDefaults.md#stylecursor)

## Properties

### actionChecker

• `Optional` **actionChecker**: `any`

#### Defined in

[auto-start/base.ts:53](https://github.com/taye/interact.js/blob/f56f1fa2/packages/@interactjs/auto-start/base.ts#L53)

___

### context

• `Optional` **context**: `Node`

#### Defined in

[core/options.ts:15](https://github.com/taye/interact.js/blob/f56f1fa2/packages/@interactjs/core/options.ts#L15)

___

### cursorChecker

• `Optional` **cursorChecker**: `any`

#### Defined in

[auto-start/base.ts:54](https://github.com/taye/interact.js/blob/f56f1fa2/packages/@interactjs/auto-start/base.ts#L54)

___

### deltaSource

• `Optional` **deltaSource**: ``"page"`` \| ``"client"``

#### Defined in

[core/options.ts:14](https://github.com/taye/interact.js/blob/f56f1fa2/packages/@interactjs/core/options.ts#L14)

___

### devTools

• `Optional` **devTools**: [`DevToolsOptions`](dev_tools_plugin.DevToolsOptions.md)

#### Defined in

[dev-tools/plugin.ts:31](https://github.com/taye/interact.js/blob/f56f1fa2/packages/@interactjs/dev-tools/plugin.ts#L31)

___

### getRect

• `Optional` **getRect**: (`element`: [`Element`](../modules/core_types.md#element)) => [`Rect`](core_types.Rect.md)

#### Type declaration

▸ (`element`): [`Rect`](core_types.Rect.md)

##### Parameters

| Name | Type |
| :------ | :------ |
| `element` | [`Element`](../modules/core_types.md#element) |

##### Returns

[`Rect`](core_types.Rect.md)

#### Defined in

[core/options.ts:16](https://github.com/taye/interact.js/blob/f56f1fa2/packages/@interactjs/core/options.ts#L16)

___

### preventDefault

• `Optional` **preventDefault**: ``"always"`` \| ``"never"`` \| ``"auto"``

#### Defined in

[core/options.ts:13](https://github.com/taye/interact.js/blob/f56f1fa2/packages/@interactjs/core/options.ts#L13)

___

### styleCursor

• `Optional` **styleCursor**: `any`

#### Defined in

[auto-start/base.ts:55](https://github.com/taye/interact.js/blob/f56f1fa2/packages/@interactjs/auto-start/base.ts#L55)
