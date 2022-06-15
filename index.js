const fs = require('fs');
const { Client, Intents } = require('discord.js');

const Bot = new Client({
	intents: [Intents.FLAGS.GUILD_MEMBERS, Intents.FLAGS.GUILD_MESSAGES],
});

if (!fs.existsSync('./config.json')) {
	fs.copyFileSync('./config.default.json', './config.json');
	console.error('Please configure the bot, created new config.json');
	process.exit(1);
}
