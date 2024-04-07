import { Client, GatewayIntentBits, Partials } from 'discord.js';
import { env } from './api/env';

const bot = new Client({
	intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
	partials: [Partials.Channel],
});

bot.on('ready', () => {
	bot.application?.commands
		.fetch()
		.then((commands) => {
			commands.forEach((v, k) => {
				bot.application!.commands.delete(k)
					.then(() => console.log('[*] Deleted command: ' + v.name))
					.catch(() => console.log('[*] Unable to deleted command: ' + v.name));
			});
		})
		.catch(() => console.log('Unable to fetch commands'));
});

bot.login(env.DISCORD_TOKEN);
