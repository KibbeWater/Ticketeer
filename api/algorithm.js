const mongo = require('../private/db').getInstance();
const discord = require('./discord');
const teamapi = require('./teams');
const feedbackapi = require('./feedback');
const ticketsapi = require('./tickets');
const { Guild } = require('discord.js');

const maxTicketsCount = 5;
const maxExperienceTickets = 100;

/**
 *
 * @param {Guild} guild
 * @param {String} teamName
 * @param {ScoringOptions} [options]
 * @returns
 */
function _scoreTeam(guild, teamName, options) {
	return new Promise((resolve, reject) => {
		teamapi
			.getGuildTeams(guild)
			.then((teamCollection) => {
				const team = teamCollection.teams.find((t) => t.name === teamName);

				if (!team) return reject(new Error('Team not found'));

				let totalTickets = ticketsapi.getGuildTickets(guild).length;
				let scores = [];
				for (let i = 0; i < team.members.length; i++) {
					const user = discord.getUser(guild.client, team.members[i]);
					scores.push({
						user: user.id,
						score: _scoreUser(guild, user, options),
					});
				}

				resolve(scores.sort((a, b) => b.score - a.score)[0]);
			})
			.catch(reject);
	});
}

/**
 *
 * @param {Guild} guild
 * @param {User} user
 * @param {ScoringOptions} [options]
 * @returns {Number}
 */
async function _scoreUser(guild, user, options) {
	const feedback = await feedbackapi.getUserFeedback(user.id, guild);
	const tickets = await ticketsapi.getUserTickets(user.id, guild);

	const closedTickets = tickets.filter((ticket) => ticket.closedAt != undefined);
	const openTickets = tickets.filter((ticket) => ticket.closedAt == undefined);

	const averageFeedback = feedback.reduce((acc, cur) => acc + cur.score, 0) / feedback.length;
	const averageRecentTickets =
		feedback.slice(0, 10).reduce((acc, cur) => acc + cur.score, 0) / 10;

	const onlineStatus =
		user.presence.status == 'online'
			? 1
			: user.presence.status == 'idle' || user.presence.status == 'dnd' // Will ruin response time
			? 0.5
			: 0;

	options = options || { vipLevel: 0 };
	options.vipLevel = Math.min(options.vipLevel, 5);

	let score = Math.min(maxExperienceTickets, closedTickets.length);
	score *=
		((averageFeedback * (averageRecentTickets * 3)) / 4) * Math.min(options.vipLevel / 5, 0.4); // VIP users will a more feedback influenced support representative
	score *= Math.min(openTickets.length, maxTicketsCount) / (maxTicketsCount + 0.5); // Decrease score if too many tickets
	score *= onlineStatus * (options.vipLevel / 6); // VIP level will decrease power of online status

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
