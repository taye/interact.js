import base from './base'
import restrictEdgesModule from './restrict/edges'
import restrictModule from './restrict/pointer'
import restrictSizeModule from './restrict/size'
import snapEdgesModule from './snap/edges'
import snapModule from './snap/pointer'
import snapSizeModule from './snap/size'

const { makeModifier } = base

export const snap = makeModifier(snapModule, 'snap')
export const snapSize = makeModifier(snapSizeModule, 'snapSize')
export const snapEdges = makeModifier(snapEdgesModule, 'snapEdges')
export const restrict = makeModifier(restrictModule, 'restrict')
export const restrictEdges = makeModifier(restrictEdgesModule, 'restrictEdges')
export const restrictSize = makeModifier(restrictSizeModule, 'restrictSize')
