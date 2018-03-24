import * as is from '../is';

export default (grid) => {
  return function (x, y) {
    const {
      x: gridX,
      y: gridY,
      range,
      offset,
      limits = {
        left  : -Infinity,
        right :  Infinity,
        top   : -Infinity,
        bottom:  Infinity,
      },
    } = grid;

    let offsetX = 0;
    let offsetY = 0;

    if (is.object(offset)) {
      offsetX = offset.x;
      offsetY = offset.y;
    }

    const gridx = Math.round((x - offsetX) / gridX);
    const gridy = Math.round((y - offsetY) / gridY);

    const newX = Math.max(limits.left, Math.min(limits.right , gridx * gridX + offsetX));
    const newY = Math.max(limits.top , Math.min(limits.bottom, gridy * gridY + offsetY));

    return {
      x: newX,
      y: newY,
      range: range,
    };
  };
};
