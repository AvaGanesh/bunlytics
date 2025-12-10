import { db } from "../db";
import { ingestCSV } from "../ingest/csv";
import { mkdir } from "node:fs/promises";
import { requireAuth } from "../middleware";

export async function handleDatasets(req: Request) {
  try {
    const user = requireAuth(req);
    const datasets = db.query("SELECT * FROM datasets WHERE user_id = ? ORDER BY created_at DESC").all(user.userId);
    return new Response(JSON.stringify(datasets), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { "Content-Type": "application/json" } });
    }
    return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
}

export async function handleDatasetUpload(req: Request) {
  try {
    const user = requireAuth(req);
    const formData = await req.formData();
    const file = formData.get("file");
    const name = formData.get("name") as string;

    if (!file || !(file instanceof Blob)) {
      return new Response("No file uploaded", { status: 400 });
    }

    const datasetId = crypto.randomUUID();
    const tableName = `dataset_${datasetId.replace(/-/g, "")}`;
    const uploadDir = `data/${datasetId}`;
    await mkdir(uploadDir, { recursive: true });
    
    const fileName = (file as File).name;
    const filePath = `${uploadDir}/${fileName}`;
    await Bun.write(filePath, file);

    let rowCount = 0;
    try {
      if (fileName.endsWith(".csv")) {
        rowCount = await ingestCSV(filePath, datasetId, tableName);
      } else {
        // TODO: JSON support
        return new Response("Only CSV supported for now", { status: 400 });
      }
    } catch (e) {
      return new Response(`Ingestion failed: ${e}`, { status: 500 });
    }

    const now = new Date().toISOString();
    db.run(
      "INSERT INTO datasets (id, user_id, name, source_type, file_path, table_name, row_count, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [datasetId, user.userId, name || fileName, "upload", filePath, tableName, rowCount, now, now]
    );

    return new Response(JSON.stringify({ id: datasetId, name: name || fileName, row_count: rowCount }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { "Content-Type": "application/json" } });
    }
    return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
}

export async function handleGetSchema(req: Request) {
    try {
      const user = requireAuth(req);
      const url = new URL(req.url);
      const id = url.pathname.split("/")[3]; // /api/datasets/:id/schema
      
      const dataset = db.query("SELECT table_name FROM datasets WHERE id = ? AND user_id = ?").get(id, user.userId) as any;
      if (!dataset) return new Response("Dataset not found", { status: 404 });

      const tableInfo = db.query(`PRAGMA table_info("${dataset.table_name}")`).all();
      const columns = tableInfo.map((col: any) => ({ name: col.name, type: col.type }));

      return new Response(JSON.stringify({ columns }), {
          headers: { "Content-Type": "application/json" }
      });
    } catch (error: any) {
      if (error.message === "Unauthorized") {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { "Content-Type": "application/json" } });
      }
      return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500, headers: { "Content-Type": "application/json" } });
    }
}
