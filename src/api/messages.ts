import { Message } from 'discord.js';
import { prisma } from '../db';

let cachedTickets: Set<string> = new Set();
let lastCached: number = -1;

let messagesToLog: { guildId: string; channelId: string; message: Message; attachments: string[] }[] = [];
let interval: NodeJS.Timeout = setInterval(intervalFunc, 1000 * 30);

export const embedToJson: (msg: Message) => object[] = (msg) =>
	msg.embeds.map((e) => ({
		title: e.title,
		description: e.description,
		color: e.color,
		fields: e.fields.map((f) => ({ name: f.name, value: f.value })),
	}));

async function intervalFunc() {
	if (messagesToLog.length === 0) return;

	let toLog = messagesToLog;
	messagesToLog = [];

	const tickets = await prisma.ticket.findMany({
		where: {
			OR: [
				{
					channelId: {
						in: toLog.map((m) => m.channelId),
					},
				},
				{
					adminThreadId: {
						in: toLog.map((m) => m.channelId),
					},
				},
			],
		},
	});

	// Find messages who don't have a channel in the tickets
	const missingTickets = toLog.filter((m) => !tickets.some((t) => t.channelId === m.channelId || t.adminThreadId == m.channelId));

	toLog = toLog.filter((m) => !missingTickets.includes(m));

	await prisma.message.createMany({
		data: toLog.map((m) => ({
			content: m.message.content,
			messageId: m.message.id,
			userId: m.message.author.id,
			ticketId: tickets.find((t) => t.channelId === m.channelId || t.adminThreadId == m.channelId)!.id,
			embeds: m.message.embeds.length > 0 ? { v: 1, embeds: embedToJson(m.message) } : undefined,
			attachments: m.attachments,
		})),
	});
}

async function getTickets() {
	if (Date.now() - 10000 * 60 * 5 > lastCached) {
		cachedTickets = new Set();
		lastCached = Date.now();
	} else return cachedTickets;

	const tickets = await prisma.ticket.findMany({
		select: {
			channelId: true,
			adminThreadId: true,
		},
	});

	const allChannels = tickets.reduce(
		(acc, ticket) => [...acc, ticket.adminThreadId ?? undefined, ticket.channelId ?? undefined],
		[] as (string | undefined)[]
	);

	cachedTickets = new Set(allChannels.filter((c) => c !== undefined) as string[]);
	lastCached = Date.now();
	return cachedTickets;
}

export function removePendingMessages(messageIds: string[]) {
	messagesToLog = messagesToLog.filter((m) => !messageIds.includes(m.message.id));
}

export async function logMessage(message: Message) {
	const tickets = await getTickets();

	if (!tickets.has(message.channel.id)) return;

	messagesToLog.push({
		guildId: message.guild!.id,
		channelId: message.channel.id,
		message,
		attachments: message.attachments.map((a) => a.url),
	});
}
