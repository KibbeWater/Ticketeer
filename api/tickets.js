const { Guild, TextChannel, GuildMember, Channel } = require('discord.js');
const { ObjectId } = require('mongodb');

const mongo = require('../private/db').getInstance();

/**
 * Create a ticket
 * @param {Guild} guild
 * @param {TextChannel} channel
 * @param {GuildMember} author
 * @param {GuildMember} claimant
 * @returns {Ticket}
 */
function _createTicket(guild, channel, author, claimant) {
	const tickets = mongo.db('ticketeer').collection('tickets');

	const localId = _getLocalId(guild);

	return tickets.insertOne({
		localId,
		guildId: guild.id,
		channelId: channel.id,
		authorId: author.id,
		claimId: claimant.id,
		createdAt: new Date(),
	});
}

/**
 * Get the tickets for a guild
 * @param {Guild} guild
 * @returns {Ticket}
 */
function _getTickets(guild) {
	const tickets = mongo.db('ticketeer').collection('tickets');

	// get the latest ticket with the guildId of the guild
	return tickets.find({ guildId: guild.id }).toArray();
}

/**
 * Close the ticket with the given id
 * @param {ObjectId} id
 */
function _closeTicket(id) {
	const tickets = mongo.db('ticketeer').collection('tickets');

	tickets.updateOne({ _id: id }, { $set: { closedAt: new Date() } });
}

/**
 * Close the ticket with the given channelId
 * @param {Channel} channel
 */
function _closeTicketChannel(channel) {
	const tickets = mongo.db('ticketeer').collection('tickets');

	tickets.updateOne({ channelId: channel.id }, { $set: { closedAt: new Date() } });
}

/**
 * Get the guild's next localId
 * @param {Guild} guild
 * @returns {Number}
 */
function _getLocalId(guild) {
	return mongo.db('ticketeer').collection('tickets').countDocuments({ guildId: guild.id }) + 1;
}

module.exports = {
	createTicket: _createTicket,
	getTickets: _getTickets,
	closeTicket: _closeTicket,
	closeTicketChannel: _closeTicketChannel,
};

/**
 * @typedef {Object} Ticket
 * @property {ObjectId} _id
 * @property {Number} localId
 * @property {String} guildId
 * @property {String} channelId
 * @property {String} authorId
 * @property {String} claimId
 * @property {Date} createdAt
 * @property {Date} closedAt
 */
