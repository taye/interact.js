import base from './base';
import snapModule from './snap';
import snapSizeModule from './snapSize';
import snapEdgesModule from './snapEdges';
import restrictModule from './restrict';
import restrictEdgesModule from './restrictEdges';
import restrictSizeModule from './restrictSize';

const { makeModifier } = base;

export const snap = makeModifier(snapModule, 'snap');
export const snapSize = makeModifier(snapSizeModule, 'snapSize');
export const snapEdges = makeModifier(snapEdgesModule, 'snapEdges');
export const restrict = makeModifier(restrictModule, 'restrict');
export const restrictEdges = makeModifier(restrictEdgesModule, 'restrictEdges');
export const restrictSize = makeModifier(restrictSizeModule, 'restrictSize');
