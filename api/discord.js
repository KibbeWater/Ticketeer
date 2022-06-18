const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const { User } = require('discord.js');

const rest = new REST({ version: '9' }).setToken(process.env.DISCORD_TOKEN);

/**
 * Get's user from ID
 * @param {String} id
 * @returns {Promise<User>}
 */
function _getUser(id) {
	return new Promise((resolve, reject) => {
		rest.get(Routes.user(id)).then(resolve).catch(reject);
	});
}

module.exports = {
	getUser: _getUser,
};
