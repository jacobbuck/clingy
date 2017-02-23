'use strict';

module.exports = function getComputedStyleValue (el, prop) {
	return window.getComputedStyle(el, null).getPropertyValue(prop);
};
