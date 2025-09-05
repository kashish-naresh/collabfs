module.exports = {
  serverUrl: process.env.SERVER_URL || "http://localhost:4000",
  ignoreFile: process.env.IGNORE_FILE || ".gitignore",
  dotStateDir: ".collabfs",
  writeDebounceMs: 25,
};
