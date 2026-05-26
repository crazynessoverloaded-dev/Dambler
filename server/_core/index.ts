import "dotenv/config";
import path from "path";
import { fileURLToPath } from "url";
import express from "express";
import { createServer as createHttpServer } from "http";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { createContext } from "./context";
import { appRouter } from "../routers";
import { initDb } from "../db";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../..");

async function startServer() {
  await initDb();

  const app = express();
  const server = createHttpServer(app);

  app.use(express.json());

  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );

  if (process.env.NODE_ENV === "production") {
    const staticPath = path.resolve(ROOT, "dist/public");
    app.use(express.static(staticPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(staticPath, "index.html"));
    });
  } else {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      configFile: path.resolve(ROOT, "vite.config.ts"),
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  }

  const port = Number(process.env.PORT ?? 3000);
  server.listen(port, () => {
    console.log(`Server running → http://localhost:${port}`);
  });
}

startServer().catch(console.error);
