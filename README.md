
# RUST COMMANDER

RustCommander is an admin tool allowing to control and monitor your Rust server from Slack/Discord.

## Features

- Watch your Rust server chat and talk with your players from Slack/Discord.
- Receive notifications on chat message matching with a custom list of word (example "admin" or "cheater" or bad words)
- Watch your Rust server logs from Slack/Discord (very verbose).
- Interact with your Rust server console from Slack/Discord.
- Simple configuration from a JSON file (can create one conf file per Rust server).
- Auto-reconnect when the RCON/Slack/Discord connection is lost.
- Plugin system offering a developer API to add more features (in progress).

## Prerequistes

- Nodejs (v7.3.0 or higher) and NPM must be installed on the host machine.
- WebRCON must be enabled on your Rust server, you can enable it by adding `+web.rcon true`, you can also specify the rcon port like this  `+rcon.port <port>`.

## Installation

Clone the repository

`$ git clone git@github.com:MarlBurroW/rust-commander.git && cd rust-commander`

Install node modules

`$ npm install`

Run RustCommander

`$ node RC.js <confname>`

\<confname\> is the name of a configuration file in the `config/` folder without ".json"

Of course this last command will not works out of the box, you need to configure some little things before, see the next section.

## Configuration

### Default configuration
Below the default configuration of RustCommander, don't be afraid, it's much simpler than it looks.

```json
{
	"rust_server": {
		"host": "rust-server-ip-or-hostname",
		"webrcon_port": 5678,
		"webrcon_password": "your-rcon-password",
		"reconnect_interval": 5
	},
	"slack": {
		"reconnect_interval": 5,
		"bot": {
			"api_token": "slack-bot-api-token",
			"name": "RustCommander"
		},
		"interactions": [
			{
				"channel": "#rustserver_swearing",
				"type": "chat-notification",
				"filters": ["noob", "damn it", "god damn", "ass"]
			},
			{
				"channel": "#rustserver_admin",
				"type": "chat-notification",
				"filters": ["admin", "cheater"]
			},
			{
				"channel": "#rustserver_chat",
				"type": "chat"
			},
			{
				"channel": "#rustserver_console",
				"type": "console"
		  }
		]
	},
	"discord": {
		"bot": {
			"api_token": "discord-bot-api-token"
		},
		"interactions": [
			{
				"channel": "#rustserver_swearing",
				"type": "chat-notification",
				"filters": ["noob", "damn it", "god damn", "ass"]
			},
			{
				"channel": "#rustserver_admin",
				"type": "chat-notification",
				"filters": ["admin", "cheater"]
			},
			{
				"channel": "#rustserver_chat",
				"type": "chat"
			},
			{
				"channel": "#rustserver_console",
				"type": "console"
		  }
		]
	}
}

```

The default confugration file is located here: `config/server.json`. You can create files like this as many as you have rust servers.



### Configuration details

#### RCON

- `host`: The IP Address or the hostname of your Rust Server.
- `webrcon_port`: The WebRCON port of your Rust server (defined with the **+rcon_port**).
- `webrcon_password`: The WebRCON password of your Rust server (defined with the **+rcon_password**)
- `reconnect_interval`: Sometime the RCON connection may be lost (when a server-side update occurs for example). This property define the time interval (in seconds) between each reconnection tries. 

#### SLACK

- `reconnect_interval`: Exactly the same as RCON but for the Slack connection.
- `bot.api_token`: The API token of your SlackBot (you need to add a **Bots** integration in your app directory)
- `bot.name`: The display name of the bot (This overrides the name defined from slack)
- `interactions`: Interactions are how RustCommander interact with your slack/discord channels and your Rust server. You can create interactions as many as you need. There are some default interactions defined in the default configuration files, but be free to remove it.
 - type: The type of the interaction
 - channel: The targeted channel.

There are currently 4 types of interactions:

- *chat* : You see the general chat in the targeted channel
 
### Run a RustCommander process
You can run a RustCommander process with this command:

`$ node RC.js <confname>`

Note: \<confname\> is a name of a configuration file located in the `config/` directory without `.json`

The above command is good for create your configuration and test/debug it, but later you'll probably want to launch RustCommander as a daemon process. In this case you can use [Forever](https://github.com/foreverjs/forever) to run the process as daemon:

`$ npm install -g forever`
`$ forever start RC.js <confname>`


