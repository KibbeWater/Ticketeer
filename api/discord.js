const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const { User, Client } = require('discord.js');

const rest = new REST({ version: '9' }).setToken(process.env.DISCORD_TOKEN);

/**
 * Get's user from ID
 * @param {Client} client
 * @param {String} id
 * @returns {Promise<User>}
 */
function _getUser(client, id) {
	return client.users.fetch(id);
}

module.exports = {
	getUser: _getUser,
};
