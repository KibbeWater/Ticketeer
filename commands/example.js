const { PermissionFlagsBits, ApplicationCommandOptionType } = require('discord-api-types/v10');
const { Interaction, CommandInteraction } = require('discord.js');
const utils = require('../private/utils');

module.exports = {
	// Required
	name: 'example',
	description: 'example description',
	args: [
		{
			type: ApplicationCommandOptionType.String,
			name: 'name',
			description: 'Your name',
			required: true,
		},
		{
			type: ApplicationCommandOptionType.Number,
			name: 'age',
			description: 'Your age',
			required: true,
		},
	],

	// More optional
	permission: PermissionFlagsBits.Administrator,
	aliases: [],
	dm: true,

	// Run methods
	slashRun: _slashCmdRun,

	textRun: _textRun,
};

/**
 *
 * @param {CommandInteraction} interaction
 */
function _slashCmdRun(interaction) {
	interaction.reply({
		content: `Your name is ${interaction.options.getString(
			'name'
		)} and you are ${interaction.options.getNumber('age')} years old`,
		ephemeral: true,
	});
}

/**
 *
 * @param {Message} msg Original message
 * @param {Array<String>} args Command arguments
 */
function _textRun(msg, args) {
	let age = parseInt(args[1]);
	if (isNaN(age)) return utils.messages.badUsage(msg, this);

	msg.reply(`Your name is ${args[0]} and you are ${args[1]} years old`);
}
