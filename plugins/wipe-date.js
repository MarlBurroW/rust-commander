const moment = require('moment-timezone');

const plugin = {
  id: 'wipe-date',
  title: 'WipeDate',
  description: 'Share a single wipe date between all plugins',
  version: "1.0",
  data: {
    wipeDate: null,
  },
  checkConfig(validator) {
    return {
      wipeDate:  validator.date().required(),
      timezone: validator.string().required(),
    };
  },
  run(helper) {

    // Get the data manager of the plugin
    const dataManager = helper.getDataManager();

    // Set the wipeDate data with a moment instance
    dataManager.setData('wipeDate', moment(helper.config.wipeDate).tz(helper.config.timezone));

    // Get the command manager of the plugin to register commands
    const commandManager = helper.getCommandManager();

    // Register a control command
    commandManager.registerControlCommand('test', 'Test command !', (args, response) => {
      response("Yeaaaah!!!");
    });

    // Register a player command (not implemented yet)
    commandManager.registerPlayerCommand('players', 'Show online players count', (args, response) => {

    });

  },
};

module.exports = plugin;
