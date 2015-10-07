const actions = {
  defaultChecker: function (pointer, event, interaction, element) {
    const rect = this.getRect(element);
    let action = null;

    for (const actionName of actions.names) {
      action = actions[actionName].checker(pointer, event, this, element, interaction, rect);

      if (action) {
        return action;
      }
    }
  },

  names: [],
  methodDict: {},
};

module.exports = actions;
