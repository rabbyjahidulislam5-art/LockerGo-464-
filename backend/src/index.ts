import app from "./app";
import { logger } from "./lib/logger";
import { createServer } from "http";
import { Server } from "socket.io";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

const httpServer = createServer(app);
export const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

io.on("connection", (socket) => {
  logger.info({ socketId: socket.id }, "Client connected to real-time sync");
  socket.on("disconnect", () => {
    logger.info({ socketId: socket.id }, "Client disconnected from real-time sync");
  });
});

httpServer.listen(port, () => {
  logger.info({ port }, "Server (with real-time) listening");
});
