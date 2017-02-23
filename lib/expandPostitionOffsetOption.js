var POSITION_KEYWORD_MULTIPLIERS = {
	left: 0,
	top: 0,
	right: 1,
	bottom: 1,
	center: 0.5,
	middle: 0.5
};

var PERCENT_MULTIPLIER = 0.01;

var EXPAND_OFFSET_REXEXP = /^([a-z]+|[0-9]+%)([+-][0-9]+)?$/;

module.exports = function expandPostitionOffsetOption (val) {
	var matches = EXPAND_OFFSET_REXEXP.exec(val.trim());
	var position;
	var offset;

	if (POSITION_KEYWORD_MULTIPLIERS.hasOwnProperty(matches[1])) {
		position = POSITION_KEYWORD_MULTIPLIERS[matches[1]];
	} else {
		position = parseInt(matches[1]) * PERCENT_MULTIPLIER;
	}

	if (matches[2]) {
		offset = parseInt(matches[2]);
	}

	offset = offset || 0;

	return {
		position: position,
		offset: offset
	};
};
