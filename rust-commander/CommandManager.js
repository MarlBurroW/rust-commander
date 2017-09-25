const Logger = require('./logger');
const Joi = require('joi');

class CommandManager {

  constructor(mander) {
    this.mander = mander;
    this.commands = {};
    this.playerCommands = {};
  }

  dispatchCommand(commandData) {
    const that = this;
    return new Promise((resolve, reject) => {
      let command = {};
      try {
        command = that.commands[commandData.namespace][commandData.command];
      } catch(e) {
        return reject('Command not found');
      }

      command.callback(commandData.args, resolve);

    });

  }


  registerPlayerCommand(pluginName, command, description, callback) {
    const that = this;


  }

  registerControlCommand(namespace, command, description, callback) {
    const that = this;

    const commandData = {
      namespace,
      command,
      description,
      callback
    }


    let result = [];
    Joi.validate(commandData, Joi.object().required().keys({
      namespace: Joi.string().required(),
      command: Joi.string().required(),
      description: Joi.string().required(),
      callback: Joi.required().required(),
    }), (err, value) => {
      if (err) {
        result = err.details;
      }
    });

    let errors = [];
    result.forEach((error) => {
      errors.push(`[${error.path}] ${error.message}`);
    })

    if (errors.length > 0) {
      Logger.error(`[COMMAND][${that.namespace}] ${errors.length} error(s) found in the command registration:\n- ${ errors.join('\n- ') }`);
    } else {
      if (!that.commands[commandData.namespace]) {
        that.commands[commandData.namespace] = {};
      }
      that.commands[commandData.namespace][commandData.command] = commandData;
    }
  }
}

module.exports = CommandManager;