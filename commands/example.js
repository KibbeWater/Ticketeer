const { PermissionFlagsBits } = require('discord-api-types/v10');

module.exports = {
	// Top level
	name: 'example',
	description: 'example description',
	usage: '(name) ',
	args: 2,

	// More optional
	permission: PermissionFlagsBits.Administrator,
	dm: true,

	// Run methods
	slashRun: _slashCmdRun,

	textRun: _textRun,
};

function _slashCmdRun(interaction) {}

function _textRun(args) {}
