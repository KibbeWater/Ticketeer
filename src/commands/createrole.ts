import { PermissionFlagsBits, ApplicationCommandOptionType } from 'discord-api-types/v10';
import { SlashCommandFunction, TextCommandFunction } from '../types/Command';
import { defineCommand } from '../utils';
import { prisma } from '../db';

const _slashCmdRun: SlashCommandFunction = async (interaction) => {
	const _team = interaction.options.get('team');
	const _name = interaction.options.get('name');

	const team = _team?.type === ApplicationCommandOptionType.String ? (_team.value as string) : undefined;
	const name = _name?.type === ApplicationCommandOptionType.String ? (_name.value as string) : undefined;

	if (!name || !team) return;

	const teams = await prisma.team.findMany({ where: { name: team, guild: { guildId: interaction.guildId! } } });
	const teamObj = teams.find((t) => t.name === team);

	if (!teamObj) {
		await interaction.reply(`Team ${team} does not exist in this guild`);
		return;
	}

	const role = await prisma.teamRole.create({
		data: {
			name,
			team: { connect: { id: teamObj.id } },
		},
	});

	await interaction.reply(`Team role "${role.name}" has been created`);
};

const _textRun: TextCommandFunction = async (msg, args) => {
	const teamName = args[0];
	const name = args[1];

	if (!name || !teamName) return;

	const teams = await prisma.team.findMany({ where: { name: teamName, guild: { guildId: msg.guildId! } } });
	const team = teams.find((t) => t.name === teamName);

	const role = await prisma.teamRole.create({
		data: {
			name,
			team: { connect: { id: team!.id } },
		},
	});

	await msg.reply(`Team role "${role.name}" has been created`);
};

const command = defineCommand({
	// Required
	name: 'createrole',
	description: 'Create a new support team role.',
	args: [
		{
			type: ApplicationCommandOptionType.String,
			name: 'team',
			description: 'Team/Department name',
			required: true,
		},
		{
			type: ApplicationCommandOptionType.String,
			name: 'name',
			description: 'Name of the support team',
			required: true,
		},
	],

	// More optional
	permissions: [PermissionFlagsBits.Administrator],
	aliases: [],
	dm: true,

	// Run methods
	slashRun: _slashCmdRun,
	textRun: _textRun,
});

export default command;
