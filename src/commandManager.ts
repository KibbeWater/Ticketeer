import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v10';
import { Client, Interaction, Message, Utils } from 'discord.js';
import { readdirSync } from 'fs';
import path from 'path';

import { env } from './api/env';
import type { Command } from './types/Command';
import { utils } from './utils';
import { commandParser } from './commandParser';

const rest = new REST({ version: '10' }).setToken(env.DISCORD_TOKEN);

var _commands: Command[] = [];

/**
 * Used for handling interactions
 * @param {Interaction} interaction
 */
function _slashCommandHandler(interaction: Interaction) {
	if (!interaction.isCommand()) {
		_commands.forEach((cmd) => {
			if (cmd.interaction) cmd.interaction(interaction);
		});
		return;
	}

	const command = _commands.find((cmd) => cmd.name == interaction.commandName);

	if (command == undefined) return console.log(`Could not find command '${interaction.commandName}'`);

	command.slashRun(interaction);
}

export function RegisterCommands() {
	readdirSync('./commands/').forEach((dir) => {
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
export async function RegisterSlashCommands(client: Client) {
	if (!client.application) {
		console.log('Unable to register slash-commands');
		return;
	}

	client.on('interactionCreate', _slashCommandHandler);

	_commands.forEach(async (command) => {
		if (!command.slashRun) return;
		const cmd: any = {
			name: command.name.toLowerCase(),
			description: command.description,
			options: command.args,
		};

		if (command.dm) cmd.dmPermission = command.dm;
		if (command.permissions) cmd.default_member_permissions = command.permissions.reduce((a, b) => a & b).toString();

		await rest.post(Routes.applicationCommands(client.application!.id), {
			body: cmd,
		});

		console.log('[*] Registered Slash-Command: ' + command.name);
	});
}

function _canUseCommand(command: Command, msg: Message) {
	if (command.permissions && !msg.member?.permissions.has(command.permissions)) return utils.messages.noPermissions(msg);

	if (command.ownerOnly && env.OWNER_ID != msg.member?.id) return utils.messages.error('Error', 'This is an only-owner command', msg);

	return true;
}

/**
 * Execute a command
 * @param {string} command The command name to search for
 * @param {Object} msg The command message object
 */
export async function ExecuteCommand(command: string, msg: Message) {
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

	if (_command.args && parsedArgs.length < _command.args.length) return utils.messages.badUsage(msg, _command);

	_command.textRun(msg, parsedArgs);
}
