import base from './base';
import snapModule from './snap/pointer';
import snapSizeModule from './snap/size';
import snapEdgesModule from './snap/edges';
import restrictModule from './restrict/pointer';
import restrictEdgesModule from './restrict/edges';
import restrictSizeModule from './restrict/size';

const { makeModifier } = base;

export const snap = makeModifier(snapModule, 'snap');
export const snapSize = makeModifier(snapSizeModule, 'snapSize');
export const snapEdges = makeModifier(snapEdgesModule, 'snapEdges');
export const restrict = makeModifier(restrictModule, 'restrict');
export const restrictEdges = makeModifier(restrictEdgesModule, 'restrictEdges');
export const restrictSize = makeModifier(restrictSizeModule, 'restrictSize');
