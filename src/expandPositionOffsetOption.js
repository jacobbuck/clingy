const positionKeywordMultipliers = {
  left: 0,
  top: 0,
  right: 1,
  bottom: 1,
  center: 0.5,
  middle: 0.5
};

const percentMultiplier = 0.01;

const expandOffsetRexExp = /^([a-z]+|[0-9]+%)([+-][0-9]+)?$/;

const expandPositionOffsetOption = val => {
  const matches = expandOffsetRexExp.exec(val.trim());
  let position;
  let offset;

  if (positionKeywordMultipliers.hasOwnProperty(matches[1])) {
    position = positionKeywordMultipliers[matches[1]];
  } else {
    position = parseInt(matches[1]) * percentMultiplier;
  }

  if (matches[2]) {
    offset = parseInt(matches[2]);
  }

  offset = offset || 0;

  return { position, offset };
};

export default expandPositionOffsetOption;
