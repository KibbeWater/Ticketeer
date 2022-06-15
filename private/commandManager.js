const commandParser = require('./commandParser');

var _commands = [];

function _registerCommands() {
	fs.readdirSync('./commands/').forEach((dir) => {
		if (!dir.endsWith('.js')) return;

		// This command will run in another context (?) and therefore needs a different path
		const command = require(path.join('../commands/', dir));

		_commands.push(command);
		console.log('[*] Registered command: ' + command.name);
	});
}
