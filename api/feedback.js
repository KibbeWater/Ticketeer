const { Guild, GuildMember } = require('discord.js');
const { Ticket } = require('./tickets');

const mongo = require('../private/db').getInstance();

/**
 *
 * @param {Guild} guild
 * @param {GuildMember} author
 * @param {GuildMember} target
 * @param {Ticket} ticket
 * @param {Number} feedback A value from 1-5
 */
async function _addFeedback(guild, author, target, ticket, rating) {
	const feedback = mongo.db('ticketeer').collection('feedback');

	await feedback.insertOne({
		guildId: guild.id,
		authorId: author.id,
		targetId: target.id,
		ticketId: ticket._id,
		rating,
		createdAt: new Date(),
	});
}

/**
 *
 * @param {Ticket} ticket
 */
async function _getFeedback(ticket) {
	const feedback = mongo.db('ticketeer').collection('feedback');

	return await feedback.find({ ticketId: ticket._id }).toArray();
}

/**
 *
 * @param {BigInt} userId
 * @param {Guild} guild
 */
async function _getUserFeedback(userId, guild) {
	const feedback = mongo.db('ticketeer').collection('feedback');

	return await feedback.find({ targetId: userId, guildId: guild.id }).toArray();
}

/**
 *
 * @param {Guild} guild
 */
async function _getGuildFeedback(guild) {
	const feedback = mongo.db('ticketeer').collection('feedback');

	return await feedback.find({ guildId: guild.id }).toArray();
}

module.exports = {
	addFeedback: _addFeedback,
	getFeedback: _getFeedback,
	getUserFeedback: _getUserFeedback,
	getGuildFeedback: _getGuildFeedback,
};
