import { PermissionFlagsBits } from 'discord-api-types/v10';
import { SlashCommandFunction, TextCommandFunction } from '../types/Command';
import { defineCommand } from '../utils';
import { prisma } from '../db';

const _slashCmdRun: SlashCommandFunction = async (interaction) => {
	const teams = await prisma.team.findMany({
		where: {
			guild: {
				guildId: interaction.guildId!,
			},
		},
		include: {
			roles: {
				include: {
					teamUsers: {
						include: {
							user: true,
						},
					},
				},
			},
		},
	});

	interaction.reply({
		content: teams
			.map(
				(t) =>
					`* ${t.name}\n${t.roles
						.map((r) => `* * ${r.name}\n${r.teamUsers.map((u) => `* * * <@${u.user.userId}>`).join('\n')}`)
						.join('\n')}`
			)
			.join('\n'),
		ephemeral: true,
	});
};

const _textRun: TextCommandFunction = async (msg) => {
	const teams = await prisma.team.findMany({
		where: {
			guild: {
				guildId: msg.guildId!,
			},
		},
		include: {
			roles: true,
		},
	});

	await msg.reply(teams.map((t) => `* ${t.name}\n${t.roles.map((r) => `* * ${r.name}`).join('\n')}`).join('\n'));
};

const command = defineCommand({
	// Required
	name: 'viewteams',
	description: 'View your servers team configuration',
	args: [],

	// More optional
	permissions: [PermissionFlagsBits.Administrator],
	aliases: [],
	dm: false,

	// Run methods
	slashRun: _slashCmdRun,
	textRun: _textRun,
});

export default command;
