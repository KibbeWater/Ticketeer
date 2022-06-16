const { PermissionFlagsBits, ApplicationCommandOptionType } = require('discord-api-types/v10');
const {
	CommandInteraction,
	Channel,
	MessageEmbed,
	Interaction,
	MessageActionRow,
	MessageButton,
	TextChannel,
} = require('discord.js');
const utils = require('../private/utils');

const config = require('../config.json');

module.exports = {
	// Required
	name: 'create',
	description: 'Creates a new ticket opening panel',
	args: [
		{
			type: ApplicationCommandOptionType.String,
			name: 'type',
			description: 'The ticket "type" name, will be used as prefix for channel names',
			required: true,
		},
		{
			type: ApplicationCommandOptionType.Channel,
			name: 'category',
			description: 'The category to create tickets under',
			channel_types: [4], // GUILD_CATEGORY
			required: false,
		},
		{
			type: ApplicationCommandOptionType.String,
			name: 'title',
			description: 'The title of the panel embed',
			required: false,
		},
		{
			type: ApplicationCommandOptionType.String,
			name: 'description',
			description: 'Description element for the panel embed',
			required: false,
		},
		{
			type: ApplicationCommandOptionType.Channel,
			name: 'channel',
			description: 'The channel to create the panel in',
			required: false,
		},
	],

	// More optional
	aliases: [],
	dm: false,

	// Run methods
	slashRun: _slashCmdRun,
	textRun: _textRun,
	interaction: _interact,
};

/**
 *
 * @param {CommandInteraction} interaction
 */
function _slashCmdRun(interaction) {
	let o = interaction.options;

	const channel = o.getChannel('channel');

	_run(
		channel || interaction.channel,
		o.getString('type', true),
		o.getChannel('category'),
		o.getString('title'),
		o.getString('description'),
		interaction
	);
}

/**
 *
 * @param {Message} msg Original message
 * @param {Array<String>} args Command arguments
 */
function _textRun(msg, args) {
	let age = parseInt(args[1]);
	if (isNaN(age)) return utils.messages.badUsage(msg, this);

	msg.reply(`Your name is ${args[0]} and you are ${args[1]} years old`);
}

/**
 *
 * @param {TextChannel} channel
 * @param {String} typeName
 * @param {Channel} category
 * @param {String} title
 * @param {String} description
 * @param {CommandInteraction} interaction
 */
function _run(channel, typeName, category, title, description, interaction) {
	title = title || `Open a ${typeName.toLowerCase()} ticket`;
	description = description || 'Open a ticket by clicking the button below';

	const row = new MessageActionRow().addComponents(
		new MessageButton().setCustomId('create_open').setLabel('Open').setStyle('PRIMARY')
	);

	const embed = new MessageEmbed()
		.setTitle(title)
		.setDescription(description)
		.setColor(config.success);

	channel.send({ components: [row], embeds: [embed] });

	if (interaction)
		interaction.reply({ content: 'Created a new panel for you!', ephemeral: true });
}

/**
 *
 * @param {Interaction} interaction
 */
function _interact(interaction) {
	if (!interaction.isButton()) return;
	if (interaction.customId != 'create_open') return;

	interaction.reply({ content: 'Interacted!', ephemeral: true });
}
