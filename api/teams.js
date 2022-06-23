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
