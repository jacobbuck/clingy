(function (root, factory) {
	if (typeof define === 'function' && define.amd) {
		// AMD. Register as an anonymous module.
		define(factory);
	} else {
		// Browser globals
		root.Cling = factory();
	}
}(this, function () {

	var win = window;

	// Utilities

	function extend (target) {
		var o = arguments,
			l = o.length,
			x = 1,
			y;
		for (; x < l; x++) {
			for (y in o[x]) {
				target[y] = o[x][y];
			}
		}
		return target;
	}

	function toNumber (num) {
		return isFinite(num = parseFloat(num)) ? num : 0;
	}

	function throttle (fn, context) {
		var timer = false;
		return function () {
			var c = context || this, a = arguments;
			if (false === timer)
				timer = win.requestAnimationFrame(function () {
					fn.apply(c, a);
					timer = false;
				});
		};
	}

	// DOM Utilities

	function on (element, event, callback) {
		if (element.addEventListener) {
			element.addEventListener(event, callback, false);
		} else if (element.attachEvent) {
			element.attachEvent('on' + event, callback);
		}
	}

	function off (element, event, callback) {
		if (element.removeEventListener) {
			element.removeEventListener(event, callback, false);
		} else if (element.detachEvent) {
			element.detachEvent('on' + event, callback);
		}
	}

	function getStyle (element, property) {
		if (win.getComputedStyle) {
			return win.getComputedStyle(element, null).getPropertyValue(property);
		}
		if (element.currentStyle) {
			return element.currentStyle[property];
		}
	}

	// Cling

	var positionMultiplier = {left: 0, top: 0, right: 1, bottom: 1, center: 0.5};

	function normalizePosition (position) {
		position = position.match(/(left|right|center)\s*(top|bottom|center)?/);
		return position ? [(position[1] || 'center'), (position[2] || position[1] || 'center')] : ['center', 'center'];
	}

	function normalizeOffset (offset) {
		offset = offset.match(/(-?\d+)\s*(-?\d+)?/);
		return offset ? [toNumber(offset[1]), toNumber(offset[2])] : [0, 0];
	}

	function getScrollParent (element) {
		while (element = element.parentNode) {
			if (1 == element.nodeType && /auto|scroll/.test(getStyle(element, 'overflow')+getStyle(element, 'overflow-x')+ getStyle(element, 'overflow-y'))) {
				return element;
			}
		}
	}

	function Cling (element, target, options) {
		this.e = element;
		this.t = target;
		this.update = throttle(this.update, this);
		return this.options(options).enable();
	}

	Cling.prototype = {

		options: function (options) {
			options = extend({from: '', to: '', offset: ''}, options);
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

			var elementBounding = element.getBoundingClientRect();
			var targetBounding = target.getBoundingClientRect();

			// Dat Math
			// 1. The target point
			// 2. Subtract the element point
			// 3. Add the difference between the target and element's current position
			// 4. Add our offset
			// 5. Add the current left/top style -- prevents layout thrashing

			var left = (target.offsetWidth * positionMultiplier[options.from[0]])
			     - (element.offsetWidth * positionMultiplier[options.to[0]])
			     + (targetBounding.left - elementBounding.left)
			     + options.offset[0]
			     + toNumber(getStyle(element, 'left'));

			var top  = (target.offsetHeight * positionMultiplier[options.from[1]])
			     - (element.offsetHeight * positionMultiplier[options.to[1]])
			     + (targetBounding.top - elementBounding.top)
			     + options.offset[1]
			     + toNumber(getStyle(element, 'top'));

			// Set the newly calculated positions

			element.style.left = Math.round(left) + 'px';
			element.style.top  = Math.round(top)  + 'px';

			return this;
		},

		enable: function () {
			var element = this.e;
			var target = this.t;
			var scrollParent = this.s = getScrollParent(target);

			if (!/absolute|fixed/.test(getStyle(element, 'position'))) {
				element.style.position = 'absolute';
				element.style.top = element.style.left = 0;
			}

			on(win, 'scroll', this.update);
			on(win, 'resize', this.update);
			on(win, 'touchmove', this.update);

			if (scrollParent) {
				on(scrollParent, 'scroll', this.update);
			}

			return this.update();
		},

		disable: function () {
			var element      = this.e;
			var scrollParent = this.s;

			element.style.position = element.style.top = element.style.left = '';

			off(win, 'scroll', this.update);
			off(win, 'resize', this.update);
			off(win, 'touchmove', this.update);

			if (scrollParent) {
				off(scrollParent, 'scroll', this.update);
			}

			return this;
		}

	};

	return Cling;

}));