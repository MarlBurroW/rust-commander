const EventEmitter = require('events').EventEmitter;
const SystemJS = require('systemjs');
const Logger = require('./logger');
const path = require('path');
const glob = require("glob")

class PluginLoader extends EventEmitter {
  constructor(pluginDirPath, rustCommander) {
    super();
    this.pluginDirPath = pluginDirPath;
    this.rustCommander = rustCommander;
  }

  loadPlugins() {
    const that = this;
    Logger.title('PLUGINS');

    glob(path.join(this.pluginDirPath, '*', 'plugin.js'), {absolute: true}, (er, files) => {
      files.forEach((pluginPath) => {

        SystemJS.import('file:///' + pluginPath).then((plugin) => {
          Logger.success(`[PLUGIN LOADED] ${plugin.title} - ${plugin.description}`);
          plugin.run(that.rustCommander);
        }).catch((err) => {
          Logger.error(err);
        });
      });
    });
  }
}

module.exports = PluginLoader;
