const fs = require("fs");
const path = require("path");
const { logger } = require("./utils/logger");
const { markIgnore } = require("./fileWatcher");

const IGNORE_PATTERNS = [
  /node_modules/,
  /\.git/,
  /^dist/,
  /^build/,
  /^\.cache/,
];
function shouldIgnore(filePath) {
  return IGNORE_PATTERNS.some((p) => p.test(filePath));
}

async function handleRemoteChange(data, baseDir) {
  const targetPath = path.join(baseDir, data.path);

  // Ignore unwanted files/folders
  if (shouldIgnore(data.path)) {
    logger.info(`[sync] Ignored remote change for ${data.path}`);
    return;
  }

  try {
    switch (data.type) {
      case "add":
      case "change":
        fs.mkdirSync(path.dirname(targetPath), { recursive: true });
        markIgnore(targetPath);

        // Safe handling of null content
        if (data.content !== null && data.content !== undefined) {
          // Only write buffer if content exists
          if (data.encoding === "base64") {
            fs.writeFileSync(targetPath, Buffer.from(data.content, "base64"));
          } else {
            fs.writeFileSync(targetPath, data.content, "utf8");
          }
        } else {
          // content null => empty file, create empty
          fs.writeFileSync(targetPath, "");
        }

        logger.info(`[sync] Applied ${data.type} on ${data.path}`);
        break;

      case "unlink":
        if (fs.existsSync(targetPath)) {
          markIgnore(targetPath);
          fs.unlinkSync(targetPath);
          logger.info(`[sync] Deleted ${data.path}`);
        }
        break;

      case "addDir":
        // Always create folder even if empty
        fs.mkdirSync(targetPath, { recursive: true });
        logger.info(`[sync] Created folder ${data.path}`);
        break;

      case "unlinkDir":
        if (fs.existsSync(targetPath)) {
          fs.rmdirSync(targetPath, { recursive: true });
          logger.info(`[sync] Deleted folder ${data.path}`);
        }
        break;

      default:
        logger.warn(`[sync] Unknown change type: ${data.type}`);
    }
  } catch (err) {
    logger.error(
      `[sync] Error applying change to ${data.path}: ${err.message}`
    );
  }
}

module.exports = { handleRemoteChange };
