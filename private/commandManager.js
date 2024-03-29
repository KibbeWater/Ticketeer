const fs = require('fs');
const path = require('path');
const config = require('../config.json');
const { Client, Interaction } = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { PermissionFlagsBits } = require('discord-api-types/v10');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');

const commandParser = require('./commandParser');
const utils = require('./utils');
const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

var _commands = [];

/**
 * Used for handling interactions
 * @param {Interaction} interaction
 */
function _slashCommandHandler(interaction) {
	if (!interaction.isCommand()) {
		_commands.forEach((cmd) => {
			if (cmd.interaction) cmd.interaction(interaction);
		});
		return;
	}

	const command = _commands.find((cmd) => cmd.name == interaction.commandName);

	if (command == undefined)
		return console.log(`Could not find command '${interaction.commandName}'`);

	command.slashRun(interaction);
}

function _registerCommands() {
	fs.readdirSync('./commands/').forEach((dir) => {
		if (!dir.endsWith('.js')) return;

		// This command will run in another context (?) and therefore needs a different path
		const command = require(path.join('../commands/', dir));

		_commands.push(command);
		console.log('[*] Registered command: ' + command.name);
	});
}

/**
 * Registers slash commands
 * @param {Client} client
 */
async function _registerSlashCommands(client) {
	if (client.application == undefined) {
		console.log('Unable to register slash-commands');
		return;
	}

	client.on('interactionCreate', _slashCommandHandler);

	var commands = client.application.commands;

	for (let i = 0; i < _commands.length; i++) {
		const command = _commands[i];
		if (command.slashRun != undefined) {
			const cmd = {
				name: command.name.toLowerCase(),
				description: command.description,
				options: command.args,
			};

			if (command.dm) cmd.dmPermission = command.dm;
			if (command.permission) cmd.default_member_permissions = Number(command.permission);

			await rest.post(Routes.applicationCommands(client.application.id), {
				body: cmd,
			});

			console.log('[*] Registered Slash-Command: ' + command.name);
		}
	}
}

function _canUseCommand(command, msg) {
	if (command.permission && !msg.member.permissions.has(command.permission))
		return utils.messages.noPermissions(msg);

	if (command.ownerOnly && config.ownerID != msg.member.id)
		return utils.messages.error('Error', 'This is an only-owner command', msg);

	return true;
}

/**
 * Execute a command
 * @param {string} command The command name to search for
 * @param {Object} msg The command message object
 */
async function _executeCommand(command, msg) {
	const commandName = command.toLowerCase();

	const _command = _commands.find((c) => {
		if (c.name.toLowerCase() == commandName) return true;
		if (c.aliases && c.aliases.includes(commandName)) return true;
		return false;
	});

	if (!_command) return;

	if (!_canUseCommand(_command, msg)) return;

	const args = msg.content.split(' ').slice(1).join(' ');
	const parsedArgs = commandParser(args);

	if (_command.args && parsedArgs.length < _command.args.length)
		return utils.messages.badUsage(msg, _command);

	_command.textRun(msg, parsedArgs);
}

module.exports = {
	RegisterCommands: _registerCommands,
	RegisterSlashCommands: _registerSlashCommands,
	ExecuteCommand: _executeCommand,
};
