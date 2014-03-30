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

	var optionsDefault     = {from: '', to: '', offset: ''},
		positionMultiplier = {left: 0, top: 0, right: 1, bottom: 1, center: 0.5},

		instances = [];

	function normalizePosition (position) {
		position = position.match(/(left|right|center)\s*(top|bottom|center)?/);
		return [(position[1] || 'center'), (position[2] || 'center')];
	}

	function normalizeOffset (offset) {
		offset = offset.match(/(-?\d+)\s*(-?\d+)?/);
		return [toNumber(offset[1]), toNumber(offset[2])];
	}

	function getScrollParent (element) {
		while (element = element.parentNode) {
			if (1 == element.nodeType && /auto|scroll/.test(getStyle(element, 'overflow')+getStyle(element, 'overflow-x')+ getStyle(element, 'overflow-y'))) {
				return element;
			}
		}
	}

	function updateAll () {
		var i = instances.length;
		while (i--) {
			instances[i].update();
		}
	}

	on(win, 'scroll'   , updateAll);
	on(win, 'resize'   , updateAll);
	on(win, 'touchmove', updateAll);

	function Cling (element, target, options) {
		this.e = element;
		this.t = target;
		this.update = throttle(this.update, this);
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

				left = (target.offsetWidth * positionMultiplier[options.from[0]])  // target point
				     - (element.offsetWidth * positionMultiplier[options.to[0]])   // element point
				     + (targetBounding.left - elementBounding.left)                // target-element offset
				     + options.offset[0]                                           // defined offset
				     + toNumber(getStyle(element, 'left')),                        // recalculate position

				top  = (target.offsetHeight * positionMultiplier[options.from[1]]) // target point
				     - (element.offsetHeight * positionMultiplier[options.to[1]])  // element point
				     + (targetBounding.top - elementBounding.top)                  // target-element offset
				     + options.offset[1]                                           // defined offset
				     + toNumber(getStyle(element, 'top'));                         // recalculate position

			element.style.left = Math.round(left) + 'px';
			element.style.top  = Math.round(top)  + 'px';

			return this;
		},

		enable: function () {
			var element      = this.e,
				target       = this.t,
				scrollParent = this.s = getScrollParent(target);
			if (indexOf(instances, this) < 0) {
				instances.push(this);
			}
			if (!/absolute|fixed/.test(getStyle(element, 'position'))) {
				element.style.position = 'absolute';
				element.style.top = element.style.left = 0;
			}
			if (scrollParent) {
				on(scrollParent, 'scroll', this.update);
			}
			return this.update();
		},

		disable: function () {
			var element      = this.e,
				scrollParent = this.s,
				index = indexOf(instances, this);
			if (index > -1) {
				instances.splice(index, 1);
			}
			element.style.position = element.style.top = element.style.left = '';
			if (scrollParent) {
				off(scrollParent, 'scroll', this.update);
			}
			return this;
		}

	};

	return function (element, target, options) {
		return new Cling(element, target, options);
	};

}));