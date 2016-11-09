module.exports = function getBounding (el) {
	if (el === el.window) {
		return {
			left: el.pageXOffset,
			top: el.pageYOffset,
			width: el.innerWidth,
			height: el.innerHeight
		};
	}

	var bounding = el.getBoundingClientRect();
	return {
		left: bounding.left,
		top: bounding.top,
		width: bounding.right - bounding.left,
		height: bounding.bottom - bounding.top
	};
};