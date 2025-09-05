const colors = {
  reset: "\x1b[0m",
  gray: "\x1b[90m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
};
function fmt(color, s) {
  return color + s + colors.reset;
}

const logger = {
  info: (s) => console.log(fmt(colors.blue, s)),
  warn: (s) => console.log(fmt(colors.yellow, s)),
  error: (s) => console.error(fmt(colors.red, s)),
  success: (s) => console.log(fmt(colors.green, s)),
  debug: (s) => console.log(fmt(colors.gray, s)),
};

module.exports = { logger };
