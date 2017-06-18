import getComputedStyleValue from "./getComputedStyleValue";

const autoOrScrollRegExp = /auto|scroll/i;

const getScrollParents = el => {
  const scrollParents = [];
  while (el.parentNode && Node.ELEMENT_NODE === el.parentNode.nodeType) {
    el = el.parentNode;
    if (
      autoOrScrollRegExp.test(getComputedStyleValue(el, "overflow")) ||
      autoOrScrollRegExp.test(getComputedStyleValue(el, "overflow-x")) ||
      autoOrScrollRegExp.test(getComputedStyleValue(el, "overflow-y"))
    ) {
      scrollParents.push(el);
    }
  }
  return scrollParents;
};

export default getScrollParents;
