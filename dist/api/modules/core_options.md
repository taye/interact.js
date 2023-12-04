[@interactjs](../README.md) / core/options

# Module: core/options

## Table of contents

### Interfaces

- [ActionDefaults](../interfaces/core_options.ActionDefaults.md)
- [BaseDefaults](../interfaces/core_options.BaseDefaults.md)
- [Defaults](../interfaces/core_options.Defaults.md)
- [OptionsArg](../interfaces/core_options.OptionsArg.md)
- [PerActionDefaults](../interfaces/core_options.PerActionDefaults.md)

### Type Aliases

- [Options](core_options.md#options)

## Type Aliases

### Options

Ƭ **Options**: `Partial`\<[`BaseDefaults`](../interfaces/core_options.BaseDefaults.md)\> & `Partial`\<[`PerActionDefaults`](../interfaces/core_options.PerActionDefaults.md)\> & \{ [P in keyof ActionDefaults]?: Partial\<ActionDefaults[P]\> }

#### Defined in

[core/options.ts:27](https://github.com/taye/interact.js/blob/f56f1fa2/packages/@interactjs/core/options.ts#L27)
