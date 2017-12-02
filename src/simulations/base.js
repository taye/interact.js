function init (scope) {
  const { Interaction } = scope;

  Interaction.signals.on('new', function (interaction) {
    interaction.simulations = {};
  });
}

module.exports = {
  init,
};
