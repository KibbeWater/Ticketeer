const { Client, Intents } = require('discord.js');

const bot = new Client({
	intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MEMBERS, Intents.FLAGS.GUILD_MESSAGES],
});

if (!process.env.DISCORD_TOKEN) {
	console.error('There is no token defined');
	process.exit(1);
}

bot.on('ready', () => {
	bot.application.commands
		.fetch()
		.then((commands) => {
			commands.forEach((v, k) => {
				bot.application.commands
					.delete(k)
					.then(() => console.log('[*] Deleted command: ' + v.name))
					.catch(() => console.log('[*] Unable to deleted command: ' + v.name));
			});
		})
		.catch(() => console.log('Unable to fetch commands'));
});

bot.login(process.env.DISCORD_TOKEN);
