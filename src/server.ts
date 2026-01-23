import { config } from "dotenv";
import app from "./app.js";
import { env } from "./config/env.js";
import { taskGenerationWorker } from "./workers/task-generation.worker.js";

config();

const PORT = env.app.PORT || 3000;

// Start the worker
taskGenerationWorker.on('ready', () => {
  console.log('✅ Task Generation Worker is ready.');
});

taskGenerationWorker.on('error', (err) => {
  console.error('❌ Task Generation Worker encountered an error:', err);
});

process.on('SIGINT', async () => {
  await taskGenerationWorker.close();
  console.log('Task Generation Worker closed.');
  process.exit(0);
});

const server = app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});

server.on("error", (err: NodeJS.ErrnoException) => {
  if (err.code === "EADDRINUSE") {
    console.error(`❌ Port ${PORT} already in use. Trying next port...`);
    setTimeout(() => {
      server.close();
      app.listen(PORT + 1, () => {
        console.log(`✅ Server running on http://localhost:${PORT + 1}`);
      });
    }, 1000);
  } else {
    console.error(err);
  }
});