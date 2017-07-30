const SlackBot = require('slackbots');
const EventEmitter = require('events').EventEmitter;
const Logger = require('../logger');

class SlackConnector extends EventEmitter {
  constructor(config, rcon) {
    super();
    this.config = config;
    this.rcon = rcon;
    this.bot = null;
    this.slackChannels = {};
    this.slackUsers = {};

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
        Logger.error(`SLACK: Error: ${error}`);
        that.reconnect();
      });

      that.bot.on('close', (error) => {
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
      default:
        break;
    }
  }
}

module.exports = SlackConnector;
