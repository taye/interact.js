/* eslint-disable node/no-extraneous-import, import/no-unresolved */
import aspectRatio from './aspectRatio'
import avoid from './avoid/avoid'
import restrictEdges from './restrict/edges'
import restrict from './restrict/pointer'
import restrictRect from './restrict/rect'
import restrictSize from './restrict/size'
import rubberband from './rubberband/rubberband'
import snapEdges from './snap/edges'
import snap from './snap/pointer'
import snapSize from './snap/size'
import spring from './spring/spring'
import transform from './transform/transform'

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
