const SlackBot = require('slackbots');
const EventEmitter = require('events').EventEmitter;
const Logger = require('../logger');

class SlackConnector extends EventEmitter {
  constructor(config, rcon, commandManager) {
    super();
    this.config = config;
    this.rcon = rcon;
    this.bot = null;
    this.slackChannels = {};
    this.slackUsers = {};
    this.firstConnect = true;
    this.commandManager = commandManager;
  }

  init() {
    const that = this;

    Logger.title('SLACK CONNECTOR');

    Logger.log('SLACK: Connecting to Slack API');

    // Create object will contains all channels names indexed by ID
    that.slackChannels = null;

    // Create the slackBot

    if (that.bot === null) {
      that.bot = new SlackBot({
        token: that.config.bot.api_token,
        name: that.config.bot.name,
      });

      that.bot.on('error', (error) => {
        that.emit('error', error);
        Logger.error(`SLACK: Error: ${error}`);
        that.reconnect();
      });

      that.bot.on('close', (error) => {
        that.emit('disconnect', error);
        Logger.error('SLACK: disconnected');
        that.reconnect();
      });

      // Get all channels informations to fill the slackChannels object
      that.bot.getChannels().then((data) => {
        that.slackChannels = {};
        const channels = data.channels;
        channels.forEach((channel) => {
          that.slackChannels[channel.id] = channel.name;
        })
      });

       // Get all users informations to fill the slackUsers object
      that.bot.getUsers().then((data) => {
        that.slackUsers = {};
        const users = data.members;
        users.forEach((user) => {
          that.slackUsers[user.id] = user.name;
        });
      });

      // Emit a custom event containing the channel name when a slack message is sent
      that.bot.on('message', (data) => {
        if (
          data.type === 'message' &&
          data.subtype === undefined &&
          that.slackChannels
        ) {
          that.emit(`chat-message#${that.slackChannels[data.channel]}`, data);
        }
      });

      // Create all chhanel interactions defined in the config file
      that.config.interactions.forEach((interactionConfig) => {
        that.createChannelInteraction(interactionConfig);
      });

      that.bot.on('open', () => {
        that.emit('connect');
        if(!that.firstConnect) {
          that.emit('reconnect');
        }
        that.firstConnect = false;
        Logger.success('SLACK: Connected');
      });
    }
  }

  getBotInstance() {
    const that = this;
    return that.bot;
  }

  reconnect() {
    const that = this;
    Logger.log(`SLACK: Trying to reconnect in ${that.config.reconnect_interval} seconds`);
    setTimeout(() => {
      that.emit('reconnecting');
      Logger.log('SLACK: Reconnecting...');
      that.bot.login();
    }, that.config.reconnect_interval * 1000);
  }


  postMessageToChannel(channel, message) {
    const that = this;
    that.bot.postMessageToChannel(channel, message);
  }

  formatMessage(message) {
    const that = this;
    let outputMessage = '';

    if(that.config.display_nickname && that.config.display_source) {
      outputMessage = `(${that.slackUsers[message.user]} from Slack) ${message.text}`;
    }else if(that.config.display_nickname) {
      outputMessage = `(${that.slackUsers[message.user]}) ${message.text}`;
    } else if(that.config.display_source) {
      outputMessage = `(From Slack) ${message.text}`;
    } else {
      outputMessage = `${message.text}`;
    }

    return outputMessage;
  }

  getInteractions() {
    const that = this;
    return that.config.interactions;
  }

  getChannels() {
    const that = this;
    return that.getInteractions().map((interaction) => interaction.channel);
  }

  postMessageToAllChannels(message) {
    const that = this;
    that.getChannels().forEach((channel) => {
      that.postMessageToChannel(channel, message);
    })
  }

  parseCommand(message) {

    let commandData = false;

    let commandRegex = /^!([a-z0-9\-]+)(?:\s+)([a-z0-9\-]+)(?:(?:\s+)(.+)?)?/;

    if (commandRegex.test(message.text)) {
      let parts = message.text.match(commandRegex);
      let namespace = parts[1];
      let command = parts[2];
      let params = parts[3];

      if(params) {
        let paramsRegex = /(?:"(?:[^"\\]+|\\(?:\\\\)*.)*"|'(?:[^'\\]+|\\(?:\\\\)*.)*')|([0-9a-zA-Z-]+)/g;
        params = params.match(paramsRegex);
      } else {
        params = [];
      }

      let finalParams = [];

      params.forEach((param) => {
        param = param.replace(/^\"|\"$/g, '');

        if(parseInt(param)) {
          param = parseInt(param);
        }

        finalParams.push(param);
      });

      commandData = {
        namespace: namespace,
        command: command,
        args: finalParams,
      }

    }

    return commandData;
  }

  createChannelInteraction(interactionConfig) {
    const that = this;

    switch (interactionConfig.type) {
      case 'chat-notification':
        that.rcon.on('chat-message', (message) => {
          if (interactionConfig.filters) {
            let filteredMessage = message.Message;
            const regex = RegExp(interactionConfig.filters.join('|'), 'gi');

            if (regex.test(message.Message)) {
              filteredMessage = filteredMessage.replace(regex,'*$&*');
              that.postMessageToChannel(interactionConfig.channel, `${message.Username}: ${filteredMessage}`);
            }
          } else {
            that.postMessageToChannel(interactionConfig.channel, `${message.Username}: ${message.Message}`);
          }
        });
        break;
      case 'chat':
        // When a rust chat message is sent, post it on the slack channel
        that.rcon.on('chat-message', (message) => {
          that.postMessageToChannel(interactionConfig.channel, `${message.Username}: ${message.Message}`);
        });

        // When a slack message is sent, foward it to the rust server
        that.on(`chat-message#${interactionConfig.channel}`, (message) => {
          that.rcon.sendMessage(that.formatMessage(message));
        });

        break;

      case 'log':
        // Post all log message on the slack channel
        that.rcon.on('log-message', (logMessage) => {
          that.postMessageToChannel(interactionConfig.channel, logMessage);
        });

        break;

      case 'console':
        // On response from the rust server the result is displayed in the channel

        that.on(`chat-message#${interactionConfig.channel}`, (data) => {
          that.rcon.sendCommand(data.text).then((commandResponse) => {
            that.postMessageToChannel(interactionConfig.channel, commandResponse);
          });
        });
        break;
      case 'rust-commander':
        that.on(`chat-message#${interactionConfig.channel}`, (message) => {
          let commandData = that.parseCommand(message);
          if(commandData === false) {
             that.postMessageToChannel(interactionConfig.channel, 'wrong command syntax');
             return;
          }
          that.commandManager.dispatchCommand(commandData).then((response) => {
            that.postMessageToChannel(interactionConfig.channel, response);
          }).catch((error) => {
            that.postMessageToChannel(interactionConfig.channel, error);
          });

        });
        break;
      default:
        break;
    }
  }
}

module.exports = SlackConnector;
