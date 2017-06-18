const getComputedStyleValue = (el, prop) =>
  window.getComputedStyle(el, null).getPropertyValue(prop);

export default getComputedStyleValue;
