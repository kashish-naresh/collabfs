const { logger } = require("./utils/logger");

function onExit(cleanup) {
  const handler = async (sig) => {
    logger.info(`[shutdown] received ${sig}. Cleaning up...`);
    try {
      await cleanup?.();
    } catch (e) {}
    process.exit(0);
  };
  process.on("SIGINT", handler);
  process.on("SIGTERM", handler);
}

function showUsageHint() {
  logger.info(
    'Tip: use `collab start -n "Name"` to create a session or `collab join <id>` to join one.'
  );
}

module.exports = { onExit, showUsageHint };
