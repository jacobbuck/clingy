var getStyleProperty = require('desandro-get-style-property');
var domThrottle = require('dom-throttle');
var assign = require('lodash/assign');
var clamp = require('lodash/clamp');
var throttle = require('lodash/throttle');
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
	delay: 100,
	gpu: true
};

var WINDOW_UPDATE_EVENTS = ['load', 'scroll', 'resize', 'touchmove'];

module.exports = function cling (fromEl, toEl, options) {
	// Normalize options
	options = assign({}, OPTIONS_DEFAULT, options);
	var fromOption = splitOption(options.from).map(expandPostitionOffsetOption);
	var toOption = splitOption(options.to).map(expandPostitionOffsetOption);
	var collisionOption = splitOption(options.collision);
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
		left: '0px',
		top: '0px',
		right: 'auto',
		bottom: 'auto',
		transform: ''
	});

	function destroy () {
		// Destroy can only happen once
		if (destroyed) return;
		destroyed = true;

		// Cancel any queued positionings
		throttledPosition.cancel();
		applyPosition.cancel();

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
		WINDOW_UPDATE_EVENTS.forEach(function (eventName) {
			window.removeEventListener(eventName, position, false);
		});

		window.removeEventListener('unload', destroy, false);

		if (scrollParents.length) {
			scrollParents.forEach(function (el) {
				el.removeEventListener('scroll', position, false);
			});
		}
	}

	function position () {
		if (destroyed) return;

		var fromElBounds = getBounding(fromEl);
		var toElBounds = getBounding(toEl);
		var offsetElBounds;
		var withinBounds;

		if (options.within) {
			if (offsetParent) {
				offsetElBounds = getBounding(offsetParent);
			}
			withinBounds = getBounding(options.within);
		}

		var newPositions = [
			{ axis: 'left', size: 'width' },
			{ axis: 'top', size: 'height' }
		].reduce(function (newPositions, o, i) {
			var axis = o.axis;
			var size = o.size;

			// Dat Math
			// 1. Add the toEl point
			// 2. Subtract the fromEl point
			// 3. Add the difference between the toEl and fromEl's current position
			// 4. Add our offset
			// 5. Add the current left/top style
			var newPosition =
				(toElBounds[size] * toOption[i].position) - // 1
				(fromElBounds[size] * fromOption[i].position) + // 2
				(toElBounds[axis] - fromElBounds[axis]) + // 3
				fromOption[i].offset + toOption[i].offset + // 4
				fromElPositionCache[axis]; // 5

			// Optionally fit inside within element
			if (withinBounds && collisionOption[i] === 'fit') {
				var withinOffset = offsetElBounds ? offsetElBounds[axis] : 0;
				var withinMin = withinBounds[axis] - withinOffset;
				var withinMax = withinMin + withinBounds[size] - fromElBounds[size];
				newPosition = clamp(newPosition, withinMin, withinMax);
			}

			// Round the values to prevent sub-pixel issues.
			newPositions[axis] = Math.round(newPosition);
			return newPositions;
		}, {});

		// Only apply the positions if changed
		if (
			newPositions.left !== fromElPositionCache.left ||
			newPositions.top !== fromElPositionCache.top
		) {
			applyPositionStyles(newPositions.left, newPositions.top);
			// Cache the newly calculated position.
			fromElPositionCache = newPositions;
		}
	}

	var applyPositionStyles = domThrottle(function (left, top) {
		if (useTransform) {
			fromEl.style[TRANSFORM_PROP] = 'translateX(' + left + 'px) translateY(' + top + 'px) translateZ(0)';
		} else {
			fromEl.style.left = left + 'px';
			fromEl.style.top = top + 'px';
		}
	});

	var throttledPosition = throttle(position, options.delay);

	// Listen to load, scroll or resize on window
	WINDOW_UPDATE_EVENTS.forEach(function (eventName) {
		window.addEventListener(eventName, throttledPosition, false);
	});

	// Automatically destroy on window unload
	window.addEventListener('unload', destroy, false);

	// Listen to scroll on scrollable parents
	if (scrollParents.length) {
		scrollParents.forEach(function (el) {
			el.addEventListener('scroll', throttledPosition, false);
		});
	}

	// Initial positioning
	position();

	return {
		destroy: destroy,
		forceUpdate: position,
		isDestroyed: function () { return destroyed; }
	};
};
