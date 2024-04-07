const { PermissionFlagsBits } = require('discord-api-types/v10');
const { MessageEmbed, CommandInteraction } = require('discord.js');

const teamsapi = require('../api/teams');

module.exports = {
	// Required
	name: 'teams',
	description: 'List all of the guilds teams',
	args: [],

	// More optional
	permission: PermissionFlagsBits.ManageGuild,
	aliases: [],
	dm: false,

	// Run methods
	slashRun: _slashCmdRun,

	textRun: _textRun,
};

/**
 *
 * @param {CommandInteraction} interaction
 */
async function _slashCmdRun(interaction) {
	await interaction.deferReply({ ephemeral: true });
	teamsapi.getGuildTeams(interaction.guild).then((teams) => {
		console.log(teams);
		interaction.editReply({
			embeds: [
				new MessageEmbed()
					.setTitle('Teams')
					.setDescription(teams.teams.map((team) => `${team.name}`).join('\n'))
					.setColor('#0099ff'),
			],
		});
	});
}

function _textRun(msg, args) {
	teamsapi.getGuildTeams(msg.guild).then((teams) => {
		msg.channel.send({
			embeds: [
				new MessageEmbed()
					.setTitle('Teams')
					.setDescription(teams.teams.map((team) => `${team.name}`).join('\n'))
					.setColor('#0099ff'),
			],
		});
	});
}
