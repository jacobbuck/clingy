(function (root, factory) {
	if (typeof define === 'function' && define.amd) {
		// AMD. Register as an anonymous module.
		define([], factory);
	} else {
		// Browser globals
		root.cling = factory();
	}
}(this, function () {

	var win = window,
		doc = document;

	// Utilities

	function between (min, num, max) {
		return Math.max(min, Math.min(max, num));
	}

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

	function indexOf (array, search) {
		if ( array.indexOf ) {
			return array.indexOf(search);
		}
		for (var i = 0, l = array.length; i < l; i++) {
			if (search === array[i]) {
				return i;
			}
		}
		return -1;
	}

	function proxy (fn, context) {
		return function () {
			return fn.apply(context, arguments);
		};
	}

	function throttle ( fn ) {
		var timer = false;
		return function () {
			var c = this, a = arguments;
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

	var optionsDefault     = {from: '', to: '', offset: ''},
		positionMultiplier = {left: 0, top: 0, right: 1, bottom: 1, center: 0.5},

		instances = [];

	var updateAll = throttle(function () {
		var i = instances.length;
		while (i--) {
			instances[i].update();
		}
	});

	function normalizePosition (position) {
		position = position.match(/(left|right|center)\s*(top|bottom|center)?/);
		return [(position[1] || 'center'), (position[2] || 'center')];
	}

	function normalizeOffset (offset) {
		offset = offset.match(/(-?\d+)\s*(-?\d+)?/);
		return [toNumber(offset[1]), toNumber(offset[2])];
	}

	on(win, 'scroll'   , updateAll);
	on(win, 'resize'   , updateAll);
	on(win, 'touchmove', updateAll);

	function Cling (element, target, options) {
		this.e = element;
		this.t = target;
		return this.options(options).enable();
	}

	Cling.prototype = {

		options: function (options) {
			options        = extend(optionsDefault, options);
			options.from   = normalizePosition(options.from);
			options.to     = normalizePosition(options.to);
			options.offset = normalizeOffset(options.offset);
			this.o = options;
			return this;
		},

		update: function () {
			var element = this.e,
				target  = this.t,
				options = this.o,

				elementBounding = element.getBoundingClientRect(),
				targetBounding  = target.getBoundingClientRect(),

				left = 0,
				top  = 0;

			// Target Point
			left += targetBounding.width   * positionMultiplier[options.from[0]];
			top  += targetBounding.height  * positionMultiplier[options.from[1]];

			// Element Point
			left -= elementBounding.width  * positionMultiplier[options.to[0]];
			top  -= elementBounding.height * positionMultiplier[options.to[1]];

			// Target-Element Offset
			left += targetBounding.left - elementBounding.left;
			top  += targetBounding.top  - elementBounding.top;

			// Defined Offset
			left += options.offset[0];
			top  += options.offset[1];

			// Recalculate Position
			left += toNumber(getStyle(element, 'left'));
			top  += toNumber(getStyle(element, 'top'));

			// Set Position
			element.style.left = Math.round(left) + 'px';
			element.style.top  = Math.round(top)  + 'px';

			return this;
		},

		enable: function () {
			if (indexOf(instances, this) < 0) {
				instances.push(this);
				this.e.style.position = 'absolute';
			}
			return this.update();
		},

		disable: function () {
			var index = indexOf(instances, this);
			if (index > -1) {
				instances.splice(index, 1);
				this.e.style.position = this.e.style.top = this.e.style.left = '';
			}
			return this;
		}

	};

	return function (element, target, options) {
		return new Cling(element, target, options);
	};

}));