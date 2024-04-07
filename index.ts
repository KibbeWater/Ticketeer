import { Client } from 'discord.js';
import { _envCheck, env } from './src/api/env';
import { RegisterCommands } from './src/commandManager';

_envCheck();

const commandManager = require('./private/commandManager');

const bot = new Client({
	intents: ['Guilds', 'GuildMembers', 'GuildMessages'],
});

if (!env.DISCORD_TOKEN) {
	console.error('There is no token defined');
	process.exit(1);
}

bot.on('ready', () => {
	RegisterCommands();
	commandManager.RegisterSlashCommands(bot);
});

bot.on('messageCreate', (msg) => {
	if (!msg.content.startsWith(env.PREFIX)) return;

	const commandName = msg.content.split(' ')[0].slice(1);

	try {
		commandManager.ExecuteCommand(commandName, msg);
	} catch (err) {
		console.error(`Error occured attempting to run command '${commandName}': ${err}`);
	}
});

bot.login(process.env.DISCORD_TOKEN);
