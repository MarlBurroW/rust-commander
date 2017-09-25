const moment = require('moment-timezone');

const plugin = {
  id: 'auto-update-server-info',
  title: 'AutoUpdateServerInfo',
  description: 'Update server.hostname and server.description with dynamic information',
  version: '1.0',
  requiredPlugins: ['wipe-date'],
  checkConfig(validator) {
    return {
      dateFormat: validator.string().required(),
      hostname: validator.string().required(),
      description: validator.array().required().items(validator.string().allow('')),
    };
  },
  run(helper) {

    // Get the Rcon instance
    const rcon = helper.getRcon();
    // Get the plugin config
    const config = helper.getConfig();
    // Get the dataManager of the wipe-date plugin
    const wipeDatePluginDataManager = helper.getPluginHelper('wipe-date').getDataManager();

    // Declare some internal data
    let interval = null;
    let mapSize = 0;
    let mapSeed = null;

    rcon.on('disconnect', () => {
      // When the RCON is disconnected, destroy the interval
      clearInterval(interval);
    });

    rcon.on('connect', () => {
      // When the RCON is connected, create an interval
      interval = setInterval(() => {
        // Get the wipeDate from the dataManager
        const wipeDate =  wipeDatePluginDataManager.getData('wipeDate');

        // Get data from RCON
        Promise.all([
          rcon.commands.getWorldSize(),
          rcon.commands.getSeed(),
        ]).then((values) => {
          // Ok, we have the mapSize and the mapSeed
          mapSize = values[0];
          mapSeed = values[1];

          let now = moment();
          let wipeInfo = now > wipeDate ? `Wiped ${wipeDate.format(config.dateFormat)} (~ ${wipeDate.fromNow()})` : `Next wipe ${wipeDate.format(config.dateFormat)} (~ ${wipeDate.fromNow()})`;

          let description = config.description.join('\n');
          description = description.replace(new RegExp('{seed}', 'g'), mapSeed)
            .replace(new RegExp('{size}', 'g'), mapSize)
            .replace(new RegExp('{wipeDate}', 'g'), wipeDate.format(config.dateFormat))
            .replace(new RegExp('{wipeInfo}', 'g'), wipeInfo);

          let hostname =  config.hostname
          hostname = hostname.replace(new RegExp('{seed}', 'g'), mapSeed)
            .replace(new RegExp('{size}', 'g'), mapSize)
            .replace(new RegExp('{wipeDate}', 'g'), wipeDate.format(config.dateFormat))
            .replace(new RegExp('{wipeInfo}', 'g'), wipeInfo);

          // Set the description and the hostname
          Promise.all([
            rcon.commands.setHostname(hostname),
            rcon.commands.setDescription(description),
          ]);
        });
      }, 30 * 1000);
    });


  },
};

module.exports = plugin;
