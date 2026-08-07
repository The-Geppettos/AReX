import container from "@src/container";

const main = async () => {
  // Basic health check endpoint
  container.httpServer.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  const gracefulShutdown = async (signal?: NodeJS.Signals) => {
    if (signal) {
      console.info(`Received ${signal}, shutting down server...`);
    } else {
      console.info("Shutting down server...");
    }

    await container.httpServer.close();
    if (container.messageBroker) await container.messageBroker.close();
    await container.langGraphCheckpointer.end();
    await container.coreDb.close();
    await container.vectorDb.close();

    console.info("All components closed successfully");
    process.exit(0);
  };

  process.on("SIGINT", gracefulShutdown);
  process.on("SIGTERM", gracefulShutdown);
  process.on("uncaughtException", (error) => {
    console.error("Uncaught Exception:", error);
    gracefulShutdown();
  });

  console.info("Initializing components...");

  await container.coreDb.initialize();
  await container.langGraphCheckpointer.setup();
  await container.vectorDb.initialize();
  if (container.messageBroker) await container.messageBroker.initialize();
  await container.httpServer.initialize();

  console.info("All components initialized successfully");
};

main();
