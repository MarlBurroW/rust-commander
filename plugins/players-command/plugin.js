const plugin = {
  enabled: true,
  id: 'players',
  title: 'Players Command Plugin',
  description: 'Add the !players command to show the counter of connected players',
  version: '1.0',
  run(rustCommander) {

    rustCommander.registerPlayerCommand('players', 'Show the counter of connected players', () => {

    })

  }
}

module.exports = plugin;
