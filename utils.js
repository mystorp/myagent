var config = require('./config');

var currentDebugLevel = config.debug === true ? 0 : config.debug;
if(typeof currentDebugLevel !== "number") {
	currentDebugLevel = 0;
}

exports.debug = debug;

function debug(level, msg) {
	if(typeof level === "string") {
		msg = level;
		level = 0;
	}
	if(level >= currentDebugLevel) {
		console.log(msg);
	}
}