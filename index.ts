import { ChannelType, Client, GatewayIntentBits, Partials } from 'discord.js';
import { _envCheck, env } from './src/api/env';
import { ExecuteCommand, RegisterCommands, RegisterSlashCommands } from './src/commandManager';
import { logMessage, pushLogs } from './src/api/messages';
import { prisma } from './src/db';

_envCheck();

const bot = new Client({
	intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
	partials: [Partials.Channel],
});

if (!env.DISCORD_TOKEN) {
	console.error('There is no token defined');
	process.exit(1);
}

let interval: NodeJS.Timeout | undefined = undefined;
bot.on('ready', async () => {
	await RegisterCommands();
	await RegisterSlashCommands(bot);

	if (interval) clearInterval(interval);
	interval = setInterval(pushLogs, 1000 * 30);
});

bot.on('messageCreate', (msg) => {
	logMessage(msg);
	if (!msg.content.startsWith(env.PREFIX)) return;

	const commandName = msg.content.split(' ')[0].slice(1);

	try {
		ExecuteCommand(commandName, msg);
	} catch (err) {
		console.error(`Error occured attempting to run command '${commandName}': ${err}`);
	}
});

bot.on('channelDelete', async (channel) => {
	if (channel.type === ChannelType.GuildText) {
		const ticket = await prisma.ticket.findFirst({
			where: {
				channelId: channel.id,
			},
		});

		if (!ticket || ticket.closed) return;

		// Manual deletion, mark the ticket as deleted (not closed)
		await prisma.ticket.update({
			where: {
				id: ticket.id,
			},
			data: {
				deleted: true,
			},
		});
	}
});

bot.login(process.env.DISCORD_TOKEN);
