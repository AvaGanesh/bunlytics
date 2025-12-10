import { serve } from "bun";
import { handleDatasets, handleDatasetUpload, handleGetSchema } from "./api/datasets";
import { handleQuery } from "./api/query";
import { handleDashboards, handleDashboardPanels, handleRunDashboard } from "./api/dashboards";
import { handleSignup, handleLogin, handleMe } from "./api/auth";

const PORT = 3000;

console.log(`Starting Bunlytics on http://localhost:${PORT}`);

serve({
  port: PORT,
  async fetch(req, server): Promise<Response> {
    const url = new URL(req.url);
    const method = req.method;
    const path = url.pathname;

    // API Routes
    if (path.startsWith("/api")) {
      try {
        // Auth routes (public)
        if (path === "/api/auth/signup" && method === "POST") {
          return handleSignup(req);
        }
        if (path === "/api/auth/login" && method === "POST") {
          return handleLogin(req);
        }
        if (path === "/api/auth/me" && method === "GET") {
          return handleMe(req);
        }

        // Datasets (protected)
        if (path === "/api/datasets") {
          if (method === "GET") return handleDatasets(req);
          if (method === "POST") return handleDatasetUpload(req);
        }
        if (path.match(/^\/api\/datasets\/[\w-]+\/schema$/)) {
           return handleGetSchema(req);
        }

        // Query
        if (path === "/api/query" && method === "POST") {
          return handleQuery(req);
        }

        // Dashboards
        if (path === "/api/dashboards") {
           return handleDashboards(req);
        }
        if (path.match(/^\/api\/dashboards\/[\w-]+\/panels$/)) {
           return handleDashboardPanels(req);
        }
        if (path.match(/^\/api\/dashboards\/[\w-]+\/run$/)) {
           return handleRunDashboard(req);
        }

        return new Response("Not Found", { status: 404 });
      } catch (error) {
        console.error("API Error:", error);
        return new Response(JSON.stringify({ error: String(error) }), { 
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
      }
    }

    // Static File Serving (Frontend)
    // For now, we'll just return a placeholder if not found, or serve from 'public' if we had it.
    // In a real build, we'd serve `frontend/dist`.
    // Let's try to serve from frontend/dist if it exists, otherwise a simple message.
    
    const filePath = `frontend/dist${path === "/" ? "/index.html" : path}`;
    const file = Bun.file(filePath);
    if (await file.exists()) {
        return new Response(file);
    }
    
    // Fallback for SPA routing (return index.html for non-api routes)
    const indexFile = Bun.file("frontend/dist/index.html");
    if (await indexFile.exists()) {
        return new Response(indexFile);
    }

    return new Response("Bunlytics Backend Running. Frontend not built yet.", { status: 200 });
  },
});
