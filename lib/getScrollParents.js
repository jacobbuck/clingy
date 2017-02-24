'use strict';

var getComputedStyleValue = require('./getComputedStyleValue');

var AUTO_OR_SCROLL_REGEXP = /auto|scroll/;

module.exports = function getScrollParents(el) {
  var scrollParents = [];
  while (el.parentNode && Node.ELEMENT_NODE === el.parentNode.nodeType) {
    el = el.parentNode;
    if (AUTO_OR_SCROLL_REGEXP.test(''.concat(
      getComputedStyleValue(el, 'overflow'),
      getComputedStyleValue(el, 'overflow-x'),
      getComputedStyleValue(el, 'overflow-y')
    ).toLowerCase())) {
      scrollParents.push(el);
    }
  }
  return scrollParents;
};
