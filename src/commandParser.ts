/**
 * Parses arguments from a string
 * @param {string} args The string that contains the arguments
 */
export function commandParser(args: string) {
	const regex = /[^\s"]+|"([^"]*)"/gi;
	let match;
	let argsArr = [];

	while ((match = regex.exec(args)) !== null) {
		argsArr.push(match[1] ? match[1] : match[0]);
	}

	return argsArr;
}
