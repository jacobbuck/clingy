(function (root, factory) {
	if (typeof define === 'function' && define.amd) {
		// AMD. Register as an anonymous module.
		define(['jquery'], factory);
	} else {
		// Browser globals
		factory(window.jQuery);
	}
}(this, function ($) {

	// Utilities

	function toNumber (num) {
		return isFinite(num = parseFloat(num)) ? num : 0;
	}

	function throttle (fn, context) {
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

	var positionMultiplier = {
		left: 0,
		top: 0,
		right: 1,
		bottom: 1,
		center: 0.5
	};

	var positionRegExp = /(left|right|center|\d+%)\s*(top|bottom|center|\d+%)/;

	function normalizePosition (position) {
		var normalized = [0.5, 0.5];

		position = positionRegExp.exec(position);

		for (var i = 1; i <= 2; i++) {
			if (!position[i]) {
				continue;
			} else if (positionMultiplier.hasOwnProperty(position[i])) {
				normalized[i - 1] = positionMultiplier[position[i]];
			} else if ('%' == position[i].substr(-1, 1)) {
				normalized[i - 1] = toNumber(position[i]);
			}
		}

		return normalized;
	}

	var offsetRegExp = /(-?\d+)\s*(-?\d+)?/;

	function normalizeOffset (offset) {
		var normalized = [0, 0];

		offset = offsetRegExp.exec(offset);

		for (var i = 1; i <= 2; i++) {
			if (offset[i]) {
				normalized[i - 1] = toNumber(offset[i]);
			}
		}

		return normalized;
	}

	function getScrollParents (element) {
		while (element = element.parent()) {
			if (/auto|scroll/.test(element.css('overflow') + element.css('overflow-x') + element.css('overflow-y'))) {
				return element;
			}
		}
	}

	function Cling (element, target, options) {
		if (!(this instanceof Cling)) {
			return new Cling(element, target, options);
		}

		// Throttle update method
		this.update = throttle(this.update, this);

		// Setup options
		this.e = element;
		this.t = target;
		this.options(options);

		// Add position styles if not already `absolute` or `fixed`
		if (!/absolute|fixed/.test(element.css('position'))) {
			element.css({
				position: 'absolute',
				left: 0,
				top: 0
			});
		}

		// Listen to scroll or resize on window
		$(window).on('scroll resize touchmove', this.update);

		// Get any scrollable parents, and listen for it scrolling
		var scrollParents = this.s = getScrollParents(target);
		if (scrollParents) {
			scrollParents.on('scroll', this.update);
		}

		// Store instance
		element.data('cling', this);

		return this.update();
	}

	Cling.prototype = {

		defaults: {
			from: '',
			to: '',
			offset: ''
		},

		options: function (options) {
			options = $.extend(this.defaults, options);
			options.from = normalizePosition(options.from);
			options.to = normalizePosition(options.to);
			options.offset = normalizeOffset(options.offset);
			this.o = options;
			return this;
		},

		update: function () {
			var element = this.e;
			var target = this.t;
			var options = this.o;

			var elementBounding = element.get(0).getBoundingClientRect();
			var targetBounding = target.get(0).getBoundingClientRect();

			// Dat Math
			// 1. The target point
			// 2. Subtract the element point
			// 3. Add the difference between the target and element's current position
			// 4. Add our offset
			// 5. Add the current left/top style -- prevents layout thrashing
			var left = (target.outerWidth() * options.from[0]) -
				(element.outerWidth() * options.to[0]) +
				(targetBounding.left - elementBounding.left) +
				options.offset[0] +
				toNumber(element.css('left'));

			var top = (target.outerHeight() * options.from[1]) -
				(element.outerHeight() * options.to[1]) +
				(targetBounding.top - elementBounding.top) +
				options.offset[1] +
				toNumber(element.css('top'));

			// Set the newly calculated positions
			element.css({
				left: Math.round(left),
				top: Math.round(top)
			});

			return this;
		},

		destroy: function () {
			// Remove any applied styles
			this.e.css({
				position: '',
				left: '',
				top: ''
			});

			// Remove events
			$(window).off('scroll resize touchmove', this.update);

			if (this.s) {
				this.s.off('scroll', this.update);
			}

			// Remove stored instance
			element.removeData('cling');
		}

	};

	$.fn.extend({
		cling: function (target, options) {
			target = $(target);

			return this.each(function () {
				var element = $(this);
				var instance = element.data('cling');

				if (instance instanceof Cling) {
					if ($.isFunction(instance[target])) {
						instance[target](options);
					}
				} else {
					Cling(element, target, options);
				}
			});
		}
	});

}));