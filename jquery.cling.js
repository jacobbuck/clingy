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

	function normalizePosition (position) {
		position = position.match(/(left|right|center)\s*(top|bottom|center)?/);
		return position ? [(position[1] || 'center'), (position[2] || position[1] || 'center')] : ['center', 'center'];
	}

	function normalizeOffset (offset) {
		offset = offset.match(/(-?\d+)\s*(-?\d+)?/);
		return offset ? [toNumber(offset[1]), toNumber(offset[2])] : [0, 0];
	}

	function getScrollParent (element) {
		while (element = element.parent()) {
			if (/auto|scroll/.test(element.css('overflow') + element.css('overflow-x') + element.css('overflow-y'))) {
				return element;
			}
		}
	}

	function Cling (element, target, options) {
		this.e = element;
		this.t = target;
		this.update = throttle(this.update, this);
		return this.options(options).initialize();
	}

	Cling.prototype = {

		defaults: {
			from: '',
			to: '',
			offset: ''
		},

		initialize: function () {
			var element = this.e;
			var target = this.t;
			var scrollParent = this.s = getScrollParent(target);

			if (!/absolute|fixed/.test(element.css('position'))) {
				element.css({
					position: 'absolute',
					left: 0,
					top: 0
				});
			}

			$(window).on('scroll resize touchmove', this.update);

			if (scrollParent) {
				scrollParent.on('scroll', this.update);
			}

			return this.update();
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

			var left = (target.outerWidth() * positionMultiplier[options.from[0]]) -
				(element.outerWidth() * positionMultiplier[options.to[0]]) +
				(targetBounding.left - elementBounding.left) +
				options.offset[0] +
				toNumber(element.css('left'));

			var top = (target.outerHeight() * positionMultiplier[options.from[1]]) -
				(element.outerHeight() * positionMultiplier[options.to[1]]) +
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
			this.e.css({
				position: '',
				left: '',
				top: ''
			});

			$(window).off('scroll resize touchmove', this.update);

			if (this.s) {
				this.s.off('scroll', this.update);
			}

			return this;
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
					element.data('cling', new Cling(element, target, options));
				}
			});
		}
	});

}));