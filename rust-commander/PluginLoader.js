const EventEmitter = require('events').EventEmitter;
const SystemJS = require('systemjs');
const Logger = require('./logger');
const path = require('path');
const Joi = require('joi');

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
        let pluginPath = path.join(that.pluginDirPath, pluginID, 'plugin.js')
        let plugin = null;
        try {
          plugin = require(pluginPath);
        } catch (err) {
          Logger.error(`[PLUGIN][${pluginID}] Can't load the plugin ${pluginPath}: ${err}`)
          return;
        }

        let {pluginErrors} = that.validatePluginSchema(plugin);

        if (pluginErrors.length > 0) {
          Logger.error(`[PLUGIN][${pluginID}] ${pluginErrors.length} error(s) found in the plugin ${pluginID}, please fix it:\n- ${ pluginErrors.join('\n- ') }`);
          // go to the next plugin
          return;
        }

        let pluginConfig = that.rustCommander.config.pluginConfigs[pluginID];

        let {configErrors, checkedPluginConfig} = that.validatePluginConfig(plugin, pluginConfig);

        if (configErrors.length > 0) {
          Logger.error(`[PLUGIN][${pluginID}] ${configErrors.length} error(s) found in the configuration file for the plugin ${pluginID}, please fix it:\n- ${ configErrors.join('\n- ') }`);
          // go to the next plugin
          return;
        }

        plugin.run(this.rustCommander, checkedPluginConfig)
        Logger.success(`[PLUGIN][${plugin.title}][version ${plugin.version}] ${plugin.description}`);
      });
    }

    return Promise.all(loadPromises);

  }

  validatePluginConfig(plugin, pluginConfig) {

      let schema = Joi.object().options({ abortEarly: false }).keys(plugin.checkConfig(Joi));

      let configErrors = [];
      let result = [];
      let checkedPluginConfig = null;

      Joi.validate(pluginConfig, schema, (err, value) => {
        if(err) {
          result = err.details;
        }
        checkedPluginConfig = value;

      })

      result.forEach((error) => {
        configErrors.push(`[${error.path}] ${error.message}`);
      })

      return {configErrors, checkedPluginConfig};

  }


  validatePluginSchema(plugin) {
    let pluginErrors = [];
    let result = [];
    let checkedPlugin = null;

    const schema = Joi.object().options({ abortEarly: false }).keys({
      id: Joi.string().required(),
      title: Joi.string().required(),
      description: Joi.string().required(),
      version: Joi.string().required(),
      run: Joi.required(),
      checkConfig: Joi.required()
    });

    Joi.validate(plugin, schema, (err, value) => {

      if(err) {
        result = err.details;
      }
      checkedPlugin = value;
    })

    result.forEach((error) => {
      pluginErrors.push(`[${error.path}] ${error.message}`);
    })

    return {pluginErrors, checkedPlugin};
  }

}

module.exports = PluginLoader;
