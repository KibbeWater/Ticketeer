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
const teams = require('../api/teams');
const algorithm = require('../api/algorithm');

const config = require('../config.json');
const { reserveTicket } = require('../api/tickets');

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
			type: ApplicationCommandOptionType.String,
			name: 'team',
			description: 'The team responsible for handling this ticket',
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
async function _slashCmdRun(interaction) {
	let o = interaction.options;

	const channel = o.getChannel('channel');
	const team = o.getString('team');

	await interaction.deferReply({ ephemeral: true });

	teams
		.getGuildTeams(interaction.guild)
		.then((teamCollection) => {
			if (teamCollection.teams.find((t) => t.name.toLowerCase() === team.toLowerCase())) {
				_run(
					channel || interaction.channel,
					team,
					o.getString('type'),
					o.getChannel('category'),
					o.getString('title'),
					o.getString('description'),
					interaction
				);
			} else {
				console.log('Team not found');
				interaction.editReply({
					embeds: [
						new MessageEmbed()
							.setTitle('Invalid Team')
							.setDescription('The team you specified does not exist!')
							.setColor(config.error),
					],
				});
			}
		})
		.catch((err) => {
			console.error(err);
			interaction.editReply({
				embeds: [
					new MessageEmbed()
						.setTitle('Unknown Error')
						.setDescription(
							'An unknown error has occurred, please contact a developer.'
						)
						.setColor(config.error),
				],
			});
		});
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
 * @param {String} teamName
 * @param {String} typeName
 * @param {Channel} category
 * @param {String} title
 * @param {String} description
 * @param {CommandInteraction} interaction
 */
async function _run(channel, teamName, typeName, category, title, description, interaction) {
	title = title || `Open a ${typeName.toLowerCase()} ticket`;
	description = description || 'Open a ticket by clicking the button below';

	const team = (await teams.getGuildTeams(interaction.guild)).teams.find(
		(t) => t.name.toLowerCase() === teamName.toLowerCase()
	);

	const row = new MessageActionRow().addComponents(
		new MessageButton()
			.setCustomId(`create_open-${team.name}`)
			.setLabel('Open')
			.setStyle('PRIMARY')
	);

	const embed = new MessageEmbed()
		.setTitle(title)
		.setDescription(description)
		.setColor(config.success);

	channel.send({ components: [row], embeds: [embed] });

	if (interaction) interaction.editReply({ content: 'Created a new panel for you!' });
}

/**
 *
 * @param {Interaction} interaction
 */
async function _interact(interaction) {
	if (!interaction.isButton()) return;
	if (!interaction.customId.startsWith('create_open')) return;

	await interaction.deferReply({ ephemeral: true });

	const teamName = interaction.customId.split('-')[1];
	const team = (await teams.getGuildTeams(interaction.guild)).teams.find(
		(t) => t.name.toLowerCase() === teamName.toLowerCase()
	);
	if (!team) return interaction.editReply("Couldn't find team, please contact the server owner.");

	const claimant = await algorithm.scoreTeam(interaction.guild, teamName, { vipLevel: 5 }); // This is a string of the user id
	console.log(claimant);
	if (!claimant)
		return interaction.editReply("Couldn't find a claimant, please contact the developer.");

	const claimantMember = interaction.guild.members.fetch(claimant.user);
	if (!claimantMember)
		return interaction.editReply("Couldn't find claimant, please contact the developer.");

	const [ticket, finishReservation, release] = reserveTicket(
		interaction.guild,
		interaction.member,
		claimantMember
	);
	const ticketName = team.name + '-' + ticket.localId;

	interaction.guild.channels
		.create(ticketName, {
			permissionOverwrites: [
				{
					id: interaction.guild.id,
					deny: ['VIEW_CHANNEL'],
				},
				{
					id: claimantMember.id,
					allow: ['VIEW_CHANNEL'],
				},
			],
		})
		.then((channel) => {
			interaction.editReply(`Created a new ticket for you! ${channel}`);
			channel.send({
				embeds: [
					new MessageEmbed()
						.setTitle('Ticket Created')
						.setDescription(
							`Let's get started! Please state your issue and ${claimantMember} will be in touch with you shortly.`
						)
						.setColor(config.success),
				],
			});
			finishReservation(channel);
		})
		.catch((err) => {
			console.error(
				`[Ticketeer] Failed creating ticket on guild ${interaction.guild.id}`,
				err
			);
			release();
		});
}
