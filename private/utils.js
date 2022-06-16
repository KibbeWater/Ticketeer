const { MessageEmbed, Message } = require('discord.js');
const { args } = require('../commands/example');

const config = require('../config.json');

module.exports = {
	commands: {
		parseArgsUsage: (args) => {
			let usage = [];
			usage = args.map((cmd) => (cmd.required ? `<${cmd.name}>` : `[${cmd.name}]`));
			return usage.join(' ');
		},
	},

	messages: {
		/**
		 * Get the bad usage embed
		 * @param {Message} msg The message object of which the command tried to execute on
		 * @param {Object} cmd The command object
		 */
		badUsage: (msg, cmd) => {
			msg.reply(
				new MessageEmbed()
					.setTitle('Incorrect Usage')
					.setDescription(`Usage: ${this.commands.parseArgsUsage(args)}`)
					.setColor(config.error)
			);
			return false;
		},

		/**
		 * Get the no permissions embed
		 * @param {Message} msg The message object of which the command tried to execute on
		 */
		noPermissions: (msg) => {
			msg.reply(
				new MessageEmbed()
					.setTitle('No Permissions')
					.setDescription("You don't have permissions to use this command")
					.setColor(config.error)
			);
			return false;
		},

		error: (title, description, msg) => {
			msg.reply(
				new MessageEmbed()
					.setTitle(title)
					.setDescription(description)
					.setColor(config.error)
			);
			return false;
		},
	},
};
