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

bot.on('ready', () => {
	commandManager.RegisterCommands();
	commandManager.RegisterSlashCommands(bot);
});

bot.login(process.env.DISCORD_TOKEN);
