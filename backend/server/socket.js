const jwt = require("jsonwebtoken");
const { Server } = require("socket.io");
const Message = require("./models/Message");
const { ensureFriends, normalizeMessage } = require("./routes/messageRoutes");
const { usingMongo } = require("./config/db");
const store = require("./data/jsonStore");

function initSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || "http://127.0.0.1:5173",
      credentials: true
    }
  });

  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) {
        return next(new Error("Authentication required"));
      }
      const payload = jwt.verify(token, process.env.JWT_SECRET || "dev-secret");
      socket.user = { id: payload.id };
      next();
    } catch (error) {
      next(new Error("Invalid session"));
    }
  });

  io.on("connection", (socket) => {
    socket.join(socket.user.id);

    socket.on("message:send", async (payload, callback) => {
      try {
        const receiver = String(payload?.receiver || "");
        const text = String(payload?.text || "").trim();

        if (!receiver || !text) {
          throw new Error("Receiver and message text are required");
        }
        if (!(await ensureFriends(socket.user.id, receiver))) {
          throw new Error("You can only message friends");
        }

        let normalized;
        if (usingMongo()) {
          const message = await Message.create({
            sender: socket.user.id,
            receiver,
            text
          });
          normalized = normalizeMessage(message);
        } else {
          const data = await store.readStore();
          const now = new Date().toISOString();
          const message = {
            id: store.createId(),
            sender: socket.user.id,
            receiver,
            text,
            readAt: null,
            createdAt: now
          };
          data.messages = data.messages || [];
          data.messages.push(message);
          await store.writeStore(data);
          normalized = message;
        }
        io.to(receiver).emit("message:new", normalized);
        socket.emit("message:new", normalized);
        if (callback) {
          callback({ ok: true, message: normalized });
        }
      } catch (error) {
        if (callback) {
          callback({ ok: false, message: error.message });
        }
      }
    });
  });

  return io;
}

module.exports = { initSocket };
