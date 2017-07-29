// Internal Modules
const Logger = require('./rust-commander/logger');
const path = require('path');
const RustCommander = require('./rust-commander/RustCommander');


if (!process.argv[2]) {
  Logger.error('You must provide a config name');
  process.exit(1);
}

// Global scope consts/vars

const configName = process.argv[2];
const configDir = path.join(__dirname, '/config/');
const configFilePath = path.join(configDir, `${configName}.json`);
const pluginDirPath = path.join(__dirname, '/plugins');

global.root_path = __dirname;

const rustCommander = new RustCommander(configFilePath, pluginDirPath);
rustCommander.run();

