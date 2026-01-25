import { Server as SocketServer } from "socket.io";
import { Server as HttpServer } from "http";
import { logger } from "../lib/logger.js";

let io: SocketServer | null = null;

export const initSocket = (server: HttpServer) => {
    io = new SocketServer(server, {
        cors: {
            origin: "*", // Adjust in production
            methods: ["GET", "POST"]
        }
    });

    io.on("connection", (socket) => {
        logger.info("socket.connected", { socketId: socket.id });

        socket.on("join-task", (taskId: string) => {
            socket.join(`task:${taskId}`);
            logger.info("socket.joined-room", { taskId, socketId: socket.id });
        });

        socket.on("leave-task", (taskId: string) => {
            socket.leave(`task:${taskId}`);
            logger.info("socket.left-room", { taskId, socketId: socket.id });
        });

        socket.on("disconnect", () => {
            logger.info("socket.disconnected", { socketId: socket.id });
        });
    });

    return io;
};

export const getIO = (): SocketServer => {
    if (!io) {
        throw new Error("Socket.io not initialized");
    }
    return io;
};

export const emitTaskUpdate = (taskId: string, payload: { taskId: string; status: string; error?: string }) => {
    if (!io) return;
    io.to(`task:${taskId}`).emit("task:status-updated", payload);
    logger.info("socket.emitted", { event: "task:status-updated", taskId, status: payload.status });
};
