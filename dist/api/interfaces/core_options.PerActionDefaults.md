[@interactjs](../README.md) / [core/options](../modules/core_options.md) / PerActionDefaults

# Interface: PerActionDefaults

[core/options](../modules/core_options.md).PerActionDefaults

## Hierarchy

- **`PerActionDefaults`**

  ↳ [`PointerEventOptions`](pointer_events_base.PointerEventOptions.md)

## Table of contents

### Properties

- [allowFrom](core_options.PerActionDefaults.md#allowfrom)
- [autoScroll](core_options.PerActionDefaults.md#autoscroll)
- [cursorChecker](core_options.PerActionDefaults.md#cursorchecker)
- [delay](core_options.PerActionDefaults.md#delay)
- [enabled](core_options.PerActionDefaults.md#enabled)
- [hold](core_options.PerActionDefaults.md#hold)
- [ignoreFrom](core_options.PerActionDefaults.md#ignorefrom)
- [inertia](core_options.PerActionDefaults.md#inertia)
- [listeners](core_options.PerActionDefaults.md#listeners)
- [manualStart](core_options.PerActionDefaults.md#manualstart)
- [max](core_options.PerActionDefaults.md#max)
- [maxPerElement](core_options.PerActionDefaults.md#maxperelement)
- [modifiers](core_options.PerActionDefaults.md#modifiers)
- [mouseButtons](core_options.PerActionDefaults.md#mousebuttons)
- [origin](core_options.PerActionDefaults.md#origin)

## Properties

### allowFrom

• `Optional` **allowFrom**: `string` \| [`Element`](../modules/core_types.md#element)

#### Defined in

[core/options.ts:23](https://github.com/taye/interact.js/blob/24fdee86/packages/@interactjs/core/options.ts#L23)

[auto-start/base.ts:62](https://github.com/taye/interact.js/blob/24fdee86/packages/@interactjs/auto-start/base.ts#L62)

___

### autoScroll

• `Optional` **autoScroll**: [`AutoScrollOptions`](auto_scroll_plugin.AutoScrollOptions.md)

#### Defined in

[auto-scroll/plugin.ts:25](https://github.com/taye/interact.js/blob/24fdee86/packages/@interactjs/auto-scroll/plugin.ts#L25)

___

### cursorChecker

• `Optional` **cursorChecker**: [`CursorChecker`](../modules/core_types.md#cursorchecker)

#### Defined in

[auto-start/base.ts:64](https://github.com/taye/interact.js/blob/24fdee86/packages/@interactjs/auto-start/base.ts#L64)

___

### delay

• `Optional` **delay**: `number`

#### Defined in

[auto-start/hold.ts:12](https://github.com/taye/interact.js/blob/24fdee86/packages/@interactjs/auto-start/hold.ts#L12)

___

### enabled

• `Optional` **enabled**: `boolean`

#### Defined in

[core/options.ts:20](https://github.com/taye/interact.js/blob/24fdee86/packages/@interactjs/core/options.ts#L20)

___

### hold

• `Optional` **hold**: `number`

#### Defined in

[auto-start/hold.ts:11](https://github.com/taye/interact.js/blob/24fdee86/packages/@interactjs/auto-start/hold.ts#L11)

___

### ignoreFrom

• `Optional` **ignoreFrom**: `string` \| [`Element`](../modules/core_types.md#element)

#### Defined in

[core/options.ts:24](https://github.com/taye/interact.js/blob/24fdee86/packages/@interactjs/core/options.ts#L24)

[auto-start/base.ts:63](https://github.com/taye/interact.js/blob/24fdee86/packages/@interactjs/auto-start/base.ts#L63)

___

### inertia

• `Optional` **inertia**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `allowResume?` | ``true`` |
| `enabled?` | `boolean` |
| `endSpeed?` | `number` |
| `minSpeed?` | `number` |
| `resistance?` | `number` |
| `smoothEndDuration?` | `number` |

#### Defined in

[inertia/plugin.ts:33](https://github.com/taye/interact.js/blob/24fdee86/packages/@interactjs/inertia/plugin.ts#L33)

___

### listeners

• `Optional` **listeners**: [`Listeners`](../modules/core_types.md#listeners)

#### Defined in

[core/options.ts:22](https://github.com/taye/interact.js/blob/24fdee86/packages/@interactjs/core/options.ts#L22)

___

### manualStart

• `Optional` **manualStart**: `boolean`

#### Defined in

[auto-start/base.ts:59](https://github.com/taye/interact.js/blob/24fdee86/packages/@interactjs/auto-start/base.ts#L59)

___

### max

• `Optional` **max**: `number`

#### Defined in

[auto-start/base.ts:60](https://github.com/taye/interact.js/blob/24fdee86/packages/@interactjs/auto-start/base.ts#L60)

___

### maxPerElement

• `Optional` **maxPerElement**: `number`

#### Defined in

[auto-start/base.ts:61](https://github.com/taye/interact.js/blob/24fdee86/packages/@interactjs/auto-start/base.ts#L61)

___

### modifiers

• `Optional` **modifiers**: [`Modifier`](modifiers_types.Modifier.md)\<`any`, `any`, `any`, `any`\>[]

#### Defined in

[modifiers/base.ts:25](https://github.com/taye/interact.js/blob/24fdee86/packages/@interactjs/modifiers/base.ts#L25)

___

### mouseButtons

• `Optional` **mouseButtons**: ``0`` \| ``1`` \| ``16`` \| ``2`` \| ``4`` \| ``8``

#### Defined in

[auto-start/base.ts:69](https://github.com/taye/interact.js/blob/24fdee86/packages/@interactjs/auto-start/base.ts#L69)

___

### origin

• `Optional` **origin**: `string` \| [`Element`](../modules/core_types.md#element) \| [`Point`](core_types.Point.md)

#### Defined in

[core/options.ts:21](https://github.com/taye/interact.js/blob/24fdee86/packages/@interactjs/core/options.ts#L21)
