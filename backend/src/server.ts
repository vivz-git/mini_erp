import { app } from "./app";
import { prisma } from "./config/db";

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 5000;

const server = app.listen(PORT, () => {
  console.log(`=========================================`);
  console.log(` MiniERP Backend API listening on port ${PORT}`);
  console.log(` Health check available at: http://localhost:${PORT}/api/health`);
  console.log(`=========================================`);
});

// Graceful shutdown handling
async function handleShutdown(signal: string) {
  console.log(`Received ${signal}. Shutting down gracefully...`);
  server.close(async () => {
    await prisma.$disconnect();
    console.log("Database disconnected. Process terminated.");
    process.exit(0);
  });
}

process.on("SIGINT", () => handleShutdown("SIGINT"));
process.on("SIGTERM", () => handleShutdown("SIGTERM"));
