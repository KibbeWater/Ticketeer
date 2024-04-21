import { PermissionFlagsBits, ApplicationCommandOptionType } from 'discord-api-types/v10';
import { SlashCommandFunction, TextCommandFunction } from '../types/Command';
import { defineCommand, utils } from '../utils';
import { prisma } from '../db';

const _slashCmdRun: SlashCommandFunction = async (interaction) => {
	const _team = interaction.options.get('team', true);
	const _role = interaction.options.get('role', true);
	const user = interaction.options.getUser('user', true);

	const team = _team?.type === ApplicationCommandOptionType.String ? (_team.value as string) : undefined;
	const role = _role?.type === ApplicationCommandOptionType.String ? (_role.value as string) : undefined;

	if (!team || !role) return;

	const guild = await prisma.guild.findUnique({
		where: {
			guildId: interaction.guildId!,
		},
	});

	if (!guild) {
		await interaction.reply('Guild is not registered, please create a team first');
		return;
	}

	const guildTeam = await prisma.team.findUnique({
		where: {
			name_guildId: {
				name: team,
				guildId: guild.id,
			},
		},
	});

	if (!guildTeam) {
		await interaction.reply({ content: `Team ${team} does not exist in this guild`, ephemeral: true });
		return;
	}

	const teamRole = await prisma.teamRole.findUnique({
		where: {
			name_teamId: {
				name: role,
				teamId: guildTeam?.id,
			},
		},
	});

	if (!teamRole) {
		await interaction.reply({ content: `Role ${role} does not exist in this team`, ephemeral: true });
		return;
	}

	const updatedRole = await prisma.teamRole.update({
		where: {
			id: teamRole.id,
		},
		data: {
			teamUsers: {
				create: {
					team: {
						connect: {
							id: guildTeam.id,
						},
					},
					user: {
						connectOrCreate: {
							where: {
								userId: user.id,
							},
							create: {
								userId: user.id,
							},
						},
					},
				},
			},
		},
	});

	await interaction.reply({ content: `User ${user.username} added to team ${team}`, ephemeral: true });
};

const _textRun: TextCommandFunction = async (msg, args) => {
	await msg.reply('This command is only available as a slash command');
};

const command = defineCommand({
	// Required
	name: 'addteam',
	description: 'Add a user to a support team',
	args: [
		{
			type: ApplicationCommandOptionType.String,
			name: 'team',
			description: 'Team/Department name',
			required: true,
		},
		{
			type: ApplicationCommandOptionType.String,
			name: 'role',
			description: 'Team role name',
			required: true,
		},
		{
			type: ApplicationCommandOptionType.User,
			name: 'user',
			description: 'User to add to the team',
			required: true,
		},
	],

	// More optional
	permissions: [PermissionFlagsBits.Administrator],
	aliases: [],
	dm: false,

	// Run methods
	slashRun: _slashCmdRun,
	textRun: _textRun,
});

export default command;
