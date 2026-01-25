import { config } from "dotenv";
import app from "./app.js";
import { env } from "./config/env.js";
import { taskGenerationWorker } from "./workers/task-generation.worker.js";
import { createServer } from "http";
import { initSocket } from "./config/socket.js";

config();

const PORT = env.app.PORT || 3000;

// Start the worker
taskGenerationWorker.on('ready', () => {
  console.log('✅ Task Generation Worker is ready.');
});

taskGenerationWorker.on('error', (err) => {
  console.error('❌ Task Generation Worker encountered an error:', err);
});

const startServer = (port: number) => {
  const httpServer = createServer(app);

  // Initialize Socket.io
  initSocket(httpServer);

  httpServer.listen(port, () => {
    console.log(`✅ Server running on http://localhost:${port}`);
  });

  httpServer.on("error", (err: NodeJS.ErrnoException) => {
    if (err.code === "EADDRINUSE") {
      console.error(`❌ Port ${port} already in use. Trying port ${port + 1}...`);
      httpServer.close();
      startServer(port + 1);
    } else {
      console.error(err);
    }
  });

  return httpServer;
};

const server = startServer(PORT);

process.on('SIGINT', async () => {
  await taskGenerationWorker.close();
  server.close(() => {
    console.log('Server and Task Generation Worker closed.');
    process.exit(0);
  });
});