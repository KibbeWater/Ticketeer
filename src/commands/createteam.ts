const { PermissionFlagsBits, ApplicationCommandOptionType } = require('discord-api-types/v10');
const { CommandInteraction, MessageEmbed } = require('discord.js');
const { createTeam } = require('../api/teams');
const utils = require('../private/utils');

module.exports = {
	// Required
	name: 'createteam',
	description: 'Create a support team for your server',
	args: [
		{
			type: ApplicationCommandOptionType.String,
			name: 'name',
			description: 'Support teams name (purchase, general, etc)',
			required: true,
		},
	],

	// More optional
	permission: PermissionFlagsBits.Administrator,
	aliases: ['createteam'],
	dm: false,

	// Run methods
	slashRun: _slashCmdRun,

	textRun: _textRun,
};

/**
 *
 * @param {CommandInteraction} interaction
 */
function _slashCmdRun(interaction) {
	interaction.deferReply({ ephemeral: true });
	const name = interaction.options.getString('name');
	createTeam(interaction.guild, name).then(() => {
		interaction.editReply(`Created team ${name}!`);
	});
}

function _textRun(msg, args) {
	const name = args[0];
	createTeam(msg.guild, name).then(() => {
		msg.channel.send(`Created team "${name}"!`);
	});
}
