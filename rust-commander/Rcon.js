const WebSocket = require('ws');
const EventEmitter = require('events').EventEmitter;
const Logger = require('./logger');

const RCON_IDENTIFIER_CONSOLE_RANGE_MIN = 1337000000;
const RCON_IDENTIFIER_CONSOLE_RANGE_MAX = 1337999999;

class Rcon extends EventEmitter {
  constructor(config) {
    super();
    this.config = config;
    this.socket = null;
  }

  init() {
    const that = this;
    Logger.title('RCON');
    that.connect();
  }

  connect() {
    const that = this;

    Logger.log(`RCON: Connecting to the RCON service of ${that.config.host} on port ${that.config.webrcon_port}`);

    // Instanciate the socket

    that.socket = new WebSocket(`ws://${that.config.host}:${that.config.webrcon_port}/${that.config.webrcon_password}`);

    // Events binding

    that.socket.on('error', (error) => {
      Logger.error(`RCON: Error: ${error}`);
    });

    that.socket.on('close', (e) => {
      Logger.error('RCON: Disconnected');
      that.reconnect();
    });

    that.socket.on('open', (e) => {
      Logger.success('RCON: Connected');
    });

    that.socket.on('message', (serializedData) => {
      const data = JSON.parse(serializedData);

      if (data.Type === 'Chat') {

        const message = JSON.parse(data.Message);
        that.emit('chat-message', message);

      } else if (data.Type === 'Generic'
        && data.Message
        && data.Identifier < RCON_IDENTIFIER_CONSOLE_RANGE_MIN
        && data.Identifier > RCON_IDENTIFIER_CONSOLE_RANGE_MAX) {
        that.emit('log-message', data.Message);
      }
    });

  }

  reconnect() {
    const that = this;
    Logger.log(`RCON: Trying to reconnect in ${that.config.reconnect_interval} seconds`);
    setTimeout(() => {

      that.connect();

    }, that.config.reconnect_interval * 1000);
  }

  sendMessage(message) {
    const that = this;
    const packet = JSON.stringify({
      Identifier: -1,
      Message: `say ${message}`,
      Name: 'WebRcon',
    });

    that.socket.send(packet);
  }

  sendCommand(command) {
    const that = this;

    // Generate a random Identifier, it allows to catch the good response in the promise.

    const commandIdentifier = that.generateRandomCommandIdentifier();

    const packet = JSON.stringify({
      Identifier: commandIdentifier,
      Message: command,
      Name: 'WebRcon',
    });

    // Send the command

    this.socket.send(packet);

    // Return the promise

    return new Promise((resolve, reject) => {

      const commandResponseCallback = (serializedData) => {
        const data = JSON.parse(serializedData);

        if (data.Type === "Generic" && data.Identifier === commandIdentifier) {
          that.socket.removeEventListener('message', commandResponseCallback);
          return resolve(data.Message);
        }
      };

      setTimeout(() => {
        that.socket.removeEventListener('message', commandResponseCallback);
        return resolve(`Sorry, the command "${command}" didn't return any response`);
      }, 5 * 1000);

      that.socket.on('message', commandResponseCallback);

    });
  }

  generateRandomCommandIdentifier() {
    const that = this;
    const min = RCON_IDENTIFIER_CONSOLE_RANGE_MIN;
    const max = RCON_IDENTIFIER_CONSOLE_RANGE_MAX;
    return Math.floor(Math.random() * (max - min)) + min;
  }
}

module.exports = Rcon;
