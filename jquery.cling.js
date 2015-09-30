/*!
 * Cling - Copyright (c) 2015 Jacob Buck
 * https://github.com/jacobbuck/cling
 * Licensed under the terms of the MIT license.
 */
(function (factory) {
	// UMD yo!
	if (typeof define === 'function' && define.amd) {
		define(['jquery'], factory);
	} else {
		factory(window.jQuery);
	}
}(function ($) {
	'use strict';

	// Little jQuery Plugin Bridge

	function bridge ($, namespace, Plugin) {
		$.fn[namespace] = function (options) {
			return this.each(function () {
				var element = $(this);
				var instance = element.data(namespace);
				var isInstance = instance && instance instanceof Plugin;

				if (typeof options === 'string') {
					if (isInstance && $.isFunction(instance[options])) {
						instance[options].apply(instance, [].splice.call(arguments, 1));
					}
				} else if (!isInstance) {
					element.data(namespace, new Plugin(element, options));
				}
			});
		};
	}

	// Utilities

	function constrain (value, min, max) {
		return Math.max(min, Math.min(max, value));
	}

	function domthrottle (fn, context) {
		var timer = false;
		return function () {
			var c = context || this;
			var a = arguments;
			if (false === timer) {
				timer = window.requestAnimationFrame(function () {
					fn.apply(c, a);
					timer = false;
				});
			}
		};
	}

	// Cling

	function Cling (element, options) {
		// Setup options
		options = options || {};
		options.element = element;
		this.options(options);

		// Throttle update method
		this.update = domthrottle(this.update, this);

		// Add position styles, unless already set to `fixed`
		if ('fixed' !== element.css('position')) {
			element.css({
				position: 'absolute'
			});
		}

		element.css({
			left: 0,
			top: 0,
			right: 'auto',
			bottom: 'auto'
		});

		// Listen to scroll or resize on window
		$(window).on('scroll resize touchmove', this.update);

		// Get any scrollable parents of the target, and listen to scroll on them
		var scrollParents = this.s = Cling.getScrollParents(options.target);
		if (scrollParents.length) {
			scrollParents.on('scroll', this.update);
		}

		this.update();
	}

	// Prototype

	Cling.prototype.options = function (options) {
		options = $.extend({}, Cling.DEFAULTS, this.o, options);

		options.element = $(options.element);
		options.target = $(options.target);
		options.within = $(options.within);

		options.from = Cling.normalizePosition(options.from);
		options.to = Cling.normalizePosition(options.to);
		options.offset = Cling.normalizeOffset(options.offset);
		options.collision = Cling.normalizeCollision(options.collision);

		this.o = options;
	};

	Cling.prototype.update = function () {
		var options = this.o;

		var element = options.element;
		var target =  options.target;
		var within = options.within;

		var elementBounding = Cling.getBounding(element);
		var targetBounding = Cling.getBounding(target);

		// Dat Math
		// 1. The target point
		// 2. Subtract the element point
		// 3. Add the difference between the target and element's current position
		// 4. Add our offset
		// 5. Add the current left/top style
		var left = (targetBounding.width * options.from[0]) -
			(elementBounding.width * options.to[0]) +
			(targetBounding.left - elementBounding.left) +
			options.offset[0] +
			element.css('left');

		var top = (targetBounding.height * options.from[1]) -
			(elementBounding.height * options.to[1]) +
			(targetBounding.top - elementBounding.top) +
			options.offset[1] +
			element.css('top');

		if (within) {
			var withinBounding = Cling.getBounding(within);

			if (options.collision[0] == 'fit') {
				left = constrain(
					left,
					withinBounding.left,
					withinBounding.left + withinBounding.width - elementBounding.width
				);
			}

			if (options.collision[1] == 'fit') {
				top = constrain(
					top,
					withinBounding.top,
					withinBounding.top + withinBounding.height - elementBounding.height
				);
			}
		}

		// Set the newly calculated positions
		element.css({
			left: Math.round(left),
			top: Math.round(top)
		});
	};

	Cling.prototype.destroy = function () {
		var element = this.o.element;
		var scrollParents = this.s;

		this.destroyed = true;

		// Remove any applied styles
		element.css({
			position: '',
			left: '',
			top: '',
			right: '',
			bottom: ''
		});

		// Unbind events
		$(window).off('scroll resize touchmove', this.update);

		if (scrollParents.length) {
			scrollParents.off('scroll', this.update);
		}

		element.removeData('cling');
	};

	// Statics

	Cling.DEFAULTS = {
		from: '',
		to: '',
		offset: ''
	};

	Cling.getScrollParents = function (element) {
		return element.parentsUntil('html, body').filter(function () {
			var parent = $(this);
			return /auto|scroll/.test(parent.css('overflow') + parent.css('overflow-x') + parent.css('overflow-y'));
		});
	};


	Cling.normalizeXY = function (input, defaults, filter) {
		var output = [];
		var filtered;
		if (!input) { return defaults; }
		input = input.split(/\W+/);
		for (var i = 0; i <= 1; i++) {
			filtered = filter(input[i+1]);
			output[i] = typeof filtered != 'undefined' ? filtered : (output[i-1] || defaults[i]);
		}
		return output;
	};

	Cling.normalizeCollision = function (collision) {
		return Cling.normalizeXY(collision, ['none', 'none'], function (val) {
			return val == 'fit' ? val : 'none';
		});
	};

	Cling.normalizeOffset = function (offset) {
		return Cling.normalizeXY(offset, [0, 0], function (val) {
			return isFinite(val = parseFloat(val)) ? val : void 0;
		});
	};

	Cling.POSITIONS = {
		left: 0,
		top: 0,
		right: 1,
		bottom: 1,
		center: 0.5
	};

	Cling.normalizePosition = function (position) {
		return Cling.normalizeXY(position, [0.5, 0.5], function (val) {
			if (Cling.POSITIONS.hasOwnProperty(val)) {
				return Cling.POSITIONS[val];
			}
			if (val.match(/\d+(\.\d+)?%/)) {
				return parseFloat(val.slice(0, -1)) / 100;
			}
		});
	};

	Cling.getBounding = function (el) {
		if ($.isWindow(el.get(0))) {
			return {
				left: el.scrollLeft(),
				top: el.scrollTop(),
				width: el.width(),
				height: el.height()
			};
		}

		var offset = el.offset();
		return {
			left: offset.left,
			top: offset.top,
			width: el.outerWidth(),
			height: el.outerHeight()
		};
	};

	// jQuery Plugin

	bridge($, 'cling', Cling);

	return Cling;
}));
