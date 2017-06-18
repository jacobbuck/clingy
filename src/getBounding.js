import isWindow from "is-window";

const getBounding = el => {
  if (isWindow(el)) {
    return {
      left: el.pageXOffset,
      top: el.pageYOffset,
      width: el.innerWidth,
      height: el.innerHeight
    };
  }

  const bounding = el.getBoundingClientRect();
  return {
    left: bounding.left,
    top: bounding.top,
    width: bounding.right - bounding.left,
    height: bounding.bottom - bounding.top
  };
};

export default getBounding;
