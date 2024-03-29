const fs = require('fs');
const { Client, Intents } = require('discord.js');

const commandManager = require('./private/commandManager');

const bot = new Client({
	intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MEMBERS, Intents.FLAGS.GUILD_MESSAGES],
});

if (!process.env.DISCORD_TOKEN) {
	console.error('There is no token defined');
	process.exit(1);
}

if (!fs.existsSync('./config.json')) {
	fs.copyFileSync('./config.default.json', './config.json');
	console.error('Please configure the bot, created new config.json');
	process.exit(1);
}

const config = require('./config.json');

bot.on('ready', () => {
	commandManager.RegisterCommands();
	commandManager.RegisterSlashCommands(bot);
});

bot.on('messageCreate', (msg) => {
	if (!msg.content.startsWith(config.prefix)) return;

	const commandName = msg.content.split(' ')[0].slice(1);

	try {
		commandManager.ExecuteCommand(commandName, msg);
	} catch (err) {
		console.error(`Error occured attempting to run command '${commandName}': ${err}`);
	}
});

bot.login(process.env.DISCORD_TOKEN);
