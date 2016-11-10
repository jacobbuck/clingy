var assign = require('object-assign');
var clamp = require('math-clamp');
var domThrottle = require('dom-throttle');
var getStyleProperty = require('desandro-get-style-property');
var getBounding = require('./getBounding');
var getComputedStyleValue = require('./getComputedStyleValue');
var getScrollParents = require('./getScrollParents');
var expandPostitionOffsetOption = require('./expandPostitionOffsetOption');
var splitOption = require('./splitOption');

var TRANSFORM_PROP = getStyleProperty('transform');

var OPTIONS_DEFAULT = {
	from: ['center', 'center'],
	to: ['center', 'center'],
	collision: ['none', 'none'],
	within: null,
	window: window,
	gpu: true
};

module.exports = function cling (fromEl, toEl, options) {
	// Normalize options
	options = assign({}, OPTIONS_DEFAULT, options);
	var fromOption = splitOption(options.from).map(expandPostitionOffsetOption);
	var toOption = splitOption(options.to).map(expandPostitionOffsetOption);
	var collisionOption = splitOption(options.collision);
	var within = options.within;
	var useTransform = options.gpu && TRANSFORM_PROP;

	// Window to bind events to
	var window = options.window;

	// To prevent multiply destroys
	var destroyed = false;

	// Cached fromEl top and left position styles
	var fromElPositionCache = { left: 0, top: 0 };

	// Get any scrollable parents of the toEl for listening to scroll events
	var scrollParents = getScrollParents(toEl);

	// Add `position: absolute;` style, unless already `position: fixed;`
	if (getComputedStyleValue(fromEl, 'position') !== 'fixed') {
		fromEl.style.position = 'absolute';
	}

	// Apply initial positioning styles
	assign(fromEl.style, {
		left: 0,
		top: 0,
		right: 'auto',
		bottom: 'auto',
		transform: ''
	});

	var destroy = function () {
		// Destroy can only happen once
		if (destroyed) return false;
		destroyed = true;

		// Cancel any queued positionings
		position.cancel();

		// Reset styles
		assign(fromEl.style, {
			position: '',
			left: '',
			top: '',
			right: '',
			bottom: '',
			transform: ''
		});

		// Unbind events
		window.removeEventListener('load', position, false);
		window.removeEventListener('scroll', position, false);
		window.removeEventListener('resize', position, false);
		window.removeEventListener('touchmove', position, false);

		if (scrollParents.length) {
			scrollParents.forEach(function (el) {
				el.removeEventListener('scroll', position, false);
			})
		}

		return true;
	};

	var position = domThrottle(function () {
		if (destroyed) return;

		var fromElBounding = getBounding(fromEl);
		var toElBounding = getBounding(toEl);
		var withinBounding;

		if (within) {
			withinBounding = getBounding(within);
		}

		var newPositions = [
			{ axis: 'left', size: 'width' },
			{ axis: 'top', size: 'height' }
		].reduce(function (newPositions, o, i) {
			var axis = o.axis;
			var size = o.size;

			// Dat Math
			// 1. The toEl point
			// 2. Subtract the fromEl point
			// 3. Add the difference between the toEl and fromEl's current position
			// 4. Add our offset
			// 5. Add the current left/top style
			var newPosition =
				(toElBounding[size] * fromOption[i].position) - // 1
				(fromElBounding[size] * toOption[i].position) + // 2
				(toElBounding[axis] - fromElBounding[axis]) + // 3
				fromOption[i].offset + toOption[i].offset + // 4
				fromElPositionCache[axis]; // 5

			// Optionally fit inside within element
			if (within && collisionOption[i] === 'fit') {
				newPosition = clamp(
					newPosition,
					withinBounding[axis],
					withinBounding[axis] + withinBounding[size] - fromElBounding[size]
				);
			}

			// Set and cache the newly calculated position.
			// Round the values to prevent sub-pixel issues.
			newPosition = fromElPositionCache[axis] = Math.round(newPosition);

			// Append 'px' for styles
			newPositions[axis] = newPosition + 'px';
			return newPositions;
		}, {});

		// Apply the positions
		if (useTransform) {
			fromEl.style[TRANSFORM_PROP] = 'translateX(' + newPositions.left + ') translateY(' + newPositions.top + ') translateZ(0)';
		} else {
			assign(fromEl.style, newPositions);
		}
	});

	// Listen to load, scroll or resize on window
	window.addEventListener('load', position, false);
	window.addEventListener('scroll', position, false);
	window.addEventListener('resize', position, false);
	window.addEventListener('touchmove', position, false);

	// Listen to scroll on scrollable parents
	if (scrollParents.length) {
		scrollParents.forEach(function (el) {
			el.addEventListener('scroll', position, false);
		})
	}

	// Initial positioning
	position();

	return {
		destroy: destroy,
		forceUpdate: position,
		isDestroyed: function () { return destroyed; }
	};
};
