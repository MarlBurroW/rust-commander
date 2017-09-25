
class PluginCommandManager {

  constructor(commandManager, pluginName) {
    this.commandManager = commandManager;
    this.namespace = pluginName;
    this.pluginName = pluginName;
  }

  registerControlCommand(command, description, callback) {
    this.commandManager.registerControlCommand(this.namespace, command, description, callback);
  }

  registerPlayerCommand(command, description, callback) {
    this.commandManager.registerPlayerCommand(this.pluginName, command, description, callback);
  }

}

module.exports = PluginCommandManager;