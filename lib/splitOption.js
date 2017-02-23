'use strict';

var WHITESPACE_REGEXP = /\s+/;

module.exports = function splitOption (val) {
	if (typeof val === 'string') {
		return val.split(WHITESPACE_REGEXP)
			.filter(function (v) { return v.trim(); });
	}
	return val;
};
