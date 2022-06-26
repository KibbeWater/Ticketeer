const { PermissionFlagsBits, ApplicationCommandOptionType } = require('discord-api-types/v10');
const { CommandInteraction, Message } = require('discord.js');
const { teamAdd, teamAddSupervisor, teamRemove, teamRemoveSupervisor } = require('../api/teams');
const utils = require('../private/utils');

module.exports = {
	// Required
	name: 'removeteam',
	description: 'Remove a team member from a support team',
	args: [
		{
			type: ApplicationCommandOptionType.String,
			name: 'team',
			description: 'The name of the support team',
			required: true,
		},
		{
			type: ApplicationCommandOptionType.User,
			name: 'member',
			description: 'The member to add to the team',
			required: true,
		},
	],

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

	const team = interaction.options.getString('team');
	const member = interaction.options.getUser('member');
	const supervisor = interaction.options.getBoolean('supervisor');

	const callback = () => {
		interaction.editReply(`Removed ${member.tag} from ${team}`);
	};

	if (!supervisor)
		teamRemove(interaction.guild, team, member)
			.then(callback)
			.catch((err) => {
				interaction.editReply(`Error removing ${member.tag} from ${team}`);
				console.error(`Error removing ${member.tag} from ${team}: ${err.message}`);
			});
	else
		teamRemoveSupervisor(interaction.guild, team, member)
			.then(callback)
			.catch((err) => {
				interaction.editReply(`Error removing ${member.tag} from ${team}`);
				console.error(`Error removing ${member.tag} from ${team}: ${err.message}`);
			});
}

/**
 *
 * @param {Message} msg
 * @param {Array<String>} args
 */
function _textRun(msg, args) {
	const team = args[0];
	const memberId = args[1];
	const supervisor = args[2];

	// Get the member from the message
	msg.guild.members
		.fetch(utils.commands.getMemberIdFromMention(memberId))
		.then((member) => {
			if (supervisor == 'true' || supervisor == '1' || supervisor == 'yes')
				teamAddSupervisor(msg.guild, team, member)
					.then(() => {
						msg.channel.send(`Added ${member.tag} from ${team} as a supervisor`);
					})
					.catch((err) => {
						msg.channel.send(`Error from ${member.tag} from ${team}`);
						console.error(`Error from ${member.tag} from ${team}: ${err.message}`);
					});
			else
				teamAdd(msg.guild, team, member)
					.then(() => {
						msg.channel.send(`Added ${member.tag} from ${team}`);
					})
					.catch((err) => {
						msg.channel.send(`Error from ${member.tag} from ${team}`);
						console.error(`Error from ${member.tag} from ${team}: ${err.message}`);
					});
		})
		.catch(() => msg.reply(`Error finding member`));
}
