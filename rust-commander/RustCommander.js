const Logger = require('./logger');
const Rcon = require('./Rcon');
const SlackConnector = require('./Connectors/SlackConnector');
const DiscordConnector = require('./Connectors/DiscordConnector');
const ConfigReader = require('./ConfigReader');
const PluginLoader = require('./PluginLoader');
const EventEmitter = require('events').EventEmitter;
const CommandManager = require('./CommandManager');

class RustCommander extends EventEmitter {
  constructor(configFilePath, pluginDirPath) {
    super();
    this.rcon = null;
    this.slack = null;
    this.discord = null;
    this.config = null;
    this.configReader = null;
    this.pluginLoader = null;
    this.plugins = {};
    this.pluginConfigs = {};
    this.commandManager = new CommandManager(this);

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



      // If slack is defined in the config file, create interractions
      if (that.config.slack) {
        that.slack = new SlackConnector(that.config.slack, that.rcon, that.commandManager);
        that.slack.init();
        that.rcon.on('disconnect', (reason) => {
          that.slack.postMessageToAllChannels(`RCON connection lost: ${reason})`);
        });
        that.rcon.on('reconnect', (reason) => {
          that.slack.postMessageToAllChannels(`RCON reconnected`);
        });
      }

      // If discord is defined in the config file, create interractions
      if (that.config.discord) {
        that.discord = new DiscordConnector(that.config.discord, that.rcon, that.commandManager);
        that.discord.init();
        that.rcon.on('disconnect', (reason) => {
          that.discord.postMessageToAllChannels(`RCON connection lost: ${reason})`);
        });
        that.rcon.on('reconnect', (reason) => {
          that.discord.postMessageToAllChannels(`RCON reconnected`);
        });
      }

      that.pluginLoader.loadPlugins().then(() => {

      }).catch((err) => {
        Logger.error(err);
      });

      Logger.title(`LOGS`);

    }).catch((e) => {

      Logger.error(`CONFIG: ${e}`);
      process.exit(1);

    });
  }

  getCommandManager() {
    return this.commandManager;
  }


}

module.exports = RustCommander;
