const EventEmitter = require('events').EventEmitter;
const SystemJS = require('systemjs');
const Logger = require('./logger');
const path = require('path');
const Joi = require('joi');

const PluginDataManager = require('./PluginDataManager');
const PluginHelper = require('./PluginHelper');
const PluginCommandManager = require('./PluginCommandManager');

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
        let pluginPath = path.join(that.pluginDirPath, `${pluginID}.js`)
        let plugin = null;


        try {
          plugin = require(pluginPath);
        } catch (err) {
          Logger.error(`[PLUGIN][${pluginID}] Can't load the plugin ${pluginPath}: ${err}`)
          return;
        }

        let {pluginErrors} = that.validatePluginSchema(plugin);

        if (that.rustCommander.plugins[plugin.id]) {
          Logger.error(`[PLUGIN][${pluginID}] This plugin is already registered`);
          return;
        }

        if (pluginErrors.length > 0) {
          Logger.error(`[PLUGIN][${pluginID}] ${pluginErrors.length} error(s) found in the plugin ${pluginID}, please fix it:\n- ${ pluginErrors.join('\n- ') }`);
          // go to the next plugin
          return;
        }

        let pluginConfig = that.rustCommander.config.pluginConfigs[pluginID];

        // important
        if(!pluginConfig) pluginConfig = {};

        let {configErrors, checkedPluginConfig} = that.validatePluginConfig(plugin, pluginConfig);

        if (configErrors.length > 0) {
          Logger.error(`[PLUGIN][${pluginID}] ${configErrors.length} error(s) found in the configuration file for the plugin ${pluginID}, please fix it:\n- ${ configErrors.join('\n- ') }`);
          // go to the next plugin
          return;
        }

        that.rustCommander.plugins[plugin.id] = plugin;
        that.rustCommander.pluginConfigs[plugin.id] = checkedPluginConfig;
        Logger.success(`[PLUGIN][${plugin.title}][version ${plugin.version}] ${plugin.description}`);
      });

      let runablePlugins = [];
      for (let [pluginID, plugin] of Object.entries(that.rustCommander.plugins)) {


        let data = plugin.data || {};
        let dataManager = new PluginDataManager(data);
        plugin.dataManager = dataManager;

        let commandManager = new PluginCommandManager(that.rustCommander.getCommandManager(), plugin.id);

        let dependencies = {};
        let canRun = true;
        if (plugin.requiredPlugins) {

          for (let index in plugin.requiredPlugins) {
            let pluginDep = plugin.requiredPlugins[index];
            if(!that.rustCommander.plugins[pluginDep]) {
              Logger.error(`[PLUGIN][${plugin.id}] This plugin need the ${pluginDep} to be launched`);
              canRun = false;
            }
          }
        }

        if(canRun) {
          runablePlugins.push(plugin);

          let helper = new PluginHelper(that.rustCommander, that.rustCommander.pluginConfigs[plugin.id], dataManager, commandManager);
          plugin.helper = helper;
        }
      }

      Logger.log(`Run loaded plugins`);

      for(let pluginID in runablePlugins) {
        let plugin = runablePlugins[pluginID];
        plugin.run(plugin.helper);
        Logger.success(`[PLUGIN][${plugin.title}][version ${plugin.version}] Plugin launched`);
      }


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
      requiredPlugins: Joi.array().optional().items(Joi.string()),
      data: Joi.optional(),
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
