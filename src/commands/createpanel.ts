import { ActionRowBuilder, ApplicationCommandOptionType, ButtonBuilder, ButtonStyle, ColorResolvable, EmbedBuilder } from 'discord.js';
import { defineCommand, utils } from '../utils';
import { InteractionFunction, SlashCommandFunction, TextCommandFunction } from '../types/Command';
import { prisma } from '../db';
import { closeTicket, createTicket, rateTicket, showRateTicket } from '../api/ticket';

const _slashCommand: SlashCommandFunction = async (interaction) => {
	const _team = interaction.options.get('team');
	const _title = interaction.options.get('title');
	const _description = interaction.options.get('description');
	const _color = interaction.options.get('color');
	const _button = interaction.options.get('button');
	const _emoji = interaction.options.get('emoji');

	const team = _team?.type === ApplicationCommandOptionType.String ? (_team.value as string) : undefined;
	const title = _title?.type === ApplicationCommandOptionType.String ? (_title.value as string) : undefined;
	const description = _description?.type === ApplicationCommandOptionType.String ? (_description.value as string) : undefined;
	const color = _color?.type === ApplicationCommandOptionType.String ? (_color.value as string) : undefined;
	const button = _button?.type === ApplicationCommandOptionType.String ? (_button.value as string) : undefined;
	const emoji = _emoji?.type === ApplicationCommandOptionType.String ? (_emoji.value as string) : undefined;

	interaction.deferReply({ ephemeral: true });

	const teams = await prisma.team.findMany({ where: { name: team, guild: { guildId: interaction.guildId! } } });

	if (!teams.some((t) => t.name === team)) {
		if (teams.length === 0) {
			await interaction.editReply({ content: `No teams exist in this guild` });
			return;
		}

		await interaction.editReply({
			content: `Team ${team} does not exist in this guild, valid guilds are: ${teams.map((t) => `\`${t.name}\``)}`,
		});
		return;
	}

	const buttonBuilder = new ButtonBuilder()
		.setCustomId('ticket_create')
		.setLabel(button ?? 'Open Ticket')
		.setStyle(ButtonStyle.Primary);

	if (emoji) buttonBuilder.setEmoji(emoji);

	const msg = await interaction.channel?.send({
		embeds: [
			new EmbedBuilder()
				.setColor((color ?? '#0000FF') as ColorResolvable)
				.setTitle(title ?? null)
				.setDescription(description ?? null),
		],
		components: [new ActionRowBuilder<ButtonBuilder>().addComponents(buttonBuilder)],
	});

	if (!msg) return;

	await prisma.panel.create({
		data: {
			guild: { connectOrCreate: { where: { guildId: interaction.guildId! }, create: { guildId: interaction.guildId! } } },
			team: { connect: { id: teams.find((t) => t.name === team)!.id } },
			messageId: msg.id,
		},
	});

	await interaction.editReply({ content: 'I have created a new panel for you!' });
};

const _textCommand: TextCommandFunction = async (msg, args) => {
	const [team, title, description, button, color, emoji] = args;

	if (!team || !title || !description || !button) {
		utils.messages.badUsage(msg, command);
		return;
	}

	const teams = await prisma.team.findMany({ where: { name: team, guild: { guildId: msg.guildId! } } });

	if (!teams.some((t) => t.name === team)) {
		if (teams.length === 0) {
			await msg.reply(`No teams exist in this guild`);
			return;
		}

		await msg.reply(`Team ${team} does not exist in this guild, valid guilds are: ${teams.map((t) => `\`${t.name}\``)}`);
		return;
	}

	const buttonBuilder = new ButtonBuilder()
		.setCustomId('ticket_create')
		.setLabel(button ?? 'Open Ticket')
		.setStyle(ButtonStyle.Primary);

	if (emoji) buttonBuilder.setEmoji(emoji);

	const panelMsg = await msg.channel.send({
		embeds: [
			new EmbedBuilder()
				.setColor((color ?? '#0000FF') as ColorResolvable)
				.setTitle(title ?? null)
				.setDescription(description ?? null),
		],
		components: [new ActionRowBuilder<ButtonBuilder>().addComponents(buttonBuilder)],
	});

	if (!panelMsg) return;

	await prisma.panel.create({
		data: {
			guild: { connectOrCreate: { where: { guildId: msg.guildId! }, create: { guildId: msg.guildId! } } },
			team: { connect: { id: teams.find((t) => t.name === team)!.id } },
			messageId: panelMsg.id,
		},
	});

	await msg.reply('I have created a new panel for you!');
};

const _interaction: InteractionFunction = async (interaction) => {
	if (!interaction.isButton() && !interaction.isModalSubmit()) return;

	if (interaction.customId === 'ticket_create') return await createTicket(interaction);
	if (interaction.customId === 'ticket_close') return await closeTicket(interaction);
	if (interaction.customId.startsWith('ticket_modalrate_')) return await rateTicket(interaction);
	if (interaction.customId.startsWith('ticket_rate_')) return await showRateTicket(interaction);
};

const command = defineCommand({
	// Required
	name: 'createpanel',
	description: 'Create a support panel to allow users to create tickets.',
	args: [
		{
			type: ApplicationCommandOptionType.String,
			name: 'team',
			description: 'Team/Department name',
			required: true,
		},
		{
			type: ApplicationCommandOptionType.String,
			name: 'title',
			description: 'Embed title',
			required: true,
		},
		{
			type: ApplicationCommandOptionType.String,
			name: 'description',
			description: 'Embed description',
			required: true,
		},
		{
			type: ApplicationCommandOptionType.String,
			name: 'button',
			description: 'Open ticket button text',
			required: true,
		},
		{
			type: ApplicationCommandOptionType.String,
			name: 'color',
			description: 'Embed color (hex)',
			required: false,
		},
		{
			type: ApplicationCommandOptionType.String,
			name: 'emoji',
			description: 'Open ticket button emoji',
			required: false,
		},
	],

	permissions: [],

	// More optional
	aliases: [],
	dm: false,

	// Run methods
	slashRun: _slashCommand,
	textRun: _textCommand,
	interaction: _interaction,
});

export default command;
