/**
 * Main client entrypoint for CollabFS
 * Called by bin/cli.js with a mode: "start" | "join"
 */

const path = require("path");
const fs = require("fs");
const os = require("os");
const { logger } = require("./utils/logger");
const { connectSocket } = require("./socketClient");
const { watchFiles } = require("./fileWatcher");
const { handleRemoteChange } = require("./syncHandler");
const { onExit } = require("./cliHelpers");

// Keeps in-memory session state
let sessionState = {
  mode: null,
  sessionId: null,
  displayName: null,
  socket: null,
  watcher: null,
  baseDir: process.cwd(),
};

/**
 * Start a client in either "start" or "join" mode.
 * @param {string} mode - "start" | "join"
 * @param {object} opts - Options (sessionId?, name?)
 */
async function startClient(mode, opts = {}) {
  sessionState.mode = mode;
  sessionState.displayName =
    opts.name || process.env.DISPLAY_NAME || os.userInfo().username;

  logger.info(
    `[client] Starting in ${mode} mode as "${sessionState.displayName}"`
  );
  logger.info(`[client] Working directory: ${sessionState.baseDir}`);

  // 👇 pick server from opts, fallback to env or localhost
  const serverUrl =
    process.env.COLLAB_SERVER ||
    opts.server ||
    "https://collabfs-central-server.onrender.com";

  // connect to signaling server
  const socket = await connectSocket(serverUrl, sessionState.displayName);
  sessionState.socket = socket;

  if (mode === "start") {
    socket.emit("create-room", { name: sessionState.displayName }, (roomId) => {
      if (!roomId) {
        logger.error("[client] Failed to create room (no sessionId returned).");
        process.exit(1);
      }
      sessionState.sessionId = roomId;
      logger.info(`[client] Session created. Share this ID: ${roomId}`);

      sessionState.watcher = watchFiles(
        sessionState.baseDir,
        socket,
        sessionState.sessionId
      );
    });
  } else if (mode === "join") {
    if (!opts.sessionId) {
      throw new Error("Missing sessionId when joining");
    }
    sessionState.sessionId = opts.sessionId;

    socket.emit(
      "join-room",
      { sessionId: opts.sessionId, name: sessionState.displayName },
      (roomId) => {
        if (!roomId) {
          logger.error(`[client] Failed to join room: ${opts.sessionId}`);
          process.exit(1);
        }
        sessionState.sessionId = roomId;
        logger.info(`[client] Joined session ${opts.sessionId}`);

        sessionState.watcher = watchFiles(
          sessionState.baseDir,
          socket,
          sessionState.sessionId
        );
      }
    );
  }

  // listen for initial snapshot
  socket.on("sync-snapshot", async ({ files }) => {
    logger.info(`[sync] Received initial snapshot with ${files.length} files`);
    for (const file of files) {
      const localPath = path.join(sessionState.baseDir, file.path);
      await fs.promises.mkdir(path.dirname(localPath), { recursive: true });

      if (file.type === "delete") {
        try {
          await fs.promises.unlink(localPath);
        } catch {}
      } else {
        await fs.promises.writeFile(
          localPath,
          Buffer.from(file.content, "base64")
        );
      }
    }
    logger.info("[sync] Snapshot applied. Now live sync begins.");
  });

  socket.on("file-change", async (data) => {
    try {
      await handleRemoteChange(data, sessionState.baseDir);
    } catch (err) {
      logger.error(`[sync] Failed to apply remote change: ${err.message}`);
    }
  });

  onExit(async () => {
    if (sessionState.watcher) {
      await sessionState.watcher.close();
    }
    if (sessionState.socket) {
      sessionState.socket.disconnect(true);
    }
    logger.info("[client] Disconnected cleanly.");
  });
}

module.exports = { startClient, sessionState };
