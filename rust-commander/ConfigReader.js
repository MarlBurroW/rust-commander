const EventEmitter = require('events').EventEmitter;
const Logger = require('./logger');
const fs = require('fs');
const Joi = require('joi');

class ConfigReader {
  constructor() {
    this.configFilePath = null;
    this.config = null;
  }

  read(configFilePath) {

    const that = this;
    that.configFilePath = configFilePath;

    // Start reading configuraiton

    Logger.title('CONFIGURATION');

    Logger.log(`CONFIG: Trying to load config file ${that.configFilePath}`);

    return new Promise((resolve, reject) => {

      fs.readFile(that.configFilePath, (error, data) => {

        if (error) {
          reject(`CONFIG: Problem while reading the configuration file ${that.configFilePath}: ${error}`);
          return;
        }

        try {
          that.config = JSON.parse(data);
        } catch (e) {
          reject(`CONFIG: Configuration file parsing error, please check the JSON syntax of the configuraiton file: ${e}`);
          return;
        }

        Logger.success(`CONFIG: Config ${that.configFilePath} loaded`);

        Logger.log('CONFIG: Checking config...');

        const configCheckResult = that.check();




        if (configCheckResult.length > 0) {
          const errors = [];
          configCheckResult.forEach((error) => {
            errors.push(`[${error.path}] ${error.message}`);
          })

          reject(`CONFIG: ${configCheckResult.length} or(s) in the configuration file, please fix it:\n- ${ errors.join('\n- ') }`);

        } else {
          that.removeChannelsDash();
          Logger.success('CONFIG: Config check OK');
          resolve(that.config)
        }
      });

    });
  }

  check() {
    const that = this;
    const config = that.config;
    let errors = [];

    const schema = Joi.object().options({ abortEarly: false }).keys({
      rust_server: Joi.object().required().keys({
        host: Joi.string().required(),
        webrcon_port: Joi.number().min(0).max(65535),
        webrcon_password: Joi.string().required(),
        reconnect_interval: Joi.number().required()
      }),
      slack: Joi.object().optional().keys({
        reconnect_interval: Joi.number().required(),
        display_nickname: Joi.bool().optional(),
        display_source: Joi.bool().optional(),
        bot: Joi.object().required().keys({
          api_token: Joi.string().required(),
          name: Joi.string().required()
        }),
        interactions: Joi.array().optional().items({
          channel: Joi.string().required(),
          type: Joi.string().required().valid('chat-notification', 'chat', 'log', 'console'),
          filters: Joi.when('type', {is: 'chat-notification', then: Joi.array().required().items(Joi.string()) })
        })
      }),
      discord: Joi.object().optional().keys({
        display_nickname: Joi.bool().optional(),
        display_source: Joi.bool().optional(),
        bot: Joi.object().required().keys({
          api_token: Joi.string().required()
        }),
        interactions: Joi.array().optional().items({
          channel: Joi.string().required(),
          type: Joi.string().required().valid('chat-notification', 'chat', 'log', 'console'),
          filters: Joi.when('type', {is: 'chat-notification', then: Joi.array().required().items(Joi.string()) })
        })
      }),
    });

    Joi.validate(config, schema, (err, value) => {
      if(err === null) return errors;
      errors = err.details;
    })

    return errors;

  }


  removeChannelsDash() {
    const that = this;
    if(that.config.slack) {
      that.config.slack.interactions.forEach((interaction, index) => {
        that.config.slack.interactions[index].channel = interaction.channel.replace('#', '');
      })
    }
    if(that.config.discord) {
      that.config.discord.interactions.forEach((interaction, index) => {
        that.config.discord.interactions[index].channel = interaction.channel.replace('#', '');
      })
    }
  }

}

module.exports = ConfigReader