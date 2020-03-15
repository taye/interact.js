/* eslint-disable node/no-extraneous-import */
import aspectRatio from './aspectRatio'
import restrictEdges from './restrict/edges'
import restrict from './restrict/pointer'
import restrictRect from './restrict/rect'
import restrictSize from './restrict/size'
import snapEdges from './snap/edges'
import snap from './snap/pointer'
import snapSize from './snap/size'

import spring from '@interactjs/modifiers/spring'
import avoid from '@interactjs/modifiers/avoid'
import transform from '@interactjs/modifiers/transform'
import rubberband from '@interactjs/modifiers/rubberband'

export default {
  aspectRatio,
  restrictEdges,
  restrict,
  restrictRect,
  restrictSize,
  snapEdges,
  snap,
  snapSize,

  spring,
  avoid,
  transform,
  rubberband,
}
