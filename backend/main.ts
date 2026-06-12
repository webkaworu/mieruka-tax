import { Hono } from "hono";
import { cors } from "hono/cors";
import taxRoutes from "./src/http/tax_routes.ts";

const app = new Hono();

// CORSミドルウェアの適用
app.use(
  "*",
  cors({
    origin: ["http://tax-mieruka.sample.com", "http://localhost:3000"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
    credentials: true,
  })
);

// 健康診断エンドポイント
app.get("/health", (c) => {
  return c.json({ status: "ok" });
});

// APIルートの統合
const routes = app.route("/api", taxRoutes);

// フロントエンドのRPC用型定義
export type AppType = typeof routes;

Deno.serve({ port: 8000 }, app.fetch);

