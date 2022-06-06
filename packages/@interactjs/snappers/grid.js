export default (grid => {
  const coordFields = [['x', 'y'], ['left', 'top'], ['right', 'bottom'], ['width', 'height']].filter(([xField, yField]) => xField in grid || yField in grid);

  const gridFunc = (x, y) => {
    const {
      range,
      limits = {
        left: -Infinity,
        right: Infinity,
        top: -Infinity,
        bottom: Infinity
      },
      offset = {
        x: 0,
        y: 0
      }
    } = grid;
    const result = {
      range,
      grid,
      x: null,
      y: null
    };

    for (const [xField, yField] of coordFields) {
      const gridx = Math.round((x - offset.x) / grid[xField]);
      const gridy = Math.round((y - offset.y) / grid[yField]);
      result[xField] = Math.max(limits.left, Math.min(limits.right, gridx * grid[xField] + offset.x));
      result[yField] = Math.max(limits.top, Math.min(limits.bottom, gridy * grid[yField] + offset.y));
    }

    return result;
  };

  gridFunc.grid = grid;
  gridFunc.coordFields = coordFields;
  return gridFunc;
});
//# sourceMappingURL=grid.js.map