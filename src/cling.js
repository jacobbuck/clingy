import getStyleProperty from "desandro-get-style-property";
import clamp from "lodash/clamp";
import throttle from "lodash/throttle";
import getBounding from "./getBounding";
import getComputedStyleValue from "./getComputedStyleValue";
import getScrollParents from "./getScrollParents";
import expandPositionOffsetOption from "./expandPositionOffsetOption";
import splitOption from "./splitOption";

const transformProp = getStyleProperty("transform");

const defaultOptions = {
  collision: ["none", "none"],
  delay: 100,
  from: ["center", "center"],
  gpu: true,
  listen: true,
  onBeforeDestroy: () => {},
  onBeforePosition: () => {},
  onDestroy: () => {},
  onPosition: () => {},
  to: ["center", "center"],
  window: window,
  within: null
};

const windowUpdateEvents = ["load", "scroll", "resize", "touchmove"];

const cling = (fromEl, toEl, options) => {
  // Normalize options
  options = { ...defaultOptions, ...options };

  const fromOption = splitOption(options.from).map(expandPositionOffsetOption);
  const toOption = splitOption(options.to).map(expandPositionOffsetOption);
  const collisionOption = splitOption(options.collision);
  const useTransform = options.gpu && transformProp;

  // Get any scrollable parents of the toEl for listening to scroll events
  const scrollParents = getScrollParents(toEl);

  // Window to bind events to
  const window = options.window;

  // To prevent multiply destroys
  let destroyed = false;

  // Cached fromEl top and left position styles
  let fromElPositionCache = { left: 0, top: 0 };

  // Add `position: absolute;` style, unless already `position: fixed;`
  if (getComputedStyleValue(fromEl, "position") !== "fixed") {
    fromEl.style.position = "absolute";
  }

  // Apply initial positioning styles
  fromEl.style.left = "0px";
  fromEl.style.top = "0px";
  fromEl.style.right = "auto";
  fromEl.style.bottom = "auto";
  fromEl.style.transform = "";

  const destroy = () => {
    // Destroy can only happen once
    if (destroyed) return;
    destroyed = true;

    options.onBeforeDestroy();

    // Cancel any queued positionings
    throttledPosition.cancel();

    // Reset styles
    fromEl.style.position = "";
    fromEl.style.left = "";
    fromEl.style.top = "";
    fromEl.style.right = "";
    fromEl.style.bottom = "";
    fromEl.style.transform = "";

    if (options.listen) {
      // Unbind events
      windowUpdateEvents.forEach(eventName =>
        window.removeEventListener(eventName, position, false)
      );

      window.removeEventListener("unload", destroy, false);

      if (scrollParents.length) {
        scrollParents.forEach(el =>
          el.removeEventListener("scroll", position, false)
        );
      }
    }

    options.onDestroy();
  };

  const position = () => {
    if (destroyed) return;

    options.onBeforePosition();

    const fromElBounds = getBounding(fromEl);
    const toElBounds = getBounding(toEl);
    let offsetParent;
    let offsetElBounds;
    let withinBounds;

    if (options.within) {
      offsetParent = fromEl.offsetParent;
      if (offsetParent) {
        offsetElBounds = getBounding(offsetParent);
      }
      withinBounds = getBounding(options.within);
    }

    const newPositions = [
      { axis: "left", size: "width" },
      { axis: "top", size: "height" }
    ].reduce((newPositions, o, i) => {
      const axis = o.axis;
      const size = o.size;

      /**
       * Dat Math
       * 1. Add the toEl point
       * 2. Subtract the fromEl point
       * 3. Add the difference between the toEl and fromEl's current position
       * 4. Add our offset
       * 5. Add the current left/top style
       */
      let newPosition =
        toElBounds[size] * toOption[i].position - // 1
        fromElBounds[size] * fromOption[i].position + // 2
        (toElBounds[axis] - fromElBounds[axis]) + // 3
        fromOption[i].offset +
        toOption[i].offset + // 4
        fromElPositionCache[axis]; // 5

      // Optionally fit inside within element
      if (withinBounds && collisionOption[i] === "fit") {
        const withinOffset = offsetElBounds ? offsetElBounds[axis] : 0;
        const withinMin = withinBounds[axis] - withinOffset;
        const withinMax = withinMin + withinBounds[size] - fromElBounds[size];
        newPosition = clamp(newPosition, withinMin, withinMax);
      }

      // Round the values to prevent sub-pixel issues.
      newPositions[axis] = Math.round(newPosition);

      return newPositions;
    }, {});

    // Only apply the positions if changed
    if (
      newPositions.left !== fromElPositionCache.left ||
      newPositions.top !== fromElPositionCache.top
    ) {
      if (useTransform) {
        fromEl.style[
          transformProp
        ] = `translateX(${position.left}px) translateY(${position.top}px) translateZ(0)`;
      } else {
        fromEl.style.left = `${position.left}px`;
        fromEl.style.top = `${position.top}px`;
      }

      options.onPosition(position);

      // Cache the newly calculated position.
      fromElPositionCache = newPositions;
    }
  };

  const throttledPosition = throttle(position, options.delay);

  if (options.listen) {
    // Listen to load, scroll or resize on window
    windowUpdateEvents.forEach(eventName =>
      window.addEventListener(eventName, throttledPosition, false)
    );

    // Automatically destroy on window unload
    window.addEventListener("unload", destroy, false);

    // Listen to scroll on scrollable parents
    if (scrollParents.length) {
      scrollParents.forEach(el =>
        el.addEventListener("scroll", throttledPosition, false)
      );
    }
  }

  // Initial positioning
  position();

  return {
    destroy,
    forceUpdate: position,
    isDestroyed: () => destroyed
  };
};

export default cling;
