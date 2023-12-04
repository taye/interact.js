[@interactjs](../README.md) / [inertia/plugin](../modules/inertia_plugin.md) / InertiaState

# Class: InertiaState

[inertia/plugin](../modules/inertia_plugin.md).InertiaState

## Table of contents

### Properties

- [active](inertia_plugin.InertiaState.md#active)
- [allowResume](inertia_plugin.InertiaState.md#allowresume)
- [currentOffset](inertia_plugin.InertiaState.md#currentoffset)
- [interaction](inertia_plugin.InertiaState.md#interaction)
- [isModified](inertia_plugin.InertiaState.md#ismodified)
- [lambda\_v0](inertia_plugin.InertiaState.md#lambda_v0)
- [modification](inertia_plugin.InertiaState.md#modification)
- [modifiedOffset](inertia_plugin.InertiaState.md#modifiedoffset)
- [modifierArg](inertia_plugin.InertiaState.md#modifierarg)
- [modifierCount](inertia_plugin.InertiaState.md#modifiercount)
- [one\_ve\_v0](inertia_plugin.InertiaState.md#one_ve_v0)
- [smoothEnd](inertia_plugin.InertiaState.md#smoothend)
- [startCoords](inertia_plugin.InertiaState.md#startcoords)
- [t0](inertia_plugin.InertiaState.md#t0)
- [targetOffset](inertia_plugin.InertiaState.md#targetoffset)
- [te](inertia_plugin.InertiaState.md#te)
- [timeout](inertia_plugin.InertiaState.md#timeout)
- [v0](inertia_plugin.InertiaState.md#v0)

### Methods

- [end](inertia_plugin.InertiaState.md#end)
- [inertiaTick](inertia_plugin.InertiaState.md#inertiatick)
- [onNextFrame](inertia_plugin.InertiaState.md#onnextframe)
- [resume](inertia_plugin.InertiaState.md#resume)
- [smoothEndTick](inertia_plugin.InertiaState.md#smoothendtick)
- [start](inertia_plugin.InertiaState.md#start)
- [startInertia](inertia_plugin.InertiaState.md#startinertia)
- [startSmoothEnd](inertia_plugin.InertiaState.md#startsmoothend)
- [stop](inertia_plugin.InertiaState.md#stop)

## Properties

### active

• **active**: `boolean` = `false`

#### Defined in

[inertia/plugin.ts:74](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/inertia/plugin.ts#L74)

___

### allowResume

• **allowResume**: `boolean` = `false`

#### Defined in

[inertia/plugin.ts:77](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/inertia/plugin.ts#L77)

___

### currentOffset

• **currentOffset**: [`Point`](../interfaces/core_types.Point.md)

#### Defined in

[inertia/plugin.ts:90](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/inertia/plugin.ts#L90)

___

### interaction

• `Readonly` **interaction**: [`Interaction`](core_Interaction.Interaction.md)\<keyof [`ActionMap`](../interfaces/core_types.ActionMap.md)\>

#### Defined in

[inertia/plugin.ts:95](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/inertia/plugin.ts#L95)

___

### isModified

• **isModified**: `boolean` = `false`

#### Defined in

[inertia/plugin.ts:75](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/inertia/plugin.ts#L75)

___

### lambda\_v0

• `Optional` **lambda\_v0**: `number` = `0`

#### Defined in

[inertia/plugin.ts:92](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/inertia/plugin.ts#L92)

___

### modification

• **modification**: [`Modification`](modifiers_Modification.Modification.md)

#### Defined in

[inertia/plugin.ts:79](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/inertia/plugin.ts#L79)

___

### modifiedOffset

• **modifiedOffset**: [`Point`](../interfaces/core_types.Point.md)

#### Defined in

[inertia/plugin.ts:89](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/inertia/plugin.ts#L89)

___

### modifierArg

• **modifierArg**: [`ModifierArg`](../interfaces/modifiers_types.ModifierArg.md)\<\{ `index?`: `number` ; `methods?`: \{ `beforeEnd?`: (`arg`: [`ModifierArg`](../interfaces/modifiers_types.ModifierArg.md)\<`any`\>) => `void` \| [`Point`](../interfaces/core_types.Point.md) ; `set?`: (`arg`: [`ModifierArg`](../interfaces/modifiers_types.ModifierArg.md)\<`any`\>) => `any` ; `start?`: (`arg`: [`ModifierArg`](../interfaces/modifiers_types.ModifierArg.md)\<`any`\>) => `void` ; `stop?`: (`arg`: [`ModifierArg`](../interfaces/modifiers_types.ModifierArg.md)\<`any`\>) => `void`  } ; `name?`: `any` ; `options`: `unknown`  }\>

#### Defined in

[inertia/plugin.ts:81](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/inertia/plugin.ts#L81)

___

### modifierCount

• **modifierCount**: `number` = `0`

#### Defined in

[inertia/plugin.ts:80](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/inertia/plugin.ts#L80)

___

### one\_ve\_v0

• `Optional` **one\_ve\_v0**: `number` = `0`

#### Defined in

[inertia/plugin.ts:93](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/inertia/plugin.ts#L93)

___

### smoothEnd

• **smoothEnd**: `boolean` = `false`

#### Defined in

[inertia/plugin.ts:76](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/inertia/plugin.ts#L76)

___

### startCoords

• **startCoords**: [`Point`](../interfaces/core_types.Point.md)

#### Defined in

[inertia/plugin.ts:83](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/inertia/plugin.ts#L83)

___

### t0

• **t0**: `number` = `0`

#### Defined in

[inertia/plugin.ts:84](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/inertia/plugin.ts#L84)

___

### targetOffset

• **targetOffset**: [`Point`](../interfaces/core_types.Point.md)

#### Defined in

[inertia/plugin.ts:88](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/inertia/plugin.ts#L88)

___

### te

• **te**: `number` = `0`

#### Defined in

[inertia/plugin.ts:87](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/inertia/plugin.ts#L87)

___

### timeout

• **timeout**: `number`

#### Defined in

[inertia/plugin.ts:94](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/inertia/plugin.ts#L94)

___

### v0

• **v0**: `number` = `0`

#### Defined in

[inertia/plugin.ts:85](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/inertia/plugin.ts#L85)

## Methods

### end

▸ **end**(): `void`

#### Returns

`void`

#### Defined in

[inertia/plugin.ts:319](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/inertia/plugin.ts#L319)

___

### inertiaTick

▸ **inertiaTick**(): `void`

#### Returns

`void`

#### Defined in

[inertia/plugin.ts:218](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/inertia/plugin.ts#L218)

___

### onNextFrame

▸ **onNextFrame**(`tickFn`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `tickFn` | () => `void` |

#### Returns

`void`

#### Defined in

[inertia/plugin.ts:210](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/inertia/plugin.ts#L210)

___

### resume

▸ **resume**(`«destructured»`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `«destructured»` | [`PointerArgProps`](../modules/core_Interaction.md#pointerargprops)\<\{ `type`: ``"down"``  }\> |

#### Returns

`void`

#### Defined in

[inertia/plugin.ts:296](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/inertia/plugin.ts#L296)

___

### smoothEndTick

▸ **smoothEndTick**(): `void`

#### Returns

`void`

#### Defined in

[inertia/plugin.ts:264](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/inertia/plugin.ts#L264)

___

### start

▸ **start**(`event`): `boolean`

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | [`PointerEventType`](../modules/core_types.md#pointereventtype) |

#### Returns

`boolean`

#### Defined in

[inertia/plugin.ts:101](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/inertia/plugin.ts#L101)

___

### startInertia

▸ **startInertia**(): `void`

#### Returns

`void`

#### Defined in

[inertia/plugin.ts:164](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/inertia/plugin.ts#L164)

___

### startSmoothEnd

▸ **startSmoothEnd**(): `void`

#### Returns

`void`

#### Defined in

[inertia/plugin.ts:199](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/inertia/plugin.ts#L199)

___

### stop

▸ **stop**(): `void`

#### Returns

`void`

#### Defined in

[inertia/plugin.ts:325](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/inertia/plugin.ts#L325)
