[@interactjs](../README.md) / [core/InteractStatic](../modules/core_InteractStatic.md) / InteractStatic

# Interface: InteractStatic

[core/InteractStatic](../modules/core_InteractStatic.md).InteractStatic

```js
interact('#draggable').draggable(true)

var rectables = interact('rect')
rectables
  .gesturable(true)
  .on('gesturemove', function (event) {
      // ...
  })
```

The methods of this variable can be used to set elements as interactables
and also to change various default settings.

Calling it as a function and passing an element or a valid CSS selector
string returns an Interactable object which has various methods to configure
it.

**`Param`**

The HTML or SVG Element to interact with
or CSS selector

## Callable

### InteractStatic

▸ **InteractStatic**(`target`, `options?`): [`Interactable`](../classes/core_Interactable.Interactable.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `target` | [`Target`](../modules/core_types.md#target) |
| `options?` | [`Options`](../modules/core_options.md#options) |

#### Returns

[`Interactable`](../classes/core_Interactable.Interactable.md)

#### Defined in

[core/InteractStatic.ts:38](https://github.com/taye/interact.js/blob/24fdee86/packages/@interactjs/core/InteractStatic.ts#L38)

## Table of contents

### Properties

- [closest](core_InteractStatic.InteractStatic.md#closest)
- [createSnapGrid](core_InteractStatic.InteractStatic.md#createsnapgrid)
- [dynamicDrop](core_InteractStatic.InteractStatic.md#dynamicdrop)
- [getElementClientRect](core_InteractStatic.InteractStatic.md#getelementclientrect)
- [getElementRect](core_InteractStatic.InteractStatic.md#getelementrect)
- [getPointerAverage](core_InteractStatic.InteractStatic.md#getpointeraverage)
- [getTouchAngle](core_InteractStatic.InteractStatic.md#gettouchangle)
- [getTouchBBox](core_InteractStatic.InteractStatic.md#gettouchbbox)
- [getTouchDistance](core_InteractStatic.InteractStatic.md#gettouchdistance)
- [matchesSelector](core_InteractStatic.InteractStatic.md#matchesselector)
- [maxInteractions](core_InteractStatic.InteractStatic.md#maxinteractions)
- [modifiers](core_InteractStatic.InteractStatic.md#modifiers)
- [snappers](core_InteractStatic.InteractStatic.md#snappers)
- [version](core_InteractStatic.InteractStatic.md#version)

### Methods

- [addDocument](core_InteractStatic.InteractStatic.md#adddocument)
- [debug](core_InteractStatic.InteractStatic.md#debug)
- [isSet](core_InteractStatic.InteractStatic.md#isset)
- [off](core_InteractStatic.InteractStatic.md#off)
- [on](core_InteractStatic.InteractStatic.md#on)
- [pointerMoveTolerance](core_InteractStatic.InteractStatic.md#pointermovetolerance)
- [removeDocument](core_InteractStatic.InteractStatic.md#removedocument)
- [stop](core_InteractStatic.InteractStatic.md#stop)
- [supportsPointerEvent](core_InteractStatic.InteractStatic.md#supportspointerevent)
- [supportsTouch](core_InteractStatic.InteractStatic.md#supportstouch)
- [use](core_InteractStatic.InteractStatic.md#use)

## Properties

### closest

• **closest**: (`element`: `Node`, `selector`: `string`) => `HTMLElement` \| `SVGElement`

#### Type declaration

▸ (`element`, `selector`): `HTMLElement` \| `SVGElement`

##### Parameters

| Name | Type |
| :------ | :------ |
| `element` | `Node` |
| `selector` | `string` |

##### Returns

`HTMLElement` \| `SVGElement`

#### Defined in

[core/InteractStatic.ts:46](https://github.com/taye/interact.js/blob/24fdee86/packages/@interactjs/core/InteractStatic.ts#L46)

___

### createSnapGrid

• **createSnapGrid**: (`grid`: [`GridOptions`](../modules/snappers_grid.md#gridoptions)) => `SnapFunction` & \{ `coordFields`: (readonly [``"x"``, ``"y"``] \| readonly [``"left"``, ``"top"``] \| readonly [``"right"``, ``"bottom"``] \| readonly [``"width"``, ``"height"``])[] ; `grid`: [`GridOptions`](../modules/snappers_grid.md#gridoptions)  }

#### Type declaration

▸ (`grid`): `SnapFunction` & \{ `coordFields`: (readonly [``"x"``, ``"y"``] \| readonly [``"left"``, ``"top"``] \| readonly [``"right"``, ``"bottom"``] \| readonly [``"width"``, ``"height"``])[] ; `grid`: [`GridOptions`](../modules/snappers_grid.md#gridoptions)  }

##### Parameters

| Name | Type |
| :------ | :------ |
| `grid` | [`GridOptions`](../modules/snappers_grid.md#gridoptions) |

##### Returns

`SnapFunction` & \{ `coordFields`: (readonly [``"x"``, ``"y"``] \| readonly [``"left"``, ``"top"``] \| readonly [``"right"``, ``"bottom"``] \| readonly [``"width"``, ``"height"``])[] ; `grid`: [`GridOptions`](../modules/snappers_grid.md#gridoptions)  }

#### Defined in

[snappers/plugin.ts:9](https://github.com/taye/interact.js/blob/24fdee86/packages/@interactjs/snappers/plugin.ts#L9)

___

### dynamicDrop

• **dynamicDrop**: (`newValue?`: `boolean`) => `boolean` \| [`InteractStatic`](core_InteractStatic.InteractStatic.md)

#### Type declaration

▸ (`newValue?`): `boolean` \| [`InteractStatic`](core_InteractStatic.InteractStatic.md)

Returns or sets whether the dimensions of dropzone elements are calculated
on every dragmove or only on dragstart for the default dropChecker

##### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `newValue?` | `boolean` | True to check on each move. False to check only before start |

##### Returns

`boolean` \| [`InteractStatic`](core_InteractStatic.InteractStatic.md)

The current setting or interact

#### Defined in

[actions/drop/plugin.ts:176](https://github.com/taye/interact.js/blob/24fdee86/packages/@interactjs/actions/drop/plugin.ts#L176)

___

### getElementClientRect

• **getElementClientRect**: (`element`: [`Element`](../modules/core_types.md#element)) => `Required`\<[`Rect`](core_types.Rect.md)\>

#### Type declaration

▸ (`element`): `Required`\<[`Rect`](core_types.Rect.md)\>

##### Parameters

| Name | Type |
| :------ | :------ |
| `element` | [`Element`](../modules/core_types.md#element) |

##### Returns

`Required`\<[`Rect`](core_types.Rect.md)\>

#### Defined in

[core/InteractStatic.ts:44](https://github.com/taye/interact.js/blob/24fdee86/packages/@interactjs/core/InteractStatic.ts#L44)

___

### getElementRect

• **getElementRect**: (`element`: [`Element`](../modules/core_types.md#element)) => `Required`\<[`Rect`](core_types.Rect.md)\>

#### Type declaration

▸ (`element`): `Required`\<[`Rect`](core_types.Rect.md)\>

##### Parameters

| Name | Type |
| :------ | :------ |
| `element` | [`Element`](../modules/core_types.md#element) |

##### Returns

`Required`\<[`Rect`](core_types.Rect.md)\>

#### Defined in

[core/InteractStatic.ts:43](https://github.com/taye/interact.js/blob/24fdee86/packages/@interactjs/core/InteractStatic.ts#L43)

___

### getPointerAverage

• **getPointerAverage**: (`pointers`: [`PointerType`](../modules/core_types.md#pointertype)[]) => \{ `clientX`: `number` = 0; `clientY`: `number` = 0; `pageX`: `number` = 0; `pageY`: `number` = 0; `screenX`: `number` = 0; `screenY`: `number` = 0 }

#### Type declaration

▸ (`pointers`): `Object`

##### Parameters

| Name | Type |
| :------ | :------ |
| `pointers` | [`PointerType`](../modules/core_types.md#pointertype)[] |

##### Returns

`Object`

| Name | Type |
| :------ | :------ |
| `clientX` | `number` |
| `clientY` | `number` |
| `pageX` | `number` |
| `pageY` | `number` |
| `screenX` | `number` |
| `screenY` | `number` |

#### Defined in

[core/InteractStatic.ts:39](https://github.com/taye/interact.js/blob/24fdee86/packages/@interactjs/core/InteractStatic.ts#L39)

___

### getTouchAngle

• **getTouchAngle**: (`event`: `TouchEvent` \| [`PointerType`](../modules/core_types.md#pointertype)[], `deltaSource`: `string`) => `number`

#### Type declaration

▸ (`event`, `deltaSource`): `number`

##### Parameters

| Name | Type |
| :------ | :------ |
| `event` | `TouchEvent` \| [`PointerType`](../modules/core_types.md#pointertype)[] |
| `deltaSource` | `string` |

##### Returns

`number`

#### Defined in

[core/InteractStatic.ts:42](https://github.com/taye/interact.js/blob/24fdee86/packages/@interactjs/core/InteractStatic.ts#L42)

___

### getTouchBBox

• **getTouchBBox**: (`event`: [`PointerType`](../modules/core_types.md#pointertype)[]) => \{ `bottom`: `number` = maxY; `height`: `number` ; `left`: `number` = minX; `right`: `number` = maxX; `top`: `number` = minY; `width`: `number` ; `x`: `number` = minX; `y`: `number` = minY }

#### Type declaration

▸ (`event`): `Object`

##### Parameters

| Name | Type |
| :------ | :------ |
| `event` | [`PointerType`](../modules/core_types.md#pointertype)[] |

##### Returns

`Object`

| Name | Type |
| :------ | :------ |
| `bottom` | `number` |
| `height` | `number` |
| `left` | `number` |
| `right` | `number` |
| `top` | `number` |
| `width` | `number` |
| `x` | `number` |
| `y` | `number` |

#### Defined in

[core/InteractStatic.ts:40](https://github.com/taye/interact.js/blob/24fdee86/packages/@interactjs/core/InteractStatic.ts#L40)

___

### getTouchDistance

• **getTouchDistance**: (`event`: `TouchEvent` \| [`PointerType`](../modules/core_types.md#pointertype)[], `deltaSource`: `string`) => `number`

#### Type declaration

▸ (`event`, `deltaSource`): `number`

##### Parameters

| Name | Type |
| :------ | :------ |
| `event` | `TouchEvent` \| [`PointerType`](../modules/core_types.md#pointertype)[] |
| `deltaSource` | `string` |

##### Returns

`number`

#### Defined in

[core/InteractStatic.ts:41](https://github.com/taye/interact.js/blob/24fdee86/packages/@interactjs/core/InteractStatic.ts#L41)

___

### matchesSelector

• **matchesSelector**: (`element`: [`Element`](../modules/core_types.md#element), `selector`: `string`) => `boolean`

#### Type declaration

▸ (`element`, `selector`): `boolean`

##### Parameters

| Name | Type |
| :------ | :------ |
| `element` | [`Element`](../modules/core_types.md#element) |
| `selector` | `string` |

##### Returns

`boolean`

#### Defined in

[core/InteractStatic.ts:45](https://github.com/taye/interact.js/blob/24fdee86/packages/@interactjs/core/InteractStatic.ts#L45)

___

### maxInteractions

• **maxInteractions**: (`newValue`: `any`) => `any`

#### Type declaration

▸ (`newValue`): `any`

Returns or sets the maximum number of concurrent interactions allowed.  By
default only 1 interaction is allowed at a time (for backwards
compatibility). To allow multiple interactions on the same Interactables and
elements, you need to enable it in the draggable, resizable and gesturable
`'max'` and `'maxPerElement'` options.

##### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `newValue` | `any` | Any number. newValue <= 0 means no interactions. |

##### Returns

`any`

#### Defined in

[auto-start/base.ts:33](https://github.com/taye/interact.js/blob/24fdee86/packages/@interactjs/auto-start/base.ts#L33)

___

### modifiers

• **modifiers**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `aspectRatio` | (`_options?`: `Partial`\<[`AspectRatioOptions`](modifiers_aspectRatio.AspectRatioOptions.md)\>) => [`Modifier`](modifiers_types.Modifier.md)\<[`AspectRatioOptions`](modifiers_aspectRatio.AspectRatioOptions.md), [`AspectRatioState`](../modules/modifiers_aspectRatio.md#aspectratiostate), ``"aspectRatio"``, `unknown`\> |
| `aspectRatio._defaults` | [`AspectRatioOptions`](modifiers_aspectRatio.AspectRatioOptions.md) |
| `aspectRatio._methods` | \{ `beforeEnd`: (`arg`: [`ModifierArg`](modifiers_types.ModifierArg.md)\<[`AspectRatioState`](../modules/modifiers_aspectRatio.md#aspectratiostate)\>) => `void` \| [`Point`](core_types.Point.md) = module.beforeEnd; `set`: (`arg`: [`ModifierArg`](modifiers_types.ModifierArg.md)\<[`AspectRatioState`](../modules/modifiers_aspectRatio.md#aspectratiostate)\>) => `unknown` = module.set; `start`: (`arg`: [`ModifierArg`](modifiers_types.ModifierArg.md)\<[`AspectRatioState`](../modules/modifiers_aspectRatio.md#aspectratiostate)\>) => `void` = module.start; `stop`: (`arg`: [`ModifierArg`](modifiers_types.ModifierArg.md)\<[`AspectRatioState`](../modules/modifiers_aspectRatio.md#aspectratiostate)\>) => `void` = module.stop } |
| `aspectRatio._methods.beforeEnd` | (`arg`: [`ModifierArg`](modifiers_types.ModifierArg.md)\<[`AspectRatioState`](../modules/modifiers_aspectRatio.md#aspectratiostate)\>) => `void` \| [`Point`](core_types.Point.md) |
| `aspectRatio._methods.set` | (`arg`: [`ModifierArg`](modifiers_types.ModifierArg.md)\<[`AspectRatioState`](../modules/modifiers_aspectRatio.md#aspectratiostate)\>) => `unknown` |
| `aspectRatio._methods.start` | (`arg`: [`ModifierArg`](modifiers_types.ModifierArg.md)\<[`AspectRatioState`](../modules/modifiers_aspectRatio.md#aspectratiostate)\>) => `void` |
| `aspectRatio._methods.stop` | (`arg`: [`ModifierArg`](modifiers_types.ModifierArg.md)\<[`AspectRatioState`](../modules/modifiers_aspectRatio.md#aspectratiostate)\>) => `void` |
| `avoid` | [`ModifierFunction`](modifiers_types.ModifierFunction.md)\<`any`, `any`, ``"noop"``\> |
| `restrict` | (`_options?`: `Partial`\<`RestrictOptions`\>) => [`Modifier`](modifiers_types.Modifier.md)\<`RestrictOptions`, `RestrictState`, ``"restrict"``, `unknown`\> |
| `restrict._defaults` | `RestrictOptions` |
| `restrict._methods` | \{ `beforeEnd`: (`arg`: [`ModifierArg`](modifiers_types.ModifierArg.md)\<`RestrictState`\>) => `void` \| [`Point`](core_types.Point.md) = module.beforeEnd; `set`: (`arg`: [`ModifierArg`](modifiers_types.ModifierArg.md)\<`RestrictState`\>) => `unknown` = module.set; `start`: (`arg`: [`ModifierArg`](modifiers_types.ModifierArg.md)\<`RestrictState`\>) => `void` = module.start; `stop`: (`arg`: [`ModifierArg`](modifiers_types.ModifierArg.md)\<`RestrictState`\>) => `void` = module.stop } |
| `restrict._methods.beforeEnd` | (`arg`: [`ModifierArg`](modifiers_types.ModifierArg.md)\<`RestrictState`\>) => `void` \| [`Point`](core_types.Point.md) |
| `restrict._methods.set` | (`arg`: [`ModifierArg`](modifiers_types.ModifierArg.md)\<`RestrictState`\>) => `unknown` |
| `restrict._methods.start` | (`arg`: [`ModifierArg`](modifiers_types.ModifierArg.md)\<`RestrictState`\>) => `void` |
| `restrict._methods.stop` | (`arg`: [`ModifierArg`](modifiers_types.ModifierArg.md)\<`RestrictState`\>) => `void` |
| `restrictEdges` | (`_options?`: `Partial`\<`RestrictEdgesOptions`\>) => [`Modifier`](modifiers_types.Modifier.md)\<`RestrictEdgesOptions`, `RestrictEdgesState`, ``"restrictEdges"``, `void`\> |
| `restrictEdges._defaults` | `RestrictEdgesOptions` |
| `restrictEdges._methods` | \{ `beforeEnd`: (`arg`: [`ModifierArg`](modifiers_types.ModifierArg.md)\<`RestrictEdgesState`\>) => `void` \| [`Point`](core_types.Point.md) = module.beforeEnd; `set`: (`arg`: [`ModifierArg`](modifiers_types.ModifierArg.md)\<`RestrictEdgesState`\>) => `void` = module.set; `start`: (`arg`: [`ModifierArg`](modifiers_types.ModifierArg.md)\<`RestrictEdgesState`\>) => `void` = module.start; `stop`: (`arg`: [`ModifierArg`](modifiers_types.ModifierArg.md)\<`RestrictEdgesState`\>) => `void` = module.stop } |
| `restrictEdges._methods.beforeEnd` | (`arg`: [`ModifierArg`](modifiers_types.ModifierArg.md)\<`RestrictEdgesState`\>) => `void` \| [`Point`](core_types.Point.md) |
| `restrictEdges._methods.set` | (`arg`: [`ModifierArg`](modifiers_types.ModifierArg.md)\<`RestrictEdgesState`\>) => `void` |
| `restrictEdges._methods.start` | (`arg`: [`ModifierArg`](modifiers_types.ModifierArg.md)\<`RestrictEdgesState`\>) => `void` |
| `restrictEdges._methods.stop` | (`arg`: [`ModifierArg`](modifiers_types.ModifierArg.md)\<`RestrictEdgesState`\>) => `void` |
| `restrictRect` | (`_options?`: `Partial`\<`RestrictOptions` & \{ `elementRect`:   }\>) => [`Modifier`](modifiers_types.Modifier.md)\<`RestrictOptions` & \{ `elementRect`:   }, `RestrictState`, ``"restrictRect"``, `unknown`\> |
| `restrictRect._defaults` | `RestrictOptions` & \{ `elementRect`:   } |
| `restrictRect._methods` | \{ `beforeEnd`: (`arg`: [`ModifierArg`](modifiers_types.ModifierArg.md)\<`RestrictState`\>) => `void` \| [`Point`](core_types.Point.md) = module.beforeEnd; `set`: (`arg`: [`ModifierArg`](modifiers_types.ModifierArg.md)\<`RestrictState`\>) => `unknown` = module.set; `start`: (`arg`: [`ModifierArg`](modifiers_types.ModifierArg.md)\<`RestrictState`\>) => `void` = module.start; `stop`: (`arg`: [`ModifierArg`](modifiers_types.ModifierArg.md)\<`RestrictState`\>) => `void` = module.stop } |
| `restrictRect._methods.beforeEnd` | (`arg`: [`ModifierArg`](modifiers_types.ModifierArg.md)\<`RestrictState`\>) => `void` \| [`Point`](core_types.Point.md) |
| `restrictRect._methods.set` | (`arg`: [`ModifierArg`](modifiers_types.ModifierArg.md)\<`RestrictState`\>) => `unknown` |
| `restrictRect._methods.start` | (`arg`: [`ModifierArg`](modifiers_types.ModifierArg.md)\<`RestrictState`\>) => `void` |
| `restrictRect._methods.stop` | (`arg`: [`ModifierArg`](modifiers_types.ModifierArg.md)\<`RestrictState`\>) => `void` |
| `restrictSize` | (`_options?`: `Partial`\<`RestrictSizeOptions`\>) => [`Modifier`](modifiers_types.Modifier.md)\<`RestrictSizeOptions`, `RestrictEdgesState`, ``"restrictSize"``, `void`\> |
| `restrictSize._defaults` | `RestrictSizeOptions` |
| `restrictSize._methods` | \{ `beforeEnd`: (`arg`: [`ModifierArg`](modifiers_types.ModifierArg.md)\<`RestrictEdgesState`\>) => `void` \| [`Point`](core_types.Point.md) = module.beforeEnd; `set`: (`arg`: [`ModifierArg`](modifiers_types.ModifierArg.md)\<`RestrictEdgesState`\>) => `void` = module.set; `start`: (`arg`: [`ModifierArg`](modifiers_types.ModifierArg.md)\<`RestrictEdgesState`\>) => `void` = module.start; `stop`: (`arg`: [`ModifierArg`](modifiers_types.ModifierArg.md)\<`RestrictEdgesState`\>) => `void` = module.stop } |
| `restrictSize._methods.beforeEnd` | (`arg`: [`ModifierArg`](modifiers_types.ModifierArg.md)\<`RestrictEdgesState`\>) => `void` \| [`Point`](core_types.Point.md) |
| `restrictSize._methods.set` | (`arg`: [`ModifierArg`](modifiers_types.ModifierArg.md)\<`RestrictEdgesState`\>) => `void` |
| `restrictSize._methods.start` | (`arg`: [`ModifierArg`](modifiers_types.ModifierArg.md)\<`RestrictEdgesState`\>) => `void` |
| `restrictSize._methods.stop` | (`arg`: [`ModifierArg`](modifiers_types.ModifierArg.md)\<`RestrictEdgesState`\>) => `void` |
| `rubberband` | [`ModifierFunction`](modifiers_types.ModifierFunction.md)\<`any`, `any`, ``"noop"``\> |
| `snap` | (`_options?`: `Partial`\<`SnapOptions`\>) => [`Modifier`](modifiers_types.Modifier.md)\<`SnapOptions`, `SnapState`, ``"snap"``, \{ `delta`: \{ `x`: `number` = 0; `y`: `number` = 0 } ; `distance`: `number` = 0; `inRange`: `boolean` = false; `range`: `number` = 0; `target`: `any` = null }\> |
| `snap._defaults` | `SnapOptions` |
| `snap._methods` | \{ `beforeEnd`: (`arg`: [`ModifierArg`](modifiers_types.ModifierArg.md)\<`SnapState`\>) => `void` \| [`Point`](core_types.Point.md) = module.beforeEnd; `set`: (`arg`: [`ModifierArg`](modifiers_types.ModifierArg.md)\<`SnapState`\>) => \{ `delta`: \{ `x`: `number` = 0; `y`: `number` = 0 } ; `distance`: `number` = 0; `inRange`: `boolean` = false; `range`: `number` = 0; `target`: `any` = null } = module.set; `start`: (`arg`: [`ModifierArg`](modifiers_types.ModifierArg.md)\<`SnapState`\>) => `void` = module.start; `stop`: (`arg`: [`ModifierArg`](modifiers_types.ModifierArg.md)\<`SnapState`\>) => `void` = module.stop } |
| `snap._methods.beforeEnd` | (`arg`: [`ModifierArg`](modifiers_types.ModifierArg.md)\<`SnapState`\>) => `void` \| [`Point`](core_types.Point.md) |
| `snap._methods.set` | (`arg`: [`ModifierArg`](modifiers_types.ModifierArg.md)\<`SnapState`\>) => \{ `delta`: \{ `x`: `number` = 0; `y`: `number` = 0 } ; `distance`: `number` = 0; `inRange`: `boolean` = false; `range`: `number` = 0; `target`: `any` = null } |
| `snap._methods.start` | (`arg`: [`ModifierArg`](modifiers_types.ModifierArg.md)\<`SnapState`\>) => `void` |
| `snap._methods.stop` | (`arg`: [`ModifierArg`](modifiers_types.ModifierArg.md)\<`SnapState`\>) => `void` |
| `snapEdges` | (`_options?`: `Partial`\<`SnapEdgesOptions`\>) => [`Modifier`](modifiers_types.Modifier.md)\<`SnapEdgesOptions`, `SnapState`, ``"snapEdges"``, \{ `delta`: \{ `x`: `number` = 0; `y`: `number` = 0 } ; `distance`: `number` = 0; `inRange`: `boolean` = false; `range`: `number` = 0; `target`: `any` = null }\> |
| `snapEdges._defaults` | `SnapEdgesOptions` |
| `snapEdges._methods` | \{ `beforeEnd`: (`arg`: [`ModifierArg`](modifiers_types.ModifierArg.md)\<`SnapState`\>) => `void` \| [`Point`](core_types.Point.md) = module.beforeEnd; `set`: (`arg`: [`ModifierArg`](modifiers_types.ModifierArg.md)\<`SnapState`\>) => \{ `delta`: \{ `x`: `number` = 0; `y`: `number` = 0 } ; `distance`: `number` = 0; `inRange`: `boolean` = false; `range`: `number` = 0; `target`: `any` = null } = module.set; `start`: (`arg`: [`ModifierArg`](modifiers_types.ModifierArg.md)\<`SnapState`\>) => `void` = module.start; `stop`: (`arg`: [`ModifierArg`](modifiers_types.ModifierArg.md)\<`SnapState`\>) => `void` = module.stop } |
| `snapEdges._methods.beforeEnd` | (`arg`: [`ModifierArg`](modifiers_types.ModifierArg.md)\<`SnapState`\>) => `void` \| [`Point`](core_types.Point.md) |
| `snapEdges._methods.set` | (`arg`: [`ModifierArg`](modifiers_types.ModifierArg.md)\<`SnapState`\>) => \{ `delta`: \{ `x`: `number` = 0; `y`: `number` = 0 } ; `distance`: `number` = 0; `inRange`: `boolean` = false; `range`: `number` = 0; `target`: `any` = null } |
| `snapEdges._methods.start` | (`arg`: [`ModifierArg`](modifiers_types.ModifierArg.md)\<`SnapState`\>) => `void` |
| `snapEdges._methods.stop` | (`arg`: [`ModifierArg`](modifiers_types.ModifierArg.md)\<`SnapState`\>) => `void` |
| `snapSize` | (`_options?`: `Partial`\<`SnapSizeOptions`\>) => [`Modifier`](modifiers_types.Modifier.md)\<`SnapSizeOptions`, `SnapState`, ``"snapSize"``, \{ `delta`: \{ `x`: `number` = 0; `y`: `number` = 0 } ; `distance`: `number` = 0; `inRange`: `boolean` = false; `range`: `number` = 0; `target`: `any` = null }\> |
| `snapSize._defaults` | `SnapSizeOptions` |
| `snapSize._methods` | \{ `beforeEnd`: (`arg`: [`ModifierArg`](modifiers_types.ModifierArg.md)\<`SnapState`\>) => `void` \| [`Point`](core_types.Point.md) = module.beforeEnd; `set`: (`arg`: [`ModifierArg`](modifiers_types.ModifierArg.md)\<`SnapState`\>) => \{ `delta`: \{ `x`: `number` = 0; `y`: `number` = 0 } ; `distance`: `number` = 0; `inRange`: `boolean` = false; `range`: `number` = 0; `target`: `any` = null } = module.set; `start`: (`arg`: [`ModifierArg`](modifiers_types.ModifierArg.md)\<`SnapState`\>) => `void` = module.start; `stop`: (`arg`: [`ModifierArg`](modifiers_types.ModifierArg.md)\<`SnapState`\>) => `void` = module.stop } |
| `snapSize._methods.beforeEnd` | (`arg`: [`ModifierArg`](modifiers_types.ModifierArg.md)\<`SnapState`\>) => `void` \| [`Point`](core_types.Point.md) |
| `snapSize._methods.set` | (`arg`: [`ModifierArg`](modifiers_types.ModifierArg.md)\<`SnapState`\>) => \{ `delta`: \{ `x`: `number` = 0; `y`: `number` = 0 } ; `distance`: `number` = 0; `inRange`: `boolean` = false; `range`: `number` = 0; `target`: `any` = null } |
| `snapSize._methods.start` | (`arg`: [`ModifierArg`](modifiers_types.ModifierArg.md)\<`SnapState`\>) => `void` |
| `snapSize._methods.stop` | (`arg`: [`ModifierArg`](modifiers_types.ModifierArg.md)\<`SnapState`\>) => `void` |
| `spring` | [`ModifierFunction`](modifiers_types.ModifierFunction.md)\<`any`, `any`, ``"noop"``\> |
| `transform` | [`ModifierFunction`](modifiers_types.ModifierFunction.md)\<`any`, `any`, ``"noop"``\> |

#### Defined in

[modifiers/plugin.ts:14](https://github.com/taye/interact.js/blob/24fdee86/packages/@interactjs/modifiers/plugin.ts#L14)

___

### snappers

• **snappers**: `__module`

#### Defined in

[snappers/plugin.ts:8](https://github.com/taye/interact.js/blob/24fdee86/packages/@interactjs/snappers/plugin.ts#L8)

___

### version

• **version**: `string`

#### Defined in

[core/InteractStatic.ts:48](https://github.com/taye/interact.js/blob/24fdee86/packages/@interactjs/core/InteractStatic.ts#L48)

## Methods

### addDocument

▸ **addDocument**(`doc`, `options?`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `doc` | `Document` |
| `options?` | `object` |

#### Returns

`void`

#### Defined in

[core/InteractStatic.ts:94](https://github.com/taye/interact.js/blob/24fdee86/packages/@interactjs/core/InteractStatic.ts#L94)

___

### debug

▸ **debug**(): `any`

#### Returns

`any`

#### Defined in

[core/InteractStatic.ts:73](https://github.com/taye/interact.js/blob/24fdee86/packages/@interactjs/core/InteractStatic.ts#L73)

___

### isSet

▸ **isSet**(`target`, `options?`): `boolean`

Check if an element or selector has been set with the `interact(target)`
function

#### Parameters

| Name | Type |
| :------ | :------ |
| `target` | [`Target`](../modules/core_types.md#target) |
| `options?` | `any` |

#### Returns

`boolean`

Indicates if the element or CSS selector was previously
passed to interact

#### Defined in

[core/InteractStatic.ts:66](https://github.com/taye/interact.js/blob/24fdee86/packages/@interactjs/core/InteractStatic.ts#L66)

___

### off

▸ **off**(`type`, `listener`, `options?`): `any`

#### Parameters

| Name | Type |
| :------ | :------ |
| `type` | [`EventTypes`](../modules/core_types.md#eventtypes) |
| `listener` | `any` |
| `options?` | `object` |

#### Returns

`any`

#### Defined in

[core/InteractStatic.ts:72](https://github.com/taye/interact.js/blob/24fdee86/packages/@interactjs/core/InteractStatic.ts#L72)

___

### on

▸ **on**(`type`, `listener`, `options?`): `any`

#### Parameters

| Name | Type |
| :------ | :------ |
| `type` | [`EventTypes`](../modules/core_types.md#eventtypes) |
| `listener` | [`ListenersArg`](../modules/core_types.md#listenersarg) |
| `options?` | `object` |

#### Returns

`any`

#### Defined in

[core/InteractStatic.ts:71](https://github.com/taye/interact.js/blob/24fdee86/packages/@interactjs/core/InteractStatic.ts#L71)

___

### pointerMoveTolerance

▸ **pointerMoveTolerance**(`newValue?`): `number` \| [`InteractStatic`](core_InteractStatic.InteractStatic.md)

Returns or sets the distance the pointer must be moved before an action
sequence occurs. This also affects tolerance for tap events.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `newValue?` | `number` | The movement from the start position must be greater than this value |

#### Returns

`number` \| [`InteractStatic`](core_InteractStatic.InteractStatic.md)

#### Defined in

[core/InteractStatic.ts:90](https://github.com/taye/interact.js/blob/24fdee86/packages/@interactjs/core/InteractStatic.ts#L90)

___

### removeDocument

▸ **removeDocument**(`doc`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `doc` | `Document` |

#### Returns

`void`

#### Defined in

[core/InteractStatic.ts:95](https://github.com/taye/interact.js/blob/24fdee86/packages/@interactjs/core/InteractStatic.ts#L95)

___

### stop

▸ **stop**(): [`InteractStatic`](core_InteractStatic.InteractStatic.md)

Cancels all interactions (end events are not fired)

#### Returns

[`InteractStatic`](core_InteractStatic.InteractStatic.md)

#### Defined in

[core/InteractStatic.ts:85](https://github.com/taye/interact.js/blob/24fdee86/packages/@interactjs/core/InteractStatic.ts#L85)

___

### supportsPointerEvent

▸ **supportsPointerEvent**(): `boolean`

Whether or not the browser supports PointerEvents

#### Returns

`boolean`

#### Defined in

[core/InteractStatic.ts:81](https://github.com/taye/interact.js/blob/24fdee86/packages/@interactjs/core/InteractStatic.ts#L81)

___

### supportsTouch

▸ **supportsTouch**(): `boolean`

Whether or not the browser supports touch input

#### Returns

`boolean`

#### Defined in

[core/InteractStatic.ts:77](https://github.com/taye/interact.js/blob/24fdee86/packages/@interactjs/core/InteractStatic.ts#L77)

___

### use

▸ **use**(`plugin`, `options?`): `any`

Use a plugin

#### Parameters

| Name | Type |
| :------ | :------ |
| `plugin` | `Plugin` |
| `options?` | `Object` |

#### Returns

`any`

#### Defined in

[core/InteractStatic.ts:53](https://github.com/taye/interact.js/blob/24fdee86/packages/@interactjs/core/InteractStatic.ts#L53)
