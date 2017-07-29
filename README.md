
# RUST COMMANDER

RustCommander is an admin tool allowing to control and monitor your Rust server from Slack/Discord.

## Features

- Watch your Rust server chat and talk with your players from Slack/Discord.
- Receive notifications on chat message matching with a custom list of word (example "admin" or "cheater" or bad words)
- Watch your Rust server logs from Slack/Discord (very verbose).
- Interact with your Rust server console from Slack/Discord.
- Simple configuration from a JSON file (can create one conf file per Rust server).
- Auto-reconnect when the RCON/Slack/Discord connection is lost.
- Plugin system offering a developer API to add more features (on progress)

## Prerequistes

- Nodejs (v7.3.0 or higher) and NPM must be installed on the host machine.
- WebRCON must be enabled on your Rust server.

## Installation

Clone the repository

`git clone git@github.com:MarlBurroW/rust-commander.git && cd rust-commander`

Install node modules

`npm install`

Run RustCommander

`node RC.js <confname>`

\<confname\> is the name of a configuration file in the `config/` folder without ".json"

## Configuration

