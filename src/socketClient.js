/**
 * socketClient.js
 * Handles Socket.IO client connection
 */
const { io } = require("socket.io-client");
const { logger } = require("./utils/logger");
const config = require("../collab.config");

function connectSocket(serverUrl, displayName) {
  return new Promise((resolve, reject) => {
    const url = serverUrl || config.serverUrl || "http://localhost:4000";

    const socket = io(url, {
      auth: { name: displayName },
      reconnectionAttempts: 5,
      transports: ["websocket"],
    });

    socket.on("connect", () => {
      logger.info(`[socket] Connected to ${url} as ${displayName}`);
      resolve(socket);
    });

    socket.on("connect_error", (err) => {
      logger.error(`[socket] Connection failed: ${err.message}`);
      reject(err);
    });

    socket.on("disconnect", (reason) => {
      logger.warn(`[socket] Disconnected: ${reason}`);
    });
  });
}

module.exports = { connectSocket };
