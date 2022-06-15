/**
 * Parses arguments from a string
 * @param {string} args The string that contains the arguments
 */
function _parse(args) {
	var argsArr = [];

	let curArg = '';
	let ignoringWhitespace = false;
	let endCharacter = '';
	for (let i = 0; i < args.length; i++) {
		const char = args[i];
		if ((char == '"' || char == "'") && !endCharacter) {
			ignoringWhitespace = true;
			endCharacter = char;
		} else {
			if (char == ' ') {
				if (!ignoringWhitespace) {
					if (curArg != '') {
						argsArr.push(curArg);
						curArg = '';
					}
				} else {
					curArg += char;
				}
			} else {
				if (char == endCharacter) {
					argsArr.push(curArg);
					curArg = '';
					endCharacter = '';
					ignoringWhitespace = false;
				} else {
					curArg += char;
				}
			}
		}
	}

	if (curArg != '') argsArr.push(curArg);

	return argsArr;
}

module.exports = _parse;
