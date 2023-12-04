[@interactjs](../README.md) / [pointer-events/base](../modules/pointer_events_base.md) / PointerEventOptions

# Interface: PointerEventOptions

[pointer-events/base](../modules/pointer_events_base.md).PointerEventOptions

## Hierarchy

- [`PerActionDefaults`](core_options.PerActionDefaults.md)

  ↳ **`PointerEventOptions`**

## Table of contents

### Properties

- [allowFrom](pointer_events_base.PointerEventOptions.md#allowfrom)
- [autoScroll](pointer_events_base.PointerEventOptions.md#autoscroll)
- [cursorChecker](pointer_events_base.PointerEventOptions.md#cursorchecker)
- [delay](pointer_events_base.PointerEventOptions.md#delay)
- [enabled](pointer_events_base.PointerEventOptions.md#enabled)
- [hold](pointer_events_base.PointerEventOptions.md#hold)
- [holdDuration](pointer_events_base.PointerEventOptions.md#holdduration)
- [holdRepeatInterval](pointer_events_base.PointerEventOptions.md#holdrepeatinterval)
- [ignoreFrom](pointer_events_base.PointerEventOptions.md#ignorefrom)
- [inertia](pointer_events_base.PointerEventOptions.md#inertia)
- [listeners](pointer_events_base.PointerEventOptions.md#listeners)
- [manualStart](pointer_events_base.PointerEventOptions.md#manualstart)
- [max](pointer_events_base.PointerEventOptions.md#max)
- [maxPerElement](pointer_events_base.PointerEventOptions.md#maxperelement)
- [modifiers](pointer_events_base.PointerEventOptions.md#modifiers)
- [mouseButtons](pointer_events_base.PointerEventOptions.md#mousebuttons)
- [origin](pointer_events_base.PointerEventOptions.md#origin)

## Properties

### allowFrom

• `Optional` **allowFrom**: `any`

#### Overrides

[PerActionDefaults](core_options.PerActionDefaults.md).[allowFrom](core_options.PerActionDefaults.md#allowfrom)

#### Defined in

[pointer-events/base.ts:22](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/pointer-events/base.ts#L22)

___

### autoScroll

• `Optional` **autoScroll**: [`AutoScrollOptions`](auto_scroll_plugin.AutoScrollOptions.md)

#### Inherited from

[PerActionDefaults](core_options.PerActionDefaults.md).[autoScroll](core_options.PerActionDefaults.md#autoscroll)

#### Defined in

[auto-scroll/plugin.ts:25](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/auto-scroll/plugin.ts#L25)

___

### cursorChecker

• `Optional` **cursorChecker**: [`CursorChecker`](../modules/core_types.md#cursorchecker)

#### Inherited from

[PerActionDefaults](core_options.PerActionDefaults.md).[cursorChecker](core_options.PerActionDefaults.md#cursorchecker)

#### Defined in

[auto-start/base.ts:64](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/auto-start/base.ts#L64)

___

### delay

• `Optional` **delay**: `number`

#### Inherited from

[PerActionDefaults](core_options.PerActionDefaults.md).[delay](core_options.PerActionDefaults.md#delay)

#### Defined in

[auto-start/hold.ts:12](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/auto-start/hold.ts#L12)

___

### enabled

• `Optional` **enabled**: `undefined`

#### Overrides

[PerActionDefaults](core_options.PerActionDefaults.md).[enabled](core_options.PerActionDefaults.md#enabled)

#### Defined in

[pointer-events/base.ts:19](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/pointer-events/base.ts#L19)

___

### hold

• `Optional` **hold**: `number`

#### Inherited from

[PerActionDefaults](core_options.PerActionDefaults.md).[hold](core_options.PerActionDefaults.md#hold)

#### Defined in

[auto-start/hold.ts:11](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/auto-start/hold.ts#L11)

___

### holdDuration

• `Optional` **holdDuration**: `number`

#### Defined in

[pointer-events/base.ts:20](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/pointer-events/base.ts#L20)

___

### holdRepeatInterval

• `Optional` **holdRepeatInterval**: `number`

#### Defined in

[pointer-events/holdRepeat.ts:24](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/pointer-events/holdRepeat.ts#L24)

___

### ignoreFrom

• `Optional` **ignoreFrom**: `any`

#### Overrides

[PerActionDefaults](core_options.PerActionDefaults.md).[ignoreFrom](core_options.PerActionDefaults.md#ignorefrom)

#### Defined in

[pointer-events/base.ts:21](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/pointer-events/base.ts#L21)

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

#### Inherited from

[PerActionDefaults](core_options.PerActionDefaults.md).[inertia](core_options.PerActionDefaults.md#inertia)

#### Defined in

[inertia/plugin.ts:33](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/inertia/plugin.ts#L33)

___

### listeners

• `Optional` **listeners**: [`Listeners`](../modules/core_types.md#listeners)

#### Inherited from

[PerActionDefaults](core_options.PerActionDefaults.md).[listeners](core_options.PerActionDefaults.md#listeners)

#### Defined in

[core/options.ts:22](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/core/options.ts#L22)

___

### manualStart

• `Optional` **manualStart**: `boolean`

#### Inherited from

[PerActionDefaults](core_options.PerActionDefaults.md).[manualStart](core_options.PerActionDefaults.md#manualstart)

#### Defined in

[auto-start/base.ts:59](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/auto-start/base.ts#L59)

___

### max

• `Optional` **max**: `number`

#### Inherited from

[PerActionDefaults](core_options.PerActionDefaults.md).[max](core_options.PerActionDefaults.md#max)

#### Defined in

[auto-start/base.ts:60](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/auto-start/base.ts#L60)

___

### maxPerElement

• `Optional` **maxPerElement**: `number`

#### Inherited from

[PerActionDefaults](core_options.PerActionDefaults.md).[maxPerElement](core_options.PerActionDefaults.md#maxperelement)

#### Defined in

[auto-start/base.ts:61](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/auto-start/base.ts#L61)

___

### modifiers

• `Optional` **modifiers**: [`Modifier`](modifiers_types.Modifier.md)\<`any`, `any`, `any`, `any`\>[]

#### Inherited from

[PerActionDefaults](core_options.PerActionDefaults.md).[modifiers](core_options.PerActionDefaults.md#modifiers)

#### Defined in

[modifiers/base.ts:25](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/modifiers/base.ts#L25)

___

### mouseButtons

• `Optional` **mouseButtons**: ``0`` \| ``1`` \| ``16`` \| ``2`` \| ``4`` \| ``8``

#### Inherited from

[PerActionDefaults](core_options.PerActionDefaults.md).[mouseButtons](core_options.PerActionDefaults.md#mousebuttons)

#### Defined in

[auto-start/base.ts:69](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/auto-start/base.ts#L69)

___

### origin

• `Optional` **origin**: `string` \| [`Element`](../modules/core_types.md#element) \| [`Point`](core_types.Point.md)

#### Overrides

[PerActionDefaults](core_options.PerActionDefaults.md).[origin](core_options.PerActionDefaults.md#origin)

#### Defined in

[pointer-events/base.ts:23](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/pointer-events/base.ts#L23)
