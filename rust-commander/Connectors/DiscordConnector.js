const EventEmitter = require('events').EventEmitter;
const Logger = require('../logger');
const Discord = require('discord.js');

class DiscordConnector extends EventEmitter {
  constructor(config, rcon) {
    super();
    this.config = config;
    this.rcon = rcon;
    this.bot = null;
    this.discordChannels = {};
  }

  init() {
    const that = this;

    Logger.title('DISCORD CONNECTOR');

    that.bot = new Discord.Client();

    Logger.log('DISCORD: Connecting to Discord API');

    that.bot.login(that.config.bot.api_token)

    that.bot.on('disconnect', (error) => {
      Logger.error(`DISCORD: ${error.reason}`);
    });

    that.bot.on('error', (error) => {
      Logger.error(`DISCORD: ${error}`);
    });

    that.bot.on('ready', (e) => {
      Logger.success('DISCORD: Connected');

      that.bot.channels.array().forEach((channel) => {
        that.discordChannels[channel.name] = channel;
      });
    });

    that.bot.on('resume', () => {
      Logger.success('DISCORD: Connected');
    });

    that.bot.on('reconnecting', () => {
      Logger.log(`DISCORD: Reconnecting...`);
    });

    that.config.interactions.forEach((interaction) => {
      that.createChannelInteraction(interaction);
    });

    that.bot.on('message', (message) => {
      if (!message.author.bot) {
        that.emit(`chat-message#${message.channel.name}`, message);
      }
    })
  }

  getBotInstance() {
    const that = this;
    return that.bot;
  }

  postMessageToChannel(channelName, message) {
    const that = this;
    const discordChannel = that.discordChannels[channelName];
    if (discordChannel) {
      discordChannel.send(message);
    }
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
        that.rcon.on('chat-message', (message) => {
          that.postMessageToChannel(interactionConfig.channel, `${message.Username}: ${message.Message}`);
        });

        that.on(`chat-message#${interactionConfig.channel}`, (message) => {
          that.rcon.sendMessage(message.content);
        });

        break;
      case 'log':
        that.rcon.on('log-message', (logMessage) => {
          that.postMessageToChannel(interactionConfig.channel, logMessage);
        });
        break;
      case 'console':
        that.on(`chat-message#${interactionConfig.channel.replace('#', '')}`, (message) => {
          that.rcon.sendCommand(message.content).then((commandResponse) => {
             that.postMessageToChannel(interactionConfig.channel, commandResponse);
          });
        });

        break;
      default:
        break;
    }
  }
}

module.exports = DiscordConnector;
