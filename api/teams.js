const { Guild, GuildManager, GuildMember } = require('discord.js');

const mongo = require('../private/db').getInstance();

// Teams: guildId: BigInt, Teams: Array<Team>
// Team: Supervisors: Array<BigInt>, Members: Array<BigInt>

function _createTeam(guild, name) {
	return new Promise((resolve, reject) => {
		const teams = mongo.db('ticketeer').collection('teams');

		_getGuildTeams(guild)
			.then((team) => {
				team.teams.push({
					name,
					supervisors: [],
					members: [],
				});

				teams
					.updateOne({ guildId: guild.id }, { $set: { teams: team.teams } })
					.catch(reject);
			})
			.catch(reject);
	});
}

/**
 * Get the guild's team collection
 * @param {Guild} guild
 * @returns {Promise<Teams>}
 */
function _getGuildTeams(guild) {
	// If a guild has a collection of teams, return it, otherwise, create and return
	return new Promise((resolve, reject) => {
		const teams = mongo.db('ticketeer').collection('teams');

		teams
			.findOne({ guildId: guild.id })
			.then((team) => {
				if (team) resolve(team);
				else
					teams.insertOne({
						guildId: guild.id,
						teams: [],
					});
			})
			.catch(reject);
	});
}

/**
 * Add a member to a team
 * @param {Guild} guild
 * @param {String} team
 * @param {GuildMember} member
 */
function _teamAdd(guild, team, member) {
	const teamCollection = mongo.db('ticketeer').collection('teams');

	_getGuildTeams(guild)
		.then((teams) => {
			teams.teams.find((t) => t.name === team).members.push(member.id);

			teamCollection.updateOne({ guildId: guild.id }, { $set: { teams: teams.teams } });
		})
		.catch((err) => console.error('[Ticketeer] Error adding member to team:', err));
}

/**
 * Add a supervisor member to a team
 * @param {Guild} guild
 * @param {String} team
 * @param {GuildMember} member
 */
function _teamAddSupervisor(guild, team, member) {
	const teamCollection = mongo.db('ticketeer').collection('teams');

	_getGuildTeams(guild)
		.then((teams) => {
			teams.teams.find((t) => t.name === team).supervisors.push(member.id);

			teamCollection.updateOne({ guildId: guild.id }, { $set: { teams: teams.teams } });
		})
		.catch((err) => console.error('[Ticketeer] Error adding member to team:', err));
}

/**
 * Remove a member from a team
 * @param {Guild} guild
 * @param {String} teamName
 * @param {GuildManager} member
 */
function _teamRemove(guild, teamName, member) {
	const teamCollection = mongo.db('ticketeer').collection('teams');

	_getGuildTeams(guild)
		.then((teams) => {
			const team = teams.teams.find((t) => t.name === teamName);

			if (team) {
				team.members = team.members.filter((m) => m !== member.id);

				teamCollection.updateOne({ guildId: guild.id }, { $set: { teams: teams.teams } });
			}
		})
		.catch((err) => console.error('[Ticketeer] Error removing member from team:', err));
}

/**
 * Remove a supervisor member from a team
 * @param {Guild} guild
 * @param {string} teamName
 * @param {GuildManager} member
 * @returns {Promise<void>}
 */
function _teamRemoveSupervisor(guild, teamName, member) {
	const teamCollection = mongo.db('ticketeer').collection('teams');

	_getGuildTeams(guild)
		.then((teams) => {
			const team = teams.teams.find((t) => t.name === teamName);

			if (team) {
				team.supervisors = team.supervisors.filter((m) => m !== member.id);

				teamCollection.updateOne({ guildId: guild.id }, { $set: { teams: teams.teams } });
			}
		})
		.catch((err) => console.error('[Ticketeer] Error removing supervisor from team:', err));
}

/**
 * Promote a member from a team
 * @param {Guild} guild
 * @param {String} teamName
 * @param {GuildMember} member
 */
function _promoteMember(guild, teamName, member) {
	const teamCollection = mongo.db('ticketeer').collection('teams');

	_getGuildTeams(guild)
		.then((teams) => {
			const team = teams.teams.find((t) => t.name === teamName);

			if (team && team.members.includes(member.id)) {
				team.members = team.members.filter((m) => m !== member.id);
				team.supervisors.push(member.id);
			}
		})
		.catch((err) => console.error('[Ticketeer] Error promoting member to team:', err));
}

/**
 * Demote a member from a team
 * @param {Guild} guild
 * @param {String} teamName
 * @param {GuildMember} member
 */
function _demoteMember(guild, teamName, member) {
	const teamCollection = mongo.db('ticketeer').collection('teams');

	_getGuildTeams(guild)
		.then((teams) => {
			const team = teams.teams.find((t) => t.name === teamName);

			if (team && team.supervisors.includes(member.id)) {
				team.supervisors = team.supervisors.filter((m) => m !== member.id);
				team.members.push(member.id);
			}
		})
		.catch((err) => console.error('[Ticketeer] Error demoting member from team:', err));
}

module.exports = {
	createTeam: _createTeam,
	getGuildTeams: _getGuildTeams,
	teamAdd: _teamAdd,
	teamAddSupervisor: _teamAddSupervisor,
	teamRemove: _teamRemove,
	teamRemoveSupervisor: _teamRemoveSupervisor,
	promoteMember: _promoteMember,
	demoteMember: _demoteMember,
};

/**
 * @typedef {Object} Teams
 * @property {String} guildId
 * @property {Array<Team>} teams
 */

/**
 * @typedef {Object} Team
 * @property {String} name
 * @property {Array<String>} supervisors
 * @property {Array<String>} members
 */
