[@interactjs](../README.md) / [core/options](../modules/core_options.md) / OptionsArg

# Interface: OptionsArg

[core/options](../modules/core_options.md).OptionsArg

## Hierarchy

- [`BaseDefaults`](core_options.BaseDefaults.md)

- [`OrBoolean`](../modules/core_types.md#orboolean)\<`Partial`\<[`ActionDefaults`](core_options.ActionDefaults.md)\>\>

  ↳ **`OptionsArg`**

## Table of contents

### Properties

- [actionChecker](core_options.OptionsArg.md#actionchecker)
- [context](core_options.OptionsArg.md#context)
- [cursorChecker](core_options.OptionsArg.md#cursorchecker)
- [deltaSource](core_options.OptionsArg.md#deltasource)
- [devTools](core_options.OptionsArg.md#devtools)
- [drag](core_options.OptionsArg.md#drag)
- [drop](core_options.OptionsArg.md#drop)
- [gesture](core_options.OptionsArg.md#gesture)
- [getRect](core_options.OptionsArg.md#getrect)
- [pointerEvents](core_options.OptionsArg.md#pointerevents)
- [preventDefault](core_options.OptionsArg.md#preventdefault)
- [resize](core_options.OptionsArg.md#resize)
- [styleCursor](core_options.OptionsArg.md#stylecursor)

## Properties

### actionChecker

• `Optional` **actionChecker**: `any`

#### Inherited from

[BaseDefaults](core_options.BaseDefaults.md).[actionChecker](core_options.BaseDefaults.md#actionchecker)

#### Defined in

[auto-start/base.ts:53](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/auto-start/base.ts#L53)

___

### context

• `Optional` **context**: `Node`

#### Inherited from

[BaseDefaults](core_options.BaseDefaults.md).[context](core_options.BaseDefaults.md#context)

#### Defined in

[core/options.ts:15](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/core/options.ts#L15)

___

### cursorChecker

• `Optional` **cursorChecker**: `any`

#### Inherited from

[BaseDefaults](core_options.BaseDefaults.md).[cursorChecker](core_options.BaseDefaults.md#cursorchecker)

#### Defined in

[auto-start/base.ts:54](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/auto-start/base.ts#L54)

___

### deltaSource

• `Optional` **deltaSource**: ``"page"`` \| ``"client"``

#### Inherited from

[BaseDefaults](core_options.BaseDefaults.md).[deltaSource](core_options.BaseDefaults.md#deltasource)

#### Defined in

[core/options.ts:14](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/core/options.ts#L14)

___

### devTools

• `Optional` **devTools**: [`DevToolsOptions`](dev_tools_plugin.DevToolsOptions.md)

#### Inherited from

[BaseDefaults](core_options.BaseDefaults.md).[devTools](core_options.BaseDefaults.md#devtools)

#### Defined in

[dev-tools/plugin.ts:31](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/dev-tools/plugin.ts#L31)

___

### drag

• `Optional` **drag**: `boolean` \| `DraggableOptions`

#### Inherited from

OrBoolean.drag

#### Defined in

[actions/drag/plugin.ts:53](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/actions/drag/plugin.ts#L53)

___

### drop

• `Optional` **drop**: `boolean` \| `DropzoneOptions`

#### Inherited from

OrBoolean.drop

#### Defined in

[actions/drop/plugin.ts:144](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/actions/drop/plugin.ts#L144)

___

### gesture

• `Optional` **gesture**: `boolean` \| `GesturableOptions`

#### Inherited from

OrBoolean.gesture

#### Defined in

[actions/gesture/plugin.ts:53](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/actions/gesture/plugin.ts#L53)

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

#### Inherited from

[BaseDefaults](core_options.BaseDefaults.md).[getRect](core_options.BaseDefaults.md#getrect)

#### Defined in

[core/options.ts:16](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/core/options.ts#L16)

___

### pointerEvents

• `Optional` **pointerEvents**: `boolean` \| [`Options`](../modules/core_options.md#options)

#### Inherited from

OrBoolean.pointerEvents

#### Defined in

[pointer-events/base.ts:50](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/pointer-events/base.ts#L50)

___

### preventDefault

• `Optional` **preventDefault**: ``"always"`` \| ``"never"`` \| ``"auto"``

#### Inherited from

[BaseDefaults](core_options.BaseDefaults.md).[preventDefault](core_options.BaseDefaults.md#preventdefault)

#### Defined in

[core/options.ts:13](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/core/options.ts#L13)

___

### resize

• `Optional` **resize**: `boolean` \| `ResizableOptions`

#### Inherited from

OrBoolean.resize

#### Defined in

[actions/resize/plugin.ts:86](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/actions/resize/plugin.ts#L86)

___

### styleCursor

• `Optional` **styleCursor**: `any`

#### Inherited from

[BaseDefaults](core_options.BaseDefaults.md).[styleCursor](core_options.BaseDefaults.md#stylecursor)

#### Defined in

[auto-start/base.ts:55](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/auto-start/base.ts#L55)
