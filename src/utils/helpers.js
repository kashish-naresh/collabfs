const fs = require("fs");
const path = require("path");
const ignore = require("ignore");

function toPosix(p) {
  return p.split(path.sep).join("/");
}
function toNative(p) {
  return p.split("/").join(path.sep);
}

async function loadIgnoreMatcher(baseDir, ignoreFile) {
  const ig = ignore();
  const defaultIgnores = [".git/", ".collabfs/", "node_modules/"];
  ig.add(defaultIgnores.join("\n"));
  const fpath = path.join(baseDir, ignoreFile);
  if (fs.existsSync(fpath)) {
    try {
      ig.add(fs.readFileSync(fpath, "utf8"));
    } catch (e) {}
  }
  return (rel) => ig.ignores(rel);
}

function ensureParentDir(absPath) {
  const dir = path.dirname(absPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

module.exports = { toPosix, toNative, loadIgnoreMatcher, ensureParentDir };
