const whitespaceRegExp = /\s+/;

const splitOption = val =>
  typeof val === "string"
    ? val.split(whitespaceRegExp).filter(v => v.trim())
    : val;

export default splitOption;
