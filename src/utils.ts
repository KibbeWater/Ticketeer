import { EmbedBuilder, Message } from 'discord.js';
import { Command, CommandArg } from './types/Command';
import { env } from './api/env';

function _parseArgsUsage(args: CommandArg[]) {
	let usage = [];
	usage = args.map((cmd) => (cmd.required ? `<${cmd.name}>` : `[${cmd.name}]`));
	return usage.join(' ');
}

function _getMemberIdFromMention(str: string) {
	if (str.startsWith('<@') && str.endsWith('>')) {
		return str.slice(2, -1);
	}
	return null;
}

export const defineCommand = (command: Command) => {
	return command;
};

export const utils = {
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
		badUsage: (msg: Message, cmd: Command) => {
			msg.reply({
				embeds: [
					new EmbedBuilder()
						.setTitle('Incorrect Usage')
						.setDescription(`Usage: ${env.PREFIX}${cmd.name} ${_parseArgsUsage(cmd.args)}`)
						.setColor('#FF0000'),
				],
			});
			return false;
		},

		/**
		 * Get the no permissions embed
		 */
		noPermissions: (msg: Message) => {
			msg.reply({
				embeds: [
					new EmbedBuilder()
						.setTitle('No Permissions')
						.setDescription("You don't have permissions to use this command")
						.setColor('#FF0000'),
				],
			});
			return false;
		},

		error: (title: string, description: string, msg: Message) => {
			msg.reply({
				embeds: [new EmbedBuilder().setTitle(title).setDescription(description).setColor('#FF0000')],
			});
			return false;
		},
	},
};
