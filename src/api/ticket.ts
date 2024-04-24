import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	ChannelType,
	EmbedBuilder,
	Message,
	ModalBuilder,
	TextChannel,
	TextInputBuilder,
	TextInputStyle,
} from 'discord.js';
import { prisma } from '../db';
import { InteractionFunction } from '../types/Command';
import { scoreTeam } from './algorithm';
import { embedToJson, removePendingMessages } from './messages';

export const createTicket: InteractionFunction = async (interaction) => {
	if (!interaction.isButton() || interaction.customId !== 'ticket_create') return;

	interaction.deferReply({ ephemeral: true });

	const msgId = interaction.message.id;

	const [panel, ticketGuild] = await prisma.$transaction([
		prisma.panel.findFirst({
			where: { messageId: msgId },
			include: {
				team: {
					include: {
						users: {
							include: {
								user: true,
							},
						},
					},
				},
			},
		}),
		prisma.guild.findFirst({ where: { guildId: interaction.guildId! } }),
	]);

	if (!panel) {
		await interaction.editReply({ content: 'This panel is not valid' });
		return;
	}
	if (!ticketGuild) {
		await interaction.editReply({ content: 'This guild is not valid' });
		return;
	}

	const customerUser = interaction.user;

	const bestRep = await scoreTeam(interaction.guild!, panel.team.id);

	if (!bestRep) {
		await interaction.editReply({ content: 'I could not find a representative for you, please notify administrators' });
		return;
	}

	// YOU MUST ASSIGN A CHANNEL TO THE TICKET, PLEASE DELETE THE TICKET OBJECT IF IT DOES NOT EXIST
	const ticket = await prisma.ticket.create({
		data: {
			team: { connect: { id: panel.team.id } },
			guild: { connect: { id: ticketGuild.id } },
			customer: {
				connectOrCreate: {
					where: {
						userId_guildId: {
							userId: customerUser.id,
							guildId: ticketGuild.id,
						},
					},
					create: {
						userId: customerUser.id,
						guild: { connect: { guildId: interaction.guildId! } },
						avatar: customerUser.avatarURL(),
						username: customerUser.username,
					},
				},
			},
		},
	});

	const discardTicket = async () => {
		await prisma.ticket.delete({ where: { id: ticket.id } });
	};

	let channel: TextChannel | undefined;
	try {
		channel = await interaction.guild?.channels.create({
			name: `ticket-${ticket.id}`,
			type: ChannelType.GuildText,
		});

		if (!channel) {
			discardTicket();
			await interaction.editReply({ content: 'I could not create a channel for you' });
			return;
		}

		const button = new ButtonBuilder().setCustomId('ticket_close').setLabel('Close Ticket').setStyle(ButtonStyle.Danger);
		const row = new ActionRowBuilder<ButtonBuilder>().addComponents(button);

		await channel.send({
			components: [row],
			embeds: [
				new EmbedBuilder()
					.setTitle(`Ticket ID: ${ticket.id}`)
					.setDescription('Please wait for a representative to assist you')
					.setColor('#0000FF'),
			],
		});

		const adminThread = await channel.threads.create({
			name: `Admin Chat ${ticket.id}`,
			type: ChannelType.PrivateThread,
			reason: 'Private thread for for team notes and communication',
			invitable: false,
		});

		if (!adminThread) {
			discardTicket();
			await interaction.editReply({ content: 'I could not create a channel for you, please try again later' });
			return;
		}

		await adminThread.send({
			content: panel.team.users.map((u) => `<@${u.user.userId}>`).join(' '),
			embeds: [
				new EmbedBuilder()
					.setTitle(`Admin Channel for Ticket ID: ${ticket.id}`)
					.setDescription(
						'Please utilize this thread for internal communication,\nAdmins, be weary with pinging users, as it may result in them getting access to this channel'
					)
					.setColor('#000000'),
			],
		});

		await prisma.ticket.update({
			where: { id: ticket.id },
			data: {
				channelId: channel.id,
				adminThreadId: adminThread.id,
			},
		});
	} catch (error) {
		discardTicket();
		await interaction.editReply({ content: 'I could not create a channel for you, please try again later' });
		return;
	}

	await interaction.editReply({ content: `I have created a ticket for you at <#${channel.id}>` });
};

export const rateTicket: InteractionFunction = async (interaction) => {
	if (!interaction.isModalSubmit() || !interaction.customId.startsWith('ticket_modalrate_')) return;

	interaction.deferReply();

	const [unk1, unk2, ratingStr, ticketIdStr] = interaction.customId.split('_');

	const rating = parseInt(ratingStr);
	const ticketId = parseInt(ticketIdStr);

	if (isNaN(rating) || isNaN(ticketId)) {
		await interaction.editReply({ content: 'Invalid rating' });
		return;
	}

	const comment = interaction.fields.getTextInputValue('ticket_feedback');

	const ticket = await prisma.ticket.findFirst({
		where: { id: ticketId },
		include: {
			customer: true,
			feedback: true,
		},
	});

	if (!ticket) {
		await interaction.editReply({ content: 'Invalid ticket' });
		return;
	}

	if (ticket.feedback) {
		await interaction.editReply({ content: 'This ticket has already been rated' });
		return;
	}

	await prisma.feedback.create({
		data: {
			ticket: { connect: { id: ticket.id } },
			rating: rating,
			comment,
		},
	});

	await interaction.editReply({
		content: 'Thank you for your feedback!',
	});
};

export const showRateTicket: InteractionFunction = async (interaction) => {
	if (!interaction.isButton() || !interaction.customId.startsWith('ticket_rate_')) return;

	const [unk1, unk2, ratingStr, ticketIdStr] = interaction.customId.split('_');

	const feedback = new TextInputBuilder()
		.setCustomId(`ticket_feedback`)
		.setLabel('Feedback')
		.setPlaceholder('Please provide feedback')
		.setRequired(true)
		.setStyle(TextInputStyle.Paragraph);
	const row = new ActionRowBuilder<TextInputBuilder>().addComponents(feedback);

	const modal = new ModalBuilder()
		.setCustomId(`ticket_modalrate_${ratingStr}_${ticketIdStr}`)
		.setTitle('How was your experience?')
		.addComponents(row);

	await interaction.showModal(modal);
};

export const closeTicket: InteractionFunction = async (interaction) => {
	if (!interaction.isButton() || interaction.customId !== 'ticket_close') return;

	interaction.deferReply({ ephemeral: true });

	const channelId = interaction.channelId;

	const ticket = await prisma.ticket.findFirst({
		where: { channelId: channelId },
		include: {
			team: {
				include: {
					users: {
						include: {
							user: true,
						},
					},
				},
			},
			customer: true,
		},
	});

	if (!ticket) {
		await interaction.editReply({ content: 'This is not a valid ticket channel' });
		return;
	}

	const ticketChannel = (await interaction.client.channels.fetch(channelId)) as TextChannel;

	if (!ticketChannel) {
		await interaction.editReply({ content: 'This is not a valid ticket channel' });
		return;
	}

	const _ticketMessages = prisma.message.findMany({
		where: {
			ticketId: ticket.id,
		},
	});

	interaction.editReply({
		content: '',
		embeds: [
			new EmbedBuilder()
				.setTitle('Close Pending')
				.setDescription('Please wait as we archive your messages to generate a report. This may take a while.')
				.setColor('#FF0000'),
		],
	});

	let msgs: Message[] = [];
	do {
		let lastMsg = msgs.length > 0 ? msgs[msgs.length - 1] : undefined;
		const MESSAGE_LIMIT = 100;
		const messges = await ticketChannel.messages.fetch({ limit: MESSAGE_LIMIT, before: lastMsg?.id });

		msgs = [...msgs, ...messges.values()];

		if (messges.size !== MESSAGE_LIMIT) break;
	} while (true);

	const ticketMessages = await _ticketMessages;

	const missingMessages = msgs.filter((m) => !ticketMessages.some((tm) => tm.messageId === m.id));
	removePendingMessages([...missingMessages.map((m) => m.id)]);

	const messagesDeleted = ticketMessages.filter((tm) => !msgs.some((m) => m.id === tm.messageId));

	await prisma.$transaction([
		prisma.message.createMany({
			data: missingMessages.map((m) => ({
				ticketId: ticket.id,
				messageId: m.id,
				userId: m.author.id,
				content: m.content,
				embeds: m.embeds.length > 0 ? { v: 1, embeds: embedToJson(m) } : undefined,
				attachments: m.attachments.map((a) => a.url),
			})),
		}),
		prisma.message.updateMany({
			where: {
				messageId: {
					in: messagesDeleted.map((m) => m.messageId),
				},
			},
			data: {
				deleted: true,
			},
		}),
		prisma.ticket.update({
			where: { id: ticket.id },
			data: {
				closed: true,
			},
		}),
	]);

	await ticketChannel.delete('Ticket closed');

	const customerUser = await interaction.client.users.fetch(ticket.customer.userId);

	const buttons = [1, 2, 3, 4, 5].map((rating) =>
		new ButtonBuilder()
			.setCustomId(`ticket_rate_${rating}_${ticket.id}`)
			.setLabel(rating.toString())
			.setEmoji('⭐')
			.setStyle(rating < 3 ? ButtonStyle.Danger : rating < 4 ? ButtonStyle.Primary : ButtonStyle.Success)
	);
	const row = new ActionRowBuilder<ButtonBuilder>().addComponents(buttons);

	await customerUser.send({
		components: [row],
		embeds: [
			new EmbedBuilder()
				.setTitle(`Ticket #${ticket.id} Closed`)
				.setDescription('Your ticket has been closed, thank you for using our services')
				.setColor('#00FF00')
				.addFields([
					{
						name: 'Transcript',
						value: 'https://example.com/transcript',
					},
				]),
		],
	});
};
