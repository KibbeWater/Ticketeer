const { PermissionFlagsBits, ApplicationCommandOptionType } = require('discord-api-types/v10');
const { Interaction, CommandInteraction } = require('discord.js');

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

function _textRun(msg, args) {}
