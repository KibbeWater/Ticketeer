const { Guild, GuildMember } = require('discord.js');

const mongo = require('../private/db').getInstance();

/**
 *
 * @param {Guild} guild
 * @param {GuildMember} author
 * @param {GuildMember} target
 * @param {import('./tickets').Ticket} ticket
 */
async function _addFeedback(guild, author, target, ticket) {
	const feedback = mongo.db('ticketeer').collection('feedback');

	await feedback.insertOne({
		guildId: guild.id,
		authorId: author.id,
		targetId: target.id,
		ticketId: ticket.id,
		createdAt: new Date(),
	});
}

module.exports = {
	addFeedback: _addFeedback,
};
