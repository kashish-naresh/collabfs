/**
 * socketHandlers.js
 */
const { v4: uuidv4 } = require("uuid");
const rooms = new Map(); // sessionId -> { members: Set<socket.id>, files: Map }

function registerHandlers(io, socket) {
  // create a room
  socket.on("create-room", ({ name }, callback) => {
    const sessionId = uuidv4();
    rooms.set(sessionId, { members: new Set([socket.id]), files: new Map() });

    socket.join(sessionId);
    socket.data = { name, sessionId };

    console.log(`[server] Room created ${sessionId} by ${name}`);
    callback(sessionId); // <-- important! sends back to client
  });

  // join a room
  socket.on("join-room", ({ sessionId, name }, callback) => {
    if (!rooms.has(sessionId)) {
      return callback(null); // invalid room
    }
    const room = rooms.get(sessionId);
    room.members.add(socket.id);

    socket.join(sessionId);
    socket.data = { name, sessionId };

    console.log(`[server] ${name} joined ${sessionId}`);
    callback(sessionId);
  });

  // file change from client
  socket.on("file-change", ({ sessionId, type, path, content }) => {
    if (!rooms.has(sessionId)) return;
    socket.to(sessionId).emit("file-change", { type, path, content });
  });

  // handle disconnect
  socket.on("disconnect", () => {
    const { sessionId, name } = socket.data || {};
    if (!sessionId || !rooms.has(sessionId)) return;
    const room = rooms.get(sessionId);
    room.members.delete(socket.id);
    console.log(`[server] ${name || socket.id} disconnected from ${sessionId}`);
  });
}

module.exports = { registerHandlers };
