const chokidar = require("chokidar");
const fs = require("fs");
const path = require("path");
const { logger } = require("./utils/logger");

// --- Ignore map to avoid infinite sync loops ---
const ignoreSet = new Set();

function markIgnore(filePath) {
  ignoreSet.add(path.resolve(filePath));
  // Remove entry after a short delay (write completes)
  setTimeout(() => ignoreSet.delete(path.resolve(filePath)), 500);
}

function shouldIgnore(filePath) {
  return ignoreSet.has(path.resolve(filePath));
}

// --- Main watcher ---
function watchFiles(baseDir, socket, sessionId) {
  if (!sessionId) {
    throw new Error("Cannot start file watcher without sessionId");
  }

  logger.info(`[watcher] Watching folder: ${baseDir}`);

  const watcher = chokidar.watch(baseDir, {
    ignored: /(^|[\/\\])\..|(node_modules|build|dist)/,
    persistent: true,
    ignoreInitial: true,
    awaitWriteFinish: {
      stabilityThreshold: 300,
      pollInterval: 100,
    },
  });

  function isFolderEmpty(folderPath) {
    try {
      return (
        fs.existsSync(folderPath) && fs.readdirSync(folderPath).length === 0
      );
    } catch {
      return false;
    }
  }

  function emitChange(type, filePath, isDir = false) {
    if (shouldIgnore(filePath)) {
      logger.debug(`[watcher] Ignoring change: ${filePath}`);
      return;
    }

    const relPath = path.relative(baseDir, filePath);
    let content = null;
    let encoding = null;

    if (isDir) {
      // Only emit if directory is truly empty
      if (!isFolderEmpty(filePath)) return;
    } else if (type === "add" || type === "change") {
      try {
        const buffer = fs.readFileSync(filePath);
        if (/^[\x00-\x7F]*$/.test(buffer.toString("utf8"))) {
          content = buffer.toString("utf8");
          encoding = "utf8";
        } else {
          content = buffer.toString("base64");
          encoding = "base64";
        }
      } catch (e) {
        logger.error(`[watcher] Failed to read file ${filePath}: ${e.message}`);
      }
    }

    socket.emit("file-change", {
      sessionId,
      type: isDir ? "addDir" : type,
      path: relPath,
      content,
      encoding,
    });

    logger.info(
      `[watcher] Emitted ${isDir ? "Dir" : "File"} ${type}: ${relPath}`
    );
  }

  watcher
    .on("add", (filePath) => emitChange("add", filePath))
    .on("change", (filePath) => emitChange("change", filePath))
    .on("unlink", (filePath) => emitChange("unlink", filePath))
    .on("addDir", (dirPath) => emitChange("add", dirPath, true))
    .on("unlinkDir", (dirPath) => emitChange("unlink", dirPath, true));

  return watcher;
}

module.exports = { watchFiles, markIgnore, shouldIgnore };
