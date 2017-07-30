
![img](http://i.imgur.com/jrV4gPp.jpg)
RustCommander is an admin tool allowing to control and monitor your Rust Vanilla server from Slack/Discord.

Note: You don't need Oxide installed on your server to make RustCommander works.

## Features

- Watch your Rust server chat and talk with your players from Slack/Discord.
- Receive notifications on chat message matching with a custom list of word (example "admin" or "cheater" or bad words)
- Watch your Rust server logs from Slack/Discord (very verbose).
- Interact with your Rust server console from Slack/Discord.
- Simple configuration from a JSON file (can create one conf file per Rust server).
- Auto-reconnect when the RCON/Slack/Discord connection is lost.
- Plugin system offering a developer API to add more features (like commands for your players ex: !players or !wipe).

## Prerequistes

- Nodejs (v7.3.0 or higher) and NPM must be installed on the host machine.
- WebRCON must be enabled on your Rust server, you can enable it by adding **`+web.rcon true`**, you can also specify the rcon port and password like this  **`+rcon.port <port>`**  **`+rcon.password <password>`**.
- Of course you need to register a bot on Slack and/or Discord.

## Installation

Clone the repository

`$ git clone git@github.com:MarlBurroW/rust-commander.git && cd rust-commander`

Install node modules

`$ npm install`

Run RustCommander

`$ node RC.js confname`

`confname` is the name of a configuration file in the `config/` folder without ".json"

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
The RCON configuration is the minimal configuration requirement to run RustCommander. You can remove the Slack or the Discord configuration if you don't want to use one of them.
#### RCON


- `host`: The IP Address or the hostname of your Rust Server.
- `webrcon_port`: The WebRCON port of your Rust server (defined with the **+rcon_port**).
- `webrcon_password`: The WebRCON password of your Rust server (defined with the **+rcon_password**)
- `reconnect_interval`: Sometime the RCON connection may be lost (when a server-side update occurs for example). This property define the time interval (in seconds) between each reconnection tries. 

#### SLACK

* `reconnect_interval`: Exactly the same as RCON but for the Slack connection.
* `bot`
  * `api_token`: The API token of your SlackBot (you need to add a **Bots** integration in your app directory)
  * `name`: The display name of the bot (This overrides the name defined from slack)
* `interactions`: Interactions are how RustCommander interact with your slack/discord channels and your Rust server. You can create as many interactions as you need. There are some default interactions defined in the default configuration files, but be free to remove it and replace with your owns. All interactions types are described later.
  * `type`: The type of the interaction
  * `channel`: The targeted Slack channel.

**IMPORTANT: You need to manualy add your Slack bot in all targeted channels**
#### DISCORD
The Discord configuration is quiet the same as the Slack Configuration.

* `bot`
  * `api_token`: The API token of your Discord bot. Visit [this link](https://discordapp.com/developers) to create your bot.
* `interactions`: Interactions works exactly the same as for SLack interactions.

**IMPORTANT**: You need to manualy add your Discord bot in all targeted channels**
### Interactions
Interactions are how RustCommander interact with your slack/discord channels and your Rust server
* `"chat"` : You see the general chat of your rust server in the targeted channel and you can send message as "SERVER".
* `"console"` : You can send rust command directly from the targeted Slack channel and see the response.
* `"log"` : You see ALL the rust server console output in the targeted Slack channel, it's VERY verbose. There is no "log" interaction defined in the default configuration because most of users will not want to use it.
* `"chat-notification"` : You see only chat messages matching words defined in the `"filters"` property. This is a simple array of string. Unlike the `"chat"` type, you can't send message from the targeted channel. This type of interaction is useful if you want to be notified when a player says bad words or some requiring your intervention.


### Run a RustCommander process
You can run a RustCommander process with this command:

`$ node RC.js confname`

Note: `confname` is a name of a configuration file located in the `config/` directory without the `".json"`
The above command is good for create your configuration and test/debug it, but later you'll probably want to launch RustCommander as a daemon process. In this case you can use [Forever](https://github.com/foreverjs/forever) to run the process as daemon:

`$ npm install -g forever`

`$ forever start RC.js confname`

## Plugins
This feature is in progress.
I'm working on a powerful and simple plugin system to allow you to create awesome plugins. I'm sure there are a lot of cool things to do with RCON.


By MarlburroW

Contributors: Marzu
