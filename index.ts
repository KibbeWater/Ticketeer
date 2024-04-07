import { Client, GatewayIntentBits, Partials } from 'discord.js';
import { _envCheck, env } from './src/api/env';
import { ExecuteCommand, RegisterCommands, RegisterSlashCommands } from './src/commandManager';

_envCheck();

const bot = new Client({
	intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
	partials: [Partials.Channel],
});

if (!env.DISCORD_TOKEN) {
	console.error('There is no token defined');
	process.exit(1);
}

bot.on('ready', async () => {
	await RegisterCommands();
	await RegisterSlashCommands(bot);
});

bot.on('messageCreate', (msg) => {
	if (!msg.content.startsWith(env.PREFIX)) return;

	const commandName = msg.content.split(' ')[0].slice(1);

	try {
		ExecuteCommand(commandName, msg);
	} catch (err) {
		console.error(`Error occured attempting to run command '${commandName}': ${err}`);
	}
});

bot.login(process.env.DISCORD_TOKEN);
