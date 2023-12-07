[@interactjs](../README.md) / core/types

# Module: core/types

## Table of contents

### Interfaces

- [ActionMap](../interfaces/core_types.ActionMap.md)
- [ActionMethod](../interfaces/core_types.ActionMethod.md)
- [ActionProps](../interfaces/core_types.ActionProps.md)
- [Actions](../interfaces/core_types.Actions.md)
- [CoordsSet](../interfaces/core_types.CoordsSet.md)
- [CoordsSetMember](../interfaces/core_types.CoordsSetMember.md)
- [EdgeOptions](../interfaces/core_types.EdgeOptions.md)
- [HasGetRect](../interfaces/core_types.HasGetRect.md)
- [InertiaOption](../interfaces/core_types.InertiaOption.md)
- [ListenerMap](../interfaces/core_types.ListenerMap.md)
- [OptionMethod](../interfaces/core_types.OptionMethod.md)
- [Point](../interfaces/core_types.Point.md)
- [PointerEventsOptions](../interfaces/core_types.PointerEventsOptions.md)
- [Rect](../interfaces/core_types.Rect.md)
- [Size](../interfaces/core_types.Size.md)

### Type Aliases

- [ActionChecker](core_types.md#actionchecker)
- [ActionName](core_types.md#actionname)
- [ArrayElementType](core_types.md#arrayelementtype)
- [Context](core_types.md#context)
- [CursorChecker](core_types.md#cursorchecker)
- [Dimensions](core_types.md#dimensions)
- [Element](core_types.md#element)
- [EventTarget](core_types.md#eventtarget)
- [EventTypes](core_types.md#eventtypes)
- [FullRect](core_types.md#fullrect)
- [InertiaOptions](core_types.md#inertiaoptions)
- [Listener](core_types.md#listener)
- [Listeners](core_types.md#listeners)
- [ListenersArg](core_types.md#listenersarg)
- [NativePointerEventType](core_types.md#nativepointereventtype)
- [OrBoolean](core_types.md#orboolean)
- [OriginFunction](core_types.md#originfunction)
- [PointerEventType](core_types.md#pointereventtype)
- [PointerType](core_types.md#pointertype)
- [RectChecker](core_types.md#rectchecker)
- [RectFunction](core_types.md#rectfunction)
- [RectResolvable](core_types.md#rectresolvable)
- [Target](core_types.md#target)

## Type Aliases

### ActionChecker

Ƭ **ActionChecker**: (`pointerEvent`: `any`, `defaultAction`: `string`, `interactable`: [`Interactable`](../classes/core_Interactable.Interactable.md), `element`: [`Element`](core_types.md#element), `interaction`: [`Interaction`](../classes/core_Interaction.Interaction.md)) => [`ActionProps`](../interfaces/core_types.ActionProps.md)

#### Type declaration

▸ (`pointerEvent`, `defaultAction`, `interactable`, `element`, `interaction`): [`ActionProps`](../interfaces/core_types.ActionProps.md)

##### Parameters

| Name | Type |
| :------ | :------ |
| `pointerEvent` | `any` |
| `defaultAction` | `string` |
| `interactable` | [`Interactable`](../classes/core_Interactable.Interactable.md) |
| `element` | [`Element`](core_types.md#element) |
| `interaction` | [`Interaction`](../classes/core_Interaction.Interaction.md) |

##### Returns

[`ActionProps`](../interfaces/core_types.ActionProps.md)

#### Defined in

[core/types.ts:113](https://github.com/taye/interact.js/blob/24fdee86/packages/@interactjs/core/types.ts#L113)

___

### ActionName

Ƭ **ActionName**: keyof [`ActionMap`](../interfaces/core_types.ActionMap.md)

#### Defined in

[core/types.ts:64](https://github.com/taye/interact.js/blob/24fdee86/packages/@interactjs/core/types.ts#L64)

___

### ArrayElementType

Ƭ **ArrayElementType**\<`T`\>: `T` extends infer P[] ? `P` : `never`

#### Type parameters

| Name |
| :------ |
| `T` |

#### Defined in

[core/types.ts:145](https://github.com/taye/interact.js/blob/24fdee86/packages/@interactjs/core/types.ts#L145)

___

### Context

Ƭ **Context**: `Document` \| [`Element`](core_types.md#element)

#### Defined in

[core/types.ts:12](https://github.com/taye/interact.js/blob/24fdee86/packages/@interactjs/core/types.ts#L12)

___

### CursorChecker

Ƭ **CursorChecker**: (`action`: [`ActionProps`](../interfaces/core_types.ActionProps.md)\<[`ActionName`](core_types.md#actionname)\>, `interactable`: [`Interactable`](../classes/core_Interactable.Interactable.md), `element`: [`Element`](core_types.md#element), `interacting`: `boolean`) => `string`

#### Type declaration

▸ (`action`, `interactable`, `element`, `interacting`): `string`

##### Parameters

| Name | Type |
| :------ | :------ |
| `action` | [`ActionProps`](../interfaces/core_types.ActionProps.md)\<[`ActionName`](core_types.md#actionname)\> |
| `interactable` | [`Interactable`](../classes/core_Interactable.Interactable.md) |
| `element` | [`Element`](core_types.md#element) |
| `interacting` | `boolean` |

##### Returns

`string`

#### Defined in

[core/types.ts:95](https://github.com/taye/interact.js/blob/24fdee86/packages/@interactjs/core/types.ts#L95)

___

### Dimensions

Ƭ **Dimensions**: [`Point`](../interfaces/core_types.Point.md) & [`Size`](../interfaces/core_types.Size.md)

#### Defined in

[core/types.ts:41](https://github.com/taye/interact.js/blob/24fdee86/packages/@interactjs/core/types.ts#L41)

___

### Element

Ƭ **Element**: `HTMLElement` \| `SVGElement`

#### Defined in

[core/types.ts:11](https://github.com/taye/interact.js/blob/24fdee86/packages/@interactjs/core/types.ts#L11)

___

### EventTarget

Ƭ **EventTarget**: `Window` \| `Document` \| [`Element`](core_types.md#element)

#### Defined in

[core/types.ts:13](https://github.com/taye/interact.js/blob/24fdee86/packages/@interactjs/core/types.ts#L13)

___

### EventTypes

Ƭ **EventTypes**: `string` \| [`ListenerMap`](../interfaces/core_types.ListenerMap.md) \| (`string` \| [`ListenerMap`](../interfaces/core_types.ListenerMap.md))[]

#### Defined in

[core/types.ts:136](https://github.com/taye/interact.js/blob/24fdee86/packages/@interactjs/core/types.ts#L136)

___

### FullRect

Ƭ **FullRect**: `Required`\<[`Rect`](../interfaces/core_types.Rect.md)\>

#### Defined in

[core/types.ts:35](https://github.com/taye/interact.js/blob/24fdee86/packages/@interactjs/core/types.ts#L35)

___

### InertiaOptions

Ƭ **InertiaOptions**: [`InertiaOption`](../interfaces/core_types.InertiaOption.md) \| `boolean`

#### Defined in

[core/types.ts:86](https://github.com/taye/interact.js/blob/24fdee86/packages/@interactjs/core/types.ts#L86)

___

### Listener

Ƭ **Listener**: (...`args`: `any`[]) => `any`

#### Type declaration

▸ (`...args`): `any`

##### Parameters

| Name | Type |
| :------ | :------ |
| `...args` | `any`[] |

##### Returns

`any`

#### Defined in

[core/types.ts:138](https://github.com/taye/interact.js/blob/24fdee86/packages/@interactjs/core/types.ts#L138)

___

### Listeners

Ƭ **Listeners**: [`ListenerMap`](../interfaces/core_types.ListenerMap.md) \| [`ListenerMap`](../interfaces/core_types.ListenerMap.md)[]

#### Defined in

[core/types.ts:139](https://github.com/taye/interact.js/blob/24fdee86/packages/@interactjs/core/types.ts#L139)

___

### ListenersArg

Ƭ **ListenersArg**: [`Listener`](core_types.md#listener) \| [`ListenerMap`](../interfaces/core_types.ListenerMap.md) \| ([`Listener`](core_types.md#listener) \| [`ListenerMap`](../interfaces/core_types.ListenerMap.md))[]

#### Defined in

[core/types.ts:140](https://github.com/taye/interact.js/blob/24fdee86/packages/@interactjs/core/types.ts#L140)

___

### NativePointerEventType

Ƭ **NativePointerEventType**: typeof `NativePointerEvent_`

#### Defined in

[core/types.ts:132](https://github.com/taye/interact.js/blob/24fdee86/packages/@interactjs/core/types.ts#L132)

___

### OrBoolean

Ƭ **OrBoolean**\<`T`\>: \{ [P in keyof T]: T[P] \| boolean }

#### Type parameters

| Name |
| :------ |
| `T` |

#### Defined in

[core/types.ts:7](https://github.com/taye/interact.js/blob/24fdee86/packages/@interactjs/core/types.ts#L7)

___

### OriginFunction

Ƭ **OriginFunction**: (`target`: [`Element`](core_types.md#element)) => [`Rect`](../interfaces/core_types.Rect.md)

#### Type declaration

▸ (`target`): [`Rect`](../interfaces/core_types.Rect.md)

##### Parameters

| Name | Type |
| :------ | :------ |
| `target` | [`Element`](core_types.md#element) |

##### Returns

[`Rect`](../interfaces/core_types.Rect.md)

#### Defined in

[core/types.ts:121](https://github.com/taye/interact.js/blob/24fdee86/packages/@interactjs/core/types.ts#L121)

___

### PointerEventType

Ƭ **PointerEventType**: `MouseEvent` \| `TouchEvent` \| `Partial`\<[`NativePointerEventType`](core_types.md#nativepointereventtype)\> \| [`InteractEvent`](../classes/core_InteractEvent.InteractEvent.md)

#### Defined in

[core/types.ts:133](https://github.com/taye/interact.js/blob/24fdee86/packages/@interactjs/core/types.ts#L133)

___

### PointerType

Ƭ **PointerType**: `MouseEvent` \| `Touch` \| `Partial`\<[`NativePointerEventType`](core_types.md#nativepointereventtype)\> \| [`InteractEvent`](../classes/core_InteractEvent.InteractEvent.md)

#### Defined in

[core/types.ts:134](https://github.com/taye/interact.js/blob/24fdee86/packages/@interactjs/core/types.ts#L134)

___

### RectChecker

Ƭ **RectChecker**: (`element`: [`Element`](core_types.md#element)) => [`Rect`](../interfaces/core_types.Rect.md)

#### Type declaration

▸ (`element`): [`Rect`](../interfaces/core_types.Rect.md)

##### Parameters

| Name | Type |
| :------ | :------ |
| `element` | [`Element`](core_types.md#element) |

##### Returns

[`Rect`](../interfaces/core_types.Rect.md)

#### Defined in

[core/types.ts:130](https://github.com/taye/interact.js/blob/24fdee86/packages/@interactjs/core/types.ts#L130)

___

### RectFunction

Ƭ **RectFunction**\<`T`\>: (...`args`: `T`) => [`Rect`](../interfaces/core_types.Rect.md) \| [`Element`](core_types.md#element)

#### Type parameters

| Name | Type |
| :------ | :------ |
| `T` | extends `any`[] |

#### Type declaration

▸ (`...args`): [`Rect`](../interfaces/core_types.Rect.md) \| [`Element`](core_types.md#element)

##### Parameters

| Name | Type |
| :------ | :------ |
| `...args` | `T` |

##### Returns

[`Rect`](../interfaces/core_types.Rect.md) \| [`Element`](core_types.md#element)

#### Defined in

[core/types.ts:37](https://github.com/taye/interact.js/blob/24fdee86/packages/@interactjs/core/types.ts#L37)

___

### RectResolvable

Ƭ **RectResolvable**\<`T`\>: [`Rect`](../interfaces/core_types.Rect.md) \| `string` \| [`Element`](core_types.md#element) \| [`RectFunction`](core_types.md#rectfunction)\<`T`\>

#### Type parameters

| Name | Type |
| :------ | :------ |
| `T` | extends `any`[] |

#### Defined in

[core/types.ts:39](https://github.com/taye/interact.js/blob/24fdee86/packages/@interactjs/core/types.ts#L39)

___

### Target

Ƭ **Target**: [`EventTarget`](core_types.md#eventtarget) \| `string`

#### Defined in

[core/types.ts:14](https://github.com/taye/interact.js/blob/24fdee86/packages/@interactjs/core/types.ts#L14)
