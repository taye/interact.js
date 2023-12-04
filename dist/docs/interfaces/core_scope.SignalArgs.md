[@interactjs](../README.md) / [core/scope](../modules/core_scope.md) / SignalArgs

# Interface: SignalArgs

[core/scope](../modules/core_scope.md).SignalArgs

## Table of contents

### Properties

- [actions/drop:end](core_scope.SignalArgs.md#actions/drop:end)
- [actions/drop:move](core_scope.SignalArgs.md#actions/drop:move)
- [actions/drop:start](core_scope.SignalArgs.md#actions/drop:start)
- [auto-start:check](core_scope.SignalArgs.md#auto-start:check)
- [autoStart:before-start](core_scope.SignalArgs.md#autostart:before-start)
- [autoStart:prepared](core_scope.SignalArgs.md#autostart:prepared)
- [interactable:new](core_scope.SignalArgs.md#interactable:new)
- [interactable:set](core_scope.SignalArgs.md#interactable:set)
- [interactable:unset](core_scope.SignalArgs.md#interactable:unset)
- [interactions:action-end](core_scope.SignalArgs.md#interactions:action-end)
- [interactions:action-inertiastart](core_scope.SignalArgs.md#interactions:action-inertiastart)
- [interactions:action-move](core_scope.SignalArgs.md#interactions:action-move)
- [interactions:action-reflow](core_scope.SignalArgs.md#interactions:action-reflow)
- [interactions:action-resume](core_scope.SignalArgs.md#interactions:action-resume)
- [interactions:action-start](core_scope.SignalArgs.md#interactions:action-start)
- [interactions:after-action-end](core_scope.SignalArgs.md#interactions:after-action-end)
- [interactions:after-action-inertiastart](core_scope.SignalArgs.md#interactions:after-action-inertiastart)
- [interactions:after-action-move](core_scope.SignalArgs.md#interactions:after-action-move)
- [interactions:after-action-reflow](core_scope.SignalArgs.md#interactions:after-action-reflow)
- [interactions:after-action-resume](core_scope.SignalArgs.md#interactions:after-action-resume)
- [interactions:after-action-start](core_scope.SignalArgs.md#interactions:after-action-start)
- [interactions:before-action-end](core_scope.SignalArgs.md#interactions:before-action-end)
- [interactions:before-action-inertiastart](core_scope.SignalArgs.md#interactions:before-action-inertiastart)
- [interactions:before-action-move](core_scope.SignalArgs.md#interactions:before-action-move)
- [interactions:before-action-reflow](core_scope.SignalArgs.md#interactions:before-action-reflow)
- [interactions:before-action-resume](core_scope.SignalArgs.md#interactions:before-action-resume)
- [interactions:before-action-start](core_scope.SignalArgs.md#interactions:before-action-start)
- [interactions:blur](core_scope.SignalArgs.md#interactions:blur)
- [interactions:cancel](core_scope.SignalArgs.md#interactions:cancel)
- [interactions:destroy](core_scope.SignalArgs.md#interactions:destroy)
- [interactions:down](core_scope.SignalArgs.md#interactions:down)
- [interactions:find](core_scope.SignalArgs.md#interactions:find)
- [interactions:move](core_scope.SignalArgs.md#interactions:move)
- [interactions:new](core_scope.SignalArgs.md#interactions:new)
- [interactions:remove-pointer](core_scope.SignalArgs.md#interactions:remove-pointer)
- [interactions:stop](core_scope.SignalArgs.md#interactions:stop)
- [interactions:up](core_scope.SignalArgs.md#interactions:up)
- [interactions:update-pointer](core_scope.SignalArgs.md#interactions:update-pointer)
- [pointerEvents:collect-targets](core_scope.SignalArgs.md#pointerevents:collect-targets)
- [pointerEvents:fired](core_scope.SignalArgs.md#pointerevents:fired)
- [pointerEvents:new](core_scope.SignalArgs.md#pointerevents:new)
- [scope:add-document](core_scope.SignalArgs.md#scope:add-document)
- [scope:remove-document](core_scope.SignalArgs.md#scope:remove-document)

## Properties

### actions/drop:end

• **actions/drop:end**: `DropSignalArg`

#### Defined in

[actions/drop/plugin.ts:156](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/actions/drop/plugin.ts#L156)

___

### actions/drop:move

• **actions/drop:move**: `DropSignalArg`

#### Defined in

[actions/drop/plugin.ts:155](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/actions/drop/plugin.ts#L155)

___

### actions/drop:start

• **actions/drop:start**: `DropSignalArg`

#### Defined in

[actions/drop/plugin.ts:154](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/actions/drop/plugin.ts#L154)

___

### auto-start:check

• **auto-start:check**: `CheckSignalArg`

#### Defined in

[auto-start/base.ts:47](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/auto-start/base.ts#L47)

___

### autoStart:before-start

• **autoStart:before-start**: `Omit`\<[`PointerArgProps`](../modules/core_Interaction.md#pointerargprops)\<\{ `duplicate`: `boolean` ; `dx`: `number` ; `dy`: `number` ; `type`: ``"move"``  }\>, ``"interaction"``\> & \{ `interaction`: [`Interaction`](../classes/core_Interaction.Interaction.md)\<keyof [`ActionMap`](core_types.ActionMap.md)\>  }

#### Defined in

[auto-start/base.ts:43](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/auto-start/base.ts#L43)

___

### autoStart:prepared

• **autoStart:prepared**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `interaction` | [`Interaction`](../classes/core_Interaction.Interaction.md)\<keyof [`ActionMap`](core_types.ActionMap.md)\> |

#### Defined in

[auto-start/base.ts:46](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/auto-start/base.ts#L46)

___

### interactable:new

• **interactable:new**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `interactable` | [`Interactable`](../classes/core_Interactable.Interactable.md) |
| `options` | [`OptionsArg`](core_options.OptionsArg.md) |
| `target` | [`Target`](../modules/core_types.md#target) |
| `win` | `Window` |

#### Defined in

[core/InteractableSet.ts:13](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/core/InteractableSet.ts#L13)

___

### interactable:set

• **interactable:set**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `interactable` | [`Interactable`](../classes/core_Interactable.Interactable.md) |
| `options` | [`OptionsArg`](core_options.OptionsArg.md) |

#### Defined in

[core/scope.ts:30](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/core/scope.ts#L30)

___

### interactable:unset

• **interactable:unset**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `interactable` | [`Interactable`](../classes/core_Interactable.Interactable.md) |

#### Defined in

[core/scope.ts:29](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/core/scope.ts#L29)

___

### interactions:action-end

• **interactions:action-end**: [`DoAnyPhaseArg`](../modules/core_Interaction.md#doanyphasearg)

#### Defined in

[core/Interaction.ts:95](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/core/Interaction.ts#L95)

___

### interactions:action-inertiastart

• **interactions:action-inertiastart**: [`DoPhaseArg`](core_Interaction.DoPhaseArg.md)\<keyof [`ActionMap`](core_types.ActionMap.md), ``"inertiastart"``\>

#### Defined in

[inertia/plugin.ts:47](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/inertia/plugin.ts#L47)

___

### interactions:action-move

• **interactions:action-move**: [`DoAnyPhaseArg`](../modules/core_Interaction.md#doanyphasearg)

#### Defined in

[core/Interaction.ts:92](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/core/Interaction.ts#L92)

___

### interactions:action-reflow

• **interactions:action-reflow**: [`DoAnyPhaseArg`](../modules/core_Interaction.md#doanyphasearg)

#### Defined in

[reflow/plugin.ts:13](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/reflow/plugin.ts#L13)

___

### interactions:action-resume

• **interactions:action-resume**: [`DoPhaseArg`](core_Interaction.DoPhaseArg.md)\<keyof [`ActionMap`](core_types.ActionMap.md), ``"resume"``\>

#### Defined in

[inertia/plugin.ts:50](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/inertia/plugin.ts#L50)

___

### interactions:action-start

• **interactions:action-start**: [`DoAnyPhaseArg`](../modules/core_Interaction.md#doanyphasearg)

#### Defined in

[core/Interaction.ts:89](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/core/Interaction.ts#L89)

___

### interactions:after-action-end

• **interactions:after-action-end**: [`DoAnyPhaseArg`](../modules/core_Interaction.md#doanyphasearg)

#### Defined in

[core/Interaction.ts:96](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/core/Interaction.ts#L96)

___

### interactions:after-action-inertiastart

• **interactions:after-action-inertiastart**: [`DoPhaseArg`](core_Interaction.DoPhaseArg.md)\<keyof [`ActionMap`](core_types.ActionMap.md), ``"inertiastart"``\>

#### Defined in

[inertia/plugin.ts:48](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/inertia/plugin.ts#L48)

___

### interactions:after-action-move

• **interactions:after-action-move**: [`DoAnyPhaseArg`](../modules/core_Interaction.md#doanyphasearg)

#### Defined in

[core/Interaction.ts:93](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/core/Interaction.ts#L93)

___

### interactions:after-action-reflow

• **interactions:after-action-reflow**: [`DoAnyPhaseArg`](../modules/core_Interaction.md#doanyphasearg)

#### Defined in

[reflow/plugin.ts:14](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/reflow/plugin.ts#L14)

___

### interactions:after-action-resume

• **interactions:after-action-resume**: [`DoPhaseArg`](core_Interaction.DoPhaseArg.md)\<keyof [`ActionMap`](core_types.ActionMap.md), ``"resume"``\>

#### Defined in

[inertia/plugin.ts:51](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/inertia/plugin.ts#L51)

___

### interactions:after-action-start

• **interactions:after-action-start**: [`DoAnyPhaseArg`](../modules/core_Interaction.md#doanyphasearg)

#### Defined in

[core/Interaction.ts:90](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/core/Interaction.ts#L90)

___

### interactions:before-action-end

• **interactions:before-action-end**: `Omit`\<[`DoAnyPhaseArg`](../modules/core_Interaction.md#doanyphasearg), ``"iEvent"``\>

#### Defined in

[core/Interaction.ts:94](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/core/Interaction.ts#L94)

___

### interactions:before-action-inertiastart

• **interactions:before-action-inertiastart**: `Omit`\<[`DoPhaseArg`](core_Interaction.DoPhaseArg.md)\<keyof [`ActionMap`](core_types.ActionMap.md), ``"inertiastart"``\>, ``"iEvent"``\>

#### Defined in

[inertia/plugin.ts:46](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/inertia/plugin.ts#L46)

___

### interactions:before-action-move

• **interactions:before-action-move**: `Omit`\<[`DoAnyPhaseArg`](../modules/core_Interaction.md#doanyphasearg), ``"iEvent"``\>

#### Defined in

[core/Interaction.ts:91](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/core/Interaction.ts#L91)

___

### interactions:before-action-reflow

• **interactions:before-action-reflow**: `Omit`\<[`DoAnyPhaseArg`](../modules/core_Interaction.md#doanyphasearg), ``"iEvent"``\>

#### Defined in

[reflow/plugin.ts:12](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/reflow/plugin.ts#L12)

___

### interactions:before-action-resume

• **interactions:before-action-resume**: `Omit`\<[`DoPhaseArg`](core_Interaction.DoPhaseArg.md)\<keyof [`ActionMap`](core_types.ActionMap.md), ``"resume"``\>, ``"iEvent"``\>

#### Defined in

[inertia/plugin.ts:49](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/inertia/plugin.ts#L49)

___

### interactions:before-action-start

• **interactions:before-action-start**: `Omit`\<[`DoAnyPhaseArg`](../modules/core_Interaction.md#doanyphasearg), ``"iEvent"``\>

#### Defined in

[core/Interaction.ts:88](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/core/Interaction.ts#L88)

___

### interactions:blur

• **interactions:blur**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `event` | `Event` |
| `interaction` | [`Interaction`](../classes/core_Interaction.Interaction.md)\<`never`\> |
| `type` | ``"blur"`` |

#### Defined in

[core/Interaction.ts:87](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/core/Interaction.ts#L87)

___

### interactions:cancel

• **interactions:cancel**: `never`

#### Defined in

[core/Interaction.ts:79](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/core/Interaction.ts#L79)

___

### interactions:destroy

• **interactions:destroy**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `interaction` | [`Interaction`](../classes/core_Interaction.Interaction.md)\<keyof [`ActionMap`](core_types.ActionMap.md)\> |

#### Defined in

[core/scope.ts:31](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/core/scope.ts#L31)

___

### interactions:down

• **interactions:down**: [`PointerArgProps`](../modules/core_Interaction.md#pointerargprops)\<\{ `type`: ``"down"``  }\>

#### Defined in

[core/Interaction.ts:66](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/core/Interaction.ts#L66)

___

### interactions:find

• **interactions:find**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `interaction` | [`Interaction`](../classes/core_Interaction.Interaction.md)\<keyof [`ActionMap`](core_types.ActionMap.md)\> |
| `searchDetails` | [`SearchDetails`](core_interactionFinder.SearchDetails.md) |

#### Defined in

[core/interactions.ts:31](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/core/interactions.ts#L31)

___

### interactions:move

• **interactions:move**: [`PointerArgProps`](../modules/core_Interaction.md#pointerargprops)\<\{ `duplicate`: `boolean` ; `dx`: `number` ; `dy`: `number` ; `type`: ``"move"``  }\>

#### Defined in

[core/Interaction.ts:69](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/core/Interaction.ts#L69)

___

### interactions:new

• **interactions:new**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `interaction` | [`Interaction`](../classes/core_Interaction.Interaction.md)\<keyof [`ActionMap`](core_types.ActionMap.md)\> |

#### Defined in

[core/Interaction.ts:65](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/core/Interaction.ts#L65)

___

### interactions:remove-pointer

• **interactions:remove-pointer**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `event` | [`PointerEventType`](../modules/core_types.md#pointereventtype) |
| `eventTarget` | `Node` |
| `interaction` | [`Interaction`](../classes/core_Interaction.Interaction.md)\<`never`\> |
| `pointer` | [`PointerType`](../modules/core_types.md#pointertype) |
| `pointerIndex` | `number` |
| `pointerInfo` | [`PointerInfo`](../classes/core_Interaction.PointerInfo.md) |

#### Defined in

[core/Interaction.ts:86](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/core/Interaction.ts#L86)

___

### interactions:stop

• **interactions:stop**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `interaction` | [`Interaction`](../classes/core_Interaction.Interaction.md)\<keyof [`ActionMap`](core_types.ActionMap.md)\> |

#### Defined in

[core/Interaction.ts:97](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/core/Interaction.ts#L97)

___

### interactions:up

• **interactions:up**: [`PointerArgProps`](../modules/core_Interaction.md#pointerargprops)\<\{ `curEventTarget`: `EventTarget` ; `type`: ``"up"``  }\>

#### Defined in

[core/Interaction.ts:75](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/core/Interaction.ts#L75)

___

### interactions:update-pointer

• **interactions:update-pointer**: [`PointerArgProps`](../modules/core_Interaction.md#pointerargprops)\<\{ `down`: `boolean`  }\>

#### Defined in

[core/Interaction.ts:83](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/core/Interaction.ts#L83)

___

### pointerEvents:collect-targets

• **pointerEvents:collect-targets**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `event` | [`PointerEventType`](../modules/core_types.md#pointereventtype) \| [`PointerEvent`](../classes/pointer_events_PointerEvent.PointerEvent.md)\<`any`\> |
| `eventTarget` | `Node` |
| `interaction` | [`Interaction`](../classes/core_Interaction.Interaction.md)\<`any`\> |
| `node` | ``null`` |
| `path` | `Node`[] |
| `pointer` | [`PointerType`](../modules/core_types.md#pointertype) \| [`PointerEvent`](../classes/pointer_events_PointerEvent.PointerEvent.md)\<`any`\> |
| `targets?` | [`EventTargetList`](../modules/pointer_events_base.md#eventtargetlist) |
| `type` | `string` |

#### Defined in

[pointer-events/base.ts:66](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/pointer-events/base.ts#L66)

___

### pointerEvents:fired

• **pointerEvents:fired**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `event` | [`PointerEventType`](../modules/core_types.md#pointereventtype) \| [`PointerEvent`](../classes/pointer_events_PointerEvent.PointerEvent.md)\<`any`\> |
| `eventTarget` | `Node` |
| `interaction` | [`Interaction`](../classes/core_Interaction.Interaction.md)\<``null``\> |
| `pointer` | [`PointerType`](../modules/core_types.md#pointertype) \| [`PointerEvent`](../classes/pointer_events_PointerEvent.PointerEvent.md)\<`any`\> |
| `pointerEvent` | [`PointerEvent`](../classes/pointer_events_PointerEvent.PointerEvent.md)\<`any`\> |
| `targets?` | [`EventTargetList`](../modules/pointer_events_base.md#eventtargetlist) |
| `type` | `string` |

#### Defined in

[pointer-events/base.ts:57](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/pointer-events/base.ts#L57)

___

### pointerEvents:new

• **pointerEvents:new**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `pointerEvent` | [`PointerEvent`](../classes/pointer_events_PointerEvent.PointerEvent.md)\<`any`\> |

#### Defined in

[pointer-events/base.ts:56](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/pointer-events/base.ts#L56)

___

### scope:add-document

• **scope:add-document**: `DocSignalArg`

#### Defined in

[core/scope.ts:27](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/core/scope.ts#L27)

___

### scope:remove-document

• **scope:remove-document**: `DocSignalArg`

#### Defined in

[core/scope.ts:28](https://github.com/taye/interact.js/blob/5ca9fe72/packages/@interactjs/core/scope.ts#L28)
