const EventEmitter = require('events').EventEmitter;
const SystemJS = require('systemjs');
const Logger = require('./logger');
const path = require('path');

class PluginLoader extends EventEmitter {
  constructor(pluginDirPath, rustCommander) {
    super();
    this.pluginDirPath = pluginDirPath;
    this.rustCommander = rustCommander;
  }

  loadPlugins() {
    const that = this;
    Logger.title('PLUGINS');
    Logger.log(`Load plugins defined in the configuration file`);

    let loadPromises = [];

    if (that.rustCommander.config.plugins) {
      that.rustCommander.config.plugins.forEach((pluginID) => {
        loadPromises.push(SystemJS.import(path.join(that.pluginDirPath, pluginID, 'plugin.js')).then((plugin) => {
          Logger.success(`[${plugin.title}] ${plugin.description}`);
          plugin.run(that.rustCommander);
        }));
      });
    }

    return Promise.all(loadPromises);

  }
}

module.exports = PluginLoader;
