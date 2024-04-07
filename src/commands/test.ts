import { ApplicationCommandOptionType, CommandInteraction, Message } from 'discord.js';
import { defineCommand, utils } from '../utils';
import { SlashCommandFunction, TextCommandFunction } from '../types/Command';

const _slashCommand: SlashCommandFunction = async (interaction) => {
	interaction.reply({
		content: `Your name is ${interaction.options.get('name')} and you are ${interaction.options.get('age')} years old`,
		ephemeral: true,
	});
};

const _textCommand: TextCommandFunction = async (msg, args) => {
	let age = parseInt(args[1]);
	if (isNaN(age)) {
		utils.messages.badUsage(msg, command);
		return;
	}
	msg.reply(`Your name is ${args[0]} and you are ${args[1]} years old`);
};

const command = defineCommand({
	// Required
	name: 'test',
	description: 'test description',
	args: [
		{
			type: ApplicationCommandOptionType.String,
			name: 'name',
			description: 'Your name',
			required: true,
		},
		{
			type: ApplicationCommandOptionType.Number,
			name: 'age',
			description: 'Your age',
			required: true,
		},
	],

	permissions: [],

	// More optional
	aliases: [],
	dm: false,

	// Run methods
	slashRun: _slashCommand,
	textRun: _textCommand,
});

export default command;
