[@interactjs](../README.md) / [modifiers/Modification](../modules/modifiers_Modification.md) / Modification

# Class: Modification

[modifiers/Modification](../modules/modifiers_Modification.md).Modification

## Table of contents

### Properties

- [edges](modifiers_Modification.Modification.md#edges)
- [endResult](modifiers_Modification.Modification.md#endresult)
- [interaction](modifiers_Modification.Modification.md#interaction)
- [result](modifiers_Modification.Modification.md#result)
- [startDelta](modifiers_Modification.Modification.md#startdelta)
- [startEdges](modifiers_Modification.Modification.md#startedges)
- [startOffset](modifiers_Modification.Modification.md#startoffset)
- [states](modifiers_Modification.Modification.md#states)

### Methods

- [applyToInteraction](modifiers_Modification.Modification.md#applytointeraction)
- [beforeEnd](modifiers_Modification.Modification.md#beforeend)
- [copyFrom](modifiers_Modification.Modification.md#copyfrom)
- [destroy](modifiers_Modification.Modification.md#destroy)
- [fillArg](modifiers_Modification.Modification.md#fillarg)
- [prepareStates](modifiers_Modification.Modification.md#preparestates)
- [restoreInteractionCoords](modifiers_Modification.Modification.md#restoreinteractioncoords)
- [setAll](modifiers_Modification.Modification.md#setall)
- [setAndApply](modifiers_Modification.Modification.md#setandapply)
- [shouldDo](modifiers_Modification.Modification.md#shoulddo)
- [start](modifiers_Modification.Modification.md#start)
- [startAll](modifiers_Modification.Modification.md#startall)
- [stop](modifiers_Modification.Modification.md#stop)

## Properties

### edges

• **edges**: [`EdgeOptions`](../interfaces/core_types.EdgeOptions.md)

#### Defined in

[modifiers/Modification.ts:35](https://github.com/taye/interact.js/blob/24fdee86/packages/@interactjs/modifiers/Modification.ts#L35)

___

### endResult

• **endResult**: [`Point`](../interfaces/core_types.Point.md)

#### Defined in

[modifiers/Modification.ts:33](https://github.com/taye/interact.js/blob/24fdee86/packages/@interactjs/modifiers/Modification.ts#L33)

___

### interaction

• `Readonly` **interaction**: `Readonly`\<[`Interaction`](core_Interaction.Interaction.md)\<keyof [`ActionMap`](../interfaces/core_types.ActionMap.md)\>\>

#### Defined in

[modifiers/Modification.ts:36](https://github.com/taye/interact.js/blob/24fdee86/packages/@interactjs/modifiers/Modification.ts#L36)

___

### result

• **result**: [`ModificationResult`](../interfaces/modifiers_Modification.ModificationResult.md)

#### Defined in

[modifiers/Modification.ts:32](https://github.com/taye/interact.js/blob/24fdee86/packages/@interactjs/modifiers/Modification.ts#L32)

___

### startDelta

• **startDelta**: [`Point`](../interfaces/core_types.Point.md)

#### Defined in

[modifiers/Modification.ts:31](https://github.com/taye/interact.js/blob/24fdee86/packages/@interactjs/modifiers/Modification.ts#L31)

___

### startEdges

• **startEdges**: [`EdgeOptions`](../interfaces/core_types.EdgeOptions.md)

#### Defined in

[modifiers/Modification.ts:34](https://github.com/taye/interact.js/blob/24fdee86/packages/@interactjs/modifiers/Modification.ts#L34)

___

### startOffset

• **startOffset**: [`Rect`](../interfaces/core_types.Rect.md)

#### Defined in

[modifiers/Modification.ts:30](https://github.com/taye/interact.js/blob/24fdee86/packages/@interactjs/modifiers/Modification.ts#L30)

___

### states

• **states**: \{ `index?`: `number` ; `methods?`: \{ `beforeEnd?`: (`arg`: [`ModifierArg`](../interfaces/modifiers_types.ModifierArg.md)\<`any`\>) => `void` \| [`Point`](../interfaces/core_types.Point.md) ; `set?`: (`arg`: [`ModifierArg`](../interfaces/modifiers_types.ModifierArg.md)\<`any`\>) => `any` ; `start?`: (`arg`: [`ModifierArg`](../interfaces/modifiers_types.ModifierArg.md)\<`any`\>) => `void` ; `stop?`: (`arg`: [`ModifierArg`](../interfaces/modifiers_types.ModifierArg.md)\<`any`\>) => `void`  } ; `name?`: `any` ; `options`: `unknown`  }[] = `[]`

#### Defined in

[modifiers/Modification.ts:29](https://github.com/taye/interact.js/blob/24fdee86/packages/@interactjs/modifiers/Modification.ts#L29)

## Methods

### applyToInteraction

▸ **applyToInteraction**(`arg`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `arg` | `Object` |
| `arg.phase` | keyof [`PhaseMap`](../interfaces/core_InteractEvent.PhaseMap.md) |
| `arg.rect?` | [`Rect`](../interfaces/core_types.Rect.md) |

#### Returns

`void`

#### Defined in

[modifiers/Modification.ts:151](https://github.com/taye/interact.js/blob/24fdee86/packages/@interactjs/modifiers/Modification.ts#L151)

___

### beforeEnd

▸ **beforeEnd**(`arg`): ``false`` \| `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `arg` | `Omit`\<[`DoAnyPhaseArg`](../modules/core_Interaction.md#doanyphasearg), ``"iEvent"``\> & \{ `state?`: \{ `index?`: `number` ; `methods?`: \{ `beforeEnd?`: (`arg`: [`ModifierArg`](../interfaces/modifiers_types.ModifierArg.md)\<`any`\>) => `void` \| [`Point`](../interfaces/core_types.Point.md) ; `set?`: (`arg`: [`ModifierArg`](../interfaces/modifiers_types.ModifierArg.md)\<`any`\>) => `any` ; `start?`: (`arg`: [`ModifierArg`](../interfaces/modifiers_types.ModifierArg.md)\<`any`\>) => `void` ; `stop?`: (`arg`: [`ModifierArg`](../interfaces/modifiers_types.ModifierArg.md)\<`any`\>) => `void`  } ; `name?`: `any` ; `options`: `unknown`  }  } |

#### Returns

``false`` \| `void`

#### Defined in

[modifiers/Modification.ts:232](https://github.com/taye/interact.js/blob/24fdee86/packages/@interactjs/modifiers/Modification.ts#L232)

___

### copyFrom

▸ **copyFrom**(`other`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `other` | [`Modification`](modifiers_Modification.Modification.md) |

#### Returns

`void`

#### Defined in

[modifiers/Modification.ts:352](https://github.com/taye/interact.js/blob/24fdee86/packages/@interactjs/modifiers/Modification.ts#L352)

___

### destroy

▸ **destroy**(): `void`

#### Returns

`void`

#### Defined in

[modifiers/Modification.ts:361](https://github.com/taye/interact.js/blob/24fdee86/packages/@interactjs/modifiers/Modification.ts#L361)

___

### fillArg

▸ **fillArg**(`arg`): [`ModifierArg`](../interfaces/modifiers_types.ModifierArg.md)\<\{ `index?`: `number` ; `methods?`: \{ `beforeEnd?`: (`arg`: [`ModifierArg`](../interfaces/modifiers_types.ModifierArg.md)\<`any`\>) => `void` \| [`Point`](../interfaces/core_types.Point.md) ; `set?`: (`arg`: [`ModifierArg`](../interfaces/modifiers_types.ModifierArg.md)\<`any`\>) => `any` ; `start?`: (`arg`: [`ModifierArg`](../interfaces/modifiers_types.ModifierArg.md)\<`any`\>) => `void` ; `stop?`: (`arg`: [`ModifierArg`](../interfaces/modifiers_types.ModifierArg.md)\<`any`\>) => `void`  } ; `name?`: `any` ; `options`: `unknown`  }\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `arg` | `Partial`\<[`ModifierArg`](../interfaces/modifiers_types.ModifierArg.md)\<\{ `index?`: `number` ; `methods?`: \{ `beforeEnd?`: (`arg`: [`ModifierArg`](../interfaces/modifiers_types.ModifierArg.md)\<`any`\>) => `void` \| [`Point`](../interfaces/core_types.Point.md) ; `set?`: (`arg`: [`ModifierArg`](../interfaces/modifiers_types.ModifierArg.md)\<`any`\>) => `any` ; `start?`: (`arg`: [`ModifierArg`](../interfaces/modifiers_types.ModifierArg.md)\<`any`\>) => `void` ; `stop?`: (`arg`: [`ModifierArg`](../interfaces/modifiers_types.ModifierArg.md)\<`any`\>) => `void`  } ; `name?`: `any` ; `options`: `unknown`  }\>\> |

#### Returns

[`ModifierArg`](../interfaces/modifiers_types.ModifierArg.md)\<\{ `index?`: `number` ; `methods?`: \{ `beforeEnd?`: (`arg`: [`ModifierArg`](../interfaces/modifiers_types.ModifierArg.md)\<`any`\>) => `void` \| [`Point`](../interfaces/core_types.Point.md) ; `set?`: (`arg`: [`ModifierArg`](../interfaces/modifiers_types.ModifierArg.md)\<`any`\>) => `any` ; `start?`: (`arg`: [`ModifierArg`](../interfaces/modifiers_types.ModifierArg.md)\<`any`\>) => `void` ; `stop?`: (`arg`: [`ModifierArg`](../interfaces/modifiers_types.ModifierArg.md)\<`any`\>) => `void`  } ; `name?`: `any` ; `options`: `unknown`  }\>

#### Defined in

[modifiers/Modification.ts:73](https://github.com/taye/interact.js/blob/24fdee86/packages/@interactjs/modifiers/Modification.ts#L73)

___

### prepareStates

▸ **prepareStates**(`modifierList`): \{ `index?`: `number` ; `methods?`: \{ `beforeEnd?`: (`arg`: [`ModifierArg`](../interfaces/modifiers_types.ModifierArg.md)\<`any`\>) => `void` \| [`Point`](../interfaces/core_types.Point.md) ; `set?`: (`arg`: [`ModifierArg`](../interfaces/modifiers_types.ModifierArg.md)\<`any`\>) => `any` ; `start?`: (`arg`: [`ModifierArg`](../interfaces/modifiers_types.ModifierArg.md)\<`any`\>) => `void` ; `stop?`: (`arg`: [`ModifierArg`](../interfaces/modifiers_types.ModifierArg.md)\<`any`\>) => `void`  } ; `name?`: `any` ; `options`: `unknown`  }[]

#### Parameters

| Name | Type |
| :------ | :------ |
| `modifierList` | [`Modifier`](../interfaces/modifiers_types.Modifier.md)\<`any`, `any`, `any`, `any`\>[] |

#### Returns

\{ `index?`: `number` ; `methods?`: \{ `beforeEnd?`: (`arg`: [`ModifierArg`](../interfaces/modifiers_types.ModifierArg.md)\<`any`\>) => `void` \| [`Point`](../interfaces/core_types.Point.md) ; `set?`: (`arg`: [`ModifierArg`](../interfaces/modifiers_types.ModifierArg.md)\<`any`\>) => `any` ; `start?`: (`arg`: [`ModifierArg`](../interfaces/modifiers_types.ModifierArg.md)\<`any`\>) => `void` ; `stop?`: (`arg`: [`ModifierArg`](../interfaces/modifiers_types.ModifierArg.md)\<`any`\>) => `void`  } ; `name?`: `any` ; `options`: `unknown`  }[]

#### Defined in

[modifiers/Modification.ts:293](https://github.com/taye/interact.js/blob/24fdee86/packages/@interactjs/modifiers/Modification.ts#L293)

___

### restoreInteractionCoords

▸ **restoreInteractionCoords**(`«destructured»`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `«destructured»` | `Object` |
| › `interaction` | [`Interaction`](core_Interaction.Interaction.md)\<keyof [`ActionMap`](../interfaces/core_types.ActionMap.md)\> |

#### Returns

`void`

#### Defined in

[modifiers/Modification.ts:310](https://github.com/taye/interact.js/blob/24fdee86/packages/@interactjs/modifiers/Modification.ts#L310)

___

### setAll

▸ **setAll**(`arg`): [`ModificationResult`](../interfaces/modifiers_Modification.ModificationResult.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `arg` | `MethodArg` & `Partial`\<[`ModifierArg`](../interfaces/modifiers_types.ModifierArg.md)\<\{ `index?`: `number` ; `methods?`: \{ `beforeEnd?`: (`arg`: [`ModifierArg`](../interfaces/modifiers_types.ModifierArg.md)\<`any`\>) => `void` \| [`Point`](../interfaces/core_types.Point.md) ; `set?`: (`arg`: [`ModifierArg`](../interfaces/modifiers_types.ModifierArg.md)\<`any`\>) => `any` ; `start?`: (`arg`: [`ModifierArg`](../interfaces/modifiers_types.ModifierArg.md)\<`any`\>) => `void` ; `stop?`: (`arg`: [`ModifierArg`](../interfaces/modifiers_types.ModifierArg.md)\<`any`\>) => `void`  } ; `name?`: `any` ; `options`: `unknown`  }\>\> |

#### Returns

[`ModificationResult`](../interfaces/modifiers_Modification.ModificationResult.md)

#### Defined in

[modifiers/Modification.ts:95](https://github.com/taye/interact.js/blob/24fdee86/packages/@interactjs/modifiers/Modification.ts#L95)

___

### setAndApply

▸ **setAndApply**(`arg`): ``false`` \| `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `arg` | `Partial`\<[`DoAnyPhaseArg`](../modules/core_Interaction.md#doanyphasearg)\> & \{ `modifiedCoords?`: [`Point`](../interfaces/core_types.Point.md) ; `phase`: keyof [`PhaseMap`](../interfaces/core_InteractEvent.PhaseMap.md) ; `preEnd?`: `boolean` ; `skipModifiers?`: `number`  } |

#### Returns

``false`` \| `void`

#### Defined in

[modifiers/Modification.ts:185](https://github.com/taye/interact.js/blob/24fdee86/packages/@interactjs/modifiers/Modification.ts#L185)

___

### shouldDo

▸ **shouldDo**(`options`, `preEnd?`, `phase?`, `requireEndOnly?`): `boolean`

#### Parameters

| Name | Type |
| :------ | :------ |
| `options` | `any` |
| `preEnd?` | `boolean` |
| `phase?` | `string` |
| `requireEndOnly?` | `boolean` |

#### Returns

`boolean`

#### Defined in

[modifiers/Modification.ts:334](https://github.com/taye/interact.js/blob/24fdee86/packages/@interactjs/modifiers/Modification.ts#L334)

___

### start

▸ **start**(`«destructured»`, `pageCoords`): [`ModificationResult`](../interfaces/modifiers_Modification.ModificationResult.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `«destructured»` | `Object` |
| › `phase` | keyof [`PhaseMap`](../interfaces/core_InteractEvent.PhaseMap.md) |
| `pageCoords` | [`Point`](../interfaces/core_types.Point.md) |

#### Returns

[`ModificationResult`](../interfaces/modifiers_Modification.ModificationResult.md)

#### Defined in

[modifiers/Modification.ts:49](https://github.com/taye/interact.js/blob/24fdee86/packages/@interactjs/modifiers/Modification.ts#L49)

___

### startAll

▸ **startAll**(`arg`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `arg` | `MethodArg` & `Partial`\<[`ModifierArg`](../interfaces/modifiers_types.ModifierArg.md)\<\{ `index?`: `number` ; `methods?`: \{ `beforeEnd?`: (`arg`: [`ModifierArg`](../interfaces/modifiers_types.ModifierArg.md)\<`any`\>) => `void` \| [`Point`](../interfaces/core_types.Point.md) ; `set?`: (`arg`: [`ModifierArg`](../interfaces/modifiers_types.ModifierArg.md)\<`any`\>) => `any` ; `start?`: (`arg`: [`ModifierArg`](../interfaces/modifiers_types.ModifierArg.md)\<`any`\>) => `void` ; `stop?`: (`arg`: [`ModifierArg`](../interfaces/modifiers_types.ModifierArg.md)\<`any`\>) => `void`  } ; `name?`: `any` ; `options`: `unknown`  }\>\> |

#### Returns

`void`

#### Defined in

[modifiers/Modification.ts:86](https://github.com/taye/interact.js/blob/24fdee86/packages/@interactjs/modifiers/Modification.ts#L86)

___

### stop

▸ **stop**(`arg`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `arg` | `Object` |
| `arg.interaction` | [`Interaction`](core_Interaction.Interaction.md)\<keyof [`ActionMap`](../interfaces/core_types.ActionMap.md)\> |

#### Returns

`void`

#### Defined in

[modifiers/Modification.ts:262](https://github.com/taye/interact.js/blob/24fdee86/packages/@interactjs/modifiers/Modification.ts#L262)
