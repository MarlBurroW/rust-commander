class PluginHelper {

  constructor(rustCommander, config, dataManager, commandManager) {
    this.rustCommander = rustCommander;
    this.config = config;
    this.dataManager = dataManager;
    this.commandManager = commandManager;
  }

  getRustCommander() {
    return this.rustCommander;
  }

  getConfig() {
    return this.config;
  }

  getDataManager() {
    return this.dataManager;
  }

  getCommandManager() {
    return this.commandManager;
  }

  getPluginHelper(pluginID) {
    return this.rustCommander.plugins[pluginID].helper;
  }

  getRcon() {
    return this.rustCommander.rcon;
  }

  getSlack() {
    return this.rustCommander.slack || null;
  }

  getDiscord() {
    return this.rustCommander.discord || null;
  }
}

module.exports = PluginHelper;