const { Guild, TextChannel, GuildMember, Channel, User } = require('discord.js');
const { ObjectId } = require('mongodb');

const mongo = require('../private/db').getInstance();

/**
 * Create a ticket
 * @param {Guild} guild
 * @param {TextChannel} channel
 * @param {GuildMember} author
 * @param {GuildMember} claimant
 * @returns {Promise<Ticket>}
 */
function _createTicket(guild, channel, author, claimant) {
	return new Promise((resolve, reject) => {
		const tickets = mongo.db('ticketeer').collection('tickets');

		const localId = _getLocalId(guild);

		tickets
			.insertOne({
				localId,
				guildId: guild.id,
				channelId: channel.id,
				authorId: author.id,
				claimId: claimant.id,
				createdAt: new Date(),
			})
			.then(resolve)
			.catch(reject);
	});
}

/**
 * Reserve a ticket's localId for a guild
 * @param {Guild} guild
 * @param {GuildMember} author
 * @param {GuildMember} claimant
 * @returns {Array<Ticket, Function, Function>} [reserve, release]
 */
async function _reserveTicket(guild, author, claimant) {
	const tickets = mongo.db('ticketeer').collection('tickets');

	const localId = _getLocalId(guild);

	const reservedTicket = await tickets.insertOne({
		localId,
		guildId: guild.id,
		authorId: author.id,
		claimId: claimant.id,
		createdAt: new Date(),
	});

	return [
		reservedTicket,
		(channel) => {
			// Callback for finishing the reservation
			reservedTicket.channelId = channel.id;
			tickets.updateOne({ _id: reservedTicket._id }, { $set: { channelId: channel.id } });
		},
		() => {
			// Callback for cancelling the reservation
			tickets.deleteOne({ _id: reservedTicket._id });
		},
	];
}

/**
 * Get the tickets for a guild
 * @param {Guild} guild
 * @returns {Promise<Array<Ticket>>}
 */
function _getTickets(guild) {
	const tickets = mongo.db('ticketeer').collection('tickets');

	// get the latest ticket with the guildId of the guild
	return tickets.find({ guildId: guild.id }).toArray();
}

/**
 * Get the tickets for a guild's user
 * @param {Guild} guild
 * @param {User} user
 * @returns {Promise<Array<Ticket>>}
 */
function _getUserTickets(guild, user) {
	const tickets = mongo.db('ticketeer').collection('tickets');

	return tickets.find({ guildId: guild.id, claimId: user.id }).toArray();
}

/**
 * Get the tickets for a guild
 * @param {Guild} guild
 * @returns {Promise<Array<Ticket>>}
 */
function _getGuildTickets(guild) {
	const tickets = mongo.db('ticketeer').collection('tickets');

	return tickets.find({ guildId: guild.id }).toArray();
}

/**
 * Get the ticket with the given id
 * @param {Guild} guild
 * @param {Number} localId
 */
async function _getTicket(guild, localId) {
	const tickets = mongo.db('ticketeer').collection('tickets');

	return await tickets.findOne({ guildId: guild.id, localId });
}

/**
 * Close the ticket with the given id
 * @param {ObjectId} id
 */
function _closeTicket(id) {
	const tickets = mongo.db('ticketeer').collection('tickets');

	tickets.updateOne({ _id: id }, { $set: { closedAt: new Date() } }).catch((err) => {
		console.error('[Ticketeer] Error closing ticket:', err);
	});
}

/**
 * Close the ticket with the given channelId
 * @param {Channel} channel
 */
function _closeTicketChannel(channel) {
	const tickets = mongo.db('ticketeer').collection('tickets');

	tickets
		.updateOne({ channelId: channel.id }, { $set: { closedAt: new Date() } })
		.catch((err) => {
			console.error('[Ticketeer] Error closing ticket:', err);
		});
}

/**
 * Get the guild's next localId
 * @param {Guild} guild
 * @returns {Number}
 */
async function _getLocalId(guild) {
	return (
		(await mongo.db('ticketeer').collection('tickets').countDocuments({ guildId: guild.id })) +
		1
	);
}

module.exports = {
	createTicket: _createTicket,
	reserveTicket: _reserveTicket,
	getTickets: _getTickets,
	getUserTickets: _getUserTickets,
	getGuildTickets: _getGuildTickets,
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
