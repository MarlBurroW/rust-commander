

const Logger = require('./logger');
const Rcon = require('./Rcon');
const SlackConnector = require('./Connectors/SlackConnector');
const DiscordConnector = require('./Connectors/DiscordConnector');
const ConfigReader = require('./ConfigReader');
const PluginLoader = require('./PluginLoader');
const EventEmitter = require('events').EventEmitter;

class RustCommander extends EventEmitter {
  constructor(configFilePath, pluginDirPath) {
    super();
    this.rcon = null;
    this.slack = null;
    this.discord = null;
    this.config = null;
    this.configReader = null;
    this.pluginLoader = null;

    this.playerCommands = {};

    this.configFilePath = configFilePath;
    this.pluginDirPath = pluginDirPath;
  }

  run() {
    const that = this;
    that.configReader = new ConfigReader();


    // Splash screen
    Logger.splashScreen();

    // Reads the configuration file
    that.configReader.read(that.configFilePath).then((config) => {
      that.config = config;

      that.pluginLoader = new PluginLoader(that.pluginDirPath, that);


      that.rcon = new Rcon(that.config.rust_server);
      that.rcon.init();

      that.rcon.on('ready', () => {
        that.emit('rcon-ready');
      })


      // If slack is defined in the config file, create interractions
      if (that.config.slack) {
        that.slack = new SlackConnector(that.config.slack, that.rcon);
        that.slack.init();
      }

      // If discord is defined in the config file, create interractions
      if (that.config.discord) {
        that.discord = new DiscordConnector(that.config.discord, that.rcon);
        that.discord.init();
      }

      that.pluginLoader.loadPlugins().then(() => {
        that.initPlayerCommands();
      }).catch((err) => {
        Logger.error(err);
      });

      Logger.title(`LOGS`);

    }).catch((e) => {

      Logger.error(`CONFIG: ${e}`);
      process.exit(1);

    });
  }

  registerPlayerCommand(command, description, callback) {
    const that = this;
    that.playerCommands[command] = { description, callback };
  }

  initPlayerCommands() {
    const that = this;

  }

}

module.exports = RustCommander;
