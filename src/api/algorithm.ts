import { Guild, GuildMember, User } from 'discord.js';
import { prisma } from '../db';
import { getUser } from './discord';

const maxTicketsCount = 5;
const maxExperienceTickets = 100;

async function _scoreTeam(guild: Guild, teamId: number, options: { vipLevel: number }) {
	const guildTeams = await prisma.guild.findUnique({
		where: {
			guildId: guild.id,
		},
		include: {
			teams: {
				include: {
					users: {
						include: {
							user: true,
						},
					},
				},
			},
		},
	});

	if (!guildTeams) throw new Error('Guild not found');

	const team = guildTeams.teams.find((t) => t.id === teamId);

	if (!team) throw new Error('Team not found');
	const teamDCUsers = await guild.members.fetch({ user: team.users.map((u) => u.user.userId), withPresences: true });
	let scores = await Promise.all(
		team.users.map(async (user) => {
			const discordUser = teamDCUsers.find((u) => u.id === user.user.userId);
			if (!discordUser) return;
			return {
				user: discordUser,
				score: await _scoreUser(guild, discordUser, options),
			};
		})
	);

	return (
		scores.filter((s) => s !== undefined) as {
			user: GuildMember;
			score: number;
		}[]
	).sort((a, b) => b.score - a.score)[0];
}

/**
 *
 * @param {Guild} guild
 * @param {User} user
 * @param {ScoringOptions} [options]
 * @returns {Number}
 */
async function _scoreUser(guild: Guild, user: GuildMember, options: { vipLevel: number }) {
	const [feedback, tickets] = await prisma.$transaction([
		prisma.feedback.findMany({
			where: {
				ticket: {
					claimant: {
						user: {
							userId: user.id,
						},
					},
					guild: {
						guildId: guild.id,
					},
				},
			},
		}),
		prisma.ticket.findMany({
			where: {
				claimant: {
					user: {
						userId: user.id,
					},
				},
				guild: {
					guildId: guild.id,
				},
			},
		}),
	]);

	const closedTickets = tickets.filter((ticket) => ticket.closedAt != undefined);
	const openTickets = tickets.filter((ticket) => ticket.closedAt == undefined);

	const averageFeedback = feedback.reduce((acc, cur) => acc + cur.rating, 0) / feedback.length;
	const averageRecentTickets = feedback.slice(0, 10).reduce((acc, cur) => acc + cur.rating, 0) / 10;

	const desktopStatus = user.presence?.clientStatus?.desktop;
	const desktopStatusWeight = desktopStatus == 'online' ? 1 : desktopStatus == 'idle' ?? desktopStatus == 'dnd' ? 0.5 : 0;

	const webStatus = user.presence?.clientStatus?.web;
	const webStatusWeight = webStatus == 'online' ? 1 : webStatus == 'idle' ?? webStatus == 'dnd' ? 0.5 : 0;

	const onlineStatusWeight = Math.max(desktopStatusWeight, webStatusWeight);

	options = options || { vipLevel: 0 };
	options.vipLevel = Math.min(options.vipLevel, 5);

	let score = Math.min(maxExperienceTickets, closedTickets.length);
	score *= ((averageFeedback * (averageRecentTickets * 3)) / 4) * Math.min(options.vipLevel / 5, 0.4); // VIP users will a more feedback influenced support representative
	score *= Math.min(openTickets.length, maxTicketsCount) / (maxTicketsCount + 0.5); // Decrease score if too many tickets
	score *= onlineStatusWeight * (options.vipLevel / 6); // VIP level will decrease power of online status

	return score;
}

module.exports = {
	scoreTeam: _scoreTeam,
	scoreUser: _scoreUser,
};

/**
 * @typedef {Object} ScoringOptions
 * @property {Number} vipLevel - The VIP level of the user [0-5], used to calculate level of priority
 */