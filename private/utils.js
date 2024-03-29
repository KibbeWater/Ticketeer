const { MessageEmbed, Message } = require('discord.js');
const { args } = require('../commands/example');

const config = require('../config.json');

function _parseArgsUsage(args) {
	let usage = [];
	usage = args.map((cmd) => (cmd.required ? `<${cmd.name}>` : `[${cmd.name}]`));
	return usage.join(' ');
}

function _getMemberIdFromMention(str) {
	if (str.startsWith('<@') && str.endsWith('>')) {
		return str.slice(2, -1);
	}
	return null;
}

module.exports = {
	commands: {
		parseArgsUsage: _parseArgsUsage,
		getMemberIdFromMention: _getMemberIdFromMention,
	},

	messages: {
		/**
		 * Get the bad usage embed
		 * @param {Message} msg The message object of which the command tried to execute on
		 * @param {Object} cmd The command object
		 */
		badUsage: (msg, cmd) => {
			msg.reply({
				embeds: [
					new MessageEmbed()
						.setTitle('Incorrect Usage')
						.setDescription(
							`Usage: ${config.prefix}${cmd.name} ${_parseArgsUsage(args)}`
						)
						.setColor(config.error),
				],
			});
			return false;
		},

		/**
		 * Get the no permissions embed
		 * @param {Message} msg The message object of which the command tried to execute on
		 */
		noPermissions: (msg) => {
			msg.reply({
				embeds: [
					new MessageEmbed()
						.setTitle('No Permissions')
						.setDescription("You don't have permissions to use this command")
						.setColor(config.error),
				],
			});
			return false;
		},

		error: (title, description, msg) => {
			msg.reply({
				embeds: [
					new MessageEmbed()
						.setTitle(title)
						.setDescription(description)
						.setColor(config.error),
				],
			});
			return false;
		},
	},
};
