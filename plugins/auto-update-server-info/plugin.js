const moment = require('moment-timezone');

const plugin = {
  id: 'auto-update-server-info',
  title: 'AutoUpdateServerInfo',
  description: 'Update server.hostname and server.description with dynamic information',
  version: "1.0",
  checkConfig(validator) {
    return {
      wipeDate: validator.date().required(),
      dateFormat: validator.string().required(),
      timezone: validator.string().required(),
      hostname: validator.string().required(),
      description: validator.array().required().items(validator.string().allow('')),
    };
  },
  run(rc, config) {

    let interval = null;
    let mapSize = 0;
    let mapSeed = null;

    const wipeDate = moment(config.wipeDate).tz(config.timezone);

    rc.on('rcon-ready', () => {
      clearInterval(interval);

      interval = setInterval(() => {
        Promise.all([
          rc.rcon.commands.getWorldSize(),
          rc.rcon.commands.getSeed(),
        ]).then((values) => {
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

          Promise.all([
            rc.rcon.commands.setHostname(hostname),
            rc.rcon.commands.setDescription(description),
          ]);
        });
      }, 30 * 1000);
    });
  },
};

module.exports = plugin;
